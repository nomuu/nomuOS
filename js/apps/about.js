/* NomuOS — About Me app */
window.NomuApps = window.NomuApps || {};
window.NomuApps.about = {
  id: "about",
  name: "About Me",
  icon: "👤",
  open: function () {
    var p = window.NomuProfile || {};
    var a = p.about || {};

    NomuWM.open({
      key: "about",
      title: "About Me",
      icon: "👤",
      width: 520,
      height: 560,
      render: function (body) {
        var professions = (p.professions || [p.role])
          .filter(Boolean)
          .join('<span class="me-sep">•</span>');

        var bio = (a.bio || [])
          .map(function (para) { return "<p>" + para + "</p>"; })
          .join("");

        var beyond = (a.beyondTheCode || [])
          .map(function (item) {
            return (
              '<li class="me-hobby">' +
                '<span class="me-hobby-head"><i class="' + (item.icon || "fas fa-star") + '"></i>' +
                  "<strong>" + item.title + "</strong></span>" +
                '<span class="me-hobby-desc">' + item.description + "</span>" +
              "</li>"
            );
          })
          .join("");

        body.innerHTML =
          '<div class="me">' +
            '<div class="me-hero">' +
              '<div class="me-avatar">' + (p.avatar || "🧑‍💻") + '</div>' +
              '<div class="me-id">' +
                "<h1>" + (p.name || "Your Name") + "</h1>" +
                '<div class="me-role">' + professions + "</div>" +
                '<div class="me-tagline">' + (p.tagline || "") + "</div>" +
              "</div>" +
            "</div>" +

            '<div class="me-section">' +
              '<div class="me-kicker">01. About Me</div>' +
              '<div class="me-body">' + bio + "</div>" +
            "</div>" +

            '<div class="me-section">' +
              '<div class="me-kicker">Beyond the Code</div>' +
              '<ul class="me-hobbies">' + beyond + "</ul>" +
            "</div>" +
          "</div>";
      },
    });
  },
};
