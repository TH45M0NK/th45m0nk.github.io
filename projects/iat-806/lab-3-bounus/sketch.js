let bgImage;
let disparityVid;
let graveyardVid;

let currentState = "MENU";

function preload() {
  // Load the background image
  bgImage = loadImage("storage/menu.png");
}

function setup() {
  let cnv = createCanvas(384, 512);
  cnv.parent("sketch-holder");

  disparityVid = createVideo("storage/disparity.mp4");
  graveyardVid = createVideo("storage/graveyard.mp4");

  disparityVid.hide();
  graveyardVid.hide();

  textAlign(CENTER, CENTER);
}

function draw() {
  if (currentState === "MENU") {
    drawMenu();
  } else if (currentState === "DISPARITY") {
    if (disparityVid && disparityVid.width > 0) {
      image(disparityVid, 0, 0, width, height);
    } else {
      background(0);
      fill(255);
      text("Loading video...", width / 2, height / 2);
    }
  } else if (currentState === "GRAVEYARD") {
    if (graveyardVid && graveyardVid.width > 0) {
      image(graveyardVid, 0, 0, width, height);
    } else {
      background(0);
      fill(255);
      text("Loading video...", width / 2, height / 2);
    }
  }
}

function drawMenu() {
  // Safety check protects the code from crashing
  if (bgImage && bgImage.width > 0) {
    image(bgImage, 0, 0, width, height);
  } else {
    background(30);
    // DEBUG TEXT: This will show up on the grey screen if menu.jpg is missing
    fill(255, 100, 100);
    textSize(12);
    text("Cannot find 'storage/menu.jpg'", width / 2, 50);
  }

  // Ensure your Google font is being used!
  textFont("'Press Start 2P', monospace");
  textSize(24);

  // Draw "DISPARITY" button
  if (mouseX > 100 && mouseX < 284 && mouseY > 180 && mouseY < 220) {
    fill(255, 255, 0);
  } else {
    fill(255);
  }
  text("DISPARITY", width / 2, 200);

  // Draw "GRAVEYARD" button
  if (mouseX > 100 && mouseX < 284 && mouseY > 280 && mouseY < 320) {
    fill(255, 255, 0);
  } else {
    fill(255);
  }
  text("GRAVEYARD", width / 2, 300);
}

function mousePressed() {
  if (currentState === "MENU") {
    if (mouseX > 100 && mouseX < 284 && mouseY > 180 && mouseY < 220) {
      currentState = "DISPARITY";
      disparityVid.loop();
    } else if (mouseX > 100 && mouseX < 284 && mouseY > 280 && mouseY < 320) {
      currentState = "GRAVEYARD";
      graveyardVid.loop();
    }
  } else {
    currentState = "MENU";
    disparityVid.pause();
    disparityVid.time(0);
    graveyardVid.pause();
    graveyardVid.time(0);
  }
}
