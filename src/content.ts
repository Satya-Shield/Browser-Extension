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
    // Collect images touched by any range in the selection
    for (let ri = 0; ri < t.rangeCount; ri++) {
      const range = t.getRangeAt(ri);

      // 1) If the selection node itself is an <img> (some browsers set anchor/focus to the img)
      const anchor = t.anchorNode;
      const focus = t.focusNode;
      [anchor, focus].forEach(node => {
        if (node && node.nodeType === 1 && node.tagName && node.tagName.toLowerCase() === "img") {
          const src = node.src;
          if (src && !l.includes(src)) l.push(src);
        } else if (node && node.nodeType === 3 && node.parentElement && node.parentElement.tagName.toLowerCase() === "img") {
          // rare: text node inside an <img> wrapper (very uncommon) — attempt to grab parent img
          const src = node.parentElement.src;
          if (src && !l.includes(src)) l.push(src);
        }
      });

      // 2) Find candidate images under the range's common ancestor and test intersection
      let ca = range.commonAncestorContainer;
      // normalize to Element
      if (ca.nodeType === 3) ca = ca.parentElement || document.body;

      try {
        const imgs = ca.querySelectorAll && ca.querySelectorAll("img") || [];
        imgs.forEach(img => {
          // Range.intersectsNode is widely supported and tells us if the range touches the node
          if (typeof range.intersectsNode === "function") {
            if (range.intersectsNode(img)) {
              const src = img.src;
              if (src && !l.includes(src)) l.push(src);
            }
          } else {
            // fallback: use bounding rect overlap if intersectsNode isn't available
            const rect = range.getBoundingClientRect();
            const iRect = img.getBoundingClientRect();
            const overlap = !(iRect.right < rect.left || iRect.left > rect.right || iRect.bottom < rect.top || iRect.top > rect.bottom);
            if (overlap) {
              const src = img.src;
              if (src && !l.includes(src)) l.push(src);
            }
          }
        });
      } catch (err) {
        // defensive: if querySelector fails for weird nodes, ignore and continue
        console.warn("image detection error:", err);
      }
    }

    // if still nothing selected and no text, hide
    if (!i && l.length === 0) {
      e.style.display = "none";
      return;
    }

    // Use the first range for positioning (same as before)
    const r = t.getRangeAt(0).getBoundingClientRect();
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
    // Always copy plain text payload when images are present (you said you want URLs only).
    if (l.length > 0) {
      let payload = "";
      if (i) payload = `"${i}"`;
      if (l.length) {
        payload += (payload ? "\n\n" : "") + "Image URLs:\n" + l.join("\n");
      }
      await safeWriteText(payload);
      alert("Copied text and image URL(s) to clipboard.");
    } else {
      if (i) {
        await safeWriteText(`"${i}"`);
        alert("Quoted: " + i);
      } else {
        alert("Nothing to copy.");
      }
    }

    window.location.href = "https://www.google.com";
  } catch (t) {
    console.error("Clipboard operation failed:", t);
    try {
      const fallback = buildFallbackText(i, l);
      if (fallback) {
        await safeWriteText(fallback);
        alert("Fallback copied to clipboard.");
      } else {
        alert("Nothing to copy.");
      }
    } catch (o) {
      console.error("Fallback copy failed:", o);
      alert("Copy failed — see console.");
    } finally {
      window.location.href = "https://www.google.com";
    }
  } finally {
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
