let x = 512;
let size = 55;
let circleX = 55;
let circleY = 55;
let speedx = 4.2;
let speedy = 2.5;
let sizeincrement = 1;
let radius = size / 2;

// giallorossi colors
let romaRed = "#8E1D2D";
let romaYellow = "#F0B515";

// darker shades for the background checkerboard
let darkRomaRed = "#220509";
let darkRomaYellow = "#2D2204";

// a variable for logo
let logo;
let song;
let isPlaying = false; // a "flag" to remember if the music is currently on or off

// loading the logo image and canvas

function setup() {
  const canvas = createCanvas(x, x);
  canvas.parent("sketch-holder");

  // draw images from their center point
  imageMode(CENTER);

  // load the anthem

  song = createAudio("roma-roma-roma-lq.mp3");

  // loading the image asynchronously similar to turtle image - using callback
  loadImage(
    "as-roma-logo.png",
    (img) => {
      logo = img;
      console.log("forza roma!");
    },
    (err) => {
      // This runs if the file is missing or broken
      console.error("Failed to load image. Check the file name and location.");
    },
  );
}

function draw() {
  background(20);
  noStroke();
  let centerX = width / 2;
  let centerY = height / 2;

  // ----------------------------------------------------
  // giallorossi background flag - from lab 1
  // ----------------------------------------------------
  fill(darkRomaYellow);
  rect(0, 0, centerX, centerY);

  fill(darkRomaRed);
  rect(centerX, 0, centerX, centerY);

  fill(darkRomaRed);
  rect(0, centerY, centerX, centerY);

  fill(darkRomaYellow);
  rect(centerX, centerY, centerX, centerY);

  // ----------------------------------------------------
  // movements, bounce
  // ----------------------------------------------------
  circleX = circleX + speedx;
  circleY = circleY + speedy;

  size = size + sizeincrement;
  if (size < 23 || size > 150) {
    sizeincrement = sizeincrement * -1;
  }
  radius = size / 2;

  if (circleX > width - radius) {
    circleX = width - radius;
    speedx = speedx * -1;
  } else if (circleX < radius) {
    circleX = radius;
    speedx = speedx * -1;
  }

  if (circleY > height - radius) {
    circleY = height - radius;
    speedy = speedy * -1;
  } else if (circleY < radius) {
    circleY = radius;
    speedy = speedy * -1;
  }

  // ----------------------------------------------------
  // changing color based on position
  // ----------------------------------------------------
  // We create two temporary variables to hold our color choices
  let ballColor;
  let borderColor;

  if (circleX < centerX) {
    if (circleY < centerY) {
      ballColor = romaRed; // Top-Left
      borderColor = romaYellow; // Reverse!
    } else {
      ballColor = romaYellow; // Bottom-Left
      borderColor = romaRed; // Reverse!
    }
  } else {
    if (circleY < centerY) {
      ballColor = romaYellow; // Top-Right
      borderColor = romaRed; // Reverse!
    } else {
      ballColor = romaRed; // Bottom-Right
      borderColor = romaYellow; // Reverse!
    }
  }

  // Draw the base solid ball (Layer 1)
  noStroke();
  fill(ballColor);
  circle(circleX, circleY, size);

  // ----------------------------------------------------
  // 4. DRAW THE AS ROMA LOGO (Layer 2)
  // ----------------------------------------------------
  if (logo) {
    let logoSize = size * 0.7;
    image(logo, circleX, circleY, logoSize, logoSize);
  }

  // ----------------------------------------------------
  //top stroke
  // ----------------------------------------------------
  noFill(); // top stroke
  stroke(borderColor); // reverse color of the ball
  strokeWeight((4 * size) / 35);
  circle(circleX, circleY, size); // Draw the hollow ring exactly over the ball
}

function mousePressed() {
  let randomSpeedX = random(2, 7);
  let randomSpeedY = random(2, 7);

  if (random(1) > 0.5) randomSpeedX = randomSpeedX * -1;
  if (random(1) > 0.5) randomSpeedY = randomSpeedY * -1;

  speedx = randomSpeedX;
  speedy = randomSpeedY;
}

function keyPressed() {
  // space bar check
  if (key === " ") {
    if (isPlaying) {
      song.stop(); // .stop() halts the audio and rewinds it to 0:00
      isPlaying = false;
    } else {
      song.loop(); // .loop() hits play AND tells it to repeat forever
      isPlaying = true;
    }

    // Crucial: Browsers normally scroll down the page when you hit Spacebar.
    // Returning 'false' blocks the browser from scrolling, keeping your sketch in view!
    return false;
  }
}
