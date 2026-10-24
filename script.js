const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (id) => document.getElementById(id);

// ----- Mobile menu -----
const menuBtn = $('menuBtn');
const navLinks = $('navLinks');

function setMenu(open) {
  navLinks.classList.toggle('open', open);
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBtn.textContent = open ? 'Close' : 'Menu';
  menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
}

menuBtn.addEventListener('click', () => setMenu(!navLinks.classList.contains('open')));
navLinks.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') setMenu(false);
});

// ----- Light/dark theme -----
const themeBtn = $('themeBtn');

function applyTheme(t) {
  document.documentElement.dataset.theme = t;
  themeBtn.textContent = t === 'dark' ? 'Light' : 'Dark';
  themeBtn.setAttribute('aria-label', 'Switch to ' + (t === 'dark' ? 'light' : 'dark') + ' mode');
  try {
    localStorage.setItem('theme', t);
  } catch (e) {}
}

applyTheme(document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');
themeBtn.addEventListener('click', () => applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));

// ----- Typing effect for the role line -----
const typed = $('typed');
if (!reduce) {
  const phrases = ['Aspiring Software Engineer', 'BSIT Student', 'Software & Web Development'];
  let phraseIndex = 0;
  let charIndex = 0;
  let deleting = false;

  (function tick() {
    const current = phrases[phraseIndex];
    typed.textContent = current.slice(0, charIndex);

    if (!deleting && charIndex === current.length) {
      deleting = phraseIndex < phrases.length - 1;
      if (!deleting) return;
      setTimeout(tick, 1400);
      return;
    }

    if (deleting && charIndex === 0) {
      deleting = false;
      phraseIndex += 1;
    }

    charIndex += deleting ? -1 : 1;
    setTimeout(tick, deleting ? 35 : 75);
  })();
}

// ----- Hero background: drifting network that reacts to the cursor -----
(function () {
  const c = $('net');
  const ctx = c.getContext('2d');
  const hero = c.parentElement;
  let w = 0;
  let h = 0;
  let pts = [];
  let visible = true;
  let mouse = { x: -999, y: -999 };

  const color = () => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();

  function size() {
    const rect = hero.getBoundingClientRect();
    const dpr = devicePixelRatio || 1;
    w = rect.width;
    h = rect.height;
    c.width = w * dpr;
    c.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    pts = Array.from({ length: Math.min(80, Math.floor((w * h) / 14000)) }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
    }));
  }

  function link(a, b, max, alpha) {
    const d = Math.hypot(a.x - b.x, a.y - b.y);
    if (d > max) return;
    ctx.globalAlpha = (1 - d / max) * alpha;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  function frame() {
    ctx.clearRect(0, 0, w, h);
    const col = color();
    ctx.fillStyle = col;
    ctx.strokeStyle = col;

    pts.forEach((a, i) => {
      if (!reduce) {
        a.x += a.vx;
        a.y += a.vy;
        if (a.x < 0 || a.x > w) a.vx *= -1;
        if (a.y < 0 || a.y > h) a.vy *= -1;
      }

      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.arc(a.x, a.y, 1.8, 0, Math.PI * 2);
      ctx.fill();

      for (let j = i + 1; j < pts.length; j++) {
        link(a, pts[j], 120, 0.25);
      }
      link(a, mouse, 160, 0.6);
    });

    ctx.globalAlpha = 1;
    if (!reduce && visible) requestAnimationFrame(frame);
  }

  hero.addEventListener('pointermove', (e) => {
    const rect = hero.getBoundingClientRect();
    mouse = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  });

  hero.addEventListener('pointerleave', () => {
    mouse = { x: -999, y: -999 };
  });

  addEventListener('resize', () => {
    size();
    if (reduce) frame();
  });

  new IntersectionObserver(([entry]) => {
    const wasVisible = visible;
    visible = entry.isIntersecting;
    if (visible && !wasVisible) frame();
  }).observe(hero);

  size();
  frame();
})();

// ----- Photo tilt following the pointer -----
const tilt = $('tilt');
const photo = tilt.querySelector('img');
if (!reduce) {
  tilt.addEventListener('pointermove', (e) => {
    const rect = tilt.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    photo.style.transform = `rotateY(${x * 14}deg) rotateX(${-y * 14}deg)`;
  });

  tilt.addEventListener('pointerleave', () => {
    photo.style.transform = '';
  });
}

// ----- Card spotlight follows the cursor -----
document.querySelectorAll('.card').forEach((card) => {
  card.addEventListener('pointermove', (e) => {
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    card.style.setProperty('--my', `${e.clientY - rect.top}px`);
  });
});

// ----- Scroll reveal with stagger -----
document.querySelectorAll('.chips').forEach((ul) => {
  [...ul.children].forEach((li, index) => li.style.setProperty('--c', index));
});

document.querySelectorAll('.two, .section').forEach((group) => {
  [...group.querySelectorAll(':scope > [data-reveal]')].forEach((el, index) => el.style.setProperty('--d', index));
});

const revealIO = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in');
      revealIO.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll('[data-reveal]').forEach((el) => revealIO.observe(el));

// ----- Scroll progress bar -----
const bar = $('progress');
function progress() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  bar.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
}
window.addEventListener('scroll', progress, { passive: true });
progress();

// ----- Active nav link -----
const links = [...navLinks.querySelectorAll('a')];
const spy = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    links.forEach((a) => a.removeAttribute('aria-current'));
    const found = links.find((a) => a.getAttribute('href') === '#' + entry.target.id);
    if (found) found.setAttribute('aria-current', 'true');
  });
}, { rootMargin: '-40% 0px -55% 0px' });

links.forEach((a) => {
  const section = document.querySelector(a.getAttribute('href'));
  if (section) spy.observe(section);
});

// ----- Copy email -----
const copyMsg = $('copyMsg');
$('copyBtn').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText('suicovincent53@gmail.com');
    copyMsg.textContent = 'Copied!';
  } catch (e) {
    copyMsg.textContent = 'Copy failed. Select the address and copy it manually.';
  }
  setTimeout(() => {
    copyMsg.textContent = '';
  }, 3000);
});

// ----- Contact form -----
const contactForm = $('contactForm');
const formStatus = $('formStatus');
const sendMessage = $('sendMessage');

contactForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  formStatus.textContent = '';
  formStatus.className = 'form-status';

  if (!contactForm.reportValidity()) return;

  const endpoint = contactForm.dataset.formEndpoint.trim();
  if (!/^https:\/\/formspree\.io\/f\/[A-Za-z0-9_-]+$/.test(endpoint)) {
    formStatus.textContent = 'The message form is not connected yet. Please email me directly using the link below.';
    formStatus.classList.add('error');
    return;
  }

  sendMessage.disabled = true;
  sendMessage.textContent = 'Sending…';
  formStatus.textContent = 'Sending your message…';

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      body: new FormData(contactForm),
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Formspree returned ${response.status}`);
    }

    contactForm.reset();
    formStatus.textContent = 'Thanks for reaching out! Your message has been sent.';
    formStatus.classList.add('success');
  } catch (error) {
    console.error('Contact form submission failed:', error);
    formStatus.textContent = 'Your message could not be sent. Please email me directly using the link below.';
    formStatus.classList.add('error');
  } finally {
    sendMessage.disabled = false;
    sendMessage.innerHTML = 'Send message <span aria-hidden="true">↗</span>';
  }
});

// ----- Footer year -----
$('year').textContent = new Date().getFullYear();
