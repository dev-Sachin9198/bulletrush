const can = document.getElementById("game")
const ctx = can.getContext("2d")

can.width = 500
can.height = 500

let playerSpeed = 10
let bulletSpeed = 8 
let enemySpeed = 1
let enemyBulletSpeed = 7
let playerMaxHealth = 20
let enemyMaxHealth = 60
let bulletDamage = 20
let enemyBulletDamage = 10
let maxEnemies = 8
let playerHealth = playerMaxHealth
let score = 0


const player = {
    size:20,
    color:"blue",
    pos:{
        x:250,
        y:250,
        dir:"right"
    },
    xl:8,
    yl:8
}

function playFireSound(){
let sound = new Audio("fire.mp3")
sound.volume = 0.4
sound.play()
}

let bullets=[]
let enemies=[]
let enemyBullets=[]

// PLAYER BULLET
function bulletfir(){
    bullets.forEach((b,i)=>{
        ctx.fillStyle="black"
        ctx.fillRect(b.x,b.y,player.xl,player.yl)

        if(b.dir==="UP"){
            b.y-=bulletSpeed
        }
        else if(b.dir==="down"){
            b.y+=bulletSpeed
        }
        else if(b.dir==="left"){
            b.x-=bulletSpeed
        }
        else if(b.dir==="right"){
            b.x+=bulletSpeed
        }

        if(b.x<0||b.x>can.width||b.y<0||b.y>can.height){
            bullets.splice(i,1)
        }

        // COLLISION WITH ENEMY
        enemies.forEach((e,ei)=>{

            if(
                b.x < e.x+20 &&
                b.x+player.xl > e.x &&
                b.y < e.y+20 &&
                b.y+player.yl > e.y
            ){

                e.health -= bulletDamage
                bullets.splice(i,1)
                if(e.health<=0){
                    enemies.splice(ei,1)
                    score++

                }

            }

        })

    })

}


let playerAlive = true

// ENEMY BULLET
function enemyBulletFire(){

    enemyBullets.forEach((b,i)=>{

        ctx.fillStyle="black"
        ctx.fillRect(b.x,b.y,player.xl,player.yl)

        if(b.dir==="UP"){
            b.y-=enemyBulletSpeed
        }
        else if(b.dir==="down"){
            b.y+=enemyBulletSpeed
        }
        else if(b.dir==="left"){
            b.x-=enemyBulletSpeed
        }
        else if(b.dir==="right"){
            b.x+=enemyBulletSpeed
        }

        // PLAYER HIT
        if(
            b.x < player.pos.x+20 &&
            b.x+player.xl > player.pos.x &&
            b.y < player.pos.y+20 &&
            b.y+player.yl > player.pos.y
        ){

            playerHealth -= enemyBulletDamage

            enemyBullets.splice(i,1)

            if(playerHealth <= 0){
                playerAlive = false
            }

        }

    })

}



// ENEMY DRAW
function drawEnemies(){

    enemies.forEach((e)=>{

        ctx.fillStyle="green"
        drawcha(e.x,e.y,20,e.dir)

        if(e.dir==="UP"){
            e.y-=enemySpeed
        }
        else if(e.dir==="down"){
            e.y+=enemySpeed
        }
        else if(e.dir==="left"){
            e.x-=enemySpeed
        }
        else if(e.dir==="right"){
            e.x+=enemySpeed
        }

        // RANDOM DIRECTION
        if(Math.random()<0.01){
            let dirs=["UP","down","left","right"]
            e.dir=dirs[Math.floor(Math.random()*4)]
        }

        // RANDOM BULLET
        if(Math.random()<0.03){

            enemyBullets.push({
                x:e.x,
                y:e.y,
                dir:e.dir
            })
            new Audio("enemey.mp3").play()
        }

    })

}



// CREATE ENEMY
function createEnemy(){

    if(enemies.length >= maxEnemies) return

    enemies.push({
        x:Math.random()*can.width,
        y:Math.random()*can.height,
        dir:"down",
        health:enemyMaxHealth
    })

}



// PLAYER SHAPE
function drawcha(x,y,size,dir){

ctx.fillStyle="red"

    if(dir==="UP"){
        ctx.fillRect(x-size/2,y-1.5*size,size,size)
        ctx.fillRect(x-1.5*size,y-size/2,size,size)
        ctx.fillRect(x-size/2,y-size/2,size,size)
        ctx.fillRect(x-1.5*size,y+size/2,size,size)
        ctx.fillRect(x+size/2,y+size/2,size,size)
        ctx.fillRect(x+size/2,y-size/2,size,size)
    }

    else if(dir==="down"){
        ctx.fillRect(x-1.5*size,y-1.5*size,size,size)
        ctx.fillRect(x+size/2,y-1.5*size,size,size)
        ctx.fillRect(x-1.5*size,y-size/2,size,size)
        ctx.fillRect(x+size/2,y-size/2,size,size)
        ctx.fillRect(x-size/2,y-size/2,size,size)
        ctx.fillRect(x-size/2,y+size/2,size,size)
    }

    else if(dir==="left"){
        ctx.fillRect(x-size/2,y-1.5*size,size,size)
        ctx.fillRect(x-1.5*size,y-size/2,size,size)
        ctx.fillRect(x-size/2,y-size/2,size,size)
        ctx.fillRect(x-size/2,y+size/2,size,size)
        ctx.fillRect(x+size/2,y+size/2,size,size)
        ctx.fillRect(x+size/2,y-1.5*size,size,size)
    }

    else if(dir==="right"){
        ctx.fillRect(x-1.5*size,y-1.5*size,size,size)
        ctx.fillRect(x+size/2,y-size/2,size,size)
        ctx.fillRect(x-size/2,y-1.5*size,size,size)
        ctx.fillRect(x-size/2,y-size/2,size,size)
        ctx.fillRect(x-size/2,y+size/2,size,size)
        ctx.fillRect(x-1.5*size,y+size/2,size,size)
    }

}



// GAME LOOP
setInterval(()=>{
    let gameStarted = false
ctx.clearRect(0,0,can.width,can.height)
if(playerAlive){
drawcha(player.pos.x,player.pos.y,player.size,player.pos.dir)
}

bulletfir()
drawEnemies()
enemyBulletFire()

ctx.fillStyle="black"
ctx.fillText("Health : "+playerHealth,10,20)

//  SCORE DISPLAY
ctx.fillText("Score : "+score,10,40)

if(!playerAlive){

ctx.fillStyle="red"
ctx.fillText("GAME OVER",150,250)


}

},20)


// ENEMY SPAWN
setInterval(()=>{
createEnemy()
},3000)


// KEY CONTROL
window.addEventListener("keypress",(e)=>{

if(!playerAlive) return

    if(e.code==="KeyW"){
        player.pos.y-=playerSpeed
        player.pos.dir="UP"
    }

    else if(e.code==="KeyA"){
        player.pos.x-=playerSpeed
        player.pos.dir="left"
    }

    else if(e.code==="KeyS"){
        player.pos.y+=playerSpeed
        player.pos.dir="down"
    }

    else if(e.code==="KeyD"){
        player.pos.x+=playerSpeed
        player.pos.dir="right"
    }

    else if(e.code==="Space"){

        bullets.push({
            x:player.pos.x,
            y:player.pos.y,
            dir:player.pos.dir
        })

    }
    playFireSound()

})
function startGame(){
    gameStarted = true
}