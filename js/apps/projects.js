/* NomuOS — Projects app */
window.NomuApps = window.NomuApps || {};
window.NomuApps.projects = {
  id: "projects",
  name: "Projects",
  icon: "🗂️",

  /* Launch a project: open its live site in Browie, else show the info window. */
  launch: function (proj) {
    if (!proj) return;
    var live = proj.url && proj.url !== "#";
    if (live && window.NomuApps.browie && typeof window.NomuApps.browie.open === "function") {
      window.NomuApps.browie.open(proj.url);
    } else {
      this.openProject(proj);
    }
  },

  /* Open a single project as its own app-style window. */
  openProject: function (proj) {
    if (!proj) return;
    function esc(s) {
      return String(s == null ? "" : s)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
    var hasLink = proj.url && proj.url !== "#";
    var tags = (proj.tags || [])
      .map(function (t) { return '<span class="tag">' + esc(t) + "</span>"; })
      .join("");

    NomuWM.open({
      title: proj.name || "Project",
      icon: "🗂️",
      width: 440,
      height: 340,
      render: function (body) {
        body.innerHTML =
          '<div class="proj-app">' +
            '<div class="proj-app-icon"><i class="' + (proj.icon || "fas fa-code") + '"></i></div>' +
            '<h1 class="proj-app-name">' + esc(proj.name) + "</h1>" +
            (tags ? '<div class="proj-app-tags">' + tags + "</div>" : "") +
            '<p class="proj-app-desc">' + esc(proj.description) + "</p>" +
            (hasLink
              ? '<a class="btn primary proj-app-open" href="' + esc(proj.url) + '" target="_blank" rel="noopener">Open Project ↗</a>'
              : '<span class="proj-app-private">🔒 Private / not publicly available</span>') +
          "</div>";
      },
    });
  },

  open: function () {
    var p = window.NomuProfile || {};
    var data = p.projects || {};
    var featured = data.featured || [];
    var others = data.others || [];

    NomuWM.open({
      title: "Projects",
      icon: "🗂️",
      width: 600,
      height: 560,
      render: function (body) {
        function esc(s) {
          return String(s == null ? "" : s)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        }

        function hasLink(url) { return url && url !== "#"; }

        function card(proj) {
          var tags = (proj.tags || [])
            .map(function (t) { return '<span class="tag">' + esc(t) + "</span>"; })
            .join("");

          var link = hasLink(proj.url)
            ? '<a class="proj-link" href="' + esc(proj.url) + '" target="_blank" rel="noopener">Visit ↗</a>'
            : '<span class="proj-link disabled">Private</span>';

          return (
            '<div class="proj-card">' +
              '<div class="proj-icon"><i class="' + (proj.icon || "fas fa-code") + '"></i></div>' +
              '<div class="proj-main">' +
                '<div class="proj-head">' +
                  '<span class="proj-name">' + esc(proj.name) + "</span>" + link +
                "</div>" +
                '<div class="proj-desc">' + esc(proj.description) + "</div>" +
                (tags ? '<div class="proj-tags">' + tags + "</div>" : "") +
              "</div>" +
            "</div>"
          );
        }

        var featuredHtml = featured.map(card).join("");
        var othersHtml = others.map(card).join("");

        body.innerHTML =
          '<div class="proj">' +
            '<div class="proj-kicker">03. Projects</div>' +

            '<div class="proj-grid">' + featuredHtml + "</div>" +

            (othersHtml
              ? '<div class="proj-more-title">More Projects</div>' +
                '<div class="proj-grid">' + othersHtml + "</div>"
              : "") +
          "</div>";
      },
    });
  },
};
