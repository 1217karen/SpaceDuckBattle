//new-battlelog-cutin.js

function getCutinElements() {
  return {
    overlay: document.getElementById("cutinOverlay"),
    image: document.getElementById("cutinImage")
  };
}

export function hideCutin() {
  const { overlay, image } = getCutinElements();

  if (image) {
    image.src = "";
  }

  if (overlay) {
    overlay.classList.add("hidden");
  }
}

export function showCutin({ imageUrl }) {
  const { overlay, image } = getCutinElements();

  if (!overlay || !image) return;
  if (!imageUrl) return;

  image.src = imageUrl;
  overlay.classList.remove("hidden");
}
