/* ===== SK EXAMS COUNTDOWN ===== */

const App = {
  exams: [],
  currentExam: null,
  timerInterval: null,
  isFullscreen: false,

  async init() {
    this.setupTheme();
    this.setupParticles();
    this.bindEvents();
    await this.loadExams();
    this.showListView();
  },

  async loadExams() {
    try {
      const res = await fetch('./exams.json?t=' + Date.now());
      this.exams = await res.json();
    } catch (err) {
      console.error('Failed to load exams.json', err);
      this.exams = [{
        id: 'neet-2027',
        name: 'NEET 2027',
        fullName: 'NEET UG 2027 Countdown',
        date: '2027-05-02T00:00:00+05:30',
        important: true
      }];
    }
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
      btn.title = theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';
    }
  },

  bindEvents() {
    document.getElementById('theme-btn')?.addEventListener('click', () => this.toggleTheme());
    document.getElementById('back-btn')?.addEventListener('click', () => this.showListView());
    document.getElementById('custom-back-btn')?.addEventListener('click', () => this.showListView());
    document.getElementById('fullscreen-btn')?.addEventListener('click', () => this.toggleFullscreen());
    document.getElementById('exit-fs-btn')?.addEventListener('click', () => this.exitFullscreen());
    document.getElementById('custom-card')?.addEventListener('click', () => this.showCustomForm());
    document.getElementById('start-custom-btn')?.addEventListener('click', () => this.startCustomCountdown());

    document.addEventListener('fullscreenchange', () => {
      if (!document.fullscreenElement && this.isFullscreen) {
        this.exitFullscreen(true);
      }
    });
  },

  hideAllViews() {
    document.getElementById('list-view')?.classList.remove('active');
    document.getElementById('countdown-view')?.classList.remove('active');
    document.getElementById('custom-form-view')?.classList.remove('active');
  },

  showListView() {
    this.stopTimer();
    this.currentExam = null;
    this.hideAllViews();
    document.getElementById('list-view').classList.add('active');
    this.renderExamList();
  },

  showCustomForm() {
    this.stopTimer();
    this.hideAllViews();
    document.getElementById('custom-form-view').classList.add('active');

    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateInput = document.getElementById('custom-date');
    if (dateInput) {
      dateInput.value = tomorrow.toISOString().split('T')[0];
      dateInput.min = new Date().toISOString().split('T')[0];
    }
  },

  startCustomCountdown() {
    const titleInput = document.getElementById('custom-title');
    const dateInput = document.getElementById('custom-date');
    const timeInput = document.getElementById('custom-time');

    const title = (titleInput?.value || '').trim() || 'Custom Countdown';
    const date = dateInput?.value;
    const time = timeInput?.value || '00:00';

    if (!date) {
      alert('Please select a date');
      return;
    }

    const targetDate = new Date(`${date}T${time}:00`);
    if (isNaN(targetDate.getTime())) {
      alert('Invalid date or time');
      return;
    }

    this.currentExam = {
      id: 'custom',
      name: title,
      fullName: title,
      date: targetDate.toISOString()
    };

    this.hideAllViews();
    document.getElementById('countdown-view').classList.add('active');
    document.getElementById('countdown-title').textContent = title;

    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    document.getElementById('target-date').textContent = 
      'Target: ' + targetDate.toLocaleString('en-IN', options);

    this.startTimer(targetDate.getTime());
  },

  showCountdownView(examId) {
    const exam = this.exams.find(e => e.id === examId);
    if (!exam) return;

    this.currentExam = exam;
    this.hideAllViews();
    document.getElementById('countdown-view').classList.add('active');

    document.getElementById('countdown-title').textContent = exam.fullName || exam.name + ' Countdown';
    
    const dateObj = new Date(exam.date);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('target-date').textContent = 
      'Exam Date: ' + dateObj.toLocaleDateString('en-IN', options);

    this.startTimer(new Date(exam.date).getTime());
  },

  renderExamList() {
    const container = document.getElementById('exam-list');
    if (!container) return;

    if (this.exams.length === 0) {
      container.innerHTML = '<p class="loading">No exams added yet.</p>';
      return;
    }

    container.innerHTML = this.exams.map(exam => {
      const dateObj = new Date(exam.date);
      const dateStr = dateObj.toLocaleDateString('en-IN', { 
        day: 'numeric', month: 'short', year: 'numeric' 
      });
      return `
        <div class="exam-card" data-id="${exam.id}">
          <div class="exam-card-left">
            <h3>${exam.name} Countdown</h3>
            <p>${dateStr}</p>
          </div>
          <div class="exam-card-right">→</div>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.exam-card').forEach(card => {
      card.addEventListener('click', () => {
        this.showCountdownView(card.dataset.id);
      });
    });
  },

  startTimer(targetTime) {
    this.stopTimer();

    const update = () => {
      const now = Date.now();
      let diff = targetTime - now;

      if (diff <= 0) {
        this.setTimerValues(0, 0, 0, 0);
        document.getElementById('target-date').textContent = '🎉 Time reached!';
        this.stopTimer();
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      diff %= (1000 * 60 * 60 * 24);
      const hours = Math.floor(diff / (1000 * 60 * 60));
      diff %= (1000 * 60 * 60);
      const minutes = Math.floor(diff / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      this.setTimerValues(days, hours, minutes, seconds);
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

  toggleFullscreen() {
    if (!this.isFullscreen) {
      this.enterFullscreen();
    } else {
      this.exitFullscreen();
    }
  },

  enterFullscreen() {
    this.isFullscreen = true;
    document.body.classList.add('fullscreen-mode');
    
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(() => {});
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    }
  },

  exitFullscreen(fromBrowser = false) {
    this.isFullscreen = false;
    document.body.classList.remove('fullscreen-mode');

    if (!fromBrowser) {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
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

    const createParticles = () => {
      particles = [];
      const count = Math.min(Math.floor((width * height) / 14000), 80);
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 1.8 + 0.6,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          opacity: Math.random() * 0.45 + 0.15
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      
      const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
      const color = isDark ? '124, 92, 252' : '108, 76, 224';

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color}, ${p.opacity})`;
        ctx.fill();
      });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(${color}, ${0.08 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(draw);
    };

    resize();
    createParticles();
    draw();

    window.addEventListener('resize', () => {
      resize();
      createParticles();
    });
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
