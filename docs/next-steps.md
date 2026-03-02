# Next Steps & Improvements

This document tracks potential improvements and optimizations for Telemetry Academy that are not currently implemented but should be considered for future iterations.

## Performance Improvements

### Pyodide & micropip Caching

**Current State:**
- Pyodide core is downloaded from CDN on every worker initialization
- micropip packages (opentelemetry-api, opentelemetry-sdk) are reinstalled fresh each time
- Vite hot-reload in dev mode recreates workers, wiping in-memory filesystem

**Implemented:** Basic `cache: true` option enabled in `loadPyodide()` to use browser Cache API.

**Future Improvements:**

#### 1. IndexedDB Filesystem Persistence (Recommended Next Step)
Persist the virtual filesystem across page reloads using Pyodide's IDBFS (IndexedDB File System):

```typescript
// After loadPyodide, before micropip installs:
await pyodide.FS.mkdir('/persistent');
await pyodide.FS.mount(pyodide.FS.filesystems.IDBFS, {}, '/persistent');

// Set micropip to install to persistent directory
// (may require micropip configuration or manual wheel installs)

// After installing packages, sync to IndexedDB:
await new Promise<void>((resolve, reject) => {
  pyodide.FS.syncfs(false, (err: Error | null) => {
    if (err) reject(err);
    else resolve();
  });
});
```

**Benefits:**
- micropip packages persist across page reloads
- Significantly faster subsequent loads in development
- Better UX in production for returning users

**Complexity:** Medium — requires understanding Pyodide FS mounting and sync timing

#### 2. Pre-bundle Packages (Production Optimization)
Instead of using micropip at runtime, download OTel wheel files and bundle them with the app:

```bash
# Download wheels during build
pip download opentelemetry-api opentelemetry-sdk -d public/wheels/
```

```typescript
// In worker, load from local URL instead of micropip
await pyodide.loadPackage('/wheels/opentelemetry_api-*.whl');
await pyodide.loadPackage('/wheels/opentelemetry_sdk-*.whl');
```

**Benefits:**
- No runtime network dependency for packages
- Faster startup (local files vs CDN)
- Deterministic package versions

**Complexity:** Low — straightforward build script addition

#### 3. Service Worker Caching
Register a service worker that caches Pyodide CDN responses more aggressively:

```typescript
// In service worker
const PYODIDE_CACHE = 'pyodide-v1';

self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('cdn.jsdelivr.net/pyodide')) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request).then((fetchResponse) => {
          return caches.open(PYODIDE_CACHE).then((cache) => {
            cache.put(event.request, fetchResponse.clone());
            return fetchResponse;
          });
        });
      })
    );
  }
});
```

**Benefits:**
- Works alongside existing caching strategies
- Can implement custom cache invalidation logic
- Better offline support

**Complexity:** Medium — requires service worker setup and maintenance

### Recommendation

For the MVP, Option 1 (already implemented) is sufficient. For production polish, implement:

1. **Short-term:** Option 2 (Pre-bundle packages) — simple build-time optimization
2. **Medium-term:** Option 1 (IndexedDB persistence) — best developer and user experience
3. **Long-term:** Option 3 (Service Worker) — if offline support becomes a requirement
