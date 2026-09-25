/* ================= EDITABLE CONFIG ================= */
const CONFIG = {
  groom: "Shifan",
  bride: "Nasrin",
  weddingISO: "2026-10-10T12:00:00",
  dateDisplay: "10th October 2026",
  timeDisplay: "12:00 PM",
  venueName: "Nasrin's Home",
  venueAddress: "Nasrin's Home, Negombo, Sri Lanka",
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
document.getElementById('venueDate').textContent = 'Saturday, ' + CONFIG.dateDisplay;
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
      sfxGain = ctx.createGain(); sfxGain.gain.value = 0.7; sfxGain.connect(master);
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

  function playPopperSound(){
    ensureCtx();
    const t = ctx.currentTime;

    const snapOsc = ctx.createOscillator();
    const snapGain = ctx.createGain();
    snapOsc.type = 'triangle';
    snapOsc.frequency.setValueAtTime(320, t);
    snapOsc.frequency.exponentialRampToValueAtTime(35, t + 0.12);
    snapGain.gain.setValueAtTime(1.0, t);
    snapGain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
    snapOsc.connect(snapGain);
    snapGain.connect(sfxGain);
    snapOsc.start(t);
    snapOsc.stop(t + 0.14);

    const burstSrc = ctx.createBufferSource();
    burstSrc.buffer = noiseBuffer;
    const burstFilter = ctx.createBiquadFilter();
    burstFilter.type = 'highpass';
    burstFilter.frequency.setValueAtTime(1200, t);
    const burstGain = ctx.createGain();
    burstGain.gain.setValueAtTime(0.7, t);
    burstGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    burstSrc.connect(burstFilter);
    burstFilter.connect(burstGain);
    burstGain.connect(sfxGain);
    burstSrc.start(t);
    burstSrc.stop(t + 0.36);

    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const startTime = t + 0.08 + (i * 0.09);
      osc.start(startTime);
      g.gain.setValueAtTime(0.35, startTime);
      g.gain.exponentialRampToValueAtTime(0.001, startTime + 0.9);
      osc.connect(g);
      g.connect(sfxGain);
      osc.stop(startTime + 0.95);
    });
  }

  return {ensureCtx, startMusic, stopMusic, toggleMusic, scratchStart, scratchMove, scratchStop, playPopperSound,
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
  g.addColorStop(0, '#f5e2b3'); 
  g.addColorStop(0.3, '#d4af37'); 
  g.addColorStop(0.7, '#aa771c'); 
  g.addColorStop(1, '#816024');
  ctx.fillStyle = g; ctx.fillRect(0, 0, r.width, r.height);
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
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
  if (cleared / total > 0.40){
    scratchDone = true;
    AudioEngine.scratchStop();
    canvas.style.transition = 'opacity .7s ease';
    canvas.style.opacity = '0';
    scratchHint.textContent = '✦ your special day is revealed ✦';
    
    triggerPoppers();
    AudioEngine.playPopperSound();
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
  setTimeout(() => popup.classList.remove('show'), 2900);
  popup.addEventListener('click', () => popup.classList.remove('show'), {once: true});
}

/* ================= CELEBRATION PARTY POPPERS ================= */
function triggerPoppers(){
  const colors = ['#f5e2b3', '#d4af37', '#ffffff', '#e6b9ac', '#ffd97d', '#c9a24c'];
  const confettiCount = 75;

  const origins = [
    { x: window.innerWidth * 0.1, y: window.innerHeight * 0.95, angleMin: -80, angleMax: -20 },
    { x: window.innerWidth * 0.9, y: window.innerHeight * 0.95, angleMin: -160, angleMax: -100 }
  ];

  origins.forEach(origin => {
    for (let i = 0; i < confettiCount; i++) {
      const el = document.createElement('div');
      el.className = 'confetti-piece';

      const isRibbon = Math.random() > 0.65;
      const w = isRibbon ? 4 + Math.random() * 4 : 8 + Math.random() * 8;
      const h = isRibbon ? 16 + Math.random() * 14 : 7 + Math.random() * 7;
      el.style.width = w + 'px';
      el.style.height = h + 'px';
      el.style.background = colors[i % colors.length];
      el.style.borderRadius = isRibbon ? '3px' : (Math.random() > 0.5 ? '50%' : '1px');
      el.style.boxShadow = '0 0 10px rgba(212,175,55,0.7)';

      const angle = (origin.angleMin + Math.random() * (origin.angleMax - origin.angleMin)) * (Math.PI / 180);
      const velocity = 550 + Math.random() * 650;
      const destX = Math.cos(angle) * velocity;
      const destY = Math.sin(angle) * velocity;
      const rotZ = Math.floor(Math.random() * 1080) - 540;
      const rotX = Math.floor(Math.random() * 720);
      const duration = 2400 + Math.random() * 1200;

      el.style.left = origin.x + 'px';
      el.style.top = origin.y + 'px';
      document.body.appendChild(el);

      el.animate([
        { transform: 'translate(0, 0) rotate(0deg) scale(0.6)', opacity: 1 },
        { transform: `translate(${destX * 0.6}px, ${destY}px) rotate(${rotZ * 0.5}deg) rotateX(${rotX * 0.5}deg) scale(1.1)`, opacity: 1, offset: 0.4 },
        { transform: `translate(${destX}px, ${destY + 450}px) rotate(${rotZ}deg) rotateX(${rotX}deg) scale(0.85)`, opacity: 0, offset: 1 }
      ], {
        duration: duration,
        easing: 'cubic-bezier(0.18, 0.89, 0.32, 1.28)',
        fill: 'forwards'
      });

      setTimeout(() => el.remove(), duration + 100);
    }
  });
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

/* ================= SCROLL CUE NAVIGATION ================= */
document.querySelectorAll('.scroll-cue').forEach(cue => {
  cue.addEventListener('click', () => {
    const currentSection = cue.closest('section');
    const nextSection = currentSection ? currentSection.nextElementSibling : null;
    if (nextSection && nextSection.tagName.toLowerCase() === 'section') {
      nextSection.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

/* ================= HEART TALES MODAL HANDLER ================= */
const studioModal = document.getElementById('studioModal');
const studioBadgeBtn = document.getElementById('studioBadgeBtn');
const closeStudioBtn = document.getElementById('closeStudioBtn');
const closeStudioBackdrop = document.getElementById('closeStudioBackdrop');

function toggleStudioModal(show) {
  if (!studioModal) return;
  if (show) {
    studioModal.classList.add('open');
  } else {
    studioModal.classList.remove('open');
  }
}

if (studioBadgeBtn) {
  studioBadgeBtn.addEventListener('click', () => toggleStudioModal(true));
}
if (closeStudioBtn) {
  closeStudioBtn.addEventListener('click', () => toggleStudioModal(false));
}
if (closeStudioBackdrop) {
  closeStudioBackdrop.addEventListener('click', () => toggleStudioModal(false));
}