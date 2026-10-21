function setup() {
  noCanvas(); // plain <img> elements — not a canvas, so there's no one-canvas-per-sketch limit to run into

  let numImages = 7;

  for (let i = 0; i < numImages; i++) {
    let imgElement = createImg(
      "storage/StoryBoard-Presentation-" + i + ".jpg",
      "Storyboard panel " + (i + 1), // alt text
    );
    imgElement.parent("sketch-holder");

    // Full container width, height left to the browser — this is what
    // keeps the aspect ratio correct with no cropping or distortion,
    // and it re-adjusts automatically on any window resize, no JS needed
    imgElement.style("width", "100%");
    imgElement.style("height", "auto");
    imgElement.style("display", "block");
  }
}
