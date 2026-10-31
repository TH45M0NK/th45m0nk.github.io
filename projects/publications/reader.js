/* ===========================================================
   Publications page: finds every PDF in pdfs/, draws a thumbnail
   of its first page, and opens it in a built-in reader.
   Uses pdf.js (Mozilla's PDF viewer library).
   =========================================================== */

(() => {
  const { el, listFolder, titleFromFile } = TH45;
  const FOLDER = "projects/publications/pdfs";
  const list = document.getElementById("doc-list");

  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

  const docs = new Map(); // file name -> loaded pdf.js document

  const load = (file) => {
    if (!docs.has(file)) docs.set(file, pdfjsLib.getDocument(`pdfs/${encodeURIComponent(file)}`).promise);
    return docs.get(file);
  };

  async function drawThumb(file, holder, meta) {
    try {
      const pdf = await load(file);
      const page = await pdf.getPage(1);
      const base = page.getViewport({ scale: 1 });
      const scale = (holder.clientWidth * Math.min(devicePixelRatio, 2)) / base.width;
      const vp = page.getViewport({ scale });
      const canvas = el("canvas", { width: Math.round(vp.width), height: Math.round(vp.height), "aria-hidden": "true" });
      await page.render({ canvasContext: canvas.getContext("2d"), viewport: vp }).promise;
      holder.replaceChildren(canvas);
      meta.textContent += ` · ${pdf.numPages} pages`;
    } catch {
      holder.replaceChildren(el("span", { class: "empty-note", text: "PDF" }));
    }
  }

  function card(file) {
    const info = PUBLICATIONS[file] || {};
    const title = info.title || titleFromFile(file);
    const thumb = el("span", { class: "doc-thumb" });
    const meta = el("span", { class: "doc-meta", text: [info.year, info.venue].filter(Boolean).join(" · ") || "PDF" });
    const button = el(
      "button",
      { class: "doc-card", type: "button", onclick: () => reader.open(file, title, info) },
      thumb,
      el("span", { class: "doc-title", text: title }),
      info.authors ? el("span", { class: "doc-meta", text: info.authors }) : null,
      meta,
    );
    // draw the thumbnail once the card is near the screen
    new IntersectionObserver((entries, obs) => {
      if (entries.some((e) => e.isIntersecting)) {
        obs.disconnect();
        drawThumb(file, thumb, meta);
      }
    }, { rootMargin: "200px" }).observe(thumb);
    return el("li", {}, button);
  }

  /* ---------- the reader ---------- */

  const reader = (() => {
    let dialog, titleBox, pagesBox, pageInfo, zoomInfo, download;
    let current = null;
    let zoom = 1;
    let observer;

    function build() {
      titleBox = el("div", { class: "viewer-title" });
      pageInfo = el("span", { class: "reader-zoom" });
      zoomInfo = el("span", { class: "reader-zoom", text: "100%" });
      download = el("a", { class: "viewer-btn", text: "Download", download: "" });
      pagesBox = el("div", { class: "reader-pages" });
      dialog = el(
        "dialog",
        { class: "viewer", "aria-label": "PDF reader" },
        el(
          "div",
          { class: "viewer-bar" },
          titleBox,
          pageInfo,
          el("button", { class: "viewer-btn", type: "button", "aria-label": "Zoom out", text: "−", onclick: () => setZoom(zoom - 0.25) }),
          zoomInfo,
          el("button", { class: "viewer-btn", type: "button", "aria-label": "Zoom in", text: "+", onclick: () => setZoom(zoom + 0.25) }),
          download,
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

    async function layout() {
      const pdf = await load(current);
      observer?.disconnect();
      const first = (await pdf.getPage(1)).getViewport({ scale: 1 });
      const fitWidth = Math.min(pagesBox.clientWidth - 32, 900);
      const cssW = fitWidth * zoom;
      const cssH = cssW * (first.height / first.width);
      const slots = [];
      for (let n = 1; n <= pdf.numPages; n++) {
        slots.push(el("div", { class: "reader-page", "data-page": n, style: `width:${cssW}px;height:${cssH}px` }));
      }
      pagesBox.replaceChildren(...slots);
      pageInfo.textContent = `1 / ${pdf.numPages}`;

      // render pages only when they come close to the screen
      observer = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            const slot = e.target;
            if (e.isIntersecting && !slot.dataset.done) {
              slot.dataset.done = "1";
              renderPage(pdf, slot, cssW);
            }
            if (e.isIntersecting && e.intersectionRatio > 0.3) pageInfo.textContent = `${slot.dataset.page} / ${pdf.numPages}`;
          }
        },
        { root: pagesBox, rootMargin: "600px 0px", threshold: [0, 0.3] },
      );
      slots.forEach((s) => observer.observe(s));
    }

    async function renderPage(pdf, slot, cssW) {
      const page = await pdf.getPage(Number(slot.dataset.page));
      const base = page.getViewport({ scale: 1 });
      const vp = page.getViewport({ scale: (cssW * Math.min(devicePixelRatio, 2)) / base.width });
      const canvas = el("canvas", { width: Math.round(vp.width), height: Math.round(vp.height) });
      slot.style.height = `${cssW * (base.height / base.width)}px`;
      await page.render({ canvasContext: canvas.getContext("2d"), viewport: vp }).promise;
      slot.replaceChildren(canvas);
    }

    function open(file, title, info) {
      if (!dialog) build();
      current = file;
      titleBox.textContent = info.year ? `${title} · ${info.year}` : title;
      download.href = `pdfs/${encodeURIComponent(file)}`;
      zoom = 1;
      zoomInfo.textContent = "100%";
      pagesBox.replaceChildren(el("p", { class: "doc-meta", text: "Opening…" }));
      dialog.showModal();
      document.body.style.overflow = "hidden";
      pagesBox.scrollTop = 0;
      layout();
    }

    return { open };
  })();

  /* ---------- find the PDFs ---------- */

  async function start() {
    let files;
    try {
      files = await listFolder(FOLDER, [".pdf"]);
    } catch {
      files = Object.keys(PUBLICATIONS); // GitHub unreachable: use the list
    }
    if (!files.length) {
      list.replaceWith(el("p", { class: "empty-note", text: "Publications coming soon." }));
      return;
    }
    // newest first when a year is known, the rest after
    files.sort((a, b) => (PUBLICATIONS[b]?.year || 0) - (PUBLICATIONS[a]?.year || 0) || a.localeCompare(b));
    list.replaceChildren(...files.map(card));
  }

  start();
})();
