/* ============================================================
   NomuOS — "Hello Moon"
   A tiny 3D moon-exploration toy built on Three.js (WebGL).

   Drive a little hover-rover across a cratered moon and go
   sightseeing. Scattered around the surface are glowing
   beacons — cruise up to one and you'll "discover" something
   funny / cool / weird. Find them all!

   Controls (desktop):
     W / ↑ ............ thrust forward
     S / ↓ ............ reverse
     A / ← ............ steer left
     D / → ............ steer right
     Shift ........... boost
     R ............... respawn at base
     C ............... toggle camera distance

   No real physics degree required — it's a chill space cruise.
   ============================================================ */
window.NomuApps = window.NomuApps || {};
window.NomuApps.helloMoon = {
  id: "helloMoon",
  name: "Hello Moon",
  icon: "🌙",

  open: function () {
    NomuWM.open({
      key: "helloMoon",
      title: "Hello Moon",
      icon: "🌙",
      width: 820,
      height: 600,
      render: function (body, api) {
        body.style.padding = "0";
        body.style.overflow = "hidden";
        body.style.position = "relative";
        body.style.background = "#03040a";

        var THREE = window.THREE;
        if (!THREE) {
          body.innerHTML =
            '<div style="padding:24px;color:#eaf0ff;font:14px/1.6 Segoe UI,sans-serif">' +
            "<b>Hello Moon</b> needs the Three.js library, which didn't load.<br>" +
            "This app fetches the 3D engine from a CDN the first time, so it " +
            "needs an internet connection. Reconnect and reopen the app." +
            "</div>";
          return;
        }

        /* ================= sizing ================= */
        var W = body.clientWidth || 820;
        var H = body.clientHeight || 600;

        var renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
        renderer.setSize(W, H);
        renderer.domElement.style.display = "block";
        renderer.domElement.style.width = "100%";
        renderer.domElement.style.height = "100%";
        renderer.domElement.style.outline = "none";
        renderer.domElement.style.touchAction = "none";
        renderer.domElement.tabIndex = 0;
        body.appendChild(renderer.domElement);

        var scene = new THREE.Scene();
        // Space is (mostly) airless, so keep fog very light — just enough to
        // soften the far curved rim of the surface into the starfield.
        scene.fog = new THREE.FogExp2(0x05060f, 0.0006);

        var camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 2000);
        camera.position.set(0, 20, 40);

        /* ================= lights ================= */
        // Kept just bright enough that the far/night side of the globe stays
        // navigable as you drive around it (the headlight helps too), but
        // dimmer than before so craters actually carve out real shadow —
        // a flatly-lit moon is what read as "fake" in the first place.
        scene.add(new THREE.HemisphereLight(0x6b7a9a, 0x0a0a14, 0.45));
        var sun = new THREE.DirectionalLight(0xfff6e8, 1.35);
        sun.position.set(120, 90, 60);
        scene.add(sun);
        // subtle blue "earthshine" fill from the opposite side
        var earthShine = new THREE.DirectionalLight(0x4a6cff, 0.35);
        earthShine.position.set(-90, 40, -120);
        scene.add(earthShine);

        /* ================= galaxy sky + stars ================= */
        // A big inside-out sphere painted with a Milky-Way band + nebulae, so
        // when you zoom out and look around, the whole sky is full of stars.
        (function buildGalaxy() {
          var cv = document.createElement("canvas");
          cv.width = 2048; cv.height = 1024;
          var g = cv.getContext("2d");
          g.fillStyle = "#04050c"; g.fillRect(0, 0, 2048, 1024);

          // diffuse nebula clouds (blue / violet / teal)
          var nebColors = ["rgba(70,90,200,0.20)", "rgba(150,70,200,0.18)", "rgba(40,160,180,0.15)", "rgba(200,90,150,0.14)"];
          for (var n = 0; n < 40; n++) {
            var nx = Math.random() * 2048, ny = Math.random() * 1024;
            var nr = 120 + Math.random() * 320;
            var rad = g.createRadialGradient(nx, ny, 0, nx, ny, nr);
            var c = nebColors[(Math.random() * nebColors.length) | 0];
            rad.addColorStop(0, c); rad.addColorStop(1, "rgba(0,0,0,0)");
            g.fillStyle = rad; g.beginPath(); g.arc(nx, ny, nr, 0, Math.PI * 2); g.fill();
          }

          // the Milky-Way band — a brighter, denser diagonal river of light
          g.save();
          g.translate(1024, 512); g.rotate(-0.5); g.translate(-1024, -512);
          var band = g.createLinearGradient(0, 380, 0, 660);
          band.addColorStop(0, "rgba(0,0,0,0)");
          band.addColorStop(0.5, "rgba(180,190,230,0.16)");
          band.addColorStop(1, "rgba(0,0,0,0)");
          g.fillStyle = band; g.fillRect(-400, 380, 2848, 280);
          // dense little stars concentrated in the band
          for (var b = 0; b < 5000; b++) {
            var bx = Math.random() * 2848 - 400;
            var by = 380 + (Math.random() + Math.random()) * 140; // cluster to center
            var s = Math.random();
            g.fillStyle = "rgba(255,255,255," + (0.25 + s * 0.6) + ")";
            g.fillRect(bx, by, s < 0.9 ? 1 : 2, s < 0.9 ? 1 : 2);
          }
          g.restore();

          // scattered background stars everywhere, some tinted
          var tints = ["255,255,255", "200,215,255", "255,235,205", "255,205,205"];
          for (var i = 0; i < 4200; i++) {
            var x = Math.random() * 2048, y = Math.random() * 1024;
            var mag = Math.random();
            var sz = mag < 0.94 ? 1 : (mag < 0.99 ? 2 : 3);
            var t = tints[(Math.random() * tints.length) | 0];
            g.fillStyle = "rgba(" + t + "," + (0.35 + mag * 0.6) + ")";
            g.fillRect(x, y, sz, sz);
          }

          var tex = new THREE.CanvasTexture(cv);
          var sky = new THREE.Mesh(
            new THREE.SphereGeometry(1600, 48, 32),
            new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: false, depthWrite: false })
          );
          scene.add(sky);
        })();

        // A layer of real 3D star points for a little parallax twinkle up close.
        (function buildStars() {
          var count = 900;
          var geo = new THREE.BufferGeometry();
          var pos = new Float32Array(count * 3);
          for (var i = 0; i < count; i++) {
            var r = 500 + Math.random() * 700;
            var theta = Math.random() * Math.PI * 2;
            var phi = Math.acos(2 * Math.random() - 1);
            pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            pos[i * 3 + 1] = Math.abs(r * Math.cos(phi)) * 0.85 + 30;
            pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
          }
          geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
          var mat = new THREE.PointsMaterial({
            color: 0xffffff, size: 2.4, sizeAttenuation: true,
            transparent: true, opacity: 0.9, depthWrite: false, fog: false,
          });
          scene.add(new THREE.Points(geo, mat));
        })();

        /* ================= Earth in the sky ================= */
        (function buildEarth() {
          var cv = document.createElement("canvas");
          cv.width = cv.height = 256;
          var g = cv.getContext("2d");
          g.fillStyle = "#123a8a"; g.fillRect(0, 0, 256, 256); // ocean
          // toss some green "continents"
          g.fillStyle = "#2f8f4e";
          for (var i = 0; i < 26; i++) {
            var x = Math.random() * 256, y = Math.random() * 256;
            var rr = 12 + Math.random() * 30;
            g.beginPath(); g.arc(x, y, rr, 0, Math.PI * 2); g.fill();
          }
          // clouds
          g.fillStyle = "rgba(255,255,255,0.5)";
          for (var c = 0; c < 30; c++) {
            g.beginPath();
            g.arc(Math.random() * 256, Math.random() * 256, 6 + Math.random() * 16, 0, Math.PI * 2);
            g.fill();
          }
          var tex = new THREE.CanvasTexture(cv);
          var earth = new THREE.Mesh(
            new THREE.SphereGeometry(46, 32, 32),
            new THREE.MeshStandardMaterial({ map: tex, roughness: 1, metalness: 0, emissive: 0x0a1a3a, emissiveIntensity: 0.4 })
          );
          earth.position.set(-230, 170, -360);
          scene.add(earth);
          // faint atmosphere halo
          var halo = new THREE.Mesh(
            new THREE.SphereGeometry(52, 24, 24),
            new THREE.MeshBasicMaterial({ color: 0x6ea2ff, transparent: true, opacity: 0.14, side: THREE.BackSide })
          );
          halo.position.copy(earth.position);
          scene.add(halo);
        })();

        /* ================= moon (a whole sphere) ================= */
        // The moon is a real globe now — you can drive all the way around it:
        // over the top, under the bottom, around the back. Everything is defined
        // as a radial height offset from a base sphere of radius MOON_R, sampled
        // at a surface DIRECTION (a unit vector), not an (x,z) patch.
        var MOON_R = 120;

        // Craters live at a direction on the sphere with an angular radius.
        // They are baked into the geometry, so their bowls + raised rims are
        // real 3D shapes that self-shadow. The colour map below reads this
        // SAME list (by direction, not by flat canvas x/y) so the dark
        // crater floors and bright rims it paints line up exactly with the
        // bumps and shadows already in the mesh.
        var CRATERS = [];
        (function seedCraters() {
          var rng = 1337;
          function rand() { rng = (rng * 9301 + 49297) % 233280; return rng / 233280; }
          for (var i = 0; i < 90; i++) {
            // uniform random direction on the sphere
            var u = rand() * 2 - 1, th = rand() * Math.PI * 2, s = Math.sqrt(1 - u * u);
            CRATERS.push({
              dir: new THREE.Vector3(s * Math.cos(th), u, s * Math.sin(th)),
              angR: 0.03 + rand() * 0.10,   // angular radius (radians)
              depth: 1.5 + rand() * 3.0,
            });
          }
        })();
        // A few of the biggest craters read as young & "fresh" — real moons
        // show bright ray systems of ejecta splashed out from craters like
        // that (think Tycho). Pick the 3 largest and give each a deterministic
        // fan of irregular rays to paint into the colour map.
        var RAYED_CRATERS = CRATERS.slice().sort(function (a, b) { return b.angR - a.angR; }).slice(0, 3);
        RAYED_CRATERS.forEach(function (c, i) {
          var up0 = Math.abs(c.dir.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
          c.rayT1 = new THREE.Vector3().crossVectors(c.dir, up0).normalize();
          c.rayT2 = new THREE.Vector3().crossVectors(c.dir, c.rayT1).normalize();
          c.rayN = 9 + (i % 3) * 2;      // spoke count
          c.raySeed = i * 17.3 + 4;      // breaks up each ray fan differently
        });

        // Base terrain relief (gentle rolling ground, no craters) — shared by
        // the geometry height and the colour map's broad maria/highlands
        // shading so the two stay visually in sync. This is real irregular
        // fbm noise, not a product of two axis-aligned sine waves — a sine
        // grid wraps around a sphere as an unmistakable regular woven/
        // corduroy pattern once lit, which is exactly what read as "fake"
        // and not like an actual moon.
        function duneHeight(x, y, z) {
          var n = fbm3(x * 5.5, y * 5.5, z * 5.5, 4);   // ~0..1
          return (n - 0.5) * 3.6;
        }

        // Surface height
        // Used by the mesh, the rover and every POI so they all agree.
        function heightAt(dir) {
          var x = dir.x, y = dir.y, z = dir.z;
          var h = duneHeight(x, y, z);
          // craters: bowl + raised rim, by angular distance from each centre
          for (var i = 0; i < CRATERS.length; i++) {
            var c = CRATERS[i];
            var dot = x * c.dir.x + y * c.dir.y + z * c.dir.z;
            if (dot < 0.6) continue;                 // far away — skip the acos
            var ang = Math.acos(dot < 1 ? dot : 1);
            var nd = ang / c.angR;
            if (nd < 1) h += -c.depth * (1 - nd * nd);          // bowl
            var rim = (nd - 1) / 0.35;
            h += Math.exp(-rim * rim) * c.depth * 0.5;          // raised rim
          }
          return h;
        }

        /* ---- seamless 3D noise ----
           Sampled at the same unit DIRECTION used everywhere else, instead of
           flat canvas x/y. A flat 2D noise field always shows a visible stitch
           once it's wrapped around a globe (the old version did, right down
           the back of the moon); a continuous function of (x,y,z) never does. */
        function hash3(x, y, z) {
          var n = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
          return n - Math.floor(n);
        }
        function lerp3(a, b, t) { return a + (b - a) * t; }
        function vnoise3(x, y, z) {
          var xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
          var xf = x - xi, yf = y - yi, zf = z - zi;
          var u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
          var x00 = lerp3(hash3(xi, yi, zi), hash3(xi + 1, yi, zi), u);
          var x10 = lerp3(hash3(xi, yi + 1, zi), hash3(xi + 1, yi + 1, zi), u);
          var x01 = lerp3(hash3(xi, yi, zi + 1), hash3(xi + 1, yi, zi + 1), u);
          var x11 = lerp3(hash3(xi, yi + 1, zi + 1), hash3(xi + 1, yi + 1, zi + 1), u);
          return lerp3(lerp3(x00, x10, v), lerp3(x01, x11, v), w);
        }
        function fbm3(x, y, z, octaves) {
          var a = 0, amp = 0.5, f = 1;
          for (var o = 0; o < octaves; o++) { a += vnoise3(x * f, y * f, z * f) * amp; f *= 2; amp *= 0.5; }
          return a;
        }

        // Procedural regolith colour + bump map. Painted per DIRECTION (not
        // per flat pixel) so dark maria, bright highlands, crater floors,
        // crater rims and ray systems all line up with the real 3D geometry
        // and wrap around the whole globe with no seam. Real moon dust is a
        // genuinely dark, low-contrast surface (~12% albedo) — the old flat
        // pale-grey fill was a big part of why it didn't read as "the moon".
        function makeMoonSurface() {
          var S = 900;
          var cv = document.createElement("canvas");
          cv.width = cv.height = S;
          var g = cv.getContext("2d");
          var img = g.createImageData(S, S), d = img.data;

          for (var py = 0; py < S; py++) {
            var phi = (py / S) * Math.PI;              // 0 (north pole) .. π (south)
            var sinPhi = Math.sin(phi), cosPhi = Math.cos(phi);
            for (var px = 0; px < S; px++) {
              var theta = (px / S) * Math.PI * 2;       // matches THREE.SphereGeometry's own UV wrap
              var x = -Math.cos(theta) * sinPhi, y = cosPhi, z = Math.sin(theta) * sinPhi;

              // fine dusty grain + broad "continent" shading
              var fine = fbm3(x * 22, y * 22, z * 22, 4);
              var relief = duneHeight(x, y, z) / 1.8;              // same relief the mesh is built from, ~-1..1
              var val = 54 + fine * 42 + relief * 30;

              // craters baked from the SAME list heightAt() uses
              for (var i = 0; i < CRATERS.length; i++) {
                var c = CRATERS[i];
                var dot = x * c.dir.x + y * c.dir.y + z * c.dir.z;
                if (dot < 0.6) continue;
                var ang = Math.acos(dot < 1 ? dot : 1);
                var nd = ang / c.angR;
                if (nd < 1) val -= 30 * (1 - nd * nd);            // shadowed bowl
                var rim = (nd - 1) / 0.35;
                val += Math.exp(-rim * rim) * 34;                 // bright rim
              }

              // ray systems radiating out from the biggest, "freshest" craters
              for (var r = 0; r < RAYED_CRATERS.length; r++) {
                var rc = RAYED_CRATERS[r];
                var rdot = x * rc.dir.x + y * rc.dir.y + z * rc.dir.z;
                if (rdot < 0.3) continue;
                var rAng = Math.acos(rdot < 1 ? rdot : 1);
                var rNd = rAng / rc.angR;
                if (rNd < 1.3 || rNd > 8) continue;
                var vx = x - rc.dir.x * rdot, vy = y - rc.dir.y * rdot, vz = z - rc.dir.z * rdot;
                var bearing = Math.atan2(vx * rc.rayT2.x + vy * rc.rayT2.y + vz * rc.rayT2.z,
                                          vx * rc.rayT1.x + vy * rc.rayT1.y + vz * rc.rayT1.z);
                var spoke = bearing / (Math.PI * 2) * rc.rayN;
                var toSpoke = Math.abs(spoke - Math.round(spoke));
                if (toSpoke > 0.16) continue;
                var mottle = fbm3(x * 30 + rc.raySeed, y * 30 + rc.raySeed, z * 30, 2);
                var falloff = Math.exp(-rNd * 0.55) * (0.4 + mottle * 0.9);
                val += (1 - toSpoke / 0.16) * falloff * 46;
              }

              val = Math.max(-20, Math.min(255, val));
              val = 128 + (val - 128) * 1.12;                     // a touch more contrast
              val = Math.max(8, Math.min(238, val));

              // maria (low ground) read faintly cool/blue-grey, highlands
              // (high ground) faintly warm/tan — the same subtle colour
              // split real moon photos show
              var tint = relief * 0.5;
              var i4 = (py * S + px) * 4;
              d[i4] = Math.max(0, Math.min(255, val + tint * 9));
              d[i4 + 1] = Math.max(0, Math.min(255, val + tint * 3));
              d[i4 + 2] = Math.max(0, Math.min(255, val - tint * 10));
              d[i4 + 3] = 255;
            }
          }
          g.putImageData(img, 0, 0);

          var tex = new THREE.CanvasTexture(cv);
          tex.wrapS = THREE.RepeatWrapping;    // seamless all the way around
          tex.wrapT = THREE.ClampToEdgeWrapping;
          if (renderer.capabilities.getMaxAnisotropy) tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
          return tex;
        }

        (function buildMoon() {
          var geo = new THREE.SphereGeometry(MOON_R, 300, 150);
          var pos = geo.attributes.position;
          var v = new THREE.Vector3(), dir = new THREE.Vector3();
          for (var i = 0; i < pos.count; i++) {
            v.fromBufferAttribute(pos, i);
            dir.copy(v).normalize();
            v.copy(dir).multiplyScalar(MOON_R + heightAt(dir));
            pos.setXYZ(i, v.x, v.y, v.z);
          }
          geo.computeVertexNormals(); // real normals → craters self-shade
          var surf = makeMoonSurface();
          var mat = new THREE.MeshStandardMaterial({
            map: surf,
            bumpMap: surf,
            bumpScale: 0.7,
            roughness: 0.94,
            metalness: 0.0,
          });
          scene.add(new THREE.Mesh(geo, mat));
        })();

        /* ================= label sprite helper ================= */
        function makeLabel(emoji, name) {
          var cv = document.createElement("canvas");
          cv.width = 256; cv.height = 160;
          var g = cv.getContext("2d");
          g.clearRect(0, 0, 256, 160);
          g.textAlign = "center";
          g.font = "84px serif";
          g.fillText(emoji, 128, 92);
          g.font = "600 22px Segoe UI, sans-serif";
          g.fillStyle = "#eaf0ff";
          g.shadowColor = "rgba(0,0,0,0.8)"; g.shadowBlur = 6;
          g.fillText(name, 128, 138);
          var tex = new THREE.CanvasTexture(cv);
          var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
          sp.scale.set(16, 10, 1);
          return sp;
        }

        /* ================= points of interest ================= */
        // Each POI: emoji, short name (on the beacon), the funny blurb, and a
        // spot on the globe as {lat, lon} in degrees — scattered all over so
        // some are on top, some underneath, some around the back.
        var POI_DATA = [
          { type: "flag", emoji: "🇵🇭", name: "First Flag", text: "\"First to set foot here... some guy named Juan, they say. Beat the astronauts to it.\" — no proof, but we're proud anyway. 🇵🇭", color: 0x2f6bff, lat: 8, lon: 35 },
          { type: "alien", emoji: "👽", name: "Friendly Alien", text: "An alien out for a stroll: \"Psst. Don't tell NASA I'm here, okay? I owe you one.\" 👽", color: 0x39ff88, lat: 35, lon: 95 },
          { type: "cheese", emoji: "🧀", name: "Cheese Rock", text: "CONFIRMED: the moon really IS made of cheese!!! ...just kidding. It's just a rock. But it smells like cheese. 🧀", color: 0xffd23f, lat: -25, lon: 155 },
          { type: "lander", emoji: "🚀", name: "Old Module", text: "A lunar module left behind since 1969. There's a taped note: \"Who took my keys?!\" 🚀", color: 0xc0c6d4, lat: 60, lon: -110 },
          { type: "sign", emoji: "🪧", name: "HELLO Sign", text: "A giant signboard: \"HELLO MOON! 🌙 Thanks for visiting. Drive safe!\"", color: 0xff5da2, lat: -8, lon: -40 },
          { type: "cat", emoji: "🐱", name: "Astronaut Cat", text: "A cat in a space suit, fast asleep. Commander Whiskers, apparently. Don't wake him. 😴🐱", color: 0xffa24a, lat: -58, lon: 60 },
          { type: "store", emoji: "🏪", name: "Corner Store", text: "A little corner store on the moon! Closed. Sign reads: \"Open when there's a signal. Load up first.\" 🏪", color: 0x4ad6ff, lat: 20, lon: -155 },
          { type: "crystal", emoji: "💎", name: "Wishing Crystal", text: "A glittering crystal. It reads: \"Make a wish. But this runs on moon signal, so your wish might be delayed.\" 💎", color: 0xb26bff, lat: 48, lon: 20 },
          { type: "peek", emoji: "🕳️", name: "Deep Hole", text: "An incredibly deep hole... and a tiny creature keeps peeking out! \"HELLOOO?\" 🕳️👀", color: 0x8892a6, lat: -42, lon: -100 },
          { type: "flower", emoji: "🌷", name: "The Lone Plant", text: "A single flower growing on the moon. Impossible. But there it is, alive, swaying in wind that doesn't exist. 🌷", color: 0xff7ac0, lat: 15, lon: 178 },
        ];

        // lat/lon (degrees) → unit direction on the sphere
        function dirFromLatLon(lat, lon) {
          var la = lat * Math.PI / 180, lo = lon * Math.PI / 180;
          var cl = Math.cos(la);
          return new THREE.Vector3(cl * Math.cos(lo), Math.sin(la), cl * Math.sin(lo));
        }

        var pois = [];
        var poiGroup = new THREE.Group();
        scene.add(poiGroup);

        /* ---- small texture helpers for the models ---- */
        function makeFlagTexturePH() {
          var cv = document.createElement("canvas"); cv.width = 200; cv.height = 120;
          var g = cv.getContext("2d");
          g.fillStyle = "#0038a8"; g.fillRect(0, 0, 200, 60);
          g.fillStyle = "#ce1126"; g.fillRect(0, 60, 200, 60);
          g.fillStyle = "#fff"; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 120); g.lineTo(104, 60); g.closePath(); g.fill();
          g.fillStyle = "#fcd116"; g.beginPath(); g.arc(34, 60, 13, 0, Math.PI * 2); g.fill();
          g.beginPath();
          [[12, 12], [12, 108], [92, 60]].forEach(function (p) { g.moveTo(p[0] + 3, p[1]); g.arc(p[0], p[1], 3, 0, Math.PI * 2); });
          g.fill();
          return new THREE.CanvasTexture(cv);
        }
        function makeTextPanel(title, sub, bg, border) {
          var cv = document.createElement("canvas"); cv.width = 512; cv.height = 256;
          var g = cv.getContext("2d");
          g.fillStyle = bg; g.fillRect(0, 0, 512, 256);
          g.strokeStyle = border; g.lineWidth = 12; g.strokeRect(14, 14, 484, 228);
          g.fillStyle = "#f4f8ff"; g.textAlign = "center";
          g.font = "bold 66px Segoe UI, sans-serif"; g.fillText(title, 256, 108);
          g.font = "bold 52px Segoe UI, sans-serif"; g.fillText(sub, 256, 182);
          return new THREE.CanvasTexture(cv);
        }

        /* ---- a reusable little alien (used walking + peeking) ---- */
        function makeAlien(s) {
          var grp = new THREE.Group();
          var skin = new THREE.MeshStandardMaterial({ color: 0x6fe08a, roughness: 0.5, metalness: 0.05, emissive: 0x0c2a14, emissiveIntensity: 0.25 });
          var eyeMat = new THREE.MeshStandardMaterial({ color: 0x05060a, roughness: 0.15, metalness: 0.5 });
          var glow = new THREE.MeshStandardMaterial({ color: 0xffef7a, emissive: 0xffcf3a, emissiveIntensity: 0.8 });
          var torso = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.68, 1.3, 18), skin); torso.position.y = 1.25; grp.add(torso);
          var head = new THREE.Mesh(new THREE.SphereGeometry(0.8, 24, 18), skin); head.scale.set(1, 1.12, 0.95); head.position.y = 2.35; grp.add(head);
          [-0.3, 0.3].forEach(function (ex) {
            var eye = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 12), eyeMat);
            eye.scale.set(1, 1.5, 0.6); eye.position.set(ex, 2.4, 0.62); grp.add(eye);
          });
          [-0.2, 0.2].forEach(function (ax) {
            var st = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 6), skin); st.position.set(ax, 3.05, 0); grp.add(st);
            var kn = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), glow); kn.position.set(ax, 3.35, 0); grp.add(kn);
          });
          [-0.62, 0.62].forEach(function (sx) {
            var arm = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.09, 1.0, 10), skin);
            arm.position.set(sx, 1.5, 0); arm.rotation.z = sx > 0 ? 0.5 : -0.5; grp.add(arm);
          });
          var legs = [];
          [-0.24, 0.24].forEach(function (lx) {
            var lg = new THREE.CylinderGeometry(0.15, 0.13, 0.95, 12); lg.translate(0, -0.475, 0);
            var leg = new THREE.Mesh(lg, skin); leg.position.set(lx, 0.95, 0); grp.add(leg); legs.push(leg);
          });
          grp.scale.setScalar(s || 1);
          return { group: grp, legs: legs, head: head };
        }

        /* ---- the model factory: a real object per POI type ---- */
        function buildPoi(d) {
          var g = new THREE.Group();
          var col = new THREE.Color(d.color);
          var update = null, labelY = 6;
          function std(c, o) { return new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.85, metalness: 0.1 }, o || {})); }

          if (d.type === "flag") {
            g.add(mp(new THREE.CylinderGeometry(0.5, 0.7, 0.4, 16), std(0x9aa0ab, { metalness: 0.5 }), 0, 0.2, 0));
            g.add(mp(new THREE.CylinderGeometry(0.11, 0.13, 9, 16), std(0xcfd3da, { metalness: 0.7, roughness: 0.3 }), 0, 4.5, 0));
            var fgeo = new THREE.PlaneGeometry(4, 2.4, 14, 8);
            var flag = new THREE.Mesh(fgeo, new THREE.MeshStandardMaterial({ map: makeFlagTexturePH(), side: THREE.DoubleSide, roughness: 0.75 }));
            flag.position.set(2.0, 7.7, 0); g.add(flag);
            var fb = fgeo.attributes.position.array.slice(0);
            update = function (dt, t) {
              var p = fgeo.attributes.position;
              for (var i = 0; i < p.count; i++) { var x = fb[i * 3]; p.setZ(i, Math.sin(x * 1.6 + t * 4.5) * (0.12 + (x + 2) * 0.07)); }
              p.needsUpdate = true;
            };
            labelY = 10.6;

          } else if (d.type === "alien") {
            var a = makeAlien(1.0); g.add(a.group);
            var R = 9;
            update = function (dt, t) {
              var ang = t * 0.4;
              var lx = Math.cos(ang) * R, lz = Math.sin(ang) * R;
              a.group.position.set(lx, Math.abs(Math.sin(t * 7)) * 0.12, lz);
              a.group.rotation.y = Math.atan2(-Math.sin(ang), Math.cos(ang));
              a.legs[0].rotation.x = Math.sin(t * 7) * 0.6; a.legs[1].rotation.x = -Math.sin(t * 7) * 0.6;
            };
            labelY = 4.4;

          } else if (d.type === "cheese") {
            var cheese = std(0xffcf3f, { roughness: 0.6, emissive: 0x3a2a00, emissiveIntensity: 0.1 });
            var body = mp(new THREE.BoxGeometry(3.2, 2.0, 2.4), cheese, 0, 1.0, 0); body.rotation.y = 0.3; g.add(body);
            var holeMat = std(0xbf8f1e, { roughness: 0.8 });
            for (var i = 0; i < 12; i++) {
              var face = Math.random() > 0.5 ? 1 : -1;
              g.add(mp(new THREE.SphereGeometry(0.22 + Math.random() * 0.26, 12, 10), holeMat,
                (Math.random() * 2 - 1) * 1.3, 0.5 + Math.random() * 1.2, face * 1.18));
            }
            labelY = 3.8;

          } else if (d.type === "lander") {
            var gold = std(0xd8b24a, { metalness: 0.85, roughness: 0.35, emissive: 0x2a1e00, emissiveIntensity: 0.15 });
            var grey = std(0x8b8f98, { metalness: 0.6, roughness: 0.5 });
            g.add(mp(new THREE.CylinderGeometry(2.0, 2.2, 1.4, 8), gold, 0, 1.7, 0));
            g.add(mp(new THREE.BoxGeometry(2.2, 1.4, 2.2), gold, 0, 3.0, 0));
            g.add(mp(new THREE.CylinderGeometry(0.3, 0.7, 0.9, 12), grey, 0, 0.7, 0));
            g.add(mp(new THREE.CylinderGeometry(0.03, 0.03, 2.6, 6), grey, 0.8, 4.4, 0.8));
            [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(function (s) {
              var leg = mp(new THREE.CylinderGeometry(0.09, 0.09, 2.8, 8), grey, s[0] * 1.9, 1.1, s[1] * 1.9);
              leg.rotation.z = s[0] * 0.5; leg.rotation.x = -s[1] * 0.5; g.add(leg);
              g.add(mp(new THREE.CylinderGeometry(0.5, 0.5, 0.12, 12), grey, s[0] * 2.7, 0.06, s[1] * 2.7));
            });
            labelY = 6.4;

          } else if (d.type === "sign") {
            var postMat = std(0x8a6a45, { roughness: 0.8 });
            [-1.9, 1.9].forEach(function (px) { g.add(mp(new THREE.CylinderGeometry(0.15, 0.15, 4.6, 12), postMat, px, 2.3, 0)); });
            var board = mp(new THREE.BoxGeometry(5.4, 2.7, 0.25),
              new THREE.MeshStandardMaterial({ map: makeTextPanel("HELLO", "MOON 🌙", "#12243f", "#66d9ff"), roughness: 0.6, metalness: 0.1 }), 0, 4.1, 0);
            g.add(board);
            labelY = 6.4;

          } else if (d.type === "cat") {
            var fur = std(0x9aa0aa, { roughness: 0.9 });
            var body = mp(new THREE.SphereGeometry(1.1, 24, 18), fur, 0, 0.9, 0); body.scale.set(1.5, 0.9, 1.1); g.add(body);
            g.add(mp(new THREE.SphereGeometry(0.7, 20, 16), fur, 1.2, 1.1, 0));
            [-0.3, 0.3].forEach(function (ez) { g.add(mp(new THREE.ConeGeometry(0.25, 0.5, 5), fur, 1.25, 1.7, ez)); });
            var tail = mp(new THREE.TorusGeometry(0.6, 0.12, 8, 16, Math.PI), fur, -1.5, 1.0, 0); tail.rotation.z = 1.3; g.add(tail);
            g.add(mp(new THREE.SphereGeometry(0.95, 20, 16),
              new THREE.MeshStandardMaterial({ color: 0x9fd8ff, transparent: true, opacity: 0.32, roughness: 0.05, metalness: 0.3 }), 1.2, 1.1, 0));
            update = function (dt, t) { var s = 1 + Math.sin(t * 2) * 0.05; body.scale.set(1.5, 0.9 * s, 1.1); };
            labelY = 3.4;

          } else if (d.type === "store") {
            var wall = std(0x4fc0d8, { roughness: 0.6 }), wood = std(0xb5793e, { roughness: 0.8 });
            g.add(mp(new THREE.BoxGeometry(4, 3, 3), wall, 0, 1.5, 0));
            g.add(mp(new THREE.BoxGeometry(3, 1.4, 0.2), std(0x0e1c26), 0, 1.7, 1.51));
            g.add(mp(new THREE.BoxGeometry(4.2, 0.3, 0.9), wood, 0, 1.0, 1.75));
            var roof = mp(new THREE.BoxGeometry(4.7, 0.3, 3.7), std(0xff6f61), 0, 3.15, 0); roof.rotation.x = -0.12; g.add(roof);
            var sign = mp(new THREE.BoxGeometry(3.6, 0.95, 0.15),
              new THREE.MeshStandardMaterial({ map: makeTextPanel("CORNER", "STORE", "#c0392b", "#ffd23f"), roughness: 0.6 }), 0, 3.7, 1.35);
            sign.rotation.x = -0.12; g.add(sign);
            labelY = 5.6;

          } else if (d.type === "crystal") {
            var cmat = new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.5, roughness: 0.15, metalness: 0.2, transparent: true, opacity: 0.85, flatShading: true });
            var cg = new THREE.Group(); g.add(cg);
            [[0, 0, 3.4, 0.9], [0.9, 0.3, 2.3, 0.6], [-0.8, 0.2, 2.7, 0.7], [0.4, -0.7, 1.9, 0.5]].forEach(function (s) {
              var oc = new THREE.Mesh(new THREE.OctahedronGeometry(s[3], 0), cmat);
              oc.scale.y = s[2] / s[3]; oc.position.set(s[0], s[2] * 0.5, s[1]); oc.rotation.y = Math.random() * 3; cg.add(oc);
            });
            update = function (dt, t) { cmat.emissiveIntensity = 0.5 + Math.sin(t * 2) * 0.3; cg.rotation.y = t * 0.35; };
            labelY = 5.2;

          } else if (d.type === "peek") {
            var rimMat = std(0x6f7178, { roughness: 0.95 });
            var rim = mp(new THREE.TorusGeometry(3.4, 1.1, 14, 36), rimMat, 0, 0.5, 0); rim.rotation.x = Math.PI / 2; g.add(rim);
            g.add(mp(new THREE.CircleGeometry(3.0, 36), std(0x070609, { roughness: 1, metalness: 0 }), 0, 0.28, 0).rotateX(-Math.PI / 2));
            var crit = makeAlien(0.55); crit.group.position.y = -1.6; g.add(crit.group);
            update = function (dt, t) {
              var cyc = (t % 5) / 5;
              if (cyc < 0.6) {
                crit.group.visible = true;
                crit.group.position.y = -1.6 + Math.sin(cyc / 0.6 * Math.PI) * 2.4;
                crit.group.rotation.y = Math.sin(t * 3) * 0.7;
              } else { crit.group.visible = false; }
            };
            labelY = 5.6;

          } else if (d.type === "flower") {
            var pivot = new THREE.Group(); g.add(pivot);
            pivot.add(mp(new THREE.CylinderGeometry(0.08, 0.13, 3, 8), std(0x3fae5a, { roughness: 0.7 }), 0, 1.5, 0));
            [-1, 1].forEach(function (sd) { var lf = mp(new THREE.SphereGeometry(0.4, 10, 8), std(0x4fbf66), sd * 0.4, 1.3, 0); lf.scale.set(1, 0.3, 0.6); pivot.add(lf); });
            pivot.add(mp(new THREE.SphereGeometry(0.35, 16, 12), std(0xffd23f, { emissive: 0x5a4200, emissiveIntensity: 0.3 }), 0, 3.1, 0));
            var petalMat = std(col.getHex(), { emissive: col.getHex(), emissiveIntensity: 0.18, roughness: 0.5 });
            for (var pi = 0; pi < 7; pi++) {
              var ang2 = pi / 7 * Math.PI * 2;
              var petal = mp(new THREE.SphereGeometry(0.32, 12, 10), petalMat, Math.cos(ang2) * 0.55, 3.1, Math.sin(ang2) * 0.55);
              petal.scale.set(0.55, 0.2, 1.0); petal.lookAt(Math.cos(ang2) * 3, 3.1, Math.sin(ang2) * 3); pivot.add(petal);
            }
            update = function (dt, t) { pivot.rotation.z = Math.sin(t * 1.5) * 0.13; pivot.rotation.x = Math.cos(t * 1.2) * 0.08; };
            labelY = 5.0;
          }

          var label = makeLabel(d.emoji, d.name);
          label.position.y = labelY; g.add(label);
          g.userData.update = update;
          return g;

          // helper: build a mesh at a position in one line
          function mp(geo, mat, x, y, z) { var m = new THREE.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0); return m; }
        }

        POI_DATA.forEach(function (d) {
          var dir = dirFromLatLon(d.lat, d.lon);
          d.dir = dir;
          var grp = buildPoi(d);
          grp.position.copy(dir).multiplyScalar(MOON_R + heightAt(dir));
          // stand the model up along the local surface normal (radial "up")
          grp.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
          poiGroup.add(grp);
          pois.push({
            data: d, mesh: grp, dir: dir,
            worldPos: grp.position.clone(),
            found: false, foundT: -99, update: grp.userData.update,
          });
        });

        /* ================= hover rover ================= */
        var rover = new THREE.Group();
        var chassis = new THREE.Group(); // gets bob / bank / pitch
        rover.add(chassis);
        scene.add(rover);

        (function buildRover() {
          var bodyMat = new THREE.MeshStandardMaterial({ color: 0xe6ecf6, roughness: 0.3, metalness: 0.85 });
          var accentMat = new THREE.MeshStandardMaterial({ color: 0xff5da2, roughness: 0.35, metalness: 0.6 });
          var glassMat = new THREE.MeshStandardMaterial({ color: 0x8fd0ff, roughness: 0.06, metalness: 0.3, transparent: true, opacity: 0.6, emissive: 0x123a5a, emissiveIntensity: 0.45 });

          var hull = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.4, 6.4, 2, 2, 3), bodyMat);
          hull.position.y = 1.6;
          chassis.add(hull);

          // tapered nose (front = +Z) — smooth cone
          var nose = new THREE.Mesh(new THREE.ConeGeometry(1.7, 2.6, 28), bodyMat);
          nose.rotation.x = Math.PI / 2;
          nose.position.set(0, 1.6, 3.9);
          chassis.add(nose);

          // cockpit bubble
          var dome = new THREE.Mesh(new THREE.SphereGeometry(1.5, 32, 24, 0, Math.PI * 2, 0, Math.PI / 2), glassMat);
          dome.position.set(0, 2.3, 0.6);
          chassis.add(dome);

          // rear fin
          var fin = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.6, 1.4), accentMat);
          fin.position.set(0, 2.6, -3);
          chassis.add(fin);

          // four hover pods with glowing underside
          var podMat = bodyMat;
          var glowMat = new THREE.MeshBasicMaterial({ color: 0x66d9ff, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
          [[-2.4, 2.4], [2.4, 2.4], [-2.4, -2.4], [2.4, -2.4]].forEach(function (p) {
            var pod = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 1.0, 28), podMat);
            pod.position.set(p[0], 1.0, p[1]);
            chassis.add(pod);
            var glow = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.4, 0.4, 28), glowMat);
            glow.position.set(p[0], 0.35, p[1]);
            chassis.add(glow);
          });

          // soft glowing ring under the rover (the "hover" cushion)
          var ring = new THREE.Mesh(
            new THREE.RingGeometry(2.6, 4.2, 48),
            new THREE.MeshBasicMaterial({ color: 0x66d9ff, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending })
          );
          ring.rotation.x = -Math.PI / 2;
          ring.position.y = 0.2;
          chassis.add(ring);
          chassis.userData.ring = ring;

          // a headlight so you can see where you're going
          var head = new THREE.SpotLight(0xfff2d6, 1.2, 90, Math.PI / 5, 0.4, 1.2);
          head.position.set(0, 3, 2);
          head.target.position.set(0, 0, 20);
          chassis.add(head);
          chassis.add(head.target);
        })();

        // rover state on the sphere: a position direction + a forward tangent.
        // `pos` is the unit direction of the rover on the globe; `fwd` is the
        // unit tangent it's driving toward; `up` is just pos (the surface normal).
        var START_POS = new THREE.Vector3(1, 0, 0);            // equator, front
        var START_FWD = new THREE.Vector3(0, 0, 1);            // heading east
        var rov = {
          pos: START_POS.clone(),
          fwd: START_FWD.clone(),
          speed: 0,
        };

        var camDist = 26, camHeight = 14;
        var camModes = [[26, 14], [46, 26], [16, 9]];
        var camModeIdx = 0;
        var zoom = 1;              // multiplied on top of the preset (scroll wheel)
        var ZOOM_MIN = 0.5, ZOOM_MAX = 12; // zoom way out to see the whole globe

        /* ================= input ================= */
        var keys = {};
        function onKey(e) {
          var k = e.key.toLowerCase();
          keys[k] = true;
          if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].indexOf(k) !== -1) e.preventDefault();
          if (k === "r") respawn();
          if (k === "c") {
            camModeIdx = (camModeIdx + 1) % camModes.length;
            camDist = camModes[camModeIdx][0];
            camHeight = camModes[camModeIdx][1];
          }
        }
        function onKeyUp(e) { keys[e.key.toLowerCase()] = false; }
        function onWheel(e) {
          e.preventDefault();
          // scroll up = zoom in, scroll down = zoom out
          zoom *= Math.exp(e.deltaY * 0.0012);
          zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoom));
        }
        renderer.domElement.addEventListener("keydown", onKey);
        renderer.domElement.addEventListener("keyup", onKeyUp);
        renderer.domElement.addEventListener("wheel", onWheel, { passive: false });
        renderer.domElement.addEventListener("mousedown", function () { renderer.domElement.focus(); });
        setTimeout(function () { renderer.domElement.focus(); }, 60);

        function respawn() {
          rov.pos.copy(START_POS); rov.fwd.copy(START_FWD); rov.speed = 0;
        }

        /* ================= HUD overlay ================= */
        var hud = document.createElement("div");
        hud.style.cssText =
          "position:absolute;inset:0;pointer-events:none;color:#eaf0ff;" +
          "font:13px/1.5 'Segoe UI',sans-serif;text-shadow:0 1px 3px rgba(0,0,0,.7);z-index:5;";
        hud.innerHTML =
          '<div style="position:absolute;top:12px;left:14px;background:rgba(10,14,26,.55);' +
            'border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:10px 14px;backdrop-filter:blur(4px)">' +
            '<div style="font-weight:700;font-size:15px;letter-spacing:.3px">🌙 Hello Moon</div>' +
            '<div id="hm-count" style="margin-top:2px;opacity:.9"></div>' +
          '</div>' +
          '<div style="position:absolute;top:12px;right:14px;background:rgba(10,14,26,.55);' +
            'border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:10px 14px;text-align:right;backdrop-filter:blur(4px)">' +
            '<div><b>W A S D</b> / arrows — drive</div>' +
            '<div><b>Shift</b> boost · <b>R</b> respawn · <b>C</b> camera</div>' +
            '<div><b>Scroll</b> — zoom in / out (orbit the whole moon 🌙)</div>' +
          '</div>' +
          '<div id="hm-toast" style="position:absolute;left:50%;top:22px;transform:translateX(-50%);' +
            'background:rgba(10,14,26,.7);border:1px solid rgba(255,255,255,.15);border-radius:20px;' +
            'padding:6px 16px;opacity:0;transition:opacity .35s;font-weight:600"></div>' +
          '<div id="hm-pop" style="position:absolute;left:50%;bottom:0;transform:translate(-50%,20px);' +
            'width:min(560px,86%);background:rgba(12,16,30,.92);border:1px solid rgba(255,255,255,.16);' +
            'border-radius:18px 18px 0 0;padding:16px 20px 18px;opacity:0;transition:all .4s;' +
            'box-shadow:0 -8px 40px rgba(0,0,0,.5);pointer-events:auto;cursor:pointer">' +
            '<div id="hm-pop-title" style="font-size:17px;font-weight:800;margin-bottom:6px"></div>' +
            '<div id="hm-pop-text" style="font-size:14px;line-height:1.55;opacity:.95"></div>' +
            '<div style="margin-top:10px;font-size:11px;opacity:.55">click to close</div>' +
          '</div>';
        body.appendChild(hud);

        var countEl = hud.querySelector("#hm-count");
        var toastEl = hud.querySelector("#hm-toast");
        var popEl = hud.querySelector("#hm-pop");
        var popTitle = hud.querySelector("#hm-pop-title");
        var popText = hud.querySelector("#hm-pop-text");
        var found = 0;
        var popTimer = null;

        function updateCount() {
          countEl.textContent = "Discovered: " + found + " / " + pois.length +
            (found >= pois.length ? "  🎉 Complete!" : "");
        }
        updateCount();

        function showToast(msg) {
          toastEl.textContent = msg;
          toastEl.style.opacity = "1";
          clearTimeout(toastEl._t);
          toastEl._t = setTimeout(function () { toastEl.style.opacity = "0"; }, 1800);
        }

        function showPopup(d) {
          popTitle.textContent = d.emoji + "  " + d.name;
          popText.textContent = d.text;
          popEl.style.opacity = "1";
          popEl.style.transform = "translate(-50%,0)";
          clearTimeout(popTimer);
          popTimer = setTimeout(hidePopup, 7000);
        }
        function hidePopup() {
          popEl.style.opacity = "0";
          popEl.style.transform = "translate(-50%,20px)";
        }
        popEl.addEventListener("click", hidePopup);

        /* ================= main loop ================= */
        var clock = new THREE.Clock();
        var raf = null;

        function resize() {
          var w = body.clientWidth || W, h = body.clientHeight || H;
          if (w === W && h === H) return;
          W = w; H = h;
          camera.aspect = W / H;
          camera.updateProjectionMatrix();
          renderer.setSize(W, H);
        }

        // reusable temp math objects (avoid per-frame allocation)
        var _tmpQuat = new THREE.Quaternion();
        var _tmpMat = new THREE.Matrix4();
        var _tmpRight = new THREE.Vector3();
        var _tmpBase = new THREE.Vector3();
        var _tmpCam = new THREE.Vector3();
        var _tmpLook = new THREE.Vector3();

        // prime the camera behind/above the start so frame 1 isn't inside the moon
        (function primeCamera() {
          var up = START_POS.clone();
          var base = up.clone().multiplyScalar(MOON_R + heightAt(up));
          camera.position.copy(base)
            .addScaledVector(START_FWD, -camDist)
            .addScaledVector(up, camHeight);
          camera.up.copy(up);
          camera.lookAt(base);
        })();

        function step(dt, t) {
          // ---- drive (on the surface of the sphere) ----
          var boost = keys["shift"] ? 1.7 : 1;
          var accel = 46 * boost;
          var maxSpeed = 42 * boost;
          var turn = 0;
          if (keys["a"] || keys["arrowleft"]) turn += 1;
          if (keys["d"] || keys["arrowright"]) turn -= 1;

          var thrust = 0;
          if (keys["w"] || keys["arrowup"]) thrust += 1;
          if (keys["s"] || keys["arrowdown"]) thrust -= 1;
          rov.speed += thrust * accel * dt;
          rov.speed *= (1 - Math.min(1, 1.6 * dt)); // drag
          rov.speed = Math.max(-maxSpeed * 0.5, Math.min(maxSpeed, rov.speed));

          var up = rov.pos;                 // surface normal = position direction
          var q = _tmpQuat;

          // steering: spin the forward tangent around the local up
          if (turn) {
            var turnRate = 1.4 + Math.min(1, Math.abs(rov.speed) / 20) * 1.2;
            q.setFromAxisAngle(up, turn * turnRate * dt);
            rov.fwd.applyQuaternion(q);
          }
          // keep fwd tangent to the sphere
          rov.fwd.addScaledVector(up, -rov.fwd.dot(up)).normalize();

          // move forward: rotate position (and fwd) around the "right" axis so
          // we glide along a great circle — this is what lets you go all the
          // way around the moon: over the top, under, around the back.
          var right = _tmpRight.crossVectors(up, rov.fwd).normalize();
          var moveAng = rov.speed * dt / MOON_R;
          q.setFromAxisAngle(right, moveAng);
          rov.pos.applyQuaternion(q).normalize();
          rov.fwd.applyQuaternion(q);
          rov.fwd.addScaledVector(rov.pos, -rov.fwd.dot(rov.pos)).normalize();

          // ---- ride the surface ----
          up = rov.pos;
          var groundH = heightAt(up);
          var base = _tmpBase.copy(up).multiplyScalar(MOON_R + groundH);
          rover.position.copy(base);
          // orient the rover: local +Y → surface up, local +Z → forward
          right.crossVectors(up, rov.fwd).normalize();
          _tmpMat.makeBasis(right, up, rov.fwd);
          rover.quaternion.setFromRotationMatrix(_tmpMat);

          // bob + bank + pitch for flavour (in the rover's local frame)
          var bob = Math.sin(t * 3) * 0.25;
          chassis.position.y = 3.2 + bob;
          var targetBank = -turn * 0.28;
          chassis.rotation.z += (targetBank - chassis.rotation.z) * Math.min(1, 6 * dt);
          var targetPitch = -thrust * 0.12;
          chassis.rotation.x += (targetPitch - chassis.rotation.x) * Math.min(1, 6 * dt);
          if (chassis.userData.ring) {
            var s = 1 + Math.sin(t * 6) * 0.06;
            chassis.userData.ring.scale.set(s, s, s);
          }

          // ---- camera follow (behind + above, aligned to local up) ----
          var effDist = camDist * zoom;
          var effHeight = camHeight * Math.pow(zoom, 1.15);
          var camTarget = _tmpCam
            .copy(base)
            .addScaledVector(rov.fwd, -effDist)
            .addScaledVector(up, effHeight);
          camera.position.lerp(camTarget, Math.min(1, 4 * dt));
          camera.up.copy(up);
          _tmpLook.copy(base).addScaledVector(up, 3);
          camera.lookAt(_tmpLook);

          // ---- POIs: animate + discovery check ----
          for (var i = 0; i < pois.length; i++) {
            var p = pois[i];
            if (p.update) p.update(dt, t);
            if (p.found) {
              var e = t - p.foundT;
              p.mesh.scale.setScalar(e < 0.6 ? 1 + Math.sin(e / 0.6 * Math.PI) * 0.18 : 1);
            } else {
              if (base.distanceTo(p.worldPos) < 16) {
                p.found = true;
                p.foundT = t;
                found++;
                updateCount();
                showPopup(p.data);
                showToast(found >= pois.length
                  ? "🎉 You found them all! Thanks for visiting the moon."
                  : "✨ Discovered: " + p.data.name);
              }
            }
          }
        }

        // minimap (2D canvas overlay, bottom-right)
        var mm = document.createElement("canvas");
        mm.width = mm.height = 150;
        mm.style.cssText =
          "position:absolute;right:14px;bottom:14px;width:150px;height:150px;" +
          "border-radius:50%;border:1px solid rgba(255,255,255,.2);" +
          "background:rgba(8,10,20,.55);z-index:5;pointer-events:none;";
        body.appendChild(mm);
        var mmx = mm.getContext("2d");
        function drawMinimap() {
          // Radar: rover always at centre, forward = up on the dial. Every POI
          // on the whole globe is shown by its bearing (angle) and great-circle
          // distance (radius) — including ones behind, above or below you.
          var R = 75;
          mmx.clearRect(0, 0, 150, 150);

          var up = rov.pos;
          var right = _tmpRight.crossVectors(up, rov.fwd).normalize();
          var tmp = _tmpBase; // reuse scratch vector

          for (var i = 0; i < pois.length; i++) {
            var p = pois[i];
            var dot = Math.max(-1, Math.min(1, up.dot(p.dir)));
            var gcAng = Math.acos(dot);            // 0..π great-circle distance
            // direction to the POI projected into the local tangent plane
            tmp.copy(p.dir).addScaledVector(up, -dot);
            var f = tmp.dot(rov.fwd), s2 = tmp.dot(right);
            var bearing = Math.atan2(s2, f);       // 0 = straight ahead
            var rr = (gcAng / Math.PI) * (R - 8);  // near = centre, far side = rim
            var px = R + Math.sin(bearing) * rr;
            var py = R - Math.cos(bearing) * rr;   // forward points up
            mmx.beginPath();
            mmx.arc(px, py, p.found ? 2.5 : 3.5, 0, Math.PI * 2);
            mmx.fillStyle = p.found ? "rgba(120,255,160,.9)" : "#ffd23f";
            mmx.fill();
          }

          // rover marker at centre, always pointing "up" (forward)
          mmx.save();
          mmx.translate(R, R);
          mmx.beginPath();
          mmx.moveTo(0, -6); mmx.lineTo(4, 5); mmx.lineTo(-4, 5); mmx.closePath();
          mmx.fillStyle = "#66d9ff"; mmx.fill();
          mmx.restore();
        }

        function loop() {
          if (!renderer.domElement.isConnected) { cleanup(); return; }
          raf = requestAnimationFrame(loop);
          var dt = Math.min(0.05, clock.getDelta());
          var t = clock.elapsedTime;
          resize();
          step(dt, t);
          drawMinimap();
          renderer.render(scene, camera);
        }
        raf = requestAnimationFrame(loop);

        /* ================= cleanup ================= */
        function cleanup() {
          if (raf) cancelAnimationFrame(raf);
          raf = null;
          renderer.domElement.removeEventListener("keydown", onKey);
          renderer.domElement.removeEventListener("keyup", onKeyUp);
          renderer.domElement.removeEventListener("wheel", onWheel);
          clearTimeout(popTimer);
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
