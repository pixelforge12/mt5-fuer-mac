/* =============================================
   MT5 MAC GUIDE — SCRIPT.JS
   - EUR/USD live rate widget
   - Mini sparkline chart
   - Currency converter
   - Accordion FAQ
   - Navbar scroll effect
   - Mobile nav toggle
   ============================================= */

// ---- NAVBAR: scroll shadow ----
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 10);
}, { passive: true });

// ---- MOBILE NAV TOGGLE ----
const navToggle = document.getElementById('navToggle');
const navLinks  = document.querySelector('.nav-links');
if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });
  // close when link clicked
  navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => navLinks.classList.remove('open'));
  });
}

// ---- MINI SPARKLINE CHART (Canvas) ----
const rateHistory = [];
const MAX_POINTS  = 20;

function drawSparkline(canvas, data) {
  if (!canvas || data.length < 2) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 0.0001;

  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * W,
    y: H - ((v - min) / range) * (H - 12) - 6
  }));

  // gradient fill
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0,   'rgba(79,70,229,0.22)');
  grad.addColorStop(1,   'rgba(79,70,229,0)');

  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // line
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
  ctx.strokeStyle = '#4F46E5';
  ctx.lineWidth   = 2;
  ctx.lineJoin    = 'round';
  ctx.stroke();

  // current dot
  const last = pts[pts.length - 1];
  ctx.beginPath();
  ctx.arc(last.x, last.y, 4, 0, Math.PI * 2);
  ctx.fillStyle   = '#F97316';
  ctx.fill();
}

// ---- LIVE EUR/USD RATE ----
let prevRate = null;

async function fetchRate() {
  try {
    const res  = await fetch('https://api.frankfurter.app/latest?from=EUR&to=USD');
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    const rate = data.rates.USD;

    // update history
    rateHistory.push(rate);
    if (rateHistory.length > MAX_POINTS) rateHistory.shift();

    // DOM updates
    const rateEl   = document.getElementById('eur-usd-rate');
    const changeEl = document.getElementById('rate-change');
    const timeEl   = document.getElementById('rate-time');

    if (rateEl) rateEl.textContent = rate.toFixed(4);
    if (timeEl) timeEl.textContent = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (changeEl && prevRate !== null) {
      const diff = ((rate - prevRate) / prevRate) * 100;
      const sign = diff >= 0 ? '+' : '';
      changeEl.textContent  = `${sign}${diff.toFixed(3)}%`;
      changeEl.style.color  = diff >= 0 ? '#16A34A' : '#DC2626';
    }

    prevRate = rate;

    const canvas = document.getElementById('miniChart');
    drawSparkline(canvas, rateHistory);

  } catch (e) {
    const rateEl = document.getElementById('eur-usd-rate');
    if (rateEl) rateEl.textContent = '—';
  }
}

fetchRate();
setInterval(fetchRate, 30000);

// ---- CURRENCY CONVERTER ----
let convTimeout = null;

async function convertCurrency() {
  const amountEl = document.getElementById('conv-amount');
  const fromEl   = document.getElementById('conv-from');
  const toEl     = document.getElementById('conv-to');
  const resultEl = document.getElementById('conv-result');
  const rateInfo = document.getElementById('conv-rate');

  if (!amountEl || !fromEl || !toEl || !resultEl) return;

  const amount = parseFloat(amountEl.value) || 0;
  const from   = fromEl.value;
  const to     = toEl.value;

  if (from === to) {
    resultEl.value   = amount.toFixed(4);
    if (rateInfo) rateInfo.textContent = `1 ${from} = 1.0000 ${to}`;
    return;
  }

  resultEl.value = '…';

  try {
    const res  = await fetch(`https://api.frankfurter.app/latest?from=${from}&to=${to}`);
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    const rate = data.rates[to];

    resultEl.value = (amount * rate).toFixed(4);
    if (rateInfo) {
      rateInfo.textContent = `1 ${from} = ${rate.toFixed(4)} ${to} · Aktualisiert: ${new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr`;
    }
  } catch (e) {
    resultEl.value = 'Fehler';
    if (rateInfo) rateInfo.textContent = 'API nicht erreichbar – bitte erneut versuchen.';
  }
}

// debounced auto-convert on input
function debounceConvert() {
  clearTimeout(convTimeout);
  convTimeout = setTimeout(convertCurrency, 350);
}

const convAmount = document.getElementById('conv-amount');
const convFrom   = document.getElementById('conv-from');
const convTo     = document.getElementById('conv-to');

if (convAmount) convAmount.addEventListener('input', debounceConvert);
if (convFrom)   convFrom.addEventListener('change', convertCurrency);
if (convTo)     convTo.addEventListener('change', convertCurrency);

// initial load
convertCurrency();

// ---- FAQ ACCORDION ----
document.querySelectorAll('.accordion-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const isOpen = btn.getAttribute('aria-expanded') === 'true';
    const body   = btn.nextElementSibling;

    // close all
    document.querySelectorAll('.accordion-btn').forEach(b => {
      b.setAttribute('aria-expanded', 'false');
      b.nextElementSibling.classList.remove('open');
    });

    // open clicked if it was closed
    if (!isOpen) {
      btn.setAttribute('aria-expanded', 'true');
      body.classList.add('open');
    }
  });
});

// ---- SMOOTH SCROLL for anchor links ----
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      const offset = 80;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});

// ---- INTERSECTION OBSERVER: fade-in sections ----
const observer = new IntersectionObserver(
  entries => entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity  = '1';
      entry.target.style.transform = 'translateY(0)';
      observer.unobserve(entry.target);
    }
  }),
  { threshold: 0.08 }
);

document.querySelectorAll('.stat-card, .info-card, .account-card, .ea-card, .problem-card').forEach(el => {
  el.style.opacity   = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'opacity 0.45s ease, transform 0.45s ease';
  observer.observe(el);
});
