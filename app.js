// Akmal Farm — Taklifnoma :: external script (CSP-compliant under script-src 'self')

// ── Scroll-reveal engine (Motion'ning inView o'rnini bosadi, CSP-mos) ──
// Progressive enhancement: .js-scroll qo'shilmasa kontent baribir ko'rinadi.
(function () {
  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  if (reduce || !('IntersectionObserver' in window)) return;

  document.documentElement.classList.add('js-scroll');

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.16, rootMargin: '0px 0px -6% 0px' });

  document.querySelectorAll('.reveal-up, .ecg').forEach(function (el) { io.observe(el); });
})();

// ── Countdown: 2-iyul 2026, 11:00 (Oʻzbekiston, UTC+5) ────────────────
(function () {
  var cd = document.getElementById('cd');
  if (!cd) return;
  var target = new Date('2026-07-02T11:00:00+05:00').getTime();
  var d = cd.querySelector('[data-cd=d]'), h = cd.querySelector('[data-cd=h]'),
      m = cd.querySelector('[data-cd=m]'), s = cd.querySelector('[data-cd=s]');
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function tick() {
    var diff = target - Date.now();
    if (diff <= 0) {
      var g = cd.querySelector('.cd-grid');
      if (g) g.innerHTML = '<div class="cd-done">Marosim boshlandi! · Мероприятие началось!</div>';
      clearInterval(iv);
      return;
    }
    var sec = Math.floor(diff / 1000);
    d.textContent = Math.floor(sec / 86400);
    h.textContent = pad(Math.floor((sec % 86400) / 3600));
    m.textContent = pad(Math.floor((sec % 3600) / 60));
    s.textContent = pad(sec % 60);
  }
  tick();
  var iv = setInterval(tick, 1000);
})();

// ── "Taqvimga qo'shish" — .ics fayl yuklab beradi (barcha kalendarlar) ──
(function () {
  var btn = document.getElementById('addcal');
  if (!btn) return;
  var ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Akmal Farm//Taklifnoma//UZ', 'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT', 'UID:akmal-ochilish-2026@akmalfarm.uz', 'DTSTAMP:20260701T000000Z',
    'DTSTART:20260702T060000Z', 'DTEND:20260702T080000Z',
    'SUMMARY:Akmal Farm — yangi filial ochilishi',
    'DESCRIPTION:Yangi dorixona ochilish marosimi. Sizni kutamiz!',
    'LOCATION:Andijon vil.\\, Qoʼrgʼontepa t.\\, Yuksalish MFY\\, Mustaqillik koʼchasi 972',
    'END:VEVENT', 'END:VCALENDAR'
  ].join('\r\n');
  btn.addEventListener('click', function () {
    var blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = 'akmal-farm-ochilish.ics';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
    btn.classList.add('done');
    var i = btn.querySelector('.ct i');
    if (i) i.textContent = 'Yuklab olindi ✓ · Готово';
  });
})();

// ── Kapsula parallaksi (nozik, hero reveal tugagach) ──────────────────
(function () {
  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  var stage = document.querySelector('.hero .stage3d');
  if (!stage || reduce) return;
  var ticking = false;
  function update() {
    var y = window.pageYOffset || 0;
    stage.style.transform = 'translateY(' + (y * 0.08).toFixed(1) + 'px)';
    ticking = false;
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  // hero reveal animatsiyasi tugagach ulanamiz (transform to'qnashuvidan qochish)
  setTimeout(function () {
    stage.style.animation = 'none';
    window.addEventListener('scroll', onScroll, { passive: true });
    update();
  }, 1100);
})();

// ── RSVP ──────────────────────────────────────────────────────────────
(function () {
  var block = document.getElementById('rsvp-form-block');
  if (!block) return;
  var form = block.querySelector('.rform');
  var opts = form.querySelectorAll('.rsvp-opt');
  var guestsField = form.querySelector('.rsvp-guests');
  var statusEl = form.querySelector('.rsvp-status');
  var submitBtn = form.querySelector('.rsvp-submit');
  var thanks = block.querySelector('.rsvp-thanks');
  var attending = null;
  var startedAt = Date.now();
  guestsField.style.display = 'none';

  function setStatus(kind, msg) {
    statusEl.className = 'rsvp-status' + (kind ? ' ' + kind : '');
    statusEl.textContent = msg || '';
  }

  opts.forEach(function (b) {
    b.addEventListener('click', function () {
      opts.forEach(function (x) { x.classList.remove('sel'); x.setAttribute('aria-pressed', 'false'); });
      b.classList.add('sel');
      b.setAttribute('aria-pressed', 'true');
      attending = (b.dataset.val === 'yes');
      guestsField.style.display = attending ? '' : 'none';
      setStatus('', '');
    });
  });

  function showThanks(yes) {
    form.style.display = 'none';
    thanks.classList.add('show');
    if (!yes) thanks.classList.add('no');
    var svg = thanks.querySelector('.tick svg');
    var path = svg.querySelector('path');
    svg.setAttribute('stroke', yes ? '#34d17a' : '#ff6b78');
    path.setAttribute('d', yes ? 'M20 6 9 17l-5-5' : 'M18 6 6 18M6 6l12 12');
    thanks.querySelector('.tt').textContent = yes ? 'Rahmat! Sizni kutamiz' : 'Rahmat, xabar berdingiz';
    thanks.querySelector('.tp').innerHTML = yes
      ? 'Javobingiz qabul qilindi.<br>Ваш ответ принят. Ждём вас!'
      : 'Afsuski, koʼrisha olmaymiz.<br>Жаль, что не сможете. Спасибо!';
    thanks.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (form.company.value) { showThanks(true); return; } // honeypot
    if (attending === null) { setStatus('err', 'Iltimos, javobni tanlang · Выберите ответ'); return; }
    var name = form.name.value.trim();
    var phone = form.phone.value.trim();
    if (name.length < 2) { setStatus('err', 'Ismingizni kiriting · Укажите имя'); form.name.focus(); return; }
    if (phone.replace(/\D/g, '').length < 7) { setStatus('err', 'Telefonni toʼgʼri kiriting · Укажите телефон'); form.phone.focus(); return; }
    var payload = {
      name: name, phone: phone, attending: attending,
      guests: attending ? (parseInt(form.guests.value, 10) || 1) : 0,
      message: form.message.value.trim(), company: form.company.value,
      elapsed: Date.now() - startedAt
    };
    submitBtn.disabled = true;
    setStatus('load', 'Yuborilmoqda · Отправка…');
    fetch('/api/rsvp', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    }).then(function (r) {
      if (r.status === 429) throw { tag: 'rate' };
      if (!r.ok) throw { tag: 'http' };
      return r.json();
    }).then(function () {
      showThanks(attending);
    }).catch(function (err) {
      submitBtn.disabled = false;
      if (err && err.tag === 'rate') setStatus('err', 'Juda koʼp urinish. Birozdan soʼng qayta urining · Слишком много попыток');
      else setStatus('err', 'Xatolik. Qayta urinib koʼring · Ошибка, попробуйте ещё раз');
    });
  });
})();
