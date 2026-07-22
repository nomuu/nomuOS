/* ============================================================
   NomuOS — Screensaver
   Fullscreen idle overlay for both desktop and mobile shells.
   Shows a DVD-style bouncing logo + a soft clock over a starry
   backdrop after a configurable period of inactivity. Any
   pointer / key / touch activity wakes the system.

   Timeout is chosen in Settings and persisted in localStorage.
   ============================================================ */
window.NomuScreensaver = (function () {
  "use strict";

  var KEY = "nomuos.screensaver.v1";
  var DEFAULT_MS = 60000; // 1 minute

  // Options surfaced in Settings (ms = 0 means "Off").
  var OPTIONS = [
    { id: "off", label: "Off", ms: 0 },
    { id: "30s", label: "30 sec", ms: 30000 },
    { id: "1m", label: "1 min", ms: 60000 },
    { id: "2m", label: "2 min", ms: 120000 },
    { id: "5m", label: "5 min", ms: 300000 },
    { id: "10m", label: "10 min", ms: 600000 },
  ];

  var initialized = false;
  var active = false;        // overlay currently showing
  var timer = null;          // idle countdown
  var raf = null;            // bounce animation frame
  var clockTimer = null;     // clock refresh while active

  var overlay = null, logoEl = null, timeEl = null, dateEl = null;

  // Bounce state
  var x = 80, y = 80, vx = 1.5, vy = 1.2, hue = 0;

  /* ---------------- persistence ---------------- */
  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
  }
  function save(cfg) { try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch (e) {} }

  function currentMs() {
    var cfg = load();
    return typeof cfg.ms === "number" ? cfg.ms : DEFAULT_MS;
  }
  function setTimeoutMs(ms) {
    save({ ms: ms });
    // Restart the idle countdown with the new value (without triggering the
    // lock screen, which the wake() path would do).
    if (active) hide();
    arm();
  }
  function currentId() {
    var ms = currentMs();
    for (var i = 0; i < OPTIONS.length; i++) if (OPTIONS[i].ms === ms) return OPTIONS[i].id;
    return "custom";
  }

  /* ---------------- overlay DOM ---------------- */
  function build() {
    if (overlay) return;
    overlay = document.createElement("div");
    overlay.className = "screensaver hidden";
    overlay.setAttribute("aria-hidden", "true");

    var stars = "";
    for (var i = 0; i < 60; i++) {
      var top = Math.random() * 100;
      var left = Math.random() * 100;
      var size = (Math.random() * 2 + 1).toFixed(2);
      var delay = (Math.random() * 6).toFixed(2);
      var dur = (Math.random() * 4 + 3).toFixed(2);
      stars +=
        '<span class="ss-star" style="top:' + top.toFixed(2) + '%;left:' + left.toFixed(2) +
        '%;width:' + size + 'px;height:' + size + 'px;animation-delay:' + delay +
        's;animation-duration:' + dur + 's"></span>';
    }

    overlay.innerHTML =
      '<div class="ss-stars">' + stars + "</div>" +
      '<div class="ss-clock">' +
        '<div class="ss-time" id="ss-time"></div>' +
        '<div class="ss-date" id="ss-date"></div>' +
      "</div>" +
      '<div class="ss-logo" id="ss-logo">' +
        '<span class="ss-logo-mark">N</span>' +
        '<span class="ss-logo-name">NomuOS</span>' +
      "</div>" +
      '<div class="ss-hint">move, click or tap to wake</div>';

    document.body.appendChild(overlay);
    logoEl = overlay.querySelector("#ss-logo");
    timeEl = overlay.querySelector("#ss-time");
    dateEl = overlay.querySelector("#ss-date");
  }

  /* ---------------- clock ---------------- */
  function tickClock() {
    if (!timeEl) return;
    var d = new Date();
    timeEl.textContent = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    dateEl.textContent = d.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
  }

  /* ---------------- bounce animation ---------------- */
  function bump() {
    hue = (hue + 47) % 360;
    if (logoEl) logoEl.style.filter = "hue-rotate(" + hue + "deg)";
  }

  function step() {
    if (!active || !logoEl) return;
    var W = window.innerWidth, H = window.innerHeight;
    var w = logoEl.offsetWidth || 160, h = logoEl.offsetHeight || 80;

    x += vx; y += vy;
    if (x <= 0) { x = 0; vx = -vx; bump(); }
    else if (x + w >= W) { x = W - w; vx = -vx; bump(); }
    if (y <= 0) { y = 0; vy = -vy; bump(); }
    else if (y + h >= H) { y = H - h; vy = -vy; bump(); }

    logoEl.style.transform = "translate(" + x + "px," + y + "px)";
    raf = requestAnimationFrame(step);
  }

  function startAnim() {
    var W = window.innerWidth, H = window.innerHeight;
    x = Math.max(20, Math.random() * (W - 220));
    y = Math.max(20, Math.random() * (H - 160));
    tickClock();
    clearInterval(clockTimer);
    clockTimer = setInterval(tickClock, 10000);
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(step);
  }
  function stopAnim() {
    cancelAnimationFrame(raf); raf = null;
    clearInterval(clockTimer); clockTimer = null;
  }

  /* ---------------- show / hide ---------------- */
  function show() {
    if (active) return;
    if (currentMs() <= 0) return;
    build();
    active = true;
    overlay.classList.remove("hidden");
    overlay.setAttribute("aria-hidden", "false");
    requestAnimationFrame(function () { if (overlay) overlay.classList.add("in"); });
    startAnim();
  }

  function hide() {
    if (!active) return;
    active = false;
    stopAnim();
    if (overlay) {
      overlay.classList.remove("in");
      overlay.setAttribute("aria-hidden", "true");
      setTimeout(function () { if (overlay && !active) overlay.classList.add("hidden"); }, 400);
    }
  }

  /* ---------------- idle handling ---------------- */
  function arm() {
    clearTimeout(timer);
    var ms = currentMs();
    if (ms > 0) timer = setTimeout(show, ms);
  }

  // Waking from the screensaver: require the passcode instead of dropping
  // straight to the home screen. Desktop uses its password lock screen;
  // mobile uses its 6-digit PIN lock screen.
  function wake() {
    if (!active) return;
    hide();
    var onMobile = !!(window.NomuMobile && NomuMobile.isActive());
    if (onMobile) {
      if (window.NomuMobile && typeof NomuMobile.lock === "function") NomuMobile.lock();
    } else if (window.NomuDesktop && typeof NomuDesktop.lock === "function") {
      NomuDesktop.lock();
    }
  }

  function onActivity() {
    if (active) { wake(); arm(); return; }
    arm();
  }

  /* ---------------- init ---------------- */
  function init() {
    if (initialized) { arm(); return; }
    initialized = true;

    var evts = ["mousemove", "mousedown", "keydown", "wheel", "touchstart", "touchmove"];
    evts.forEach(function (ev) {
      document.addEventListener(ev, onActivity, { passive: true });
    });
    // Pause countdown when tab is hidden; re-arm when it returns.
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { clearTimeout(timer); }
      else { onActivity(); }
    });

    arm();
  }

  return {
    OPTIONS: OPTIONS,
    init: init,
    currentMs: currentMs,
    currentId: currentId,
    setTimeoutMs: setTimeoutMs,
    show: show,
    hide: hide,
  };
})();
