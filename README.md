# @atmus/nestjs-cache

Redis helpers for NestJS powered by ioredis, with parameter-derived keys, SCAN and connection cleanup.

## Installation

Version 1.0.0 is distributed through GitHub Releases. It has not been published to npm yet; use the archive URL below.

```sh
npm install https://github.com/atmus-tecnologia/nestjs-cache/releases/download/v1.0.0/atmus-nestjs-cache-1.0.0.tgz @nestjs/common reflect-metadata rxjs
```

Use the same Nest major as your application. Upgrading from a previous release? Read [MIGRATION.md](MIGRATION.md) first.

## Configuration

```ts
import { Module } from '@nestjs/common';
import { CacheModule } from '@atmus/nestjs-cache';

@Module({
  imports: [CacheModule.register({ host: process.env.REDIS_HOST || '127.0.0.1', port: 6379 })],
})
export class AppModule {}
```

Load REDIS_HOST before registering the module. Never commit API keys or passwords.
For asynchronous configuration:

```ts
CacheModule.registerAsync({
  useFactory: async () => ({ host: process.env.REDIS_HOST || '127.0.0.1', port: 6379 }),
})
```

`useClass` and `useExisting` are also supported; factories implement `createCacheOptions()`.

## Usage and API

```ts
import { Injectable } from '@nestjs/common';
import { CacheService } from '@atmus/nestjs-cache';

@Injectable()
export class UsersCache {
  constructor(private readonly cache: CacheService) {}

  async remember() {
    await this.cache.set('user:1', JSON.stringify({ id: 1 }), 'EX', 60);
    return this.cache.get('user:1');
  }
}
```

| Method | Result / behavior |
| --- | --- |
| set(key, value, option?, optionValue?) | Promise<string or null>; Redis SET options, EX in seconds / PX in milliseconds |
| get(key) | Promise<string or null> |
| del(key) | Promise<number> removed keys |
| setFromParams(key, params, value, option?, optionValue?) | SET using a SHA-256 hash of JSON.stringify(params) |
| getFromParams(key, params) / delFromParams(key, params) | Same parameter-derived key |
| getKeys(pattern) | Promise<string[]> using SCAN; unique keys, unspecified order |
| delFromPattern(pattern) | Promise<void>; awaits batched deletions, not atomic |
| client | Owned ioredis client for other commands |

Use JSON-serializable parameters in consistent property order. Hashing is for key generation, not encryption. SCAN is not a snapshot during concurrent writes. Values remain strings; serialization belongs to the caller. This package does not implement cache-manager or Nest's CacheInterceptor.

The module is global and owns its connection. Enable `app.enableShutdownHooks()` to close it on OS signals; `app.close()` also disconnects it. Configure TLS, password and retry behavior through native RedisOptions. Public exports include module option/factory types and CACHE_CONFIG_OPTIONS.


## Compatibility and development

Requires **Node.js 22.12+**, **NestJS 11 or 12**, RxJS 7.8+ and reflect-metadata 0.2.2+.
The package ships CommonJS JavaScript, TypeScript declarations and source maps. Modern Node supports loading NestJS 12's ESM dependencies; use a compatible NodeNext/Node20 TypeScript configuration in consuming applications.

```sh
npm ci
npm run check
```

Checks include offline regression tests and installation of the actual npm archive in an isolated consumer. CI covers Node 22/24 and Nest 11/12. No real API credentials are used by the test suite. Live provider behavior must be validated in your application.

See [CHANGELOG.md](CHANGELOG.md), [MIGRATION.md](MIGRATION.md) and [CONTRIBUTING.md](CONTRIBUTING.md) for release history, breaking changes and publication instructions. Licensed under [MIT](LICENSE).
