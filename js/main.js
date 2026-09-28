import { CONFIG, FRAME_DURATION, START_X } from './config.js';
import {
  canvas, ctx, W, H, GROUND_Y, camera,
  initCanvas, resize, updateCamera, updateDistance,
  spawnGrass, updateParticles, dist,
  drawSky, drawGround, drawParticles, drawDistanceMarkers, drawHUD,
  drawEntityHealthBar,
  clearDesertSandstorm, clearWinterBlizzard,
  isTouchDevice, setTouchDevice
} from './world.js';
import {
  player, playerJump, playerSlide, startJumpCharge, executeReleaseJump,
  startKickCharge, executeReleaseKick,
  updatePlayer, drawPlayer, setPlayerClass
} from './player.js';
import {
  ball, resetBallToPlayer, updateBall, checkBallPlayerCollisions, drawBall
} from './ball.js';
import {
  obstacles, checkObstacleCollisions, checkPlayerPlatformLanding, drawObstacles, resetObstacles,
  updateProceduralObstacles, updateProceduralBirds, switchArena, activeArenaId
} from './obstacles.js';
import { CLASSES } from './classes/index.js';
import { bot, botKeys, updateBotBrain } from './bot.js';
import { WEAPONS, updateBullets, drawBullets, shootWeapon } from './weapons.js';

// =========================================================================
// STAN MYSZY I BLOKADA MENU KONTEKSTOWEGO
// =========================================================================
export const mouseState = {
  lmbDown: false,
  rmbDown: false,
  semiFired: false
};

window.addEventListener('contextmenu', (e) => e.preventDefault());

const leftStick = {
  active: false, id: null, baseX: 0, baseY: 0, curX: 0, curY: 0,
  axisX: 0, axisY: 0, maxRadius: 55
};

const rightStick = {
  active: false, id: null, baseX: 0, baseY: 0, curX: 0, curY: 0,
  axisX: 0, axisY: 0, maxRadius: 65, power: 0
};

const btnCluster = {
  jump: { x: 0, y: 0, r: 30, active: false, id: null },
  slide: { x: 0, y: 0, r: 26, active: false, id: null },
  fire: { x: 0, y: 0, r: 32, active: false, id: null },
  kick: { x: 0, y: 0, r: 28, active: false, id: null }
};

const keys = { left: false, right: false, down: false, up: false, space: false, slide: false };

function updateButtonLayout() {
  btnCluster.jump.x = W - 60;
  btnCluster.jump.y = H - 200;
  btnCluster.slide.x = W - 60;
  btnCluster.slide.y = H - 135;
  btnCluster.fire.x = W - 130;
  btnCluster.fire.y = H - 75;
  btnCluster.kick.x = W - 60;
  btnCluster.kick.y = H - 70;
}

const canvasEl = document.getElementById('game');
initCanvas(canvasEl);
if (canvas) {
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
} else if (canvasEl) {
  canvasEl.addEventListener('contextmenu', (e) => e.preventDefault());
}
resize(player);
updateButtonLayout();
resetBallToPlayer(player, GROUND_Y);

window.addEventListener('resize', () => {
  resize(player);
  updateButtonLayout();
});

window.addEventListener('touchstart', () => {
  setTouchDevice(true);
}, { once: true });

canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  setTouchDevice(true);
  const midX = W / 2;

  for (let i = 0; i < e.changedTouches.length; i++) {
    const t = e.changedTouches[i];

    if (t.clientX < midX && !leftStick.active) {
      leftStick.active = true;
      leftStick.id = t.identifier;
      leftStick.baseX = t.clientX; leftStick.baseY = t.clientY;
      leftStick.curX = t.clientX; leftStick.curY = t.clientY;
      leftStick.axisX = 0; leftStick.axisY = 0;
    }

    if (t.clientX >= midX) {
      if (dist(t.clientX, t.clientY, btnCluster.jump.x, btnCluster.jump.y) < btnCluster.jump.r + 14) {
        btnCluster.jump.active = true; btnCluster.jump.id = t.identifier;
        keys.up = true;
        startJumpCharge();
      } else if (dist(t.clientX, t.clientY, btnCluster.slide.x, btnCluster.slide.y) < btnCluster.slide.r + 14) {
        btnCluster.slide.active = true; btnCluster.slide.id = t.identifier;
        playerSlide(spawnGrass, GROUND_Y);
      } else if (dist(t.clientX, t.clientY, btnCluster.fire.x, btnCluster.fire.y) < btnCluster.fire.r + 14) {
        btnCluster.fire.active = true; btnCluster.fire.id = t.identifier;
        mouseState.lmbDown = true;
        mouseState.semiFired = false;
      } else if (dist(t.clientX, t.clientY, btnCluster.kick.x, btnCluster.kick.y) < btnCluster.kick.r + 14) {
        btnCluster.kick.active = true; btnCluster.kick.id = t.identifier;
        mouseState.rmbDown = true;
        startKickCharge(player);
      } else if (!rightStick.active) {
        rightStick.active = true;
        rightStick.id = t.identifier;
        rightStick.baseX = t.clientX; rightStick.baseY = t.clientY;
        rightStick.curX = t.clientX; rightStick.curY = t.clientY;
        rightStick.axisX = 0; rightStick.axisY = 0;
        rightStick.power = 0;

        player.isCharging = true;
        player.isStickCharging = true;
        player.chargePower = 0;
      }
    }
  }
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  for (let i = 0; i < e.changedTouches.length; i++) {
    const t = e.changedTouches[i];

    if (leftStick.active && t.identifier === leftStick.id) {
      leftStick.curX = t.clientX; leftStick.curY = t.clientY;
      const dx = leftStick.curX - leftStick.baseX;
      const dy = leftStick.curY - leftStick.baseY;
      const sDist = Math.hypot(dx, dy);
      const deadzone = 5;
      const maxR = leftStick.maxRadius || 55;
      if (sDist > deadzone) {
        const factor = Math.min(1.0, (sDist - deadzone) / (maxR - deadzone));
        leftStick.axisX = (dx / sDist) * factor;
        leftStick.axisY = (dy / sDist) * factor;
      } else {
        leftStick.axisX = 0;
        leftStick.axisY = 0;
      }
    }

    if (rightStick.active && t.identifier === rightStick.id) {
      rightStick.curX = t.clientX; rightStick.curY = t.clientY;
      const dx = rightStick.curX - rightStick.baseX;
      const dy = rightStick.curY - rightStick.baseY;
      const sDist = Math.hypot(dx, dy);
      const deadzone = 6;
      const maxR = rightStick.maxRadius || 65;

      if (sDist > deadzone) {
        const power = Math.min(1.0, (sDist - deadzone) / (maxR - deadzone));
        rightStick.power = power;
        player.chargePower = power;
        player.isCharging = true;

        const nx = dx / sDist;
        const ny = dy / sDist;
        const aimDist = 160 + power * 120;
        aimOffsetX = nx * aimDist;
        aimOffsetY = ny * aimDist;
        player.aimX = player.x + player.w / 2 + aimOffsetX;
        player.aimY = player.y + player.h / 2 + aimOffsetY;
      } else {
        rightStick.power = 0;
        player.chargePower = 0;
        player.isCharging = false;
      }
    }
  }
}, { passive: false });

function endTouch(e) {
  e.preventDefault();
  for (let i = 0; i < e.changedTouches.length; i++) {
    const t = e.changedTouches[i];
    if (leftStick.active && t.identifier === leftStick.id) {
      leftStick.active = false; leftStick.id = null;
      leftStick.axisX = 0; leftStick.axisY = 0;
    }
    if (btnCluster.jump.active && t.identifier === btnCluster.jump.id) {
      btnCluster.jump.active = false; btnCluster.jump.id = null;
      keys.up = false;
      executeReleaseJump(spawnGrass);
    }
    if (btnCluster.slide.active && t.identifier === btnCluster.slide.id) {
      btnCluster.slide.active = false; btnCluster.slide.id = null;
    }
    if (btnCluster.fire && btnCluster.fire.active && t.identifier === btnCluster.fire.id) {
      btnCluster.fire.active = false; btnCluster.fire.id = null;
      mouseState.lmbDown = false;
      mouseState.semiFired = false;
    }
    if (btnCluster.kick && btnCluster.kick.active && t.identifier === btnCluster.kick.id) {
      btnCluster.kick.active = false; btnCluster.kick.id = null;
      mouseState.rmbDown = false;
      executeReleaseKick(ball, player);
    }
    if (rightStick.active && t.identifier === rightStick.id) {
      rightStick.active = false; rightStick.id = null;
      player.isStickCharging = false;
      executeReleaseKick(ball, player);
    }
  }
}
canvas.addEventListener('touchend', endTouch, { passive: false });
canvas.addEventListener('touchcancel', endTouch, { passive: false });

export const BIOME_TELEPORT_TARGETS = {
  STADIUM: 0,
  DESERT: 800,
  WINTER: 1600,
  JUNGLE: 2400,
  HELL: 3200
};

export function teleportToDistance(meters) {
  const targetX = START_X + (meters * 14);

  player.x = targetX;
  player.y = GROUND_Y - player.h;
  player.vx = 0;
  player.vy = 0;
  player.isJumping = false;
  player.isSliding = false;
  player.isIntro = false;
  player.isCharging = false;
  player.isJumpCharging = false;
  player.kickState = 'IDLE';
  player.gaitMode = 'IDLE';

  ball.x = targetX + (30 * (player.facing || 1));
  ball.y = GROUND_Y - ball.radius;
  ball.vx = 0;
  ball.vy = 0;
  ball.spin = 0;
  ball.trail = [];

  camera.x = player.x;
  camera.targetX = player.x;
  camera.y = GROUND_Y;
  camera.targetY = GROUND_Y;

  clearDesertSandstorm();
  clearWinterBlizzard();

  resetObstacles();
  updateProceduralObstacles(targetX);
  updateProceduralBirds(targetX, GROUND_Y);
  updateDistance(targetX);
}

export function devSetClass(target) {
  let targetClass = null;
  if (typeof target === 'object') targetClass = target;
  else if (typeof target === 'string') targetClass = CLASSES[target.toUpperCase()];
  else if (typeof target === 'number') {
    const keys = Object.keys(CLASSES);
    targetClass = CLASSES[keys[target % keys.length]];
  }

  if (targetClass) {
    setPlayerClass(targetClass);
  }
}

window.teleportToDistance = teleportToDistance;
window.devSetClass = devSetClass;
window.setPlayerClass = setPlayerClass;

const devPanelContainer = document.getElementById('dev-panel-container');
const devToggleBtn = document.getElementById('dev-toggle-btn');
const devMenu = document.getElementById('dev-menu');

export function toggleDevPanel() {
  if (!devMenu) return;
  const isHidden = devMenu.classList.toggle('dev-menu-hidden');
  if (devToggleBtn) {
    if (isHidden) devToggleBtn.classList.remove('active');
    else devToggleBtn.classList.add('active');
  }
}
window.toggleDevPanel = toggleDevPanel;

let isDraggingDev = false;
let devDragStartX = 0;
let devDragStartY = 0;
let devPanelStartLeft = 0;
let devPanelStartTop = 0;
let devHasMoved = false;

if (devToggleBtn && devPanelContainer) {
  devToggleBtn.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    isDraggingDev = true;
    devHasMoved = false;
    devDragStartX = e.clientX;
    devDragStartY = e.clientY;
    devPanelStartLeft = devPanelContainer.offsetLeft;
    devPanelStartTop = devPanelContainer.offsetTop;
    try { devToggleBtn.setPointerCapture(e.pointerId); } catch (err) {}
  });

  devToggleBtn.addEventListener('pointermove', (e) => {
    if (!isDraggingDev) return;
    e.stopPropagation();
    const dx = e.clientX - devDragStartX;
    const dy = e.clientY - devDragStartY;
    if (!devHasMoved && Math.hypot(dx, dy) >= 6) {
      devHasMoved = true;
    }
    if (devHasMoved) {
      const newLeft = devPanelStartLeft + dx;
      const newTop = devPanelStartTop + dy;
      const maxLeft = Math.max(10, window.innerWidth - devToggleBtn.offsetWidth - 10);
      const maxTop = Math.max(10, window.innerHeight - devToggleBtn.offsetHeight - 10);
      devPanelContainer.style.left = Math.max(8, Math.min(maxLeft, newLeft)) + 'px';
      devPanelContainer.style.top = Math.max(8, Math.min(maxTop, newTop)) + 'px';
    }
  });

  const handleDevPointerUp = (e) => {
    if (!isDraggingDev) return;
    e.stopPropagation();
    isDraggingDev = false;
    try { devToggleBtn.releasePointerCapture(e.pointerId); } catch (err) {}
    if (!devHasMoved) {
      toggleDevPanel();
    }
  };

  devToggleBtn.addEventListener('pointerup', handleDevPointerUp);
  devToggleBtn.addEventListener('pointercancel', handleDevPointerUp);

  devPanelContainer.addEventListener('pointerdown', (e) => { e.stopPropagation(); });
}

document.querySelectorAll('.dev-btn[data-meters]').forEach((btn) => {
  const handler = (e) => {
    e.stopPropagation(); e.preventDefault();
    const meters = parseInt(btn.getAttribute('data-meters'), 10);
    if (!isNaN(meters)) teleportToDistance(meters);
  };
  btn.addEventListener('click', handler);
  btn.addEventListener('touchend', handler);
});

document.querySelectorAll('.dev-class-btn').forEach((btn) => {
  const handler = (e) => {
    e.stopPropagation(); e.preventDefault();
    const classId = btn.getAttribute('data-class');
    devSetClass(classId);
  };
  btn.addEventListener('click', handler);
  btn.addEventListener('touchend', handler);
});

// Obsługa włączania/wyłączania bota w panelu DEV
const devBotToggleBtn = document.getElementById('dev-bot-toggle-btn');
if (devBotToggleBtn) {
  const toggleBot = (e) => {
    e.stopPropagation();
    e.preventDefault();
    bot.active = !bot.active;
    if (bot.active) {
      devBotToggleBtn.textContent = '🤖 BOT: ON';
      devBotToggleBtn.style.background = 'rgba(168, 85, 247, 0.35)';
      devBotToggleBtn.style.borderColor = '#c084fc';
      devBotToggleBtn.style.color = '#ffffff';
      devBotToggleBtn.style.boxShadow = '0 0 12px rgba(168, 85, 247, 0.6)';

      // Respawn 350 px przed graczem na poziomie podłoża i zresetowanie pędu
      bot.x = player.x + (player.facing || 1) * 350;
      bot.y = GROUND_Y - bot.h;
      bot.vx = 0;
      bot.vy = 0;
      bot.facing = -(player.facing || 1);
      bot.isJumping = false;
      bot.isSliding = false;
      bot.isCharging = false;
      bot.kickState = 'IDLE';
      bot.gaitMode = 'IDLE';
      bot.dropThroughTimer = 0;
      bot.airVx = 0;
    } else {
      devBotToggleBtn.textContent = '🤖 BOT: OFF';
      devBotToggleBtn.style.background = '';
      devBotToggleBtn.style.borderColor = '#a855f7';
      devBotToggleBtn.style.color = '#c084fc';
      devBotToggleBtn.style.boxShadow = '';
    }
  };
  devBotToggleBtn.addEventListener('click', toggleBot);
  devBotToggleBtn.addEventListener('touchend', toggleBot);
}

// Obsługa przełącznika areny w panelu DEV (#dev-arena-btn)
const devArenaBtn = document.getElementById('dev-arena-btn');
if (devArenaBtn) {
  const toggleArena = (e) => {
    e.stopPropagation();
    e.preventDefault();
    const nextArena = (activeArenaId === 'ARENA_1') ? 'ARENA_2' : 'ARENA_1';
    switchArena(nextArena, player, bot, ball);
    devArenaBtn.textContent = (activeArenaId === 'ARENA_2') ? '🏟️ Arena: 2' : '🏟️ Arena: 1';
    if (activeArenaId === 'ARENA_2') {
      devArenaBtn.style.background = 'rgba(6, 182, 212, 0.25)';
      devArenaBtn.style.borderColor = '#06b6d4';
      devArenaBtn.style.color = '#22d3ee';
      devArenaBtn.style.boxShadow = '0 0 12px rgba(6, 182, 212, 0.55)';
    } else {
      devArenaBtn.style.background = '';
      devArenaBtn.style.borderColor = '#06b6d4';
      devArenaBtn.style.color = '#22d3ee';
      devArenaBtn.style.boxShadow = '';
    }
    camera.x = player.x;
    camera.targetX = player.x;
    camera.y = player.y;
    camera.targetY = player.y;
  };
  devArenaBtn.addEventListener('click', toggleArena);
  devArenaBtn.addEventListener('touchend', toggleArena);
}

let jumpKeyPressed = false;

window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = true;
  if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = true;
  if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.down = true;

  if ((e.code === 'KeyW' || e.code === 'ArrowUp') && !jumpKeyPressed) {
    jumpKeyPressed = true;

    if (!player.isJumping && !player.isSliding && !player.isIntro) {
      // Skok z podłoża: pojedynczy impuls fizyczny bez lewitacji w locie
      const jumpForce = player.currentClass?.stats?.jumpForce || CONFIG.JUMP_FORCE;
      player.vy = -jumpForce;
      player.isJumping = true;
      player.isCrouching = false;
      player.airVx = player.vx;
      keys.up = false;
      if (spawnGrass && player.groundY) {
        spawnGrass(player.x + player.w / 2, player.groundY, player.facing);
      }
    }
  }
  if (e.code === 'Space' && !keys.space) {
    keys.space = true;
    startKickCharge();
  }
  if ((e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyC') && !keys.slide) {
    keys.slide = true;
    playerSlide(spawnGrass, GROUND_Y);
  }
  if (e.code === 'KeyR') resetBallToPlayer(player, GROUND_Y);

  if (e.code === 'Digit1' || e.code === 'Numpad1' || e.key === '1') {
    player.currentWeapon = WEAPONS.AK47;
  } else if (e.code === 'Digit2' || e.code === 'Numpad2' || e.key === '2') {
    player.currentWeapon = WEAPONS.SHOTGUN;
  } else if (e.code === 'Digit3' || e.code === 'Numpad3' || e.key === '3') {
    teleportToDistance(BIOME_TELEPORT_TARGETS.WINTER);
  } else if (e.code === 'Digit4' || e.code === 'Numpad4' || e.key === '4') {
    teleportToDistance(BIOME_TELEPORT_TARGETS.JUNGLE);
  } else if (e.code === 'Digit5' || e.code === 'Numpad5' || e.key === '5') {
    teleportToDistance(BIOME_TELEPORT_TARGETS.HELL);
  }

  if (e.code === 'Digit6' || e.code === 'Numpad6' || e.key === '6') devSetClass('PLAYMAKER');
  else if (e.code === 'Digit7' || e.code === 'Numpad7' || e.key === '7') devSetClass('ENFORCER');
  else if (e.code === 'Digit8' || e.code === 'Numpad8' || e.key === '8') devSetClass('AERO');
  else if (e.code === 'Digit9' || e.code === 'Numpad9' || e.key === '9') devSetClass('SWEEPER');

  if (e.code === 'Backquote' || e.key === '`' || e.key === '~') toggleDevPanel();
});

window.addEventListener('keyup', (e) => {
  if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = false;
  if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = false;
  if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.down = false;

  if (e.code === 'KeyW' || e.code === 'ArrowUp') {
    jumpKeyPressed = false;
    keys.up = false;
  }
  if (e.code === 'Space') {
    keys.space = false;
    executeReleaseKick(ball, player);
  }
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyC') keys.slide = false;
});

let aimOffsetX = 160;
let aimOffsetY = -30;

function updateMouseAim(clientX, clientY) {
  const worldMouseX = camera.x + (clientX - W * 0.40) / camera.zoom;
  const worldMouseY = camera.y + (clientY - H * 0.68) / camera.zoom;
  aimOffsetX = worldMouseX - (player.x + player.w / 2);
  aimOffsetY = worldMouseY - (player.y + player.h / 2);
}

window.addEventListener('mousemove', (e) => {
  updateMouseAim(e.clientX, e.clientY);
});

canvas.addEventListener('mousedown', (e) => {
  updateMouseAim(e.clientX, e.clientY);

  if (e.button === 0) {
    // LPM: Strzał
    mouseState.lmbDown = true;
    mouseState.semiFired = false;
  } else if (e.button === 2) {
    // PPM: Ładowanie wykopu piłki
    mouseState.rmbDown = true;
    startKickCharge(player);
  }
});

window.addEventListener('mouseup', (e) => {
  if (e.button === 0) {
    mouseState.lmbDown = false;
    mouseState.semiFired = false;
  } else if (e.button === 2) {
    mouseState.rmbDown = false;
    executeReleaseKick(ball, player);
  }
});

let flickFirstDownTime = 0;
let flickReturnedToCenter = false;

function updateDoubleFlickDetection(axisY) {
  const now = performance.now();
  if (axisY > 0.65) {
    if (flickFirstDownTime > 0 && flickReturnedToCenter) {
      const dt = now - flickFirstDownTime;
      if (dt >= 80 && dt <= 350) {
        player.dropThroughTimer = 18;
        flickFirstDownTime = 0;
        flickReturnedToCenter = false;
      } else if (dt > 350) {
        flickFirstDownTime = now;
        flickReturnedToCenter = false;
      }
    } else if (flickFirstDownTime === 0) {
      flickFirstDownTime = now;
      flickReturnedToCenter = false;
    }
  } else if (axisY < 0.25) {
    if (flickFirstDownTime > 0) {
      flickReturnedToCenter = true;
    }
  }

  if (flickFirstDownTime > 0 && (now - flickFirstDownTime > 400)) {
    flickFirstDownTime = 0;
    flickReturnedToCenter = false;
  }
}

function drawCrosshair(ctx, x, y, customCol) {
  if (typeof x !== 'number' || isNaN(x)) return;
  const col = customCol || player.currentClass?.visuals?.crosshairColor || '#38bdf8';

  ctx.save();
  ctx.strokeStyle = col;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, y, 8, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x - 12, y); ctx.lineTo(x - 4, y);
  ctx.moveTo(x + 4, y);  ctx.lineTo(x + 12, y);
  ctx.moveTo(x, y - 12); ctx.lineTo(x, y - 4);
  ctx.moveTo(x, y + 4);  ctx.lineTo(x, y + 12);
  ctx.stroke();

  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.arc(x, y, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function update() {
  player.aimX = (player.x + player.w / 2) + aimOffsetX;
  player.aimY = (player.y + player.h / 2) + aimOffsetY;

  // =========================================================================
  // OBSŁUGA STRZELANIA GRACZA (CIĄGŁY OGIEŃ DLA AK-47 VS SEMI DLA SHOTGUNA)
  // =========================================================================
  const curWep = player.currentWeapon || WEAPONS.AK47;
  const isHoldingLMB = mouseState.lmbDown && !player.isDead;

  // STAN 2: Prowadzenie ognia (trzymanie LPM przy AK-47)
  if (curWep.auto) {
    player.isShooting = isHoldingLMB;
  } else {
    player.isShooting = false;
  }

  if (isHoldingLMB && player.shootCooldown <= 0) {
    if (curWep.auto) {
      shootWeapon(player, curWep);
    } else {
      if (!mouseState.semiFired) {
        shootWeapon(player, curWep);
        mouseState.semiFired = true; // Blokada do czasu ponownego kliknięcia LPM
      }
    }
  }

  if (leftStick && leftStick.active) {
    updateDoubleFlickDetection(leftStick.axisY);
  }

  updatePlayer(keys, leftStick, GROUND_Y, ball, spawnGrass, player);
  updateParticles();
  updateBall(GROUND_Y);
  checkBallPlayerCollisions(player, GROUND_Y, spawnGrass);
  checkObstacleCollisions(ball, GROUND_Y, player);

  if (bot.active) {
    updateBotBrain(ball, player, GROUND_Y, spawnGrass);
    checkBallPlayerCollisions(bot, GROUND_Y, spawnGrass);
    checkPlayerPlatformLanding(bot, GROUND_Y);
  }

  // Aktualizacja balistyki i kolizji pocisków z areną, piłką i postaciami
  const combatants = bot.active ? [player, bot] : [player];
  updateBullets(GROUND_Y, obstacles, ball, combatants);

  updateCamera(player, ball);
  updateDistance(ball.x);
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  drawSky(ctx);

  ctx.save();
  ctx.translate(W * 0.40, H * 0.68);
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-camera.x, -camera.y);

  const worldLeft = camera.x - (W / camera.zoom);
  const worldRight = camera.x + (W / camera.zoom) * 2;
  const worldWidth = worldRight - worldLeft;

  drawGround(ctx, worldLeft, worldWidth);
  drawParticles(ctx);
  drawDistanceMarkers(ctx, worldLeft, worldRight);
  drawObstacles(ctx, GROUND_Y);

  // Renderowanie pocisków w przestrzeni świata
  drawBullets(ctx);

  drawPlayer(ctx, GROUND_Y, player);

  // Rysowanie drugiego gracza (bota)
  if (bot.active) {
    drawPlayer(ctx, GROUND_Y, bot);
    drawEntityHealthBar(ctx, bot, -12);

    // Dyskretny znacznik nad paskiem HP bota
    ctx.save();
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#c084fc';
    ctx.shadowColor = 'rgba(168, 85, 247, 0.8)';
    ctx.shadowBlur = 4;
    ctx.fillText('[BOT]', bot.x + bot.w / 2, bot.y - 19);
    ctx.restore();

    // Celownik bota został wyłączony zgodnie z wytycznymi
  }

  drawBall(ctx);

  // Celownik gracza
  drawCrosshair(ctx, player.aimX, player.aimY);

  ctx.restore();

  drawHUD(ctx, player, leftStick, btnCluster, rightStick, ball);
}

let lastTime = performance.now();
function loop() {
  requestAnimationFrame(loop);
  const now = performance.now();
  const delta = now - lastTime;

  if (delta < FRAME_DURATION - 0.5) return;
  if (delta > 250) {
    lastTime = now;
  } else {
    lastTime += FRAME_DURATION;
    if (now - lastTime > FRAME_DURATION) lastTime = now;
  }

  update();
  draw();
}

requestAnimationFrame(loop);
