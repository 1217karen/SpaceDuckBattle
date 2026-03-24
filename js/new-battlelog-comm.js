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

function getSkillDialogue(unitSnapshot, skillType) {
  if (!unitSnapshot || !skillType) return null;

  const patterns = unitSnapshot.patterns || [];

  for (const pattern of patterns) {
    const skills = pattern.skills || [];

    for (const skill of skills) {
      if (skill.type !== skillType) continue;
      return skill.dialogue || null;
    }
  }

  return null;
}

function getFixedDialogue(unitSnapshot, key) {
  if (!unitSnapshot || !key) return null;

  const dialogues =
    unitSnapshot.commDialogues || null;

  if (!dialogues) return null;

  return dialogues[key] || null;
}

function resolveCommPayload(unitSnapshot, event) {
  if (!unitSnapshot || !event) return null;

  // スキル使用時
if (event.type === "skillUse") {
  const dialogue =
    getSkillDialogue(unitSnapshot, event.skill);

  if (!dialogue?.text) {
    return null;
  }

  return {
    iconUrl:
      dialogue.iconUrl ||
      unitSnapshot.defaultCommIconUrl ||
      unitSnapshot.icon ||
      getFallbackIcon(),
    text: dialogue.text
  };
}

if (event.type === "turnUnit") {
  let dialogue = null;

  if (event.phase === "battleStart") {
    dialogue =
      getFixedDialogue(unitSnapshot, "battleStart");
  }

  else if (event.phase === "turnChange") {
    dialogue =
      getFixedDialogue(unitSnapshot, "turnChange");
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

  return {
    iconUrl:
      dialogue.iconUrl ||
      unitSnapshot.defaultCommIconUrl ||
      unitSnapshot.icon ||
      getFallbackIcon(),
    text: dialogue.text
  };
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

export function updateCommByEvent(event, snapshot) {
  if (!event) return;

  const unitSnapshot =
    getUnitSnapshot(snapshot, event.unit);

  const payload =
    resolveCommPayload(unitSnapshot, event);

  if (!payload) return;

  showCommPanel(payload);
}
