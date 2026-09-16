let x,y;
let diameter = 100
let yV = 5,xV = 5

function setup() {
  background(100)
  createCanvas(windowWidth, windowHeight);
  
  noStroke()
  //y= diameter/2
  //x= width/2
  y= random(width)
  x= random(height)
};
function draw() {  
 //background(100)
 
 let r = map(y,diameter/2,height-diameter/2,0,255)
 let b = map(x,diameter/2,width-diameter/2,0,255)
 let g = map(x,diameter/2,width-diameter/2,255,0)

 fill(r ,g ,b)
 ellipse(x,y,diameter)

x += xV
y += yV
 
 
 if(y > height - diameter/2){ 
    yV = -yV;
 }
 if(y < diameter/2){
    yV = -yV;
 }
 if(x > width - diameter/2){
    xV = -xV;
 }
 if(x < diameter/2){
    xV = -xV;
 }
}