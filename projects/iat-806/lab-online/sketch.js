let bgImage;
let disparityVid;
let graveyardVid;

let currentState = "MENU";
let isMenuLoaded = false;

// Character arrays and variables
let kolahFrames = [];
let pesarFrames = [];
let sarvenazFrames = [];
let numFrames = 8;

let selectedVideo = null;
let selectedCharacter = null;

function preload() {
  // Load the menu image
  bgImage = loadImage("storage/menu.png", () => {
    isMenuLoaded = true;
  });

  // Load all 24 character frames here.
  // 24 small PNGs is completely safe and won't crash the browser!
  for (let i = 0; i < numFrames; i++) {
    kolahFrames.push(
      loadImage(
        `storage/characters/kolah-ghermezi/kolah-ghermezi-${i + 1}.png`,
      ),
    );
    pesarFrames.push(
      loadImage(`storage/characters/pesar-khaleh/pesar-khaleh-${i + 1}.png`),
    );
    sarvenazFrames.push(
      loadImage(`storage/characters/sarvenaz/sarvenaz-${i + 1}.png`),
    );
  }
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
  } else if (currentState === "CHAR_MENU") {
    drawCharMenu();
  } else if (currentState === "PLAYING") {
    drawPlaying();
  }
}

function drawMenu() {
  if (isMenuLoaded) {
    image(bgImage, 0, 0, width, height);
  } else {
    background(0);
  }

  textFont("'Press Start 2P', monospace");
  textSize(24);

  // Draw "DISPARITY" button
  if (mouseX > 100 && mouseX < 284 && mouseY > 180 && mouseY < 220) {
    fill(255, 255, 0);
  } else {
    fill(255);
  }
  text("disparity", width / 2, 200);

  // Draw "GRAVEYARD" button
  if (mouseX > 100 && mouseX < 284 && mouseY > 280 && mouseY < 320) {
    fill(255, 255, 0);
  } else {
    fill(255);
  }
  text("graveyard", width / 2, 300);
}

function drawCharMenu() {
  background(20, 20, 40);

  textFont("'Press Start 2P', monospace");
  fill(255);
  textSize(14);
  text("Choose Character:", width / 2, 50);

  textSize(12);

  if (mouseX > 50 && mouseX < 334 && mouseY > 130 && mouseY < 170)
    fill(255, 255, 0);
  else fill(255);
  text("1. kolah-ghermezi", width / 2, 150);

  if (mouseX > 50 && mouseX < 334 && mouseY > 230 && mouseY < 270)
    fill(255, 255, 0);
  else fill(255);
  text("2. pesar-khaleh", width / 2, 250);

  if (mouseX > 50 && mouseX < 334 && mouseY > 330 && mouseY < 370)
    fill(255, 255, 0);
  else fill(255);
  text("3. sarvenaz", width / 2, 350);

  if (mouseX > 50 && mouseX < 334 && mouseY > 430 && mouseY < 470)
    fill(255, 255, 0);
  else fill(255);
  text("4. loop all three", width / 2, 450);
}

function drawPlaying() {
  // 1. Draw the background video
  if (selectedVideo && selectedVideo.width > 0) {
    image(selectedVideo, 0, 0, width, height);
  } else {
    background(0);
    fill(255);
    text("Loading video...", width / 2, height / 2);
  }

  // 2. YOUR ANIMATION TECHNIQUE
  let speed = 10;
  let slowFrame = floor(frameCount / speed);

  // Find out which exact frame (0-7) to draw right now
  let index = slowFrame % numFrames;
  let framesToDraw = null;

  if (selectedCharacter === 1) {
    framesToDraw = kolahFrames;
  } else if (selectedCharacter === 2) {
    framesToDraw = pesarFrames;
  } else if (selectedCharacter === 3) {
    framesToDraw = sarvenazFrames;
  } else if (selectedCharacter === 4) {
    // Option 4 Logic:
    // Total cycle is 48 frames (3 characters * 2 loops * 8 frames)
    let cycleFrame = slowFrame % 48;

    // Switch characters perfectly every 16 frames (2 loops)
    if (cycleFrame < 16) {
      framesToDraw = kolahFrames;
    } else if (cycleFrame < 32) {
      framesToDraw = pesarFrames;
    } else {
      framesToDraw = sarvenazFrames;
    }
  }

  // 3. Draw the character overlay on top of the MP4
  if (framesToDraw && framesToDraw[index]) {
    image(framesToDraw[index], 0, 0, width, height);
  }
}

function mousePressed() {
  if (currentState === "MENU") {
    if (mouseX > 100 && mouseX < 284 && mouseY > 180 && mouseY < 220) {
      selectedVideo = disparityVid;
      currentState = "CHAR_MENU";
    } else if (mouseX > 100 && mouseX < 284 && mouseY > 280 && mouseY < 320) {
      selectedVideo = graveyardVid;
      currentState = "CHAR_MENU";
    }
  } else if (currentState === "CHAR_MENU") {
    if (mouseX > 50 && mouseX < 334 && mouseY > 130 && mouseY < 170) {
      selectedCharacter = 1;
      startGame();
    } else if (mouseX > 50 && mouseX < 334 && mouseY > 230 && mouseY < 270) {
      selectedCharacter = 2;
      startGame();
    } else if (mouseX > 50 && mouseX < 334 && mouseY > 330 && mouseY < 370) {
      selectedCharacter = 3;
      startGame();
    } else if (mouseX > 50 && mouseX < 334 && mouseY > 430 && mouseY < 470) {
      selectedCharacter = 4;
      startGame();
    }
  } else if (currentState === "PLAYING") {
    currentState = "MENU";
    selectedVideo.pause();
    selectedVideo.time(0);
    selectedVideo = null;
    selectedCharacter = null;
  }
}

function startGame() {
  currentState = "PLAYING";
  // Reset the frameCount so the animation always starts cleanly on frame 0
  frameCount = 0;
  selectedVideo.loop();
}
