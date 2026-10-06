// =========================================================================
// PROPS.JS - ELEMENTY OTOCZENIA, DEKORACJE I REKWIZYTY JASKINIOWE
// Surowa, naturalna grota skalna: brak wież, brak drabin, brak wiszących mostów.
// =========================================================================

export {
  drawSandbags,
  drawCrate,
  drawWoodenLogBunker,
  drawMineOreCart,
  drawDynamiteCrate,
  drawJungleCanyonProps,
  drawMineCavernProps,
  drawHazardStripes,
  ladders
} from './obstacles.js';

// Usunięte elementy jaskini i dżungli (funkcje zaślepkowe dla zachowania kompatybilności i 60 FPS)
export function drawWoodenLadder() {}
export function drawLadderRungs() {}
export function drawSniperTowerStructure() {}
export function drawSuspensionBridge() {}
export function drawSkywalk() {}
export function drawSunRays() {}
export function drawGodRays() {}
export function drawVolumetricLight() {}
export function drawLightBeams() {}
export function drawHangingLanterns() {}
