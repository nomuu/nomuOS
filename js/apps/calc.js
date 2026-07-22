/* NomuOS — Calculator app */
window.NomuApps = window.NomuApps || {};
window.NomuApps.calc = {
  id: "calc",
  name: "Calculator",
  icon: "🧮",
  open: function () {
    NomuWM.open({
      title: "Calculator",
      icon: "🧮",
      width: 300,
      height: 440,
      render: function (body) {
        // ----- calculator state -----
        var current = "0";   // string shown on the display
        var stored = null;   // previous operand (number)
        var op = null;       // pending operator: + - * /
        var justEvaluated = false; // true right after "="

        // Button layout: [label, type, value]
        var LAYOUT = [
          ["C", "action", "clear"],
          ["⌫", "action", "back"],
          ["%", "action", "percent"],
          ["÷", "op", "/"],
          ["7", "num", "7"], ["8", "num", "8"], ["9", "num", "9"], ["×", "op", "*"],
          ["4", "num", "4"], ["5", "num", "5"], ["6", "num", "6"], ["−", "op", "-"],
          ["1", "num", "1"], ["2", "num", "2"], ["3", "num", "3"], ["+", "op", "+"],
          ["0", "num zero", "0"], [".", "num", "."], ["=", "equals", "="],
        ];

        var buttonsHtml = LAYOUT.map(function (b) {
          var cls = "calc-btn";
          if (b[1].indexOf("op") === 0) cls += " calc-op";
          else if (b[1] === "action") cls += " calc-action";
          else if (b[1] === "equals") cls += " calc-equals";
          if (b[1].indexOf("zero") !== -1) cls += " calc-zero";
          return '<button class="' + cls + '" data-type="' + b[1].split(" ")[0] +
            '" data-value="' + b[2] + '">' + b[0] + "</button>";
        }).join("");

        body.innerHTML =
          '<div class="calc">' +
            '<div class="calc-display">' +
              '<div class="calc-history" id="calc-history"></div>' +
              '<div class="calc-current" id="calc-current">0</div>' +
            "</div>" +
            '<div class="calc-pad">' + buttonsHtml + "</div>" +
          "</div>";

        var displayEl = body.querySelector("#calc-current");
        var historyEl = body.querySelector("#calc-history");

        var OP_SYMBOL = { "+": "+", "-": "−", "*": "×", "/": "÷" };

        function fmt(n) {
          if (!isFinite(n)) return "Error";
          // Round to avoid floating point noise, trim trailing zeros.
          var r = Math.round((n + Number.EPSILON) * 1e10) / 1e10;
          return String(r);
        }

        function render() {
          displayEl.textContent = current;
          historyEl.textContent =
            stored !== null && op ? fmt(stored) + " " + OP_SYMBOL[op] : "";
        }

        function inputDigit(d) {
          if (justEvaluated) { current = "0"; justEvaluated = false; }
          if (d === ".") {
            if (current.indexOf(".") === -1) current += ".";
          } else {
            current = current === "0" ? d : current + d;
          }
          render();
        }

        function compute(a, b, operator) {
          switch (operator) {
            case "+": return a + b;
            case "-": return a - b;
            case "*": return a * b;
            case "/": return b === 0 ? NaN : a / b;
          }
          return b;
        }

        function setOp(nextOp) {
          var value = parseFloat(current);
          if (op !== null && !justEvaluated) {
            var result = compute(stored, value, op);
            stored = result;
            current = fmt(result);
          } else {
            stored = value;
          }
          op = nextOp;
          justEvaluated = false;
          current = "0";
          render();
          // keep showing the running result in history
          historyEl.textContent = fmt(stored) + " " + OP_SYMBOL[op];
        }

        function equals() {
          if (op === null || stored === null) return;
          var value = parseFloat(current);
          var result = compute(stored, value, op);
          historyEl.textContent =
            fmt(stored) + " " + OP_SYMBOL[op] + " " + fmt(value) + " =";
          current = fmt(result);
          stored = null;
          op = null;
          justEvaluated = true;
          displayEl.textContent = current;
        }

        function clearAll() {
          current = "0"; stored = null; op = null; justEvaluated = false;
          render();
        }

        function backspace() {
          if (justEvaluated) { clearAll(); return; }
          current = current.length > 1 ? current.slice(0, -1) : "0";
          render();
        }

        function percent() {
          var value = parseFloat(current);
          // If mid-operation, percent is relative to the stored operand.
          if (op !== null && stored !== null) value = stored * (value / 100);
          else value = value / 100;
          current = fmt(value);
          justEvaluated = false;
          render();
        }

        function handle(type, value) {
          if (type === "num") inputDigit(value);
          else if (type === "op") setOp(value);
          else if (type === "equals") equals();
          else if (type === "action") {
            if (value === "clear") clearAll();
            else if (value === "back") backspace();
            else if (value === "percent") percent();
          }
        }

        body.querySelector(".calc-pad").addEventListener("click", function (e) {
          var btn = e.target.closest(".calc-btn");
          if (!btn) return;
          handle(btn.getAttribute("data-type"), btn.getAttribute("data-value"));
        });

        // Keyboard support
        function onKey(e) {
          var k = e.key;
          if (k >= "0" && k <= "9") { inputDigit(k); e.preventDefault(); }
          else if (k === ".") { inputDigit("."); e.preventDefault(); }
          else if (k === "+" || k === "-" || k === "*" || k === "/") { setOp(k); e.preventDefault(); }
          else if (k === "Enter" || k === "=") { equals(); e.preventDefault(); }
          else if (k === "Backspace") { backspace(); e.preventDefault(); }
          else if (k === "Escape") { clearAll(); e.preventDefault(); }
          else if (k === "%") { percent(); e.preventDefault(); }
        }
        body.addEventListener("keydown", onKey);
        // Make the body focusable so it can receive key events.
        body.setAttribute("tabindex", "0");
        setTimeout(function () { body.focus(); }, 50);

        render();
      },
    });
  },
};
