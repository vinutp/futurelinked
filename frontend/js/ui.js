/* ==========================================================================
   UI helpers: tiny DOM utilities, formatting, toasts, and a modal.
   No framework — just functions that return HTML strings or manipulate nodes.
   ========================================================================== */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/** Escape user-supplied text before inserting into innerHTML. */
function esc(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function initials(name) {
  return String(name || '?')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function money(n) {
  if (n == null) return null;
  return 'RM ' + Number(n).toLocaleString('en-MY');
}

function salaryRange(job) {
  if (job.isInternship && job.salaryMin) return `${money(job.salaryMin)}–${money(job.salaryMax)}/mo`;
  if (job.salaryMin && job.salaryMax) return `${money(job.salaryMin)}–${money(job.salaryMax)}`;
  if (job.salaryMin) return `from ${money(job.salaryMin)}`;
  return 'Not disclosed';
}

function timeAgo(iso) {
  const d = (Date.now() - new Date(iso).getTime()) / 86400000;
  if (d < 1) return 'today';
  if (d < 2) return 'yesterday';
  if (d < 30) return `${Math.floor(d)}d ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

/** 'YYYY-MM-DD' -> 'D/M/YYYY' (e.g. 23/2/2026). */
function fmtDateDMY(iso) {
    if (!iso) return '';
    const [y, m, d] = String(iso).split('-');
    if (!y || !m || !d) return iso;
    return `${Number(d)}/${Number(m)}/${y}`;
}

/** 24h 'HH:MM' -> 12h (e.g. '22:00' -> '10pm', '14:30' -> '2:30pm'). */
function fmtTime12(t) {
    if (!t) return '';
    const [hStr, mStr] = String(t).split(':');
    let h = Number(hStr);
    const m = Number(mStr);
    if (Number.isNaN(h)) return t;
    const ampm = h >= 12 ? 'pm' : 'am';
    h = h % 12; if (h === 0) h = 12;
    return m ? `${h}:${String(m).padStart(2, '0')}${ampm}` : `${h}${ampm}`;
}

/** Format a start/end pair, e.g. '10pm–11pm'. */
function fmtTimeRange(start, end) {
    if (!start) return '';
    return end ? `${fmtTime12(start)}–${fmtTime12(end)}` : fmtTime12(start);
}

function matchTier(score) {
  if (score >= 70) return 'high';
  if (score >= 45) return 'mid';
  return 'low';
}

function bar(value, klass = '') {
  return `<div class="bar ${klass}"><span style="width:${Math.max(0, Math.min(100, value))}%"></span></div>`;
}

function chips(list = [], klass = 'chip') {
  return list.map((s) => `<span class="${klass}">${esc(s)}</span>`).join('');
}

/** Render an explainable match block from a match result. */
function whyBlock(match) {
  const reasons = (match.reasons || []).map((r) => `<li class="good">${esc(r)}</li>`).join('');
  const gaps = (match.gaps || []).map((g) => `<li class="gap">${esc(g)}</li>`).join('');
  return `
    <div class="why">
      <div class="why-head">Why this match — ${match.score}/100</div>
      <ul>${reasons}${gaps}</ul>
      <div class="conf">Confidence: ${esc(match.confidence)} · based on the skills and details on file.</div>
    </div>`;
}

/* --- Toast ---------------------------------------------------------------- */
function toast(msg, type = '') {
  const box = $('#toast');
  const el = document.createElement('div');
  el.className = `t ${type}`;
  el.textContent = msg;
  box.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transition = 'opacity .3s';
    setTimeout(() => el.remove(), 300);
  }, 2600);
}

/* --- Modal ---------------------------------------------------------------- */
function openModal(title, bodyHtml, footHtml) {
  closeModal();
  const bg = document.createElement('div');
  bg.className = 'modal-bg';
  bg.id = 'modal-bg';
  bg.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true">
      <div class="modal-head">
        <h3>${esc(title)}</h3>
        <span class="x" id="modal-x">&times;</span>
      </div>
      <div class="modal-body">${bodyHtml}</div>
      ${footHtml ? `<div class="modal-foot">${footHtml}</div>` : ''}
    </div>`;
  document.body.appendChild(bg);
  bg.addEventListener('click', (e) => {
    if (e.target === bg) closeModal();
  });
  $('#modal-x').addEventListener('click', closeModal);
  return bg;
}
function closeModal() {
  const m = $('#modal-bg');
  if (m) m.remove();
}

/** Convert a comma/newline list into a clean array. */
function parseList(str) {
  return String(str || '')
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}
