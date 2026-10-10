// =========================================================================
// PLAYER.JS - ADAPTER RE-EKSPORTUJĄCY MODUŁ POSTACI
// Cała logika postaci została przeniesiona i rozbita na moduły w folderze ./player/
// Ten plik zapewnia 100% kompatybilności wstecznej dla reszty silnika gry.
// =========================================================================

export * from './player/index.js?v=v54_jetpack_led_gauge';
export { drawHeldWeapon, drawSniperLaserSight } from './weapons.js?v=v54_jetpack_led_gauge';

