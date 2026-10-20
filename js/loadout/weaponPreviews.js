// =========================================================================
// LOADOUT/WEAPONPREVIEWS.JS - PROCEDURALNE RYSUNKI BRONI DLA ZBROJOWNI
// Wysokiej jakości taktyczne schematy i pełne ilustracje modeli broni
// =========================================================================

/**
 * Tło schematu taktycznego (siatka milimetrowa, narożniki, podziałka)
 */
function drawTacticalBackdrop(ctx, w, h, weaponId) {
  // 1. Gradient głębi tła
  const bgGrad = ctx.createRadialGradient(w * 0.5, h * 0.5, 10, w * 0.5, h * 0.5, Math.max(w, h) * 0.7);
  bgGrad.addColorStop(0.0, 'rgba(15, 23, 42, 0.95)');
  bgGrad.addColorStop(0.65, 'rgba(10, 15, 30, 0.98)');
  bgGrad.addColorStop(1.0, 'rgba(3, 7, 18, 1.0)');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // 2. Siatka taktyczna blueprint
  ctx.save();
  ctx.strokeStyle = 'rgba(0, 229, 255, 0.04)';
  ctx.lineWidth = 1.0;
  const gridSize = 16;
  ctx.beginPath();
  for (let x = 0; x <= w; x += gridSize) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
  }
  for (let y = 0; y <= h; y += gridSize) {
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
  }
  ctx.stroke();

  // 3. Oś celownicza pozioma i pionowa
  ctx.strokeStyle = 'rgba(0, 229, 255, 0.09)';
  ctx.setLineDash([4, 6]);
  ctx.beginPath();
  ctx.moveTo(12, h * 0.5);
  ctx.lineTo(w - 12, h * 0.5);
  ctx.moveTo(w * 0.5, 8);
  ctx.lineTo(w * 0.5, h - 8);
  ctx.stroke();
  ctx.setLineDash([]);

  // 4. Taktyczne narożniki kadrujące [ ]
  ctx.strokeStyle = 'rgba(0, 229, 255, 0.28)';
  ctx.lineWidth = 1.2;
  const bSize = 8;
  const pad = 6;
  // Lewy górny
  ctx.beginPath();
  ctx.moveTo(pad, pad + bSize); ctx.lineTo(pad, pad); ctx.lineTo(pad + bSize, pad);
  // Prawy górny
  ctx.moveTo(w - pad - bSize, pad); ctx.lineTo(w - pad, pad); ctx.lineTo(w - pad, pad + bSize);
  // Lewy dolny
  ctx.moveTo(pad, h - pad - bSize); ctx.lineTo(pad, h - pad); ctx.lineTo(pad + bSize, h - pad);
  // Prawy dolny
  ctx.moveTo(w - pad - bSize, h - pad); ctx.lineTo(w - pad, h - pad); ctx.lineTo(w - pad, h - pad - bSize);
  ctx.stroke();

  // 5. Dolna podziałka milimetrowa
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  const tickY = h - 7;
  for (let tx = 24; tx < w - 24; tx += 8) {
    const isMajor = (tx % 32 === 0);
    ctx.moveTo(tx, tickY);
    ctx.lineTo(tx, tickY - (isMajor ? 4 : 2));
  }
  ctx.stroke();

  // 6. Subtelny znak wodny z kodem modelu
  ctx.font = '700 8px monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.textAlign = 'right';
  ctx.fillText(`SPEC // ${weaponId || 'WEAPON'}`, w - 12, 14);

  ctx.restore();
}

// =========================================================================
// RENDERERY POSZCZEGÓLNYCH MODELI BRONI
// Koordynaty bazowe w skali [-100, 100] na X i [-35, 35] na Y
// =========================================================================

/**
 * 1. KARABIN SZTURMOWY AK-47
 */
function drawAk47Illustration(ctx) {
  ctx.save();

  // 1. Kolba drewniana z ciemnego orzecha (Buttstock)
  ctx.fillStyle = '#78350f';
  ctx.beginPath();
  ctx.moveTo(-28, -4);
  ctx.lineTo(-84, 4);
  ctx.lineTo(-86, 26);
  ctx.lineTo(-50, 18);
  ctx.lineTo(-28, 8);
  ctx.closePath();
  ctx.fill();

  // Słojowanie drewna kolby
  ctx.strokeStyle = '#451a03';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(-35, 0); ctx.quadraticCurveTo(-58, 6, -82, 10);
  ctx.moveTo(-35, 5); ctx.quadraticCurveTo(-56, 12, -80, 18);
  ctx.stroke();

  // Stopka kolby (stalowa z nacięciami)
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(-88, 4, 3.5, 22);
  ctx.fillStyle = '#334155';
  ctx.fillRect(-87, 8, 1.2, 3);
  ctx.fillRect(-87, 18, 1.2, 3);

  // 2. Chwyt pistoletowy z drewna (Pistol Grip)
  ctx.fillStyle = '#78350f';
  ctx.beginPath();
  ctx.moveTo(-20, 6);
  ctx.lineTo(-30, 28);
  ctx.lineTo(-18, 30);
  ctx.lineTo(-10, 8);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#451a03';
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(-24, 12); ctx.lineTo(-14, 13);
  ctx.moveTo(-27, 20); ctx.lineTo(-16, 21);
  ctx.stroke();

  // 3. Komora zamkowa (Receiver) z tłoczonej stali
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(-28, -7, 48, 15);
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(-28, -5, 48, 11);

  // Pokrywa komory (Dust cover) z wytłoczonymi żebrami
  ctx.fillStyle = '#334155';
  ctx.fillRect(-26, -7, 44, 2.2);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(-15, -6.5, 6, 1.2);
  ctx.fillRect(-2, -6.5, 6, 1.2);

  // Suwadło z rączką zamka i oknem wyrzutowym
  ctx.fillStyle = '#090d16';
  ctx.fillRect(-6, -3, 14, 4);
  ctx.fillStyle = '#cbd5e1'; // Chromowana rękojeść suwadła
  ctx.fillRect(0, -2, 7, 2.2);
  ctx.fillStyle = '#64748b';
  ctx.beginPath();
  ctx.arc(7, -1, 1.6, 0, Math.PI * 2);
  ctx.fill();

  // Dźwignia bezpiecznika / przełącznika rodzaju ognia
  ctx.fillStyle = '#475569';
  ctx.fillRect(-18, 0, 10, 2);

  // Kabłąk spustu i język spustowy
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-10, 8);
  ctx.quadraticCurveTo(-10, 18, -2, 18);
  ctx.lineTo(4, 8);
  ctx.stroke();
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.moveTo(-4, 9);
  ctx.quadraticCurveTo(-5, 14, -2, 15);
  ctx.stroke();

  // Zatrzask magazynka
  ctx.fillStyle = '#334155';
  ctx.fillRect(5, 7, 2.5, 4);

  // 4. Łukowaty magazynek 30-nabojowy 7.62x39mm
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.moveTo(8, 8);
  ctx.quadraticCurveTo(14, 24, 28, 32);
  ctx.lineTo(21, 35);
  ctx.quadraticCurveTo(5, 26, 1, 8);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#090d16';
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // Tłoczone żebra wzmacniające na magazynku
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(6, 15); ctx.lineTo(13, 18);
  ctx.moveTo(9, 21); ctx.lineTo(17, 24);
  ctx.moveTo(13, 27); ctx.lineTo(22, 30);
  ctx.stroke();

  // 5. Łoże i nakładka rury gazowej z drewna
  ctx.fillStyle = '#78350f';
  ctx.fillRect(20, -5, 26, 11);
  ctx.fillStyle = '#92400e';
  ctx.fillRect(20, -5, 26, 3);
  // Szczeliny wentylacyjne łoża
  ctx.fillStyle = '#451a03';
  ctx.fillRect(25, 0, 7, 1.8);
  ctx.fillRect(35, 0, 7, 1.8);

  // Pierścienie mocujące łoże ze stali
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(19, -6, 2, 13);
  ctx.fillRect(45, -6, 2, 13);

  // 6. Rura gazowa, lufa i podstawa muszki
  ctx.fillStyle = '#334155';
  ctx.fillRect(47, -3.5, 38, 5.5);
  ctx.fillStyle = '#64748b';
  ctx.fillRect(47, -2.5, 38, 1.2); // Refleks światła na lufie

  // Kolanko rury gazowej
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(56, -6, 6, 4);

  // Wycior pod lufą
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(22, 4, 60, 1.2);

  // Celownik szczerbinkowy nad komorą
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(16, -9, 8, 3.5);
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(20, -8.5, 2, 1.5);

  // Podstawa muszki z osłoną słupka
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.moveTo(76, -1);
  ctx.lineTo(76, -10);
  ctx.lineTo(82, -10);
  ctx.lineTo(82, -1);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(78.5, -9, 1.2, 4);

  // Skośny kompensator podrzutu (Slant muzzle brake)
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.moveTo(85, -3);
  ctx.lineTo(91, -5);
  ctx.lineTo(91, 1.5);
  ctx.lineTo(85, 1.5);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * 2. STRZELBA BOJOWA SPAS-12
 */
function drawSpas12Illustration(ctx) {
  ctx.save();

  // 1. Składana kolba ze stopką i hakiem (Tactical folding stock with hook)
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.moveTo(-20, -8);
  ctx.lineTo(-76, -14);
  ctx.lineTo(-78, 6);
  ctx.lineTo(-65, 8);
  ctx.lineTo(-68, -4);
  ctx.lineTo(-20, -4);
  ctx.closePath();
  ctx.fill();

  // Hak pod ramię (SPAS-12 carry hook)
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(-76, 12, 7, Math.PI * 0.8, Math.PI * 1.8);
  ctx.stroke();

  // 2. Chwyt pistoletowy z rowkami
  ctx.fillStyle = '#18181b';
  ctx.beginPath();
  ctx.moveTo(-14, 4);
  ctx.lineTo(-26, 28);
  ctx.lineTo(-12, 30);
  ctx.lineTo(-4, 6);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#27272a';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(-20, 12); ctx.lineTo(-10, 13);
  ctx.moveTo(-23, 19); ctx.lineTo(-13, 20);
  ctx.moveTo(-25, 25); ctx.lineTo(-15, 26);
  ctx.stroke();

  // 3. Masywna kanciasta komora zamkowa SPAS-12
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(-22, -8, 42, 16);
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(-22, -6, 42, 12);

  // Okno wyrzutnika łusek 12G z suwadłem
  ctx.fillStyle = '#090d16';
  ctx.fillRect(-6, -4, 16, 5);
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(-2, -3, 8, 3);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, -2, 2.5, 4.5); // Rączka przeładowania

  // Kabłąk ze spustem
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-4, 6);
  ctx.quadraticCurveTo(-4, 17, 4, 17);
  ctx.lineTo(10, 6);
  ctx.stroke();
  ctx.strokeStyle = '#ef4444'; // Czerwony bezpiecznik
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.moveTo(1, 7); ctx.lineTo(1, 13);
  ctx.stroke();

  // 4. Perforowana osłona termiczna nad lufą (Heat shield z otworami chłodzącymi)
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(20, -8, 62, 5.5);
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(20, -7, 62, 3.5);
  // Otwory chłodzące
  ctx.fillStyle = '#090d16';
  for (let ox = 24; ox < 78; ox += 6) {
    ctx.fillRect(ox, -6.5, 3.5, 2);
  }

  // 5. Magazynek rurowy pod lufą na 8 naboi
  ctx.fillStyle = '#18181b';
  ctx.fillRect(20, 2, 64, 5);
  ctx.fillStyle = '#334155';
  ctx.fillRect(20, 3, 64, 1.2);
  // Nakrętka magazynka rurowego
  ctx.fillStyle = '#090d16';
  ctx.fillRect(81, 1.5, 4, 6);

  // 6. Karbowane czółenko pump-action
  ctx.fillStyle = '#27272a';
  ctx.beginPath();
  ctx.roundRect(24, -1, 32, 10, 2);
  ctx.fill();
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 0.8;
  ctx.stroke();
  ctx.fillStyle = '#0f172a';
  for (let cx = 27; cx < 54; cx += 4) {
    ctx.fillRect(cx, 0, 1.8, 8);
  }

  // 7. Gruba lufa gładkościenna 12-Gauge z muszką
  ctx.fillStyle = '#334155';
  ctx.fillRect(82, -5, 14, 4.5);
  ctx.fillStyle = '#64748b';
  ctx.fillRect(82, -4.5, 14, 1.0);

  // Pierścieniowa muszka bojowa (Front ring sight)
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(89, -10, 3, 6);
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(90, -8, 1.2, 1.5);

  ctx.restore();
}

/**
 * 3. KARABIN WYBOROWY BARRETT .50 BMG
 */
function drawBarrett50Illustration(ctx) {
  ctx.save();

  // 1. Kolba precyzyjna PRS (Sniper stock z baką i stopką)
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.moveTo(-28, -6);
  ctx.lineTo(-94, 2);
  ctx.lineTo(-96, 24);
  ctx.lineTo(-58, 16);
  ctx.lineTo(-28, 8);
  ctx.closePath();
  ctx.fill();

  // Gumowa stopka kolby amortyzująca potężny odrzut .50 BMG
  ctx.fillStyle = '#020617';
  ctx.fillRect(-99, 1, 4.5, 24);
  // Regulowana baka policzkowa (Cheek rest)
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(-86, -10, 26, 6);
  ctx.fillStyle = '#334155';
  ctx.fillRect(-86, -10, 26, 1.2);

  // Chwyt pistoletowy
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.moveTo(-18, 6);
  ctx.lineTo(-28, 28);
  ctx.lineTo(-14, 30);
  ctx.lineTo(-6, 8);
  ctx.closePath();
  ctx.fill();

  // 2. Masywna stalowa komora Barretta .50
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(-28, -9, 56, 18);
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(-28, -7, 56, 14);

  // Wielkie okno wyrzutnika łusek 12.7x99mm z czterotaktowym ryglem
  ctx.fillStyle = '#090d16';
  ctx.fillRect(-10, -5, 22, 6);
  ctx.fillStyle = '#475569';
  ctx.fillRect(-4, -4, 12, 4);
  // Rękojeść zamka z gałką
  ctx.fillStyle = '#64748b';
  ctx.fillRect(4, -8, 3, 5);
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(5.5, -9.5, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Spust i kabłąk
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.4;
  ctx.strokeRect(-6, 8, 12, 10);
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.moveTo(-1, 9); ctx.lineTo(-1, 14);
  ctx.stroke();

  // 3. Wielki magazynek pudełkowy 5-nabojowy .50 BMG
  ctx.fillStyle = '#090d16';
  ctx.fillRect(8, 8, 20, 25);
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 0.8;
  ctx.strokeRect(8, 8, 20, 25);
  // Tłoczone żebro usztywniające w kształcie X
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(11, 12); ctx.lineTo(25, 28);
  ctx.moveTo(25, 12); ctx.lineTo(11, 28);
  ctx.stroke();

  // 4. Szyna Picatinny i luneta snajperska (High-Power Scope)
  ctx.fillStyle = '#090d16';
  ctx.fillRect(-35, -12, 70, 3);

  // Montaże lunety
  ctx.fillStyle = '#334155';
  ctx.fillRect(-18, -17, 5, 5);
  ctx.fillRect(10, -17, 5, 5);

  // Tubus lunety
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(-26, -21, 52, 6);
  // Wieżyczka regulacji (Elevation Turret)
  ctx.fillStyle = '#090d16';
  ctx.fillRect(-3, -25, 6, 4);
  // Okular tylny
  ctx.fillStyle = '#090d16';
  ctx.fillRect(-34, -23, 9, 10);
  ctx.fillStyle = '#334155';
  ctx.fillRect(-33, -21, 2, 6);
  // Obiektyw przedni 56mm z osłoną przeciwsłoneczną
  ctx.fillStyle = '#090d16';
  ctx.fillRect(25, -24, 13, 12);
  // Antyrefleksyjny błękitny błysk optyki (Glass optical glare)
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(36.5, -22, 1.8, 8);

  // 5. Perforowane łoże z otworami wentylacyjnymi
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(28, -7, 36, 12);
  ctx.fillStyle = '#090d16';
  for (let hx = 34; hx < 60; hx += 8) {
    ctx.fillRect(hx, -3, 4, 4);
  }

  // Złożony dwójnóg (Folded Bipod)
  ctx.fillStyle = '#090d16';
  ctx.fillRect(42, 6, 24, 3.5);
  ctx.fillStyle = '#475569';
  ctx.beginPath();
  ctx.arc(44, 7.5, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // 6. Długa ryflowana lufa stalowa .50 BMG
  ctx.fillStyle = '#334155';
  ctx.fillRect(64, -4.5, 34, 7);
  ctx.fillStyle = '#64748b';
  ctx.fillRect(64, -3, 34, 1.4); // chromowy refleks

  // 7. Potężny trójkątny hamulec wylotowy Barretta (Arrowhead Muzzle Brake)
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.moveTo(98, -8);
  ctx.lineTo(112, -4);
  ctx.lineTo(112, 4);
  ctx.lineTo(98, 8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(99, -6, 11, 10);
  // Szczeliny gazowe odprowadzające odrzut
  ctx.fillStyle = '#090d16';
  ctx.fillRect(101, -7, 2.5, 12);
  ctx.fillRect(106, -7, 2.5, 12);

  ctx.restore();
}

/**
 * 4. PISTOLET GLOCK 17
 */
function drawGlock17Illustration(ctx) {
  ctx.save();

  // 1. Polimerowy szkielet (RTF frame)
  ctx.fillStyle = '#18181b';
  ctx.beginPath();
  ctx.moveTo(-8, 2);
  ctx.lineTo(-24, 32);
  ctx.lineTo(-8, 34);
  ctx.lineTo(4, 4);
  ctx.closePath();
  ctx.fill();

  // Żłobienia antypoślizgowe na chwycie
  ctx.strokeStyle = '#27272a';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.moveTo(-18, 12); ctx.lineTo(-7, 13);
  ctx.moveTo(-20, 19); ctx.lineTo(-9, 20);
  ctx.moveTo(-22, 26); ctx.lineTo(-11, 27);
  ctx.stroke();

  // Stopka magazynka 17-nabojowego
  ctx.fillStyle = '#09090b';
  ctx.fillRect(-26, 32, 18, 3.5);

  // Szyna akcesoryjna pod lufą
  ctx.fillStyle = '#18181b';
  ctx.fillRect(4, -1, 30, 7);
  ctx.fillStyle = '#09090b';
  ctx.fillRect(16, 4, 3, 2); // Wcięcie szyny

  // Kabłąk i język spustowy Safe-Action
  ctx.strokeStyle = '#18181b';
  ctx.lineWidth = 1.6;
  ctx.strokeRect(2, 4, 14, 11);
  ctx.strokeStyle = '#ef4444'; // Czerwony bezpiecznik w spuście
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(8, 6); ctx.lineTo(6, 11);
  ctx.stroke();

  // Dźwignia zrzutu zamka i piny
  ctx.fillStyle = '#52525b';
  ctx.fillRect(-2, 0, 4, 2);
  ctx.beginPath();
  ctx.arc(6, 2, 1.2, 0, Math.PI * 2);
  ctx.fill();

  // 2. Stalowy zamek z wykończeniem Tenifer (Steel Slide)
  ctx.fillStyle = '#27272a';
  ctx.fillRect(-22, -12, 58, 12);
  ctx.fillStyle = '#3f3f46';
  ctx.fillRect(-22, -12, 58, 2.5); // Faza górna zamka

  // Żłobienia ułatwiające przeładowanie z tyłu zamka
  ctx.fillStyle = '#18181b';
  for (let sx = -18; sx < -4; sx += 3) {
    ctx.fillRect(sx, -11, 1.4, 9);
  }

  // Okno wyrzutnika łusek z pazurem wyciągu
  ctx.fillStyle = '#09090b';
  ctx.fillRect(4, -11, 14, 6);
  ctx.fillStyle = '#52525b';
  ctx.fillRect(14, -9, 3, 3);

  // 3. Przyrządy celownicze z białymi kropkami (Glock Night Sights)
  ctx.fillStyle = '#18181b';
  ctx.fillRect(-20, -16, 4, 4); // Szczerbinka
  ctx.fillRect(30, -16, 4, 4);  // Muszka
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-19, -14, 1.8, 1.8);
  ctx.fillRect(31, -14, 1.8, 1.8);

  ctx.restore();
}

/**
 * 5. CIĘŻKI REWOLWER MAGNUM .44
 */
function drawMagnum44Illustration(ctx) {
  ctx.save();

  // 1. Drewniane okładziny chwytu z orzecha rosewood
  ctx.fillStyle = '#78350f';
  ctx.beginPath();
  ctx.moveTo(-10, 4);
  ctx.lineTo(-28, 34);
  ctx.lineTo(-12, 36);
  ctx.lineTo(2, 10);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#451a03';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(-20, 14); ctx.lineTo(-6, 16);
  ctx.moveTo(-24, 24); ctx.lineTo(-9, 26);
  ctx.stroke();

  // Srebrny medalion rusznikarski
  ctx.fillStyle = '#cbd5e1';
  ctx.beginPath();
  ctx.arc(-14, 18, 2.8, 0, Math.PI * 2);
  ctx.fill();

  // 2. Stalowy szkielet (Stainless Steel Frame)
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(-22, -9, 62, 13);
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(-22, -7, 62, 3);

  // Kurek rewolwerowy z ostrogą (Hammer)
  ctx.fillStyle = '#475569';
  ctx.fillRect(-25, -14, 5, 8);
  ctx.fillRect(-28, -16, 4, 3);

  // Kabłąk i gładki język spustowy
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(0, 11, 7, Math.PI * 0.7, Math.PI * 2.1);
  ctx.stroke();
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-1, 6); ctx.quadraticCurveTo(-1, 12, 3, 12);
  ctx.stroke();

  // 3. Bębenek 6-komorowy .44 Magnum z żłobieniami ulżeniowymi
  ctx.fillStyle = '#64748b';
  ctx.fillRect(-6, -11, 22, 18);
  ctx.fillStyle = '#334155';
  ctx.fillRect(-2, -8, 14, 3.5);
  ctx.fillRect(-2, 0, 14, 3.5);
  ctx.fillRect(-2, 5, 14, 2.0);

  // 4. Masywna 6-calowa lufa z pełnym podlufiem i szyną wentylowaną
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(16, -9, 44, 9);
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(16, -7, 44, 1.8); // Refleks chromu na lufie
  // Pełne podlufie (Full underlug)
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(16, 0, 42, 5);

  // Wentylowana szyna grzbietowa
  ctx.fillStyle = '#64748b';
  ctx.fillRect(18, -13, 40, 4);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(24, -12, 6, 2.5);
  ctx.fillRect(36, -12, 6, 2.5);
  ctx.fillRect(48, -12, 6, 2.5);

  // Przyrządy celownicze z pomarańczową wkładką
  ctx.fillStyle = '#334155';
  ctx.fillRect(-20, -14, 4, 5); // Szczerbinka
  ctx.fillStyle = '#f97316';     // Pomarańczowa muszka światłowodowa
  ctx.fillRect(56, -15, 3.5, 4);

  ctx.restore();
}

/**
 * 6. JEDNORĘCZNY OBRZYN 12G (SAWED-OFF)
 */
function drawSawedOffIllustration(ctx) {
  ctx.save();

  // 1. Skrócona profilowana kolba z orzecha (Birdshead grip)
  ctx.fillStyle = '#78350f';
  ctx.beginPath();
  ctx.moveTo(-10, 0);
  ctx.lineTo(-30, 26);
  ctx.lineTo(-14, 30);
  ctx.lineTo(2, 6);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#451a03';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(-22, 10); ctx.lineTo(-10, 12);
  ctx.moveTo(-25, 18); ctx.lineTo(-11, 20);
  ctx.stroke();

  // Metalowa śruba w stopce
  ctx.fillStyle = '#94a3b8';
  ctx.beginPath();
  ctx.arc(-22, 28, 2, 0, Math.PI * 2);
  ctx.fill();

  // 2. Stalowa baskila rusznikarska (Break-action receiver)
  ctx.fillStyle = '#475569';
  ctx.fillRect(-18, -9, 30, 16);
  ctx.fillStyle = '#64748b';
  ctx.fillRect(-18, -7, 30, 3);

  // Górna dźwignia otwierania łamania luf (Top lever)
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(-14, -13, 8, 4);

  // Podwójny spust w kabłąku
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.4;
  ctx.strokeRect(-2, 7, 14, 10);
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.moveTo(2, 8); ctx.lineTo(2, 13);
  ctx.moveTo(7, 8); ctx.lineTo(7, 13);
  ctx.stroke();

  // 3. Krótkie podwójne ucięte lufy 12 Gauge (Side-by-side)
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(12, -10, 48, 14);
  ctx.fillStyle = '#334155';
  ctx.fillRect(12, -8, 48, 2.5); // Refleks oksydy
  // Linia podziału między podwójnymi lufami
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(12, -3, 48, 1.8);

  // Wylot uciętych luf z ciemnymi otworami śrutowymi
  ctx.fillStyle = '#000000';
  ctx.fillRect(59, -9, 2.5, 5);
  ctx.fillRect(59, -2, 2.5, 5);

  // 4. Drewniane czółenko pod lufami
  ctx.fillStyle = '#92400e';
  ctx.beginPath();
  ctx.roundRect(12, 4, 28, 7, 2);
  ctx.fill();
  ctx.strokeStyle = '#451a03';
  ctx.lineWidth = 0.7;
  ctx.stroke();

  // Mosiężna muszka koralikowa na szynie
  ctx.fillStyle = '#eab308';
  ctx.beginPath();
  ctx.arc(56, -11, 1.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 7. NÓŻ BOJOWY M9 BAYONET
 */
function drawKnifeIllustration(ctx) {
  ctx.save();

  // 1. Głowica stalowa z zatrzaskiem bagnetu (Pommel)
  ctx.fillStyle = '#475569';
  ctx.fillRect(-62, -7, 8, 14);
  ctx.fillStyle = '#64748b';
  ctx.fillRect(-60, -5, 4, 10);

  // 2. Rękojeść polimerowa Zytel z antypoślizgowymi pierścieniami
  ctx.fillStyle = '#1c1917';
  ctx.beginPath();
  ctx.roundRect(-54, -6.5, 38, 13, 2);
  ctx.fill();
  // Pierścienie rowkowane
  ctx.fillStyle = '#292524';
  for (let rx = -50; rx < -18; rx += 6) {
    ctx.fillRect(rx, -6.5, 3, 13);
  }

  // 3. Jelec ze stali z pierścieniem mocowania do lufy
  ctx.fillStyle = '#64748b';
  ctx.fillRect(-16, -15, 5, 30);
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(-13.5, -10, 3, 0, Math.PI * 2); // Otwór na lufę
  ctx.fill();

  // 4. Ostrze bojowe ze stali nierdzewnej 420HC (Clip-point)
  ctx.fillStyle = '#cbd5e1';
  ctx.beginPath();
  ctx.moveTo(-11, -8);
  ctx.lineTo(46, -8);
  ctx.lineTo(68, 0);   // Sztych clip-point
  ctx.lineTo(44, 8);   // Krawędź tnąca
  ctx.lineTo(-11, 8);
  ctx.closePath();
  ctx.fill();

  // Fazowanie ostrza i polerowany szlif
  ctx.fillStyle = '#f1f5f9';
  ctx.beginPath();
  ctx.moveTo(-11, 2);
  ctx.lineTo(44, 2);
  ctx.lineTo(68, 0);
  ctx.lineTo(44, 8);
  ctx.lineTo(-11, 8);
  ctx.closePath();
  ctx.fill();

  // Zbrocze (Fuller groove)
  ctx.fillStyle = '#64748b';
  ctx.fillRect(-4, -2, 34, 3);

  // Ząbkowanie na grzbiecie (Sawback teeth)
  ctx.fillStyle = '#475569';
  for (let zx = -6; zx < 36; zx += 4) {
    ctx.beginPath();
    ctx.moveTo(zx, -8);
    ctx.lineTo(zx + 2, -11);
    ctx.lineTo(zx + 3, -8);
    ctx.closePath();
    ctx.fill();
  }

  // Otwór do cięcia drutu w połączeniu z pochwą
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.arc(46, -1, 2.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 8. MACZETA TAKTYCZNA KUKRI
 */
function drawMacheteIllustration(ctx) {
  ctx.save();

  // 1. Rękojeść profilowana z rozszerzoną stopką (Flared grip)
  ctx.fillStyle = '#451a03';
  ctx.beginPath();
  ctx.moveTo(-18, -6);
  ctx.lineTo(-58, -7);
  ctx.lineTo(-64, 4);
  ctx.lineTo(-56, 12);
  ctx.lineTo(-16, 7);
  ctx.closePath();
  ctx.fill();

  // Mosiężne nity mocujące
  ctx.fillStyle = '#eab308';
  ctx.beginPath();
  ctx.arc(-46, 2, 2.2, 0, Math.PI * 2);
  ctx.arc(-28, 1, 2.2, 0, Math.PI * 2);
  ctx.fill();

  // Wycięcie tradycyjne "cho" u nasady ostrza
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(-16, 3, 4, 5);

  // 2. Masywne nepalskie zakrzywione ostrze kukri z wyważeniem tnącym
  ctx.fillStyle = '#1e293b'; // Czerniony taktyczny grzbiet
  ctx.beginPath();
  ctx.moveTo(-14, -6);
  ctx.lineTo(24, -13);
  ctx.lineTo(68, 2);
  ctx.lineTo(48, 18); // Szeroki brzuch tnący (Belly)
  ctx.lineTo(12, 10);
  ctx.lineTo(-14, 5);
  ctx.closePath();
  ctx.fill();

  // Polerowana faza szlifu tnącego (Razor sharp ground edge)
  ctx.fillStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.moveTo(-10, 0);
  ctx.lineTo(20, -4);
  ctx.lineTo(68, 2);
  ctx.lineTo(48, 18);
  ctx.lineTo(12, 10);
  ctx.lineTo(-10, 4);
  ctx.closePath();
  ctx.fill();

  // Zbrocze redukujące wagę
  ctx.fillStyle = '#64748b';
  ctx.beginPath();
  ctx.moveTo(-6, -3);
  ctx.lineTo(24, -8);
  ctx.lineTo(42, -2);
  ctx.lineTo(-6, -1);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * 9. TOPOREK BOJOWY TOMAHAWK
 */
function drawTomahawkIllustration(ctx) {
  ctx.save();

  // 1. Trzonek syntetyczny z teksturowanym chwytem
  ctx.fillStyle = '#18181b';
  ctx.fillRect(-54, -3.5, 78, 7);
  ctx.fillStyle = '#27272a';
  for (let tx = -48; tx < 10; tx += 5) {
    ctx.fillRect(tx, -3.5, 2.5, 7);
  }
  // Otwór na smycz
  ctx.fillStyle = '#090d16';
  ctx.beginPath();
  ctx.arc(-48, 0, 2, 0, Math.PI * 2);
  ctx.fill();

  // 2. Głowica ze stali kutej mocowana śrubami (Hawk head)
  ctx.fillStyle = '#334155';
  ctx.fillRect(18, -6, 12, 12);
  // Śruby mocujące
  ctx.fillStyle = '#94a3b8';
  ctx.beginPath();
  ctx.arc(24, -2, 1.8, 0, Math.PI * 2);
  ctx.arc(24, 2, 1.8, 0, Math.PI * 2);
  ctx.fill();

  // 3. Przednie szerokie ostrze sieczne (Chopping beard)
  ctx.fillStyle = '#475569';
  ctx.beginPath();
  ctx.moveTo(28, -6);
  ctx.lineTo(58, -24);
  ctx.lineTo(54, 24);
  ctx.lineTo(28, 6);
  ctx.closePath();
  ctx.fill();

  // Polerowana krawędź tnąca z fazą szlifu
  ctx.fillStyle = '#cbd5e1';
  ctx.beginPath();
  ctx.moveTo(48, -18);
  ctx.lineTo(58, -24);
  ctx.lineTo(54, 24);
  ctx.lineTo(45, 18);
  ctx.closePath();
  ctx.fill();

  // 4. Tylny szpikulec penetrujący (Breaching spike)
  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.moveTo(18, -4);
  ctx.lineTo(-4, -14);
  ctx.lineTo(18, 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#cbd5e1';
  ctx.beginPath();
  ctx.moveTo(4, -10);
  ctx.lineTo(-4, -14);
  ctx.lineTo(4, -6);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * 10. GRANAT ODŁAMKOWY M67 HE
 */
function drawHeGrenadeIllustration(ctx) {
  ctx.save();

  // 1. Kulisty korpus ze staliwa w kolorze oliwkowym (Olive drab)
  const r = 24;
  const gGrad = ctx.createRadialGradient(-6, -6, 4, 0, 0, r);
  gGrad.addColorStop(0.0, '#4d7c0f');
  gGrad.addColorStop(0.65, '#365314');
  gGrad.addColorStop(1.0, '#14532d');
  ctx.fillStyle = gGrad;
  ctx.beginPath();
  ctx.arc(0, 5, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#052e16';
  ctx.lineWidth = 1.4;
  ctx.stroke();

  // Żółty pasek identyfikacyjny HE (Composition B)
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.arc(0, 5, r - 1.5, Math.PI * 0.2, Math.PI * 0.8);
  ctx.stroke();

  // Napis wojskowy stencil
  ctx.font = '900 6.5px monospace';
  ctx.fillStyle = '#facc15';
  ctx.textAlign = 'center';
  ctx.fillText('M67 // HE', 0, 8);

  // 2. Aluminiowy zapalnik czasowy M213 (Fuse body)
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(-5, -23, 10, 8);
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(-5, -23, 10, 1.8);

  // 3. Profilowana stalowa łyżka spustowa (Safety lever)
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(4, -22);
  ctx.lineTo(16, -14);
  ctx.lineTo(26, 6);
  ctx.lineTo(22, 22);
  ctx.stroke();

  // 4. Zawleczka z kółkiem (Safety pull pin & ring)
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(-14, -20, 6.5, 0, Math.PI * 2); // Kółko zawleczki
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-7.5, -20);
  ctx.lineTo(0, -20);
  ctx.stroke();

  ctx.restore();
}

/**
 * 11. GRANAT DYMNY M18 SMOKE
 */
function drawSmokeGrenadeIllustration(ctx) {
  ctx.save();

  // 1. Cylindryczna puszka dymna ze stali
  const canW = 28;
  const canH = 46;
  const canGrad = ctx.createLinearGradient(-canW / 2, 0, canW / 2, 0);
  canGrad.addColorStop(0.0, '#15803d');
  canGrad.addColorStop(0.4, '#22c55e');
  canGrad.addColorStop(0.8, '#16a34a');
  canGrad.addColorStop(1.0, '#14532d');

  ctx.fillStyle = canGrad;
  ctx.beginPath();
  ctx.roundRect(-canW / 2, -14, canW, canH, 3);
  ctx.fill();
  ctx.strokeStyle = '#052e16';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Wytłoczone żebra denka i pokrywy
  ctx.fillStyle = '#334155';
  ctx.fillRect(-canW / 2 - 1, -15, canW + 2, 3);
  ctx.fillRect(-canW / 2 - 1, 30, canW + 2, 3);

  // Napis wojskowy stencil
  ctx.font = '900 6px monospace';
  ctx.fillStyle = '#f8fafc';
  ctx.textAlign = 'center';
  ctx.fillText('M18 SMOKE', 0, 4);
  ctx.fillText('GREEN // 22', 0, 14);

  // 2. Zapalnik z łyżką i zawleczką
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(-4, -22, 8, 7);

  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.moveTo(3, -21);
  ctx.lineTo(14, -14);
  ctx.lineTo(16, 12);
  ctx.stroke();

  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(-11, -19, 5.5, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

/**
 * 12. GRANAT BŁYSKOWO-HUKOWY 7290 STUN
 */
function drawFlashGrenadeIllustration(ctx) {
  ctx.save();

  // 1. Grubościenny cylinder stalowy w kolorze gunmetal
  const canW = 26;
  const canH = 46;
  const canGrad = ctx.createLinearGradient(-canW / 2, 0, canW / 2, 0);
  canGrad.addColorStop(0.0, '#18181b');
  canGrad.addColorStop(0.35, '#3f3f46');
  canGrad.addColorStop(0.75, '#52525b');
  canGrad.addColorStop(1.0, '#09090b');

  ctx.fillStyle = canGrad;
  ctx.beginPath();
  ctx.roundRect(-canW / 2, -14, canW, canH, 3);
  ctx.fill();
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Niebieski pasek taktyczny (Less-Lethal / Stun)
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(-canW / 2, 3, canW, 8);
  ctx.font = '900 5.5px monospace';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText('7290 STUN', 0, 9);

  // Otwory dekompresyjne na obwodzie (Vent ports)
  ctx.fillStyle = '#000000';
  const vents = [-8, 0, 8];
  vents.forEach(vx => {
    ctx.beginPath();
    ctx.arc(vx, -5, 2.4, 0, Math.PI * 2);
    ctx.arc(vx, 18, 2.4, 0, Math.PI * 2);
    ctx.fill();
  });

  // 2. Stalowe nakrętki korpusu
  ctx.fillStyle = '#27272a';
  ctx.fillRect(-canW / 2 - 1, -15, canW + 2, 3);
  ctx.fillRect(-canW / 2 - 1, 30, canW + 2, 3);

  // Zapalnik z łyżką i zawleczką
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(-4, -22, 8, 7);

  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.moveTo(3, -21);
  ctx.lineTo(14, -14);
  ctx.lineTo(15, 14);
  ctx.stroke();

  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(-11, -19, 5.5, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

// =========================================================================
// GŁÓWNA FUNKCJA RENDERUJĄCA DLA DOWOLNEGO KAFELKA / OKNA
// =========================================================================

const WEAPON_SPRITE_PATHS = {
  AK47: './assets/weapons/ak47.png',
  SHOTGUN: './assets/weapons/shotgun.png',
  SNIPER: './assets/weapons/sniper.png',
  GLOCK: './assets/weapons/glock.png',
  REVOLVER: './assets/weapons/revolver.png',
  SAWED_OFF: './assets/weapons/sawed_off.png',
  KNIFE: './assets/weapons/knife.png',
  MACHETE: './assets/weapons/machete.png',
  AXE: './assets/weapons/axe.png',
  GRENADE: './assets/weapons/grenade.png',
  SMOKE: './assets/weapons/smoke.png',
  FLASH: './assets/weapons/flash.png'
};

const _spriteCache = {};

function getWeaponSprite(weaponId) {
  const path = WEAPON_SPRITE_PATHS[weaponId];
  if (!path) return null;
  if (_spriteCache[weaponId]) return _spriteCache[weaponId];
  if (typeof window === 'undefined' || typeof Image === 'undefined') return null;

  const img = new Image();
  img.src = path;
  _spriteCache[weaponId] = img;
  return img;
}

/**
 * Renderuje pełny rysunek broni na wskazanym elemencie canvas
 * @param {HTMLCanvasElement} canvas - element canvas w DOM
 * @param {string} weaponId - ID broni (np. 'AK47', 'SHOTGUN', 'GLOCK', 'KNIFE')
 */
export function drawWeaponPreview(canvas, weaponId) {
  if (!canvas || !weaponId) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;

  // 1. Rysowanie taktycznego tła schematu
  drawTacticalBackdrop(ctx, w, h, weaponId);

  // 1.5. Sprawdzenie czy dostępny jest pre-renderowany sprite PNG wysokiej rozdzielczości
  const sprite = getWeaponSprite(weaponId);
  if (sprite) {
    if (sprite.complete && sprite.naturalWidth > 0) {
      const maxW = w * 0.88;
      const maxH = h * 0.74;
      const scale = Math.min(maxW / sprite.naturalWidth, maxH / sprite.naturalHeight);
      const drawW = sprite.naturalWidth * scale;
      const drawH = sprite.naturalHeight * scale;
      const dx = (w - drawW) * 0.50;
      const dy = (h - drawH) * 0.50;

      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 3;
      ctx.drawImage(sprite, dx, dy, drawW, drawH);
      ctx.restore();
      return;
    } else if (!sprite.complete) {
      sprite.onload = () => {
        drawWeaponPreview(canvas, weaponId);
      };
      // W międzyczasie rysujemy proceduralny schemat jako fallback
    }
  }

  // 2. Transformacja i centrowanie modelu broni
  ctx.save();
  ctx.translate(w * 0.50, h * 0.50);

  // Skalowanie proporcjonalne modelu do wielkości kafelka
  // Długość typowego karabinu to ~220 px, wysokość granatu to ~90 px
  const isThrowable = (weaponId === 'GRENADE' || weaponId === 'SMOKE' || weaponId === 'FLASH');
  const isHandgun = (weaponId === 'GLOCK' || weaponId === 'REVOLVER' || weaponId === 'SAWED_OFF');
  const isMelee = (weaponId === 'KNIFE' || weaponId === 'MACHETE' || weaponId === 'AXE');

  let scale = 1.0;
  if (isThrowable) {
    scale = Math.min(w / 110, h / 80) * 0.85;
  } else if (isHandgun) {
    scale = Math.min(w / 160, h / 85) * 0.90;
  } else if (isMelee) {
    scale = Math.min(w / 190, h / 85) * 0.90;
  } else {
    // Długa broń główna (AK47, Shotgun, Barrett .50)
    scale = Math.min(w / 250, h / 95) * 0.94;
  }

  ctx.scale(scale, scale);

  // 3. Wywołanie procedury rysowania konkretnego uzbrojenia
  switch (weaponId) {
    case 'AK47':
      drawAk47Illustration(ctx);
      break;
    case 'SHOTGUN':
      drawSpas12Illustration(ctx);
      break;
    case 'SNIPER':
      drawBarrett50Illustration(ctx);
      break;
    case 'GLOCK':
      drawGlock17Illustration(ctx);
      break;
    case 'REVOLVER':
      drawMagnum44Illustration(ctx);
      break;
    case 'SAWED_OFF':
      drawSawedOffIllustration(ctx);
      break;
    case 'KNIFE':
      drawKnifeIllustration(ctx);
      break;
    case 'MACHETE':
      drawMacheteIllustration(ctx);
      break;
    case 'AXE':
      drawTomahawkIllustration(ctx);
      break;
    case 'GRENADE':
      drawHeGrenadeIllustration(ctx);
      break;
    case 'SMOKE':
      drawSmokeGrenadeIllustration(ctx);
      break;
    case 'FLASH':
      drawFlashGrenadeIllustration(ctx);
      break;
    default:
      drawAk47Illustration(ctx);
      break;
  }

  ctx.restore();
}
