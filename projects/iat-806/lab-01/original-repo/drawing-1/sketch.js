console.log("I believe I can do this!");

function setup() {
  a = 34;
  b = 233;
  x = 453.5;
  createCanvas(x - x / 12, x);
}

function draw() {
  background(245, 245, 245);

  // # I removed the stroke from the rectangles.
  noStroke();

  a = 34;
  b = 233;
  x = 453.5;

  // #red_rectangle
  fill(255, 0, 0);
  rect(a, a, b, b);

  // #yellow_rectangle
  fill(255, 215, 0);
  rect(a + b, 0, b / 2, a + (1.25 * b) / 3);

  // #black_rectangle
  fill(13, 13, 13);
  rect(a, a + b, b / 2, (1 * b) / 2);

  // #black_rectangle2
  fill(13, 13, 13);
  rect(a + b / 2, a + b + (1 * b) / 2, b - b / 2, (1 * b) / 5);

  // #blue_rectangle
  fill(10, 50, 175);
  rect(a + b, a + b + (1 * b) / 2 - (1 * b) / 5, b / 2, (1 * b) / 2.5);

  // #bottom_left_yellow
  fill(255, 215, 0);
  rect(0, a + b + (1 * b) / 2 - (1 * b) / 5, a, (1 * b) / 2);

  // #bottom_right_red
  fill(255, 0, 0);
  rect(a + b + b / 2, a + b + (1 * b) / 2 - (1 * b) / 5, a, (1 * b) / 2);

  // #black_lines

  stroke(13, 13, 13);
  strokeWeight(12);
  strokeCap(SQUARE);

  // #vertical_lines
  line(a, 0, a, x); // #1
  line(a + b, 0, a + b, x); // #2
  line(a + b / 2, a + b, a + b / 2, x); // #3
  line(a + b + b / 2, a, a + b + b / 2, x); // #4

  // #horizontal_lines
  line(0, a, x, a); // #1
  line(0, a + b, x, a + b); // #2
  line(a + b, a + (1.25 * b) / 3, x, a + (1.25 * b) / 3); // #3
  line(
    0,
    a + b + (1 * b) / 2 - (1 * b) / 5,
    x,
    a + b + (1 * b) / 2 - (1 * b) / 5,
  ); // #4
  line(
    a + b / 2,
    a + b + (1 * b) / 2 + (1 * b) / 5,
    x - (1 * b) / 3.5,
    a + b + (1 * b) / 2 + (1 * b) / 5,
  ); // #5
}
