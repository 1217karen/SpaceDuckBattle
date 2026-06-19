// chat-target-utils.js

function normalizeEno(eno) {
  const normalized =
    typeof eno === "number"
      ? eno
      : Number(eno || 0);

  return Number.isInteger(normalized) && normalized > 0
    ? normalized
    : 0;
}

export function addEnoToTargetText(currentText, eno) {
  const targetEnos = new Set();

  String(currentText ?? "")
    .split(",")
    .map(value => normalizeEno(value.trim()))
    .filter(value => value > 0)
    .forEach(value => {
      targetEnos.add(value);
    });

  const targetEno = normalizeEno(eno);

  if (targetEno) {
    targetEnos.add(targetEno);
  }

  return [...targetEnos].join(",");
}
