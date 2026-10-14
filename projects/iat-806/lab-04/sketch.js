let frames = []; // first dance animation
let frames2 = []; // second dance animation
let numFrames = 8;

let numcol = 8;
let numrows = 4;
let gridMultiplier = 1;
let minMultiplier = 0.5;
let maxMultiplier = 4;

let speed = [];
let colorOffset = [];

const colorPalette = ["#9c4a4a", "#c9a227", "#e8e2d0", "#3a3530"];

const SCALE_BOOST = 1.2; // bump this to tweak overall animation size

async function setup() {
  createCanvas(800, 400);

  for (let i = 0; i < numFrames; i++) {
    let fileName = "dance_frames/dancer" + i + ".png";
    try {
      let img = await loadImage(fileName);
      frames.push(img);
    } catch (err) {
      console.error("FAILED to load:", fileName, err);
    }
  }

  for (let i = 0; i < numFrames; i++) {
    let fileName = "dance_frames2/dancer" + i + ".png"; // update this path
    try {
      let img = await loadImage(fileName);
      frames2.push(img);
    } catch (err) {
      console.error("FAILED to load:", fileName, err);
    }
  }

  console.log("Animation 1 frames loaded:", frames.length);
  console.log("Animation 2 frames loaded:", frames2.length);

  regenerateGrid();
}

function regenerateGrid() {
  let cols = numcol * gridMultiplier;
  let rows = numrows * gridMultiplier;

  speed = [];
  colorOffset = [];
  for (let i = 0; i < cols; i++) {
    speed[i] = [];
    colorOffset[i] = [];
    for (let j = 0; j < rows; j++) {
      speed[i][j] = random(8, 20);
      colorOffset[i][j] = floor(random(colorPalette.length));
    }
  }
}

function draw() {
  background(120);

  let hasFrames1 = frames.length > 0;
  let hasFrames2 = frames2.length > 0;

  if (!hasFrames1 && !hasFrames2) {
    fill(255, 100, 100);
    textAlign(CENTER, CENTER);
    text(
      "No animation frames loaded — check the console",
      width / 2,
      height / 2,
    );
    return;
  }

  let cols = numcol * gridMultiplier;
  let rows = numrows * gridMultiplier;
  let colWidth = width / cols;
  let rowHeight = height / rows;

  if (speed.length !== cols || (speed[0] && speed[0].length !== rows)) {
    regenerateGrid();
  }

  let mouseCol = constrain(floor(mouseX / colWidth), 0, cols - 1);
  let mouseRow = constrain(floor(mouseY / rowHeight), 0, rows - 1);

  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      let dist = max(abs(i - mouseCol), abs(j - mouseRow));

      let rateMultiplier;
      if (dist === 0) rateMultiplier = 4;
      else if (dist === 1) rateMultiplier = 2;
      else if (dist === 2) rateMultiplier = 1;
      else rateMultiplier = 0.5;

      let effectiveSpeed = speed[i][j] / rateMultiplier;

      let colorIndex = getFrameindex(
        effectiveSpeed,
        colorPalette.length,
        colorOffset[i][j],
      );
      fill(colorPalette[colorIndex]);
      rect(i * colWidth, j * rowHeight, colWidth, rowHeight);

      let cellX = i * colWidth;
      let cellY = j * rowHeight;

      if (hasFrames1 && hasFrames2) {
        // Both loaded: side by side, each centered in its own half
        let halfWidth = colWidth / 2;
        animate(frames, effectiveSpeed, cellX, cellY, halfWidth, rowHeight);
        animate(
          frames2,
          effectiveSpeed,
          cellX + halfWidth,
          cellY,
          halfWidth,
          rowHeight,
        );
      } else if (hasFrames1) {
        // Only animation 1 loaded: use the whole cell, not just half
        animate(frames, effectiveSpeed, cellX, cellY, colWidth, rowHeight);
      } else {
        animate(frames2, effectiveSpeed, cellX, cellY, colWidth, rowHeight);
      }
    }
  }
}

function animate(frameSet, frameSpeed, boxX, boxY, boxW, boxH) {
  if (frameSet.length === 0) return;
  let index = getFrameindex(frameSpeed, frameSet.length, 0);
  let img = frameSet[index];

  let scale = min(boxW / img.width, boxH / img.height) * SCALE_BOOST;
  let drawW = img.width * scale;
  let drawH = img.height * scale;

  // Centered on the box's center point, even if the boosted scale
  // makes the image larger than the box itself
  let drawX = boxX + (boxW - drawW) / 2;
  let drawY = boxY + (boxH - drawH) / 2;

  image(img, drawX, drawY, drawW, drawH);
}

function getFrameindex(frameSpeed, totalFrames, offset = 0) {
  if (totalFrames === 0) return 0;
  let slowFrame = Math.floor(frameCount / frameSpeed);
  return (slowFrame + offset) % totalFrames;
}

function keyPressed() {
  if (key === " ") {
    if (keyIsDown(SHIFT)) {
      gridMultiplier = constrain(
        gridMultiplier / 2,
        minMultiplier,
        maxMultiplier,
      );
    } else {
      gridMultiplier = constrain(
        gridMultiplier * 2,
        minMultiplier,
        maxMultiplier,
      );
    }
    regenerateGrid();
    return false;
  }
}
