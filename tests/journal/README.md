# Journal regression checks

Run `pnpm test` (or `pnpm run test:journal`). The runner starts its own Vite server on a free port, runs both browser suites, and closes the server, including on failure. No separately running app is needed.

Use `pnpm run lint` and `pnpm run typecheck` for static checks. On Linux/macOS, install Puppeteer Chrome with `pnpm exec puppeteer browsers install chrome`, or set `CHROME_PATH` to an installed browser. On Windows the tests default to Microsoft Edge.
In another terminal run `pnpm run typecheck`, `pnpm run test:journal`, and `pnpm exec vite build`.

Set `CHROME_PATH` if Chromium/Edge is installed elsewhere. Set `JOURNAL_OUTPUT` to choose the screenshot/report directory (default: `test-results/journal`). All API requests from the test browser are intercepted; tests never publish real diary entries or upload to production storage. The fixture uses the production editor, renderer, App Store component and JournalSpace; it is not included in the normal production entry.

The suite covers LaTeX paste, code literal preservation, editing stability, handwriting undo/redo and serialization, themes, image upload and failure recovery, private payloads, drafts, account isolation, legacy content and mobile layout. Run the backend route and permission checks with `npm run test:journal`; they do not require a database.

## Content contract

Entries still use the existing `content` HTML field and `/posts` endpoints. Formula source is stored in `span[data-type="journal-math"][data-latex][data-display]`. Handwriting is stored in `figure[data-type="journal-drawing"][data-strokes]`. Both the editor and `BlogContent` use the same normalization module and CSS; the reader generates KaTeX and SVG from the stored sources. No database migration is needed.

Images use `services/media.ts` and the existing journal upload folder. Temporary upload decorations are not serialized. Publishing stays disabled until all uploads finish; failed cloud uploads are not silently saved as local base64 images. Text remains in the draft.

Drafts are local to the device, scoped by user ID and entry ID. Legacy unscoped drafts have an explicit recovery action. New entries default to private. Deploy the backend privacy fix alongside the frontend: private detail URLs require `PRIVATE_POST:READ` (or superadmin access), matching the private list route.

The Note Learn App Store card is a built-in entry in `constants/builtinProjects.ts`. A database project with the same demo URL takes precedence, avoiding duplicates. Its built-in card has no database edit/delete controls.

The checks mock cloud storage and persistence. They do not verify live R2 credentials, production database state, physical stylus pressure, or palm rejection on an actual iPad.

## Formatting and media checks

The media suite is included in `pnpm test`. For a manually started server, set `JOURNAL_BASE_URL` and run `node tests/journal/media.test.mjs`. It checks selected-text font/size/color, emoji, mocked online meme search, GIF insertion, platform/native video round trips and theme-aware ink. The editor and every reader follow the Orion theme: white and violet by day, cosmic black and gold in dark mode. Custom text hues are adjusted to at least 4.5:1 contrast against the external reader paper, without changing stored source colors.

The online picker fetches the keyless Imgflip popular template list only when opened, supports local name filtering and a small Chinese keyword alias list, and stores the original remote image URL. It is not a general web image search. Uploaded GIF/JPG files use the existing R2-first upload flow (10 MB maximum); remote availability remains controlled by the image host. Video embeds accept YouTube, Bilibili and Vimeo, and HTTPS MP4/WebM/OGG links; platform playback may depend on the viewer's network and the video's embed permissions.
