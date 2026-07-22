/* ============================================================
   NomuOS — Window Manager
   Handles creating windows, dragging, resizing, focus/z-index,
   minimize, maximize, close, and taskbar syncing.
   ============================================================ */
window.NomuWM = (function () {
  "use strict";

  var layer, taskList;
  var windows = [];      // { id, el, title, icon, taskEl, minimized, maximized, prevRect }
  var zCounter = 100;
  var idCounter = 0;
  var activeId = null;
  var offsetStep = 0;

  function init() {
    layer = document.getElementById("window-layer");
    taskList = document.getElementById("task-list");
  }

  function focus(id) {
    var w = find(id);
    if (!w) return;
    zCounter++;
    w.el.style.zIndex = zCounter;
    activeId = id;
    windows.forEach(function (o) {
      if (o.taskEl) o.taskEl.classList.toggle("active", o.id === id);
    });
  }

  function find(id) {
    for (var i = 0; i < windows.length; i++) if (windows[i].id === id) return windows[i];
    return null;
  }

  /**
   * open(opts)
   * opts: { title, icon, width, height, x, y, render(bodyEl, api) }
   * returns window handle { id, el, body, close, setTitle }
   */
  function open(opts) {
    opts = opts || {};
    var id = ++idCounter;
    var width = opts.width || 520;
    var height = opts.height || 380;

    // cascade placement
    offsetStep = (offsetStep + 1) % 8;
    var x = opts.x != null ? opts.x : Math.max(20, (window.innerWidth - width) / 2 - 60 + offsetStep * 26);
    var y = opts.y != null ? opts.y : Math.max(20, (window.innerHeight - height) / 2 - 80 + offsetStep * 24);

    var el = document.createElement("div");
    el.className = "window";
    el.style.width = width + "px";
    el.style.height = height + "px";
    el.style.left = x + "px";
    el.style.top = y + "px";
    el.style.zIndex = ++zCounter;

    var icon = opts.icon || "🪟";
    el.innerHTML =
      '<div class="window-titlebar">' +
        '<span class="w-icon">' + icon + '</span>' +
        '<span class="w-title"></span>' +
        '<div class="window-controls">' +
          '<button class="win-btn min" title="Minimize"></button>' +
          '<button class="win-btn max" title="Maximize"></button>' +
          '<button class="win-btn close" title="Close"></button>' +
        '</div>' +
      '</div>' +
      '<div class="window-body"></div>' +
      '<div class="window-resizer"></div>';

    layer.appendChild(el);

    var titlebar = el.querySelector(".window-titlebar");
    var titleEl = el.querySelector(".w-title");
    var body = el.querySelector(".window-body");
    var resizer = el.querySelector(".window-resizer");
    titleEl.textContent = opts.title || "Window";

    var w = {
      id: id, el: el, title: opts.title || "Window", icon: icon,
      minimized: false, maximized: false, prevRect: null, taskEl: null,
    };
    windows.push(w);

    // ---- taskbar item ----
    var taskEl = document.createElement("button");
    taskEl.className = "task-item";
    taskEl.innerHTML = '<span class="t-glyph">' + icon + '</span><span class="t-label"></span>';
    taskEl.querySelector(".t-label").textContent = w.title;
    taskEl.addEventListener("click", function () {
      if (w.minimized) { restore(id); }
      else if (activeId === id) { minimize(id); }
      else { focus(id); }
    });
    taskList.appendChild(taskEl);
    w.taskEl = taskEl;

    // ---- controls ----
    el.querySelector(".win-btn.min").addEventListener("click", function (e) { e.stopPropagation(); minimize(id); });
    el.querySelector(".win-btn.max").addEventListener("click", function (e) { e.stopPropagation(); toggleMax(id); });
    el.querySelector(".win-btn.close").addEventListener("click", function (e) { e.stopPropagation(); close(id); });
    titlebar.addEventListener("dblclick", function () { toggleMax(id); });

    el.addEventListener("mousedown", function () { focus(id); });

    makeDraggable(w, titlebar);
    makeResizable(w, resizer);

    focus(id);

    var api = {
      id: id,
      el: el,
      body: body,
      close: function () { close(id); },
      focus: function () { focus(id); },
      setTitle: function (t) {
        w.title = t;
        titleEl.textContent = t;
        taskEl.querySelector(".t-label").textContent = t;
      },
    };

    if (typeof opts.render === "function") {
      try { opts.render(body, api); }
      catch (err) { body.innerHTML = '<div class="app-pad">App failed to load: ' + err + '</div>'; }
    }

    return api;
  }

  function minimize(id) {
    var w = find(id);
    if (!w) return;
    w.minimized = true;
    w.el.classList.add("minimized");
    if (w.taskEl) w.taskEl.classList.remove("active");
    // focus next visible window
    for (var i = windows.length - 1; i >= 0; i--) {
      if (!windows[i].minimized && windows[i].id !== id) { focus(windows[i].id); break; }
    }
  }

  function restore(id) {
    var w = find(id);
    if (!w) return;
    w.minimized = false;
    w.el.classList.remove("minimized");
    focus(id);
  }

  function toggleMax(id) {
    var w = find(id);
    if (!w) return;
    if (w.maximized) {
      w.maximized = false;
      w.el.classList.remove("maximized");
      if (w.prevRect) {
        w.el.style.left = w.prevRect.left;
        w.el.style.top = w.prevRect.top;
        w.el.style.width = w.prevRect.width;
        w.el.style.height = w.prevRect.height;
      }
    } else {
      w.prevRect = {
        left: w.el.style.left, top: w.el.style.top,
        width: w.el.style.width, height: w.el.style.height,
      };
      w.maximized = true;
      w.el.classList.add("maximized");
    }
    focus(id);
  }

  function close(id) {
    var w = find(id);
    if (!w) return;
    w.el.remove();
    if (w.taskEl) w.taskEl.remove();
    windows = windows.filter(function (o) { return o.id !== id; });
    if (activeId === id) {
      activeId = null;
      if (windows.length) focus(windows[windows.length - 1].id);
    }
  }

  function makeDraggable(w, handle) {
    var startX, startY, origX, origY, dragging = false;
    handle.addEventListener("mousedown", function (e) {
      if (e.button !== 0) return;
      if (w.maximized) return; // don't drag maximized
      dragging = true;
      startX = e.clientX; startY = e.clientY;
      origX = parseInt(w.el.style.left, 10) || 0;
      origY = parseInt(w.el.style.top, 10) || 0;
      document.body.style.userSelect = "none";
      e.preventDefault();
    });
    window.addEventListener("mousemove", function (e) {
      if (!dragging) return;
      var nx = origX + (e.clientX - startX);
      var ny = origY + (e.clientY - startY);
      // keep titlebar reachable
      nx = Math.min(Math.max(nx, -w.el.offsetWidth + 80), window.innerWidth - 80);
      ny = Math.min(Math.max(ny, 0), window.innerHeight - 60);
      w.el.style.left = nx + "px";
      w.el.style.top = ny + "px";
    });
    window.addEventListener("mouseup", function () {
      dragging = false;
      document.body.style.userSelect = "";
    });
  }

  function makeResizable(w, resizer) {
    var startX, startY, startW, startH, resizing = false;
    resizer.addEventListener("mousedown", function (e) {
      if (e.button !== 0) return;
      resizing = true;
      startX = e.clientX; startY = e.clientY;
      startW = w.el.offsetWidth; startH = w.el.offsetHeight;
      document.body.style.userSelect = "none";
      e.preventDefault(); e.stopPropagation();
    });
    window.addEventListener("mousemove", function (e) {
      if (!resizing) return;
      var nw = Math.max(280, startW + (e.clientX - startX));
      var nh = Math.max(180, startH + (e.clientY - startY));
      w.el.style.width = nw + "px";
      w.el.style.height = nh + "px";
    });
    window.addEventListener("mouseup", function () {
      resizing = false;
      document.body.style.userSelect = "";
    });
  }

  return {
    init: init,
    open: open,
    focus: focus,
    minimize: minimize,
    close: close,
  };
})();
