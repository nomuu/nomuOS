/* ============================================================
   NomuOS — "Spill the Tea"
   A tiny 3D tea-pouring game built on Three.js (WebGL).

   Goal: pour as much tea as you can INTO the glass. The wind
   keeps shoving your stream sideways, so you have to lead the
   pour. Tilt the pot steeply for a clean stream — pour too
   shallow and the tea just dribbles down the spout and spills
   (that classic "naligwak sa nguso" moment).

   Controls (desktop):
     Move mouse LEFT/RIGHT ... slide the teapot over the glass
     Move mouse UP/DOWN ...... steep pour (up) vs shallow (down)
     Hold mouse / SPACE ...... pour the tea
     R ....................... restart

   Mobile: drag anywhere to aim the pot + set the pour angle,
   and tap-hold the POUR button to pour.

   No emoji, no 2D sprites — real 3D meshes, lighting and a
   physics-driven particle stream.
   ============================================================ */
window.NomuApps = window.NomuApps || {};
window.NomuApps.spillTheTea = {
  id: "spillTheTea",
  name: "Spill the Tea",
  icon: "🫖",

  open: function () {
    NomuWM.open({
      key: "spillTheTea",
      title: "Spill the Tea",
      icon: "🫖",
      width: 760,
      height: 560,
      render: function (body, api) {
        body.style.padding = "0";
        body.style.overflow = "hidden";
        body.style.position = "relative";
        body.style.background = "#0b0e1a";

        var THREE = window.THREE;
        if (!THREE) {
          body.innerHTML =
            '<div style="padding:24px;color:#eaf0ff;font:14px/1.6 Segoe UI,sans-serif">' +
            "<b>Spill the Tea</b> needs the Three.js library, which didn't load.<br>" +
            "This game needs an internet connection the first time (the 3D engine " +
            "is fetched from a CDN). Reconnect and reopen the app." +
            "</div>";
          return;
        }

        /* ---------- sizing ---------- */
        var W = body.clientWidth || 760;
        var H = body.clientHeight || 560;

        var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
        renderer.setSize(W, H);
        renderer.domElement.style.display = "block";
        renderer.domElement.style.width = "100%";
        renderer.domElement.style.height = "100%";
        renderer.domElement.style.cursor = "crosshair";
        renderer.domElement.style.outline = "none";
        renderer.domElement.style.touchAction = "none";   // let us own touch drags (no page scroll / shell swipes)
        renderer.domElement.tabIndex = 0;
        body.appendChild(renderer.domElement);

        var scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0b0e1a);
        scene.fog = new THREE.Fog(0x0b0e1a, 12, 26);

        var camera = new THREE.PerspectiveCamera(48, W / H, 0.1, 100);
        camera.position.set(0, 3.4, 8.4);
        camera.lookAt(0, 1.5, 0);

        /* ---------- lights ---------- */
        scene.add(new THREE.HemisphereLight(0xbcd0ff, 0x20140a, 0.75));
        var key = new THREE.DirectionalLight(0xffffff, 0.9);
        key.position.set(4, 8, 6);
        scene.add(key);
        var rim = new THREE.DirectionalLight(0x7c9cff, 0.5);
        rim.position.set(-6, 4, -4);
        scene.add(rim);

        /* ---------- table ---------- */
        var table = new THREE.Mesh(
          new THREE.CylinderGeometry(7, 7, 0.4, 48),
          new THREE.MeshStandardMaterial({ color: 0x3a2a20, roughness: 0.9, metalness: 0.05 })
        );
        table.position.y = -0.2;
        scene.add(table);

        // a soft ring to mark where the glass sits
        var mat = new THREE.MeshStandardMaterial({ color: 0x5a4030, roughness: 1 });
        var coaster = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.06, 40), mat);
        coaster.position.y = 0.03;
        scene.add(coaster);

        /* ---------- glass ---------- */
        var GLASS_BASE_Y = 0.06;     // inner floor of the glass
        var GLASS_H = 2.2;           // glass height
        var GLASS_R = 0.82;          // outer radius
        var GLASS_INNER = 0.72;      // capture radius
        var RIM_Y = GLASS_BASE_Y + GLASS_H;

        var glassGroup = new THREE.Group();
        scene.add(glassGroup);

        var glassWall = new THREE.Mesh(
          new THREE.CylinderGeometry(GLASS_R, GLASS_R * 0.9, GLASS_H, 40, 1, true),
          new THREE.MeshStandardMaterial({
            color: 0xaad4ff, transparent: true, opacity: 0.22,
            roughness: 0.05, metalness: 0, side: THREE.DoubleSide,
          })
        );
        glassWall.position.y = GLASS_BASE_Y + GLASS_H / 2;
        glassGroup.add(glassWall);

        var glassBottom = new THREE.Mesh(
          new THREE.CylinderGeometry(GLASS_R * 0.9, GLASS_R * 0.9, 0.12, 40),
          new THREE.MeshStandardMaterial({ color: 0xaad4ff, transparent: true, opacity: 0.35, roughness: 0.05 })
        );
        glassBottom.position.y = GLASS_BASE_Y;
        glassGroup.add(glassBottom);

        // the tea inside the glass — a cylinder we scale in Y as it fills
        var teaColor = 0xd98a2b;
        var tea = new THREE.Mesh(
          new THREE.CylinderGeometry(GLASS_INNER, GLASS_INNER * 0.9, 1, 36),
          new THREE.MeshStandardMaterial({ color: teaColor, roughness: 0.25, metalness: 0.1, transparent: true, opacity: 0.92 })
        );
        tea.scale.y = 0.0001;
        tea.position.y = GLASS_BASE_Y;
        glassGroup.add(tea);

        /* ---------- teapot (built from primitives) ---------- */
        var pot = new THREE.Group();
        pot.position.set(0, 4.0, 0);
        scene.add(pot);

        var potMat = new THREE.MeshStandardMaterial({ color: 0xe8e2d0, roughness: 0.4, metalness: 0.25 });
        var potMatDark = new THREE.MeshStandardMaterial({ color: 0xc9b48f, roughness: 0.5, metalness: 0.2 });

        var potBody = new THREE.Mesh(new THREE.SphereGeometry(0.7, 28, 20), potMat);
        potBody.scale.y = 0.8;
        pot.add(potBody);

        var potLid = new THREE.Mesh(new THREE.SphereGeometry(0.32, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), potMatDark);
        potLid.position.y = 0.52;
        pot.add(potLid);
        var knob = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 10), potMatDark);
        knob.position.y = 0.62;
        pot.add(knob);

        // spout: a cone pointing out toward +X and slightly up
        var spout = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.16, 0.95, 16), potMat);
        spout.position.set(0.72, 0.12, 0);
        spout.rotation.z = -Math.PI / 3.1;   // tip aims up/out
        pot.add(spout);

        // handle: a torus on the -X side
        var handle = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.07, 12, 24), potMatDark);
        handle.position.set(-0.72, 0.1, 0);
        handle.rotation.y = Math.PI / 2;
        pot.add(handle);

        // Local position of the spout tip (where tea comes out).
        var SPOUT_TIP_LOCAL = new THREE.Vector3(0.72 + 0.5, 0.12 + 0.62, 0);

        /* ---------- tea particle system (THREE.Points) ---------- */
        var MAX = 1400;
        var posArr = new Float32Array(MAX * 3);
        var pgeo = new THREE.BufferGeometry();
        pgeo.setAttribute("position", new THREE.BufferAttribute(posArr, 3));
        var pmat = new THREE.PointsMaterial({
          color: teaColor, size: 0.14, sizeAttenuation: true,
          transparent: true, opacity: 0.95, depthWrite: false,
        });
        var points = new THREE.Points(pgeo, pmat);
        points.frustumCulled = false;
        scene.add(points);

        // particle pool: plain JS objects, packed into posArr each frame
        var parts = [];   // active particles

        /* ---------- wind gust streaks (thin visual lines) ---------- */
        var gustGeo = new THREE.BufferGeometry();
        var GUSTS = 60;
        var gustPos = new Float32Array(GUSTS * 2 * 3);
        var gustData = [];
        for (var gi = 0; gi < GUSTS; gi++) {
          gustData.push({ x: rand(-8, 8), y: rand(0.5, 6), z: rand(-3, 2), len: rand(0.4, 1.3) });
        }
        gustGeo.setAttribute("position", new THREE.BufferAttribute(gustPos, 3));
        var gustMat = new THREE.LineBasicMaterial({ color: 0x9fb4ff, transparent: true, opacity: 0.18 });
        var gusts = new THREE.LineSegments(gustGeo, gustMat);
        gusts.frustumCulled = false;
        scene.add(gusts);

        /* ---------- HUD overlay ---------- */
        var hud = document.createElement("div");
        hud.style.cssText =
          "position:absolute;inset:0;pointer-events:none;color:#eaf0ff;" +
          "font:12px/1.4 'Segoe UI',sans-serif;text-shadow:0 1px 2px rgba(0,0,0,.6);";
        hud.innerHTML =
          '<div style="position:absolute;top:12px;left:14px;">' +
            '<div style="font-size:13px;font-weight:700;letter-spacing:.3px;">SPILL THE TEA</div>' +
            '<div class="stt-level" style="margin-top:3px;font-size:12px;font-weight:700;color:#9fc0ff;">Level 1 · need 85%</div>' +
            '<div class="stt-score" style="margin-top:6px;font-size:22px;font-weight:800;color:#ffcf7a;">0 <span style="font-size:12px;font-weight:600;color:#cdd6ff;">ml in glass</span></div>' +
            '<div class="stt-spill" style="margin-top:2px;color:#ff9c9c;">spilled 0 ml</div>' +
            '<div class="stt-fill" style="margin-top:2px;color:#9fe0b0;">glass 0% full</div>' +
            '<div class="stt-pot" style="margin-top:2px;color:#ffd9a0;">pot: 1500 ml left</div>' +
          "</div>" +
          '<div style="position:absolute;top:12px;right:14px;text-align:right;">' +
            '<div style="color:#cdd6ff;">WIND</div>' +
            '<div class="stt-wind" style="font-size:20px;font-weight:800;">→</div>' +
            '<div class="stt-windv" style="color:#cdd6ff;">calm</div>' +
          "</div>" +
          '<div class="stt-tip" style="position:absolute;left:0;right:0;bottom:14px;text-align:center;color:#cdd6ff;">' +
            "Drag to slide the pot · drag up = steeper pour · hold Space to pour · Enter next · R retry" +
          "</div>" +
          '<div class="stt-banner" style="position:absolute;left:0;right:0;top:46%;text-align:center;font-size:20px;font-weight:800;color:#fff;display:none;"></div>';
        body.appendChild(hud);
        var elScore = hud.querySelector(".stt-score");
        var elLevel = hud.querySelector(".stt-level");
        var elSpill = hud.querySelector(".stt-spill");
        var elFill = hud.querySelector(".stt-fill");
        var elPot = hud.querySelector(".stt-pot");
        var elWind = hud.querySelector(".stt-wind");
        var elWindV = hud.querySelector(".stt-windv");
        var elBanner = hud.querySelector(".stt-banner");
        // The banner is tappable so mobile (no keyboard) can advance/retry too.
        elBanner.style.pointerEvents = "auto";
        elBanner.style.cursor = "pointer";
        elBanner.addEventListener("click", function () {
          if (phase === "cleared") startLevel(level + 1);
          else if (phase === "failed") startLevel(level);
          else if (phase === "won") fullReset();
        });

        /* ---------- levels ----------
           Each level raises the pot higher (longer fall = harder, windier
           pour) and the camera pulls up/back to keep everything in frame.
           `need` is the glass fill % required to clear the level.          */
        var LEVELS = [
          { potY: 6.9, need: 0.85, camY: 5.5, camZ: 11.2, lookY: 3.1, wind: 3.2 },
          { potY: 8.4, need: 0.70, camY: 6.6, camZ: 12.8, lookY: 3.9, wind: 4.2 },
          { potY: 9.9, need: 0.60, camY: 7.7, camZ: 14.4, lookY: 4.7, wind: 5.2 },
        ];

        /* ---------- game state ---------- */
        var POT_CAP = 1500;   // how much tea the pot holds (ml)
        var level, phase, total;   // phase: "play" | "cleared" | "failed" | "won"
        var inGlass, spilled, fillLevel, wind, windTarget, windTimer, tPour, pouring, potTea;

        function startLevel(n) {
          level = n;
          var cfg = LEVELS[level - 1];
          parts.length = 0;
          inGlass = 0; spilled = 0; fillLevel = 0;
          wind = 0; windTarget = rand(-2.2, 2.2); windTimer = 0;
          tPour = 0; pouring = false; phase = "play";
          potTea = POT_CAP;
          tea.scale.y = 0.0001;
          pot.position.set(0, cfg.potY, 0);
          pot.rotation.z = 0;
          aimX = 0;
          camera.position.set(0, cfg.camY, cfg.camZ);
          camera.lookAt(0, cfg.lookY, 0);
          elBanner.style.display = "none";
        }
        function fullReset() { total = 0; startLevel(1); }
        fullReset();

        /* ---------- input ---------- */
        // aimX in world units, pourSteep 0..1 (1 = steep/clean, 0 = shallow/dribble).
        // The pot is DRAGGED (relative motion), so it never snaps to the cursor
        // and you can nudge it exactly over the glass. Pour with Space (or the
        // POUR button on mobile).
        var aimX = 0, pourSteep = 0.7;
        var dragging = false, lastX = 0, lastY = 0;
        var spaceHeld = false, pourBtnHeld = false;

        function onDown(e) {
          e.preventDefault();
          e.stopPropagation();     // canvas owns the drag (mobile shell won't hijack it)
          renderer.domElement.focus();
          dragging = true;
          lastX = e.clientX; lastY = e.clientY;
        }
        function onMove(e) {
          if (!dragging) return;
          var r = renderer.domElement.getBoundingClientRect();
          var dx = e.clientX - lastX, dy = e.clientY - lastY;
          lastX = e.clientX; lastY = e.clientY;
          aimX = clamp(aimX + (dx / r.width) * 9, -4, 4);          // drag left/right to slide
          pourSteep = clamp(pourSteep - (dy / r.height) * 1.6, 0, 1); // drag up = steeper pour
        }
        function onUp() { dragging = false; }
        function onKey(e) {
          var k = e.key.toLowerCase();
          if (k === " " || k === "spacebar") { e.preventDefault(); spaceHeld = true; }
          if (k === "enter") {
            e.preventDefault();
            if (phase === "cleared") startLevel(level + 1);   // next level
          }
          if (k === "r") {
            if (phase === "won") fullReset();                 // start over from level 1
            else startLevel(level);                           // retry / refill this level
          }
        }
        function onKeyUp(e) {
          var k = e.key.toLowerCase();
          if (k === " " || k === "spacebar") spaceHeld = false;
        }

        var el = renderer.domElement;
        el.addEventListener("pointerdown", onDown);
        window.addEventListener("pointermove", onMove);   // keep dragging outside the canvas
        window.addEventListener("pointerup", onUp);
        el.addEventListener("keydown", onKey);
        el.addEventListener("keyup", onKeyUp);
        setTimeout(function () { try { el.focus(); } catch (e) {} }, 60);

        /* ---------- mobile controls ---------- */
        var onMobile = !!(window.NomuMobile && NomuMobile.isActive());
        if (onMobile) {
          var pourBtn = document.createElement("button");
          pourBtn.textContent = "POUR";
          pourBtn.style.cssText =
            "position:absolute;right:18px;bottom:22px;z-index:6;pointer-events:auto;" +
            "width:88px;height:88px;border-radius:50%;border:1px solid rgba(255,255,255,.35);" +
            "background:rgba(217,138,43,.85);color:#1a1207;font-weight:800;font-size:15px;" +
            "touch-action:none;-webkit-tap-highlight-color:transparent;";
          body.appendChild(pourBtn);
          pourBtn.addEventListener("pointerdown", function (e) { e.preventDefault(); e.stopPropagation(); pourBtnHeld = true; });
          pourBtn.addEventListener("pointerup", function (e) { e.preventDefault(); pourBtnHeld = false; });
          pourBtn.addEventListener("pointerleave", function () { pourBtnHeld = false; });
          hud.querySelector(".stt-tip").textContent = "Drag to slide the pot · drag up = steeper pour · hold POUR";
        }

        /* ---------- helpers ---------- */
        function rand(a, b) { return a + Math.random() * (b - a); }
        function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

        var spoutWorld = new THREE.Vector3();
        function emit(dt) {
          if (potTea <= 0) return;               // pot's empty, nothing to pour
          // how many particles to spawn this frame
          var count = 5;
          pot.updateMatrixWorld();
          spoutWorld.copy(SPOUT_TIP_LOCAL).applyMatrix4(pot.matrixWorld);

          var steep = pourSteep;                 // 1 = clean, 0 = dribble
          for (var i = 0; i < count; i++) {
            if (parts.length >= MAX) break;
            if (potTea <= 0) break;
            potTea -= 1;                          // each drop drains the pot
            var p = { x: spoutWorld.x, y: spoutWorld.y, z: spoutWorld.z, vx: 0, vy: 0, vz: 0, life: 0 };
            if (steep > 0.42) {
              // clean stream: mostly falls straight down from the spout, so
              // the WIND is what carries it sideways (you must aim upwind).
              var s = (steep - 0.42) / 0.58;     // 0..1
              p.vx = 0.12 + s * 0.28 + rand(-0.08, 0.08);
              p.vy = 0.15 + s * 0.30 + rand(-0.06, 0.06);
              p.vz = rand(-0.06, 0.06);
            } else {
              // shallow pour: tea clings to the spout and dribbles straight
              // down the outside of the pot -> almost always a spill.
              p.x -= rand(0.1, 0.35);            // hug back toward the pot body
              p.vx = rand(-0.25, 0.05);
              p.vy = rand(-0.2, 0.05);
              p.vz = rand(-0.05, 0.05);
              p.dribble = true;
            }
            parts.push(p);
          }
        }

        var GRAV = 6.2;
        function step(dt) {
          var cfg = LEVELS[level - 1];
          // wind wanders toward a new target often, so the stream keeps getting
          // shoved around while you pour (stronger on higher levels).
          windTimer -= dt;
          if (windTimer <= 0) { windTarget = rand(-cfg.wind, cfg.wind); windTimer = rand(0.7, 1.8); }
          wind += (windTarget - wind) * Math.min(1, dt * 1.1);

          // teapot follows the aim; tilt when pouring (steep = more tilt)
          pot.position.x += (aimX - pot.position.x) * Math.min(1, dt * 8);
          var wantTilt = pouring ? (0.5 + pourSteep * 0.9) : 0.0;
          pot.rotation.z += ((-wantTilt) - pot.rotation.z) * Math.min(1, dt * 6);

          // pour?
          pouring = (spaceHeld || pourBtnHeld) && phase === "play" && potTea > 0;
          if (pouring) emit(dt);

          var teaTop = GLASS_BASE_Y + fillLevel * GLASS_H;
          var glassX = 0;   // glass is fixed at origin

          for (var i = parts.length - 1; i >= 0; i--) {
            var p = parts[i];
            // forces
            p.vy -= GRAV * dt;
            p.vx += wind * dt * (p.dribble ? 0.2 : 1.4);      // wind really pushes the stream
            if (!p.dribble) p.vx += (Math.random() - 0.5) * dt * 0.9;  // gusty scatter
            p.x += p.vx * dt * 3.0;
            p.y += p.vy * dt * 3.0;
            p.z += p.vz * dt * 3.0;
            p.life += dt;

            var dx = p.x - glassX, dz = p.z;
            var horiz = Math.sqrt(dx * dx + dz * dz);

            // captured: inside the cup opening and at/under the tea surface or rim
            if (horiz < GLASS_INNER && p.y <= Math.max(teaTop, GLASS_BASE_Y) + 0.05 && p.y < RIM_Y) {
              inGlass += 1;
              fillLevel = clamp(fillLevel + 0.0016, 0, 1);
              teaTop = GLASS_BASE_Y + fillLevel * GLASS_H;
              parts.splice(i, 1);
              continue;
            }
            // hit the table (missed the glass) -> spill
            if (p.y <= 0.08) {
              if (horiz < GLASS_INNER) { inGlass += 1; fillLevel = clamp(fillLevel + 0.0016, 0, 1); }
              else spilled += 1;
              parts.splice(i, 1);
              continue;
            }
            // safety: cull anything that flew off
            if (p.life > 6 || Math.abs(p.x) > 12 || Math.abs(p.z) > 12) parts.splice(i, 1);
          }

          // grow the tea mesh to match the fill level
          var targetScale = Math.max(0.0001, fillLevel * GLASS_H);
          tea.scale.y += (targetScale - tea.scale.y) * Math.min(1, dt * 8);
          tea.position.y = GLASS_BASE_Y + tea.scale.y / 2;

          // ---- level progression ----
          if (phase === "play") {
            if (fillLevel >= cfg.need) {
              total += inGlass;
              phase = (level >= LEVELS.length) ? "won" : "cleared";
            } else if (potTea <= 0 && parts.length === 0) {
              phase = "failed";     // ran dry before hitting the target
            }
          }
        }

        function syncPoints() {
          var n = parts.length;
          for (var i = 0; i < n; i++) {
            posArr[i * 3] = parts[i].x;
            posArr[i * 3 + 1] = parts[i].y;
            posArr[i * 3 + 2] = parts[i].z;
          }
          pgeo.setDrawRange(0, n);
          pgeo.attributes.position.needsUpdate = true;
          pgeo.computeBoundingSphere();
        }

        function syncGusts() {
          for (var i = 0; i < GUSTS; i++) {
            var g = gustData[i];
            g.x += wind * 0.06;
            if (g.x > 9) g.x = -9; else if (g.x < -9) g.x = 9;
            var a = i * 6;
            var len = g.len * (0.4 + Math.abs(wind) * 0.4);
            gustPos[a] = g.x;         gustPos[a + 1] = g.y; gustPos[a + 2] = g.z;
            gustPos[a + 3] = g.x - Math.sign(wind || 1) * len; gustPos[a + 4] = g.y; gustPos[a + 5] = g.z;
          }
          gustGeo.attributes.position.needsUpdate = true;
        }

        var hudTick = 0;
        function syncHUD() {
          if (++hudTick % 4 !== 0) return;
          var cfg = LEVELS[level - 1];
          elLevel.textContent = "Level " + level + " · need " + Math.round(cfg.need * 100) + "%";
          elScore.innerHTML = inGlass + ' <span style="font-size:12px;font-weight:600;color:#cdd6ff;">ml in glass</span>';
          elSpill.textContent = "spilled " + spilled + " ml";
          elFill.textContent = "glass " + Math.round(fillLevel * 100) + "% full";
          elPot.textContent = "pot: " + Math.max(0, Math.round(potTea)) + " ml left";
          var absW = Math.abs(wind);
          var arrow = wind >= 0 ? "→" : "←";
          if (absW < 0.4) { elWind.textContent = "•"; elWindV.textContent = "calm"; }
          else {
            elWind.textContent = (absW > 2 ? (arrow + arrow) : arrow);
            elWindV.textContent = (absW > 2 ? "strong " : "breezy ") + (wind >= 0 ? "east" : "west");
          }

          // banner reflects the current phase
          if (phase === "won") {
            elBanner.innerHTML = "🏆 All 3 levels cleared!<br><span style='font-size:14px;font-weight:600'>" +
              total + " ml poured in total · tap / press R to play again</span>";
            elBanner.style.display = "block";
          } else if (phase === "cleared") {
            elBanner.innerHTML = "✅ Level " + level + " cleared!<br><span style='font-size:14px;font-weight:600'>" +
              "tap / press Enter for Level " + (level + 1) + "</span>";
            elBanner.style.display = "block";
          } else if (phase === "failed") {
            elBanner.innerHTML = "❌ Only " + Math.round(fillLevel * 100) + "% — needed " +
              Math.round(cfg.need * 100) + "%<br><span style='font-size:14px;font-weight:600'>tap / press R to retry</span>";
            elBanner.style.display = "block";
          } else if (potTea <= 0) {
            elBanner.innerHTML = "🫖 Pot's empty…<br><span style='font-size:14px;font-weight:600'>land the last drops</span>";
            elBanner.style.display = "block";
          } else {
            elBanner.style.display = "none";
          }
        }

        /* ---------- resize ---------- */
        function resize() {
          var w = body.clientWidth || W;
          var h = body.clientHeight || H;
          if (w === W && h === H) return;
          W = w; H = h;
          camera.aspect = W / H;
          camera.updateProjectionMatrix();
          renderer.setSize(W, H);
        }

        /* ---------- loop ---------- */
        var raf = null;
        var last = performance.now();
        function loop(now) {
          if (!renderer.domElement.isConnected) { cleanup(); return; }
          raf = requestAnimationFrame(loop);
          var dt = Math.min(0.05, (now - last) / 1000);
          last = now;
          resize();
          step(dt);
          syncPoints();
          syncGusts();
          syncHUD();
          renderer.render(scene, camera);
        }
        raf = requestAnimationFrame(loop);

        /* ---------- cleanup ---------- */
        function cleanup() {
          if (raf) cancelAnimationFrame(raf);
          raf = null;
          el.removeEventListener("pointerdown", onDown);
          window.removeEventListener("pointermove", onMove);
          window.removeEventListener("pointerup", onUp);
          el.removeEventListener("keydown", onKey);
          el.removeEventListener("keyup", onKeyUp);
          scene.traverse(function (o) {
            if (o.geometry) o.geometry.dispose();
            if (o.material) {
              if (Array.isArray(o.material)) o.material.forEach(function (m) { m.dispose(); });
              else o.material.dispose();
            }
          });
          renderer.dispose();
        }
      },
    });
  },
};
