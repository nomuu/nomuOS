# Enabling your sites to display inside Browie (NomuOS)

Browie loads project pages in an `<iframe>`. By default browsers **block**
cross-site framing via `X-Frame-Options` / CSP `frame-ancestors`. To let your
**own** pages (imronaldmendoza.com and its sub-pages/subdomains) show inside
Browie, they must send a header that whitelists the origin where NomuOS runs.

> You cannot bypass this from the browser/JavaScript side — it is enforced by
> the **server that hosts the page being framed**. Third-party sites you don't
> control (Facebook, YouTube homepage, Canva, etc.) can never be embedded.

## 1. Pick the file for your host

| Host | File | Where it goes |
|------|------|---------------|
| **Vercel** (your current setup) | `vercel.json` | root of the imronaldmendoza.com repo |
| Netlify / Cloudflare Pages | `_headers` | published output dir (or repo root on Netlify) |
| Apache | `.htaccess` | site document root |
| nginx | `nginx.conf.snippet` | inside your `server {}` / `location {}` |

Your site is deployed on **Vercel** (behind Cloudflare), so `vercel.json` is the
one to use. If you already have a `vercel.json`, merge the `headers` array into it.

## 2. Set the allowed origin

Replace `https://YOUR-NOMUOS-ORIGIN` with the exact origin where NomuOS/Browie
is served. Examples:

- NomuOS hosted at `https://imronaldmendoza.com/nomuos` → same origin as your
  pages, so `frame-ancestors 'self'` is already enough. You can delete the extra
  origin.
- NomuOS on a subdomain, e.g. `https://os.imronaldmendoza.com` → use
  `frame-ancestors 'self' https://os.imronaldmendoza.com`.
- NomuOS on a different host (e.g. GitHub Pages) → put that full origin.

**Subdomains are separate origins.** Project pages like
`https://mockify.imronaldmendoza.com` need the header applied on *that* deployment
too (each subdomain/project that you want to embed).

## 3. Remove any X-Frame-Options

If your current config sends `X-Frame-Options: DENY` or `SAMEORIGIN`, **remove it**.
It overrides `frame-ancestors` and blocks embedding. The provided Apache/nginx
files explicitly unset it; for Vercel/Netlify just make sure you're not setting it.

## 4. Deploy & verify

After deploying, check the headers:

```bash
curl -sI https://imronaldmendoza.com | findstr /I "content-security-policy x-frame-options"
```

You should see `content-security-policy: frame-ancestors 'self' https://...`
and **no** `x-frame-options`. Then open Browie → a project → "Load inside Browie".

## Notes & tradeoffs

- **Clickjacking:** allowing framing lowers clickjacking protection. Keep
  `frame-ancestors` restricted to your own origins only — never use `*`.
- **file:// won't work:** if you open NomuOS by double-clicking `index.html`
  (a `file://` URL), the parent origin is `null` and cannot be safely
  whitelisted. Serve NomuOS over `http(s)` (e.g. `npx serve`, Vercel, etc.)
  to test embedding.
- These files are **templates for the imronaldmendoza.com project** — this
  NomuOS repo does not host that site, so they take effect only once added
  there and deployed.
