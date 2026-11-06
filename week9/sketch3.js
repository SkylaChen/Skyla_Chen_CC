// Week 9 — FaceMesh + your PSD artwork
// manifest.json keeps each PNG's size and position on the original PSD canvas.

let video;
let faceMesh;
let faces = [];
let modelReady = false;
let loadError = false;
let artError = false;
let artwork;
let avatarImages = {};

const ART_PATH = "assets/avatar-half/";
const RENDER_SCALE = 0.5; // Half width/height, one quarter of the canvas pixels.
const MIRROR_TRACKING = true;
const BLINK_THRESHOLD = 0.76; // Fraction of your normal open-eye height.
let eyeBaseline = null;
let eyeSamples = [];
let eyesClosed = false;

// Measure a neutral, closed mouth for each person instead of assuming one shape.
let mouthBaseline = null;
let mouthSamples = [];
function resetMouthCalibration() {
  mouthBaseline = null;
  mouthSamples = [];
  avatar.mouthOpen = 0;
  avatar.smiling = false;
  avatar.mouthLayer = "mouthClosed";
}
function keyPressed() {
  if (key === "h" || key === "H") handPanel.hidden = !handPanel.hidden;
  if (key === "c" || key === "C") {
    resetMouthCalibration();
    eyeBaseline = null;
    eyeSamples = [];
    eyesClosed = false;
    avatar.blinkUntil = 0;
    avatar.eyeOpen = 1;
  }
}

let avatar = {
  x: 480,
  y: 259.2,
  scale: 1,
  angle: 0,
  eyeOpen: 1,
  mouthOpen: 0,
  smiling: false,
  mouthWidth: 1,
  mouthLayer: "mouthClosed",
  blinkUntil: 0
};

async function setup() {
  pixelDensity(1);
  const canvas = createCanvas(1460, 1594);
  // CSS still fits the display to the screen independently of render resolution.
  canvas.parent("avatar-stage");
  textAlign(CENTER, CENTER);
  textFont("Arial");

  try {
    artwork = await loadJSON(ART_PATH + "manifest.json");
    resizeCanvas(
      Math.round(artwork.canvas.width * RENDER_SCALE),
      Math.round(artwork.canvas.height * RENDER_SCALE)
    );
    avatar.x = artwork.anchor.x;
    avatar.y = artwork.anchor.y;
    // Load sequentially to limit simultaneous image decoding on phones.
    for (const [name, layer] of Object.entries(artwork.layers)) {
      avatarImages[name] = await loadImage(ART_PATH + layer.file);
    }
  } catch (error) {
    console.error("Could not load avatar artwork:", error);
    const status = document.getElementById("avatar-load-status");
    if (status) status.textContent = "角色图片加载失败：" + error.message;
    artError = true;
    return;
  }

  video = createCapture(VIDEO);
  // Keep face tracking lightweight while the artwork renders at a higher resolution.
  video.size(640, 480);
  video.hide();
  createHandPanel();
  startFaceTracking();
  startHandTracking();
}

async function startFaceTracking() {
  try {
    faceMesh = await ml5.faceMesh();
    faceMesh.detectStart(video, gotFaces);
    modelReady = true;
  } catch (error) {
    console.error("Could not load FaceMesh:", error);
    loadError = true;
  }
}

function gotFaces(results) {
  faces = results;
  const points = results[0]?.keypoints;
  if (points && points.length >= 468) {
    updateEyes(points);
    updateMouth(points);
  }
}

function draw() {
  background(248, 246, 250);

  if (artError) {
    drawMessage("Artwork could not load. Open week9.html with Live Preview.");
    return;
  }
  if (!artwork || !avatarImages.frontHair) {
    drawMessage("Loading your artwork...");
    return;
  }

  const points = faces[0]?.keypoints;
  if (points && points.length >= 468) updateAvatar(points);

  // Keep the portrait visible while the model loads or the face leaves the camera.
  try {
    drawAvatar();
    const status = document.getElementById("avatar-load-status");
    if (status) status.textContent = "角色已绘制 · 1460 × 1594 · 手机轻量图层";
  } catch (error) {
    const status = document.getElementById("avatar-load-status");
    if (status) status.textContent = "角色绘制失败：" + error.message;
    console.error(error);
  }
  drawStatus();
  drawHandPreview();
}

function updateAvatar(points) {
  const bounds = getFaceBounds(points);
  const eyeLineAngle = atan2(
    points[263].y - points[33].y,
    points[263].x - points[33].x
  );

  const cameraX = MIRROR_TRACKING ? video.width - bounds.centerX : bounds.centerX;
  const targetX = artwork.anchor.x + (cameraX / video.width - 0.5) * artwork.canvas.width * 0.35;
  const targetY = artwork.anchor.y + (bounds.centerY / video.height - 0.5) * artwork.canvas.height * 0.25;
  const targetAngle = MIRROR_TRACKING ? -eyeLineAngle : eyeLineAngle;
  // Amplify camera distance changes while keeping the zoom within useful limits.
  const distanceRatio = bounds.width / 150;
  const targetScale = constrain(Math.pow(distanceRatio, 1.35), 0.80, 1.80);

  avatar.x = lerp(avatar.x, targetX, 0.2);
  avatar.y = lerp(avatar.y, targetY, 0.2);
  avatar.scale = lerp(avatar.scale, targetScale, 0.25);
  avatar.angle = lerp(avatar.angle, constrain(targetAngle, -0.35, 0.35), 0.2);

}

// Run once per new camera inference, not once per canvas redraw.
function updateMouth(points) {
  const mouthRatio = getMouthOpenRatio(points);
  const smile = getSmileMetrics(points);
  if (!mouthBaseline) {
    mouthSamples.push({ open: mouthRatio, lift: smile.lift, width: smile.width });
    if (mouthSamples.length >= 30) {
      const median = field => {
        const values = mouthSamples.map(sample => sample[field]).sort((a, b) => a - b);
        return (values[14] + values[15]) / 2;
      };
      mouthBaseline = { open: median("open"), lift: median("lift"), width: median("width") };
    }
    avatar.mouthOpen = 0;
    avatar.smiling = false;
    avatar.mouthLayer = "mouthClosed";
    return;
  }
  const opening = Math.max(0, mouthRatio - mouthBaseline.open);
  // Quick attack/release keeps short spoken syllables visible.
  avatar.mouthOpen = lerp(avatar.mouthOpen, opening, 0.85);
  const lift = smile.lift - mouthBaseline.lift;
  const widening = smile.width / Math.max(mouthBaseline.width, 0.01);
  // A slight corner lift and widening can identify a closed-lip smile.
  const smilingNow = avatar.smiling
    ? (lift > 0.004 && widening > 1.01) || lift > 0.014
    : (lift > 0.009 && widening > 1.025) || lift > 0.022;
  avatar.smiling = smilingNow;
  avatar.mouthWidth = widening;
  avatar.mouthLayer = classifyMouth(
    avatar.mouthOpen, widening, avatar.smiling, avatar.mouthLayer
  );
}

function getFaceBounds(points) {
  let minX = video.width;
  let maxX = 0;
  let minY = video.height;
  let maxY = 0;

  for (const point of points) {
    minX = min(minX, point.x);
    maxX = max(maxX, point.x);
    minY = min(minY, point.y);
    maxY = max(maxY, point.y);
  }

  return {
    width: maxX - minX,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2
  };
}

// Use fresh inference frames and a personal open-eye baseline.
function updateEyes(points) {
  const ratio = getEyeOpenRatio(points);
  if (!Number.isFinite(ratio) || ratio <= 0) return;
  if (eyeSamples.length < 20) {
    eyeSamples.push(ratio);
    const sorted = [...eyeSamples].sort((a, b) => a - b);
    eyeBaseline = sorted[Math.floor((sorted.length - 1) * 0.8)];
  }
  const openness = ratio / Math.max(eyeBaseline, 0.01);
  eyesClosed = openness < (eyesClosed ? 0.86 : BLINK_THRESHOLD);
  if (eyesClosed) avatar.blinkUntil = millis() + 65;
  if (eyesClosed || millis() < avatar.blinkUntil) avatar.eyeOpen = 0;
  else avatar.eyeOpen = openness < 0.88 ? 0.5 : 1;
}

function getEyeOpenRatio(points) {
  const leftHeight = dist(points[159].x, points[159].y, points[145].x, points[145].y);
  const leftWidth = dist(points[33].x, points[33].y, points[133].x, points[133].y);
  const rightHeight = dist(points[386].x, points[386].y, points[374].x, points[374].y);
  const rightWidth = dist(points[263].x, points[263].y, points[362].x, points[362].y);
  return (leftHeight / leftWidth + rightHeight / rightWidth) / 2;
}

function getMouthOpenRatio(points) {
  const mouthHeight = dist(points[13].x, points[13].y, points[14].x, points[14].y);
  const mouthWidth = dist(points[61].x, points[61].y, points[291].x, points[291].y);
  return mouthHeight / Math.max(mouthWidth, 1);
}

function getSmileMetrics(points) {
  const left = points[61];
  const right = points[291];
  const upper = points[13];
  const lower = points[14];
  const mouthWidth = Math.max(Math.hypot(right.x - left.x, right.y - left.y), 1);
  const eyeWidth = Math.max(Math.hypot(
    points[263].x - points[33].x, points[263].y - points[33].y
  ), 1);
  // Project onto the face's vertical axis so a head tilt isn't read as a smile.
  let normalX = -(right.y - left.y) / mouthWidth;
  let normalY = (right.x - left.x) / mouthWidth;
  const forehead = points[10];
  const chin = points[152];
  if (normalX * (chin.x - forehead.x) + normalY * (chin.y - forehead.y) < 0) {
    normalX = -normalX;
    normalY = -normalY;
  }
  const offsetX = (upper.x + lower.x - left.x - right.x) / 2;
  const offsetY = (upper.y + lower.y - left.y - right.y) / 2;
  return {
    lift: (offsetX * normalX + offsetY * normalY) / mouthWidth,
    width: mouthWidth / eyeWidth
  };
}

// FaceMesh measures lip geometry; an open smile approximates a toothy smile.
function classifyMouth(opening, widening, smiling, previous) {
  // An O-shaped mouth takes priority over a lingering smile detection.
  const roundOpening = previous === "mouthRound" ? 0.060 : 0.085;
  const roundWidth = previous === "mouthRound" ? 1.07 : 1.02;
  const rounded = opening > roundOpening && widening < roundWidth;
  const tallOpening = opening > (previous === "mouthRound" ? 0.25 : 0.30)
    && widening < 1.12;
  if (rounded || tallOpening) return "mouthRound";
  if (smiling) {
    // Closed-lip smile and parted-lip smile must use different drawings.
    const parted = previous === "mouthOpen" ? 0.018 : 0.030;
    if (opening <= parted) return "mouthRelaxed";
    if (opening > 0.24) return "mouthWide";
    return "mouthOpen";
  }
  // Hysteresis suppresses jitter without holding speech frames for a fixed time.
  const wasOpen = previous !== "mouthClosed" && previous !== "mouthRelaxed";
  if (opening < (wasOpen ? 0.020 : 0.035)) return "mouthClosed";
  if (opening > (previous === "mouthWide" ? 0.095 : 0.12)) return "mouthWide";
  return "mouthOpen";
}

function getMouthLayer() {
  return avatar.mouthLayer;
}

function drawAvatar() {
  push();
  // Keep all artwork/tracking coordinates in original PSD units.
  scale(RENDER_SCALE);
  translate(avatar.x, avatar.y);
  // Apply the existing camera-distance zoom within the reduced canvas.
  scale(avatar.scale);
  translate(-artwork.anchor.x, -artwork.anchor.y);

  drawArtLayer("backHair", true);
  drawArtLayer("neck");
  drawArtLayer("body");
  drawArtLayer("face", true);

  const eyes = avatar.eyeOpen < 0.22 ? "eyesClosed"
    : avatar.eyeOpen < 0.75 ? "eyesHalf" : "eyesOpen";
  drawArtLayer(eyes, true);

  drawArtLayer(getMouthLayer(), true);

  drawArtLayer("frontHair", true);
  pop();
}

function drawArtLayer(name, followsHead = false) {
  const layer = artwork.layers[name];
  push();
  if (followsHead) {
    const pivot = artwork.headPivot;
    translate(pivot.x, pivot.y);
    rotate(avatar.angle);
    translate(-pivot.x, -pivot.y);
  }
  // All hair uses the same head angle. No inertia is applied.
  image(avatarImages[name], layer.x, layer.y, layer.width, layer.height);
  pop();
}

function drawMessage(message) {
  fill(77, 70, 88);
  noStroke();
  textSize(14);
  text(message, width / 2, height / 2);
}

function drawStatus() {
  let message = "Face tracking active";
  if (loadError) message = "FaceMesh could not load. Check the browser console.";
  else if (!modelReady) message = "Loading FaceMesh...";
  else if (!faces[0]?.keypoints) message = "Show your face to the camera.";
  else if (!mouthBaseline) message = "Calibrating: eyes open, face relaxed, lips closed...";
  else message = "Face tracking active — press C with eyes open and lips closed to recalibrate.";

  noStroke();
  fill(248, 246, 250, 230);
  rect(0, height - 27, width, 27);
  fill(77, 70, 88);
  textSize(12);
  text(message, width / 2, height - 14);
}


// Hand experiment: shares the existing webcam; sketch2 stays independent.
let handPose;
let hands = [];
let handReady = false;
let handError = false;
let handUpdatedAt = 0;
let handStates = new Map();
let handPanel, handPreview, handLabel;
const HAND_CHAINS = [[0,1,2,3,4], [0,5,6,7,8], [0,9,10,11,12],
  [0,13,14,15,16], [0,17,18,19,20], [5,9,13,17]];

async function startHandTracking() {
  try {
    handPose = await ml5.handPose({ maxHands: 2 });
    handPose.detectStart(video, gotHands);
    handReady = true;
  } catch (error) {
    console.error("Could not load HandPose:", error);
    handError = true;
  }
}

function pointDistance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
function jointAngle(a, b, c) {
  const ux = a.x - b.x, uy = a.y - b.y;
  const vx = c.x - b.x, vy = c.y - b.y;
  const length = Math.hypot(ux, uy) * Math.hypot(vx, vy);
  if (length < 0.001) return 0;
  return Math.acos(Math.max(-1, Math.min(1, (ux * vx + uy * vy) / length))) * 180 / Math.PI;
}
function classifyGestureFeatures(fingers, pinched) {
  const [index, middle, ring, pinky] = fingers;
  if (pinched) return "捏合 / Pinch";
  if (index && middle && ring && pinky) return "张开手掌 / Palm";
  if (!index && !middle && !ring && !pinky) return "握拳 / Fist";
  if (index && middle && !ring && !pinky) return "剪刀手 / Peace";
  if (index && !middle && !ring && !pinky) return "食指指向 / Point";
  return "其他手势 / Other";
}
function classifyHand(points) {
  if (!points || points.length < 21) return "其他手势 / Other";
  const palm = Math.max(pointDistance(points[0], points[9]), 1);
  const fingers = [5,9,13,17].map(base =>
    jointAngle(points[base], points[base + 1], points[base + 3]) > 150 &&
    pointDistance(points[base + 3], points[0]) > pointDistance(points[base + 1], points[0]) * 1.08
  );
  // Palm-relative distances work at different camera distances and hand rotations.
  const pinched = pointDistance(points[4], points[8]) / palm < 0.28
    && pointDistance(points[8], points[0]) / palm > 1.05;
  return classifyGestureFeatures(fingers, pinched);
}
function gotHands(results) {
  const now = millis();
  if (now - handUpdatedAt > 500) handStates.clear();
  handUpdatedAt = now;
  const active = new Set();
  hands = results.filter(hand => hand.keypoints?.length >= 21).map((hand, i) => {
    const id = hand.handedness || String(i);
    active.add(id);
    const gesture = classifyHand(hand.keypoints);
    let state = handStates.get(id);
    if (!state) state = { candidate: gesture, count: 0, label: "识别中…" };
    if (state.candidate === gesture) state.count++;
    else { state.candidate = gesture; state.count = 1; }
    if (state.count >= 2) state.label = gesture;
    handStates.set(id, state);
    return { ...hand, gesture: state.label };
  });
  for (const id of handStates.keys()) if (!active.has(id)) handStates.delete(id);
}
function createHandPanel() {
  handPanel = document.createElement("aside");
  handPanel.setAttribute("aria-label", "手势实验预览");
  handPanel.style.cssText = "position:fixed;right:12px;top:12px;z-index:5;width:min(320px,45vw);padding:8px;border-radius:12px;background:rgba(30,25,40,.88);color:white;font:13px/1.5 Arial,sans-serif;box-shadow:0 4px 20px #0003";
  const title = document.createElement("div");
  title.textContent = "手势实验 · H 隐藏/显示";
  handPreview = document.createElement("canvas");
  handPreview.width = 320;
  handPreview.height = 240;
  // Keep this preview independent of the large avatar canvas CSS.
  handPreview.style.cssText = "display:block;width:100%;height:auto;border-radius:6px;margin:6px 0";
  handLabel = document.createElement("div");
  handLabel.setAttribute("role", "status");
  handLabel.textContent = "正在加载 HandPose…";
  handPanel.append(title, handPreview, handLabel);
  document.body.append(handPanel);
}
function drawHandPreview() {
  if (!handPanel || handPanel.hidden) return;
  const ctx = handPreview.getContext("2d");
  ctx.clearRect(0, 0, 320, 240);
  ctx.save();
  ctx.scale(320 / video.width, 240 / video.height);
  if (MIRROR_TRACKING) { ctx.translate(video.width, 0); ctx.scale(-1, 1); }
  if (video.elt.readyState >= 2) ctx.drawImage(video.elt, 0, 0, video.width, video.height);
  const visibleHands = millis() - handUpdatedAt < 500 ? hands : [];
  for (const hand of visibleHands) {
    ctx.strokeStyle = "#6affcf";
    ctx.lineWidth = 4;
    for (const chain of HAND_CHAINS) {
      ctx.beginPath();
      chain.forEach((id, i) => {
        const point = hand.keypoints[id];
        if (i === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
    }
    ctx.fillStyle = "#ffdd70";
    for (const point of hand.keypoints) {
      ctx.beginPath(); ctx.arc(point.x, point.y, 5, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
  handLabel.textContent = handError ? "手部模型加载失败，请检查网络并刷新。"
    : !handReady ? "正在加载 HandPose…"
    : !visibleHands.length ? "把手放到镜头前：张掌 / 握拳 / 剪刀手 / 指向 / 捏合"
    : visibleHands.map((hand, i) => `手 ${i + 1}：${hand.gesture}`).join(" · ");
}
