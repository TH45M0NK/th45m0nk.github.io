const sketch1 = (p) => {
  // sketch 1 - adjustments
  let frames = [];
  let numFrames = 8;
  let a = 32; // safe margin
  let centerx = 32 + a / 2;
  let centery = 4 + a / 2;

  p.setup = async () => {
    p.createCanvas(256 + a, 256 + a);
    for (let i = 0; i < numFrames; i++) {
      frames.push(await p.loadImage(`Ken101-Frames/${i + 1}.png`));
    }
  };

  p.draw = () => {
    if (frames.length === 0) return;

    p.background(0, 0, 0);
    p.fill(255);

    let speed = 10;
    let slowFrame = p.floor(p.frameCount / speed);
    let index = slowFrame % frames.length;

    p.image(frames[0], 0, 0);

    if (index == 0) {
      p.image(frames[0], centerx, centery);
    } else {
      p.image(frames[index], centerx, centery);
    }
  };
};

const sketch2 = (p) => {
  // sketch 2 - adjustments
  let frames2 = [];
  let numFrames = 8;
  let a = 32; // safe margin
  let centerx = 32 + a / 2;
  let centery = 4 + a / 2;

  p.setup = async () => {
    p.createCanvas(256 + a, 256 + a);
    for (let i = 0; i < numFrames; i++) {
      frames2.push(await p.loadImage(`Touka101-Frames/${i + 1}.png`));
    }
  };

  p.draw = () => {
    if (frames2.length === 0) return;

    p.background(0, 0, 0);
    p.fill(255);

    let speed = 10;
    let slowFrame = p.floor(p.frameCount / speed);
    let index = slowFrame % frames2.length;

    p.image(frames2[0], 0, 0);

    if (index == 0) {
      p.image(frames2[0], centerx, centery);
    } else {
      p.image(frames2[index], centerx, centery);
    }
  };
};

let p1 = new p5(sketch1, "sketch1");
let p2 = new p5(sketch2, "sketch2");

let player;
let isPlayerReady = false;

// youtube api
function onYouTubeIframeAPIReady() {
  player = new YT.Player("yt-player-kaneki", {
    height: "10",
    width: "10",
    videoId: "QJJYpsA5tv8", // YT id
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
        event.target.playVideo(); // <-- play on the load!
      },
    },
  });
}

// stop the animation and the audio on click
window.addEventListener("mousedown", () => {
  p1.noLoop();
  p2.noLoop();
  if (isPlayerReady) {
    player.pauseVideo(); // pause audio
  }
});

// release everything to resume
window.addEventListener("mouseup", () => {
  p1.loop();
  p2.loop();
  if (isPlayerReady) {
    player.playVideo(); // resume audio
  }
});
