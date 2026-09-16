function setup() {
  createCanvas(windowWidth, windowHeight);
  background(100)

  fill(100,0,0)
  //noStroke()
  strokeWeight(3)
  stroke(200,100,0)
 
 
}
function draw(){  

}

function mouseDragged() {
//strokeWeight(random(1, 10));
  //let s = map(mouseX, 0, width, 1, 15);
  //strokeWeight(s);
   //line(pmouseX,pmouseY,mouseX,mouseY)
      //background(100);
let v = dist(pmouseX, pmouseY, mouseX, mouseY);
  strokeWeight(v);
  line(pmouseX, pmouseY, mouseX, mouseY);

}
 function mousePressed() {
    //background(100);
}
function keyPressed() {
      background(100);
}