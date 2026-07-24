/* NomuOS — Calendar app (month view) */
window.NomuApps = window.NomuApps || {};
window.NomuApps.calendar = {
  id: "calendar",
  name: "Calendar",
  icon: "📅",
  open: function () {
    NomuWM.open({
      key: "calendar",
      title: "Calendar",
      icon: "📅",
      width: 380,
      height: 420,
      render: function (body) {
        var MONTHS = [
          "January", "February", "March", "April", "May", "June",
          "July", "August", "September", "October", "November", "December",
        ];
        var DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

        var today = new Date();
        var view = new Date(today.getFullYear(), today.getMonth(), 1); // first of viewed month
        var selected = null; // {y, m, d}

        body.innerHTML =
          '<div class="cal">' +
            '<div class="cal-head">' +
              '<button class="cal-nav" id="cal-prev" title="Previous month">‹</button>' +
              '<div class="cal-title" id="cal-title"></div>' +
              '<button class="cal-nav" id="cal-next" title="Next month">›</button>' +
            '</div>' +
            '<div class="cal-weekdays" id="cal-weekdays"></div>' +
            '<div class="cal-grid" id="cal-grid"></div>' +
            '<div class="cal-foot">' +
              '<button class="btn" id="cal-today">Today</button>' +
              '<span class="cal-selected" id="cal-selected"></span>' +
            '</div>' +
          '</div>';

        var titleEl = body.querySelector("#cal-title");
        var gridEl = body.querySelector("#cal-grid");
        var weekdaysEl = body.querySelector("#cal-weekdays");
        var selectedEl = body.querySelector("#cal-selected");

        weekdaysEl.innerHTML = DAYS.map(function (d) {
          return '<div class="cal-wd">' + d + "</div>";
        }).join("");

        function sameDay(y, m, d, date) {
          return date.getFullYear() === y && date.getMonth() === m && date.getDate() === d;
        }

        function render() {
          var y = view.getFullYear();
          var m = view.getMonth();
          titleEl.textContent = MONTHS[m] + " " + y;

          var firstDow = new Date(y, m, 1).getDay();      // 0=Sun
          var daysInMonth = new Date(y, m + 1, 0).getDate();
          var daysPrev = new Date(y, m, 0).getDate();

          var cells = [];
          // leading days from previous month
          for (var i = firstDow - 1; i >= 0; i--) {
            cells.push({ day: daysPrev - i, muted: true });
          }
          // current month
          for (var d = 1; d <= daysInMonth; d++) {
            cells.push({ day: d, muted: false });
          }
          // trailing days to complete the last week row
          while (cells.length % 7 !== 0) {
            cells.push({ day: cells.length, muted: true, trailing: true });
          }

          gridEl.innerHTML = "";
          var trailingCount = 0;
          cells.forEach(function (c) {
            var el = document.createElement("button");
            el.className = "cal-day";
            if (c.muted) {
              el.classList.add("muted");
              // relabel trailing cells with next-month day numbers
              if (c.trailing) { trailingCount++; el.textContent = trailingCount; }
              else el.textContent = c.day;
              el.disabled = true;
            } else {
              el.textContent = c.day;
              if (sameDay(y, m, c.day, today)) el.classList.add("today");
              if (selected && selected.y === y && selected.m === m && selected.d === c.day) {
                el.classList.add("selected");
              }
              el.addEventListener("click", function () {
                selected = { y: y, m: m, d: c.day };
                render();
                var dt = new Date(y, m, c.day);
                selectedEl.textContent = dt.toLocaleDateString([], {
                  weekday: "long", year: "numeric", month: "long", day: "numeric",
                });
              });
            }
            gridEl.appendChild(el);
          });
        }

        body.querySelector("#cal-prev").addEventListener("click", function () {
          view.setMonth(view.getMonth() - 1); render();
        });
        body.querySelector("#cal-next").addEventListener("click", function () {
          view.setMonth(view.getMonth() + 1); render();
        });
        body.querySelector("#cal-today").addEventListener("click", function () {
          today = new Date();
          view = new Date(today.getFullYear(), today.getMonth(), 1);
          selected = { y: today.getFullYear(), m: today.getMonth(), d: today.getDate() };
          render();
          selectedEl.textContent = today.toLocaleDateString([], {
            weekday: "long", year: "numeric", month: "long", day: "numeric",
          });
        });

        render();
      },
    });
  },
};
