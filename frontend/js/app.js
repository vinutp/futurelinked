/* ==========================================================================
   Router + bootstrap.
   A tiny hash router. Routes map a path pattern to a view function. Auth-gated
   routes bounce unauthenticated users to the landing page.
   ========================================================================== */

const app = document.getElementById('app');

const ROUTES = [
  { pattern: /^#\/$/, view: Views.landing, public: true },
  { pattern: /^#\/login$/, view: (el, p) => Views.auth(el, p, 'login'), public: true },
  { pattern: /^#\/register$/, view: (el, p) => Views.auth(el, p, 'register'), public: true },

  { pattern: /^#\/dashboard$/, view: Views.dashboard },
  { pattern: /^#\/jobs$/, view: Views.jobs },
  { pattern: /^#\/job\/(?<id>[^/]+)$/, view: Views.job },
  { pattern: /^#\/apply\/(?<id>[^/]+)$/, view: Views.apply },
  { pattern: /^#\/applications$/, view: Views.applications },
  { pattern: /^#\/paths$/, view: Views.paths },
  { pattern: /^#\/profile$/, view: Views.profile },

  { pattern: /^#\/messages$/, view: Views.messages },
  { pattern: /^#\/messages\/(?<id>[^/]+)$/, view: Views.thread },
  { pattern: /^#\/calendar$/, view: Views.calendar },
  { pattern: /^#\/notifications$/, view: Views.notifications },

  { pattern: /^#\/post$/, view: Views.post },
  { pattern: /^#\/myjobs$/, view: Views.myjobs },
  { pattern: /^#\/applicants\/(?<id>[^/]+)$/, view: Views.applicants },
  { pattern: /^#\/talent$/, view: Views.talent },

  { pattern: /^#\/students$/, view: Views.students },
  { pattern: /^#\/marketplace$/, view: Views.marketplace },
  { pattern: /^#\/curriculum$/, view: Views.curriculum },
];

async function route() {
  const hash = location.hash || '#/';
  const match = ROUTES.find((r) => r.pattern.test(hash));

  // Unknown route → home or dashboard.
  if (!match) {
    location.hash = Session.isAuthed ? '#/dashboard' : '#/';
    return;
  }

  // Auth gate.
  if (!match.public && !Session.isAuthed) {
    location.hash = '#/login';
    return;
  }
  // Authed users shouldn't sit on the marketing/auth pages.
  if (match.public && Session.isAuthed && hash !== '#/') {
    // allow landing, but push away from login/register
    if (hash === '#/login' || hash === '#/register') {
      location.hash = '#/dashboard';
      return;
    }
  }

  const params = match.pattern.exec(hash)?.groups || {};
  try {
    window.scrollTo(0, 0);
    await match.view(app, params);
  } catch (err) {
    console.error(err);
    app.innerHTML = `<div class="empty"><span class="ic">⚠️</span>${err.message}</div>`;
  }
}

window.addEventListener('hashchange', route);

// Boot: validate any stored session, then route.
(async function boot() {
  if (Session.isAuthed) {
    try {
      await API.me(); // confirms the token is still valid
    } catch {
      Session.clear();
    }
  }
  if (!location.hash) location.hash = Session.isAuthed ? '#/dashboard' : '#/';
  route();
})();
