// Akmal Farm — Boshqaruv paneli :: admin.js (CSP-mos, tashqi skript)
(function () {
  "use strict";

  var gate = document.getElementById("gate");
  var app = document.getElementById("app");
  var loginForm = document.getElementById("loginForm");
  var gateStatus = document.getElementById("gateStatus");
  var loginBtn = document.getElementById("loginBtn");
  var contentForm = document.getElementById("contentForm");
  var saveBtn = document.getElementById("saveBtn");
  var saveStatus = document.getElementById("saveStatus");
  var savebarMeta = document.getElementById("savebarMeta");
  var topbarUser = document.getElementById("topbarUser");
  var logoutBtn = document.getElementById("logoutBtn");
  var mapCheckLink = document.getElementById("mapCheckLink");
  var toastEl = document.getElementById("toast");

  var TZ_SUFFIX = ":00+05:00"; // butun sayt Toshkent (UTC+5) ni qattiq qabul qiladi

  function toast(msg, isErr) {
    toastEl.textContent = msg;
    toastEl.className = "toast show" + (isErr ? " err" : "");
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(function () { toastEl.className = "toast"; }, 3200);
  }

  function api(path, opts) {
    opts = opts || {};
    opts.headers = Object.assign({ "Content-Type": "application/json" }, opts.headers || {});
    opts.credentials = "same-origin";
    return fetch(path, opts).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (body) {
        return { status: r.status, ok: r.ok, body: body };
      });
    });
  }

  function get(obj, path) {
    return path.split(".").reduce(function (o, k) { return o && typeof o === "object" ? o[k] : undefined; }, obj);
  }

  function isoToLocalInput(iso) {
    if (!iso || typeof iso !== "string") return "";
    var m = iso.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/);
    return m ? m[1] : "";
  }
  function localInputToIso(val) {
    if (!val) return "";
    return val + TZ_SUFFIX;
  }

  function updateCounters(form) {
    form.querySelectorAll("[data-max]").forEach(function (el) {
      var max = el.getAttribute("data-max");
      var input = el.closest(".field").querySelector("input,textarea");
      if (input) el.textContent = input.value.length + "/" + max;
    });
  }

  function fillForm(data) {
    contentForm.querySelectorAll("[name]").forEach(function (el) {
      var name = el.getAttribute("name");
      if (name === "event.countdown_target_local") {
        el.value = isoToLocalInput(get(data, "event.countdown_target_iso"));
      } else {
        var v = get(data, name);
        el.value = typeof v === "string" ? v : "";
      }
    });
    updateCounters(contentForm);
    if (mapCheckLink) mapCheckLink.href = get(data, "event.map_url") || "#";
  }

  function collectForm() {
    var out = {};
    contentForm.querySelectorAll("[name]").forEach(function (el) {
      var name = el.getAttribute("name");
      var value = el.value.trim();
      if (name === "event.countdown_target_local") {
        setPath(out, "event.countdown_target_iso", localInputToIso(value));
      } else if (value) {
        setPath(out, name, value);
      }
    });
    return out;
  }
  function setPath(obj, path, value) {
    var keys = path.split(".");
    var cur = obj;
    for (var i = 0; i < keys.length - 1; i++) {
      if (typeof cur[keys[i]] !== "object") cur[keys[i]] = {};
      cur = cur[keys[i]];
    }
    cur[keys[keys.length - 1]] = value;
  }

  function showApp() {
    gate.hidden = true;
    app.hidden = false;
  }
  function showGate() {
    app.hidden = true;
    gate.hidden = false;
    var f = loginForm.querySelector('[name="username"]');
    if (f) f.focus();
  }

  function fmtDate(iso) {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleString("uz-UZ", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch (e) { return iso; }
  }

  function loadContent() {
    return api("/api/admin/content").then(function (res) {
      if (!res.ok) { showGate(); return; }
      fillForm(res.body.data || {});
      var who = res.body.updated_by ? " · " + res.body.updated_by : "";
      savebarMeta.textContent = res.body.updated_at
        ? "Oxirgi yangilanish: " + fmtDate(res.body.updated_at) + who
        : "Hali saqlanmagan";
      if (topbarUser) topbarUser.textContent = "";
      api("/api/admin/session").then(function (s) {
        if (s.ok && topbarUser) topbarUser.textContent = s.body.username || "";
      });
    });
  }

  function checkSession() {
    return api("/api/admin/session").then(function (res) {
      if (res.ok) { showApp(); loadContent(); }
      else { showGate(); }
    });
  }

  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var username = loginForm.username.value.trim();
    var password = loginForm.password.value;
    gateStatus.className = "gate-status";
    gateStatus.textContent = "";
    loginBtn.disabled = true;
    api("/api/admin/login", { method: "POST", body: JSON.stringify({ username: username, password: password }) })
      .then(function (res) {
        loginBtn.disabled = false;
        if (res.ok) {
          gateStatus.className = "gate-status ok";
          gateStatus.textContent = "Kirildi ✓";
          loginForm.password.value = "";
          showApp();
          loadContent();
        } else if (res.status === 429) {
          gateStatus.textContent = "Juda ko'p urinish. Birozdan so'ng qayta urining.";
        } else {
          gateStatus.textContent = "Login yoki parol noto'g'ri.";
        }
      })
      .catch(function () {
        loginBtn.disabled = false;
        gateStatus.textContent = "Tarmoq xatosi. Qayta urinib ko'ring.";
      });
  });

  logoutBtn.addEventListener("click", function () {
    api("/api/admin/logout", { method: "POST" }).then(function () { showGate(); });
  });

  contentForm.addEventListener("input", function (e) {
    if (e.target.hasAttribute("maxlength")) updateCounters(contentForm);
    if (e.target.name === "event.map_url" && mapCheckLink) mapCheckLink.href = e.target.value || "#";
  });

  contentForm.addEventListener("submit", function (e) {
    e.preventDefault();
    saveBtn.disabled = true;
    saveStatus.className = "save-status load";
    saveStatus.textContent = "Saqlanmoqda…";
    var payload = collectForm();
    api("/api/admin/content", { method: "PUT", body: JSON.stringify(payload) }).then(function (res) {
      saveBtn.disabled = false;
      if (res.ok) {
        saveStatus.className = "save-status ok";
        saveStatus.textContent = "Saqlandi ✓";
        toast("O'zgarishlar saqlandi va saytda darhol ko'rinadi");
        fillForm(res.body.data || {});
        savebarMeta.textContent = "Oxirgi yangilanish: hozir";
      } else if (res.status === 401) {
        saveStatus.className = "save-status err";
        saveStatus.textContent = "Sessiya tugagan";
        toast("Sessiya tugagan, qayta kiring", true);
        showGate();
      } else {
        saveStatus.className = "save-status err";
        saveStatus.textContent = "Xatolik";
        toast("Saqlashda xatolik yuz berdi", true);
      }
    }).catch(function () {
      saveBtn.disabled = false;
      saveStatus.className = "save-status err";
      saveStatus.textContent = "Tarmoq xatosi";
      toast("Tarmoq xatosi", true);
    });
  });

  checkSession();
})();
