/**
 * TalentVerse API client.
 *
 * Auth strategy: The backend sets an httpOnly cookie on login/register.
 * The browser sends it automatically with every same-origin request.
 * We keep a token in memory ONLY as a hint for API clients (not localStorage).
 * localStorage is NOT used for tokens — it is vulnerable to XSS.
 */

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (/^(300\d|5173)$/.test(window.location.port) ? 'http://localhost:8000' : '');

// In-memory token — survives page navigation but NOT page refresh.
// After a refresh the httpOnly cookie keeps the session alive; we re-fetch /me.
let _memoryToken = null;

export function getToken() {
  return _memoryToken;
}

export function setToken(token) {
  _memoryToken = token;
}

export function clearToken() {
  _memoryToken = null;
}

function normalizeJob(job) {
  if (!job) return null;
  return {
    ...job,
    companyId: job.company_id ?? job.companyId,
    minTrustScore: job.min_trust_score ?? job.minTrustScore ?? 0,
    applicantCount: job.applicant_count ?? job.applicantCount ?? 0,
  };
}

function normalizeConnection(connection) {
  if (!connection) return null;
  return {
    ...connection,
    otherUser: normalizeUser(connection.other_user || connection.otherUser),
  };
}

function formatApiError(detail) {
  if (!detail) return 'Something went wrong. Please try again.';
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === 'string') return item;
        const field = Array.isArray(item.loc) ? item.loc.filter((part) => part !== 'body').join('.') : '';
        return [field, item.msg].filter(Boolean).join(': ');
      })
      .filter(Boolean)
      .join(' ');
  }
  if (typeof detail === 'object') {
    return detail.msg || detail.message || JSON.stringify(detail);
  }
  return String(detail);
}

export function normalizeUser(user) {
  if (!user) return null;

  return {
    ...user,
    avatar:
      user.avatar ||
      `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(user.name || user.email || 'TV')}`,
    trustScore: Math.round(user.trust_score ?? user.trustScore ?? 50),
    trustScoreLevel: user.trust_score_level ?? user.trustScoreLevel ?? 'Newcomer',
    portfolioCount: user.portfolio_count ?? user.portfolioCount ?? 0,
    isVerified: user.is_verified ?? user.isVerified ?? false,
    accountRoles: user.account_roles ?? user.accountRoles ?? (user.role ? [user.role] : ['CREATIVE']),
    roles: user.roles ?? (user.role ? [user.role] : []),
    interestedRoles: user.interested_roles ?? user.interestedRoles ?? user.skills ?? [],
    gender: user.gender ?? '',
    dateOfBirth: user.date_of_birth ?? user.dateOfBirth ?? '',
  };
}

export function resolveAssetUrl(url) {
  if (!url || url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) return url;
  return `${API_BASE_URL}${url}`;
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers);

  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Include the in-memory token as a Bearer header for API clients that need it.
  // The httpOnly cookie is sent automatically by the browser for same-origin requests.
  if (_memoryToken) {
    headers.set('Authorization', `Bearer ${_memoryToken}`);
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      credentials: 'include', // send httpOnly cookie on cross-origin requests
    });
  } catch (error) {
    throw new Error('Cannot reach the TalentVerse API. Make sure the backend is running on http://localhost:8000.');
  }

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : null;

  if (!response.ok) {
    throw new Error(formatApiError(data?.detail));
  }

  return data;
}

export async function registerUser(payload) {
  const data = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  setToken(data.access_token);
  return normalizeUser(data.user);
}

export async function loginUser(payload) {
  const data = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  setToken(data.access_token);
  return normalizeUser(data.user);
}

export async function getCurrentUser() {
  return normalizeUser(await request('/api/auth/me'));
}

export async function logoutUser() {
  try {
    await request('/api/auth/logout', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  } finally {
    clearToken();
  }
}

export async function changePassword(payload) {
  return request('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getDashboardStats() {
  return request('/api/users/dashboard');
}

export async function getPortfolioItems() {
  return request('/api/portfolio/');
}

export async function uploadPortfolioItem({ title, category, description, tags, file }) {
  const data = new FormData();
  data.append('title', title);
  data.append('category', category);
  data.append('description', description || '');
  data.append('tags', tags || '');
  data.append('file', file);

  return request('/api/portfolio/upload', {
    method: 'POST',
    body: data,
  });
}

export async function updateProfile(payload) {
  return normalizeUser(await request('/api/users/me', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }));
}

export async function joinAsRecruiter() {
  return normalizeUser(await request('/api/users/me/join-recruiter', {
    method: 'POST',
    body: JSON.stringify({}),
  }));
}

export async function createRecruiterJob(payload) {
  return normalizeJob(await request('/api/jobs/recruiter-post', {
    method: 'POST',
    body: JSON.stringify(payload),
  }));
}

export async function uploadAvatar(file) {
  const data = new FormData();
  data.append('file', file);

  return normalizeUser(await request('/api/users/me/avatar', {
    method: 'POST',
    body: data,
  }));
}

export async function getNotifications() {
  return request('/api/users/notifications');
}

export async function markNotificationsRead() {
  return request('/api/users/notifications/read', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function getPublicUser(userId) {
  return normalizeUser(await request(`/api/users/${userId}`));
}

export async function getPublicPortfolioItems(userId) {
  return request(`/api/portfolio/public/${userId}`);
}

export async function discoverUsers(params = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== 'All') searchParams.set(key, value);
  });

  const suffix = searchParams.toString() ? `?${searchParams.toString()}` : '';
  const users = await request(`/api/users/discover${suffix}`);
  return (users || []).map((user) => normalizeUser({
    ...user,
    connectionStatus: user.connection_status,
  }));
}

export async function getConnections() {
  const data = await request('/api/connections/');
  return {
    incoming: (data.incoming || []).map(normalizeConnection).filter(Boolean),
    outgoing: (data.outgoing || []).map(normalizeConnection).filter(Boolean),
    accepted: (data.accepted || []).map(normalizeConnection).filter(Boolean),
  };
}

export async function sendFriendRequest(userId) {
  return request(`/api/connections/request/${userId}`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function acceptFriendRequest(connectionId) {
  return request(`/api/connections/${connectionId}/accept`, {
    method: 'PATCH',
    body: JSON.stringify({}),
  });
}

export async function declineFriendRequest(connectionId) {
  return request(`/api/connections/${connectionId}/decline`, {
    method: 'PATCH',
    body: JSON.stringify({}),
  });
}

export async function getJobs(params = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value && value !== 'All') searchParams.set(key, value);
  });
  const suffix = searchParams.toString() ? `?${searchParams.toString()}` : '';
  const jobs = await request(`/api/jobs/${suffix}`);
  return (jobs || []).map(normalizeJob);
}

export async function getJobApplicants(jobId, params = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) searchParams.set(key, value);
  });
  const suffix = searchParams.toString() ? `?${searchParams.toString()}` : '';
  return request(`/api/jobs/${jobId}/applicants${suffix}`);
}

export async function getCompany(companyId) {
  const company = await request(`/api/companies/${companyId}`);
  return {
    ...company,
    jobs: (company.jobs || []).map(normalizeJob),
  };
}

export async function getCollaborations(params = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value && value !== 'All') searchParams.set(key, value);
  });

  const suffix = searchParams.toString() ? `?${searchParams.toString()}` : '';
  return request(`/api/collaborations/${suffix}`);
}

export async function expressCollaborationInterest(collaborationId) {
  return request(`/api/collaborations/${collaborationId}/interest`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function applyToJob(jobId) {
  return request(`/api/jobs/${jobId}/apply`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}
