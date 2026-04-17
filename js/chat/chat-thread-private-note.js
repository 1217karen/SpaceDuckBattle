//chat-thread-private-note.js

const THREAD_PRIVATE_NOTE_STORAGE_KEY = "threadPrivateNotes";

function safeParse(json, fallback = null) {
  if (!json) return fallback;

  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

function buildNoteKey(ownerEno, threadRootPostId) {
  const eno =
    typeof ownerEno === "number"
      ? ownerEno
      : Number(ownerEno || 0);

  const rootId =
    typeof threadRootPostId === "number"
      ? threadRootPostId
      : Number(threadRootPostId || 0);

  if (!eno || !rootId) {
    return "";
  }

  return `${eno}:${rootId}`;
}

function loadAllThreadPrivateNotes() {
  const parsed = safeParse(
    localStorage.getItem(THREAD_PRIVATE_NOTE_STORAGE_KEY),
    {}
  );

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {};
  }

  return parsed;
}

function saveAllThreadPrivateNotes(data) {
  localStorage.setItem(
    THREAD_PRIVATE_NOTE_STORAGE_KEY,
    JSON.stringify(data)
  );
}

export function loadThreadPrivateNote({
  ownerEno,
  threadRootPostId
}) {
  const key = buildNoteKey(ownerEno, threadRootPostId);

  if (!key) {
    return "";
  }

  const allNotes = loadAllThreadPrivateNotes();
  const value = allNotes[key];

  return typeof value === "string"
    ? value
    : "";
}

export function saveThreadPrivateNote({
  ownerEno,
  threadRootPostId,
  noteText
}) {
  const key = buildNoteKey(ownerEno, threadRootPostId);

  if (!key) {
    return "";
  }

  const allNotes = loadAllThreadPrivateNotes();
  const normalizedText =
    typeof noteText === "string"
      ? noteText
      : "";

  allNotes[key] = normalizedText;
  saveAllThreadPrivateNotes(allNotes);

  return normalizedText;
}
