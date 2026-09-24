let wavesPerCanvas = 8;
let amplitude=50;
let offset = 0;
let yLoc

function setup(){
    createCanvas(windowWidth, windowHeight)
    yLoc=height/2
    noFill()
}

function draw(){
    background(230)

    push()
    translate(0,yLoc)

    beginShape()
    for(let i= 0; i<width; i++){

        mappedI = map(i,0,width,0,wavesPerCanvas*TWO_PI)

        let y= sin(mappedI)*mappedI
        let x= i
        vertex(x,y)
    
    }

    endShape()

    pop()
    offset += frameCount*0.01
}