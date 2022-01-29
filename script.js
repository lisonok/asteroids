var ship;
var asteroids = [];
var astnum;
var initastnum = 2;
var energy = [];
var gameLevel = 0;
var message;

function setup() {
    createCanvas(windowWidth, windowHeight);
    textFont("Courier");
    ship = new Ship();
    initialize("Ига началась!", initastnum);
}

function draw() {
    background(0);
    for (var i = energy.length - 1; i >= 0; i--) {
        energy[i].update();
        energy[i].render();
        energy[i].edges();
        if (ship.hit(energy[i]) && !ship.safe) {
            ship.safe = true;
            setTimeout(function() {
                ship.safe = !ship.safe;
            }, 2000);
            ship.getBonus();
            energy[i].alive = false;
        };
        if (energy[i].life <= 20) {
            energy[i].alive = false;
        };
        if (!energy[i].alive) {
            energy.splice(i, 1);
        };
    }
    if (ship.alive) {
        ship.update();
        ship.render();
        ship.edges();
    } else {
        message = "Игра окончена";
    };
    if (asteroids.length == 0) {
        astnum += 3;
        initialize("Вы выйграли! Уровень пройден!", astnum);
    }
    for (var i = asteroids.length - 1; i >= 0; i--) {
        asteroids[i].render();
        asteroids[i].update();
        asteroids[i].edges();
        if (ship.hit(asteroids[i]) && !ship.safe) {
            ship.danger = true;
            setTimeout(function() {
                ship.danger = !ship.danger;
            }, 100);
            ship.getDamage(asteroids[i]);
            asteroids.splice(i, 1);
        }
    }
    ship.interface();
}

function initialize(messageText, newastnum) {
    message = messageText;
    gameLevel += 1;
    astnum = newastnum;
    basicinit();
}

function restart(messageText, newastnum) {
    ship.init();
    gameLevel = 1;
    asteroids = [];
    energy = [];
    message = messageText;
    astnum = newastnum
    basicinit();
}

function basicinit() {
    for (var i = 0; i < astnum; i++) {
        asteroids.push(new Asteroid());
    }
    ship.healthLevel = 100;
    ship.safe = true;
    setTimeout(function() {
        ship.safe = false;
        message = "";
    }, 4000);
}

function keyReleased() {
    if (keyCode == RIGHT_ARROW || keyCode == LEFT_ARROW) {
        ship.setRotation(0);
    } else if (keyCode == UP_ARROW) {
        ship.boosting = false;
    }
}

function keyPressed() {
    if (key == ' ') {
        ship.lasers.push(new Laser(ship.pos, ship.heading));
    } else if (keyCode == RIGHT_ARROW) {
        ship.setRotation(0.1);
    } else if (keyCode == LEFT_ARROW) {
        ship.setRotation(-0.1);
    } else if (keyCode == UP_ARROW) {
        ship.boosting = true;
    } else if (keyCode == ENTER && message == "Игра окончена") {
        restart("Попробовать снова?", initastnum);
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

class Ship {
    constructor() {
        this.pos = createVector(width / 2, height / 2 + 50);
        this.vel = createVector(0, 0);
        this.r = 10;
        this.heading = 0;
        this.rotation = 0;
        this.boosting = false;
        this.lasers = [];
        this.healthLevel = 100;
        this.healthMax = 200;
        this.alive = true;
        this.danger = false;
        this.safe = true;
        this.score = 0;
    }
    interface() {
        textSize(14);
        fill(255);
        noStroke();
        text("Счет очков = " + this.score, 50, 50);
        if (this.healthLevel >= this.healthMax) {
            text("Здоровье = Макс.", 50, 65);
        } else {
            text("Здоровье = " + constrain(round(this.healthLevel), 0, round(this.healthLevel)), 50, 65);
        }
        text("Уровень = " + gameLevel, 50, 80);
        if (message) {
            textSize(32);
            text(message, width / 2 - message.length * 10, height / 2);
        }
    }
    init() {
        this.pos = createVector(width / 2, height / 2 + 50);
        this.vel = createVector(0, 0);
        ship.alive = true;
        ship.score = 0;
        ship.healthLevel = 100;
    }
    hit(obj) {
        var d = dist(this.pos.x, this.pos.y, obj.pos.x, obj.pos.y);
        if (d < this.r + obj.r) {
            return true;
        } else {
            return false;
        }
    }
    getDamage(obj) {
        var damount = obj.r;
        this.healthLevel -= damount;
    }
    getBonus() {
        this.healthLevel += 30;
        this.score += 20;
        this.healthLevel = constrain(this.healthLevel, 0, this.healthMax);
    }
    update() {
        this.pos.add(this.vel);
        this.vel.mult(0.99);
        this.turn();
        if (this.boosting) {
            this.boost();
        }
        for (var i = this.lasers.length - 1; i >= 0; i--) {
            this.lasers[i].render();
            this.lasers[i].update();
            if (this.lasers[i].offscreen()) {
                this.lasers.splice(i, 1);
            } else {
                for (var j = asteroids.length - 1; j >= 0; j--) {
                    if (this.lasers[i].hits(asteroids[j])) {
                        var debrisVel = p5.Vector.add(this.lasers[i].vel.mult(0.2), asteroids[j].vel);
                        var newAsteroids = asteroids[j].breakup();
                        if (newAsteroids.length > 0) {
                            var probability = random() * 100;
                            if (probability > 80) {
                                generateEnergy(asteroids[j].pos, debrisVel);
                            }
                            asteroids = asteroids.concat(newAsteroids);
                        } else {
                            this.score += 10;
                        }
                        asteroids.splice(j, 1);
                        this.lasers.splice(i, 1);
                        break;
                    }
                }
            }
        }
    }
    boost() {
        var boostForce = p5.Vector.fromAngle(this.heading);
        boostForce.mult(0.1);
        this.vel.add(boostForce);
    }
    render() {
        push();
        translate(this.pos.x, this.pos.y);
        rotate(this.heading + PI / 2);
        fill(0);
        if (this.boosting) {
            stroke(255, 0, 0);
            line(-this.r + 3, this.r + 3, this.r - 3, this.r + 3);
        }
        if (this.danger) {
            stroke(255, 0, 0);
        } else if (this.safe) {
            stroke(0, 255, 0);
        } else {
            stroke(255);
        }
        triangle(-this.r, this.r, this.r, this.r, 0, -this.r);
        pop();
    }
    edges() {
        if (this.pos.x > width + this.r) {
            this.pos.x = -this.r;
        } else if (this.pos.x < -this.r) {
            this.pos.x = width + this.r;
        }
        if (this.pos.y > height + this.r) {
            this.pos.y = -this.r;
        } else if (this.pos.y < -this.r) {
            this.pos.y = height + this.r;
        }
    }
    setRotation(angle) {
        this.rotation = angle;
    }
    turn(angle) {
        this.heading += this.rotation;
    }
}

class Laser {
    constructor(spos, angle) {
        this.pos = createVector(spos.x, spos.y);
        this.vel = p5.Vector.fromAngle(angle);
        this.vel.mult(10);
        this.r = 1;
    }
    hits(target) {
        var d = dist(this.pos.x, this.pos.y, target.pos.x, target.pos.y);
        if (d < this.r + target.r) {

            return true;
        } else {
            return false;
        }
    }
    update() {
        this.pos.add(this.vel);
    }
    render() {
        push();
        strokeWeight(2);
        stroke(255);
        point(this.pos.x, this.pos.y);
        pop();
    }
    offscreen() {
        if (this.pos.x > width + this.r || this.pos.x < -this.r || this.pos.y > height + this.r || this.pos.y < -this.r) {
            return true;
        } else {
            return false;
        }
    }
}

class Energy {
    constructor(pos, vel) {
        this.pos = pos.copy();
        this.vel = vel.copy();
        this.vel.mult(-0.2);

        this.r = 10;
        this.life = random(100, 300);
        this.alive = true;

        this.update = function() {
            this.pos.add(this.vel);
            this.life -= 0.2;
        };

        this.render = function() {
            if (this.life > 20) {
                noFill();
                stroke(0, this.life, 0);
                ellipse(this.pos.x, this.pos.y, this.r, this.r);
            }
        };
    }
    edges() {
        if (this.pos.x > width + this.r) {
            this.pos.x = -this.r;
        } else if (this.pos.x < -this.r) {
            this.pos.x = width + this.r;
        }
        if (this.pos.y > height + this.r) {
            this.pos.y = -this.r;
        } else if (this.pos.y < -this.r) {
            this.pos.y = height + this.r;
        }
    }
}

function generateEnergy(pos, vel) {
    energy.push(new Energy(pos, vel));
}

class Asteroid {
    constructor(pos, s) {
        if (pos) {
            this.pos = pos.copy();
        } else {
            this.pos = createVector(random(width), random(height));
        }
        this.vel = p5.Vector.random2D();
        this.sides = floor(random(15, 30));
        if (s) {
            this.sides = floor(s * 0.5);
        } else {
            this.sides = floor(random(15, 30));
        }
        this.rmin = 20;
        this.rmax = 40;
        this.r = map(this.sides, 15, 30, this.rmin, this.rmax);
        this.offset = [];
        for (var i = 0; i < this.sides; i++) {
            this.offset[i] = random(-5, 5);
        }
        this.angle = 0;
        var increment = map(this.r, this.rmin, this.rmax, 0.1, 0.01);
        if (random() > 0.5) {
            this.increment = increment * -1;
        } else {
            this.increment = increment;
        }
    }
    breakup() {
        var newA = [];
        if (this.sides > 5) {
            newA[0] = new Asteroid(this.pos, this.sides);
            newA[1] = new Asteroid(this.pos, this.sides);
        }
        return newA;
    }
    update() {
        this.pos.add(this.vel);
        this.angle += this.increment;
    }
    render() {
        push();
        translate(this.pos.x, this.pos.y);
        rotate(this.angle);
        noFill();
        stroke(255);

        beginShape();
        for (var i = 0; i < this.sides; i++) {
            var angle = map(i, 0, this.sides, 0, TWO_PI);
            var r = this.r + this.offset[i];
            var x = r * cos(angle);
            var y = r * sin(angle);
            vertex(x, y);
        }
        endShape(CLOSE);
        pop();
    }
    edges() {
        if (this.pos.x > width + this.r) {
            this.pos.x = -this.r;
        } else if (this.pos.x < -this.r) {
            this.pos.x = width + this.r;
        }
        if (this.pos.y > height + this.r) {
            this.pos.y = -this.r;
        } else if (this.pos.y < -this.r) {
            this.pos.y = height + this.r;
        }
    }
    setRotation(angle) {
        this.rotation = angle;
    }
    turn(angle) {
        this.heading += this.rotation;
    }
}