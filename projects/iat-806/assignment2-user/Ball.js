// this is how we define a class
// attributes
// methods
// this is a blueprint for creating stuff.
// We can create new balls using this.

// in this version every ball is a little piece of dust.
// the dust on your body lights up, and a few special balls (NodeBall, at the bottom)
// are the corners of the geometry.

class Ball {
  // x is x position
  // y is y position
  // fillColor is color
  // r is radius
  constructor(x, y, fillColor, r) {
    this.x = x;
    this.y = y;

    this.baseR = r;
    this.r = r;
    this.origColor = fillColor;
    this.fillColor = fillColor;
    this.highlightColor = color(120, 220, 230, 150);
  }

  update(byHowMuch) {
    this.move(byHowMuch);
    this.show();
  }

  move(byHowMuch) {
    this.x += random(-byHowMuch, byHowMuch);
    this.y += random(-byHowMuch, byHowMuch);
  }

  changeSize(byHowMuch) {
    this.r = constrain(this.r + random(-byHowMuch, byHowMuch), 1, 4);
  }

  respond(active) {
    if (active) this.highlight();
    else this.deHighlight();
  }

  highlight() {
    this.fillColor = this.highlightColor;
  }

  deHighlight() {
    this.fillColor = this.origColor;
  }

  // the mask is a picture. a pixel that is not see-through (alpha 128 or more) is the background,
  // so a see-through pixel is your body.
  // call mask.loadPixels() once in draw, so we don't ask p5 for every ball.
  isOnBody(mask) {
    let mx = floor((this.x * mask.width) / width);
    let my = floor((this.y * mask.height) / height);
    let i = (my * mask.width + mx) * 4; // every pixel is 4 numbers: r, g, b, a
    return mask.pixels[i + 3] < 128;
  }

  show() {
    fill(this.fillColor);
    noStroke();
    circle(this.x, this.y, this.r * 2);
  }
}

class BubblyBall extends Ball {
  respond(active) {
    // do the thing that original ball does.
    super.respond(active);
    // we can do new things here...
    this.changeSize(0.3);
  }
}

// a corner of the geometry. it is a ball that knows where it wants to go.
class NodeBall extends Ball {
  constructor(x, y) {
    super(x, y, color(240, 219, 25), 5);
    this.targetX = x;
    this.targetY = y;
  }

  goTo(x, y) {
    this.targetX = x;
    this.targetY = y;
  }

  // instead of jumping, the node slides a bit of the way each frame
  move() {
    this.x = lerp(this.x, this.targetX, 0.15);
    this.y = lerp(this.y, this.targetY, 0.15);
  }

  show() {
    noStroke();
    fill(240, 219, 25, 50);
    circle(this.x, this.y, this.r * 6);
    fill(this.fillColor);
    circle(this.x, this.y, this.r * 2);
  }
}
