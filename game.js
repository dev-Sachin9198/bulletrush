const can = $("game")
const ctx = can.getContext("2d")

const W = 600
const H = 600

can.width = W
can.height = H
ctx.imageSmoothingEnabled = false


function $(id){
    return document.getElementById(id)
}


// SETTINGS
const C = {
    pSpeed:230,
    bSpeed:520,
    eSpeed:60,
    ebSpeed:260,
    hp:100,
    eHp:60,
    dmg:20,
    eDmg:10,
    cd:0.18,
    mag:30,
    reload:1.2
}

function clamp(v,a,b){
    return Math.max(a,Math.min(b,v))
}

const img = {}
const keys = {}
const mouse = {
    x:300,
    y:300,
    on:false,
    down:false
}

let st = "menu"
let g
let muted = false
let best = +localStorage.getItem("rambo_best") || 0
let last = 0


// AUDIO POOL
const snd = {}

function play(n,v){

    if(muted) return

    const a = snd[n] || (snd[n] = [])
    let s = a.find((x)=> x.ended || x.paused)

    if(!s){
        if(a.length >= 6) return
        s = new Audio("assets/"+n+".mp3")
        a.push(s)
    }

    s.volume = v
    s.currentTime = 0
    s.play().catch(()=>{})

}


// RESET GAME
function reset(){

    g = {
        p:{
            x:300,
            y:300,
            a:0,
            hp:C.hp,
            cool:0,
            ammo:C.mag,
            rl:0,
            rapid:0,
            flash:0
        },
        b:[],
        e:[],
        eb:[],
        pu:[],
        score:0,
        kills:0,
        t:0,
        wave:1,
        left:5,
        sp:1,
        shake:0
    }

}


// MENU / OVERLAY
function ui(t,d,b){

    $("t").textContent = t
    $("d").textContent = d
    $("btn").textContent = b
    $("ov").classList.remove("hide")

}

function start(){

    reset()
    st = "play"
    $("ov").classList.add("hide")
    last = performance.now()

}

function over(){

    st = "over"
    best = Math.max(best,g.score)
    localStorage.setItem("rambo_best",best)

    ui("GAME OVER","Score "+g.score+" · Wave "+g.wave+" · Best "+best,"Play again")

}

function pause(){

    if(st==="play"){
        st = "pause"
        ui("PAUSED","Press P or the button to continue.","Resume")
    }

    else if(st==="pause"){
        st = "play"
        $("ov").classList.add("hide")
        last = performance.now()
    }

}

$("btn").onclick = ()=>{
    if(st==="pause") pause()
    else start()
}


// KEY CONTROL
window.addEventListener("keydown",(e)=>{

    keys[e.code] = 1

    if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.code)){
        e.preventDefault()
    }

    if(e.code==="KeyP" && !e.repeat) pause()

    if(e.code==="KeyM") muted = !muted

    if((e.code==="Enter" || e.code==="KeyR") && st==="over") start()

})

window.addEventListener("keyup",(e)=>{
    keys[e.code] = 0
})

window.addEventListener("blur",()=>{

    for(const k in keys){
        keys[k] = 0
    }

    if(st==="play") pause()

})

document.addEventListener("visibilitychange",()=>{
    if(document.hidden && st==="play") pause()
})


// MOUSE CONTROL
can.addEventListener("pointermove",(e)=>{

    if(e.pointerType!=="mouse") return

    const r = can.getBoundingClientRect()
    mouse.x = (e.clientX-r.left)*W/r.width
    mouse.y = (e.clientY-r.top)*H/r.height
    mouse.on = true

})

can.addEventListener("pointerdown",(e)=>{
    if(e.pointerType==="mouse") mouse.down = true
})

window.addEventListener("pointerup",()=>{
    mouse.down = false
})


// MOBILE BUTTONS
const stopEvents = ["pointerup","pointerleave","pointercancel"]

document.querySelectorAll("#pad button").forEach((b)=>{

    const k = b.dataset.k

    b.addEventListener("pointerdown",(e)=>{
        e.preventDefault()
        keys[k] = 1
    })

    stopEvents.forEach((t)=>{
        b.addEventListener(t,()=>{
            keys[k] = 0
        })
    })

})


// CREATE ENEMY
function spawn(){

    const s = Math.floor(Math.random()*4)
    const r = Math.random()

    const x = s<2 ? r*W : (s===2 ? -20 : W+20)
    const y = s<2 ? (s ? H+20 : -20) : r*H

    g.e.push({
        x:x,
        y:y,
        a:0,
        hp:C.eHp,
        cool:1+Math.random()*1.5,
        sw:Math.random()<0.5 ? 1 : -1,
        f:0
    })

}


// UPDATE GAME
function update(dt){

    const p = g.p
    g.t += dt

    // PLAYER MOVE
    const dx = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0)
    const dy = (keys.KeyS || keys.ArrowDown ? 1 : 0) - (keys.KeyW || keys.ArrowUp ? 1 : 0)

    p.mv = !!(dx || dy)

    if(dx || dy){

        const l = Math.hypot(dx,dy)

        p.x = clamp(p.x+dx/l*C.pSpeed*dt,20,W-20)
        p.y = clamp(p.y+dy/l*C.pSpeed*dt,20,H-20)

        if(!mouse.on) p.a = Math.atan2(dy,dx)

    }

    if(mouse.on) p.a = Math.atan2(mouse.y-p.y,mouse.x-p.x)

    p.cool -= dt
    p.flash -= dt
    p.rapid -= dt
    g.shake = Math.max(0,g.shake-dt*30)

    // RELOAD + FIRE
    if(p.rl>0){

        p.rl -= dt

        if(p.rl<=0) p.ammo = C.mag

    }

    else if(keys.KeyR && p.ammo<C.mag){
        p.rl = C.reload
    }

    else if((keys.Space || mouse.down) && p.cool<=0){

        if(p.ammo<=0){
            p.rl = C.reload
        }

        else{

            const c = Math.cos(p.a)
            const s = Math.sin(p.a)

            g.b.push({
                x:p.x+c*26,
                y:p.y+s*26,
                vx:c*C.bSpeed,
                vy:s*C.bSpeed,
                a:p.a
            })

            p.cool = p.rapid>0 ? C.cd/2 : C.cd
            p.ammo--
            play("fire",0.4)

        }

    }

    // PLAYER BULLET
    g.b = g.b.filter((b)=>{

        b.x += b.vx*dt
        b.y += b.vy*dt

        if(b.x<0 || b.x>W || b.y<0 || b.y>H) return false

        // COLLISION WITH ENEMY
        for(const e of g.e){

            if(Math.hypot(b.x-e.x,b.y-e.y)<20){
                e.hp -= C.dmg
                e.f = 0.1
                return false
            }

        }

        return true

    })

    // ENEMY DEAD
    g.e = g.e.filter((e)=>{

        if(e.hp>0) return true

        g.score += 10
        g.kills++

        if(Math.random()<0.2){
            g.pu.push({
                x:e.x,
                y:e.y,
                t:Math.random()<0.5 ? "health" : "rapid",
                life:10
            })
        }

        return false

    })

    // ENEMY SPAWN + WAVES
    g.sp -= dt

    if(g.left>0 && g.e.length<8 && g.sp<=0){
        spawn()
        g.left--
        g.sp = 0.9
    }

    else if(!g.left && !g.e.length){
        g.wave++
        g.left = 4+g.wave*2
        g.sp = 2
        p.ammo = C.mag
    }

    // ENEMY MOVE + FIRE
    for(const e of g.e){

        const ex = p.x-e.x
        const ey = p.y-e.y
        const d = Math.hypot(ex,ey) || 1
        const sp = C.eSpeed+g.wave*6

        e.a = Math.atan2(ey,ex)
        e.f -= dt

        if(d>170){
            e.x += ex/d*sp*dt
            e.y += ey/d*sp*dt
        }
        else{
            e.x += -ey/d*sp*0.6*dt*e.sw
            e.y += ex/d*sp*0.6*dt*e.sw
        }

        e.x = clamp(e.x,-30,W+30)
        e.y = clamp(e.y,-30,H+30)
        e.cool -= dt

        if(e.cool<=0 && d<420 && e.x>0 && e.x<W && e.y>0 && e.y<H){

            const a = e.a+(Math.random()-0.5)*0.25

            g.eb.push({
                x:e.x,
                y:e.y,
                vx:Math.cos(a)*C.ebSpeed,
                vy:Math.sin(a)*C.ebSpeed,
                a:a
            })

            e.cool = 1.1+Math.random()
            play("enemy",0.2)

        }

    }

    // ENEMY BULLET
    g.eb = g.eb.filter((b)=>{

        b.x += b.vx*dt
        b.y += b.vy*dt

        if(b.x<0 || b.x>W || b.y<0 || b.y>H) return false

        // PLAYER HIT
        if(Math.hypot(b.x-p.x,b.y-p.y)<18){
            p.hp -= C.eDmg
            p.flash = 0.25
            g.shake = 6
            return false
        }

        return true

    })

    // POWER UPS
    g.pu = g.pu.filter((u)=>{

        u.life -= dt

        if(Math.hypot(u.x-p.x,u.y-p.y)<28){

            if(u.t==="health") p.hp = Math.min(C.hp,p.hp+30)
            else p.rapid = 8

            return false

        }

        return u.life>0

    })

    if(p.hp<=0) over()

}


// SPRITE DIRECTION (0 down, 1 up, 2 left, 3 right)
function dirRow(a){

    const c = Math.cos(a)
    const s = Math.sin(a)

    if(Math.abs(c)>Math.abs(s)){
        return c>0 ? 3 : 2
    }

    return s>0 ? 0 : 1

}


// CHARACTER DRAW
function chr(im,x,y,a,mv,t){

    // SHADOW
    ctx.fillStyle = "rgba(0,0,0,.3)"
    ctx.beginPath()
    ctx.ellipse(x,y+24,16,6,0,0,7)
    ctx.fill()

    // WALK FRAME
    const frame = mv ? Math.floor(t*8)%2 : 0

    ctx.drawImage(im,frame*64,dirRow(a)*64,64,64,x-32,y-32,64,64)

}


// ROTATED IMAGE DRAW (bullets, power ups)
function spr(im,x,y,a,w,h=w){

    ctx.save()
    ctx.translate(x,y)
    ctx.rotate(a)
    ctx.drawImage(im,-w/2,-h/2,w,h)
    ctx.restore()

}


// DRAW GAME
function draw(){

    ctx.save()

    if(g.shake){
        ctx.translate((Math.random()-0.5)*g.shake,(Math.random()-0.5)*g.shake)
    }

    // BACKGROUND
    ctx.fillStyle = ctx.createPattern(img.bg,"repeat")
    ctx.fillRect(-10,-10,W+20,H+20)

    // POWER UPS
    for(const u of g.pu){
        spr(img[u.t],u.x,u.y,0,30)
    }

    // BULLETS
    for(const b of g.b){
        spr(img.bullet,b.x,b.y,b.a,24,8)
    }

    for(const b of g.eb){
        spr(img.ebullet,b.x,b.y,b.a,24,8)
    }

    // ENEMIES
    for(const e of g.e){

        chr(img.enemy,e.x,e.y,e.a,1,g.t)

        if(e.f>0){
            ctx.globalAlpha = 0.5
            ctx.fillStyle = "#fff"
            ctx.beginPath()
            ctx.arc(e.x,e.y,15,0,7)
            ctx.fill()
            ctx.globalAlpha = 1
        }

        // ENEMY HEALTH BAR
        ctx.fillStyle = "#000"
        ctx.fillRect(e.x-15,e.y-38,30,4)
        ctx.fillStyle = "#d33"
        ctx.fillRect(e.x-15,e.y-38,30*e.hp/C.eHp,4)

    }

    // PLAYER
    const p = g.p

    if(p.flash<=0 || Math.floor(p.flash*20)%2){
        chr(img.player,p.x,p.y,p.a,p.mv,g.t)
    }

    ctx.restore()

    // PLAYER HEALTH BAR
    ctx.fillStyle = "rgba(0,0,0,.55)"
    ctx.fillRect(10,10,160,14)

    ctx.fillStyle = p.hp>35 ? "#6fae4a" : "#d33"
    ctx.fillRect(10,10,160*Math.max(0,p.hp)/C.hp,14)

    ctx.strokeStyle = "#fff"
    ctx.strokeRect(10,10,160,14)

    // SCORE + AMMO DISPLAY
    ctx.fillStyle = "#fff"
    ctx.font = "bold 15px system-ui"
    ctx.textAlign = "left"

    ctx.fillText("Score "+g.score+"   Wave "+g.wave+"   Best "+best,10,44)
    ctx.fillText(p.rl>0 ? "Reloading…" : "Ammo "+p.ammo+"/"+C.mag,10,64)

    if(p.rapid>0){
        ctx.fillText("Rapid fire "+Math.ceil(p.rapid)+"s",10,84)
    }

}


// GAME LOOP
function loop(t){

    requestAnimationFrame(loop)

    const dt = Math.min(0.05,(t-last)/1000)
    last = t

    if(g){

        if(st==="play") update(dt)

        draw()

    }

}


// LOAD IMAGES THEN START LOOP
const names = ["player","enemy","bullet","ebullet","bg","health","rapid"]

Promise.all(names.map((n)=>{

    return new Promise((res)=>{

        const i = new Image()
        i.onload = res
        i.onerror = res
        i.src = "assets/"+n+".png"
        img[n] = i

    })

})).then(()=>{

    reset()
    requestAnimationFrame(loop)

})