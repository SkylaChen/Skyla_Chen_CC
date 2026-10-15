let spiralDust = [];
let galaxySpin = 0;
let galaxyRadius = 0;
const galaxyTiltX = 1;
const galaxyTiltY =0.3;
let svgGalaxyFov = Math.PI / 3.5;

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  colorMode(HSB, 360, 100, 100, 100);
  perspective(svgGalaxyFov, width / height, 1, 5000);
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

// Create the small hollow circles along the spiral arms once.
function createScene() {
  spiralDust = []
  galaxyRadius = min(width, height) * 0.2

  // Put small hollow circles along three curved spiral arms.
  for (let arm = 0; arm < 3; arm++) {
    for (let i = 0; i < 100; i++) {
      let progress = i/60;
      let point = spiralPoint(arm, progress);
      let spread = 3 + progress * 15;

      spiralDust.push({
        x: point.x + random(-spread, spread),
        y: point.y + random(-spread, spread),
        z: point.z + random(-10, 10),
        size: random(3, 8),
        arm: arm,
        phase: random(TAU),
      });
    }
  }
}

function draw() {
  background(0, 0, 100);


  push();
  rotateX(galaxyTiltX);
  rotateY(galaxyTiltY);
  rotateZ(galaxySpin);
  drawGalaxy();
  pop();


  galaxySpin += 0.01;
}

function drawGalaxy() {
  noFill();

  // Four concentric outline rings around the galaxy.
  for (let ring = 0; ring < 4; ring++) {
    let size = galaxyRadius * (1.25 + ring * 0.24);
    stroke(0, 0, 0, 100);
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
    stroke(0, 0, 0, 200);
    strokeWeight(1);
    beginShape();
    for (let i = 0; i <= 200; i++) {
      let point = spiralPoint(arm, i / 200);
      vertex(point.x, point.y, point.z);
    }
    endShape();
  }

  // Small hollow circles form the stars inside the spiral arms.
  for (let dust of spiralDust) {
    let twinkle = 0.45 + 0.55 * (0.5 + 0.5 * sin(frameCount * 0.05 + dust.phase));
    stroke(0, 0, 0, 100);
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
  // push();
  stroke(0, 0, 0, 100);
  strokeWeight(1);
  ellipse(0, 0, 50, 50);
  // rotateX(HALF_PI);
  // ellipse(0, 0, 50, 50);
  // rotateY(HALF_PI);
  // ellipse(0, 0, 50, 50);
  // pop();

}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  svgGalaxyFov = Math.PI / 2.5;
  perspective(svgGalaxyFov, width / height, 1, 1000);
  createScene();
}

// p5.plotSvg records 2D drawing commands, so project this WEBGL scene to SVG paths.
function keyPressed() {
  if (key === 's' || key === 'S') {
    saveGalaxySvg();
    return false;
  }
}

function svgGalaxyRotate(x, y, z, spin) {
  // Matching the sketch's rotateX, rotateY, rotateZ order.
  let cs = Math.cos(spin), ss = Math.sin(spin);
  let x1 = x * cs - y * ss, y1 = x * ss + y * cs;
  let cy = Math.cos(galaxyTiltY), sy = Math.sin(galaxyTiltY);
  let x2 = x1 * cy + z * sy, z2 = -x1 * sy + z * cy;
  let cx = Math.cos(galaxyTiltX), sx = Math.sin(galaxyTiltX);
  return { x: x2, y: y1 * cx - z2 * sx, z: y1 * sx + z2 * cx };
}

function svgGalaxyProject(x, y, z) {
  let eyeZ = height / (2 * Math.tan(Math.PI / 6));
  let depth = eyeZ - z;
  if (depth <= 0) return null;
  let focalLength = height / (2 * Math.tan(svgGalaxyFov / 2));
  let scale = focalLength / depth;
  return { x: width / 2 + x * scale, y: height / 2 + y * scale, scale };
}

function svgGalaxyProjected(x, y, z, spin) {
  let p = svgGalaxyRotate(x, y, z, spin);
  return svgGalaxyProject(p.x, p.y, p.z);
}

function svgGalaxyPath(points, weight, closed) {
  let d = points.map((p, i) =>
    (i === 0 ? 'M' : 'L') + p.x.toFixed(2) + ' ' + p.y.toFixed(2)
  ).join(' ');
  if (closed) d += ' Z';
  return '<path d="' + d + '" fill="none" stroke="black"' +
    ' stroke-width="' + weight + '"/>';
}

function svgGalaxyCircle(p, radius, weight) {
  return '<circle cx="' + p.x.toFixed(2) + '" cy="' + p.y.toFixed(2) +
    '" r="' + (radius * p.scale).toFixed(2) +
    '" fill="none" stroke="black" stroke-width="' + weight + '"/>';
}

function saveGalaxySvg() {
  // draw() increments galaxySpin after painting, so subtract one step.
  let spin = galaxySpin - 0.003;
  let svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="' + width +
    '" height="' + height + '" viewBox="0 0 ' + width + ' ' + height + '">',
    '<rect width="100%" height="100%" fill="white"/>'
  ];

  for (let ring = 0; ring < 4; ring++) {
    let radius = galaxyRadius * (1.25 + ring * 0.24);
    let points = [];
    for (let i = 0; i < 480; i++) {
      let a = i * Math.PI * 2 / 480;
      points.push(svgGalaxyProjected(Math.cos(a) * radius, Math.sin(a) * radius, 0, spin));
    }
    svg.push(svgGalaxyPath(points, ring === 0 ? 1.5 : 1, true));
  }

  for (let arm = 0; arm < 3; arm++) {
    let points = [];
    for (let i = 0; i <= 300; i++) {
      let p = spiralPoint(arm, i / 300);
      points.push(svgGalaxyProjected(p.x, p.y, p.z, spin));
    }
    svg.push(svgGalaxyPath(points, 1.6, false));
  }

  for (let dust of spiralDust) {
    let twinkle = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(frameCount * 0.05 + dust.phase));
    let p = svgGalaxyProjected(dust.x, dust.y, dust.z, spin);
    if (p) {
      let size = dust.size * (1 + twinkle * 0.3);
      svg.push(svgGalaxyCircle(p, size / 2, 0.5));
    }
  }

  // Three small wire circles at right angles in the galaxy center.
  for (let ring = 0; ring < 3; ring++) {
    let points = [];
    for (let i = 0; i < 120; i++) {
      let a = i * Math.PI * 2 / 120;
      let x = Math.cos(a) * 25, y = Math.sin(a) * 25;
      if (ring === 0) points.push(svgGalaxyProjected(x, y, 0, spin));
      if (ring === 1) points.push(svgGalaxyProjected(x, 0, y, spin));
      if (ring === 2) points.push(svgGalaxyProjected(0, x, y, spin));
    }
    svg.push(svgGalaxyPath(points, 1, true));
  }

  svg.push('</svg>');
  let url = URL.createObjectURL(new Blob([svg.join('\n')], { type: 'image/svg+xml' }));
  let link = document.createElement('a');
  link.href = url;
  link.download = 'galaxy-' + Date.now() + '.svg';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
