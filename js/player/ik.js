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
export function solve2BoneIK(hx, hy, tx, ty, l1, l2, facing, bendDir = -1) {
  if (isNaN(tx) || isNaN(ty)) {
    tx = hx;
    ty = hy + l1 + l2 - 4;
  }

  // Zabezpieczenie dla kończyn dolnych (nogi: bendDir === -1):
  // Stopa i kolano nie mogą być wyginane ponad poziom bioder w naturalnych stanach ruchu i spadania
  if (bendDir === -1 && ty < hy + 6) {
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

  const maxReach = (l1 + l2) * 0.998;
  if (d >= maxReach) {
    let ang = Math.atan2(dy, dx);
    if (bendDir === -1) {
      // Ograniczenie kąta wyprostu nóg - skierowane zawsze w dół z bioder
      if (ang < 0.08 && ang > -Math.PI / 2) ang = 0.08;
      else if (ang <= -Math.PI / 2 && ang > -Math.PI) ang = Math.PI - 0.08;
    }
    const reach = Math.min(d, maxReach);
    return {
      kneeX: hx + l1 * Math.cos(ang),
      kneeY: hy + l1 * Math.sin(ang),
      footX: hx + reach * Math.cos(ang),
      footY: hy + reach * Math.sin(ang)
    };
  }
  const minReach = Math.abs(l1 - l2) + 2;
  if (d < minReach) {
    const ang = Math.atan2(dy, dx);
    tx = hx + Math.cos(ang) * minReach;
    ty = hy + Math.sin(ang) * minReach;
    d = minReach;
  }

  const baseAngle = Math.atan2(ty - hy, tx - hx);
  const cosAlpha = Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d)));
  const alpha = Math.acos(cosAlpha);

  let thighAngle = baseAngle + bendDir * (facing * alpha);
  // Ograniczenie kąta uda dla nóg (staw kolanowy nie może unosić się w tułów)
  if (bendDir === -1) {
    if (Math.sin(thighAngle) < 0.05) {
      thighAngle = facing >= 0 ? 0.08 : (Math.PI - 0.08);
    }
  }

  const kneeX = hx + l1 * Math.cos(thighAngle);
  const kneeY = hy + l1 * Math.sin(thighAngle);

  return { kneeX, kneeY, footX: tx, footY: ty };
}

/**
 * Wylicza kąt wymachu ramienia i zgięcia łokcia ku zadanemu punktowi (tx, ty)
 */
export function getArmAnglesForTarget(tx, ty, upperLen, foreLen, bendDir = 1) {
  const ik = solve2BoneIK(0, 0, tx, ty, upperLen, foreLen, 1, bendDir);
  const swing = Math.atan2(ik.kneeX, ik.kneeY);
  const fore = Math.atan2(tx - ik.kneeX, ty - ik.kneeY);
  const elbow = fore - swing;
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
