let openBtn: HTMLElement = document.createElement("button")
openBtn.innerText = "Combat Misinformation"
openBtn.id = "open-btn"
openBtn.style.display = "none"
document.body.appendChild(openBtn)

let selectedText: string = "";

document.addEventListener("selectionchange", () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
        openBtn.style.display = "none";
        return;
    }

    selectedText = selection.toString().trim();
    if (!selectedText) {
        openBtn.style.display = "none";
        return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    openBtn.style.position = "absolute";
    openBtn.style.left = `${rect.left + window.scrollX + 5}px`;
    openBtn.style.top = `${rect.bottom + window.scrollY - 5}px`;
    openBtn.style.display = "block";
});

openBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(`"${selectedText}"`).then(() => {
        alert("Quoted: " + selectedText);
    });

    window.location.href = "https://www.google.com";

    openBtn.style.display = "none";
});