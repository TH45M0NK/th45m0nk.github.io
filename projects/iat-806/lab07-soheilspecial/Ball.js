// this is how we define a class
// attributes
// methods
// this is a blueprint for creating stuff.
// We can create new balls using this.

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
    // how much this ball can grow and shrink: between 25% and 35% of its size
    this.sizeRange = random(0.4, 0.8);
    // every ball gets its own spot in the noise, so they don't all breathe together
    this.noiseSeed = random(1000);
    this.origColor = fillColor;
    this.fillColor = fillColor;
    this.highlightColor = color(100, 100, 100, 50);
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
    // random() jumps to a new size every frame = flickering.
    // noise() is smooth randomness, so the size slowly breathes instead.
    // byHowMuch is the speed now (small = slow).
    let n = noise(this.noiseSeed + frameCount * byHowMuch); // 0 to 1
    // from (1 - half the range) to (1 + half the range), e.g. 0.85 to 1.15
    this.r = this.baseR * (1 + (n - 0.5) * this.sizeRange);
  }

  contains(px, py) {
    if (dist(this.x, this.y, px, py) < this.r) {
      return true;
    } else {
      return false;
    }
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

  isOnBody(mask) {
    // mask.get() asks the image for ONE pixel, 3000 times a frame... super slow.
    // so in draw() we call mask.loadPixels() once, and here we just read the list.
    // every pixel is 4 numbers in a row: r, g, b, a
    let i = (floor(this.y) * mask.width + floor(this.x)) * 4;
    return mask.pixels[i + 3] < 128; // opaque = body
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
    // update it.
    this.changeSize(0.01);
  }
}

class flirtyBall extends Ball {
  constructor(x, y, fillColor, r) {
    super(x, y, fillColor, r);
    this.emojiText = "🤢";
    this.sizeMultiplier = 1;
    // how high the emoji is in the air (0 = on the ground, negative = up)
    this.jumpY = 0;
    // jump speed. negative goes up, positive comes down.
    this.vy = 0;
    this.wasActive = false;
  }

  respond(active) {
    if (active) {
      // bigger emojis, so we need fewer of them (and the code runs faster)
      this.sizeMultiplier = 7;
      // emojis breathe too, so they're not all the same size
      this.changeSize(0.02);
      // it just appeared? JUMP!
      if (!this.wasActive) this.vy = -random(3, 6);
      this.bounce();
    } else {
      this.sizeMultiplier = 0.1;
      this.jumpY = 0;
    }
    this.wasActive = active;
  }

  bounce() {
    this.vy += 0.5; // gravity
    this.jumpY += this.vy;
    // hit the ground: jump again, and switch 🤢 <-> 🤮
    if (this.jumpY > 0) {
      this.jumpY = 0;
      this.vy = -random(4, 7);
      if (this.emojiText === "🤢") {
        this.emojiText = "🤮";
      } else {
        this.emojiText = "🤢";
      }
    }
  }

  show() {
    // when it's tiny you can't see the emoji anyway, so just draw a dot.
    if (!this.wasActive) {
      super.show();
      return;
    }
    // drawing the emoji as text is SLOW (the font draws it again every time),
    // so we use the pictures we made once in setup() (see emojiPictures in sketch.js)
    let s = this.r * this.sizeMultiplier;
    imageMode(CENTER);
    image(emojiPictures[this.emojiText], this.x, this.y + this.jumpY, s, s);
  }
}
