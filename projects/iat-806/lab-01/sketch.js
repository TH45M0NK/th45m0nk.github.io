// ==========================================
// 1. THE TURTLE ENGINE (Instance Mode)
// ==========================================
class KardunTurtle {
  constructor(p, x, y, icon) {
    this.p = p;

    this.startX = x;
    this.startY = y;
    this.startHeading = -90;

    this.x = x;
    this.y = y;
    this.heading = this.startHeading;

    this.isPenDown = true;
    this.color = "#ff7a3c";
    this.weight = 3;

    this.icon = icon;
    this.size = 54;
    this.visible = true;
    this.iconBuffer = null;

    this.moveSpeed = 4;
    this.turnSpeed = 6;
    this.isInstant = false;

    this.queue = [];
    this.current = null;

    this.trail = this.p.createGraphics(this.p.width, this.p.height);
    this.trail.clear();

    this._buildIcon();
  }

  forward(distance) {
    this.queue.push({
      type: "move",
      left: Math.abs(distance),
      sign: Math.sign(distance) || 1,
    });
    return this;
  }
  backward(distance) {
    return this.forward(-distance);
  }
  right(degrees) {
    this.queue.push({
      type: "turn",
      left: Math.abs(degrees),
      sign: Math.sign(degrees) || 1,
    });
    return this;
  }
  left(degrees) {
    return this.right(-degrees);
  }
  penUp() {
    this.queue.push({ type: "pen", down: false });
    return this;
  }
  penDown() {
    this.queue.push({ type: "pen", down: true });
    return this;
  }
  penColor(c) {
    this.queue.push({ type: "color", value: c });
    return this;
  }
  penWidth(w) {
    this.queue.push({ type: "weight", value: w });
    return this;
  }
  goTo(x, y) {
    this.queue.push({ type: "goTo", x, y });
    return this;
  }
  setHeading(degrees) {
    this.queue.push({ type: "heading", value: degrees });
    return this;
  }
  home() {
    this.queue.push({ type: "home" });
    return this;
  }
  stamp() {
    this.queue.push({ type: "stamp" });
    return this;
  }
  erase() {
    this.queue.push({ type: "erase" });
    return this;
  }

  repeat(n, instructions) {
    for (let i = 0; i < n; i++) instructions(i);
    return this;
  }

  setSpeed(pixelsPerFrame, degreesPerFrame) {
    this.moveSpeed = pixelsPerFrame;
    this.turnSpeed = degreesPerFrame ?? pixelsPerFrame * 1.5;
    this.isInstant = false;
    return this;
  }
  instant() {
    this.isInstant = true;
    return this;
  }
  setSize(pixels) {
    this.size = pixels;
    this._buildIcon();
    return this;
  }
  setIcon(img) {
    this.icon = img;
    this._buildIcon();
    return this;
  }
  hide() {
    this.visible = false;
    return this;
  }
  show() {
    this.visible = true;
    return this;
  }

  reset() {
    this.queue = [];
    this.current = null;
    this.trail.clear();
    this.x = this.startX;
    this.y = this.startY;
    this.heading = this.startHeading;
    this.isPenDown = true;
    return this;
  }
  isDone() {
    return this.current === null && this.queue.length === 0;
  }

  update() {
    this._tick();
    this._render();
    return this;
  }

  _tick() {
    let moveBudget = this.isInstant ? Infinity : this.moveSpeed;
    let turnBudget = this.isInstant ? Infinity : this.turnSpeed;
    let guard = 0;

    while ((this.current || this.queue.length > 0) && guard++ < 100000) {
      if (!this.current) this.current = this.queue.shift();
      const cmd = this.current;

      if (cmd.type === "move") {
        const step = Math.min(moveBudget, cmd.left);
        this._moveBy(step * cmd.sign);
        cmd.left -= step;
        moveBudget -= step;
        if (cmd.left > 0.001) break;
      } else if (cmd.type === "turn") {
        const step = Math.min(turnBudget, cmd.left);
        this.heading += step * cmd.sign;
        cmd.left -= step;
        turnBudget -= step;
        if (cmd.left > 0.001) break;
      } else {
        this._runInstantly(cmd);
      }
      this.current = null;
    }
  }

  _runInstantly(cmd) {
    if (cmd.type === "pen") this.isPenDown = cmd.down;
    else if (cmd.type === "color") this.color = cmd.value;
    else if (cmd.type === "weight") this.weight = cmd.value;
    else if (cmd.type === "heading") this.heading = cmd.value;
    else if (cmd.type === "goTo") this._lineTo(cmd.x, cmd.y);
    else if (cmd.type === "home") {
      this._lineTo(this.startX, this.startY);
      this.heading = this.startHeading;
    } else if (cmd.type === "stamp")
      this._paintIcon(this.trail, this.x, this.y);
    else if (cmd.type === "erase") this.trail.clear();
  }

  _moveBy(distance) {
    const radians = (this.heading * Math.PI) / 180;
    this._lineTo(
      this.x + Math.cos(radians) * distance,
      this.y + Math.sin(radians) * distance,
    );
  }

  _lineTo(x, y) {
    if (this.isPenDown) {
      this.trail.stroke(this.color);
      this.trail.strokeWeight(this.weight);
      this.trail.strokeCap(this.p.ROUND);
      this.trail.line(this.x, this.y, x, y);
    }
    this.x = x;
    this.y = y;
  }

  _render() {
    this.p.image(this.trail, 0, 0);
    if (!this.visible) return;

    const radius = this.size / 2;
    const radians = (this.heading * Math.PI) / 180;
    const dx = Math.cos(radians);
    const dy = Math.sin(radians);

    this.p.push();
    this.p.noStroke();
    this.p.fill(this.color);
    this.p.triangle(
      this.x + dx * radius * 1.7,
      this.y + dy * radius * 1.7,
      this.x + dx * radius * 0.8 - dy * radius * 0.5,
      this.y + dy * radius * 0.8 + dx * radius * 0.5,
      this.x + dx * radius * 0.8 + dy * radius * 0.5,
      this.y + dy * radius * 0.8 - dx * radius * 0.5,
    );
    this.p.pop();

    this._paintIcon(null, this.x, this.y);
  }

  _paintIcon(target, x, y) {
    const radius = this.size / 2;

    if (target) {
      target.push();
      target.imageMode(this.p.CENTER);
      if (this.iconBuffer)
        target.image(this.iconBuffer, x, y, this.size, this.size);
      target.noFill();
      target.stroke(255);
      target.strokeWeight(2);
      target.circle(x, y, this.size);
      target.pop();
      return;
    }

    this.p.push();
    this.p.imageMode(this.p.CENTER);
    if (this.iconBuffer) {
      this.p.image(this.iconBuffer, x, y, this.size, this.size);
    } else {
      this.p.noStroke();
      this.p.fill(this.color);
      this.p.circle(x, y, this.size);
    }
    this.p.noFill();
    this.p.stroke(255);
    this.p.strokeWeight(2);
    this.p.circle(x, y, this.size);
    this.p.pop();
  }

  _buildIcon() {
    if (!this.icon) {
      this.iconBuffer = null;
      return;
    }

    const s = Math.max(16, Math.round(this.size * 2));
    const g = this.p.createGraphics(s, s);
    g.clear();

    const ctx = g.drawingContext;
    ctx.save();
    ctx.beginPath();
    ctx.arc(s / 2, s / 2, s / 2, 0, Math.PI * 2);
    ctx.clip();

    const scale = s / Math.min(this.icon.width, this.icon.height);
    g.imageMode(this.p.CENTER);
    g.image(
      this.icon,
      s / 2,
      s / 2,
      this.icon.width * scale,
      this.icon.height * scale,
    );

    ctx.restore();

    // RESTORED TO ORIGINAL: Use the graphics buffer directly!
    this.iconBuffer = g;
  }
}

// ==========================================
// 2. MONDRIAN SKETCH FACTORY (Less is More...)
// ==========================================
const createCustomSketch = (color1, color2, color3) => {
  return (p) => {
    let a = 34;
    let b = 233;
    let x = 453.5;

    p.setup = function () {
      p.createCanvas(x - x / 12, x);
    };

    p.draw = function () {
      p.background(245, 245, 245);
      p.noStroke();

      p.fill(color1);
      p.rect(a, a, b, b);
      p.fill(color2);
      p.rect(a + b, 0, b / 2, a + (1.25 * b) / 3);
      p.fill(13, 13, 13);
      p.rect(a, a + b, b / 2, (1 * b) / 2);
      p.fill(13, 13, 13);
      p.rect(a + b / 2, a + b + (1 * b) / 2, b - b / 2, (1 * b) / 5);
      p.fill(color3);
      p.rect(a + b, a + b + (1 * b) / 2 - (1 * b) / 5, b / 2, (1 * b) / 2.5);
      p.fill(color2);
      p.rect(0, a + b + (1 * b) / 2 - (1 * b) / 5, a, (1 * b) / 2);
      p.fill(color1);
      p.rect(a + b + b / 2, a + b + (1 * b) / 2 - (1 * b) / 5, a, (1 * b) / 2);

      p.stroke(13, 13, 13);
      p.strokeWeight(12);
      p.strokeCap(p.SQUARE);

      p.line(a, 0, a, x);
      p.line(a + b, 0, a + b, x);
      p.line(a + b / 2, a + b, a + b / 2, x);
      p.line(a + b + b / 2, 0, a + b + b / 2, x);

      p.line(0, a, x - 5.5 * a, a);
      p.line(0, a + b, x, a + b);
      p.line(a + b, a + (1.25 * b) / 3, x, a + (1.25 * b) / 3);
      p.line(
        0,
        a + b + (1 * b) / 2 - (1 * b) / 5,
        x,
        a + b + (1 * b) / 2 - (1 * b) / 5,
      );
      p.line(
        a + b / 2,
        a + b + (1 * b) / 2 + (1 * b) / 5,
        x - (1 * b) / 3.5,
        a + b + (1 * b) / 2 + (1 * b) / 5,
      );

      p.noLoop();
    };
  };
};

// ==========================================
// 3. TURTLE SKETCH FACTORY (Sacred Turtle)
// ==========================================
const createTurtleSketch = () => {
  return (p) => {
    let turtle;

    p.setup = function () {
      let cvs = p.createCanvas(600, 600);
      cvs.style("max-width", "100%");
      cvs.style("height", "auto");

      // Load the image safely INSIDE setup using a callback function.
      // This guarantees the turtle only gets created after the image is 100% loaded.
      p.loadImage("Alex-Grey-eye.jpg", (loadedImage) => {
        // Initialize the turtle perfectly in the center of the canvas
        turtle = new KardunTurtle(p, p.width / 2, p.height / 2, loadedImage);

        if (typeof giveInstructions === "function") {
          giveInstructions(turtle);
        } else {
          console.error("giveInstructions is missing!");
        }
      });
    };

    p.draw = function () {
      p.background("#14161a");

      // Only draw the turtle if the image has finished loading
      if (turtle) {
        turtle.update();
      }
    };

    p.keyPressed = function () {
      if (turtle && typeof handleTurtleKeys === "function") {
        handleTurtleKeys(p, turtle);
      }
    };
  };
};

// ==========================================
// 4. RENDER TO HTML
// ==========================================
new p5(
  createCustomSketch("rgb(255, 0, 0)", "rgb(255, 215, 0)", "rgb(10, 50, 175)"),
  "sketch-holder-1",
);

new p5(createTurtleSketch(), "sketch-holder-2");
