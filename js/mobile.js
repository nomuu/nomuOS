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
  var activeSheet = null;   // the app sheet currently shown fullscreen (null = home)
  var switcherEl = null;    // the app-switcher overlay, when open
  var ccEl = null;          // the control-center (swipe-down) panel, when open

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
    { type: "app", id: "nothing" },
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

    // Single-instance: if this app is already open, just bring it back to front.
    if (opts.key != null) {
      for (var i = 0; i < sheets.length; i++) {
        if (sheets[i].key === opts.key) {
          if (typeof opts.title === "string") sheets[i].setTitle(opts.title);
          showSheet(sheets[i]);
          return sheets[i];
        }
      }
    }

    var id = ++idSeq;
    var el = document.createElement("div");
    el.className = "m-sheet";
    el.innerHTML =
      '<div class="m-nav">' +
        '<button class="m-back">‹ Home</button>' +
        '<div class="m-nav-title"></div>' +
        '<span class="m-nav-icon">' + (opts.icon || "") + "</span>" +
      "</div>" +
      '<div class="m-appbody"></div>';

    var body = el.querySelector(".m-appbody");
    el.querySelector(".m-nav-title").textContent = opts.title || "App";
    sheetLayer.appendChild(el);

    var handle = {
      id: id, el: el, body: body,
      key: opts.key != null ? opts.key : null,
      title: opts.title || "App",
      icon: opts.icon || "▪",
      minimized: false,
      close: function () { closeSheet(handle); },
      focus: function () { showSheet(handle); },
      setTitle: function (t) { handle.title = t; el.querySelector(".m-nav-title").textContent = t; },
    };
    sheets.push(handle);
    // "‹ Home" minimizes the app (it keeps running — reopen via the app switcher).
    el.querySelector(".m-back").addEventListener("click", goHome);

    if (typeof opts.render === "function") {
      try { opts.render(body, handle); }
      catch (err) { body.innerHTML = '<div class="app-pad">App failed to load: ' + esc(err) + "</div>"; }
    }

    showSheet(handle);
    return handle;
  }

  // Bring one sheet to the foreground; hide the rest (one app visible at a time).
  function showSheet(handle) {
    closeSwitcher();
    activeSheet = handle;
    sheetLayer.appendChild(handle.el); // move to top of the stack
    sheets.forEach(function (s) {
      var vis = s === handle;
      s.minimized = !vis;
      s.el.style.display = vis ? "" : "none";
    });
    requestAnimationFrame(function () { handle.el.classList.add("in"); });
  }

  // Minimize the active app to the home screen (the app keeps running).
  function goHome() {
    sheets.forEach(function (s) { s.el.style.display = "none"; s.minimized = true; });
    activeSheet = null;
  }

  function closeSheet(handle) {
    handle.el.classList.remove("in");
    setTimeout(function () { if (handle.el.parentNode) handle.el.parentNode.removeChild(handle.el); }, 260);
    sheets = sheets.filter(function (s) { return s !== handle; });
    if (activeSheet === handle) activeSheet = null;
  }

  function closeTop() {
    // Kept for compatibility: minimize the active app to home.
    goHome();
  }

  /* ---------------- App switcher (swipe up on the home indicator) ---------------- */
  function openSwitcher() {
    closeSwitcher();
    goHome(); // hide any visible app behind the switcher

    switcherEl = document.createElement("div");
    switcherEl.className = "m-switcher";
    switcherEl.style.cssText =
      "position:absolute;inset:0;z-index:80;display:flex;flex-direction:column;" +
      "align-items:center;justify-content:center;gap:14px;padding:24px;opacity:0;" +
      "transition:opacity .2s;background:rgba(5,6,15,.55);" +
      "backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);";

    var title = document.createElement("div");
    title.textContent = sheets.length ? "Open Apps" : "No open apps";
    title.style.cssText = "color:#fff;font:600 15px 'Segoe UI',sans-serif;opacity:.85;";
    switcherEl.appendChild(title);

    var row = document.createElement("div");
    row.className = "m-switcher-row";
    row.style.cssText =
      "display:flex;gap:16px;overflow-x:auto;max-width:100%;padding:8px 4px 16px;" +
      "-webkit-overflow-scrolling:touch;";
    switcherEl.appendChild(row);

    sheets.forEach(function (s) {
      var card = document.createElement("div");
      card.style.cssText =
        "flex:0 0 auto;width:150px;height:230px;border-radius:18px;overflow:hidden;" +
        "background:rgba(20,24,51,.92);border:1px solid rgba(255,255,255,.18);" +
        "display:flex;flex-direction:column;box-shadow:0 12px 30px rgba(0,0,0,.4);cursor:pointer;";
      card.innerHTML =
        '<div style="display:flex;align-items:center;gap:8px;padding:10px 12px;' +
          "background:rgba(255,255,255,.08);color:#fff;font:600 13px 'Segoe UI',sans-serif;\">" +
          '<span style="font-size:16px;">' + (s.icon || "▪") + "</span>" +
          '<span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' +
            esc(s.title) + "</span>" +
          '<button class="m-sw-close" title="Close" style="all:unset;cursor:pointer;' +
            'color:#fff;opacity:.7;font-size:15px;line-height:1;padding:2px 4px;">✕</button>' +
        "</div>" +
        '<div style="flex:1;display:flex;align-items:center;justify-content:center;font-size:54px;">' +
          (s.icon || "▪") + "</div>";
      card.addEventListener("click", function () { showSheet(s); });
      card.querySelector(".m-sw-close").addEventListener("click", function (e) {
        e.stopPropagation();
        closeSheet(s);
        openSwitcher(); // rebuild the list
      });
      row.appendChild(card);
    });

    // Tap the empty backdrop to dismiss (stay on home).
    switcherEl.addEventListener("click", function (e) {
      if (e.target === switcherEl || e.target === title || e.target === row) closeSwitcher();
    });

    root.appendChild(switcherEl);
    requestAnimationFrame(function () { if (switcherEl) switcherEl.style.opacity = "1"; });
  }

  function closeSwitcher() {
    if (switcherEl && switcherEl.parentNode) switcherEl.parentNode.removeChild(switcherEl);
    switcherEl = null;
  }

  // Home indicator: tap = minimize to home; swipe up = open the app switcher.
  function wireHomeBar() {
    var bar = root.querySelector("#m-homebar");
    if (!bar) return;
    var startY = 0, startX = 0, moved = false, tracking = false;
    bar.style.touchAction = "none";
    bar.addEventListener("pointerdown", function (e) {
      tracking = true; moved = false; startY = e.clientY; startX = e.clientX;
    });
    window.addEventListener("pointermove", function (e) {
      if (!tracking) return;
      if (Math.abs(e.clientY - startY) > 8 || Math.abs(e.clientX - startX) > 8) moved = true;
    });
    window.addEventListener("pointerup", function (e) {
      if (!tracking) return;
      tracking = false;
      var dy = startY - e.clientY; // positive = swipe up
      if (dy > 40) openSwitcher();
      else if (!moved) { if (activeSheet) goHome(); else openSwitcher(); }
    });
  }

  /* ---------------- Control Center (swipe down from the top) ---------------- */
  function openControlCenter() {
    closeControlCenter();
    var t = (window.NomuTheme && NomuTheme.current()) || { accent: "", wallpaper: "" };

    var accents = ((window.NomuTheme && NomuTheme.ACCENTS) || []).map(function (a) {
      return '<button class="m-cc-acc" data-accent="' + a.id + '" title="' + a.id + '" ' +
        'style="width:40px;height:40px;border-radius:50%;cursor:pointer;' +
        "border:2px solid " + (a.id === t.accent ? "#fff" : "transparent") + ";" +
        "background:linear-gradient(135deg," + a.a + "," + a.b + ');"></button>';
    }).join("");

    var walls = ((window.NomuTheme && NomuTheme.WALLPAPERS) || []).map(function (w) {
      return '<button class="m-cc-wall" data-wall="' + w.id + '" title="' + w.id + '" ' +
        'style="width:60px;height:42px;border-radius:12px;cursor:pointer;' +
        "border:2px solid " + (w.id === t.wallpaper ? "#fff" : "rgba(255,255,255,.2)") + ";" +
        "background:" + w.css + ';background-size:cover;"></button>';
    }).join("");

    var now = new Date();
    var timeStr = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    var dateStr = now.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });

    var btnCss = "flex:1;padding:12px;border-radius:16px;border:1px solid rgba(255,255,255,.18);" +
      "background:rgba(255,255,255,.12);color:#fff;font:600 14px 'Segoe UI',sans-serif;cursor:pointer;";

    ccEl = document.createElement("div");
    ccEl.className = "m-cc";
    ccEl.style.cssText =
      "position:absolute;inset:0;z-index:75;opacity:0;transition:opacity .2s;" +
      "background:rgba(5,6,15,.5);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);";

    var panel = document.createElement("div");
    panel.className = "m-cc-panel";
    panel.style.cssText =
      "position:absolute;left:12px;right:12px;top:0;transform:translateY(-115%);" +
      "transition:transform .30s cubic-bezier(.22,1,.36,1);" +
      "background:rgba(20,24,51,.9);border:1px solid rgba(255,255,255,.15);" +
      "border-radius:0 0 26px 26px;padding:16px 16px 20px;color:#fff;" +
      "box-shadow:0 20px 40px rgba(0,0,0,.45);";
    panel.innerHTML =
      '<div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:14px;">' +
        '<div style="font:600 15px \'Segoe UI\',sans-serif;">Control Center</div>' +
        '<div style="text-align:right;font:500 12px \'Segoe UI\',sans-serif;opacity:.8;">' +
          esc(timeStr) + "<br>" + esc(dateStr) + "</div>" +
      "</div>" +
      '<div style="font:600 12px \'Segoe UI\',sans-serif;opacity:.7;margin:2px 0 8px;">ACCENT COLOR</div>' +
      '<div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px;">' + accents + "</div>" +
      '<div style="font:600 12px \'Segoe UI\',sans-serif;opacity:.7;margin:2px 0 8px;">WALLPAPER</div>' +
      '<div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:18px;">' + walls + "</div>" +
      '<div style="display:flex;gap:12px;">' +
        '<button class="m-cc-settings" style="' + btnCss + '">⚙️ Settings</button>' +
        '<button class="m-cc-lock" style="' + btnCss + '">🔒 Lock</button>' +
      "</div>" +
      '<div style="width:44px;height:5px;border-radius:999px;background:rgba(255,255,255,.4);' +
        'margin:16px auto 0;"></div>';

    ccEl.appendChild(panel);

    // accent swatches
    panel.querySelectorAll(".m-cc-acc").forEach(function (el) {
      el.addEventListener("click", function () {
        if (window.NomuTheme) NomuTheme.setAccent(el.getAttribute("data-accent"));
        panel.querySelectorAll(".m-cc-acc").forEach(function (s) { s.style.borderColor = "transparent"; });
        el.style.borderColor = "#fff";
      });
    });
    // wallpaper options
    panel.querySelectorAll(".m-cc-wall").forEach(function (el) {
      el.addEventListener("click", function () {
        if (window.NomuTheme) NomuTheme.setWallpaper(el.getAttribute("data-wall"));
        panel.querySelectorAll(".m-cc-wall").forEach(function (s) { s.style.borderColor = "rgba(255,255,255,.2)"; });
        el.style.borderColor = "#fff";
      });
    });
    // shortcuts
    panel.querySelector(".m-cc-settings").addEventListener("click", function () {
      closeControlCenter();
      launchApp("settings");
    });
    panel.querySelector(".m-cc-lock").addEventListener("click", function () {
      closeControlCenter();
      lock();
    });
    // tap the backdrop (outside the panel) to dismiss
    ccEl.addEventListener("click", function (e) { if (e.target === ccEl) closeControlCenter(); });

    root.appendChild(ccEl);
    requestAnimationFrame(function () {
      if (!ccEl) return;
      ccEl.style.opacity = "1";
      panel.style.transform = "translateY(0)";
    });
  }

  function closeControlCenter() {
    if (ccEl && ccEl.parentNode) ccEl.parentNode.removeChild(ccEl);
    ccEl = null;
  }

  // Top edge: swipe down = open Control Center.
  function wireControlCenter() {
    var startY = 0, startX = 0, fromTop = false, tracking = false;
    root.addEventListener("pointerdown", function (e) {
      if (switcherEl || ccEl) { tracking = false; return; }
      var top = root.getBoundingClientRect().top;
      fromTop = (e.clientY - top) <= 40;
      if (!fromTop) { tracking = false; return; }
      tracking = true; startY = e.clientY; startX = e.clientX;
    });
    window.addEventListener("pointerup", function (e) {
      if (!tracking) return;
      tracking = false;
      var dy = e.clientY - startY;             // positive = swipe down
      var dx = Math.abs(e.clientX - startX);
      if (dy > 50 && dy > dx) openControlCenter();
    });
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

    // Home indicator: tap = minimize · swipe up = app switcher.
    wireHomeBar();
    // Top edge: swipe down = Control Center (quick settings).
    wireControlCenter();

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
