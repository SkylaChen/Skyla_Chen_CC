let r = 0

function setup() {
    createCanvas(windowWidth, windowHeight);

    rectMode(CENTER)
    angleMode(DEGREES)

}

function draw() {

    background(0)
    noFill()
    strokeWeight(2)
    stroke(255)

   // translate(mousex,0)
    push()

    translate(width/ 2-100, height / 2)
    rotate(r)
    rect(0, 0, 50)

    line(0, 0, 0,200)
    translate(0,200)
    rotate(r)
    rect(0, 0, 50)

    line(0, 0, 0,200)
    translate(0,200)
    rotate(r)
    rect(0, 0, 50)

    line(0, 0, 0,200)
    translate(0,200)
    rotate(r)
    rect(0, 0, 50)

    line(0, 0, 0,200)
    translate(0,200)
    rotate(r)
    rect(0, 0, 50)

    line(0, 0, 0,200)
    translate(0,200)
    rotate(r)
    rect(0, 0, 50)

    pop()


    push()

    translate(width/ 2+100, height / 2)
    rotate(-r)
    rect(0, 0, 50)

    line(0, 0, 0,200)
    translate(0,200)
    rotate(-r)
    rect(0, 0, 50)

    line(0, 0, 0,200)
    translate(0,200)
    rotate(-r)
    rect(0, 0, 50)

    line(0, 0, 0,200)
    translate(0,200)
    rotate(-r)
    rect(0, 0, 50)

    line(0, 0, 0,200)
    translate(0,200)
    rotate(-r)
    rect(0, 0, 50)

    line(0, 0, 0,200)
    translate(0,200)
    rotate(-r)
    rect(0, 0, 50)

    pop()

    translate(width/ 2, 3*height/4)
    rect(width/2,3*height/4, 400,height/2)

    rect(0,0,50,50)

    translate(0,-height/4,-75)
    rect(0,0,50,-150)

    translate(0,-height/4,-75)



    r++

}


