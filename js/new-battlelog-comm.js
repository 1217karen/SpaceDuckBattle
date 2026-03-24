// new-battlelog-comm.js

function getFallbackIcon() {
  return "https://placehold.co/60x60?text=NO+IMG";
}

function getCommElements() {
  return {
    icon: document.getElementById("commIcon"),
    message: document.getElementById("commMessage")
  };
}

function getUnitSnapshot(snapshot, unitId) {
  return snapshot?.units?.find(u => u.id === unitId) || null;
}

function normalizeDialogueCandidates(dialogue) {
  if (!dialogue) return [];

  if (Array.isArray(dialogue)) {
    return dialogue.filter(item => item && typeof item.text === "string");
  }

  if (typeof dialogue.text === "string") {
    return [dialogue];
  }

  return [];
}

function pickRandomDialogue(dialogue) {
  const candidates = normalizeDialogueCandidates(dialogue);

  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];

  const index = Math.floor(Math.random() * candidates.length);
  return candidates[index];
}

function getSkillDialogue(unitSnapshot, skillType) {
  if (!unitSnapshot || !skillType) return null;

  const patterns = unitSnapshot.patterns || [];

  for (const pattern of patterns) {
    const skills = pattern.skills || [];

    for (const skill of skills) {
      if (skill.type !== skillType) continue;
      return pickRandomDialogue(skill.dialogue || null);
    }
  }

  return null;
}

function getFixedDialogue(unitSnapshot, key) {
  if (!unitSnapshot || !key) return null;

  const dialogues = unitSnapshot.commDialogues || null;
  if (!dialogues) return null;

  return pickRandomDialogue(dialogues[key] || null);
}

function buildCommPayload(unitSnapshot, dialogue) {
  if (!unitSnapshot || !dialogue?.text) return null;

  return {
    iconUrl:
      dialogue.iconUrl ||
      unitSnapshot.defaultCommIconUrl ||
      unitSnapshot.icon ||
      getFallbackIcon(),
    text: dialogue.text
  };
}

function resolveTurnUnitPayload(unitSnapshot, event) {
  if (!unitSnapshot || !event) return null;

  let dialogue = null;

  if (event.phase === "battleStart") {
    dialogue = getFixedDialogue(unitSnapshot, "battleStart");
  } else if (event.phase === "turnChange") {
    dialogue = getFixedDialogue(unitSnapshot, "turnChange");
  }

  if (!dialogue?.text) {
    return {
      iconUrl:
        unitSnapshot.defaultCommIconUrl ||
        unitSnapshot.icon ||
        getFallbackIcon(),
      text: ""
    };
  }

  return buildCommPayload(unitSnapshot, dialogue);
}

function resolveBattleEndPayload(unitSnapshot, event) {
  if (!unitSnapshot || !event) return null;

  if (event.winner == null) return null;
  if (unitSnapshot.team !== event.winner) return null;

  const dialogue =
    getFixedDialogue(unitSnapshot, "battleEndWin");

  if (!dialogue?.text) return null;

  return buildCommPayload(unitSnapshot, dialogue);
}

function resolveCommPayload(unitSnapshot, event) {
  if (!unitSnapshot || !event) return null;

  if (event.type === "skillUse") {
    const dialogue =
      getSkillDialogue(unitSnapshot, event.skill);

    return buildCommPayload(unitSnapshot, dialogue);
  }

  if (event.type === "turnUnit") {
    return resolveTurnUnitPayload(unitSnapshot, event);
  }

  if (event.type === "battleEnd") {
    return resolveBattleEndPayload(unitSnapshot, event);
  }

  return null;
}

export function resetCommPanel() {
  const { icon, message } = getCommElements();

  if (icon) {
    icon.src = getFallbackIcon();
  }

  if (message) {
    message.textContent = "";
  }
}

export function showCommPanel({ iconUrl, text }) {
  const { icon, message } = getCommElements();

  if (icon) {
    icon.src = iconUrl || getFallbackIcon();
  }

  if (message) {
    message.textContent = text || "";
  }
}

export function showUnitDefaultComm(unitId, snapshot) {
  const unitSnapshot = getUnitSnapshot(snapshot, unitId);
  if (!unitSnapshot) return;

  const iconUrl =
    unitSnapshot.defaultCommIconUrl ||
    unitSnapshot.icon ||
    getFallbackIcon();

  showCommPanel({
    iconUrl,
    text: ""
  });
}

export function updateCommByEvent(event, snapshot, fallbackUnitId = null) {
  if (!event) return;

  const unitId =
    event.unit || fallbackUnitId;

  if (!unitId) return;

  const unitSnapshot =
    getUnitSnapshot(snapshot, unitId);

  const payload =
    resolveCommPayload(unitSnapshot, event);

  if (!payload) return;

  showCommPanel(payload);
}
