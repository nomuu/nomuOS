/* ============================================================
   NomuOS — Mobile shell (iOS-style)
   Home screen with app icons + dock, a status bar, a Projects
   folder, and fullscreen app "sheets". Reuses the existing apps
   because NomuWM.open delegates here on mobile.
   ============================================================ */
window.NomuMobile = (function () {
  "use strict";

  var active = false;
  var root = null;
  var sheetLayer = null;
  var sheets = [];
  var idSeq = 0;

  // Home screen layout (Projects is a folder that lists the projects).
  var HOME_ITEMS = [
    { type: "app", id: "about" },
    { type: "app", id: "skills" },
    { type: "folder", key: "projects", name: "Projects", glyph: "🗂️" },
    { type: "app", id: "contact" },
    { type: "app", id: "browie" },
    { type: "app", id: "files" },
    { type: "app", id: "editor" },
    { type: "app", id: "calc" },
    { type: "app", id: "calendar" },
    { type: "app", id: "terminal" },
    { type: "app", id: "settings" },
  ];
  var DOCK = [
    { type: "app", id: "browie" },
    { type: "app", id: "about" },
    { type: "app", id: "contact" },
    { type: "folder", key: "projects", name: "Projects", glyph: "🗂️" },
  ];

  function appById(id) { return (window.NomuApps || {})[id]; }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function launchApp(id) {
    var app = appById(id);
    if (app && typeof app.open === "function") app.open();
  }

  /* ---------------- Home icons ---------------- */
  function iconEl(item) {
    var el = document.createElement("button");
    el.className = "m-icon";
    var glyph, name;
    if (item.type === "folder") {
      glyph = item.glyph; name = item.name;
      el.classList.add("m-icon-folder");
    } else {
      var app = appById(item.id) || {};
      glyph = app.icon || "▪"; name = app.name || item.id;
    }
    el.innerHTML =
      '<span class="m-icon-tile"><span class="m-icon-glyph">' + glyph + "</span></span>" +
      '<span class="m-icon-label">' + esc(name) + "</span>";
    el.addEventListener("click", function () {
      if (item.type === "folder") openProjectsFolder();
      else launchApp(item.id);
    });
    return el;
  }

  function buildHome() {
    var grid = root.querySelector("#m-grid");
    grid.innerHTML = "";
    HOME_ITEMS.forEach(function (it) { grid.appendChild(iconEl(it)); });

    var dock = root.querySelector("#m-dock");
    dock.innerHTML = "";
    DOCK.forEach(function (it) { dock.appendChild(iconEl(it)); });
  }

  /* ---------------- Projects folder overlay ---------------- */
  function openProjectsFolder() {
    var projs = ((window.NomuProfile || {}).projects) || {};
    var all = (projs.featured || []).concat(projs.others || []);
    var overlay = document.createElement("div");
    overlay.className = "m-folder";
    var tiles = all.map(function (p, i) {
      return (
        '<button class="m-icon" data-i="' + i + '">' +
          '<span class="m-icon-tile"><span class="m-icon-glyph"><i class="' +
            (p.icon || "fas fa-code") + '"></i></span></span>' +
          '<span class="m-icon-label">' + esc(p.name) + "</span>" +
        "</button>"
      );
    }).join("");
    overlay.innerHTML =
      '<div class="m-folder-inner">' +
        '<div class="m-folder-title">Projects</div>' +
        '<div class="m-folder-grid">' + tiles + "</div>" +
      "</div>";
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) close();
    });
    function close() { overlay.classList.remove("in"); setTimeout(function () { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 220); }
    overlay.querySelectorAll(".m-icon").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var p = all[parseInt(btn.getAttribute("data-i"), 10)];
        close();
        if (p && window.NomuApps && NomuApps.projects && NomuApps.projects.launch) {
          NomuApps.projects.launch(p);
        }
      });
    });
    root.appendChild(overlay);
    requestAnimationFrame(function () { overlay.classList.add("in"); });
  }

  /* ---------------- App sheets (fullscreen) ---------------- */
  // Called by NomuWM.open when mobile is active. Compatible api.
  function presentApp(opts) {
    opts = opts || {};
    var id = ++idSeq;
    var el = document.createElement("div");
    el.className = "m-sheet";
    el.innerHTML =
      '<div class="m-nav">' +
        '<button class="m-back">‹ Back</button>' +
        '<div class="m-nav-title"></div>' +
        '<span class="m-nav-icon">' + (opts.icon || "") + "</span>" +
      "</div>" +
      '<div class="m-appbody"></div>';

    var body = el.querySelector(".m-appbody");
    el.querySelector(".m-nav-title").textContent = opts.title || "App";
    sheetLayer.appendChild(el);
    requestAnimationFrame(function () { el.classList.add("in"); });

    var handle = {
      id: id, el: el, body: body,
      close: function () { closeSheet(handle); },
      focus: function () {},
      setTitle: function (t) { el.querySelector(".m-nav-title").textContent = t; },
    };
    sheets.push(handle);
    el.querySelector(".m-back").addEventListener("click", function () { closeSheet(handle); });

    if (typeof opts.render === "function") {
      try { opts.render(body, handle); }
      catch (err) { body.innerHTML = '<div class="app-pad">App failed to load: ' + esc(err) + "</div>"; }
    }
    return handle;
  }

  function closeSheet(handle) {
    handle.el.classList.remove("in");
    setTimeout(function () { if (handle.el.parentNode) handle.el.parentNode.removeChild(handle.el); }, 260);
    sheets = sheets.filter(function (s) { return s !== handle; });
  }

  function closeTop() {
    if (sheets.length) closeSheet(sheets[sheets.length - 1]);
  }

  /* ---------------- Status bar clock ---------------- */
  function startClock() {
    var el = root.querySelector("#m-clock");
    function tick() {
      if (!el) return;
      el.textContent = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    }
    tick();
    setInterval(tick, 15000);
  }

  /* ---------------- Lock screen (6-digit PIN) ---------------- */
  var LOCK_PIN = "123098";
  var PIN_LEN = 6;
  var lockEl = null, pinEntered = "", lockClockTimer = null;

  function buildLock() {
    if (lockEl) return;
    lockEl = document.createElement("div");
    lockEl.className = "m-lock hidden";

    var dots = "";
    for (var i = 0; i < PIN_LEN; i++) dots += '<span class="m-pin-dot"></span>';

    var keys = [
      { n: "1", s: " " }, { n: "2", s: "A B C" }, { n: "3", s: "D E F" },
      { n: "4", s: "G H I" }, { n: "5", s: "J K L" }, { n: "6", s: "M N O" },
      { n: "7", s: "P Q R S" }, { n: "8", s: "T U V" }, { n: "9", s: "W X Y Z" },
    ];
    var keyHtml = keys.map(function (k) {
      return '<button class="m-key" data-n="' + k.n + '">' +
               '<span class="m-key-n">' + k.n + '</span>' +
               '<span class="m-key-s">' + k.s + '</span>' +
             '</button>';
    }).join("");
    keyHtml +=
      '<span class="m-key-spacer"></span>' +
      '<button class="m-key" data-n="0"><span class="m-key-n">0</span></button>' +
      '<button class="m-key m-key-del" data-del="1">⌫</button>';

    lockEl.innerHTML =
      '<div class="m-lock-clock" id="m-lock-clock"></div>' +
      '<div class="m-lock-title">Enter Passcode</div>' +
      '<div class="m-lock-hint">please use 123098</div>' +
      '<div class="m-pin" id="m-pin">' + dots + "</div>" +
      '<div class="m-keys">' + keyHtml + "</div>";

    root.appendChild(lockEl);

    lockEl.querySelectorAll(".m-key").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (btn.getAttribute("data-del")) delPin();
        else addPin(btn.getAttribute("data-n"));
      });
    });
  }

  function renderDots() {
    if (!lockEl) return;
    var dots = lockEl.querySelectorAll(".m-pin-dot");
    for (var i = 0; i < dots.length; i++) {
      dots[i].classList.toggle("filled", i < pinEntered.length);
    }
  }

  function addPin(n) {
    if (pinEntered.length >= PIN_LEN) return;
    pinEntered += n;
    renderDots();
    if (pinEntered.length === PIN_LEN) setTimeout(checkPin, 140);
  }
  function delPin() {
    pinEntered = pinEntered.slice(0, -1);
    renderDots();
  }
  function checkPin() {
    if (pinEntered === LOCK_PIN) {
      unlock();
    } else {
      var pin = lockEl && lockEl.querySelector("#m-pin");
      if (pin) { pin.classList.remove("shake"); void pin.offsetWidth; pin.classList.add("shake"); }
      pinEntered = "";
      renderDots();
    }
  }

  function lockClockTick() {
    var el = lockEl && lockEl.querySelector("#m-lock-clock");
    if (!el) return;
    var d = new Date();
    var time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    var date = d.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
    el.innerHTML = '<span class="m-lock-time">' + time + '</span><span class="m-lock-date">' + date + "</span>";
  }

  function lock() {
    if (!root) return;
    buildLock();
    pinEntered = "";
    renderDots();
    lockEl.classList.remove("hidden");
    requestAnimationFrame(function () { if (lockEl) lockEl.classList.add("in"); });
    lockClockTick();
    clearInterval(lockClockTimer);
    lockClockTimer = setInterval(lockClockTick, 15000);
  }

  function unlock() {
    if (!lockEl) return;
    lockEl.classList.remove("in");
    clearInterval(lockClockTimer); lockClockTimer = null;
    setTimeout(function () { if (lockEl) lockEl.classList.add("hidden"); }, 350);
  }

  /* ---------------- Init ---------------- */
  function init() {
    root = document.getElementById("mobile");
    if (!root) return;
    active = true;
    try { if (window.NomuTheme) NomuTheme.apply(); } catch (e) {}

    root.classList.remove("hidden");
    root.innerHTML =
      '<div class="m-statusbar">' +
        '<span class="m-clock" id="m-clock">9:41</span>' +
        '<span class="m-status-right">' +
          '<span class="m-sig">●●●</span>' +
          '<span class="m-wifi">📶</span>' +
          '<span class="m-batt"><span class="m-batt-fill"></span></span>' +
        "</span>" +
      "</div>" +
      '<div class="m-home">' +
        '<div class="m-home-head">' +
          '<div class="m-home-mark">N</div>' +
          '<div class="m-home-name">NomuOS</div>' +
          '<div class="m-home-sub">' + esc((window.NomuProfile || {}).name || "") + "</div>" +
        "</div>" +
        '<div class="m-grid" id="m-grid"></div>' +
      "</div>" +
      '<div class="m-dock" id="m-dock"></div>' +
      '<div class="m-sheets" id="m-sheets"></div>' +
      '<div class="m-homebar" id="m-homebar" title="Home"></div>';

    sheetLayer = root.querySelector("#m-sheets");
    buildHome();
    startClock();

    // Home indicator: swipe-up substitute — closes the current app.
    root.querySelector("#m-homebar").addEventListener("click", closeTop);

    if (window.NomuScreensaver) NomuScreensaver.init();
  }

  function isActive() { return active; }

  return {
    init: init,
    isActive: isActive,
    presentApp: presentApp,
    closeTop: closeTop,
    lock: lock,
  };
})();
