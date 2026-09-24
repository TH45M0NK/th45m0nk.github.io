// An example sketch, so the page has something to show.
// Delete all of this and write your own.
// Global Varialbes
let x = 512;
let size = 55;
let circleX = 55;
let circleY = 55;
let speedx = 3;
let speedy = 3;
let sizeincrement = 1;
let radius = size / 2;

function setup() {
  createCanvas(x, x);
}

function draw() {
  background(245, 245, 245);
  circleX = circleX + speedx;
  circleY = circleY + speedy;
  radius = size / 2;
  size = size + sizeincrement;
  // # I removed the stroke from the rectangles.
  noStroke();

  // if the position of the circle is greater than the width of the canvas, reset it to 0.
  if (circleX >= width - radius || circleX < radius) {
    speedx = speedx * -1;
    sizeincrement = sizeincrement * -1;
  }

  if (circleY >= height - radius || circleY < radius) {
    speedy = speedy * -1;
  }

  // #red_rectangle please change.
  fill(255, 0, 0);
  circle(circleX, circleY, size);
}

function mousePressed() {
  circleX = 13;
  circleY = 13;
}
