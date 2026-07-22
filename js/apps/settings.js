/* NomuOS — Settings app + theme engine */
window.NomuApps = window.NomuApps || {};

/* ---------- Theme engine (accent + wallpaper), persisted ---------- */
window.NomuTheme = (function () {
  "use strict";
  var KEY = "nomuos.theme.v1";

  var ACCENTS = [
    { id: "aurora", a: "#7c5cff", b: "#21d4fd" },
    { id: "sunset", a: "#ff5c9d", b: "#ffb347" },
    { id: "forest", a: "#2fd671", b: "#21d4fd" },
    { id: "cherry", a: "#ff5c6c", b: "#ff8a5c" },
    { id: "royal", a: "#8a5cff", b: "#ff5c9d" },
  ];

  var WALLPAPERS = [
    { id: "aurora", css: "radial-gradient(1200px 800px at 15% 10%, rgba(124,92,255,.35), transparent 60%), radial-gradient(1000px 700px at 85% 20%, rgba(33,212,253,.25), transparent 55%), radial-gradient(900px 700px at 60% 90%, rgba(255,92,157,.22), transparent 55%), linear-gradient(160deg,#0b0d1a,#141833)" },
    { id: "midnight", css: "radial-gradient(900px 700px at 30% 20%, rgba(124,92,255,.25), transparent 60%), linear-gradient(160deg,#05060f,#0d1024)" },
    { id: "ocean", css: "radial-gradient(1100px 800px at 70% 15%, rgba(33,212,253,.30), transparent 60%), linear-gradient(160deg,#04121f,#0a2536)" },
    { id: "candy", css: "radial-gradient(1000px 700px at 20% 80%, rgba(255,92,157,.30), transparent 60%), radial-gradient(900px 700px at 80% 15%, rgba(255,179,71,.25), transparent 55%), linear-gradient(160deg,#180a1a,#2a1030)" },
  ];

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
  }
  function save(t) { try { localStorage.setItem(KEY, JSON.stringify(t)); } catch (e) {} }

  function current() {
    var t = load();
    return { accent: t.accent || "aurora", wallpaper: t.wallpaper || "aurora" };
  }

  function findAccent(id) { for (var i=0;i<ACCENTS.length;i++) if (ACCENTS[i].id===id) return ACCENTS[i]; return ACCENTS[0]; }
  function findWall(id) { for (var i=0;i<WALLPAPERS.length;i++) if (WALLPAPERS[i].id===id) return WALLPAPERS[i]; return WALLPAPERS[0]; }

  function apply() {
    var t = current();
    var acc = findAccent(t.accent);
    document.documentElement.style.setProperty("--accent", acc.a);
    document.documentElement.style.setProperty("--accent-2", acc.b);
    document.body.style.background = findWall(t.wallpaper).css;
    document.body.style.backgroundAttachment = "fixed";
  }

  function setAccent(id) { var t = current(); t.accent = id; save(t); apply(); }
  function setWallpaper(id) { var t = current(); t.wallpaper = id; save(t); apply(); }

  return { ACCENTS: ACCENTS, WALLPAPERS: WALLPAPERS, current: current, apply: apply, setAccent: setAccent, setWallpaper: setWallpaper };
})();

/* ---------- Settings app ---------- */
window.NomuApps.settings = {
  id: "settings",
  name: "Settings",
  icon: "⚙️",
  open: function () {
    NomuWM.open({
      title: "Settings",
      icon: "⚙️",
      width: 480,
      height: 460,
      render: function (body) {
        var t = NomuTheme.current();

        var swatches = NomuTheme.ACCENTS.map(function (a) {
          return '<div class="swatch' + (a.id === t.accent ? " active" : "") + '" data-accent="' + a.id +
            '" style="background:linear-gradient(135deg,' + a.a + ',' + a.b + ')" title="' + a.id + '"></div>';
        }).join("");

        var walls = NomuTheme.WALLPAPERS.map(function (w) {
          return '<div class="wall-opt' + (w.id === t.wallpaper ? " active" : "") + '" data-wall="' + w.id +
            '" style="background:' + w.css + '" title="' + w.id + '"></div>';
        }).join("");

        body.innerHTML =
          '<div class="set">' +
            '<div class="set-group">' +
              '<div class="set-title">Accent color</div>' +
              '<div class="swatches">' + swatches + '</div>' +
            '</div>' +
            '<div class="set-group">' +
              '<div class="set-title">Wallpaper</div>' +
              '<div class="wallpapers">' + walls + '</div>' +
            '</div>' +
            '<div class="set-group">' +
              '<div class="set-title">System</div>' +
              '<div class="row">' +
                '<button class="btn" id="set-reset-fs">Reset file system</button>' +
                '<button class="btn" id="set-reset-theme">Reset theme</button>' +
              '</div>' +
              '<div class="meta" style="font-size:12px;color:var(--text-dim)">Resets are instant and cannot be undone.</div>' +
            '</div>' +
          '</div>';

        body.querySelectorAll(".swatch").forEach(function (el) {
          el.addEventListener("click", function () {
            NomuTheme.setAccent(el.getAttribute("data-accent"));
            body.querySelectorAll(".swatch").forEach(function (s) { s.classList.remove("active"); });
            el.classList.add("active");
          });
        });

        body.querySelectorAll(".wall-opt").forEach(function (el) {
          el.addEventListener("click", function () {
            NomuTheme.setWallpaper(el.getAttribute("data-wall"));
            body.querySelectorAll(".wall-opt").forEach(function (s) { s.classList.remove("active"); });
            el.classList.add("active");
          });
        });

        body.querySelector("#set-reset-fs").addEventListener("click", function () {
          if (confirm("Reset the virtual file system to defaults?")) {
            NomuFS.reset();
            alert("File system reset. Reopen File Explorer / Terminal to see changes.");
          }
        });
        body.querySelector("#set-reset-theme").addEventListener("click", function () {
          NomuTheme.setAccent("aurora");
          NomuTheme.setWallpaper("aurora");
          body.querySelectorAll(".swatch").forEach(function (s) { s.classList.toggle("active", s.getAttribute("data-accent") === "aurora"); });
          body.querySelectorAll(".wall-opt").forEach(function (s) { s.classList.toggle("active", s.getAttribute("data-wall") === "aurora"); });
        });
      },
    });
  },
};
