/* NomuOS — "kape?" (Ko-fi support app, used on mobile) */
window.NomuApps = window.NomuApps || {};
window.NomuApps.kofi = {
  id: "kofi",
  name: "kape?",
  icon: "☕",
  open: function () {
    NomuWM.open({
      key: "kofi",
      title: "kape?",
      icon: "☕",
      width: 360,
      height: 380,
      render: function (body) {
        var p = window.NomuProfile || {};
        var KOFI = "https://ko-fi.com/N4N319W8W";
        var link = (p.support && p.support.url) || p.kofi || p.coffee ||
          ((p.contact || {}).kofi) || KOFI;

        var PRICE = 50, mult = 1;
        var TIERS = [
          { mult: 1, label: "konte", size: 20 },
          { mult: 3, label: "saks", size: 28 },
          { mult: 5, label: "busolb", size: 36 },
        ];

        function render() {
          var tiers = TIERS.map(function (t) {
            var on = t.mult === mult;
            return '<button class="kfa-tier" data-t="' + t.mult + '" style="flex:1;padding:12px 0;' +
              "display:flex;flex-direction:column;align-items:center;gap:6px;" +
              "border-radius:12px;cursor:pointer;color:#fff;border:1px solid " +
              (on ? "#72a4f2" : "rgba(255,255,255,.2)") + ";background:" +
              (on ? "#72a4f2" : "rgba(255,255,255,.06)") + ';">' +
              '<span style="height:38px;display:flex;align-items:flex-end;justify-content:center;">' +
                '<span style="font-size:' + t.size + 'px;line-height:1;">☕</span></span>' +
              '<span style="font-size:13px;">' + t.label + "</span></button>";
          }).join("");

          body.innerHTML =
            '<div style="padding:24px 20px;max-width:440px;margin:0 auto;color:#fff;text-align:center;">' +
              '<div style="font-size:56px;line-height:1;margin-bottom:8px;">☕</div>' +
              '<div style="font-weight:800;font-size:21px;">Buy nomu a coffee</div>' +
              '<div style="font-size:13px;opacity:.8;margin:4px 0 20px;">Support nomu on Ko-fi ☕</div>' +
              '<div style="display:flex;gap:10px;margin-bottom:16px;">' + tiers + "</div>" +
              '<button class="kfa-go" style="width:100%;padding:14px;border-radius:14px;border:none;' +
                'cursor:pointer;background:#72a4f2;color:#fff;font-weight:700;font-size:15px;">' +
                "Support on Ko-fi · ₱" + (mult * PRICE) + " →</button>" +
              '<div class="kfa-thanks" style="font-size:13px;color:var(--accent-2,#21d4fd);' +
                'min-height:18px;margin-top:14px;"></div>' +
            "</div>";

          body.querySelectorAll(".kfa-tier").forEach(function (b) {
            b.addEventListener("click", function () {
              mult = parseInt(b.getAttribute("data-t"), 10);
              render();
            });
          });
          body.querySelector(".kfa-go").addEventListener("click", function () {
            window.open(link, "_blank", "noopener");
            var t = body.querySelector(".kfa-thanks");
            if (t) t.textContent = "Maraming salamat! 💛";
          });
        }

        render();
      },
    });
  },
};
