// KardunTurtle — give the turtle instructions and watch it draw.
//
// Everything you need to change is in this file.

// ==========================================
// turtle-instructions.js
// ==========================================

function giveInstructions(turtle) {
  turtle.penColor("#ff7a3c");
  turtle.penWidth(4);

  // Press a face onto the canvas, so we can see where we started.
  turtle.stamp();

  turtle.penColor("#ffd900");

  // Draw the Seed of Life pattern
  turtle.repeat(6, () => {
    // Draw one complete circle
    turtle.repeat(360, () => {
      turtle.forward(2);
      turtle.right(1);
    });

    // turn 60 degrees to angle the next circle perfectly
    turtle.right(60);
  });
}

// Press R to start over.
function handleTurtleKeys(p, turtle) {
  if (p.key === "r" || p.key === "R") {
    turtle.reset();
    giveInstructions(turtle);
  }
}

// ---------------------------------------------------------------
// Everything the turtle understands
// ---------------------------------------------------------------
//
//   turtle.forward(100)        walk forward, drawing if the pen is down
//   turtle.backward(100)       walk backward
//   turtle.right(90)           turn clockwise, in degrees
//   turtle.left(90)            turn counter-clockwise
//
//   turtle.penUp()             stop drawing
//   turtle.penDown()           start drawing again
//   turtle.penColor("red")     any p5 color
//   turtle.penWidth(8)         line thickness
//
//   turtle.goTo(100, 200)      jump to a point
//   turtle.setHeading(0)       0 = right, 90 = down, -90 = up
//   turtle.home()              back to the start, facing up
//   turtle.stamp()             print the turtle's face onto the drawing
//   turtle.erase()             wipe the drawing, keep the turtle
//   turtle.repeat(4, fn)       do a set of instructions n times
//
//   turtle.setSpeed(4)         pixels per frame — bigger is faster
//   turtle.instant()           no animation, draw it all at once
//   turtle.setSize(80)         how big the turtle is drawn
//   turtle.hide() / .show()    show or hide the turtle itself
//   turtle.reset()             clear everything
