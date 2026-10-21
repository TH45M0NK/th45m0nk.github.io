p5.disableFriendlyErrors = true; // skip p5's per-call argument validation — big win at this scale

let balls = [];
let numberOfBalls = 9000;

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

// --- Audio-reactive additions ---
let song;
let fft;
let peakDetect;
let ripples = [];

async function preload() {
  try {
    song = await loadSound("Pink Floyd - Any Colour You Like.mp3");
    console.log("Song loaded OK");
  } catch (err) {
    console.error("Song FAILED to load:", err);
  }
}
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
  fft = new p5.FFT();
  fft.setInput(song);

  peakDetect = new p5.PeakDetect(20, 200, 0.3, 20);
  peakDetect.onPeak(triggerRipple);
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

  let attractMoved = attractX !== prevAttractX || attractY !== prevAttractY;
  if (attractMoved) {
    for (let ball of balls) {
      ball.updateAttraction();
    }
    prevAttractX = attractX;
    prevAttractY = attractY;
  }

  for (let ball of balls) {
    ball.change(random(1, 4));
  }

  // --- Audio-reactive additions ---
  fft.analyze();
  peakDetect.update(fft);

  for (let i = ripples.length - 1; i >= 0; i--) {
    ripples[i].update();
    ripples[i].show();
    if (ripples[i].isDone()) {
      ripples.splice(i, 1);
    }
  }
  // --- end audio-reactive additions ---

  if (frameCount % 30 === 0) console.log(Math.round(frameRate()) + " fps");
}

function keyPressed() {
  let k = key.toLowerCase();
  if (k === "w") keys.w = true;
  if (k === "a") keys.a = true;
  if (k === "s") keys.s = true;
  if (k === "d") keys.d = true;
}

function keyReleased() {
  let k = key.toLowerCase();
  if (k === "w") keys.w = false;
  if (k === "a") keys.a = false;
  if (k === "s") keys.s = false;
  if (k === "d") keys.d = false;
}

// --- Audio-reactive additions ---
function mousePressed() {
  if (song.isPlaying()) {
    song.pause();
  } else {
    userStartAudio();
    song.play();
  }
}

function triggerRipple() {
  ripples.push(new Ripple(attractX, attractY));
}

class Ripple {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 0;
    this.alpha = 255;
  }

  update() {
    this.radius += 6;
    this.alpha -= 4;
  }

  isDone() {
    return this.alpha <= 0;
  }

  show() {
    push();
    noFill();
    stroke(255, this.alpha);
    strokeWeight(2);
    circle(this.x, this.y, this.radius * 2);
    pop();
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

    this.speedMultiplier = 1;
    this.targetX = x;
    this.targetY = y;
    this.cr = 255;
    this.cg = 221;
    this.cb = 0;
  }

  updateAttraction() {
    let dx = attractX - this.baseX;
    let dy = attractY - this.baseY;
    let d = Math.sqrt(dx * dx + dy * dy);

    let t = d / attractionRadius;
    if (t > 1) t = 1;

    this.speedMultiplier = 8 - 7.5 * t;

    if (d < attractionRadius) {
      let pull = (1 - d / attractionRadius) * 0.8;
      this.targetX = this.baseX + dx * pull;
      this.targetY = this.baseY + dy * pull;
    } else {
      this.targetX = this.baseX;
      this.targetY = this.baseY;
    }

    this.cg = 221 + (255 - 221) * t;
    this.cb = 0 + 255 * t;
  }

  change(byHowMuch) {
    this.changeSize(byHowMuch);
    this.move(byHowMuch * this.speedMultiplier);
    this.show();
  }

  changeSize(byHowMuch) {
    this.r += random(-byHowMuch, byHowMuch);
    if (this.r < 0.75) this.r = 0.75;
    else if (this.r > 2.75) this.r = 2.75;
  }

  move(jitterAmount) {
    this.x += (this.targetX - this.x) * 0.1;
    this.y += (this.targetY - this.y) * 0.1;

    this.x += random(-jitterAmount, jitterAmount);
    this.y += random(-jitterAmount, jitterAmount);
  }

  show() {
    fill(this.cr, this.cg, this.cb);
    circle(this.x, this.y, this.r);
  }
}
