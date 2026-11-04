# Changelog

Notable changes are recorded here. Versions follow Semantic Versioning.

## [1.0.0](https://github.com/atmus-tecnologia/nestjs-cache/releases/tag/v1.0.0) - 2026-11-04

### Breaking changes

- Require Node.js 22.12+ and NestJS 11 or 12; NestJS 10 is no longer supported.
- Updated upstream SDK majors may change types, defaults and resource behavior. See [MIGRATION.md](MIGRATION.md).

### Changes

- Upgrade ioredis to 6 and support NestJS 11/12.
- Replace redundant promisify wrappers with native Redis promises.
- Use cursor-based SCAN instead of blocking KEYS; await batched deletions and propagate failures.
- Disconnect the owned Redis client on Nest module destruction.
- Implement async useClass/useExisting and export public configuration types.
- Preserve parameter key hashes; return nullable SET results for conditional writes.
- Replace copied documentation with package-specific installation, configuration, API and migration examples.
- Add offline regression tests, clean TypeScript builds, package-consumer validation, CI and an opt-in OIDC npm publishing workflow.
- Remove obsolete lint/release tooling, duplicate runtime peers and the shell-only deploy script.
- Publish only compiled JavaScript, declarations, source maps, documentation and license.

## 0.1.0 (2024-01-15)
