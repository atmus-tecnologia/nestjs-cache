import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { Redis } from 'ioredis';
import { CACHE_CONFIG_OPTIONS } from './constants';
import { CacheModuleOptions } from './module-options.interface';

@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly redis: Redis;
  private readonly logger = new Logger(CacheService.name);

  constructor(@Inject(CACHE_CONFIG_OPTIONS) config: CacheModuleOptions) {
    this.redis = new Redis(config);
    this.redis.on('connect', () => this.logger.debug('Redis is connected'));
    this.redis.on('error', (error: Error) => this.logger.error(error.message));
  }

  /** Native client for commands beyond the convenience API. Owned by this module. */
  get client(): Redis { return this.redis; }

  set(key: string, value: string, option?: string, optionValue?: string | number): Promise<string | null> {
    const args: (string | number)[] = [key, value];
    if (option !== undefined) args.push(option);
    if (optionValue !== undefined) args.push(optionValue);
    return this.redis.call('SET', ...args) as Promise<string | null>;
  }

  setFromParams(key: string, params: unknown, value: string, option?: string, optionValue?: string | number): Promise<string | null> {
    return this.set(`${key}:${this.encryptParams(params)}`, value, option, optionValue);
  }

  get(key: string): Promise<string | null> { return this.redis.get(key); }
  getFromParams(key: string, params: unknown): Promise<string | null> {
    return this.get(`${key}:${this.encryptParams(params)}`);
  }

  /** SCAN avoids blocking Redis with KEYS. Results are unique, but not a snapshot. */
  async getKeys(pattern: string): Promise<string[]> {
    const keys = new Set<string>();
    let cursor = '0';
    do {
      const [next, batch] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = next;
      for (const key of batch) keys.add(key);
    } while (cursor !== '0');
    return [...keys];
  }

  del(key: string): Promise<number> { return this.redis.del(key); }

  async delFromPattern(pattern: string): Promise<void> {
    let cursor = '0';
    do {
      const [next, keys] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = next;
      for (let i = 0; i < keys.length; i += 100) await this.redis.del(...keys.slice(i, i + 100));
    } while (cursor !== '0');
  }

  delFromParams(key: string, params: unknown): Promise<number> {
    return this.del(`${key}:${this.encryptParams(params)}`);
  }

  onModuleDestroy(): void { this.redis.disconnect(); }

  private encryptParams(params: unknown): string {
    // Preserve legacy keys, including JSON property order.
    const value = JSON.stringify(params);
    if (value === undefined) throw new TypeError('Cache params must be JSON serializable');
    return createHash('sha256').update(value).digest('base64');
  }
}
