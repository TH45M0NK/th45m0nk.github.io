# Photography — drop your photos here

Every image in this folder appears on the Photography page automatically,
in the puzzle grid. Hovering shows the date it was taken; clicking opens it
full size.

1. Copy your photos into this folder (`.jpg`, `.jpeg`, `.png`, `.webp` or `.gif`).
2. Commit and push in GitHub Desktop. The page updates within a minute or two.

Optional, but makes the page nicer

- **Date taken:** add a line for the photo in `../photo-info.js` (same file
  name, without the extension). Photos are sorted newest first by that date.
  Or ask Claude to "update my photo dates" and it reads them from the originals.
- **Fast loading:** put a small copy (about 1200 px on the long side, `.webp`)
  with the same name in `thumbs/`. The grid uses it, and the full photo opens
  on click. Without one, the grid just uses the full photo.

Tips

- Export at about 2500–3500 px on the long side. Camera originals of 10 MB+
  make the page slow, especially on phones.
- Exporting without location data keeps where you live private.
- No spaces or `#` in file names.
