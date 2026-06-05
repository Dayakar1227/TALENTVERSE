import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, MapPin, Search, Plus, MessageSquare, Navigation, Sparkles, Clapperboard, Video, UserPlus, Heart, Loader2, Check, X, UserCheck } from 'lucide-react';
import {
  acceptFriendRequest,
  declineFriendRequest,
  discoverUsers,
  expressCollaborationInterest,
  getCollaborations,
  getConnections,
  resolveAssetUrl,
  sendFriendRequest,
} from '../lib/api.js';

const popularCities = ['Mumbai', 'Bengaluru', 'Delhi', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata'];

const budgetColors = {
  'Passion Project': 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300',
  Split: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300',
  'Low Budget': 'bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-300',
  Paid: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300',
};

function formatDate(value) {
  if (!value) return 'recently';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'recently';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function uniqueValues(items) {
  return [...new Set(items.map((item) => String(item || '').trim()).filter(Boolean))];
}

async function reverseGeocodeCity(latitude, longitude) {
  const bigDataResponse = await fetch(
    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
  );
  if (bigDataResponse.ok) {
    const data = await bigDataResponse.json();
    const city = data.city || data.locality || data.principalSubdivision;
    if (city) return city;
  }

  const nominatimResponse = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=10&lat=${latitude}&lon=${longitude}`,
  );
  if (nominatimResponse.ok) {
    const data = await nominatimResponse.json();
    const address = data.address || {};
    return address.city || address.town || address.village || address.suburb || address.county || '';
  }

  return '';
}

export default function CollaborationsPage({ user }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [location, setLocation] = useState(user?.location || '');
  const [role, setRole] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [collaborations, setCollaborations] = useState([]);
  const [people, setPeople] = useState([]);
  const [connections, setConnections] = useState({ incoming: [], outgoing: [], accepted: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isPeopleLoading, setIsPeopleLoading] = useState(true);
  const [error, setError] = useState('');
  const [connectionMessage, setConnectionMessage] = useState('');
  const [activeUserId, setActiveUserId] = useState('');
  const [activeRequestId, setActiveRequestId] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError('');

    getCollaborations({ category: filter, search, location, role })
      .then((data) => {
        if (active) setCollaborations(data || []);
      })
      .catch((err) => {
        if (active) setError(err.message || 'Could not load collaborations.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [filter, search, location, role]);

  useEffect(() => {
    let active = true;
    setIsPeopleLoading(true);
    setConnectionMessage('');

    Promise.all([
      discoverUsers({ search, location, role }),
      getConnections(),
    ])
      .then(([usersData, connectionsData]) => {
        if (!active) return;
        setPeople(usersData || []);
        setConnections(connectionsData);
      })
      .catch((err) => {
        if (active) setConnectionMessage(err.message || 'Could not load friend requests.');
      })
      .finally(() => {
        if (active) setIsPeopleLoading(false);
      });

    return () => {
      active = false;
    };
  }, [search, location, role]);

  const filtered = useMemo(() => collaborations, [collaborations]);
  const roleOptions = useMemo(() => uniqueValues([
    ...(user?.roles || []),
    ...(user?.interestedRoles || []),
    ...(user?.skills || []),
  ]), [user]);

  const handleLocate = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const city = await reverseGeocodeCity(latitude, longitude);
            
            if (!city) {
              setError('Could not detect your city. Please select or type it manually.');
              return;
            }

            setLocation(city);
            setFilter('All');
          } catch (err) {
            setError('Could not detect your city. Please select or type it manually.');
          } finally {
            setIsLocating(false);
          }
        },
        () => {
          setIsLocating(false);
          setError('Location permission was blocked. Please select or type your city.');
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
      );
    } else {
      setIsLocating(false);
      setError('Your browser does not support location detection. Please select or type your city.');
    }
  };

  const handleConnect = async (collab) => {
    if (!collab.creator_id || collab.creator_id === user?.id) return;
    setActiveUserId(collab.creator_id);
    setConnectionMessage('');

    try {
      await expressCollaborationInterest(collab.id);
      const data = await sendFriendRequest(collab.creator_id);
      setConnectionMessage(data.message || 'Friend request sent.');
      setPeople((current) => current.map((person) => (
        person.id === collab.creator_id ? { ...person, connectionStatus: 'pending_outgoing' } : person
      )));
    } catch {
      setConnectionMessage('Could not send the friend request. You can try again from their profile.');
    } finally {
      setActiveUserId('');
    }

    if (collab.creator_id) {
      navigate(`/profile/${collab.creator_id}?chat=1`);
    }
  };

  const handleFriendRequest = async (targetUserId) => {
    setActiveUserId(targetUserId);
    setConnectionMessage('');

    try {
      const data = await sendFriendRequest(targetUserId);
      setConnectionMessage(data.message || 'Friend request sent.');
      setPeople((current) => current.map((person) => (
        person.id === targetUserId ? { ...person, connectionStatus: 'pending_outgoing' } : person
      )));
    } catch (err) {
      setConnectionMessage(err.message || 'Could not send friend request.');
    } finally {
      setActiveUserId('');
    }
  };

  const handleRequestResponse = async (connectionId, action) => {
    setActiveRequestId(connectionId);
    setConnectionMessage('');

    try {
      if (action === 'accept') {
        await acceptFriendRequest(connectionId);
        setConnectionMessage('Friend request accepted.');
      } else {
        await declineFriendRequest(connectionId);
        setConnectionMessage('Friend request declined.');
      }

      const nextConnections = await getConnections();
      setConnections(nextConnections);
      const nextPeople = await discoverUsers({ search, location, role });
      setPeople(nextPeople || []);
    } catch (err) {
      setConnectionMessage(err.message || 'Could not update friend request.');
    } finally {
      setActiveRequestId('');
    }
  };

  const renderFriendButton = (person) => {
    const isBusy = activeUserId === person.id;
    const status = person.connectionStatus || person.connection_status || 'none';

    if (status === 'accepted') {
      return (
        <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-50 px-4 py-3 text-sm font-bold text-teal-600 dark:bg-teal-950/40 dark:text-teal-300">
          <UserCheck className="h-4 w-4" />
          Friends
        </button>
      );
    }
    if (status === 'pending_outgoing') {
      return (
        <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
          <Check className="h-4 w-4" />
          Sent
        </button>
      );
    }
    if (status === 'pending_incoming') {
      return (
        <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-600 dark:bg-amber-950/40 dark:text-amber-300">
          <Users className="h-4 w-4" />
          Pending
        </button>
      );
    }

    return (
      <button
        onClick={() => handleFriendRequest(person.id)}
        disabled={isBusy}
        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-4 py-3 text-sm font-bold text-white soft-shadow transition-all hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
        Add Friend
      </button>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <div className="mb-2 flex items-center space-x-2 text-sm font-bold uppercase tracking-widest text-violet-600 dark:text-violet-300">
            <Sparkles className="h-4 w-4" /><span>AI Matchmaker</span>
          </div>
          <h1 className="mb-2 font-display text-3xl font-bold text-slate-900 dark:text-white">Creative Cooperation</h1>
          <p className="text-slate-500 dark:text-slate-400">Find collaborators by city and the roles you want to work on.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleLocate}
            className={`flex items-center space-x-2 rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold soft-shadow transition-all hover:border-violet-300 dark:border-slate-700 dark:bg-slate-900 ${isLocating ? 'animate-pulse text-violet-600' : 'text-slate-600 dark:text-slate-200'}`}
          >
            <Navigation className={`h-4 w-4 ${isLocating ? 'animate-spin' : ''}`} />
            <span>{isLocating ? 'Locating...' : 'Detect City'}</span>
          </button>
          <button className="rounded-2xl bg-violet-600 p-4 text-white soft-shadow transition-all hover:scale-105 hover:bg-violet-700">
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center gap-6 rounded-[32px] border border-slate-50 bg-white p-6 soft-shadow dark:border-slate-800 dark:bg-slate-900 md:flex-row">
        <div className="relative w-full flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search project title or description..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-2xl border-none bg-slate-50 py-3 pl-11 pr-4 outline-none transition-all focus:ring-2 focus:ring-violet-500/20 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <div className="relative w-full md:w-56">
          <MapPin className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            list="collaboration-cities"
            placeholder="City"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            className="w-full rounded-2xl border-none bg-slate-50 py-3 pl-11 pr-4 outline-none transition-all focus:ring-2 focus:ring-violet-500/20 dark:bg-slate-800 dark:text-white"
          />
          <datalist id="collaboration-cities">
            {popularCities.map((city) => <option key={city} value={city} />)}
          </datalist>
        </div>
        <select
          value={role}
          onChange={(event) => setRole(event.target.value)}
          className="w-full rounded-2xl border-none bg-slate-50 px-4 py-3 text-sm font-bold text-slate-500 outline-none transition-all focus:ring-2 focus:ring-violet-500/20 dark:bg-slate-800 dark:text-slate-300 md:w-56"
        >
          <option value="">All matching roles</option>
          {roleOptions.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        <div className="flex w-full items-center space-x-4 overflow-x-auto pb-2 md:w-auto md:pb-0">
          {['All', 'Film', 'Photography', 'Video', 'Theatre'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`whitespace-nowrap rounded-xl px-5 py-2 text-sm font-bold transition-all ${filter === cat ? 'bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-600 dark:bg-red-950/40 dark:text-red-300">{error}</div>}
      {connectionMessage && (
        <div className="rounded-2xl bg-violet-50 p-4 text-sm font-semibold text-violet-700 dark:bg-violet-950/40 dark:text-violet-200">
          {connectionMessage}
        </div>
      )}

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-[32px] border border-slate-50 bg-white p-6 soft-shadow dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">Friend Requests</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Accept collaborators before starting deeper project chats.</p>
            </div>
            <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-600 dark:bg-violet-950/40 dark:text-violet-300">
              {connections.incoming.length} new
            </span>
          </div>

          {isPeopleLoading ? (
            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading requests...
            </div>
          ) : connections.incoming.length ? (
            <div className="space-y-3">
              {connections.incoming.slice(0, 3).map((request) => (
                <div key={request.id} className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3 dark:border-slate-800">
                  <img
                    src={resolveAssetUrl(request.otherUser?.avatar)}
                    alt={request.otherUser?.name || 'Collaborator'}
                    className="h-11 w-11 rounded-2xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{request.otherUser?.name}</p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {(request.otherUser?.roles || request.otherUser?.skills || []).slice(0, 2).join(', ') || 'Creative collaborator'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRequestResponse(request.id, 'accept')}
                    disabled={activeRequestId === request.id}
                    className="rounded-xl bg-teal-50 p-2 text-teal-600 hover:bg-teal-100 disabled:opacity-60 dark:bg-teal-950/40 dark:text-teal-300"
                    aria-label="Accept friend request"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleRequestResponse(request.id, 'decline')}
                    disabled={activeRequestId === request.id}
                    className="rounded-xl bg-rose-50 p-2 text-rose-600 hover:bg-rose-100 disabled:opacity-60 dark:bg-rose-950/40 dark:text-rose-300"
                    aria-label="Decline friend request"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 p-5 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
              No pending friend requests yet.
            </div>
          )}
        </div>

        <div className="rounded-[32px] border border-slate-50 bg-white p-6 soft-shadow dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">People Near Your Collaboration</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Send friend requests to creators matching your city, role, or search.</p>
            </div>
            <Users className="h-5 w-5 text-violet-500" />
          </div>

          {isPeopleLoading ? (
            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
              <Loader2 className="h-4 w-4 animate-spin" />
              Finding people...
            </div>
          ) : people.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {people.slice(0, 4).map((person) => (
                <article key={person.id} className="flex items-center gap-4 rounded-2xl border border-slate-100 p-4 dark:border-slate-800">
                  <img
                    src={resolveAssetUrl(person.avatar)}
                    alt={person.name}
                    className="h-14 w-14 rounded-2xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <button
                      onClick={() => navigate(`/profile/${person.id}`)}
                      className="block truncate text-left text-sm font-bold text-slate-900 hover:text-violet-600 dark:text-white dark:hover:text-violet-300"
                    >
                      {person.name}
                    </button>
                    <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                      {[...(person.roles || []), ...(person.skills || [])].slice(0, 3).join(', ') || 'Creative collaborator'}
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-[11px] font-bold text-slate-400">
                      {person.location && <span>{person.location}</span>}
                      <span>{person.trustScore}% trust</span>
                    </div>
                  </div>
                  {renderFriendButton(person)}
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 p-5 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
              No people found for this search yet.
            </div>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {isLoading ? (
          <div className="col-span-full flex items-center justify-center gap-3 rounded-[32px] bg-white p-10 text-slate-500 soft-shadow dark:bg-slate-900 dark:text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading collaborations...
          </div>
        ) : filtered.length ? filtered.map((collab) => (
          <div key={collab.id} className="flex flex-col overflow-hidden rounded-[32px] border border-slate-50 bg-white soft-shadow transition-all hover:border-violet-100 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-violet-800">
            <div className="flex-1 p-8">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <img src={resolveAssetUrl(collab.creator_avatar) || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(collab.creator_name || 'TV')}`} className="h-12 w-12 rounded-2xl object-cover" alt={collab.creator_name} />
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">{collab.title}</h3>
                    <p className="text-xs text-slate-400">by {collab.creator_name} • {formatDate(collab.created_at)}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${budgetColors[collab.budget_type] ?? 'bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-300'}`}>
                    {collab.budget_type}
                  </span>
                  <div className="mt-2 flex items-center space-x-1 text-slate-400">
                    <MapPin className="h-3 w-3" /><span className="text-[10px] font-medium">{collab.location}</span>
                  </div>
                </div>
              </div>

              <p className="mb-6 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{collab.description}</p>

              <div className="space-y-4">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Roles Needed</p>
                <div className="flex flex-wrap gap-2">
                  {(collab.roles_needed || []).map((role) => (
                    <div key={role} className="flex items-center space-x-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      <UserPlus className="h-3 w-3 text-violet-500" /><span>{role}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-50 bg-slate-50/50 px-8 py-6 dark:border-slate-800 dark:bg-slate-950/40">
              <span className="text-xs font-medium text-slate-400">{collab.interested_count || 0} interested</span>
              <div className="flex items-center space-x-2">
                <button className="p-3 text-slate-400 transition-colors hover:text-rose-500"><Heart className="h-5 w-5" /></button>
                <button
                  onClick={() => handleConnect(collab)}
                  disabled={activeUserId === collab.creator_id || collab.creator_id === user?.id}
                  className="flex items-center space-x-2 rounded-2xl bg-violet-600 px-6 py-3 text-sm font-bold text-white soft-shadow transition-all hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {activeUserId === collab.creator_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                  <span>{collab.creator_id === user?.id ? 'Your Post' : 'Connect'}</span>
                </button>
              </div>
            </div>
          </div>
        )) : (
          <div className="col-span-full rounded-[32px] border border-dashed border-slate-200 bg-white p-10 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            No collaborations found{location ? ` in ${location}` : ''}{role ? ` for ${role}` : ''}.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-[32px] bg-gradient-to-br from-indigo-500 to-indigo-600 p-8 text-white soft-shadow">
          <Clapperboard className="mb-4 h-10 w-10 opacity-50" />
          <h3 className="mb-2 font-display text-xl font-bold">Bollywood Sprints</h3>
          <p className="text-sm text-indigo-100">Find lighting and sound teams for fast commercial shoots in Mumbai.</p>
        </div>
        <div className="rounded-[32px] bg-gradient-to-br from-violet-500 to-violet-600 p-8 text-white soft-shadow">
          <Video className="mb-4 h-10 w-10 opacity-50" />
          <h3 className="mb-2 font-display text-xl font-bold">OTT Content Crews</h3>
          <p className="text-sm text-violet-100">Build crews for web-series production in Delhi and Bengaluru.</p>
        </div>
        <div className="rounded-[32px] bg-gradient-to-br from-teal-500 to-teal-600 p-8 text-white soft-shadow">
          <Users className="mb-4 h-10 w-10 opacity-50" />
          <h3 className="mb-2 font-display text-xl font-bold">Vernacular Creators</h3>
          <p className="text-sm text-teal-100">Connect with regional language storytellers and artists.</p>
        </div>
      </div>
    </div>
  );
}
