let balls = [];
let numberOfBalls = 7500;

function setup() {
  createCanvas(512, 512);
  background(16);
  for (let i = 0; i < numberOfBalls; i++) {
    let ballX = random(width);
    let ballY = random(height);
    let BallColor = color(245, 215, random(255));
    let BallR = random(1, 4);
    let ball = new Ball(ballX, ballY, BallColor, BallR);
    balls.push(ball);
  }
}

// balls.forEach(function(ball) {
//  ball.move();
//  ball.show();
// });

function draw() {
  //   background(16);
  for (let ball of balls) {
    ball.change(random(1, 4));
  }
}

class Ball {
  constructor(x, y, c, r) {
    this.x = x;
    this.y = y;
    this.color = c;
    this.r = r;
  }
  change(byHowMuch) {
    this.changeSize += random(-byHowMuch, byHowMuch);
    this.move(byHowMuch);
    this.show();
  }

  changeSize(byHowMuch) {
    this.r += random(-byHowMuch, byHowMuch);
  }

  move(byHowMuch) {
    // this.x = this.x + random(-5, 5);
    this.x += random(-byHowMuch, byHowMuch);
    this.y += random(-byHowMuch, byHowMuch);
  }
  // methods. Function that are defined to a class.
  show() {
    fill(this.color);
    circle(this.x, this.y, this.r);
  }
}
