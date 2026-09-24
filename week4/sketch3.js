// let wavesPerCanvas = 8;
// let amplitude=50;
// let offset = 0;
// let yLoc
// let speed =0.01
let numWaves=10

function setup(){
    createCanvas(windowWidth, windowHeight)
   // yLoc=height/2
    noFill()
}

function draw(){
    background(230)

    // let v = floor(random(3,20))

    // nShape(mouseX,mouseY,v,v*4)

// for(let i = 0; i < numWaves;i++){
//     let yLoc = map(i,0,numWaves,0.1)*height
//     let speed
//     if(i%2 == 0)
        
//   sinWave(i,20,height/i, i*0.05)

  
// }

//    function sinWave(wavesPerCanvas,amplitude, yLoc, speed){
   
//     let offset = frameCount*speed

//     push()
//     translate(0,yLoc)

//     beginShape()
//     for(let i= 0; i<width; i++){

//         mappedI = map(i,0,width,0,wavesPerCanvas*TWO_PI)
//         let y= sin(mappedI-offset)*amplitude
//         let x = i
//         vertex(x,y)
    
    noiseWave(10,100,height/2.0.05)

    // endShape()

    // pop()
   }
    offset = frameCount*speed([speed]){

    function nShape(yLoc,xLoc, numVertices,radius){
        push()
        translate(xLoc,yLoc)
        beginShape()
            for(let i= 0; i< numVertices;i++){
                mappedI= map(i,0,numVertices,0,TWO_PI)
            let x = sin(mappedI)*radius
            let y = cos(mappedI)*radius
                endShape(CLOSE)
        }

        pop()



    }

    function noiseWave(density,amplitude,yLoc,speed){
        let offset =frameCount*speed
        


    }

    function mousePressed(){

        let v= floor(random(3.20))
        nShape(mouseX,mouseY,v,v*4)
    }