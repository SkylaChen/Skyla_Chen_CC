function setup() {
    createCanvas(400,400)
    pixelDensity(1)
}

function draw() {
    loadPixels()

    let px =pixels

    let index = 0;

    for(let y=0;y<height;y++){
        for(let x=0;x<width;x++){
            // let r = random(255)
            // let g = random(255)
            // let b = random(255)

            let mapppedX = map(x,frameCount,width+frameCount,0,8*PI)
            let mappedY = map(y,0,height,0,8*PI)
            
            px[index] = abs(sin(mapppedX)*255)
            px[index+1] = random(255)
            px[index+2] = abs(cos(mappedY)*255)
            px[index+3] = mouseY

            index +=4
        }


}

updatePixels()
}