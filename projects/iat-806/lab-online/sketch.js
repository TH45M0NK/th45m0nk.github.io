let frames = [];
let numFrames = 8;
let centerx = 32;
let centery = 4;

async function setup() {
  createCanvas(256, 256);
  for (let i = 0; i < numFrames; i++) {
    frames.push(await loadImage(`Ken101-Frames/export/${i + 1}.png`));
  }
}

function draw() {
  background(0, 0, 0);
  image(frames[0], 0, 0);
  fill(255);

  let speed = 10;
  let slowFrame = floor(frameCount / speed);
  let index = slowFrame % frames.length;

  //text(frameCount, 192, 128);
  //text(floor(frameCount / speed), 10, 20);
  //text(index, 192, 148);
  //console.log(index);

  if (index == 0) {
    image(frames[0], centerx, centery);
  } else {
    image(frames[index], centerx, centery);
  }
}
