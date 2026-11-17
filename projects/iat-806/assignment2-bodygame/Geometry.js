// a geometry is a list of points (the corners) and a list of lines between them.
// all the points are between -1 and 1, so we can draw a geometry at any size.
// each geometry is also a game level: it needs a number of nodes, and gives points.

const PHI = (1 + Math.sqrt(5)) / 2; // the golden ratio

class Geometry {
  // name is what we show on the screen
  // points is a list of [x, y, z]
  // lines is a list of [a, b], two numbers that are positions in the points list
  // count is how many nodes you need
  // score is how many points you get
  constructor(name, points, lines, count, score) {
    this.name = name;
    this.points = points;
    this.lines = lines;
    this.count = count;
    this.score = score;
    // flat shapes just spin on the page, solids spin in 3D.
    this.flat = points.every((p) => p[2] === 0);
    // true means "this many nodes or more" (E8 has 240 corners, a body can't make that many).
    this.orMore = false;
    // a picture of the shape, for the ones that have too many lines to draw every frame.
    this.picture = null;
  }

  matches(n) {
    return this.orMore ? n >= this.count : n === this.count;
  }

  // x, y is the center, size is the radius in pixels, angle is how much it is turned.
  draw(x, y, size, angle, alpha) {
    push();
    translate(x, y);
    if (this.picture) {
      drawingContext.globalAlpha = alpha / 255;
      imageMode(CENTER);
      rotate(angle);
      image(this.picture, 0, 0, size * 2, size * 2);
      drawingContext.globalAlpha = 1;
    } else {
      let turned = this.points.map((p) => this.turn(p, angle));
      stroke(240, 219, 25, alpha * 0.8);
      strokeWeight(1.5);
      for (let l of this.lines) {
        let a = turned[l[0]];
        let b = turned[l[1]];
        line(a[0] * size, a[1] * size, b[0] * size, b[1] * size);
      }
      noStroke();
      for (let p of turned) {
        // the points that are far away are a bit dimmer, so you can see the 3D.
        fill(255, 170, 0, alpha * map(p[2], -1, 1, 0.5, 1));
        circle(p[0] * size, p[1] * size, constrain(size * 0.25, 3, 9));
      }
    }
    pop();
  }

  // turns a point and gives back [x, y, depth]
  turn(p, angle) {
    let x = p[0];
    let y = p[1];
    let z = p[2];
    if (this.flat) {
      return [x * cos(angle) - y * sin(angle), x * sin(angle) + y * cos(angle), 0];
    }
    // spin around the up axis, then tilt it a little so we can see inside
    let x1 = x * cos(angle) + z * sin(angle);
    let z1 = -x * sin(angle) + z * cos(angle);
    let tilt = 0.5;
    return [x1, y * cos(tilt) - z1 * sin(tilt), y * sin(tilt) + z1 * cos(tilt)];
  }
}

// ---------------------------------------------------------------
// building the geometries
// ---------------------------------------------------------------

// all the geometries of the game, from the easiest to the hardest.
function makeGeometries() {
  let triangle = ring(3);
  let hexagon = ring(6);
  let tetrahedron = [
    [1, 1, 1],
    [1, -1, -1],
    [-1, 1, -1],
    [-1, -1, 1],
  ];
  let octahedron = [
    [1, 0, 0],
    [-1, 0, 0],
    [0, 1, 0],
    [0, -1, 0],
    [0, 0, 1],
    [0, 0, -1],
  ];
  let cube = signs(1, 1, 1);
  let icosahedron = [].concat(signs(0, 1, PHI), signs(1, PHI, 0), signs(PHI, 0, 1));
  let dodecahedron = [].concat(
    signs(1, 1, 1),
    signs(0, 1 / PHI, PHI),
    signs(1 / PHI, PHI, 0),
    signs(PHI, 0, 1 / PHI),
  );

  // metatron's cube: 13 circles. one in the middle, then 6 around it, then 6 more further away.
  let metatron = [[0, 0, 0]].concat(ring(6), ring(6, 2));

  let geometries = [
    solid("Triangle", triangle, 3, 30),
    solid("Tetrahedron", tetrahedron, 4, 60),
    solid("Hexagon", hexagon, 6, 100),
    solid("Octahedron", octahedron, 6, 120),
    solid("Cube", cube, 8, 150),
    solid("Icosahedron", icosahedron, 12, 250),
    new Geometry("Metatron's Cube", fit(metatron), allPairs(13), 13, 400),
    solid("Dodecahedron", dodecahedron, 20, 500),
    makeE8(),
  ];
  return geometries;
}

// a flat ring of points. 3 gives a triangle, 6 gives a hexagon.
function ring(n, radius = 1) {
  let points = [];
  for (let i = 0; i < n; i++) {
    let a = (TWO_PI * i) / n - HALF_PI;
    points.push([cos(a) * radius, sin(a) * radius, 0]);
  }
  return points;
}

// all the + and - versions of a point: (1, 1, 1) gives 8 corners, (0, 1, 2) gives 4.
function signs(x, y, z) {
  let points = [];
  for (let sx of x === 0 ? [1] : [1, -1]) {
    for (let sy of y === 0 ? [1] : [1, -1]) {
      for (let sz of z === 0 ? [1] : [1, -1]) {
        points.push([x * sx, y * sy, z * sz]);
      }
    }
  }
  return points;
}

// a platonic solid (or a polygon): we find its lines by joining the points that are closest to each other.
function solid(name, points, count, score) {
  points = fit(points);
  let closest = Infinity;
  for (let a = 0; a < points.length; a++) {
    for (let b = a + 1; b < points.length; b++) {
      closest = min(closest, between(points[a], points[b]));
    }
  }
  let lines = [];
  for (let a = 0; a < points.length; a++) {
    for (let b = a + 1; b < points.length; b++) {
      if (between(points[a], points[b]) < closest * 1.05) lines.push([a, b]);
    }
  }
  return new Geometry(name, points, lines, count, score);
}

// makes the points fit inside a circle of radius 1.
function fit(points) {
  let biggest = max(points.map((p) => hypot(p[0], p[1], p[2])));
  return points.map((p) => [p[0] / biggest, p[1] / biggest, p[2] / biggest]);
}

function allPairs(n) {
  let lines = [];
  for (let a = 0; a < n; a++) {
    for (let b = a + 1; b < n; b++) lines.push([a, b]);
  }
  return lines;
}

function between(a, b) {
  return hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

function hypot(x, y, z) {
  return Math.sqrt(x * x + y * y + z * z);
}

// E8 lives in 8 dimensions: it has 240 corners ("roots"), and every corner touches 56 others.
// we can't draw 8 dimensions, so we look at it from one special angle (the "coxeter plane").
// from there the 240 corners make 8 rings of 30. u and v are the two directions of that view.
function makeE8() {
  let u = [0, -0.11912, -0.19274, -0.21764, -0.19274, -0.11912, 0, -0.92193];
  let v = [-0.0969, -0.46351, -0.23693, 0, 0.23693, 0.46351, 0.66982, 0];

  let roots = [];
  // 112 roots: two numbers are +1 or -1, the other six are 0.
  for (let i = 0; i < 8; i++) {
    for (let j = i + 1; j < 8; j++) {
      for (let a of [-1, 1]) {
        for (let b of [-1, 1]) {
          let r = [0, 0, 0, 0, 0, 0, 0, 0];
          r[i] = a;
          r[j] = b;
          roots.push(r);
        }
      }
    }
  }
  // 128 roots: all eight numbers are +0.5 or -0.5, with an even number of minus signs.
  for (let m = 0; m < 256; m++) {
    let r = [];
    let minus = 0;
    for (let k = 0; k < 8; k++) {
      let isMinus = (m >> k) & 1;
      r.push(isMinus ? -0.5 : 0.5);
      minus += isMinus;
    }
    if (minus % 2 === 0) roots.push(r);
  }

  let points = fit(roots.map((r) => [dotProduct(r, u), dotProduct(r, v), 0]));
  // two corners are joined when their dot product is 1.
  let lines = [];
  for (let a = 0; a < roots.length; a++) {
    for (let b = a + 1; b < roots.length; b++) {
      if (Math.abs(dotProduct(roots[a], roots[b]) - 1) < 0.001) lines.push([a, b]);
    }
  }

  let e8 = new Geometry("E8", points, lines, 30, 1000);
  e8.orMore = true;

  // 6720 lines are too many to draw 60 times a second, so we draw them once on a picture.
  let size = 600;
  let picture = createGraphics(size, size);
  picture.translate(size / 2, size / 2);
  picture.stroke(240, 219, 25, 45);
  picture.strokeWeight(0.7);
  let s = size / 2 - 6;
  for (let l of lines) {
    let a = points[l[0]];
    let b = points[l[1]];
    picture.line(a[0] * s, a[1] * s, b[0] * s, b[1] * s);
  }
  picture.noStroke();
  picture.fill(255, 170, 0);
  for (let p of points) picture.circle(p[0] * s, p[1] * s, 4);
  e8.picture = picture;
  return e8;
}

function dotProduct(a, b) {
  let total = 0;
  for (let i = 0; i < a.length; i++) total += a[i] * b[i];
  return total;
}

// two geometries can need the same number of nodes (hexagon and octahedron).
// then you get the one you haven't found yet first.
function findGeometry(geometries, n, found) {
  let matches = geometries.filter((g) => g.matches(n));
  return matches.find((g) => !found.includes(g)) || matches[matches.length - 1];
}
