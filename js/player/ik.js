// =========================================================================
// PLAYER/IK.JS - MATEMATYKA I SOLWERY KINEMATYKI ODWROTNEJ (2-BONE IK)
// Czyste funkcje analityczne geometrii kończyn bez zależności od Canvasu
// =========================================================================

export function ease(t) {
  return 0.5 - 0.5 * Math.cos(t * Math.PI);
}

export function parabola(t) {
  return 4 * t * (1 - t);
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function lerpAngle(a, b, t) {
  let diff = (b - a) % (Math.PI * 2);
  if (diff < -Math.PI) diff += Math.PI * 2;
  if (diff > Math.PI) diff -= Math.PI * 2;
  return a + diff * t;
}

/**
 * Analityczny solwer 2-Bone IK oparty na twierdzeniu cosinusów
 */
export function solve2BoneIK(hx, hy, tx, ty, l1, l2, facing, bendDir = -1, allowRaised = false) {
  if (isNaN(tx) || isNaN(ty)) {
    tx = hx;
    ty = hy + l1 + l2 - 4;
  }

  // Zabezpieczenie dla kończyn dolnych w standardowym chodzie i biegu (nogi: bendDir === -1):
  // W pozycji leżącej (Prone) lub przy wykopach (Spartan Kick) stopy mogą znajdować się na poziomie bioder/klatki
  if (!allowRaised && bendDir === -1 && ty < hy + 6) {
    ty = hy + 6;
  }

  let dx = tx - hx;
  let dy = ty - hy;
  let d = Math.hypot(dx, dy);

  if (isNaN(d) || d < 0.001) {
    dx = 0;
    dy = 1;
    d = 0.001;
  }

  const maxTotalReach = l1 + l2;
  const maxReach = maxTotalReach * 0.998;
  const minReach = Math.abs(l1 - l2) + 2;

  // SOFT IK: Płynne tłumienie wyprostu kolana w strefie granicznej (zapobiega knee snapping / popping)
  // Gdy dystans zbliża się do pełnego wyprostu, odległość efektywna asymptotycznie zbiega do maxReach,
  // zachowując subtelne ugięcie stawu (~3-5 stopni) i eliminując nagłe skoki pochodnej kąta.
  const softZone = 2.4;
  const softStart = maxReach - softZone;
  let effD = d;
  let effFootX = tx;
  let effFootY = ty;

  if (d > softStart) {
    effD = maxReach - softZone * Math.exp(-(d - softStart) / softZone);
    const scale = effD / d;
    effFootX = hx + dx * scale;
    effFootY = hy + dy * scale;
  } else if (d < minReach) {
    effD = minReach;
    const scale = effD / d;
    effFootX = hx + dx * scale;
    effFootY = hy + dy * scale;
  }

  const baseAngle = Math.atan2(effFootY - hy, effFootX - hx);
  const cosAlpha = Math.max(-0.9999, Math.min(0.9999, (l1 * l1 + effD * effD - l2 * l2) / (2 * l1 * effD)));
  const alpha = Math.acos(cosAlpha);

  let thighAngle = baseAngle + bendDir * (facing * alpha);
  // Ograniczenie kąta uda dla nóg w standardowym chodzie
  if (!allowRaised && bendDir === -1) {
    if (Math.sin(thighAngle) < 0.05) {
      thighAngle = facing >= 0 ? 0.08 : (Math.PI - 0.08);
    }
  }

  const kneeX = hx + l1 * Math.cos(thighAngle);
  const kneeY = hy + l1 * Math.sin(thighAngle);

  return { kneeX, kneeY, footX: effFootX, footY: effFootY };
}

/**
 * Wylicza kąt wymachu ramienia i zgięcia łokcia ku zadanemu punktowi (tx, ty)
 */
export function getArmAnglesForTarget(tx, ty, upperLen, foreLen, bendDir = 1) {
  const ik = solve2BoneIK(0, 0, tx, ty, upperLen, foreLen, 1, bendDir);
  const swing = Math.atan2(ik.kneeX, ik.kneeY);
  const fore = Math.atan2(tx - ik.kneeX, ty - ik.kneeY);
  let elbow = (fore - swing) % (Math.PI * 2);
  if (elbow > Math.PI) elbow -= Math.PI * 2;
  if (elbow <= -Math.PI) elbow += Math.PI * 2;
  return { swing, elbow };
}

/**
 * Transformuje lokalne współrzędne celowania na kąty kończyny
 */
export function getAimArmAngles(targetXLocal, targetYLocal, aimAngle, upperLen, foreLen) {
  const cosA = Math.cos(aimAngle);
  const sinA = Math.sin(aimAngle);
  const tx = cosA * targetXLocal - sinA * targetYLocal;
  const ty = sinA * targetXLocal + cosA * targetYLocal;
  return getArmAnglesForTarget(tx, ty, upperLen, foreLen, 1);
}
