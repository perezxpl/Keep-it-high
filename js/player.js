// =========================================================================
// PLAYER.JS - ADAPTER RE-EKSPORTUJĄCY MODUŁ POSTACI
// Cała logika postaci została przeniesiona i rozbita na moduły w folderze ./player/
// Ten plik zapewnia 100% kompatybilności wstecznej dla reszty silnika gry.
// =========================================================================

export * from './player/index.js?v=v56_hud_health_weapon_fix';
export { drawHeldWeapon, drawSniperLaserSight } from './weapons.js?v=v56_hud_health_weapon_fix';

