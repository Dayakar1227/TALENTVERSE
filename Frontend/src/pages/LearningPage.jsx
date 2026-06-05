import React, { useMemo, useState } from 'react';
import { BookOpen, CheckCircle2, Clock, Filter, PlayCircle, Star } from 'lucide-react';
import { getRecommendedCourses, getUserLearningRoles, udemyUrl } from '../lib/learning.js';

export default function LearningPage({ user }) {
  const [level, setLevel] = useState('All');
  const userRoles = useMemo(
    () => getUserLearningRoles(user),
    [user],
  );

  const courses = useMemo(() => {
    const matched = getRecommendedCourses(user);
    return matched.filter((course) => level === 'All' || course.level === level);
  }, [level, user]);

  const coveredTopics = courses.reduce((total, course) => total + course.coveredTopics, 0);
  const totalTopics = courses.reduce((total, course) => total + course.totalTopics, 0);
  const overallProgress = totalTopics ? Math.round((coveredTopics / totalTopics) * 100) : 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand-600 dark:bg-brand-950/40 dark:text-brand-300">
            <BookOpen className="h-4 w-4" />
            Role-based learning
          </div>
          <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">Learning</h1>
          <p className="mt-2 max-w-2xl text-slate-500 dark:text-slate-400">
            Courses are recommended from your roles and interested roles: {userRoles.length ? userRoles.join(', ') : 'complete your profile to improve matches'}.
          </p>
          <p className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-200">
            {coveredTopics} of {totalTopics} topics covered across your recommended Udemy learning ({overallProgress}%).
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-white p-2 soft-shadow dark:bg-slate-900">
          <Filter className="ml-2 h-4 w-4 text-slate-400" />
          {['All', 'Beginner', 'Intermediate', 'Advanced'].map((item) => (
            <button key={item} onClick={() => setLevel(item)} className={`rounded-xl px-4 py-2 text-sm font-bold ${level === item ? 'bg-brand-600 text-white' : 'text-slate-500 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'}`}>
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {courses.map((course) => (
          <article key={course.title} className="rounded-[28px] border border-slate-100 bg-white p-6 soft-shadow dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-300">
              <PlayCircle className="h-7 w-7" />
            </div>
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">{course.title}</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {course.roles.slice(0, 3).map((role) => (
                <span key={role} className="rounded-full bg-slate-50 px-3 py-1 text-xs font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-300">{role}</span>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1"><Clock className="h-4 w-4" />{course.duration}</span>
              <span className="inline-flex items-center gap-1"><Star className="h-4 w-4 fill-amber-400 text-amber-400" />{course.rating}</span>
            </div>
            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                <span>{course.coveredTopics}/{course.totalTopics} topics covered</span>
                <span>{course.progress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div className="h-full rounded-full bg-brand-600" style={{ width: `${course.progress}%` }} />
              </div>
            </div>
            <a
              href={udemyUrl(course, userRoles)}
              target="_blank"
              rel="noreferrer"
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-brand-600 dark:bg-white dark:text-slate-900 dark:hover:bg-brand-200"
            >
              <CheckCircle2 className="h-4 w-4" />
              {course.progress ? 'Continue on Udemy' : 'Start Course'}
            </a>
          </article>
        ))}
      </div>
    </div>
  );
}
