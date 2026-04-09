//public-unit-source.js

import {
  getRegisteredEnoMax,
  loadCharacter,
  loadUnit
} from "../services/storage-service.js";

export function loadPublicBattleEntries() {
  const maxEno = getRegisteredEnoMax();
  const results = [];

  for (let eno = 1; eno <= maxEno; eno++) {
    const characterData = loadCharacter(eno);
    const unitData = loadUnit(eno, 1);

    if (!characterData || !unitData) {
      continue;
    }

    const patterns = Array.isArray(unitData.patterns)
      ? unitData.patterns
      : [];

    const publicPatterns = patterns
      .map((pattern, index) => ({
        patternIndex: index,
        pattern
      }))
      .filter((entry) => entry.pattern?.public === true);

    if (publicPatterns.length === 0) {
      continue;
    }

    results.push({
      eno,
      characterData,
      unitData,
      publicPatterns
    });
  }

  return results;
}
