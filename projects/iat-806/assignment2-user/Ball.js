// this is how we define a class
// attributes
// methods
// this is a blueprint for creating stuff.
// We can create new balls using this.

// a ball is a corner of the geometry.
class Ball {
  // x is x position
  // y is y position
  // fillColor is color
  // r is radius
  constructor(x, y, fillColor, r) {
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
    this.r = r;
    this.fillColor = fillColor;
  }

  goTo(x, y) {
    this.targetX = x;
    this.targetY = y;
  }

  update() {
    this.move();
    this.show();
  }

  // instead of jumping, the ball slides a bit of the way each frame
  move() {
    this.x = lerp(this.x, this.targetX, 0.2);
    this.y = lerp(this.y, this.targetY, 0.2);
  }

  show() {
    noStroke();
    fill(red(this.fillColor), green(this.fillColor), blue(this.fillColor), 55);
    circle(this.x, this.y, this.r * 3);
    fill(this.fillColor);
    circle(this.x, this.y, this.r);
  }
}
