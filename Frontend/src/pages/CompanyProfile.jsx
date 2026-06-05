import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Building2, Globe, ArrowLeft, CheckCircle, ExternalLink, Loader2 } from 'lucide-react';
import { getCompany, resolveAssetUrl } from '../lib/api.js';

export default function CompanyProfile({ user }) {
  const { id } = useParams();
  const [company, setCompany] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let active = true;
    setStatus('loading');

    getCompany(id)
      .then((data) => {
        if (!active) return;
        setCompany(data);
        setStatus('ready');
      })
      .catch(() => {
        if (active) setStatus('error');
      });

    return () => {
      active = false;
    };
  }, [id]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center gap-3 py-20 text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading agency...
      </div>
    );
  }

  if (status === 'error' || !company) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Building2 className="w-16 h-16 text-slate-200 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900">Agency Not Found</h2>
        <p className="text-slate-500 mb-8">The profile you're looking for doesn't exist.</p>
        <Link to="/jobs" className="text-violet-600 font-bold hover:underline flex items-center">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Jobs
        </Link>
      </div>
    );
  }

  const companyJobs = company.jobs || [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Link to="/jobs" className="inline-flex items-center text-slate-500 hover:text-violet-600 transition-colors font-medium text-sm group">
        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
        Back to Jobs
      </Link>

      {/* Banner + Logo */}
      <div className="relative">
        <div className="h-64 rounded-[40px] overflow-hidden soft-shadow border border-slate-100 bg-slate-200">
          <img src={resolveAssetUrl(company.banner)} alt={company.name} className="w-full h-full object-cover" />
        </div>
        <div className="absolute -bottom-16 left-8 md:left-12 flex items-end space-x-6">
          <div className="w-32 h-32 rounded-3xl bg-white p-2 soft-shadow border border-slate-50">
            <img src={resolveAssetUrl(company.logo)} alt={company.name} className="w-full h-full rounded-2xl object-cover" />
          </div>
          <div className="pb-4">
            <h1 className="text-3xl font-bold text-slate-900 font-display">{company.name}</h1>
            <div className="flex items-center space-x-4 mt-1">
              <span className="text-sm font-medium text-slate-500 flex items-center">
                <Building2 className="w-4 h-4 mr-1 text-slate-400" /> {company.industry}
              </span>
              <span className="text-sm font-medium text-slate-500 flex items-center">
                <MapPin className="w-4 h-4 mr-1 text-slate-400" /> {company.location}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-16 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-[32px] soft-shadow border border-slate-50">
            <h2 className="text-xl font-bold text-slate-900 mb-6 font-display">Our Mission</h2>
            <p className="text-lg text-slate-600 italic leading-relaxed border-l-4 border-violet-100 pl-6 py-2">
              "{company.mission}"
            </p>
            <h2 className="text-xl font-bold text-slate-900 mt-10 mb-6 font-display">About Us</h2>
            <p className="text-slate-500 leading-relaxed">{company.description}</p>
          </div>

          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900 font-display">Open Gigs ({companyJobs.length})</h2>
            <div className="grid grid-cols-1 gap-4">
              {companyJobs.map(job => (
                <div key={job.id} className="bg-white p-6 rounded-3xl soft-shadow border border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between hover:border-violet-100 transition-all group">
                  <div>
                    <h3 className="font-bold text-slate-900 group-hover:text-violet-600 transition-colors">{job.title}</h3>
                    <p className="text-sm text-slate-500 mt-1">{job.type} • {job.location}</p>
                  </div>
                  <div className="mt-4 sm:mt-0 flex items-center space-x-4">
                    <span className="text-sm font-bold text-slate-900">{job.salary}</span>
                    <Link to="/upload" className="px-4 py-2 bg-violet-600 text-white rounded-xl text-xs font-bold hover:bg-violet-700">Apply</Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white p-8 rounded-[32px] soft-shadow border border-slate-50">
            <h2 className="text-lg font-bold text-slate-900 mb-6 font-display">Quick Info</h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-slate-500">
                  <Globe className="w-4 h-4 mr-2" /><span className="text-sm">Website</span>
                </div>
                <a href={company.website} target="_blank" rel="noreferrer" className="text-sm font-bold text-violet-600 flex items-center hover:underline">
                  Visit <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-slate-500">
                  <CheckCircle className="w-4 h-4 mr-2" /><span className="text-sm">Pan-India Verify</span>
                </div>
                <div className="flex items-center text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full text-xs font-bold">
                  Trusted
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
