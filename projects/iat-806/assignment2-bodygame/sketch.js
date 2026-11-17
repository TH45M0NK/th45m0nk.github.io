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
let spacing = 60;
// the most nodes we can have
let maxNodes = 60;
// the size of the mouse brush. hold the mouse down to make nodes without a camera.
let brush = 90;

let nodes = []; // the balls that are corners right now
let score = 0; // the most nodes you have made at the same time

async function setup() {
  const canvas = createCanvas(800, 600);
  canvas.parent("sketch-holder");

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

  // the score is the most nodes you have made at the same time
  score = max(score, nodes.length);
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
// the words and numbers on the screen
// ---------------------------------------------------------------

function drawHud() {
  noStroke();
  fill(253, 253, 251);
  textFont("VT323");
  textSize(30);
  textAlign(LEFT, TOP);
  text("SCORE " + nf(score, 3), 16, 10);
  textAlign(RIGHT, TOP);
  text(nodes.length + " NODES", width - 16, 10);

  // a hint
  textSize(20);
  fill(253, 253, 251, 190);
  textAlign(CENTER, TOP);
  if (!segmentation && !mouseIsPressed) {
    text("step in front of the camera (or hold the mouse down)", width / 2, 46);
  } else {
    text("step closer or open your arms to make more nodes", width / 2, 46);
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

function keyPressed() {
  // r starts again
  if (key === "r") score = 0;
}
