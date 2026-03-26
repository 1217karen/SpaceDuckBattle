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
    image.classList.remove("cutinAnimate");
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

  image.classList.remove("cutinAnimate");

  image.src = imageUrl;
  overlay.classList.remove("hidden");

  void image.offsetWidth;

  image.classList.add("cutinAnimate");
}
