let r = 0
let lerpedMouseX = 0
let lerpedMouseY = 0
let stars = []

function setup() {
    createCanvas(windowWidth, windowHeight);
    rectMode(CENTER)
    angleMode(DEGREES)

 for (let i = 0; i < 100; i++) {
  stars.push({   
    x: random(0, windowWidth),   
    y: random(0, windowHeight),   
    size: random(2, 8)          // 星体大小
    
   })
}
}
function draw() {

    background(0)
    noFill()
    strokeWeight(2)
    stroke(255)

    push()
    //translate(lerpedMouseX, lerpedMouseY)
    noStroke()
    //fill(220+random(-10,50), 235+random(-10,50), 255+random(-10,50), 200)

  for (let star of stars) {
  fill(220, 235, 255, 180)
  ellipse(star.x, star.y, star.size)
}

pop()




lerpedMouseX = lerp(lerpedMouseX, mouseX, 0.05)
lerpedMouseY = lerp(lerpedMouseY, mouseY, 0.05)

push()
translate(lerpedMouseX, lerpedMouseY)
noFill()
stroke(255)
strokeWeight(1)

ellipse(0, 0, 100, 100)
ellipse(0, 0, 160, 160)
ellipse(0, 0, 240, 240)
ellipse(0, 0, 300, 300)
ellipse(0, 0, 440, 440)
pop()

push() //Sun
translate(lerpedMouseX, lerpedMouseY)
noStroke()
fill(255,140,100)
rotate(r)
ellipse(0, 0, 50, 50)
pop()


push()
translate(lerpedMouseX, lerpedMouseY)
rotate(6*r)
noStroke()
fill(180,100,0)
ellipse(-50, 0, 20, 20)
pop()

// push()
// translate(lerpedMouseX, lerpedMouseY)
// rotate(0.5*r)
// ellipse(0, 0, 100, 100)
// pop()

push()
translate(lerpedMouseX, lerpedMouseY)
rotate(-3*r)
noStroke()
fill(0,random(0, 100),200)
ellipse(-80, 0, 30, 30)
noStroke()
fill(150, 100, 50)

ellipse(150, 0, 20, 20) 

translate(150, 0)       
rotate(-10* r)
fill(200, 220, 0)
ellipse(-20, 0, 8, 8)   

pop()

// push()
// translate(lerpedMouseX, lerpedMouseY)
// rotate(-3*r)
// ellipse(0, 0, 160, 160)
// pop()

push()
translate(lerpedMouseX, lerpedMouseY)
rotate(-2.5*r)
noStroke()
fill(0,100,200)
ellipse(120, 0, 20, 20)

pop()

// push()
// translate(lerpedMouseX, lerpedMouseY)
// rotate(-3*r)
// ellipse(0, 0, 240, 240)
// pop()

push()
translate(lerpedMouseX, lerpedMouseY)
noStroke()
fill(175,121,110)
rotate(0.5*r)
ellipse(150, 0, 20, 20)



pop()

// push()
// translate(lerpedMouseX, lerpedMouseY)
// rotate(-3*r)
// ellipse(0, 0, 300, 300)
// pop()

push()
translate(lerpedMouseX, lerpedMouseY)
rotate(1*r)
noStroke()
fill(0,121,110)
ellipse(220, 0, 25, 25)
translate(220, 0)       
rotate(8* r)
fill(200, 20, 100)
ellipse(-20, 0, 8, 8)   
pop()

// push()
// translate(lerpedMouseX, lerpedMouseY)
// rotate(0.5*r)
// ellipse(0, 0, 440, 440)
// pop()
r++


}


