require('reflect-metadata');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Module } = require('@nestjs/common');
const { Test } = require('@nestjs/testing');
const { CacheModule, CacheService } = require('../dist');
const options = { lazyConnect: true };

test('synchronous and async factory registration resolve the injectable service', async () => {
  class Config { getOptions() { return options; } }
  class ConfigModule {}
  Module({ providers: [Config], exports: [Config] })(ConfigModule);
  for (const definition of [
    CacheModule.register(options),
    CacheModule.registerAsync({ imports: [ConfigModule], inject: [Config], useFactory: async config => config.getOptions() }),
  ]) {
    const context = await Test.createTestingModule({ imports: [definition] }).compile();
    try { assert(context.get(CacheService) instanceof CacheService); }
    finally { await context.close(); }
  }
});

test('empty async options fail with a useful message', () => {
  assert.throws(() => CacheModule.registerAsync({}), /requires useFactory/);
});

test('useClass and useExisting resolve options through Nest dependency injection', async () => {
  class OptionsFactory { createCacheOptions() { return options; } }
  class OptionsModule {}
  Module({ providers: [OptionsFactory], exports: [OptionsFactory] })(OptionsModule);
  for (const definition of [
    CacheModule.registerAsync({ useClass: OptionsFactory }),
    CacheModule.registerAsync({ imports: [OptionsModule], useExisting: OptionsFactory }),
  ]) {
    const context = await Test.createTestingModule({ imports: [definition] }).compile();
    try { assert(context.get(CacheService) instanceof CacheService); }
    finally { await context.close(); }
  }
});
