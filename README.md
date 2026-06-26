# Key Shift London — website

Static marketing site for Key Shift London CIC (keyshiftlondon.org).
Single-page, no build step: `index.html` + `ksl-assets/`.

## Local preview
Open `index.html` directly, or serve the folder:
```bash
python -m http.server 8000   # then visit http://localhost:8000
```

## Deploy
- **GitHub Pages:** served from the default branch root (`.nojekyll` keeps every file as-is).
- **Netlify / Cloudflare Pages:** `_headers` applies the security headers (CSP, HSTS, etc.).
- **Apache:** `.htaccess` does the same.
  (GitHub Pages ignores custom headers; the site still works, just without them.)

## Go-live wiring (in `index.html`, near the bottom `<script>`)
- `CAL_LINK` — Cal.com booking URL; every "Book a conversation" button uses it.
- `ENQUIRY_API` — the deployed enquiry endpoint. While empty, the form confirms
  gracefully without sending. Keep the `connect-src` in `_headers` / `.htaccess` in
  sync with this origin.

The `KeyShiftLDN/ksl-payments` repo holds the payments/automation backend.
