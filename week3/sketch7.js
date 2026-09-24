let x = 0
let y = 0
let w,h;
let numRects = 10
let r = 1

function setup() {
    createCanvas(600,600);

    w = width/numRects
    h = height/numRects
    rectMode(CENTER)
    angleMode(DEGREES)

    background(49, 104, 181)
    noFill()

    strokeWeight(2)
    stroke(255)
}
    function draw (){
     background(59, 104, 181)

    
  translate(w/2, h/2)
    for (let x = 0; x < numRects; x++) {
  for (let y = 0; y < numRects; y++) {
    let baseSize = 10 + x * 3 + y * 3 + mouseX * 0.06

let mouseScale = constrain(1, 0.5, 1.6)
let size = baseSize * mouseScale
    push()
    translate(w * x, h * y)
    stroke(size,size*5,size*7)
    rect(0, 0, size, size)
    rect(0, 0, size * 0.7, size * 0.7)
    rect(0, 0, size * 0.4, size * 0.4)
    pop()
  }
}
       
} r++
