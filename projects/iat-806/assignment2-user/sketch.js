// an array to put all the balls in.
let balls = [];
// numBalls is written in camelCase.
// this is the number of dust balls that you want to create.
let numBalls = 1200;
// the nodes are the corners of the geometry. they are balls too.
let nodes = [];

let bodySegmentation;
let video;
let segmentation;

let options = {
  maskType: "person",
};

// outline of the body: how far the edge of the mask is from your middle, in 64 directions.
let numRays = 64;
let radii = [];
let centerX = 0;
let centerY = 0;

// how jagged the outline is. 0 is a circle, a bigger number is more arms, fingers, elbows...
// this one moves slowly, so the geometry doesn't flicker.
let jagged = 0;
// the jagged numbers where the geometry is the simplest and the most complex. play with them!
let simpleAt = 1;
let complexAt = 6;

let complexity = 0; // jagged, but between 0 and 1
let minNodes = 3;
let maxNodes = 24;
let nodeCount = minNodes;

async function setup() {
  const canvas = createCanvas(800, 600);
  canvas.parent("sketch-holder");
  for (let i = 0; i < numBalls; i++) {
    balls.push(createRandomBall());
  }

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

  if (segmentation) segmentation.mask.loadPixels();

  for (let ball of balls) {
    let onBody = segmentation && ball.isOnBody(segmentation.mask);
    ball.respond(onBody);
    ball.update(1);
  }

  if (segmentation && measureOutline()) {
    updateNodes();
    drawLinks();
  } else {
    // nobody there, so no geometry
    nodes = [];
  }
  for (let node of nodes) {
    node.update();
  }

  showWords();
}

function createRandomBall() {
  let ballX = random(0, width);
  let ballY = random(0, height);
  let ballC = color(120, 160, 200, 40);
  let ballR = 2;
  if (Math.random() < 0.3) {
    return new BubblyBall(ballX, ballY, ballC, ballR);
  } else {
    return new Ball(ballX, ballY, ballC, ballR);
  }
}

function gotResults(result) {
  segmentation = result;
}

// look at the mask and find out how jagged the outline is.
// gives back false if there is nobody on the screen.
function measureOutline() {
  let mask = segmentation.mask;
  let scale = mask.width / width;

  // the middle of your body is the average of all the body pixels (we look at every 8th pixel)
  let sumX = 0;
  let sumY = 0;
  let count = 0;
  for (let y = 0; y < height; y += 8) {
    for (let x = 0; x < width; x += 8) {
      if (maskIsBody(mask, x * scale, y * scale)) {
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
    while (r < width && maskIsBody(mask, (centerX + cos(angle) * r) * scale, (centerY + sin(angle) * r) * scale)) {
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

function maskIsBody(mask, mx, my) {
  if (mx < 0 || my < 0 || mx >= mask.width || my >= mask.height) return false;
  let i = (floor(my) * mask.width + floor(mx)) * 4;
  return mask.pixels[i + 3] < 128;
}

// more complexity means more nodes, and the nodes sit on your outline.
function updateNodes() {
  let wanted = map(complexity, 0, 1, minNodes, maxNodes);
  // only change the number when it is a bit far from the old one, so it doesn't flip between two numbers
  if (abs(wanted - nodeCount) > 0.7) nodeCount = round(wanted);

  // new nodes are born in your middle and slide out. extra nodes are removed.
  while (nodes.length < nodeCount) nodes.push(new NodeBall(centerX, centerY));
  while (nodes.length > nodeCount) nodes.pop();

  for (let i = 0; i < nodes.length; i++) {
    let ray = floor((i * numRays) / nodes.length);
    let angle = (TWO_PI * ray) / numRays;
    nodes[i].goTo(centerX + cos(angle) * radii[ray], centerY + sin(angle) * radii[ray]);
  }
}

// every node is joined to the nodes next to it. when it is complex, it is also joined to the ones further away.
function drawLinks() {
  let reach = 1 + floor(complexity * (nodes.length / 2 - 1));
  stroke(253, 253, 251, 90);
  strokeWeight(1);
  for (let i = 0; i < nodes.length; i++) {
    for (let step = 1; step <= reach; step++) {
      let other = nodes[(i + step) % nodes.length];
      line(nodes[i].x, nodes[i].y, other.x, other.y);
    }
  }
}

function showWords() {
  noStroke();
  fill(253, 253, 251);
  textSize(16);
  textAlign(LEFT, TOP);
  if (nodes.length === 0) {
    text("step in front of the camera", 16, 12);
    return;
  }
  text(nodes.length + " nodes  " + nameOf(nodes.length), 16, 12);
  text("open your arms to make it more complex, hug yourself to make it simpler", 16, 34);
  // to set simpleAt and complexAt, uncomment this and look at the number
  //text("jagged " + nf(jagged, 1, 2), 16, 56);
}

// the name of the geometry that looks like our number of nodes
function nameOf(n) {
  if (n <= 3) return "Triangle";
  if (n <= 4) return "Tetrahedron";
  if (n <= 8) return "Hexagon";
  if (n <= 16) return "Metatron's Cube";
  return "E8-inspired";
}
