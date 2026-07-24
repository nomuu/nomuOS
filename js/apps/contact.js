/* NomuOS — Contact app */
window.NomuApps = window.NomuApps || {};
window.NomuApps.contact = {
  id: "contact",
  name: "Contact",
  icon: "✉️",
  open: function () {
    var p = window.NomuProfile || {};
    var c = p.contact || {};

    NomuWM.open({
      key: "contact",
      title: "Contact",
      icon: "✉️",
      width: 480,
      height: 540,
      render: function (body) {
        function esc(str) {
          return String(str == null ? "" : str)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        }

        var langs = (c.languages || [])
          .map(function (l) { return '<span class="pill">' + esc(l) + "</span>"; })
          .join("");

        var socials = (c.socials || [])
          .map(function (soc) {
            return (
              '<a class="social" href="' + esc(soc.url) + '" target="_blank" rel="noopener">' +
                '<i class="' + (soc.icon || "fas fa-link") + '"></i>' +
                '<span class="social-label">' + esc(soc.label) + "</span>" +
                '<span class="social-go">↗</span>' +
              "</a>"
            );
          })
          .join("");

        var email = c.email || "";

        body.innerHTML =
          '<div class="contact">' +
            '<div class="ct-kicker">04. Contact</div>' +

            '<div class="ct-intro">' +
              "<h2>" + esc(c.greeting || "Get in touch") + "</h2>" +
              "<p>" + esc(c.description || "") + "</p>" +
            "</div>" +

            '<a class="ct-card ct-email" href="mailto:' + esc(email) + '">' +
              '<span class="ct-icon"><i class="fas fa-envelope"></i></span>' +
              '<span class="ct-info">' +
                '<span class="ct-label">Email Me</span>' +
                '<span class="ct-value">' + esc(email) + "</span>" +
              "</span>" +
            "</a>" +

            '<div class="ct-card">' +
              '<span class="ct-icon"><i class="fas fa-location-dot"></i></span>' +
              '<span class="ct-info">' +
                '<span class="ct-label">Location</span>' +
                '<span class="ct-value">' + esc(c.location || "") + "</span>" +
              "</span>" +
            "</div>" +

            '<div class="ct-group">' +
              '<div class="ct-title">Languages</div>' +
              '<div class="pills">' + langs + "</div>" +
            "</div>" +

            '<div class="ct-group">' +
              '<div class="ct-title">Socials</div>' +
              '<div class="ct-socials">' + socials + "</div>" +
            "</div>" +
          "</div>";
      },
    });
  },
};
