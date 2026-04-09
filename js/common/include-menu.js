//include-menu.js

import { clearCurrentLoginId } from "../service/storage-service.js";

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("commonMenu");
  if (!container) return;

  const response = await fetch("./menu.html");
  const html = await response.text();
  container.innerHTML = html;

  const logoutButton = document.getElementById("logoutButton");

  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      clearCurrentLoginId();
      window.location.href = "./index.html";
    });
  }
});
