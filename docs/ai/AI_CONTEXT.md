# AI Context: baas-demo-app

## Architecture Summary
- Expo Router (file-based routing) with route groups: `(tabs)`, `(auth)`
- State: React Context (AuthProvider) for auth, local component state for UI
- API: Firebase & Supabase services with direct SDK usage (no axios/interceptors)
- UI: StyleSheet with Theme constants, expo-linear-gradient, @expo/vector-icons
- Project: Separation by concern: `app/` (screens), `components/` (shared), `services/` (backend split by provider), `constants/` (design tokens)

## Folder Responsibilities
- `app/`: Route-based screens and layouts (Expo Router conventions)
- `components/`: Shared UI components (AuthProvider, AddMembersModal)
- `services/firebase` & `services/supabase`: Backend SDK wrappers (auth, profile, project, etc.)
- `constants/`: Design tokens (Theme.ts for colors, spacing, radius)
- `assets/`: Static assets (images, icons - not analyzed per instructions)

## State & Data Flow
- **Auth**: `AuthProvider` (React Context) with `user`, `provider`, persistence via AsyncStorage
- **Persistence**: AsyncStorage stores user/profile data and provider selection
- **UI State**: Local `useState` in screens (form inputs, loading states, modal visibility)
- **Data Fetching**: Direct service calls in `useEffect` (no React Query/Zustand observed)
- **Mutations**: Service functions called in event handlers (form submits, button presses)
- **Source of Truth**: AuthProvider for auth state; service functions query Firebase/Supabase directly

## API Flow
- Services expose functions: `getList`, `create`, `getById`, `update`, `delete`, `search*`
- Direct Firebase/Supabase SDK calls inside service files (no abstraction layer)
- No axios/interceptors; uses native SDK methods (firestore, supabase-js)
- Error handling: try/catch in services (throw errors) and screens (catch/log/show alerts)
- Auth token handling: Managed by Firebase/Supabase SDKs; AsyncStorage stores user profile
- Response transformation: Minimal; data returned directly from SDK queries

## UI/Styling System
- **Tokens**: `constants/Theme.ts` (colors: primary, background, surface, text, etc.; spacing: xs-xxl; radius: sm-xl)
- **Styling**: `StyleSheet.create()` with Theme values; `expo-linear-gradient` for gradient backgrounds
- **Icons**: `@expo/vector-icons` (Feather icons commonly used)
- **Layout**: Flexbox, `View`, `Text`, `TouchableOpacity`, `FlatList`, `ScrollView`, `Modal`
- **Reusable**: Limited shared components; UI patterns (cards, FABs, avatars) repeated in screens

## Reusable Patterns
- **Provider Pattern**: `AuthProvider` wraps app for auth state and persistence
- **Route Grouping**: `(tabs)` for bottom tab navigation, `(auth)` for auth flow protection
- **Service Layer**: Separate Firebase/Supabase services with similar CRUD function signatures
- **Placeholder Data**: Some services have `-- PENDING --` comments indicating incomplete implementations
- **Navigation**: `useRouter()` from expo-router for programmatic navigation (`router.push()`, `router.replace()`)
- **Modal Pattern**: `AddMembersModal` component demonstrates reusable modal with callback props

## Dependency Rules
- **Backend Choice**: Firebase OR Supabase selected via AuthProvider.provider (set at runtime)
- **Service Import**: Screens import both Firebase and Supabase services, conditionally use based on provider
- **No Direct SDK Use in Screens**: All Firebase/Supabase calls go through service layer (good separation)
- **Constants Import**: Theme imported via `@/constants/Theme` using path alias
- **Service Consistency**: Firebase and Supabase services should mirror function signatures (some inconsistency observed)

## AI Instructions
- Generate new features under `app/` using Expo Router conventions (file-based routing)
- Use `AuthProvider` for auth state (`const { provider, user, signIn } = useAuth()`)
- Access theme via `import { Theme } from "@/constants/Theme"`
- Implement backend logic in `services/firebase` or `services/supabase` matching existing function signatures
- Follow existing screen patterns: `useEffect` for data fetch, `useState` for UI state, `StyleSheet` for styles
- Use `expo-router` navigation: `router.push("/path")`, `router.replace()`, `router.back()`
- Keep files compact; prefer bullet points over paragraphs
- Do not invent missing architecture; infer from existing code
- Note: Service layer shows some inconsistency (e.g., different search function names) - aim for consistency in new features
