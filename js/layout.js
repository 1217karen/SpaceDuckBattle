export function toggleLeftPanel(){

  const panel =
  document.querySelector(".left-panel");

  if(!panel)return;

  panel.classList.toggle("open");

}

export function toggleRightPanel(){

  const panel =
  document.querySelector(".right-panel");

  if(!panel)return;

  panel.classList.toggle("open");

}
