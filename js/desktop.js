/* NomuOS — Desktop controller (icons, start menu, clock) */
window.NomuDesktop = (function () {
  "use strict";

  // Apps shown on desktop and start menu (in order)
  var APP_ORDER = ["about", "skills", "contact", "browie", "terminal", "files", "editor", "calc", "paint", "calendar", "nothing", "settings"];

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

  // Default start-menu apps: first 5 apps plus Settings (6 total).
  function defaultStartApps() {
    var startApps = apps().slice(0, 5);
    var settings = window.NomuApps.settings;
    if (settings && startApps.indexOf(settings) === -1) startApps.push(settings);
    return startApps;
  }

  function renderStartApps(list) {
    var host = document.getElementById("start-apps");
    host.innerHTML = "";
    if (!list.length) {
      var empty = document.createElement("div");
      empty.className = "start-empty";
      empty.textContent = "No results found";
      host.appendChild(empty);
      return;
    }
    list.forEach(function (entry) {
      var el = document.createElement("button");
      el.className = "start-app";
      el.innerHTML = '<span class="glyph">' + entry.glyph + '</span><span class="label"></span>';
      el.querySelector(".label").textContent = entry.name;
      el.addEventListener("click", entry.onClick);
      host.appendChild(el);
    });
  }

  // Build a render entry from an app object.
  function appEntry(app) {
    return { glyph: app.icon, name: app.name, onClick: function () { launch(app.id); } };
  }

  // Build a render entry from a project object.
  function projectEntry(proj) {
    var canOpen = window.NomuApps && NomuApps.projects && typeof NomuApps.projects.launch === "function";
    return {
      glyph: '<i class="' + (proj.icon || "fas fa-code") + '"></i>',
      name: proj.name,
      onClick: function () { if (canOpen) NomuApps.projects.launch(proj); closeStart(); },
    };
  }

  function buildStartMenu() {
    renderStartApps(defaultStartApps().map(appEntry));
  }

  // Filter apps AND projects by name; empty query restores the default 6.
  function searchStartApps(query) {
    query = (query || "").trim().toLowerCase();
    if (!query) { renderStartApps(defaultStartApps().map(appEntry)); return; }

    var appMatches = apps().filter(function (app) {
      return app.name.toLowerCase().indexOf(query) !== -1;
    }).map(appEntry);

    var projMatches = projectList().filter(function (proj) {
      return proj.name.toLowerCase().indexOf(query) !== -1;
    }).map(projectEntry);

    renderStartApps(appMatches.concat(projMatches));
  }

  // Launch the first currently-listed app (used by Enter in the search box).
  function launchFirstStartApp() {
    var host = document.getElementById("start-apps");
    var first = host && host.querySelector(".start-app");
    if (first) first.click();
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
    // Reset search to the default app list and focus the box.
    var search = document.getElementById("start-search");
    if (search) {
      search.value = "";
      searchStartApps("");
      setTimeout(function () { search.focus(); }, 50);
    }
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
      if (err) err.textContent = "kailangan mong tanggapin na cute si nomu";
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

    // Start menu app search
    var search = document.getElementById("start-search");
    if (search) {
      search.addEventListener("input", function () { searchStartApps(search.value); });
      search.addEventListener("keydown", function (e) {
        if (e.key === "Enter") { e.preventDefault(); launchFirstStartApp(); }
        else if (e.key === "Escape") { search.value = ""; searchStartApps(""); closeStart(); }
      });
      // clicking inside the search must not bubble to the outside-close handler
      search.addEventListener("click", function (e) { e.stopPropagation(); });
    }

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

    // Clicking the taskbar clock opens the Calendar app.
    var clockEl = document.getElementById("clock");
    if (clockEl) {
      clockEl.classList.add("clickable");
      clockEl.title = "Open Calendar";
      clockEl.addEventListener("click", function (e) {
        e.stopPropagation();
        if (window.NomuApps && NomuApps.calendar) launch("calendar");
      });
    }

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
    if (window.NomuGravity) NomuGravity.init();
  }

  return { init: init, launch: launch, lock: lock };
})();
