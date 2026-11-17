// Geometry Weaver
// The body silhouette supplies the geometry. HandPose detects circular
// hand movements: clockwise adds complexity; counterclockwise reduces it.

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const CAMERA_WIDTH = 640;
const CAMERA_HEIGHT = 480;
const OUTLINE_POINTS = 64;
const MAX_HANDS = 2;

let video;
let bodySegmentation;
let handPose;

let bodyPresent = false;
let bodyCenter = { x: 0, y: 0 };
let boundaryNodes = [];

let geometryNodes = [];
let geometryEdges = [];
let geometryPointCount = 0;

let score = 0;
let activeShapeIndex = 0;
let handTracks = [];
let lastGestureTime = 0;

const RESET_BUTTON = { x: CANVAS_WIDTH - 92, y: 18, w: 72, h: 28 };

const segmentationOptions = {
  maskType: "person",
  // A slightly more sensitive threshold helps retain arms and hands.
  segmentationThreshold: 0.35,
};

const SHAPES = [
  { name: "TRIANGLE" },
  { name: "TETRAHEDRON" },
  { name: "HEXAGON" },
  { name: "METATRON'S CUBE" },
  { name: "E8-INSPIRED PROJECTION" },
];

async function setup() {
  const canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
  canvas.parent("sketch-holder");
  pixelDensity(1);
  frameRate(30);

  handTracks = Array.from({ length: MAX_HANDS }, createHandTrack);

  // Start the camera before loading either model. Both models use this feed.
  video = createCapture(VIDEO);
  video.size(CAMERA_WIDTH, CAMERA_HEIGHT);
  video.hide();

  // Load the two models independently so a HandPose loading issue does not
  // prevent the existing body segmentation from working.
  try {
    bodySegmentation = await ml5.bodySegmentation(
      "SelfieSegmentation",
      segmentationOptions,
    );
    bodySegmentation.detectStart(video, gotSegmentation);
  } catch (error) {
    console.error("Body segmentation could not start:", error);
  }

  try {
    if (typeof ml5.handPose !== "function") {
      throw new Error("This ml5.js version does not provide handPose().");
    }
    handPose = await ml5.handPose();
    handPose.detectStart(video, gotHands);
  } catch (error) {
    console.error("Hand tracking could not start:", error);
  }
}

function draw() {
  background(0);

  if (bodyPresent) {
    const shape = buildCurrentGeometry();
    updateGeometryNodes(shape.points);
    geometryEdges = shape.edges;
    geometryPointCount = shape.points.length;

    drawBodyContour();
    drawGeometry();
  }

  drawHandMarkers();
  drawResetButton();
}

// ---------------------------------------------------------------------------
// BODY SEGMENTATION
// ---------------------------------------------------------------------------

function gotSegmentation(result) {
  const mask =
    result && (result.mask || result.personMask || result.segmentation);

  if (!mask) {
    bodyPresent = false;
    return;
  }

  updateBodyTracking(mask);
}

function updateBodyTracking(mask) {
  const reader = createMaskReader(mask);
  if (!reader) {
    bodyPresent = false;
    return;
  }

  // Scan the mask to estimate the person's centre and bounding box.
  // The pixel array is loaded once per model result, not once per draw frame.
  const sampleStep = 3;
  let minX = reader.width;
  let minY = reader.height;
  let maxX = 0;
  let maxY = 0;
  let sumX = 0;
  let sumY = 0;
  let samples = 0;

  for (let y = 0; y < reader.height; y += sampleStep) {
    for (let x = 0; x < reader.width; x += sampleStep) {
      if (!reader.isPerson(x, y)) continue;

      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      sumX += x;
      sumY += y;
      samples++;
    }
  }

  if (samples < 35 || maxX - minX < 18 || maxY - minY < 35) {
    bodyPresent = false;
    return;
  }

  const scaleX = width / reader.width;
  const scaleY = height / reader.height;
  const detectedCenter = {
    x: (sumX / samples) * scaleX,
    y: (sumY / samples) * scaleY,
  };

  if (bodyPresent) {
    bodyCenter.x = lerp(bodyCenter.x, detectedCenter.x, 0.32);
    bodyCenter.y = lerp(bodyCenter.y, detectedCenter.y, 0.32);
  } else {
    bodyCenter = detectedCenter;
  }

  const detectedOutline = traceBoundaryNodes(
    reader,
    sumX / samples,
    sumY / samples,
    minX,
    minY,
    maxX,
    maxY,
    OUTLINE_POINTS,
    scaleX,
    scaleY,
  );

  // Smooth the outline over time to reduce mask flicker.
  if (boundaryNodes.length === detectedOutline.length) {
    for (let i = 0; i < detectedOutline.length; i++) {
      boundaryNodes[i].x = lerp(boundaryNodes[i].x, detectedOutline[i].x, 0.38);
      boundaryNodes[i].y = lerp(boundaryNodes[i].y, detectedOutline[i].y, 0.38);
    }
  } else {
    boundaryNodes = detectedOutline;
  }

  bodyPresent = boundaryNodes.length === OUTLINE_POINTS;
}

function createMaskReader(mask) {
  const maskWidth = mask.width || width;
  const maskHeight = mask.height || height;
  let pixels = null;

  try {
    if (typeof mask.loadPixels === "function") {
      mask.loadPixels();
      pixels = mask.pixels;
    }
  } catch (error) {
    pixels = null;
  }

  const hasPixels = pixels && pixels.length >= maskWidth * maskHeight * 4;

  return {
    width: maskWidth,
    height: maskHeight,
    isPerson(x, y) {
      const px = constrain(Math.floor(x), 0, maskWidth - 1);
      const py = constrain(Math.floor(y), 0, maskHeight - 1);

      if (hasPixels) {
        const alpha = pixels[(py * maskWidth + px) * 4 + 3];
        // Retains the foreground-mask convention used in the original sketch.
        return alpha < 128;
      }

      if (typeof mask.get === "function") {
        const pixel = mask.get(px, py);
        return pixel && pixel[3] < 128;
      }

      return false;
    },
  };
}

function traceBoundaryNodes(
  reader,
  centerX,
  centerY,
  minX,
  minY,
  maxX,
  maxY,
  count,
  scaleX,
  scaleY,
) {
  const nodes = [];
  const maxDistance = Math.hypot(maxX - minX, maxY - minY);

  for (let i = 0; i < count; i++) {
    const angle = -HALF_PI + (TWO_PI * i) / count;
    const directionX = Math.cos(angle);
    const directionY = Math.sin(angle);
    let lastInside = null;
    let enteredSubject = false;

    // A denser radial scan gives a more detailed contour than the old 24-node
    // outline while keeping the implementation lightweight.
    for (let distance = 0; distance <= maxDistance; distance += 1.5) {
      const x = Math.round(centerX + directionX * distance);
      const y = Math.round(centerY + directionY * distance);

      if (x < 0 || x >= reader.width || y < 0 || y >= reader.height) break;

      if (reader.isPerson(x, y)) {
        enteredSubject = true;
        lastInside = { x, y };
      } else if (enteredSubject) {
        break;
      }
    }

    if (!lastInside) {
      const radiusX = (maxX - minX) * 0.5;
      const radiusY = (maxY - minY) * 0.5;
      lastInside = {
        x: centerX + directionX * radiusX,
        y: centerY + directionY * radiusY,
      };
    }

    nodes.push({
      x: lastInside.x * scaleX,
      y: lastInside.y * scaleY,
    });
  }

  return nodes;
}

// ---------------------------------------------------------------------------
// HAND TRACKING AND CLOCKWISE / COUNTERCLOCKWISE GESTURES
// ---------------------------------------------------------------------------

function createHandTrack() {
  return {
    history: [],
    palm: null,
    tip: null,
    lastSeen: 0,
    cooldownUntil: 0,
    visible: false,
  };
}

function gotHands(results) {
  const detected = [];

  for (const hand of Array.isArray(results) ? results : []) {
    const palm = getPalmCenter(hand);
    const tip = getLandmark(hand, "index_finger_tip", 8);
    if (palm && tip)
      detected.push({ palm: toCanvasPoint(palm), tip: toCanvasPoint(tip) });
  }

  // Match detections to the nearest recent track. This prevents the two hands
  // from swapping trails when they cross in front of the camera.
  const assignedHands = matchHandsToTracks(detected);
  const now = millis();

  for (let i = 0; i < handTracks.length; i++) {
    const track = handTracks[i];
    const hand = assignedHands[i];

    if (!hand) {
      if (now - track.lastSeen > 450) {
        track.visible = false;
        track.history = [];
        track.palm = null;
        track.tip = null;
      }
      continue;
    }

    track.visible = true;
    const jumped =
      track.palm &&
      dist(track.palm.x, track.palm.y, hand.palm.x, hand.palm.y) > 230;
    track.lastSeen = now;
    track.palm =
      track.palm && !jumped
        ? {
            x: lerp(track.palm.x, hand.palm.x, 0.42),
            y: lerp(track.palm.y, hand.palm.y, 0.42),
          }
        : hand.palm;
    track.tip =
      track.tip && !jumped
        ? {
            x: lerp(track.tip.x, hand.tip.x, 0.55),
            y: lerp(track.tip.y, hand.tip.y, 0.55),
          }
        : hand.tip;
    if (jumped) track.history = [];

    track.history.push({ x: track.tip.x, y: track.tip.y, time: now });
    while (track.history.length > 0 && now - track.history[0].time > 3000) {
      track.history.shift();
    }

    const direction = detectCircularGesture(track, now);
    if (direction !== 0 && bodyPresent && now - lastGestureTime > 700) {
      applyGesture(direction);
      lastGestureTime = now;
      track.history = [];
      track.cooldownUntil = now + 900;
    }
  }
}

function matchHandsToTracks(detected) {
  const assigned = [null, null];
  if (detected.length === 0) return assigned;

  const now = millis();
  const activeTracks = handTracks
    .map((track, index) => ({ track, index }))
    .filter(({ track }) => track.palm && now - track.lastSeen < 700);

  if (detected.length === 1) {
    if (activeTracks.length > 0) {
      activeTracks.sort(
        (a, b) =>
          dist(
            a.track.palm.x,
            a.track.palm.y,
            detected[0].palm.x,
            detected[0].palm.y,
          ) -
          dist(
            b.track.palm.x,
            b.track.palm.y,
            detected[0].palm.x,
            detected[0].palm.y,
          ),
      );
      assigned[activeTracks[0].index] = detected[0];
    } else {
      assigned[0] = detected[0];
    }
    return assigned;
  }

  // With two detections, keep the closest previous hand-to-trail assignment.
  if (activeTracks.length === 2) {
    const direct =
      dist(
        handTracks[0].palm.x,
        handTracks[0].palm.y,
        detected[0].palm.x,
        detected[0].palm.y,
      ) +
      dist(
        handTracks[1].palm.x,
        handTracks[1].palm.y,
        detected[1].palm.x,
        detected[1].palm.y,
      );
    const crossed =
      dist(
        handTracks[0].palm.x,
        handTracks[0].palm.y,
        detected[1].palm.x,
        detected[1].palm.y,
      ) +
      dist(
        handTracks[1].palm.x,
        handTracks[1].palm.y,
        detected[0].palm.x,
        detected[0].palm.y,
      );

    if (crossed < direct) {
      assigned[0] = detected[1];
      assigned[1] = detected[0];
    } else {
      assigned[0] = detected[0];
      assigned[1] = detected[1];
    }
    return assigned;
  }

  // If only one hand was tracked before this frame, match it to the nearest
  // detection and start the other trail with the remaining hand.
  if (activeTracks.length === 1) {
    const activeIndex = activeTracks[0].index;
    const firstDistance = dist(
      activeTracks[0].track.palm.x,
      activeTracks[0].track.palm.y,
      detected[0].palm.x,
      detected[0].palm.y,
    );
    const secondDistance = dist(
      activeTracks[0].track.palm.x,
      activeTracks[0].track.palm.y,
      detected[1].palm.x,
      detected[1].palm.y,
    );
    const nearestIndex = firstDistance <= secondDistance ? 0 : 1;
    assigned[activeIndex] = detected[nearestIndex];
    assigned[1 - activeIndex] = detected[1 - nearestIndex];
    return assigned;
  }

  detected.sort((a, b) => a.palm.x - b.palm.x);
  assigned[0] = detected[0];
  assigned[1] = detected[1];
  return assigned;
}

function getLandmark(hand, name, fallbackIndex) {
  if (
    hand &&
    hand[name] &&
    Number.isFinite(hand[name].x) &&
    Number.isFinite(hand[name].y)
  ) {
    return { x: hand[name].x, y: hand[name].y };
  }

  const keypoints = hand && Array.isArray(hand.keypoints) ? hand.keypoints : [];
  const named = keypoints.find((point) => point.name === name);
  const point = named || keypoints[fallbackIndex];

  if (point && Number.isFinite(point.x) && Number.isFinite(point.y)) {
    return { x: point.x, y: point.y };
  }
  return null;
}

function getPalmCenter(hand) {
  // The wrist and four knuckles give a steadier hand position than a fingertip
  // alone, especially when the fingers bend during a circular movement.
  const landmarks = [
    ["wrist", 0],
    ["index_finger_mcp", 5],
    ["middle_finger_mcp", 9],
    ["ring_finger_mcp", 13],
    ["pinky_mcp", 17],
  ];

  const points = landmarks
    .map(([name, index]) => getLandmark(hand, name, index))
    .filter(Boolean);

  if (points.length < 3)
    return (
      getLandmark(hand, "wrist", 0) || getLandmark(hand, "index_finger_tip", 8)
    );

  return {
    x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
    y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
  };
}

function toCanvasPoint(point) {
  const sourceWidth =
    video && video.elt && video.elt.videoWidth ? video.elt.videoWidth : width;
  const sourceHeight =
    video && video.elt && video.elt.videoHeight
      ? video.elt.videoHeight
      : height;
  return {
    x: point.x * (width / sourceWidth),
    y: point.y * (height / sourceHeight),
  };
}

function detectCircularGesture(track, now) {
  if (now < track.cooldownUntil || track.history.length < 22) return 0;

  const points = track.history;
  let pathLength = 0;
  let centerX = 0;
  let centerY = 0;

  for (let i = 0; i < points.length; i++) {
    centerX += points[i].x;
    centerY += points[i].y;
    if (i > 0) {
      pathLength += dist(
        points[i - 1].x,
        points[i - 1].y,
        points[i].x,
        points[i].y,
      );
    }
  }

  centerX /= points.length;
  centerY /= points.length;

  if (pathLength < 170) return 0;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let signedTurn = 0;
  let totalTurn = 0;

  for (const point of points) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }

  // A genuine circle should cover meaningful distance in both dimensions.
  if (maxX - minX < 42 || maxY - minY < 42) return 0;

  for (let i = 1; i < points.length; i++) {
    const previousAngle = Math.atan2(
      points[i - 1].y - centerY,
      points[i - 1].x - centerX,
    );
    const currentAngle = Math.atan2(
      points[i].y - centerY,
      points[i].x - centerX,
    );
    const delta = normalizeAngle(currentAngle - previousAngle);
    signedTurn += delta;
    totalTurn += Math.abs(delta);
  }

  // Screen coordinates have a downward-positive Y axis. Therefore a positive
  // accumulated angle is clockwise as seen by the player on the screen.
  const directionConsistency =
    totalTurn > 0 ? Math.abs(signedTurn) / totalTurn : 0;
  if (Math.abs(signedTurn) > PI * 1.65 && directionConsistency > 0.62) {
    return signedTurn > 0 ? 1 : -1;
  }

  return 0;
}

function normalizeAngle(angle) {
  while (angle > PI) angle -= TWO_PI;
  while (angle < -PI) angle += TWO_PI;
  return angle;
}

function applyGesture(direction) {
  if (direction > 0) {
    // Clockwise: add points and advance one geometric stage.
    score += 10;
    activeShapeIndex = Math.min(activeShapeIndex + 1, SHAPES.length - 1);
  } else {
    // Counterclockwise: move back toward simpler geometry.
    activeShapeIndex = Math.max(activeShapeIndex - 1, 0);
  }
}

// ---------------------------------------------------------------------------
// GEOMETRY GENERATION
// ---------------------------------------------------------------------------

function buildCurrentGeometry() {
  const center = { x: bodyCenter.x, y: bodyCenter.y };

  if (activeShapeIndex === 0) {
    const points = [outlineAt(0, 3), outlineAt(1, 3), outlineAt(2, 3)];
    return { points, edges: completeEdges(points.length) };
  }

  if (activeShapeIndex === 1) {
    const points = [outlineAt(0), outlineAt(1), outlineAt(2), outlineAt(3)];
    return { points, edges: completeEdges(points.length) };
  }

  if (activeShapeIndex === 2) {
    const points = Array.from({ length: 6 }, (_, i) => outlineAt(i, 6));
    const edges = [];
    for (let i = 0; i < 6; i++) {
      addEdge(edges, i, (i + 1) % 6);
      addEdge(edges, i, (i + 2) % 6);
    }
    return { points, edges };
  }

  if (activeShapeIndex === 3) {
    // Metatron's Cube: a centre, an inner hexagon and an outer hexagon.
    const outer = Array.from({ length: 6 }, (_, i) => outlineAt(i, 6));
    const points = [center];
    for (const point of outer) {
      points.push({
        x: lerp(center.x, point.x, 0.5),
        y: lerp(center.y, point.y, 0.5),
      });
    }
    points.push(...outer);
    return { points, edges: completeEdges(points.length) };
  }

  // An artistic E8-inspired 2D lattice, not a mathematical projection of all
  // 240 roots of the E8 root system.
  const points = [center];
  const ringStarts = [];
  const ringScales = [0.32, 0.64, 1];
  const directions = Array.from({ length: 8 }, (_, i) => i);

  for (const scale of ringScales) {
    ringStarts.push(points.length);
    for (const index of directions) {
      const boundaryPoint = outlineAt(index, 8);
      points.push({
        x: lerp(center.x, boundaryPoint.x, scale),
        y: lerp(center.y, boundaryPoint.y, scale),
      });
    }
  }

  const edges = [];
  for (let ring = 0; ring < 3; ring++) {
    const start = ringStarts[ring];
    for (let i = 0; i < 8; i++) {
      addEdge(edges, start + i, start + ((i + 1) % 8));
      addEdge(edges, start + i, start + ((i + 2) % 8));
      if (ring === 2) addEdge(edges, start + i, start + ((i + 3) % 8));
    }
  }

  for (let i = 0; i < 8; i++) {
    addEdge(edges, 0, ringStarts[0] + i);
    addEdge(edges, ringStarts[0] + i, ringStarts[1] + i);
    addEdge(edges, ringStarts[1] + i, ringStarts[2] + i);
    addEdge(edges, ringStarts[0] + i, ringStarts[1] + ((i + 1) % 8));
    addEdge(edges, ringStarts[1] + i, ringStarts[2] + ((i + 1) % 8));
  }

  return { points, edges };
}

function outlineAt(index, total = 4) {
  const pointIndex =
    Math.round((index * boundaryNodes.length) / total) % boundaryNodes.length;
  return boundaryNodes[pointIndex];
}

function completeEdges(pointCount) {
  const edges = [];
  for (let i = 0; i < pointCount; i++) {
    for (let j = i + 1; j < pointCount; j++) addEdge(edges, i, j);
  }
  return edges;
}

function addEdge(edges, first, second) {
  if (first === second) return;
  const a = Math.min(first, second);
  const b = Math.max(first, second);
  if (!edges.some((edge) => edge[0] === a && edge[1] === b)) edges.push([a, b]);
}

function updateGeometryNodes(points) {
  while (geometryNodes.length < points.length) {
    geometryNodes.push(new GeometryNode(bodyCenter.x, bodyCenter.y));
  }

  for (let i = 0; i < points.length; i++) {
    geometryNodes[i].setTarget(points[i].x, points[i].y);
    geometryNodes[i].update();
  }
}

// ---------------------------------------------------------------------------
// DRAWING
// ---------------------------------------------------------------------------

function drawBodyContour() {
  if (boundaryNodes.length < 3) return;

  push();
  noFill();
  stroke(255);
  strokeWeight(1.6);
  beginShape();
  for (const point of boundaryNodes) vertex(point.x, point.y);
  endShape(CLOSE);
  pop();
}

function drawGeometry() {
  push();
  const pulse = 0.5 + 0.5 * sin(frameCount * 0.035);
  stroke(255, 150 + pulse * 75);
  strokeWeight(activeShapeIndex >= 3 ? 0.9 : 1.2);

  for (const edge of geometryEdges) {
    const first = geometryNodes[edge[0]];
    const second = geometryNodes[edge[1]];
    if (first && second) line(first.x, first.y, second.x, second.y);
  }

  for (let i = 0; i < geometryPointCount; i++) {
    geometryNodes[i].show(activeShapeIndex >= 3);
  }
  pop();
}

function drawHandMarkers() {
  push();
  for (const track of handTracks) {
    if (!track.visible || !track.tip) continue;
    noFill();
    stroke(255, 190);
    strokeWeight(1);
    circle(track.tip.x, track.tip.y, 17);
    noStroke();
    fill(255);
    circle(track.tip.x, track.tip.y, 4);
  }
  pop();
}

function drawResetButton() {
  push();
  rectMode(CORNER);
  stroke(255, 180);
  strokeWeight(1);
  noFill();
  rect(RESET_BUTTON.x, RESET_BUTTON.y, RESET_BUTTON.w, RESET_BUTTON.h, 14);
  noStroke();
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(9);
  textFont("sans-serif");
  text(
    "RESET",
    RESET_BUTTON.x + RESET_BUTTON.w / 2,
    RESET_BUTTON.y + RESET_BUTTON.h / 2 + 0.5,
  );
  pop();
}

function mousePressed() {
  const insideButton =
    mouseX >= RESET_BUTTON.x &&
    mouseX <= RESET_BUTTON.x + RESET_BUTTON.w &&
    mouseY >= RESET_BUTTON.y &&
    mouseY <= RESET_BUTTON.y + RESET_BUTTON.h;

  if (insideButton) resetGame();
}

function resetGame() {
  score = 0;
  activeShapeIndex = 0;
  lastGestureTime = 0;
  handTracks = Array.from({ length: MAX_HANDS }, createHandTrack);
}
