/* ============================================================
   NomuOS — "wer r u?"
   A Google-Maps-LOOKALIKE joke app. There is NO real map API:
   the whole city (roads, blocks, parks, a river) is drawn on a
   canvas from a fixed seed. You type a name in the search box and
   it suggests funny Taglish "locations" (memes). Pick one and it
   drops a pin, flies the camera there, and shows an info card with
   the gag address + gag directions/ETA.
   ============================================================ */
window.NomuApps = window.NomuApps || {};
window.NomuApps.werRU = {
  id: "werRU",
  name: "wer r u?",
  icon: "📍",

  open: function () {
    NomuWM.open({
      key: "werRU",
      title: "wer r u?",
      icon: "📍",
      width: 820,
      height: 600,
      render: function (body, api) {
        body.style.padding = "0";
        body.style.overflow = "hidden";
        body.style.position = "relative";
        body.style.background = "#eef1ee";

        /* ---------- funny "locations" (Taglish / hugot memes) ---------- */
        var POOL = [
          { e: "☕", t: "sa CR ng Starbucks 6750, Makati" },
          { e: "💔", t: "friendzone, Brgy. Malamig" },
          { e: "👻", t: "nasa likod mo — wag kang lilingon" },
          { e: "📵", t: "seen 8:00PM, hindi pa nagrereply" },
          { e: "💸", t: "Utang na Loob Ave., di pa nagbabayad" },
          { e: "🫠", t: "nasa puso mo pero ayaw mo aminin" },
          { e: "🚧", t: "traffic sa EDSA, aabutin ka ng gabi" },
          { e: "💍", t: "sa kabilang linya — engaged na, sorry" },
          { e: "🏋️", t: "nasa gym, di ka pa rin papansinin" },
          { e: "🌊", t: "Dolomite Beach, kunwaring buhangin" },
          { e: "🧾", t: "tindahan ni Aling Nena, may utang ka pa" },
          { e: "📚", t: "nasa Wattpad, fictional character lang" },
          { e: "🚇", t: "sa dulo ng pila sa MRT, 2 oras na" },
          { e: "🧊", t: "block list, Brgy. Ghosted" },
          { e: "🛰️", t: "kabilang timezone, mahirap i-schedule" },
          { e: "🅿️", t: "sa parking, naghihintay ng wala" },
          { e: "☁️", t: "cloud 9 — pero di ka kasama" },
          { e: "🍢", t: "sa longganisa stand ni Tita, chika muna" },
          { e: "🎥", t: "sa alaala na lang, replay nang replay" },
          { e: "🧍", t: "tabi ng crush mo, ikaw wala" },
          { e: "📶", t: "nasa 'delivered', hindi 'read'" },
          { e: "🛵", t: "on the way daw — 45 mins na, wala pa" },
          { e: "🏝️", t: "sarili niyang mundo, di ka imbitado" },
          { e: "🕳️", t: "nasa red flag district, tumakbo ka na" },
          { e: "🧋", t: "milktea shop, third wheel ka lang" },
          { e: "📮", t: "sa DM mo, request folder — di nabasa" },
          { e: "🚪", t: "exit na, 'wag mo nang habulin" },
          { e: "🛌", t: "nasa kama, online pero 'busy'" },
          { e: "🍜", t: "sa Jollibee, nag-aabang ng Chickenjoy solo" },
          { e: "🧎", t: "sa simbahan, dinadasal na sana ikaw na" },
          { e: "🎣", t: "sa Seenzone Lake, tahimik lang" },
          { e: "🪤", t: "sa mixed signals, di mo alam kung oo o hindi" },
          { e: "🏦", t: "bangko ng feelings — insufficient balance" },
          { e: "🧭", t: "lost sa sariling plano, walang direksyon" },
          { e: "🛒", t: "sa abandoned cart, parang tayo" },
          { e: "🎢", t: "emotional rollercoaster, hinay-hinay lang" },
          { e: "🚏", t: "waiting shed ng 'balik tayo', di dumarating" },
          { e: "🧨", t: "sa last message, na-leave on read" },
          { e: "📉", t: "stocks ng relasyon, palugi ka na" },
          { e: "🛗", t: "elevator ng pag-asa, stuck between floors" },
          { e: "🧃", t: "sa juice ng chismis, sariwang tsaa" },
          { e: "🪞", t: "harap ng salamin, kausap ang sarili" },
          { e: "🛎️", t: "reception ng 'sana all', fully booked" },
          { e: "🧦", t: "ilalim ng kama, kasama ang kabila ng medyas" },
          { e: "🎯", t: "bullseye ng bad decisions, tama lagi" },
          { e: "🧺", t: "labahan ng luma nating usapan" },
          { e: "🕰️", t: "sa 'kahapon lang tayo', di na maibabalik" },
          { e: "🏚️", t: "sa abandoned na Plan B" },
          { e: "🧱", t: "likod ng pader na ginawa niya" },
          { e: "🪫", t: "low bat na energy sa'yo, 1% na lang" },
          { e: "🧀", t: "mousetrap ng 'pwede pa ba tayo'" },
          { e: "🎈", t: "lumutang na feelings, pinakawalan na" },
          { e: "🚿", t: "sa banyo, kumakanta ng hugot" },
          { e: "🪁", t: "hinatid ng hangin papunta sa iba" },
          { e: "🛑", t: "stop sign ng 'itutuloy pa ba'" },
          { e: "🗺️", t: "nasa 'somewhere', GPS: nawawala" },
          { e: "🎪", t: "karnabal ng mga palusot" },
          { e: "📦", t: "balikbayan box ng dating pangako" },
          { e: "🧗", t: "umaakyat pa rin ng expectations mo" },
          { e: "🪜", t: "hagdan ng 'paakyat pa lang'" },
          { e: "🎬", t: "blooper reel ng buhay natin" },
          { e: "🧾", t: "resibo ng lahat ng ginawa ko — di binasa" },
          { e: "🍧", t: "halo-halo ng emosyon, magulo" },
          { e: "🛩️", t: "business class ng iba, economy tayo" },
          { e: "🪷", t: "lotus pose, nagta-try mag-move on" },
          { e: "🧊", t: "iced coffee mo — natunaw na parang tayo" },
          { e: "🛠️", t: "repair shop ng broken promises" },
          { e: "🎤", t: "sa videoke, kinakanta ang 'Kailangan Kita'" },
          { e: "🧳", t: "nakabalot na, aalis na sa'yo" },
          { e: "🪙", t: "wishing well, sana bumalik ka" },
          { e: "🚢", t: "sumakay papuntang Move-On Island" },
          { e: "🧻", t: "sa CR, naubusan ng dahilan" },
          { e: "🎡", t: "ferris wheel ng 'paikot-ikot lang tayo'" },
          { e: "🪃", t: "boomerang — babalik daw, di pa rin" },
          { e: "🍳", t: "sa kusina, iniluluto ang gantihan" },
          { e: "🚴", t: "pedal palayo, di lilingon" },
          { e: "🧩", t: "puzzle ng 'ano ba tayo', kulang ang piece" },
          { e: "🎓", t: "graduate na sa Umasa Academy" },
          { e: "🪧", t: "may placard: 'wala nang chance'" },
          { e: "🚦", t: "red light ng 'wag muna'" },
          { e: "🏃", t: "fun run ng paglayo sa'yo, 1st placer" },
          { e: "📴", t: "airplane mode ng puso niya, walang signal" },
          { e: "🛟", t: "lifebuoy ng 'kaya mo pa 'yan, bestie'" },
          { e: "🍚", t: "sa kanin ng 'palamig muna natin'" },
          { e: "🧯", t: "friendzone fire exit — walang labasan" },
          { e: "🕯️", t: "sa vigil ng namatay nating usapan" },
          { e: "🛞", t: "spare tire — tinatawag lang kapag emergency" },
          { e: "🧊", t: "sa freezer ng 'malamig na ang tanggapan'" },
          { e: "🎠", t: "carousel ng paulit-ulit na paumanhin" },
          { e: "🪺", t: "empty nest ng inabandunang plano" },
          { e: "🛌", t: "power nap na naging 3-araw na hibernation" },
          { e: "🧫", t: "lab ng ' te-test ko lang kung may pag-asa'" },
          { e: "🚧", t: "under construction pa rin ang closure natin" },
          { e: "🪟", t: "sa bintana, tinitignan ang wala" },
          { e: "🧢", t: "sa 'cap' — puro ka arte, walang totoo" },
          { e: "🛒", t: "check-out counter ng 'bili na kita ng oras'" },
          { e: "🎧", t: "naka-headphones, di marinig ang paghingi mo ng atensyon" },
          { e: "🪫", t: "sa charging port na sinira mo" },
          { e: "🧊", t: "sa iced tea na tinunaw ng tampo" },
          { e: "🗑️", t: "sa 'trash' folder ng pinaghirapang effort" },
          { e: "🛁", t: "sa bathtub ng luha (charot)" },
          { e: "🚀", t: "lumipad papuntang ibang tao, di ka pasahero" },
        ];

        var ETAS = [
          "Layo: 2 taon · ETA: never 💀",
          "Distansya: sobrang layo ng loob · ETA: 0 chance",
          "Layo: 5 red flags · ETA: umuwi ka na",
          "Distansya: 1 seen · ETA: bukas ulit (echos)",
          "Layo: buong EDSA · ETA: pag pumayag traffic (hindi)",
          "Layo: isang blocklist · ETA: paalis na siya",
          "Distansya: 3 milktea · ETA: pag single na siya (di malalaman)",
          "Layo: 1 light year ng tampo · ETA: 'wag ka nang umasa",
          "Distansya: 12 na 'kada' · ETA: pagkatapos ng kada (hindi)",
          "Layo: kasing lalim ng utang · ETA: pag nabayaran (2099)",
          "Distansya: 8 na 'busy' · ETA: kapag free na siya (never)",
          "Layo: 3 payong ni Manong Guard · ETA: pag umulan ng pera",
          "Distansya: 1 buong Grab surge · ETA: kapag bumaba (hehe)",
          "Layo: 100 unread · ETA: kapag binasa (di mangyayari)",
          "Distansya: 2 kanto at 1 hugot · ETA: paglaya mo sa kanya",
          "Layo: kasing tagal ng buffering · ETA: 99%… tapos error",
          "Distansya: isang malditang 'k' · ETA: end of conversation",
          "Layo: 7 na 'maya na' · ETA: kahit kailan hindi",
          "Distansya: full battery ng pasensya mo · ETA: 1% na lang",
          "Layo: 1 typhoon signal ng drama · ETA: pag tumila (hindi)",
          "Distansya: 5 airplane emoji · ETA: lumipad na, iniwan ka",
          "Layo: 1 buong season na tiyaga · ETA: cancelled ang show",
          "Distansya: 3 'sana all' · ETA: sana ikaw, pero hindi",
          "Layo: kasing haba ng pila sa LTO · ETA: susunod na taon",
          "Distansya: 2 ghosting · ETA: paglabas ng multo (mas maaga pa)",
        ];

        /* ---------- deterministic RNG (so a name always maps the same) --- */
        function hashStr(s) {
          var h = 2166136261 >>> 0;
          for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
          return h >>> 0;
        }
        function mulberry32(a) {
          return function () {
            a |= 0; a = (a + 0x6D2B79F5) | 0;
            var t = Math.imul(a ^ (a >>> 15), 1 | a);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
          };
        }
        function titleCase(s) {
          return s.replace(/\S+/g, function (w) { return w.charAt(0).toUpperCase() + w.slice(1); });
        }
        function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

        /* ---------- world / map generation (seeded, once) ---------- */
        var MW = 4200, MH = 3200;
        var mrng = mulberry32(1337);

        // road grid lines (with slight jitter), some flagged "major"
        var roadsV = [], roadsH = [];
        (function makeRoads() {
          var x = 120;
          var k = 0;
          while (x < MW - 120) { roadsV.push({ p: x, major: (k % 3 === 0) }); x += 240 + mrng() * 220; k++; }
          var y = 120; k = 0;
          while (y < MH - 120) { roadsH.push({ p: y, major: (k % 3 === 0) }); y += 220 + mrng() * 200; k++; }
        })();

        // a few long diagonal avenues cutting across the grid
        var roadsDiag = [];
        (function makeDiagonals() {
          roadsDiag.push({ a: { x: -100, y: 200 + mrng() * 400 }, b: { x: MW + 100, y: MH - 200 - mrng() * 400 } });
          roadsDiag.push({ a: { x: 300 + mrng() * 400, y: -100 }, b: { x: MW - 200 - mrng() * 500, y: MH + 100 } });
        })();

        // buildings inside each block cell — varied sizes, slight rotation,
        // and a few non-rectangular shapes so it doesn't look like a grid of boxes.
        var buildings = [];
        var bColors = ["#e4e7e2", "#dfe3df", "#eceee9", "#e9e4d8", "#e6e9ee", "#e8ded0", "#dde6de"];
        (function makeBuildings() {
          for (var i = 0; i < roadsV.length - 1; i++) {
            for (var j = 0; j < roadsH.length - 1; j++) {
              var x0 = roadsV[i].p, x1 = roadsV[i + 1].p;
              var y0 = roadsH[j].p, y1 = roadsH[j + 1].p;
              var cw = x1 - x0, ch = y1 - y0;
              if (cw < 60 || ch < 60) continue;
              var n = 1 + Math.floor(mrng() * 4);          // 1..4 per cell
              for (var b = 0; b < n; b++) {
                var pad = 16;
                var bw = (cw - pad * 2) * (0.28 + mrng() * 0.62);
                var bh = (ch - pad * 2) * (0.28 + mrng() * 0.62);
                if (bw < 22 || bh < 22) continue;
                var cx = x0 + pad + bw / 2 + mrng() * Math.max(0, (cw - pad * 2 - bw));
                var cy = y0 + pad + bh / 2 + mrng() * Math.max(0, (ch - pad * 2 - bh));
                var roll = mrng();
                var kind = roll < 0.66 ? "rect" : (roll < 0.85 ? "L" : "round");
                buildings.push({
                  cx: cx, cy: cy, w: bw, h: bh,
                  rot: (mrng() - 0.5) * 0.5,               // gentle rotation
                  kind: kind,
                  notch: 0.35 + mrng() * 0.3,              // L-shape cut ratio
                  c: bColors[Math.floor(mrng() * bColors.length)],
                });
              }
            }
          }
        })();

        // a couple of roundabout circles at random major intersections
        var circles = [];
        (function makeCircles() {
          for (var c = 0; c < 4; c++) {
            var i = 1 + Math.floor(mrng() * (roadsV.length - 2));
            var j = 1 + Math.floor(mrng() * (roadsH.length - 2));
            if (!roadsV[i] || !roadsH[j]) continue;
            circles.push({ x: roadsV[i].p, y: roadsH[j].p, r: 40 + mrng() * 46 });
          }
        })();

        // parks (green blocks) — claim a few random cells
        var parks = [];
        (function makeParks() {
          for (var p = 0; p < 6; p++) {
            var i = Math.floor(mrng() * (roadsV.length - 1));
            var j = Math.floor(mrng() * (roadsH.length - 1));
            if (!roadsV[i + 1] || !roadsH[j + 1]) continue;
            parks.push({
              x: roadsV[i].p + 8, y: roadsH[j].p + 8,
              w: roadsV[i + 1].p - roadsV[i].p - 16,
              h: roadsH[j + 1].p - roadsH[j].p - 16,
            });
          }
        })();

        // a winding river across the map
        var river = [];
        (function makeRiver() {
          var y = 400 + mrng() * 400;
          for (var x = -100; x < MW + 100; x += 160) {
            y += (mrng() - 0.5) * 260;
            y = clamp(y, 250, MH - 250);
            river.push({ x: x, y: y });
          }
        })();

        var streetNames = ["Hugot St.", "Ghosted Ave.", "Seen Blvd.", "Chika Rd.", "Utang Loop",
          "Landi Lane", "Move-On Hwy", "Charot St.", "Sana Ol Ave.", "Petmalu Rd."];

        /* ---------- camera ---------- */
        var W = 0, H = 0, dpr = Math.max(1, window.devicePixelRatio || 1);
        var cam = { x: MW / 2, y: MH / 2, z: 0.26 };
        var flyTarget = null;      // {x,y,z} when flying to a pin
        var pin = null;            // {x,y,t0,place,name}

        /* ---------- DOM: canvas + overlays ---------- */
        var canvas = document.createElement("canvas");
        canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;cursor:grab;touch-action:none;";
        body.appendChild(canvas);
        var ctx = canvas.getContext("2d");

        var overlay = document.createElement("div");
        overlay.style.cssText = "position:absolute;inset:0;pointer-events:none;font:13px 'Segoe UI',sans-serif;";
        overlay.innerHTML =
          // search bar
          '<div class="wr-search" style="position:absolute;top:14px;left:14px;width:320px;max-width:70%;pointer-events:auto;">' +
            '<div style="display:flex;align-items:center;background:#fff;border-radius:10px;box-shadow:0 2px 10px rgba(0,0,0,.18);overflow:hidden;">' +
              '<span style="padding:0 10px;font-size:15px;color:#5f6368;">🔍</span>' +
              '<input class="wr-input" type="text" placeholder="Hanapin: type a name…" autocomplete="off" spellcheck="false" ' +
                'style="flex:1;border:0;outline:0;padding:11px 8px;font-size:14px;color:#202124;background:transparent;">' +
              '<button class="wr-clear" title="Clear" style="border:0;background:transparent;font-size:16px;color:#5f6368;padding:0 12px;cursor:pointer;display:none;">✕</button>' +
            "</div>" +
            '<div class="wr-suggest" style="margin-top:6px;background:#fff;border-radius:10px;box-shadow:0 2px 10px rgba(0,0,0,.18);overflow:hidden;display:none;"></div>' +
          "</div>" +
          // info card
          '<div class="wr-card" style="position:absolute;left:14px;bottom:14px;width:320px;max-width:70%;background:#fff;border-radius:12px;box-shadow:0 4px 18px rgba(0,0,0,.22);padding:14px 16px;pointer-events:auto;display:none;">' +
          "</div>" +
          // zoom controls
          '<div style="position:absolute;right:14px;bottom:14px;display:flex;flex-direction:column;gap:8px;pointer-events:auto;">' +
            '<button class="wr-zin"  style="width:40px;height:40px;border:0;border-radius:8px;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,.2);font-size:22px;color:#3c4043;cursor:pointer;">+</button>' +
            '<button class="wr-zout" style="width:40px;height:40px;border:0;border-radius:8px;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,.2);font-size:22px;color:#3c4043;cursor:pointer;">−</button>' +
          "</div>" +
          // attribution gag
          '<div style="position:absolute;right:12px;top:14px;background:rgba(255,255,255,.8);border-radius:6px;padding:3px 8px;font-size:11px;color:#5f6368;pointer-events:none;">© NomuMaps</div>';
        body.appendChild(overlay);

        var input = overlay.querySelector(".wr-input");
        var clearBtn = overlay.querySelector(".wr-clear");
        var suggest = overlay.querySelector(".wr-suggest");
        var card = overlay.querySelector(".wr-card");

        /* ---------- coordinate transforms ---------- */
        function w2s(wx, wy) { return { x: (wx - cam.x) * cam.z + W / 2, y: (wy - cam.y) * cam.z + H / 2 }; }
        function s2w(sx, sy) { return { x: (sx - W / 2) / cam.z + cam.x, y: (sy - H / 2) / cam.z + cam.y }; }

        /* ---------- search logic ---------- */
        function pickPlaces(name) {
          var rng = mulberry32(hashStr(name.toLowerCase()) ^ 0x9e3779b9);
          var pool = POOL.slice();
          var out = [];
          var n = Math.min(5, pool.length);
          for (var k = 0; k < n; k++) { out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]); }
          return out;
        }
        // one place for the current query — RANDOM, so it changes every keystroke
        // and gives a fresh result even if you retype the same name.
        function onePlace(q) { return POOL[Math.floor(Math.random() * POOL.length)]; }
        function placePos(name, label) {
          return { x: 300 + Math.random() * (MW - 600), y: 300 + Math.random() * (MH - 600) };
        }
        function etaFor(name, label) {
          return ETAS[Math.floor(Math.random() * ETAS.length)];
        }

        function renderSuggestions() {
          var q = input.value.trim();
          clearBtn.style.display = q ? "block" : "none";
          if (!q) { suggest.style.display = "none"; suggest.innerHTML = ""; return; }
          var name = titleCase(q);
          var places = [onePlace(q)];    // just one, and it changes as you type
          suggest.innerHTML = "";
          places.forEach(function (pl) {
            var row = document.createElement("div");
            row.className = "wr-row";
            row.style.cssText = "display:flex;align-items:center;gap:10px;padding:9px 12px;cursor:pointer;border-bottom:1px solid #f1f3f4;";
            row.innerHTML =
              '<span style="font-size:18px;">' + pl.e + "</span>" +
              '<span style="flex:1;min-width:0;">' +
                '<span style="display:block;color:#202124;font-weight:600;">' + esc(name) + "</span>" +
                '<span style="display:block;color:#5f6368;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + esc(pl.t) + "</span>" +
              "</span>" +
              '<span style="color:#9aa0a6;font-size:12px;">📍</span>';
            row.addEventListener("mouseenter", function () { row.style.background = "#f8f9fa"; });
            row.addEventListener("mouseleave", function () { row.style.background = "#fff"; });
            row.addEventListener("click", function () { selectPlace(name, pl); });
            suggest.appendChild(row);
          });
          suggest.style.display = "block";
        }
        function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

        function selectPlace(name, pl) {
          var pos = placePos(name, pl.t);
          pin = { x: pos.x, y: pos.y, t0: performance.now(), place: pl, name: name };
          flyTarget = { x: pos.x, y: pos.y, z: 1.15 };
          suggest.style.display = "none";
          input.value = name;
          clearBtn.style.display = "block";
          card.style.display = "block";
          card.innerHTML =
            '<div style="display:flex;align-items:flex-start;gap:10px;">' +
              '<span style="font-size:26px;">' + pl.e + "</span>" +
              '<div style="flex:1;min-width:0;">' +
                '<div style="font-size:16px;font-weight:700;color:#202124;">' + esc(name) + "</div>" +
                '<div style="color:#3c4043;margin-top:2px;">' + esc(pl.t) + "</div>" +
                '<div style="color:#1a73e8;margin-top:6px;font-size:12px;">📌 ' + esc(etaFor(name, pl.t)) + "</div>" +
              "</div>" +
              '<button class="wr-cardx" title="Close" style="border:0;background:transparent;font-size:16px;color:#5f6368;cursor:pointer;">✕</button>' +
            "</div>" +
            '<div style="display:flex;gap:8px;margin-top:12px;">' +
              '<button class="wr-dir" style="flex:1;border:0;border-radius:8px;background:#1a73e8;color:#fff;padding:9px;font-weight:600;cursor:pointer;">🧭 Directions</button>' +
              '<button class="wr-share" style="border:0;border-radius:8px;background:#f1f3f4;color:#3c4043;padding:9px 12px;cursor:pointer;">🔗 Share</button>' +
            "</div>" +
            '<div class="wr-toast" style="margin-top:10px;color:#5f6368;font-size:12px;display:none;"></div>';
          card.querySelector(".wr-cardx").addEventListener("click", function () { card.style.display = "none"; pin = null; });
          card.querySelector(".wr-dir").addEventListener("click", function () {
            var t = card.querySelector(".wr-toast");
            t.style.display = "block";
            t.textContent = "🧭 Kinakalkula ang ruta… ay wala pala. " + etaFor(name, pl.t);
          });
          card.querySelector(".wr-share").addEventListener("click", function () {
            var t = card.querySelector(".wr-toast");
            t.style.display = "block";
            t.textContent = "🔗 Link copied (charot) — i-share mo kay " + esc(name) + " kung mahahanap mo siya.";
          });
        }

        input.addEventListener("input", renderSuggestions);
        input.addEventListener("keydown", function (e) {
          if (e.key === "Enter") {
            var first = suggest.querySelector(".wr-row");
            if (first) first.click();
          } else if (e.key === "Escape") {
            input.value = ""; renderSuggestions();
          }
        });
        clearBtn.addEventListener("click", function () { input.value = ""; renderSuggestions(); input.focus(); });
        overlay.querySelector(".wr-zin").addEventListener("click", function () { zoomAt(W / 2, H / 2, 1.4); });
        overlay.querySelector(".wr-zout").addEventListener("click", function () { zoomAt(W / 2, H / 2, 1 / 1.4); });

        function zoomAt(sx, sy, factor) {
          flyTarget = null;
          var before = s2w(sx, sy);
          cam.z = clamp(cam.z * factor, 0.12, 3);
          var after = s2w(sx, sy);
          cam.x += before.x - after.x;
          cam.y += before.y - after.y;
        }

        /* ---------- pan (drag / 1-finger) + zoom (wheel / 2-finger pinch) ---------- */
        var pointers = {};        // active pointerId -> {x,y}
        var pinchDist = 0;
        function twoInfo() {
          var ids = Object.keys(pointers);
          var a = pointers[ids[0]], b = pointers[ids[1]];
          return { dist: Math.hypot(b.x - a.x, b.y - a.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
        }
        function onDown(e) {
          if (e.target !== canvas) return;   // let UI clicks through
          pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
          flyTarget = null;
          var ids = Object.keys(pointers);
          if (ids.length === 1) canvas.style.cursor = "grabbing";
          else if (ids.length === 2) pinchDist = twoInfo().dist;
        }
        function onMove(e) {
          if (!(e.pointerId in pointers)) return;
          var prev = pointers[e.pointerId];
          pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
          var ids = Object.keys(pointers);
          if (ids.length === 1) {
            cam.x -= (e.clientX - prev.x) / cam.z;   // one finger / mouse = pan
            cam.y -= (e.clientY - prev.y) / cam.z;
          } else if (ids.length >= 2) {
            var info = twoInfo();                    // two fingers = pinch zoom
            if (pinchDist > 0) {
              var r = canvas.getBoundingClientRect();
              zoomAt(info.mx - r.left, info.my - r.top, info.dist / pinchDist);
            }
            pinchDist = info.dist;
          }
        }
        function onUp(e) {
          delete pointers[e.pointerId];
          var ids = Object.keys(pointers);
          if (ids.length < 2) pinchDist = 0;
          if (ids.length === 0) canvas.style.cursor = "grab";
        }
        function onWheel(e) {
          e.preventDefault();
          var r = canvas.getBoundingClientRect();
          zoomAt(e.clientX - r.left, e.clientY - r.top, e.deltaY < 0 ? 1.12 : 1 / 1.12);
        }
        canvas.addEventListener("pointerdown", onDown);
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
        window.addEventListener("pointercancel", onUp);
        canvas.addEventListener("wheel", onWheel, { passive: false });
        // keep clicks inside the search UI from starting a pan / closing things oddly
        overlay.querySelector(".wr-search").addEventListener("pointerdown", function (e) { e.stopPropagation(); });

        /* ---------- rendering ---------- */
        function resize() {
          var w = body.clientWidth || 820, h = body.clientHeight || 600;
          if (w === W && h === H) return;
          W = w; H = h;
          canvas.width = Math.floor(W * dpr);
          canvas.height = Math.floor(H * dpr);
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        function tileRange() {
          var lw = cam.x - (W / 2) / cam.z, rw = cam.x + (W / 2) / cam.z;
          var tw = cam.y - (H / 2) / cam.z, bw = cam.y + (H / 2) / cam.z;
          return {
            i0: Math.floor(lw / MW), i1: Math.floor(rw / MW),
            j0: Math.floor(tw / MH), j1: Math.floor(bw / MH),
          };
        }

        function drawRoads() {
          var tr = tileRange();
          for (var pass = 0; pass < 2; pass++) {
            var color = pass === 0 ? "#d4d8de" : "#ffffff";
            // vertical roads — tiled across x, drawn full screen height
            for (var i = tr.i0; i <= tr.i1; i++) {
              for (var v = 0; v < roadsV.length; v++) {
                var rv = roadsV[v];
                var sx = (rv.p + i * MW - cam.x) * cam.z + W / 2;
                if (sx < -40 || sx > W + 40) continue;
                ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx, H);
                ctx.lineWidth = (rv.major ? 26 : 13) * cam.z + (pass === 0 ? 4 : 0);
                ctx.strokeStyle = color; ctx.stroke();
              }
            }
            // horizontal roads — tiled across y, drawn full screen width
            for (var j = tr.j0; j <= tr.j1; j++) {
              for (var h = 0; h < roadsH.length; h++) {
                var rh = roadsH[h];
                var sy = (rh.p + j * MH - cam.y) * cam.z + H / 2;
                if (sy < -40 || sy > H + 40) continue;
                ctx.beginPath(); ctx.moveTo(0, sy); ctx.lineTo(W, sy);
                ctx.lineWidth = (rh.major ? 26 : 13) * cam.z + (pass === 0 ? 4 : 0);
                ctx.strokeStyle = color; ctx.stroke();
              }
            }
            // diagonals + roundabout rings — tiled in both axes
            for (var ti = tr.i0; ti <= tr.i1; ti++) {
              for (var tj = tr.j0; tj <= tr.j1; tj++) {
                var oxx = ti * MW, oyy = tj * MH;
                var dwgt = 22 * cam.z + (pass === 0 ? 4 : 0);
                for (var d = 0; d < roadsDiag.length; d++) {
                  var a = w2s(roadsDiag[d].a.x + oxx, roadsDiag[d].a.y + oyy);
                  var b = w2s(roadsDiag[d].b.x + oxx, roadsDiag[d].b.y + oyy);
                  ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
                  ctx.lineWidth = dwgt; ctx.strokeStyle = color; ctx.stroke();
                }
                var cwgt = 13 * cam.z + (pass === 0 ? 4 : 0);
                for (var c = 0; c < circles.length; c++) {
                  var cs = w2s(circles[c].x + oxx, circles[c].y + oyy);
                  ctx.beginPath(); ctx.arc(cs.x, cs.y, circles[c].r * cam.z, 0, Math.PI * 2);
                  ctx.lineWidth = cwgt; ctx.strokeStyle = color; ctx.stroke();
                }
              }
            }
          }
        }

        function drawRect(x, y, w, h, color, ox, oy) {
          var s = w2s(x + (ox || 0), y + (oy || 0));
          var sw = w * cam.z, sh = h * cam.z;
          if (s.x > W || s.y > H || s.x + sw < 0 || s.y + sh < 0) return;
          ctx.fillStyle = color;
          ctx.fillRect(s.x, s.y, sw, sh);
        }

        function roundRectPath(x, y, w, h, r) {
          r = Math.max(0, Math.min(r, w / 2, h / 2));
          ctx.beginPath();
          ctx.moveTo(x + r, y);
          ctx.arcTo(x + w, y, x + w, y + h, r);
          ctx.arcTo(x + w, y + h, x, y + h, r);
          ctx.arcTo(x, y + h, x, y, r);
          ctx.arcTo(x, y, x + w, y, r);
          ctx.closePath();
        }

        function drawBuilding(b, ox, oy) {
          var s = w2s(b.cx + (ox || 0), b.cy + (oy || 0));
          var maxd = Math.max(b.w, b.h) * cam.z;
          if (s.x + maxd < 0 || s.x - maxd > W || s.y + maxd < 0 || s.y - maxd > H) return;
          var w = b.w * cam.z, h = b.h * cam.z;
          ctx.save();
          ctx.translate(s.x, s.y);
          ctx.rotate(b.rot);
          ctx.fillStyle = b.c;
          ctx.strokeStyle = "rgba(60,64,67,0.10)";
          ctx.lineWidth = 1;
          if (b.kind === "round") {
            ctx.beginPath();
            ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
            ctx.fill(); ctx.stroke();
          } else if (b.kind === "L") {
            var nw = w * b.notch, nh = h * b.notch;
            ctx.beginPath();
            ctx.moveTo(-w / 2, -h / 2);
            ctx.lineTo(w / 2, -h / 2);
            ctx.lineTo(w / 2, h / 2 - nh);
            ctx.lineTo(w / 2 - nw, h / 2 - nh);
            ctx.lineTo(w / 2 - nw, h / 2);
            ctx.lineTo(-w / 2, h / 2);
            ctx.closePath();
            ctx.fill(); ctx.stroke();
          } else {
            roundRectPath(-w / 2, -h / 2, w, h, Math.min(6, w * 0.18, h * 0.18));
            ctx.fill(); ctx.stroke();
          }
          ctx.restore();
        }

        function drawRiver(ox, oy) {
          if (river.length < 2) return;
          ctx.beginPath();
          for (var i = 0; i < river.length; i++) {
            var s = w2s(river[i].x + (ox || 0), river[i].y + (oy || 0));
            if (i === 0) ctx.moveTo(s.x, s.y); else ctx.lineTo(s.x, s.y);
          }
          ctx.strokeStyle = "#a9d6f5";
          ctx.lineWidth = 60 * cam.z;
          ctx.lineJoin = "round"; ctx.lineCap = "round";
          ctx.stroke();
        }

        function drawLabels() {
          if (cam.z < 0.5) return;
          var tr = tileRange();
          ctx.fillStyle = "#9aa0a6";
          ctx.font = Math.round(11 * Math.min(2, cam.z)) + "px 'Segoe UI',sans-serif";
          ctx.textAlign = "center";
          for (var ti = tr.i0; ti <= tr.i1; ti++) {
            for (var i = 0; i < roadsV.length; i++) {
              if (!roadsV[i].major) continue;
              var sx = (roadsV[i].p + ti * MW - cam.x) * cam.z + W / 2;
              if (sx < 0 || sx > W) continue;
              ctx.save(); ctx.translate(sx, H / 2); ctx.rotate(-Math.PI / 2);
              ctx.fillText(streetNames[i % streetNames.length], 0, -4);
              ctx.restore();
            }
          }
          ctx.textAlign = "left";
        }

        function drawPin() {
          if (!pin) return;
          var s = w2s(pin.x, pin.y);
          var age = (performance.now() - pin.t0) / 1000;
          // easeOutBack pop
          var t = clamp(age / 0.45, 0, 1);
          var c1 = 1.70158, c3 = c1 + 1;
          var pop = 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
          var scale = 0.6 + 0.4 * pop;
          var R = 15 * scale, tipY = s.y, headY = s.y - 26 * scale;
          // shadow
          ctx.beginPath(); ctx.ellipse(s.x, tipY + 2, 8 * scale, 3 * scale, 0, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(0,0,0,0.25)"; ctx.fill();
          // teardrop body
          ctx.beginPath();
          ctx.moveTo(s.x, tipY);
          ctx.quadraticCurveTo(s.x - R, headY + R * 0.4, s.x - R, headY - R * 0.2);
          ctx.arc(s.x, headY, R, Math.PI * 0.85, Math.PI * 0.15, false);
          ctx.quadraticCurveTo(s.x + R, headY + R * 0.4, s.x, tipY);
          ctx.closePath();
          ctx.fillStyle = "#ea4335"; ctx.fill();
          // inner dot
          ctx.beginPath(); ctx.arc(s.x, headY, R * 0.42, 0, Math.PI * 2);
          ctx.fillStyle = "#fff"; ctx.fill();
        }

        function draw() {
          resize();
          // ease camera toward a fly target
          if (flyTarget) {
            cam.x += (flyTarget.x - cam.x) * 0.12;
            cam.y += (flyTarget.y - cam.y) * 0.12;
            cam.z += (flyTarget.z - cam.z) * 0.12;
            if (Math.abs(flyTarget.x - cam.x) < 1 && Math.abs(flyTarget.z - cam.z) < 0.01) flyTarget = null;
          }
          ctx.clearRect(0, 0, W, H);
          ctx.fillStyle = "#eaeee8"; ctx.fillRect(0, 0, W, H);  // land
          var tr = tileRange();
          for (var ti = tr.i0; ti <= tr.i1; ti++) {
            for (var tj = tr.j0; tj <= tr.j1; tj++) {
              var ox = ti * MW, oy = tj * MH;
              drawRiver(ox, oy);
              for (var p = 0; p < parks.length; p++) drawRect(parks[p].x, parks[p].y, parks[p].w, parks[p].h, "#cdeab0", ox, oy);
              for (var bi = 0; bi < buildings.length; bi++) drawBuilding(buildings[bi], ox, oy);
            }
          }
          drawRoads();
          // roundabout islands (green centers), tiled
          for (var ti2 = tr.i0; ti2 <= tr.i1; ti2++) {
            for (var tj2 = tr.j0; tj2 <= tr.j1; tj2++) {
              for (var c = 0; c < circles.length; c++) {
                var s = w2s(circles[c].x + ti2 * MW, circles[c].y + tj2 * MH);
                ctx.beginPath();
                ctx.arc(s.x, s.y, Math.max(1, (circles[c].r - 9) * cam.z), 0, Math.PI * 2);
                ctx.fillStyle = "#cdeab0"; ctx.fill();
              }
            }
          }
          drawLabels();
          drawPin();
        }

        /* ---------- loop ---------- */
        var raf = null;
        function loop() {
          if (!canvas.isConnected) { cleanup(); return; }
          raf = requestAnimationFrame(loop);
          draw();
        }
        function cleanup() {
          if (raf) cancelAnimationFrame(raf);
          raf = null;
          canvas.removeEventListener("pointerdown", onDown);
          window.removeEventListener("pointermove", onMove);
          window.removeEventListener("pointerup", onUp);
          window.removeEventListener("pointercancel", onUp);
          canvas.removeEventListener("wheel", onWheel);
        }
        setTimeout(function () { try { input.focus(); } catch (e) {} }, 60);
        loop();
      },
    });
  },
};
