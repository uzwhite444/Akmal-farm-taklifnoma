// Akmal Farm — Taklifnoma :: RSVP logic (external, CSP-compliant under script-src 'self')
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
