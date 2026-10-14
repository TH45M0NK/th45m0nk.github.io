let frames = [];
let numFrames = 8;
let numcol = 8;
let numrows = 4;
let gridMultiplier = 1;
let minMultiplier = 1;
let maxMultiplier = 8; // safety cap so the grid can't explode in cell count

let colors = [];
let speed = [];

async function setup() {
  createCanvas(800, 400);

  for (let i = 0; i < numFrames; i++) {
    let fileName = "blossoms/Blossoms" + i + ".jpg";
    frames.push(await loadImage(fileName));
  }

  regenerateGrid();
}

// (Re)builds colors/speed arrays to match the current effective grid size.
// Called whenever gridMultiplier changes, and safe to call any time
// numcol/numrows themselves get edited too.
function regenerateGrid() {
  let cols = numcol * gridMultiplier;
  let rows = numrows * gridMultiplier;

  colors = [];
  speed = [];
  for (let i = 0; i < cols; i++) {
    colors[i] = [];
    speed[i] = [];
    for (let j = 0; j < rows; j++) {
      colors[i][j] = [random(0, 255), 150, 200];
      speed[i][j] = random(8, 20);
    }
  }
}

function draw() {
  background(120);

  let cols = numcol * gridMultiplier;
  let rows = numrows * gridMultiplier;
  let colWidth = width / cols;
  let rowHeight = height / rows;

  // Defensive: if the grid size ever changes without regenerateGrid()
  // being called, rebuild instead of indexing into missing cells.
  if (colors.length !== cols || (colors[0] && colors[0].length !== rows)) {
    regenerateGrid();
  }

  // Which cell is the mouse currently over?
  let mouseCol = constrain(floor(mouseX / colWidth), 0, cols - 1);
  let mouseRow = constrain(floor(mouseY / rowHeight), 0, rows - 1);

  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      fill(colors[i][j][0], colors[i][j][1], colors[i][j][2]);
      rect(i * colWidth, j * rowHeight, colWidth, rowHeight);

      // Grid distance (in cells) from this cell to the mouse's cell
      let dist = max(abs(i - mouseCol), abs(j - mouseRow));

      // Playback-rate multiplier based on that distance: center 4x,
      // then 2x, 1x, 0.5x for each ring out
      let rateMultiplier;
      if (dist === 0) rateMultiplier = 4;
      else if (dist === 1) rateMultiplier = 2;
      else if (dist === 2) rateMultiplier = 1;
      else rateMultiplier = 0.5;

      // Lower "speed" value plays faster (frameCount / speed), so a
      // higher rate means dividing the base speed, not multiplying it
      let effectiveSpeed = speed[i][j] / rateMultiplier;

      animate(
        frames,
        effectiveSpeed,
        i * colWidth,
        j * rowHeight,
        colWidth,
        rowHeight,
      );
    }
  }
}

function animate(frames, frameSpeed, xpos, ypos, cellWidth, cellHeight) {
  let index = getFrameindex(frameSpeed);
  let currentFrame = frames[index];
  image(currentFrame, xpos, ypos, cellWidth, cellHeight);
}

function getFrameindex(frameSpeed) {
  let slowFrame = Math.floor(frameCount / frameSpeed);
  let index = slowFrame % frames.length;
  return index;
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
    return false; // stop the browser from scrolling the page on Space
  }
}
