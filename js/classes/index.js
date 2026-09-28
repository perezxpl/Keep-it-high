import { PlaymakerClass } from './playmaker.js';
import { EnforcerClass } from './enforcer.js';
import { AeroClass } from './aero.js';
import { SweeperClass } from './sweeper.js';

export const CLASSES = {
  PLAYMAKER: PlaymakerClass,
  ENFORCER: EnforcerClass,
  AERO: AeroClass,
  SWEEPER: SweeperClass
};

export const CLASS_LIST = [
  PlaymakerClass,
  EnforcerClass,
  AeroClass,
  SweeperClass
];

export const DEFAULT_CLASS = EnforcerClass;
