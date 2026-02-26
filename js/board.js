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

  const wrapper = document.createElement("div");
  wrapper.classList.add("unitWrapper");
  wrapper.dataset.unitId = unit.id;

  const img = document.createElement("img");
  img.src = unit.icon;
  img.classList.add("unitImage");

  const marker = document.createElement("div");
  marker.classList.add("facingMarker");
  marker.textContent = "▲"; // 初期向きN想定

  wrapper.appendChild(img);
  wrapper.appendChild(marker);

  cell.appendChild(wrapper);
}
export function updateFacing(containerId, unitId, facing) {

  const container = document.getElementById(containerId);

  const wrapper = container.querySelector(
    `[data-unit-id="${unitId}"]`
  );

  if (!wrapper) return;

  const marker = wrapper.querySelector(".facingMarker");

  if (!marker) return;

  if (facing === "N") marker.textContent = "▲";
  if (facing === "S") marker.textContent = "▼";
  if (facing === "E") marker.textContent = "▶";
  if (facing === "W") marker.textContent = "◀";
}
export function moveUnit(containerId, unitId, newX, newY) {

  const container = document.getElementById(containerId);

  const unit = container.querySelector(`[data-unit-id="${unitId}"]`);

  if (!unit) return;

  const targetCell = container.querySelector(
    `[data-x="${newX}"][data-y="${newY}"]`
  );

  if (!targetCell) return;

  targetCell.appendChild(unit);
}
export function highlightCell(containerId, x, y, colorClass) {

  const container =
    document.getElementById(containerId);

  const cell =
    container.querySelector(
      `[data-x="${x}"][data-y="${y}"]`
    );

  if (!cell) return;

  cell.classList.add(colorClass);

  // 一瞬だけ表示（600ms）
  setTimeout(() => {
    cell.classList.remove(colorClass);
  }, 600);
}
