/* ============================================================
   NomuOS — Cat Runner (a Chrome-dino-style mini game, but a cat)
   Usage: var game = NomuCatGame.create(containerEl);  game.destroy();
   ============================================================ */
window.NomuCatGame = (function () {
  "use strict";

  function create(container) {
    if (!container) return { destroy: function () {} };

    container.innerHTML =
      '<canvas class="catgame" width="600" height="170" tabindex="0" ' +
        'aria-label="Cat runner game"></canvas>' +
      '<div class="catgame-hint">🐱 Tap the game or press Space / ↑ to jump</div>';

    var canvas = container.querySelector("canvas");
    var ctx = canvas.getContext("2d");

    var W = 600, H = 170, groundY = 138;

    var cat = { x: 62, y: groundY, vy: 0, onGround: true };
    var gravity = 0.8, jumpV = -14;

    var obstacles = [];
    var spawnIn = 60;
    var speed = 6;
    var score = 0;
    var best = 0;
    var groundOffset = 0;
    var state = "ready"; // ready | running | over
    var raf = null;

    function reset() {
      cat.y = groundY; cat.vy = 0; cat.onGround = true;
      obstacles = []; spawnIn = 50; speed = 6; score = 0;
      state = "running";
    }

    function jump() {
      if (state === "ready" || state === "over") { reset(); return; }
      if (cat.onGround) { cat.vy = jumpV; cat.onGround = false; }
    }

    function spawn() {
      var tall = Math.random() < 0.35;
      obstacles.push({ x: W + 20, h: tall ? 40 : 28, glyph: "🌵" });
    }

    function overlap(a, b) {
      return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    }

    function update() {
      // cat physics
      cat.vy += gravity;
      cat.y += cat.vy;
      if (cat.y >= groundY) { cat.y = groundY; cat.vy = 0; cat.onGround = true; }

      // spawn obstacles
      spawnIn--;
      if (spawnIn <= 0) {
        spawn();
        spawnIn = Math.max(42, Math.floor(560 / speed) + Math.floor(Math.random() * 34));
      }

      // move obstacles + collision
      var catBox = { x: cat.x + 3, y: cat.y - 28, w: 22, h: 28 };
      for (var i = obstacles.length - 1; i >= 0; i--) {
        var o = obstacles[i];
        o.x -= speed;
        var obsBox = { x: o.x + 3, y: groundY - o.h, w: 16, h: o.h };
        if (overlap(catBox, obsBox)) {
          state = "over";
          if (score > best) best = score;
        }
        if (o.x < -30) obstacles.splice(i, 1);
      }

      score += 1;
      speed += 0.003;
      groundOffset = (groundOffset + speed) % 24;
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);

      // ground line + moving ticks
      ctx.strokeStyle = "rgba(255,255,255,0.28)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, groundY + 2);
      ctx.lineTo(W, groundY + 2);
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,0.16)";
      ctx.lineWidth = 2;
      for (var gx = -groundOffset; gx < W; gx += 24) {
        ctx.beginPath();
        ctx.moveTo(gx, groundY + 9);
        ctx.lineTo(gx + 10, groundY + 9);
        ctx.stroke();
      }

      // obstacles
      ctx.textBaseline = "alphabetic";
      obstacles.forEach(function (o) {
        ctx.font = o.h + "px serif";
        ctx.fillText(o.glyph, o.x, groundY + 2);
      });

      // cat
      ctx.font = "30px serif";
      ctx.fillText(state === "over" ? "🙀" : "🐱", cat.x, cat.y + 2);

      // score
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.font = "bold 14px 'Segoe UI', sans-serif";
      ctx.textAlign = "right";
      ctx.fillText("HI " + String(Math.floor(best / 6)).padStart(4, "0") +
        "   " + String(Math.floor(score / 6)).padStart(4, "0"), W - 12, 24);
      ctx.textAlign = "left";

      // overlays
      if (state !== "running") {
        ctx.fillStyle = "rgba(255,255,255,0.92)";
        ctx.textAlign = "center";
        ctx.font = "bold 18px 'Segoe UI', sans-serif";
        if (state === "ready") {
          ctx.fillText("Press Space / Tap to start 🐱", W / 2, H / 2 - 4);
        } else {
          ctx.fillText("Game Over", W / 2, H / 2 - 10);
          ctx.font = "13px 'Segoe UI', sans-serif";
          ctx.fillStyle = "rgba(255,255,255,0.7)";
          ctx.fillText("Score " + Math.floor(score / 6) + " · Space / Tap to retry", W / 2, H / 2 + 12);
        }
        ctx.textAlign = "left";
      }
    }

    function loop() {
      if (!canvas.isConnected) { if (raf) cancelAnimationFrame(raf); return; }
      raf = requestAnimationFrame(loop);
      if (state === "running") update();
      draw();
    }

    function onKey(e) {
      if (e.key === " " || e.code === "Space" || e.key === "ArrowUp" || e.key === "Up") {
        e.preventDefault();
        jump();
      }
    }
    function onPointer(e) {
      e.preventDefault();
      canvas.focus();
      jump();
    }

    canvas.addEventListener("keydown", onKey);
    canvas.addEventListener("pointerdown", onPointer);
    try { canvas.focus(); } catch (e) {}

    loop();

    return {
      destroy: function () {
        if (raf) cancelAnimationFrame(raf);
        raf = null;
        canvas.removeEventListener("keydown", onKey);
        canvas.removeEventListener("pointerdown", onPointer);
      },
    };
  }

  return { create: create };
})();
