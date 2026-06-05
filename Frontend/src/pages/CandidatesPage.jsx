import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BriefcaseBusiness, CheckCircle, Loader2, MapPin, Search, Send, ShieldCheck, Sparkles, Star, UserRound } from 'lucide-react';
import { discoverUsers, getJobs, resolveAssetUrl, sendFriendRequest } from '../lib/api.js';

function uniqueValues(values) {
  return [...new Set(values.filter(Boolean))];
}

function candidateScore(candidate, role, minTrustScore) {
  const text = [
    ...(candidate.roles || []),
    ...(candidate.interestedRoles || []),
    ...(candidate.skills || []),
  ].join(' ').toLowerCase();
  const roleScore = role && text.includes(role.toLowerCase()) ? 40 : 0;
  const trustScore = Math.min(candidate.trustScore || 0, 100) * 0.45;
  const verifiedScore = candidate.isVerified ? 15 : 0;
  const thresholdScore = (candidate.trustScore || 0) >= Number(minTrustScore || 0) ? 10 : -10;
  return Math.max(0, Math.round(roleScore + trustScore + verifiedScore + thresholdScore));
}

export default function CandidatesPage() {
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [role, setRole] = useState('');
  const [location, setLocation] = useState('');
  const [search, setSearch] = useState('');
  const [minTrustScore, setMinTrustScore] = useState(50);
  const [isLoading, setIsLoading] = useState(true);
  const [contactingId, setContactingId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadInitialData() {
      try {
        const [jobData, candidateData] = await Promise.all([
          getJobs(),
          discoverUsers(),
        ]);

        if (!active) return;
        setJobs(jobData || []);
        setCandidates(candidateData || []);
      } catch (err) {
        if (active) setError(err.message || 'Could not load candidates.');
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadInitialData();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const selectedJob = jobs.find((job) => job.id === selectedJobId);
    if (!selectedJob) return;

    setRole(selectedJob.category || selectedJob.title || '');
    setLocation(selectedJob.location || '');
    setMinTrustScore(selectedJob.minTrustScore || 0);
  }, [jobs, selectedJobId]);

  useEffect(() => {
    let active = true;

    async function loadCandidates() {
      try {
        const data = await discoverUsers({ search, location, role });
        if (active) setCandidates(data || []);
      } catch (err) {
        if (active) setError(err.message || 'Could not refresh candidates.');
      }
    }

    loadCandidates();

    return () => {
      active = false;
    };
  }, [search, location, role]);

  const roleOptions = useMemo(() => uniqueValues([
    ...jobs.map((job) => job.category),
    ...jobs.map((job) => job.title),
    'Photography',
    'Video Edit',
    'Story Writing',
    'Direction',
    'Branding',
  ]), [jobs]);

  const rankedCandidates = useMemo(() => candidates
    .map((candidate) => ({
      ...candidate,
      matchScore: candidateScore(candidate, role, minTrustScore),
    }))
    .filter((candidate) => (candidate.trustScore || 0) >= Number(minTrustScore || 0))
    .sort((a, b) => b.matchScore - a.matchScore || b.trustScore - a.trustScore),
  [candidates, minTrustScore, role]);

  const handleContact = async (candidateId) => {
    try {
      setError('');
      setContactingId(candidateId);
      await sendFriendRequest(candidateId);
      setCandidates((current) => current.map((candidate) => (
        candidate.id === candidateId ? { ...candidate, connectionStatus: 'pending_outgoing' } : candidate
      )));
    } catch (err) {
      setError(err.message || 'Could not contact candidate.');
    } finally {
      setContactingId(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">Candidates</h1>
          <p className="text-slate-500 dark:text-slate-400">Shortlist job seekers by role, city, trust score, and skill match.</p>
        </div>
        <Link
          to="/jobs"
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-600 px-5 py-3 text-sm font-bold text-white soft-shadow hover:bg-brand-700"
        >
          <BriefcaseBusiness className="h-4 w-4" />
          Post a Job
        </Link>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-600 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="grid gap-4 rounded-[28px] border border-slate-100 bg-white p-5 soft-shadow dark:border-slate-800 dark:bg-slate-900 md:grid-cols-5">
        <label className="space-y-2 md:col-span-2">
          <span className="text-xs font-bold uppercase text-slate-400">Open Job</span>
          <select
            value={selectedJobId}
            onChange={(event) => setSelectedJobId(event.target.value)}
            className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <option value="">Choose job or filter manually</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>{job.title} - {job.company}</option>
            ))}
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-xs font-bold uppercase text-slate-400">Role</span>
          <select
            value={role}
            onChange={(event) => setRole(event.target.value)}
            className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <option value="">All roles</option>
            {roleOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-xs font-bold uppercase text-slate-400">Location</span>
          <input
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            placeholder="City"
          />
        </label>
        <label className="space-y-2">
          <span className="text-xs font-bold uppercase text-slate-400">Min Trust: {minTrustScore}</span>
          <input
            type="range"
            min="0"
            max="100"
            value={minTrustScore}
            onChange={(event) => setMinTrustScore(event.target.value)}
            className="mt-4 w-full accent-brand-600"
          />
        </label>
        <label className="relative md:col-span-5">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-2xl border border-slate-100 bg-slate-50 py-3 pl-11 pr-4 text-sm font-semibold outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            placeholder="Search by name, skill, bio, or role"
          />
        </label>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-3 rounded-[28px] bg-white p-10 text-slate-500 soft-shadow dark:bg-slate-900">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading candidates...
        </div>
      ) : rankedCandidates.length ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {rankedCandidates.map((candidate) => (
            <div key={candidate.id} className="rounded-[28px] border border-slate-100 bg-white p-5 soft-shadow dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img src={resolveAssetUrl(candidate.avatar)} alt={candidate.name} className="h-14 w-14 rounded-2xl object-cover soft-shadow" />
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">{candidate.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{candidate.location || 'Location not added'}</p>
                  </div>
                </div>
                <div className="rounded-2xl bg-brand-50 px-3 py-2 text-center text-brand-700 dark:bg-brand-950/40 dark:text-brand-200">
                  <p className="text-[10px] font-bold uppercase">Match</p>
                  <p className="font-display text-lg font-bold">{candidate.matchScore}%</p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800">
                  <ShieldCheck className="mb-2 h-4 w-4 text-teal-500" />
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-300">Trust</p>
                  <p className="font-bold text-slate-900 dark:text-white">{candidate.trustScore}%</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800">
                  <Star className="mb-2 h-4 w-4 text-amber-500" />
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-300">Level</p>
                  <p className="truncate font-bold text-slate-900 dark:text-white">{candidate.trustScoreLevel}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800">
                  <UserRound className="mb-2 h-4 w-4 text-brand-500" />
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-300">Works</p>
                  <p className="font-bold text-slate-900 dark:text-white">{candidate.portfolioCount}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {uniqueValues([...(candidate.roles || []), ...(candidate.skills || []), ...(candidate.interestedRoles || [])]).slice(0, 5).map((item) => (
                  <span key={item} className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-3 py-1 text-xs font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                    <Sparkles className="h-3 w-3" />
                    {item}
                  </span>
                ))}
              </div>

              <div className="mt-5 flex gap-3">
                <Link to={`/profile/${candidate.id}`} className="flex-1 rounded-2xl bg-slate-50 px-4 py-3 text-center text-sm font-bold text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
                  View Profile
                </Link>
                <button
                  onClick={() => handleContact(candidate.id)}
                  disabled={candidate.connectionStatus !== 'none' || contactingId === candidate.id}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-brand-600 px-4 py-3 text-sm font-bold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {contactingId === candidate.id ? <Loader2 className="h-4 w-4 animate-spin" /> : candidate.connectionStatus === 'none' ? <Send className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                  {candidate.connectionStatus === 'none' ? 'Contact' : 'Requested'}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-[28px] border border-dashed border-slate-200 bg-white p-10 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          No matching candidates found. Try lowering the trust score or broadening the role.
        </div>
      )}
    </div>
  );
}
