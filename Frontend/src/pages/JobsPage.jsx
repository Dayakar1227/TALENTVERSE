import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, SlidersHorizontal, MapPin, IndianRupee, Briefcase, Star, Clock, Filter, CheckCircle, Loader2, X } from 'lucide-react';
import { applyToJob, createRecruiterJob, getJobs, joinAsRecruiter } from '../lib/api.js';

const categories = ['All', 'Photography', 'Video Edit', 'Story Writing', 'Direction', 'Branding'];
const postCategories = categories.filter((category) => category !== 'All');
const jobTypes = ['Full-time', 'Contract', 'Freelance', 'Internship'];
const emptyPostForm = {
  companyName: '',
  title: '',
  salary: '',
  location: '',
  minTrustScore: 50,
  type: 'Full-time',
  category: 'Photography',
  description: '',
  requirements: '',
};

export default function JobsPage({ user, onUserUpdate, accountMode, onAccountModeChange }) {
  const isRecruiter = user.accountRoles?.includes('RECRUITER') || user.role === 'RECRUITER';
  const isRecruiterMode = isRecruiter && accountMode === 'RECRUITER';
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [applyingJobId, setApplyingJobId] = useState(null);
  const [appliedJobs, setAppliedJobs] = useState(new Set());
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isPostingJob, setIsPostingJob] = useState(false);
  const [postForm, setPostForm] = useState(emptyPostForm);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError('');

    getJobs({ category: filter, search })
      .then((data) => {
        if (active) setJobs(data || []);
      })
      .catch((err) => {
        if (active) setError(err.message || 'Could not load jobs.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [filter, search]);

  const filteredJobs = useMemo(() => jobs, [jobs]);

  const handleApply = async (jobId) => {
    try {
      setError('');
      setApplyingJobId(jobId);
      await applyToJob(jobId);
      setAppliedJobs(prev => new Set([...prev, jobId]));
    } catch (err) {
      setError(err.message || 'Failed to apply. Please try again.');
    } finally {
      setApplyingJobId(null);
    }
  };

  const handlePostFormChange = (event) => {
    const { name, value } = event.target;
    setPostForm((current) => ({ ...current, [name]: value }));
  };

  const handlePostJob = async (event) => {
    event.preventDefault();

    try {
      setError('');
      setIsPostingJob(true);

      if (!isRecruiter) {
        const updatedUser = await joinAsRecruiter();
        onUserUpdate?.(updatedUser);
        onAccountModeChange?.('RECRUITER');
      }

      const postedJob = await createRecruiterJob({
        company_name: postForm.companyName.trim(),
        title: postForm.title.trim(),
        salary: postForm.salary.trim(),
        location: postForm.location.trim(),
        min_trust_score: Number(postForm.minTrustScore),
        type: postForm.type,
        category: postForm.category,
        description: postForm.description.trim() || null,
        requirements: postForm.requirements
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
      });

      setFilter('All');
      setSearch('');
      setJobs((current) => [postedJob, ...current.filter((job) => job.id !== postedJob.id)]);
      setPostForm(emptyPostForm);
      setIsPostModalOpen(false);
    } catch (err) {
      setError(err.message || 'Failed to post the job. Please try again.');
    } finally {
      setIsPostingJob(false);
    }
  };

  const handleRecruiterAction = () => {
    if (isRecruiter && !isRecruiterMode) {
      onAccountModeChange?.('RECRUITER');
      return;
    }
    setIsPostModalOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold font-display text-slate-900 mb-2">Premium Indian Gigs</h1>
          <p className="text-slate-500">Find opportunities in Bollywood, Tollywood, and top Indian agencies.</p>
        </div>
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text" placeholder="Search roles or agencies..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl soft-shadow focus:ring-2 focus:ring-violet-500/20 outline-none transition-all"
            />
          </div>
          <button className="p-3 bg-white border border-slate-200 rounded-2xl soft-shadow text-slate-500 hover:text-violet-600 transition-colors">
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-600">
          {error}
        </div>
      )}

      {isRecruiter && (
        <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 soft-shadow md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold text-slate-900">
              {isRecruiterMode ? 'Recruiter mode active' : 'Job seeker mode active'}
            </p>
            <p className="text-xs text-slate-500">
              {isRecruiterMode
                ? 'You can post jobs now. Switch back anytime to focus on applying for roles.'
                : 'You can browse and apply normally. Switch to recruiter mode when you want to post a job.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onAccountModeChange?.(isRecruiterMode ? 'JOB_SEEKER' : 'RECRUITER')}
            className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800"
          >
            {isRecruiterMode ? 'Switch to Job Seeker' : 'Switch to Recruiter'}
          </button>
        </div>
      )}

      {/* Filter chips */}
      <div className="flex items-center space-x-3 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat} onClick={() => setFilter(cat)}
            className={`px-6 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all ${filter === cat ? 'bg-violet-600 text-white soft-shadow scale-105' : 'bg-white text-slate-500 border border-slate-100 hover:border-slate-300'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Jobs grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isLoading ? (
          <div className="lg:col-span-2 flex items-center justify-center gap-3 rounded-[32px] bg-white p-10 text-slate-500 soft-shadow">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading jobs...
          </div>
        ) : filteredJobs.length > 0 ? filteredJobs.map((job) => (
          <div key={job.id} className="group bg-white p-6 rounded-[32px] soft-shadow border border-slate-50 hover:border-violet-100 transition-all">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-violet-50 group-hover:text-violet-600 transition-colors">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 group-hover:text-violet-600 transition-colors">{job.title}</h3>
                  <Link to={`/company/${job.companyId}`} className="text-sm text-slate-500 hover:text-violet-600 hover:underline transition-colors">
                    {job.company}
                  </Link>
                </div>
              </div>
              {user.trustScore >= job.minTrustScore ? (
                <div className="flex flex-col items-end">
                  <div className="bg-teal-50 text-teal-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center space-x-1">
                    <CheckCircle className="w-3 h-3" /><span>Verified</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium">Req. {job.minTrustScore}+</p>
                </div>
              ) : (
                <div className="bg-slate-50 text-slate-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1">
                  <Star className="w-3 h-3" /><span>Boost Score</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="flex items-center space-x-2 text-slate-500"><MapPin className="w-4 h-4" /><span className="text-xs">{job.location}</span></div>
              <div className="flex items-center space-x-2 text-slate-500"><IndianRupee className="w-4 h-4" /><span className="text-xs font-medium text-slate-900">{job.salary}</span></div>
              <div className="flex items-center space-x-2 text-slate-500"><Clock className="w-4 h-4" /><span className="text-xs">{job.type}</span></div>
              <div className="flex items-center space-x-2 text-slate-500"><Filter className="w-4 h-4" /><span className="text-xs">{job.category}</span></div>
            </div>

            <div className="flex items-center space-x-3">
              <button 
                onClick={() => handleApply(job.id)}
                disabled={appliedJobs.has(job.id) || applyingJobId === job.id}
                className={`flex-1 py-3 rounded-2xl font-bold soft-shadow transition-all flex items-center justify-center gap-2 ${
                  appliedJobs.has(job.id) 
                    ? 'bg-teal-50 text-teal-600 cursor-default' 
                    : applyingJobId === job.id
                    ? 'bg-violet-600 text-white opacity-75'
                    : 'bg-violet-600 text-white hover:bg-violet-700'
                }`}
              >
                {applyingJobId === job.id && <Loader2 className="w-4 h-4 animate-spin" />}
                {appliedJobs.has(job.id) ? 'Applied' : 'Apply with TrustScore'}
              </button>
              <button className="p-3 bg-slate-50 text-slate-500 rounded-2xl hover:bg-slate-100 transition-colors">
                <Star className="w-5 h-5" />
              </button>
            </div>
          </div>
        )) : (
          <div className="lg:col-span-2 py-20 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-6">
              <Search className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">No matching Indian roles found</h3>
            <p className="text-slate-500">Try a different city, role, or category.</p>
          </div>
        )}
      </div>

      {/* CTA Banner */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-700 rounded-[40px] p-8 md:p-12 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl text-center md:text-left">
            <h2 className="text-3xl font-bold font-display mb-4">Hiring for a Production House?</h2>
            <p className="text-violet-100 text-lg">Hire from India's most talented and verified creative community.</p>
          </div>
          <button
            onClick={handleRecruiterAction}
            className="flex items-center justify-center gap-2 bg-white text-violet-600 px-10 py-4 rounded-full font-bold soft-shadow hover:scale-105 transition-all"
          >
            {isRecruiter ? (isRecruiterMode ? 'Post a Job' : 'Switch to Recruiter Mode') : 'Join as Recruiter'}
          </button>
        </div>
      </div>

      {isPostModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <form onSubmit={handlePostJob} className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[28px] bg-white p-6 soft-shadow">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-bold text-slate-900">Post a Recruiter Job</h2>
                <p className="mt-1 text-sm text-slate-500">Add the company and role details candidates will see in jobs.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsPostModalOpen(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close post job form"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-xs font-bold uppercase text-slate-400">Company Name</span>
                <input name="companyName" value={postForm.companyName} onChange={handlePostFormChange} required minLength={2} className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 outline-none focus:border-violet-500" placeholder="Production house or agency" />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-bold uppercase text-slate-400">Role</span>
                <input name="title" value={postForm.title} onChange={handlePostFormChange} required minLength={3} className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 outline-none focus:border-violet-500" placeholder="Senior Video Editor" />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-bold uppercase text-slate-400">Salary</span>
                <input name="salary" value={postForm.salary} onChange={handlePostFormChange} required className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 outline-none focus:border-violet-500" placeholder="₹50,000 - ₹80,000 / month" />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-bold uppercase text-slate-400">Location</span>
                <input name="location" value={postForm.location} onChange={handlePostFormChange} required className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 outline-none focus:border-violet-500" placeholder="Hyderabad, India" />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-bold uppercase text-slate-400">Job Type</span>
                <select name="type" value={postForm.type} onChange={handlePostFormChange} className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 outline-none focus:border-violet-500">
                  {jobTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-xs font-bold uppercase text-slate-400">Category</span>
                <select name="category" value={postForm.category} onChange={handlePostFormChange} className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 outline-none focus:border-violet-500">
                  {postCategories.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
              </label>
              <label className="space-y-2 md:col-span-2">
                <span className="text-xs font-bold uppercase text-slate-400">Minimum Trust Score: {postForm.minTrustScore}</span>
                <input name="minTrustScore" type="range" min="0" max="100" value={postForm.minTrustScore} onChange={handlePostFormChange} className="w-full accent-violet-600" />
              </label>
              <label className="space-y-2 md:col-span-2">
                <span className="text-xs font-bold uppercase text-slate-400">Description</span>
                <textarea name="description" value={postForm.description} onChange={handlePostFormChange} rows={4} className="w-full resize-none rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 outline-none focus:border-violet-500" placeholder="Describe the project, responsibilities, and team." />
              </label>
              <label className="space-y-2 md:col-span-2">
                <span className="text-xs font-bold uppercase text-slate-400">Requirements</span>
                <input name="requirements" value={postForm.requirements} onChange={handlePostFormChange} className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 outline-none focus:border-violet-500" placeholder="Premiere Pro, 2+ years, Telugu content experience" />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setIsPostModalOpen(false)} className="rounded-2xl px-5 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50">Cancel</button>
              <button type="submit" disabled={isPostingJob} className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-6 py-3 text-sm font-bold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-70">
                {isPostingJob && <Loader2 className="h-4 w-4 animate-spin" />}
                Post Job
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
