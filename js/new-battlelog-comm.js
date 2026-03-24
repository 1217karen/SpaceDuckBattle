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

function buildCommPayloadFromEvent(event) {
  if (!event?.comm) return null;
  if (typeof event.comm.text !== "string") return null;

  return {
    iconUrl:
      event.comm.iconUrl ||
      getFallbackIcon(),
    text: event.comm.text
  };
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

  const payload =
    buildCommPayloadFromEvent(event);

  if (!payload) return;

  showCommPanel(payload);
}
