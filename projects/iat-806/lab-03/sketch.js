let frames = [];
let numFrames = 8;
let colWidth;
let numcol = 8;
let numrows = 4;
let colors = [];
let speed = [];

async function setup() {
  createCanvas(800, 400);
  nomCols = maps(mousex, 0, width, 1, 20);

  for (let i = 0; i < numcol; i++) {
    colors[i] = [];
    speed[i] = [];
    for (let j = 0; j < numrows; j++) {
      colors[i][j] = [random(0, 255), 150, 200];
      speed[i][j] = random(8, 20);
    }
  }

  colWidth = width / numcol;

  for (let i = 0; i < numFrames; i++) {
    let fileName = "blossoms/Blossoms" + i + ".jpg";
    frames.push(await loadImage(fileName));
  }
}

function draw() {
  background(120);
  fill("black");

  rect(0, 0, colWidth, height);
  //fill(random(0, 255), 150, 200);
  for (let i = 0; i < numcol; i++) {
    for (let j = 0; j < numrows; j++) {
      fill(colors[i][j][0], colors[i][j][1], colors[i][j][2]);
      rect(i * colWidth, j * colWidth, colWidth, colWidth);
      animate(
        frames,
        speed[i][j],
        i * colWidth,
        j * colWidth,
        colWidth,
        colWidth,
      );
    }
  }

  let speed = 8;
  let imageWidth = 100;
  let imageHeight = 100;

  // let slowFrame = floor(frameCount / speed);
  // let index = slowFrame % frames.length;
  // text(index, 500, 160);
  // image(frames[index], 100, 100);

  // speed = 7;
  // slowFrame = floor(frameCount / speed);
  // index = slowFrame % frames.length;
  // text(index, 700, 200);
  // image(frames[index], 300, 100);

  function animate(frames, speed, xpostion, ypostion, imageWidth, imageHeight) {
    let index = getFrameindex(speed);
    let currentFrame = frames[index];
    let origWidth = currentFrame.width;
    let origHeight = currentFrame.height;
    //text("origWidth: " + origWidth, 500, 100);
    // text("origHeight: " + origHeight, 500, 120);
    if (imageWidth && !imageHeight) {
      let scale = imageWidth / origWidth;
      imageHeight = origHeight * scale;
    }
    image(currentFrame, xpostion, ypostion, imageWidth, imageHeight);
  }
}

function getFrameindex(speed) {
  let slowFrame = Math.floor(frameCount / speed);
  let index = slowFrame % frames.length;
  return index;
}
