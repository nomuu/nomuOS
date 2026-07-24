/* NomuOS — Terminal app */
window.NomuApps = window.NomuApps || {};
window.NomuApps.terminal = {
  id: "terminal",
  name: "Terminal",
  icon: "🖥️",
  open: function () {
    var cwd = "/home/ronald";

    NomuWM.open({
      key: "terminal",
      title: "Terminal",
      icon: "🖥️",
      width: 600,
      height: 380,
      render: function (body, api) {
        body.innerHTML =
          '<div class="term">' +
            '<div class="term-output" id="t-out"></div>' +
            '<div class="term-inputline">' +
              '<span class="prompt" id="t-prompt"></span>' +
              '<input class="term-input" id="t-in" autocomplete="off" spellcheck="false" />' +
            '</div>' +
          '</div>';

        var out = body.querySelector("#t-out");
        var input = body.querySelector("#t-in");
        var promptEl = body.querySelector("#t-prompt");
        var history = [];
        var histIdx = -1;

        function promptStr() { return "nomu:" + cwd + "$"; }
        function refreshPrompt() { promptEl.textContent = promptStr(); }

        function print(text, cls) {
          var line = document.createElement("div");
          line.className = "term-line" + (cls ? " " + cls : "");
          line.textContent = text;
          out.appendChild(line);
          out.scrollTop = out.scrollHeight;
        }
        function printPrompt(cmd) {
          var line = document.createElement("div");
          line.className = "term-line";
          var span = document.createElement("span");
          span.className = "prompt";
          span.textContent = promptStr() + " ";
          line.appendChild(span);
          line.appendChild(document.createTextNode(cmd));
          out.appendChild(line);
        }

        // Fake "shutdown" sequence: a shutting-down screen, then a joke blue screen.
        function fakeShutdown() {
          if (document.getElementById("nomu-shutdown")) return;

          if (!document.getElementById("nomu-shutdown-style")) {
            var st = document.createElement("style");
            st.id = "nomu-shutdown-style";
            st.textContent =
              "@keyframes nomuSpin{to{transform:rotate(360deg)}}" +
              "#nomu-shutdown .nsd-spin{width:46px;height:46px;border-radius:50%;" +
              "border:4px solid rgba(255,255,255,.25);border-top-color:#fff;" +
              "animation:nomuSpin .9s linear infinite;margin:0 auto 22px;}";
            document.head.appendChild(st);
          }

          var ov = document.createElement("div");
          ov.id = "nomu-shutdown";
          ov.style.cssText =
            "position:fixed;inset:0;z-index:999999;display:flex;align-items:center;" +
            "justify-content:center;text-align:center;color:#fff;" +
            "font-family:'Segoe UI',sans-serif;background:#0a0a0f;";
          ov.innerHTML =
            "<div>" +
              '<div style="position:relative;width:66px;height:66px;margin:0 auto 22px;">' +
                '<div class="nsd-spin" style="position:absolute;inset:0;width:100%;height:100%;margin:0;"></div>' +
                '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;' +
                  'font-weight:800;font-size:24px;color:#fff;">N</div>' +
              "</div>" +
              '<div style="font-size:20px;font-weight:500;letter-spacing:.3px;">Shutting down</div>' +
            "</div>";
          document.body.appendChild(ov);

          setTimeout(function () { showBlueScreen(ov); }, 4000);
        }

        function showBlueScreen(ov) {
          ov.style.background = "#0078d7";
          ov.style.cursor = "pointer";
          ov.innerHTML =
            '<div style="max-width:640px;padding:24px;text-align:left;line-height:1.45;">' +
              '<div style="font-size:84px;line-height:1;margin-bottom:18px;">:)</div>' +
              '<div style="font-size:22px;font-weight:600;margin-bottom:14px;">' +
                "Just kidding. We don't do that here. 😄</div>" +
              '<div style="font-size:15px;opacity:.92;">' +
                "NomuOS ran into a completely fake problem and pretended to restart.<br>" +
                "0% complete… actually, never mind.</div>" +
              '<div style="font-size:13px;opacity:.75;margin-top:24px;">Click anywhere to go back.</div>' +
            "</div>";
          ov.addEventListener("click", function () {
            if (ov.parentNode) ov.parentNode.removeChild(ov);
          });
        }

        var commands = {
          help: function () {
            print(
              "NomuOS shell — available commands:\n" +
              "  help              show this help\n" +
              "  ls [path]         list a directory\n" +
              "  cd <path>         change directory\n" +
              "  pwd               print working directory\n" +
              "  cat <file>        print a file\n" +
              "  echo <text>       print text\n" +
              "  mkdir <dir>       create a folder\n" +
              "  touch <file>      create an empty file\n" +
              "  rm <path>         remove a file/folder\n" +
              "  edit <file>       open file in Text Editor\n" +
              "  open <path>       open folder in File Explorer\n" +
              "  clear             clear the screen\n" +
              "  exit              close the terminal\n" +
              "  gravity on|off    toggle desktop gravity 🪐\n" +
              "  shutdown          turn off NomuOS… or not 😉\n" +
              "  date              current date/time\n" +
              "  whoami            current user\n" +
              "  neofetch          system info\n" +
              "\n" +
              "  -- portfolio --\n" +
              "  about             open About Me\n" +
              "  skills            open Skills\n" +
              "  projects          open Projects\n" +
              "  contact           open Contact\n" +
              "  socials           list social links\n" +
              "  resume            quick summary"
            );
          },
          ls: function (args) {
            var target = args[0] ? NomuFS.resolve(cwd, args[0]) : cwd;
            var items = NomuFS.list(target);
            if (!items) { print("ls: not a directory: " + target, "err"); return; }
            if (!items.length) { print("(empty)"); return; }
            print(items.map(function (i) { return i.type === "folder" ? i.name + "/" : i.name; }).join("   "));
          },
          cd: function (args) {
            if (!args[0]) { cwd = "/home/ronald"; refreshPrompt(); return; }
            var target = NomuFS.resolve(cwd, args[0]);
            if (!NomuFS.isDir(target)) { print("cd: no such directory: " + args[0], "err"); return; }
            cwd = target; refreshPrompt();
          },
          pwd: function () { print(cwd); },
          cat: function (args) {
            if (!args[0]) { print("cat: missing file", "err"); return; }
            var p = NomuFS.resolve(cwd, args[0]);
            if (!NomuFS.isFile(p)) { print("cat: no such file: " + args[0], "err"); return; }
            print(NomuFS.readFile(p));
          },
          echo: function (args) { print(args.join(" ")); },
          mkdir: function (args) {
            if (!args[0]) { print("mkdir: missing name", "err"); return; }
            if (!NomuFS.mkdir(NomuFS.resolve(cwd, args[0]))) print("mkdir: could not create: " + args[0], "err");
          },
          touch: function (args) {
            if (!args[0]) { print("touch: missing name", "err"); return; }
            var p = NomuFS.resolve(cwd, args[0]);
            if (NomuFS.exists(p)) return;
            if (!NomuFS.writeFile(p, "")) print("touch: could not create: " + args[0], "err");
          },
          rm: function (args) {
            if (!args[0]) { print("rm: missing path", "err"); return; }
            if (!NomuFS.remove(NomuFS.resolve(cwd, args[0]))) print("rm: could not remove: " + args[0], "err");
          },
          edit: function (args) {
            if (!args[0]) { print("edit: missing file", "err"); return; }
            NomuApps.editor.open(NomuFS.resolve(cwd, args[0]));
          },
          open: function (args) {
            var target = args[0] ? NomuFS.resolve(cwd, args[0]) : cwd;
            if (!NomuFS.isDir(target)) { print("open: not a directory: " + target, "err"); return; }
            NomuApps.files.open(target);
          },
          clear: function () { out.innerHTML = ""; },
          gravity: function (args) {
            var mode = (args[0] || "").toLowerCase();
            if (!window.NomuGravity) { print("gravity: not available here", "err"); return; }
            if (mode === "on") { NomuGravity.enable(); print("gravity: ON — everything falls! 🪐"); }
            else if (mode === "off") { NomuGravity.disable(); print("gravity: OFF — back to normal."); }
            else { print("usage: gravity on | gravity off", "err"); }
          },
          shutdown: function () {
            print("Shutting down NomuOS…");
            fakeShutdown();
          },
          exit: function () {
            print("logout");
            setTimeout(function () { api.close(); }, 120);
          },
          date: function () { print(new Date().toString()); },
          whoami: function () { print("ronald"); },
          about: function () { NomuApps.about.open(); },
          skills: function () { NomuApps.skills.open(); },
          projects: function () { NomuApps.projects.open(); },
          contact: function () { NomuApps.contact.open(); },
          socials: function () {
            var socs = ((window.NomuProfile || {}).contact || {}).socials || [];
            if (!socs.length) { print("(no socials configured)"); return; }
            socs.forEach(function (s) { print("  " + s.label + ": " + s.url); });
          },
          resume: function () {
            var p = window.NomuProfile || {};
            var s = p.skills || {};
            var stack = (s.techStack || []).map(function (t) { return t.category + ": " + t.skills; }).join("\n  ");
            print(
              (p.name || "") + " — " + (p.role || "") + "\n" +
              (p.tagline || "") + "\n\n" +
              "Stack:\n  " + stack + "\n\n" +
              "Type 'about', 'skills', 'projects', or 'contact' for more."
            );
          },
          neofetch: function () {
            var p = window.NomuProfile || {};
            print(
              "        _   _                          \n" +
              "       | \\ | |   " + (p.name || "NomuOS") + "\n" +
              "       |  \\| |   ------------            \n" +
              "       | . ` |   Role:  " + (p.role || "") + "\n" +
              "       | |\\  |   OS:    NomuOS (portfolio)\n" +
              "       |_| \\_|   Shell: nomu-sh          \n" +
              "                 Host:  your browser     \n" +
              "                 Site:  imronaldmendoza.com"
            );
          },
        };

        function run(raw) {
          var cmd = raw.trim();
          printPrompt(cmd);
          if (cmd === "") return;
          history.push(cmd); histIdx = history.length;
          var parts = cmd.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
          var name = parts[0];
          var args = parts.slice(1).map(function (a) { return a.replace(/^"|"$/g, ""); });
          if (commands[name]) {
            try { commands[name](args); }
            catch (e) { print(String(e), "err"); }
          } else {
            print(name + ": command not found (try 'help')", "err");
          }
          out.scrollTop = out.scrollHeight;
        }

        input.addEventListener("keydown", function (e) {
          if (e.key === "Enter") {
            run(input.value);
            input.value = "";
          } else if (e.key === "ArrowUp") {
            if (histIdx > 0) { histIdx--; input.value = history[histIdx] || ""; }
            e.preventDefault();
          } else if (e.key === "ArrowDown") {
            if (histIdx < history.length - 1) { histIdx++; input.value = history[histIdx] || ""; }
            else { histIdx = history.length; input.value = ""; }
            e.preventDefault();
          }
        });

        // focus input when clicking anywhere in the terminal
        body.addEventListener("mousedown", function () { setTimeout(function () { input.focus(); }, 0); });

        refreshPrompt();
        print("NomuOS — Ronald Mendoza's portfolio. Type 'help' or try 'about'.");
        setTimeout(function () { input.focus(); }, 50);
      },
    });
  },
};
