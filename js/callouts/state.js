// =============================================================================
// JS/CALLOUTS/STATE.JS - KONFIGURACJA I STAN DYMKÓW MEDALI BOJOWYCH
// Obsługa komunikatów wielobójstw ("1 strzał = 2/3 trupy", podwójne/potrójne
// zabójstwo do 2s między zgonami) oraz "Zemsty" (ważnej do kolejnego zgonu).
// =============================================================================

export const CALLOUT_CONFIG = {
  MULTI_KILL_WINDOW_MS: 2000,   // Maks. 2s między kolejnymi zabójstwami w serii
  SAME_BURST_MERGE_MS: 110,     // Łączenie jednoczesnych zgonów (np. granat, RPG) w jeden dymek
  BULLET_TRACK_TTL_MS: 4000,    // Czas życia śledzenia pojedynczego pocisku (penetracja)
  DEDUPE_WINDOW_MS: 750,        // Ochrona przed podwójnym zliczeniem w sieci
  MAX_ACTIVE_BUBBLES: 6,
  BUBBLE_LIFETIME_SEC: 1.95,
  XP_BONUSES: {
    ONE_SHOT_2: 30,
    ONE_SHOT_3: 45,
    ONE_SHOT_4_PLUS: 60,
    DOUBLE_KILL: 15,
    TRIPLE_KILL: 25,
    QUAD_KILL: 35,
    PENTA_KILL: 45,
    MULTI_KILL: 55,
    REVENGE: 15
  }
};

export const calloutState = {
  bubbles: [],
  multiKillCount: 0,
  lastKillAtMs: 0,
  lastMultiKillBubbleId: null,
  lastMultiKillSpawnAtMs: 0,
  revengeTarget: null,         // { ref, id, peerId, name, diedAtMs }
  bulletKills: new Map(),      // bulletId -> { count, xSum, ySum, bubbleId, xpAwarded, lastTime }
  recentVictimKills: new Map(),// victimKey -> timestampMs
  nextBubbleId: 1
};
