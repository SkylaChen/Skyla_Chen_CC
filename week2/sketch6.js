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
 background(255,20)
 
 //let r = map(y,diameter/2,height-diameter/2,0,255)
 let r = 250 // I love pink
 let b = map(x,diameter/2,width-diameter/2,0,255)
 let g = map(x,diameter/2,width-diameter/2,255,0)

 fill(r ,g ,b)

 //let diameter = map(y,0,height,50,100) //try to change the size of the ball based on the y，can't work

 //ellipse(x,y,diameter)
 let d = map(y+ random(-10,10),0,height,10,200)
 ellipse(x,y,d,d)
//ellipse(x+100, y-200, d, d)
////ellipse(x+200, y-400, d, d)
//ellipse(x+300, y-600, d, d)
//ellipse(x+400, y-800, d, d)
ellipse(x+random(-400,500),y+random(-500,500), d,d)
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