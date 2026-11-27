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
npm run check:spider
npm run check:session
npm run check:paint
npm run check:gift
npm run check:computer
npm run check:documents
npm run check:contact
npm run build
npm run preview
```

Open `/` for the original XP boot/login sequence or `/office` for the desktop. Double-click desktop and project icons; use Enter/Space with the keyboard. On touch devices, tap once. Windows can be dragged, resized, minimized, maximized, closed, and restored through the taskbar.

Windows Media Player is available on the desktop and Start menu with the supplied icon and a blue/silver Windows Media Player 8 skin matching the provided reference. Its left navigation contains only **Now Playing** and **Media Library**. The seven supplied MP3s are served from `public/musics/`; metadata, durations, and embedded artwork are in `src/data/playlist-data.json`. Playback, stop, previous/next, seeking, volume/mute, shuffle/repeat, library search and playlist visibility work without an external service. The existing window manager handles dragging, resizing, minimizing, maximizing and taskbar restore. Doom remains on the desktop.

My Projects opens in a visual XP Explorer collection with larger cover thumbnails, a selected-project preview, original descriptions, and direct actions for recorded demos, available live demos, source code and contact. TestFlow, Chkobba and ConfigPilot appear first, configured by `featuredIds` in `projects-data.json`. Cover artwork is explicitly labeled; TestFlow and Chkobba also have a separate recorded-demo preview. Search and filters work together and show a useful empty state. The project overview also appears inside each folder above the original files. The layout adapts to both window resizing and mobile screens.

Each of the eight My Projects folders contains **description.txt**, **image.jpg**, and the project's original web shortcuts with Internet Explorer icons. Descriptions open in Notepad, including the complete case study and technologies. Pictures open in an XP Picture and Fax Viewer with fit/actual size, zoom, rotation, next/previous, slideshow and Save controls. ConfigPilot retains its ten additional gallery images. **video demo.mp4** appears only for TestFlow and Chkobba, and opens the original recording in Windows Media Player with the shared playback controls. Videos stream on demand from the original portfolio. Web shortcuts open in Internet Explorer; sites that prohibit embedding, including GitHub, open in a browser tab. The original unavailable AI Art Gallery demo stays labeled unavailable.

Doom now uses a locally hosted WebAssembly DOSBox runtime, loaded only after **Play Doom**. Play starts Episode 1 on the gentler second difficulty; Esc opens the original menu for other episodes and options. The screen preserves the original 4:3 proportions, with a larger default XP window, optional smooth scaling, full-screen support (or maximized-window fallback), pause/resume, sound toggle, control help, and touch buttons on small screens. WASD/arrows move, Ctrl or mouse click fires, Space/E opens doors, Shift runs, and number keys select weapons. Shift+Tab returns keyboard focus to the toolbar. F2/F3 save and load using browser storage. Minimize, switching apps, and hiding the browser pause emulation and sound; Resume restores the same session. Closing unloads the isolated runtime. Runtime sources, checksums, licenses and the documented Asyncify pause patch are in `public/game/vendor/`. `npm run check:doom` verifies the shipped runtime and pause gate.

Spider Solitaire is available on the desktop, Start menu and My Computer’s XP_EXTRAS drive. The game uses the original XP card faces, spider-web back, felt, icon, About artwork and sound resources from the owner-selected [xp-cards archive](https://github.com/esc0rtd3w/xp-cards), with Game / Deal! / Help menus. Its browser engine supports 1/2/4 suits, legal single-card and run moves, mouse dragging, click/tap or keyboard play, hints, undo, five stock deals, automatic run completion, scoring, restart and browser-local saved progress. Game → Options controls sound and larger cards for narrow windows; large-card mode scrolls horizontally. Timers and sound pause while the game is inactive. The latest 30 undo actions survive reopening. F1 opens Help, F2/F3 opens difficulty, F5 opens Options, M/H hints, D deals, and Ctrl/⌘+Z undoes. The game loads only when opened and has no external runtime dependency. Original resources have separate attribution in `public/game/spider/NOTICE.txt`; they are not covered by the project’s MIT license. No Windows executable runs in the website. `check:spider` verifies the rules, persistence validation and all 62 extracted resource hashes.

Internet Explorer uses XP/IE6 chrome and opens the live original portfolio by default. The Links bar and Favorites menu contain Original Portfolio, Articles, and Coding Activity, sourced from `profile-data.json` through `browser-links.js`. Address navigation, back/forward between addresses opened through Explorer, refresh, home, Favorites/History panes and menus are functional. The original website remains interactive inside the window. GitHub, LinkedIn and Credly shortcuts were removed at the owner’s request because those sites prohibit embedding. Manually entering those sites still shows an XP notice with an **Open Website** link. Other sites can also block embedding, so **Open in Browser** is always available. Cross-origin pages control their own internal navigation; Explorer cannot read their internal URL or history. Frame policies are recorded in `src/data/browser-data.json`.

My CV uses the supplied Adobe PDF icon and an Adobe-style reader matching the owner’s reference: dark toolbar, bookmarks pane, page thumbnails and the actual two-page CV. Page navigation, selectable/searchable text, zoom, fit-width/fit-page, Save and Print controls reuse the existing XP window. The reader opens in Fit Page mode so a complete page is visible; entering a page number navigates immediately. The original PDF download remains unchanged. PDF.js and its worker load only when My CV opens.

The PDF reader uses PDF.js's legacy browser build and reads text streams through `getReader()` for Safari compatibility, without requiring ReadableStream async iteration.

About Me is an XP profile sheet with General, Experience, Education and More about me tabs. It uses the existing photo, biography and professional data, with expandable role details from the CV and the owner-selected website dates/locations. Keyboard arrows/Home/End navigate tabs; Projects, CV, Contact, Certifications and Paint shortcuts reuse the existing apps. The profile panel scrolls independently while tabs and footer actions remain available. English/French UI labels are centralized in `src/data/about-data.json`; the lightweight About Me photo is derived from the original local photo.

Notepad opens at 840 × 660 on desktop, with a 15px monospace editor, 1.65 line spacing, soft wrapping and padding. Mobile uses the available screen and 16px text. The taskbar language button shows EN/FR and opens an XP menu with both languages and a current-selection checkmark. Selecting closes the menu and restores button focus; arrow keys, Enter, Escape, Tab and outside-click dismissal work. The tray reserves its own space beside app buttons.

The Start menu’s Turn Off Computer and Log Off buttons open XP-style blue confirmation dialogs over a dimmed, desaturated desktop. Stand By pauses the visit until Wake up or a key press. Turn Off shows a branded shutdown sequence and a black safe-to-close screen; Turn on Ghazi XP runs the existing boot visuals and returns to login. Restart also runs the boot sequence. Log Off shows a logging-off screen; Switch User returns directly to welcome. Open applications and in-memory drafts remain mounted for the current visit, so logging back in restores their state. Refreshing or closing the browser still follows each app’s existing persistence rules. Music continues while choosing or cancelling; confirming a session action pauses it. Games and slideshows suspend appropriately. The UI supports English/French, keyboard focus trapping, Escape/Cancel and reduced motion. These controls operate the portfolio session. Labels and timings live in `src/data/session-data.json`; `check:session` checks lifecycle transitions and stale-action guards.

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

The interface supports English and French. Professional prose preserves the published English source. Outlook Express uses the supplied classic compose-window reference: original toolbar icons, recessed To/From/Subject fields, formatting toolbar, full-height editor and status bar, with no attachment field or extra profile footer. Text formatting, clipboard actions, Undo, validation and the shared XP window controls are functional. Send now calls the same-origin `/api/contact` endpoint, which delivers a plain-text email through Resend to Ghazi’s fixed inbox. The visitor’s From address becomes Reply-To. Credentials are server-only environment variables; see `DEPLOYMENT.md`. Successful sending clears the message; failures keep the draft for a safe retry. The compose window keeps its XP styling and adds native-looking sent/error dialogs. Clipboard permissions depend on the visitor's browser; keyboard shortcuts remain available.

Videos are loaded on demand from the original portfolio; copied screenshots, illustrations, photos, badges, and the CV are served locally. Original image captions distinguish illustrations from application screenshots. No tracking is configured.

The Dockerfile now runs one Node.js 24 HTTP server for both `dist` and the contact API on `PORT` (35000 by default). It preserves `/office` SPA routes, JavaScript module/WASM MIME types, gzip text responses, caching and byte-range media/PDF requests. `nginx.conf` remains a legacy static-only configuration; using it alone will not provide the email API. This migration does not replace the existing Vercel portfolio.

## Attribution

Adapted from [Paul Jaguin's Windows XP template](https://github.com/UnMugViolet/portfolio). The original MIT license is retained in `LICENSE`. Windows XP imagery, icons, and sounds belong to their respective owners.

Paint is available on the desktop and Start menu with the supplied icon and a classic XP toolbox, palette, menus, scrollable workspace and status bar. It opens a handwritten About Me canvas, drawn from the verified profile in English or French with the locally bundled Caveat font. Pencil, brush, spray, eraser, fill, color picker, text, shapes, curves, polygon and selection movement work on the actual canvas. Undo/redo, zoom, image attributes, flips/rotation, local image opening and PNG export are available. Space + drag pans the canvas; two fingers pan on touch screens. Save a PNG before closing to keep edits; File → Restore About Me returns to the original introduction. Drawing code is loaded only when Paint opens; font licensing is in `public/fonts/caveat/OFL.txt`.

`gift.exe` is a classic XP welcome wizard on the desktop and Start menu, using the supplied gift icon. Visitors enter a name and receive a personalized Certificate of Visit with an issue date, souvenir number, gold seal and Ghazi signature. Save as Image downloads the exact preview as a 2000 × 2240 PNG. The app supports English/French, long Unicode names, Back/Forward navigation, fit/actual-size preview, and shortcuts to My Projects/My CV. It generates the image locally with the bundled handwriting font; recipient names are neither submitted nor persisted. Closing starts a fresh wizard next time.

My Computer is an XP drive explorer: GHAZI_XP (C:) contains profile/document applications and a real-profile README, PROJECTS (D:) opens the existing eight project folders, MEDIA (E:) contains music/pictures and the two recorded demos, and the XP_EXTRAS (F:) CD drive launches the creative/game applications. Shared folders and the original portfolio network location remain functional. Tiles/Details views, selection details, Back/Forward/Up, editable addresses, global portfolio search, Properties dialogs, and a collapsible task pane work within the existing window manager. These are virtual portfolio drives; no real disk capacity or hardware details are fabricated. Copy and drive configuration live in `src/data/computer-data.json`.

My Documents uses the same XP Explorer style, with the original CV, About Me and Contact text files, a Professional Profile folder, seven credential folders, and shortcuts to projects, pictures, music and the original portfolio. Text opens in Notepad, badges in Picture and Fax Viewer, and the CV in the existing reader. Search includes document contents; Back/Forward/Up, editable folder addresses, Tiles/Details, sorting, Properties and Save a Copy are available. Six credentials include their actual badge and verification link; the CV-only Hashgraph credential contains a source-backed text record. The catalog derives professional facts from `profile-data.json`; English/French labels and measured asset sizes live in `documents-data.json`. `check:documents` validates files, assets, source facts, search and navigation.

## Outlook Express / Resend

For local development, keep `RESEND_API_KEY` and `RESEND_FROM_EMAIL` in the ignored `.env` file; `npm run dev` exposes the API through a server-only Vite middleware. For a built local preview, run `npm run build` then `npm start`. `npm run preview` is Vite’s static preview and does not send mail. Never prefix the key with `VITE_` or put it in `src/`. Docker excludes `.env` files; configure the two variables in Railway before redeploying.

The recipient is fixed to `profile-data.json` and cannot be overridden by the browser. Incoming JSON has size and field limits, cross-site browser submissions are rejected, a honeypot filters basic bots, and in-memory per-IP/global sending limits protect the inbox. Railway’s X-Real-IP is trusted only in a Railway runtime. Limits apply per running instance; use a shared limiter if scaling to multiple replicas. A stable Resend idempotency key accompanies retries so an uncertain timeout does not send the same draft twice within Resend’s retention window. No message contents or credentials are logged. Formatting controls still edit the composer, while the delivered message uses plain text.
