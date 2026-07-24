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
        var GCASH_QR = "img/qr/gcash.png";

        function render() {
          body.innerHTML =
            '<div style="padding:24px 20px;max-width:440px;margin:0 auto;color:#fff;text-align:center;">' +
              '<div style="font-size:56px;line-height:1;margin-bottom:20px;">☕</div>' +
              '<button class="kfa-go" style="width:100%;padding:14px;border-radius:14px;border:none;' +
                'cursor:pointer;background:#72a4f2;color:#fff;font-weight:700;font-size:15px;">' +
                "you know, let me buy you a coffee</button>" +
              '<div class="kfa-qr" style="display:none;background:#fff;border-radius:16px;padding:16px;margin-top:16px;">' +
                '<img src="' + GCASH_QR + '" alt="GCash QR" ' +
                  'style="width:100%;max-width:240px;height:auto;display:block;margin:0 auto;border-radius:8px;" ' +
                  "onerror=\"this.style.display='none';this.nextElementSibling.style.display='block';\">" +
                '<div style="display:none;color:#333;font-size:13px;line-height:1.6;padding:40px 10px;">' +
                  "Ilagay ang QR:<br>" + GCASH_QR + "</div>" +
                '<div style="color:#333;font-size:14px;font-weight:700;margin-top:10px;">Maraming salamat! 💛</div>' +
              "</div>" +
            "</div>";

          var qr = body.querySelector(".kfa-qr");
          body.querySelector(".kfa-go").addEventListener("click", function () {
            if (qr) qr.style.display = "block";
            this.style.display = "none";
          });
        }

        render();
      },
    });
  },
};
