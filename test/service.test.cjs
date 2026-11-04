require('reflect-metadata');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { CacheService } = require('../dist');

test('commands use native promises, TTL and parameter keys remain compatible', async t => {
  const service = new CacheService({ lazyConnect: true });
  t.after(() => service.onModuleDestroy());
  const calls = [];
  t.mock.method(service.client, 'call', async (...args) => { calls.push(args); return 'OK'; });
  t.mock.method(service.client, 'get', async key => key);
  t.mock.method(service.client, 'del', async () => 1);
  assert.equal(await service.set('key', 'value', 'EX', 60), 'OK');
  assert.deepEqual(calls[0], ['SET', 'key', 'value', 'EX', 60]);
  await service.set('key', 'value', 'NX');
  assert.deepEqual(calls[1], ['SET', 'key', 'value', 'NX']);
  const params = { page: 1 };
  const key = 'users:' + createHash('sha256').update(JSON.stringify(params)).digest('base64');
  await service.setFromParams('users', params, 'value');
  assert.equal(calls[2][1], key);
  assert.equal(await service.getFromParams('users', params), key);
  assert.equal(await service.delFromParams('users', params), 1);
  assert.throws(() => service.getFromParams('key', undefined), /JSON serializable/);
});

test('SCAN handles cursors and duplicates, deletions are awaited and failures propagate', async t => {
  const service = new CacheService({ lazyConnect: true });
  t.after(() => service.onModuleDestroy());
  t.mock.method(service.client, 'scan', async cursor => cursor === '0' ? ['3', ['a', 'a']] : ['0', ['b']]);
  assert.deepEqual(await service.getKeys('*'), ['a', 'b']);
  const deleted = [];
  t.mock.method(service.client, 'del', async (...keys) => { await new Promise(resolve => setImmediate(resolve)); deleted.push(...keys); return keys.length; });
  await service.delFromPattern('*');
  assert.deepEqual(deleted, ['a', 'a', 'b']);
  t.mock.method(service.client, 'del', async () => { throw new Error('Redis unavailable'); });
  await assert.rejects(() => service.delFromPattern('*'), /Redis unavailable/);
});

test('closing the Nest service disconnects its Redis client', t => {
  const service = new CacheService({ lazyConnect: true });
  service.onModuleDestroy();
  assert.equal(service.client.status, 'end');
});
