/* NomuOS — Text Editor app */
window.NomuApps = window.NomuApps || {};
window.NomuApps.editor = {
  id: "editor",
  name: "Text Editor",
  icon: "📝",
  /**
   * open(path) — optional absolute path to an existing file to edit.
   */
  open: function (path) {
    var currentPath = path || null;
    var title = currentPath ? "Editor — " + currentPath.split("/").pop() : "Text Editor";

    NomuWM.open({
      key: "editor:" + (currentPath || "new"),
      title: title,
      icon: "📝",
      width: 560,
      height: 420,
      render: function (body, api) {
        var initial = "";
        if (currentPath && NomuFS.isFile(currentPath)) {
          initial = NomuFS.readFile(currentPath) || "";
        }

        body.innerHTML =
          '<div class="ed">' +
            '<div class="ed-bar">' +
              '<button class="btn" id="ed-open">Open…</button>' +
              '<button class="btn primary" id="ed-save">Save</button>' +
              '<span class="ed-name" id="ed-name"></span>' +
            '</div>' +
            '<textarea class="ed-area" id="ed-area" spellcheck="false" placeholder="Start typing…"></textarea>' +
          '</div>';

        var area = body.querySelector("#ed-area");
        var nameEl = body.querySelector("#ed-name");
        area.value = initial;

        function refreshName() {
          nameEl.textContent = currentPath ? currentPath : "(unsaved file)";
        }
        refreshName();

        body.querySelector("#ed-open").addEventListener("click", function () {
          var p = prompt("Open file (absolute path):", currentPath || "/home/ronald/readme.txt");
          if (!p) return;
          p = NomuFS.normalize(p);
          if (!NomuFS.isFile(p)) { alert("No such file: " + p); return; }
          currentPath = p;
          area.value = NomuFS.readFile(p) || "";
          api.setTitle("Editor — " + p.split("/").pop());
          refreshName();
        });

        body.querySelector("#ed-save").addEventListener("click", function () {
          var p = currentPath;
          if (!p) {
            p = prompt("Save as (absolute path):", "/home/untitled.txt");
            if (!p) return;
            p = NomuFS.normalize(p);
          }
          if (NomuFS.writeFile(p, area.value)) {
            currentPath = p;
            api.setTitle("Editor — " + p.split("/").pop());
            refreshName();
            nameEl.textContent = p + "  ✓ saved";
          } else {
            alert("Could not save to: " + p + "\n(parent folder must exist and not be a folder name)");
          }
        });

        // Ctrl+S to save
        area.addEventListener("keydown", function (e) {
          if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
            e.preventDefault();
            body.querySelector("#ed-save").click();
          }
        });
      },
    });
  },
};
