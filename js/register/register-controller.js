//register-controller.js

import {getNextEno,saveAccount,accountExists,setCurrentLoginId} from "../services/storage-service.js";

const form = document.querySelector(".register-form");
const idInput = document.getElementById("registerId");
const passwordInput = document.getElementById("registerPassword");
const confirmInput = document.getElementById("registerPasswordConfirm");

if (form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const loginId = idInput.value.trim();
    const password = passwordInput.value;
    const passwordConfirm = confirmInput.value;

    if (!loginId) {
      alert("IDを入力してください");
      return;
    }

    if (!password) {
      alert("パスワードを入力してください");
      return;
    }

    if (password !== passwordConfirm) {
      alert("確認用パスワードが一致していません");
      return;
    }

    if (accountExists(loginId)) {
      alert("そのIDは既に使われています");
      return;
    }

    const eno = getNextEno();

    const account = {
      loginId,
      password,
      eno,
      setupCompleted: false
    };

    saveAccount(account);
    setCurrentLoginId(loginId);

    window.location.href = "first-setup.html";
  });
}
