//board.js
export function createBoard(containerId, width, height) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  container.style.display = "grid";
container.style.gridTemplateColumns = `repeat(${width}, 64px)`;
container.style.gridTemplateRows = `repeat(${height}, 64px)`;
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
  wrapper.classList.add("unitWrapper", "team" + unit.team);
  wrapper.dataset.unitId = unit.id;

const img = document.createElement("img");
img.src = unit.icon;
img.classList.add("unitImage");

const marker = document.createElement("div");
marker.classList.add("facingMarker", "face-N");

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

marker.classList.remove("face-N","face-S","face-E","face-W");
marker.classList.add("face-" + facing);
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
}
export function highlightCells(containerId, cells, className) {

  const container =
    document.getElementById(containerId);

  const highlighted = [];

  for (let c of cells) {

    const cell =
      container.querySelector(
        `[data-x="${c.x}"][data-y="${c.y}"]`
      );

    if (!cell) continue;

    cell.classList.add(className);
    highlighted.push(cell);
  }
}

export function removeUnit(containerId, unitId) {

  const container =
    document.getElementById(containerId);

  const wrapper =
    container.querySelector(
      `[data-unit-id="${unitId}"]`
    );

  if (!wrapper) return;

  wrapper.remove();
}
