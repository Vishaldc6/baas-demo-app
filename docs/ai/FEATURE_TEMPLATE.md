# Feature Template

## Standard Feature Structure
```
app/
  feature-name/           # Route group (optional)
    index.tsx             # Main screen/list view
    create.tsx            # Create screen
    [id].tsx              # Detail/view screen
    edit.tsx              # Edit screen (optional)
components/
  feature-name/           # Feature-specific reusable components (if complex)
services/
  firebase/
    feature-name.ts       # Firebase service functions
  supabase/
    feature-name.ts       # Supabase service functions
```

## Screen Pattern
- Import dependencies: `useAuth`, `useRouter`, `Theme`, service functions, React components
- Use `useAuth()` for auth state (`const { provider, user } = useAuth()`)
- Use `useRouter()` for navigation (`const router = useRouter()`)
- Local state: `useState` for form data, loading states, UI flags, etc.
- Data fetching: `useEffect(() => { fetchData() }, [])` for initial loads
  - Call service functions conditionally: `provider === "firebase" ? FirebaseFeature.getList() : SupabaseFeature.getList()`
  - Handle loading/error states with UI indicators
- Mutations: Call service functions in event handlers (form submit, button press)
  - Consider optimistic updates for better UX (not currently used in project)
- Rendering: JSX with `FlatList` for lists, modular components for complex UI
- Styling: `StyleSheet.create()` using `Theme` values for colors, spacing, radius
- Navigation: `router.push("/feature-name/create")`, `router.replace("/feature-name")`, `router.back()`

## Hooks Pattern
- No custom hooks observed in existing project; logic kept in screens
- If creating custom hooks: follow `useAuth` pattern (`hooks/useFeatureName.ts`)
- Custom hooks should encapsulate data fetching/mutations if reused across screens
- Keep hooks focused and testable; avoid over-abstraction for simple features

## Services Pattern
- Match existing service structure (e.g., `services/firebase/project.ts`)
- Export functions: `getList()`, `getById(id)`, `create(data)`, `update(id, data)`, `delete(id)`
- Additional functions as needed: `search*(query)`, `addMembersToProject()`, etc.
- Use Firebase/Supabase SDK methods directly (no abstract data layer)
- Handle async operations with try/catch; return data or throw error for screens to catch
- Maintain consistent function signatures between Firebase and Supabase implementations
- Document `-- PENDING --` sections if functionality is incomplete

## Query Pattern
- No React Query or SWR observed in current project
- Data fetching: Manual `useEffect` -> async function -> setState
  - Show loading state during fetch, error state on failure
- Mutations: Call service function in event handler
  - Update state optimistically if desired (not currently implemented)
  - Refetch data after mutation if needed
- Consider adding `react-query` for complex data synchronization (evaluation needed)
- Cache ownership: Manual state management; no automatic caching observed

## Navigation Pattern
- Expo Router: file-based routing in `app/` directory
- Use `(tabs)` for bottom tab screens (require authentication check in layout)
- Use `(auth)` for auth screens (redirect based on auth state)
- Dynamic routes: `[id].tsx` for detail views, `[id]/edit.tsx` for edit views
- Programmatic navigation: `const router = useRouter(); router.push("/feature/item/123")`
- Linking: `<Link href="/feature">` from expo-router (alternative to programmatic nav)
- Tab navigation: Screens in `(tabs)/` appear as bottom tabs if registered in `_layout.tsx`
- Modal presentation: Use `Modal` component from react-native for transient UI

## Naming Conventions
- Files: PascalCase for component screens (`FeatureScreen.tsx`), camelCase for services (`featureService.ts`)
- Functions: camelCase (`fetchFeatureList`, `handleCreateFeature`, `updateFeature`)
- Variables: camelCase (`featureList`, `isLoading`, `selectedItem`)
- Constants: UPPER_SNAKE_CASE for true constants (rare; prefer Theme for design tokens)
- Types/Interfaces: PascalCase (`FeatureData`, `FeatureFilters`)
- Routes: lowercase with slashes (`/feature/create`, `/feature/123/edit`)
- Context: `useFeatureName()` if extracting custom hook (follow `useAuth` pattern)

## Recommended Feature Creation Workflow
1. Plan feature scope and data model (what entities, what fields)
2. Define route structure in `app/` (e.g., `app/feature/`, `app/feature/create.tsx`)
3. Create service contracts: define needed functions (getList, create, etc.)
4. Implement service functions in `services/firebase/feature.ts` and `services/supabase/feature.ts`
   - Ensure consistent signatures between implementations
   - Handle `-- PENDING --` sections appropriately
5. Implement main screen (`index.tsx`) with data fetching and list UI
6. Add create screen (`create.tsx`) with form and submit logic
7. Add detail screen (`[id].tsx`) if needed for viewing/editing
8. Extract reusable UI to `components/feature/` if used across multiple screens
9. Test with both Firebase and Supabase providers (switch via AuthProvider in dev)
10. Handle loading states, error states, and empty states in all screens
