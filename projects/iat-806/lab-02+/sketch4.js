let fibSize = 610;
let maxZ = 2000;
let baseSpeed = 6;
let layers = [];

// Transition variables for smooth fading
let vortexAlpha = 0.0;

function setup() {
  const canvas = createCanvas(fibSize, fibSize);
  canvas.parent("sketch-holder");

  colorMode(HSB, 360, 100, 100, 1);

  // Background hexagonal layers
  for (let i = 0; i < 35; i++) {
    let z = map(i, 0, 35, 1, maxZ);
    layers.push(new Layer(z));
  }
}

function draw() {
  // Motion blur trail effect
  background(0, 0, 0, 0.15);

  // Move origin to the exact center of the void
  translate(width / 2, height / 2);

  // ----------------------------------------------------
  // 1. SMOOTH TRANSITION MATH (LERP)
  // ----------------------------------------------------
  // If mouse is pressed, target is 1.0 (fully visible). If released, target is 0.0 (hidden).
  let targetAlpha = mouseIsPressed ? 1.0 : 0.0;
  // Smoothly glide vortexAlpha toward targetAlpha (10% per frame)
  vortexAlpha = lerp(vortexAlpha, targetAlpha, 0.1);

  // ----------------------------------------------------
  // 2. THE STATIC HEXAGON TUNNEL
  // ----------------------------------------------------
  layers.sort((a, b) => b.z - a.z);

  for (let layer of layers) {
    layer.update();
    layer.show();
  }

  // ----------------------------------------------------
  // 3. THE SACRED VORTEX (Fading In/Out)
  // ----------------------------------------------------
  // Only draw if it's practically visible to save CPU power
  if (vortexAlpha > 0.01) {
    drawSacredVortex(mouseX, mouseY, vortexAlpha);
  }

  // ----------------------------------------------------
  // 4. THE CORE OF LIGHT (Always on top)
  // ----------------------------------------------------
  noStroke();
  fill(0, 0, 100, 1); // Solid white center
  circle(0, 0, 15);
  fill(0, 0, 100, 0.4); // Semi-transparent middle
  circle(0, 0, 35);
  fill(0, 0, 100, 0.1); // Faint outer glow
  circle(0, 0, 80);
}

// ----------------------------------------------------
// THE 3D SACRED VORTEX FUNCTION
// ----------------------------------------------------
function drawSacredVortex(mx, my, alphaMultiplier) {
  let numSpirals = 12;
  let twist = 0.005;
  let timeOffset = frameCount * 0.45;

  let targetX = mx - width / 2;
  let targetY = my - height / 2;

  for (let i = 0; i < numSpirals; i++) {
    let baseAngle = map(i, 0, numSpirals, 0, TWO_PI);

    for (let z = 40; z < maxZ; z += 40) {
      let prevZ = z - 40;

      let p1 = width / prevZ;
      let p2 = width / z;

      let baseR1 = map(prevZ, 10, maxZ, 80, 2);
      let baseR2 = map(z, 10, maxZ, 80, 2);

      let r1 = baseR1 * p1;
      let r2 = baseR2 * p2;

      if (r1 > width * 3) continue;

      let w1 = pow(map(prevZ, 10, maxZ, 1, 0, true), 2);
      let w2 = pow(map(z, 10, maxZ, 1, 0, true), 2);

      let hue = 55; // Golden Yellow
      let sat = map(z, 40, maxZ, 40, 0);

      // Multiply final alpha by our smooth transition variable!
      let alpha = map(z, 10, maxZ, 1, 0) * alphaMultiplier;

      stroke(hue, sat, 100, alpha);
      strokeWeight(map(z, 10, maxZ, 3, 0.2));

      // CLOCKWISE SPIRAL
      let a1_cw = baseAngle + prevZ * twist - timeOffset;
      let a2_cw = baseAngle + z * twist - timeOffset;

      let x1_cw = r1 * cos(a1_cw) + targetX * w1;
      let y1_cw = r1 * sin(a1_cw) + targetY * w1;
      let x2_cw = r2 * cos(a2_cw) + targetX * w2;
      let y2_cw = r2 * sin(a2_cw) + targetY * w2;

      line(x1_cw, y1_cw, x2_cw, y2_cw);

      // COUNTER-CLOCKWISE SPIRAL
      let a1_ccw = baseAngle - prevZ * twist + timeOffset;
      let a2_ccw = baseAngle - z * twist + timeOffset;

      let x1_ccw = r1 * cos(a1_ccw) + targetX * w1;
      let y1_ccw = r1 * sin(a1_ccw) + targetY * w1;
      let x2_ccw = r2 * cos(a2_ccw) + targetX * w2;
      let y2_ccw = r2 * sin(a2_ccw) + targetY * w2;

      line(x1_ccw, y1_ccw, x2_ccw, y2_ccw);
    }
  }
}

// ----------------------------------------------------
// THE BACKGROUND HEXAGON CLASS
// ----------------------------------------------------
class Layer {
  constructor(z) {
    this.z = z;
    // Startup stagger: give each layer a random starting alpha so the page load
    // doesn't flash all hexagons at once. They gently fade into existence!
    this.spawnDelay = map(z, 1, maxZ, 0, 1);
  }

  update() {
    this.z -= baseSpeed;
    if (this.z < 1) {
      this.z = maxZ;
    }
  }

  show() {
    let perspective = width / this.z;
    let radius = perspective * 40;

    if (radius > width * 2 || radius < 10) return;

    let weight = map(this.z, 1, maxZ, 8, 0.5);
    strokeWeight(weight);

    // 1. Create a wave that moves based on depth (z) and time (frameCount)
    let colorWave = sin(this.z * 0.005 - frameCount * 0.02);

    // 2. Map the wave (-1 to 1) perfectly to your desired Hue range (250 to 345)
    let hue = map(colorWave, -1, 1, 250, 345);

    // Smoothly cross-fade background brightness based on vortexAlpha (0 to 1)
    // When vortexAlpha is 0, max brightness is 100. When vortexAlpha is 1, max brightness dims to 50.
    let maxBright = lerp(100, 10, vortexAlpha);
    let brightness = map(this.z, 1, maxZ, maxBright, 0);

    // Fade the whole tunnel in gently during the first second of page load
    let startupFade = constrain(map(frameCount, 0, 60, 0, 1), 0, 1);

    stroke(hue, 90, brightness, startupFade);
    noFill();

    push();
    let twist = sin(frameCount * 0.01 + this.z * 0.005);
    rotate(twist);

    beginShape();
    for (let a = 0; a < TWO_PI; a += TWO_PI / 6) {
      vertex(radius * cos(a), radius * sin(a));
    }
    endShape(CLOSE);
    pop();
  }
}
// ----------------------------------------------------
// YOUTUBE AUDIO API SETUP
// ----------------------------------------------------
let player;
let isPlayerReady = false;

// The YouTube API automatically looks for this exact function name to start
function onYouTubeIframeAPIReady() {
  player = new YT.Player("yt-player", {
    height: "10", // Keep it tiny
    width: "10",
    // REPLACE THE HIGHLIGHTED TEXT WITH YOUR YOUTUBE VIDEO ID
    videoId: "-DuAAmHpGbw",
    playerVars: {
      playsinline: 1,
      controls: 0,
      disablekb: 1,
    },
    events: {
      onReady: (event) => {
        isPlayerReady = true;
        event.target.setVolume(100); // Set volume 0-100
      },
    },
  });
}

// ----------------------------------------------------
// SYNC AUDIO WITH THE VORTEX CLICK
// ----------------------------------------------------
function mousePressed() {
  // When you click, if the player has finished loading, hit Play!
  if (isPlayerReady) {
    player.playVideo();
  }
}

function mouseReleased() {
  // When you let go, hit Pause! The music stops exactly as the vortex fades.
  if (isPlayerReady) {
    player.pauseVideo();
  }
}
