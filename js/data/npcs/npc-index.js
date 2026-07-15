// npc-index.js

import { ALLY_NPCS } from "./ally-npcs.js";
import { ENEMY_NPCS } from "./enemy-npcs.js";

export const NPC_DATA = {
  ...ENEMY_NPCS,
  ...ALLY_NPCS
};
