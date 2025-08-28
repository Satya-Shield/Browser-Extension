let openBtn : HTMLElement = document.createElement("button")
openBtn.innerText = "Combat Misinformation"
openBtn.id = "open-btn"
openBtn.style.display = "none"
document.body.appendChild(openBtn)

let selectedText: string = "";

document.addEventListener("mouseup", (e: MouseEvent) => {
  const selection = window.getSelection()?.toString().trim() || "";

  if (selection.length > 0) {
    selectedText = selection;

    openBtn.style.left = `${e.pageX}px`;
    openBtn.style.top = `${e.pageY}px`;
    openBtn.style.display = "block";
  } else {
    openBtn.style.display = "none";
  }
});
