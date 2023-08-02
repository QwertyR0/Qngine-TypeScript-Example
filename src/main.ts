// This demo doesn't require any plugins to be installed.

// Be sure to set the import path below:
import { Qngine } from "../../engine/src/types/index.js"

// define variables
const gameScale = 1;
const playerAccelartion = 200;
const meteorAccelartion = 250;

let shipSprite: Qngine.ImageInstance;
let meteorSprite: Qngine.ImageInstance;
let backgroundSprite:Qngine.ImageInstance;
let laserSprite: Qngine.ImageInstance; 
let lasers:Qngine.GameObject[] = [];
let player: Qngine.GameObject;
let background: Qngine.GameObject;

let gameState: number = 0;
let isReturnDown: boolean = false; // this issue will be fixed in next versions
let score: number = 0;
let scoreTimer: number = 0;
let bullets:number = 0;
let spawnTimer: number = 0;

export async function init(w: Qngine.Window): Promise<void> {
    laserSprite = await w.loadImage('./textures/laser.png');
    shipSprite = await w.loadImage("./textures/ship.png");
    meteorSprite = await w.loadImage("./textures/meteor.png");
    backgroundSprite = await w.loadImage("./textures/black.png");
    player = new w.GameObject(w.width/2 - shipSprite.width/2, w.height - shipSprite.height - 20*gameScale, 4, shipSprite.width*gameScale, shipSprite.height*gameScale, 0, {
        update: playerUpdate,
        render: playerRender
    });

    background = new w.GameObject(0, 0, 1, backgroundSprite.width*4, backgroundSprite.height*4, 0, {
        render: backgroundRender
    });
}

export async function loop(w: Qngine.Window, dt: number): Promise<void>{
    if (gameState === 1){
        spawnTimer += dt;
        scoreTimer += dt;

        if (scoreTimer >= 0.7){
            scoreTimer = 0;
            score++;

            if(score % 8 === 0){
                bullets++;
            }
        }

        if (spawnTimer >= 0.5){
            spawnTimer = 0;

            const x: number = Math.floor(Math.random() * ((w.width-meteorSprite.width) - 10)) + 10;
            new w.GameObject(x, -meteorSprite.height-20, 3, meteorSprite.width, meteorSprite.width, 0, {
                update: meteorUpdate,
                render: meteorRender
            });
        }

        for (let i: number = 0; i < lasers.length; i++){
            lasers[i].y -= meteorAccelartion * dt;

            const outofBoundsDetect: boolean =
            lasers[i].x + lasers[i].width < 0 ||
            lasers[i].y + lasers[i].height < 0;

            if (outofBoundsDetect){
                lasers[i].remove();
                lasers.splice(i, 1);
            }
        }
        
        if (isReturnDown === true){
            const laser = new w.GameObject(player.x + player.width/2 - laserSprite.width/2, player.y - laserSprite.height, 2, laserSprite.width, laserSprite.height, 0, {
                render: laserRender
            });

            lasers.push(laser);

            isReturnDown = false;
            bullets--;
        }

        background.y += 35 * dt;

        // Wrap the background when it goes off-screen
        if (background.y >= background.height) {
            background.y = 0;
        }
    }
}

export function draw(w: Qngine.Window, g: Qngine.Graphics): void{
    if (gameState === 0){
        g.text(`Press Enter to Start`, w.width/2-80, w.height/2-10, {color: "white"});
    } else if (gameState === 1){
        g.text(`Score: ${score}`, 15, 20, {color: "white"});
        g.text(`Bullets: ${bullets}`, 15, 40, {color: "white"});
    }
}

export function keyDown(key: string): void{
    if (gameState === 1 && key === "return" && bullets > 0){
        isReturnDown = true; // There will be an better alternative in upcoming updates
    }

    if (gameState === 0 && key === "return"){
        gameState = 1;
    }
}

function playerUpdate(this: Qngine.GameObject, w: Qngine.Window, dt: number): void{
    if (gameState === 1){
        // movement and detect if goes out of bounds:
        const oldX = this.x;
        const oldY = this.y;
        
        // use seperate if statements so it wont't limit other axises
        if(w.io.isKeyDown("w")){
            this.y -= playerAccelartion*dt;
            const outofBoundsDetect = this.y < 0;
            if (outofBoundsDetect) this.y = oldY;
        }
    
        if(w.io.isKeyDown("s")){
            this.y += playerAccelartion*dt;
            const outofBoundsDetect = this.y + this.height > w.height;
            if (outofBoundsDetect) this.y = oldY;
        }
    
        if(w.io.isKeyDown("a")){
            this.x -= playerAccelartion*dt;
            const outofBoundsDetect = this.x < 0;
            if (outofBoundsDetect) this.x = oldX;
        }
    
        if(w.io.isKeyDown("d")){
            this.x += playerAccelartion*dt;
            const outofBoundsDetect = this.x + this.width > w.width;
            if (outofBoundsDetect) this.x = oldX;
        }
    }
}

function playerRender(this: Qngine.GameObject, w: Qngine.Window, g: Qngine.Graphics): void{
    if (gameState === 1){
        // draw ship sprite
        g.image(shipSprite, this.x, this.y);
    }
}

function meteorUpdate(this: Qngine.GameObject, w: Qngine.Window, dt: number): void {
    // TODO: Add circle collider

    this.y += meteorAccelartion * dt;

    const outofBoundsDetect: boolean =
    this.x > w.width ||
    this.y > w.height;

    if (outofBoundsDetect){
        this.remove();
    }
    
    for (let i: number = 0; i < lasers.length; i++){
        if (checkCollisions(lasers[i], this)){
            this.remove();
            lasers[i].remove();
            lasers.splice(i, 1);
        }
    }

    if(checkCollisions(player, this)) gameOver(w);
}

function meteorRender(this: Qngine.GameObject, w: Qngine.Window, g: Qngine.Graphics): void{
    if (gameState === 1){
        g.image(meteorSprite, this.x, this.y);
    }
}

function laserRender(this: Qngine.GameObject, w: Qngine.Window, g: Qngine.Graphics){
    if (gameState === 1){
        g.image(laserSprite, this.x, this.y);
    }
}

function backgroundRender(this: Qngine.GameObject, w: Qngine.Window, g: Qngine.Graphics){
    if (gameState === 1){
        g.image(backgroundSprite, this.x, this.y - this.height, {
            scaleX: 4,
            scaleY: 4
        });

        g.image(backgroundSprite, this.x, this.y, {
            scaleX: 4,
            scaleY: 4
        });
    }
}

function checkCollisions(obj1: Qngine.GameObject, obj2: Qngine.GameObject): boolean {
	return obj1.x < obj2.x + obj2.width && obj1.x + obj1.width > obj2.x && obj1.y < obj2.y + obj2.height && obj1.y + obj1.height > obj2.y;
}

function gameOver(w: Qngine.Window): void {
    gameState = 0;
    spawnTimer = 0;
    scoreTimer = 0;
    lasers = [];
    background.y = 0;
    score = 0;
    bullets = 0;

    w.GameObject.RemoveAll();
    init(w);
}