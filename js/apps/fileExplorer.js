/* NomuOS — File Explorer app */
window.NomuApps = window.NomuApps || {};
window.NomuApps.files = {
  id: "files",
  name: "File Explorer",
  icon: "📁",
  open: function (startPath) {
    var cwd = startPath && NomuFS.isDir(startPath) ? NomuFS.normalize(startPath) : "/home/ronald";
    // "This PC" is a virtual level above the root ("/") that shows Drive C.
    var atThisPC = false;

    NomuWM.open({
      title: "File Explorer",
      icon: "📁",
      width: 560,
      height: 420,
      render: function (body) {
        body.innerHTML =
          '<div class="fx">' +
            '<div class="fx-bar">' +
              '<button class="btn" id="fx-up" title="Up">⬆</button>' +
              '<button class="btn" id="fx-home" title="This PC">🏠</button>' +
              '<span class="fx-path" id="fx-path"></span>' +
              '<button class="btn" id="fx-newfolder" title="New folder">＋📁</button>' +
              '<button class="btn" id="fx-newfile" title="New file">＋📄</button>' +
            '</div>' +
            '<div class="fx-list" id="fx-list"></div>' +
          '</div>';

        var pathEl = body.querySelector("#fx-path");
        var listEl = body.querySelector("#fx-list");

        function glyphFor(type, name) {
          if (type === "folder") return "📁";
          if (/\.(txt|md|readme)$/i.test(name) || name === "readme") return "📄";
          if (/\.(png|jpg|jpeg|gif|svg)$/i.test(name)) return "🖼️";
          if (/\.(js|css|html|json)$/i.test(name)) return "📜";
          return "📄";
        }

        // Windows-style path label for the address bar.
        function displayPath() {
          if (atThisPC) return "This PC";
          if (cwd === "/") return "C:\\";
          return "C:" + cwd.replace(/\//g, "\\");
        }

        function goTo(path) { atThisPC = false; cwd = NomuFS.normalize(path); render(); }

        function render() {
          pathEl.textContent = displayPath();
          listEl.innerHTML = "";

          // "This PC" view: show the single local drive.
          if (atThisPC) {
            var drive = document.createElement("div");
            drive.className = "fx-item";
            drive.innerHTML = '<span class="glyph">💽</span><span class="name">Local Disk (C:)</span>';
            drive.addEventListener("dblclick", function () { goTo("/"); });
            listEl.appendChild(drive);
            return;
          }

          var items = NomuFS.list(cwd) || [];
          if (!items.length) {
            listEl.innerHTML = '<div class="fx-empty">This folder is empty.</div>';
            return;
          }
          items.forEach(function (it) {
            var full = NomuFS.resolve(cwd, it.name);
            var el = document.createElement("div");
            el.className = "fx-item";
            el.innerHTML = '<span class="glyph">' + glyphFor(it.type, it.name) + '</span>' +
                           '<span class="name"></span>';
            el.querySelector(".name").textContent = it.name;

            el.addEventListener("dblclick", function () {
              if (it.type === "folder") { goTo(full); }
              else { NomuApps.editor.open(full); }
            });

            // right-click to delete
            el.addEventListener("contextmenu", function (e) {
              e.preventDefault();
              if (confirm("Delete \"" + it.name + "\"?")) {
                NomuFS.remove(full);
                render();
              }
            });
            listEl.appendChild(el);
          });
        }

        // Up: This PC -> (nothing) ; root -> This PC ; else -> parent
        body.querySelector("#fx-up").addEventListener("click", function () {
          if (atThisPC) return;
          if (cwd === "/") { atThisPC = true; render(); return; }
          cwd = NomuFS.resolve(cwd, "..");
          render();
        });

        // Home: jump to This PC (shows Drive C)
        body.querySelector("#fx-home").addEventListener("click", function () {
          atThisPC = true;
          render();
        });

        body.querySelector("#fx-newfolder").addEventListener("click", function () {
          if (atThisPC) { alert("Open Local Disk (C:) first."); return; }
          var name = prompt("New folder name:");
          if (!name) return;
          if (!NomuFS.mkdir(NomuFS.resolve(cwd, name))) alert("Could not create folder (maybe it exists).");
          render();
        });

        body.querySelector("#fx-newfile").addEventListener("click", function () {
          if (atThisPC) { alert("Open Local Disk (C:) first."); return; }
          var name = prompt("New file name:");
          if (!name) return;
          if (!NomuFS.writeFile(NomuFS.resolve(cwd, name), "")) alert("Could not create file.");
          render();
        });

        render();
      },
    });
  },
};
