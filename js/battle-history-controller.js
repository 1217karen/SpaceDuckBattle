//battle-history-controller.js

const battleHistoryList = document.getElementById("battleHistoryList");

function formatDateTime(timestamp) {
  if (!timestamp) return "";

  const date = new Date(timestamp);

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");

  return `${y}/${m}/${d} ${h}:${min}`;
}

function loadBattleRecords() {
  return Object.keys(localStorage)
    .filter((key) => key.startsWith("battle_"))
    .map((key) => {
      try {
        return JSON.parse(localStorage.getItem(key));
      } catch {
        return null;
      }
    })
    .filter((record) => record && record.mode === "pve")
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

function createBattleHistoryItem(record) {
  const item = document.createElement("div");
  item.className = "battle-history-item";

  const header = document.createElement("div");
  header.className = "battle-history-header";

  const stage = document.createElement("div");
  stage.className = "battle-history-stage";
  stage.textContent = record.stage?.name || "";

  const meta = document.createElement("div");
  meta.textContent = formatDateTime(record.createdAt);

  header.appendChild(stage);
  header.appendChild(meta);

  const result = document.createElement("div");
  result.className = `battle-history-result ${record.result || ""}`;
  result.textContent =
    record.result === "win" ? "勝利" :
    record.result === "lose" ? "敗北" :
    "不明";

  const party = document.createElement("div");
  party.className = "battle-history-party";

  (record.party?.memberIcons || []).forEach((iconUrl) => {
    const img = document.createElement("img");
    img.src = iconUrl || "";
    img.alt = "PTアイコン";
    party.appendChild(img);
  });

  const link = document.createElement("a");
  link.className = "battle-history-link";
  link.href = `./battlelog.html?id=${record.battleId}`;
  link.textContent = "結果を見る";

  item.appendChild(header);
  item.appendChild(result);
  item.appendChild(party);
  item.appendChild(link);

  return item;
}

function renderBattleHistory() {
  const records = loadBattleRecords();

  battleHistoryList.innerHTML = "";

  if (records.length === 0) {
    battleHistoryList.textContent = "戦闘履歴はまだありません。";
    return;
  }

  records.forEach((record) => {
    battleHistoryList.appendChild(createBattleHistoryItem(record));
  });
}

renderBattleHistory();

