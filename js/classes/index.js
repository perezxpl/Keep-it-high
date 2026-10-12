import { RaptorClass } from './aero.js';
import { StrikerClass } from './striker.js';
import { EnforcerClass } from './enforcer.js';

export const CLASSES = {
  // Kolejność od lekkiej do ciężkiej: 1. Raptor, 2. Striker, 3. Enforcer
  RAPTOR: RaptorClass,
  STRIKER: StrikerClass,
  ENFORCER: EnforcerClass,

  // Aliasy wstecznej kompatybilności (stare nazwy)
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
