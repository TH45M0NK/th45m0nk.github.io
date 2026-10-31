/* ===========================================================
   Shared code for the Projects sections:
   - puzzle(): justified "puzzle" layout for videos and artworks
   - viewer:   pop-up video player and image lightbox
   - listFolder(): reads a folder of this repository on GitHub,
                   so new photos / PDFs show up automatically
   =========================================================== */

const TH45 = (() => {
  const REPO = "TH45M0NK/th45m0nk.github.io";
  const BRANCH = "main";

  /* ---------- small helpers ---------- */

  const el = (tag, attrs = {}, ...kids) => {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v === undefined || v === null || v === false) continue;
      if (k === "class") node.className = v;
      else if (k === "text") node.textContent = v;
      else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v === true ? "" : v);
    }
    for (const kid of kids.flat()) if (kid) node.append(kid);
    return node;
  };

  const storage = {
    get(key) {
      try {
        const raw = sessionStorage.getItem(key);
        if (!raw) return null;
        const { time, value } = JSON.parse(raw);
        return Date.now() - time < 10 * 60 * 1000 ? value : null;
      } catch {
        return null;
      }
    },
    set(key, value) {
      try {
        sessionStorage.setItem(key, JSON.stringify({ time: Date.now(), value }));
      } catch {
        /* private mode etc. — nothing to do */
      }
    },
  };

  /* ---------- YouTube ---------- */

  const ytThumb = (id) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

  function videoTile(video) {
    const vertical = video.type === "v";
    return el(
      "button",
      {
        class: "tile",
        type: "button",
        "aria-label": `Play ${video.title} (${video.year})`,
        onclick: () => viewer.video(video),
      },
      el("img", {
        src: ytThumb(video.id),
        alt: "",
        loading: "lazy",
        decoding: "async",
        width: vertical ? 270 : 480,
        height: vertical ? 480 : 270,
      }),
      el("span", { class: "tile-play", "aria-hidden": "true" }),
      el(
        "span",
        { class: "tile-caption" },
        el("b", { text: video.title }),
        el("span", { text: String(video.year) }),
      ),
    );
  }

  /* ---------- puzzle layout ----------
     Every row is scaled so it fills the full width exactly, so the
     whole block is always one clean rectangle. Two horizontal videos
     can stack into one piece, and four vertical ones can form a 2×2
     piece, which gives the "puzzle" look.                           */

  const ASPECT = { h: 16 / 9, v: 9 / 16 };

  // Groups a list of videos into puzzle pieces.
  function composeVideos(videos) {
    const pieces = [];
    let last = null;
    for (let i = 0; i < videos.length; ) {
      const a = videos[i];
      const next = videos.slice(i + 1, i + 4);
      if (a.type === "h" && next[0]?.type === "h" && last && last !== "stack") {
        pieces.push({ kind: "stack", items: [a, next[0]] });
        last = "stack";
        i += 2;
      } else if (a.type === "v" && last === "single-v" && next.length === 3 && next.every((n) => n.type === "v")) {
        pieces.push({ kind: "quad", items: [a, ...next] });
        last = "quad";
        i += 4;
      } else {
        pieces.push({ kind: "single", items: [a] });
        last = a.type === "v" ? "single-v" : "single-h";
        i += 1;
      }
    }
    return pieces;
  }

  // width of a piece = a * rowHeight + b   (b corrects for the inner gaps)
  function pieceShape(piece, gap) {
    if (piece.kind === "stack") {
      const a = ASPECT[piece.items[0].type] / 2;
      return { a, b: -a * gap };
    }
    if (piece.kind === "quad") {
      const a = ASPECT.v;
      return { a, b: gap * (1 - a) };
    }
    return { a: piece.aspect ?? ASPECT[piece.items[0].type], b: 0 };
  }

  // Splits the pieces into rows so every row height is close to the
  // target height (dynamic programming over all possible row breaks).
  function planRows(shapes, width, gap, target) {
    const n = shapes.length;
    const best = new Array(n + 1).fill(Infinity);
    const from = new Array(n + 1).fill(0);
    best[0] = 0;
    for (let end = 1; end <= n; end++) {
      let sumA = 0;
      let sumB = 0;
      for (let start = end - 1; start >= 0; start--) {
        sumA += shapes[start].a;
        sumB += shapes[start].b;
        const count = end - start;
        const h = (width - gap * (count - 1) - sumB) / sumA;
        if (h < target * 0.35) break; // row too crowded
        const cost = best[start] + ((h - target) / target) ** 2;
        if (cost < best[end]) {
          best[end] = cost;
          from[end] = start;
        }
      }
    }
    const rows = [];
    for (let end = n; end > 0; end = from[end]) rows.unshift([from[end], end]);
    return rows;
  }

  function puzzle(container, pieces, buildPiece) {
    const gap = parseFloat(getComputedStyle(container).getPropertyValue("--gap")) || 6;
    let lastWidth = 0;

    const render = () => {
      const width = container.clientWidth;
      if (!width || Math.abs(width - lastWidth) < 2) return;
      lastWidth = width;
      const target = width < 520 ? width * 0.62 : width < 900 ? 240 : 290;
      const shapes = pieces.map((p) => pieceShape(p, gap));
      const rows = planRows(shapes, width, gap, target);

      container.replaceChildren(
        ...rows.map(([start, end]) => {
          const slice = shapes.slice(start, end);
          const sumA = slice.reduce((s, x) => s + x.a, 0);
          const sumB = slice.reduce((s, x) => s + x.b, 0);
          const h = (width - gap * (end - start - 1) - sumB) / sumA;
          return el(
            "div",
            { class: "puzzle-row" },
            pieces.slice(start, end).map((piece, k) => {
              const w = slice[k].a * h + slice[k].b;
              const node = buildPiece(piece);
              node.style.width = `${w}px`;
              node.style.height = `${h}px`;
              node.style.flex = "none";
              return node;
            }),
          );
        }),
      );
      container.classList.add("is-laid-out");
    };

    render();
    new ResizeObserver(() => requestAnimationFrame(render)).observe(container);
  }

  function videoPuzzle(container, videos) {
    puzzle(container, composeVideos(videos), (piece) => {
      if (piece.kind === "single") return videoTile(piece.items[0]);
      const box = el("div", { class: piece.kind === "stack" ? "puzzle-stack" : "puzzle-quad" });
      for (const v of piece.items) {
        const t = videoTile(v);
        t.style.flex = "1";
        box.append(t);
      }
      return box;
    });
  }

  // Artworks: every piece is one image with its own proportions.
  function imagePuzzle(container, items, onOpen) {
    const pieces = items.map((item, index) => ({ kind: "single", aspect: item.w / item.h, item, index }));
    puzzle(container, pieces, (piece) =>
      el(
        "button",
        {
          class: "tile",
          type: "button",
          "aria-label": `Open ${piece.item.title}`,
          onclick: () => onOpen(piece.index),
        },
        el("img", { src: piece.item.thumb, alt: piece.item.title, loading: "lazy", decoding: "async" }),
        el(
          "span",
          { class: "tile-caption" },
          el("b", { text: piece.item.title }),
          piece.item.year ? el("span", { text: String(piece.item.year) }) : null,
        ),
      ),
    );
  }

  /* ---------- pop-up viewer ---------- */

  const viewer = (() => {
    let dialog, title, stage, foot, extra, prevBtn, nextBtn;
    let gallery = [];
    let index = 0;
    let touchX = null;

    function build() {
      if (dialog) return;
      title = el("div", { class: "viewer-title" });
      extra = el("span");
      const close = el("button", { class: "viewer-btn", type: "button", text: "Close ✕", onclick: () => dialog.close() });
      stage = el("div", { class: "viewer-stage" });
      prevBtn = el("button", { class: "viewer-nav prev", type: "button", "aria-label": "Previous", text: "‹", onclick: () => step(-1) });
      nextBtn = el("button", { class: "viewer-nav next", type: "button", "aria-label": "Next", text: "›", onclick: () => step(1) });
      foot = el("div", { class: "viewer-foot" });
      dialog = el(
        "dialog",
        { class: "viewer", "aria-label": "Viewer" },
        el("div", { class: "viewer-bar" }, title, extra, close),
        stage,
        foot,
      );
      dialog.addEventListener("close", () => {
        stage.replaceChildren(); // stops any playing video
        document.body.style.overflow = "";
      });
      dialog.addEventListener("click", (e) => {
        if (e.target === stage) dialog.close(); // click outside the media
      });
      dialog.addEventListener("keydown", (e) => {
        if (gallery.length > 1 && e.key === "ArrowLeft") step(-1);
        if (gallery.length > 1 && e.key === "ArrowRight") step(1);
      });
      stage.addEventListener("touchstart", (e) => (touchX = e.touches[0].clientX), { passive: true });
      stage.addEventListener("touchend", (e) => {
        if (touchX === null || gallery.length < 2) return;
        const dx = e.changedTouches[0].clientX - touchX;
        if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
        touchX = null;
      });
      document.body.append(dialog);
    }

    function open() {
      if (!dialog.open) {
        dialog.showModal();
        document.body.style.overflow = "hidden";
      }
    }

    function video(v) {
      build();
      gallery = [];
      title.textContent = `${v.title} · ${v.year}`;
      extra.replaceChildren();
      const frame = el("iframe", {
        src: `https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&rel=0&playsinline=1`,
        title: v.title,
        allow: "autoplay; encrypted-media; picture-in-picture; fullscreen",
        allowfullscreen: true,
      });
      stage.replaceChildren(el("div", { class: `viewer-video${v.type === "v" ? " vertical" : ""}` }, frame));
      foot.replaceChildren(
        v.note ? v.note : "",
        el("a", { href: `https://www.youtube.com/watch?v=${v.id}`, target: "_blank", rel: "noopener", text: "Watch on YouTube ↗" }),
      );
      open();
    }

    function showImage() {
      const item = gallery[index];
      title.textContent = item.title;
      const img = el("img", { src: item.full, alt: item.title });
      stage.replaceChildren(img);
      if (gallery.length > 1) {
        stage.append(prevBtn, nextBtn);
        extra.textContent = `${index + 1} / ${gallery.length}`;
      } else {
        extra.textContent = "";
      }
      foot.replaceChildren(
        item.caption || "",
        item.link ? el("a", { href: item.link, target: "_blank", rel: "noopener", text: item.linkText || "Open ↗" }) : "",
      );
      // warm up the next image
      if (gallery.length > 1) new Image().src = gallery[(index + 1) % gallery.length].full;
    }

    function step(dir) {
      index = (index + dir + gallery.length) % gallery.length;
      showImage();
    }

    function images(items, start = 0) {
      build();
      gallery = items;
      index = start;
      showImage();
      open();
    }

    return { video, images };
  })();

  /* ---------- read a folder of this repository ----------
     Uses GitHub's public API, so dropping a file into the folder and
     pushing is all it takes. Results are cached for 10 minutes.     */

  async function listFolder(path, extensions) {
    const key = `th45-folder:${path}`;
    let entries = storage.get(key);
    if (!entries) {
      const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}?ref=${BRANCH}`, {
        headers: { Accept: "application/vnd.github+json" },
      });
      if (res.status === 404) return [];
      if (!res.ok) throw new Error(`GitHub answered ${res.status}`);
      entries = (await res.json()).map((f) => ({ name: f.name, type: f.type, size: f.size }));
      storage.set(key, entries);
    }
    return entries
      .filter((f) => f.type === "file" && extensions.some((ext) => f.name.toLowerCase().endsWith(ext)))
      .map((f) => f.name);
  }

  // "2026-03-tehran-rooftops.jpg" -> "Tehran Rooftops"
  function titleFromFile(name) {
    return name
      .replace(/\.[^.]+$/, "")
      .replace(/^\d{4}([-_]\d{1,2}){0,2}[-_ ]*/, "")
      .replace(/[-_]+/g, " ")
      .trim()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  return { el, videoPuzzle, imagePuzzle, videoTile, viewer, listFolder, titleFromFile, storage };
})();
