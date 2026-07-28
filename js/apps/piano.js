/* ============================================================
   NomuOS — "Piano"
   A playable little synth-piano (Web Audio API — no audio files).
   Play with the mouse or your computer keyboard, remap the keys,
   and practice with a Synthesia-style falling-note guide.

   Guide is PRACTICE by default: bars just fall and YOU press the
   keys. Flip "🔊 Sound" to let the guide play a demo too.
   Songs are all public-domain melodies.
   ============================================================ */
window.NomuApps = window.NomuApps || {};
window.NomuApps.piano = {
  id: "piano",
  name: "Piano",
  icon: "🎹",

  open: function () {
    NomuWM.open({
      key: "piano",
      title: "Piano",
      icon: "🎹",
      width: 720,
      height: 470,
      render: function (body) {
        var NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
        function midiToName(m) { return NOTE_NAMES[m % 12] + (Math.floor(m / 12) - 1); }
        function isBlack(m) { return NOTE_NAMES[m % 12].indexOf("#") !== -1; }
        function midiToFreq(m) { return 440 * Math.pow(2, (m - 69) / 12); }

        /* ---------- key assignment (char -> semitone offset from octave C) ---------- */
        var DEFAULT_KEYMAP = {
          a: 0, w: 1, s: 2, e: 3, d: 4, f: 5, t: 6, g: 7, y: 8, h: 9, u: 10, j: 11,
          k: 12, o: 13, l: 14, p: 15, ";": 16,
        };
        var STORAGE_KEY = "nomuos.piano.keymap.v1";
        function loadMap() {
          try {
            var raw = window.localStorage && localStorage.getItem(STORAGE_KEY);
            if (raw) { var o = JSON.parse(raw); if (o && typeof o === "object") return o; }
          } catch (e) {}
          var d = {}; for (var k in DEFAULT_KEYMAP) d[k] = DEFAULT_KEYMAP[k]; return d;
        }
        function saveMap() { try { if (window.localStorage) localStorage.setItem(STORAGE_KEY, JSON.stringify(KEYMAP)); } catch (e) {} }
        var KEYMAP = loadMap();

        /* ---------- build the keyboard (C4..C6) ---------- */
        var START = 60, END = 84;                 // C4 .. C6 inclusive
        var whites = [], blacks = [];
        for (var m = START; m <= END; m++) (isBlack(m) ? blacks : whites).push(m);
        var totalWhites = whites.length;
        var whiteWpct = 100 / totalWhites;
        var blackWpct = whiteWpct * 0.62;

        var whitesHtml = "", blacksHtml = "", whiteCount = 0;
        for (var i = START; i <= END; i++) {
          if (isBlack(i)) {
            var left = whiteCount * whiteWpct - blackWpct / 2;
            blacksHtml +=
              '<div class="pn-key pn-black" data-midi="' + i + '" ' +
              'style="left:' + left.toFixed(4) + "%;width:" + blackWpct.toFixed(4) + '%;">' +
                '<span class="pn-bind"></span>' +
              "</div>";
          } else {
            var isC = (i % 12) === 0;
            whitesHtml +=
              '<div class="pn-key pn-white" data-midi="' + i + '">' +
                '<span class="pn-bind"></span>' +
                '<span class="pn-note">' + (isC ? midiToName(i) : "") + "</span>" +
              "</div>";
            whiteCount++;
          }
        }

        body.style.padding = "0";
        body.innerHTML =
          '<div class="pn">' +
            '<div class="pn-controls">' +
              '<div class="pn-ctl">' +
                '<button class="pn-btn" id="pn-oct-down" title="Octave down (z)">◀</button>' +
                '<span class="pn-oct" id="pn-oct">Oct 4</span>' +
                '<button class="pn-btn" id="pn-oct-up" title="Octave up (x)">▶</button>' +
              "</div>" +
              '<label class="pn-ctl">Tone ' +
                '<select id="pn-wave">' +
                  '<option value="triangle">Piano</option>' +
                  '<option value="sine">Sine</option>' +
                  '<option value="square">Square</option>' +
                  '<option value="sawtooth">Saw</option>' +
                "</select>" +
              "</label>" +
              '<button class="pn-btn pn-toggle" id="pn-sustain" title="Sustain">Sustain: off</button>' +
              '<button class="pn-btn pn-toggle" id="pn-remap" title="Reassign keyboard keys">⌨ Remap: off</button>' +
              '<button class="pn-btn" id="pn-reset" title="Restore default keys">Reset</button>' +
              '<label class="pn-ctl">Song ' +
                '<select id="pn-song">' +
                  '<option value="twinkle">Twinkle Twinkle</option>' +
                  '<option value="mary">Mary Had a Little Lamb</option>' +
                  '<option value="jingle">Jingle Bells</option>' +
                  '<option value="ode">Ode to Joy</option>' +
                  '<option value="imported" id="pn-opt-imported" disabled hidden>Imported ♪</option>' +
                "</select>" +
              "</label>" +
              '<button class="pn-btn" id="pn-import" title="Load a .mid file as the guide">Import .mid</button>' +
              '<input type="file" id="pn-file" accept=".mid,.midi,audio/midi" style="display:none" />' +
              '<button class="pn-btn pn-toggle" id="pn-guide-btn" title="Falling-note guide">▶ Guide</button>' +
              '<button class="pn-btn pn-toggle" id="pn-guide-sound" title="Let the guide play the notes too (demo)">🔊 Sound: off</button>' +
              '<label class="pn-ctl">Speed ' +
                '<input type="range" id="pn-speed" min="50" max="150" value="100" title="Guide speed" />' +
              "</label>" +
              '<label class="pn-ctl">Vol ' +
                '<input type="range" id="pn-vol" min="0" max="100" value="80" />' +
              "</label>" +
            "</div>" +
            '<div class="pn-guide" id="pn-guide"><canvas id="pn-guide-cv"></canvas></div>' +
            '<div class="pn-keys" id="pn-keys">' + whitesHtml + blacksHtml + "</div>" +
            '<div class="pn-hint" id="pn-hint">▶ Guide drops bars — YOU press the keys to match · 🔊 Sound = play a demo · z / x octave · ⌨ Remap</div>' +
          "</div>";

        var keysEl = body.querySelector("#pn-keys");
        var octEl = body.querySelector("#pn-oct");
        var waveEl = body.querySelector("#pn-wave");
        var sustainBtn = body.querySelector("#pn-sustain");
        var remapBtn = body.querySelector("#pn-remap");
        var resetBtn = body.querySelector("#pn-reset");
        var volEl = body.querySelector("#pn-vol");
        var hintEl = body.querySelector("#pn-hint");

        var DEFAULT_HINT = "▶ Guide drops bars — YOU press the keys to match · 🔊 Sound = play a demo · z / x octave · ⌨ Remap";

        /* ---------- state ---------- */
        var ctx = null, master = null, comp = null;
        var waveform = "triangle";
        var sustain = false;
        var volume = 0.8;
        var octave = 4;
        var editMode = false, bindingMidi = null;
        var activeVoices = {};   // midi -> { o1, o2, g }

        function baseMidi() { return 12 * (octave + 1); }
        function keyEl(midi) { return keysEl.querySelector('.pn-key[data-midi="' + midi + '"]'); }
        function highlight(midi, on) { var k = keyEl(midi); if (k) k.classList.toggle("pn-down", on); }

        /* ---------- labels ---------- */
        function renderLabels() {
          var base = baseMidi();
          var o2c = {};
          for (var ch in KEYMAP) o2c[KEYMAP[ch]] = ch;
          for (var mm = START; mm <= END; mm++) {
            var el = keyEl(mm); if (!el) continue;
            var bind = el.querySelector(".pn-bind"); if (!bind) continue;
            var ch2 = o2c[mm - base];
            bind.textContent = ch2 ? (ch2 === ";" ? ";" : ch2.toUpperCase()) : "";
          }
        }

        /* ---------- audio ---------- */
        function ensureCtx() {
          if (ctx) { if (ctx.state === "suspended") ctx.resume(); return; }
          var AC = window.AudioContext || window.webkitAudioContext;
          if (!AC) return;
          ctx = new AC();
          comp = ctx.createDynamicsCompressor();
          master = ctx.createGain();
          master.gain.value = volume;
          master.connect(comp);
          comp.connect(ctx.destination);
        }
        function noteOn(midi) {
          ensureCtx();
          if (!ctx || activeVoices[midi]) return;
          var freq = midiToFreq(midi);
          var g = ctx.createGain(); g.gain.value = 0.0001; g.connect(master);
          var o1 = ctx.createOscillator(); o1.type = waveform; o1.frequency.value = freq;
          var o2 = ctx.createOscillator(); o2.type = waveform; o2.frequency.value = freq; o2.detune.value = 7;
          o1.connect(g); o2.connect(g);
          var t = ctx.currentTime, peak = 0.22;
          g.gain.setValueAtTime(0.0001, t);
          g.gain.exponentialRampToValueAtTime(peak, t + 0.006);
          g.gain.exponentialRampToValueAtTime(peak * 0.4, t + 0.22);
          o1.start(t); o2.start(t);
          activeVoices[midi] = { o1: o1, o2: o2, g: g };
          highlight(midi, true);
        }
        function noteOff(midi) {
          var v = activeVoices[midi];
          if (!v || !ctx) { highlight(midi, false); return; }
          delete activeVoices[midi];
          var t = ctx.currentTime, rel = sustain ? 1.6 : 0.28;
          var cur = Math.max(0.0001, v.g.gain.value);
          v.g.gain.cancelScheduledValues(t);
          v.g.gain.setValueAtTime(cur, t);
          v.g.gain.exponentialRampToValueAtTime(0.0001, t + rel);
          var stopAt = t + rel + 0.05;
          v.o1.stop(stopAt); v.o2.stop(stopAt);
          highlight(midi, false);
        }
        function allNotesOff() { for (var k in activeVoices) noteOff(+k); }

        /* ---------- remap ---------- */
        function startBinding(midi) {
          if (bindingMidi != null) { var pe = keyEl(bindingMidi); if (pe) pe.classList.remove("pn-binding"); }
          bindingMidi = midi;
          var el = keyEl(midi); if (el) el.classList.add("pn-binding");
          hintEl.textContent = "🎯 Press a keyboard key to assign to " + midiToName(midi) + " · Esc cancel · Del clear";
        }
        function endBinding() {
          if (bindingMidi != null) { var el = keyEl(bindingMidi); if (el) el.classList.remove("pn-binding"); }
          bindingMidi = null;
          hintEl.textContent = editMode
            ? "Remap: click a piano key, then press a keyboard key to assign it."
            : DEFAULT_HINT;
        }
        function assignChar(ch) {
          var off = bindingMidi - baseMidi();
          for (var c in KEYMAP) if (KEYMAP[c] === off) delete KEYMAP[c];
          KEYMAP[ch] = off;
          saveMap(); renderLabels();
        }
        function clearBindingAt(midi) {
          var off = midi - baseMidi();
          for (var c in KEYMAP) if (KEYMAP[c] === off) delete KEYMAP[c];
          saveMap(); renderLabels();
        }
        function setEditMode(on) {
          editMode = on;
          allNotesOff();
          remapBtn.textContent = "⌨ Remap: " + (on ? "on" : "off");
          remapBtn.classList.toggle("on", on);
          keysEl.classList.toggle("pn-editing", on);
          if (!on) endBinding(); else hintEl.textContent = "Remap: click a piano key, then press a keyboard key to assign it.";
        }

        /* ---------- mouse / touch play (with glissando) ---------- */
        var mouseDown = false, mouseMidi = null;
        function mouseTo(midi) {
          if (mouseMidi === midi) return;
          if (mouseMidi !== null) noteOff(mouseMidi);
          mouseMidi = midi;
          if (midi !== null) noteOn(midi);
        }
        keysEl.addEventListener("pointerdown", function (e) {
          var k = e.target.closest(".pn-key");
          if (!k) return;
          e.preventDefault(); body.focus();
          var midi = parseInt(k.getAttribute("data-midi"), 10);
          if (editMode) { startBinding(midi); return; }
          mouseDown = true; mouseTo(midi);
        });
        keysEl.addEventListener("pointerover", function (e) {
          if (!mouseDown || editMode) return;
          var k = e.target.closest(".pn-key");
          if (!k) return;
          mouseTo(parseInt(k.getAttribute("data-midi"), 10));
        });
        function onPointerUp() {
          if (mouseMidi !== null) noteOff(mouseMidi);
          mouseMidi = null; mouseDown = false;
        }
        window.addEventListener("pointerup", onPointerUp);

        /* ---------- computer-keyboard ---------- */
        var heldKeys = {};
        function setOctave(o) { octave = Math.max(1, Math.min(7, o)); octEl.textContent = "Oct " + octave; renderLabels(); }
        function onKeyDown(e) {
          var k = e.key.toLowerCase();
          if (editMode) {
            if (bindingMidi == null) return;
            e.preventDefault();
            if (k === "escape") { endBinding(); return; }
            if (k === "backspace" || k === "delete") { clearBindingAt(bindingMidi); endBinding(); return; }
            if (e.key.length === 1 && e.key !== " ") { assignChar(k); endBinding(); }
            return;
          }
          if (!(k in KEYMAP)) {
            if (k === "z") { e.preventDefault(); setOctave(octave - 1); }
            else if (k === "x") { e.preventDefault(); setOctave(octave + 1); }
            return;
          }
          if (e.repeat || heldKeys[k] != null) return;
          e.preventDefault();
          var midi = baseMidi() + KEYMAP[k];
          heldKeys[k] = midi; noteOn(midi);
        }
        function onKeyUp(e) {
          var k = e.key.toLowerCase();
          if (heldKeys[k] != null) { noteOff(heldKeys[k]); delete heldKeys[k]; }
        }
        body.addEventListener("keydown", onKeyDown);
        body.addEventListener("keyup", onKeyUp);
        body.setAttribute("tabindex", "0");
        setTimeout(function () { try { body.focus(); } catch (e) {} }, 50);

        /* ---------- controls ---------- */
        body.querySelector("#pn-oct-down").addEventListener("click", function () { setOctave(octave - 1); body.focus(); });
        body.querySelector("#pn-oct-up").addEventListener("click", function () { setOctave(octave + 1); body.focus(); });
        waveEl.addEventListener("change", function () { waveform = waveEl.value; body.focus(); });
        sustainBtn.addEventListener("click", function () {
          sustain = !sustain;
          sustainBtn.textContent = "Sustain: " + (sustain ? "on" : "off");
          sustainBtn.classList.toggle("on", sustain);
          body.focus();
        });
        remapBtn.addEventListener("click", function () { setEditMode(!editMode); body.focus(); });
        resetBtn.addEventListener("click", function () {
          KEYMAP = {}; for (var k in DEFAULT_KEYMAP) KEYMAP[k] = DEFAULT_KEYMAP[k];
          saveMap(); renderLabels(); endBinding(); body.focus();
        });
        volEl.addEventListener("input", function () {
          volume = parseInt(volEl.value, 10) / 100;
          if (master) master.gain.value = volume;
        });

        /* ---------- falling-note guide (Synthesia-style) ---------- */
        var guideEl = body.querySelector("#pn-guide");
        var guideCv = body.querySelector("#pn-guide-cv");
        var gctx = guideCv.getContext("2d");
        var songSel = body.querySelector("#pn-song");
        var guideBtn = body.querySelector("#pn-guide-btn");
        var guideSoundBtn = body.querySelector("#pn-guide-sound");
        var speedEl = body.querySelector("#pn-speed");
        var importBtn = body.querySelector("#pn-import");
        var fileInput = body.querySelector("#pn-file");
        var importedOpt = body.querySelector("#pn-opt-imported");
        var dpr = Math.max(1, window.devicePixelRatio || 1);
        var FALL = 2.6;                 // base seconds for a bar to fall to the keys
        var speedMul = 1;               // guide speed multiplier (from the Speed slider)

        // horizontal center (%) of every visible key, to line bars up with keys
        var centerPct = {}, colWpct = {};
        (function () {
          var wc = 0;
          for (var i = START; i <= END; i++) {
            if (isBlack(i)) { centerPct[i] = wc * whiteWpct; colWpct[i] = blackWpct; }
            else { centerPct[i] = (wc + 0.5) * whiteWpct; colWpct[i] = whiteWpct; wc++; }
          }
        })();

        // Public-domain melodies. Notes are [midi, startBeat, durBeats].
        var SONGS = {
          twinkle: { bpm: 110, notes: [
            [60,0,1],[60,1,1],[67,2,1],[67,3,1],[69,4,1],[69,5,1],[67,6,2],
            [65,8,1],[65,9,1],[64,10,1],[64,11,1],[62,12,1],[62,13,1],[60,14,2],
          ] },
          mary: { bpm: 100, notes: [
            [64,0,1],[62,1,1],[60,2,1],[62,3,1],[64,4,1],[64,5,1],[64,6,2],
            [62,8,1],[62,9,1],[62,10,2],[64,12,1],[67,13,1],[67,14,2],
            [64,16,1],[62,17,1],[60,18,1],[62,19,1],[64,20,1],[64,21,1],[64,22,1],[64,23,1],
            [62,24,1],[62,25,1],[64,26,1],[62,27,1],[60,28,4],
          ] },
          jingle: { bpm: 120, notes: [
            [64,0,1],[64,1,1],[64,2,2],[64,4,1],[64,5,1],[64,6,2],
            [64,8,1],[67,9,1],[60,10,1],[62,11,1],[64,12,4],
            [65,16,1],[65,17,1],[65,18,1],[65,19,1],[65,20,1],[64,21,1],[64,22,1],[64,23,0.5],[64,23.5,0.5],
            [64,24,1],[62,25,1],[62,26,1],[64,27,1],[62,28,2],[67,30,2],
          ] },
          ode: { bpm: 120, notes: [
            [64,0,1],[64,1,1],[65,2,1],[67,3,1],[67,4,1],[65,5,1],[64,6,1],[62,7,1],
            [60,8,1],[60,9,1],[62,10,1],[64,11,1],[64,12,1.5],[62,13,0.5],[62,14,2],
          ] },
        };

        var guideRAF = null, guidePlaying = false, guideNotes = [], guideEnd = 0, guideT0 = 0, sounding = [];
        var guideSound = false;   // default: practice mode — YOU play, bars just fall
        var importedNotes = [];   // notes parsed from an imported .mid (times already in seconds)

        function buildSong(key) {
          if (key === "imported") {
            guideNotes = importedNotes.map(function (n) { return { midi: n.midi, t: n.t, d: n.d, done: false }; });
          } else {
            var s = SONGS[key] || SONGS.twinkle;
            var spb = 60 / s.bpm;               // seconds per beat
            guideNotes = s.notes.map(function (n) {
              return { midi: n[0], t: n[1] * spb, d: n[2] * spb, done: false };
            });
          }
          guideEnd = 0;
          guideNotes.forEach(function (n) { guideEnd = Math.max(guideEnd, n.t + n.d); });
        }

        function rr(c, x, y, w, h, r) {
          r = Math.max(0, Math.min(r, w / 2, h / 2));
          c.beginPath();
          c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r);
          c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r);
          c.arcTo(x, y, x + w, y, r); c.closePath();
        }

        function guideDraw(transport) {
          var cw = guideEl.clientWidth || 700, ch = guideEl.clientHeight || 200;
          if (guideCv.width !== Math.floor(cw * dpr) || guideCv.height !== Math.floor(ch * dpr)) {
            guideCv.width = Math.floor(cw * dpr); guideCv.height = Math.floor(ch * dpr);
            gctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          }
          var fall = FALL / speedMul;
          gctx.clearRect(0, 0, cw, ch);
          gctx.fillStyle = "rgba(159,180,255,0.9)";
          gctx.fillRect(0, ch - 2, cw, 2);

          var base = 12 * (octave + 1);
          var o2c = {}; for (var chk in KEYMAP) o2c[KEYMAP[chk]] = chk;

          for (var i = 0; i < guideNotes.length; i++) {
            var n = guideNotes[i];
            var bottomY = ch * (1 - (n.t - transport) / fall);
            var barH = Math.max(6, (n.d / fall) * ch);
            var topY = bottomY - barH;
            if (bottomY < 0 || topY > ch) continue;
            var x = (centerPct[n.midi] / 100) * cw;
            var w = (colWpct[n.midi] / 100) * cw * 0.72;
            var active = transport >= n.t && transport <= n.t + n.d;
            var black = isBlack(n.midi);
            gctx.fillStyle = active ? "#ffd27a" : (black ? "#6f7bd6" : "#9c86ff");
            rr(gctx, x - w / 2, topY, w, barH, 5); gctx.fill();
            var lab = o2c[n.midi - base];
            if (lab && barH > 16) {
              gctx.fillStyle = "rgba(20,20,35,0.85)";
              gctx.font = "bold 11px 'Segoe UI',sans-serif";
              gctx.textAlign = "center";
              gctx.fillText(lab === ";" ? ";" : lab.toUpperCase(), x, bottomY - 6);
            }
          }
        }

        function guideFrame() {
          if (!guidePlaying) return;
          var fall = FALL / speedMul;
          var elapsed = (performance.now() - guideT0) / 1000;
          var transport = elapsed - fall;          // lead-in so the first bar falls in
          guideDraw(transport);
          for (var j = sounding.length - 1; j >= 0; j--) {
            if (transport >= sounding[j].off) { noteOff(sounding[j].midi); sounding.splice(j, 1); }
          }
          for (var i = 0; i < guideNotes.length; i++) {
            var n = guideNotes[i];
            if (!n.done && transport >= n.t) {
              n.done = true;
              // In practice mode (sound off) the bars just fall — YOU press the keys.
              if (guideSound) { noteOn(n.midi); sounding.push({ midi: n.midi, off: n.t + n.d }); }
            }
          }
          if (transport > guideEnd + 0.6) { guideStop(); return; }
          guideRAF = requestAnimationFrame(guideFrame);
        }
        function guideStart() {
          ensureCtx();
          buildSong(songSel.value);
          sounding = [];
          guidePlaying = true;
          guideT0 = performance.now();
          guideBtn.textContent = "■ Stop";
          guideBtn.classList.add("on");
          guideRAF = requestAnimationFrame(guideFrame);
        }
        function guideStop() {
          guidePlaying = false;
          if (guideRAF) { cancelAnimationFrame(guideRAF); guideRAF = null; }
          for (var j = 0; j < sounding.length; j++) noteOff(sounding[j].midi);
          sounding = [];
          if (gctx) gctx.clearRect(0, 0, guideCv.width, guideCv.height);
          guideBtn.textContent = "▶ Guide";
          guideBtn.classList.remove("on");
        }
        guideBtn.addEventListener("click", function () { guidePlaying ? guideStop() : guideStart(); body.focus(); });
        guideSoundBtn.addEventListener("click", function () {
          guideSound = !guideSound;
          guideSoundBtn.textContent = "🔊 Sound: " + (guideSound ? "on" : "off");
          guideSoundBtn.classList.toggle("on", guideSound);
          if (!guideSound) { for (var s = 0; s < sounding.length; s++) noteOff(sounding[s].midi); sounding = []; }
          body.focus();
        });
        songSel.addEventListener("change", function () { if (guidePlaying) guideStart(); body.focus(); });
        speedEl.addEventListener("input", function () {
          speedMul = parseInt(speedEl.value, 10) / 100;   // 50..150 -> 0.5x .. 1.5x
          if (guidePlaying) guideStart();
        });

        /* ---------- MIDI import (vanilla Standard MIDI File parser) ----------
           Content-neutral: it plays whatever .mid file YOU load. Notes are folded
           into the visible C4..C6 range and shifted to start at t=0.            */
        function parseMidi(buf) {
          var dv = new DataView(buf), p = 0;
          function u8() { return dv.getUint8(p++); }
          function u16() { var v = dv.getUint16(p); p += 2; return v; }
          function u32() { var v = dv.getUint32(p); p += 4; return v; }
          function str(n) { var s = ""; for (var i = 0; i < n; i++) s += String.fromCharCode(dv.getUint8(p++)); return s; }
          function readVar() { var v = 0, c; do { c = dv.getUint8(p++); v = (v << 7) | (c & 0x7f); } while (c & 0x80); return v; }

          if (str(4) !== "MThd") throw new Error("Not a MIDI file");
          var hlen = u32(); u16(); var ntrks = u16(); var division = u16();
          p += (hlen - 6);
          var smpte = false, ticksPerSec = 0, ppq = division || 480;
          if (division & 0x8000) { smpte = true; var fps = 256 - (division >> 8); ticksPerSec = fps * (division & 0xff); }

          var tempos = [{ tick: 0, us: 500000 }];
          var events = [];
          for (var tr = 0; tr < ntrks; tr++) {
            if (str(4) !== "MTrk") break;
            var tlen = u32(), end = p + tlen, abs = 0, running = 0;
            while (p < end) {
              abs += readVar();
              var status = dv.getUint8(p);
              if (status & 0x80) { p++; running = status; } else { status = running; }
              var hi = status & 0xf0;
              if (status === 0xff) {
                var type = u8(), len = readVar();
                if (type === 0x51 && len === 3) {
                  var us = (dv.getUint8(p) << 16) | (dv.getUint8(p + 1) << 8) | dv.getUint8(p + 2);
                  tempos.push({ tick: abs, us: us });
                }
                p += len;
              } else if (status === 0xf0 || status === 0xf7) {
                p += readVar();
              } else if (hi === 0x90) {
                var n = u8(), v = u8(); events.push({ tick: abs, on: v > 0, note: n, ch: status & 0x0f });
              } else if (hi === 0x80) {
                var n2 = u8(); u8(); events.push({ tick: abs, on: false, note: n2, ch: status & 0x0f });
              } else if (hi === 0xa0 || hi === 0xb0 || hi === 0xe0) {
                p += 2;
              } else if (hi === 0xc0 || hi === 0xd0) {
                p += 1;
              } else {
                p++;   // unknown/system byte — best-effort resync
              }
            }
            p = end;
          }

          tempos.sort(function (a, b) { return a.tick - b.tick; });
          function t2s(tick) {
            if (smpte) return ticksPerSec ? tick / ticksPerSec : (tick / ppq) * 0.5;
            var sec = 0, last = 0, us = 500000;
            for (var i = 0; i < tempos.length; i++) {
              if (tempos[i].tick >= tick) break;
              sec += ((tempos[i].tick - last) / ppq) * (us / 1e6);
              last = tempos[i].tick; us = tempos[i].us;
            }
            return sec + ((tick - last) / ppq) * (us / 1e6);
          }

          events.sort(function (a, b) { return a.tick - b.tick; });
          var open = {}, out = [];
          for (var i = 0; i < events.length; i++) {
            var ev = events[i], key = ev.ch * 128 + ev.note;
            if (ev.on) { (open[key] = open[key] || []).push(ev.tick); }
            else { var arr = open[key]; if (arr && arr.length) out.push({ note: ev.note, on: arr.shift(), off: ev.tick }); }
          }
          if (!out.length) return [];
          var notes = out.map(function (o) { var t = t2s(o.on); return { midi: o.note, t: t, d: Math.max(0.06, t2s(o.off) - t) }; });
          notes.sort(function (a, b) { return a.t - b.t; });
          var t0 = notes[0].t;
          notes.forEach(function (n) { n.t -= t0; var m = n.midi; while (m < START) m += 12; while (m > END) m -= 12; n.midi = m; });
          if (notes.length > 3000) notes = notes.slice(0, 3000);
          return notes;
        }

        importBtn.addEventListener("click", function () { fileInput.click(); });
        fileInput.addEventListener("change", function () {
          var f = fileInput.files && fileInput.files[0];
          if (!f) return;
          var rd = new FileReader();
          rd.onload = function () {
            try {
              var notes = parseMidi(rd.result);
              if (!notes.length) { hintEl.textContent = "No playable notes found in that MIDI file."; return; }
              importedNotes = notes;
              importedOpt.disabled = false; importedOpt.hidden = false;
              importedOpt.textContent = "🎵 " + f.name.replace(/\.midi?$/i, "").slice(0, 22);
              songSel.value = "imported";
              hintEl.textContent = "Loaded " + notes.length + " notes from " + f.name + " — press ▶ Guide to practice.";
              if (guidePlaying) guideStart();
            } catch (e) {
              hintEl.textContent = "Couldn't read that file — is it a valid .mid?";
            }
          };
          rd.onerror = function () { hintEl.textContent = "Couldn't read that file."; };
          rd.readAsArrayBuffer(f);
          fileInput.value = "";
        });

        renderLabels();

        /* ---------- teardown when the window closes ---------- */
        var watch = setInterval(function () {
          if (body.isConnected) return;
          clearInterval(watch);
          guideStop();
          allNotesOff();
          window.removeEventListener("pointerup", onPointerUp);
          if (ctx) { try { ctx.close(); } catch (e) {} ctx = null; }
        }, 500);
      },
    });
  },
};
