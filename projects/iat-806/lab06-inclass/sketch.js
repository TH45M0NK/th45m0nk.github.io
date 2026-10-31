let balls = [];
let bodySegmentation; //Define a variable to store the BodySegmentation model.
let segmentation;
let numBalls = 1000;
let video;
let options = {
  maskType: "person",
};

async function setup() {
  const canvas = createCanvas(640, 480);
  canvas.parent("sketch-holder");
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();

  bodySegmentation = await ml5.bodySegmentation("BodyPix", options);
  bodySegmentation.detectStart(video, gotResults);

  for (let i = 0; i < numBalls; i++) {
    let ball = createRandomBall();
    balls.push(ball);
  }
}

function draw() {
  background(10);

  if (segmentation) {
    image(segmentation.mask, 0, 0, width, height);
    image(video, 0, 0, width, height);
  }

  for (let ball of balls) {
    let howMuch = 1;
    let active = segmentation ? ball.isOnBody(segmentation.mask) : false;
    ball.respond(active);
    ball.update(howMuch);
  }
}

function mousePressed() {
  balls.forEach((ball) => {
    let active = ball.containsPoint(mouseX, mouseY);
    ball.respond(active);
    //if (ball.containsPoint(mouseX, mouseY)) {
    //  ball.highlight();
    // } else {
    //   ball.undoHighlight();
    //  }
  });
}

function gotResults(result) {
  segmentation = result;
}
