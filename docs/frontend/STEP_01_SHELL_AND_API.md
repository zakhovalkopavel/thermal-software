# STEP 01 — App shell and API layer

**Priority:** HIGH  
**Depends on:** Running stack (nginx → frontend + backend)  
**Code root:** `frontend/src/`

---

## Goal

Replace the health-only scaffold with a routed SPA shell, a shared API client, and empty **Materials** and **Processes** module skeletons. No calculators yet.

---

## Scope

| Belong | Do not belong |
|--------|----------------|
| `BrowserRouter`, top layout, outlet | Calculator forms / results |
| Axios client + `QueryClientProvider` | Material catalogues (Step 3) |
| Home with two module tiles + health | Composition editors (Step 2) |
| `modules/materials` and `modules/processes` route stubs | Auth |

---

## Target tree

```
frontend/src/
├── main.tsx                    # providers wrap router
├── app/
│   ├── theme.ts
│   ├── providers.tsx           # QueryClientProvider + ThemeProvider + CssBaseline
│   ├── Layout.tsx              # AppBar: Home | Materials | Processes; <Outlet />
│   └── router.tsx              # root routes, mounts module routes
├── pages/
│   ├── Home.tsx                # two module tiles + health widget
│   └── NotFound.tsx
├── services/api/
│   ├── client.ts               # axios instance
│   └── health.api.ts
└── modules/
    ├── materials/
    │   ├── index.ts            # public exports for other modules
    │   ├── routes.tsx          # /materials/* (stubs)
    │   └── MaterialsLayout.tsx # placeholder, filled in Step 3
    └── processes/
        ├── index.ts
        └── routes.tsx          # /processes/* (stubs)
```

`App.tsx` becomes a thin wrapper around the router (or is removed in favour of `app/router.tsx`).

---

## API client

```ts
// services/api/client.ts
import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (r) => r,
  (err) => Promise.reject(err.response?.data ?? err),
);
```

In Docker/nginx keep the relative `/api/v1` so the browser stays same-origin (no Vite `server.proxy` needed). Module API files (`modules/*/api/*.api.ts`) import `api` from here.

**Health:** `GET /health` → `{ status, timestamp }`.

---

## Routing

| Path | Target | Filled in |
|------|--------|-----------|
| `/` | `Home` | this step |
| `/materials` | Materials hub | Step 3 |
| `/materials/metals` | Metals section | Step 4 |
| `/materials/gases` | Gases section | Step 5 |
| `/materials/refractories` | Refractories section | Step 6 |
| `/materials/raw-materials` | Raw materials section | Step 7 |
| `/materials/glasses` | Glasses section | Step 8 |
| `/materials/mineral-compositions` | Mineral compositions section | Step 9 |
| `/processes` | Processes hub | Step 10 |
| `/processes/combustion` | Combustion | Step 10 |
| `/processes/multilayer-wall` | Multilayer wall | Step 10 |
| `/processes/htc` | HTC / dimensionless | Step 11 |
| `/processes/recuperator` | Recuperator | Step 11 |
| `/processes/thermal-distribution` | Transient conduction | Step 11 |

All planned paths render a "Coming in Step N" placeholder — never a 404.

---

## Home

- Two large tiles: **Materials** (metals, gases, refractories, glasses, mineral compositions) and **Processes** (combustion, walls, HTC, recuperator, transient conduction).
- Health widget with **Refresh** (behaviour of the current `App.tsx`) and a link to `/api/docs`.

---

## Acceptance criteria

- [ ] `/` shows both module tiles and live health from `GET /api/v1/health`
- [ ] AppBar navigates to `/materials` and `/processes`
- [ ] Every path in the routing table renders a placeholder
- [ ] `services/api/client.ts` uses `VITE_API_URL` or `/api/v1`
- [ ] `modules/materials` and `modules/processes` each expose `routes.tsx` and `index.ts`

---

## Next

→ [STEP_02_SHARED_CALC_COMPONENTS.md](STEP_02_SHARED_CALC_COMPONENTS.md)
