// =========================================================================
// ARENAS/ARENA4.JS - STACJA ORBITALNA ARES (FASADA KOMPATYBILNOŚCI)
// Re-eksportuje autonomiczny moduł kosmiczny: ./arena4_space.js
// =========================================================================

import { arena4 } from './arena4_space.js';

export * from './arena4_space.js';
export { arena4 };
export default arena4;
