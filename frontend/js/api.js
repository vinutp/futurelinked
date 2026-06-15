/* ==========================================================================
   API client + session state.
   A thin wrapper over fetch that attaches the auth token and normalises
   errors into thrown Error objects the views can catch.
   ========================================================================== */

const Session = {
  token: localStorage.getItem('careeros_token') || null,
  user: JSON.parse(localStorage.getItem('careeros_user') || 'null'),

  set(token, user) {
    this.token = token;
    this.user = user;
    localStorage.setItem('careeros_token', token);
    localStorage.setItem('careeros_user', JSON.stringify(user));
  },
  clear() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('careeros_token');
    localStorage.removeItem('careeros_user');
  },
  get isAuthed() {
    return Boolean(this.token);
  },
};

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (Session.token) headers.Authorization = `Bearer ${Session.token}`;

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // 401 mid-session means the token expired — drop the user back to sign-in.
  if (res.status === 401 && Session.isAuthed && !path.startsWith('/auth/')) {
    Session.clear();
    location.hash = '#/login';
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

const API = {
  // auth
  register: (payload) => request('POST', '/auth/register', payload),
  login: (payload) => request('POST', '/auth/login', payload),
  me: () => request('GET', '/auth/me'),

  // profile
  getProfile: () => request('GET', '/profile/me'),
  updateProfile: (patch) => request('PUT', '/profile/me', patch),
  getCandidate: (id) => request('GET', `/profile/candidate/${id}`),

  // jobs
  listJobs: (query = {}) => {
    const qs = new URLSearchParams(query).toString();
    return request('GET', `/jobs${qs ? `?${qs}` : ''}`);
  },
  getJob: (id) => request('GET', `/jobs/${id}`),
  recommended: () => request('GET', '/jobs/recommended'),
  createJob: (payload) => request('POST', '/jobs', payload),
  deleteJob: (id) => request('DELETE', `/jobs/${id}`),
  myJobs: () => request('GET', '/jobs/mine/posted'),
  jobCandidates: (id) => request('GET', `/jobs/${id}/candidates`),

  // applications
  apply: (payload) => request('POST', '/applications', payload),
  myApplications: () => request('GET', '/applications/mine'),
  jobApplications: (jobId) => request('GET', `/applications/job/${jobId}`),
  setApplicationStatus: (id, status, extra = {}) =>
    request('PATCH', `/applications/${id}/status`, { status, ...extra }),
  respondInterview: (id, response, reason) =>
    request('POST', `/applications/${id}/interview-response`, { response, reason }),

  // messages (chat)
  messageThreads: () => request('GET', '/messages/threads'),
  messageThread: (userId) => request('GET', `/messages/thread/${userId}`),
  sendMessage: (toUserId, body) => request('POST', '/messages', { toUserId, body }),

  // schedule / calendar
  schedule: () => request('GET', '/schedule'),
  addScheduleEvent: (date, title) => request('POST', '/schedule', { date, title }),
  deleteScheduleEvent: (id) => request('DELETE', `/schedule/${id}`),
  candidateBusy: (profileId) => request('GET', `/schedule/busy/${profileId}`),

  // notifications
  notifications: () => request('GET', '/notifications'),
  markNotificationsRead: () => request('POST', '/notifications/read-all'),

  // university modules
  outcomes: () => request('GET', '/university/outcomes'),
  students: () => request('GET', '/university/students'),
  internships: () => request('GET', '/university/internships'),
  placements: () => request('GET', '/university/placements'),
  skillsGap: () => request('GET', '/university/skills-gap'),

  // ai
  aiStatus: () => request('GET', '/ai/status'),
  careerPaths: () => request('GET', '/ai/career-paths'),
  polishResume: (text, role) => request('POST', '/ai/polish-resume', { text, role }),
};
