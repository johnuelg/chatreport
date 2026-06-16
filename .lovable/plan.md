## Goal
Implement a frontend-only leaked-password protection check (free-tier compatible) in your existing Supabase flow, with **hard blocking** on breached passwords for:
- **Admin create user flow**
- **Password reset/update flow**

## Implementation Plan
1. **Add a shared password security utility**
   - Create a reusable client-side module (e.g. `src/lib/password-security.ts`) that:
     - Normalizes input and hashes password with SHA-1 using Web Crypto.
     - Calls Have I Been Pwned’s k-Anonymity range API (`/range/{first5}`) so the full hash/password never leaves the browser.
     - Parses suffix/count response and returns a structured result (`isLeaked`, `leakCount`, `error`).
   - Add local guardrails (minimum length + clear return typing) so all consumers use one safe path.

2. **Enforce check in Admin user creation (`AdminUsers.tsx`)**
   - Before calling `admin-create-user`, run the leaked-password check on `createPassword`.
   - If leaked, **block submission** and show destructive toast with clear remediation (“choose a unique password not found in known breaches”).
   - If API/network lookup fails, fail closed per your requirement (“block”), with actionable retry message.
   - Keep existing strong RNG password generation as-is.

3. **Enforce check in password reset (`ResetPassword.tsx`)**
   - Before `supabase.auth.updateUser({ password })`, run the same utility check.
   - Block update when leaked and show descriptive error feedback.
   - Add lightweight loading state messaging while check runs to avoid double submits.

4. **UX polish for trust and clarity**
   - Add concise inline helper/error messaging near password inputs in affected flows.
   - Keep current styling/tokens; no layout redesign.
   - Ensure messages are specific (breached vs temporary check failure).

5. **Validate behavior end-to-end**
   - Verify blocked path with a known weak password.
   - Verify allow path with a strong unique password.
   - Verify failure-mode behavior (lookup unavailable) still blocks as requested.

## Technical Notes
- **Privacy model:** k-Anonymity means only hash prefix is sent, never plaintext password.
- **Frontend-only limitation:** protection is bypassable by non-UI clients; this is still useful but not equivalent to server-side Supabase leaked-password enforcement.
- **Dependency choice:** implement using native `fetch` + `crypto.subtle` (no new package needed).
- **Scope respected:** no DB schema/RLS changes; no auth architecture changes.