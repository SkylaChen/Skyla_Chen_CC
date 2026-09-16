let x,y;
let diameter = 100
let yV=5,xV=3

function setup() {
  createCanvas(windowWidth, windowHeight);
  y= diameter/2
  x= width/2
  fill(random(255),0,0)
   noStroke()
};
function draw() {  
 //background(255)
  background(255,20)

 ellipse(x,y,diameter);

x += xV
y += yV
 
 
 if(y > height - diameter/2){ 
    yV = -yV;
    //fill(random(255),random(255),random(255))
    fill(random(255),random(255),0)
 }
 if(y < diameter/2){
    yV = -yV;
    //fill(random(255),random(255),random(255))
  fill(random(255),random(255),random(255))
 }
 if(x > width - diameter/2){
    xV = -xV;
      fill(random(255),random(255),random(255))
 }
 if(x < diameter/2){
    xV =-xV;
    fill(random(255),random(255),random(255))
 }
}