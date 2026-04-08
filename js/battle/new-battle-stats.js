//new-battle-stats.js

export function getEffectiveStat(unit, statName) {

  const base = (unit[statName] ?? 0) + 5;

  let flatBonus = 0;
  let rateBonus = 0;

  if (unit.effects) {
    for (let effect of unit.effects) {
      if (effect.stat !== statName) continue;

      if (effect.mode === "flat") {
        flatBonus += effect.value;
      }
    }
  }

  if (unit.rateEffects) {
    for (let effect of unit.rateEffects) {
      if (effect.stat !== statName) continue;
      rateBonus += effect.value;
    }
  }

  const afterFlat = base + flatBonus;
  const finalValue = afterFlat * (1 + rateBonus);

  return Math.round(finalValue);
}
