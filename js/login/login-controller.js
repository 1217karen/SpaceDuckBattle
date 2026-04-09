//login-controller.js

import {
  getAccountByLoginId,
  setCurrentLoginId
} from "../services/storage-service.js";

const form = document.querySelector(".login-form");
const idInput = document.getElementById("loginId");
const passwordInput = document.getElementById("loginPassword");

if (form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const loginId = idInput.value.trim();
    const password = passwordInput.value;

    if (!loginId) {
      alert("IDを入力してください");
      return;
    }

    if (!password) {
      alert("パスワードを入力してください");
      return;
    }

    const account = getAccountByLoginId(loginId);

    if (!account) {
      alert("そのIDのアカウントは存在しません");
      return;
    }

    if (account.password !== password) {
      alert("パスワードが違います");
      return;
    }

    setCurrentLoginId(loginId);

    if (account.setupCompleted) {
      window.location.href = "top.html";
      return;
    }

    window.location.href = "first-setup.html";
  });
}
