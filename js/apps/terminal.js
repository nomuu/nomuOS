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

        // ---- "hack" easter egg: multiple matrix windows + a HAKDOG finale ----
        function matrixRain(canvas) {
          var ctx = canvas.getContext("2d");
          var fontSize = 14, drops = [], raf = null;
          var chars = "アカサタナ0123456789ABCDEF#$*HAKDOG".split("");
          function size() {
            canvas.width = canvas.clientWidth || 240;
            canvas.height = canvas.clientHeight || 160;
            var cols = Math.max(1, Math.floor(canvas.width / fontSize));
            drops = [];
            for (var i = 0; i < cols; i++) drops[i] = Math.floor(Math.random() * (canvas.height / fontSize));
          }
          function draw() {
            if (!canvas.isConnected) { if (raf) cancelAnimationFrame(raf); return; }
            ctx.fillStyle = "rgba(0,0,0,0.09)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#39ff14";
            ctx.font = fontSize + "px monospace";
            for (var i = 0; i < drops.length; i++) {
              ctx.fillText(chars[Math.floor(Math.random() * chars.length)], i * fontSize, drops[i] * fontSize);
              if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
              drops[i]++;
            }
            raf = requestAnimationFrame(draw);
          }
          setTimeout(function () { size(); draw(); }, 30);
        }

        function bigWord(word) {
          var G = {
            H: ["#   #", "#   #", "#####", "#   #", "#   #"],
            A: [" ### ", "#   #", "#####", "#   #", "#   #"],
            K: ["#   #", "#  # ", "###  ", "#  # ", "#   #"],
            D: ["#### ", "#   #", "#   #", "#   #", "#### "],
            O: [" ### ", "#   #", "#   #", "#   #", " ### "],
            G: [" ####", "#    ", "# ###", "#   #", " ####"],
          };
          var rows = ["", "", "", "", ""];
          word.split("").forEach(function (c) {
            var g = G[c] || ["     ", "     ", "     ", "     ", "     "];
            for (var r = 0; r < 5; r++) rows[r] += g[r] + "  ";
          });
          return rows.join("\n");
        }

        function hackArt() {
          return (
            "   .-''''''''''''''''''''''''''-.\n" +
            "  /  ~~~~~~~~~~~~~~~~~~~~~~~~~~  \\\n" +
            " |  (==========================)  |\n" +
            "  \\  ~~~~~~~~~~~~~~~~~~~~~~~~~~  /\n" +
            "   '-..........................-'\n\n" +
            bigWord("HAKDOG") + "\n\n" +
            "   >> ACCESS GRANTED  —  char lang 😎 <<"
          );
        }

        function startHack() {
          var handles = [], timers = [], closed = false;
          var COUNT = 20;

          function rnd(a) { return a[Math.floor(Math.random() * a.length)]; }
          function hex(n) { var s = ""; for (var i = 0; i < n; i++) s += "0123456789abcdef"[Math.floor(Math.random() * 16)]; return s; }

          var FILES = ["/usr/lib/libc.so", "/sys/kernel/core", "/etc/shadow", "/var/log/auth.log",
            "/boot/vmlinuz", "/root/.ssh/id_rsa", "/proc/1/mem", "C:\\Windows\\System32\\ntoskrnl.exe",
            "/opt/nomu/secrets.db", "/dev/mem"];
          var PKGS = ["libhakdog-dev", "nmap", "john", "metasploit", "openssl", "payload-gen",
            "rootkit-lite", "ghidra", "hydra", "tor"];
          var TARGETS = ["10.0.0.14", "192.168.1.1", "172.16.0.9", "fe80::1", "mainframe", "gibson", "the-cloud"];

          function genInject() { return "[inject] " + rnd(FILES) + " <- 0x" + hex(6) + "  [OK]"; }
          function genEncrypt() { return "[crypt] AES-256 " + rnd(FILES) + " => " + hex(16); }
          function genInstall() { return "Get " + rnd(PKGS) + "  " + Math.floor(Math.random() * 100) + "% [" + hex(4) + "]"; }
          function genScan() { return "scan " + rnd(TARGETS) + ":" + Math.floor(Math.random() * 65535) + " ... open"; }

          var STYLES = [
            { title: "root@nomu:~#", icon: "💀", kind: "matrix", color: "#39ff14" },
            { title: "injector", icon: "📁", kind: "log", color: "#21d4fd", gen: genInject },
            { title: "cryptd", icon: "🔒", kind: "log", color: "#ff5c9d", gen: genEncrypt },
            { title: "pkg-installer", icon: "📦", kind: "log", color: "#ffb347", gen: genInstall },
            { title: "portscan", icon: "📡", kind: "log", color: "#2fd671", gen: genScan },
          ];

          function closeAll() {
            if (closed) return;
            closed = true;
            timers.forEach(clearTimeout);
            document.removeEventListener("click", closeAll, true);
            handles.forEach(function (h) { try { h.close(); } catch (e) {} });
            handles = [];
          }

          function logWindow(body, s) {
            var box = document.createElement("div");
            box.style.cssText =
              "height:100%;overflow:hidden;display:flex;flex-direction:column;justify-content:flex-end;" +
              "padding:8px;box-sizing:border-box;color:" + s.color + ";font:700 11px/1.3 monospace;" +
              "text-shadow:0 0 4px " + s.color + ";";
            body.appendChild(box);
            var t = setInterval(function () {
              if (!body.isConnected) { clearInterval(t); return; }
              var d = document.createElement("div");
              d.textContent = s.gen();
              box.appendChild(d);
              while (box.children.length > 40) box.removeChild(box.firstChild);
            }, 110 + Math.floor(Math.random() * 150));
          }

          function openWin(i) {
            if (closed) return;
            var s = (i === 1) ? STYLES[0] : rnd(STYLES);   // guarantee at least one matrix
            var w = 220 + Math.floor(Math.random() * 260);
            var h = 140 + Math.floor(Math.random() * 170);
            var x = 10 + Math.floor(Math.random() * Math.max(1, window.innerWidth - w - 20));
            var y = 10 + Math.floor(Math.random() * Math.max(1, window.innerHeight - h - 120));
            handles.push(NomuWM.open({
              key: "hack-" + i + "-" + Date.now(),
              title: s.title, icon: s.icon,
              width: w, height: h, x: x, y: y,
              render: function (body) {
                body.style.background = "#000"; body.style.padding = "0"; body.style.overflow = "hidden";
                if (s.kind === "matrix") {
                  var c = document.createElement("canvas");
                  c.style.cssText = "display:block;width:100%;height:100%;background:#000;";
                  body.appendChild(c);
                  matrixRain(c);
                } else {
                  logWindow(body, s);
                }
              },
            }));
          }

          function openFinal() {
            if (closed) return;
            var w = 540, h = 380;
            var x = Math.max(20, (window.innerWidth - w) / 2);
            var y = Math.max(20, (window.innerHeight - h) / 2 - 40);
            handles.push(NomuWM.open({
              key: "hack-final-" + Date.now(),
              title: "ACCESS GRANTED", icon: "🌭",
              width: w, height: h, x: x, y: y,
              render: function (body) {
                body.style.background = "#000";
                var pre = document.createElement("pre");
                pre.style.cssText =
                  "margin:0;padding:16px;color:#39ff14;font:800 30px/1.15 monospace;" +
                  "white-space:pre-wrap;word-break:break-all;overflow:auto;height:100%;" +
                  "box-sizing:border-box;text-shadow:0 0 8px #39ff14;";
                body.appendChild(pre);

                // Phase 1: a long, growing "HAAAAAA..." scream.
                var text = "HA";
                pre.textContent = text;
                var grow = setInterval(function () {
                  if (!body.isConnected) { clearInterval(grow); return; }
                  text += "A";
                  pre.textContent = text;
                  pre.scrollTop = pre.scrollHeight;
                  if (text.length >= 64) {
                    clearInterval(grow);
                    // Phase 2: reveal the HAKDOG hotdog art.
                    setTimeout(function () {
                      if (!body.isConnected) return;
                      pre.style.font = "700 11px/1.1 monospace";
                      pre.style.whiteSpace = "pre";
                      pre.style.wordBreak = "normal";
                      pre.textContent = hackArt();
                    }, 550);
                  }
                }, 45);
              },
            }));
          }

          for (var i = 1; i <= COUNT; i++) {
            (function (n) { timers.push(setTimeout(function () { openWin(n); }, n * 140)); })(i);
          }
          timers.push(setTimeout(openFinal, COUNT * 140 + 500));
          // once the show has started, a click anywhere closes everything
          timers.push(setTimeout(function () {
            if (!closed) document.addEventListener("click", closeAll, true);
          }, 500));
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
              "  apt install <pkg> install a package… supposedly 📦\n" +
              "  hack              become a l33t hacker 💀\n" +
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
          hack: function () {
            print("Initiating breach sequence... 😈 (click anywhere to bail)");
            startHack();
          },
          apt: function (args) {
            if ((args[0] || "") !== "install") { print("usage: apt install <package>", "err"); return; }
            var pkg = args.slice(1).join(" ") || "mystery-package";
            var size = (Math.floor(Math.random() * 9000) + 500).toLocaleString();
            print("Reading package lists... Done");
            print("Building dependency tree... Done");
            print("The following NEW package will be installed:");
            print("  " + pkg);
            print("Need to get " + size + " kB of archives.");

            var line = document.createElement("div");
            line.className = "term-line";
            out.appendChild(line);

            var pct = 0;
            var timer = setInterval(function () {
              pct = Math.min(100, pct + Math.floor(Math.random() * 12) + 5);
              var filled = Math.round(pct / 5);           // 20-block bar
              var bar = "[" + Array(filled + 1).join("#") + Array(20 - filled + 1).join(" ") + "]";
              line.textContent = "Get:1 " + pkg + "  " + bar + " " + pct + "%";
              out.scrollTop = out.scrollHeight;
              if (pct >= 100) {
                clearInterval(timer);
                setTimeout(function () {
                  print("Unpacking " + pkg + " (1.0.0) ...");
                  print("Setting up " + pkg + " (1.0.0) ...");
                  print("Naisip mong totoo? 😂 Walang '" + pkg + "' talaga — chika lang.");
                  print("0 upgraded, 0 newly installed, 1 joke served.");
                }, 400);
              }
            }, 220);
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
