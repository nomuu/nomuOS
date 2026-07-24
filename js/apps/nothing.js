/* ============================================================
   NomuOS — "Nothing"
   A tiny space-flight game inspired by the Android easter egg.
   Pilot a little spacecraft through space: rotate, thrust, feel
   the gravity of nearby planets, and try to land gently on the
   glowing target planet.

   Controls (desktop):
     ← / A : rotate left        → / D : rotate right
     ↑ / W / Space : thrust      R : restart
   You can also hold the mouse button on the ship's side of the
   screen to thrust.
   ============================================================ */
window.NomuApps = window.NomuApps || {};
window.NomuApps.nothing = {
  id: "nothing",
  name: "Nothing",
  icon: "🌌",

  open: function () {
    NomuWM.open({
      key: "nothing",
      title: "Nothing",
      icon: "🌌",
      width: 720,
      height: 520,
      render: function (body) {
        body.style.padding = "0";
        body.style.overflow = "hidden";
        body.innerHTML =
          '<canvas class="nothing-canvas" tabindex="0" ' +
            'style="display:block;width:100%;height:100%;background:' +
            'radial-gradient(1200px 800px at 30% 20%, #10132b, #05060f 70%);' +
            'outline:none;cursor:crosshair;"></canvas>';

        var canvas = body.querySelector(".nothing-canvas");
        var ctx = canvas.getContext("2d");

        /* ---------- world / rendering size ---------- */
        var W = 0, H = 0, dpr = Math.max(1, window.devicePixelRatio || 1);
        function resize() {
          var w = body.clientWidth || 700;
          var h = body.clientHeight || 480;
          if (w === W && h === H) return;
          W = w; H = h;
          canvas.width = Math.floor(W * dpr);
          canvas.height = Math.floor(H * dpr);
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
        resize();

        /* ---------- helpers ---------- */
        function rand(a, b) { return a + Math.random() * (b - a); }

        /* ---------- starfield (parallax layers, world coords) ---------- */
        var stars = [];
        (function makeStars() {
          var span = 4000;
          for (var i = 0; i < 320; i++) {
            stars.push({
              x: rand(-span, span),
              y: rand(-span, span),
              z: rand(0.2, 1),           // depth -> parallax + size
            });
          }
        })();

        /* ---------- planets ---------- */
        var planets = [];
        function makePlanets() {
          planets = [];
          var palette = ["#7c5cff", "#21d4fd", "#ff5c9d", "#2fd671", "#ffb347", "#ff5c6c"];
          var count = 5;
          for (var i = 0; i < count; i++) {
            var r = rand(46, 120);
            planets.push({
              x: rand(-1400, 1400),
              y: rand(-1000, 1000),
              r: r,
              mass: r * r * 0.9,          // gravity scales with area
              color: palette[i % palette.length],
              target: false,
            });
          }
          // keep them apart from the spawn point a bit
          planets.forEach(function (p) {
            if (Math.hypot(p.x, p.y) < 320) { p.x += 500; p.y -= 400; }
          });
          // pick a target planet (the goal)
          planets[Math.floor(rand(0, planets.length))].target = true;
        }
        makePlanets();

        /* ---------- fuel pickups ---------- */
        var pickups = [];
        function farFromPlanets(x, y) {
          for (var i = 0; i < planets.length; i++) {
            if (Math.hypot(planets[i].x - x, planets[i].y - y) < planets[i].r + 60) return false;
          }
          return true;
        }
        function placePickup(pk) {
          // find an open spot not buried inside a planet
          for (var tries = 0; tries < 20; tries++) {
            var x = rand(-1600, 1600), y = rand(-1200, 1200);
            if (farFromPlanets(x, y)) { pk.x = x; pk.y = y; break; }
            pk.x = x; pk.y = y;
          }
          pk.taken = false;
          pk.respawn = 0;
        }
        function makePickups() {
          pickups = [];
          for (var i = 0; i < 6; i++) {
            var pk = { x: 0, y: 0, r: 12, taken: false, respawn: 0, spin: rand(0, Math.PI * 2) };
            placePickup(pk);
            pickups.push(pk);
          }
        }
        makePickups();

        /* ---------- ship ---------- */
        var ship, camX, camY, state, landings, msg, msgTimer;
        var SHIP_R = 9;
        function reset() {
          ship = {
            x: 0, y: 0, vx: 0, vy: 0,
            angle: -Math.PI / 2,   // pointing "up"
            thrusting: false,
            fuel: 100,
          };
          camX = 0; camY = 0;
          state = "flying";          // flying | landed | crashed
          landings = landings || 0;  // keep running total across attempts
          msg = "Fly to the glowing planet and land gently.";
          msgTimer = 260;
        }
        landings = 0;
        reset();

        /* ---------- input ---------- */
        var keys = {};
        function onKeyDown(e) {
          var k = e.key.toLowerCase();
          if (["arrowleft","arrowright","arrowup","a","d","w"," ","spacebar"].indexOf(k) !== -1) {
            e.preventDefault();
          }
          keys[k] = true;
          if (k === "r") { fullReset(); }
          if ((state !== "flying") && (k === " " || k === "spacebar" || k === "enter")) {
            softRetry();
          }
        }
        function onKeyUp(e) { keys[e.key.toLowerCase()] = false; }
        var pointerThrust = false;
        function onPointerDown(e) { e.preventDefault(); canvas.focus(); pointerThrust = true; if (state !== "flying") softRetry(); }
        function onPointerUp() { pointerThrust = false; }

        function fullReset() { landings = 0; makePlanets(); makePickups(); reset(); }
        function softRetry() { reset(); }   // respawn, keep the same planets & score

        canvas.addEventListener("keydown", onKeyDown);
        canvas.addEventListener("keyup", onKeyUp);
        canvas.addEventListener("pointerdown", onPointerDown);
        window.addEventListener("pointerup", onPointerUp);
        setTimeout(function () { try { canvas.focus(); } catch (e) {} }, 60);

        /* ---------- physics ---------- */
        var G = 0.06;
        function update() {
          if (state !== "flying") return;

          // steering
          var rot = 0.06;
          if (keys["arrowleft"] || keys["a"]) ship.angle -= rot;
          if (keys["arrowright"] || keys["d"]) ship.angle += rot;

          // thrust
          var wantThrust = keys["arrowup"] || keys["w"] || keys[" "] || keys["spacebar"] || pointerThrust;
          ship.thrusting = wantThrust && ship.fuel > 0;
          if (ship.thrusting) {
            var power = 0.14;
            ship.vx += Math.cos(ship.angle) * power;
            ship.vy += Math.sin(ship.angle) * power;
            ship.fuel = Math.max(0, ship.fuel - 0.18);
          }

          // gravity from every planet
          for (var i = 0; i < planets.length; i++) {
            var p = planets[i];
            var dx = p.x - ship.x, dy = p.y - ship.y;
            var d2 = dx * dx + dy * dy;
            var d = Math.sqrt(d2) || 1;
            var a = (G * p.mass) / d2;
            ship.vx += (dx / d) * a;
            ship.vy += (dy / d) * a;

            // collision / landing check
            if (d < p.r + SHIP_R) {
              var speed = Math.hypot(ship.vx, ship.vy);
              // normal points from planet center to ship
              var nx = -dx / d, ny = -dy / d;
              var noseX = Math.cos(ship.angle), noseY = Math.sin(ship.angle);
              var upright = (noseX * nx + noseY * ny); // 1 = perfectly nose-up
              if (speed < 2.2 && upright > 0.35) {
                state = "landed";
                if (p.target) { landings++; msg = "🎉 Perfect landing on the target!"; }
                else { msg = "Nice landing — but that's not the target planet."; }
              } else {
                state = "crashed";
                msg = "💥 Crashed! Too fast or bad angle.";
              }
              msgTimer = 999999;
              // settle the ship onto the surface
              ship.x = p.x + nx * (p.r + SHIP_R);
              ship.y = p.y + ny * (p.r + SHIP_R);
              ship.vx = ship.vy = 0;
            }
          }

          ship.x += ship.vx;
          ship.y += ship.vy;

          // fuel pickups: collect on touch, respawn elsewhere after a delay
          for (var pi = 0; pi < pickups.length; pi++) {
            var pk = pickups[pi];
            pk.spin += 0.05;
            if (pk.taken) {
              if (--pk.respawn <= 0) placePickup(pk);   // relocate & re-enable
              continue;
            }
            if (Math.hypot(pk.x - ship.x, pk.y - ship.y) < pk.r + SHIP_R + 4) {
              ship.fuel = Math.min(100, ship.fuel + 35);
              pk.taken = true;
              pk.respawn = 480;                          // ~8s at 60fps
              msg = "⛽ +35 fuel";
              msgTimer = 120;
            }
          }

          // camera eases toward the ship
          camX += (ship.x - camX) * 0.08;
          camY += (ship.y - camY) * 0.08;

          if (msgTimer < 999999 && msgTimer > 0) msgTimer--;
        }

        /* ---------- drawing ---------- */
        function toScreen(wx, wy) {
          return { x: wx - camX + W / 2, y: wy - camY + H / 2 };
        }

        function drawStars() {
          for (var i = 0; i < stars.length; i++) {
            var s = stars[i];
            // parallax: closer stars (z~1) move more with the camera
            var sx = s.x - camX * s.z + W / 2;
            var sy = s.y - camY * s.z + H / 2;
            // wrap into view
            sx = ((sx % W) + W) % W;
            sy = ((sy % H) + H) % H;
            var size = s.z * 1.8;
            ctx.globalAlpha = 0.25 + s.z * 0.6;
            ctx.fillStyle = "#eaf0ff";
            ctx.fillRect(sx, sy, size, size);
          }
          ctx.globalAlpha = 1;
        }

        function drawPlanet(p) {
          var s = toScreen(p.x, p.y);
          // skip if far off-screen
          if (s.x < -p.r - 40 || s.x > W + p.r + 40 || s.y < -p.r - 40 || s.y > H + p.r + 40) {
            // still draw a target arrow later; nothing here
            return;
          }
          var grad = ctx.createRadialGradient(s.x - p.r * 0.3, s.y - p.r * 0.3, p.r * 0.2, s.x, s.y, p.r);
          grad.addColorStop(0, p.color);
          grad.addColorStop(1, "rgba(0,0,0,0.65)");
          ctx.beginPath();
          ctx.arc(s.x, s.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();

          if (p.target) {
            ctx.beginPath();
            ctx.arc(s.x, s.y, p.r + 6 + Math.sin(Date.now() / 300) * 3, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(255,255,255,0.85)";
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        }

        function drawTargetArrow() {
          var t = null;
          for (var i = 0; i < planets.length; i++) if (planets[i].target) t = planets[i];
          if (!t) return;
          var s = toScreen(t.x, t.y);
          var onScreen = s.x > 20 && s.x < W - 20 && s.y > 20 && s.y < H - 20;
          if (onScreen) return;
          var cx = W / 2, cy = H / 2;
          var ang = Math.atan2(s.y - cy, s.x - cx);
          var ax = cx + Math.cos(ang) * (Math.min(W, H) / 2 - 30);
          var ay = cy + Math.sin(ang) * (Math.min(W, H) / 2 - 30);
          ctx.save();
          ctx.translate(ax, ay);
          ctx.rotate(ang);
          ctx.fillStyle = "rgba(255,255,255,0.9)";
          ctx.beginPath();
          ctx.moveTo(10, 0); ctx.lineTo(-6, -6); ctx.lineTo(-6, 6); ctx.closePath();
          ctx.fill();
          ctx.restore();
        }

        function drawShip() {
          var s = toScreen(ship.x, ship.y);
          ctx.save();
          ctx.translate(s.x, s.y);
          ctx.rotate(ship.angle + Math.PI / 2); // sprite points up by default

          // exhaust flame
          if (ship.thrusting) {
            ctx.beginPath();
            ctx.moveTo(-4, 8);
            ctx.lineTo(0, 8 + 8 + Math.random() * 8);
            ctx.lineTo(4, 8);
            ctx.closePath();
            ctx.fillStyle = "#ffb347";
            ctx.fill();
          }

          // body (little triangle lander)
          ctx.beginPath();
          ctx.moveTo(0, -12);
          ctx.lineTo(9, 9);
          ctx.lineTo(-9, 9);
          ctx.closePath();
          ctx.fillStyle = state === "crashed" ? "#ff5c6c" : "#eaf0ff";
          ctx.fill();
          ctx.fillStyle = "#21d4fd";
          ctx.beginPath();
          ctx.arc(0, -1, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        function drawHUD() {
          // fuel bar
          ctx.fillStyle = "rgba(255,255,255,0.18)";
          ctx.fillRect(14, 14, 120, 8);
          ctx.fillStyle = ship.fuel > 25 ? "#2fd671" : "#ff5c6c";
          ctx.fillRect(14, 14, 120 * (ship.fuel / 100), 8);
          ctx.fillStyle = "rgba(255,255,255,0.8)";
          ctx.font = "11px 'Segoe UI', sans-serif";
          ctx.textAlign = "left";
          ctx.fillText("FUEL", 14, 36);

          var speed = Math.hypot(ship.vx, ship.vy);
          var hdg = Math.round(((ship.angle * 180 / Math.PI) % 360 + 360) % 360);
          // nearest planet distance (surface)
          var nearest = Infinity;
          for (var i = 0; i < planets.length; i++) {
            var d = Math.hypot(planets[i].x - ship.x, planets[i].y - ship.y) - planets[i].r;
            if (d < nearest) nearest = d;
          }
          ctx.textAlign = "right";
          ctx.font = "11px 'Consolas','Segoe UI',monospace";
          ctx.fillStyle = "rgba(255,255,255,0.85)";
          var rx = W - 14, ry = 20, lh = 15;
          ctx.fillText("POS  X " + Math.round(ship.x) + "  Y " + Math.round(ship.y), rx, ry); ry += lh;
          ctx.fillText("VEL  " + ship.vx.toFixed(2) + " , " + ship.vy.toFixed(2), rx, ry); ry += lh;
          ctx.fillText("SPD  " + speed.toFixed(2), rx, ry); ry += lh;
          ctx.fillText("HDG  " + hdg + "\u00B0", rx, ry); ry += lh;
          ctx.fillText("ALT  " + Math.max(0, Math.round(nearest)), rx, ry); ry += lh;
          ctx.fillText("FUEL " + Math.round(ship.fuel) + "%", rx, ry); ry += lh;
          ctx.fillText("LANDED " + landings, rx, ry);
          ctx.textAlign = "left";

          // message / end states
          if (state !== "flying") {
            ctx.fillStyle = "rgba(5,6,15,0.55)";
            ctx.fillRect(0, H / 2 - 40, W, 80);
            ctx.textAlign = "center";
            ctx.fillStyle = "#fff";
            ctx.font = "bold 18px 'Segoe UI', sans-serif";
            ctx.fillText(msg, W / 2, H / 2 - 6);
            ctx.font = "13px 'Segoe UI', sans-serif";
            ctx.fillStyle = "rgba(255,255,255,0.75)";
            ctx.fillText("Space / Tap to fly again   ·   R for a new galaxy", W / 2, H / 2 + 18);
            ctx.textAlign = "left";
          } else if (msgTimer > 0) {
            ctx.textAlign = "center";
            ctx.fillStyle = "rgba(255,255,255," + Math.min(0.8, msgTimer / 120) + ")";
            ctx.font = "13px 'Segoe UI', sans-serif";
            ctx.fillText(msg, W / 2, H - 22);
            ctx.textAlign = "left";
          }
        }

        function drawPickups() {
          for (var i = 0; i < pickups.length; i++) {
            var pk = pickups[i];
            if (pk.taken) continue;
            var s = toScreen(pk.x, pk.y);
            if (s.x < -30 || s.x > W + 30 || s.y < -30 || s.y > H + 30) continue;
            var pulse = 1 + Math.sin(pk.spin) * 0.12;
            // glow
            ctx.beginPath();
            ctx.arc(s.x, s.y, pk.r * 1.7 * pulse, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(47,214,113,0.15)";
            ctx.fill();
            // canister
            ctx.beginPath();
            ctx.arc(s.x, s.y, pk.r, 0, Math.PI * 2);
            ctx.fillStyle = "#2fd671";
            ctx.fill();
            ctx.font = "13px serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("⛽", s.x, s.y + 1);
            ctx.textAlign = "left";
            ctx.textBaseline = "alphabetic";
          }
        }

        function draw() {
          resize();
          ctx.clearRect(0, 0, W, H);
          drawStars();
          planets.forEach(drawPlanet);
          drawPickups();
          drawTargetArrow();
          drawShip();
          drawHUD();
        }

        /* ---------- loop ---------- */
        var raf = null;
        function loop() {
          if (!canvas.isConnected) {          // window was closed -> stop & clean up
            cleanup();
            return;
          }
          raf = requestAnimationFrame(loop);
          update();
          draw();
        }

        function cleanup() {
          if (raf) cancelAnimationFrame(raf);
          raf = null;
          canvas.removeEventListener("keydown", onKeyDown);
          canvas.removeEventListener("keyup", onKeyUp);
          canvas.removeEventListener("pointerdown", onPointerDown);
          window.removeEventListener("pointerup", onPointerUp);
        }

        loop();
      },
    });
  },
};
