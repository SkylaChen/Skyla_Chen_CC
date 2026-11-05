let video;
let handPose;
let hand = [];

let shapePoints = [];
let numPoints = 6

async function setup() {    

function setup() {
  
// Change the canvas size to a common webcam resolution

  createCanvas(640, 480);
  console.log("ml5 version:", ml5.version);
  
// Access the webcam

  video = createCapture(VIDEO); 
  
// Resize the webcam video to match the canvas size

  video.size(640, 480); 
  
// Hide the HTML video element

  video.hide();
}

async function setup() {
  handPose = await ml5.handPose();
}
}
