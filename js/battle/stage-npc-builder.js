// stage-npc-builder.js

import { NPC_DATA } from "../data/npcs/npc-index.js";
import { buildBattleUnit } from "./unit-builder.js";

const TEAM_BY_KIND = {
  ally: 1,
  enemy: 2
};

const LABEL_SUFFIXES = [
  "Ａ", "Ｂ", "Ｃ", "Ｄ", "Ｅ", "Ｆ", "Ｇ", "Ｈ", "Ｉ", "Ｊ",
  "Ｋ", "Ｌ", "Ｍ", "Ｎ", "Ｏ", "Ｐ", "Ｑ", "Ｒ", "Ｓ", "Ｔ",
  "Ｕ", "Ｖ", "Ｗ", "Ｘ", "Ｙ", "Ｚ"
];

function getNpc(npcId, stageId) {
  const npc = NPC_DATA[npcId];

  if (!npc) {
    throw new Error(`ステージ ${stageId} に存在しない npcId: ${npcId} が指定されています`);
  }

  return npc;
}

function pickRandomNpcId(npcPool, allowDuplicate, usedNpcIds) {
  const candidates = allowDuplicate
    ? npcPool
    : npcPool.filter(npcId => !usedNpcIds.has(npcId));

  if (candidates.length === 0) {
    throw new Error("ランダムNPC候補が不足しています");
  }

  const index = Math.floor(Math.random() * candidates.length);
  const npcId = candidates[index];
  usedNpcIds.add(npcId);

  return npcId;
}

function resolveRandomGroups(stage, kind) {
  const groupKey = kind === "ally" ? "randomAllyGroups" : "randomEnemyGroups";
  const groups = stage[groupKey] || [];
  const resolved = [];

  groups.forEach(group => {
    const npcPool = Array.isArray(group.npcPool) ? group.npcPool : [];
    const positions = Array.isArray(group.positions) ? group.positions : [];
    const count = Number(group.count || 0);

    if (count !== positions.length) {
      throw new Error(
        `ステージ ${stage.id} の ${groupKey}.${group.id || "unknown"} は count と positions の数が一致していません`
      );
    }

    if (npcPool.length === 0) {
      throw new Error(
        `ステージ ${stage.id} の ${groupKey}.${group.id || "unknown"} に npcPool がありません`
      );
    }

    const usedNpcIds = new Set();

    positions.forEach((position, index) => {
      const npcId = pickRandomNpcId(
        npcPool,
        group.allowDuplicate !== false,
        usedNpcIds
      );

      resolved.push({
        npcId,
        x: position.x,
        y: position.y,
        facing: position.facing,
        placementId: `${group.id || "random"}_${index + 1}`
      });
    });
  });

  return resolved;
}

function collectPlacements(stage) {
  return [
    ...(stage.allyNpcPlacements || []).map(placement => ({
      ...placement,
      kind: "ally"
    })),
    ...resolveRandomGroups(stage, "ally").map(placement => ({
      ...placement,
      kind: "ally"
    })),
    ...(stage.enemyPlacements || []).map(placement => ({
      ...placement,
      kind: "enemy"
    })),
    ...resolveRandomGroups(stage, "enemy").map(placement => ({
      ...placement,
      kind: "enemy"
    }))
  ];
}

function createDisplayNameResolver(placements, stageId) {
  const totals = new Map();
  const current = new Map();

  placements.forEach(placement => {
    getNpc(placement.npcId, stageId);
    totals.set(
      placement.npcId,
      (totals.get(placement.npcId) || 0) + 1
    );
  });

  return function resolveDisplayName(placement) {
    if (placement.displayName) return placement.displayName;

    const npc = getNpc(placement.npcId, stageId);
    const total = totals.get(placement.npcId) || 0;

    if (total <= 1) return npc.name;

    const nextIndex = current.get(placement.npcId) || 0;
    current.set(placement.npcId, nextIndex + 1);

    const suffix = LABEL_SUFFIXES[nextIndex] || String(nextIndex + 1);
    return `${npc.name}${suffix}`;
  };
}

function toUnitData(npc, displayName) {
  return {
    name: npc.name,
    displayName,
    type: npc.unit.type,
    behavior: npc.unit.behavior || "auto",
    icon: structuredClone(npc.unit.icons || {}),
    stats: structuredClone(npc.unit.stats || {}),
    patterns: structuredClone(npc.unit.patterns || [])
  };
}

function toCharacterData(npc) {
  return {
    fullName: npc.name,
    defaultName: npc.name,
    defaultIcon: npc.character?.defaultIcon || "",
    commIcons: structuredClone(npc.character?.commIcons || []),
    commDialogues: structuredClone(npc.character?.commDialogues || {})
  };
}

function makeUnitId(stage, placement, index) {
  if (placement.unitId) return placement.unitId;

  const kind = placement.kind === "ally" ? "ally_npc" : "enemy";
  return `${stage.id}_${kind}_${String(index + 1).padStart(3, "0")}`;
}

export function buildStageNpcUnits(stage) {
  const placements = collectPlacements(stage);
  const resolveDisplayName = createDisplayNameResolver(placements, stage.id);

  return placements.map((placement, index) => {
    const npc = getNpc(placement.npcId, stage.id);
    const displayName = resolveDisplayName(placement);
    const unitData = toUnitData(npc, displayName);
    const characterData = toCharacterData(npc);
    const pattern = unitData.patterns?.[0] || { skills: [] };
    const team = TEAM_BY_KIND[placement.kind];

    return buildBattleUnit(
      unitData,
      characterData,
      pattern,
      team,
      placement.x,
      placement.y,
      placement.facing || (placement.kind === "ally" ? "E" : "W"),
      index,
      makeUnitId(stage, placement, index)
    );
  });
}

export function getNpcUnitData(npcId) {
  const npc = getNpc(npcId, "NPC_DATA");

  return toUnitData(npc, npc.name);
}
