let bgImage;
let disparityVid;
let graveyardVid;

// Arrays to hold the 8-frame image sequences
let kolahFrames = [];
let pesarFrames = [];
let sarvenazFrames = [];

// State and selection variables
let currentState = "MAIN_MENU";
let selectedVideo = null; // Will store either disparityVid or graveyardVid
let selectedCharacter = null; // Will store 1, 2, 3, or 4

// Animation logic variables
let animFrame = 0; // Keeps track of the current frame (0 to 7.99)
let animSpeed = 0.2; // Adjust this to make the animation faster or slower
let charLoopCount = 0; // Counts how many times a character has fully animated
let sequenceIndex = 1; // Tracks which character is active for Option 4 (1, 2, or 3)

function preload() {
  // Load the background image (we will leave it in case it suddenly works!)
  bgImage = loadImage("storage/menu.png");

  // Load the 8 frames for all 3 characters
  for (let i = 1; i <= 8; i++) {
    kolahFrames.push(
      loadImage(
        "storage/characters/kolah-ghermezi/kolah-ghermezi-" + i + ".png",
      ),
    );
    pesarFrames.push(
      loadImage("storage/characters/pesar-khaleh/pesar-khaleh-" + i + ".png"),
    );
    sarvenazFrames.push(
      loadImage("storage/characters/sarvenaz/sarvenaz-" + i + ".png"),
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
  if (currentState === "MAIN_MENU") {
    drawMainMenu();
  } else if (currentState === "CHAR_MENU") {
    drawCharMenu();
  } else if (currentState === "PLAYING") {
    drawPlaying();
  }
}

function drawMainMenu() {
  if (bgImage && bgImage.width > 0) {
    image(bgImage, 0, 0, width, height);
  } else {
    background(0);
  }

  textFont("'Press Start 2P', monospace");
  textSize(20);

  // Draw "DISPARITY" button
  if (mouseX > 50 && mouseX < 334 && mouseY > 180 && mouseY < 220) {
    fill(255, 255, 0);
  } else {
    fill(255);
  }
  text("disparity", width / 2, 200);

  // Draw "GRAVEYARD" button
  if (mouseX > 50 && mouseX < 334 && mouseY > 280 && mouseY < 320) {
    fill(255, 255, 0);
  } else {
    fill(255);
  }
  text("graveyard", width / 2, 300);
}

function drawCharMenu() {
  background(20, 20, 40); // Dark blue background for the character menu

  textFont("'Press Start 2P', monospace");
  fill(255);
  textSize(14); // Smaller text so the long names fit on the canvas
  text("Choose Character:", width / 2, 50);

  textSize(12);

  // Option 1: Kolah-Ghermezi
  if (mouseX > 50 && mouseX < 334 && mouseY > 130 && mouseY < 170)
    fill(255, 255, 0);
  else fill(255);
  text("1. kolah-ghermezi", width / 2, 150);

  // Option 2: Pesar-Khaleh
  if (mouseX > 50 && mouseX < 334 && mouseY > 230 && mouseY < 270)
    fill(255, 255, 0);
  else fill(255);
  text("2. pesar-khaleh", width / 2, 250);

  // Option 3: Sarvenaz
  if (mouseX > 50 && mouseX < 334 && mouseY > 330 && mouseY < 370)
    fill(255, 255, 0);
  else fill(255);
  text("3. sarvenaz", width / 2, 350);

  // Option 4: Show All (Looping)
  if (mouseX > 50 && mouseX < 334 && mouseY > 430 && mouseY < 470)
    fill(255, 255, 0);
  else fill(255);
  text("4. loop all three", width / 2, 450);
}

function drawPlaying() {
  // 1. Draw the background video first
  if (selectedVideo && selectedVideo.width > 0) {
    image(selectedVideo, 0, 0, width, height);
  } else {
    background(0);
    fill(255);
    text("Loading video...", width / 2, height / 2);
  }

  // 2. Figure out which character array to use right now
  let framesToDraw = null;

  if (selectedCharacter === 1) framesToDraw = kolahFrames;
  else if (selectedCharacter === 2) framesToDraw = pesarFrames;
  else if (selectedCharacter === 3) framesToDraw = sarvenazFrames;
  else if (selectedCharacter === 4) {
    // For Option 4, sequenceIndex determines who is currently active
    if (sequenceIndex === 1) framesToDraw = kolahFrames;
    else if (sequenceIndex === 2) framesToDraw = pesarFrames;
    else if (sequenceIndex === 3) framesToDraw = sarvenazFrames;
  }

  // 3. Draw the current character frame on top of the video
  let currentIntegerFrame = Math.floor(animFrame);

  if (framesToDraw && framesToDraw[currentIntegerFrame]) {
    // This draws the character stretching to the canvas bounds.
    // If the PNGs are transparent overlays, this works perfectly.
    image(framesToDraw[currentIntegerFrame], 0, 0, width, height);
  }

  // 4. Advance the animation
  animFrame += animSpeed;

  // When a full 8-frame animation loop finishes:
  if (animFrame >= 8) {
    animFrame = 0; // Reset to frame 1

    // If we are on Option 4, count loops and switch characters
    if (selectedCharacter === 4) {
      charLoopCount++;
      if (charLoopCount >= 2) {
        charLoopCount = 0; // Reset loop counter
        sequenceIndex++; // Move to next character
        if (sequenceIndex > 3) sequenceIndex = 1; // Wrap back to the first character
      }
    }
  }
}

function mousePressed() {
  if (currentState === "MAIN_MENU") {
    // Select Video
    if (mouseX > 50 && mouseX < 334 && mouseY > 180 && mouseY < 220) {
      selectedVideo = disparityVid;
      currentState = "CHAR_MENU";
    } else if (mouseX > 50 && mouseX < 334 && mouseY > 280 && mouseY < 320) {
      selectedVideo = graveyardVid;
      currentState = "CHAR_MENU";
    }
  } else if (currentState === "CHAR_MENU") {
    // Select Character
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
    // Click anywhere to stop video and return to main menu
    currentState = "MAIN_MENU";
    selectedVideo.pause();
    selectedVideo.time(0);
    selectedVideo = null;
    selectedCharacter = null;
  }
}

// Helper function to reset animations and play the video
function startGame() {
  animFrame = 0;
  charLoopCount = 0;
  sequenceIndex = 1;
  currentState = "PLAYING";
  selectedVideo.loop();
}
