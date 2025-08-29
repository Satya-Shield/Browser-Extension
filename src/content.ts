let e = document.createElement("button");
e.innerText = "Combat Misinformation";
e.id = "open-btn";
e.style.display = "none";
document.body.appendChild(e);

let i = "";
let l = [];

function d(t) {
  return t.replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#39;");
}

document.addEventListener("selectionchange", () => {
  const t = window.getSelection();
  if (!t || t.isCollapsed) {
    e.style.display = "none";
    i = "";
    l = [];
    return;
  }

  i = t.toString().trim();
  l = [];

  if (t.rangeCount > 0) {
    const o = t.getRangeAt(0);
    const n = document.createElement("div");
    n.appendChild(o.cloneContents());
    n.querySelectorAll("img").forEach(c => {
      const s = c.src;
      if (s) l.push(s);
    });

    if (!i && l.length === 0) {
      e.style.display = "none";
      return;
    }

    const r = o.getBoundingClientRect();
    e.style.position = "absolute";
    e.style.left = `${r.left + window.scrollX + 5}px`;
    e.style.top = `${r.bottom + window.scrollY - 5}px`;
    e.style.display = "block";
  } else {
    e.style.display = "none";
  }
});

e.addEventListener("click", async () => {
  e.disabled = true;
  try {
    const clipboard = navigator.clipboard;

    if (l.length > 0 && clipboard && clipboard.write) {
      const items = [];

      if (i) {
        const plainBlob = new Blob([i], { type: "text/plain" });
        const htmlBlob = new Blob([`<div>${d(i)}</div>`], { type: "text/html" });
        items.push(new window.ClipboardItem({
          "text/plain": plainBlob,
          "text/html": htmlBlob
        }));
      }
      for (const src of l) {
        try {
          const res = await fetch(src, { mode: "cors" });
          if (!res.ok) throw new Error("Image fetch failed: " + res.status);
          const blob = await res.blob();
          items.push(new window.ClipboardItem({ [blob.type]: blob }));
        } 
        catch (imgErr) {
          console.warn("Couldn't fetch image blob, will fallback to URL:", src, imgErr);
        }
      }

      if (items.length > 0) {
        try {
          await clipboard.write(items);
          alert("Copied selection (text + images where supported).");
        } catch (writeErr) {
          console.warn("clipboard.write failed:", writeErr);
          const fallback = buildFallbackText(i, l);
          await safeWriteText(fallback);
          alert("Binary clipboard write failed — copied text + image URLs instead.");
        }
      } 
      else {
        const fallback = buildFallbackText(i, l);
        await safeWriteText(fallback);
        alert("Copied text and image URLs to clipboard (binary image copy not available).");
      }
    } 
    else {
      if (i) {
        await safeWriteText(`"${i}"`);
        alert("Quoted: " + i);
      }
      else if (l.length) {
        await safeWriteText(l.join("\n"));
        alert("Image URL(s) copied to clipboard.");
      }
    }

    window.location.href = "https://www.google.com";
  } 
  catch (t) {
    console.error("Clipboard operation failed:", t);
    try {
      // final fallback: try to copy textual fallback
      const fallback = buildFallbackText(i, l);
      if (fallback) {
        await safeWriteText(fallback);
        alert("Fallback copied to clipboard.");
      } 
      else {
        alert("Nothing to copy.");
      }
    } 
    catch (o) {
      console.error("Fallback copy failed:", o);
      alert("Copy failed — see console.");
    } 
    finally {
      window.location.href = "https://www.google.com";
    }
  } 
  finally {
    e.disabled = false;
    e.style.display = "none";
  }
});

function buildFallbackText(text, imgSrcs) {
  let out = text || "";
  if (imgSrcs && imgSrcs.length) {
    out += (out ? "\n\n" : "") + "Image URLs:\n" + imgSrcs.join("\n");
  }
  return out;
}

async function safeWriteText(s) {
  if (!navigator.clipboard || !navigator.clipboard.writeText) {
    throw new Error("navigator.clipboard.writeText not available");
  }
  return navigator.clipboard.writeText(s);
}
