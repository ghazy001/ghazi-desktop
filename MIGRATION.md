# Portfolio content migration

Source retrieved November 23, 2026: https://ghazi-saoudi.vercel.app.

## Source coverage and application mapping

| Source | Migrated content | XP application |
| --- | --- | --- |
| `/` | Name, exact professional title, tagline, introduction, social links | My Computer, login, Start menu |
| `/about` | Biography, four roles with original dates, locations, responsibilities and employer URLs; skills; career focus | About Me, My Skills, My CV |
| `/Ghazi_Saoudi_CV_EN.pdf` | Two education entries, additional technologies, languages, professional strengths, Hashgraph credential | About Me, My Skills, My CV, Certifications |
| `/projects` and all eight linked case studies | Descriptions, technology lists, scope, architecture, decisions, takeaways, existing repository/package/demo links | My Projects |
| `/certifications` | Six Credly credentials with exact names, issuers, dates, badge images and verification URLs | Certifications, My Documents |
| `/contact` | Email, phone, location, GitHub, LinkedIn, existing consultation page | Outlook Express, Internet Explorer |
| `/github`, `/articles`, `/wakatime` | Relevant original navigation links preserved | Internet Explorer |

Projects: AI-Powered QA Platform / TestFlow; E-Learning Platform with AI; Microservices Architecture Platform; AI Art Gallery; Donation Platform; Football Tournament Management System; Chkobba; ConfigPilot.

## Source differences resolved by the owner

The owner explicitly selected **website dates and locations** for the displayed experience:

- Capgemini: website `Feb. 2026 - Aug. 2026`; PDF `Feb. 2026 – Present`.
- Hellenic Cables: website `Athens, Greece`; PDF `Tunis, Tunisia`.
- Safran: website `Nabeul, Tunisia`; PDF `Tunis, Tunisia`.

About Me uses the exact website responsibilities and the website dates and locations selected by the owner. My CV now displays the original PDF itself in the requested reader skin, so its dates and locations reflect the original document. The PDF is preserved byte-for-byte as published, including its different dates and locations. Education comes from the PDF because the About page has no education section. No dates, degrees, roles, project timelines, or credentials were inferred.

## Media and missing information

- Reused the original profile photo and illustrated portrait, eight project preview images, two video posters, six credential badges, and all ten ConfigPilot gallery images.
- TestFlow and Chkobba recordings use the original video URLs with `preload="none"`. Playback requires access to the original portfolio.
- The existing project illustrations retain their original disclosure. They are not presented as actual application screenshots. ConfigPilot screenshot dates and statistics remain historical snapshots.
- Hashgraph Developer Certification is present in the PDF and About page. No issue date or verification URL was published; neither was invented.
- The Articles page exposed zero posts during the initial extraction. No articles were fabricated. The live Articles page now loads inside Internet Explorer; five posts were visible during browser verification on November 23, 2026.
- WakaTime/GitHub activity is dynamic; no stale counts or unsupported metrics were copied.
- The contact page's consultation booking is an interactive flow without a static booking URL in the extracted page. The original contact page remains linked.
- Only the published English CV was retrieved. The interface's French setting downloads that same original English file, labeled accordingly.

## Link verification

Full HTTP results are in `link-verification.json`.

- Original portfolio pages, CV, both recorded videos, GitHub repositories/container packages, TestFlow, Chkobba, Credly profile and all six badge links responded successfully.
- The original AI Art Gallery demo at `https://ghazi001.pythonanywhere.com` returned **404**. The original URL is retained and labeled unavailable in My Projects.
- LinkedIn returned 405 to automated HEAD requests; npm returned 403. Those verification limits do not establish broken links. Their exact source URLs are preserved.
- Project dates absent from the source are omitted.

## Implementation

The original Vue/Pinia architecture and shared XP window manager are retained. New professional sections register through the same application data and manager. No modern visual system was introduced. Explorer sidebars, XP toolbars, system menus, login/boot, taskbar, window buttons and existing icons are reused.

Removed template-owner projects, CVs, photos, travel pictures, playlist/audio library, calendar data, freelance offers, personal legal notice, donation links, analytics destination, and owner-specific CI configuration. The original template attribution and license remain.

Contact uses a validated `mailto:` draft with subject and message. The owner subsequently requested removal of the explanatory/profile footer, direct email/phone/social links and consultation link from Outlook Express. Those details remain in the structured profile for the other portfolio sections. No message is reported sent without delivery. No external form service credentials are required.


## Completed verification

- `npm run check:content`: checks all 18 applications, 29 copied source assets, 8 projects, 4 roles, 2 education entries and 7 credentials; verifies the original PDF and seven MP3 checksums.
- `npm run build`: successful production Vite build using Node.js 24.
- Browser checks: desktop project navigation and search, case-study rendering, credentials, XP menus, Start menu, minimize/restore/maximize, pointer dragging and corner resizing, contact field validation/clear controls, language switching, mobile and tablet layout, and missing-image inspection.
- Doom reached actual gameplay after isolating the legacy parser-time runtime in an iframe; closing it unloads its runtime without restarting the portfolio.
- The original PDF and the local HTTP response both have SHA-256 `98f6f892195508f1daf0d83c07775032008a86ce61d3ae07094bb4f62ef132de`. Browser download-event capture stalled, so verification relies on the correct download link and byte-identical HTTP response rather than confirmation of the browser's final Save action.
- Contact draft delivery is intentionally left to the visitor's email application; no test message was sent.
- A verified desktop screenshot is saved at `output/verification/xp-desktop.jpg`.


## Desktop entertainment apps

Doom is available directly on the desktop. Windows Media Player uses the supplied icon and the owner's final Windows Media Player 8 reference: blue XP title bar, silver toolbar, blue left navigation, black playback/playlist panels, green status/time text and classic playback controls. Only Now Playing and Media Library appear in the left navigation. Spotify integration is removed.

All seven supplied MP3s are copied unchanged into `public/musics/`. Embedded ID3 metadata and artwork are retained in `playlist-data.json`; durations were measured using the system audio reader. No album names or dates were invented. The player supports playback, pause, stop, previous/next, seek, shared volume/mute, shuffle/repeat, optional artwork, playlist visibility, artist filtering, and library search. Audio does not autoplay on opening.

The player reuses the existing shared window manager; a scoped skin setting changes only its window shape. The supplied icon is used on the desktop, title bar, Start menu and taskbar.

Verified the final Media Player 8 skin in the browser: exactly two left-navigation buttons, all seven tracks, working library search, direct MP3 playback and stop, responsive mobile layout without horizontal overflow, maximize/restore, minimize and taskbar restore. No browser console errors were observed. Content/audio integrity checks and the production build pass. Screenshot: `output/verification/xp-media-player.jpg`.

The silver header joins were refined into smooth vector curves and the top/transport text glyphs were replaced with consistent vector icons. The speaker now shows sound waves or a red mute indicator, with a clear pressed state. Browser verification confirmed mute/unmute volume restoration, keyboard volume adjustment, playback/next/stop, and toolbar alignment at mobile width without horizontal overflow or console errors.

## Live Internet Explorer

The supplied IE6 reference is implemented through the existing shared XP window: classic menu row, icon toolbar, address field and Go button, Links bar, embedded page area and status bar. The original portfolio is the default home page. Actual professional links replace the demo favorites, using centralized profile data. Toolbar/menu navigation, Favorites and History panes, address validation, refresh, home, minimize/taskbar restore and maximize/restore are functional. Printing opens the current website in the visitor's browser for its native Print action.

The portfolio and Articles page were visibly verified as live embedded pages. GitHub, LinkedIn and Credly send headers that prohibit embedding. Their Explorer shortcuts were removed at the owner’s request; only Original Portfolio, Articles and Coding Activity remain in the Links bar, Favorites sidebar and Favorites menu. The original professional URLs remain in the profile data for other portfolio sections. Manual address navigation to a restricted site still displays an XP-style explanation with the exact original URL and an Open Website link. Policies checked on November 23, 2026 are recorded in `src/data/browser-data.json`. No framing restrictions are bypassed. Unknown sites may also prohibit framing; an external-open link remains available in the toolbar. Browser same-origin protections prevent reading a remote page's internal route changes; the address field and back/forward controls track navigation initiated through this Explorer app.

Verification passed: production build, existing content/audio integrity checks, HTTP/HTTPS address validation (including rejection of script/data/file URLs and embedded credentials), home/Articles loading, toolbar back navigation, Favorites menu/sidebar, GitHub and LinkedIn restricted-page notices, and shared window maximize/restore and minimize/taskbar restore. Mobile verification found no document-width overflow or missing Explorer images. No browser warnings or errors were captured. Screenshot: `output/verification/xp-internet-explorer.jpg`.

## Outlook Express compose window

The owner's compose-window reference is implemented with the existing shared XP frame, menu row, original Send/Cut/Copy/Paste/Undo/Check icons, recessed address fields, a classic formatting toolbar, white full-height message editor and status bar. No attachment field is included. The existing From field remains for the visitor's reply address. Cc and attachment fields are omitted at the owner’s request. The previously removed introductory/profile text stays absent.

Formatting and undo use the browser's native editing commands. Clipboard paste accepts plain text; rich HTML and dropped content are not imported. Send creates a plain-text mailto draft, for review and delivery in the visitor's email application. Visual formatting applies to the compose editor; mailto does not carry HTML formatting. Check validates the addresses and required content. Clipboard access failures offer keyboard shortcuts in the status bar. Menus dispatch actions to this compose window through the existing menu component.

Browser verification confirmed required-message validation, text entry and selection, bold formatting and Undo, no attachment input, no missing toolbar images, and a full-height editor without document overflow at mobile width. No test email was sent. Screenshot: `output/verification/xp-outlook-compose.jpg`.

The owner-selected `26791-48x48x32.png` is copied unchanged to `public/img/icons/my-computer.png` and used by the My Computer desktop shortcut, shared window title/taskbar icon, Start menu, Explorer toolbar and sidebar shortcuts.


## My CV PDF reader

The supplied `21741-256x256x32.png` is copied unchanged to `public/img/icons/cv/adobe-pdf.png` for My CV’s desktop, Start menu, title bar, taskbar and document shortcuts. The shared XP frame remains responsible for dragging, resizing, minimizing, maximizing and closing. An optional registry caption sets the document title without changing the app’s My CV label.

The dark Adobe-style toolbar, red Bookmarks tab, white outline tree, gray document workspace and XP scrollbars follow the provided reference. Mozilla PDF.js renders the actual original two-page PDF, including a selectable text layer. The PDF bytes are not rewritten. Bookmarks in `cv-reader-data.json` point to headings found in that original document; they are reader navigation, not invented document content. The old HTML CV presentation is replaced by this view.

Page controls, section bookmarks, page thumbnails, zoom, fit width/page, text search with repeated Find Next, original-file download and external PDF opening are implemented. Email opens the existing Outlook Express app. Print renders both original PDF pages at high resolution into an isolated browser print document; no physical print job was sent during verification. The reader and worker are loaded on demand and are unloaded when the window closes. On narrow windows the navigation pane collapses and toolbars scroll within the window.

Verified in the browser: both actual PDF pages render, extracted text is selectable/accessibility-visible, Next Page changes the page counter, the Certifications bookmark scrolls to the corresponding heading on page two, repeated Find Next advances through five matching text spans for React, thumbnail previews load, zoom updates, and mobile fit width has no document overflow. Original-file download points to the unchanged local PDF. Screenshot: `output/verification/xp-cv-reader.jpg`.


### CV page navigation correction

Page-number edits now navigate immediately and are protected from scroll events while the field is being edited. Fit Page is the initial view. All page dimensions are updated together before rendering so the second page’s scroll position is stable. New draws use a temporary canvas and only replace a visible page after rendering completes; canceled zoom/resize work leaves the previous page visible. Unchanged fit calculations avoid redundant redraws, hidden/minimized windows do not trigger fitting, and the selected page is restored after drawing. The page counter follows the page with the largest visible area, including narrow windows where the last page cannot scroll to the very top.

Regression checks in the browser: direct entry of page 2, complete visibility of page 2, repeated zoom/fit operations, minimize/restore with bookmarks retained, and page 2 remaining selected after mobile and desktop resizing. Both original PDF pages still render; the PDF checksum is unchanged. Final proof: `output/verification/xp-cv-page-two.jpg`.


### Bookmark and Find correction

The reader now retains an exact bookmark/search location through redraws, rather than restoring only the page start. PDF text is indexed once with original character offsets, including text split across fragments, spaced headings, Unicode accents and hyphens. Find automatically selects the first occurrence, counts individual occurrences, advances across pages, wraps at the end, highlights only matching text, and reports No matches explicitly. Bookmarks highlight the actual heading. Highlight coordinates are rebuilt after zooming without resetting the selected result.

A fractional-width scrollbar loop was reproduced at the default narrow browser size: rounding in fit calculations introduced a one-pixel horizontal overflow, repeatedly canceled rendering, and left page 2 pending. Fit calculations now leave a small inset and reserve the vertical scrollbar, eliminating the oscillation.

Verification: all eight bookmark buttons highlighted visible headings on their declared pages; Professional strengths stayed selected after zoom. React Find results advanced from 1/5 through 5/5 on page 2 and wrapped to 1/5. Searches for Professional profile and the split-fragment phrase AI & Machine Learning matched correctly; an absent phrase showed No matches and disabled Find Next. The selected fifth React result remained visible after desktop resize and fit-width redraw. The original two-page CV and checksum are unchanged. Algorithm regression checks run with `npm run check:pdf-navigation`.


### Safari text-loading correction

Native Safari reproduced a text-indexing failure even though the same reader worked in Chrome. The reader now loads PDF.js's legacy browser/worker build and consumes text streams using `getReader()` instead of requiring ReadableStream async iteration. The stream reader releases its lock after success or failure. Native Safari verification confirmed both rendered pages, the Certifications bookmark on page 2, and React search reporting 1/5 matches. Regression checks exercise a stream without an async iterator and cleanup on both success and failure.

## Explorer project files and Picture Viewer

All eight project folders now display files through the existing My Projects Explorer window. Each includes description.txt, image.jpg, original project links with Internet Explorer icons, and an Original Case Study shortcut. The text file preserves the complete published case study, technology list, highlights, media captions and original links. It opens in Notepad, whose Save action retains the description.txt filename. Actual JPEG cover copies and text files are available under public/projects/<project-id>; the source images remain unchanged.

Only TestFlow and Chkobba have recorded demos, so only those folders include video demo.mp4. They stream from the original portfolio and reuse the existing Windows Media Player window and playback controls. Both original video URLs returned HTTP 200 with video/mp4 and byte-range support. The approximately 84 MB and 16 MB recordings are not duplicated into the local site. ConfigPilot additionally retains all ten original gallery files. No videos, images or project destinations were fabricated; illustration and historical-snapshot captions remain visible.

Pictures open in Windows Picture and Fax Viewer, styled after the supplied winxp3.jpg reference with the shared XP title bar and a classic bottom control strip. Fit, actual size, zoom, rotation, previous/next, slideshow and image saving are available. The printing shortcut opens the image for the browser's Print action. The shared manager provides dragging, resizing, minimizing, maximizing, closing and taskbar restoration. Changing files or closing the viewer stops its slideshow.

Project web shortcuts preserve their exact original URLs. Embeddable destinations open in the existing Internet Explorer app. Known frame-restricted destinations such as GitHub open directly in a browser tab, without attempting to bypass frame policies. The unavailable AI Art Gallery live demo remains explicitly labeled.

Verification: check:project-files passed for 8 complete descriptions, 18 images, 2 videos and 25 web shortcuts. Browser checks confirmed Notepad content, double-click image opening, image fit/zoom/rotation, ConfigPilot gallery navigation and advancing slideshow, shared window controls, live ConfigPilot case-study navigation in Internet Explorer, and the actual GitHub repository opening in a separate tab. TestFlow's video loaded with 960×540 dimensions and a 309.94-second duration; playback advanced, then pause/seek/stop were exercised. The original seven-track music library still loads and plays MP3 audio. At 390px viewport width, the document and fitted image had no horizontal overflow. Content integrity, PDF navigation checks and the production build pass.

Proof images: output/verification/xp-project-folder.jpg and output/verification/xp-project-viewer.jpg.


## Personalized XP login screen

The login page follows the owner's Mitch Ivin screenshot reference: dark blue header/footer bands, a lighter blue center, subtle screen texture, a central divider, compact Ghazi XP branding and a white-framed profile tile. The account uses Ghazi Saoudi's existing photo and name from profile-data.json and the requested Software Engineer title (Ingénieur logiciel in French). No reference-owner identity or avatar was copied. The high-resolution Windows flag is reused from the template's existing WindowsIcon asset. The footer retains an English/French switcher with native buttons, keyboard support, a classic XP language popup, and the shared locale store for persistence and document language updates. The existing login route and connection store remain in use.

Verified at 1440×900 and 390×844: English/French labels and title translation, profile login through Enter to /office, Log Off returning to the new screen, no missing images, no horizontal mobile overflow, and no captured browser console errors. The production build passes. Proof: output/verification/xp-ghazi-login.jpg.


The black XP boot screen and blue loading transition now reuse LoginBrand, matching the login screen's Ghazi XP wordmark, Windows flag and localized Software Engineer title. The original animated loading bar and startup timings remain. Browser verification confirmed both loading stages and the final login transition in English, as well as French branding on the narrow boot screen. The production build passes. Proof: output/verification/xp-ghazi-loading.jpg.


## Doom performance and playability

The legacy CDN-dependent emulator is replaced by locally hosted js-dos 6.22.60 and its WebAssembly DOSBox engine. Heavy runtime initialization remains behind the explicit Play Doom button. The approximately 2 MB runtime is pinned locally; exact source URLs, shipped/upstream checksums, source repositories and GPL notices are recorded in public/game/vendor/SOURCES.json. The existing game archive and WAD are unchanged. CPU cycles are adaptive with an 80% budget and a 35,000-cycle cap; unnecessary image scalers and legacy audio peripherals are disabled, and audio mixing uses 22,050 Hz. These are workload reductions, not a measured cross-device FPS guarantee.

Both the canvas display size and filtering are controlled by CSS so DOSBox video-mode changes cannot overwrite the fitted 4:3 size. The XP app opens at 820×660 with resizing/maximizing preserved, a classic toolbar/status bar, a launch screen, optional smooth filtering, full screen with a maximize fallback, and on-screen direction/action controls at narrow widths. Play starts Episode 1, map 1 on skill 2; Esc retains access to the original game menus and episode/difficulty selection. The virtual XP.CFG corrects the archive's unusual fire/use/run bindings without modifying DEFAULT.CFG or the game ZIP. Controls include WASD/arrows, Ctrl/click to shoot, Space/E to use, Shift to run and number keys for weapons.

Pause testing found that the runtime's ordinary Emscripten MainLoop pause does not stop its Asyncify sleep loop. A documented local glue patch gates the pending sleep continuation and audio timers while paused, retaining the exact continuation for resume. The game pauses on minimize, loss of active app/browser focus, opening help/restart confirmation and hidden-page events; keys are released to prevent stuck movement. Shared desktop volume is applied through a local audio gain node. Closing the iframe removes runtime input/audio handlers. UI keyboard events are isolated from DOSBox's document listeners; toolbar buttons and dialogs can be operated with the keyboard, and Shift+Tab exits canvas input. Reloadable script and engine URLs are versioned for the browser and js-dos caches.

The /doom virtual mount uses IndexedDB-backed persistent storage. A test save named XP was created through Doom's F2 menu, flushed, and visibly appeared in the F3 Load Game menu after restarting the emulator. Saves are local to the browser/site and require browser storage. No existing save was deleted. Restart requires confirmation and flushes storage first. Startup errors provide Retry rather than a blank canvas.

Verification: actual first-level gameplay, held W movement, Ctrl firing, mouse click firing, mobile fire controls, native save/load, pause/resume with a stable paused frame counter, minimize/taskbar restore, sharp/smooth filtering, keyboard Pause/Resume and Shift+Tab toolbar focus. At a 390px viewport the fitted canvas measured 384×288 (4:3) with no document-width overflow. Full-screen activation in the in-app browser used the supported maximized-window fallback; native fullscreen and Safari gameplay were not verified. An attempt to launch native Safari timed out before inspection. Earlier pause/scheduler exceptions were reproduced and corrected during iteration; the final pause control works with the pinned patched engine. Build, existing content integrity checks and check:doom pass. The latter checks actual shipped runtime hashes, the WebAssembly header, and the Asyncify sleep-gate behavior on run, pause and resume. Final screenshot: output/verification/xp-doom-upgraded.jpg.


## Client-facing My Projects presentation

My Projects now uses an XP Explorer thumbnail/preview presentation while retaining the shared title bar, menus, address bar, toolbar, task pane, window behaviors and existing file applications. The selected project has a larger framed cover, its original case-study name/headline/description, an expandable technology list, and direct actions for its available recorded demo, live demo and source repository. A Discuss a project button opens the existing Outlook Express compose app without submitting or overwriting a message. Cover artwork remains explicitly labeled, with original image captions preserved. TestFlow and Chkobba can switch to their real recorded-demo poster previews. No project results, clients, metrics or screenshots were fabricated.

A thumbnail collection exposes all eight projects. The featuredIds metadata prioritizes TestFlow, Chkobba and ConfigPilot. Selection previews a project; double-click or Enter opens its folder. Search now actually filters rendered projects (the previous view computed filtered categories but rendered the unfiltered category list). Available-video, available-live-demo and source-code filters combine with text search. The known unavailable AI Art Gallery live link is excluded from the live-demo shortcut/filter and remains labeled in its original folder. Source repository actions retain original URLs and reuse Internet Explorer icons and the existing file dispatcher.

The same overview component appears inside the project folder, above the original description.txt, image.jpg, optional video demo.mp4, gallery pictures and web shortcuts. Gallery files use actual image thumbnails. Long content scrolls inside the shared XP window. The default Projects window is 1040×840, clamped to the viewport. Container queries adapt to resizing and hide the task pane in narrow windows; the mobile layout stacks the preview and preserves two-column thumbnails. English/French UI labels follow the existing locale store; original professional descriptions remain unchanged.

Verification: video filtering returned TestFlow and Chkobba; next-preview selected Chkobba; Demo preview showed its real poster and Watch demo opened that recording in Windows Media Player. Searching RabbitMQ returned exactly the Microservices Architecture Platform; a missing query showed an empty state and Show all projects restored the collection. ConfigPilot retained all 17 files, including its 11 images. Read case study opened description.txt in Notepad, image preview opened Picture and Fax Viewer, and the contact shortcut activated Outlook Express without sending mail. Thumbnail double-click opened the Chkobba folder with all five original items; Explorer Back restored the collection. A resized 638px window hid the task pane, and at 390px viewport width both the document and project scroll area had no horizontal overflow. No missing loaded images were found. Content integrity, project-file/presentation checks and production build passed.

Proof: output/verification/xp-projects-client-overview.jpg and output/verification/xp-projects-client-folder.jpg.

## Paint / handwritten About Me

Added Paint through the existing app registry, desktop, Start menu and window manager. The supplied Paint icon is used unchanged. The XP reference guides the File/Edit/View/Image/Colors/Help menus, two-column 16-tool toolbox, recessed tool options, gray scrollable workspace, color palette and status bar. The opening 1000 × 720 canvas uses the existing verified profile and `paint-about-data.json`, local Caveat handwriting font, and pen-drawn computer/cloud sketches. English and French render from the current language preference. No professional facts were added. A screen-reader transcript accompanies the visual introduction.

Visitors can draw, erase, spray, fill enclosed areas, sample colors, insert handwriting or ordinary text, draw lines/shapes/curves/polygons, select and move regions, undo/redo, zoom/pan, open a local image, change canvas dimensions, flip/rotate and export PNG. History has a 32 MB pixel budget; imported dimensions are bounded to 2000 pixels per side. New/Open/Restore warn before discarding edits. File → Restore About Me reopens the original content. Edits remain in the open window, including while minimized; export before closing to keep them. The app and its styles are loaded on demand.

Verification: the supplied icon matches byte-for-byte. Browser checks exercised freehand drawing, undo/redo, a filled rectangle, committed handwritten text, rectangular selection movement/deletion with undo, and image attributes with size undo. A real PNG download was verified as a 1000 × 720 RGBA image; the preview browser download completion notification was slow. `check:paint` covers contained flood fill, large-area fill, history pixel/dimension restoration, redo branching and the memory limit, plus profile/font references.

Responsive/window verification: at a 390px viewport the page and Paint window stayed within 390px, with a fitted canvas and wrapping palette controls. At 100% zoom the visible XP scrollbar moved the workspace to scrollLeft 618.5; Fit returned to the full drawing. Desktop opening from the Start menu, minimizing/taskbar restore, closing and reopening with the default introduction, and English/French About Me rendering were checked. Screenshots: `output/verification/xp-paint-about.jpg` and `xp-paint-mobile.jpg`. Multi-touch gestures and native Safari were not directly exercised.

## gift.exe / Certificate of Visit

Added a lazy-loaded XP application with the supplied Gift 6.png copied unchanged to `public/img/icons/gift/gift.png`. The desktop, Start menu, Explorer location list, taskbar and shared window manager pick up the new registry entry. An XP wizard-style blue banner, Explorer toolbar/address bar, beige controls and native-looking dialogs frame a personalized certificate. Menus support New, Save, Back/Forward, preview fit/actual size, status bar and Help. My Projects and My CV reuse their existing applications. English/French copy is centralized in `gift-data.json`; owner identity comes from the verified profile.

Certificates are playful visit souvenirs. They include the entered name in the locally bundled handwriting font, issue timestamp in the visitor’s time zone, random souvenir number, gold visitor seal and Ghazi’s styled name/signature. The PNG is drawn at 2000 × 2240 and used directly for both preview and download, so the saved file matches the preview. Names stay in component memory, with no form submission or storage. Closing removes the in-memory certificate. Names are Unicode-normalized, limited to 80 graphemes, and wrapped/fitted inside the certificate. New renders replace and revoke old image URLs; changing language preserves the name, issue date and souvenir number.

Verification: empty/81-character names were rejected; an 80-character unbroken name wrapped to three lines without overlap. A real downloaded PNG was inspected as 2000 × 2240 RGBA (about 530 KB). The preview browser’s download completion was slow, but it returned the downloaded file and the file exists. Back/Forward, the Help dialog, 100% preview scrolling, Fit, minimize/taskbar restore, and English/French certificate translation with an unchanged souvenir number were exercised. Desktop fit shows the complete certificate. At 390px width, the page, window and welcome content had no horizontal overflow; the full certificate and Save as Image action fit the phone layout. `check:gift` covers validation, Unicode names/graphemes, long-name fitting, safe download filenames, timestamp localization, registration and local assets.

Final checks also confirmed Arabic recipient text renders correctly, the Projects/CV toolbar shortcuts open the existing apps, and opening gift.exe from Start after closing begins with an empty name. The three-byte random souvenir suffix uses getRandomValues so the app also works on local HTTP previews without randomUUID support. Screenshots: `output/verification/xp-gift-welcome.jpg`, `xp-gift-certificate.jpg`, and `xp-gift-mobile.jpg`. Native Safari was not directly exercised.

## My Computer / XP drive explorer

Replaced the My Computer overview with a dedicated, lazy-loaded XP Explorer component while retaining the supplied computer icon, shared title bar, window manager, Start/taskbar integration and every existing content app. About, Skills and Certifications continue using their original ProfileContent views. The new body follows XP My Computer: blue task pane with collapsible System Tasks/Other Places/Details, grouped shared folders, silver local disks, a CD drive, network location, white file pane, Explorer toolbar/address bar, selection and status bar. New drive icons are code-native SVG in the established XP style.

Virtual drives are generated from existing data: C: has profile/skills/CV/documents/credentials/contact plus a Notepad README from the canonical biography; D: has all eight real project folders; E: opens music/pictures and the two existing video demos; F: launches Paint, gift.exe, Doom, Minesweeper, Notepad and Terminal. The network shortcut opens the actual original portfolio through the existing Internet Explorer link handler. No disk sizes, free-space figures, hardware specs or professional facts were invented. Drive definitions and English/French UI text are in computer-data.json.

Selection updates the Details pane; double-click/Enter opens items, while touch/narrow screens open on one tap. Back/Forward/Up and C:/D:/E:/F: addresses navigate inside the explorer. Search covers all virtual drives including project technologies, with accent-insensitive matching and an empty state. Tiles/Details, desktop task-pane toggling, phone task-pane overlay, item Properties and General/Drives System Properties tabs are functional.

Verification: drive selection, D: → TestFlow → existing full project folder; C: → README → Notepad; unchanged-address Go; Back/Forward/Up; React search and empty/reset; Details/Tiles; both Properties tabs; F: → gift.exe; and phone task-pane toggle/single-tap navigation. At 390px, page width was 390px and the file pane’s scroll/client widths both measured 368px. check:computer validates all drives, app/asset/project references, both videos, Unicode search and address aliases; content integrity checks pass. Screenshots: output/verification/xp-my-computer.jpg and xp-my-computer-mobile.jpg.

## Outlook Express / server-side Resend delivery

Replaced mailto draft handoff with POST /api/contact. The existing To/From/Subject/editor and XP toolbar are preserved, with pending-send disabling, sent/error XP dialogs, empty/oversized message checks and draft preservation on errors. The visitor’s email becomes Reply-To; the provider sender and recipient are fixed on the server. Delivery is plain text, matching the previous mailto output. A stable random submission identifier is reused for retries of unchanged drafts and sent to Resend as an Idempotency-Key. Successful submission clears the subject/body, while a changed draft receives a new identifier.

The key stays in the ignored local .env and Railway runtime variables. It is never in VITE_ variables, source content, browser bundles or Docker build context. The user confirmed the fixed recipient is the Resend account email; the API key was authenticated through a read-only domain-list request, which returned HTTP 200 and no domains. The default onboarding sender is configured for that confirmed inbox. No real email was sent by the agent.

Added one Node HTTP runtime to serve both the built portfolio and API. The Dockerfile uses Node 24 as a non-root user, honors PORT and keeps the existing 35000 default. Development uses the same API handler through a Vite server-only plugin. Static serving retains SPA fallback, gzip, MIME types, HEAD/cache validation and media/PDF range requests. The legacy nginx configuration is retained for reference only. Updated DEPLOYMENT.md explains the Railway runtime variables and redeploy steps. Railway CLI access was expired/unlinked, so no live deployment was changed.

API protections include fixed server-side recipient, strict JSON/size/field checks, cross-site browser request rejection, a honeypot, bounded in-memory per-IP/global rate limits, provider timeouts and sanitized errors/logging. No message text, address or credential is logged. Scaling beyond one replica requires shared rate-limit storage.

Verification: 17 mocked delivery/HTTP regression tests pass. Tests cover fixed sender/recipient and Reply-To, unchanged retry keys/payloads, invalid headers/addresses/lengths, origin checks, oversized/chunked bodies, honeypot, missing configuration, spoofed forwarding headers, Railway IP limits, provider failures/timeouts/throttling, false-success prevention, static HTML mistaken for API JSON, SPA/health routes, gzip/modules/WASM, media byte ranges/HEAD/cache validation, dotfile/traversal and symlink escape blocking. Sandbox loopback binding required running these localhost-only tests with network permissions. All Resend sends in tests are mocks.

Browser verification used an isolated built-site server with a mock provider: empty-body validation prevented a request; sending disabled editing; the first simulated failure kept the draft; Ctrl+Enter retried with the same provider key; success cleared the subject/body and displayed an XP dialog. French mobile sending also displayed the translated confirmation with no horizontal document overflow at the observed CSS viewport width. These three browser requests did not send mail. The mock server/tab were removed afterward. The actual supplied key authenticated again with HTTP 200 through read-only domain listing; no verified domains exist. A build scan confirmed the key is absent from generated browser JS, source maps, styles, HTML and JSON. Screenshots: xp-outlook-resend-test.jpg and xp-outlook-resend-mobile-test.jpg; both show mock confirmations, not live delivery.

## My Documents / XP file explorer

Replaced the document placeholder with a lazy-loaded XP Explorer application that reuses the My Computer styling, existing icons, shared menus and window manager. The root contains the original PDF, About Me.txt, Contact.txt, Original Portfolio.url, Professional Profile and Certificates folders, and the existing project/picture/music applications. Professional Profile provides experience, education, technical skills, languages and strengths as Notepad files generated from the canonical profile. Website dates and locations remain authoritative, as selected by the owner.

Seven credential folders contain source-backed summaries. The six published credentials also include the actual local badge and original verification URL; the Hashgraph credential has only its CV-backed text record, with no invented date, badge or verification URL. Image files open in the existing Picture and Fax Viewer with the complete badge gallery. The original CV remains unchanged. File sizes come from actual assets or generated UTF-8 content; no modified timestamps are fabricated. English/French UI and labels are centralized in documents-data.json; professional source prose remains English.

Back/Forward/Up, folder breadcrumbs and editable addresses, content search, Tiles/Details, sorting, collapsible task pane, Properties, copy filename and Save a Copy are connected. Text, original image/PDF assets and Internet Shortcut files have download actions. Browser checks exercised CV opening, experience text with the selected website dates/locations, credential folders, badge preview and next-image navigation, search/empty reset, history, sorting, Properties and Help. Save a Copy was invoked; the browser bridge did not return a completed download file, so operating-system download completion was not verified. The download payloads and exact asset sizes are covered by check:documents.

At a 390px CSS viewport, page width remained 390px and file-pane scroll/client widths both measured 368px. Phone task-pane toggling, single-tap folder navigation and invalid-address feedback were exercised. Desktop and phone screenshots are output/verification/xp-my-documents.jpg and xp-my-documents-mobile.jpg. Native Safari was not directly tested. check:documents validates all 40 files/folders/shortcuts in both languages, assets, image-gallery indices, original PDF reference, source facts, Unicode search, folder addresses and sorting; content integrity and production build pass.

## Supplied My Computer drive icons

Replaced the generated drive SVGs with the owner-supplied original ICO files: Local Disk (C-) for C:, Local Disk (D-) for D:, Green Drive for media E:, Optical Drive for F:, and Network Drive for the portfolio network location. All eight supplied files are copied unchanged into public/img/icons/drives; Blue Drive, Missing Drive and Disconnect Network Dtive are available in the centralized driveIcons mapping without adding fictitious unavailable drives. The same artwork appears in Tiles/Details, the selection pane, drive Properties and the System Properties drive list. Existing layout and navigation are retained. Browser verification confirmed all five displayed ICOs decoded at 48px and the C: selection pane uses the supplied icon. All eight files match the originals byte-for-byte; check:computer and the production build pass. Screenshot: output/verification/xp-my-computer-supplied-icons.jpg.

## About Me / XP profile sheet

Replaced the plain About mode with a dedicated lazy-loaded profile sheet using the shared XP window manager and menus. White header, classic tabs, recessed document pane, group boxes and native XP action buttons follow Control Panel/System Properties styling. General shows the existing profile photo, title, location, tagline, introduction and biography; Experience contains four expandable roles and original CV responsibilities/technologies with the owner-selected website dates and locations. Education keeps both original academic records. More about me contains the existing opportunity statement, languages and professional strengths, plus a shortcut to the handwritten Paint introduction. No new professional claims were added. Skills and Certifications retain their existing views.

The existing Projects, CV, Contact, Certifications and Paint applications handle all shortcuts. File/View/Tools menus expose the profile actions and tab navigation. Tabs support arrows, Home and End with roving focus and ARIA tab relationships. Content scrolls inside the panel while tabs/footer stay visible; container queries adapt the sheet to narrow windows. English/French UI labels live in about-data.json; professional source prose remains English. An optimized 331 × 400 JPEG (about 72 KB) is derived from the existing profile.jpg for reliable small-screen display; the original photo is unchanged.

Browser checks confirmed all four tabs, expanding the Hellenic Cables role, the concrete CV responsibilities, original dates/locations, education/languages, keyboard tab navigation, View menu tab selection, and Projects/CV/Contact/Paint launching. No email was sent. English/French switching worked. At a 390px CSS viewport the page remained 390px and the panel scroll/client widths were both 364px on the checked tabs. The initially blank mobile photo was corrected with the optimized asset and verified after refresh. Shared window closing/reopening and desktop sizing were checked. Native Safari was not directly exercised. Production build and source/content integrity checks pass. Screenshots: output/verification/xp-about-profile.jpg, xp-about-experience.jpg and xp-about-mobile.jpg.

## Notepad reading size and taskbar language UX

Changed Notepad's default from 230 × 270 at the bottom of the desktop to 840 × 660 at (150, 65), with a 340 × 320 resize minimum and viewport clamping from the existing window manager. The editor now fills the content pane correctly, uses 15px monospace text with 1.65 line spacing, readable padding, soft wrapping and 16px text on phones. Editing and file-opening behavior remain unchanged.

Replaced the taskbar language popup's clickable div/opposite-language toggle with two semantic menuitemradio buttons, real English/Français labels, flag icons, current checkmark and a visible EN/FR tray indicator. Pointer selection and keyboard Enter apply through the locale store, close the menu and return focus to the tray button. Opening focuses the current choice; arrow keys/Home/End navigate, Escape dismisses, and outside pointer/focus or Tab dismisses appropriately. Language and volume popups are mutually exclusive. The tray is now a non-shrinking flex item so taskbar app buttons cannot run underneath it. The existing login language control is unchanged.

Browser checks verified the 840 × 660 desktop default after reopening, text size/line height, English/French selection and immediate Notepad title updates, current-choice focus, ArrowDown/Enter switching, Escape/focus restoration, Tab and outside click, and language/volume exclusion. At a 390px CSS viewport, page width was 390px, editor scroll/client widths were both 384px, mobile text was 16px, and the language popup stayed inside the viewport. No user text was edited for testing. The initial default note was inspected before reopening for default-size verification. Build and content integrity checks pass. Screenshots: output/verification/xp-notepad-language.jpg and xp-notepad-language-mobile.jpg.

## Spider Solitaire / original XP artwork

Added a lazy-loaded Spider Solitaire application to the existing desktop, Start menu, Explorer location list, taskbar and XP_EXTRAS virtual drive. The shared window manager handles dragging, resizing, minimizing, maximizing and closing. The application uses a native-style Game / Deal! / Help menu bar, original felt table, ten columns, bottom stock, completed runs and score panel. Compact beige action controls appear on narrow windows. English/French labels, rule text and menus are centralized in spider-data.json and spider-menu-data.json.

The owner-selected source is https://github.com/esc0rtd3w/xp-cards at commit 33a6d492ffa63f0b16b1ad982930c16d367f6bbb. That archive contains PE32 executables/DLLs, not browser source. After the owner selected a playable web game with original XP artwork, the application uses an independent browser rules engine with static resources extracted from spider.exe. scripts/extract-xp-spider.py reads PE resource tables without loading or executing binaries. It supports both BITMAPCOREHEADER and BITMAPINFOHEADER palettes, decodes all 52 native 71 × 96 faces, CARDBACK, FELT and the original About bitmap, reconstructs the native icon group, and copies six WAV resources unchanged. Extraction is pinned to the binary SHA256 d309a839843ccd8b9edef7a271a611eb7794f83a825b69a87cc259c9ede87288. The source, resource IDs and 62 output checksums are recorded in public/game/spider/sources.json; NOTICE.txt retains Microsoft attribution and distinguishes these archival assets from the portfolio’s MIT license. No EXE/DLL is served by the website.

Gameplay includes a shuffled 104-card deck, 54 initial tableau cards and five 10-card stock rows; one-, two- and four-suit difficulties; same-suit descending movable runs; placement on the next higher rank regardless of suit; empty-column placement; automatic same-suit King-to-Ace removal and an eight-run win. Stock dealing is blocked while any column is empty. Score begins at 500, each move/deal/undo costs one point, completed runs add 100, and undo reverses any removed-run bonus. Hints prioritize useful suit-building/reveal moves. Cards support mouse drag/drop, click/tap selection and keyboard navigation. New Game and Restart use XP dialogs; restart reconstructs the identical original deal.

The browser stores validated game state, original deal, elapsed time, sound/card-size options and the latest 30 undo snapshots. Saving failures keep the current game playable and show a message. The timer pauses on minimize, application switching, hidden documents, dialogs or completion; sounds stop on inactivity and load on demand after opting in. Rules/help, original About art with attribution, native sound options and larger scrollable cards remain available through menus.

Verification: check:spider exercises all difficulties and 104-card conservation, mixed-suit legality, single/group/empty moves, illegal placements, stock restrictions, reveals, complete-run removal, undo scoring/restoration, an eight-run win, randomized legal play and malformed saves. Asset checks cover all 62 hashes, card dimensions and native suit/rank mapping. Browser tests exercised a legal click move, an invalid move, native mouse drag/drop, hint text/highlights, keyboard undo, stock dealing, exact restart, 1/2/4-suit selection, Help/Escape, native Deal!, Options/About, sound controls, Start-menu launch and close/reopen persistence including undo and larger-card preferences. A minimized timer stayed unchanged across subsequent checks. Full-game victory is covered by the engine test rather than manual browser play.

At the measured 390px CSS viewport, page width stayed 390px and compact table scroll/client widths were both 384px. A phone move succeeded; larger-card mode scrolled within a 720px table while the page stayed within the viewport. French controls and difficulty dialogs were checked. Original bitmap loading and native About artwork dimensions were verified. QA used a separate localhost origin so the main preview’s saved deal was retained. The temporary server/tab were removed; the main game remains available. Native Safari was not directly tested. Build, content integrity (19 applications) and My Computer checks pass. Screenshots: output/verification/xp-spider-original-artwork.jpg and xp-spider-mobile.jpg.

## Desktop shortcut wrapping

Fixed Spider Solitaire being clipped beneath the taskbar after becoming the fifteenth desktop shortcut. DesktopAppsLayout now measures the available desktop height and wraps overflow into additional columns while preserving the original two-column ordering. The desktop reserves taskbar space and bottom padding; very narrow/short screens can scroll horizontally. Icons use object-fit: contain. Browser geometry checks confirmed every shortcut above the taskbar at 1280 × 560 and 390 × 844, with no page-width overflow on the phone. The main preview’s original two columns remain in place and Spider appears fully in the third column. Screenshot: output/verification/xp-desktop-spider-visible.jpg. Production build passes.

## XP power, standby and logoff experience

Replaced the Start menu footer’s immediate route links with semantic buttons that open authentic-style blue power dialogs. Turn Off Computer offers Stand By, Turn Off and Restart; Log Off offers Switch User and Log Off. The existing desktop becomes desaturated/dimmed while a choice is open, with native-looking colored square icons, Cancel, contextual hint text and a Windows flag. Existing red power/amber key artwork is reused; standby/restart/switch icons are code-native SVG in the same XP style. English/French labels and transition timings are centralized in session-data.json.

A small lifecycle module and the existing connection store manage confirmation, standby/wake, logoff/login, shutdown/off/power-on and restart/boot states. The global SessionController reuses LoginBrand and the existing Step1/2/3Loading and Login components. Logging off and shutting down use the blue XP session screen; Turn Off ends on a black, amber-text safe-to-close screen with a Ghazi XP logo, personal thank-you and power-on control. Restart and Power On play a short version of the existing boot visuals before welcome. The existing 3.24-second shutdown sound is allowed to finish during the transition and respects the stored volume. Wake and login return to the same mounted desktop.

App hides the live router view instead of unmounting it during simulated session transitions. This preserves Notepad edits, Paint canvases, contact drafts, open windows and game positions within the visit; it is not new permanent storage for unsaved documents. Office gates its provided active-window ref and Doom/Spider activity while the desktop is suspended. Music rejects hidden-session playback and pauses on confirmed session actions; choosing/Cancel leaves music playing. Minesweeper’s timer pauses, Spider saves/pauses, and picture slideshows stop during suspension. Media stays paused when returning, ready for explicit playback. No real operating-system shutdown or browser close is performed.

The confirmation dialog defaults to Cancel, traps Tab focus, supports Left/Right navigation and Escape, and makes the underlying desktop inert. Focus returns to Start after cancellation and to the account on welcome. Standby wakes on a normal key or its button. Timed transitions clear old timeouts on state changes/unmount and ignore stale phase callbacks. Motion is reduced when requested. No professional facts or portfolio files were changed.

Verification: check:session covers allowed/invalid choices, Cancel, standby/wake, logoff/switch, shutdown/off/power-on, restart/boot/login, inactive desktop state, rapid duplicate actions and stale callbacks. Browser QA on a separate localhost origin exercised Cancel/Escape and keyboard wrapping, standby/Enter wake, Switch User/login, full Log Off/login, shutdown/power-on/login, restart/login, and exact Notepad text and Solitaire-card preservation. Music playback remained active through choosing/Cancel and paused after confirmed Log Off. French dialogs fit a measured 390px viewport (362px dialog width, 390px page width). The off screen was checked at full opacity on a near-black background after correcting its initial fade. The temporary test tab/server were removed; the main desktop’s session was not logged off or shut down for QA. Production build passes. Screenshots: xp-power-dialog.jpg, xp-logoff-dialog.jpg, xp-logging-off.jpg, xp-turned-off.jpg, xp-power-mobile.jpg and xp-logoff-mobile.jpg under output/verification/. Native Safari and actual audible output were not directly checked.
