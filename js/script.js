/* ===== SK EXAMS COUNTDOWN ===== */
const STORAGE_KEY = 'sk_custom_countdowns';
const SOUND_KEY = 'sk_sound_on';
const QUOTES = [
  "Stay focused. Your future is built one day at a time.",
  "Small progress every day adds up to big results.",
  "The exam is temporary. Your effort is permanent.",
  "Discipline beats motivation. Keep going.",
  "You don't have to be perfect — just consistent.",
  "Every hour you study is an investment in yourself.",
  "Pressure makes diamonds. You've got this.",
  "One chapter at a time. One day at a time."
];

const App = {
  exams: [],
  customs: [],
  currentExam: null,
  timerInterval: null,
  isFullscreen: false,
  soundOn: localStorage.getItem(SOUND_KEY) === '1',
  startTs: null,
  endTs: null,
  lastSecond: -1,

  async init() {
    this.setupTheme();
    this.setupParticles();
    this.loadCustoms();
    this.bindEvents();
    await this.loadExams();
    this.updateSoundBtn();
    this.showListView();
    this.checkPendingNotifications();
  },

  async loadExams() {
    try {
      const res = await fetch('./exams.json?t=' + Date.now());
      this.exams = await res.json();
    } catch {
      this.exams = [{
        id: 'neet-2027',
        name: 'NEET 2027',
        fullName: 'NEET UG 2027 Countdown',
        date: '2027-05-02T00:00:00+05:30',
        important: true
      }];
    }
  },

  loadCustoms() {
    try {
      this.customs = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      this.customs = [];
    }
  },

  saveCustoms() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.customs));
  },

  setupTheme() {
    const saved = localStorage.getItem('theme') ||
      (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    document.documentElement.setAttribute('data-theme', saved);
    this.updateThemeIcon(saved);
  },

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    this.updateThemeIcon(next);
  },

  updateThemeIcon(theme) {
    const btn = document.getElementById('theme-btn');
    if (btn) {
      btn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
      btn.title = theme === 'dark' ? 'Light mode' : 'Dark mode';
    }
  },

  updateSoundBtn() {
    const btn = document.getElementById('sound-btn');
    if (btn) btn.textContent = this.soundOn ? '🔊 Sound' : '🔇 Sound';
  },

  toast(msg) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(this._toastT);
    this._toastT = setTimeout(() => el.classList.remove('show'), 2800);
  },

  bindEvents() {
    document.getElementById('theme-btn')?.addEventListener('click', () => this.toggleTheme());
    document.getElementById('back-btn')?.addEventListener('click', () => this.showListView());
    document.getElementById('custom-back-btn')?.addEventListener('click', () => this.showListView());
    document.getElementById('fullscreen-btn')?.addEventListener('click', () => this.toggleFullscreen());
    document.getElementById('exit-fs-btn')?.addEventListener('click', () => this.exitFullscreen());
    document.getElementById('custom-card')?.addEventListener('click', () => this.showCustomForm());
    document.getElementById('start-custom-btn')?.addEventListener('click', () => this.startCustomCountdown());
    document.getElementById('remind-btn')?.addEventListener('click', () => this.setupReminder());
    document.getElementById('share-btn')?.addEventListener('click', () => this.shareCurrent());
    document.getElementById('share-header-btn')?.addEventListener('click', () => this.shareSite());
    document.getElementById('sound-btn')?.addEventListener('click', () => {
      this.soundOn = !this.soundOn;
      localStorage.setItem(SOUND_KEY, this.soundOn ? '1' : '0');
      this.updateSoundBtn();
      this.toast(this.soundOn ? 'Sound on for last 10 seconds' : 'Sound off');
    });

    document.addEventListener('fullscreenchange', () => {
      if (!document.fullscreenElement && this.isFullscreen) this.exitFullscreen(true);
    });
  },

  hideAllViews() {
    ['list-view', 'countdown-view', 'custom-form-view'].forEach(id => {
      document.getElementById(id)?.classList.remove('active');
    });
  },

  showListView() {
    this.stopTimer();
    this.currentExam = null;
    this.hideAllViews();
    document.getElementById('list-view').classList.add('active');
    this.renderSavedCustoms();
    this.renderExamList();
  },

  showCustomForm() {
    this.stopTimer();
    this.hideAllViews();
    document.getElementById('custom-form-view').classList.add('active');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateInput = document.getElementById('custom-date');
    if (dateInput) {
      dateInput.value = tomorrow.toISOString().split('T')[0];
      dateInput.min = new Date().toISOString().split('T')[0];
    }
    document.getElementById('custom-title').value = '';
  },

  daysUntil(ts) {
    return Math.ceil((ts - Date.now()) / (1000 * 60 * 60 * 24));
  },

  badgeFor(ts) {
    const d = this.daysUntil(ts);
    if (d < 0) return { text: 'Passed', cls: 'badge-passed' };
    if (d === 0) return { text: 'Today', cls: 'badge-today' };
    if (d <= 7) return { text: 'Soon', cls: 'badge-soon' };
    if (d <= 30) return { text: d + 'd', cls: 'badge-month' };
    return null;
  },

  renderSavedCustoms() {
    const box = document.getElementById('saved-customs');
    if (!box) return;
    if (!this.customs.length) {
      box.innerHTML = '';
      return;
    }
    box.innerHTML = `
      <p class="section-label">Your saved countdowns</p>
      ${this.customs.map(c => {
        const ts = new Date(c.date).getTime();
        const badge = this.badgeFor(ts);
        const dateStr = new Date(c.date).toLocaleString('en-IN', {
          day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        return `
          <div class="exam-card saved-card" data-id="${c.id}">
            <div class="exam-card-left">
              <h3>${this.escape(c.name)} ${badge ? `<span class="badge ${badge.cls}">${badge.text}</span>` : ''}</h3>
              <p>${dateStr}</p>
            </div>
            <div class="card-actions">
              <button class="icon-mini del-btn" data-id="${c.id}" title="Delete">🗑</button>
              <span class="exam-card-right">→</span>
            </div>
          </div>`;
      }).join('')}
    `;
    box.querySelectorAll('.saved-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.del-btn')) return;
        const c = this.customs.find(x => x.id === card.dataset.id);
        if (c) this.openCountdown(c);
      });
    });
    box.querySelectorAll('.del-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.customs = this.customs.filter(x => x.id !== btn.dataset.id);
        this.saveCustoms();
        this.renderSavedCustoms();
        this.toast('Removed');
      });
    });
  },

  escape(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  },

  renderExamList() {
    const container = document.getElementById('exam-list');
    if (!container) return;
    if (!this.exams.length) {
      container.innerHTML = '<p class="loading">No exams yet.</p>';
      return;
    }
    container.innerHTML = `
      <p class="section-label">Official exams</p>
      ${this.exams.map(exam => {
        const ts = new Date(exam.date).getTime();
        const badge = this.badgeFor(ts);
        const dateStr = new Date(exam.date).toLocaleDateString('en-IN', {
          day: 'numeric', month: 'short', year: 'numeric'
        });
        return `
          <div class="exam-card" data-id="${exam.id}">
            <div class="exam-card-left">
              <h3>${this.escape(exam.name)} ${badge ? `<span class="badge ${badge.cls}">${badge.text}</span>` : ''}</h3>
              <p>${dateStr}</p>
            </div>
            <div class="exam-card-right">→</div>
          </div>`;
      }).join('')}
    `;
    container.querySelectorAll('.exam-card').forEach(card => {
      card.addEventListener('click', () => {
        const exam = this.exams.find(e => e.id === card.dataset.id);
        if (exam) this.openCountdown(exam);
      });
    });
  },

  startCustomCountdown() {
    const title = (document.getElementById('custom-title')?.value || '').trim() || 'Custom Countdown';
    const date = document.getElementById('custom-date')?.value;
    const time = document.getElementById('custom-time')?.value || '00:00';
    const save = document.getElementById('custom-save')?.checked;

    if (!date) {
      this.toast('Please select a date');
      return;
    }
    const target = new Date(`${date}T${time}:00`);
    if (isNaN(target.getTime())) {
      this.toast('Invalid date or time');
      return;
    }
    if (target.getTime() <= Date.now()) {
      this.toast('Please choose a future date/time');
      return;
    }

    const item = {
      id: 'custom-' + Date.now(),
      name: title,
      fullName: title,
      date: target.toISOString(),
      custom: true
    };

    if (save) {
      this.customs.unshift(item);
      this.customs = this.customs.slice(0, 20);
      this.saveCustoms();
    }
    this.openCountdown(item);
  },

  openCountdown(exam) {
    this.currentExam = exam;
    this.hideAllViews();
    document.getElementById('countdown-view').classList.add('active');
    document.getElementById('countdown-title').textContent = exam.fullName || exam.name;

    const dateObj = new Date(exam.date);
    const opts = {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    };
    document.getElementById('target-date').textContent =
      (exam.custom ? 'Target: ' : 'Exam Date: ') + dateObj.toLocaleString('en-IN', opts);

    document.getElementById('motivation-quote').textContent =
      QUOTES[Math.floor(Math.random() * QUOTES.length)];

    this.endTs = dateObj.getTime();
    // Progress: assume ~1 year window if no start, or from now-ish
    this.startTs = this.endTs - (365 * 24 * 60 * 60 * 1000);
    if (this.startTs > Date.now()) this.startTs = Date.now() - 86400000;

    this.startTimer(this.endTs);
  },

  startTimer(targetTime) {
    this.stopTimer();
    const update = () => {
      const now = Date.now();
      let diff = targetTime - now;

      if (diff <= 0) {
        this.setTimerValues(0, 0, 0, 0);
        document.getElementById('target-date').textContent = '🎉 Time reached!';
        document.getElementById('progress-bar').style.width = '100%';
        document.getElementById('progress-text').textContent = '100% complete';
        this.stopTimer();
        return;
      }

      const days = Math.floor(diff / 86400000);
      diff %= 86400000;
      const hours = Math.floor(diff / 3600000);
      diff %= 3600000;
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      this.setTimerValues(days, hours, minutes, seconds);

      // Progress
      const total = this.endTs - this.startTs;
      const done = Math.min(1, Math.max(0, (now - this.startTs) / total));
      const pct = Math.round(done * 100);
      document.getElementById('progress-bar').style.width = pct + '%';
      document.getElementById('progress-text').textContent = pct + '% of the journey done';

      // Last 10s sound
      if (this.soundOn && days === 0 && hours === 0 && minutes === 0 && seconds <= 10 && seconds !== this.lastSecond) {
        this.lastSecond = seconds;
        this.beep();
      }
    };
    update();
    this.timerInterval = setInterval(update, 1000);
  },

  setTimerValues(d, h, m, s) {
    const pad = n => String(n).padStart(2, '0');
    document.getElementById('days').textContent = pad(d);
    document.getElementById('hours').textContent = pad(h);
    document.getElementById('minutes').textContent = pad(m);
    document.getElementById('seconds').textContent = pad(s);
  },

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  },

  beep() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.frequency.value = 880;
      g.gain.value = 0.08;
      o.start();
      setTimeout(() => { o.stop(); ctx.close(); }, 120);
    } catch {}
  },

  async setupReminder() {
    if (!this.currentExam) return;
    if (!('Notification' in window)) {
      this.toast('Notifications not supported on this browser');
      return;
    }
    let perm = Notification.permission;
    if (perm === 'default') {
      perm = await Notification.requestPermission();
    }
    if (perm !== 'granted') {
      this.toast('Please allow notifications in browser settings');
      return;
    }

    const target = new Date(this.currentExam.date).getTime();
    const name = this.currentExam.name;
    const oneDay = target - 86400000;
    const oneHour = target - 3600000;

    const schedule = (when, label) => {
      const delay = when - Date.now();
      if (delay <= 0) return false;
      // Browser can't schedule far ahead reliably when closed.
      // We store intent + fire if page is open near time; also show immediate confirmation.
      const key = 'sk_remind_' + this.currentExam.id + '_' + label;
      localStorage.setItem(key, JSON.stringify({ when, name, label }));
      if (delay < 2147483647) {
        setTimeout(() => {
          new Notification('SK EXAMS COUNTDOWN', {
            body: `${name} — ${label}`,
            icon: '/favicon.ico'
          });
        }, delay);
      }
      return true;
    };

    const a = schedule(oneDay, '1 day left');
    const b = schedule(oneHour, '1 hour left');
    if (a || b) {
      this.toast('Reminder set (works best while site/tab is open)');
    } else {
      this.toast('Exam is too soon for 1-day / 1-hour reminder');
    }
  },

  checkPendingNotifications() {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const now = Date.now();
    Object.keys(localStorage).forEach(k => {
      if (!k.startsWith('sk_remind_')) return;
      try {
        const data = JSON.parse(localStorage.getItem(k));
        if (data.when <= now && data.when > now - 3600000) {
          new Notification('SK EXAMS COUNTDOWN', {
            body: `${data.name} — ${data.label}`,
            icon: '/favicon.ico'
          });
          localStorage.removeItem(k);
        }
      } catch {}
    });
  },

  async shareCurrent() {
    const url = location.href.split('?')[0];
    const title = this.currentExam ? this.currentExam.name + ' Countdown' : 'SK EXAMS COUNTDOWN';
    const text = this.currentExam
      ? `Countdown for ${this.currentExam.name}: ${url}`
      : `Track NEET, JEE & custom exam countdowns: ${url}`;
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
      } else {
        await navigator.clipboard.writeText(text);
        this.toast('Link copied!');
      }
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        this.toast('Link copied!');
      } catch {
        this.toast('Could not share');
      }
    }
  },

  shareSite() {
    this.currentExam = null;
    this.shareCurrent();
  },

  toggleFullscreen() {
    this.isFullscreen ? this.exitFullscreen() : this.enterFullscreen();
  },

  enterFullscreen() {
    this.isFullscreen = true;
    document.body.classList.add('fullscreen-mode');
    const el = document.documentElement;
    (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el)?.catch(() => {});
  },

  exitFullscreen(fromBrowser = false) {
    this.isFullscreen = false;
    document.body.classList.remove('fullscreen-mode');
    if (!fromBrowser) {
      (document.exitFullscreen || document.webkitExitFullscreen)?.call(document)?.catch(() => {});
    }
  },

  setupParticles() {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];
    let width, height;

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    const create = () => {
      particles = [];
      const count = Math.min(Math.floor((width * height) / 14000), 70);
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r: Math.random() * 1.6 + 0.5,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          o: Math.random() * 0.4 + 0.12
        });
      }
    };
    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
      const color = isDark ? '124, 92, 252' : '108, 76, 224';
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color},${p.o})`;
        ctx.fill();
      });
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(${color},${0.07 * (1 - dist / 110)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(draw);
    };
    resize();
    create();
    draw();
    window.addEventListener('resize', () => { resize(); create(); });
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
