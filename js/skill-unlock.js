//skill-unlock.js

export function getCurrentStats() {
  return {
    atk: Number(document.getElementById("statAT")?.value) || 0,
    def: Number(document.getElementById("statDF")?.value) || 0,
    heal: Number(document.getElementById("statHEAL")?.value) || 0,
    speed: Number(document.getElementById("statSPEED")?.value) || 0,
    cri: Number(document.getElementById("statCRI")?.value) || 0,
    tec: Number(document.getElementById("statTEC")?.value) || 0
  };
}

export function isSkillUnlocked(skill, stats) {
  const unlock = skill?.unlock;

  if (!unlock || typeof unlock !== "object") {
    return true;
  }

  const currentStats = stats || {};

  if (unlock.atk !== undefined && currentStats.atk < unlock.atk) {
    return false;
  }

  if (unlock.def !== undefined && currentStats.def < unlock.def) {
    return false;
  }

  if (unlock.heal !== undefined && currentStats.heal < unlock.heal) {
    return false;
  }

  if (unlock.speed !== undefined && currentStats.speed < unlock.speed) {
    return false;
  }

  if (unlock.cri !== undefined && currentStats.cri < unlock.cri) {
    return false;
  }

  if (unlock.tec !== undefined && currentStats.tec < unlock.tec) {
    return false;
  }

  return true;
}

export function formatUnlockText(unlock) {
  if (!unlock || typeof unlock !== "object") {
    return "なし";
  }

  const parts = [];

  if (unlock.atk !== undefined) {
    parts.push(`ATK ${unlock.atk}以上`);
  }

  if (unlock.def !== undefined) {
    parts.push(`DEF ${unlock.def}以上`);
  }

  if (unlock.heal !== undefined) {
    parts.push(`HEAL ${unlock.heal}以上`);
  }

  if (unlock.speed !== undefined) {
    parts.push(`SPEED ${unlock.speed}以上`);
  }

  if (unlock.cri !== undefined) {
    parts.push(`CRI ${unlock.cri}以上`);
  }

  if (unlock.tec !== undefined) {
    parts.push(`TEC ${unlock.tec}以上`);
  }

  return parts.length > 0 ? parts.join(" / ") : "なし";
}
