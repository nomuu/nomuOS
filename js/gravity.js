/* ============================================================
   NomuOS — Gravity (a desktop physics easter egg)
   A floating toggle. Flip it ON and every desktop icon — plus the
   toggle button itself — drops, bounces off the floor/walls, and can
   be grabbed and flung with the mouse. Flip it OFF and everything
   flies back to its place. Desktop only.
   ============================================================ */
window.NomuGravity = (function () {
  "use strict";

  var enabled = false;
  var bodies = [];
  var raf = null;
  var toggleBtn = null;
  var drag = null;          // { body, offX, offY, lastX, lastY, vx, vy, moved }
  var restoreTimer = null;

  // tuning
  var GRAV = 0.9;           // downward acceleration (px/frame^2)
  var REST = 0.55;          // bounciness (0..1)
  var FRICTION = 0.9;       // horizontal damping on floor contact
  var AIR = 0.995;          // air drag per frame
  var VMAX = 45;            // velocity clamp

  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }

  /* ---------------- toggle button ---------------- */
  function makeToggle() {
    var btn = document.createElement("button");
    btn.id = "gravity-toggle";
    btn.type = "button";
    btn.style.cssText =
      "position:fixed;top:16px;right:16px;z-index:6000;cursor:pointer;" +
      "padding:8px 14px;border-radius:999px;font:600 13px 'Segoe UI',sans-serif;" +
      "color:#fff;border:1px solid rgba(255,255,255,.28);" +
      "background:rgba(20,24,51,.55);backdrop-filter:blur(10px);" +
      "-webkit-backdrop-filter:blur(10px);box-shadow:0 6px 18px rgba(0,0,0,.3);" +
      "user-select:none;-webkit-user-select:none;";
    btn.innerHTML = '<span class="gt-label">🌐 Gravity: OFF</span>';
    btn.addEventListener("click", function () {
      // A click that was really a fling (moved) is ignored; the browser
      // suppresses click after a large pointer move, so this just toggles taps.
      if (drag && drag.moved) return;
      toggle();
    });
    // Append inside #desktop (not <body>) so the lockscreen — which lives in
    // #desktop and creates its own stacking context via position:fixed — can
    // cover the toggle. #desktop has no transform, so fixed positioning still
    // resolves against the viewport.
    var host = document.getElementById("desktop") || document.body;
    host.appendChild(btn);
    return btn;
  }

  function setLabel() {
    var l = toggleBtn && toggleBtn.querySelector(".gt-label");
    if (l) l.textContent = enabled ? "🪐 Gravity: ON" : "🌐 Gravity: OFF";
  }

  /* ---------------- body helpers ---------------- */
  function collectEls() {
    var els = [];
    document.querySelectorAll("#desktop-icons .desktop-icon").forEach(function (e) { els.push(e); });
    var taskbar = document.getElementById("taskbar");
    if (taskbar) els.push(taskbar);
    els.push(toggleBtn);
    return els;
  }

  function makeBody(el) {
    var r = el.getBoundingClientRect();
    return {
      el: el,
      x: r.left, y: r.top, w: r.width, h: r.height,
      vx: (Math.random() - 0.5) * 8,
      vy: -(Math.random() * 6 + 3),                    // little upward pop, then it falls
      angle: 0, va: (Math.random() - 0.5) * 0.2,
      home: { x: r.left, y: r.top },
      savedCss: el.style.cssText,
    };
  }

  function freeze(b) {
    var s = b.el.style;
    s.position = "fixed";
    s.left = "0"; s.top = "0"; s.margin = "0";
    s.width = b.w + "px"; s.height = b.h + "px";
    s.zIndex = "9000";
    s.transition = "none";
    s.willChange = "transform";
    apply(b);
  }

  function apply(b) {
    b.el.style.transform =
      "translate(" + b.x + "px," + b.y + "px) rotate(" + b.angle + "rad)";
  }

  function bodyOf(el) {
    for (var i = 0; i < bodies.length; i++) if (bodies[i].el === el) return bodies[i];
    return null;
  }

  /* ---------------- simulation ---------------- */
  function step() {
    var W = window.innerWidth;
    var floorY = window.innerHeight;   // taskbar now falls too, so the floor is the screen bottom

    for (var i = 0; i < bodies.length; i++) {
      var b = bodies[i];
      if (drag && drag.body === b) { apply(b); continue; }

      b.vy += GRAV;
      b.vx *= AIR; b.vy *= AIR;
      b.vx = clamp(b.vx, -VMAX, VMAX);
      b.vy = clamp(b.vy, -VMAX, VMAX);

      b.x += b.vx; b.y += b.vy;
      b.angle += b.va; b.va *= 0.99;

      // floor
      if (b.y + b.h > floorY) {
        b.y = floorY - b.h;
        if (Math.abs(b.vy) > 1.2) b.vy = -b.vy * REST; else b.vy = 0;
        b.vx *= FRICTION;
        b.va = b.vx * 0.03;          // roll a little
      }
      // ceiling
      if (b.y < 0) { b.y = 0; b.vy = -b.vy * REST; }
      // walls
      if (b.x < 0) { b.x = 0; b.vx = -b.vx * REST; b.va += 0.05; }
      else if (b.x + b.w > W) { b.x = W - b.w; b.vx = -b.vx * REST; b.va -= 0.05; }

      apply(b);
    }
    raf = requestAnimationFrame(step);
  }

  /* ---------------- drag / throw ---------------- */
  function onDown(e) {
    if (!enabled) return;
    var el = e.target.closest(".desktop-icon, #gravity-toggle, #taskbar");
    if (!el) return;
    var b = bodyOf(el);
    if (!b) return;
    drag = {
      body: b, offX: e.clientX - b.x, offY: e.clientY - b.y,
      lastX: e.clientX, lastY: e.clientY, vx: 0, vy: 0, moved: false,
    };
    document.body.style.userSelect = "none";
  }
  function onMove(e) {
    if (!drag) return;
    var b = drag.body;
    b.x = e.clientX - drag.offX;
    b.y = e.clientY - drag.offY;
    drag.vx = e.clientX - drag.lastX;
    drag.vy = e.clientY - drag.lastY;
    if (Math.hypot(drag.vx, drag.vy) > 2) drag.moved = true;
    drag.lastX = e.clientX; drag.lastY = e.clientY;
    apply(b);
  }
  function onUp() {
    if (!drag) return;
    var b = drag.body;
    b.vx = clamp(drag.vx, -VMAX, VMAX);
    b.vy = clamp(drag.vy, -VMAX, VMAX);
    b.va += clamp(drag.vx, -VMAX, VMAX) * 0.01;   // fling adds some spin
    document.body.style.userSelect = "";
    // keep .moved briefly so the click handler can ignore a fling
    var wasMoved = drag.moved;
    drag = wasMoved ? drag : null;
    if (wasMoved) setTimeout(function () { drag = null; }, 0);
  }

  /* ---------------- enable / disable ---------------- */
  function enable() {
    if (enabled) return;
    clearTimeout(restoreTimer);
    enabled = true;
    setLabel();

    var els = collectEls();
    bodies = els.map(makeBody);   // capture ALL rects before mutating any
    bodies.forEach(freeze);

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    document.addEventListener("pointerdown", onDown, true);

    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(step);
  }

  function disable() {
    if (!enabled) return;
    enabled = false;
    setLabel();
    cancelAnimationFrame(raf); raf = null;
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    document.removeEventListener("pointerdown", onDown, true);
    drag = null;

    // fly everything home, then restore original styles
    var snapshot = bodies.slice();
    snapshot.forEach(function (b) {
      b.el.style.transition = "transform 0.55s cubic-bezier(.22,1,.36,1)";
      b.el.style.transform =
        "translate(" + b.home.x + "px," + b.home.y + "px) rotate(0rad)";
    });
    bodies = [];
    restoreTimer = setTimeout(function () {
      snapshot.forEach(function (b) { b.el.style.cssText = b.savedCss; });
    }, 580);
  }

  function toggle() { enabled ? disable() : enable(); }

  function init() {
    if (window.NomuMobile && NomuMobile.isActive && NomuMobile.isActive()) return; // desktop only
    if (toggleBtn) return;
    toggleBtn = makeToggle();
    // keep the floor sensible on resize (step() already reads live values)
  }

  return { init: init, enable: enable, disable: disable, toggle: toggle };
})();
