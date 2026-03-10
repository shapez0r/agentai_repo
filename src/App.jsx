import { useEffect, useRef, useState } from 'react'
import './App.css'

const VIEWPORT = Object.freeze({ width: 960, height: 540 })
const PLAYER = Object.freeze({
  width: 42,
  height: 54,
  speed: 5.4,
  jumpVelocity: 17,
  gravity: 0.92,
  maxFallSpeed: 24,
  jumpCutGravity: 0.55,
})

const GROUND_SEGMENTS = Object.freeze([
  { x: 0, y: 460, width: 520, height: 80 },
  { x: 660, y: 460, width: 700, height: 80 },
  { x: 1490, y: 460, width: 770, height: 80 },
  { x: 2460, y: 460, width: 1140, height: 80 },
])

const PITS = Object.freeze([
  { x: 520, y: 460, width: 140, height: 80 },
  { x: 1360, y: 460, width: 130, height: 80 },
  { x: 2260, y: 460, width: 200, height: 80 },
])

const PLATFORMS = Object.freeze([
  { x: 220, y: 360, width: 92, height: 18, kind: 'brick' },
  { x: 330, y: 320, width: 92, height: 18, kind: 'brick' },
  { x: 540, y: 388, width: 116, height: 18, kind: 'stone' },
  { x: 735, y: 355, width: 108, height: 18, kind: 'brick' },
  { x: 1080, y: 360, width: 96, height: 18, kind: 'brick' },
  { x: 1185, y: 315, width: 96, height: 18, kind: 'brick' },
  { x: 1290, y: 270, width: 96, height: 18, kind: 'brick' },
  { x: 1375, y: 355, width: 104, height: 18, kind: 'stone' },
  { x: 1495, y: 305, width: 104, height: 18, kind: 'stone' },
  { x: 1615, y: 255, width: 104, height: 18, kind: 'stone' },
  { x: 1810, y: 340, width: 124, height: 18, kind: 'brick' },
  { x: 2280, y: 390, width: 110, height: 18, kind: 'stone' },
  { x: 2405, y: 332, width: 110, height: 18, kind: 'stone' },
  { x: 2600, y: 365, width: 96, height: 18, kind: 'brick' },
  { x: 2710, y: 320, width: 96, height: 18, kind: 'brick' },
  { x: 2820, y: 275, width: 96, height: 18, kind: 'brick' },
  { x: 3050, y: 320, width: 108, height: 18, kind: 'stone' },
])

const PIPES = Object.freeze([
  { x: 930, y: 376, width: 72, height: 84 },
  { x: 1700, y: 400, width: 72, height: 60 },
  { x: 2935, y: 364, width: 72, height: 96 },
])

const SOLIDS = Object.freeze([...GROUND_SEGMENTS, ...PLATFORMS, ...PIPES])

const COINS = Object.freeze([
  { x: 248, y: 326 },
  { x: 358, y: 286 },
  { x: 566, y: 352 },
  { x: 771, y: 318 },
  { x: 1098, y: 323 },
  { x: 1203, y: 278 },
  { x: 1308, y: 233 },
  { x: 1398, y: 320 },
  { x: 1518, y: 270 },
  { x: 1638, y: 220 },
  { x: 1840, y: 305 },
  { x: 1872, y: 270 },
  { x: 2308, y: 355 },
  { x: 2433, y: 296 },
  { x: 2620, y: 330 },
  { x: 2730, y: 285 },
  { x: 2840, y: 240 },
  { x: 2980, y: 318 },
  { x: 3160, y: 335 },
  { x: 3340, y: 295 },
])

const ENEMIES = Object.freeze([
  { x: 820, y: 426, width: 42, height: 34, minX: 705, maxX: 892, speed: 1.1 },
  { x: 1545, y: 426, width: 42, height: 34, minX: 1495, maxX: 1682, speed: 0.95 },
  { x: 1985, y: 426, width: 42, height: 34, minX: 1835, maxX: 2225, speed: 1.15 },
  { x: 2500, y: 426, width: 42, height: 34, minX: 2465, maxX: 2885, speed: 1.2 },
])

const CLOUDS = Object.freeze([
  { x: 70, y: 92, scale: 1 },
  { x: 430, y: 128, scale: 1.25 },
  { x: 890, y: 86, scale: 0.9 },
  { x: 1290, y: 118, scale: 1.35 },
  { x: 1780, y: 74, scale: 1.1 },
  { x: 2240, y: 132, scale: 1.22 },
  { x: 2775, y: 84, scale: 1 },
  { x: 3260, y: 126, scale: 1.28 },
])

const HILLS = Object.freeze([
  { x: -20, width: 280, height: 150, color: '#7dc576', shadow: '#5ca85c' },
  { x: 340, width: 360, height: 185, color: '#65b85f', shadow: '#4d9c4b' },
  { x: 910, width: 320, height: 170, color: '#7ccf74', shadow: '#5cab57' },
  { x: 1470, width: 390, height: 195, color: '#69bf67', shadow: '#4f9f50' },
  { x: 2120, width: 330, height: 175, color: '#7ece79', shadow: '#59aa58' },
  { x: 2800, width: 360, height: 190, color: '#63b562', shadow: '#479547' },
])

const LEVEL = Object.freeze({
  worldWidth: 3600,
  floorY: 460,
  startX: 88,
  flag: { x: 3360, y: 140, width: 12, height: 320 },
  castle: { x: 3430, y: 280, width: 120, height: 180 },
})

const TOUCH_DEFAULTS = Object.freeze({ left: false, right: false, jump: false })

function createInputState() {
  return {
    left: false,
    right: false,
    jump: false,
    jumpConsumed: false,
  }
}

function createPlayer() {
  return {
    x: LEVEL.startX,
    y: LEVEL.floorY - PLAYER.height,
    width: PLAYER.width,
    height: PLAYER.height,
    vx: 0,
    vy: 0,
    grounded: true,
    facing: 1,
  }
}

function createGameState() {
  return {
    player: createPlayer(),
    coins: COINS.map((coin, index) => ({ ...coin, id: index, collected: false })),
    enemies: ENEMIES.map((enemy, index) => ({
      ...enemy,
      id: index,
      alive: true,
      direction: index % 2 === 0 ? 1 : -1,
    })),
    cameraX: 0,
    time: 0,
    coinsCollected: 0,
    deaths: 0,
    status: 'running',
    statusUntil: 0,
  }
}

function getHudSnapshot(game) {
  return {
    coins: game.coinsCollected,
    totalCoins: COINS.length,
    deaths: game.deaths,
    status: game.status,
  }
}

function areHudSnapshotsEqual(previous, next) {
  return (
    previous.coins === next.coins &&
    previous.totalCoins === next.totalCoins &&
    previous.deaths === next.deaths &&
    previous.status === next.status
  )
}

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum)
}

function intersects(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  )
}

function resolveHorizontalCollisions(player, previousX) {
  for (const solid of SOLIDS) {
    if (!intersects(player, solid)) {
      continue
    }

    if (player.vx > 0 && previousX + player.width <= solid.x + 1) {
      player.x = solid.x - player.width
    } else if (player.vx < 0 && previousX >= solid.x + solid.width - 1) {
      player.x = solid.x + solid.width
    }
  }
}

function resolveVerticalCollisions(player, previousY) {
  player.grounded = false

  for (const solid of SOLIDS) {
    if (!intersects(player, solid)) {
      continue
    }

    const previousBottom = previousY + player.height

    if (player.vy >= 0 && previousBottom <= solid.y + 1) {
      player.y = solid.y - player.height
      player.vy = 0
      player.grounded = true
    } else if (player.vy < 0 && previousY >= solid.y + solid.height - 1) {
      player.y = solid.y + solid.height
      player.vy = 0
    }
  }
}

function respawnPlayer(game) {
  game.player = createPlayer()
  game.cameraX = 0
  game.status = 'running'
  game.statusUntil = 0
}

function triggerRespawn(game, now) {
  if (game.status !== 'running') {
    return
  }

  game.deaths += 1
  game.status = 'respawning'
  game.statusUntil = now + 850
}

function updateGame(game, input, delta, now) {
  game.time += delta

  if (game.status === 'won') {
    return
  }

  if (game.status === 'respawning') {
    if (now >= game.statusUntil) {
      respawnPlayer(game)
    }
    return
  }

  for (const enemy of game.enemies) {
    if (!enemy.alive) {
      continue
    }

    enemy.x += enemy.speed * enemy.direction * delta

    if (enemy.x <= enemy.minX) {
      enemy.x = enemy.minX
      enemy.direction = 1
    } else if (enemy.x + enemy.width >= enemy.maxX) {
      enemy.x = enemy.maxX - enemy.width
      enemy.direction = -1
    }
  }

  const horizontalInput = (input.left ? -1 : 0) + (input.right ? 1 : 0)
  const player = game.player

  player.vx = horizontalInput * PLAYER.speed

  if (horizontalInput !== 0) {
    player.facing = horizontalInput
  }

  if (input.jump && !input.jumpConsumed && player.grounded) {
    player.vy = -PLAYER.jumpVelocity
    player.grounded = false
    input.jumpConsumed = true
  } else if (!input.jump) {
    input.jumpConsumed = false
  }

  if (!input.jump && player.vy < 0) {
    player.vy += PLAYER.jumpCutGravity * delta
  }

  const previousX = player.x
  const previousY = player.y

  player.x += player.vx * delta
  player.x = clamp(player.x, 0, LEVEL.worldWidth - player.width)
  resolveHorizontalCollisions(player, previousX)

  player.vy = Math.min(player.vy + PLAYER.gravity * delta, PLAYER.maxFallSpeed)
  player.y += player.vy * delta
  resolveVerticalCollisions(player, previousY)

  if (player.y > VIEWPORT.height + 220) {
    triggerRespawn(game, now)
    return
  }

  for (const coin of game.coins) {
    if (coin.collected) {
      continue
    }

    const coinBox = {
      x: coin.x - 13,
      y: coin.y - 13,
      width: 26,
      height: 26,
    }

    if (intersects(player, coinBox)) {
      coin.collected = true
      game.coinsCollected += 1
    }
  }

  const previousBottom = previousY + player.height

  for (const enemy of game.enemies) {
    if (!enemy.alive || !intersects(player, enemy)) {
      continue
    }

    if (previousBottom <= enemy.y + 12 && player.vy >= 0) {
      enemy.alive = false
      player.vy = -11
      player.grounded = false
    } else {
      triggerRespawn(game, now)
      return
    }
  }

  const finishZone = {
    x: LEVEL.flag.x - 22,
    y: LEVEL.flag.y,
    width: 36,
    height: LEVEL.flag.height,
  }

  if (intersects(player, finishZone)) {
    player.vx = 0
    player.vy = 0
    game.status = 'won'
  }

  const cameraTarget = clamp(
    player.x - VIEWPORT.width * 0.35,
    0,
    LEVEL.worldWidth - VIEWPORT.width,
  )

  game.cameraX += (cameraTarget - game.cameraX) * 0.16
}

function roundedRectPath(ctx, x, y, width, height, radius) {
  const limitedRadius = Math.min(radius, width / 2, height / 2)

  ctx.beginPath()
  ctx.moveTo(x + limitedRadius, y)
  ctx.lineTo(x + width - limitedRadius, y)
  ctx.arcTo(x + width, y, x + width, y + limitedRadius, limitedRadius)
  ctx.lineTo(x + width, y + height - limitedRadius)
  ctx.arcTo(x + width, y + height, x + width - limitedRadius, y + height, limitedRadius)
  ctx.lineTo(x + limitedRadius, y + height)
  ctx.arcTo(x, y + height, x, y + height - limitedRadius, limitedRadius)
  ctx.lineTo(x, y + limitedRadius)
  ctx.arcTo(x, y, x + limitedRadius, y, limitedRadius)
  ctx.closePath()
}

function drawCloud(ctx, x, y, scale) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(scale, scale)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.86)'
  ctx.beginPath()
  ctx.arc(0, 10, 24, Math.PI * 0.5, Math.PI * 1.5)
  ctx.arc(28, 0, 30, Math.PI, 0)
  ctx.arc(62, 12, 24, Math.PI * 1.5, Math.PI * 0.5)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

function drawHill(ctx, hill, cameraX) {
  const x = hill.x - cameraX * 0.45
  const baseY = 460

  ctx.save()
  ctx.beginPath()
  ctx.moveTo(x, baseY)
  ctx.quadraticCurveTo(x + hill.width * 0.3, baseY - hill.height, x + hill.width * 0.55, baseY - hill.height * 0.96)
  ctx.quadraticCurveTo(x + hill.width * 0.82, baseY - hill.height * 0.84, x + hill.width, baseY)
  ctx.closePath()
  ctx.fillStyle = hill.color
  ctx.fill()

  ctx.beginPath()
  ctx.moveTo(x + hill.width * 0.2, baseY)
  ctx.quadraticCurveTo(
    x + hill.width * 0.48,
    baseY - hill.height * 0.74,
    x + hill.width * 0.7,
    baseY,
  )
  ctx.closePath()
  ctx.fillStyle = hill.shadow
  ctx.fill()
  ctx.restore()
}

function drawBackground(ctx, cameraX) {
  const skyGradient = ctx.createLinearGradient(0, 0, 0, VIEWPORT.height)
  skyGradient.addColorStop(0, '#85dcff')
  skyGradient.addColorStop(0.55, '#7cc7ff')
  skyGradient.addColorStop(1, '#f8d36f')

  ctx.fillStyle = skyGradient
  ctx.fillRect(0, 0, VIEWPORT.width, VIEWPORT.height)

  ctx.fillStyle = '#ffe57a'
  ctx.beginPath()
  ctx.arc(814, 88, 44, 0, Math.PI * 2)
  ctx.fill()

  for (const cloud of CLOUDS) {
    drawCloud(ctx, cloud.x - cameraX * 0.2, cloud.y, cloud.scale)
  }

  for (const hill of HILLS) {
    drawHill(ctx, hill, cameraX)
  }
}

function drawGround(ctx) {
  for (const segment of GROUND_SEGMENTS) {
    ctx.fillStyle = '#4da04d'
    ctx.fillRect(segment.x, segment.y - 14, segment.width, 14)

    ctx.fillStyle = '#8d5b34'
    ctx.fillRect(segment.x, segment.y, segment.width, segment.height)

    ctx.fillStyle = '#b97b48'

    for (let stripeX = segment.x + 16; stripeX < segment.x + segment.width; stripeX += 42) {
      ctx.fillRect(stripeX, segment.y + 10, 12, 54)
    }
  }

  for (const pit of PITS) {
    const lavaGradient = ctx.createLinearGradient(pit.x, pit.y, pit.x, VIEWPORT.height)
    lavaGradient.addColorStop(0, '#ff8e2a')
    lavaGradient.addColorStop(1, '#d73217')

    ctx.fillStyle = lavaGradient
    ctx.fillRect(pit.x, pit.y + 14, pit.width, VIEWPORT.height - pit.y - 14)

    ctx.fillStyle = '#ffd24a'
    ctx.beginPath()
    ctx.moveTo(pit.x, pit.y + 14)
    for (let waveX = pit.x; waveX <= pit.x + pit.width + 18; waveX += 18) {
      ctx.quadraticCurveTo(waveX + 9, pit.y + 4, waveX + 18, pit.y + 14)
    }
    ctx.lineTo(pit.x + pit.width, VIEWPORT.height)
    ctx.lineTo(pit.x, VIEWPORT.height)
    ctx.closePath()
    ctx.fill()
  }
}

function drawPlatform(ctx, platform) {
  if (platform.kind === 'stone') {
    ctx.fillStyle = '#9aa8bf'
    ctx.fillRect(platform.x, platform.y, platform.width, platform.height)
    ctx.fillStyle = '#dfe9f8'
    ctx.fillRect(platform.x, platform.y, platform.width, 4)
    ctx.fillStyle = '#7082a2'

    for (let markerX = platform.x + 10; markerX < platform.x + platform.width - 6; markerX += 18) {
      ctx.fillRect(markerX, platform.y + 9, 6, 5)
    }

    return
  }

  ctx.fillStyle = '#c56e2b'
  ctx.fillRect(platform.x, platform.y, platform.width, platform.height)
  ctx.fillStyle = '#e3a15a'
  ctx.fillRect(platform.x, platform.y, platform.width, 4)
  ctx.fillStyle = '#8d451f'

  for (let markerX = platform.x + 18; markerX < platform.x + platform.width; markerX += 24) {
    ctx.fillRect(markerX, platform.y, 3, platform.height)
  }

  ctx.fillRect(platform.x, platform.y + 9, platform.width, 2)
}

function drawPipe(ctx, pipe) {
  ctx.fillStyle = '#299847'
  ctx.fillRect(pipe.x, pipe.y, pipe.width, pipe.height)
  ctx.fillStyle = '#5ed36f'
  ctx.fillRect(pipe.x + 8, pipe.y + 6, 14, pipe.height - 6)
  ctx.fillStyle = '#1d6f35'
  ctx.fillRect(pipe.x, pipe.y, pipe.width, 8)
  ctx.fillStyle = '#3cb255'
  ctx.fillRect(pipe.x - 6, pipe.y - 10, pipe.width + 12, 14)
  ctx.fillStyle = '#7eec90'
  ctx.fillRect(pipe.x + 4, pipe.y - 6, pipe.width - 8, 4)
}

function drawCoin(ctx, coin, time) {
  const coinY = coin.y + Math.sin(time * 0.11 + coin.id) * 6

  ctx.save()
  ctx.translate(coin.x, coinY)
  ctx.fillStyle = '#ffd23f'
  ctx.beginPath()
  ctx.ellipse(0, 0, 11, 14, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#f4a41d'
  ctx.lineWidth = 3
  ctx.stroke()
  ctx.strokeStyle = '#fff7b3'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(0, -8)
  ctx.lineTo(0, 8)
  ctx.stroke()
  ctx.restore()
}

function drawEnemy(ctx, enemy) {
  ctx.save()
  ctx.translate(enemy.x, enemy.y)
  ctx.fillStyle = '#7a3e17'
  ctx.beginPath()
  ctx.ellipse(enemy.width * 0.5, enemy.height * 0.68, 20, 16, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#9f5730'
  ctx.beginPath()
  ctx.ellipse(enemy.width * 0.5, enemy.height * 0.5, 18, 13, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#fff7ef'
  ctx.fillRect(11, 8, 6, 10)
  ctx.fillRect(25, 8, 6, 10)
  ctx.fillStyle = '#25100a'
  ctx.fillRect(14, 10, 2, 5)
  ctx.fillRect(28, 10, 2, 5)

  ctx.fillStyle = '#4e240d'
  ctx.fillRect(8, enemy.height - 5, 10, 5)
  ctx.fillRect(enemy.width - 18, enemy.height - 5, 10, 5)
  ctx.restore()
}

function drawPlayer(ctx, player, game) {
  const flash = game.status === 'respawning' && Math.floor(game.time * 0.7) % 2 === 0

  if (flash) {
    return
  }

  ctx.save()
  ctx.translate(player.x, player.y)
  ctx.scale(player.facing, 1)

  if (player.facing < 0) {
    ctx.translate(-player.width, 0)
  }

  ctx.fillStyle = '#e74739'
  ctx.fillRect(8, 0, player.width - 16, 11)
  ctx.fillRect(5, 6, 18, 6)

  ctx.fillStyle = '#ffd5b1'
  ctx.fillRect(10, 11, player.width - 20, 14)

  ctx.fillStyle = '#20254f'
  ctx.fillRect(25, 15, 3, 4)

  ctx.fillStyle = '#355ed8'
  ctx.fillRect(9, 26, player.width - 18, 18)
  ctx.fillStyle = '#f7ce53'
  ctx.fillRect(14, 31, 4, 4)
  ctx.fillRect(player.width - 18, 31, 4, 4)

  ctx.fillStyle = '#8d4021'
  ctx.fillRect(6, 22, 7, 17)
  ctx.fillRect(player.width - 13, 22, 7, 17)

  ctx.fillStyle = '#1b2960'
  ctx.fillRect(10, 44, 8, 10)
  ctx.fillRect(player.width - 18, 44, 8, 10)

  ctx.fillStyle = '#5a250f'
  ctx.fillRect(8, 51, 10, 3)
  ctx.fillRect(player.width - 18, 51, 10, 3)
  ctx.restore()
}

function drawFlagAndCastle(ctx, time, game) {
  const flag = LEVEL.flag
  const flagWave = Math.sin(time * 0.12) * 4
  const loweredFlagY = game.status === 'won' ? 300 : 178

  ctx.fillStyle = '#dae5f7'
  ctx.fillRect(flag.x, flag.y, flag.width, flag.height)
  ctx.fillStyle = '#f1c94a'
  ctx.beginPath()
  ctx.arc(flag.x + 6, flag.y - 6, 6, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#ef4b31'
  ctx.beginPath()
  ctx.moveTo(flag.x + 10, loweredFlagY)
  ctx.lineTo(flag.x + 56 + flagWave, loweredFlagY + 8)
  ctx.lineTo(flag.x + 10, loweredFlagY + 30)
  ctx.closePath()
  ctx.fill()

  const castle = LEVEL.castle

  ctx.fillStyle = '#7c8497'
  ctx.fillRect(castle.x, castle.y, castle.width, castle.height)
  ctx.fillStyle = '#99a4ba'

  for (let towerX = castle.x; towerX < castle.x + castle.width; towerX += 24) {
    ctx.fillRect(towerX, castle.y - 16, 16, 16)
  }

  ctx.fillStyle = '#5f6c83'
  ctx.fillRect(castle.x + 42, castle.y + 82, 36, 98)
  ctx.fillStyle = '#25304c'
  ctx.beginPath()
  ctx.arc(castle.x + 60, castle.y + 90, 18, Math.PI, 0)
  ctx.fill()

  ctx.fillStyle = '#25304c'
  ctx.fillRect(castle.x + 16, castle.y + 42, 10, 18)
  ctx.fillRect(castle.x + 92, castle.y + 42, 10, 18)
}

function drawOverlay(ctx, game) {
  if (game.status === 'running') {
    return
  }

  ctx.fillStyle = 'rgba(12, 20, 45, 0.24)'
  ctx.fillRect(0, 0, VIEWPORT.width, VIEWPORT.height)

  roundedRectPath(ctx, VIEWPORT.width / 2 - 200, 150, 400, 120, 24)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
  ctx.fill()

  ctx.textAlign = 'center'
  ctx.fillStyle = '#16325d'
  ctx.font = '700 34px "Chakra Petch", sans-serif'
  ctx.fillText(game.status === 'won' ? 'Course Clear' : 'Respawning', VIEWPORT.width / 2, 200)
  ctx.font = '500 18px "Chakra Petch", sans-serif'
  ctx.fillStyle = '#32537d'
  ctx.fillText(
    game.status === 'won'
      ? 'You made it to the flag.'
      : 'You got clipped. Jumping back in.',
    VIEWPORT.width / 2,
    236,
  )
}

function drawGame(ctx, game) {
  ctx.clearRect(0, 0, VIEWPORT.width, VIEWPORT.height)
  drawBackground(ctx, game.cameraX)

  ctx.save()
  ctx.translate(-game.cameraX, 0)
  drawGround(ctx)

  for (const platform of PLATFORMS) {
    drawPlatform(ctx, platform)
  }

  for (const pipe of PIPES) {
    drawPipe(ctx, pipe)
  }

  for (const coin of game.coins) {
    if (!coin.collected) {
      drawCoin(ctx, coin, game.time)
    }
  }

  for (const enemy of game.enemies) {
    if (enemy.alive) {
      drawEnemy(ctx, enemy)
    }
  }

  drawFlagAndCastle(ctx, game.time, game)
  drawPlayer(ctx, game.player, game)
  ctx.restore()

  drawOverlay(ctx, game)
}

function getStatusCopy(status) {
  if (status === 'won') {
    return 'Course clear. Hit restart to run it again.'
  }

  if (status === 'respawning') {
    return 'Checkpoint reset in progress.'
  }

  return 'Reach the flag, stomp the walkers, and clear the gaps.'
}

function App() {
  const [initialGame] = useState(() => createGameState())
  const canvasRef = useRef(null)
  const frameRef = useRef(0)
  const gameRef = useRef(initialGame)
  const inputRef = useRef(createInputState())
  const hudRef = useRef(getHudSnapshot(initialGame))
  const [hud, setHud] = useState(() => getHudSnapshot(initialGame))
  const [touchState, setTouchState] = useState(TOUCH_DEFAULTS)

  const resetGame = () => {
    gameRef.current = createGameState()
    inputRef.current = createInputState()
    hudRef.current = getHudSnapshot(gameRef.current)
    setHud(hudRef.current)
    setTouchState(TOUCH_DEFAULTS)
  }

  const setControlState = (control, pressed) => {
    inputRef.current[control] = pressed

    if (control === 'jump' && !pressed) {
      inputRef.current.jumpConsumed = false
    }

    setTouchState((current) => {
      if (current[control] === pressed) {
        return current
      }

      return { ...current, [control]: pressed }
    })
  }

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')

    if (!canvas || !context) {
      return undefined
    }

    context.imageSmoothingEnabled = true

    const publishHud = () => {
      const nextHud = getHudSnapshot(gameRef.current)

      if (areHudSnapshotsEqual(hudRef.current, nextHud)) {
        return
      }

      hudRef.current = nextHud
      setHud(nextHud)
    }

    const releaseAllInputs = () => {
      inputRef.current = createInputState()
      setTouchState(TOUCH_DEFAULTS)
    }

    const onKeyDown = (event) => {
      const handled =
        event.code === 'ArrowLeft' ||
        event.code === 'KeyA' ||
        event.code === 'ArrowRight' ||
        event.code === 'KeyD' ||
        event.code === 'ArrowUp' ||
        event.code === 'KeyW' ||
        event.code === 'Space'

      if (!handled) {
        return
      }

      event.preventDefault()

      if (event.code === 'ArrowLeft' || event.code === 'KeyA') {
        inputRef.current.left = true
      }

      if (event.code === 'ArrowRight' || event.code === 'KeyD') {
        inputRef.current.right = true
      }

      if (event.code === 'ArrowUp' || event.code === 'KeyW' || event.code === 'Space') {
        inputRef.current.jump = true
      }
    }

    const onKeyUp = (event) => {
      if (event.code === 'ArrowLeft' || event.code === 'KeyA') {
        inputRef.current.left = false
      }

      if (event.code === 'ArrowRight' || event.code === 'KeyD') {
        inputRef.current.right = false
      }

      if (event.code === 'ArrowUp' || event.code === 'KeyW' || event.code === 'Space') {
        inputRef.current.jump = false
        inputRef.current.jumpConsumed = false
      }
    }

    let previousTime = performance.now()

    const tick = (time) => {
      const delta = Math.min((time - previousTime) / 16.667, 2.3)
      previousTime = time

      updateGame(gameRef.current, inputRef.current, delta, time)
      drawGame(context, gameRef.current)
      publishHud()

      frameRef.current = requestAnimationFrame(tick)
    }

    frameRef.current = requestAnimationFrame(tick)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', releaseAllInputs)

    return () => {
      cancelAnimationFrame(frameRef.current)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', releaseAllInputs)
    }
  }, [])

  const statusCopy = getStatusCopy(hud.status)

  return (
    <main className="app-shell">
      <div className="game-layout">
        <header className="masthead">
          <div>
            <p className="eyebrow">Canvas Platformer</p>
            <h1>Pipe Sprint</h1>
            <p className="tagline">
              A compact side-scroller with pits, coins, patrolling enemies, and a finish
              flag.
            </p>
          </div>
          <button type="button" className="restart-button" onClick={resetGame}>
            Restart Run
          </button>
        </header>

        <section className="status-bar" aria-label="Game status">
          <article className="stat-card">
            <span className="stat-label">Coins</span>
            <p className="stat-value">
              {hud.coins}/{hud.totalCoins}
            </p>
          </article>
          <article className="stat-card">
            <span className="stat-label">Falls / Hits</span>
            <p className="stat-value">{hud.deaths}</p>
          </article>
          <article className="stat-card">
            <span className="stat-label">World</span>
            <p className="stat-value">1-1</p>
          </article>
          <article className="stat-card">
            <span className="stat-label">State</span>
            <p className="stat-value">{hud.status === 'won' ? 'Clear' : 'Run'}</p>
          </article>
        </section>

        <section className="stage-card" aria-label="Game stage">
          <canvas
            ref={canvasRef}
            className="game-canvas"
            width={VIEWPORT.width}
            height={VIEWPORT.height}
          />

          <div className="touch-controls" aria-label="Touch controls">
            <button
              type="button"
              className={`control-button ${touchState.left ? 'is-pressed' : ''}`}
              onPointerDown={() => setControlState('left', true)}
              onPointerUp={() => setControlState('left', false)}
              onPointerLeave={() => setControlState('left', false)}
              onPointerCancel={() => setControlState('left', false)}
            >
              Left
            </button>
            <button
              type="button"
              className={`control-button ${touchState.jump ? 'is-pressed' : ''}`}
              onPointerDown={() => setControlState('jump', true)}
              onPointerUp={() => setControlState('jump', false)}
              onPointerLeave={() => setControlState('jump', false)}
              onPointerCancel={() => setControlState('jump', false)}
            >
              Jump
            </button>
            <button
              type="button"
              className={`control-button ${touchState.right ? 'is-pressed' : ''}`}
              onPointerDown={() => setControlState('right', true)}
              onPointerUp={() => setControlState('right', false)}
              onPointerLeave={() => setControlState('right', false)}
              onPointerCancel={() => setControlState('right', false)}
            >
              Right
            </button>
          </div>
        </section>

        <section className="info-grid">
          <article className="info-card">
            <h2>Controls</h2>
            <p className="controls-list">
              <span className="control-chip">Move: A / D or Left / Right</span>
              <span className="control-chip">Jump: W / Up / Space</span>
              <span className="control-chip">Mobile: touch controls below the canvas</span>
            </p>
          </article>

          <article className="info-card">
            <h2>Objective</h2>
            <p className="goal-copy">{statusCopy}</p>
            <span className="status-pill">
              {hud.status === 'won' ? 'Flag claimed' : hud.status === 'respawning' ? 'Resetting' : 'In run'}
            </span>
          </article>
        </section>
      </div>
    </main>
  )
}

export default App
