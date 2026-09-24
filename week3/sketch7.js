let angle = 0; // 用于翅膀扇动的全局角度

function setup() {
  createCanvas(600, 800);
}

function draw() {
  background(49, 104, 181); // 深蓝色背景
  translate(width / 2, height / 2); // 将原点移到画布中心
  
  // 使用黄金角创建飞鸟蒲公英效果
  let goldenAngle = 137.508 * (PI / 180); // 黄金角弧度
  let numBirds = 350; // 鸟的数量
  
  for (let i = 0; i < numBirds; i++) {
    // 计算每只鸟在螺旋线上的位置
    let r = 12 * sqrt(i); // 半径
    let theta = i * goldenAngle; // 角度
    
    // 将极坐标转换为笛卡尔坐标
    let x = r * cos(theta);
    let y = r * sin(theta);
    
    // 计算鸟的大小，内圈小，外圈大
    let size = map(i, 0, numBirds, 2.5, 5.5);
    
    // 计算翅膀扇动动画
    let wingAngle = sin(angle + i * 0.05) * 0.15; // 模拟扇动
    
    // 绘制飞鸟
    push();
    translate(x, y);
    rotate(theta + PI / 2); // 让鸟朝向螺旋线的外侧
    
    noStroke();
    fill(210, 233, 255); // 浅天蓝色
    
    // 绘制左翅膀
    push();
    scale(1, cos(wingAngle)); // 通过缩放模拟扇动
    fill(210, 233, 255, 20); // 半透明效果
    beginShape();
    vertex(0, 0);
    bezierVertex(-size, -size * 2, -size * 1.5, -size * 3, -size * 2, -size * 1.5);
    endShape();
    pop();
    
    // 绘制右翅膀
    push();
    scale(1, cos(wingAngle));
    fill(210, 233, 255, 20);
    beginShape();
    vertex(0, 0);
    bezierVertex(size, -size * 2, size * 1.5, -size * 3, size * 2, -size * 1.5);
    endShape();
    pop();
    
    pop();
  }
  
  // 更新动画角度
  angle += 0.02;
}