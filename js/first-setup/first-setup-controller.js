//first-setup-controller.js

import {getCurrentAccount,saveAccount,createInitialCharacter,createInitialUnit,saveCharacter,saveUnit} from "../services/storage-service.js";

const enoText = document.getElementById("setupEnoText");
const form = document.querySelector(".setup-form");
const fullNameInput = document.getElementById("fullName");
const defaultNameInput = document.getElementById("defaultName");
const unitNameInput = document.getElementById("unitName");

const account = getCurrentAccount();

if (enoText) {
  if (account?.eno) {
    enoText.textContent = `あなたのEnoは ${account.eno} です`;
  } else {
    enoText.textContent = "Enoを確認できません";
  }
}

if (form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const currentAccount = getCurrentAccount();

    if (!currentAccount?.eno) {
      alert("アカウント情報を確認できません");
      return;
    }

    const fullName = fullNameInput.value.trim();
    const defaultName = defaultNameInput.value.trim();
    const unitName = unitNameInput.value.trim();

    if (!fullName) {
      alert("フルネームを入力してください");
      return;
    }

    if (!defaultName) {
      alert("デフォルトネームを入力してください");
      return;
    }

    if (!unitName) {
      alert("ユニット名を入力してください");
      return;
    }

    const eno = currentAccount.eno;

    const character = createInitialCharacter({
      eno,
      fullName,
      defaultName
    });

    const unit = createInitialUnit({
      eno,
      unitNo: 1,
      name: unitName
    });

    saveCharacter(eno, character);
    saveUnit(eno, 1, unit);

    saveAccount({
      ...currentAccount,
      setupCompleted: true
    });

    window.location.href = "top.html";
  });
}
