// this is how we define a class
// attributes
// methods
// this is a blueprint for creating stuff.
// We can create new balls using this.

// in this game every ball is a little piece of dust.
// when dust is on your body it lights up,
// and some of it is picked to be a NODE, a corner of your geometry.

class Ball {
  // this function is called when an instance of Ball is created.
  // x ix x position
  // y is y position
  // c is color
  // r is radius
  // this is the function that is called when you create a new ball or a new instance of this Class.
  constructor(x, y, fillColor, r) {
    this.x = x;
    this.y = y;

    this.baseR = r;
    this.r = r;
    this.origColor = fillColor;
    this.fillColor = fillColor;
    this.highlightColor = color(120, 220, 230, 150);

    // true when the ball is on your body (or under the mouse)
    this.active = false;
    // true when the ball was picked to be a corner of the geometry
    this.isNode = false;
    // every ball has its own spot in the noise, so they don't all breathe together
    this.noiseSeed = random(1000);
  }

  update(byHowMuch) {
    // nodes stay almost still, so the shape is easy to read
    this.move(this.isNode ? 0.2 : byHowMuch);
    this.show();
  }

  move(byHowMuch) {
    this.x = constrain(this.x + random(-byHowMuch, byHowMuch), 0, width - 1);
    this.y = constrain(this.y + random(-byHowMuch, byHowMuch), 0, height - 1);
  }

  changeSize(byHowMuch) {
    // noise() is smooth randomness, so the size slowly breathes
    let n = noise(this.noiseSeed + frameCount * byHowMuch); // 0 to 1
    this.r = this.baseR * (1 + (n - 0.5) * 0.6);
  }

  contains(px, py, reach) {
    if (dist(this.x, this.y, px, py) < reach) {
      return true;
    } else {
      return false;
    }
  }

  respond(active) {
    this.active = active;
    if (active) this.highlight();
    else this.deHighlight();
  }

  highlight() {
    this.fillColor = this.highlightColor;
  }

  deHighlight() {
    this.fillColor = this.origColor;
  }

  // the mask is a picture: the pixels that are not see-through are the background,
  // so a see-through pixel (alpha under 128) is a pixel of your body.
  // we flip x like a mirror, so when you move your right hand it moves to the right on the screen.
  // call mask.loadPixels() once per frame before using this (see draw in sketch.js).
  isOnBody(mask) {
    let mx = floor(((width - 1 - this.x) * mask.width) / width);
    let my = floor((this.y * mask.height) / height);
    let i = (my * mask.width + mx) * 4; // every pixel is 4 numbers in a row: r, g, b, a
    return mask.pixels[i + 3] < 128;
  }

  show() {
    noStroke();
    if (this.isNode) {
      // a node: a bright dot with a soft glow around it
      fill(240, 219, 25, 50);
      circle(this.x, this.y, 36);
      fill(240, 219, 25);
      circle(this.x, this.y, 12);
    } else {
      fill(this.fillColor);
      circle(this.x, this.y, this.r * 2);
    }
  }
}

class BubblyBall extends Ball {
  respond(active) {
    // do the thing that original ball does.
    super.respond(active);
    // we can do new things here...
    // update it.
    this.changeSize(0.02);
  }
}
