// an array to put all the balls in.
// the balls are the corners of the geometry.
let balls = [];

let bodySegmentation;
let video;
let segmentation;

let options = {
  maskType: "person",
};

// the outline of the body: how far the edge of the mask is from your middle, in 64 directions.
let numRays = 64;
let radii = [];
let centerX = 0;
let centerY = 0;

// how jagged the outline is. 0 is a circle, a bigger number is more arms, elbows, shoulders...
// it moves slowly, so the geometry doesn't flicker.
let jagged = 0;
// the jagged numbers where the geometry is the simplest and the most complex. play with them!
let simpleAt = 1;
let complexAt = 6;

let complexity = 0; // jagged, but between 0 and 1
let minBalls = 3;
let maxBalls = 24;

// the geometries, from the simplest. upTo is the most balls it can have.
let levels = [
  { name: "Triangle", upTo: 3, points: 30 },
  { name: "Tetrahedron", upTo: 4, points: 60 },
  { name: "Hexagon", upTo: 8, points: 100 },
  { name: "Metatron's Cube", upTo: 16, points: 400 },
  { name: "E8-inspired", upTo: 24, points: 1000 },
];
let found = []; // the geometries you already got points for
let score = 0;

// the reset button
let buttonX = 708;
let buttonY = 18;
let buttonW = 72;
let buttonH = 28;

async function setup() {
  const canvas = createCanvas(800, 600);
  canvas.parent("sketch-holder");

  bodySegmentation = await ml5.bodySegmentation("SelfieSegmentation", options);

  // Create the video
  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();

  bodySegmentation.detectStart(video, gotResults);
}

function draw() {
  background(0);
  // to see the camera video.
  //image(video, 0, 0);

  if (segmentation) segmentation.mask.loadPixels();

  if (segmentation && measureOutline()) {
    updateBalls();
    drawOutline();
    drawLinks();
    for (let ball of balls) {
      ball.update();
    }
    giveScore();
  } else {
    // nobody there, so no geometry
    balls = [];
  }

  showWords();
  showButton();
}

function gotResults(result) {
  segmentation = result;
}

// a pixel that is not see-through (alpha 128 or more) is the background,
// so a see-through pixel is your body.
function isBody(x, y) {
  let mask = segmentation.mask;
  let mx = floor((x * mask.width) / width);
  let my = floor((y * mask.height) / height);
  if (mx < 0 || my < 0 || mx >= mask.width || my >= mask.height) return false;
  let i = (my * mask.width + mx) * 4; // every pixel is 4 numbers: r, g, b, a
  return mask.pixels[i + 3] < 128;
}

// look at the mask and find out how jagged the outline is.
// gives back false if there is nobody on the screen.
function measureOutline() {
  // the middle of your body is the average of all the body pixels (we look at every 8th pixel)
  let sumX = 0;
  let sumY = 0;
  let count = 0;
  for (let y = 0; y < height; y += 8) {
    for (let x = 0; x < width; x += 8) {
      if (isBody(x, y)) {
        sumX += x;
        sumY += y;
        count++;
      }
    }
  }
  if (count < 30) return false;
  centerX = sumX / count;
  centerY = sumY / count;

  // from the middle, walk outward in every direction until we leave the body.
  let rough = [];
  for (let i = 0; i < numRays; i++) {
    let angle = (TWO_PI * i) / numRays;
    let r = 0;
    while (r < width && isBody(centerX + cos(angle) * r, centerY + sin(angle) * r)) {
      r += 4;
    }
    rough[i] = r;
  }

  // the edge of the mask shakes a little, so each distance is averaged with its two neighbours
  for (let i = 0; i < numRays; i++) {
    radii[i] = (rough[(i + numRays - 1) % numRays] + rough[i] + rough[(i + 1) % numRays]) / 3;
  }

  // add up how much the distance changes from one ray to the next.
  // a circle never changes. an arm goes out and comes back, so it adds a lot.
  // we divide by the average distance, so it doesn't matter how close you are to the camera.
  let change = 0;
  let average = 0;
  for (let i = 0; i < numRays; i++) {
    change += abs(radii[i] - radii[(i + 1) % numRays]);
    average += radii[i];
  }
  average = max(average / numRays, 1);
  jagged = lerp(jagged, change / average, 0.05);

  complexity = constrain(map(jagged, simpleAt, complexAt, 0, 1), 0, 1);
  return true;
}

// more complexity means more balls, and the balls sit on your outline.
function updateBalls() {
  let numBalls = round(map(complexity, 0, 1, minBalls, maxBalls));

  // new balls are born in your middle and slide out. extra balls are removed.
  while (balls.length < numBalls) balls.push(new Ball(centerX, centerY, color(255), 8));
  while (balls.length > numBalls) balls.pop();

  for (let i = 0; i < balls.length; i++) {
    let ray = floor((i * numRays) / balls.length);
    let angle = (TWO_PI * ray) / numRays;
    // a little bit inside the outline, so the ball is really on the body
    let r = max(radii[ray] - 8, 0);
    balls[i].goTo(centerX + cos(angle) * r, centerY + sin(angle) * r);
  }
}

// the outline of your body
function drawOutline() {
  noFill();
  stroke(255);
  strokeWeight(1.6);
  beginShape();
  for (let i = 0; i < numRays; i++) {
    let angle = (TWO_PI * i) / numRays;
    vertex(centerX + cos(angle) * radii[i], centerY + sin(angle) * radii[i]);
  }
  endShape(CLOSE);
}

// every ball is joined to the balls next to it. when it is complex, it is also joined to the ones further away.
// a link only stays if all of it is inside your body. if it goes outside, we skip it.
function drawLinks() {
  let reach = 1 + floor(complexity * (balls.length / 2 - 1));
  stroke(255, 170);
  strokeWeight(1);
  for (let i = 0; i < balls.length; i++) {
    for (let step = 1; step <= reach; step++) {
      let other = balls[(i + step) % balls.length];
      if (isInside(balls[i], other)) {
        line(balls[i].x, balls[i].y, other.x, other.y);
      }
    }
  }
}

// walk along the link from one ball to the other. if we touch the background, it is not inside.
function isInside(a, b) {
  let steps = ceil(dist(a.x, a.y, b.x, b.y) / 8);
  for (let i = 0; i <= steps; i++) {
    if (!isBody(lerp(a.x, b.x, i / steps), lerp(a.y, b.y, i / steps))) return false;
  }
  return true;
}

// the geometry that has this number of balls
function currentLevel() {
  return levels.find((l) => balls.length <= l.upTo);
}

// the first time you get to a geometry you get its points
function giveScore() {
  let level = currentLevel();
  if (!found.includes(level)) {
    found.push(level);
    score += level.points;
  }
}

function showWords() {
  noStroke();
  fill(255);
  textFont("sans-serif");
  textSize(11);
  textAlign(LEFT, TOP);
  text("SCORE " + nf(score, 5), 20, 20);
  if (balls.length > 0) {
    text(currentLevel().name.toUpperCase() + "  " + balls.length, 20, 38);
  } else {
    text("STEP IN FRONT OF THE CAMERA", 20, 38);
  }
  // to set simpleAt and complexAt, uncomment this and look at the number
  //text("JAGGED " + nf(jagged, 1, 2), 20, 56);
}

function showButton() {
  noFill();
  stroke(255, 180);
  strokeWeight(1);
  rect(buttonX, buttonY, buttonW, buttonH, 14);
  noStroke();
  fill(255);
  textSize(9);
  textAlign(CENTER, CENTER);
  text("RESET", buttonX + buttonW / 2, buttonY + buttonH / 2);
}

function mousePressed() {
  if (mouseX > buttonX && mouseX < buttonX + buttonW && mouseY > buttonY && mouseY < buttonY + buttonH) {
    score = 0;
    found = [];
    jagged = 0;
  }
}
