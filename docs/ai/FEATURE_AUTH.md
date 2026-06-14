# Feature: Authentication

> Sign up, sign in, and sign out with email + password using Firebase Auth and Supabase Auth.

---

## Feature Scope

| Capability | Implemented? |
|---|---|
| Sign up with email + password | ✅ |
| Sign in with email + password | ✅ |
| Sign out | ✅ |
| Email uniqueness (no duplicate accounts) | ✅ (enforced by both auth platforms) |
| Username uniqueness | ❌ Not enforced (by design) |
| Email confirmation | ⚠️ Depends on Supabase config (disable for testing) |
| Password reset | ❌ Not implemented |
| OAuth (Google, GitHub, etc.) | ❌ Not implemented |

---

## How It Works

### User Flow
```
Provider Selection → Sign In Screen ←→ Sign Up Screen → Home (tabs)
```

1. User selects Firebase or Supabase on landing screen (`app/index.tsx`)
2. Navigated to `(auth)/sign-in` screen
3. Can toggle to `(auth)/sign-up` screen
4. On success → profile is fetched → navigated to `(tabs)/home`

### Auth State Management
- **AuthProvider** (`components/AuthProvider.tsx`) manages all auth state
- Stores `user` (profile data) and `provider` in React Context + AsyncStorage
- Route guard: redirects unauthenticated users away from `(tabs)` and authenticated users away from `(auth)`

---

## Comparison: Firebase vs Supabase

### Sign Up

| Aspect | Firebase | Supabase |
|---|---|---|
| **Auth function** | `createUserWithEmailAndPassword(auth, email, password)` | `supabase.auth.signUp({ email, password })` |
| **Returns** | `UserCredential.user` (has `.uid`) | `data.user` (has `.id`) |
| **Profile creation** | **Manual** — app calls `setDoc()` to create a `profiles` document | **Automatic** — DB trigger `handle_new_user` creates a `profiles` row |
| **Username derivation** | `email.split('@')[0]` in app code | `split_part(email, '@', 1)` in DB trigger |
| **Email uniqueness** | Firebase Auth rejects duplicate emails (`auth/email-already-in-use`) | Supabase Auth rejects duplicate emails (error returned) |
| **Email confirmation** | Not enabled by default | Enabled by default — **disable in Dashboard for testing** |

### Sign In

| Aspect | Firebase | Supabase |
|---|---|---|
| **Auth function** | `signInWithEmailAndPassword(auth, email, password)` | `supabase.auth.signInWithPassword({ email, password })` |
| **Returns** | `UserCredential.user` (has `.uid`) | `data.user` (has `.id`) |
| **Session persistence** | Firebase SDK handles automatically | Supabase client configured with `AsyncStorage` for persistence |

### Sign Out

| Aspect | Firebase | Supabase |
|---|---|---|
| **Auth function** | `fbSignOut(auth)` | `supabase.auth.signOut()` |
| **Post-signout** | AuthProvider clears state + AsyncStorage, navigates to `/` | Same |

---

## Key Implementation Details

### Firebase: Profile Created Manually After Signup
```
signUp(email, password)
  → createUserWithEmailAndPassword(auth, email, password)
  → setDoc(profiles/{uid}, { id, username, avatar_url: null, created_at, updated_at })
  → return user
```
**File:** `services/firebase/auth.ts`

### Supabase: Profile Created by Database Trigger
```
signUp(email, password)
  → supabase.auth.signUp({ email, password })
  → [DB TRIGGER: handle_new_user fires automatically]
  → INSERT INTO profiles (id, username) VALUES (NEW.id, split_part(NEW.email, '@', 1))
  → return user
```
**File:** `services/supabase/auth.ts`
**Trigger:** `on_auth_user_created` on `auth.users` table

### AuthProvider: Unified Flow After Auth
After both sign-in and sign-up, `AuthProvider` calls `fetchAndSetProfile(userId)` which:
1. Calls `FirebaseProfile.getProfile(uid)` or `SupabaseProfile.getProfile(id)`
2. Stores the profile in React Context state
3. Persists to AsyncStorage
4. Route guard redirects to `(tabs)/home`

**File:** `components/AuthProvider.tsx`

---

## Profile Data Created on Signup

Both platforms create a profile with these fields:

| Field | Type | Value |
|---|---|---|
| `id` | string (UUID) | Auth user's UID/ID |
| `username` | string | Part before `@` in email |
| `avatar_url` | string \| null | `null` initially |
| `created_at` | timestamp | Server timestamp |
| `updated_at` | timestamp | Server timestamp |

---

## Validation (Client-Side)

Both sign-in and sign-up screens perform the same validation:
- Email: required, must match `\S+@\S+\.\S+`
- Password: required, minimum 6 characters
- Confirm Password (sign-up only): must match password

**Files:** `app/(auth)/sign-in.tsx`, `app/(auth)/sign-up.tsx`

---

## Error Handling

| Error | Firebase | Supabase |
|---|---|---|
| Invalid credentials | `auth/invalid-credential` | Error message from Supabase |
| Duplicate email | `auth/email-already-in-use` | Error message from Supabase |
| Weak password | `auth/weak-password` | Error message from Supabase |

Errors are caught in the screen's try/catch and displayed via inline error UI (red box above form fields).

---

## Config Files

### Firebase
- **File:** `services/firebase/config.ts`
- Initializes `firebase/app`, exports `auth` (from `getAuth`) and `db` (from `getFirestore`)
- Collection ref: `userRef = collection(db, 'profiles')`

### Supabase
- **File:** `services/supabase/config.ts`
- Creates Supabase client with `AsyncStorage` for session persistence
- Auth config: `autoRefreshToken: true`, `persistSession: true`, `detectSessionInUrl: false`
