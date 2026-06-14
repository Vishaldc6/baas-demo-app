# Feature: User Profile

> View own profile, edit username, upload/change avatar image.

---

## Feature Scope

| Capability | Implemented? |
|---|---|
| View own profile | ✅ |
| Edit username | ✅ |
| Upload avatar (image picker → storage → save URL) | ✅ |
| View another user's profile (tap avatar in members list) | ✅ (via ProfileSheet) |
| Refresh profile after changes | ✅ (`refreshProfile()` in AuthProvider) |

---

## How It Works

### User Flow
```
Profile Tab → View Profile → Edit Username (inline) → Save
                           → Change Avatar → Image Picker → Upload → Save URL
```

### Data Shape

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Auth user's UID, primary key |
| `username` | string | Derived from email on signup, editable later |
| `avatar_url` | string \| null | URL to uploaded image in storage |
| `created_at` | timestamp | Set on profile creation |
| `updated_at` | timestamp | Auto-updated on changes |

---

## Comparison: Firebase vs Supabase

### Get Profile

| Aspect | Firebase | Supabase |
|---|---|---|
| **Method** | `getDoc(doc(userRef, userId))` | `supabase.from('profiles').select().eq('id', userId).single()` |
| **Returns** | `{ id: snapshot.id, ...snapshot.data() }` | `data as ProfileData` |
| **Error** | Throws if `!snapshot.exists()` | Throws if `error` returned |

### Update Profile

| Aspect | Firebase | Supabase |
|---|---|---|
| **Method** | `updateDoc(docRef, { ...updates, updated_at: serverTimestamp() })` | `supabase.from('profiles').update(updates).eq('id', userId).select().single()` |
| **Auto updated_at** | Manually set via `serverTimestamp()` in app code | **Auto** via `handle_updated_at` trigger in DB |
| **Returns** | Re-fetches profile after update | Returns updated row directly |

### Upload Avatar

Both follow the same pattern:
```
1. Pick image (expo-image-picker)
2. Fetch image as blob
3. Upload to storage bucket
4. Get public/download URL
5. Update profile.avatar_url with the URL
```

| Aspect | Firebase | Supabase |
|---|---|---|
| **Storage** | Firebase Storage (`firebase/storage`) | Supabase Storage (buckets) |
| **Bucket/Path** | `avatars/{userId}/avatar.{ext}` | `avatars/{userId}/avatar.{ext}` ✅ Same path |
| **Upload** | `uploadBytes(storageRef, blob, { contentType })` | `supabase.storage.from('avatars').upload(filePath, blob, { contentType, upsert: true })` |
| **Get URL** | `getDownloadURL(storageRef)` — signed URL | `supabase.storage.from('avatars').getPublicUrl(filePath)` — public URL |
| **Overwrite** | Overwrites by default (same path) | Uses `upsert: true` to overwrite |
| **Profile update** | Calls `updateProfile(userId, { avatar_url })` | Same |

---

## Key Files

| File | Purpose |
|---|---|
| `services/firebase/profile.ts` | `getProfile`, `updateProfile`, `uploadAvatar` |
| `services/supabase/profile.ts` | `getProfile`, `updateProfile`, `uploadAvatar` |
| `app/(tabs)/profile.tsx` | Profile screen (view + edit + avatar) |
| `components/ProfileSheet.tsx` | Bottom sheet to view another user's profile |
| `components/AuthProvider.tsx` | `refreshProfile()` — re-fetches after updates |

---

## Supabase Automation

| Trigger | Table | Function | Purpose |
|---|---|---|---|
| `on_auth_user_created` | `auth.users` | `handle_new_user` | Auto-creates profile on signup |
| `handle_updated_at` trigger | `profiles` | `handle_updated_at` | Auto-sets `updated_at = now()` on update |

### RLS Policies on `profiles`

| Policy | Action | Rule |
|---|---|---|
| Public profiles viewable | SELECT | `true` (anyone can read) |
| Users can insert own profile | INSERT | `auth.uid() = id` |
| Users can update own profile | UPDATE | `auth.uid() = id` |
| Users can delete own profile | DELETE | `auth.uid() = id` |

### Firebase Equivalent
- No triggers — profile creation is done manually in `auth.ts` `signUp()` function
- No server-side rules enforced in this demo — Firestore Security Rules should be configured separately
- `updated_at` must be set manually with `serverTimestamp()` in every update call

---

## TypeScript Interface

Both services define the same interface:

```typescript
interface ProfileData {
  id: string;
  username: string;
  avatar_url: string | null;
  created_at: string; // or Firestore Timestamp
  updated_at: string; // or Firestore Timestamp
}

interface UpdateProfileData {
  username?: string;
  avatar_url?: string;
}
```
