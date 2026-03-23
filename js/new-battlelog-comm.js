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

function getDialogueByEvent(unitSnapshot, event) {
  if (!unitSnapshot || !event) return null;

  console.log("COMM DEBUG", unitSnapshot, event);

  // 今回は skillUse のみ対応
  if (event.type === "skillUse") {

    const patterns = unitSnapshot.patterns || [];

    for (const pattern of patterns) {
      const skills = pattern.skills || [];

      for (const skill of skills) {
        if (skill.type !== event.skill) continue;

        if (!skill.dialogue) return null;

        return skill.dialogue;
      }
    }
  }

  return null;
}

function resolveIconUrl(unitSnapshot, iconId) {
  if (!unitSnapshot) return getFallbackIcon();

  const icons = unitSnapshot.commIcons || [];
  const found = icons.find(x => x.id === iconId);

  return found?.url || getFallbackIcon();
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

export function updateCommByEvent(event, snapshot) {
  if (!event) return;

  const unitSnapshot =
    getUnitSnapshot(snapshot, event.unit);

  const dialogue =
    getDialogueByEvent(unitSnapshot, event);

  if (!dialogue?.text) return;

  const iconUrl =
    resolveIconUrl(unitSnapshot, dialogue.iconId);

  showCommPanel({
    iconUrl,
    text: dialogue.text
  });
}
