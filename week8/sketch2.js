
let cam;

let scale = 4;


function setup() {
    createCanvas(400,400)
    pixelDensity(1)

cam = createCapture(VIDEO)
cam.size(width/scale,height/scale)

}

function draw() {
    cam.loadPixels()

    let px =cam.pixels
    let canvPx = pixels

    let index = 0;

    for(let y=0;y<height;y++){
        for(let x=0;x<width;x++){
           
            let r = px[index]
            pixels[index] = r
            // let g = px[index+1]
            
            // let b = px[index+2]
            
            px[index] = r
            px[index+1] = random(255)
            px[index+2] = abs(cos(mappedY)*255)
            px[index+3] = mouseY

            index +=4
        }


}
cam.updatePixels()  
updatePixels()
}