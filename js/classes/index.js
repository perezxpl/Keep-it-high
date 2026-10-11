import { RaptorClass } from './aero.js?v=v81_hair_fullhead_gravity';
import { StrikerClass } from './playmaker.js?v=v81_hair_fullhead_gravity';
import { EnforcerClass } from './enforcer.js?v=v81_hair_fullhead_gravity';

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
