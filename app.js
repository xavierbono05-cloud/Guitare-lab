window.onerror = function(msg, url, line) { alert("Erreur app.js ligne " + line + " : " + msg); };
var LOCKS = { inst: false, lvl: false, key: false, style: false };
var curItem = null, curProgRoots = new Array("C","G","A","F"), favs = new Array();
var lastProgState = null, progBpm = 90, exoBpm = 85;
try { favs = JSON.parse(localStorage.getItem("glab_f") || "[]"); } catch(e) {}

function pickRandom(arr) { return arr.slice(Math.floor(Math.random() * arr.length)).shift(); }
  if (!aMode) { bpm = (id === 'exo') ? exoBpm : progBpm; document.getElementById("bpm-lbl").textContent = bpm + " BPM"; }
function goTab(id, el) {
  var p = document.getElementsByClassName("panel");
  for (var i = 0; i < p.length; i++) p.item(i).className = "panel";
  document.getElementById("p-" + id).className = "panel active";
  var b = document.getElementsByClassName("nav-btn");
  for (var j = 0; j < b.length; j++) b.item(j).className = "nav-btn";
  if (el) el.className = "nav-btn active";
}
function toggleLock(part) {
  LOCKS[part] = !LOCKS[part];
  var btn = document.getElementById('lock-' + part);
  if (btn) { btn.textContent = LOCKS[part] ? '🔒' : '🔓'; btn.className = LOCKS[part] ? 'lock-btn locked' : 'lock-btn'; }
}
function updateGuitarTip() {
  var inst = document.getElementById('instSelect').value, box = document.getElementById('guitarTipBox');
  if (box && GUITARS[inst]) box.textContent = '🎸 ' + GUITARS[inst].tip;
}
function norm(n) { return n.replace("Bb","A#").replace("Ab","G#").replace("Eb","D#").replace("Db","C#").replace("Gb","F#"); }
function anatomy(name) {
  var r = name.match(/^[A-G][#b]?/).toString();
  var min = (name.indexOf("m") !== -1 && name.indexOf("maj") === -1);
  var idx = NOTES.indexOf(norm(r)); if (idx < 0) idx = 0;
  return {R:r, T:NOTES.slice((idx+(min?3:4))%12).shift(), Q:NOTES.slice((idx+7)%12).shift(), S:NOTES.slice((idx+(name.indexOf("maj")!==-1?11:10))%12).shift()};
}
function getVariedChordShape(rootNote, qual, altPos) {
  var rIdx = NOTES.indexOf(norm(rootNote)); if (rIdx < 0) rIdx = 0;
  var rE = (rIdx - 4 + 12) % 12, rA = (rIdx - 9 + 12) % 12;
  if (qual === 'm7b5') return 'x-' + (rA || 12) + '-' + ((rA || 12) + 1) + '-' + (rA || 12) + '-' + ((rA || 12) + 1) + '-x';
  if (qual === 'dim7') return 'x-' + (rA || 12) + '-' + ((rA || 12) + 1) + '-' + ((rA || 12) - 1) + '-' + ((rA || 12) + 1) + '-x';
  var useE = altPos ? (rE <= 7) : (rE <= 4);
  if (useE) {
    if (qual === 'maj7') return rE + '-x-' + (rE + 1) + '-' + (rE + 1) + '-' + rE + '-x';
    if (qual === 'm7') return rE + '-x-' + rE + '-' + rE + '-' + rE + '-x';
    if (qual === '7') return rE + '-x-' + rE + '-' + (rE + 1) + '-' + rE + '-x';
    if (qual === 'mMaj7') return rE + '-x-' + (rE + 1) + '-' + rE + '-' + rE + '-x';
    return rE + '-x-' + (rE + 1) + '-' + (rE + 1) + '-' + (rE + 1) + '-x';
  }
  if (qual === 'maj7') return 'x-' + rA + '-' + (rA + 2) + '-' + (rA + 1) + '-' + (rA + 2) + '-' + rA;
  if (qual === 'm7') return 'x-' + rA + '-' + (rA + 2) + '-' + rA + '-' + (rA + 1) + '-' + rA;
  if (qual === '7') return 'x-' + rA + '-' + (rA + 2) + '-' + rA + '-' + (rA + 2) + '-' + rA;
  if (qual === 'mMaj7') return 'x-' + rA + '-' + (rA + 2) + '-' + (rA + 1) + '-' + (rA + 1) + '-' + rA;
  return 'x-' + rA + '-' + (rA + 3) + '-' + (rA + 1) + '-' + (rA + 1) + '-x';
}
function buildDynamicKey(kName, modeKey) {
  var kObj = KEYS[kName] || KEYS.C, mObj = MODES[modeKey] || MODES.ionian;
  var scaleArr = kObj.flat ? NOTES_FLAT : NOTES_SHARP, rIdx = kObj.idx, scaleNotes = new Array();
  for (var i = 0; i < mObj.intervals.length; i++) {
    var iv = mObj.intervals.slice(i, i + 1).pop();
    scaleNotes.push(scaleArr.slice((rIdx + iv) % 12).shift());
  }
  var chMap = {};
  for (var d = 1; d <= 7; d++) {
    var idx = (d - 1) % scaleNotes.length, rn = scaleNotes.slice(idx).shift(), q = mObj.chords.slice(idx).shift();
    chMap[String(d)] = { n: rn + q, f: getVariedChordShape(rn, q, false) };
  }
  var blues = new Array(0,3,5,6,7,10).map(function(s){ return scaleArr.slice((rIdx+s)%12).shift(); });
  return { r: kName, ch: chMap, blues: blues, modeLabel: mObj.label, scaleNotes: scaleNotes };
}
function buildFullWidthTab(chords, lvl, groove) {
  var w = window.innerWidth || 768, perRow = (w >= 680) ? 4 : 2;
  var charsPerBar = Math.max(14, Math.floor(((w - 65) / 7.8 - perRow - 2) / perRow)), dash = "";
  for (var d = 0; d < charsPerBar; d++) dash += "-";
  var strNames = new Array("e|","B|","G|","D|","A|","E|"), blocks = new Array();
  var grv = groove || 'rock';

  for (var i = 0; i < chords.length; i++) {
    var c = chords.slice(i).shift(), p = c.f.split("-");
    var e6 = p.slice(0,1).pop(), a5 = p.slice(1,2).pop(), d4 = p.slice(2,3).pop(), g3 = p.slice(3,4).pop(), b2 = p.slice(4,5).pop(), e1 = p.slice(5,6).pop();
    var bStr = (e6 !== "x") ? 5 : 4, bVal = (e6 !== "x") ? e6 : a5;
    var altStr = (bStr === 5 && a5 !== "x") ? 4 : 3, altVal = (bStr === 5 && a5 !== "x") ? a5 : d4;
    var col = new Array(dash, dash, dash, dash, dash, dash);

    function put(row, ratio, val) {
      if (!val || val === "x") return;
      var pos = Math.max(1, Math.min(charsPerBar - val.length - 1, Math.floor(charsPerBar * ratio)));
      var s = col.slice(row).shift();
      col.splice(row, 1, s.substring(0, pos) + val + s.substring(pos + val.length));
    }

    if (grv === 'bossa') {
      put(bStr, 0.05, bVal); put(3, 0.22, d4); put(2, 0.22, g3); put(1, 0.22, b2);
      put(altStr, 0.48, altVal); put(3, 0.65, d4); put(2, 0.65, g3); put(1, 0.65, b2);
      if (lvl !== "Débutant") put(0, 0.85, e1);
    } else if (grv === 'funk') {
      put(2, 0.08, g3); put(1, 0.08, b2); put(0, 0.08, e1);
      put(2, 0.28, "x"); put(1, 0.28, "x");
      put(2, 0.48, g3); put(1, 0.48, b2); put(0, 0.48, e1);
      put(2, 0.68, "x"); put(1, 0.68, "x");
      if (lvl !== "Débutant") { put(2, 0.84, g3); put(1, 0.84, b2); }
    } else if (grv === 'jazz') {
      put(bStr, 0.05, bVal);
      put(3, 0.25, d4); put(2, 0.42, g3); put(1, 0.58, b2);
      if (lvl !== "Débutant") put(0, 0.72, e1);
      put(2, 0.86, g3);
    } else if (grv === 'reggae') {
      put(2, 0.28, g3); put(1, 0.28, b2); put(0, 0.28, e1);
      put(2, 0.72, g3); put(1, 0.72, b2); put(0, 0.72, e1);
    } else {
      // Motif créatif alternant arpège brisé (mesures impaires) et plaqué rythmique (mesures paires)
      if (i % 2 === 0) {
        put(bStr, 0.05, bVal); put(2, 0.24, g3); put(1, 0.42, b2);
        put(altStr, 0.60, altVal);
        if (lvl !== "Débutant") put(0, 0.78, e1); else put(2, 0.78, g3);
      } else {
        put(bStr, 0.05, bVal);
        put(3, 0.28, d4); put(2, 0.28, g3); put(1, 0.28, b2);
        put(altStr, 0.55, altVal);
        put(2, 0.76, g3); put(1, 0.76, b2);
      }
    }
    blocks.push({name: c.n, lines: col});
  }
  var out = "";
  for (var m = 0; m < blocks.length; m += perRow) {
    var sl = blocks.slice(m, m + perRow), hdr = "Mes. " + (m + 1) + "-" + (m + sl.length) + " : ";
    for (var h = 0; h < sl.length; h++) hdr += sl.slice(h).shift().name + (h < sl.length - 1 ? " | " : "");
    out += hdr + "\n";
    for (var r = 0; r < 6; r++) {
      var rs = strNames.slice(r).shift();
      for (var b = 0; b < sl.length; b++) rs += sl.slice(b).shift().lines.slice(r).shift() + "|";
      out += rs + "\n";
    }
    out += "\n";
  }
  return out;
}
function buildFretboard(title, scaleNotes, tonic) {
  var tIdx = NOTES.indexOf(norm(tonic)), W = 940, H = 195, x0 = 42, y0 = 26, fw = 56, sh = 26;
  var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:auto;display:block;background:#1e1b18;border-radius:8px;border:1px solid #475569;">';
  svg += '<rect x="' + x0 + '" y="' + y0 + '" width="' + (15 * fw) + '" height="' + (5 * sh) + '" fill="#2d231a"/><rect x="' + (x0 - 4) + '" y="' + y0 + '" width="6" height="' + (5 * sh) + '" fill="#f8fafc"/>';
  for (var f = 0; f <= 15; f++) {
    var fx = x0 + f * fw;
    svg += '<line x1="' + fx + '" y1="' + y0 + '" x2="' + fx + '" y2="' + (y0 + 5 * sh) + '" stroke="#94a3b8" stroke-width="' + (f === 0 ? 4 : 2) + '"/>';
    if (f > 0) svg += '<text x="' + (fx - fw / 2) + '" y="' + (H - 8) + '" fill="#94a3b8" font-size="12" text-anchor="middle">' + f + '</text>';
  }
  var sLabels = new Array("e","B","G","D","A","E");
  for (var s = 0; s < 6; s++) {
    var sy = y0 + s * sh, o = OPEN_STR.slice(s).shift();
    svg += '<line x1="' + (x0 - 4) + '" y1="' + sy + '" x2="' + (x0 + 15 * fw) + '" y2="' + sy + '" stroke="#cbd5e1" stroke-width="' + (1 + s * 0.35) + '"/>';
    svg += '<text x="16" y="' + (sy + 4) + '" fill="#cbd5e1" font-size="13" font-weight="bold">' + sLabels.slice(s).shift() + '</text>';
    for (var fr = 0; fr <= 15; fr++) {
      var nn = NOTES.slice((o + fr) % 12).shift(), inS = false;
      for (var n = 0; n < scaleNotes.length; n++) if (norm(scaleNotes.slice(n).shift()) === nn) inS = true;
      if (inS) {
        var diff = (NOTES.indexOf(nn) - tIdx + 12) % 12, col = "#475569", lbl = nn;
        if (diff === 0) { col = "#dc2626"; lbl = "R"; } else if (diff === 3 || diff === 4) { col = "#0284c7"; lbl = "3"; } else if (diff === 7) { col = "#059669"; lbl = "5"; } else if (diff === 10 || diff === 11) { col = "#d97706"; lbl = "7"; }
        var cx = (fr === 0) ? (x0 - 12) : (x0 + (fr - 0.5) * fw);
        svg += '<circle cx="' + cx + '" cy="' + sy + '" r="10.5" fill="' + col + '" stroke="#fff" stroke-width="1.5"/><text x="' + cx + '" y="' + (sy + 4) + '" fill="#fff" font-size="11" font-weight="bold" text-anchor="middle">' + lbl + '</text>';
      }
    }
  }
  svg += '</svg>';
  return '<div style="background:#0f172a;padding:10px;border-radius:10px;margin-bottom:10px;border:1px solid #334155;"><div style="font-size:13px;font-weight:bold;color:#38bdf8;margin-bottom:6px;">' + title + '</div><div style="overflow-x:auto;">' + svg + '</div></div>';
}

function genProg(rnd) {
  if (rnd) {
    if (!LOCKS.style) document.getElementById('styleSelect').value = pickRandom(Object.keys(PATS));
    var tmpSt = PATS[document.getElementById('styleSelect').value];
    if (!LOCKS.inst) document.getElementById('instSelect').value = (LOCKS.style && tmpSt) ? tmpSt.guitar : pickRandom(Object.keys(GUITARS));
    if (!LOCKS.lvl) document.getElementById('lvlSelect').value = pickRandom(new Array('deb', 'int', 'adv'));
    if (!LOCKS.key) {
      document.getElementById('keySelect').value = pickRandom(Object.keys(KEYS));
      document.getElementById('modeSelect').value = LOCKS.style ? 'auto' : pickRandom(new Array('auto', 'major', 'minor', 'blues', 'modal'));
    }
  }
  updateGuitarTip();
  var k = document.getElementById('keySelect').value, mSel = document.getElementById('modeSelect').value;
  var stKey = document.getElementById('styleSelect').value, instKey = document.getElementById('instSelect').value;
  var lvlVal = document.getElementById('lvlSelect').value, lvlLabel = lvlVal === 'deb' ? 'Débutant' : (lvlVal === 'int' ? 'Intermédiaire' : 'Avancé');
  var bars = parseInt((document.getElementById('pg-bars') || {value:8}).value, 10) || 8;
    var patObj = PATS[stKey] || PATS.emmanuel;
  if (patObj.bpm) { progBpm = patObj.bpm; if (!aMode) { bpm = progBpm; document.getElementById("bpm-lbl").textContent = bpm + " BPM"; } }
  var activeMode = (mSel === 'auto') ? patObj.mode : (mSel === 'major' ? 'ionian' : (mSel === 'minor' ? 'aeolian' : (mSel === 'modal' ? 'dorian' : 'blues')));
  var kd = buildDynamicKey(k, activeMode), gObj = GUITARS[instKey] || GUITARS.strat;

  var baseDegs = patObj.deg.slice(0), f1 = baseDegs.slice(0).shift();
  var variants = new Array(baseDegs, new Array(f1, 6, 2, 5), new Array(f1, 4, 6, 5), new Array(f1, 3, 4, 5), new Array(2, 5, f1, 6));
  var chosenSeq = pickRandom(variants), altPos = Math.random() > 0.5;
  var cHtml = '', chObjs = new Array(), seen = {};
  curProgRoots = new Array();
  for (var b = 0; b < bars; b++) {
    var deg = String(chosenSeq.slice(b % chosenSeq.length).shift());
    var baseC = kd.ch[deg] || kd.ch['1'];
    var rn = baseC.n.match(/^[A-G][#b]?/).toString(), qual = baseC.n.replace(rn, '');
    var rawF = getVariedChordShape(rn, qual, altPos);
    var shiftedF = rawF.split('-').map(function(v) { return (v === 'x') ? 'x' : String(parseInt(v, 10) + gObj.shift); }).join('-');
    var c = { n: baseC.n, f: shiftedF }, an = anatomy(c.n);
    chObjs.push(c); curProgRoots.push(norm(an.R));
    if (!seen[deg]) {
      seen[deg] = true;
      cHtml += '<div class="chord-box"><small>Degré '+deg+'</small><strong>'+c.n+'</strong><div style="font-size:12px;">'+c.f+'</div><span class="deg d-R">R:'+an.R+'</span><span class="deg d-3">3:'+an.T+'</span><span class="deg d-5">5:'+an.Q+'</span><span class="deg d-7">7:'+an.S+'</span></div>';
    }
  }
    lastProgState = { chObjs: chObjs, lvlLabel: lvlLabel, groove: patObj.groove };

 var tab = buildFullWidthTab(chObjs, lvlLabel, patObj.groove);

  curItem = {title: patObj.name + ' en ' + k + ' (' + bars + ' mes.)', meta: gObj.name + ' • ' + kd.modeLabel + ' • ' + lvlLabel, tab: tab, tip: gObj.tip};
  var h = '<div class="card"><span class="badge">'+patObj.name+'</span><span class="badge">'+kd.modeLabel+'</span><span class="badge">'+bars+' mes.</span><span class="badge">'+gObj.name+'</span><h2>'+patObj.name+' ('+k+' — '+kd.modeLabel+')</h2>';
  h += '<h3>1. Accords & Notes Cibles</h3><div>'+cHtml+'</div><h3>2. Tablature Complète ('+bars+' Mesures)</h3><div class="tab">'+tab+'</div>';
  h += buildFretboard('Gamme : ' + k + ' ' + kd.modeLabel, kd.scaleNotes, k);
  h += buildFretboard('Pentatonique / Blues de ' + k, kd.blues, k);
  h += '<div class="tone-tip">🎸 <strong>Réglage '+gObj.name+' :</strong> '+gObj.tip+'</div></div>';
  document.getElementById('prog-res').innerHTML = h;
}
function genExo(rnd) {
  var themes = new Array("Fingerpicking","Hybrid Picking","Bends & Vibrato","Double-Stops","Harmoniques","Voicings & Slap","Legato & Tapping","Sweep & Arpèges","Cocottes & Funk 16e","Octaves & Jazz","Aller-Retour (Alternate)","Slide & Open Tuning");
  if (rnd) {
    document.getElementById("ex-inst").value = pickRandom(new Array("Stratocaster","Les Paul","Acoustique"));
    document.getElementById("ex-lvl").value = pickRandom(new Array("Débutant","Intermédiaire","Avancé"));
    document.getElementById("ex-theme").value = pickRandom(themes);
  }
  var inst = document.getElementById("ex-inst").value, lvl = document.getElementById("ex-lvl").value, th = document.getElementById("ex-theme").value;
  var f = (inst === "Acoustique") ? 0 : (inst === "Stratocaster" ? pickRandom(new Array(3,5,7,8)) : pickRandom(new Array(7,9,10,12)));
  var f2 = f + 2, f3 = f + 3, f4 = f + 5, tapF = f + 12;
  var bpmEx = (lvl === "Débutant") ? "65-75 BPM" : (lvl === "Intermédiaire" ? "85-95 BPM" : "105-125 BPM");
  var shifts = new Array(0, 2, 3, 0), eL="e|", bL="B|", gL="G|", dL="D|", aL="A|", EL="E|", tip = "", fing = "";
  for (var m = 0; m < 4; m++) {
    var sh = shifts.slice(m).shift();
    if (th === "Fingerpicking") {
      fing = "Main droite : P (basses E/A/D), i (G), m (B), a (e)"; tip = "Basse alternée régulière au pouce en Palm Mute léger sur les 4 mesures.";
      eL+="-------"+(f+sh)+"---------|"; bL+="---"+(f+sh)+"---------"+(f2+sh)+"---|"; gL+="-----"+(f+sh)+"-------"+(f+sh)+"---|"; dL+="---"+(f+sh)+"-----"+(f2+sh)+"-----|"; aL+="-"+(f+sh)+"---------"+(f+sh)+"-----|"; EL+="-------"+(f+sh)+"---------|";
    } else if (th === "Hybrid Picking") {
      fing = "Médiator (basses) + Majeur (m) / Annulaire (a) sur cordes aiguës"; tip = "Pincez vers le haut avec l'annulaire pour faire claquer la note aiguë.";
      eL+="---"+(f4+sh)+"-----"+(f3+sh)+"---|"; bL+="-------"+(f2+sh)+"-----"+(f+sh)+"-|"; gL+="-----"+(f2+sh)+"---------|"; dL+="-"+(f+sh)+"-----"+(f2+sh)+"-----|"; aL+="---------"+(f+sh)+"-----|"; EL+="-----------------|";
    } else if (th === "Bends & Vibrato") {
      fing = "Main gauche : Doigts 1-2-3 réunis pour pousser la corde G"; tip = "Visez la justesse du ton entier (+2 cases) puis stabilisez le vibrato.";
      eL+="---------"+(f+sh)+"-----|"; bL+="---"+(f+sh)+"-"+(f3+sh)+"-----"+(f3+sh)+"~-|"; gL+="-"+(f2+sh)+"b"+(f4+sh)+"r"+(f2+sh)+"---------|"; dL+="-----------------|"; aL+="-----------------|"; EL+="-----------------|";
    } else if (th === "Double-Stops") {
      fing = "Main gauche : Index (1) et Majeur/Annulaire (2-3) en tierces/sixtes"; tip = "Gardez une pression constante pendant le glissé (/) et le retour (-).";
      eL+="-----------------|"; bL+="-"+(f+sh)+"/"+(f2+sh)+"---"+(f3+sh)+"-"+(f2+sh)+"---|"; gL+="-"+(f+sh)+"/"+(f2+sh)+"---"+(f3+sh)+"-"+(f2+sh)+"---|"; dL+="-----"+(f2+sh)+"-----"+(f+sh)+"-|"; aL+="-----------------|"; EL+="-----------------|";
    } else if (th === "Harmoniques") {
      fing = "Main gauche : Effleurement léger exactement au-dessus de la frette"; tip = "Relâchez le doigt gauche dès que la corde est pincée pour laisser résonner.";
      eL+="-----<12>----<7>-|"; bL+="---<12>----<7>---|"; gL+="-<12>----<5>-----|"; dL+="-----------------|"; aL+="-----------------|"; EL+="-----------------|";
    } else if (th === "Legato & Tapping") {
      fing = "Main gauche : 1-3-4 | Main droite : Index (t) sur la case +12"; tip = "Tapez perpendiculairement à la touche et tirez légèrement au relâcher (p).";
      eL+="-"+(f+sh)+"h"+(f3+sh)+"t"+(tapF+sh)+"p"+(f3+sh)+"p"+(f+sh)+"--|"; bL+="-------"+(f+sh)+"h"+(f3+sh)+"t"+(tapF+sh)+"p"+(f+sh)+"|"; gL+="-----------------|"; dL+="-----------------|"; aL+="-----------------|"; EL+="-----------------|";
    } else if (th === "Sweep & Arpèges") {
      fing = "Main gauche : 3-2-1-4 | Main droite : Un seul balayage fluide bas/haut"; tip = "Soulevez chaque doigt gauche immédiatement après la note pour éviter le brouillard.";
      eL+="-----"+(f+sh)+"h"+(f4+sh)+"p"+(f+sh)+"-----|"; bL+="---"+(f2+sh)+"-------"+(f2+sh)+"---|"; gL+="-"+(f3+sh)+"-----------"+(f3+sh)+"-|"; dL+="-----------------|"; aL+="-----------------|"; EL+="-----------------|";
    } else if (th === "Cocottes & Funk 16e") {
      fing = "Main droite : Pendule continu 16e | Main gauche : Relâchement sur (x)"; tip = "Ne bloquez jamais le mouvement du poignet droit, même sur les notes étouffées.";
      eL+="-"+(f2+sh)+"-x-"+(f2+sh)+"-x-"+(f4+sh)+"-x-|"; bL+="-"+(f2+sh)+"-x-"+(f2+sh)+"-x-"+(f3+sh)+"-x-|"; gL+="-"+(f+sh)+"-x-"+(f+sh)+"-x-"+(f2+sh)+"-x-|"; dL+="-----------------|"; aL+="-----------------|"; EL+="-----------------|";
    } else if (th === "Octaves & Jazz") {
      fing = "Main gauche : Index (1) sur D et Auriculaire (4) sur B (G étouffée)"; tip = "La pulpe de l'index doit muter la corde de Sol (x) entre les deux notes.";
      eL+="-----------------|"; bL+="-"+(f2+sh)+"---"+(f4+sh)+"---"+(f2+sh)+"---|"; gL+="-x---x---x-------|"; dL+="-"+(f+sh)+"---"+(f2+sh)+"---"+(f+sh)+"---|"; aL+="-----------------|"; EL+="-----------------|";
    } else if (th === "Aller-Retour (Alternate)") {
      fing = "Main gauche : 1-2-3 strict (1 doigt par case) | Médiator : Bas-Haut strict"; tip = "Commencez lentement au métronome en veillant à l'égalité sonore des coups vers le haut.";
      eL+="-------"+(f+sh)+"-"+(f2+sh)+"-"+(f3+sh)+"---|"; bL+="---"+(f+sh)+"-"+(f2+sh)+"-"+(f3+sh)+"-----"+(f+sh)+"-|"; gL+="-"+(f+sh)+"-"+(f2+sh)+"-------------|"; dL+="-----------------|"; aL+="-----------------|"; EL+="-----------------|";
    } else if (th === "Slide & Open Tuning") {
      fing = "Main gauche : Bottleneck sur annulaire/auriculaire, index étouffe derrière"; tip = "Placez le tube pile au-dessus de la frette métallique (pas au milieu de la case).";
      eL+="-----------------|"; bL+="-"+(f+sh)+"/"+(f3+sh)+"~--"+(f4+sh)+"-"+(f2+sh)+"~-|"; gL+="-"+(f+sh)+"/"+(f3+sh)+"---"+(f4+sh)+"-"+(f2+sh)+"--|"; dL+="-----------------|"; aL+="-----------------|"; EL+="-----------------|";
    } else {
      fing = "Pouce droit (slap temps 2 & 4) + Doigts i-m-a sur accords enrichis"; tip = "Frappez sèchement les cordes avec la tranche du pouce droit sur les temps 2 et 4.";
      eL+="---"+(f2+sh)+"--x--"+(f4+sh)+"--x-|"; bL+="---"+(f2+sh)+"--x--"+(f3+sh)+"--x-|"; gL+="---"+(f+sh)+"---x--"+(f2+sh)+"--x-|"; dL+="-----------------|"; aL+="-"+(f+sh)+"-------"+(f+sh)+"-----|"; EL+="-----------------|";
    }
  }
    exoBpm = (lvl === "Débutant") ? 70 : (lvl === "Intermédiaire" ? 90 : 115);
  if (!aMode) { bpm = exoBpm; document.getElementById("bpm-lbl").textContent = bpm + " BPM"; }

  var rootNote = NOTES.slice((4 + f) % 12).shift();
  var fifthNote = NOTES.slice((4 + f + 7) % 12).shift();
  var qualExo = (th === "Bends & Vibrato" || th === "Double-Stops" || th === "Slide & Open Tuning") ? "7" : "m7";
  var c1F = getVariedChordShape(rootNote, qualExo, false);
  var c2F = getVariedChordShape(fifthNote, "7", true);
  var an1 = anatomy(rootNote + qualExo), an2 = anatomy(fifthNote + "7");
  curProgRoots = new Array(norm(rootNote), norm(fifthNote));

  var chordCards =
    '<div class="chord-box"><small>Accord Tonique</small><strong>' + rootNote + qualExo + '</strong><div style="font-size:12px;">' + c1F + '</div><span class="deg d-R">R:' + an1.R + '</span><span class="deg d-3">3:' + an1.T + '</span><span class="deg d-5">5:' + an1.Q + '</span></div>' +
    '<div class="chord-box"><small>Accord Relance</small><strong>' + fifthNote + '7</strong><div style="font-size:12px;">' + c2F + '</div><span class="deg d-R">R:' + an2.R + '</span><span class="deg d-3">3:' + an2.T + '</span><span class="deg d-5">5:' + an2.Q + '</span></div>';

  var tab = "Mes. 1           | Mes. 2 (+2)      | Mes. 3 (+3)      | Mes. 4 (Résol.)\n" + eL + "\n" + bL + "\n" + gL + "\n" + dL + "\n" + aL + "\n" + EL;
  curItem = {title: th + " en Pos. " + f + " (" + exoBpm + " BPM)", meta: inst + " • " + lvl + " • " + exoBpm + " BPM", tab: tab, tip: tip};
  document.getElementById("exo-res").innerHTML =
    '<div class="card"><span class="badge">' + th + '</span><span class="badge">' + inst + '</span><span class="badge">' + lvl + '</span><span class="badge">' + exoBpm + ' BPM</span>' +
    '<h2>' + th + ' — Étude Complète 4 Mesures (Pos. ' + f + ')</h2>' +
    '<h3>1. Accords d\'Accompagnement (Tonalité de ' + rootNote + ')</h3><div>' + chordCards + '</div>' +
    '<p style="font-size:12px;color:#0284c7;font-weight:bold;margin:8px 0;">🖐️ ' + fing + '</p>' +
    '<h3>2. Tablature de l\'Étude</h3><div class="tab">' + tab + '</div>' +
    '<div class="tone-tip">💡 ' + tip + '</div></div>';
}


var aCtx = null, aMode = null, aInt = null, bpm = 90, step = 0, sInt = null, refOsc = null, tunAnim = null;
function initACtx() { if (!aCtx) aCtx = new (window.AudioContext || window.webkitAudioContext)(); if (aCtx.state === 'suspended') aCtx.resume(); }
function chgBpm(d) { bpm = Math.max(40, Math.min(200, bpm + d)); document.getElementById("bpm-lbl").textContent = bpm + " BPM"; if (aMode) { var m = aMode; stopAudio(); toggleAudio(m); } }
function stopAudio() { clearInterval(aInt); aInt = null; aMode = null; document.getElementById("btn-play").textContent = "▶ Basse+Batterie"; document.getElementById("btn-drum").textContent = "🥁 Batterie"; document.getElementById("btn-met").textContent = "⏱ Métro"; }

function playNoise(t, dur, freq, type, vol) {
  var bufSize = Math.floor(aCtx.sampleRate * dur), buf = aCtx.createBuffer(1, bufSize, aCtx.sampleRate), data = buf.getChannelData(0);
  for (var i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
  var src = aCtx.createBufferSource(), flt = aCtx.createBiquadFilter(), g = aCtx.createGain();
  src.buffer = buf; flt.type = type; flt.frequency.value = freq;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(flt); flt.connect(g); g.connect(aCtx.destination);
  src.start(t); src.stop(t + dur);
}

function playElectricBass(t, freq, dur) {
  var sub = aCtx.createOscillator(), body = aCtx.createOscillator(), flt = aCtx.createBiquadFilter(), g = aCtx.createGain();
  sub.type = 'sine'; sub.frequency.value = freq;
  body.type = 'triangle'; body.frequency.value = freq;
  flt.type = 'lowpass';
  flt.frequency.setValueAtTime(480, t);
  flt.frequency.exponentialRampToValueAtTime(140, t + 0.14);
  g.gain.setValueAtTime(0.001, t);
  g.gain.linearRampToValueAtTime(0.38, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  sub.connect(flt); body.connect(flt); flt.connect(g); g.connect(aCtx.destination);
  sub.start(t); body.start(t); sub.stop(t + dur); body.stop(t + dur);
}

function toggleAudio(mode) {
  initACtx();
  if (aMode === mode) { stopAudio(); return; }
  stopAudio(); aMode = mode; step = 0;
  if (mode === 'band') document.getElementById("btn-play").textContent = "⏹ Stop";
  if (mode === 'drum') document.getElementById("btn-drum").textContent = "⏹ Stop";
  if (mode === 'met') document.getElementById("btn-met").textContent = "⏹ Stop";
  var stEl = document.getElementById('styleSelect');
  var pat = (stEl && PATS[stEl.value]) ? PATS[stEl.value] : { groove: 'rock' };
  var grv = pat.groove || 'rock';
  var KICK = { rock:'10001000', blues:'10010000', funk:'10010100', bossa:'10011001', reggae:'00001000', jazz:'10001000' };
  var SNARE= { rock:'00100010', blues:'00100010', funk:'00100010', bossa:'01001010', reggae:'00001000', jazz:'00000010' };
  var HAT  = { rock:'10101010', blues:'10110110', funk:'11101110', bossa:'10101010', reggae:'01010101', jazz:'10111011' };
  var BASS = { rock:'10001000', blues:'10010010', funk:'10100100', bossa:'10011001', reggae:'00100100', jazz:'10101010' };
  var BMULT= { rock:new Array(1,1), blues:new Array(1,1.25,1.5), funk:new Array(1,2,1.5), bossa:new Array(1,1.5,1,0.75), reggae:new Array(1,1.5), jazz:new Array(1,1.25,1.5,1.75) };

  aInt = setInterval(function() {
    var t = aCtx.currentTime, s8 = step % 8;
    if (mode === 'met') {
      if (s8 % 2 === 0) {
        var o = aCtx.createOscillator(), g = aCtx.createGain();
        o.frequency.value = (s8 === 0) ? 880 : 440; g.gain.setValueAtTime(0.12, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        o.connect(g); g.connect(aCtx.destination); o.start(t); o.stop(t + 0.05);
      }
    } else {
      if (HAT[grv].charAt(s8) === '1') playNoise(t, grv === 'jazz' ? 0.08 : 0.03, grv === 'jazz' ? 4500 : 7500, 'highpass', (s8 % 2 === 0) ? 0.06 : 0.03);
      if (KICK[grv].charAt(s8) === '1') {
        var k = aCtx.createOscillator(), kg = aCtx.createGain();
        k.frequency.setValueAtTime(grv === 'reggae' ? 105 : 130, t); k.frequency.exponentialRampToValueAtTime(38, t + 0.14);
        kg.gain.setValueAtTime(0.42, t); kg.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        k.connect(kg); kg.connect(aCtx.destination); k.start(t); k.stop(t + 0.15);
      }
      if (SNARE[grv].charAt(s8) === '1') playNoise(t, grv === 'bossa' ? 0.04 : 0.11, grv === 'bossa' ? 2000 : 1100, 'bandpass', grv === 'bossa' ? 0.14 : 0.20);
      if (mode === 'band' && BASS[grv].charAt(s8) === '1') {
        var rn = curProgRoots.slice(Math.floor(step / 8) % curProgRoots.length).shift() || "C";
        var mults = BMULT[grv], f = (BASS_FREQ[rn] || 65.41) * mults.slice(step % mults.length).shift();
        playElectricBass(t, f, (60 / bpm) * 0.85);
      }
    }
    step++;
  }, (60 / bpm) * 250);
}

function toggleScroll() {
  var btn = document.getElementById("btn-scr");
  if (sInt) { clearInterval(sInt); sInt = null; btn.textContent = "⬇ Défil."; return; }
  btn.textContent = "⏸ Stop"; sInt = setInterval(function() { window.scrollBy(0, 1); }, 45);
}
function playRef(freq) { initACtx(); stopRef(); refOsc = aCtx.createOscillator(); var g = aCtx.createGain(); refOsc.frequency.value = freq; g.gain.value = 0.15; refOsc.connect(g); g.connect(aCtx.destination); refOsc.start(); }
function stopRef() { if (refOsc) { try { refOsc.stop(); } catch(e) {} refOsc = null; } }
function initTunerUI() {
  var ns = new Array({n:"E2 (6e)",f:82.41},{n:"A2 (5e)",f:110},{n:"D3 (4e)",f:146.83},{n:"G3 (3e)",f:196},{n:"B3 (2e)",f:246.94},{n:"E4 (1re)",f:329.63},{n:"La 440 Hz",f:440});
  var h = '<div style="text-align:center;padding:12px;background:#0f172a;border-radius:10px;border:1px solid #334155;margin-bottom:12px;">';
  h += '<button type="button" class="btn" onclick="startMicTuner()">🎙 Activer Accordeur Micro</button>';
  h += '<div id="tun-note" style="font-size:36px;font-weight:bold;color:#38bdf8;margin:8px 0;">--</div>';
  h += '<div style="position:relative;height:18px;background:#1e293b;border-radius:9px;border:1px solid #475569;margin:8px auto;max-width:320px;">';
  h += '<div style="position:absolute;left:50%;top:0;bottom:0;width:2px;background:#10b981;"></div>';
  h += '<div id="tun-pin" style="position:absolute;left:50%;top:2px;width:12px;height:12px;margin-left:-6px;border-radius:50%;background:#f59e0b;transition:left 0.08s;"></div></div>';
  h += '<div id="tun-cents" style="font-size:12px;color:#94a3b8;">Jouez une corde à vide près du micro</div></div>';
  for (var i = 0; i < ns.length; i++) h += '<button type="button" class="btn btn-sec" style="margin:3px;" onclick="playRef('+ns.slice(i).shift().f+')">'+ns.slice(i).shift().n+'</button>';
  h += '<button type="button" class="btn btn-del" style="margin:3px;" onclick="stopRef()">⏹ Stop</button>';
  document.getElementById("tun-ui").innerHTML = h;
}

function startMicTuner() {
  initACtx();
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { alert("Micro non supporté sur ce navigateur."); return; }
  navigator.mediaDevices.getUserMedia({ audio: true }).then(function(stream) {
    var src = aCtx.createMediaStreamSource(stream), an = aCtx.createAnalyser();
    an.fftSize = 2048; src.connect(an);
    var buf = new Float32Array(an.fftSize);
    function loop() {
      an.getFloatTimeDomainData(buf);
      var rms = 0; for (var i = 0; i < buf.length; i++) rms += buf[i] * buf[i];
      if (Math.sqrt(rms / buf.length) > 0.015) {
        var bestO = -1, bestC = 0;
        for (var o = 60; o < 600; o++) {
          var corr = 0; for (var j = 0; j < 700; j++) corr += buf[j] * buf[j + o];
          if (corr > bestC) { bestC = corr; bestO = o; }
        }
        if (bestO > 0) {
          var freq = aCtx.sampleRate / bestO, midi = Math.round(12 * (Math.log(freq / 440) / Math.LN2)) + 69;
          var exact = 440 * Math.pow(2, (midi - 69) / 12), cents = Math.round(1200 * Math.log(freq / exact) / Math.LN2);
          var nName = NOTES.slice(((midi % 12) + 12) % 12).shift(), pin = document.getElementById("tun-pin"), nEl = document.getElementById("tun-note");
          nEl.textContent = nName; pin.style.left = Math.max(5, Math.min(95, 50 + cents)) + "%";
          var ok = Math.abs(cents) <= 5;
          pin.style.background = ok ? "#10b981" : "#f59e0b"; nEl.style.color = ok ? "#10b981" : "#38bdf8";
          document.getElementById("tun-cents").textContent = (ok ? "✓ Accordé ! (" : (cents > 0 ? "Trop haut +" : "Trop bas ")) + cents + " cents)";
        }
      }
      tunAnim = requestAnimationFrame(loop);
    }
    loop();
  }).catch(function() { alert("Autorisez l'accès au micro dans Safari."); });
}

function saveFav() { if (!curItem) return; favs.unshift(curItem); try { localStorage.setItem("glab_f", JSON.stringify(favs)); } catch(e) {} renderFavs(); alert("Sauvegardé !"); }
function delFav(i) { favs.splice(i,1); try { localStorage.setItem("glab_f", JSON.stringify(favs)); } catch(e) {} renderFavs(); }
function renderFavs() {
  document.getElementById("fav-n").textContent = favs.length;
  var h = "";
  for (var i = 0; i < favs.length; i++) {
    var f = favs.slice(i).shift();
    h += '<div class="card"><span class="badge">'+f.meta+'</span><h2>'+f.title+'</h2><div class="tab">'+f.tab+'</div><p style="font-size:13px;">'+f.tip+'</p><button type="button" class="btn btn-del no-print" onclick="delFav('+i+')">🗑️ Supprimer</button></div>';
  }
  document.getElementById("fav-list").innerHTML = h || '<div class="card"><p>Aucun favori enregistré.</p></div>';
}

function buildAllUI() {
  var pBox = document.getElementById('prog-controls');
  if (pBox) {
    var ks = new Array('C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'), kOpt = '';
    for (var i = 0; i < ks.length; i++) kOpt += '<option value="' + ks.slice(i).shift() + '">' + ks.slice(i).shift() + '</option>';
    pBox.innerHTML =
      '<label>Guitare</label><div class="ctrl-row"><select id="instSelect" onchange="updateGuitarTip()"><option value="strat">Fender Stratocaster</option><option value="lespaul">Gibson Les Paul</option><option value="acoustic">Acoustique Folk</option><option value="nylon">Guitare Nylon</option></select><button type="button" class="lock-btn" id="lock-inst" onclick="toggleLock(this.id.slice(5))">🔓</button></div>' +
      '<label>Niveau</label><div class="ctrl-row"><select id="lvlSelect"><option value="deb">Débutant</option><option value="int">Intermédiaire</option><option value="adv">Avancé</option></select><button type="button" class="lock-btn" id="lock-lvl" onclick="toggleLock(this.id.slice(5))">🔓</button></div>' +
      '<label>Tonalité & Mode</label><div class="ctrl-row"><select id="keySelect">' + kOpt + '</select><select id="modeSelect"><option value="auto">Mode du Style (Auto)</option><option value="major">Majeur</option><option value="minor">Mineur</option><option value="blues">Blues</option><option value="modal">Modal</option></select><button type="button" class="lock-btn" id="lock-key" onclick="toggleLock(this.id.slice(5))">🔓</button></div>' +
      '<label>Style & Artiste (32 réf.)</label><div class="ctrl-row"><select id="styleSelect"></select><button type="button" class="lock-btn" id="lock-style" onclick="toggleLock(this.id.slice(5))">🔓</button></div>' +
      '<div id="guitarTipBox" class="tone-tip"></div>' +
      '<label>Mesures</label><select id="pg-bars"><option value="4">4 mesures</option><option value="8" selected>8 mesures</option><option value="12">12 mesures</option><option value="16">16 mesures</option></select>' +
      '<div style="margin-top:12px;"><button type="button" class="btn" onclick="genProg(false)">✨ Générer</button> <button type="button" class="btn btn-rand" onclick="genProg(true)">🎲 Aléatoire</button> <button type="button" class="btn btn-sec" onclick="saveFav()">⭐ Sauvegarder</button> <button type="button" class="btn btn-sec" onclick="window.print()">🖨 Imprimer</button></div>';
  }
  var eBox = document.getElementById('exo-controls');
  if (eBox) {
    var ths = new Array("Fingerpicking","Hybrid Picking","Bends & Vibrato","Double-Stops","Harmoniques","Voicings & Slap","Legato & Tapping","Sweep & Arpèges","Cocottes & Funk 16e","Octaves & Jazz","Aller-Retour (Alternate)","Slide & Open Tuning"), tOpt = '';
    for (var j = 0; j < ths.length; j++) tOpt += '<option value="' + ths.slice(j).shift() + '">' + ths.slice(j).shift() + '</option>';
    eBox.innerHTML =
      '<label>Instrument</label><select id="ex-inst"><option value="Stratocaster">Fender Stratocaster</option><option value="Les Paul">Gibson Les Paul</option><option value="Acoustique">Acoustique Folk</option></select>' +
      '<label>Niveau</label><select id="ex-lvl"><option value="Débutant">Débutant</option><option value="Intermédiaire">Intermédiaire</option><option value="Avancé">Avancé</option></select>' +
      '<label>Thème Technique (12 études)</label><select id="ex-theme">' + tOpt + '</select>' +
      '<div style="margin-top:12px;"><button type="button" class="btn" onclick="genExo(false)">✨ Générer</button> <button type="button" class="btn btn-rand" onclick="genExo(true)">🎲 Aléatoire</button> <button type="button" class="btn btn-sec" onclick="saveFav()">⭐ Sauvegarder</button> <button type="button" class="btn btn-sec" onclick="window.print()">🖨 Imprimer</button></div>';
  }
  var sel = document.getElementById('styleSelect');
  if (sel) {
    var keys = Object.keys(PATS);
    for (var k = 0; k < keys.length; k++) {
      var key = keys.slice(k).shift(), opt = document.createElement('option');
      opt.value = key; opt.textContent = (k + 1) + '. ' + PATS[key].name;
      sel.appendChild(opt);
    }
    updateGuitarTip();
  }
}

var lastW = window.innerWidth;
window.onresize = function() {
  if (window.innerWidth === lastW) return;
  lastW = window.innerWidth;
  if (lastProgState && document.getElementById("p-prog").className.indexOf("active") !== -1) {
    var tabEl = document.querySelector("#prog-res .tab");
    if (tabEl) tabEl.textContent = buildFullWidthTab(lastProgState.chObjs, lastProgState.lvlLabel, lastProgState.groove);
  }
};

buildAllUI();
initTunerUI();
renderFavs();
genProg(false);
genExo(false);
