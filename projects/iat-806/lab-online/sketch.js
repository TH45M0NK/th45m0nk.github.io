let frames = [];
let numFrames = 8;
let centerx = 32 + 16;
let centery = 4 + 16;

async function setup() {
  createCanvas(256 + 32, 256 + 32);
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

let player;
let isPlayerReady = false;

// youtube api
function onYouTubeIframeAPIReady() {
  player = new YT.Player("yt-player", {
    height: "10",
    width: "10",
    videoId: "QJJYpsA5tv8", // YouTube Video ID
    playerVars: {
      playsinline: 1,
      controls: 0,
      disablekb: 1,
      autoplay: 1,
    },
    events: {
      onReady: (event) => {
        isPlayerReady = true;
        event.target.setVolume(100);
        event.target.playVideo(); // <-- Added this back so it actually attempts to play on load!
      },
    },
  });
}

// stop the animation and the audio on click
function mousePressed() {
  noLoop();
  if (isPlayerReady) {
    player.pauseVideo(); // Instantly pauses the YouTube audio
  }
}

// release everything to resume
function mouseReleased() {
  loop(); // Restarts the p5.js draw loop
  if (isPlayerReady) {
    player.playVideo(); // Resumes the YouTube audio
  }
}
