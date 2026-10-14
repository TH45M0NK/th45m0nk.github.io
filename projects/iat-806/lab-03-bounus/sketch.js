// Set to false once everything works to hide the on-canvas warnings
const DEBUG = true;

const FRAME_COUNT = 8;

// ---- menu look - UI (edit these to tweak the menus) ----
const MENU_FONT = "'Press Start 2P', monospace";
const MENU_TEXT_SIZE = 22; // one size for every menu label
const BTN_W = 256; // black rectangle width
const BTN_H = 32; // black rectangle height

// y = vertical centre of each button on the 384 x 512 canvas
const MAIN_BUTTONS = [
  { label: "disparity", y: 200 },
  { label: "graveyard", y: 300 },
];

// order matters: button 1 -> character 1, button 2 -> character 2, and so on
const CHAR_BUTTONS = [
  { label: "kolah-ghermezi", y: 150 },
  { label: "pesar-khaleh", y: 250 },
  { label: "sarvenaz", y: 350 },
  { label: "all out crazy", y: 450 },
];

let bgImage = null;
let disparityVid;
let graveyardVid;

// arrays to hold the 8-frame image sequences
let kolahFrames = [];
let pesarFrames = [];
let sarvenazFrames = [];

// image loading bookkeeping - A.I assisted
let pendingImages = 0;
let loadedImages = 0;
let failedImages = [];

// state and selection variables
let currentState = "MAIN_MENU";
let selectedVideo = null; // will store either disparityVid or graveyardVid
let selectedCharacter = null; // will store 1, 2, 3, or 4

// Animation logic variables
let animFrame = 0; // Keeps track of the current frame (0 to 7.99)
let animSpeed = 0.075; // Adjust this to make the animation faster or slower
let charLoopCount = 0; // Counts how many times a character has fully animated
let sequenceIndex = 1; // Tracks which character is active for Option 4 (1, 2, or 3)

// there is deliberately NO preload() here.
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

// ---- Menu helpers (shared by both menus) ----

// menu.png behind the menu, or dark blue if the image didn't load
function drawMenuBackground() {
  if (bgImage) {
    image(bgImage, 0, 0, width, height);
  } else {
    background(20, 20, 40);
  }
}

// True when the mouse is inside a button's black rectangle (used for hover and clicks)
function isOverButton(btn) {
  return abs(mouseX - width / 2) < BTN_W / 2 && abs(mouseY - btn.y) < BTN_H / 2;
}

// Black rectangle with the label on top; the label turns yellow on hover
function drawButton(btn) {
  push();
  rectMode(CENTER);
  noStroke();
  fill(0);
  rect(width / 2, btn.y, BTN_W, BTN_H);

  textFont(MENU_FONT);
  textSize(MENU_TEXT_SIZE);
  textAlign(CENTER, CENTER);
  if (isOverButton(btn)) {
    fill(255, 255, 0);
  } else {
    fill(255);
  }
  text(btn.label, width / 2, btn.y);
  pop();
}

// Black panel holding the heading text (one string per line)
function drawHeading(lines, centreY) {
  const lineH = MENU_TEXT_SIZE + 10;
  const panelH = lines.length * lineH + 20;

  push();
  rectMode(CENTER);
  noStroke();
  fill(0);
  rect(width / 2, centreY, BTN_W, panelH);

  textFont(MENU_FONT);
  textSize(MENU_TEXT_SIZE);
  textAlign(CENTER, CENTER);
  fill(255);
  for (let i = 0; i < lines.length; i++) {
    text(lines[i], width / 2, centreY - panelH / 2 + 10 + lineH * (i + 0.5));
  }
  pop();
}

function drawMainMenu() {
  drawMenuBackground();
  MAIN_BUTTONS.forEach((btn) => drawButton(btn));
}

function drawCharMenu() {
  drawMenuBackground();
  drawHeading(["character", "selection:"], 60);
  CHAR_BUTTONS.forEach((btn) => drawButton(btn));
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
    if (isOverButton(MAIN_BUTTONS[0])) {
      selectedVideo = disparityVid;
      currentState = "CHAR_MENU";
    } else if (isOverButton(MAIN_BUTTONS[1])) {
      selectedVideo = graveyardVid;
      currentState = "CHAR_MENU";
    }
  } else if (currentState === "CHAR_MENU") {
    // Select Character: button 1 -> 1, button 2 -> 2, button 3 -> 3, "all out crazy" -> 4
    for (let i = 0; i < CHAR_BUTTONS.length; i++) {
      if (isOverButton(CHAR_BUTTONS[i])) {
        selectedCharacter = i + 1;
        startGame();
        break;
      }
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
