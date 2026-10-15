//随机抽死一名幸运观众
let students = ["Skyla Chen","11","22","111"]
let font
let student =""
let col = 100

async function setup() {
    createCanvas(windowWidth, windowHeight)
    font = await
    // loadFont('ARCADE_N.TTF')
    // textFont(font)
    textFont("monospace")
    textSize(36)
    textAlign(CENTER)


}

function draw() {
    background(0)
    fill(col)
    text(student, width / 2, height / 2);
   // col=col*0.99
    col*=0.99
}
function mousePressed() {

    let length = students.length
    let i= floor(random(length-1))
   // print(i)

   if (students.length > 0) {
    student = students[i]
    students.splice(i, 1)
   }

 print(students)

col=255

}