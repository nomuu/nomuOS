/* NomuOS — Paint app
   A simple canvas painter. Drawings are saved as PNG data URLs into the
   virtual file system under C:\paint  ( "/paint" ), so they show up in the
   File Explorer and can be reopened here. */
window.NomuApps = window.NomuApps || {};
window.NomuApps.paint = {
  id: "paint",
  name: "Paint",
  icon: "🎨",

  // Folder (virtual C:\paint) where paintings are stored.
  SAVE_DIR: "/paint",

  /**
   * open(path) — optional absolute path to an existing painting to load.
   */
  open: function (path) {
    var self = this;
    var currentPath = (path && NomuFS.isFile(path)) ? NomuFS.normalize(path) : null;

    NomuWM.open({
      key: "paint:" + (currentPath || "new"),
      title: currentPath ? "Paint — " + currentPath.split("/").pop() : "Paint",
      icon: "🎨",
      width: 640,
      height: 500,
      render: function (body, api) {
        body.innerHTML =
          '<div class="pnt">' +
            '<div class="pnt-bar">' +
              '<label class="pnt-tool" title="Color">' +
                '<input type="color" id="pnt-color" value="#7c5cff" />' +
              '</label>' +
              '<label class="pnt-tool" title="Brush size">' +
                '<input type="range" id="pnt-size" min="1" max="40" value="6" />' +
              '</label>' +
              '<button class="btn" id="pnt-erase" title="Eraser">🧽</button>' +
              '<button class="btn" id="pnt-clear" title="Clear">🗑️</button>' +
              '<span class="pnt-spacer"></span>' +
              '<button class="btn" id="pnt-open" title="Open painting">Open…</button>' +
              '<button class="btn primary" id="pnt-save" title="Save to C:\\paint">Save</button>' +
            '</div>' +
            '<div class="pnt-stage">' +
              '<canvas id="pnt-canvas" width="600" height="380"></canvas>' +
            '</div>' +
            '<div class="pnt-status" id="pnt-status"></div>' +
          '</div>';

        var canvas = body.querySelector("#pnt-canvas");
        var ctx = canvas.getContext("2d");
        var colorEl = body.querySelector("#pnt-color");
        var sizeEl = body.querySelector("#pnt-size");
        var eraseBtn = body.querySelector("#pnt-erase");
        var statusEl = body.querySelector("#pnt-status");

        // white background so exported PNGs aren't transparent
        function fillWhite() {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        fillWhite();

        var drawing = false;
        var erasing = false;
        var last = null;

        function status(msg) { statusEl.textContent = msg || ""; }

        function pos(e) {
          var rect = canvas.getBoundingClientRect();
          var src = e.touches ? e.touches[0] : e;
          return {
            x: (src.clientX - rect.left) * (canvas.width / rect.width),
            y: (src.clientY - rect.top) * (canvas.height / rect.height),
          };
        }

        function stroke(a, b) {
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.lineWidth = parseInt(sizeEl.value, 10);
          ctx.strokeStyle = erasing ? "#ffffff" : colorEl.value;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }

        function start(e) {
          drawing = true;
          last = pos(e);
          // a dot for single clicks
          stroke(last, { x: last.x + 0.01, y: last.y + 0.01 });
          e.preventDefault();
        }
        function move(e) {
          if (!drawing) return;
          var p = pos(e);
          stroke(last, p);
          last = p;
          e.preventDefault();
        }
        function end() { drawing = false; last = null; }

        canvas.addEventListener("mousedown", start);
        canvas.addEventListener("mousemove", move);
        window.addEventListener("mouseup", end);
        canvas.addEventListener("touchstart", start, { passive: false });
        canvas.addEventListener("touchmove", move, { passive: false });
        canvas.addEventListener("touchend", end);

        eraseBtn.addEventListener("click", function () {
          erasing = !erasing;
          eraseBtn.classList.toggle("active", erasing);
          status(erasing ? "Eraser on" : "");
        });

        body.querySelector("#pnt-clear").addEventListener("click", function () {
          if (!confirm("Clear the canvas?")) return;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          fillWhite();
          status("Cleared");
        });

        // Load an existing painting (PNG data URL stored in the FS).
        function loadImage(dataUrl) {
          var img = new Image();
          img.onload = function () {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            fillWhite();
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          };
          img.src = dataUrl;
        }
        if (currentPath) {
          var data = NomuFS.readFile(currentPath);
          if (data && data.indexOf("data:image") === 0) loadImage(data);
        }

        body.querySelector("#pnt-open").addEventListener("click", function () {
          var def = currentPath || (self.SAVE_DIR + "/");
          var p = prompt("Open painting (absolute path):", def);
          if (!p) return;
          p = NomuFS.normalize(p);
          if (!NomuFS.isFile(p)) { alert("No such file: " + p); return; }
          var d = NomuFS.readFile(p);
          if (!d || d.indexOf("data:image") !== 0) { alert("Not an image file: " + p); return; }
          currentPath = p;
          loadImage(d);
          api.setTitle("Paint — " + p.split("/").pop());
          status("Opened " + p);
        });

        body.querySelector("#pnt-save").addEventListener("click", function () {
          // Make sure C:\paint exists in the virtual FS.
          if (!NomuFS.isDir(self.SAVE_DIR)) NomuFS.mkdir(self.SAVE_DIR);

          var suggested = currentPath
            ? currentPath.split("/").pop()
            : "painting-" + Date.now() + ".png";
          var name = prompt("Save painting as (in C:\\paint):", suggested);
          if (!name) return;
          if (!/\.png$/i.test(name)) name += ".png";

          var target = self.SAVE_DIR + "/" + name;
          var dataUrl = canvas.toDataURL("image/png");
          if (NomuFS.writeFile(target, dataUrl)) {
            currentPath = target;
            api.setTitle("Paint — " + name);
            status("Saved to C:\\paint\\" + name);
          } else {
            alert("Could not save to " + target);
          }
        });

        status("Draw with the mouse. Save writes a PNG to C:\\paint.");
      },
    });
  },
};
