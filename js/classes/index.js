import { AeroClass } from './aero.js';
import { EnforcerClass } from './enforcer.js?v=v57_hud_fix';
import { PlaymakerClass } from './playmaker.js';
import { SweeperClass } from './sweeper.js';

export const CLASSES = {
  AERO: AeroClass,
  ENFORCER: EnforcerClass,
  PLAYMAKER: PlaymakerClass,
  SWEEPER: SweeperClass
};

export const CLASS_LIST = [
  AeroClass,
  EnforcerClass,
  PlaymakerClass,
  SweeperClass
];

export const DEFAULT_CLASS = AeroClass;
