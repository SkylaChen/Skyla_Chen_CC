let x,y;
let diameter = 100
let yV = 10,xV = 8

function setup() {
  background(100)
  createCanvas(windowWidth, windowHeight);
  
  noStroke()
  y= diameter/2
  x= width/2
  
};
function draw() {  
 //background(100)
 
 //let r = map(y,diameter/2,height-diameter/2,0,255)
 let r = 250 // I love pink
 let b = map(x,diameter/2,width-diameter/2,0,255)
 let g = map(x,diameter/2,width-diameter/2,255,0)

 fill(r ,g ,b)

 //let diameter = map(y,0,height,50,100) //try to change the size of the ball based on the y，can't work

 //ellipse(x,y,diameter)
 let d = map(y+ random(-10,10),0,height,50,100)
 ellipse(x,y,d,d)

x += xV
y += yV
 
 
 if(y > height - diameter/2){ 
   // yV = -yV;
    yV = -random(1,10) ///change the detraction
 }
 if(y < diameter/2){
    yV = -yV;
 }
 if(x > width - diameter/2){
   // xV = -xV;
    xV = -random(1,10);  //change the detraction
 }
 if(x < diameter/2){
    xV = -xV;
 }
}