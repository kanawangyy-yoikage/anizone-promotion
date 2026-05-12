/* ════════════════════════════════════════
   AniZone 2026 — main.js
   Particles · Cursor · Scroll · Tilt · etc
   ════════════════════════════════════════ */

(function () {
  'use strict';

  /* ──────────────────────────────────────
     1. CURSOR GLOW
     ────────────────────────────────────── */
  const cursorGlow = document.getElementById('cursorGlow');
  let mouseX = 0, mouseY = 0;
  let glowX = 0, glowY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function animateCursor() {
    glowX += (mouseX - glowX) * 0.08;
    glowY += (mouseY - glowY) * 0.08;
    if (cursorGlow) {
      cursorGlow.style.left = glowX + 'px';
      cursorGlow.style.top  = glowY + 'px';
    }
    requestAnimationFrame(animateCursor);
  }
  animateCursor();

  /* ──────────────────────────────────────
     2. CANVAS PARTICLES
     ────────────────────────────────────── */
  const canvas = document.getElementById('particles');
  const ctx    = canvas.getContext('2d');
  let W, H;
  let particles = [];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const COLORS = ['rgba(108,99,255,', 'rgba(0,229,255,', 'rgba(255,107,107,', 'rgba(255,215,0,'];

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x     = Math.random() * W;
      this.y     = Math.random() * H;
      this.size  = Math.random() * 1.8 + 0.4;
      this.vx    = (Math.random() - 0.5) * 0.35;
      this.vy    = (Math.random() - 0.5) * 0.35;
      this.alpha = Math.random() * 0.45 + 0.08;
      this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
      this.life  = 0;
      this.maxLife = 200 + Math.random() * 400;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.life++;
      if (this.life > this.maxLife || this.x < -5 || this.x > W + 5 || this.y < -5 || this.y > H + 5) {
        this.reset();
      }
    }
    draw() {
      const fade = this.life < 40 ? this.life / 40 : this.life > this.maxLife - 40 ? (this.maxLife - this.life) / 40 : 1;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = this.color + (this.alpha * fade) + ')';
      ctx.fill();
    }
  }

  // Init
  for (let i = 0; i < 80; i++) {
    const p = new Particle();
    p.life = Math.floor(Math.random() * p.maxLife);
    particles.push(p);
  }

  // Occasional shooting stars
  class ShootingStar {
    constructor() {
      this.x  = Math.random() * W;
      this.y  = Math.random() * H * 0.5;
      this.len = 80 + Math.random() * 120;
      this.speed = 5 + Math.random() * 8;
      this.alpha = 0;
      this.alive = true;
      this.life  = 0;
      this.maxLife = 50 + Math.random() * 30;
    }
    update() {
      this.x    += this.speed * 1.2;
      this.y    += this.speed * 0.5;
      this.life ++;
      this.alpha = this.life < 10 ? this.life / 10 : this.life > this.maxLife - 10 ? (this.maxLife - this.life) / 10 : 0.85;
      if (this.life >= this.maxLife) this.alive = false;
    }
    draw() {
      const grad = ctx.createLinearGradient(this.x, this.y, this.x - this.len, this.y - this.len * 0.4);
      grad.addColorStop(0, 'rgba(255,255,255,' + this.alpha + ')');
      grad.addColorStop(1, 'rgba(108,99,255,0)');
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x - this.len, this.y - this.len * 0.4);
      ctx.strokeStyle = grad;
      ctx.lineWidth   = 1.5;
      ctx.stroke();
    }
  }

  let stars = [];
  let starTimer = 0;

  function drawFrame() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => { p.update(); p.draw(); });

    // Shooting stars
    starTimer++;
    if (starTimer > 220 + Math.random() * 200) {
      stars.push(new ShootingStar());
      starTimer = 0;
    }
    stars = stars.filter(s => s.alive);
    stars.forEach(s => { s.update(); s.draw(); });

    requestAnimationFrame(drawFrame);
  }
  drawFrame();

  /* ──────────────────────────────────────
     3. NAV SCROLL EFFECT
     ────────────────────────────────────── */
  const navbar = document.getElementById('navbar');
  let lastScrollY = 0;

  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (navbar) {
      if (y > 40) navbar.classList.add('scrolled');
      else         navbar.classList.remove('scrolled');

      // Hide on scroll down, show on scroll up
      if (y > lastScrollY + 4 && y > 120) {
        navbar.style.transform = 'translateY(-100%)';
      } else if (y < lastScrollY - 4) {
        navbar.style.transform = 'translateY(0)';
      }
      lastScrollY = y;
    }
  }, { passive: true });

  if (navbar) navbar.style.transition = 'transform 0.4s cubic-bezier(0.4,0,0.2,1), background 0.3s, box-shadow 0.3s';

  /* ──────────────────────────────────────
     4. SCROLL REVEAL
     ────────────────────────────────────── */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const delay = e.target.dataset.delay || 0;
        setTimeout(() => {
          e.target.classList.add('visible');
        }, parseInt(delay));
        revealObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  /* ──────────────────────────────────────
     5. CARD TILT EFFECT (3D glass)
     ────────────────────────────────────── */
  function addTilt(cards) {
    cards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const cx   = rect.left + rect.width  / 2;
        const cy   = rect.top  + rect.height / 2;
        const dx   = (e.clientX - cx) / (rect.width  / 2);
        const dy   = (e.clientY - cy) / (rect.height / 2);
        const rotX = -dy * 5;
        const rotY =  dx * 5;
        card.style.transform = `translateY(-6px) scale(1.01) perspective(600px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
        card.style.transition = 'all 0.5s cubic-bezier(0.34,1.56,0.64,1)';
      });
      card.addEventListener('mouseenter', () => {
        card.style.transition = 'all 0.15s ease';
      });
    });
  }

  addTilt(document.querySelectorAll('.feature-card'));
  addTilt(document.querySelectorAll('.stat-glass'));

  /* ──────────────────────────────────────
     6. LIQUID GLASS CARD SHIMMER
        Move cursor → shimmer shifts
     ────────────────────────────────────── */
  document.querySelectorAll('.feature-card, .flow-box, .dev-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width  * 100).toFixed(1);
      const y = ((e.clientY - rect.top)  / rect.height * 100).toFixed(1);
      card.style.setProperty('--mx', x + '%');
      card.style.setProperty('--my', y + '%');
      card.style.background = `
        radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.03) 50%, transparent 70%),
        var(--glass-bg)
      `;
    });
    card.addEventListener('mouseleave', () => {
      card.style.background = '';
    });
  });

  /* ──────────────────────────────────────
     7. HERO TITLE CHAR ANIMATION
     ────────────────────────────────────── */
  document.querySelectorAll('.char-animate').forEach(el => {
    const isLine2 = el.classList.contains('line2');

    // line2 (gradient text): DON'T split into chars — gradient must span full text
    // Just animate the whole element with a smooth entrance
    if (isLine2) {
      el.style.cssText = `
        animation: line2Enter 0.8s cubic-bezier(0.34,1.56,0.64,1) both;
        animation-delay: 0.35s;
      `;
      return;
    }

    // line1: split into chars for the stagger effect
    const text = el.textContent;
    el.textContent = '';
    [...text].forEach((char, i) => {
      const span = document.createElement('span');
      span.textContent = char === ' ' ? '\u00A0' : char;
      span.style.cssText = `
        display: inline-block;
        animation: charIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both;
        animation-delay: ${0.2 + i * 0.04}s;
      `;
      el.appendChild(span);
    });
  });

  // Inject char animation keyframe
  const charStyle = document.createElement('style');
  charStyle.textContent = `
    @keyframes charIn {
      from { opacity:0; transform: translateY(30px) rotateX(-40deg); }
      to   { opacity:1; transform: translateY(0) rotateX(0deg); }
    }
    @keyframes line2Enter {
      from { opacity:0; transform: translateY(36px) skewX(-4deg); filter: blur(6px); }
      to   { opacity:1; transform: translateY(0) skewX(0deg); filter: blur(0); }
    }
  `;
  document.head.appendChild(charStyle);

  /* ──────────────────────────────────────
     8. COUNTER ANIMATION (stats)
     ────────────────────────────────────── */
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const el  = e.target;
        const val = el.dataset.count;
        if (!val || isNaN(val)) return;
        const target = parseInt(val);
        let current  = 0;
        const step   = Math.ceil(target / 30) || 1;
        const tick   = setInterval(() => {
          current = Math.min(current + step, target);
          el.textContent = current;
          if (current >= target) clearInterval(tick);
        }, 40);
        counterObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('.stat-num[data-count]').forEach(el => counterObserver.observe(el));

  /* ──────────────────────────────────────
     9. SMOOTH ANCHOR SCROLL
     ────────────────────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href').slice(1);
      const el = document.getElementById(id);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ──────────────────────────────────────
     10. PARALLAX (subtle hero bg)
     ────────────────────────────────────── */
  const heroBg   = document.querySelector('.hero-bg');
  const heroGrid = document.querySelector('.hero-grid-line');

  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (heroBg)   heroBg.style.transform   = `translateY(${y * 0.25}px)`;
    if (heroGrid) heroGrid.style.transform = `translateY(${y * 0.12}px)`;
  }, { passive: true });

  /* ──────────────────────────────────────
     11. FLOW BOX STAGGER REVEAL
     ────────────────────────────────────── */
  const flowBoxes = document.querySelectorAll('.flow-box');
  const flowObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        flowBoxes.forEach((fb, i) => {
          setTimeout(() => {
            fb.style.opacity   = '1';
            fb.style.transform = 'none';
          }, i * 120);
        });
        flowObserver.disconnect();
      }
    });
  }, { threshold: 0.2 });

  flowBoxes.forEach(fb => {
    fb.style.opacity   = '0';
    fb.style.transform = 'translateX(-20px)';
    fb.style.transition = 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.34,1.56,0.64,1)';
  });
  if (flowBoxes.length) flowObserver.observe(flowBoxes[0]);

  /* ──────────────────────────────────────
     12. TECH CHIP WAVE ANIMATION
     ────────────────────────────────────── */
  document.querySelectorAll('.tech-chip').forEach((chip, i) => {
    chip.style.animationDelay = `${i * 0.1}s`;
  });

  /* ──────────────────────────────────────
     13. PAGE LOAD FADE-IN
     ────────────────────────────────────── */
  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity 0.5s ease';
  window.addEventListener('DOMContentLoaded', () => {});
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.body.style.opacity = '1';
    });
  });

})();
