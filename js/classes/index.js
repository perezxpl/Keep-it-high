import { RaptorClass, RAPTOR_OUTFITS } from './aero.js';
import { StrikerClass } from './playmaker.js';
import { EnforcerClass } from './enforcer.js?v=v64_jetpack_flight_hover';

export { RAPTOR_OUTFITS };

export const CLASSES = {
  // Kolejność od lekkiej do ciężkiej: 1. Raptor, 2. Striker, 3. Enforcer
  RAPTOR: RaptorClass,
  STRIKER: StrikerClass,
  ENFORCER: EnforcerClass,

  // Aliasy wstecznej kompatybilności
  AERO: RaptorClass,
  PLAYMAKER: StrikerClass,
  SWEEPER: StrikerClass
};

export const CLASS_LIST = [
  RaptorClass,
  StrikerClass,
  EnforcerClass
];

export const DEFAULT_CLASS = RaptorClass;
