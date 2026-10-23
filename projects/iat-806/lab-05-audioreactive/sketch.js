p5.disableFriendlyErrors = true; // skip p5's per-call argument validation — big win at this scale

p5.disableFriendlyErrors = true; // skip p5's per-call argument validation — big win at this scale

// Ripple color: HSL(40, 100%, 50%) = RGB(255, 170, 0)
let rippleR = 255;
let rippleG = 170;
let rippleB = 0;

let balls = [];
let numberOfBalls = 7000;
// ...rest of the file unchanged
let ballScale = 1.1; // 1 = original size, 2 = double, 3 = triple, etc.

// Attraction point: starts at the center
let attractX, attractY;
let attractionRadius = 200;
let moveStep = 5;

// Remember the point's last position so we can tell when it actually moved
let prevAttractX = null;
let prevAttractY = null;

let keys = {
  w: false,
  a: false,
  s: false,
  d: false,
};

// Physical key codes -> our movement flags.
// event.code is the physical key, so it's the same on press and release,
// regardless of Shift, Caps Lock, or what other keys are held.
const keyMap = { KeyW: "w", KeyA: "a", KeyS: "s", KeyD: "d" };

window.addEventListener("keydown", (event) => {
  if (event.repeat) return; // ignore the OS auto-repeat while a key is held
  let k = keyMap[event.code];
  if (k) keys[k] = true;
});

window.addEventListener("keyup", (event) => {
  let k = keyMap[event.code];
  if (k) keys[k] = false;
});

// If the window loses focus, the browser never sends the keyup — reset everything
window.addEventListener("blur", () => {
  keys.w = keys.a = keys.s = keys.d = false;
});

// --- Audio-reactive additions ---
let audioEl; // the song, as a plain browser audio element
let audioCtx = null; // Web Audio engine, created on first click
let analyser; // FFT analyzer
let freqData; // frequency spectrum, refreshed every frame
let ripples = [];

// Beat detection settings
let bassLowHz = 20; // bottom of the bass band
let bassHighHz = 150; // top of the bass band (kick drum + bass guitar)
let beatThreshold = 1.3; // how far above the recent average counts as a beat (lower = more ripples)
let minBass = 0.01; // ignore near-silence
let beatCooldownMs = 250; // minimum time between ripples
let avgBass = 0;
let lastBeatTime = 0;

// Ripple-through-the-balls settings
let rippleSpeed = 6; // how fast the wave expands (px per frame)
let rippleFade = 4; // how fast it dies out (out of 255 per frame)
let rippleWidth = 20; // thickness of the wave band that affects balls (px)
let ripplePush = 4; // how hard the wave pushes balls outward
// --- end audio-reactive additions ---

function setup() {
  createCanvas(512, 512);
  background(16);
  noStroke();

  attractX = width / 2;
  attractY = height / 2;

  for (let i = 0; i < numberOfBalls; i++) {
    let ballX = random(width);
    let ballY = random(height);
    let BallColor = color(245, 215, random(255));
    let BallR = random(1, 4);
    let ball = new Ball(ballX, ballY, BallColor, BallR);
    balls.push(ball);
  }

  // --- Audio-reactive additions ---
  audioEl = new Audio("any-colour-you-like.mp3");
  audioEl.loop = true;
  audioEl.addEventListener(
    "canplaythrough",
    () => console.log("Song loaded OK"),
    { once: true },
  );
  audioEl.addEventListener("error", () =>
    console.error("Song FAILED to load:", audioEl.error),
  );
  // --- end audio-reactive additions ---
}

function draw() {
  background(16);

  if (keys.a) attractX -= moveStep;
  if (keys.d) attractX += moveStep;
  if (keys.w) attractY -= moveStep;
  if (keys.s) attractY += moveStep;

  attractX = constrain(attractX, 0, width);
  attractY = constrain(attractY, 0, height);

  // Only redo the distance/speed/color math when the point actually moved
  let attractMoved = attractX !== prevAttractX || attractY !== prevAttractY;
  if (attractMoved) {
    for (let ball of balls) {
      ball.updateAttraction();
    }
    prevAttractX = attractX;
    prevAttractY = attractY;
  }

  // --- Audio-reactive additions ---
  // Update the waves BEFORE the balls, so each ball sees this frame's wave positions
  detectBeat();

  for (let i = ripples.length - 1; i >= 0; i--) {
    ripples[i].update();
    if (ripples[i].isDone()) {
      ripples.splice(i, 1);
    }
  }
  // --- end audio-reactive additions ---

  for (let ball of balls) {
    ball.change(random(1, 4));
  }

  // Optional: watch actual fps in the console, basically free to leave on
  if (frameCount % 30 === 0) console.log(Math.round(frameRate()) + " fps");
}

// --- Audio-reactive additions ---
function mousePressed() {
  // Browsers only allow audio to start from a user action, so the
  // audio engine is created on the first click
  if (!audioCtx) setupAudioAnalysis();
  if (audioCtx.state === "suspended") audioCtx.resume();

  if (audioEl.paused) {
    audioEl.play();
  } else {
    audioEl.pause();
  }
}

function setupAudioAnalysis() {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let source = audioCtx.createMediaElementSource(audioEl);

  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 2048; // ~21 Hz per frequency bin, fine enough to isolate the bass
  analyser.smoothingTimeConstant = 0.2; // low value = reacts quickly to drum hits

  // song -> analyser -> speakers
  source.connect(analyser);
  analyser.connect(audioCtx.destination);

  freqData = new Float32Array(analyser.frequencyBinCount);
}

// Average strength of the 20–150 Hz band, as a linear level (roughly 0–1)
function getBassLevel() {
  analyser.getFloatFrequencyData(freqData); // values in decibels

  let binHz = audioCtx.sampleRate / analyser.fftSize;
  let startBin = Math.max(1, Math.floor(bassLowHz / binHz));
  let endBin = Math.ceil(bassHighHz / binHz);

  let sum = 0;
  for (let i = startBin; i <= endBin; i++) {
    sum += Math.pow(10, freqData[i] / 20); // decibels -> linear level
  }
  return sum / (endBin - startBin + 1);
}

function detectBeat() {
  if (!analyser || audioEl.paused) return;

  let bass = getBassLevel();
  let now = millis();

  // A beat = the bass suddenly jumps above its recent average
  if (
    bass > minBass &&
    bass > avgBass * beatThreshold &&
    now - lastBeatTime > beatCooldownMs
  ) {
    ripples.push(new Ripple(attractX, attractY));
    lastBeatTime = now;
  }

  // Slowly-updating running average of the bass level
  avgBass = avgBass * 0.95 + bass * 0.05;
}

// An invisible expanding ring. Balls inside its band get pushed and lit up.
class Ripple {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 0;
    this.alpha = 255;
    this.update(); // compute the band bounds right away
  }

  update() {
    this.radius += rippleSpeed;
    this.alpha -= rippleFade;
    this.strength = this.alpha / 255; // 1 = fresh wave, 0 = faded out

    // Squared bounds of the band, so balls can skip the sqrt when far away
    let inner = Math.max(0, this.radius - rippleWidth);
    let outer = this.radius + rippleWidth;
    this.inner2 = inner * inner;
    this.outer2 = outer * outer;
  }

  isDone() {
    return this.alpha <= 0;
  }
}
// --- end audio-reactive additions ---

class Ball {
  constructor(x, y, c, r) {
    this.baseX = x;
    this.baseY = y;
    this.x = x;
    this.y = y;
    this.color = c;
    this.r = r;

    // Cached, attraction-dependent values — computed by updateAttraction()
    this.speedMultiplier = 1;
    this.targetX = x;
    this.targetY = y;
    this.cr = 255;
    this.cg = 221;
    this.cb = 0;

    this.glow = 0; // ripple flash: 0 = normal color, 1 = full white
  }

  // Recomputes everything that depends on the attraction point's position.
  // Only called when that point has actually moved.
  updateAttraction() {
    let dx = attractX - this.baseX;
    let dy = attractY - this.baseY;
    let d = Math.sqrt(dx * dx + dy * dy);

    let t = d / attractionRadius;
    if (t > 1) t = 1; // d is never negative, so this replaces constrain(t, 0, 1)

    this.speedMultiplier = 8 - 7.5 * t; // same as map(t, 0, 1, 8, 0.5)

    if (d < attractionRadius) {
      let pull = (1 - d / attractionRadius) * 0.8; // same as map(...) then *0.8
      this.targetX = this.baseX + dx * pull;
      this.targetY = this.baseY + dy * pull;
    } else {
      this.targetX = this.baseX;
      this.targetY = this.baseY;
    }

    // Manual color lerp: R stays 255 the whole way, G and B rise toward 255
    this.cg = 221 + (255 - 221) * t;
    this.cb = 0 + 255 * t;
  }

  change(byHowMuch) {
    this.changeSize(byHowMuch);
    this.move(byHowMuch * this.speedMultiplier);
    this.applyRipples();
    this.show();
  }

  changeSize(byHowMuch) {
    this.r += random(-byHowMuch, byHowMuch);
    if (this.r < 0.75) this.r = 0.75;
    else if (this.r > 2.75) this.r = 2.75;
  }

  move(jitterAmount) {
    // Same as lerp(this.x, this.targetX, 0.1)
    this.x += (this.targetX - this.x) * 0.1;
    this.y += (this.targetY - this.y) * 0.1;

    this.x += random(-jitterAmount, jitterAmount);
    this.y += random(-jitterAmount, jitterAmount);
  }

  // Pushes the ball outward and lights it up while a wave passes over it.
  // move() then pulls it back toward its target, so the wave rolls through.
  applyRipples() {
    this.glow *= 0.85; // flash fades out over a few frames

    for (let rp of ripples) {
      let dx = this.x - rp.x;
      let dy = this.y - rp.y;
      let d2 = dx * dx + dy * dy;

      if (d2 < rp.inner2 || d2 > rp.outer2) continue; // not in this wave's band

      let d = Math.sqrt(d2);
      if (d === 0) continue;

      // 1 at the center of the band, fading to 0 at its edges
      let falloff = 1 - Math.abs(d - rp.radius) / rippleWidth;
      let force = falloff * rp.strength * ripplePush;

      this.x += (dx / d) * force;
      this.y += (dy / d) * force;

      let flash = falloff * rp.strength;
      if (flash > this.glow) this.glow = flash;
    }
  }

  show() {
    if (this.glow > 0.01) {
      // Blend from the ball's original color toward the ripple yellow.
      // glow is 1 when the wave hits and fades to 0, so the ball
      // smoothly returns to its own color as the ripple dies out.
      fill(
        this.cr + (rippleR - this.cr) * this.glow,
        this.cg + (rippleG - this.cg) * this.glow,
        this.cb + (rippleB - this.cb) * this.glow,
      );
    } else {
      fill(this.cr, this.cg, this.cb);
    }
    circle(this.x, this.y, this.r);
    circle(this.x, this.y, this.r * ballScale);
  }
}
