# Ghazi Saoudi — Windows XP Portfolio

A content migration of [Ghazi Saoudi's portfolio](https://ghazi-saoudi.vercel.app) into the existing Vue Windows XP template. The desktop, wallpaper, XP controls, Start menu, taskbar, window manager, sounds, Minesweeper, Notepad, and Doom remain part of the experience.

## Run

Use Node.js 22.13 or newer (Node.js 24 was used for verification).

```sh
npm ci
npm run dev
npm run check:content
npm run check:pdf-navigation
npm run check:project-files
npm run check:doom
npm run check:paint
npm run check:gift
npm run check:computer
npm run build
npm run preview
```

Open `/` for the original XP boot/login sequence or `/office` for the desktop. Double-click desktop and project icons; use Enter/Space with the keyboard. On touch devices, tap once. Windows can be dragged, resized, minimized, maximized, closed, and restored through the taskbar.

Windows Media Player is available on the desktop and Start menu with the supplied icon and a blue/silver Windows Media Player 8 skin matching the provided reference. Its left navigation contains only **Now Playing** and **Media Library**. The seven supplied MP3s are served from `public/musics/`; metadata, durations, and embedded artwork are in `src/data/playlist-data.json`. Playback, stop, previous/next, seeking, volume/mute, shuffle/repeat, library search and playlist visibility work without an external service. The existing window manager handles dragging, resizing, minimizing, maximizing and taskbar restore. Doom remains on the desktop.

My Projects opens in a visual XP Explorer collection with larger cover thumbnails, a selected-project preview, original descriptions, and direct actions for recorded demos, available live demos, source code and contact. TestFlow, Chkobba and ConfigPilot appear first, configured by `featuredIds` in `projects-data.json`. Cover artwork is explicitly labeled; TestFlow and Chkobba also have a separate recorded-demo preview. Search and filters work together and show a useful empty state. The project overview also appears inside each folder above the original files. The layout adapts to both window resizing and mobile screens.

Each of the eight My Projects folders contains **description.txt**, **image.jpg**, and the project's original web shortcuts with Internet Explorer icons. Descriptions open in Notepad, including the complete case study and technologies. Pictures open in an XP Picture and Fax Viewer with fit/actual size, zoom, rotation, next/previous, slideshow and Save controls. ConfigPilot retains its ten additional gallery images. **video demo.mp4** appears only for TestFlow and Chkobba, and opens the original recording in Windows Media Player with the shared playback controls. Videos stream on demand from the original portfolio. Web shortcuts open in Internet Explorer; sites that prohibit embedding, including GitHub, open in a browser tab. The original unavailable AI Art Gallery demo stays labeled unavailable.

Doom now uses a locally hosted WebAssembly DOSBox runtime, loaded only after **Play Doom**. Play starts Episode 1 on the gentler second difficulty; Esc opens the original menu for other episodes and options. The screen preserves the original 4:3 proportions, with a larger default XP window, optional smooth scaling, full-screen support (or maximized-window fallback), pause/resume, sound toggle, control help, and touch buttons on small screens. WASD/arrows move, Ctrl or mouse click fires, Space/E opens doors, Shift runs, and number keys select weapons. Shift+Tab returns keyboard focus to the toolbar. F2/F3 save and load using browser storage. Minimize, switching apps, and hiding the browser pause emulation and sound; Resume restores the same session. Closing unloads the isolated runtime. Runtime sources, checksums, licenses and the documented Asyncify pause patch are in `public/game/vendor/`. `npm run check:doom` verifies the shipped runtime and pause gate.

Internet Explorer uses XP/IE6 chrome and opens the live original portfolio by default. The Links bar and Favorites menu contain Original Portfolio, Articles, and Coding Activity, sourced from `profile-data.json` through `browser-links.js`. Address navigation, back/forward between addresses opened through Explorer, refresh, home, Favorites/History panes and menus are functional. The original website remains interactive inside the window. GitHub, LinkedIn and Credly shortcuts were removed at the owner’s request because those sites prohibit embedding. Manually entering those sites still shows an XP notice with an **Open Website** link. Other sites can also block embedding, so **Open in Browser** is always available. Cross-origin pages control their own internal navigation; Explorer cannot read their internal URL or history. Frame policies are recorded in `src/data/browser-data.json`.

My CV uses the supplied Adobe PDF icon and an Adobe-style reader matching the owner’s reference: dark toolbar, bookmarks pane, page thumbnails and the actual two-page CV. Page navigation, selectable/searchable text, zoom, fit-width/fit-page, Save and Print controls reuse the existing XP window. The reader opens in Fit Page mode so a complete page is visible; entering a page number navigates immediately. The original PDF download remains unchanged. PDF.js and its worker load only when My CV opens.

The PDF reader uses PDF.js's legacy browser build and reads text streams through `getReader()` for Safari compatibility, without requiring ReadableStream async iteration.

## Personal content

- `src/data/profile-data.json`: identity, biography, education, website experience, skills, languages, credentials, CV, and contact/social links.
- `src/data/projects-data.json`: eight projects, exact published technology lists, case-study sections, media, and original URLs.
- `src/data/windows-data.json`: application registry and existing window configuration.
- `src/data/asset-sources.json`: original URLs for copied media.
- `src/data/cv-reader-data.json`: bookmarks matching the original PDF’s actual section headings.
- `src/lib/project-files.mjs`: project file listings and complete plain-text descriptions derived from the project data.
- `public/projects/<project-id>/`: downloadable descriptions and JPEG copies of the original cover images. `check:project-files` detects descriptions that need updating after source data edits.
- `public/pdf/Ghazi_Saoudi_CV_EN.pdf`: original, unmodified English CV.
- `MIGRATION.md`: sources, mappings, discrepancies, and verification results.

The interface supports English and French. Professional prose preserves the published English source. Outlook Express uses the supplied classic compose-window reference: original toolbar icons, recessed To/From/Subject fields, formatting toolbar, full-height editor and status bar, with no attachment field or extra profile footer. Text formatting, clipboard actions, Undo, validation and the shared XP window controls are functional. No credentials or backend are required: Send opens a plain-text draft in the visitor's email application, where actual delivery happens. Clipboard permissions depend on the visitor's browser; keyboard shortcuts remain available.

Videos are loaded on demand from the original portfolio; copied screenshots, illustrations, photos, badges, and the CV are served locally. Original image captions distinguish illustrations from application screenshots. No tracking is configured.

Serve `dist` with an SPA fallback to `index.html`; the existing Nginx configuration and Dockerfile support that setup. This migration does not publish or replace the existing Vercel portfolio.

## Attribution

Adapted from [Paul Jaguin's Windows XP template](https://github.com/UnMugViolet/portfolio). The original MIT license is retained in `LICENSE`. Windows XP imagery, icons, and sounds belong to their respective owners.

Paint is available on the desktop and Start menu with the supplied icon and a classic XP toolbox, palette, menus, scrollable workspace and status bar. It opens a handwritten About Me canvas, drawn from the verified profile in English or French with the locally bundled Caveat font. Pencil, brush, spray, eraser, fill, color picker, text, shapes, curves, polygon and selection movement work on the actual canvas. Undo/redo, zoom, image attributes, flips/rotation, local image opening and PNG export are available. Space + drag pans the canvas; two fingers pan on touch screens. Save a PNG before closing to keep edits; File → Restore About Me returns to the original introduction. Drawing code is loaded only when Paint opens; font licensing is in `public/fonts/caveat/OFL.txt`.

`gift.exe` is a classic XP welcome wizard on the desktop and Start menu, using the supplied gift icon. Visitors enter a name and receive a personalized Certificate of Visit with an issue date, souvenir number, gold seal and Ghazi signature. Save as Image downloads the exact preview as a 2000 × 2240 PNG. The app supports English/French, long Unicode names, Back/Forward navigation, fit/actual-size preview, and shortcuts to My Projects/My CV. It generates the image locally with the bundled handwriting font; recipient names are neither submitted nor persisted. Closing starts a fresh wizard next time.

My Computer is an XP drive explorer: GHAZI_XP (C:) contains profile/document applications and a real-profile README, PROJECTS (D:) opens the existing eight project folders, MEDIA (E:) contains music/pictures and the two recorded demos, and the XP_EXTRAS (F:) CD drive launches the creative/game applications. Shared folders and the original portfolio network location remain functional. Tiles/Details views, selection details, Back/Forward/Up, editable addresses, global portfolio search, Properties dialogs, and a collapsible task pane work within the existing window manager. These are virtual portfolio drives; no real disk capacity or hardware details are fabricated. Copy and drive configuration live in `src/data/computer-data.json`.
