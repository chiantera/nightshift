# Port back to PLT — login page (disclaimer + checkbox + AuthTour)

Changes made to the SchedaPRO login page that we want to port **back to PLT**
(`/home/deckard/projects/plt/alpha-pwa/`). SchedaPRO was forked from PLT, so the
`AuthScreen` / `useAuth` structure is shared — these should drop in with only
brand/copy changes (Digital Trainer → PLT, Aria → GiulIA, fitness → legale).

Reference commits in `chiantera/schedapro`:
- `c6167e97d` — full login page (disclaimer+checkbox, AuthTour, layout swap, hero, logout fix)
- `ffeeb99af` — top-align columns

All login code is **inline in `frontend/src/main.tsx`** (no module folder); CSS in
`frontend/src/styles.css`.

---

## 1. Disclaimer with mandatory checkbox ✅ (the key piece)

A warning card (professional responsibility + privacy) with a "Ho letto e
compreso" checkbox that **gates** the submit button until ticked.

- **State:** `const [accepted, setAccepted] = useState(false);` in `AuthScreen`.
- **Guard:** `handleSubmit` returns early `if (!accepted) return;`
- **Submit button:** `disabled={loading || !accepted}`.
- **Markup:** `.auth-disclaimer.auth-disclaimer--card` (role="note") containing two
  `<p>` (⚠️ Importante / 🔒 Privacy) + a `<label className="auth-accept">` wrapping
  the checkbox; plus `{!accepted && <p className="auth-accept-hint">Spunta la casella…}`.
- **CSS:** `.auth-disclaimer`, `.auth-disclaimer--card`, `.auth-accept`,
  `.auth-accept-hint` in `styles.css`.

**Port note:** domain-independent. Only replace the warning copy with PLT's legal
wording (no medical disclaimer; keep the "non sostituisce il giudizio di un
professionista / DA VERIFICARE" spirit and the privacy/anonimizzazione line).

---

## 2. AuthTour — first-run welcome panel on the login page ✅

A modal welcome panel shown on first visit, reusing the onboarding wizard's
`.tour-*` look. Guides: read the warning → tick the box → sign in/up.

- **Component:** `AuthTour` (just above `AuthScreen`), rendered as the first child
  of `.auth-screen` (`<AuthTour />`).
- **Persistence:** `const AUTH_TOUR_KEY = 'schedapro:auth-tour:dismissed';`
  — ✕ / "Ho capito" close for the session; "Non mostrare più" writes the key.
  Uses a **separate key from the in-app tour** so dismissing one doesn't kill the other.
- **CSS:** `.auth-tour-backdrop` (dim + center), `.auth-tour-panel`
  (`position: static` override of `.tour-tooltip`), `.auth-tour-steps`,
  `.auth-tour-ok`. Reuses `.tour-tooltip`, `.tour-close`, `.tour-title`,
  `.tour-body`, `.tour-dontshow` from `onboarding/onboarding.css` (already in PLT).

**Port note:** change `AUTH_TOUR_KEY` → `plt:auth-tour:dismissed`, rebrand the
title ("Benvenuto in PLT 👋") and the 3 steps. The `.tour-*` base classes already
exist in PLT, so only the `.auth-tour-*` rules need copying into PLT's `styles.css`.

---

## 3. Two-column login layout, top-aligned ✅

Warning + sign-in card on the **left**, intro/hero on the **right**; columns
**top-aligned** (not vertically centered); collapses to one column under 880px.

- **CSS** (`styles.css`):
  ```css
  .auth-shell { display: grid;
    grid-template-columns: minmax(340px, 420px) minmax(0, 1.05fr);
    gap: clamp(18px, 4vw, 42px); align-items: start; }   /* start, not center */
  @media (max-width: 880px) { .auth-shell { grid-template-columns: 1fr; } }
  ```
- **DOM order** in `AuthScreen`: `.auth-col` (disclaimer + auth-card) **first**,
  `section.auth-intro` (hero) **second**. On mobile this stacks warning-first.

**Port note:** portable 1:1. (`align-items: start` is the fix for the warning box
being vertically centered against the tall hero — it should start at the hero's line.)

---

## 4. Logout fix in dev-bypass mode ✅ (likely a latent PLT bug too)

In `VITE_BYPASS_AUTH` mode `useAuth` fabricated a session but never listened for
`SIGNED_OUT`, so `supabase.auth.signOut()` ("Esci dall'account") did nothing on
localhost. Fix: in the bypass branch, subscribe and clear the faked session.

```ts
if (DEV_BYPASS_AUTH) {
  setSession({ /* faked session */ } as Session);
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') setSession(null);
  });
  return () => subscription.unsubscribe();
}
```

**Port note:** PLT inherits the same bypass pattern — verify `useAuth` there and
apply the same listener. Production (real Supabase) was never affected.

---

## NOT to port (SchedaPRO-specific)

- Hero 6-feature list with fitness copy (Aria, schede allenamento, `.spr`, Anonimizza).
- `README.md` / `CURRENT-TASK.md` content.
