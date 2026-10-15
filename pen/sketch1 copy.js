let backgroundStars = [];
let spiralDust = [];
let galaxySpin = 0;
let galaxyRadius = 0;
const galaxyTiltX = 1;
const galaxyTiltY =0.3;

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  colorMode(HSB, 360, 100, 100, 100);
  perspective(PI / 3.5, width / height, 1, 5000);
  createScene();
}

// One continuous spiral, shared by the lines and the small stars.
function spiralPoint(arm, progress) {
  let angle = arm * TAU / 3 + progress * TAU;
  let distance = 10 + progress * galaxyRadius*1.5;
  return {
    x: cos(angle) * distance,
    y: sin(angle) * distance,
    z: sin(angle * 2 + arm),
  };
}

//star field and small hollow circles once.
function createScene() {
  backgroundStars = []
  spiralDust = []
  galaxyRadius = min(width, height) * 0.23

  for (let i = 0; i < 100; i++) {
    backgroundStars.push({
      x: random(-width, width),
      y: random(-height, height),
      z: random(-500, -150),
      size: random(2, 6),
      phase: random(TAU),
    });
  }

  // Put small hollow circles along three curved spiral arms.
  for (let arm = 0; arm < 3; arm++) {
    for (let i = 0; i < 150; i++) {
      let progress = i / 150;
      let point = spiralPoint(arm, progress);
      let spread = 3 + progress * 15;

      spiralDust.push({
        x: point.x + random(-spread, spread),
        y: point.y + random(-spread, spread),
        z: point.z + random(-10, 10),
        size: random(3, 9),
        arm: arm,
        phase: random(TAU),
      });
    }
  }
}

function draw() {
  background(0);

  drawBackgroundStars();


  push();
  rotateX(galaxyTiltX);
  rotateY(galaxyTiltY);
  rotateZ(galaxySpin);
  drawGalaxy();
  pop();


  galaxySpin += 0.01;
}

function drawBackgroundStars() {
  noFill();
  for (let star of backgroundStars) {
    let twinkle = 0.35 + 0.65 * (0.5 + 0.5 * sin(frameCount * 0.035 + star.phase));
    stroke(195, 12, 85, 25 + twinkle * 65);
    strokeWeight(0.8);

    push();
    translate(star.x, star.y, star.z);
    let size = star.size * (0.9 + twinkle * 0.2);
    ellipse(0, 0, size, size);
    pop();
  }
}

function drawGalaxy() {
  noFill();

  // Four concentric outline rings around the galaxy.
  for (let ring = 0; ring < 4; ring++) {
    let size = galaxyRadius * (1.25 + ring * 0.24);
    stroke(190 + ring * 8, 40, 95, 30 - ring * 4);
    strokeWeight(ring === 0 ? 1.5 : 1);
    beginShape();
    for (let step = 0; step < 480; step++) {
      let angle = step * TAU / 480;
      vertex(cos(angle) * size, sin(angle) * size, 0);
    }
    endShape(CLOSE);
  }

  // Three arms.
  for (let arm = 0; arm < 3; arm++) {
    stroke(190 + arm * 16, 50, 100, 65);
    strokeWeight(1.6);
    beginShape();
    for (let i = 0; i <= 300; i++) {
      let point = spiralPoint(arm, i / 300);
      vertex(point.x, point.y, point.z);
    }
    endShape();
  }

  // Small hollow circles form the stars inside the spiral arms.
  for (let dust of spiralDust) {
    let twinkle = 0.45 + 0.55 * (0.5 + 0.5 * sin(frameCount * 0.05 + dust.phase));
    let hue = dust.arm === 2 ? 42 : 190 + dust.arm * 16;
    stroke(hue, dust.arm === 2 ? 45 : 38, 100, 35 + twinkle * 65);
    strokeWeight(0.5);

    push();
    translate(dust.x, dust.y, dust.z);
    // Undo the galaxy tilt around this star, so its outline faces the camera.
    rotateZ(-galaxySpin);
    rotateY(-galaxyTiltY);
    rotateX(-galaxyTiltX);
    let size = dust.size * (1 + twinkle * 0.3);
    ellipse(0, 0, size, size);
    pop();
  }

  // Three crossed wire rings make a 3D-looking, line-only center.
  push();
  stroke(42, 35, 100, 85);
  strokeWeight(1);
  ellipse(0, 0, 50, 50);
  rotateX(HALF_PI);
  ellipse(0, 0, 50, 50);
  rotateY(HALF_PI);
  ellipse(0, 0, 50, 50);
  pop();

}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  perspective(PI/2.5, width / height, 1, 1000);
  createScene();
}
