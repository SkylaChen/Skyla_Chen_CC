// let flower ={
//     x: 100,
//     y: 200,
//     numPetals: 6,
//     petalWidth: 40,
//     petalLength: 100,
//     centerDiameter: 50
// }

function setup(){
    createCanvas(windowWidth, windowHeight);
    background(200);
    angleMode(DEGREES);
}

function draw(){

}

function mouseDragged(){
    let f = new Flower(mouseX, mouseY);
    f.display();
}

class Flower{
    constructor(x, y){
        this.x = x;
        this.y = y;
        this.numPetals = int(random(3, 16));
        this.petalWidth = random(20, 40);
        this.petalLength = random(30, 80);
        this.centerDiameter = random(30, 40);
        this.centerCol = color(random(200,255), random(200,255), random(0,255));
        this.petalCol = color(random(200,255), random(0,55), random(0,255));
    }

    display(){
        push();
        translate(this.x, this.y);

        for(let r = 0; r < this.numPetals; r++){
            push();
            rotate(r * (360 / this.numPetals));
            translate(0, -this.petalLength / 2);
            fill(this.petalCol);
            ellipse(0, 0, this.petalWidth, this.petalLength);
            pop();
        }

        fill(this.centerCol);
        ellipse(0, 0, this.centerDiameter, this.centerDiameter);
        pop();
    }
}
