const openBtn = document.createElement("button");
openBtn.id = "open-btn";
openBtn.innerText = "Combat Misinformation";
openBtn.style.display = "none";
openBtn.style.position = "absolute";
openBtn.style.zIndex = "9999";
openBtn.style.userSelect = "none";
document.body.appendChild(openBtn);
let selectedText = "";
let selectedImageSrc: string | null = null;

function findImageSrcInRange(range: Range): string | null {
  // Try cloneContents() (works for many cases)
  const frag = range.cloneContents();
  const img = frag.querySelector && frag.querySelector("img");
  if (img && img.src) return img.src;

  // Fallback: check commonAncestorContainer for an <img> near the selection
  let node: Node | null = range.commonAncestorContainer;
  if (node.nodeType === Node.TEXT_NODE) node = node.parentNode;
  if (node && (node as Element).querySelector) {
    const img2 = (node as Element).querySelector("img");
    if (img2 && (img2 as HTMLImageElement).src) return (img2 as HTMLImageElement).src;
  }

  // Also check anchor/focus node directly (selection might be on an <img>)
  return null;
}

document.addEventListener("selectionchange", () => {
  const sel = window.getSelection();
  selectedText = "";
  selectedImageSrc = null;

  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
    openBtn.style.display = "none";
    return;
  }

  selectedText = sel.toString().trim();
  const range = sel.getRangeAt(0);

  // If there's text, show for text
  if (selectedText) {
    selectedImageSrc = null;
  }
  else {
    const imgSrc = findImageSrcInRange(range);
    if (imgSrc) selectedImageSrc = imgSrc;
  }

  if (!selectedText && !selectedImageSrc) {
    openBtn.style.display = "none";
    return;
  }
  const rect = range.getBoundingClientRect();
  openBtn.style.left = `${rect.left + window.scrollX + 5}px`;
  openBtn.style.top = `${rect.bottom + window.scrollY - 5}px`;
  openBtn.style.display = "block";
});

openBtn.addEventListener("click", async () => {
  openBtn.disabled = true;
  try {
    if (selectedText) {
      // copy quoted text
      await navigator.clipboard.writeText(`"${selectedText}"`);
      alert("Quoted: " + selectedText);
    } else if (selectedImageSrc) {
      // Try to copy the actual image (preferred). If not supported, fallback to copying the URL.
      try {
        // fetch the image as blob
        const res = await fetch(selectedImageSrc, { mode: "cors" });
        const blob = await res.blob();

        const item = new ClipboardItem({ [blob.type]: blob });
        // navigator.clipboard.write([item]) requires secure context + browser support
        await navigator.clipboard.write([item]);
        alert("Image copied to clipboard.");
      } 
      catch (imgErr) {
        await navigator.clipboard.writeText(selectedImageSrc);
        alert("Image URL copied to clipboard: " + selectedImageSrc);
      }
    }
    // navigate only after successful copy
    window.location.href = "https://www.google.com";
  } 
  catch (err) {
    console.error("Copy failed:", err);
    alert("Copy failed — see console for details.");
  } 
  finally {
    openBtn.disabled = false;
    openBtn.style.display = "none";
  }
});
