// let frames =[]

// async function setup() {
//   createCanvas(windowWidth, windowHeight);
//   frameRate(12)
//   rectMode(CENTER);
//   imageMode(CENTER);

//  //let img = await loadImage("walk_")

//  // image(img,width/2,height/2)

//   for (let i = 0; i < 12; i++) {
//     frames[i-1]= await loadImage("walk_cycle_png_/" + i + ".png")
// }
// }
// //print(frames)
// let counter =0
// let xLoc = 0
// let xV = 7.5


//     function draw() {
//     background(220);

//     let currentFrame =[counter%frames.length]

    
//     translate(xLoc, height/2)
//     scale(dir,1)

//     if(keyIsDown(RIGHT_ARROW)) {
//         dir = 1
//         xV = 7.5

//         counter++
//         xLoc += xV
//     }
//     if(keyIsDown(LEFT_ARROW)) {
//         dir = -1
//         xV = -7.5
//         counter++
//         xLoc += xV
//     }


// image(currentFrame[0],0,0)


// //     counter++
// //     xLoc += xV
// // }

// // function keyIsDown(LEFT_ARROW) {
// //   xV = -7.5;
// // }

// 老师
//animated sprites

let frames = []

async function setup(){
  createCanvas(windowWidth, windowHeight)
  frameRate(40)
  rectMode(CENTER)
  imageMode(CENTER)

  for(let i = 1; i <= 48; i++){
    frames[i - 1] = await loadImage("mlp/" + i + ".png")
  }

  topX = 0
  bottomX = width
}

let counter = 0
let xLoc = 0
let xV = 7.5
let dir = 1
let threeHorses = false

let topX = 0
let topV = 7.5
let topDir = 1
let bottomX = 0
let bottomV = -7.5
let bottomDir = -1
let bottomHorsePage = "../week5/week5.html"

function draw(){
  background(200)

  if(frames.length == 0){
    return
  }

  let currentFrame = frames[counter % frames.length]

  fill(0)
  noStroke()
  if(threeHorses){
    fill(200,150,0)
  }
  rect(width/2, height/2, 100, 200)

  if(!threeHorses){
    if(keyIsDown(RIGHT_ARROW)){
      dir = 1
      xV = 7.5
    }
    if(keyIsDown(LEFT_ARROW)){
      dir = -1
      xV = -7.5
    }

    xLoc += xV

    if(xLoc > width){
      dir = -1
      xV = -7.5
    }
    else if(xLoc < 0){
      dir = 1
      xV = 7.5
    }

    if(dist(xLoc, height/2, width/2, height/2) < 50){
      threeHorses = true
      xLoc = width/2
      topX = 0
      bottomX = width
    }
  }

  drawHorse(xLoc, height/2, dir, currentFrame)

  if(threeHorses){
    drawHorse(topX, height/4, topDir, currentFrame)
    drawHorse(bottomX, height*3/4, bottomDir, currentFrame)

    topX += topV
    bottomX += bottomV

    if(topX > width){
      topDir = -1
      topV = -7.5
    }
    else if(topX < 0){
      topDir = 1
      topV = 7.5
    }

    if(bottomX > width){
      bottomDir = -1
      bottomV = -7.5
    }
    else if(bottomX < 0){
      bottomDir = 1
      bottomV = 7.5
    }
  }

  counter++
}

function drawHorse(x, y, direction, currentFrame){
  push()
  translate(x, y)
  scale(direction, 1)
  image(currentFrame, 0, 0, 240, 222)
  pop()
}

function mousePressed(){
  if(threeHorses &&
     mouseX > topX - 120 && mouseX < topX + 120 &&
     mouseY > height/4 - 111 && mouseY < height/4 + 111){
    window.location.href = "sketch2.html"
    return false
  }
                      

  if(threeHorses &&
     mouseX > bottomX - 120 && mouseX < bottomX + 120 &&
     mouseY > height*3/4 - 111 && mouseY < height*3/4 + 111){
    if(bottomHorsePage != ""){
      window.location.href = bottomHorsePage
    }
    return false
  }

  counter = 0
  xLoc = 0
  xV = 7.5
  dir = 1
  threeHorses = false
  topX = 0
  bottomX = width
  topV = 7.5
  bottomV = -7.5
  topDir = 1
  bottomDir = -1
}
