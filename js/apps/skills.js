/* NomuOS — Skills app */
window.NomuApps = window.NomuApps || {};
window.NomuApps.skills = {
  id: "skills",
  name: "Skills",
  icon: "🧩",
  open: function () {
    var p = window.NomuProfile || {};
    var s = p.skills || {};

    NomuWM.open({
      key: "skills",
      title: "Skills",
      icon: "🧩",
      width: 540,
      height: 560,
      render: function (body) {
        function esc(str) {
          return String(str == null ? "" : str)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        }

        var stack = (s.techStack || [])
          .map(function (item) {
            return (
              '<div class="tech-card">' +
                '<div class="tech-cat">' + esc(item.category) + "</div>" +
                '<div class="tech-skills">' + esc(item.skills) + "</div>" +
              "</div>"
            );
          })
          .join("");

        var strengths = (s.coreStrengths || [])
          .map(function (item) {
            var pct = Math.max(0, Math.min(100, item.percentage || 0));
            return (
              '<div class="str-item">' +
                '<div class="str-head"><span>' + esc(item.name) + "</span>" +
                  '<span class="str-pct">' + pct + "%</span></div>" +
                '<div class="str-track"><div class="str-fill" style="width:' + pct + '%"></div></div>' +
              "</div>"
            );
          })
          .join("");

        var dev = (s.professionalDevelopment || [])
          .map(function (d) {
            return '<li><i class="fas fa-chevron-right"></i><span>' + esc(d) + "</span></li>";
          })
          .join("");

        body.innerHTML =
          '<div class="skills">' +
            '<div class="sk-kicker">02. Skills</div>' +

            '<div class="sk-group">' +
              '<div class="sk-title">Technical Stack</div>' +
              '<div class="tech-grid">' + stack + "</div>" +
            "</div>" +

            '<div class="sk-group">' +
              '<div class="sk-title">Core Strengths</div>' +
              '<div class="str-list">' + strengths + "</div>" +
            "</div>" +

            '<div class="sk-group">' +
              '<div class="sk-title">Professional Development</div>' +
              '<ul class="dev-ul">' + dev + "</ul>" +
            "</div>" +
          "</div>";
      },
    });
  },
};
