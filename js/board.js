//board.js
export function createBoard(containerId, width, height) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  container.style.display = "grid";
  container.style.gridTemplateColumns = `repeat(${width}, 60px)`;
  container.style.gridTemplateRows = `repeat(${height}, 60px)`;
  container.style.gap = "2px";

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      cell.dataset.x = x;
      cell.dataset.y = y;
      container.appendChild(cell);
    }
  }
}
export function placeUnit(containerId, unit) {

  const container = document.getElementById(containerId);

  const cell = container.querySelector(
    `[data-x="${unit.x}"][data-y="${unit.y}"]`
  );

  if (!cell) return;

  const img = document.createElement("img");

  img.src = unit.icon;
  img.classList.add("unit");
  img.dataset.unitId = unit.id;

  cell.appendChild(img);
}
