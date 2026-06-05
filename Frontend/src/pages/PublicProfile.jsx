import React, { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, CheckCircle, Loader2, MapPin, MessageSquare, Send, Sparkles, UserPlus } from 'lucide-react';
import { getPublicPortfolioItems, getPublicUser, getToken, resolveAssetUrl, sendFriendRequest } from '../lib/api.js';
import Logo from '../components/Logo.jsx';

function joinOrFallback(items, fallback = 'Not added yet') {
  return items?.length ? items.join(', ') : fallback;
}

export default function PublicProfile() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [profile, setProfile] = useState(null);
  const [portfolio, setPortfolio] = useState([]);
  const [status, setStatus] = useState('loading');
  const [friendStatus, setFriendStatus] = useState('');
  const [friendMessage, setFriendMessage] = useState('');
  const [isSendingFriendRequest, setIsSendingFriendRequest] = useState(false);
  const showChat = searchParams.get('chat') === '1';

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const [userData, portfolioData] = await Promise.all([
          getPublicUser(id),
          getPublicPortfolioItems(id),
        ]);

        if (!active) return;
        setProfile(userData);
        setPortfolio(portfolioData);
        setStatus('ready');
      } catch {
        if (active) setStatus('error');
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [id]);

  const handleFriendRequest = async () => {
    if (!getToken()) {
      setFriendMessage('Sign in to send a friend request.');
      return;
    }

    setIsSendingFriendRequest(true);
    setFriendMessage('');

    try {
      const data = await sendFriendRequest(id);
      setFriendStatus('sent');
      setFriendMessage(data.message || 'Friend request sent.');
    } catch (err) {
      setFriendMessage(err.message || 'Could not send friend request.');
    } finally {
      setIsSendingFriendRequest(false);
    }
  };

  if (status === 'loading') {
    return <div className="min-h-screen bg-slate-50 p-8 text-slate-500 dark:bg-slate-950 dark:text-slate-400">Loading profile...</div>;
  }

  if (status === 'error' || !profile) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 dark:bg-slate-950">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-brand-600 dark:text-brand-300">
          <ArrowLeft className="h-4 w-4" />
          Back to TalentVerse
        </Link>
        <div className="mt-12 rounded-[28px] bg-white p-8 text-center soft-shadow dark:bg-slate-900">
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Profile not found</h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">This portfolio link may be unavailable.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-200 bg-white/80 px-6 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Logo />
          <Link to="/auth" className="rounded-full bg-brand-600 px-5 py-2 text-sm font-bold text-white hover:bg-brand-700">
            Join TalentVerse
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <section className="overflow-hidden rounded-[32px] bg-white soft-shadow dark:bg-slate-900">
          <div className="h-32 bg-gradient-to-r from-brand-600 via-indigo-600 to-teal-500" />
          <div className="-mt-12 px-6 pb-6">
            <img
              src={resolveAssetUrl(profile.avatar)}
              alt={profile.name}
              className="h-24 w-24 rounded-3xl border-4 border-white object-cover soft-shadow dark:border-slate-900"
            />
            <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="font-display text-3xl font-bold">{profile.name}</h1>
                <p className="mt-1 text-slate-500 dark:text-slate-400">{profile.bio || joinOrFallback(profile.roles, 'Creative professional')}</p>
                <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-500 dark:text-slate-400">
                  {profile.location && <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4" />{profile.location}</span>}
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                onClick={handleFriendRequest}
                disabled={isSendingFriendRequest || friendStatus === 'sent'}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-sm font-bold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSendingFriendRequest ? <Loader2 className="h-4 w-4 animate-spin" /> : friendStatus === 'sent' ? <Check className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                {friendStatus === 'sent' ? 'Request Sent' : 'Add Friend'}
              </button>
              <Link to={`/profile/${profile.id}?chat=1`} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-600 px-5 py-3 text-sm font-bold text-white hover:bg-brand-700">
                <MessageSquare className="h-4 w-4" />
                Chat
              </Link>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
                <p className="text-xs font-bold uppercase text-slate-400">Trust Score</p>
                <p className="text-2xl font-bold text-brand-600 dark:text-brand-300">{profile.trustScore}%</p>
              </div>
              </div>
            </div>
            {friendMessage && (
              <div className="mt-4 rounded-2xl bg-violet-50 p-3 text-sm font-semibold text-violet-700 dark:bg-violet-950/40 dark:text-violet-200">
                {friendMessage}
              </div>
            )}
          </div>
        </section>

        <section className="mt-8 grid gap-6 md:grid-cols-3">
          <div className="space-y-6">
          <div className="rounded-[28px] bg-white p-6 soft-shadow dark:bg-slate-900">
            <h2 className="font-display text-lg font-bold">Profile Details</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div><dt className="font-bold text-slate-400">Roles</dt><dd>{joinOrFallback(profile.roles)}</dd></div>
              <div><dt className="font-bold text-slate-400">Interested Roles</dt><dd>{joinOrFallback(profile.interestedRoles)}</dd></div>
            </dl>
          </div>
          {showChat && (
            <div className="rounded-[28px] bg-white p-6 soft-shadow dark:bg-slate-900">
              <h2 className="font-display text-lg font-bold">Chat with {profile.name.split(' ')[0]}</h2>
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                  Start a professional conversation about collaboration, availability, or portfolio work.
                </div>
                <div className="flex gap-2">
                  <input className="min-w-0 flex-1 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="Type a message..." />
                  <button className="rounded-2xl bg-brand-600 px-4 text-white hover:bg-brand-700" aria-label="Send message">
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
          </div>

          <div className="md:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Portfolio</h2>
              <span className="text-sm font-bold text-slate-400">{portfolio.length} uploads</span>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {portfolio.length ? portfolio.map((item) => (
                <article key={item.id} className="overflow-hidden rounded-[24px] bg-white soft-shadow dark:bg-slate-900">
                  {String(item.image_url).includes('.mp4') ? (
                    <video src={resolveAssetUrl(item.image_url)} controls className="h-48 w-full object-cover" />
                  ) : (
                    <img src={resolveAssetUrl(item.image_url)} alt={item.title} className="h-48 w-full object-cover" />
                  )}
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-bold">{item.title}</h3>
                      {item.verification_status === 'verified' && <CheckCircle className="h-5 w-5 shrink-0 text-teal-500" />}
                    </div>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.category}</p>
                    {item.description && <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{item.description}</p>}
                  </div>
                </article>
              )) : (
                <div className="rounded-[24px] border border-dashed border-slate-200 bg-white p-8 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                  <Sparkles className="mx-auto mb-3 h-6 w-6 text-brand-500" />
                  No public portfolio uploads yet.
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
