// an array to put all the balls in.
let balls = [];
// numBalls is written in camelCase.
// you could also write in camel_case
// this is the number of balls that you want to create.
let numBalls = 1500;
// no color variables, no position variables, they are all defined within the class.

let bodySegmentation;
let video;
let segmentation;

let options = {
  maskType: "person",
};

// ---------------------------------------------------------------
// the game. play with these numbers to change how it feels!
// ---------------------------------------------------------------

// how far apart the nodes are (in pixels). a smaller number gives you more nodes.
// press the up and down arrows to change it while you play.
let spacing = 60;
// the most nodes we can have
let maxNodes = 60;
// how long you have to hold still to lock in a geometry (in milliseconds)
let holdTime = 1200;
// the size of the mouse brush. hold the mouse down to make nodes without a camera.
let brush = 90;

let geometries; // all the geometries (see Geometry.js)
let found = []; // the geometries you have found
let nodes = []; // the balls that are corners right now
let score = 0;
let hold = 0; // how long you have held the same number of nodes
let lastCount = 0;
let lastGeometry; // the geometry that you locked last
let reward; // the geometry that is spinning on the screen after you lock it

async function setup() {
  const canvas = createCanvas(800, 600);
  canvas.parent("sketch-holder");

  geometries = makeGeometries();

  for (let i = 0; i < numBalls; i++) {
    balls.push(createRandomBall());
  }

  // loading the model takes a few seconds, so we tell the player first.
  background(32);
  drawMessage("loading... allow the camera when it asks");

  bodySegmentation = await ml5.bodySegmentation("SelfieSegmentation", options);

  // Create the video
  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();

  bodySegmentation.detectStart(video, gotResults);
}

function draw() {
  background(32);
  // to see the camera video.
  //image(video, 0, 0);

  // read all the mask pixels once per frame (instead of once per ball)
  if (segmentation) segmentation.mask.loadPixels();

  for (let ball of balls) {
    let onBody = segmentation && ball.isOnBody(segmentation.mask);
    let onMouse = mouseIsPressed && ball.contains(mouseX, mouseY, brush);

    ball.respond(onBody || onMouse);
  }

  // the balls on your body are picked to be nodes.
  pickNodes();
  drawWeb();

  for (let ball of balls) {
    ball.update(1);
  }

  playGame();
  drawHud();
}

function createRandomBall() {
  let ballX = random(0, width);
  let ballY = random(0, height);
  let ballC = color(120, 160, 200, 40);
  let ballR = 2;
  let randomNumber = Math.random();
  if (randomNumber < 0.3) {
    return new BubblyBall(ballX, ballY, ballC, ballR);
  } else {
    return new Ball(ballX, ballY, ballC, ballR);
  }
}

function gotResults(result) {
  segmentation = result;
}

// ---------------------------------------------------------------
// nodes: the corners of your geometry
// ---------------------------------------------------------------

// a ball on your body becomes a node if it is far enough from all the other nodes.
function pickNodes() {
  nodes = [];
  // the balls that were nodes go first, so the nodes don't jump around.
  let order = balls.filter((b) => b.isNode).concat(balls.filter((b) => !b.isNode));
  for (let ball of order) {
    let isFarEnough = ball.active && nodes.every((n) => dist(ball.x, ball.y, n.x, n.y) >= spacing);
    ball.isNode = isFarEnough && nodes.length < maxNodes;
    if (ball.isNode) nodes.push(ball);
  }
}

// every node is joined to its 3 closest nodes. the lines make a shape.
function drawWeb() {
  stroke(253, 253, 251, 90);
  strokeWeight(1);
  for (let n of nodes) {
    let others = nodes.filter((o) => o !== n);
    others.sort((a, b) => dist(n.x, n.y, a.x, a.y) - dist(n.x, n.y, b.x, b.y));
    for (let o of others.slice(0, 3)) {
      line(n.x, n.y, o.x, o.y);
    }
  }
}

// ---------------------------------------------------------------
// the rules
// ---------------------------------------------------------------

function playGame() {
  let geometry = findGeometry(geometries, nodes.length, found);

  // no geometry for this number of nodes: you have to build one again to score.
  if (!geometry) lastGeometry = undefined;

  // hold the same number of nodes for a moment. if it changes for a frame or two, it's ok.
  if (geometry && nodes.length === lastCount) hold = min(hold + deltaTime, holdTime);
  else hold = max(0, hold - deltaTime * 2);
  lastCount = nodes.length;

  if (geometry && geometry !== lastGeometry && hold >= holdTime) {
    lockGeometry(geometry);
  }

  // a ring that fills up around your shape while you hold still.
  if (geometry && geometry !== lastGeometry) {
    let c = centerOf(nodes);
    noFill();
    stroke(255, 170, 0);
    strokeWeight(4);
    arc(c.x, c.y, 80, 80, -HALF_PI, -HALF_PI + TWO_PI * min(hold / holdTime, 1));
  }

  if (reward) drawReward();
}

function lockGeometry(geometry) {
  let isNew = !found.includes(geometry);
  let points = geometry.score;
  // the first time you find a geometry, you get double.
  if (isNew) {
    points = points * 2;
    found.push(geometry);
  }
  score += points;
  lastGeometry = geometry;
  hold = 0;

  let c = centerOf(nodes);
  reward = {
    geometry: geometry,
    x: c.x,
    y: c.y,
    size: constrain(radiusOf(nodes, c), 60, 220),
    born: millis(),
    text: "+" + points + "  " + geometry.name + (isNew ? "  NEW!" : ""),
  };
}

// the middle of all the nodes
function centerOf(list) {
  let x = 0;
  let y = 0;
  for (let n of list) {
    x += n.x;
    y += n.y;
  }
  return { x: x / list.length, y: y / list.length };
}

// how far the farthest node is from the middle
function radiusOf(list, c) {
  let farthest = 0;
  for (let n of list) {
    farthest = max(farthest, dist(n.x, n.y, c.x, c.y));
  }
  return farthest;
}

// the perfect geometry spins over your nodes for 3 seconds, then fades.
function drawReward() {
  let age = millis() - reward.born;
  if (age > 3000) {
    reward = undefined;
    return;
  }
  let alpha = 255 * (1 - age / 3000);
  reward.geometry.draw(reward.x, reward.y, reward.size, age * 0.0008, alpha);

  noStroke();
  fill(253, 253, 251, alpha);
  textFont("VT323");
  textSize(34);
  textAlign(CENTER, CENTER);
  text(reward.text, reward.x, constrain(reward.y - reward.size - 24, 110, height - 120));
}

// ---------------------------------------------------------------
// the words and numbers on the screen
// ---------------------------------------------------------------

function drawHud() {
  noStroke();
  fill(253, 253, 251);
  textFont("VT323");
  textSize(30);
  textAlign(LEFT, TOP);
  text("SCORE " + nf(score, 5), 16, 10);
  textAlign(RIGHT, TOP);
  text(nodes.length + " NODES", width - 16, 10);

  // a hint: what geometry are you making, or what could you make?
  textSize(20);
  fill(253, 253, 251, 190);
  let geometry = findGeometry(geometries, nodes.length, found);
  let hint;
  if (!segmentation && !mouseIsPressed) {
    hint = "step in front of the camera (or hold the mouse down)";
  } else if (geometry) {
    hint = geometry.name.toUpperCase() + (geometry === lastGeometry ? "  - found it, change the shape" : "  - hold still");
  } else {
    let next = nearestGeometry();
    hint = "make " + next.count + " nodes for a " + next.name + (next.count > nodes.length ? " - step closer or open your arms" : " - step back");
  }
  textAlign(CENTER, TOP);
  text(hint, width / 2, 46);

  drawCodex();
}

// the geometry that is closest to the number of nodes you have, to help the player.
function nearestGeometry() {
  let sorted = geometries.slice();
  sorted.sort((a, b) => abs(a.count - nodes.length) - abs(b.count - nodes.length));
  return sorted[0];
}

// the row of geometries at the bottom. the ones you found light up.
function drawCodex() {
  let w = width / geometries.length;
  for (let i = 0; i < geometries.length; i++) {
    let g = geometries[i];
    let isFound = found.includes(g);
    let x = w * (i + 0.5);
    g.draw(x, height - 56, 20, millis() * 0.0006, isFound ? 255 : 60);

    noStroke();
    fill(253, 253, 251, isFound ? 255 : 90);
    textFont("Share Tech Mono");
    textSize(11);
    textAlign(CENTER, TOP);
    text(g.name.split(" ")[0], x, height - 28);
    text(g.orMore ? g.count + "+" : g.count, x, height - 15);
  }
}

// one line of words in the middle of the screen
function drawMessage(words) {
  noStroke();
  fill(253, 253, 251);
  textFont("VT323");
  textSize(30);
  textAlign(CENTER, CENTER);
  text(words, width / 2, height / 2);
}

function keyPressed(event) {
  // up and down change the spacing between nodes. we stop the page from scrolling.
  if (key === "ArrowUp") {
    spacing = min(spacing + 10, 120);
    event.preventDefault();
  }
  if (key === "ArrowDown") {
    spacing = max(spacing - 10, 30);
    event.preventDefault();
  }
  // r starts again
  if (key === "r") {
    score = 0;
    found = [];
    lastGeometry = undefined;
  }
}
