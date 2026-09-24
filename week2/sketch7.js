function setup() {
  createCanvas(600, 400)
}

function draw() {
  background(240)

  push()
  translate(width / 2, height / 2)

  noStroke()

  fill(80, 155, 200)
  ellipse(-10, 25, 150, 90) // 身体
  ellipse(50, -20, 64, 64)  // 头

  fill(245, 170, 50)
  triangle(78, -28, 78, -12, 112, -20) // 喙

  fill(20)
  circle(60, -27, 6) // 眼睛

  pop()
}