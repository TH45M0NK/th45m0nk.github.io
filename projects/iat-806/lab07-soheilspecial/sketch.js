// an array to put all the balls in.
let balls = [];
// numBalls is written in camelCase.
// you could also write in camel_case
// this is the number of balls that you want to create.
let numBalls = 3000;
// no color variables, no position variables, they are all defined within the class.

let bodySegmentation;
let video;
let segmentation;

let options = {
  maskType: "person",
};

// the emojis, drawn ONCE as little pictures. drawing a picture is way faster than drawing text.
let emojiPictures = {};

// the colors of the balls: anything between these three
// #004D26 (dark green), #00A4B2 (cyan) and #005999 (blue)
let ballColors;

async function setup() {
  const canvas = createCanvas(800, 600);
  canvas.parent("sketch-holder");

  emojiPictures["🤢"] = makeEmojiPicture("🤢");
  emojiPictures["🤮"] = makeEmojiPicture("🤮");

  ballColors = [color("#004D26"), color("#00A4B2"), color("#005999")];

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

  // read all the mask pixels once per frame (instead of once per ball)
  if (segmentation) segmentation.mask.loadPixels();

  for (let ball of balls) {
    let onBody = segmentation && ball.isOnBody(segmentation.mask);

    let active = ball.contains(mouseX, mouseY) || onBody;

    ball.respond(active);

    ball.update(1);
  }
}

function createRandomBall() {
  let ballX = random(0, width);
  let ballY = random(0, height);
  let ballC = randomBallColor();
  let ballR = 5;
  let randomNumber = Math.random();
  if (randomNumber < 0.2) {
    return new BubblyBall(ballX, ballY, ballC, ballR);
  } else if (randomNumber < 0.3) {
    // fewer emojis than before (10% instead of 30%), but bigger.
    return new flirtyBall(ballX, ballY, ballC, ballR);
  } else {
    return new Ball(ballX, ballY, ballC, ballR);
  }
}

function gotResults(result) {
  segmentation = result;
}

// draws an emoji on a small transparent picture, one time.
function makeEmojiPicture(emoji) {
  let pic = createGraphics(64, 64);
  pic.textSize(52);
  pic.textAlign(CENTER, CENTER);
  pic.text(emoji, 32, 36);
  return pic;
}

// picks a color somewhere between the three ballColors (not only those three).
function randomBallColor() {
  let t = random(0, 2); // 0 to 1 = green to cyan, 1 to 2 = cyan to blue
  let c;
  if (t < 1) {
    c = lerpColor(ballColors[0], ballColors[1], t);
  } else {
    c = lerpColor(ballColors[1], ballColors[2], t - 1);
  }
  // a little see-through, like before
  c.setAlpha(110);
  return c;
}
