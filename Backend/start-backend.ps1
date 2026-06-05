$ErrorActionPreference = "Stop"

$env:PYTHONNOUSERSITE = "1"

& "$PSScriptRoot\venv313\Scripts\python.exe" -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
