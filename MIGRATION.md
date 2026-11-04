# Migrating from 0.1.0 to 1.0.0

This is a breaking release. Upgrade Node.js to 22.12+ and NestJS to 11 or 12 before installing it. Keep @nestjs/common and @nestjs/core on the same major. CommonJS consumers can load the package on supported Node releases; ESM consumers can use named imports. TypeScript consumers should use a modern NodeNext or Node20 module configuration compatible with require(esm) when consuming NestJS 12.

ioredis is upgraded from 5 to 6. Existing helpers and parameter hashes remain available. `set` and `setFromParams` now correctly return `Promise<string | null>`: conditional Redis SET can return null.

`getKeys` now uses SCAN, returns unique keys with unspecified order, and does not provide a snapshot during concurrent writes. `delFromPattern` awaits deletions and propagates errors; callers must await it and handle failures. Pattern deletion is not atomic.

The service owns its Redis connection and disconnects it when the module closes. Enable Nest shutdown hooks for OS signals. If using the exposed `client`, do not close it while the module is active. Parameter hashing retains `JSON.stringify` property-order behavior for old cache-key compatibility. This package is a standalone ioredis integration, not an adapter for Nest CacheModule/cache-manager.

Run your application's integration tests before rollout. This repository's tests use offline transports; they do not establish live-provider or production behavior.
