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

function getBattleStartDialogue(unitSnapshot) {
  if (!unitSnapshot) return null;

  // ここは後で正式な保存場所が決まったら差し替える
  // 今は未設定扱いで null を返す
  return null;
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
      iconUrl: resolveIconUrl(unitSnapshot, dialogue.iconId),
      text: dialogue.text
    };
  }

  // 戦闘開始時スタンバイ
  if (
    event.type === "turnUnit" &&
    event.actionLabel === "スタンバイ"
  ) {
    const dialogue =
      getBattleStartDialogue(unitSnapshot);

    if (!dialogue?.text) {
      return {
        iconUrl: unitSnapshot.icon || getFallbackIcon(),
        text: ""
      };
    }

    return {
      iconUrl: resolveIconUrl(unitSnapshot, dialogue.iconId),
      text: dialogue.text
    };
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

export function showUnitDefaultComm(unitId, snapshot) {
  const unitSnapshot = getUnitSnapshot(snapshot, unitId);
  if (!unitSnapshot) return;

  const iconUrl = unitSnapshot.icon || getFallbackIcon();

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
