let y = 0;

function setup() {
    createCanvas(windowWidth, windowHeight);
}
function draw() {
    background(0, 220, 220,50);
    circle(windowWidth/2, y, 70);
    fill(100, 0, 0);
    noStroke();
    y=y+1;
    console.log(y);
    if(y>height){
        y=0;
    }
}