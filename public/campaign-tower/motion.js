// Campaign Tower site motion: kinetic type, elevator doors, pixel particles and toys.
// Everything here is decoration. With reduced motion on, the page is complete without it.
(() => {
  const root = document.documentElement;
  if (!root.classList.contains('motion')) return;   // set in <head> unless reduced motion is on
  window.__motion = true;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const PAL = ['#F2C94C', '#3FBF5F', '#E04B4B', '#3B82F6', '#F28C28', '#8B5CF6', '#F4F1EA'];
  const GOLD = ['#F2C94C', '#FFE9A8', '#F28C28'];
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[Math.random() * a.length | 0];

  /* ---------- Pixel particles: one fixed canvas, asleep when empty ---------- */
  const cv = document.createElement('canvas');
  cv.className = 'fx'; cv.setAttribute('aria-hidden', 'true');
  document.body.appendChild(cv);
  const ctx = cv.getContext('2d');
  let W = 0, H = 0;
  const resize = () => {
    const dpr = Math.min(2, devicePixelRatio || 1);
    W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize(); addEventListener('resize', resize);
  const parts = [];
  let running = false, lastScroll = scrollY;
  const frame = () => {
    // Particles live in page space: scrolling carries them along with the page.
    const dy = scrollY - lastScroll; lastScroll = scrollY;
    ctx.clearRect(0, 0, W, H);
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life -= 1 / 60;
      if (p.life <= 0) { parts.splice(i, 1); continue; }
      if (p.trail && p.vy > -1.2) { p.onPeak(p); parts.splice(i, 1); continue; }   // a rocket bursts at its peak
      p.vy += p.g; p.vx *= p.drag; p.vy *= p.drag;
      p.x += p.vx; p.y += p.vy - dy;
      ctx.globalAlpha = Math.min(1, p.life / p.fade);
      if (p.text) {
        ctx.font = p.font; ctx.textAlign = 'center';
        ctx.fillStyle = '#14141B'; ctx.fillText(p.text, p.x + 2, p.y + 2);
        ctx.fillStyle = p.c; ctx.fillText(p.text, p.x, p.y);
      } else {
        ctx.fillStyle = p.c;
        ctx.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s);
        if (p.trail) { ctx.globalAlpha *= .5; ctx.fillRect(Math.round(p.x), Math.round(p.y + 6), p.s, p.s * 2); }
      }
    }
    ctx.globalAlpha = 1;
    if (parts.length) requestAnimationFrame(frame); else running = false;
  };
  const wake = () => { if (!running) { running = true; lastScroll = scrollY; requestAnimationFrame(frame); } };
  function burst(x, y, n, o = {}) {
    const cols = o.colors || PAL;
    for (let i = 0; i < n; i++) {
      const a = (o.angle ?? -Math.PI / 2) + (Math.random() - .5) * (o.spread ?? Math.PI * 2);
      const v = (o.speed ?? 6) * rnd(.35, 1.15);
      parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: o.g ?? .22, drag: o.drag ?? .975,
        s: (o.size ?? 4) * (Math.random() < .25 ? 2 : 1), c: pick(cols), life: (o.life ?? 1.2) * rnd(.6, 1.2), fade: .45 });
    }
    wake();
  }
  function floatText(x, y, text, c = '#F2C94C', size = 16) {
    parts.push({ x, y, vx: 0, vy: -1.6, g: .02, drag: .985, text, font: `700 ${size}px Silkscreen, monospace`, c, life: 1.2, fade: .45 });
    wake();
  }
  function rocket(x, yStart, yPeak) {
    const v = -Math.sqrt(2 * .16 * Math.max(60, yStart - yPeak));
    parts.push({ x, y: yStart, vx: rnd(-.6, .6), vy: v, g: .16, drag: 1, s: 4, c: '#FFE9A8', life: 4, fade: .2, trail: true,
      onPeak: p => {
        const cols = pick([[...GOLD, '#fff'], ['#E04B4B', '#F28C28', '#fff'], ['#3B82F6', '#8B5CF6', '#fff'], ['#3FBF5F', '#F2C94C', '#fff']]);
        burst(p.x, p.y, 46, { speed: 5.5, g: .07, drag: .965, colors: cols, life: 1.6, size: 4 });
      } });
    wake();
  }

  /* ---------- Click anywhere for a tip, like landing a visitor ---------- */
  let streak = 0, streakAt = 0;
  addEventListener('pointerdown', e => {
    if (e.button !== 0 || e.target.closest('a,button,video,input,.track,.badge,#get')) return;
    const now = performance.now();
    streak = now - streakAt < 700 ? streak + 1 : 0; streakAt = now;
    if (streak > 0 && streak % 5 === 0) {
      floatText(e.clientX, e.clientY - 8, 'PERFECT! +$40', '#3FBF5F', 18);
      burst(e.clientX, e.clientY, 30, { colors: GOLD, speed: 7 });
    } else {
      floatText(e.clientX, e.clientY - 8, '+$' + pick([5, 8, 10, 12, 15]));
      burst(e.clientX, e.clientY, 10, { colors: GOLD, size: 3, speed: 3.5 });
    }
  });

  /* ---------- Buttons: sparks on hover, confetti on press ---------- */
  document.querySelectorAll('.btn,.arrows button').forEach(b => {
    b.addEventListener('pointerenter', () => {
      if (!fine) return;
      const r = b.getBoundingClientRect();
      for (let i = 0; i < 4; i++) {
        const side = i % 2 ? r.right : r.left;
        burst(side, rnd(r.top, r.bottom), 3, { angle: i % 2 ? 0 : Math.PI, spread: 1.2, speed: 3, size: 3, g: .08, life: .6, colors: GOLD });
      }
    });
    b.addEventListener('pointerdown', e => {
      const r = b.getBoundingClientRect();
      burst(e.clientX || r.left + r.width / 2, r.top + r.height / 2, 40, { speed: 8, spread: Math.PI * 1.4 });
    });
  });

  /* ---------- Hero headline: letters stack in like floors, then the last line slams down ---------- */
  const splitLetters = el => {
    let i = 0;
    const walk = node => [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/( )/).forEach(word => {
          if (word === ' ') { frag.append(' '); return; }
          if (!word) return;
          const w = document.createElement('span'); w.className = 'w';
          [...word].forEach(ch => {
            const s = document.createElement('span'); s.className = 'ch'; s.textContent = ch;
            s.style.setProperty('--i', i++); s.style.setProperty('--rot', rnd(-24, 24).toFixed(1) + 'deg');
            w.append(s);
          });
          frag.append(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) walk(n);
    });
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    [...el.children].forEach(c => c.setAttribute('aria-hidden', 'true'));
    walk(el);
    return i;
  };
  const h1 = document.querySelector('.hero h1');
  const hero = document.querySelector('.hero');
  if (h1) {
    const em = h1.querySelector('em');
    const n = splitLetters(h1);
    h1.classList.add('kinetic');
    const firstEm = em ? Number(em.querySelector('.ch')?.style.getPropertyValue('--i')) : n;
    // Letters before the punchline cascade fast; the punchline waits, then lands in one hit.
    const landAt = 200 + firstEm * 18 + 380;
    if (em) em.querySelectorAll('.ch').forEach(c => c.style.setProperty('--delay', landAt + 'ms'));
    setTimeout(() => {
      if (!em) return;
      em.classList.add('slam');
      hero.classList.add('shake');
      const r = em.getBoundingClientRect();
      burst(r.left + r.width * .2, r.bottom, 14, { angle: Math.PI, spread: .9, speed: 4, g: .12, colors: ['#F4F1EA', '#C2E7FA', '#8E8C98'], size: 4 });
      burst(r.right - r.width * .2, r.bottom, 14, { angle: 0, spread: .9, speed: 4, g: .12, colors: ['#F4F1EA', '#C2E7FA', '#8E8C98'], size: 4 });
      setTimeout(() => hero.classList.remove('shake'), 420);
    }, landAt + 330);
    setTimeout(() => h1.classList.add('done'), landAt + 900);
  }

  /* ---------- Hero depth: the city leans with the pointer ---------- */
  if (fine && hero) {
    const layers = [...hero.querySelectorAll('.scene .layer')];
    const depth = { 'clouds-far': 6, clouds: 12, flyers: 18, far: 10, near: 22 };
    const phone = hero.querySelector('.phone');
    let tx = 0, ty = 0, cx = 0, cy = 0, live = false;
    const step = () => {
      cx += (tx - cx) * .08; cy += (ty - cy) * .08;
      layers.forEach(l => { const d = depth[[...l.classList].find(c => depth[c])] || 0; l.style.translate = `${(-cx * d).toFixed(1)}px ${(-cy * d * .3).toFixed(1)}px`; });
      if (phone) phone.style.transform = `perspective(900px) rotateY(${(cx * 6).toFixed(2)}deg) rotateX(${(-cy * 4).toFixed(2)}deg)`;
      if (Math.abs(tx - cx) + Math.abs(ty - cy) > .001) requestAnimationFrame(step); else live = false;
    };
    hero.addEventListener('pointermove', e => {
      const r = hero.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width - .5; ty = (e.clientY - r.top) / r.height - .5;
      if (!live) { live = true; requestAnimationFrame(step); }
    });
    hero.addEventListener('pointerleave', () => { tx = 0; ty = 0; if (!live) { live = true; requestAnimationFrame(step); } });
  }

  /* ---------- Section headings: words slot up into place ---------- */
  const heads = [...document.querySelectorAll('.floor h2,.tour h2,#get h2')];
  heads.forEach(h => {
    const words = h.textContent.trim().split(/\s+/);
    h.setAttribute('aria-label', h.textContent.trim());
    h.innerHTML = words.map((w, i) => `<span class="wd" aria-hidden="true"><span class="wi" style="--i:${i}">${w.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</span></span>`).join(' ');
    h.classList.add('words');
  });

  /* ---------- Elevator doors open on each floor ---------- */
  document.querySelectorAll('.floor').forEach(f => {
    const d = document.createElement('div');
    d.className = 'doors'; d.setAttribute('aria-hidden', 'true');
    d.innerHTML = `<i></i><i></i><b>${f.dataset.floor ? f.dataset.floor + 'F' : ''}</b>`;
    f.prepend(d);
  });

  /* ---------- Facts: digits spin like a slot machine ---------- */
  const reels = box => box.querySelectorAll('b').forEach(b => {
    const v = b.textContent.trim();
    if (!/^\d+$/.test(v)) return;
    b.setAttribute('aria-label', v);
    b.innerHTML = [...v].map((d, i) => `<span class="reel" aria-hidden="true"><span style="--to:${10 + Number(d)};--i:${i}">${'01234567890123456789'.split('').join('<br>')}</span></span>`).join('');
  });
  document.querySelectorAll('.facts').forEach(reels);

  /* ---------- One observer for the arrivals ---------- */
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    const t = e.target;
    t.classList.add(t.classList.contains('doors') ? 'open' : 'in');
    if (t.classList.contains('facts')) {
      setTimeout(() => { const r = t.getBoundingClientRect(); burst(r.left + r.width / 2, r.top, 24, { colors: GOLD, speed: 6 }); }, 1500);
    }
    io.unobserve(t);
  }), { rootMargin: '0px 0px -22% 0px' });
  document.querySelectorAll('.doors,.words,.facts').forEach(el => io.observe(el));

  /* ---------- Staff badges: knock them and they swing on the lanyard ---------- */
  const badges = [...document.querySelectorAll('.badge')].map(el => ({ el, a: 0, v: 0 }));
  let swinging = false;
  const swing = () => {
    let busy = false;
    badges.forEach(b => {
      b.v += -b.a * .045; b.v *= .955; b.a += b.v;
      if (Math.abs(b.a) > .05 || Math.abs(b.v) > .05) busy = true; else { b.a = 0; b.v = 0; }
      b.el.style.rotate = b.a.toFixed(2) + 'deg';
    });
    if (busy) requestAnimationFrame(swing); else swinging = false;
  };
  const shove = (b, f) => { b.v += f; if (!swinging) { swinging = true; requestAnimationFrame(swing); } };
  badges.forEach(b => {
    b.el.addEventListener('pointermove', e => { if (e.pointerType === 'mouse') shove(b, Math.max(-3, Math.min(3, e.movementX * .12))); });
    b.el.addEventListener('click', e => {
      shove(b, (Math.random() < .5 ? -1 : 1) * 14);
      const r = b.el.getBoundingClientRect();
      floatText(r.left + r.width / 2, r.top + 20, pick(['Hired!', 'Promoted!', 'Dream role!', '+1 skill']), '#3FBF5F');
      burst(e.clientX, e.clientY, 18, { speed: 5 });
    });
  });

  /* ---------- Client marquee: scrolling the page revs it up and leans it over ---------- */
  const marquee = document.querySelector('.marquee');
  const rows = marquee ? [...marquee.querySelectorAll('.row')] : [];
  let vel = 0, prevY = scrollY, revving = false;
  const rev = () => {
    vel *= .9;
    const k = Math.min(1, Math.abs(vel) / 60);
    rows.forEach((r, i) => { const a = r.getAnimations()[0]; if (a) a.playbackRate = 1 + k * 7; });
    marquee.style.setProperty('--sk', (Math.max(-12, Math.min(12, -vel * .25))).toFixed(2) + 'deg');
    if (Math.abs(vel) > .3) requestAnimationFrame(rev); else { revving = false; marquee.style.setProperty('--sk', '0deg'); rows.forEach(r => { const a = r.getAnimations()[0]; if (a) a.playbackRate = 1; }); }
  };
  addEventListener('scroll', () => {
    const y = scrollY; vel = vel * .5 + (y - prevY) * .5; prevY = y;
    if (marquee && !revving) { revving = true; requestAnimationFrame(rev); }
  }, { passive: true });

  /* ---------- Screenshot cards tilt toward the pointer ---------- */
  if (fine) document.querySelectorAll('.tour .card,.beat').forEach(c => {
    c.addEventListener('pointermove', e => {
      const r = c.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      c.style.transform = `perspective(800px) rotateY(${(x * 14).toFixed(1)}deg) rotateX(${(-y * 10).toFixed(1)}deg) translateY(-8px)`;
      c.style.setProperty('--gx', ((x + .5) * 100).toFixed(0) + '%'); c.style.setProperty('--gy', ((y + .5) * 100).toFixed(0) + '%');
    });
    c.addEventListener('pointerleave', () => { c.style.transform = ''; });
  });

  /* ---------- Rooftop: fireworks while you're up there, and one wherever you tap ---------- */
  const roof = document.getElementById('get');
  if (roof) {
    let shown = false, timer = 0;
    const launch = (x, y) => {
      const r = roof.getBoundingClientRect();
      const top = Math.max(r.top, 0) + 40, bottom = Math.min(r.bottom, H);
      if (bottom - top < 120) return;
      rocket(x ?? rnd(r.left + 40, r.right - 40), bottom - 20, y ?? rnd(top, top + (bottom - top) * .45));
    };
    const show = () => { if (!shown) return; launch(); timer = setTimeout(show, rnd(700, 1500)); };
    new IntersectionObserver(([e]) => {
      shown = e.isIntersecting; clearTimeout(timer);
      if (shown && !document.hidden) { launch(); timer = setTimeout(show, 600); }
    }, { threshold: .35 }).observe(roof);
    roof.addEventListener('pointerdown', e => { if (!e.target.closest('a')) launch(e.clientX, e.clientY); });
  }
})();
