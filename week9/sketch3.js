let video;
let faces = [];
let modelReady = false;
let loadError = false;
let artError = false;
let artwork;
let avatarImages = {};
let pupilBuffer;
let pupilCache = { x: null, y: null };
let gaze = { x: 0, y: 0 };
const props = { microphone: { raised: false, progress: 0, time: null } };
const microphone = props.microphone;
const HAIR_DAMPING = 18; // 越大越快收稳，不产生弹簧回弹。
let hairMotion = { angle: 0, time: null, rootX: null };

const ART_PATH = "assets/avatar-half-v2/";
const RENDER_SCALE = 0.5;
const MIRROR_TRACKING = true;
const BLINK_THRESHOLD = 0.76;
let eyeBaseline = null;
let eyeSamples = [];
let eyesClosed = false;

let browBaseline = null;
let browSamples = [];
let browExpression = "browsNeutral";
let browCandidate = "browsNeutral";
let browCandidateFrames = 0;
let browCalibrationStart = null;
function resetBrowCalibration() {
  browCalibrationStart = null;
  browBaseline = null;
  browSamples = [];
  browExpression = "browsNeutral";
  browCandidate = "browsNeutral";
  browCandidateFrames = 0;
}
const MOUTH = { gain: 2.6, filterMs: 24, confirmMs: 25, holdMs: 100, bridgeMs: 100 };
let mouth;
function resetMouthCalibration() {
  mouth = { baseline: null, samples: [], started: null, filtered: null, lastInput: null,
    smiling: false, candidate: "mouthClosed", candidateAt: 0, target: "mouthClosed",
    shownAt: -Infinity, bridgeUntil: 0 };
}
resetMouthCalibration();
function keyPressed() {
  if (key.toLowerCase() === "h" && handPanel) handPanel.hidden = !handPanel.hidden;
  if (key.toLowerCase() === "c") {
    resetMouthCalibration();
    resetBrowCalibration();
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
  mouthLayer: "mouthClosed",
  blinkUntil: 0
};

// 图层保留 PSD 坐标；只缩小渲染，逐张加载以降低内存峰值。
async function setup() {
  pixelDensity(1);
  const canvas = createCanvas(1460, 1594);
  canvas.parent("avatar-stage");

  try {
    artwork = await loadJSON(ART_PATH + "manifest.json");
    resizeCanvas(
      Math.round(artwork.canvas.width * RENDER_SCALE),
      Math.round(artwork.canvas.height * RENDER_SCALE)
    );
    avatar.x = artwork.anchor.x;
    avatar.y = artwork.anchor.y;
    for (const [name, layer] of Object.entries(artwork.layers)) {
      avatarImages[name] = await loadImage(ART_PATH + layer.file);
    }
    const eye = artwork.layers.eyeWhite;
    pupilBuffer = createGraphics(Math.ceil(eye.width * RENDER_SCALE), Math.ceil(eye.height * RENDER_SCALE));
    pupilBuffer.pixelDensity(1);
  } catch (error) {
    console.error("Could not load avatar artwork:", error);
    setStatus("素材加载失败：" + error.message);
    artError = true;
    return;
  }

  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();
  createHandPanel();
  startTracking("faceMesh", { maxFaces: 1, refineLandmarks: true }, gotFaces);
  startTracking("handPose", { maxHands: 2 }, gotHands);
}

async function startTracking(kind, options, callback) {
  try {
    const model = await ml5[kind](options);
    model.detectStart(video, callback);
    if (kind === "faceMesh") modelReady = true;
    else handReady = true;
  } catch (error) {
    console.error(kind, error);
    if (kind === "faceMesh") loadError = true;
    else handError = true;
  }
}

// 表情每次使用新的检测结果更新，避免绘图帧重复参与校准。
function gotFaces(results) {
  faces = results;
  const points = results[0]?.keypoints;
  if (points && points.length >= 468) {
    updateEyes(points);
    updateBrows(points);
    updateGaze(points);
    updateMouth(points);
  }
}

function draw() {
  background(248, 246, 250);
  if (artError) return;
  if (!artwork || !avatarImages.frontHair) return setStatus("加载立绘…");
  const points = faces[0]?.keypoints;
  if (points?.length >= 468) updateAvatar(points);
  try {
    advanceMouth(millis());
    updateHairPhysics();
    updateMicrophone();
    drawAvatar();
    setStatus(loadError ? "人脸追踪加载失败" : !modelReady ? "加载人脸追踪…"
      : !points?.length ? "请面对摄像头" : !mouth.baseline || !browBaseline ? "请放松表情，自动校准中…" : "");
  } catch (error) {
    setStatus("绘制失败：" + error.message);
    console.error(error);
  }
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
  const distanceRatio = bounds.width / 150;
  const targetScale = constrain(Math.pow(distanceRatio, 1.35), 0.80, 1.80);

  avatar.x = lerp(avatar.x, targetX, 0.2);
  avatar.y = lerp(avatar.y, targetY, 0.2);
  avatar.scale = lerp(avatar.scale, targetScale, 0.25);
  avatar.angle = lerp(avatar.angle, constrain(targetAngle, -0.35, 0.35), 0.2);

}
// 只使用新检测帧采样，统一用眼距归一化，避免张嘴变宽时冲淡开合量。
function measureMouth(points) {
  const left = points[61], right = points[291], upper = points[13];
  const width = Math.max(pointDistance(left, right), 1);
  const eyeSpan = Math.max(pointDistance(points[33], points[263]), 1);
  let nx = -(right.y - left.y) / width, ny = (right.x - left.x) / width;
  if (nx * (points[152].x - points[10].x) + ny * (points[152].y - points[10].y) < 0) {
    nx = -nx; ny = -ny;
  }
  return {
    gap: pointDistance(upper, points[14]) / eyeSpan,
    width: width / eyeSpan,
    lift: ((upper.x - (left.x + right.x) / 2) * nx
      + (upper.y - (left.y + right.y) / 2) * ny) / eyeSpan
  };
}
function updateMouth(points) {
  const now = millis(), raw = measureMouth(points);
  if (!Object.values(raw).every(Number.isFinite)) return;
  if (!mouth.baseline) {
    if (mouth.started === null) mouth.started = now;
    mouth.samples.push(raw);
    if (now - mouth.started >= 800 && mouth.samples.length >= 15) {
      const gaps = mouth.samples.map(sample => sample.gap).sort((a, b) => a - b);
      mouth.baseline = { gap: gaps[Math.floor(gaps.length * 0.2)],
        width: median(mouth.samples, "width"), lift: median(mouth.samples, "lift") };
      mouth.samples = [];
    }
    return;
  }
  const base = mouth.baseline;
  if (raw.gap < base.gap) base.gap += (raw.gap - base.gap) * 0.2;
  const current = {
    gap: Math.max(0, raw.gap - base.gap) / base.width * MOUTH.gain,
    width: raw.width / base.width,
    lift: (raw.lift - base.lift) / base.width
  };
  const dt = mouth.lastInput === null ? 33 : now - mouth.lastInput;
  const alpha = 1 - Math.exp(-Math.max(dt, 1) / MOUTH.filterMs);
  if (!mouth.filtered || dt > 250) mouth.filtered = current;
  else for (const key of Object.keys(current)) mouth.filtered[key] += (current[key] - mouth.filtered[key]) * alpha;
  mouth.lastInput = now;
  const { gap, width, lift } = mouth.filtered;
  mouth.smiling = width > (mouth.smiling ? 1.02 : 1.045)
    && lift > (mouth.smiling ? 0.004 : 0.009);
  const next = classifyMouth(gap, width, mouth.smiling, mouth.target);
  if (next !== mouth.candidate) { mouth.candidate = next; mouth.candidateAt = now; }
  if (now - mouth.candidateAt >= MOUTH.confirmMs) mouth.target = next;
}
// 露齿笑专用 Open；说话用 Wide，收圆用 Round；中间状态只用闭嘴。
function classifyMouth(gap, width, smiling, previous) {
  if (smiling) {
    if (gap < 0.018) return "mouthRelaxed";
    return gap > (previous === "mouthOpen" ? 0.022 : 0.035) ? "mouthOpen" : "mouthClosed";
  }
  const round = gap > (previous === "mouthRound" ? 0.050 : 0.075)
    && width < (previous === "mouthRound" ? 0.985 : 0.95);
  if (round || (gap > 0.24 && width < 1.04)) return "mouthRound";
  if (gap > (previous === "mouthWide" ? 0.040 : 0.065)) return "mouthWide";
  return "mouthClosed";
}
// 显示状态与识别状态分离：不排队，最短停留防闪动，大嘴型之间强制闭嘴。
function advanceMouth(now) {
  if (!mouth.baseline) { avatar.mouthLayer = "mouthClosed"; return; }
  if (mouth.lastInput !== null && now - mouth.lastInput > 400) mouth.target = "mouthClosed";
  const current = avatar.mouthLayer, next = mouth.target;
  if (now < mouth.bridgeUntil || current === next || now - mouth.shownAt < MOUTH.holdMs) return;
  const large = name => ["mouthOpen", "mouthWide", "mouthRound"].includes(name);
  avatar.mouthLayer = large(current) && large(next) ? "mouthClosed" : next;
  mouth.shownAt = now;
  if (large(current) && large(next)) mouth.bridgeUntil = now + MOUTH.bridgeMs;
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
// 根据自然睁眼幅度归一化，短暂保留眨眼以便看清。
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
  return [[159,145,33,133], [386,374,263,362]].reduce((sum, ids) => {
    const [top, bottom, left, right] = ids.map(id => points[id]);
    return sum + pointDistance(top, bottom) / pointDistance(left, right);
  }, 0) / 2;
}

// 缩放整个 PSD 坐标系；后发先画，后脑遮住发根连接处。
function drawAvatar() {
  push();
  scale(RENDER_SCALE);
  translate(avatar.x, avatar.y);
  scale(avatar.scale);
  translate(-artwork.anchor.x, -artwork.anchor.y);

  drawGravityHair();
  for (const name of ["headBack", "neck", "body", "face"]) {
    drawArtLayer(name, name === "headBack" || name === "face");
  }

  const eyes = avatar.eyeOpen < 0.22 ? "eyesClosed"
    : avatar.eyeOpen < 0.75 ? "eyesHalf" : "eyesOpen";
  if (eyes !== "eyesClosed") drawPupils();
  drawArtLayer(eyes, true);

  drawArtLayer(avatar.mouthLayer, true);

  drawArtLayer("frontHair", true);
  drawArtLayer(browExpression, true);
  drawMicrophone();
  pop();
}

function drawArtLayer(name, followsHead = false) {
  const layer = artwork.layers[name];
  push();
  if (followsHead) {
    rotateHead();
  }
  image(avatarImages[name], layer.x, layer.y, layer.width, layer.height);
  pop();
}

function setStatus(message) {
  const element = document.getElementById("avatar-load-status");
  if (!element) return;
  if (element.textContent !== message) element.textContent = message;
  element.hidden = !message;
}
let hands = [];
let handReady = false;
let handError = false;
let handUpdatedAt = 0;
let handStates = new Map();
let handPanel, handPreview;
const HAND_CHAINS = [[0,1,2,3,4], [0,5,6,7,8], [0,9,10,11,12],
  [0,13,14,15,16], [0,17,18,19,20], [5,9,13,17]];

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
// 按手掌尺度和关节夹角判断手势，减小距离、旋转的影响。
function classifyHand(points) {
  if (!points || points.length < 21) return "其他手势 / Other";
  const palm = Math.max(pointDistance(points[0], points[9]), 1);
  const fingers = [5,9,13,17].map(base =>
    jointAngle(points[base], points[base + 1], points[base + 3]) > 150 &&
    pointDistance(points[base + 3], points[0]) > pointDistance(points[base + 1], points[0]) * 1.08
  );
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
    const action = state.count < 2 ? 0
      : gesture === "食指指向 / Point" && isIndexRaised(hand.keypoints) ? 1
      : gesture === "张开手掌 / Palm" ? -1 : 0;
    return { ...hand, gesture: state.label, action };
  });
  for (const id of handStates.keys()) if (!active.has(id)) handStates.delete(id);
  if (hands.some(hand => hand.action === -1)) putDownProps();
  else if (hands.some(hand => hand.action === 1)) microphone.raised = true;
}
function createHandPanel() {
  handPanel = document.createElement("aside");
  handPanel.setAttribute("aria-label", "手势实验预览");
  handPanel.style.cssText = "position:fixed;right:12px;top:12px;z-index:5;width:min(320px,45vw)";
  handPreview = document.createElement("canvas");
  handPreview.width = 320;
  handPreview.height = 240;
  handPreview.style.cssText = "display:block;width:100%;height:auto";
  handPanel.append(handPreview);
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
}

function updateGaze(points) {
  if (points.length < 478) { gaze.x = 0; gaze.y = 0; return; }
  const readings = [[468,33,133,159,145], [473,362,263,386,374]].map(ids => {
    const [iris, a, b, top, bottom] = ids.map(id => points[id]);
    const dx = b.x - a.x, dy = b.y - a.y;
    const span = Math.max(Math.hypot(dx, dy), 1);
    const ux = dx / span, uy = dy / span;
    const cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
    const eyeHeight = Math.max(Math.hypot(top.x - bottom.x, top.y - bottom.y), 1);
    return {
      x: ((iris.x - cx) * ux + (iris.y - cy) * uy) / span,
      y: ((iris.x - (top.x + bottom.x) / 2) * -uy
        + (iris.y - (top.y + bottom.y) / 2) * ux) / eyeHeight
    };
  });
  const horizontal = (readings[0].x + readings[1].x) / 2;
  const vertical = (readings[0].y + readings[1].y) / 2;
  gaze.x = lerp(gaze.x, constrain(horizontal * (MIRROR_TRACKING ? -120 : 120), -24, 24), 0.45);
  gaze.y = lerp(gaze.y, constrain(vertical * 16, -12, 12), 0.45);
}

// 眼珠仅在视线变化时重绘，并以眼白透明度裁切。
function drawPupils() {
  const white = artwork.layers.eyeWhite;
  const pupils = artwork.layers.pupils;
  drawArtLayer("eyeWhite", true);
  if (pupilCache.x !== gaze.x || pupilCache.y !== gaze.y) {
    pupilBuffer.clear();
    pupilBuffer.push();
    pupilBuffer.scale(RENDER_SCALE);
    pupilBuffer.image(avatarImages.pupils,
      pupils.x - white.x + gaze.x, pupils.y - white.y + gaze.y,
      pupils.width, pupils.height);
    pupilBuffer.drawingContext.globalCompositeOperation = "destination-in";
    pupilBuffer.image(avatarImages.eyeWhite, 0, 0, white.width, white.height);
    pupilBuffer.drawingContext.globalCompositeOperation = "source-over";
    pupilBuffer.pop();
    pupilCache = { x: gaze.x, y: gaze.y };
  }
  push();
  rotateHead();
  image(pupilBuffer, white.x, white.y, white.width, white.height);
  pop();
}

// 用眼角作为眉毛参照，避免眨眼被误算为皱眉。
function getBrowMetrics(points) {
  const left = points[33], right = points[263];
  const dx = right.x - left.x, dy = right.y - left.y;
  const span = Math.max(Math.hypot(dx, dy), 1);
  let nx = -dy / span, ny = dx / span;
  if (nx * (points[152].x - points[10].x) + ny * (points[152].y - points[10].y) < 0) {
    nx = -nx; ny = -ny;
  }
  const vertical = (a, b) => (a.x - b.x) * nx + (a.y - b.y) * ny;
  const distance = (a, b) => Math.max(pointDistance(a, b), 1);
  const leftSpan = distance(points[33], points[133]);
  const rightSpan = distance(points[362], points[263]);
  return {
    height: (vertical({x:(points[33].x+points[133].x)/2, y:(points[33].y+points[133].y)/2}, points[105]) / leftSpan
      + vertical({x:(points[362].x+points[263].x)/2, y:(points[362].y+points[263].y)/2}, points[334]) / rightSpan) / 2,
    innerGap: distance(points[107], points[336]) / span
  };
}

function classifyBrows(height, contraction, previous) {
  if (height > (previous === "browsRaised" ? 0.020 : 0.035)) return "browsRaised";
  const lowering = previous === "browsSad" ? -0.030 : -0.050;
  const tightening = previous === "browsSad" ? 0.018 : 0.030;
  if (height < lowering && contraction > tightening) return "browsSad";
  return "browsNeutral";
}

// 自动采样 1.5 秒；正常眉立即恢复，表情连续确认后再切换。
function updateBrows(points) {
  const metrics = getBrowMetrics(points);
  if (!Number.isFinite(metrics.height) || !Number.isFinite(metrics.innerGap)) return;
  if (!browBaseline) {
    browExpression = "browsNeutral";
    if (browCalibrationStart === null) browCalibrationStart = millis();
    browSamples.push(metrics);
    if (millis() - browCalibrationStart >= 1500 && browSamples.length >= 15) {
      browBaseline = { height: median(browSamples, "height"), innerGap: median(browSamples, "innerGap") };
    }
    return;
  }
  const candidate = classifyBrows(
    metrics.height - browBaseline.height,
    browBaseline.innerGap - metrics.innerGap,
    browExpression
  );
  if (candidate === browCandidate) browCandidateFrames++;
  else { browCandidate = candidate; browCandidateFrames = 1; }
  const requiredFrames = candidate === "browsSad" ? 3 : 2;
  if (candidate === "browsNeutral" || browCandidateFrames >= requiredFrames) browExpression = candidate;
}

function getHairRoot() {
  return artwork.hairPivot || { x: 1470, y: 850 };
}
function getHairRootScreenX() {
  const root = getHairRoot(), pivot = artwork.headPivot;
  const dx = root.x - pivot.x, dy = root.y - pivot.y;
  return avatar.x + avatar.scale * (pivot.x - artwork.anchor.x
    + Math.cos(avatar.angle) * dx - Math.sin(avatar.angle) * dy);
}
// 后发保持下垂，只保留小幅惯性
function updateHairPhysics() {
  const now = millis() / 1000, rootX = getHairRootScreenX();
  const dt = hairMotion.time === null ? 0 : now - hairMotion.time;
  if (dt > 0 && dt < 0.2) {
    const sway = constrain((rootX - hairMotion.rootX) / dt * 0.00004, -0.035, 0.035);
    const target = constrain(avatar.angle * 0.35 + sway, -0.16, 0.16);
    hairMotion.angle = lerp(hairMotion.angle, target, 1 - Math.exp(-HAIR_DAMPING * dt));
  }
  hairMotion.time = now;
  hairMotion.rootX = rootX;
}
// 先连接到头部，再围绕发根反向抵消歪头角度。
function drawGravityHair() {
  const root = getHairRoot();
  const layer = artwork.layers.backHair;
  push();
  rotateHead();
  translate(root.x, root.y);
  rotate(hairMotion.angle - avatar.angle);
  translate(-root.x, -root.y);
  image(avatarImages.backHair, layer.x, layer.y, layer.width, layer.height);
  pop();
}

function median(samples, field) {
  const values = samples.map(sample => sample[field]).sort((a, b) => a - b);
  const mid = Math.floor(values.length / 2);
  return values.length % 2 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
}

function rotateHead() {
  const { x, y } = artwork.headPivot;
  translate(x, y);
  rotate(avatar.angle);
  translate(-x, -y);
}

// 道具触发后保持；张开五指统一收回，后续道具也放入 props。
function putDownProps() {
  for (const prop of Object.values(props)) prop.raised = false;
}
function isIndexRaised(points) {
  const dx = points[8].x - points[5].x;
  const up = points[5].y - points[8].y;
  return up > pointDistance(points[0], points[9]) * 0.45 && Math.abs(dx) < up * 0.8;
}
function updateMicrophone() {
  const now = millis() / 1000;
  const dt = microphone.time === null ? 0 : Math.min(now - microphone.time, 0.05);
  const target = microphone.raised ? 1 : 0;
  microphone.progress = lerp(microphone.progress, target, 1 - Math.exp(-10 * dt));
  if (Math.abs(target - microphone.progress) < 0.001) microphone.progress = target;
  microphone.time = now;
}
function drawMicrophone() {
  if (microphone.progress === 0) return;
  const layer = artwork.layers.microphone;
  const { width, height } = artwork.canvas;
  // 进入位置和裁切范围都使用人物的 PSD 画布，与屏幕尺寸无关。
  const travel = height - layer.y + 40;
  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.rect(0, 0, width, height);
  drawingContext.clip();
  image(avatarImages.microphone, layer.x, layer.y + travel * (1 - microphone.progress),
    layer.width, layer.height);
  drawingContext.restore();
}
