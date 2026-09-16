// action-log-service.js

const ACTION_LOG_KEY_PREFIX = "actionLogs:";

function normalizeEno(eno) {
  const value = Number(eno);
  return Number.isInteger(value) && value > 0 ? value : null;
}

function safeParse(json, fallback) {
  if (!json) return fallback;
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

function makeActionLogKey(eno) {
  return `${ACTION_LOG_KEY_PREFIX}${eno}`;
}

function makeLogId(type = "action") {
  return `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizePostId(postId) {
  const value = Number(postId);
  return Number.isInteger(value) && value > 0 ? value : null;
}

function loadLegacyInventoryLogs(eno) {
  const inventory = safeParse(localStorage.getItem(`inventory:${eno}`), null);
  return Array.isArray(inventory?.logs) ? inventory.logs : [];
}

function loadLogs(eno) {
  const normalizedEno = normalizeEno(eno);
  if (!normalizedEno) return [];

  const storedLogs = safeParse(
    localStorage.getItem(makeActionLogKey(normalizedEno)),
    []
  );
  const combinedLogs = [
    ...(Array.isArray(storedLogs) ? storedLogs : []),
    ...loadLegacyInventoryLogs(normalizedEno)
  ];
  const uniqueLogs = new Map();

  combinedLogs.forEach(log => {
    if (!log || typeof log !== "object") return;
    const logId = typeof log.logId === "string" && log.logId
      ? log.logId
      : makeLogId(log.logType);
    if (!uniqueLogs.has(logId)) uniqueLogs.set(logId, { ...log, logId });
  });

  return [...uniqueLogs.values()];
}

function saveLogs(eno, logs) {
  const normalizedEno = normalizeEno(eno);
  if (!normalizedEno) return false;
  localStorage.setItem(makeActionLogKey(normalizedEno), JSON.stringify(logs));
  return true;
}

export function createActionLog(eno, input = {}) {
  const normalizedEno = normalizeEno(eno);
  if (!normalizedEno) return null;

  const log = {
    logId: makeLogId(input.logType),
    logType: typeof input.logType === "string" ? input.logType : "action",
    createdAt: new Date().toISOString(),
    actorEno: normalizedEno,
    message: typeof input.message === "string" ? input.message : "",
    isPosted: Boolean(input.isPosted),
    postedAt: input.isPosted ? new Date().toISOString() : null,
    postedPlaceId: input.isPosted && typeof input.postedPlaceId === "string"
      ? input.postedPlaceId
      : null,
    postId: normalizePostId(input.postId),
    ...input
  };

  saveLogs(normalizedEno, [...loadLogs(normalizedEno), log]);
  return { ...log };
}

export function getActionLogs(eno) {
  return loadLogs(eno)
    .slice()
    .sort((a, b) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")));
}

export function markActionLogPosted(eno, logId, { postedPlaceId = null, postId = null } = {}) {
  const logs = loadLogs(eno);
  const target = logs.find(log => log.logId === logId);
  if (!target) return false;

  return saveLogs(eno, logs.map(log => log.logId === logId
    ? {
        ...log,
        isPosted: true,
        postedAt: new Date().toISOString(),
        postedPlaceId: postedPlaceId || log.postedPlaceId || null,
        postId: normalizePostId(postId) || log.postId || null
      }
    : log));
}
