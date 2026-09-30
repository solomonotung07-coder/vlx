# Featured Rentals CMS — setup

The homepage **Featured Rentals** section is now driven by a small CMS at
**`/admin`**. Products (image, name, price, WhatsApp number, show/hide, order)
are stored in [Supabase](https://supabase.com) (free tier is plenty).

Until Supabase is connected the site keeps working and shows the built-in
list in `src/data/defaultRentals.js`.

---

## 1. Install the new dependency

```bash
npm install
```

(`@supabase/supabase-js` was added to `package.json`.)

## 2. Create the Supabase project (≈5 minutes)

1. Sign in at <https://supabase.com> → **New project**. Pick a region close to
   Nigeria (e.g. _West EU / London_ or _Frankfurt_).
2. Open **SQL Editor → New query**, paste the whole of
   [`supabase/schema.sql`](supabase/schema.sql) and click **Run**.
   This creates the `rentals` table, the `rental-images` storage bucket, the
   security rules and 4 starter products.
3. **Authentication → Users → Add user → Create new user.** Enter the email and
   password the admin will log in with (tick _Auto confirm user_).
4. Back in the SQL editor, give that email CMS access:

   ```sql
   insert into public.cms_admins (email) values ('admin@yourdomain.com');
   ```

   Repeat for every person who should be able to edit products.

5. Recommended: **Authentication → Sign In / Providers → Email** — turn off
   **Allow new users to sign up**. (Even if left on, only emails in
   `cms_admins` can change anything.)

## 3. Connect the website

Copy `.env.example` to **`.env.local`** (already git-ignored) and fill in the
values from **Project Settings → API / API Keys**:

```env
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...   # "anon" or "publishable" key
```

Restart `npm run dev`, then open <http://localhost:5173/admin>.

> The anon/publishable key is meant to be public. Never put the
> **service_role / secret** key in the frontend.

## 4. Using the CMS

| Action                     | How                                                                                                         |
| -------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Add a product              | **Add product** → upload an image (or paste a URL), name, price + period, WhatsApp number → **Add product** |
| Edit                       | Pencil icon on the card                                                                                     |
| Fit the photo to the card  | In the form: **Fill card** or **Show whole image**, zoom slider, then drag the photo (or use arrow keys)    |
| Hide / show on the website | Eye icon, or the _Show on website_ switch in the form (hidden = draft)                                      |
| Change the order           | Up / down arrows (the homepage uses the same order)                                                         |
| Delete                     | Bin icon → confirm (the uploaded image is removed too)                                                      |

Images are resized in the browser (max 1600 px, WebP) before upload, so large
phone photos are fine. The price is displayed as `₦180,000/day`. Changes appear
on the homepage on the next page load.

### Image framing (fit / zoom / position)

The framing box in the form has the same 2:1 shape as the homepage card image.
**Fill card** crops the photo to fill the box; **Show whole image** shrinks it
so nothing is cut off (white around it). Zoom crops tighter, and dragging picks
which part stays visible. The side panel previews the card and a wider tablet
card. The original file is never altered, so you can re-frame at any time.

> Already ran `schema.sql` before this feature existed? Run
> [`supabase/002_image_framing.sql`](supabase/002_image_framing.sql) once in
> the SQL Editor to add the framing columns.

### Sign-in lasts 30 minutes

Admins stay signed in for **30 minutes from the moment they sign in**, whether
or not they are active. No countdown or warning is shown; when the time is up
the CMS signs out and asks for the password again. Closing and reopening the browser doesn't reset the clock, and a login
older than 30 minutes is never reused.

The database enforces the same limit, so an old login can't change products
even if the browser check is bypassed. To turn that on for an existing project,
run [`supabase/003_session_limit.sql`](supabase/003_session_limit.sql) once in
the SQL Editor. To use a different limit, change `SESSION_LIMIT_MINUTES` in
`src/lib/adminSession.js` **and** `30 * 60` in that SQL file.

## 5. Deploying

- Add the same two `VITE_SUPABASE_*` variables wherever the site is **built**
  (Vercel/Netlify → Environment Variables; for a local `npm run build`,
  `.env.local` is enough). Vite bakes them in at build time.
- `/admin` is a client-side route. The host must serve `index.html` for it:
  - **Vercel** – works out of the box for Vite, or add a rewrite to `/index.html`.
  - **Netlify** – add `public/_redirects` containing `/*  /index.html  200`.
  - **GitHub Pages** – copy `dist/index.html` to `dist/404.html` after building.

## Files added / changed

```
supabase/schema.sql              database, storage & security rules (run once)
.env.example                     env var template
src/lib/supabase.js              Supabase client
src/lib/rentals.js               queries, image upload, price formatting
src/hooks/useRentals.js          loads live products for the homepage
src/data/defaultRentals.js       fallback list when Supabase isn't configured
src/pages/admin/*                the CMS (login, dashboard, product form, image framer, styles)
supabase/002_image_framing.sql   adds image framing columns to an existing database
supabase/003_session_limit.sql   30-minute admin sign-in limit (database side)
src/lib/adminSession.js          30-minute sign-in limit (browser side)
src/pages/Home.jsx               Featured Rentals now reads from the CMS
src/App.jsx                      /admin route (no navbar/footer, lazy-loaded)
src/index.css                    loading/empty styles for the rentals grid
```
