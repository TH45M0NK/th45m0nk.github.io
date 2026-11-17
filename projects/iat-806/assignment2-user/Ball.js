// GeometryNode eases each generated vertex toward its latest target.
// This prevents the geometric wireframe from flickering with the camera mask.

class GeometryNode {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
  }

  setTarget(x, y) {
    this.targetX = x;
    this.targetY = y;
  }

  update() {
    this.x = lerp(this.x, this.targetX, 0.24);
    this.y = lerp(this.y, this.targetY, 0.24);
  }

  show(isComplex = false) {
    noStroke();
    fill(255, isComplex ? 38 : 55);
    circle(this.x, this.y, isComplex ? 13 : 10);
    fill(255, 245);
    circle(this.x, this.y, isComplex ? 3 : 4);
  }
}
