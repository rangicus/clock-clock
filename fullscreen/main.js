// Globals
let canvas = {
  e: null, // Canvas element

  w: null, // Canvas width
  h: null, // Canvas height
};

let config = {
  scheme: 1,
  barRatio: 0.02,

  clockWeight: 1,
  handWeight: 2,
};

let key = {
  space: 32,
};

let colors = {};

let colorSchemes = [];
let clocks = [];

let lastTime = null;

// Classes
class Vector2 {
  constructor (x, y) {
    this.x = x;
    this.y = y;
  }

  copy () { return new Vector2(this.x, this.y); }
  static Zero () { return new Vector2(0, 0); }

  add (other) {
    if (typeof other === `number`) {
      this.x += other;
      this.y += other;
    } else if (other instanceof Vector2) {
      this.x += other.x;
      this.y += other.y;
    } else return console.error(`Invalid type.`, other);

    return this;
  }

  sub (other) {
    if (other instanceof Vector2) {
      this.x -= other.x;
      this.y -= other.y;
    } else return console.error(`Invalid type.`);

    return this;
  }

  mult (other) {
    if (typeof other === `number`) {
      this.x *= other;
      this.y *= other;
    } else if (other instanceof Vector2) {
      this.x *= other.x;
      this.y *= other.y;
    } else return console.error(`Invalid type.`, other);

    return this;
  }

  div (other) {
    if (typeof other === `number`) {
      this.x /= other;
      this.y /= other;
    } else return console.error(`Invalid type.`);

    return this;
  }

  mod (other) {
    if (typeof other === `number`) {
      this.x %= other;
      this.y %= other;
    } else return console.error(`Invalid type.`);

    return this;
  }

  floor () {
    this.x = Math.floor(this.x);
    this.y = Math.floor(this.y);

    return this;
  }
}

class Clock {
  constructor (index) {
    this.index = index;

    this.ang = Vector2.Zero();
    this.targetAng = Vector2.Zero();
    this.oldAng = Vector2.Zero();
    this.atime = 0;

    this.totalAtime = 2.5e3;
  }

  animate (newAng) {
    this.oldAng = this.ang.copy();
    this.targetAng = newAng.copy();
    this.atime = 0;
  }

  draw (scheme, shape) {
    const center = shape.off.copy().add(
      this.index.copy().add(0.5).mult(shape.d)
    );

    this.atime += deltaTime;
    if (this.atime > this.totalAtime) this.atime = this.totalAtime;

    this.ang.x = lerp(this.oldAng.x, this.targetAng.x, this.atime / this.totalAtime);
    this.ang.y = lerp(this.oldAng.y, this.targetAng.y, this.atime / this.totalAtime);

    let l1 = new Vector2(cos(this.ang.x), sin(this.ang.x)).mult(shape.r).add(center);
    let l2 = new Vector2(cos(this.ang.y), sin(this.ang.y)).mult(shape.r).add(center);
    
    stroke(scheme.accent); strokeWeight(config.clockWeight); noFill();
    circle(center.x, center.y, shape.d);

    strokeWeight(config.handWeight);
    line(center.x, center.y, l1.x, l1.y);
    line(center.x, center.y, l2.x, l2.y);
  }
}

// p5 Functions
function setup () {
  // Canvas
  canvas.e = createCanvas();
  canvas.e.parent(`container`);
  windowResized();

  angleMode(DEGREES);

  // Variables
  colors = {
    black: color(0),
    gray: color(128),
    white: color(255),

    green: color(0, 255, 0),
    blue: color(0, 0, 255),
    red: color(255, 0, 0),
  }

  colorSchemes.push(
    {
      background: colors.white,
      accent: colors.black,
    },
    {
      background: colors.black,
      accent: colors.white,
    }
  );

  // Clock Setup
  for (let x = 0; x < 8; x ++) {
    clocks[x] = [];
    for (let y = 0; y < 3; y ++)
      clocks[x][y] = new Clock(new Vector2(x, y));
  }
}

function draw () {
  // Colors
  const scheme = getColors();
  const shape = getClockShape();
  const now = new Date();

  // Clearing
  background(scheme.background);

  // Drawing
  const time = getTime(now);
  if (lastTime === null) {
    
    setTime(time);
    lastTime = time;
  } else if (lastTime !== time) {
    // Time just changed, animate it.

    animateTime(time);
    lastTime = time;
  }
  

  // Draw Clocks
  for (let x = 0; x < 8; x ++)
    for (let y = 0; y < 3; y ++)
      clocks[x][y].draw(scheme, shape);

  // Draw Second Bar
  const ms = now.getSeconds() * 1000 + now.getMilliseconds();
  const rate = ms / 60000;

  noStroke(); fill(scheme.accent);
  rect(
    0, canvas.size.y - shape.barHeight,
    rate * canvas.size.x, shape.barHeight
  );
}

function windowResized () {
  canvas.size = new Vector2(window.innerWidth, window.innerHeight);

  resizeCanvas(canvas.size.x, canvas.size.y);
}

function keyPressed () {
  if (keyCode === key.space) {
    if (++ config.scheme === colorSchemes.length) config.scheme = 0;
  }
}

// Functions
function getColors () {
  return colorSchemes[config.scheme];
}

function getClockShape () {
  let shape = {
    pos: null, off: null,
    r: null, d: null,
    barHeight: null,
  }

  const wDiameter = canvas.size.x / 8 * 0.99;
  const hDiameter = canvas.size.y / 3 * (1 - config.barRatio - 0.05);
  shape.barHeight = canvas.size.y * config.barRatio;

  shape.d = Math.min(wDiameter, hDiameter);
  shape.r = shape.d / 2;

  let total = new Vector2(8, 3).mult(shape.d);
  shape.off = canvas.size.copy().sub(total).div(2);

  return shape;
}

function toAngles (hour, minute) {
  let x = hour / 12 * 360 - 90;
  let y = minute / 60 * 360 - 90;

  return new Vector2(x, y);
}

function getDigit (digit) {
  let ret = null;

  if (digit === "0") {ret = [
    [03, 30], [06, 45],
    [12, 30], [12, 30],
    [12, 15], [12, 45],
  ]} else if (digit === "1") {ret = [
    [07, 35], [06, 30],
    [07, 35], [12, 30],
    [07, 35], [12, 00]
  ]} else if (digit === "2") {ret = [
    [03, 15], [09, 30],
    [03, 30], [12, 45],
    [12, 15], [09, 45]
  ]} else if (digit === "3") {ret = [
    [03, 15], [09, 30],
    [03, 15], [12, 45],
    [03, 15], [12, 45]
  ]} else if (digit === "4") {ret = [
    [06, 30], [06, 30],
    [12, 15], [12, 45],
    [07, 35], [12, 00]
  ]} else if (digit === "5") {ret = [
    [03, 30], [09, 45],
    [12, 15], [09, 30],
    [03, 15], [12, 45],
  ]} else if (digit === "6") {ret = [
    [03, 30], [09, 45],
    [12, 30], [09, 30],
    [12, 15], [12, 45],
  ]} else if (digit === "7") {ret = [
    [03, 15], [09, 30],
    [07, 35], [12, 30],
    [07, 35], [12, 00],
  ]} else if (digit === "8") {ret = [
    [03, 30], [06, 45],
    [12, 15], [12, 45],
    [12, 15], [12, 45],
  ]} else if (digit === "9") {ret = [
    [03, 30], [06, 45],
    [12, 15], [12, 30],
    [07, 35], [12, 00]
  ]}

  return ret.map(x => toAngles(...x));
}

function setDigit (n, digit) {
  digit = getDigit(digit);
  n = (n - 1) * 2;

  for (let y = 0; y < 3; y ++) {
    for (let x = n; x < n + 2; x ++) {
      const d = digit.shift();
      
      clocks[x][y].ang = d;
      clocks[x][y].oldAng = d;
      clocks[x][y].targetAng = d;
    }
  }
}

function animateDigit (n, digit) {
  digit = getDigit(digit);
  n = (n - 1) * 2;

  for (let y = 0; y < 3; y ++) {
    for (let x = n; x < n + 2; x ++) {
      const d = digit.shift();
      
      clocks[x][y].animate(d);
    }
  }
}

function getTime (now) {
  let time = [];

  let hour = now.getHours();
  hour = (hour > 12 ? hour - 12 : hour).toString().padStart(2, `0`).split(``);

  let minute = now.getMinutes().toString().padStart(2, `0`).split(``);


  return [...hour, ...minute].join(``);
}

function setTime (time) {
  for (let i = 0; i < 4; i ++) 
    setDigit(i + 1, time[i]);
}

function animateTime (time) {
  for (let i = 0; i < 4; i ++)
    animateDigit(i + 1, time[i]);
}