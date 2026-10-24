# VERITRAIL installable app — release guide

Three follow-ups from the [UX and PWA uplift](./UX_PWA_UPLIFT.md) cannot be finished from the
repository alone. This guide gives the exact steps for each, and what blocks the rest.

| Item | Status | Needs |
|---|---|---|
| Real-device install and offline test | Ready to run | The published HTTPS site and one iPhone, one Android phone and a desktop |
| App store listings | Ready to package | Developer accounts and, for Google Play, a signing key |
| Governance briefing notifications (Web Push) | Assessed, not built | A sending service, stored subscriptions and a consent decision |

Automated coverage that already runs in CI (`npm run test:smoke`): every manifest icon,
screenshot and shortcut loads; the service worker is served as JavaScript; the offline page
exists; and neither the website nor the workspace header wraps onto a second row at 1280 px or
390 px.

## 1. Real-device test checklist

Run on the **published** site (installation needs the real HTTPS origin; Lovable previews never
register the service worker by design).

### Android — Chrome

1. Open the site, read two pages. **Expect** the "Install the VERITRAIL app" card at the bottom.
2. Tap **Install**. **Expect** Chrome's install sheet with the app screenshots and description.
3. Launch from the home screen. **Expect** no browser toolbar, the shield icon, and the home page.
4. Long-press the icon. **Expect** five shortcuts; *Controls* opens the control library.
5. Turn on airplane mode and reopen. **Expect** pages you read to open; an unread page shows
   "You're offline — the trail is paused, not lost." with the saved-page list.
6. Turn airplane mode off. **Expect** a "Back online" notice.

### iPhone and iPad — Safari (iOS / iPadOS 16.4 or later)

1. Read two pages. **Expect** the install card with **Show me how**.
2. Tap it. **Expect** three numbered steps (Share → Add to Home Screen → Add).
3. Follow them; launch from the Home Screen. **Expect** full screen with a **Back** button in the
   header on inner pages (standalone mode has no browser back button).
4. Repeat the offline check from step 5 above.

### Desktop — Chrome or Edge

1. **Expect** the install icon in the header beside search and theme.
2. Install, then right-click the dock / taskbar icon. **Expect** the five shortcuts.
3. Re-launch from the icon while the app is open. **Expect** the open window to come forward
   (`launch_handler: focus-existing`), and a shortcut to navigate it.

### macOS — Safari 17 or later

1. **Expect** the install card with **Show me how** and the "File › Add to Dock" steps.

Record the device, OS and browser version, and a screenshot of any step that differs.

## 2. App store listings

The site already meets the store packagers' requirements: a manifest with `id`, name, icons
including maskable ones, screenshots, shortcuts, and a service worker. Use
[PWABuilder](https://www.pwabuilder.com) with the published URL.

### Google Play (Trusted Web Activity)

1. In PWABuilder, choose **Android** and set a package id such as `com.veritrail.app`.
2. Let PWABuilder create a signing key, or supply yours. **Keep the key and its password** — every
   future update must be signed with it.
3. PWABuilder produces `assetlinks.json`. Publish it at
   `https://<your-domain>/.well-known/assetlinks.json` (add it to `public/.well-known/` and confirm
   the host serves dot-folders). Without it the app shows a browser address bar.
4. Upload the `.aab` in the Play Console (a one-off developer registration fee applies) and
   complete the content rating and data-safety forms. The data-safety answers should match the
   privacy notice: lead forms collect name, work email and organisation; analytics are cookieless.

### Microsoft Store (MSIX)

1. Reserve the app name in Partner Center.
2. In PWABuilder choose **Windows**, and paste the Package ID, Publisher ID and Publisher display
   name from Partner Center.
3. Upload the generated package and complete the listing.

### Apple App Store

Apple does not accept web apps directly. iPhone and iPad users install through **Add to Home
Screen**, which the site already guides. A store listing would need a native wrapper (for
example Capacitor) and enough native value to pass App Store Review Guideline 4.2 (minimum
functionality); a thin wrapper around the website is likely to be rejected. Not recommended now.

### Before submitting to any store

- Set the real production domain (`VITE_SITE_URL` for share images; `site_url` in
  `platform/app/website/site.yaml`; `node scripts/generate-sitemap.mjs https://<domain>`).
- Replace the placeholder contact address in `site.yaml` and the template privacy notice and terms
  (`legal-*.md` are marked "legal review required").

## 3. Governance briefing notifications (Web Push) — assessment

**Recommendation: do not build yet.** The site has no way to send messages today (Cloudflare
Workers cannot use SMTP, and confirmation e-mails are not sent either), and push needs a consent
and content decision first. When those exist, the work is moderate.

| Need | What it involves |
|---|---|
| Keys | A VAPID key pair; the private key as a server secret |
| Consent | An explicit "Notify me about governance briefings" control, never an automatic prompt; a privacy-notice update |
| Storage | A `push_subscriptions` table (endpoint, keys, topics, created_at) locked by RLS and written only by a server function, with unsubscribe and expiry clean-up |
| Sending | A scheduled job or admin action that signs and sends messages (Web Push protocol), with retry and removal of expired endpoints |
| Client | `pushManager.subscribe` after consent, a `push` and `notificationclick` handler in `public/sw.js` |
| Platforms | Android and desktop browsers; iPhone and iPad only for apps added to the Home Screen (iOS 16.4+) |
| Evidence | Log sends with counts only — no personal data in analytics, matching the cookieless policy |

Lead forms deliberately do **not** queue submissions offline: forms must say when nothing was
recorded (AGENTS.md), so an offline submission is refused with that message instead.
