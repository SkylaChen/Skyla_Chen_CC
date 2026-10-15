let  xLoc=[]
let  yLoc=[]
let  numSegments = 50
let counter = 0

function setup() {
    createCanvas(windowWidth, windowHeight)

    for (let i=0; i<numSegments; i++){
        xLoc[i]= width/2
        yLoc[i]=height/2
    }
    print(xLoc,yLoc)


}
function draw() {
    background(0)
    noStroke()
    xLoc[numSegments-1] = width*noise(counter)
    yLoc[numSegments-1] = height*noise(counter+10)

    for(let i=0; i<numSegments-1; i++){
        xLoc[i] = xLoc[i+1]
        yLoc[i] = yLoc[i+1]

        let diamiter = 100* sin(map(i, 0, numSegments-1, 0,PI))
        let r= diamiter
        let g= 255-diamiter
        let b = 200 * cos(map(i, 0, numSegments-1, 0,PI))
        fill(r,g,b)

        ellipse(xLoc[i], yLoc[i], diamiter)

}

counter+=0.01


}