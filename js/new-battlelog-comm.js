// new-battlelog-comm.js

import { renderRichText } from "./rich-text.js";
import { resolveCommDisplayName } from "./name-resolver.js";

function getFallbackIcon() {
  return "https://placehold.co/60x60?text=NO+IMG";
}

function getCommElements() {
  return {
    icon: document.getElementById("commIcon"),
    name: document.getElementById("commName"),
    message: document.getElementById("commMessage")
  };
}

function getUnitSnapshot(snapshot, unitId) {
  return snapshot?.units?.find(u => u.id === unitId) || null;
}

function buildCommPayloadFromEvent(event, snapshot, fallbackUnitId = null) {
  if (!event?.comm) return null;
  if (typeof event.comm.text !== "string") return null;

  const unitId =
    event.comm.unitId ||
    fallbackUnitId ||
    null;

  const unitSnapshot =
    unitId ? getUnitSnapshot(snapshot, unitId) : null;

  const hasExplicitCommIcon =
    typeof event.comm.iconUrl === "string" &&
    event.comm.iconUrl.trim() !== "";

  const hasExplicitCommName =
    typeof event.comm.name === "string" &&
    event.comm.name.trim() !== "";

  const shouldSwitchSpeaker =
    hasExplicitCommIcon || hasExplicitCommName;

  const iconUrl = shouldSwitchSpeaker
    ? (
        event.comm.iconUrl ||
        unitSnapshot?.icon ||
        getFallbackIcon()
      )
    : (
        unitSnapshot?.icon ||
        getFallbackIcon()
      );

  const name = shouldSwitchSpeaker
    ? resolveCommDisplayName({
        manualName: event.comm.name,
        iconUrl,
        commIcons: unitSnapshot?.commIcons || [],
        defaultCharacterName:
          unitSnapshot?.defaultCharacterName || "",
        unitName:
          unitSnapshot?.name || "",
        fallback:
          unitId || "",
        hasExplicitCommText: true,
        hasExplicitCommIcon
      })
    : (
        unitSnapshot?.name ||
        unitId ||
        ""
      );

  return {
    iconUrl,
    name,
    text: event.comm.text
  };
}

export function resetCommPanel() {
  const { icon, name, message } = getCommElements();

  if (icon) {
    icon.src = getFallbackIcon();
  }

  if (name) {
    name.textContent = "";
  }

  if (message) {
    message.textContent = "";
  }
}

export function showCommPanel({ iconUrl, name, text }) {
  const { icon, name: nameEl, message } = getCommElements();

  if (icon) {
    icon.src = iconUrl || getFallbackIcon();
  }

  if (nameEl) {
    nameEl.textContent = name || "";
  }

  if (message) {
    renderRichText(message, text || "", { preset: "message" });
  }
}

export function showUnitDefaultComm(unitId, snapshot) {
  const unitSnapshot = getUnitSnapshot(snapshot, unitId);
  if (!unitSnapshot) return;

const iconUrl =
  unitSnapshot.defaultCharacterIcon ||
  unitSnapshot.icon ||
  getFallbackIcon();

  const name =
    unitSnapshot.name || unitId || "";

  showCommPanel({
    iconUrl,
    name,
    text: ""
  });
}

export function updateCommByEvent(event, snapshot, fallbackUnitId = null) {
  if (!event) return;

  const payload =
    buildCommPayloadFromEvent(event, snapshot, fallbackUnitId);

  if (!payload) return;

  showCommPanel(payload);
}
