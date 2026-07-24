// map-room-section.js

import { createRoom,deleteRoom,getRoomAccessLabel,getRoomsByOwnerEno,isAreaPlace,updateRoom } from "../services/room-service.js";

export function createMapRoomSectionController(options = {}) {
  const {
    getCurrentAccount,
    findPlaceById,
    createMapSectionHeading,
    showToast,
    moveToPlace,
    renderMapTree
  } = options;

  let editingRoomPlaceId = null;
  let activeRoomForm = null;
  let activeRoomFormKey = null;
  let roomFormInitialState = null;
  let roomFormDraftState = null;

  function readRoomFormData(form) {
    return {
      name: form.querySelector("[name=roomName]")?.value ?? "",
      shortDescription:
        form.querySelector("[name=roomShortDescription]")?.value ?? "",
      longDescription:
        form.querySelector("[name=roomLongDescription]")?.value ?? "",
      accessType:
        form.querySelector("[name=roomAccessType]:checked")?.value ?? "public",
      showParentMainAreaPreview: Boolean(
        form.querySelector("[name=showParentMainAreaPreview]")?.checked
      ),
      actionIds: form.querySelector("[name=actionLookAround]")?.checked
        ? ["look-around"]
        : []
    };
  }

  function cloneRoomFormState(state) {
    return {
      name: state?.name ?? "",
      shortDescription: state?.shortDescription ?? "",
      longDescription: state?.longDescription ?? "",
      accessType: state?.accessType ?? "public",
      showParentMainAreaPreview: Boolean(
        state?.showParentMainAreaPreview
      ),
      actionIds: Array.isArray(state?.actionIds)
        ? [...state.actionIds]
        : []
    };
  }

  function createRoomFormKey(currentPlaceId, editingRoom) {
    if (editingRoom?.placeId) {
      return `edit:${editingRoom.placeId}`;
    }

    return `create:${currentPlaceId ?? "none"}`;
  }

  function initializeRoomFormTracking(formKey, initialState) {
    /*
     * 同じフォームの再描画なら、入力途中の内容を保持する。
     */
    if (
      activeRoomFormKey === formKey &&
      roomFormDraftState
    ) {
      return;
    }

    activeRoomFormKey = formKey;
    roomFormInitialState = cloneRoomFormState(initialState);
    roomFormDraftState = cloneRoomFormState(initialState);
  }

  function registerActiveRoomForm(form) {
    activeRoomForm = form;

    const syncDraft = () => {
      roomFormDraftState = cloneRoomFormState(
        readRoomFormData(form)
      );
    };

    form.addEventListener("input", syncDraft);
    form.addEventListener("change", syncDraft);
  }

  function normalizeRoomFormState(state) {
    const normalized = cloneRoomFormState(state);

    normalized.actionIds.sort();

    return normalized;
  }

  function hasUnsavedRoomChanges() {
    if (!roomFormInitialState || !roomFormDraftState) {
      return false;
    }

    return (
      JSON.stringify(
        normalizeRoomFormState(roomFormInitialState)
      ) !==
      JSON.stringify(
        normalizeRoomFormState(roomFormDraftState)
      )
    );
  }

  function confirmDiscardRoomChanges() {
    if (!hasUnsavedRoomChanges()) {
      return true;
    }

    return window.confirm(
      "入力内容が保存されていません。\n変更を破棄してよろしいですか？"
    );
  }

  function clearRoomFormTracking() {
    activeRoomForm = null;
    activeRoomFormKey = null;
    roomFormInitialState = null;
    roomFormDraftState = null;
  }

  function renderRoomCreatorSection(currentPlaceId) {
    /*
     * ROOM全体のラッパー。
     * この要素自体にはカードの見た目を付けない。
     */
    const section = document.createElement("section");
    section.className = "mapRoomSection";

    const account = getCurrentAccount();
    const currentPlace = findPlaceById(currentPlaceId);

    const editingRoom = editingRoomPlaceId
      ? findPlaceById(editingRoomPlaceId)
      : null;

    const canCreateRoom = isAreaPlace(currentPlace);

    /*
     * ROOM見出し。
     * 作成カードと作成済み一覧カードの両方より外側に置く。
     */
    section.appendChild(
      createMapSectionHeading("ROOM")
    );

    /*
     * ルーム作成・編集用のカード。
     */
    const creatorCard = document.createElement("div");
    creatorCard.className = [
      "common-card",
      "common-card-themed",
      "mapRoomCreatorCard"
    ].join(" ");

    const title = document.createElement("h2");
    title.className = "mapRoomCreatorTitle";
    title.textContent = editingRoom
      ? "ルーム編集"
      : "ルーム作成";

    creatorCard.appendChild(title);

    const help = document.createElement("p");
    help.className = "mapRoomCreatorHelp";
    help.textContent =
      "現在いるエリアにルームを作成します。作成後は自動でそのルームへ移動します。";

    creatorCard.appendChild(help);

    /*
     * 現在地と、作成できない場合の注意文。
     */
    const currentRow = document.createElement("div");
    currentRow.className = "mapRoomCurrentRow";

    const currentInfo = document.createElement("p");
    currentInfo.className = "mapRoomCurrentInfo";
    currentInfo.textContent =
      `現在地：${currentPlace?.name ?? "なし"}`;

    currentRow.appendChild(currentInfo);

    if (!editingRoom && !canCreateRoom) {
      const notice = document.createElement("p");
      notice.className = "mapRoomCreatorNotice";
      notice.textContent =
        "※現在地ではルームを作成できません。エリアに移動してください。";

      currentRow.appendChild(notice);
    }

    creatorCard.appendChild(currentRow);

    /*
     * 未ログイン時。
     * 作成カードだけ表示し、作成済み一覧は表示しない。
     */
    if (!account?.eno) {
      const loginNotice = document.createElement("p");
      loginNotice.className = "mapRoomCreatorNotice";
      loginNotice.textContent =
        "ルーム作成・編集にはログインが必要です。";

      creatorCard.appendChild(loginNotice);
      section.appendChild(creatorCard);

      return section;
    }

    /*
     * 入力フォーム。
     */
    const form = document.createElement("form");
    form.className = "mapRoomForm";

    const initialFormState = {
      name: editingRoom?.name ?? "",
      shortDescription:
        editingRoom?.shortDescription ?? "",
      longDescription:
        editingRoom?.longDescription ?? "",

      accessType:
        editingRoom?.accessType === "invite" ||
        editingRoom?.accessType === "private"
          ? editingRoom.accessType
          : "public",

      showParentMainAreaPreview: editingRoom
        ? Boolean(editingRoom.showParentMainAreaPreview)
        : true,

      actionIds:
        editingRoom &&
        Array.isArray(editingRoom.actionIds) &&
        editingRoom.actionIds.includes("look-around")
          ? ["look-around"]
          : editingRoom
            ? []
            : ["look-around"]
    };

    const formKey = createRoomFormKey(
      currentPlaceId,
      editingRoom
    );

    initializeRoomFormTracking(
      formKey,
      initialFormState
    );

    const formState = cloneRoomFormState(
      roomFormDraftState
    );

    const roomName = formState.name;
    const roomShortDescription =
      formState.shortDescription;
    const roomLongDescription =
      formState.longDescription;
    const accessType = formState.accessType;
    const showParentPreview =
      formState.showParentMainAreaPreview;
    const hasLookAround =
      formState.actionIds.includes("look-around");

    form.innerHTML = `
      <label class="mapRoomFormField">
        <span>ルーム名</span>
        <input
          type="text"
          name="roomName"
          value="${escapeHtml(roomName)}"
          maxlength="25"
          required
        >
      </label>

      <label class="mapRoomFormField">
        <span>簡易説明</span>
        <input
          type="text"
          name="roomShortDescription"
          value="${escapeHtml(roomShortDescription)}"
          maxlength="40"
          placeholder="最大40文字"
        >
        <small class="text-muted mapRoomFormHint">
          一覧やヘッダーに出る1行説明です。
        </small>
      </label>

      <label class="mapRoomFormField">
        <span>詳細説明</span>
        <textarea
          name="roomLongDescription"
          maxlength="800"
          rows="5"
          placeholder="最大800文字"
        >${escapeHtml(roomLongDescription)}</textarea>
        <small class="text-muted mapRoomFormHint">
          ルーム詳細に出る説明です。文字装飾が使用可能です。
        </small>
      </label>

      <fieldset class="common-card-subtle mapRoomFormFieldset">
        <legend class="text-muted">
          公開範囲
        </legend>

        <label>
          <input
            type="radio"
            name="roomAccessType"
            value="public"
            ${accessType === "public" ? "checked" : ""}
          >
          公開
        </label>

        <label>
          <input
            type="radio"
            name="roomAccessType"
            value="invite"
            ${accessType === "invite" ? "checked" : ""}
          >
          招待制
        </label>

        <label>
          <input
            type="radio"
            name="roomAccessType"
            value="private"
            ${accessType === "private" ? "checked" : ""}
          >
          非公開
        </label>
      </fieldset>

      <label class="mapRoomFormCheckbox">
        <input
          type="checkbox"
          name="showParentMainAreaPreview"
          ${showParentPreview ? "checked" : ""}
        >
        親エリアの発言を表示する
      </label>

      <label class="mapRoomFormCheckbox">
        <input
          type="checkbox"
          name="actionLookAround"
          ${hasLookAround ? "checked" : ""}
        >
        アクション「周囲を見る」を使えるようにする
      </label>
    `;

    registerActiveRoomForm(form);

    /*
     * 作成・保存ボタン。
     */
    const buttonRow = document.createElement("div");
    buttonRow.className = "mapRoomFormButtonRow";

    const submitButton = document.createElement("button");
    submitButton.type = "submit";
    submitButton.className =
      "button-primaryNew mapRoomFormSubmitButton";
    submitButton.textContent = editingRoom
      ? "変更を保存"
      : "ルームを作成";

    buttonRow.appendChild(submitButton);

    /*
     * 編集中だけキャンセルボタンを表示。
     */
    if (editingRoom) {
      const cancelButton =
        document.createElement("button");

      cancelButton.type = "button";
      cancelButton.className =
        "button-box mapRoomFormSecondaryButton";
      cancelButton.textContent = "編集をやめる";

      cancelButton.addEventListener("click", () => {
        if (!confirmDiscardRoomChanges()) {
          return;
        }

        clearRoomFormTracking();
        editingRoomPlaceId = null;
        renderMapTree();
      });

      buttonRow.appendChild(cancelButton);
    }

    form.appendChild(buttonRow);

if (editingRoom) {
  const dangerSection = document.createElement("details");
  dangerSection.className = "mapRoomDangerSection";

  const dangerSummary = document.createElement("summary");
  dangerSummary.className = "mapRoomDangerSummary";
  dangerSummary.textContent = "ルームの削除";

  const dangerContent = document.createElement("div");
  dangerContent.className = "mapRoomDangerContent";

  const confirmLabel = document.createElement("label");
  confirmLabel.className =
    "mapRoomFormCheckbox mapRoomDeleteConfirm";

  const confirmCheckbox = document.createElement("input");
  confirmCheckbox.type = "checkbox";
  confirmCheckbox.name = "confirmRoomDelete";

  const confirmText = document.createTextNode(
    "削除すると元に戻せないことを確認しました"
  );

  confirmLabel.append(
    confirmCheckbox,
    confirmText
  );

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className =
    "button-box mapRoomDeleteButton";
  deleteButton.textContent = "ルームを削除";
  deleteButton.disabled = true;

  confirmCheckbox.addEventListener("change", () => {
    deleteButton.disabled = !confirmCheckbox.checked;
  });

  deleteButton.addEventListener("click", () => {
    const confirmed = window.confirm(
      `「${editingRoom.name}」を削除します。\nこの操作は取り消せません。\n本当に削除しますか？`
    );

    if (!confirmed) {
      return;
    }

    const result = deleteRoom(editingRoom.placeId, {
      ownerEno: account.eno
    });

    if (!result.ok) {
      showToast(result.message, {
        type: "error"
      });
      return;
    }

    clearRoomFormTracking();
    editingRoomPlaceId = null;

    if (currentPlaceId === editingRoom.placeId) {
      sessionStorage.setItem(
        "chatToastMessage",
        JSON.stringify({
          message: result.message,
          type: "success"
        })
      );

      moveToPlace(result.parentPlaceId);
      return;
    }

    showToast(result.message, {
      type: "success"
    });

    renderMapTree();
  });

  dangerContent.append(
    confirmLabel,
    deleteButton
  );

  dangerSection.append(
    dangerSummary,
    dangerContent
  );

  form.appendChild(dangerSection);
}

    form.addEventListener("submit", event => {
      event.preventDefault();

      const input = readRoomFormData(form);

      const result = editingRoom
        ? updateRoom(editingRoom.placeId, {
            ...input,
            ownerEno: account.eno
          })
        : createRoom({
            ...input,
            parentId: currentPlaceId,
            ownerEno: account.eno
          });

      if (!result.ok) {
        showToast(result.message, {
          type: "error"
        });

        return;
      }

      if (editingRoom) {
        sessionStorage.setItem(
          "chatToastMessage",
          JSON.stringify({
            message: result.message,
            type: "success"
          })
        );

        clearRoomFormTracking();
        window.location.reload();
        return;
      }

      clearRoomFormTracking();

      showToast(result.message, {
        type: "success"
      });

      moveToPlace(result.room.placeId);
    });

    /*
     * 新規作成時、現在地がエリアでなければフォームを無効化。
     * 編集中は現在地に関係なく編集可能。
     */
    if (!editingRoom && !canCreateRoom) {
      form
        .querySelectorAll(
          "input, textarea, button"
        )
        .forEach(element => {
          element.disabled = true;
        });
    }

    /*
     * フォームは作成カード内に入れる。
     */
    creatorCard.appendChild(form);

    /*
     * ROOM見出しの下に、
     * 作成カードと作成済み一覧カードを別々に追加する。
     */
    section.appendChild(creatorCard);
    section.appendChild(
      renderOwnedRoomList(account.eno)
    );

    return section;
  }

  function renderOwnedRoomList(ownerEno) {
    const wrapper = document.createElement("div");

    wrapper.className = [
      "common-card",
      "common-card-themed",
      "common-card-surface",
      "mapOwnedRoomListSection"
    ].join(" ");

    const title = document.createElement("h2");
    title.className =
      "mapRoomCreatorTitle mapOwnedRoomListTitle";
    title.textContent =
      "作成済みルーム一覧";

    wrapper.appendChild(title);

    const rooms = getRoomsByOwnerEno(ownerEno);

    if (rooms.length === 0) {
      const empty = document.createElement("p");
      empty.className = "mapNoRoomText";
      empty.textContent =
        "作成済みルームはありません。";

      wrapper.appendChild(empty);

      return wrapper;
    }

    const list = document.createElement("div");
    list.className = "mapOwnedRoomList";

    rooms.forEach(room => {
      const row = document.createElement("div");
      row.className = "mapOwnedRoomRow";

      const name = document.createElement("span");
      name.className = "mapOwnedRoomName";
      name.textContent =
        `${room.name} [${getRoomAccessLabel(room.accessType)}]`;

      row.appendChild(name);

      const editButton =
        document.createElement("button");

      editButton.type = "button";
      editButton.className =
        "button-box mapMoveButton";
      editButton.textContent = "編集";

      editButton.addEventListener("click", () => {
        /*
         * 現在編集中のルームと同じなら何もしない。
         */
        if (
          editingRoomPlaceId === room.placeId
        ) {
          return;
        }

        if (!confirmDiscardRoomChanges()) {
          return;
        }

        clearRoomFormTracking();
        editingRoomPlaceId = room.placeId;
        renderMapTree();
      });

      row.appendChild(editButton);
      list.appendChild(row);
    });

    wrapper.appendChild(list);

    return wrapper;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  return {
    renderRoomCreatorSection,
    confirmDiscardRoomChanges,
    clearRoomFormTracking,
    hasUnsavedRoomChanges
  };
}
