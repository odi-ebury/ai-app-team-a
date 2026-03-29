## Tech Stack

- Vite
- Tailwind CSS 3.4 (dark-mode minimalist aesthetic)
- TanStack React Query 5 (server state)
- Zustand 5 (client state -- auth store)
- React Hook Form 7 + Zod 4 (form validation)
- React Router 7 (routing)

## Project Structure

```
src/
├── pages/
│   ├── Login.tsx             # Phone + password login form
│   ├── Register.tsx          # Full registration form (all profile fields)
│   ├── Discover.tsx          # Discovery feed with ProfileCard + match notification
│   └── Matches.tsx           # List of mutual matches with Call/Text/Unmatch
├── components/
│   └── features/
│       ├── Layout.tsx        # App shell: header, nav (Discover/Matches/Logout), Outlet
│       └── ProfileCard.tsx   # Card displaying name, age, description + Like/Pass buttons
├── services/
│   ├── api.ts                # Fetch wrapper with JWT injection, 401 interceptor, error handling
│   ├── auth.ts               # register(), login(), getMe()
│   └── discovery.ts          # getDiscoveryProfile(), likeUser(), getMatches(), unmatchUser()
├── stores/
│   └── auth.store.ts         # Zustand store: token, isAuthenticated, setToken(), logout()
├── types/
│   ├── user.ts               # UserResponse, UserCreate, UserUpdate, Token, TokenRequest
│   └── discovery.ts          # DiscoveryProfile, LikeResponse, MatchResponse
├── utils/
│   └── cn.ts                 # clsx + tailwind-merge utility
├── App.tsx                   # Router setup, ProtectedRoute, QueryClientProvider
├── main.tsx                  # React root + StrictMode
└── index.css                 # Tailwind directives
```

## Architecture Rules

- **API layer is the boundary.** All HTTP calls go through `services/api.ts`. Never use `fetch` directly in components.
- **Server state via React Query.** Use `useQuery` for reads, `useMutation` for writes. Invalidate related queries on success.
- **Client state via Zustand.** Only the auth store uses Zustand. Don't add stores for server-derived data.
- **Forms via React Hook Form + Zod.** All forms use `zodResolver` for validation. Define schemas next to the component.
- **Path alias:** `@` maps to `./src` (configured in `vite.config.ts` and `tsconfig`).

## Coding Conventions

- Pages are named exports (`export function Login()`).
- Components are in `components/features/` (feature-specific) or `components/ui/` (generic, if needed).
- Types live in `types/` and mirror backend schemas.
- API services are thin wrappers: one function per endpoint, typed return values.
- Tailwind classes directly in JSX. Use `cn()` for conditional classes.

## Routing

- `/login` -- Login page (redirects to `/discover` if already authenticated)
- `/register` -- Register page (redirects to `/discover` if already authenticated)
- `/` -- ProtectedRoute wrapper (redirects to `/login` if not authenticated)
  - `/discover` -- Discovery feed (default)
  - `/matches` -- Matches list

## Key Design Decisions

- Token stored in `localStorage` under key `"token"`. The API layer reads it on every request.
- 401 responses auto-clear the token and redirect to `/login` (interceptor in `api.ts`).
- 204 No Content responses (from DELETE) return `undefined` instead of parsing JSON.
- Match notifications use a 3-second auto-dismiss toast via local state.
- The Vite dev server proxies `/api` to `http://localhost:8000` (backend).

## Dev Server

```bash
npm run dev     # Start at http://localhost:5173
npm run build   # Type-check + production build
npm run lint    # ESLint
```
