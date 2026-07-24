/* ============================================================
   NomuOS — Desktop Widgets
   A set of selectable widgets you can drag anywhere on the
   desktop. Positions + state are persisted to localStorage.
   ============================================================ */
window.NomuWidgets = (function () {
  "use strict";

  var STORAGE_KEY = "nomuos.widgets.v1";
  var layer = null;
  var idSeq = 0;
  var instances = []; // { id, type, x, y, el, data }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  /* ---------------- Widget type catalog ----------------
     Each type: { name, icon, w, h, render(bodyEl, inst) } */
  var TYPES = {
    clock: {
      name: "Clock",
      icon: "🕐",
      w: 220, h: 120,
      render: function (body) {
        body.innerHTML =
          '<div class="wg-clock">' +
            '<div class="wg-time">--:--</div>' +
            '<div class="wg-date"></div>' +
          "</div>";
      },
    },

    profile: {
      name: "Profile",
      icon: "👤",
      w: 260, h: 130,
      render: function (body) {
        var p = window.NomuProfile || {};
        body.innerHTML =
          '<div class="wg-profile">' +
            '<div class="wg-avatar">' + (p.avatar || "🧑‍💻") + "</div>" +
            '<div class="wg-pinfo">' +
              '<div class="wg-pname">' + esc(p.name || "Your Name") + "</div>" +
              '<div class="wg-prole">' + esc(p.role || "") + "</div>" +
              '<button class="wg-btn" data-open="about">View About →</button>' +
            "</div>" +
          "</div>";
        var b = body.querySelector('[data-open="about"]');
        if (b) b.addEventListener("click", function () { openApp("about"); });
      },
    },

    socials: {
      name: "Socials",
      icon: "🔗",
      w: 240, h: 150,
      render: function (body) {
        var socials = ((window.NomuProfile || {}).contact || {}).socials || [];
        var links = socials.map(function (s) {
          return (
            '<a class="wg-social" href="' + esc(s.url) + '" target="_blank" rel="noopener">' +
              '<i class="' + (s.icon || "fas fa-link") + '"></i>' +
              "<span>" + esc(s.label) + "</span>" +
            "</a>"
          );
        }).join("");
        body.innerHTML =
          '<div class="wg-head">Connect</div>' +
          '<div class="wg-socials">' + (links || '<div class="wg-empty">No socials</div>') + "</div>";
      },
    },

    projects: {
      name: "Featured Projects",
      icon: "🗂️",
      w: 280, h: 210,
      render: function (body) {
        var feat = (((window.NomuProfile || {}).projects || {}).featured || []).slice(0, 4);
        var rows = feat.map(function (pr) {
          var hasLink = pr.url && pr.url !== "#";
          var inner =
            '<span class="wg-picon"><i class="' + (pr.icon || "fas fa-code") + '"></i></span>' +
            '<span class="wg-pname2">' + esc(pr.name) + "</span>";
          return hasLink
            ? '<a class="wg-proj" href="' + esc(pr.url) + '" target="_blank" rel="noopener">' + inner + "</a>"
            : '<div class="wg-proj">' + inner + "</div>";
        }).join("");
        body.innerHTML =
          '<div class="wg-head">Featured Projects</div>' +
          '<div class="wg-projs">' + (rows || '<div class="wg-empty">No projects</div>') + "</div>" +
          '<button class="wg-btn" data-open="projects">See all →</button>';
        var b = body.querySelector('[data-open="projects"]');
        if (b) b.addEventListener("click", function () { openApp("projects"); });
      },
    },

    skills: {
      name: "Core Strengths",
      icon: "🧩",
      w: 260, h: 190,
      render: function (body) {
        var strengths = (((window.NomuProfile || {}).skills || {}).coreStrengths || []).slice(0, 4);
        var bars = strengths.map(function (s) {
          var pct = Math.max(0, Math.min(100, s.percentage || 0));
          return (
            '<div class="wg-skill">' +
              '<div class="wg-skhead"><span>' + esc(s.name) + "</span><span>" + pct + "%</span></div>" +
              '<div class="wg-sktrack"><div class="wg-skfill" style="width:' + pct + '%"></div></div>' +
            "</div>"
          );
        }).join("");
        body.innerHTML =
          '<div class="wg-head">Core Strengths</div>' +
          '<div class="wg-skills">' + (bars || '<div class="wg-empty">No data</div>') + "</div>";
      },
    },

    notes: {
      name: "Sticky Note",
      icon: "📝",
      w: 220, h: 180,
      render: function (body, inst) {
        body.innerHTML =
          '<div class="wg-head">Note</div>' +
          '<textarea class="wg-note" placeholder="Type a note…" spellcheck="false"></textarea>';
        var ta = body.querySelector(".wg-note");
        ta.value = (inst.data && inst.data.text) || "";
        ta.addEventListener("input", function () {
          inst.data = inst.data || {};
          inst.data.text = ta.value;
          save();
        });
        // don't start a drag when interacting with the textarea
        ta.addEventListener("mousedown", function (e) { e.stopPropagation(); });
      },
    },
  };

  function openApp(id) {
    if (window.NomuApps && window.NomuApps[id] && typeof window.NomuApps[id].open === "function") {
      window.NomuApps[id].open();
    }
  }

  /* ---------------- Persistence ---------------- */
  function save() {
    try {
      var data = instances.map(function (w) {
        return { id: w.id, type: w.type, x: w.x, y: w.y, data: w.data || null };
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) { /* storage may be unavailable */ }
  }

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    return null;
  }

  /* ---------------- Bounds ---------------- */
  function taskbarH() {
    var v = getComputedStyle(document.documentElement).getPropertyValue("--taskbar-h");
    var n = parseInt(v, 10);
    return isNaN(n) ? 58 : n;
  }
  function clamp(inst) {
    var maxX = window.innerWidth - inst.el.offsetWidth - 8;
    var maxY = window.innerHeight - taskbarH() - inst.el.offsetHeight - 20;
    inst.x = Math.max(8, Math.min(inst.x, Math.max(8, maxX)));
    inst.y = Math.max(8, Math.min(inst.y, Math.max(8, maxY)));
    inst.el.style.left = inst.x + "px";
    inst.el.style.top = inst.y + "px";
  }

  /* ---------------- Create a widget element ---------------- */
  function build(inst) {
    var def = TYPES[inst.type];
    if (!def) return;

    var el = document.createElement("div");
    el.className = "widget widget-" + inst.type;
    el.style.width = def.w + "px";
    el.style.minHeight = def.h + "px";
    el.style.left = inst.x + "px";
    el.style.top = inst.y + "px";
    el.innerHTML =
      '<div class="widget-drag">' +
        '<span class="wd-grip">⠿</span>' +
        '<span class="wd-title">' + esc(def.name) + "</span>" +
        '<button class="wd-close" title="Remove">×</button>' +
      "</div>" +
      '<div class="widget-body"></div>';

    inst.el = el;
    var bodyEl = el.querySelector(".widget-body");
    try { def.render(bodyEl, inst); }
    catch (e) { bodyEl.innerHTML = '<div class="wg-empty">Widget error</div>'; }

    el.querySelector(".wd-close").addEventListener("click", function (e) {
      e.stopPropagation();
      remove(inst.id);
    });

    makeDraggable(inst, el.querySelector(".widget-drag"));

    layer.appendChild(el);
    clamp(inst);
  }

  function makeDraggable(inst, handle) {
    var sx, sy, ox, oy, dragging = false;
    handle.addEventListener("mousedown", function (e) {
      // While gravity is on, the physics engine owns dragging.
      if (window.NomuGravity && NomuGravity.isEnabled && NomuGravity.isEnabled()) return;
      if (e.button !== 0) return;
      if (e.target.classList.contains("wd-close")) return;
      dragging = true;
      sx = e.clientX; sy = e.clientY;
      ox = inst.x; oy = inst.y;
      inst.el.classList.add("dragging");
      document.body.style.userSelect = "none";
      e.preventDefault();
    });
    window.addEventListener("mousemove", function (e) {
      if (!dragging) return;
      inst.x = ox + (e.clientX - sx);
      inst.y = oy + (e.clientY - sy);
      inst.el.style.left = inst.x + "px";
      inst.el.style.top = inst.y + "px";
    });
    window.addEventListener("mouseup", function () {
      if (!dragging) return;
      dragging = false;
      inst.el.classList.remove("dragging");
      document.body.style.userSelect = "";
      clamp(inst);
      save();
    });
  }

  /* ---------------- Public actions ---------------- */
  function hasType(type) {
    for (var i = 0; i < instances.length; i++) {
      if (instances[i].type === type) return true;
    }
    return false;
  }

  function add(type, opts) {
    if (!TYPES[type]) return;
    // one instance per widget type — no duplicates
    if (hasType(type)) return null;
    opts = opts || {};
    var n = instances.length;
    var inst = {
      id: ++idSeq,
      type: type,
      x: opts.x != null ? opts.x : 40 + (n % 6) * 28,
      y: opts.y != null ? opts.y : 40 + (n % 6) * 28,
      data: opts.data || null,
      el: null,
    };
    instances.push(inst);
    build(inst);
    save();
    return inst;
  }

  function removeByType(type) {
    for (var i = 0; i < instances.length; i++) {
      if (instances[i].type === type) { remove(instances[i].id); return; }
    }
  }

  function remove(id) {
    for (var i = 0; i < instances.length; i++) {
      if (instances[i].id === id) {
        if (instances[i].el) instances[i].el.remove();
        instances.splice(i, 1);
        save();
        if (pickerOpen) buildPicker(); // keep gallery labels in sync
        return;
      }
    }
  }

  function clearAll() {
    instances.slice().forEach(function (w) { remove(w.id); });
  }

  /* ---------------- Clock ticker (updates all clock widgets) ---------------- */
  function tickClocks() {
    var now = new Date();
    var time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    var date = now.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
    if (!layer) return;
    layer.querySelectorAll(".wg-time").forEach(function (el) { el.textContent = time; });
    layer.querySelectorAll(".wg-date").forEach(function (el) { el.textContent = date; });
  }

  /* ---------------- Widget picker (gallery) ---------------- */
  function buildPicker() {
    var host = document.getElementById("widget-picker-list");
    if (!host) return;
    host.innerHTML = "";
    Object.keys(TYPES).forEach(function (type) {
      var def = TYPES[type];
      var active = hasType(type);
      var el = document.createElement("button");
      el.className = "wp-item" + (active ? " active" : "");
      el.innerHTML =
        '<span class="wp-glyph">' + def.icon + "</span>" +
        '<span class="wp-name"></span>' +
        '<span class="wp-add">' + (active ? "✓ Remove" : "＋ Add") + "</span>";
      el.querySelector(".wp-name").textContent = def.name;
      el.addEventListener("click", function () {
        if (hasType(type)) removeByType(type);
        else add(type);
        buildPicker(); // refresh labels, keep the gallery open
      });
      host.appendChild(el);
    });
  }

  var pickerOpen = false;
  function openPicker() {
    var el = document.getElementById("widget-picker");
    if (!el) return;
    buildPicker();
    el.classList.remove("hidden");
    pickerOpen = true;
  }
  function closePicker() {
    var el = document.getElementById("widget-picker");
    if (!el) return;
    el.classList.add("hidden");
    pickerOpen = false;
  }
  function togglePicker() { pickerOpen ? closePicker() : openPicker(); }

  /* ---------------- Init ---------------- */
  function init() {
    layer = document.getElementById("widget-layer");
    if (!layer) return;

    // restore any widgets the user added before
    var saved = loadState();
    if (saved && saved.length) {
      saved.forEach(function (w) {
        if (!TYPES[w.type]) return;
        idSeq++;
        var inst = { id: idSeq, type: w.type, x: w.x, y: w.y, data: w.data || null, el: null };
        instances.push(inst);
        build(inst);
      });
    }
    // No auto-added widgets on first load — the desktop starts clean.

    tickClocks();
    setInterval(tickClocks, 1000);

    // reposition within bounds on resize
    window.addEventListener("resize", function () {
      instances.forEach(clamp);
    });

    // click outside closes the picker
    document.addEventListener("click", function (e) {
      if (!pickerOpen) return;
      var panel = document.getElementById("widget-picker");
      var btn = document.getElementById("widgets-button");
      if (panel && !panel.contains(e.target) && btn && !btn.contains(e.target)) closePicker();
    });
  }

  return {
    init: init,
    add: add,
    remove: remove,
    removeByType: removeByType,
    hasType: hasType,
    clearAll: clearAll,
    openPicker: openPicker,
    closePicker: closePicker,
    togglePicker: togglePicker,
  };
})();
