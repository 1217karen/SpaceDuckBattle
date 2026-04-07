//map-controller.js

import { places } from "./places-data.js";
import {getCurrentAccount,loadCharacter,saveCharacter} from "./storage-service.js";

const centerPanel = document.querySelector(".center-panel");

function getFieldPlaces() {
  return places.filter(place => place.kind === "field");
}

function getAreaPlaces() {
  return places.filter(place => place.kind === "area");
}

function getRoomPlaces() {
  return places.filter(place => place.kind === "room");
}

function createPlaceLink(place) {
  const wrapper = document.createElement("div");
  wrapper.className = "mapPlaceRow";

  const button = document.createElement("button");
  button.type = "button";
  button.textContent = `${place.placeId} : ${place.name}`;

  button.addEventListener("click", () => {
    const account = getCurrentAccount();

    if (!account?.eno) {
      alert("ログイン中のアカウント情報を確認できません");
      return;
    }

    const eno = account.eno;
    const character = loadCharacter(eno) || {};

    saveCharacter(eno, {
      ...character,
      currentPlaceId: place.placeId
    });

    window.location.href =
      `./chat.html?placeId=${encodeURIComponent(place.placeId)}`;
  });

  wrapper.appendChild(button);

  return wrapper;
}

function createSection(titleText, placeList) {
  const section = document.createElement("section");

  const title = document.createElement("h2");
  title.textContent = titleText;
  section.appendChild(title);

  if (placeList.length === 0) {
    const empty = document.createElement("p");
    empty.textContent = "項目がありません";
    section.appendChild(empty);
    return section;
  }

  placeList.forEach(place => {
    section.appendChild(createPlaceLink(place));
  });

  return section;
}

function renderMap() {
  if (!centerPanel) return;

  centerPanel.innerHTML = "";

  const heading = document.createElement("h1");
  heading.textContent = "マップ";
  centerPanel.appendChild(heading);

  centerPanel.appendChild(
    createSection("フィールド", getFieldPlaces())
  );

  centerPanel.appendChild(
    createSection("エリア", getAreaPlaces())
  );

  centerPanel.appendChild(
    createSection("ルーム", getRoomPlaces())
  );
}

renderMap();
