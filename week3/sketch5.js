let x = 0
let y = 0
let w,h;
let numRects = 20
let r = 1

function setup() {
    createCanvas(800,800);

    w = width/numRects
    h = height/numRects
    rectMode(CENTER)
    angleMode(DEGREES)

    background(0)
   noFill()

    strokeWeight(2)
    stroke(255)

   // frameRate(2)
}
    function draw (){
     background(0)

     //translate(20,20)
   
//       for (let x = 0; x < numRects; x++) {

//        
//         push()  
//         translate(w*x,0)
//         rect(0,0,w,100)
//         pop()
// }
//     }

  translate(w/2, h/2)
    for (let x = 0; x < numRects; x++) {

     for(let y = 0; y < numRects; y++){

        let d = dist(mouseX,mouseY,w*x,h*y)

        d = map(d,0,200,1,0)
        d = constrain(d,0,1);
        push()  
        translate(w * x,h * y)
        rotate(0.05*d*r)
        rect(0,0,w*d,h*d)
        pop()

       
} r++
    }

    } 
    
   