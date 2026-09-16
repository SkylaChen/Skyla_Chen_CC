function setup() {
  createCanvas(windowWidth, windowHeight);
  background(100);

  fill(100,0,0)
  strokeWeight(4)
  stroke(0,0,100)
 
 
}
function draw() {  
ellipse(mouseX, mouseY, 50, 50); 

 }
 function mousePressed() {
  background(100);
  fill(random(255), random(255), random(255));
  ellipse(mouseX, mouseY, random(10, 100), random(10, 100));
}   