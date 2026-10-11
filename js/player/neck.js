// =========================================================================
// PLAYER/NECK.JS - SYSTEM OZDOB SZYI, NIEŚMIERTELNIKÓW I ŁAŃCUCHÓW Z FIZYKĄ
// Zarządza stylami ozdób szyi (brak, nieśmiertelnik wojskowy, złoty łańcuch),
// ich pełną fizyką 2D (swobodne kołysanie, bezwładność, opadanie, skoki)
// oraz renderowaniem na profilu postaci i w Kreatorze.
// =========================================================================

import {
  DEFAULT_VISUALS,
  getHairPalette,
  drawCharacterHairProfile,
  drawCharacterHairOverEarProfile,
  updateAndBuildHairChain
} from './hair.js';
import { drawCharacterFacialHairProfile } from './facialHair.js';
import { drawCharacterHeadgearProfile } from './headgear.js';
import { drawCharacterMaskProfile } from './mask.js';

export const NECK_STYLE_LIST = [
  'none',        // 1. Brak ozdób szyi
  'dogtags',     // 2. Wojskowy nieśmiertelnik US Army (stalowy łańcuszek kulkowy z 2 blaszkami)
  'gold_chain'   // 3. Ciężki złoty łańcuch gangsta (splot pancerka Cuban link z medalionem)
];

/**
 * Sprawdza, czy dany styl ozdoby szyi obsługuje zmianę koloru
 */
export function doesNeckSupportColor(styleId = 'none') {
  return false; // Zarówno nieśmiertelnik stalowy jak i żółte złoto mają dedykowane palety materiałowe
}

/**
 * Renderuje wybraną ozdobę szyi na profilu postaci z pełną dynamiką fizyki 2D.
 *
 * Współrzędne w układzie profilu głowy:
 * - Kark / tył szyi: (-2.6, 5.0)
 * - Grdyka / przód szyi: (1.6, 6.5)
 * - Mostek / klatka piersiowa: (1.2, 13.0..16.5)
 */
export function drawCharacterNeckProfile(
  ctx,
  p,
  v,
  currentFacingDir = 1,
  torsoTilt = 0,
  headPitch = 0
) {
  const style = String((v && v.neckStyle) || 'none').toLowerCase();
  if (style === 'none') return;

  const isStaticTile = !!(p && p._isStaticTile);
  ctx.save();

  // Fizyka wahadła 2D dla zawieszki na szyi (napędzana prędkością, bezwładnością i podskokami)
  let swingAngle = 0;
  let bounceY = 0;

  if (!isStaticTile) {
    const chainData = updateAndBuildHairChain(
      p, 'neck_chain', currentFacingDir, torsoTilt, headPitch,
      1.0, 7.5, 3.2,
      {
        id: 'neck_pendant',
        phase: 0.9,
        restOffset: 0.0,
        archRoot: 0.0,
        liftMult: 1.75, // wyższa podatność na przyspieszenia i pęd
        gravMult: 1.10, // mocniejszy powrót do pionu grawitacyjnego
        stiffMult: 0.90,
        restProfile: [1.57, 1.57, 1.57, 1.57, 1.57, 1.57] // kąt 90 st. (zwis pionowo w dół)
      }
    );

    if (chainData && chainData.pts && chainData.pts.length > 2) {
      const tip = chainData.pts[chainData.pts.length - 1];
      const base = chainData.pts[0];
      const dx = tip.x - base.x;
      const dy = tip.y - base.y;
      swingAngle = Math.atan2(dx, dy) * 0.75;
      bounceY = Math.max(-2.5, Math.min(2.5, (dy - 3.2) * 0.45));
    }
  }

  // ---------------------------------------------------------------------------
  // 1. NIEŚMIERTELNIK WOJSKOWY (Military Dog Tags)
  // ---------------------------------------------------------------------------
  if (style === 'dogtags') {
    // Kotwice łańcuszka na szyi
    const neckBackX = -2.6;
    const neckBackY = 5.2;
    const neckFrontX = 1.7;
    const neckFrontY = 6.6;

    // Pozycja głównego wisiorka (obniżona na mostek, reagująca na fizykę)
    const pendantBaseX = 1.2;
    const pendantBaseY = 14.2 + bounceY;
    const pendantX = pendantBaseX + Math.sin(swingAngle) * 4.2;
    const pendantY = pendantBaseY - Math.cos(swingAngle) * 0.8;

    // Stalowy łańcuszek kulkowy (ball chain) z kuleczek i metalicznych błysków
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 0.85;
    ctx.setLineDash([0.8, 1.2]);
    ctx.beginPath();
    ctx.moveTo(neckBackX, neckBackY);
    ctx.quadraticCurveTo(-0.8, 9.8, pendantX, pendantY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(neckFrontX, neckFrontY);
    ctx.quadraticCurveTo(2.4, 10.4, pendantX, pendantY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Błysk światła na kulce łańcuszka
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 0.55;
    ctx.beginPath();
    ctx.arc(pendantX + 0.3, pendantY - 2.8, 0.4, 0, Math.PI * 2);
    ctx.stroke();

    // 1. Pierwsza blaszka (główna) – wisi na klatce piersiowej
    ctx.save();
    ctx.translate(pendantX, pendantY);
    ctx.rotate(0.14 + swingAngle * 0.85);

    // Czarna gumowa wyciszka (silencer) wokół rantu blaszki
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(-2.0, 0, 4.0, 5.6, 1.1);
    ctx.fill();

    // Stalowy wkład blaszki z metalicznym odbiciem
    const tagGrad1 = ctx.createLinearGradient(-1.6, 0, 1.6, 0);
    tagGrad1.addColorStop(0.0, '#64748b');
    tagGrad1.addColorStop(0.35, '#f1f5f9');
    tagGrad1.addColorStop(0.75, '#cbd5e1');
    tagGrad1.addColorStop(1.0, '#475569');

    ctx.fillStyle = tagGrad1;
    ctx.beginPath();
    ctx.roundRect(-1.5, 0.4, 3.0, 4.8, 0.75);
    ctx.fill();

    // Otwór montażowy
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, 1.1, 0.45, 0, Math.PI * 2);
    ctx.fill();

    // Wytłoczone linie danych żołnierza (US Army Dog Tag Lines)
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.48)';
    ctx.lineWidth = 0.45;
    ctx.beginPath();
    ctx.moveTo(-1.1, 2.3); ctx.lineTo(1.0, 2.3);
    ctx.moveTo(-1.1, 3.1); ctx.lineTo(1.1, 3.1);
    ctx.moveTo(-1.1, 3.9); ctx.lineTo(0.7, 3.9);
    ctx.stroke();

    // Krawędziowy refleks światła na rancie
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 0.45;
    ctx.beginPath();
    ctx.moveTo(-1.3, 1.8); ctx.lineTo(-1.3, 4.6);
    ctx.stroke();
    ctx.restore();

    // 2. Druga blaszka (zapasowa) – wisi na osobnym małym łańcuszku pod spodem
    ctx.save();
    ctx.translate(pendantX + 1.2, pendantY + 1.6);
    ctx.rotate(-0.16 + swingAngle * 1.05);

    // Małe kółeczko łączące
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.arc(0, -0.6, 0.65, 0, Math.PI * 2);
    ctx.stroke();

    // Gumowa wyciszka
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(-1.9, 0, 3.8, 5.4, 1.0);
    ctx.fill();

    // Stalowa blaszka
    const tagGrad2 = ctx.createLinearGradient(-1.5, 0, 1.5, 0);
    tagGrad2.addColorStop(0.0, '#475569');
    tagGrad2.addColorStop(0.45, '#cbd5e1');
    tagGrad2.addColorStop(1.0, '#64748b');

    ctx.fillStyle = tagGrad2;
    ctx.beginPath();
    ctx.roundRect(-1.4, 0.4, 2.8, 4.6, 0.65);
    ctx.fill();

    // Otwór montażowy
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, 1.0, 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Linie wytłoczenia
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.42)';
    ctx.lineWidth = 0.4;
    ctx.beginPath();
    ctx.moveTo(-1.0, 2.2); ctx.lineTo(0.9, 2.2);
    ctx.moveTo(-1.0, 3.0); ctx.lineTo(1.0, 3.0);
    ctx.stroke();
    ctx.restore();

  // ---------------------------------------------------------------------------
  // 2. ZŁOTY ŁAŃCUCH GANGSTA (Heavy Cuban Curb Gold Chain)
  // ---------------------------------------------------------------------------
  } else if (style === 'gold_chain') {
    const neckBackX = -2.6;
    const neckBackY = 4.8;
    const neckFrontX = 1.8;
    const neckFrontY = 6.2;

    const pendantBaseX = 1.4;
    const pendantBaseY = 13.0 + bounceY;
    const pendantX = pendantBaseX + Math.sin(swingAngle) * 3.8;
    const pendantY = pendantBaseY - Math.cos(swingAngle) * 0.7;

    // Miękki cień rzucany przez ciężki łańcuch na klatkę piersiową
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.32)';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(neckBackX, neckBackY + 0.8);
    ctx.quadraticCurveTo(-0.4, 9.4, pendantX, pendantY + 0.8);
    ctx.stroke();

    // Punkty splotu pancerka (Cuban Curb Links) dopasowane do profilu szyi i klatki
    const chainPoints = [
      { x: neckBackX, y: neckBackY, angle: 0.85 },
      { x: -1.8, y: 6.2, angle: 0.75 },
      { x: -0.9, y: 7.8, angle: 0.65 },
      { x: 0.0,  y: 9.6, angle: 0.50 },
      { x: 0.9,  y: 11.4, angle: 0.35 },
      { x: pendantX, y: pendantY, angle: swingAngle * 0.8 },
      { x: 2.2,  y: 11.2, angle: -0.40 },
      { x: 2.3,  y: 9.4,  angle: -0.65 },
      { x: 2.1,  y: 7.8,  angle: -0.85 },
      { x: neckFrontX, y: neckFrontY, angle: -1.0 }
    ];

    // Rysowanie poszczególnych trójwymiarowych, polerowanych ogniw
    chainPoints.forEach((pt, idx) => {
      ctx.save();
      ctx.translate(pt.x, pt.y);
      ctx.rotate(pt.angle);

      // Ciemne złoto podłoża
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.ellipse(0, 0, 1.7, 1.1, 0, 0, Math.PI * 2);
      ctx.fill();

      // Polerowane żółte złoto (bogaty gradient metaliczny)
      const goldGrad = ctx.createLinearGradient(-1.5, -0.9, 1.5, 0.9);
      goldGrad.addColorStop(0.0, '#ca8a04');
      goldGrad.addColorStop(0.35, '#fef08a');
      goldGrad.addColorStop(0.70, '#eab308');
      goldGrad.addColorStop(1.0, '#a16207');

      ctx.fillStyle = goldGrad;
      ctx.beginPath();
      ctx.ellipse(0, 0, 1.4, 0.85, 0, 0, Math.PI * 2);
      ctx.fill();

      // Błysk specular na wypukłości ogniwa
      if (idx % 2 === 0) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-0.4, -0.3, 0.38, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });

    // Masywny złoty medalion na środku łańcucha (kołysze się na wietrze)
    ctx.save();
    ctx.translate(pendantX, pendantY + 0.6);
    ctx.rotate(swingAngle * 1.15);

    // Kółko montażowe
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.arc(0, 0.5, 0.65, 0, Math.PI * 2);
    ctx.stroke();

    // Złota tarcza / medalion
    const medalGrad = ctx.createRadialGradient(-0.4, 2.2, 0.2, 0, 2.6, 2.4);
    medalGrad.addColorStop(0.0, '#fef08a');
    medalGrad.addColorStop(0.45, '#eab308');
    medalGrad.addColorStop(0.85, '#ca8a04');
    medalGrad.addColorStop(1.0, '#78350f');

    ctx.fillStyle = medalGrad;
    ctx.beginPath();
    ctx.arc(0, 2.6, 2.0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 0.6;
    ctx.stroke();

    // Tłoczenie w medalionie (krzyż)
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(0, 1.3); ctx.lineTo(0, 3.9);
    ctx.moveTo(-1.0, 2.2); ctx.lineTo(1.0, 2.2);
    ctx.stroke();

    // Rozbłysk diamentowy (+)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 0.65;
    ctx.beginPath();
    ctx.moveTo(-0.9, 1.5); ctx.lineTo(0.1, 1.5);
    ctx.moveTo(-0.4, 1.0); ctx.lineTo(-0.4, 2.0);
    ctx.stroke();

    ctx.restore();
  }

  ctx.restore();
}

/**
 * Renderuje samą głowę i klatkę piersiową z wybraną ozdobą szyi,
 * nakryciem głowy, maską, fryzurą i zarostem na kafelku wyboru w Kreatorze.
 */
export function drawHeadNeckPreview(
  ctx,
  canvasW,
  canvasH,
  neckStyle = 'none',
  headgearStyle = 'none',
  headgearColor = '#18181b',
  maskStyle = 'none',
  maskColor = '#18181b',
  hairStyle = 'buzzcut',
  hairColor = '#18181b',
  beardStyle = 'clean',
  beardColor = '#18181b'
) {
  if (!ctx) return;
  ctx.clearRect(0, 0, canvasW, canvasH);

  const v = {
    ...DEFAULT_VISUALS,
    neckStyle,
    headgearStyle,
    headgearColor,
    maskStyle,
    maskColor,
    hairStyle,
    hairColor,
    beardStyle,
    beardColor
  };
  const hairPal = getHairPalette(hairColor);

  const tileDummy = {
    _isStaticTile: true
  };

  ctx.save();
  // Wyśrodkowanie z naciskiem na szyję i klatkę piersiową
  ctx.translate(canvasW * 0.58, canvasH * 0.40);
  const scale = Math.min(canvasW, canvasH) / 33.0;
  ctx.scale(scale, scale);

  // 1. Szyja
  const neckGrad = ctx.createLinearGradient(-3.2, 0, 2.0, 0);
  neckGrad.addColorStop(0.0, v.skinDark);
  neckGrad.addColorStop(0.5, v.skinBack);
  neckGrad.addColorStop(1.0, v.skinMid);

  ctx.beginPath();
  ctx.moveTo(-3.0, 2.2);
  ctx.lineTo(-3.2, 7.6);
  ctx.quadraticCurveTo(-0.5, 8.4, 2.0, 7.6);
  ctx.lineTo(1.8, 3.2);
  ctx.closePath();
  ctx.fillStyle = neckGrad;
  ctx.fill();
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 0.9;
  ctx.stroke();

  // Baza kołnierza koszulki (ramiona i klatka piersiowa pod szyją)
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.moveTo(-7.0, 19.0);
  ctx.lineTo(-3.2, 7.6);
  ctx.quadraticCurveTo(-0.5, 8.8, 2.0, 7.6);
  ctx.lineTo(6.6, 19.0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 0.95;
  ctx.stroke();

  // Ściągacz kołnierza wokół szyi
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(-3.2, 7.6);
  ctx.quadraticCurveTo(-0.5, 9.2, 2.0, 7.6);
  ctx.stroke();

  // Cień pod żuchwą
  ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
  ctx.beginPath();
  ctx.moveTo(-0.8, 3.2);
  ctx.lineTo(1.8, 3.8);
  ctx.lineTo(1.7, 5.4);
  ctx.lineTo(-0.8, 4.4);
  ctx.closePath();
  ctx.fill();

  // 2. Profil twarzy
  const faceGrad = ctx.createLinearGradient(-5.0, 0, 7.0, 0);
  faceGrad.addColorStop(0.0, v.skinBack);
  faceGrad.addColorStop(0.5, v.skinMid);
  faceGrad.addColorStop(1.0, v.skinLight);

  ctx.beginPath();
  ctx.moveTo(-4.6, 2.5);
  ctx.quadraticCurveTo(-6.4, 0.2, -6.0, -2.8);
  ctx.quadraticCurveTo(-5.4, -7.2, -1.2, -7.2);
  ctx.quadraticCurveTo(2.8, -7.0, 4.2, -5.2);
  ctx.lineTo(4.4, -3.4);
  ctx.lineTo(6.8, -1.0);
  ctx.lineTo(5.1, -0.4);
  ctx.lineTo(5.5, 0.6);
  ctx.lineTo(4.9, 1.4);
  ctx.lineTo(5.3, 2.3);
  ctx.lineTo(4.3, 4.8);
  ctx.lineTo(0.2, 4.4);
  ctx.lineTo(-3.5, 3.8);
  ctx.closePath();
  ctx.fillStyle = faceGrad;
  ctx.fill();
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 1.0;
  ctx.stroke();

  // 3. Ucho
  if (headgearStyle !== 'balaclava') {
    ctx.fillStyle = v.skinBack;
    ctx.beginPath();
    ctx.ellipse(-2.6, -0.6, 1.6, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = v.skinDark;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(-2.5, -0.6, 1.1, 0.4 * Math.PI, 1.7 * Math.PI, false);
    ctx.stroke();
  }

  // 4. Zarost twarzy
  drawCharacterFacialHairProfile(ctx, v, false);

  // 5. Fryzura postaci
  drawCharacterHairProfile(ctx, tileDummy, v, 1, 0, 0, false);
  drawCharacterHairOverEarProfile(ctx, v, hairPal, false);

  // 6. Nakrycie głowy
  drawCharacterHeadgearProfile(ctx, tileDummy, v, false, 1, 0, 0);

  // 7. Oko i brew
  const eyeCenterX = 2.7;
  const eyeCenterY = -2.1;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(eyeCenterX, eyeCenterY, 1.5, 1.0, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(eyeCenterX + 0.55, eyeCenterY, 0.72, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(eyeCenterX + 0.52, eyeCenterY - 0.25, 0.35, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = hairPal.dark;
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(1.4, -3.3);
  ctx.lineTo(4.4, -3.5);
  ctx.stroke();

  // 8. Maska twarzy (jeśli wybrana)
  drawCharacterMaskProfile(ctx, tileDummy, v, false, 1, 0, 0);

  // 9. OZDOBA SZYI (na wierzchu klatki piersiowej)
  drawCharacterNeckProfile(ctx, tileDummy, v, 1, 0, 0);

  ctx.restore();
}
