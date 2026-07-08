//include-menu.js
import {
  clearCurrentLoginId,
  getCurrentAccount,
  loadCharacter
} from "../services/storage-service.js";

const MENU_NO_IMAGE_URL =
  "https://placehold.co/60x60?text=NO+IMG";

function setupMenuProfileCard() {
  const profileCard =
    document.getElementById("menuProfileCard");

  if (!profileCard) return;

  const icon =
    document.getElementById("menuProfileIcon");

  const enoText =
    document.getElementById("menuProfileEno");

  const nameText =
    document.getElementById("menuProfileName");

  const account =
    getCurrentAccount();

  if (!account?.eno) {
    profileCard.href = "./index.html";

    if (icon) {
      icon.src = MENU_NO_IMAGE_URL;
    }

    if (enoText) {
      enoText.textContent = "Eno.-";
    }

    if (nameText) {
      nameText.textContent = "-";
    }

    return;
  }

  const eno =
    account.eno;

  const character =
    loadCharacter(eno) || {};

  profileCard.href =
    `./profile.html?eno=${encodeURIComponent(eno)}`;

  if (icon) {
    icon.src =
      character.defaultIcon || MENU_NO_IMAGE_URL;
  }

  if (enoText) {
    enoText.textContent =
      `Eno.${eno}`;
  }

  if (nameText) {
    nameText.textContent =
      character.defaultName || character.fullName || "-";
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("commonMenu");
  if (!container) return;

  const response = await fetch("./menu.html");
  const html = await response.text();
  container.innerHTML = html;

  setupMenuProfileCard();

  const logoutButton = document.getElementById("logoutButton");

  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      clearCurrentLoginId();
      window.location.href = "./index.html";
    });
  }
});
