'use strict';
document.documentElement.classList.add('js');

/* Event dates: change them here only (Morocco time, UTC+1) */
const EVENT = {
  year: 2027,
  start: new Date('2027-10-21T09:00:00+01:00'),
  end: new Date('2027-10-22T17:00:00+01:00'),
  day2: new Date('2027-10-22T00:00:00+01:00')
};

/* 1. Countdown: before, during and after the event */
(function () {
  const el = document.getElementById('countdown');
  if (!el) return;
  let timer;
  const tick = () => {
    const now = new Date();
    if (now >= EVENT.end) {
      el.textContent = `Thanks everyone, the ${EVENT.year} edition is over.`;
      clearInterval(timer);
      return;
    }
    if (now >= EVENT.start) { el.textContent = 'The event is on right now!'; return; }
    const d = EVENT.start - now, DAY = 864e5, H = 36e5, M = 6e4;
    el.textContent = `Starts in ${Math.floor(d / DAY)}d ${Math.floor(d % DAY / H)}h ${Math.floor(d % H / M)}min`;
  };
  tick();
  if (new Date() < EVENT.end) timer = setInterval(tick, 30000);
})();

/* 2. Schedule: accessible tabs (progressive enhancement) */
(function () {
  const days = [...document.querySelectorAll('[data-day]')];
  if (days.length < 2) return;

  const list = document.createElement('div');
  list.className = 'day-tabs';
  list.setAttribute('role', 'tablist');
  list.setAttribute('aria-label', 'Conference days');

  let tabs;

  const select = i => days.forEach((s, j) => {
    s.hidden = j !== i;
    tabs[j].setAttribute('aria-selected', String(j === i));
    tabs[j].tabIndex = j === i ? 0 : -1;
  });

  tabs = days.map((sec, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'day-tab';
    b.setAttribute('role', 'tab');
    b.id = 'tab-' + i;
    sec.id = 'panel-' + i;
    b.setAttribute('aria-controls', sec.id);
    sec.setAttribute('role', 'tabpanel');
    sec.setAttribute('aria-labelledby', b.id);
    b.textContent = sec.querySelector('h2').textContent;
    b.addEventListener('click', () => select(i));
    b.addEventListener('keydown', e => {
      const target = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: days.length - 1 }[e.key];
      if (target === undefined) return;
      e.preventDefault();
      const n = (target + days.length) % days.length;
      select(n);
      tabs[n].focus();
    });
    list.append(b);
    return b;
  });

  days[0].before(list);
  select(new Date() >= EVENT.day2 ? 1 : 0);

  document.querySelectorAll('.tag').forEach(t => {
    if (t.textContent.trim().toLowerCase() === 'break') t.closest('.schedule-item').classList.add('is-break');
  });
})();

/* 3. Registration: validation + confirmation (demo mode: nothing is sent without an endpoint) */
(function () {
  const form = document.querySelector('.registration-form');
  if (!form) return;

  const labels = {
    thursday: 'Thursday 21 October',
    friday: 'Friday 22 October',
    both: '21 and 22 October'
  };
  const messages = {
    fullname: 'Please enter your full name.',
    email: 'Use an address like name@domain.com.',
    phone: 'Use the format +212612345678 or 0612345678.'
  };

  form.querySelectorAll('input[type=text],input[type=email],input[type=tel]').forEach(inp => {
    const err = document.createElement('span');
    err.className = 'field-error';
    err.id = inp.id + '-error';
    err.setAttribute('aria-live', 'polite');
    inp.after(err);
    inp.setAttribute('aria-describedby', err.id);
    const check = () => {
      const bad = !inp.validity.valid && inp.value !== '';
      err.textContent = bad ? messages[inp.id] : '';
      inp.setAttribute('aria-invalid', String(bad));
    };
    inp.addEventListener('blur', check);
    inp.addEventListener('input', () => { if (err.textContent) check(); });
  });

  const endpoint = form.dataset.endpoint; // ex. https://formspree.io/f/xxxx ; empty = demo mode
  const btn = form.querySelector('.submit-btn');
  const status = document.createElement('p');
  status.className = 'field-error';
  status.setAttribute('role', 'alert');
  btn.after(status);

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const data = new FormData(form);
    status.textContent = '';

    if (endpoint) {
      btn.disabled = true;
      btn.textContent = 'Sending\u2026';
      try {
        const r = await fetch(endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
        if (!r.ok) throw new Error(r.status);
      } catch (err) {
        status.textContent = 'Something went wrong while sending. Check your connection and try again.';
        btn.disabled = false;
        btn.textContent = 'Register';
        return;
      }
    }

    const box = document.createElement('div');
    box.className = 'form-success';
    box.tabIndex = -1;
    const h = document.createElement('h2');
    h.textContent = 'Thanks, you\u2019re in (demo)';
    const p = document.createElement('p');
    p.textContent = `Thanks ${data.get('fullname')}! Your spot is saved for ${labels[data.get('attendance')]}.`;
    box.append(h, p);
    if (!endpoint) {
      const demo = document.createElement('p');
      demo.className = 'form-note';
      demo.textContent = 'Demo only: nothing was sent or stored.';
      box.append(demo);
    }
    form.replaceWith(box);
    box.focus();
  });
})();

/* 4. Speaker cards fade in as they enter the viewport */
(function () {
  const items = document.querySelectorAll('.speaker-card');
  if (!items.length || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(es => es.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
  }), { threshold: 0.15 });
  items.forEach(i => { i.classList.add('reveal'); io.observe(i); });
})();
