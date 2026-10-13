// Set to false once everything works to hide the on-canvas warnings
const DEBUG = true;

const FRAME_COUNT = 8;

let bgImage = null;
let disparityVid;
let graveyardVid;

// Arrays to hold the 8-frame image sequences
let kolahFrames = [];
let pesarFrames = [];
let sarvenazFrames = [];

// Image loading bookkeeping
let pendingImages = 0;
let loadedImages = 0;
let failedImages = [];

// State and selection variables
let currentState = "MAIN_MENU";
let selectedVideo = null; // Will store either disparityVid or graveyardVid
let selectedCharacter = null; // Will store 1, 2, 3, or 4

// Animation logic variables
let animFrame = 0; // Keeps track of the current frame (0 to 7.99)
let animSpeed = 0.05; // Adjust this to make the animation faster or slower
let charLoopCount = 0; // Counts how many times a character has fully animated
let sequenceIndex = 1; // Tracks which character is active for Option 4 (1, 2, or 3)

// NOTE: there is deliberately NO preload() here.
// p5.js 2.x no longer calls preload(), so images loaded there silently never
// arrive. Loading with callbacks in setup() works in both p5 1.x and 2.x.

function setup() {
  let cnv = createCanvas(384, 512);
  cnv.parent("sketch-holder");

  loadAllImages();

  disparityVid = createVideo("files/disparity.mp4");
  graveyardVid = createVideo("files/graveyard.mp4");

  disparityVid.hide();
  graveyardVid.hide();

  textAlign(CENTER, CENTER);
}

// Loads one image and reports success or failure (with the exact path) in the console
function loadImg(path, onLoaded) {
  pendingImages++;
  loadImage(
    path,
    (img) => {
      onLoaded(img);
      loadedImages++;
      imageSettled();
    },
    () => {
      failedImages.push(path);
      console.error("Could not load image: " + path);
      imageSettled();
    },
  );
}

function imageSettled() {
  pendingImages--;
  if (pendingImages === 0) {
    console.log(
      "Images finished: " +
        loadedImages +
        " loaded, " +
        failedImages.length +
        " failed",
    );
    if (failedImages.length > 0) {
      console.log(
        "Check spelling, capital letters, and folder names for:\n" +
          failedImages.join("\n"),
      );
    }
  }
}

function loadAllImages() {
  loadImg("files/menu.png", (img) => {
    bgImage = img;
  });

  for (let i = 1; i <= FRAME_COUNT; i++) {
    loadImg(
      "files/characters/kolah-ghermezi/kolah-ghermezi-" + i + ".png",
      (img) => {
        kolahFrames[i - 1] = img;
      },
    );
    loadImg(
      "files/characters/pesar-khaleh/pesar-khaleh-" + i + ".png",
      (img) => {
        pesarFrames[i - 1] = img;
      },
    );
    loadImg("files/characters/sarvenaz/sarvenaz-" + i + ".png", (img) => {
      sarvenazFrames[i - 1] = img;
    });
  }
}

// Small red/white note in the corner so you can see loading problems on the canvas
function drawDebugNote() {
  if (!DEBUG) return;

  let msg = null;
  if (pendingImages > 0) {
    msg = "Loading images... (" + pendingImages + " left)";
  } else if (failedImages.length > 0) {
    msg = failedImages.length + " image(s) failed - press F12 for the console";
  }
  if (!msg) return;

  push();
  textFont("monospace");
  textSize(10);
  textAlign(LEFT, BOTTOM);
  noStroke();
  fill(255, 80, 80);
  text(msg, 6, height - 6);
  pop();
}

function draw() {
  if (currentState === "MAIN_MENU") {
    drawMainMenu();
  } else if (currentState === "CHAR_MENU") {
    drawCharMenu();
  } else if (currentState === "PLAYING") {
    drawPlaying();
  }
  drawDebugNote();
}

function drawMainMenu() {
  if (bgImage) {
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
    textFont("monospace");
    textSize(14);
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
    // Stretches the frame to the canvas bounds; transparent PNGs let the video show through.
    image(framesToDraw[currentIntegerFrame], 0, 0, width, height);
  }

  // 4. Advance the animation
  animFrame += animSpeed;

  // When a full 8-frame animation loop finishes:
  if (animFrame >= FRAME_COUNT) {
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
