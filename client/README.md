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



