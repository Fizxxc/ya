# VEIL — Invisible Watermark Studio

A Next.js web app for generating an experimental visually subtle DCT watermark and testing decoding from files or a phone camera. **Deployable to Vercel without environment variables or a separate backend.**

## Deploy

1. Extract ZIP and push its contents to a GitHub repository (package.json at repository root).
2. In Vercel: Add New → Project → Import Git Repository.
3. Framework: Next.js (auto), Root Directory: `./`, Build Command: `npm run build` (auto).
4. Click Deploy. HTTPS is provided by Vercel, allowing camera access with user permission.

Alternatively, in this directory run `npm install`, `npm run dev`, or `npx vercel` after logging in to the Vercel CLI.

## Usage

- Generate: upload an image, enter a message, generate and download PNG. An 8-hex-digit image ID is embedded; the message is **only saved in the creating browser's localStorage**, not in the image or in a server.
- Scanner: use live camera on HTTPS (or localhost), aim at the full image; camera scans a centered square region. Change scan area slider to match framing. File test option checks whether decoder can read the generated PNG directly.
- For cross-device message sharing, a backend vault with authentication, encryption, database, and ID lookup must be added. This demo does **not** have that feature.

## Important limitations

- This is an **experimental proof of concept**, not a proven camera-robust or cryptographically secure watermark. Camera decoding may fail frequently due to resampling, angle, screen moiré, compression, focus, perspective and lighting.
- The current decoder assumes the image fills a centered square frame and **does not** implement automatic image detection or perspective correction. If an image is letterboxed or non-square, scanning it through a camera is particularly unreliable.
- The image is normalized to 512×512 with white letterboxing. The downloaded image is a 512×512 PNG; the original pixel dimensions are not retained.
- The message stays in the local browser and is not available on another phone. The 32-bit ID plus CRC is for demonstration only; it is not a secure identifier, and CRC is not a signature.
- Use non-sensitive demo messages only. Do not use this as access control, document authentication or secret storage.
- There are no paid APIs, API keys or Supabase credentials required.

## Production roadmap

- Add robust synchronization pilots, corner detection and homography, temporal frame registration, stronger ECC and 128-bit IDs, adaptive image quality metrics and camera field tests.
- Add Supabase Auth/Postgres/Storage, RLS, server-side token verification, rate limiting and encrypted vault.
- Move DCT decoder into WASM worker, benchmark across iOS Safari and Android Chrome.

## v1.1 — 2026-10-20
- Fixed Vercel TypeScript build error: `videoWidth`/`videoHeight` are now accessed only on `HTMLVideoElement`, while image/canvas sources use their correct dimensions.
- Refreshed mobile-first typography, spacing, sticky tab navigation, and restrained visual styling.
- Pinned Node.js to `22.x` instead of `>=20` to avoid automatic future major upgrades.
- Important: This is an experimental local-only prototype. Messages are saved in the generator browser's localStorage, not synced between devices. Camera scanning is not validated as reliable; PNG file decode is the primary test.
- To deploy: push project contents to GitHub, import repository in Vercel, use Next.js preset and Node 22.x, then deploy. No environment variables needed.
- Run `npm install && npm run build` before deployment. This environment could not download npm dependencies to complete that check; Vercel must run the build.
