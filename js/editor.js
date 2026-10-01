// =========================================================================
// EDITOR.JS - Moduł Edytora Przeszkód (Obstacle Editor API)
// =========================================================================

export {
  editorState,
  initObstacleEditorUI,
  renderEditorPalette,
  updateEditorPaletteHighlight
} from './main.js';

export {
  OBSTACLE_PALETTE,
  getObstacleDef,
  customObstacles,
  obstacles,
  clearCustomObstacles,
  undoCustomObstacle,
  setCustomObstacles,
  calculateObstaclePlacement,
  isBottomAnchored,
  normalizeObstacleType
} from './obstacles.js';
