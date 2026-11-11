/* ===========================================================
   Publications page: a card for every paper in list.js, and a
   reader that shows the preview pages (images in previews/).
   The full PDFs are not on the website, so there is nothing to
   download: the reader ends with a note instead.
   =========================================================== */

(() => {
  const { el } = TH45;
  const list = document.getElementById("doc-list");
  const src = (id, n) => `previews/${id}-${n}.webp`;

  // Pages are drawn onto a canvas (no image to right-click and save,
  // nothing to drag out of the page).
  function drawPage(url, canvas) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext("2d").drawImage(img, 0, 0);
        resolve(true);
      };
      img.onerror = () => resolve(false);
      img.src = url;
    });
  }

  const guard = (node) => {
    node.addEventListener("contextmenu", (e) => e.preventDefault());
    node.addEventListener("dragstart", (e) => e.preventDefault());
    return node;
  };

  function card(id) {
    const info = PUBLICATIONS[id];
    const canvas = el("canvas", { "aria-hidden": "true" });
    const thumb = el("span", { class: "doc-thumb" }, canvas);
    const meta = [info.year, info.venue, info.pages && `${info.pages} pages`].filter(Boolean).join(" · ");
    const button = el(
      "button",
      { class: "doc-card", type: "button", onclick: () => reader.open(id) },
      thumb,
      el("span", { class: "doc-title", text: info.title }),
      info.authors ? el("span", { class: "doc-meta", text: info.authors }) : null,
      el("span", { class: "doc-meta", text: meta }),
    );
    new IntersectionObserver((entries, obs) => {
      if (entries.some((e) => e.isIntersecting)) {
        obs.disconnect();
        drawPage(src(id, 1), canvas);
      }
    }, { rootMargin: "200px" }).observe(thumb);
    return el("li", {}, guard(button));
  }

  /* ---------- the reader ---------- */

  const reader = (() => {
    let dialog, titleBox, pagesBox, pageInfo, zoomInfo;
    let current = null;
    let zoom = 1;

    function build() {
      titleBox = el("div", { class: "viewer-title" });
      pageInfo = el("span", { class: "reader-zoom" });
      zoomInfo = el("span", { class: "reader-zoom", text: "100%" });
      pagesBox = guard(el("div", { class: "reader-pages" }));
      dialog = el(
        "dialog",
        { class: "viewer", "aria-label": "Publication preview" },
        el(
          "div",
          { class: "viewer-bar" },
          titleBox,
          pageInfo,
          el("button", { class: "viewer-btn", type: "button", "aria-label": "Zoom out", text: "−", onclick: () => setZoom(zoom - 0.25) }),
          zoomInfo,
          el("button", { class: "viewer-btn", type: "button", "aria-label": "Zoom in", text: "+", onclick: () => setZoom(zoom + 0.25) }),
          el("button", { class: "viewer-btn", type: "button", text: "Close ✕", onclick: () => dialog.close() }),
        ),
        pagesBox,
      );
      dialog.addEventListener("close", () => {
        pagesBox.replaceChildren();
        document.body.style.overflow = "";
        current = null;
      });
      document.body.append(dialog);
    }

    function setZoom(z) {
      zoom = Math.min(3, Math.max(0.5, z));
      zoomInfo.textContent = `${Math.round(zoom * 100)}%`;
      if (current) layout();
    }

    function layout() {
      const info = PUBLICATIONS[current];
      const shown = Math.min(info.preview || 2, info.pages || Infinity);
      const width = Math.min(pagesBox.clientWidth - 32, 900) * zoom;
      const pages = [];
      for (let n = 1; n <= shown; n++) {
        const canvas = el("canvas", { "aria-label": `Page ${n}` });
        pages.push(el("div", { class: "reader-page", style: `width:${width}px` }, canvas));
        drawPage(src(current, n), canvas);
      }
      const rest = info.pages ? info.pages - shown : 0;
      const note = el(
        "div",
        { class: "reader-end", style: `width:${width}px` },
        el("strong", { text: "End of the preview" }),
        el("p", {
          text: rest > 0
            ? `You have seen the first ${shown} of ${info.pages} pages. The full paper isn't available on this website.`
            : "The full paper isn't available on this website.",
        }),
        info.venue ? el("p", { class: "doc-meta", text: info.venue }) : null,
      );
      pagesBox.replaceChildren(...pages, note);
      pageInfo.textContent = info.pages ? `${shown} of ${info.pages} pages` : "";
    }

    function open(id) {
      if (!dialog) build();
      const info = PUBLICATIONS[id];
      current = id;
      titleBox.textContent = info.year ? `${info.title} · ${info.year}` : info.title;
      zoom = 1;
      zoomInfo.textContent = "100%";
      dialog.showModal();
      document.body.style.overflow = "hidden";
      pagesBox.scrollTop = 0;
      layout();
    }

    return { open };
  })();

  /* ---------- the list ---------- */

  const ids = Object.keys(PUBLICATIONS).sort(
    (a, b) => (PUBLICATIONS[b].year || 0) - (PUBLICATIONS[a].year || 0) || a.localeCompare(b),
  );
  if (!ids.length) list.replaceWith(el("p", { class: "empty-note", text: "Publications coming soon." }));
  else list.replaceChildren(...ids.map(card));
})();
