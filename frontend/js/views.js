/* ==========================================================================
   Views — every screen in the app.
   Each view is an async function that paints into the #app element and wires
   up its own event handlers. Navigation is driven by the hash router in app.js.
   ========================================================================== */

const Views = {};

/* --------------------------------------------------------------------------
 * Landing
 * ------------------------------------------------------------------------ */
Views.landing = async (app) => {
    app.innerHTML = `
  <div class="landing">
    <div class="nav">
      <div class="brand"><span class="dot"></span> FutureLinked</div>
      <div class="nav-actions">
        <button class="btn secondary" data-go="#/login">Explore the demo</button>
      </div>
    </div>

    <div class="hero">
      <div>
        <div class="eyebrow">FOR CANDIDATES · EMPLOYERS · UNIVERSITIES</div>
        <h1>A Complete Career Journey</h1>
        <p class="lede">Bringing together candidates, employers, and universities to create a complete picture that empowers everyone to navigate the future with confidence.</p>
        <div class="cta-row" style="justify-content:center;">
          <button class="btn secondary" data-go="#/login">Sign in</button>
          <button class="btn" data-go="#/register">Create an account</button>
        </div>
      </div>

      <div class="hero-panel">
        <h4>📊 Universiti Teknologi PETRONAS · Outcome Loop</h4>
        <div class="mini-card">
          <div class="t">Class of 2024 — 12 months out</div>
          <div class="s">Employment rate</div>
          <div class="mini-bar"><span style="width:88%"></span></div>
        </div>
        <div class="mini-card">
          <div class="t">Amirah Hashim · live readiness</div>
          <div class="s">Job-ready · 81/100</div>
          <div class="mini-bar"><span style="width:81%"></span></div>
        </div>
        <div class="mini-card">
          <div class="t">Internship match → Helix Software</div>
          <div class="s">92/100 · shares 4 of 4 required skills</div>
          <div class="mini-bar"><span style="width:92%"></span></div>
        </div>
      </div>
    </div>
  </div>`;
    wireGo(app);
};

/* --------------------------------------------------------------------------
 * Auth (login / register)
 * ------------------------------------------------------------------------ */
Views.auth = async (app, params, mode) => {
  const isRegister = mode === 'register';
  let role = 'candidate';

  app.innerHTML = `
  <div class="auth-wrap">
    <div class="auth-aside">
      <div class="brand" data-go="#/" style="cursor:pointer;"><span class="dot"></span> FutureLinked</div>
      <h2>Better data than you could ever assemble alone.</h2>
      <p>FutureLinked brings candidates, employers, and universities onto one platform. Everyone sees the same honest picture of skills, opportunities, and outcomes. Choose how you'll use it below.</p>
      <div class="points">
        <div class="point"><div class="ic">🎯</div><div><div class="t">Candidates</div><div class="s">Build your resume and get matched to jobs while tracking every application in one place.</div></div></div>
        <div class="point"><div class="ic">🏢</div><div><div class="t">Employers</div><div class="s">Find the right talent and manage your whole hiring pipeline by posting roles and review ranked applicants.</div></div></div>
        <div class="point"><div class="ic">🎓</div><div><div class="t">Universities</div><div class="s">Transform educational outcomes with a holistic view of employability, internships, and skills demand.</div></div></div>
      </div>
    </div>

    <div class="auth-form">
      <div class="inner">
        <button class="btn ghost small" data-go="#/" style="align-self:flex-start;margin-bottom:16px;">← Back to home</button>
        <h1>${isRegister ? 'Create your account' : 'Welcome back'}</h1>
        <div class="sub">${isRegister ? ' ' : 'Sign in to continue.'}</div>

        <form id="auth-form">
          ${isRegister ? `
          <div class="role-pick" id="role-pick">
            <div class="opt active" data-role="candidate"><span class="ic">🎯</span>Candidate</div>
            <div class="opt" data-role="employer"><span class="ic">🏢</span>Employer</div>
            <div class="opt" data-role="university"><span class="ic">🎓</span>University</div>
          </div>
          <div class="field"><label>Full name / organisation</label><input class="input" name="name" id="name" placeholder="Your name or organisation" required /></div>
          ` : ''}
          <div class="field"><label>Email</label><input class="input" type="email" name="email" id="email" placeholder="you@example.com" required /></div>
          <div class="field"><label>Password</label><input class="input" type="password" name="password" id="password" placeholder="••••••••" required minlength="6" /></div>
          <button class="btn block" type="submit" id="submit">${isRegister ? 'Create account' : 'Sign in'}</button>
        </form>

        <div class="auth-switch">
          ${isRegister
            ? 'Already have an account? <a data-go="#/login">Sign in</a>'
            : 'New here? <a data-go="#/register">Create an account</a>'}
        </div>

        ${!isRegister ? demoLoginsBlock() : ''}
      </div>
    </div>
  </div>`;

  wireGo(app);

  if (isRegister) {
    $$('#role-pick .opt').forEach((opt) => {
      opt.addEventListener('click', () => {
        $$('#role-pick .opt').forEach((o) => o.classList.remove('active'));
        opt.classList.add('active');
        role = opt.dataset.role;
      });
    });
  }

  // Click-to-fill demo logins.
  $$('.demo-logins .dl').forEach((dl) => {
    dl.addEventListener('click', () => {
      $('#email').value = dl.dataset.email;
      $('#password').value = 'password123';
    });
  });

  $('#auth-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('#submit');
    btn.disabled = true;
    try {
      const email = $('#email').value.trim();
      const password = $('#password').value;
      let result;
      if (isRegister) {
        result = await API.register({ email, password, name: $('#name').value.trim(), role });
      } else {
        result = await API.login({ email, password });
      }
      Session.set(result.token, result.user);
      toast(`Welcome, ${result.user.name.split(' ')[0]}!`, 'success');
      location.hash = '#/dashboard';
    } catch (err) {
      toast(err.message, 'error');
      btn.disabled = false;
    }
  });
};

function demoLoginsBlock() {
  return `
  <div class="demo-logins">
    <div class="dl-head">Demo logins · click to fill (password: password123)</div>
    <div class="dl" data-email="careers@utp.edu.my"><span>🎓 University</span><code>careers@utp.edu.my</code></div>
    <div class="dl" data-email="amirah@utp.edu.my"><span>🎯 Candidate</span><code>amirah@utp.edu.my</code></div>
    <div class="dl" data-email="talent@helix.com.my"><span>🏢 Employer</span><code>talent@helix.com.my</code></div>
  </div>`;
}

/* --------------------------------------------------------------------------
 * App shell (sidebar + content mount)
 * ------------------------------------------------------------------------ */
const NAV = {
  candidate: [
    { group: 'Navigate', items: [
      { href: '#/dashboard', icon: '🏠', label: 'Dashboard' },
      { href: '#/jobs', icon: '🔍', label: 'Find jobs' },
      { href: '#/applications', icon: '📨', label: 'My applications' },
      { href: '#/paths', icon: '🧭', label: 'Career paths' },
    ]},
    { group: 'Connect', items: [
      { href: '#/messages', icon: '💬', label: 'Messages' },
      { href: '#/calendar', icon: '📅', label: 'Calendar' },
    ]},
    { group: 'Profile', items: [
      { href: '#/profile', icon: '📄', label: 'Profile & resume' },
    ]},
  ],
  employer: [
    { group: 'Hiring', items: [
      { href: '#/dashboard', icon: '🏠', label: 'Dashboard' },
      { href: '#/post', icon: '➕', label: 'Post a job' },
      { href: '#/myjobs', icon: '📋', label: 'My listings' },
      { href: '#/talent', icon: '🔎', label: 'Find talent' },
    ]},
    { group: 'Connect', items: [
      { href: '#/messages', icon: '💬', label: 'Messages' },
      { href: '#/calendar', icon: '📅', label: 'Calendar' },
    ]},
    { group: 'Company', items: [
      { href: '#/profile', icon: '🏢', label: 'Company profile' },
    ]},
  ],
  university: [
    { group: 'FutureLinked', items: [
      { href: '#/dashboard', icon: '🎓', label: 'Outcome Loop' },
      { href: '#/students', icon: '📡', label: 'Readiness' },
      { href: '#/marketplace', icon: '💞', label: 'Internships' },
      { href: '#/curriculum', icon: '📚', label: 'Skills gap' },
    ]},
    { group: 'Institution', items: [
      { href: '#/profile', icon: '⚙️', label: 'Settings' },
    ]},
  ],
};

function shell(activeHref, contentHtml) {
  const role = Session.user.role;
  const groups = NAV[role].map((g) => `
    <div class="nav-group">
      <div class="label">${g.group}</div>
      ${g.items.map((it) => `
        <a class="nav-item ${it.href === activeHref ? 'active' : ''}" data-go="${it.href}">
          <span class="ic">${it.icon}</span> ${it.label}
        </a>`).join('')}
    </div>`).join('');

  return `
  <div class="shell">
    <aside class="sidebar">
      <div class="brand"><span class="dot"></span> FutureLinked</div>
      ${groups}
      <div class="spacer"></div>
      <div class="user-card">
        <div class="av">${initials(Session.user.name)}</div>
        <div class="meta">
          <div class="n">${esc(Session.user.name)}</div>
          <div class="r">${esc(role)}</div>
        </div>
      </div>
      <button class="btn ghost small mt8" id="logout" style="color:#94a3b8;justify-content:flex-start;">↩ Sign out</button>
    </aside>
    <main class="main">
      ${role !== 'university' ? `
      <div class="topbar">
        <button class="bell" id="bell" data-go="#/notifications" title="Notifications">🔔<span class="bell-badge" id="bell-badge" style="display:none">0</span></button>
      </div>` : ''}
      <div id="content">${contentHtml}</div>
    </main>
  </div>`;
}

// Tracks any polling timers so we can stop them when the view changes.
window.__pollTimers = window.__pollTimers || [];
function clearPolling() {
  window.__pollTimers.forEach((t) => clearInterval(t));
  window.__pollTimers = [];
}
function addPolling(fn, ms) {
  window.__pollTimers.push(setInterval(fn, ms));
}

function mountShell(app, activeHref, contentHtml) {
  clearPolling();
  app.innerHTML = shell(activeHref, contentHtml);
  wireGo(app);
  $('#logout').addEventListener('click', () => {
    Session.clear();
    location.hash = '#/';
    toast('Signed out.');
  });
  // Keep the notification bell badge fresh.
  if (Session.user.role !== 'university') refreshBell();
}

async function refreshBell() {
  try {
    const { unread } = await API.notifications();
    const badge = $('#bell-badge');
    if (!badge) return;
    if (unread > 0) { badge.textContent = unread; badge.style.display = ''; }
    else { badge.style.display = 'none'; }
  } catch { /* ignore */ }
}

function loadingHtml(label = 'Loading…') {
  return `<div class="stack">
    <div class="skeleton" style="height:48px"></div>
    <div class="skeleton" style="height:120px"></div>
    <div class="skeleton" style="height:120px"></div>
  </div>`;
}

/* ==========================================================================
   CANDIDATE VIEWS
   ========================================================================== */
Views.dashboard = async (app) => {
  const role = Session.user.role;
  if (role === 'employer') return Views.employerDashboard(app);
  if (role === 'university') return Views.universityDashboard(app);
  return Views.candidateDashboard(app);
};

Views.candidateDashboard = async (app) => {
  mountShell(app, '#/dashboard', loadingHtml());
  const content = $('#content');
  try {
    const [{ profile }, recRes, appsRes] = await Promise.all([
      API.getProfile(),
      API.recommended().catch(() => ({ matches: [] })),
      API.myApplications().catch(() => ({ applications: [] })),
    ]);
    const r = profile.readiness;
    const matches = recRes.matches || [];
    const apps = appsRes.applications || [];

    content.innerHTML = `
      <div class="page-head">
        <div>
          <h1>Hi ${esc(Session.user.name.split(' ')[0])} 👋</h1>
          <p>Here’s your readiness, your best-matched roles, and where your applications stand.</p>
        </div>
        <button class="btn" data-go="#/jobs">Find jobs</button>
      </div>

      <div class="stat-grid">
        <div class="stat-tile"><div class="n">${r.overall}</div><div class="l">Readiness · ${esc(r.band)}</div><div class="sub">Updated live from your profile</div></div>
        <div class="stat-tile"><div class="n">${matches.length}</div><div class="l">Strong job matches</div></div>
        <div class="stat-tile"><div class="n">${apps.length}</div><div class="l">Applications</div></div>
        <div class="stat-tile"><div class="n">${(profile.skills || []).length}</div><div class="l">Skills on profile</div></div>
      </div>

      <div class="section">
        <div class="section-head"><h2>Your readiness</h2><span class="module-pill">Adaptive Readiness Profile</span></div>
        <div class="card pad">
          ${r.dimensions.map((d) => `
            <div class="mb16">
              <div class="between"><span class="small bold">${esc(d.label)}</span><span class="small muted">${d.value}/100</span></div>
              ${bar(d.value)}
            </div>`).join('')}
          <div class="divider"></div>
          <div class="small bold mb8">What would move the needle</div>
          <ul style="padding-left:18px;color:var(--ink-soft);font-size:14px;">
            ${r.nextSteps.map((s) => `<li>${esc(s)}</li>`).join('')}
          </ul>
        </div>
      </div>

      <div class="section">
        <div class="section-head"><h2>Recommended for you</h2><a class="btn ghost small" data-go="#/jobs">See all</a></div>
        <div class="card-grid">
          ${matches.length ? matches.slice(0, 4).map(jobMatchCard).join('') : emptyState('No matches yet — add skills to your profile.')}
        </div>
      </div>`;
    wireGo(content);
    wireJobCards(content);
  } catch (err) {
    content.innerHTML = errorState(err.message);
  }
};

function jobMatchCard(m) {
  const job = m.job;
  const tier = matchTier(m.score);
  return `
    <div class="card job-card" data-job="${job.id}">
      <div class="job-logo">${initials(job.company)}</div>
      <div class="job-main">
        <h3>${esc(job.title)}</h3>
        <div class="job-meta"><span>${esc(job.company)}</span><span>${esc(job.location || 'Flexible')}</span><span>${esc(job.type)}</span></div>
        <div>${chips((m.matchedSkills || []).slice(0, 4), 'chip match')}${chips((m.missingSkills || []).slice(0, 2), 'chip gap')}</div>
        ${whyBlock(m)}
      </div>
      <div class="job-side">
        <span class="match-pill ${tier}">${m.score}% match</span>
        <div class="tiny muted mt8">${timeAgo(job.postedAt)}</div>
      </div>
    </div>`;
}

function jobCard(job) {
  return `
    <div class="card job-card" data-job="${job.id}">
      <div class="job-logo">${initials(job.company)}</div>
      <div class="job-main">
        <h3>${esc(job.title)}</h3>
        <div class="job-meta">
          <span>${esc(job.company)}</span><span>${esc(job.location || 'Flexible')}</span>
          <span>${esc(job.type)}</span>${job.remote ? '<span>Remote</span>' : ''}
        </div>
        <div>${chips((job.requiredSkills || []).slice(0, 5))}</div>
      </div>
      <div class="job-side">
        <div class="small bold">${salaryRange(job)}</div>
        <div class="tiny muted mt8">${job.applicants || 0} applicants · ${timeAgo(job.postedAt)}</div>
      </div>
    </div>`;
}

function wireJobCards(root) {
  $$('.job-card[data-job]', root).forEach((c) => {
    c.style.cursor = 'pointer';
    c.addEventListener('click', () => (location.hash = `#/job/${c.dataset.job}`));
  });
}

/* --- Jobs browse ---------------------------------------------------------- */
Views.jobs = async (app) => {
  mountShell(app, '#/jobs', `
    <div class="page-head"><div><h1>Find jobs</h1><p>Search by keyword, skill, or location. Sign-in tailors matches to you.</p></div></div>
    <div class="card pad mb16">
      <div class="row wrap">
        <div class="field" style="margin:0;flex:2;"><label>Keyword</label><input class="input" id="q" placeholder="e.g. frontend, data, design" /></div>
        <div class="field" style="margin:0;"><label>Location</label><input class="input" id="loc" placeholder="City or Remote" /></div>
        <div class="field" style="margin:0;"><label>Type</label>
          <select class="input" id="type"><option value="">Any</option><option>Full-time</option><option>Internship</option><option>Part-time</option></select>
        </div>
        <div class="field" style="margin:0;flex:0 0 auto;align-self:flex-end;"><button class="btn" id="search">Search</button></div>
      </div>
    </div>
    <div id="job-results">${loadingHtml()}</div>`);
  const content = $('#content');
  const results = $('#job-results', content);

  async function run() {
    results.innerHTML = loadingHtml();
    try {
      const query = {};
      if ($('#q').value.trim()) query.q = $('#q').value.trim();
      if ($('#loc').value.trim()) query.location = $('#loc').value.trim();
      if ($('#type').value) query.type = $('#type').value;
      const { jobs } = await API.listJobs(query);
      results.innerHTML = jobs.length
        ? `<div class="small muted mb16">${jobs.length} role${jobs.length === 1 ? '' : 's'}</div><div class="card-grid">${jobs.map(jobCard).join('')}</div>`
        : emptyState('No jobs match those filters.');
      wireJobCards(results);
    } catch (err) {
      results.innerHTML = errorState(err.message);
    }
  }
  $('#search', content).addEventListener('click', run);
  $('#q', content).addEventListener('keydown', (e) => e.key === 'Enter' && run());
  run();
};

/* --- Job detail ----------------------------------------------------------- */
Views.job = async (app, params) => {
  mountShell(app, '#/jobs', loadingHtml());
  const content = $('#content');
  try {
    const { job } = await API.getJob(params.id);
    const isCandidate = Session.user.role === 'candidate';
    content.innerHTML = `
      <a class="btn ghost small mb16" data-go="#/jobs">← Back to jobs</a>
      <div class="card pad">
        <div class="between wrap">
          <div class="flex">
            <div class="job-logo" style="width:54px;height:54px;font-size:20px;">${initials(job.company)}</div>
            <div>
              <h1 style="font-size:22px;">${esc(job.title)}</h1>
              <div class="job-meta"><span>${esc(job.company)}</span><span>${esc(job.location || 'Flexible')}</span><span>${esc(job.type)}</span>${job.remote ? '<span>Remote</span>' : ''}</div>
            </div>
          </div>
          <div class="right">
            <div class="bold">${salaryRange(job)}</div>
            <div class="tiny muted">${job.applicants || 0} applicants · ${timeAgo(job.postedAt)}</div>
          </div>
        </div>
        <div class="divider"></div>
        <div class="small bold mb8">Required skills</div>
        <div class="mb16">${chips(job.requiredSkills || [])}</div>
        <div class="small bold mb8">About the role</div>
        <p style="color:var(--ink-soft);white-space:pre-wrap;">${esc(job.description)}</p>
        ${isCandidate ? `<div class="divider"></div><button class="btn" id="apply">Apply now</button>` : ''}
      </div>`;
    wireGo(content);
    if (isCandidate) {
      $('#apply', content).addEventListener('click', () => (location.hash = `#/apply/${job.id}`));
    }
  } catch (err) {
    content.innerHTML = errorState(err.message);
  }
};

/* --- Job application form (per job) --------------------------------------- */
Views.apply = async (app, params) => {
  mountShell(app, '#/jobs', loadingHtml());
  const content = $('#content');
  try {
    const [{ job }, { profile }] = await Promise.all([API.getJob(params.id), API.getProfile()]);
    const hasCv = (profile.education || []).some((e) => e.institution) || (profile.skills || []).length;
    content.innerHTML = `
      <a class="btn ghost small mb16" data-go="#/job/${job.id}">← Back to job</a>
      <div class="page-head"><div><h1>Apply — ${esc(job.title)}</h1><p>${esc(job.company)} · ${esc(job.location || 'Flexible')}</p></div></div>

      ${hasCv ? '' : `<div class="card pad mb16" style="border-color:var(--amber);"><b>Heads up:</b> your CV looks empty. <a data-go="#/profile">Build your CV first</a> so the employer receives it with this application.</div>`}

      <form id="appf" class="card pad stack" style="max-width:680px;">
        <div class="row wrap">
          <div class="field" style="margin:0"><label>Expected salary <span class="muted tiny">(RM)</span></label><input class="input" type="number" name="expectedSalary" placeholder="e.g. 3500 / month" /></div>
          <div class="field" style="margin:0"><label>Work arrangement</label>
            <select class="input" name="workArrangement">${['Remote','On-site','Hybrid'].map((o)=>`<option>${o}</option>`).join('')}</select>
          </div>
        </div>
        <div class="row wrap">
          <div class="field" style="margin:0"><label>Preferred location</label><input class="input" name="preferredLocation" value="${esc(profile.location)}" placeholder="e.g. Kuala Lumpur" /></div>
          <div class="field" style="margin:0"><label>Earliest start date</label><input class="input" type="date" name="earliestStartDate" /></div>
        </div>
        <div class="field" style="margin:0"><label>Cover note <span class="muted tiny">(optional)</span></label><textarea class="input" name="coverNote" placeholder="A line or two on why you're a fit…"></textarea></div>

        <div class="card pad" style="background:var(--brand-soft);border-color:var(--brand-soft);">
          <div class="between"><span class="small bold">📎 CV attached automatically</span><a class="tiny" data-go="#/profile">Edit CV</a></div>
          <div class="tiny muted mt8">${esc(profile.name)} · ${(profile.skills||[]).length} skills · ${(profile.education||[]).filter((e)=>e.institution).length} education · ${(profile.experience||[]).length} experience · ${(profile.projects||[]).length} projects</div>
        </div>

        <label class="flex" style="gap:10px;font-size:14px;color:var(--ink-soft);align-items:flex-start;">
          <input type="checkbox" name="declaration" id="decl" style="margin-top:3px;" />
          <span>I certify that the information provided is accurate.</span>
        </label>

        <div class="right"><button class="btn" type="submit">Submit application</button></div>
      </form>`;
    wireGo(content);

    $('#appf', content).addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      if (!fd.get('declaration')) return toast('Please tick the declaration to submit.', 'error');
      const payload = {
        jobId: job.id,
        coverNote: fd.get('coverNote') || '',
        expectedSalary: fd.get('expectedSalary') ? Number(fd.get('expectedSalary')) : null,
        workArrangement: fd.get('workArrangement') || '',
        preferredLocation: fd.get('preferredLocation') || '',
        earliestStartDate: fd.get('earliestStartDate') || '',
        declaration: true,
      };
      try {
        await API.apply(payload);
        toast('Application submitted!', 'success');
        location.hash = '#/applications';
      } catch (err) {
        toast(err.message, 'error');
      }
    });
  } catch (err) {
    content.innerHTML = errorState(err.message);
  }
};

/* --- Applications --------------------------------------------------------- */
Views.applications = async (app) => {
  mountShell(app, '#/applications', loadingHtml());
  const content = $('#content');
  try {
    const { applications } = await API.myApplications();
    content.innerHTML = `
      <div class="page-head"><div><h1>My applications</h1><p>Track every role you’ve applied to and where it stands.</p></div></div>
      ${applications.length
        ? `<div class="stack">${applications.map(candidateApplicationCard).join('')}</div>`
        : emptyState('No applications yet. Browse jobs to get started.')}`;
    wireGo(content);

    // Accept / decline a proposed interview.
    $$('[data-accept]', content).forEach((b) =>
      b.addEventListener('click', () => confirmInterview(b.dataset.accept, 'accepted')));
    $$('[data-decline]', content).forEach((b) =>
      b.addEventListener('click', () => declineInterview(b.dataset.decline)));
  } catch (err) {
    content.innerHTML = errorState(err.message);
  }
};

function candidateApplicationCard(a) {
  const job = a.job || {};
  const pendingInterview = a.status === 'interview' && a.interviewDate && !a.interviewResponse;
  return `
    <div class="card pad">
      <div class="between wrap">
        <div>
          <div class="bold" style="cursor:pointer" data-go="#/job/${job.id || ''}">${esc(job.title || 'Removed role')}</div>
          <div class="small muted">${esc(job.company || '—')} · applied ${timeAgo(a.appliedAt)}${a.matchScore != null ? ` · ${a.matchScore}% match` : ''}</div>
        </div>
        <span class="status ${a.status}">${esc(a.status)}</span>
      </div>
      ${a.status === 'interview' && a.interviewDate ? `
        <div class="interview-box mt8">
          <div class="small bold">📅 Interview proposed for ${esc(a.interviewDate)}</div>
          ${a.interviewResponse === 'accepted' ? `<span class="badge green mt8">You accepted</span>`
            : a.interviewResponse === 'rejected' ? `<span class="badge rose mt8">You declined</span><div class="tiny muted mt8">Reason: ${esc(a.interviewRejectReason)}</div>`
            : `<div class="mt8 flex" style="gap:8px;">
                 <button class="btn small" data-accept="${a.id}">Accept</button>
                 <button class="btn small secondary" data-decline="${a.id}">Decline</button>
               </div>`}
        </div>` : ''}
      ${a.status === 'offer' ? `<div class="interview-box mt8" style="border-color:var(--green);"><div class="small bold" style="color:var(--green)">🎉 You received an offer!</div></div>` : ''}
    </div>`;
}

function confirmInterview(appId, response) {
  openModal('Accept interview?',
    `<p class="small">Confirm that you want to <b>accept</b> this interview slot?</p>`,
    `<button class="btn secondary" id="cancel">Cancel</button><button class="btn" id="ok">Confirm</button>`);
  $('#cancel').addEventListener('click', closeModal);
  $('#ok').addEventListener('click', async () => {
    try {
      await API.respondInterview(appId, response, '');
      closeModal();
      toast('Interview accepted.', 'success');
      Views.applications(document.getElementById('app'));
    } catch (err) { toast(err.message, 'error'); }
  });
}

function declineInterview(appId) {
  openModal('Decline interview',
    `<p class="small">Please give a brief reason for declining (the employer will see this).</p>
     <textarea class="input" id="reason" placeholder="e.g. I have a clashing commitment that day."></textarea>`,
    `<button class="btn secondary" id="cancel">Cancel</button><button class="btn danger" id="ok">Confirm decline</button>`);
  $('#cancel').addEventListener('click', closeModal);
  $('#ok').addEventListener('click', async () => {
    const reason = $('#reason').value.trim();
    if (!reason) return toast('A reason is required to decline.', 'error');
    try {
      await API.respondInterview(appId, 'rejected', reason);
      closeModal();
      toast('Interview declined.', 'success');
      Views.applications(document.getElementById('app'));
    } catch (err) { toast(err.message, 'error'); }
  });
}

/* --- Career paths (AI) ---------------------------------------------------- */
Views.paths = async (app) => {
  mountShell(app, '#/paths', loadingHtml('Mapping your paths…'));
  const content = $('#content');
  try {
    const [{ aiEnabled, model }, result] = await Promise.all([
      API.aiStatus(),
      API.careerPaths(),
    ]);
    const tag = result.source === 'claude' ? `Claude · ${esc(result.model || model)}` : 'Explainable model';
    content.innerHTML = `
      <div class="page-head"><div><h1>Career paths</h1><p>A range of realistic next moves for someone with your shape — with the trade-offs named.</p></div></div>
      <div class="ai-card mb16">
        <div class="ai-head">
          <h3>🧭 Where you could go next</h3>
          <span class="ai-tag">${tag}</span>
        </div>
        <div class="pad" style="padding:20px;">
          <div class="card-grid" style="grid-template-columns:1fr;">
            ${result.paths.map((p) => `
              <div class="path">
                <div class="between"><h4>${esc(p.title)}</h4><span class="horizon">${esc(p.horizon)}</span></div>
                <p class="small muted">${esc(p.rationale)}</p>
                <div class="tradeoff"><b>Trade-off:</b> ${esc(p.tradeoff)}</div>
                ${(p.buildNext && p.buildNext.length) ? `<div class="mt8"><span class="tiny muted">Build next:</span> ${chips(p.buildNext)}</div>` : ''}
              </div>`).join('')}
          </div>
          <div class="why mt16"><div class="why-head">⚠️ Where the uncertainty sits</div><p class="small muted">${esc(result.uncertainty)}</p></div>
        </div>
      </div>
      ${!aiEnabled ? `<p class="tiny muted">Tip: set an <code>ANTHROPIC_API_KEY</code> environment variable to generate richer, live paths with Claude. Without it, these come from a transparent built-in model.</p>` : ''}`;
    wireGo(content);
  } catch (err) {
    content.innerHTML = errorState(err.message);
  }
};

/* --- Candidate profile / resume builder ----------------------------------- */
Views.profile = async (app) => {
  const role = Session.user.role;
  if (role === 'employer') return Views.employerProfile(app);
  if (role === 'university') return Views.universitySettings(app);
  return Views.candidateProfile(app);
};

Views.candidateProfile = async (app) => {
  mountShell(app, '#/profile', loadingHtml());
  const content = $('#content');
  try {
    const { profile } = await API.getProfile();
    const education = (profile.education && profile.education.length) ? profile.education : [{}];
    const projects = profile.projects || [];
    const experience = profile.experience || [];

    content.innerHTML = `
      <div class="page-head"><div><h1>Resume / CV builder</h1><p>Build your CV once. It’s attached automatically every time you apply to a job.</p></div>
        <button class="btn" type="submit" form="cvf">Save CV</button></div>
      <form id="cvf" class="stack">

        <!-- 1 · Personal information -->
        <div class="card pad stack">
          <h3 class="cv-sec">1 · Personal information</h3>
          <div class="row wrap">
            <div class="field" style="margin:0"><label>Full name</label><input class="input" name="name" value="${esc(profile.name)}" /></div>
            <div class="field" style="margin:0"><label>Headline</label><input class="input" name="headline" value="${esc(profile.headline)}" placeholder="e.g. Final-year Computer Science student" /></div>
          </div>
          <div class="row wrap">
            <div class="field" style="margin:0"><label>Email</label><input class="input" type="email" name="email" value="${esc(profile.email || Session.user.email)}" placeholder="you@example.com" /></div>
            <div class="field" style="margin:0"><label>H/P number</label><input class="input" name="phone" value="${esc(profile.phone)}" placeholder="e.g. 012-345 6789" /></div>
          </div>
          <div class="row wrap">
            <div class="field" style="margin:0"><label>Location</label><input class="input" name="location" value="${esc(profile.location)}" placeholder="e.g. Kuala Lumpur, Malaysia" /></div>
            <div class="field" style="margin:0"><label>LinkedIn profile</label><input class="input" name="linkedin" value="${esc(profile.linkedin)}" placeholder="linkedin.com/in/yourname" /></div>
          </div>
          <div class="field" style="margin:0"><label>Professional summary</label><textarea class="input" name="summary" placeholder="2–3 sentences about your focus and strengths.">${esc(profile.summary)}</textarea></div>
        </div>

        <!-- 2 · Education (required) -->
        <div class="card pad stack">
          <div class="between"><h3 class="cv-sec">2 · Education <span class="req">required</span></h3><button type="button" class="btn small secondary" data-add="edu">+ Add education</button></div>
          <div id="edu-list" class="stack">${education.map(eduRow).join('')}</div>
        </div>

        <!-- 3 · Past projects -->
        <div class="card pad stack">
          <div class="between"><h3 class="cv-sec">3 · Past projects</h3><button type="button" class="btn small secondary" data-add="proj">+ Add project</button></div>
          <div id="proj-list" class="stack">${projects.length ? projects.map(projRow).join('') : ''}</div>
          <div class="hint" id="proj-empty" style="${projects.length?'display:none':''}">No projects yet — add hackathons, side projects, or coursework.</div>
        </div>

        <!-- 4 · Work experience -->
        <div class="card pad stack">
          <div class="between"><h3 class="cv-sec">4 · Work experience</h3><button type="button" class="btn small secondary" data-add="exp">+ Add experience</button></div>
          <div id="exp-list" class="stack">${experience.length ? experience.map(expRow).join('') : ''}</div>
          <div class="hint" id="exp-empty" style="${experience.length?'display:none':''}">No experience yet — add internships, part-time roles, or placements.</div>
        </div>

        <!-- 5 · Skills -->
        <div class="card pad stack">
          <h3 class="cv-sec">5 · Skills</h3>
          <div class="field" style="margin:0"><label>Skills <span class="muted tiny">(comma-separated)</span></label><input class="input" name="skills" value="${esc((profile.skills||[]).join(', '))}" placeholder="React, SQL, Python…" /></div>
          <div class="row wrap">
            <div class="field" style="margin:0"><label>Career level</label>
              <select class="input" name="seniority">${['intern','junior','mid','senior','lead'].map((s) => `<option ${profile.seniority===s?'selected':''}>${s}</option>`).join('')}</select>
            </div>
            <div class="field" style="margin:0"><label>Looking for</label>
              <select class="input" name="desiredType"><option value="">Any</option>${['Full-time','Internship','Part-time'].map((s)=>`<option ${profile.desiredType===s?'selected':''}>${s}</option>`).join('')}</select>
            </div>
            <div class="field" style="margin:0"><label>Profile visibility</label>
              <select class="input" name="visibility">
                <option value="open" ${profile.visibility==='open'?'selected':''}>Open — employers can find me</option>
                <option value="passive" ${profile.visibility==='passive'?'selected':''}>Passive — open to the right thing</option>
                <option value="private" ${profile.visibility==='private'?'selected':''}>Private — hidden from search</option>
              </select>
            </div>
          </div>
        </div>

        <!-- AI assist -->
        <div class="ai-card">
          <div class="ai-head"><h3>✨ Resume polish</h3><span class="ai-tag" id="ai-src">AI assist</span></div>
          <div style="padding:20px;">
            <div class="field"><label>Paste rough notes about a role or project</label><textarea class="input" id="resume-raw" placeholder="e.g. i built the events app, got 800 users, did the frontend in react"></textarea></div>
            <button type="button" class="btn secondary" id="polish">Polish into a summary</button>
            <div id="bullets" class="mt16"></div>
          </div>
        </div>

        <div class="between">
          <span class="tiny muted">Readiness updates automatically as you save.</span>
          <button class="btn" type="submit">Save CV</button>
        </div>
      </form>`;

    // Add / remove repeatable rows.
    const adders = { edu: ['edu-list', eduRow], proj: ['proj-list', projRow], exp: ['exp-list', expRow] };
    $$('[data-add]', content).forEach((b) => b.addEventListener('click', () => {
      const [listId, tmpl] = adders[b.dataset.add];
      $('#' + listId, content).insertAdjacentHTML('beforeend', tmpl({}));
      const empty = $('#' + b.dataset.add + '-empty', content);
      if (empty) empty.style.display = 'none';
    }));
    content.addEventListener('click', (e) => {
      const rm = e.target.closest('[data-remove]');
      if (rm) rm.closest('.cv-row').remove();
    });

    $('#cvf', content).addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const patch = Object.fromEntries(fd.entries());
      patch.skills = parseList(patch.skills);
      patch.education = collectRows(content, '#edu-list');
      patch.projects = collectRows(content, '#proj-list');
      patch.experience = collectRows(content, '#exp-list');
      if (!patch.education.some((row) => row.institution)) {
        return toast('Add at least one education entry (institution name).', 'error');
      }
      try {
        await API.updateProfile(patch);
        toast('CV saved.', 'success');
      } catch (err) {
        toast(err.message, 'error');
      }
    });

    $('#polish', content).addEventListener('click', async () => {
      const raw = $('#resume-raw').value.trim();
      if (!raw) return toast('Add some notes first.', 'error');
      $('#bullets').innerHTML = `<div class="skeleton" style="height:70px"></div>`;
      try {
          const { paragraph, source } = await API.polishResume(raw, profile.headline);
          $('#ai-src').textContent = source === 'claude' ? 'Claude' : 'Built-in';
          $('#bullets').innerHTML = `<p style="color:var(--ink);font-size:14px;line-height:1.6;">${esc(paragraph)}</p>`;
      } catch (err) {
        $('#bullets').innerHTML = errorState(err.message);
      }
    });
  } catch (err) {
    content.innerHTML = errorState(err.message);
  }
};

/* CV builder — repeatable row templates and collector. Each input carries a
   data-k key; collectRows() turns a list of rows back into an array of objects. */
function eduRow(e = {}) {
  return `
    <div class="cv-row">
      <div class="row wrap">
        <div class="field" style="margin:0;flex:2"><label>Institution name</label><input class="input" data-k="institution" value="${esc(e.institution)}" placeholder="Universiti Teknologi PETRONAS" /></div>
        <div class="field" style="margin:0;flex:2"><label>Field of study</label><input class="input" data-k="fieldOfStudy" value="${esc(e.fieldOfStudy)}" placeholder="BSc Computer Science" /></div>
      </div>
      <div class="row wrap">
        <div class="field" style="margin:0"><label>Start year</label><input class="input" data-k="startYear" value="${esc(e.startYear)}" placeholder="2022" /></div>
        <div class="field" style="margin:0"><label>End year</label><input class="input" data-k="endYear" value="${esc(e.endYear)}" placeholder="2026 (or expected)" /></div>
        <button type="button" class="btn small ghost danger" data-remove style="align-self:flex-end">Remove</button>
      </div>
    </div>`;
}
function projRow(p = {}) {
  return `
    <div class="cv-row">
      <div class="row wrap">
        <div class="field" style="margin:0;flex:2"><label>Project name</label><input class="input" data-k="name" value="${esc(p.name)}" placeholder="Campus Events App" /></div>
        <button type="button" class="btn small ghost danger" data-remove style="align-self:flex-end">Remove</button>
      </div>
      <div class="field" style="margin:0"><label>Description</label><textarea class="input" data-k="description" placeholder="What you built and the impact.">${esc(p.description)}</textarea></div>
    </div>`;
}
function expRow(x = {}) {
  return `
    <div class="cv-row">
      <div class="row wrap">
        <div class="field" style="margin:0;flex:2"><label>Role title</label><input class="input" data-k="title" value="${esc(x.title)}" placeholder="Software Engineering Intern" /></div>
        <div class="field" style="margin:0;flex:2"><label>Organisation</label><input class="input" data-k="organisation" value="${esc(x.organisation || x.org)}" placeholder="Helix Software" /></div>
      </div>
      <div class="row wrap">
        <div class="field" style="margin:0"><label>Period</label><input class="input" data-k="period" value="${esc(x.period || x.when)}" placeholder="Jun–Aug 2025" /></div>
        <button type="button" class="btn small ghost danger" data-remove style="align-self:flex-end">Remove</button>
      </div>
      <div class="field" style="margin:0"><label>Description</label><textarea class="input" data-k="description" placeholder="What you did and achieved.">${esc(x.description || x.detail)}</textarea></div>
    </div>`;
}
function collectRows(root, listSel) {
  return $$(`${listSel} > .cv-row`, root).map((row) => {
    const obj = {};
    $$('[data-k]', row).forEach((inp) => { obj[inp.dataset.k] = inp.value.trim(); });
    return obj;
  }).filter((obj) => Object.values(obj).some((v) => v)); // drop fully-empty rows
}

/* ==========================================================================
   EMPLOYER VIEWS
   ========================================================================== */
Views.employerDashboard = async (app) => {
  mountShell(app, '#/dashboard', loadingHtml());
  const content = $('#content');
  try {
    const { jobs } = await API.myJobs();
    const totalApplicants = jobs.reduce((s, j) => s + (j.applicants || 0), 0);
    content.innerHTML = `
      <div class="page-head"><div><h1>Hiring dashboard</h1><p>Your live listings and the talent in your pipeline.</p></div><button class="btn" data-go="#/post">Post a job</button></div>
      <div class="stat-grid">
        <div class="stat-tile"><div class="n">${jobs.length}</div><div class="l">Active listings</div></div>
        <div class="stat-tile"><div class="n">${totalApplicants}</div><div class="l">Total applicants</div></div>
        <div class="stat-tile"><div class="n">${jobs.filter((j)=>j.isInternship).length}</div><div class="l">Internships</div></div>
      </div>
      <div class="section">
        <div class="section-head"><h2>Your listings</h2><a class="btn ghost small" data-go="#/myjobs">Manage all</a></div>
        <div class="card-grid">
          ${jobs.length ? jobs.map(employerJobCard).join('') : emptyState('No listings yet. Post your first job.')}
        </div>
      </div>`;
    wireGo(content);
    wireEmployerJobCards(content);
  } catch (err) {
    content.innerHTML = errorState(err.message);
  }
};

function employerJobCard(job) {
  return `
    <div class="card job-card">
      <div class="job-logo">${initials(job.company)}</div>
      <div class="job-main">
        <h3>${esc(job.title)}</h3>
        <div class="job-meta"><span>${esc(job.location||'Flexible')}</span><span>${esc(job.type)}</span><span>${timeAgo(job.postedAt)}</span></div>
        <div>${chips((job.requiredSkills||[]).slice(0,5))}</div>
      </div>
      <div class="job-side">
        <span class="badge brand">${job.applicants||0} applicants</span>
        <div class="mt8"><button class="btn small secondary" data-applicants="${job.id}">View pipeline</button></div>
      </div>
    </div>`;
}

function wireEmployerJobCards(root) {
  $$('[data-applicants]', root).forEach((b) =>
    b.addEventListener('click', () => (location.hash = `#/applicants/${b.dataset.applicants}`))
  );
}

Views.post = async (app) => {
  mountShell(app, '#/post', `
    <div class="page-head"><div><h1>Post a job</h1><p>Required skills feed the matching engine, so be specific.</p></div></div>
    <form id="jobf" class="card pad stack" style="max-width:680px;">
      <div class="field" style="margin:0"><label>Job title</label><input class="input" name="title" required placeholder="e.g. Graduate Frontend Engineer" /></div>
      <div class="row wrap">
        <div class="field" style="margin:0"><label>Location</label><input class="input" name="location" placeholder="City or Remote" /></div>
        <div class="field" style="margin:0"><label>Type</label><select class="input" name="type">${['Full-time','Internship','Part-time'].map((t)=>`<option>${t}</option>`).join('')}</select></div>
        <div class="field" style="margin:0"><label>Seniority</label><select class="input" name="seniority">${['intern','junior','mid','senior','lead'].map((s)=>`<option ${s==='junior'?'selected':''}>${s}</option>`).join('')}</select></div>
      </div>
      <div class="row wrap">
        <div class="field" style="margin:0"><label>Salary min <span class="muted tiny">(RM/yr, or RM/mo for interns)</span></label><input class="input" type="number" name="salaryMin" placeholder="36000" /></div>
        <div class="field" style="margin:0"><label>Salary max</label><input class="input" type="number" name="salaryMax" placeholder="48000" /></div>
      </div>
      <div class="flex" style="gap:20px;">
        <label class="flex" style="gap:8px;font-size:14px;font-weight:600;color:var(--ink-soft);"><input type="checkbox" name="remote" /> Remote-friendly</label>
        <label class="flex" style="gap:8px;font-size:14px;font-weight:600;color:var(--ink-soft);"><input type="checkbox" name="isInternship" /> Internship</label>
      </div>
      <div class="field" style="margin:0"><label>Required skills <span class="muted tiny">(comma-separated)</span></label><input class="input" name="requiredSkills" placeholder="React, TypeScript, Git" /></div>
      <div class="field" style="margin:0"><label>Description</label><textarea class="input" name="description" required placeholder="What the role involves, who it's for…"></textarea></div>
      <div class="right"><button class="btn" type="submit">Publish listing</button></div>
    </form>`);
  const content = $('#content');
  $('#jobf', content).addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = Object.fromEntries(fd.entries());
    payload.remote = fd.get('remote') === 'on';
    payload.isInternship = fd.get('isInternship') === 'on';
    payload.requiredSkills = parseList(payload.requiredSkills);
    payload.salaryMin = payload.salaryMin ? Number(payload.salaryMin) : null;
    payload.salaryMax = payload.salaryMax ? Number(payload.salaryMax) : null;
    try {
      await API.createJob(payload);
      toast('Listing published!', 'success');
      location.hash = '#/myjobs';
    } catch (err) {
      toast(err.message, 'error');
    }
  });
};

Views.myjobs = async (app) => {
  mountShell(app, '#/myjobs', loadingHtml());
  const content = $('#content');
  try {
    const { jobs } = await API.myJobs();
    content.innerHTML = `
      <div class="page-head"><div><h1>My listings</h1><p>Manage your roles and review applicants.</p></div><button class="btn" data-go="#/post">Post a job</button></div>
      <div class="card-grid">
        ${jobs.length ? jobs.map((j) => `
          <div class="card job-card">
            <div class="job-logo">${initials(j.company)}</div>
            <div class="job-main">
              <h3>${esc(j.title)}</h3>
              <div class="job-meta"><span>${esc(j.location||'Flexible')}</span><span>${esc(j.type)}</span><span>${timeAgo(j.postedAt)}</span></div>
              <div>${chips((j.requiredSkills||[]).slice(0,5))}</div>
            </div>
            <div class="job-side">
              <span class="badge brand">${j.applicants||0} applicants</span>
              <div class="mt8 flex" style="justify-content:flex-end;">
                <button class="btn small secondary" data-applicants="${j.id}">Pipeline</button>
                <button class="btn small danger" data-del="${j.id}">Delete</button>
              </div>
            </div>
          </div>`).join('') : emptyState('No listings yet.')}
      </div>`;
    wireGo(content);
    wireEmployerJobCards(content);
    $$('[data-del]', content).forEach((b) =>
      b.addEventListener('click', async () => {
        if (!confirm('Delete this listing and its applications?')) return;
        await API.deleteJob(b.dataset.del);
        toast('Listing deleted.');
        Views.myjobs(app);
      })
    );
  } catch (err) {
    content.innerHTML = errorState(err.message);
  }
};

Views.applicants = async (app, params) => {
  mountShell(app, '#/myjobs', loadingHtml());
  const content = $('#content');
  try {
    const { applications } = await API.jobApplications(params.id);
    const { job } = await API.getJob(params.id);
    const reload = () => Views.applicants(app, params);
    content.innerHTML = `
      <a class="btn ghost small mb16" data-go="#/myjobs">← Back to listings</a>
      <div class="page-head"><div><h1>${esc(job.title)} · pipeline</h1><p>Applicants are ranked by an explainable match score. Make a decision, view the form or CV, or message a candidate.</p></div></div>
      ${applications.length ? `<div class="stack">${applications.map((a) => applicantCard(a)).join('')}</div>` : emptyState('No applicants yet.')}`;
    wireGo(content);

    const byId = Object.fromEntries(applications.map((a) => [a.id, a]));

    // Offer / Reject — confirm before applying.
    $$('[data-offer]', content).forEach((b) => b.addEventListener('click', () =>
      confirmAction('Send offer?', 'Confirm you want to make this candidate an offer? They will be notified.', 'Confirm offer', false, async () => {
        await API.setApplicationStatus(b.dataset.offer, 'offer'); toast('Offer sent.', 'success'); reload();
      })));
    $$('[data-reject]', content).forEach((b) => b.addEventListener('click', () =>
      confirmAction('Reject applicant?', 'Confirm you want to reject this application? They will be notified.', 'Confirm reject', true, async () => {
        await API.setApplicationStatus(b.dataset.reject, 'rejected'); toast('Applicant rejected.'); reload();
      })));

    // Interview — open the scheduling calendar.
    $$('[data-interview]', content).forEach((b) => b.addEventListener('click', () =>
      openInterviewScheduler(b.dataset.interview, b.dataset.profile, reload)));

    // View-only: application form and CV are now separate buttons.
    $$('[data-viewform]', content).forEach((b) =>
      b.addEventListener('click', () => openApplicationFormModal(byId[b.dataset.viewform])));
    $$('[data-viewcv]', content).forEach((b) =>
      b.addEventListener('click', () => openCvModal(byId[b.dataset.viewcv])));

    // Chat with the candidate.
    $$('[data-chat]', content).forEach((b) =>
      b.addEventListener('click', () => (location.hash = `#/messages/${b.dataset.chat}`)));
  } catch (err) {
    content.innerHTML = errorState(err.message);
  }
};

function applicantCard(a) {
  const c = a.candidate || {};
  const m = a.match || {};
  const tier = matchTier(m.score || 0);
  const decided = ['offer', 'rejected'].includes(a.status);
  return `
    <div class="card pad">
      <div class="between wrap">
        <div class="flex">
          <div class="av" style="width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,var(--brand),var(--teal));display:grid;place-items:center;color:#fff;font-weight:700;">${initials(c.name)}</div>
          <div>
            <div class="bold">${esc(c.name || 'Candidate')}</div>
            <div class="small muted">${esc(c.headline || '')} · ${esc(c.location || '')}</div>
          </div>
        </div>
        <div class="flex">
          ${m.score != null ? `<span class="match-pill ${tier}">${m.score}% match</span>` : ''}
          <span class="status ${a.status}">${esc(a.status)}</span>
        </div>
      </div>
      <div class="mt8">${chips((c.skills||[]).slice(0,6))}</div>
      <div class="app-summary mt8">
        ${a.expectedSalary ? `<span>💰 Expects ${money(a.expectedSalary)}</span>` : ''}
        ${a.workArrangement ? `<span>🏢 ${esc(a.workArrangement)}</span>` : ''}
        ${a.preferredLocation ? `<span>📍 ${esc(a.preferredLocation)}</span>` : ''}
        ${a.earliestStartDate ? `<span>📅 From ${esc(a.earliestStartDate)}</span>` : ''}
      </div>
      ${a.coverNote ? `<p class="small muted mt8">"${esc(a.coverNote)}"</p>` : ''}

      ${a.status === 'interview' && a.interviewDate ? `
        <div class="interview-box mt8">
          <div class="small bold">📅 Interview proposed for ${esc(a.interviewDate)}</div>
          ${a.interviewResponse === 'accepted' ? `<span class="badge green mt8">Candidate accepted</span>`
            : a.interviewResponse === 'rejected' ? `<span class="badge rose mt8">Candidate declined</span><div class="tiny muted mt8">Reason: ${esc(a.interviewRejectReason)}</div>`
            : `<div class="tiny muted mt8">Awaiting the candidate's response.</div>`}
        </div>` : ''}

      <div class="mt16 flex wrap" style="gap:8px;">
        <button class="btn small" data-offer="${a.id}" ${decided ? 'disabled' : ''}>✅ Offer</button>
        <button class="btn small danger" data-reject="${a.id}" ${decided ? 'disabled' : ''}>❌ Reject</button>
        <button class="btn small secondary" data-interview="${a.id}" data-profile="${c.id || ''}">📅 Interview</button>
        <button class="btn small secondary" data-chat="${c.userId || ''}">💬 Chat</button>
        <button class="btn small ghost" data-viewform="${a.id}">📄 Application form</button>
        <button class="btn small ghost" data-viewcv="${a.id}">📑 Resume / CV</button>
      </div>
      ${m.reasons ? whyBlock(m) : ''}
    </div>`;
}

/* View-only: the submitted application form. */
function openApplicationFormModal(a) {
  const row = (label, val) => val ? `<div class="kv"><span class="k">${esc(label)}</span><span class="v">${esc(val)}</span></div>` : '';
  openModal(
    'Application form (view only)',
    `<div class="cv-doc">
      ${row('Applicant', (a.resumeSnapshot || {}).name)}
      ${row('Expected salary', a.expectedSalary != null ? money(a.expectedSalary) : '')}
      ${row('Work arrangement', a.workArrangement)}
      ${row('Preferred location', a.preferredLocation)}
      ${row('Earliest start date', a.earliestStartDate)}
      ${row('Declaration', a.declaration ? '✓ Certified accurate by applicant' : '—')}
      ${a.coverNote ? `<div class="kv"><span class="k">Cover note</span><span class="v">${esc(a.coverNote)}</span></div>` : ''}
    </div>`,
    `<button class="btn" id="close-app">Close</button>`
  );
  $('#close-app').addEventListener('click', closeModal);
}

/* View-only: the submitted CV snapshot. */
function openCvModal(a) {
  const cv = a.resumeSnapshot || {};
  const eduHtml = (cv.education || []).filter((e) => e.institution).map((e) =>
    `<li><b>${esc(e.fieldOfStudy || 'Studies')}</b> — ${esc(e.institution)} <span class="muted tiny">${esc(e.startYear)}${e.endYear ? '–' + esc(e.endYear) : ''}</span></li>`).join('');
  const projHtml = (cv.projects || []).map((p) =>
    `<li><b>${esc(p.name)}</b>${p.description ? ' — ' + esc(p.description) : ''}</li>`).join('');
  const expHtml = (cv.experience || []).map((x) =>
    `<li><b>${esc(x.title)}</b>${x.organisation || x.org ? ' · ' + esc(x.organisation || x.org) : ''} <span class="muted tiny">${esc(x.period || x.when || '')}</span>${x.description || x.detail ? `<div class="tiny muted">${esc(x.description || x.detail)}</div>` : ''}</li>`).join('');
  openModal(
    `Resume / CV — ${cv.name || 'Candidate'} (view only)`,
    `<div class="cv-doc">
      <div class="kv"><span class="k">Contact</span><span class="v">${esc(cv.email || '')}${cv.phone ? ' · ' + esc(cv.phone) : ''}${cv.location ? ' · ' + esc(cv.location) : ''}${cv.linkedin ? ' · ' + esc(cv.linkedin) : ''}</span></div>
      ${cv.summary ? `<div class="kv"><span class="k">Summary</span><span class="v">${esc(cv.summary)}</span></div>` : ''}
      <div class="cv-block"><div class="small bold">Education</div><ul>${eduHtml || '<li class="muted">—</li>'}</ul></div>
      ${projHtml ? `<div class="cv-block"><div class="small bold">Projects</div><ul>${projHtml}</ul></div>` : ''}
      ${expHtml ? `<div class="cv-block"><div class="small bold">Work experience</div><ul>${expHtml}</ul></div>` : ''}
      <div class="cv-block"><div class="small bold">Skills</div><div class="mt8">${chips(cv.skills || [])}</div></div>
    </div>`,
    `<button class="btn" id="close-cv">Close</button>`
  );
  $('#close-cv').addEventListener('click', closeModal);
}

/* Interview scheduler — a month calendar where the candidate's busy days are
   marked (dates only, no details). The final date choice is the employer's. */
async function openInterviewScheduler(appId, profileId, onDone) {
  let busy = [];
  try {
    const res = await API.candidateBusy(profileId);
    busy = res.busyDates || [];
  } catch { busy = []; }

  let view = new Date();
  let selected = null;

  openModal(
    'Schedule interview',
    `<p class="small muted">Pick a date. <span style="color:var(--rose)">Red</span> = the candidate is busy that day (details stay private). The final choice is yours.</p>
     <div id="sched-cal"></div>
     <div class="mt8 small">Selected: <b id="sched-sel">none</b> <span id="sched-warn" class="tiny" style="color:var(--amber)"></span></div>`,
    `<button class="btn secondary" id="cancel">Cancel</button><button class="btn" id="ok" disabled>Propose interview</button>`
  );

  const render = () => {
    const marks = {};
    busy.forEach((d) => { marks[d] = { cls: 'busy' }; });
    if (selected) marks[selected] = { cls: 'selected' };
    $('#sched-cal').innerHTML = renderCalendar(view.getFullYear(), view.getMonth(), marks, true);
    // navigation
    $('#cal-prev', $('#sched-cal')).addEventListener('click', () => { view = new Date(view.getFullYear(), view.getMonth() - 1, 1); render(); });
    $('#cal-next', $('#sched-cal')).addEventListener('click', () => { view = new Date(view.getFullYear(), view.getMonth() + 1, 1); render(); });
    $$('.cal-cell[data-date]', $('#sched-cal')).forEach((cell) => cell.addEventListener('click', () => {
      selected = cell.dataset.date;
      $('#sched-sel').textContent = selected;
      $('#sched-warn').textContent = busy.includes(selected) ? '· note: candidate is busy this day' : '';
      $('#ok').disabled = false;
      render();
    }));
  };
  render();

  $('#cancel').addEventListener('click', closeModal);
  $('#ok').addEventListener('click', async () => {
    if (!selected) return;
    try {
      await API.setApplicationStatus(appId, 'interview', { interviewDate: selected });
      closeModal();
      toast('Interview proposed.', 'success');
      onDone && onDone();
    } catch (err) { toast(err.message, 'error'); }
  });
}

Views.talent = async (app) => {
  mountShell(app, '#/talent', loadingHtml());
  const content = $('#content');
  try {
    const { jobs } = await API.myJobs();
    if (!jobs.length) {
      content.innerHTML = `<div class="page-head"><div><h1>Find talent</h1></div></div>${emptyState('Post a job first — talent is matched against your roles.')}`;
      wireGo(content);
      return;
    }
    content.innerHTML = `
      <div class="page-head"><div><h1>Find talent</h1><p>Spot the right person before they’re publicly looking — matched to one of your roles, with reasons.</p></div></div>
      <div class="card pad mb16"><div class="field" style="margin:0"><label>Match candidates against</label>
        <select class="input" id="jobpick">${jobs.map((j)=>`<option value="${j.id}">${esc(j.title)}</option>`).join('')}</select></div></div>
      <div id="talent-results">${loadingHtml()}</div>`;
    wireGo(content);
    const run = async () => {
      const id = $('#jobpick').value;
      const box = $('#talent-results');
      box.innerHTML = loadingHtml();
      try {
        const { matches } = await API.jobCandidates(id);
        box.innerHTML = matches.length
          ? `<div class="stack">${matches.map((m) => `
            <div class="card pad">
              <div class="between wrap">
                <div class="flex">
                  <div class="av" style="width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,var(--brand),var(--teal));display:grid;place-items:center;color:#fff;font-weight:700;">${initials(m.profile.name)}</div>
                  <div><div class="bold">${esc(m.profile.name)}</div><div class="small muted">${esc(m.profile.headline||'')} · ${esc(m.profile.location||'')}</div></div>
                </div>
                <span class="match-pill ${matchTier(m.score)}">${m.score}% match</span>
              </div>
              <div class="mt8">${chips((m.profile.skills||[]).slice(0,6))}</div>
              <div class="mt8"><button class="btn small secondary" data-chat="${m.profile.userId || ''}">💬 Message candidate</button></div>
              ${whyBlock(m)}
            </div>`).join('')}</div>`
          : emptyState('No strong matches for this role yet.');
        $$('[data-chat]', box).forEach((b) =>
          b.addEventListener('click', () => (location.hash = `#/messages/${b.dataset.chat}`)));
      } catch (err) {
        box.innerHTML = errorState(err.message);
      }
    };
    $('#jobpick', content).addEventListener('change', run);
    run();
  } catch (err) {
    content.innerHTML = errorState(err.message);
  }
};

Views.employerProfile = async (app) => {
  mountShell(app, '#/profile', loadingHtml());
  const content = $('#content');
  const { profile } = await API.getProfile();
  content.innerHTML = `
    <div class="page-head"><div><h1>Company profile</h1><p>How candidates see your organisation.</p></div></div>
    <form id="ef" class="card pad stack" style="max-width:600px;">
      <div class="field" style="margin:0"><label>Company name</label><input class="input" name="companyName" value="${esc(profile.companyName)}" /></div>
      <div class="row wrap">
        <div class="field" style="margin:0"><label>Industry</label><input class="input" name="industry" value="${esc(profile.industry)}" /></div>
        <div class="field" style="margin:0"><label>Location</label><input class="input" name="location" value="${esc(profile.location)}" /></div>
      </div>
      <div class="field" style="margin:0"><label>Website</label><input class="input" name="website" value="${esc(profile.website)}" placeholder="https://" /></div>
      <div class="field" style="margin:0"><label>About</label><textarea class="input" name="about">${esc(profile.about)}</textarea></div>
      <div class="right"><button class="btn" type="submit">Save</button></div>
    </form>`;
  $('#ef', content).addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await API.updateProfile(Object.fromEntries(new FormData(e.target).entries()));
      toast('Saved.', 'success');
    } catch (err) { toast(err.message, 'error'); }
  });
};

/* ==========================================================================
   UNIVERSITY VIEWS  — the three modules
   ========================================================================== */
Views.universityDashboard = async (app) => {
  mountShell(app, '#/dashboard', loadingHtml());
  const content = $('#content');
  try {
    const data = await API.outcomes();
    const s = data.summary;
    content.innerHTML = `
      <div class="page-head"><div><h1>Lifelong Outcome Loop</h1><p>Where your graduates actually end up — tracked for years, not months. So the next cohort is taught with real outcomes behind it.</p></div><span class="badge brand">Module 01</span></div>

      <div class="stat-grid">
        <div class="stat-tile"><div class="n">${s.tracked}</div><div class="l">Graduates tracked</div><div class="sub">${s.stillTrackedAfter5y} still tracked 5+ years out</div></div>
        <div class="stat-tile"><div class="n">${s.employmentRate}%</div><div class="l">In work or further study</div></div>
        <div class="stat-tile"><div class="n">${money(s.medianSalary) || '—'}</div><div class="l">Median salary</div></div>
      </div>

      <div class="section">
        <div class="section-head"><h2>Outcomes by cohort — the loop that keeps going</h2></div>
        <div class="card pad">
          ${data.cohorts.map((c) => `
            <div class="mb16">
              <div class="between"><span class="small bold">Class of ${c.gradYear} <span class="muted">· ${c.total} grads</span></span><span class="small muted">${c.employmentRate}% placed · ${money(c.medianSalary)||'—'} median</span></div>
              ${bar(c.employmentRate, 'green')}
            </div>`).join('')}
        </div>
      </div>

      <div class="row wrap" style="align-items:flex-start;">
        <div class="section" style="flex:1;min-width:280px;">
          <div class="section-head"><h2>Where they land</h2></div>
          <div class="card pad">
            ${data.topEmployers.map((e) => `<div class="between mb8"><span class="small">${esc(e.name)}</span><span class="badge">${e.count} grad${e.count>1?'s':''}</span></div>`).join('') || '<div class="muted small">No employer data yet.</div>'}
          </div>
        </div>
        <div class="section" style="flex:1;min-width:280px;">
          <div class="section-head"><h2>Which programs paid off</h2></div>
          <div class="card pad">
            ${data.programs.map((p) => `<div class="mb16"><div class="between"><span class="small bold">${esc(p.program)}</span><span class="small muted">${money(p.medianSalary)||'—'}</span></div>${bar(p.employmentRate)}</div>`).join('')}
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-head"><h2>Recent tracked outcomes</h2></div>
        <div class="card">
          <table class="data">
            <thead><tr><th>Graduate</th><th>Program</th><th>Class</th><th>Outcome</th><th>Salary</th></tr></thead>
            <tbody>${data.recent.map((o) => `
              <tr><td class="bold">${esc(o.name)}</td><td>${esc(o.program)}</td><td>${o.gradYear}</td>
              <td>${o.status==='employed'?`${esc(o.role)} · ${esc(o.employer)}`:`<span class="muted">${esc(o.status)}</span>`}</td>
              <td>${money(o.salary)||'—'}</td></tr>`).join('')}</tbody>
          </table>
        </div>
      </div>`;
    wireGo(content);
  } catch (err) {
    content.innerHTML = errorState(err.message);
  }
};

Views.students = async (app) => {
  mountShell(app, '#/students', loadingHtml());
  const content = $('#content');
  try {
    const data = await API.students();
    const dist = data.distribution;
    content.innerHTML = `
      <div class="page-head"><div><h1>Adaptive Readiness</h1><p>"Ready for the world" as a live signal, built from each student’s real work — so you can intervene early.</p></div><span class="badge brand">Module 03</span></div>

      <div class="stat-grid">
        <div class="stat-tile"><div class="n">${data.students.length}</div><div class="l">Students tracked</div></div>
        <div class="stat-tile"><div class="n">${data.averageReadiness}</div><div class="l">Average readiness</div></div>
        <div class="stat-tile"><div class="n" style="color:var(--rose)">${data.needsAttention}</div><div class="l">Need early support</div><div class="sub">Readiness below 45</div></div>
        <div class="stat-tile"><div class="n" style="color:var(--green)">${dist['Job-ready']}</div><div class="l">Job-ready now</div></div>
      </div>

      <div class="section">
        <div class="section-head"><h2>Cohort distribution</h2></div>
        <div class="card pad">
          ${Object.entries(dist).map(([band, count]) => `
            <div class="between mb8"><span class="small bold">${esc(band)}</span><span class="small muted">${count} student${count===1?'':'s'}</span></div>
            ${bar(data.students.length ? (count/data.students.length)*100 : 0, band==='Job-ready'?'green':band==='Early stage'?'rose':'')}`).join('')}
        </div>
      </div>

      <div class="section">
        <div class="section-head"><h2>Students · lowest readiness first</h2></div>
        <div class="stack">
          ${data.students.map((st) => `
            <div class="card pad">
              <div class="between wrap">
                <div><span class="bold">${esc(st.name)}</span> ${st.needsAttention?'<span class="badge rose">Needs support</span>':''}<div class="small muted">${esc(st.headline||'')}</div></div>
                <div class="right"><div class="bold">${st.readiness.overall}/100</div><div class="tiny muted">${esc(st.readiness.band)}</div></div>
              </div>
              <div class="mt8" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;">
                ${st.readiness.dimensions.map((d)=>`<div><div class="tiny muted">${esc(d.label)}</div>${bar(d.value)}</div>`).join('')}
              </div>
              ${st.needsAttention ? `<div class="why mt16"><div class="why-head">Suggested intervention</div><ul>${st.readiness.nextSteps.map((s)=>`<li class="gap">${esc(s)}</li>`).join('')}</ul></div>` : ''}
            </div>`).join('')}
        </div>
      </div>`;
    wireGo(content);
  } catch (err) {
    content.innerHTML = errorState(err.message);
  }
};

Views.marketplace = async (app) => {
  mountShell(app, '#/marketplace', loadingHtml());
  const content = $('#content');
  try {
    const [{ internships }, placementData] = await Promise.all([
      API.internships(),
      API.placements(),
    ]);
    const ps = placementData.summary;
    content.innerHTML = `
      <div class="page-head"><div><h1>Live Internship Marketplace</h1><p>Matching students to internships like the best apps match people — and tracking which placements actually led somewhere.</p></div><span class="badge brand">Module 04</span></div>

      <div class="stat-grid">
        <div class="stat-tile"><div class="n">${internships.length}</div><div class="l">Open internships</div></div>
        <div class="stat-tile"><div class="n">${ps.total}</div><div class="l">Placements to date</div></div>
        <div class="stat-tile"><div class="n">${ps.meaningfulRate}%</div><div class="l">Led somewhere meaningful</div></div>
        <div class="stat-tile"><div class="n">${ps.converted}</div><div class="l">Converted to offers</div></div>
      </div>

      <div class="section">
        <div class="section-head"><h2>Open internships · best student matches</h2></div>
        <div class="stack">
          ${internships.map((row) => `
            <div class="card pad">
              <div class="between wrap">
                <div class="flex"><div class="job-logo">${initials(row.job.company)}</div>
                  <div><div class="bold">${esc(row.job.title)}</div><div class="small muted">${esc(row.job.company)} · ${esc(row.job.location||'Flexible')}</div></div></div>
                <div>${chips((row.job.requiredSkills||[]).slice(0,4))}</div>
              </div>
              <div class="divider"></div>
              <div class="small bold mb8">Top student matches</div>
              ${row.topMatches.length ? row.topMatches.map((m)=>`
                <div class="between mb8"><div><span class="bold small">${esc(m.student.name)}</span> <span class="muted tiny">${esc(m.student.headline||'')}</span></div><span class="match-pill ${matchTier(m.score)}">${m.score}%</span></div>
                <div class="tiny muted mb16" style="padding-left:2px;">${esc((m.reasons||[])[0]||'')}</div>`).join('') : '<div class="muted small">No strong cohort matches yet.</div>'}
            </div>`).join('')}
        </div>
      </div>

      <div class="section">
        <div class="section-head"><h2>Placement history</h2></div>
        <div class="card">
          <table class="data">
            <thead><tr><th>Student</th><th>Employer</th><th>Role</th><th>Outcome</th></tr></thead>
            <tbody>${placementData.placements.map((p)=>`
              <tr><td class="bold">${esc(p.studentName)}</td><td>${esc(p.employer)}</td><td>${esc(p.role)}</td>
              <td>${p.convertedToOffer?'<span class="badge green">Offer</span>':p.ledSomewhere?'<span class="badge teal">Led somewhere</span>':'<span class="badge">Completed</span>'}</td></tr>`).join('')}</tbody>
          </table>
        </div>
      </div>`;
    wireGo(content);
  } catch (err) {
    content.innerHTML = errorState(err.message);
  }
};

Views.curriculum = async (app) => {
  mountShell(app, '#/curriculum', loadingHtml());
  const content = $('#content');
  try {
    const data = await API.skillsGap();
    content.innerHTML = `
      <div class="page-head"><div><h1>Skills gap</h1><p>What the live job market is asking for, against what your cohort actually has. Low-coverage, high-demand skills are curriculum candidates.</p></div><span class="badge brand">Curriculum signal</span></div>
      <div class="card pad mb16"><p class="small muted">${esc(data.note)} · Cohort size: ${data.cohortSize}</p></div>
      <div class="card">
        <table class="data">
          <thead><tr><th>Skill</th><th>Market demand</th><th>Cohort coverage</th><th></th></tr></thead>
          <tbody>${data.gaps.map((g)=>`
            <tr>
              <td class="bold">${esc(g.skill)}</td>
              <td>${g.demandCount} posting${g.demandCount===1?'':'s'}</td>
              <td style="width:200px;">${bar(g.coverage, g.coverage<34?'rose':g.coverage<67?'amber':'green')}<span class="tiny muted">${g.coverage}% of cohort</span></td>
              <td>${g.coverage<34?'<span class="badge rose">Priority</span>':g.coverage<67?'<span class="badge amber">Watch</span>':'<span class="badge green">Covered</span>'}</td>
            </tr>`).join('')}</tbody>
        </table>
      </div>`;
    wireGo(content);
  } catch (err) {
    content.innerHTML = errorState(err.message);
  }
};

Views.universitySettings = async (app) => {
  mountShell(app, '#/profile', loadingHtml());
  const content = $('#content');
  const { profile } = await API.getProfile();
  content.innerHTML = `
    <div class="page-head"><div><h1>Institution settings</h1><p>Your institution’s details and programs.</p></div></div>
    <form id="uf" class="card pad stack" style="max-width:600px;">
      <div class="field" style="margin:0"><label>University name</label><input class="input" name="name" value="${esc(profile.name)}" /></div>
      <div class="field" style="margin:0"><label>Country</label><input class="input" name="country" value="${esc(profile.country)}" /></div>
      <div class="field" style="margin:0"><label>Programs <span class="muted tiny">(comma-separated)</span></label><input class="input" name="programs" value="${esc((profile.programs||[]).join(', '))}" /></div>
      <div class="right"><button class="btn" type="submit">Save</button></div>
    </form>`;
  $('#uf', content).addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.target).entries());
    fd.programs = parseList(fd.programs);
    try { await API.updateProfile(fd); toast('Saved.', 'success'); }
    catch (err) { toast(err.message, 'error'); }
  });
};

/* ==========================================================================
   MESSAGES (chat) · CALENDAR · NOTIFICATIONS  — candidate + employer
   ========================================================================== */

/* --- Messages: conversation list ----------------------------------------- */
Views.messages = async (app) => {
  mountShell(app, '#/messages', loadingHtml());
  const content = $('#content');
  try {
    const { threads } = await API.messageThreads();
    content.innerHTML = `
      <div class="page-head"><div><h1>Messages</h1><p>Your conversations.${Session.user.role === 'candidate' ? ' Employers can message you first; then you can reply.' : ' Start a chat from Find talent or an applicant.'}</p></div></div>
      ${threads.length ? `<div class="stack">${threads.map((t) => `
        <div class="card pad chat-row" data-open="${t.other.id}" style="cursor:pointer">
          <div class="between">
            <div class="flex">
              <div class="av" style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,var(--brand),var(--teal));display:grid;place-items:center;color:#fff;font-weight:700;">${initials(t.other.name)}</div>
              <div><div class="bold">${esc(t.other.name)} ${t.unread ? '<span class="badge brand">new</span>' : ''}</div><div class="small muted">${esc(t.lastMessage).slice(0, 60)}</div></div>
            </div>
            <div class="tiny muted">${timeAgo(t.lastAt)}</div>
          </div>
        </div>`).join('')}</div>` : emptyState('No conversations yet.')}`;
    wireGo(content);
    $$('[data-open]', content).forEach((el) =>
      el.addEventListener('click', () => (location.hash = `#/messages/${el.dataset.open}`)));
  } catch (err) {
    content.innerHTML = errorState(err.message);
  }
};

/* --- Messages: a single conversation (polls for new messages) ------------ */
Views.thread = async (app, params) => {
  mountShell(app, '#/messages', loadingHtml());
  const content = $('#content');
  const otherId = params.id;

  async function paint() {
    const { messages, other, canReply } = await API.messageThread(otherId);
    content.innerHTML = `
      <a class="btn ghost small mb16" data-go="#/messages">← All messages</a>
      <div class="page-head"><div><h1>${esc(other.name)}</h1><p>${esc(other.role)}</p></div></div>
      <div class="card pad">
        <div class="chat-log" id="chat-log">
          ${messages.length ? messages.map((m) => `
            <div class="bubble ${m.mine ? 'mine' : 'theirs'}">${esc(m.body)}<div class="bubble-time">${timeAgo(m.at)}</div></div>`).join('')
            : '<div class="muted small" style="text-align:center;padding:20px;">No messages yet.</div>'}
        </div>
        ${canReply ? `
        <form id="chat-form" class="flex mt16" style="gap:8px;">
          <input class="input" id="chat-input" placeholder="Type a message…" autocomplete="off" style="flex:1;" />
          <button class="btn" type="submit">Send</button>
        </form>` : `<div class="hint mt16">You can reply once an employer messages you first.</div>`}
      </div>`;
    wireGo(content);
    const log = $('#chat-log');
    if (log) log.scrollTop = log.scrollHeight;
    const form = $('#chat-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const input = $('#chat-input');
        const body = input.value.trim();
        if (!body) return;
        input.value = '';
        try { await API.sendMessage(otherId, body); await paint(); }
        catch (err) { toast(err.message, 'error'); }
      });
    }
  }

  try {
    await paint();
    // Light polling so an open chat feels live (cleared on navigation).
    addPolling(async () => {
      try {
        const log = $('#chat-log');
        if (!log) return;
        const atBottom = log.scrollHeight - log.scrollTop - log.clientHeight < 40;
        const { messages } = await API.messageThread(otherId);
        const bubbles = $$('.bubble', log).length;
        if (messages.length !== bubbles) {
          log.innerHTML = messages.map((m) => `<div class="bubble ${m.mine ? 'mine' : 'theirs'}">${esc(m.body)}<div class="bubble-time">${timeAgo(m.at)}</div></div>`).join('');
          if (atBottom) log.scrollTop = log.scrollHeight;
        }
      } catch { /* ignore */ }
    }, 3000);
  } catch (err) {
    content.innerHTML = errorState(err.message);
  }
};

/* --- Calendar: personal daily schedule ----------------------------------- */
Views.calendar = async (app) => {
  mountShell(app, '#/calendar', loadingHtml());
  const content = $('#content');
  let view = new Date();
  let events = [];

  async function load() {
    events = (await API.schedule()).events || [];
    render();
  }
  function render() {
    const marks = {};
    events.forEach((e) => { marks[e.date] = { cls: 'has-event' }; });
    const upcoming = [...events].sort((a, b) => a.date.localeCompare(b.date));
    content.innerHTML = `
      <div class="page-head"><div><h1>My calendar</h1><p>Add your schedule so you can plan around it. Click a day to add or view entries.</p></div></div>
      <div class="card pad">
        <div id="cal-host">${renderCalendar(view.getFullYear(), view.getMonth(), marks, true)}</div>
      </div>
      <div class="section">
        <div class="section-head"><h2>Upcoming</h2></div>
        <div class="card">
          ${upcoming.length ? `<table class="data"><tbody>${upcoming.map((e) => `
            <tr><td class="bold" style="width:130px;">${esc(e.date)}</td><td>${esc(e.title)}</td>
            <td class="right"><button class="btn small ghost danger" data-del="${e.id}">Remove</button></td></tr>`).join('')}</tbody></table>`
            : emptyState('No schedule entries yet.')}
        </div>
      </div>`;
    wireGo(content);
    $('#cal-prev', content).addEventListener('click', () => { view = new Date(view.getFullYear(), view.getMonth() - 1, 1); render(); });
    $('#cal-next', content).addEventListener('click', () => { view = new Date(view.getFullYear(), view.getMonth() + 1, 1); render(); });
    $$('.cal-cell[data-date]', content).forEach((cell) =>
      cell.addEventListener('click', () => openDayModal(cell.dataset.date, events, load)));
    $$('[data-del]', content).forEach((b) => b.addEventListener('click', async () => {
      await API.deleteScheduleEvent(b.dataset.del); toast('Removed.'); load();
    }));
  }
  try { await load(); } catch (err) { content.innerHTML = errorState(err.message); }
};

function openDayModal(date, events, onChange) {
  const dayEvents = events.filter((e) => e.date === date);
  openModal(
    `Schedule — ${date}`,
    `${dayEvents.length ? `<div class="stack mb16">${dayEvents.map((e) => `<div class="between"><span class="small">${esc(e.title)}</span><button class="btn small ghost danger" data-del="${e.id}">Remove</button></div>`).join('')}</div>` : '<p class="small muted">Nothing scheduled.</p>'}
     <div class="field" style="margin-top:12px;"><label>Add an entry</label><input class="input" id="ev-title" placeholder="e.g. Class 9am, exam, busy" /></div>`,
    `<button class="btn secondary" id="cancel">Close</button><button class="btn" id="add">Add</button>`
  );
  $('#cancel').addEventListener('click', closeModal);
  $('#add').addEventListener('click', async () => {
    const title = $('#ev-title').value.trim();
    if (!title) return toast('Enter a title.', 'error');
    try { await API.addScheduleEvent(date, title); closeModal(); toast('Added.', 'success'); onChange(); }
    catch (err) { toast(err.message, 'error'); }
  });
  $$('[data-del]', $('#modal-bg')).forEach((b) => b.addEventListener('click', async () => {
    await API.deleteScheduleEvent(b.dataset.del); closeModal(); toast('Removed.'); onChange();
  }));
}

/* --- Notifications -------------------------------------------------------- */
Views.notifications = async (app) => {
  mountShell(app, '#/notifications', loadingHtml());
  const content = $('#content');
  try {
    const { notifications } = await API.notifications();
    content.innerHTML = `
      <div class="page-head"><div><h1>Notifications</h1><p>Application activity and interview updates. Incoming chat shows in Messages.</p></div>
        ${notifications.some((n) => !n.read) ? '<button class="btn secondary" id="mark">Mark all read</button>' : ''}</div>
      ${notifications.length ? `<div class="stack">${notifications.map((n) => `
        <div class="card pad notif ${n.read ? '' : 'unread'}" ${n.link ? `data-go="${n.link}"` : ''} style="${n.link ? 'cursor:pointer' : ''}">
          <div class="between"><span>${esc(n.text)}</span><span class="tiny muted">${timeAgo(n.createdAt)}</span></div>
        </div>`).join('')}</div>` : emptyState('No notifications yet.')}`;
    wireGo(content);
    const mark = $('#mark', content);
    if (mark) mark.addEventListener('click', async () => {
      await API.markNotificationsRead(); toast('Marked read.'); Views.notifications(app);
    });
  } catch (err) {
    content.innerHTML = errorState(err.message);
  }
};

/* --- Calendar renderer (shared by Calendar + interview scheduler) --------- */
function renderCalendar(year, month, marks = {}, nav = false) {
  const monthName = new Date(year, month, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dow = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push('');
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const m = marks[key];
    cells.push(`<div class="cal-cell ${m ? m.cls : ''}" data-date="${key}">${d}</div>`);
  }
  while (cells.length % 7 !== 0) cells.push('');
  const body = cells.map((c) => c || '<div class="cal-cell empty"></div>').join('');
  return `
    <div class="cal">
      <div class="cal-bar">
        ${nav ? '<button type="button" class="btn small ghost" id="cal-prev">‹</button>' : '<span></span>'}
        <span class="cal-title">${monthName}</span>
        ${nav ? '<button type="button" class="btn small ghost" id="cal-next">›</button>' : '<span></span>'}
      </div>
      <div class="cal-grid">
        ${dow.map((d) => `<div class="cal-dow">${d}</div>`).join('')}
        ${body}
      </div>
    </div>`;
}

/* --- Confirm dialog (Confirm / Cancel) ----------------------------------- */
function confirmAction(title, message, okLabel, danger, onConfirm) {
  openModal(title, `<p class="small">${esc(message)}</p>`,
    `<button class="btn secondary" id="cancel">Cancel</button><button class="btn ${danger ? 'danger' : ''}" id="ok">${esc(okLabel)}</button>`);
  $('#cancel').addEventListener('click', closeModal);
  $('#ok').addEventListener('click', async () => {
    try { await onConfirm(); closeModal(); }
    catch (err) { toast(err.message, 'error'); }
  });
}

/* --- shared bits ---------------------------------------------------------- */
function emptyState(msg) {
  return `<div class="empty"><span class="ic">🗂️</span>${esc(msg)}</div>`;
}
function errorState(msg) {
  return `<div class="empty"><span class="ic">⚠️</span>${esc(msg)}</div>`;
}
function wireGo(root) {
  $$('[data-go]', root).forEach((el) =>
    el.addEventListener('click', (e) => {
      e.preventDefault();
      location.hash = el.dataset.go;
    })
  );
}
