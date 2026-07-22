/* NomuOS — Browie (a Chrome-like in-OS browser) */
window.NomuApps = window.NomuApps || {};
window.NomuApps.browie = {
  id: "browie",
  name: "Browie",
  icon: "🌐",
  /**
   * open(url) — optional starting URL. If omitted, shows the home page
   * with shortcuts to Ronald's projects.
   */
  open: function (startUrl) {
    NomuWM.open({
      title: "Browie",
      icon: "🌐",
      width: 760,
      height: 520,
      render: function (body, api) {
        var HOME = "about:home";

        function esc(s) {
          return String(s == null ? "" : s)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
        }

        body.innerHTML =
          '<div class="browie">' +
            '<div class="bw-bar">' +
              '<button class="bw-nav" id="bw-back" title="Back">◀</button>' +
              '<button class="bw-nav" id="bw-fwd" title="Forward">▶</button>' +
              '<button class="bw-nav" id="bw-reload" title="Reload">⟳</button>' +
              '<button class="bw-nav" id="bw-home" title="Home">🏠</button>' +
              '<input class="bw-addr" id="bw-addr" placeholder="Search or type a URL" spellcheck="false" />' +
              '<button class="bw-go" id="bw-go">Go</button>' +
              '<button class="bw-nav" id="bw-ext" title="Open in new tab">↗</button>' +
            "</div>" +
            '<div class="bw-view" id="bw-view">' +
              '<iframe class="bw-frame hidden" id="bw-frame" title="Browie viewport" ' +
                'sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox" ' +
                'referrerpolicy="no-referrer"></iframe>' +
              '<div class="bw-home hidden" id="bw-home-page"></div>' +
              '<div class="bw-card hidden" id="bw-card"></div>' +
            "</div>" +
          "</div>";

        var frame = body.querySelector("#bw-frame");
        var homePage = body.querySelector("#bw-home-page");
        var card = body.querySelector("#bw-card");
        var addr = body.querySelector("#bw-addr");
        var backBtn = body.querySelector("#bw-back");
        var fwdBtn = body.querySelector("#bw-fwd");

        var history = [];
        var hidx = -1;
        var currentGame = null;

        function destroyGame() {
          if (currentGame) { currentGame.destroy(); currentGame = null; }
        }

        /* ---------- helpers ---------- */
        function normalizeUrl(raw) {
          var u = (raw || "").trim();
          if (!u) return HOME;
          if (u === HOME) return HOME;
          if (/^https?:\/\//i.test(u)) return u;
          if (/^[\w-]+(\.[\w-]+)+/.test(u)) return "https://" + u;
          // Free text -> web search. Bing allows iframe embedding, Google does not,
          // so search results actually render inside Browie.
          return "https://www.bing.com/search?q=" + encodeURIComponent(u);
        }

        function domainOf(url) {
          try { return url.replace(/^https?:\/\//i, "").split("/")[0]; }
          catch (e) { return url; }
        }

        // Convert well-known links into their embeddable form.
        function embeddableUrl(url) {
          var yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{6,})/i);
          if (yt) return "https://www.youtube.com/embed/" + yt[1];
          // Google Maps: the output=embed form renders in an iframe without an API key.
          if (/(?:google\.[^\/]+\/maps|maps\.google\.)/i.test(url) && !/output=embed/i.test(url)) {
            return url + (url.indexOf("?") >= 0 ? "&" : "?") + "output=embed";
          }
          return url;
        }

        // URLs verified to allow framing -> load directly, skip the interstitial card.
        function isAutoEmbed(url) {
          return /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)/i.test(url) ||
                 /(?:google\.[^\/]+\/maps|maps\.google\.)/i.test(url) ||
                 /bing\.com\/search/i.test(url);
        }

        function findProject(url) {
          var projs = ((window.NomuProfile || {}).projects) || {};
          var all = (projs.featured || []).concat(projs.others || []);
          var target = url.replace(/\/+$/, "").toLowerCase();
          for (var i = 0; i < all.length; i++) {
            var pu = (all[i].url || "").replace(/\/+$/, "").toLowerCase();
            if (pu && pu === target) return all[i];
          }
          return null;
        }

        function show(which) {
          frame.classList.toggle("hidden", which !== "frame");
          homePage.classList.toggle("hidden", which !== "home");
          card.classList.toggle("hidden", which !== "card");
        }

        /* ---------- pages ---------- */
        function renderHome() {
          var projects = ((window.NomuProfile || {}).projects) || {};
          var all = (projects.featured || []).concat(projects.others || []);
          var name = (window.NomuProfile || {}).name || "My";
          var tiles = all.map(function (p) {
            var live = p.url && p.url !== "#";
            return (
              '<button class="bw-tile' + (live ? "" : " disabled") + '" data-url="' + esc(live ? p.url : "") + '">' +
                '<span class="bw-tile-icon"><i class="' + (p.icon || "fas fa-code") + '"></i></span>' +
                '<span class="bw-tile-name">' + esc(p.name) + "</span>" +
              "</button>"
            );
          }).join("");
          homePage.innerHTML =
            '<div class="bw-home-inner">' +
              '<div class="bw-home-logo">Browie</div>' +
              '<div class="bw-home-sub">' + esc(name) + "'s projects</div>" +
              '<div class="bw-home-search">' +
                '<input id="bw-home-q" placeholder="Search the web…" spellcheck="false" />' +
                '<button id="bw-home-go">Search</button>' +
              "</div>" +
              '<div class="bw-home-grid">' + tiles + "</div>" +
            "</div>";
          var q = homePage.querySelector("#bw-home-q");
          function runSearch() { if (q.value.trim()) navigate(q.value); }
          homePage.querySelector("#bw-home-go").addEventListener("click", runSearch);
          q.addEventListener("keydown", function (e) { if (e.key === "Enter") runSearch(); });
          homePage.querySelectorAll(".bw-tile").forEach(function (t) {
            t.addEventListener("click", function () {
              var u = t.getAttribute("data-url");
              if (u) navigate(u);
            });
          });
        }

        function renderRefuse(url) {
          var proj = findProject(url);
          var siteLabel = proj ? proj.name : domainOf(url);

          card.innerHTML =
            '<div class="bw-refuse">' +
              '<div class="bw-refuse-head">' +
                '<div class="bw-refuse-icon">😿</div>' +
                '<div class="bw-refuse-titles">' +
                  '<div class="bw-refuse-title">This site refused to connect</div>' +
                  '<div class="bw-refuse-sub"><b>' + esc(siteLabel) + "</b> can't be shown inside Browie " +
                    "(it blocks embedding). You can open it in a new tab instead.</div>" +
                  '<div class="bw-refuse-url">' + esc(url) + "</div>" +
                "</div>" +
              "</div>" +
              '<div class="bw-refuse-actions">' +
                '<button class="btn primary" id="bw-open-new">Open in new tab ↗</button>' +
                '<button class="btn" id="bw-try">Try to load anyway ⤢</button>' +
              "</div>" +
              '<div class="bw-refuse-gamewrap">' +
                '<div class="bw-refuse-gametitle">🐱 Meanwhile… play a little while you\'re here!</div>' +
                '<div class="bw-game" id="bw-game"></div>' +
              "</div>" +
            "</div>";

          card.querySelector("#bw-open-new").addEventListener("click", function () {
            window.open(url, "_blank", "noopener");
          });
          card.querySelector("#bw-try").addEventListener("click", function () {
            destroyGame();
            show("frame");
            frame.src = embeddableUrl(url);
          });

          // The refuse page hosts the cat runner. 🐱
          destroyGame();
          if (window.NomuCatGame) {
            currentGame = NomuCatGame.create(card.querySelector("#bw-game"));
          }
        }

        /* ---------- navigation ---------- */
        function load(url, push) {
          destroyGame();
          addr.value = url === HOME ? "" : url;
          if (url === HOME) {
            renderHome(); show("home");
          } else if (isAutoEmbed(url)) {
            show("frame"); frame.src = embeddableUrl(url);
          } else {
            renderRefuse(url); show("card");
          }
          if (push) {
            history = history.slice(0, hidx + 1);
            history.push(url);
            hidx = history.length - 1;
          }
          backBtn.disabled = hidx <= 0;
          fwdBtn.disabled = hidx >= history.length - 1;
        }

        function navigate(raw) { load(normalizeUrl(raw), true); }
        function currentUrl() { return history[hidx] || HOME; }

        /* ---------- wire toolbar ---------- */
        body.querySelector("#bw-go").addEventListener("click", function () { navigate(addr.value); });
        addr.addEventListener("keydown", function (e) { if (e.key === "Enter") navigate(addr.value); });
        backBtn.addEventListener("click", function () { if (hidx > 0) { hidx--; load(history[hidx], false); } });
        fwdBtn.addEventListener("click", function () { if (hidx < history.length - 1) { hidx++; load(history[hidx], false); } });
        body.querySelector("#bw-reload").addEventListener("click", function () { load(currentUrl(), false); });
        body.querySelector("#bw-home").addEventListener("click", function () { navigate(HOME); });
        body.querySelector("#bw-ext").addEventListener("click", function () {
          var u = currentUrl();
          if (u && u !== HOME) window.open(u, "_blank", "noopener");
        });

        /* ---------- initial page ---------- */
        load(HOME, true);
        if (startUrl) {
          navigate(startUrl);
          api.setTitle("Browie — " + domainOf(normalizeUrl(startUrl)));
        }
      },
    });
  },
};
