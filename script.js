/* ================= EDITABLE CONFIG ================= */
const CONFIG = {
  groom: "Shifan",
  bride: "Nasrin",
  weddingISO: "2027-09-19T12:00:00",
  dateDisplay: "19th September 2027",
  timeDisplay: "12:00 PM",
  venueName: "Nasrin's Home",
  venueAddress: "Nasrin's Home, Negombo, Sri Lanka", // edit to real address
  mapsDirectionsLink: "https://www.google.com/maps/search/?api=1&query=Negombo+Sri+Lanka",
  message: "Two hearts, one journey. We would be honoured to have you beside us as we begin our forever — surrounded by the people who mean the most.",
  musicSrc: "assets/music.mp3"
};

// Populate editable text from CONFIG
document.getElementById('dateTagline').textContent = CONFIG.dateDisplay + ' · ' + CONFIG.timeDisplay;
document.getElementById('messageText').textContent = CONFIG.message;
document.getElementById('scratchDate').textContent = CONFIG.dateDisplay.toUpperCase();
document.getElementById('scratchTime').textContent = CONFIG.timeDisplay;
document.getElementById('venueName').textContent = CONFIG.venueName;
document.getElementById('venueDate').textContent = 'Sunday, ' + CONFIG.dateDisplay;
document.getElementById('venueTime').textContent = CONFIG.timeDisplay + ' onwards';
document.getElementById('directionsBtn').href = CONFIG.mapsDirectionsLink;
document.getElementById('mapEmbed').src = 'https://www.google.com/maps?q=' + encodeURIComponent(CONFIG.venueAddress) + '&output=embed';
if (CONFIG.musicSrc) document.getElementById('bgm').src = CONFIG.musicSrc;

/* ================= AUDIO ENGINE ================= */
const AudioEngine = (() => {
  let ctx, master, musicGain, sfxGain, noiseBuffer;
  let musicNodes = [], musicPlaying = false;
  let scratchSource = null, scratchGain = null, scratchFilter = null;

  function ensureCtx(){
    if (!ctx){
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain(); master.gain.value = 1; master.connect(ctx.destination);
      musicGain = ctx.createGain(); musicGain.gain.value = 0.35; musicGain.connect(master);
      sfxGain = ctx.createGain(); sfxGain.gain.value = 0.6; sfxGain.connect(master);
      noiseBuffer = makeNoise();
    }
    if (ctx.state === 'suspended') ctx.resume();
  }

  function makeNoise(){
    const size = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, size, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < size; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  function startMusic(){
    ensureCtx();
    if (musicPlaying) return;
    musicPlaying = true;
    const notes = [261.63, 329.63, 392.0, 523.25];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = freq;
      const g = ctx.createGain(); g.gain.value = 0;
      osc.connect(g); g.connect(musicGain); osc.start();
      g.gain.linearRampToValueAtTime(0.14 / (i * 0.6 + 1), ctx.currentTime + 2.5);
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.06 + i * 0.015;
      const lfoGain = ctx.createGain(); lfoGain.gain.value = 0.025;
      lfo.connect(lfoGain); lfoGain.connect(g.gain); lfo.start();
      musicNodes.push({osc, g, lfo});
    });
  }

  function stopMusic(){
    const t = ctx.currentTime;
    musicNodes.forEach(n => {
      n.g.gain.linearRampToValueAtTime(0, t + 0.6);
      n.osc.stop(t + 0.7); n.lfo.stop(t + 0.7);
    });
    musicNodes = []; musicPlaying = false;
  }

  function toggleMusic(){ ensureCtx(); musicPlaying ? stopMusic() : startMusic(); return musicPlaying; }

  function scratchStart(){
    ensureCtx();
    if (scratchSource) return;
    scratchSource = ctx.createBufferSource();
    scratchSource.buffer = noiseBuffer; scratchSource.loop = true;
    scratchFilter = ctx.createBiquadFilter();
    scratchFilter.type = 'bandpass'; scratchFilter.frequency.value = 1500; scratchFilter.Q.value = 0.8;
    scratchGain = ctx.createGain(); scratchGain.gain.value = 0;
    scratchSource.connect(scratchFilter); scratchFilter.connect(scratchGain); scratchGain.connect(sfxGain);
    scratchSource.start();
    scratchGain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
  }

  function scratchMove(speed){
    if (!scratchFilter) return;
    const f = 1000 + Math.min(speed, 50) * 35;
    scratchFilter.frequency.setTargetAtTime(f, ctx.currentTime, 0.03);
  }

  function scratchStop(){
    if (!scratchSource) return;
    scratchGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);
    const src = scratchSource;
    setTimeout(() => { try { src.stop(); } catch(e){} }, 220);
    scratchSource = null; scratchGain = null; scratchFilter = null;
  }

  function playReveal(){
    ensureCtx();
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = freq;
      const g = ctx.createGain(); g.gain.value = 0;
      osc.connect(g); g.connect(sfxGain);
      const t = ctx.currentTime + i * 0.12;
      osc.start(t);
      g.gain.linearRampToValueAtTime(0.3, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
      osc.stop(t + 1);
    });
  }

  return {ensureCtx, startMusic, stopMusic, toggleMusic, scratchStart, scratchMove, scratchStop, playReveal,
    get musicPlaying(){ return musicPlaying; }};
})();

/* ================= ENVELOPE OPEN ================= */
const envelopeScreen = document.getElementById('envelopeScreen');
const envelopeCard = document.getElementById('envelopeCard');
const curtainL = document.getElementById('curtainL');
const curtainR = document.getElementById('curtainR');
const flash = document.getElementById('flash');
const bgm = document.getElementById('bgm');
let opened = false;

function openInvitation(){
  if (opened) return; opened = true;
  AudioEngine.ensureCtx();
  envelopeCard.classList.add('breaking');
  setTimeout(() => {
    envelopeCard.classList.add('zoom');
    flash.classList.add('go');
    if (CONFIG.musicSrc) { bgm.play().catch(()=>{}); }
    else { AudioEngine.startMusic(); }
    document.getElementById('musicBtn').classList.add('playing');
  }, 500);
  setTimeout(() => { envelopeScreen.classList.add('hidden'); }, 1350);
  setTimeout(() => {
    curtainL.classList.add('open');
    curtainR.classList.add('open');
  }, 1500);
  setTimeout(() => { curtainL.style.display = 'none'; curtainR.style.display = 'none'; }, 2900);
}
envelopeCard.addEventListener('click', openInvitation);
envelopeCard.addEventListener('touchend', (e) => { e.preventDefault(); openInvitation(); }, {passive: false});

/* ================= MUSIC TOGGLE ================= */
const musicBtn = document.getElementById('musicBtn');
musicBtn.addEventListener('click', () => {
  if (CONFIG.musicSrc){
    if (bgm.paused){ bgm.play().catch(()=>{}); musicBtn.classList.add('playing'); }
    else { bgm.pause(); musicBtn.classList.remove('playing'); }
  } else {
    const playing = AudioEngine.toggleMusic();
    musicBtn.classList.toggle('playing', playing);
  }
});

/* ================= SCRATCH TO REVEAL ================= */
const frame = document.getElementById('scratchFrame');
const canvas = document.getElementById('scratchCanvas');
const ctx = canvas.getContext('2d');
const scratchHint = document.getElementById('scratchHint');
let scratchDone = false;

function sizeCanvas(){
  const r = frame.getBoundingClientRect();
  canvas.width = r.width; canvas.height = r.height;
  const g = ctx.createLinearGradient(0, 0, r.width, r.height);
  g.addColorStop(0, '#f2dc9b'); 
  g.addColorStop(0.3, '#d4af37'); 
  g.addColorStop(0.7, '#aa8238'); 
  g.addColorStop(1, '#816024');
  ctx.fillStyle = g; ctx.fillRect(0, 0, r.width, r.height);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = '600 13px Cormorant Garamond, serif';
  ctx.letterSpacing = '2px';
  ctx.textAlign = 'center';
  ctx.fillText('✦  SCRATCH TO REVEAL  ✦', r.width / 2, r.height / 2 + 4);
}
window.addEventListener('resize', sizeCanvas);
setTimeout(sizeCanvas, 50);

let scratching = false;
let lastPos = null, lastTime = 0;
function scratchAt(x, y){
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath(); ctx.arc(x, y, 26, 0, Math.PI * 2); ctx.fill();
}
function getPos(e){
  const r = canvas.getBoundingClientRect();
  const t = e.touches ? e.touches[0] : e;
  return {x: t.clientX - r.left, y: t.clientY - r.top};
}
function checkCleared(){
  if (scratchDone) return;
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let cleared = 0, total = 0;
  for (let i = 3; i < data.length; i += 4 * 20){ total++; if(data[i] < 50) cleared++; }
  if (cleared / total > 0.42){
    scratchDone = true;
    AudioEngine.scratchStop();
    canvas.style.transition = 'opacity .7s ease';
    canvas.style.opacity = '0';
    scratchHint.textContent = '✦ your special day is revealed ✦';
    petalBurst();
    AudioEngine.playReveal();
    showRevealPopup();
  }
}
canvas.addEventListener('pointerdown', e => {
  scratching = true; AudioEngine.ensureCtx(); AudioEngine.scratchStart();
  const p = getPos(e); scratchAt(p.x, p.y); lastPos = p; lastTime = performance.now();
});
canvas.addEventListener('pointermove', e => {
  if (!scratching) return;
  const p = getPos(e); scratchAt(p.x, p.y);
  const now = performance.now();
  if (lastPos){
    const dist = Math.hypot(p.x - lastPos.x, p.y - lastPos.y);
    const dt = Math.max(now - lastTime, 1);
    AudioEngine.scratchMove(dist / dt * 10);
  }
  lastPos = p; lastTime = now;
  checkCleared();
});
window.addEventListener('pointerup', () => {
  if (scratching){ scratching = false; AudioEngine.scratchStop(); checkCleared(); }
});

function showRevealPopup(){
  const popup = document.getElementById('revealPopup');
  document.getElementById('popSub').textContent = CONFIG.dateDisplay;
  popup.classList.add('show');
  setTimeout(() => popup.classList.remove('show'), 2800);
  popup.addEventListener('click', () => popup.classList.remove('show'), {once: true});
}

function petalBurst(){
  const colors = ['#f4decb', '#d4af37', '#ffffff', '#ffd97d'];
  for (let i = 0; i < 35; i++){
    const p = document.createElement('div');
    p.className = 'petal';
    const size = 6 + Math.random() * 9;
    p.style.left = (Math.random() * 100) + 'vw';
    p.style.width = size + 'px'; p.style.height = (size * 1.3) + 'px';
    p.style.background = colors[i % colors.length];
    p.style.borderRadius = '50% 0 50% 50%';
    p.style.boxShadow = '0 0 8px rgba(212,175,55,0.6)';
    const dur = 2.5 + Math.random() * 2.2, rot = (Math.random() * 720) - 360;
    p.animate([
      { transform: `translateY(0) rotate(0deg) scale(0.8)`, opacity: 0.95 },
      { transform: `translateY(${window.innerHeight + 50}px) rotate(${rot}deg) scale(1)`, opacity: 0 }
    ], { duration: dur * 1000, easing: 'cubic-bezier(.25,1,.5,1)' });
    document.body.appendChild(p);
    setTimeout(() => p.remove(), dur * 1000 + 50);
  }
}

/* ================= COUNTDOWN ================= */
const target = new Date(CONFIG.weddingISO).getTime();
function pad(n){ return String(n).padStart(2, '0'); }
function tickCountdown(){
  const diff = Math.max(0, target - Date.now());
  const d = Math.floor(diff / 864e5);
  const h = Math.floor(diff % 864e5 / 36e5);
  const m = Math.floor(diff % 36e5 / 6e4);
  const s = Math.floor(diff % 6e4 / 1000);
  document.getElementById('cdDays').textContent = pad(d);
  document.getElementById('cdHours').textContent = pad(h);
  document.getElementById('cdMins').textContent = pad(m);
  document.getElementById('cdSecs').textContent = pad(s);
}
tickCountdown(); setInterval(tickCountdown, 1000);