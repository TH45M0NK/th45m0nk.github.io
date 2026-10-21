let balls = [];
let numberOfBalls = 9000;

// Attraction point: starts at the center
let attractX, attractY;
let attractionRadius = 200; // How close the point needs to be to affect a ball
let moveStep = 5;

// Track the physical state of the WASD keys
let keys = {
  w: false,
  a: false,
  s: false,
  d: false,
};

function setup() {
  createCanvas(512, 512);
  background(16);
  noStroke(); // Improves performance

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
}

function draw() {
  background(16);

  // Move the attraction point based on our custom tracking object
  if (keys.a) attractX -= moveStep; // Left
  if (keys.d) attractX += moveStep; // Right
  if (keys.w) attractY -= moveStep; // Up
  if (keys.s) attractY += moveStep; // Down

  attractX = constrain(attractX, 0, width);
  attractY = constrain(attractY, 0, height);

  for (let ball of balls) {
    ball.change(random(1, 4));
  }
}

// p5.js native keyboard event functions
function keyPressed() {
  let k = key.toLowerCase(); // Automatically handles Caps Lock
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

class Ball {
  constructor(x, y, c, r) {
    // Save the original starting position so the ball has a "home" to return to
    this.baseX = x;
    this.baseY = y;

    // Current position
    this.x = x;
    this.y = y;
    this.color = c;
    this.r = r;
  }

  change(byHowMuch) {
    // Measure distance from the ball's HOME to the attraction point
    let d = dist(this.baseX, this.baseY, attractX, attractY);

    // t goes from 0 (exactly on the point) to 1 (at the edge of the attraction radius)
    let t = constrain(d / attractionRadius, 0, 1);

    // Speed: 4x near the point, down to 0.5x outside the radius
    let speedMultiplier = map(t, 0, 1, 8, 0.5);

    this.changeSize(byHowMuch);
    this.move(byHowMuch * speedMultiplier, d, t);
    this.show(t);
  }

  changeSize(byHowMuch) {
    this.r += random(-byHowMuch, byHowMuch);
    this.r = constrain(this.r, 0.75, 2.75);
  }

  move(jitterAmount, distanceToAttractor, t) {
    // 1. Determine where the ball *wants* to be
    let targetX = this.baseX;
    let targetY = this.baseY;

    // If the ball is inside the attraction radius, pull its target towards the center
    if (distanceToAttractor < attractionRadius) {
      // Pull strength goes from 1 (center) to 0 (edge of radius)
      let pull = map(distanceToAttractor, 0, attractionRadius, 1, 0);

      // Pull the target towards the attract point (multiplied by 0.8 so they don't merge into a single pixel)
      targetX = lerp(this.baseX, attractX, pull * 0.8);
      targetY = lerp(this.baseY, attractY, pull * 0.8);
    }

    // 2. Smoothly glide the ball towards its target position
    this.x = lerp(this.x, targetX, 0.1);
    this.y = lerp(this.y, targetY, 0.1);

    // 3. Add the scattered jitter on top
    this.x += random(-jitterAmount, jitterAmount);
    this.y += random(-jitterAmount, jitterAmount);
  }

  show(t) {
    // Color: yellow near the point, fading to white at the edge of the attraction radius
    let c = lerpColor(color(255, 221, 0), color(255, 255, 255), t);
    fill(c);
    circle(this.x, this.y, this.r);
  }
}
