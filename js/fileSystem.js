/* ============================================================
   NomuOS — Virtual File System
   A simple in-memory tree persisted to localStorage.
   Nodes:
     folder: { type: "folder", children: { name: node } }
     file:   { type: "file", content: "..." }
   Paths are POSIX-style, absolute, e.g. "/home/user/notes.txt".
   ============================================================ */
window.NomuFS = (function () {
  "use strict";

  var STORAGE_KEY = "nomuos.fs.v4";

  // Build one folder per project (with a details.txt) from the profile data.
  function buildProjectFolders() {
    var children = {};
    var prof = window.NomuProfile;
    if (!prof || !prof.projects) return children;
    var all = (prof.projects.featured || []).concat(prof.projects.others || []);
    all.forEach(function (p) {
      var tags = (p.tags && p.tags.length) ? p.tags.join(", ") : "";
      var link = (p.url && p.url !== "#") ? p.url : "Private / not publicly available";
      var content =
        p.name + "\n" +
        (tags ? "Category: " + tags + "\n" : "") +
        "----------------------------------------\n" +
        (p.description || "") + "\n\n" +
        "Link: " + link + "\n";
      children[p.name] = {
        type: "folder",
        children: {
          "details.txt": { type: "file", content: content },
        },
      };
    });
    return children;
  }

  function defaultTree() {
    return {
      type: "folder",
      children: {
        home: {
          type: "folder",
          children: {
            ronald: {
              type: "folder",
              children: {
                "readme.txt": {
                  type: "file",
                  content:
                    "NomuOS — the OS-style portfolio of Ronald Fernandez Mendoza.\n" +
                    "Full Stack Developer · Software Engineer · Application Developer\n\n" +
                    "Explore via the desktop icons, Start menu, or Terminal.\n" +
                    "Apps: About Me · Skills · Projects · Contact\n\n" +
                    "Tip: open the Terminal and type 'help' (try 'projects' or 'resume').\n" +
                    "Live site: https://imronaldmendoza.com\n",
                },
                "about.txt": {
                  type: "file",
                  content:
                    "Currently a Mid-Level Web Developer at an international BPO company,\n" +
                    "building robust, scalable web solutions. I develop tools that automate\n" +
                    "payroll processing and lead an RPA project using UiPath bots and\n" +
                    "Document Understanding. In my free time I dive into AI research and\n" +
                    "emerging programming paradigms.\n",
                },
                projects: {
                  type: "folder",
                  children: {
                    "mockify.txt": { type: "file", content: "Mockify — AI / Career\nPractice real-world interviews with your own questions.\nhttps://mockify.imronaldmendoza.com\n" },
                    "weevu.txt": { type: "file", content: "Weevu — CyberSec\nDetect and fix web vulnerabilities with instant security scans.\n" },
                    "gitset.txt": { type: "file", content: "GitSet — RC Tech / Hobby\nVersion control for RC chassis setups with encrypted exports.\n" },
                    "photopify.txt": { type: "file", content: "Photopify — Privacy\nLocal in-browser image conversion, no uploads.\n" },
                    "loanatic.txt": { type: "file", content: "Loanatic — Fintech\nReal-time amortization schedules and financial summaries.\n" },
                    "inventrac.txt": { type: "file", content: "Inventrac — Inventory\nProduct monitoring and industry compliance platform.\n" },
                  },
                },
                "skills.txt": {
                  type: "file",
                  content:
                    "Languages:   C#, HTML, CSS, JS, SQL\n" +
                    "Frameworks:  .NET, ASP.NET, Bootstrap\n" +
                    "Databases:   SQL Server, MySQL, Postgre\n" +
                    "Tools/Cloud: Git, VS 2022, Azure (SSO)\n" +
                    "RPA / AI:    UiPath, OCR, DU, APIs, Kiro CLI\n" +
                    "Site Admin:  Security, Server Mgmt\n",
                },
                "contact.txt": {
                  type: "file",
                  content:
                    "Email:    mypersonal@imronaldmendoza.com\n" +
                    "Location: Makati City, Philippines\n" +
                    "LinkedIn: https://linkedin.com/in/imronaldmendoza\n" +
                    "GitHub:   https://github.com/nomuu\n" +
                    "Website:  https://imronaldmendoza.com\n",
                },
              },
            },
          },
        },
        system: {
          type: "folder",
          children: {
            "version.txt": { type: "file", content: "NomuOS v1.0 — Ronald Mendoza portfolio edition\n" },
            projects: {
              type: "folder",
              children: buildProjectFolders(),
            },
          },
        },
      },
    };
  }

  var root = load();

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    return defaultTree();
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(root));
    } catch (e) { /* storage may be unavailable */ }
  }

  function normalize(path) {
    if (!path || path === "") path = "/";
    var isAbs = path[0] === "/";
    var parts = path.split("/");
    var stack = [];
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      if (p === "" || p === ".") continue;
      if (p === "..") { stack.pop(); continue; }
      stack.push(p);
    }
    return "/" + stack.join("/");
  }

  function resolve(cwd, path) {
    if (!path) return normalize(cwd);
    if (path[0] === "/") return normalize(path);
    return normalize((cwd === "/" ? "" : cwd) + "/" + path);
  }

  function getNode(path) {
    path = normalize(path);
    if (path === "/") return root;
    var parts = path.split("/").filter(Boolean);
    var node = root;
    for (var i = 0; i < parts.length; i++) {
      if (!node || node.type !== "folder") return null;
      node = node.children[parts[i]];
      if (!node) return null;
    }
    return node || null;
  }

  function parentOf(path) {
    path = normalize(path);
    var parts = path.split("/").filter(Boolean);
    var name = parts.pop();
    var parentPath = "/" + parts.join("/");
    return { parent: getNode(parentPath), name: name, parentPath: normalize(parentPath) };
  }

  function isDir(path) { var n = getNode(path); return !!n && n.type === "folder"; }
  function isFile(path) { var n = getNode(path); return !!n && n.type === "file"; }
  function exists(path) { return !!getNode(path); }

  function list(path) {
    var n = getNode(path);
    if (!n || n.type !== "folder") return null;
    return Object.keys(n.children).map(function (name) {
      return { name: name, type: n.children[name].type };
    }).sort(function (a, b) {
      if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }

  function readFile(path) {
    var n = getNode(path);
    if (!n || n.type !== "file") return null;
    return n.content;
  }

  function writeFile(path, content) {
    var info = parentOf(path);
    if (!info.parent || info.parent.type !== "folder") return false;
    var existing = info.parent.children[info.name];
    if (existing && existing.type === "folder") return false;
    info.parent.children[info.name] = { type: "file", content: String(content) };
    save();
    return true;
  }

  function mkdir(path) {
    var info = parentOf(path);
    if (!info.parent || info.parent.type !== "folder") return false;
    if (info.parent.children[info.name]) return false;
    info.parent.children[info.name] = { type: "folder", children: {} };
    save();
    return true;
  }

  function remove(path) {
    path = normalize(path);
    if (path === "/") return false;
    var info = parentOf(path);
    if (!info.parent || !info.parent.children[info.name]) return false;
    delete info.parent.children[info.name];
    save();
    return true;
  }

  function reset() {
    root = defaultTree();
    save();
  }

  return {
    normalize: normalize,
    resolve: resolve,
    getNode: getNode,
    isDir: isDir,
    isFile: isFile,
    exists: exists,
    list: list,
    readFile: readFile,
    writeFile: writeFile,
    mkdir: mkdir,
    remove: remove,
    reset: reset,
    save: save,
  };
})();
