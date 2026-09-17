let x = 0

function setup() {
    createCanvas(windowWidth, windowHeight);

    rectMode(CENTER)
    angleMode(DEGREES)

}

function draw() {

    background(0)

    stroke(255)
    strokeWeight(2)
    noFill()

    push()
    translate(0,height/2)
    rect(0,0,50)
    pop()
   
    push()
    translate(width,height/2)
    rect(0,0,50)
    pop()

    x = lerp(0,width,0.5)
    
    push()
    translate(x,height/2)
    rect(0,0,50)
    pop()
   

    x++

}


