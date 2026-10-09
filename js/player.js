// =========================================================================
// PLAYER.JS - ADAPTER RE-EKSPORTUJĄCY MODUŁ POSTACI
// Cała logika postaci została przeniesiona i rozbita na moduły w folderze ./player/
// Ten plik zapewnia 100% kompatybilności wstecznej dla reszty silnika gry.
// =========================================================================

export * from './player/index.js?v=v49_jump_takeoff_physics';
export { drawHeldWeapon, drawSniperLaserSight } from './weapons.js?v=v49_jump_takeoff_physics';

