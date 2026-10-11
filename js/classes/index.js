import { RaptorClass } from './aero.js?v=v80_hair_smooth_directional';
import { StrikerClass } from './playmaker.js?v=v80_hair_smooth_directional';
import { EnforcerClass } from './enforcer.js?v=v80_hair_smooth_directional';

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
