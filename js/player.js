// =========================================================================
// PLAYER.JS - ADAPTER RE-EKSPORTUJĄCY MODUŁ POSTACI
// Cała logika postaci została przeniesiona i rozbita na moduły w folderze ./player/
// Ten plik zapewnia 100% kompatybilności wstecznej dla reszty silnika gry.
// =========================================================================

export * from './player/index.js?v=v63_hud_hp_weapon_colors';
export { drawHeldWeapon, drawSniperLaserSight } from './weapons.js?v=v63_hud_hp_weapon_colors';

