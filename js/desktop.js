/* NomuOS — Desktop controller (icons, start menu, clock) */
window.NomuDesktop = (function () {
  "use strict";

  // Apps shown on desktop and start menu (in order)
  var APP_ORDER = ["about", "skills", "contact", "browie", "terminal", "files", "editor", "calc", "paint", "settings"];

  function apps() {
    return APP_ORDER
      .map(function (id) { return window.NomuApps[id]; })
      .filter(Boolean);
  }

  function launch(id, arg) {
    var app = window.NomuApps[id];
    if (app && typeof app.open === "function") app.open(arg);
    closeStart();
  }

  // Apps intentionally hidden from the desktop (still available in the start menu)
  var DESKTOP_HIDDEN = ["about", "contact"];

  function buildDesktopIcons() {
    var host = document.getElementById("desktop-icons");
    host.innerHTML = "";
    apps()
      .filter(function (app) { return DESKTOP_HIDDEN.indexOf(app.id) === -1; })
      .forEach(function (app) {
      var el = document.createElement("button");
      el.className = "desktop-icon";
      el.innerHTML = '<span class="glyph">' + app.icon + '</span><span class="label"></span>';
      el.querySelector(".label").textContent = app.name;
      el.addEventListener("dblclick", function () { launch(app.id); });
      host.appendChild(el);
    });
    buildProjectIcons(host);
  }

  // Each project shows on the desktop as its own app icon.
  function projectList() {
    var p = window.NomuProfile && window.NomuProfile.projects;
    if (!p) return [];
    return (p.featured || []).concat(p.others || []);
  }

  function buildProjectIcons(host) {
    var list = projectList();
    if (!list.length || !window.NomuApps || !NomuApps.projects || typeof NomuApps.projects.launch !== "function") return;
    list.forEach(function (proj) {
      var el = document.createElement("button");
      el.className = "desktop-icon project-icon";
      el.innerHTML =
        '<span class="glyph"><i class="' + (proj.icon || "fas fa-code") + '"></i></span>' +
        '<span class="label"></span>';
      el.querySelector(".label").textContent = proj.name;
      el.addEventListener("dblclick", function () { NomuApps.projects.launch(proj); });
      host.appendChild(el);
    });
  }

  function buildStartMenu() {
    var host = document.getElementById("start-apps");
    host.innerHTML = "";
    // Start menu shows the first 5 apps plus Settings (6 total).
    var startApps = apps().slice(0, 5);
    var settings = window.NomuApps.settings;
    if (settings && startApps.indexOf(settings) === -1) startApps.push(settings);
    startApps.forEach(function (app) {
      var el = document.createElement("button");
      el.className = "start-app";
      el.innerHTML = '<span class="glyph">' + app.icon + '</span><span class="label"></span>';
      el.querySelector(".label").textContent = app.name;
      el.addEventListener("click", function () { launch(app.id); });
      host.appendChild(el);
    });
  }

  /* ---------------- All Apps drawer ---------------- */
  function buildAllApps() {
    var appHost = document.getElementById("aa-apps");
    var projHost = document.getElementById("aa-projects");
    if (!appHost || !projHost) return;

    appHost.innerHTML = "";
    apps().forEach(function (app) {
      var el = document.createElement("button");
      el.className = "aa-item";
      el.innerHTML = '<span class="glyph">' + app.icon + '</span><span class="label"></span>';
      el.querySelector(".label").textContent = app.name;
      el.addEventListener("click", function () { launch(app.id); closeAllApps(); });
      appHost.appendChild(el);
    });

    projHost.innerHTML = "";
    var list = projectList();
    var canOpen = window.NomuApps && NomuApps.projects && typeof NomuApps.projects.launch === "function";
    list.forEach(function (proj) {
      var el = document.createElement("button");
      el.className = "aa-item";
      el.innerHTML =
        '<span class="glyph proj-tile"><i class="' + (proj.icon || "fas fa-code") + '"></i></span>' +
        '<span class="label"></span>';
      el.querySelector(".label").textContent = proj.name;
      el.addEventListener("click", function () {
        if (canOpen) NomuApps.projects.launch(proj);
        closeAllApps();
      });
      projHost.appendChild(el);
    });
  }

  var allAppsOpen = false;
  function openAllApps() {
    buildAllApps();
    document.getElementById("all-apps").classList.remove("hidden");
    allAppsOpen = true;
    closeStart();
  }
  function closeAllApps() {
    var el = document.getElementById("all-apps");
    if (el) el.classList.add("hidden");
    allAppsOpen = false;
  }

  var startOpen = false;
  function toggleStart() { startOpen ? closeStart() : openStart(); }
  function openStart() {
    document.getElementById("start-menu").classList.remove("hidden");
    startOpen = true;
  }
  function closeStart() {
    document.getElementById("start-menu").classList.add("hidden");
    startOpen = false;
  }

  function startClock() {
    var el = document.getElementById("clock");
    function tick() {
      var now = new Date();
      var time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      var date = now.toLocaleDateString([], { month: "short", day: "numeric" });
      el.innerHTML = time + "<br>" + date;
    }
    tick();
    setInterval(tick, 1000 * 15);
  }

  /* ---------------- Lock screen (desktop only, password protected) ---------------- */
  var LOCK_PASSWORD = "nomucutie";
  var lockClockTimer = null;

  function lockClockTick() {
    var t = document.getElementById("lock-clock");
    if (!t) return;
    var now = new Date();
    var time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    var date = now.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
    t.innerHTML = '<span class="lock-time">' + time + '</span><span class="lock-date">' + date + '</span>';
  }

  function lock() {
    var ls = document.getElementById("lockscreen");
    if (!ls) return;
    closeStart();
    var input = document.getElementById("lock-input");
    var err = document.getElementById("lock-error");
    if (input) input.value = "";
    if (err) err.textContent = "";
    ls.classList.remove("hidden");
    requestAnimationFrame(function () { ls.classList.add("in"); });
    lockClockTick();
    clearInterval(lockClockTimer);
    lockClockTimer = setInterval(lockClockTick, 15000);
    setTimeout(function () { if (input) input.focus(); }, 50);
  }

  function unlock() {
    var ls = document.getElementById("lockscreen");
    if (!ls) return;
    ls.classList.remove("in");
    clearInterval(lockClockTimer);
    lockClockTimer = null;
    setTimeout(function () { ls.classList.add("hidden"); }, 350);
  }

  function tryUnlock() {
    var input = document.getElementById("lock-input");
    var err = document.getElementById("lock-error");
    var val = input ? input.value : "";
    if (val === LOCK_PASSWORD) {
      unlock();
    } else {
      if (err) err.textContent = "Incorrect password. Try again.";
      var inner = document.querySelector("#lockscreen .lock-inner");
      if (inner) {
        inner.classList.remove("shake");
        void inner.offsetWidth; // reflow to restart animation
        inner.classList.add("shake");
      }
      if (input) { input.value = ""; input.focus(); }
    }
  }

  function wireLock() {
    var form = document.getElementById("lock-form");
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        tryUnlock();
      });
    }
    var lockBtn = document.getElementById("start-lock");
    if (lockBtn) lockBtn.addEventListener("click", function () { lock(); });
  }

  function wire() {
    document.getElementById("start-button").addEventListener("click", function (e) {
      e.stopPropagation();
      toggleStart();
    });

    // click outside closes start menu
    document.addEventListener("click", function (e) {
      if (!startOpen) return;
      var menu = document.getElementById("start-menu");
      var btn = document.getElementById("start-button");
      if (!menu.contains(e.target) && !btn.contains(e.target)) closeStart();
    });

    document.getElementById("start-logout").addEventListener("click", function () {
      closeStart();
      NomuBoot.logout();
    });
    document.getElementById("start-restart").addEventListener("click", function () {
      closeStart();
      NomuBoot.restart();
    });

    var widgetsBtn = document.getElementById("widgets-button");
    if (widgetsBtn) {
      widgetsBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        if (window.NomuWidgets) NomuWidgets.togglePicker();
      });
    }

    var viewAll = document.getElementById("start-viewall");
    if (viewAll) viewAll.addEventListener("click", function (e) { e.stopPropagation(); openAllApps(); });

    var aaClose = document.getElementById("aa-close");
    if (aaClose) aaClose.addEventListener("click", closeAllApps);
    var aaBack = document.getElementById("aa-back");
    if (aaBack) aaBack.addEventListener("click", closeAllApps);

    // click outside the drawer closes it
    document.addEventListener("click", function (e) {
      if (!allAppsOpen) return;
      var panel = document.getElementById("all-apps");
      if (panel && !panel.contains(e.target)) closeAllApps();
    });
    // Esc closes the drawer
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && allAppsOpen) closeAllApps();
    });
  }

  function init() {
    NomuTheme.apply();
    NomuWM.init();
    buildDesktopIcons();
    buildStartMenu();
    startClock();
    wire();
    wireLock();
    if (window.NomuWidgets) NomuWidgets.init();
    if (window.NomuScreensaver) NomuScreensaver.init();
  }

  return { init: init, launch: launch, lock: lock };
})();
