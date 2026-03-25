//include-menu.js

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("commonMenu");
  if (!container) return;

  const response = await fetch("./menu.html");
  const html = await response.text();
  container.innerHTML = html;
});
