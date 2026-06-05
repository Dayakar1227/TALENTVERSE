from __future__ import annotations

import copy
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from types import SimpleNamespace
from typing import Any

from bson import ObjectId


def _json_default(value: Any):
    if isinstance(value, ObjectId):
        return {"$oid": str(value)}
    if isinstance(value, datetime):
        return {"$date": value.isoformat()}
    raise TypeError(f"Object of type {type(value).__name__} is not JSON serializable")


def _json_hook(value: dict):
    if "$oid" in value:
        return ObjectId(value["$oid"])
    if "$date" in value:
        return datetime.fromisoformat(value["$date"])
    return value


def _get_field(doc: dict, key: str):
    value = doc
    for part in key.split("."):
        if not isinstance(value, dict):
            return None
        value = value.get(part)
    return value


def _matches_value(actual: Any, expected: Any) -> bool:
    if isinstance(expected, dict):
        for op, value in expected.items():
            if op == "$ne" and actual == value:
                return False
            if op == "$in" and actual not in value:
                return False
            if op == "$regex":
                flags = re.I if expected.get("$options") == "i" else 0
                values = actual if isinstance(actual, list) else [actual]
                if not any(isinstance(item, str) and re.search(value, item, flags) for item in values):
                    return False
        return True
    return actual == expected


def _matches(doc: dict, query: dict | None) -> bool:
    if not query:
        return True
    for key, expected in query.items():
        if key == "$and":
            if not all(_matches(doc, part) for part in expected):
                return False
        elif key == "$or":
            if not any(_matches(doc, part) for part in expected):
                return False
        elif not _matches_value(_get_field(doc, key), expected):
            return False
    return True


class LocalCursor:
    def __init__(self, docs: list[dict]):
        self._docs = [copy.deepcopy(doc) for doc in docs]

    def sort(self, key: str, direction: int = 1):
        self._docs.sort(key=lambda doc: _get_field(doc, key) or datetime.min.replace(tzinfo=timezone.utc), reverse=direction < 0)
        return self

    def skip(self, count: int):
        self._docs = self._docs[count:]
        return self

    def limit(self, count: int):
        self._docs = self._docs[:count]
        return self

    async def to_list(self, length: int | None = None):
        return copy.deepcopy(self._docs if length is None else self._docs[:length])


class LocalCollection:
    def __init__(self, database: "LocalDatabase", name: str):
        self._database = database
        self._name = name
        self._database._data.setdefault(name, [])

    @property
    def _docs(self) -> list[dict]:
        return self._database._data[self._name]

    async def create_index(self, *args, **kwargs):
        return kwargs.get("name") or str(args[0] if args else "index")

    def list_indexes(self):
        class EmptyIndexes:
            def __aiter__(self):
                return self

            async def __anext__(self):
                raise StopAsyncIteration

        return EmptyIndexes()

    async def drop_index(self, name: str):
        return None

    async def find_one(self, query: dict | None = None, sort: list[tuple[str, int]] | None = None):
        docs = [doc for doc in self._docs if _matches(doc, query)]
        if sort:
            for key, direction in reversed(sort):
                docs.sort(key=lambda doc: _get_field(doc, key) or datetime.min.replace(tzinfo=timezone.utc), reverse=direction < 0)
        return copy.deepcopy(docs[0]) if docs else None

    def find(self, query: dict | None = None):
        return LocalCursor([doc for doc in self._docs if _matches(doc, query)])

    async def count_documents(self, query: dict | None = None):
        return sum(1 for doc in self._docs if _matches(doc, query))

    async def insert_one(self, doc: dict):
        new_doc = copy.deepcopy(doc)
        new_doc.setdefault("_id", ObjectId())
        self._docs.append(new_doc)
        self._database._save()
        return SimpleNamespace(inserted_id=new_doc["_id"])

    async def update_one(self, query: dict, update: dict, upsert: bool = False):
        doc = next((item for item in self._docs if _matches(item, query)), None)
        if doc is None and upsert:
            doc = copy.deepcopy(query)
            doc.setdefault("_id", ObjectId())
            self._docs.append(doc)
        if doc is None:
            return SimpleNamespace(matched_count=0, modified_count=0)

        for key, value in update.get("$set", {}).items():
            doc[key] = value
        for key, value in update.get("$inc", {}).items():
            doc[key] = doc.get(key, 0) + value
        for key, value in update.get("$addToSet", {}).items():
            values = value.get("$each", []) if isinstance(value, dict) and "$each" in value else [value]
            doc.setdefault(key, [])
            for item in values:
                if item not in doc[key]:
                    doc[key].append(item)
        self._database._save()
        return SimpleNamespace(matched_count=1, modified_count=1)

    async def delete_one(self, query: dict):
        for index, doc in enumerate(self._docs):
            if _matches(doc, query):
                self._docs.pop(index)
                self._database._save()
                return SimpleNamespace(deleted_count=1)
        return SimpleNamespace(deleted_count=0)

    def aggregate(self, pipeline: list[dict]):
        if self._name != "portfolio":
            return LocalCursor([])
        match = next((stage.get("$match") for stage in pipeline if "$match" in stage), {})
        totals: dict[int, int] = {}
        for doc in self._docs:
            if not _matches(doc, match):
                continue
            created_at = doc.get("created_at")
            if not isinstance(created_at, datetime):
                continue
            mongo_day = (created_at.isoweekday() % 7) + 1
            totals[mongo_day] = totals.get(mongo_day, 0) + int(doc.get("views", 0))
        return LocalCursor([{"_id": day, "views": views} for day, views in sorted(totals.items())])


class LocalDatabase:
    is_local_fallback = True

    def __init__(self, path: Path):
        self._path = path
        self._data = self._load()

    def _load(self) -> dict[str, list[dict]]:
        if not self._path.exists():
            return {}
        return json.loads(self._path.read_text(encoding="utf-8"), object_hook=_json_hook)

    def _save(self) -> None:
        self._path.write_text(json.dumps(self._data, default=_json_default, indent=2), encoding="utf-8")

    def __getattr__(self, name: str) -> LocalCollection:
        collection = LocalCollection(self, name)
        setattr(self, name, collection)
        return collection
