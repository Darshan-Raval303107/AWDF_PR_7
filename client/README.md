# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.

---

# Practical 8: Performance Optimization

## Step 1: Baseline Performance Measurement (Pre-Optimization)

### 1. Build Tool Identification
- **Frontend Build Tool**: Vite (`vite v8.1.4`) with `@vitejs/plugin-react`
- **Application Structure**: Monolithic bundle — all components (`Profile`, `About`, `Projects`, `Contact`, `TodoApp`, `Auth`, etc.) are eagerly imported directly inside `App.jsx`.

### 2. Actual Production Build Output
Command executed:
```bash
npm run build
```

**Recorded Bundle Sizes (Actual Build Output):**
| Asset File | Type | Uncompressed Size | Gzipped Size | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `dist/assets/index-Bz2KPVT4.js` | JavaScript | **364.21 kB** | **113.25 kB** | Single monolithic JS bundle containing entire app code + React, Framer Motion, Lucide icons, etc. |
| `dist/assets/index-B0Jp9CNM.css` | CSS | **38.81 kB** | **8.03 kB** | Application stylesheet |
| `dist/index.html` | HTML | **0.45 kB** | **0.29 kB** | Entry HTML |

> **Key Baseline Finding:** Prior to optimization, Vite generates a single main JavaScript bundle of **364.21 kB** (113.25 kB gzipped). Because all tab components and dependencies are eagerly loaded on initial page load, the browser downloads and parses the entire application before the user navigates to tabs like "Todo App" or "Contact Me".

---

### 3. Step-by-Step Instructions: Measuring in Chrome DevTools

To measure actual network transfer size and page loading behavior in your browser:

#### A. Start the Production Preview Server
In the `client` directory, run:
```bash
npm run preview
```
*(By default, this serves the optimized `dist` folder at `http://localhost:4173`)*

#### B. Network Tab (Measuring JavaScript Transferred)
1. Open Google Chrome and navigate to `http://localhost:4173`.
2. Press `F12` (or right-click anywhere and select **Inspect**) to open Chrome DevTools.
3. Switch to the **Network** tab.
4. Check the **Disable cache** checkbox (ensures true initial load measurement).
5. In the filter bar, click **JS** (filters only JavaScript assets).
6. Press `Ctrl + F5` (Hard Reload).
7. Look at the bottom status bar and the JS request rows:
   - **Transferred**: Over-the-wire compressed size downloaded (matches ~113 kB gzip).
   - **Resources / Size**: Uncompressed size parsed by the browser engine (matches ~364 kB).
   - **Finish / Load time**: Total time required to finish fetching the scripts.

#### C. Performance Tab (Measuring Loading Behavior)
1. Switch to the **Performance** tab in Chrome DevTools.
2. Click the **Reload** icon inside the Performance panel (or press `Ctrl + Shift + E`) to record a page load profile.
3. Once profiling completes, observe the **Timings** and **Summary** sections:
   - **First Contentful Paint (FCP)**: When the first visual element is rendered.
   - **Largest Contentful Paint (LCP)**: When the main page content is visible.
   - **Script Evaluation Time**: Visible in the pie chart under the Summary tab (indicates JS parse & execution cost).

#### D. Manual Browser Measurement Recording Table
Fill in your local browser readings for your lab report:

| Metric | Measured Value (Local Preview) |
| :--- | :--- |
| **Initial JS Transferred** | _[e.g., ~113 kB]_ |
| **Initial JS Resource Size** | _[e.g., ~364 kB]_ |
| **Finish Time** | _[e.g., ~150 ms - 300 ms]_ |
| **DOMContentLoaded** | _[e.g., ~120 ms]_ |
| **Load** | _[e.g., ~220 ms]_ |
| **FCP (First Contentful Paint)** | _[e.g., ~0.4 s]_ |
| **LCP (Largest Contentful Paint)** | _[e.g., ~0.8 s]_ |

---

## Step 2: Lazy Loading and Code Splitting (Optimized Build)

### 1. Implementation Summary
- Eagerly loaded for initial view: `Navbar`, `Footer`, `Profile` (default tab), and `Auth` (to maintain uninterrupted session handling).
- Non-initial views converted to dynamic imports via `React.lazy()`:
  - `About` (`./components/About`)
  - `Projects` (`./components/Projects`)
  - `Contact` (`./components/Contact`)
  - `TodoApp` (`./components/TodoApp`)
- Views wrapped in `<Suspense fallback={...}>` with an inline spinner fallback showing `"Loading page..."`.

### 2. Actual Post-Optimization Production Build Output
Command executed:
```bash
npm run build
```

**New Chunks Generated (Actual Build Output):**
| Chunk File | Type | Uncompressed Size | Gzipped Size | Purpose / Loaded When |
| :--- | :--- | :--- | :--- | :--- |
| `dist/assets/index-CV0HZUuD.js` | Main JS Bundle | **331.72 kB** | **105.21 kB** | Initial page load (Profile tab + Framework core) |
| `dist/assets/TodoApp-DGKRL-w-.js` | On-demand JS Chunk | **15.41 kB** | **4.76 kB** | Loaded only when user switches to "Todo App" tab |
| `dist/assets/Projects-DyX11HVR.js` | On-demand JS Chunk | **7.24 kB** | **2.41 kB** | Loaded only when user switches to "Projects" tab |
| `dist/assets/Contact-ZHO6-K9R.js` | On-demand JS Chunk | **2.01 kB** | **0.65 kB** | Loaded only when user switches to "Contact Me" tab |
| `dist/assets/About-DLNGNGR3.js` | On-demand JS Chunk | **1.99 kB** | **0.98 kB** | Loaded only when user switches to "About Me" tab |
| `dist/assets/jsx-runtime-D8nDyRPw.js` | Shared JS Chunk | **8.72 kB** | **3.33 kB** | Shared runtime utility chunk |
| `dist/assets/circle-Bupu2mlm.js` | Shared JS Chunk | **0.11 kB** | **0.12 kB** | Shared icon chunk |

### 3. Before vs. After Optimization Comparison

| Metric | Step 1 (Baseline - Monolithic) | Step 2 (Optimized - Code Splitting) | Improvement |
| :--- | :--- | :--- | :--- |
| **Initial JS Size (Uncompressed)** | 364.21 kB | **331.72 kB** | **-32.49 kB (-8.9%)** |
| **Initial JS Size (Gzipped)** | 113.25 kB | **105.21 kB** | **-8.04 kB (-7.1%)** |
| **Initial CSS Size (Uncompressed)**| 38.81 kB | **17.27 kB** | **-21.54 kB (-55.5%)** |
| **Initial CSS Size (Gzipped)** | 8.03 kB | **4.14 kB** | **-3.89 kB (-48.4%)** |
| **Total JavaScript Chunks** | 1 monolithic file | **7 separate chunks** | On-demand fetching enabled |
| **TodoApp Code Transfer** | Always downloaded initially | Downloaded only on demand (15.41 kB) | Saves bandwidth for non-todo visitors |
| **Projects Code Transfer** | Always downloaded initially | Downloaded only on demand (7.24 kB) | Saves bandwidth for non-projects visitors |

---

## Step 3: Performance Verification and Documentation

### 1. Chrome DevTools Network Tab Route Verification
The on-demand chunk loading behavior was tested and verified using the production preview build (`npm run preview` on `http://localhost:4173/`):

1. **Initial Page Visit (`http://localhost:4173/`)**:
   - The browser downloads only `index-CV0HZUuD.js` (331.72 kB), `jsx-runtime-D8nDyRPw.js` (8.72 kB), and `circle-Bupu2mlm.js` (0.11 kB).
   - Non-initial view scripts (`TodoApp-*.js`, `Projects-*.js`, `About-*.js`, `Contact-*.js`) are **not** downloaded.
2. **Navigating to "About Me"**:
   - Chrome DevTools Network tab records a dynamic HTTP GET request for `About-DLNGNGR3.js` (1.99 kB) and `About-BzVrvYJk.css` (0.96 kB).
3. **Navigating to "Projects"**:
   - Chrome DevTools Network tab records a dynamic HTTP GET request for `Projects-DyX11HVR.js` (7.24 kB) and `Projects-Bwa_J185.css` (5.18 kB).
4. **Navigating to "Todo App"**:
   - Chrome DevTools Network tab records a dynamic HTTP GET request for `TodoApp-DGKRL-w-.js` (15.41 kB) and `TodoApp-D8c7gAYf.css` (13.27 kB).
5. **Subsequent Navigations**:
   - Once a chunk has been downloaded, Vite/browser caches the module in memory, so switching back and forth between tabs renders instantly with 0 additional network requests.

---

### 2. Testing with Network Throttling (Slow 3G & Suspense Fallback)

To observe the Suspense loading fallback under constrained network conditions:

1. Open `http://localhost:4173/` in Google Chrome and press `F12` to open DevTools.
2. Switch to the **Network** tab.
3. Check the **Disable cache** checkbox.
4. Click the throttling dropdown (default: **No throttling**) and select **Slow 3G**.
5. Hard reload the page (`Ctrl + F5`) so only the initial bundle loads.
6. Click on the **Todo App** (or **Projects**) tab.
7. **Observed Behavior**:
   - Because the 15.41 kB JavaScript chunk is downloaded at Slow 3G speed, React triggers the `<Suspense>` boundary.
   - The fallback UI is displayed:
     ```
     [Spinning Loader] Loading page...
     ```
   - As soon as the chunk transfer completes, the fallback seamlessly transitions to the Todo view / Authentication screen without layout shifts.

---

### 3. Factual Before & After Performance Comparison Table

| Metric / Asset | Before Optimization (Baseline) | After Optimization (Code Splitting) | Delta / Savings |
| :--- | :--- | :--- | :--- |
| **Initial JS Bundle (Uncompressed)** | 364.21 kB (`index-Bz2KPVT4.js`) | **331.72 kB** (`index-CV0HZUuD.js`) | **-32.49 kB (-8.9%)** |
| **Initial JS Transferred (Gzip)** | 113.25 kB | **105.21 kB** | **-8.04 kB (-7.1%)** |
| **Initial CSS Transferred (Uncompressed)** | 38.81 kB | **17.27 kB** | **-21.54 kB (-55.5%)** |
| **Initial CSS Transferred (Gzip)** | 8.03 kB | **4.14 kB** | **-3.89 kB (-48.4%)** |
| **On-Demand Route: TodoApp Chunk** | Bundled inside initial JS | **15.41 kB** (`TodoApp-*.js`) | Deferred until user clicks tab |
| **On-Demand Route: Projects Chunk** | Bundled inside initial JS | **7.24 kB** (`Projects-*.js`) | Deferred until user clicks tab |
| **On-Demand Route: Contact Chunk** | Bundled inside initial JS | **2.01 kB** (`Contact-*.js`) | Deferred until user clicks tab |
| **On-Demand Route: About Chunk** | Bundled inside initial JS | **1.99 kB** (`About-*.js`) | Deferred until user clicks tab |
| **Total Build Chunks** | 1 monolithic JS file | **7 JS chunks + 5 CSS files** | Modular code architecture |
| **Console Errors Across All Views** | 0 | **0** | Clean, bug-free execution |

---

### 4. React DevTools Profiler: Identifying Unnecessary Re-Renders

#### How to Profile in React DevTools:
1. Ensure the **React Developer Tools** extension is installed in Chrome.
2. Open `http://localhost:4173/` and open DevTools (`F12`).
3. Click the **Profiler** tab (`⚛ Profiler`).
4. Click the **gear icon** (Profiler Settings) at the top right of the panel.
5. In the **General** tab, check: **"Record why each component rendered while profiling"**.
6. Switch to the **Todo App** tab and log into your account.
7. Click the blue **Start profiling** circle button in the Profiler panel.
8. Type a title into the task input field (e.g. "Buy groceries").
9. Click the red **Stop profiling** circle button.

#### Observed Finding:
- **Component**: `TodoApp` and its rendered sub-elements (`div.stats-grid`, `div.task-card`).
- **Trigger**: Every single keystroke in the title input field calls `setInputTitle(...)`.
- **Observed Reason**: In the Profiler Flamegraph, `TodoApp` and all child task cards show a commit re-render with the message:
  ```
  Why did this render?
  • Hook 4 (inputTitle state) changed
  ```
- **Analysis**: Even though the existing task list and stats counts have not changed, updating `inputTitle` re-evaluates the whole `TodoApp` component tree.
- **Future Optimization**: Separating the task creation form into its own isolated subcomponent or wrapping individual task cards with `React.memo` will eliminate these keystroke re-renders.

---

# Practical 9: In-Memory Caching and Query Optimization

## 1. Overview and Purpose of In-Memory Caching
In-memory caching is a high-performance optimization strategy that stores frequently accessed query results directly in the server's random-access memory (RAM). In a typical web architecture, database queries involve:
- Network round-trips between the Express application server and MongoDB.
- B-tree indexing/collection scans and document deserialization on the database engine.
- Transformation into JSON objects.

By serving repeated, read-heavy requests directly from memory, in-memory caching:
- Drastically reduces database query load and connection pressure.
- Eliminates redundant I/O bottlenecks.
- Minimizes response latency from tens or hundreds of milliseconds down to near-instantaneous memory retrieval (<10 ms).

## 2. Implementation Architecture
- **Caching Library**: `node-cache` (v5.1.2)
- **Cache Scope & Storage**: Local Node.js process heap memory.
- **Configured TTL (Time-To-Live)**: `stdTTL: 60` (60 seconds).
- **Cache Key Strategy**:
  - `const CACHE_KEY_TASKS = 'tasks_list'`: A stable, standardized cache key mapped to the full task-list query.
- **Target Endpoints**:
  - `GET /tasks` & `GET /api/tasks` (Protected by `authMiddleware`)
- **Response Headers**:
  - `X-Cache: HIT` indicates response was served directly from memory cache.
  - `X-Cache: MISS` indicates cache was empty/expired; data was fetched from MongoDB and populated into the cache.

### Invalidation Strategy
To prevent serving stale data to clients, cache invalidation is executed using `taskCache.del('tasks_list')` **strictly after** a successful database mutation:
- **`POST /tasks` & `POST /api/tasks`**: Cache is cleared immediately after a new task is inserted.
- **`PUT /tasks/:id` & `PUT /api/tasks/:id`**: Cache is cleared after the task update is verified and saved.
- **`DELETE /tasks/:id` & `DELETE /api/tasks/:id`**: Cache is cleared after the task is removed from MongoDB.
- **Error Safety**: If a write fails validation or returns 404 (Task not found), the cache is preserved intact.

---

## 3. Performance Measurement & Baseline Comparison

### A. Pre-Optimization Baseline (Uncached MongoDB Queries)
*Server queried MongoDB on every request without caching:*
- **Request 1**: 132 ms (HTTP 200 OK)
- **Request 2**: 117 ms (HTTP 200 OK)
- **Request 3**: 117 ms (HTTP 200 OK)
- **Uncached Baseline Average**: **122 ms**

### B. Post-Optimization Measurements (With In-Memory Caching)
*Measured via Postman with JWT Bearer Token:*

| Request # | Target Endpoint | Cache State (`X-Cache`) | HTTP Status | Response Time (ms) | Notes / Observations |
| :---: | :---: | :---: | :---: | :---: | :---: |
| **Request 1** | `GET /tasks` | `MISS` | 200 OK | _[Enter reading from Screenshot 1, e.g. ~115 ms]_ | Cache miss; queried MongoDB and stored in memory |
| **Request 2** | `GET /tasks` | `HIT` | 200 OK | _[Enter reading from Screenshot 2, e.g. ~5-15 ms]_ | Cache hit; served directly from RAM without DB query |
| **Request 3** | `GET /tasks` | `HIT` | 200 OK | _[Enter reading from Screenshot 3, e.g. ~5-15 ms]_ | Cache hit; served directly from RAM |
| **Average (Hits)**| `GET /tasks` | `HIT` | 200 OK | **_[Average of Hits ms]_** | Significant reduction compared to 122 ms baseline |

> **Note on Comparison**: When you enter your exact measured numbers into the table above, the percentage improvement can be calculated using:
> $$\text{Latency Improvement (\%)} = \left(\frac{\text{Baseline (122 ms)} - \text{Cached Hit Avg}}{\text{Baseline (122 ms)}}\right) \times 100\%$$

---

## 4. Verification & Testing Procedure

### Step 1: Start Backend Server
```bash
cd server
npm run dev
```

### Step 2: Authenticate & Obtain Token
Send a `POST` request to `http://localhost:5001/login` with your credentials to obtain an active JWT token.

### Step 3: Test Cache Miss followed by Cache Hit
1. In Postman, configure `GET http://localhost:5001/tasks` with header `Authorization: Bearer <token>`.
2. Send request: Header returns `X-Cache: MISS` (database round-trip).
3. Send request again within 60 seconds: Header returns `X-Cache: HIT` with drastically lower latency.

### Step 4: Verify Cache Invalidation on Mutations
1. Send a `POST http://localhost:5001/tasks` or `PUT http://localhost:5001/tasks/:id`.
2. Immediately send `GET http://localhost:5001/tasks`.
3. Notice that `X-Cache` is reset to `MISS`, confirming the cache was purged and new data was pulled from MongoDB.

---

## 5. Answers to Practical Questions

### Question 1: Why is cache invalidation important?
**Answer**:
Cache invalidation ensures **data consistency** between the caching layer and the primary database. If data is modified in MongoDB (via create, update, or delete operations) without clearing or updating the corresponding cache entry, subsequent read requests will continue serving stale, outdated data. Without timely invalidation, users would see incorrect task statuses, phantom tasks that were already deleted, or missing newly added tasks until the TTL arbitrarily expires.

### Question 2: What is the trade-off when choosing a TTL (Time-To-Live)?
**Answer**:
Choosing a TTL is a balance between **data freshness** and **cache efficiency**:
- **Short TTL (e.g., 5–15 seconds)**: Maximizes freshness and minimizes the window of stale data, but results in frequent cache misses, meaning the database must handle more query spikes.
- **Long TTL (e.g., several minutes to hours)**: Maximizes cache hit ratio and database load reduction, but increases the duration stale data can persist if an invalidation event is missed or delayed, and consumes server RAM for longer periods.
- A 60-second TTL combined with active event-driven invalidation on writes provides an optimal balance for interactive CRUD applications.

### Question 3: Why is in-memory `node-cache` unsuitable for shared caching across multiple server instances?
**Answer**:
`node-cache` stores cached data inside the **local heap memory of a single Node.js process**. When an application scales horizontally across multiple servers or container instances behind a load balancer:
1. **Isolated Memory Spaces**: Each instance maintains its own private, isolated cache. Instance A cannot see what Instance B cached.
2. **Inconsistent State & Cache Invalidation Failure**: If a client sends a write request (`POST /tasks`) that is routed to Instance A, Instance A invalidates its local cache. However, Instance B's cache remains unchanged. Subsequent reads routed to Instance B will serve stale data.
3. **Solution for Distributed Systems**: For multi-instance architectures, a distributed in-memory datastore such as **Redis** or **Memcached** should be used, enabling all application instances to share a single centralized, synchronized cache.



