import { Inject, Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { Redis } from 'ioredis';
import * as util from 'util';
import { CACHE_CONFIG_OPTIONS } from './constants';
import { CacheModuleOptions } from './module-options.interface';

@Injectable()
export class CacheService {
  private readonly redis: Redis;
  private readonly logger = new Logger(CacheService.name);

  constructor(@Inject(CACHE_CONFIG_OPTIONS) config: CacheModuleOptions) {
    this.redis = new Redis(config);
    this.redis.on('connect', () => this.logger.debug('Redis is connected'));
    this.redis.on('error', this.logger.error);
  }

  /**
   * The function sets a key-value pair in Redis and returns a promise that resolves to a string.
   * @param {string} key - A string representing the key to set in the Redis database.
   * @param {string} value - The `value` parameter is a string that represents the value to be stored
   * in the Redis database.
   * @param {string} [option] - The "option" parameter is an optional string that represents a specific
   * option for the Redis set command.
   * @param {string | number} [optionValue] - The `optionValue` parameter is an optional parameter that
   * can be either a string or a number. It is used to specify additional options for the `set`
   * operation.
   * @returns a Promise that resolves to a string.
   */
  set(
    key: string,
    value: string,
    option?: string,
    optionValue?: string | number,
  ): Promise<string> {
    const setPromisefy = util.promisify(this.redis.set).bind(this.redis);
    if (option !== undefined && optionValue !== undefined) {
      return setPromisefy(key, value, option, optionValue);
    }

    return setPromisefy(key, value);
  }

  /**
   * The function sets a value in a key-value store, with an optional option and option value.
   * @param {string} key - The `key` parameter is a string that represents the key for the data you
   * want to set. It is used to identify the data in the storage system.
   * @param {any} params - The `params` parameter is of type `any` which means it can accept any data
   * type. It is used to pass additional parameters that may be required for encryption or other
   * purposes.
   * @param {string} value - The `value` parameter is a string that represents the value to be set.
   * @param {string} [option] - The "option" parameter is an optional string that represents a specific
   * option for setting the value.
   * @param {string | number} [optionValue] - The `optionValue` parameter is an optional value that can
   * be either a string or a number. It is used in conjunction with the `option` parameter to provide
   * additional options for the `set` method.
   * @returns a Promise that resolves to a string.
   */
  setFromParams(
    key: string,
    params: any,
    value: string,
    option?: string,
    optionValue?: string | number,
  ): Promise<string> {
    const finalKey = `${key}:${this.encryptParams(params)}`;
    if (option !== undefined && optionValue !== undefined) {
      return this.set(finalKey, value, option, optionValue);
    }
    return this.set(finalKey, value);
  }

  /**
   * The function `get` retrieves a value from a Redis database using a given key.
   * @param {string} key - The key parameter is a string that represents the key of the value you want
   * to retrieve from the Redis database.
   * @returns The `get` method is returning a `Promise` that resolves to a `string` or `null`.
   */
  get(key: string): Promise<string | null> {
    const getPromisefy = util.promisify(this.redis.get).bind(this.redis);
    return getPromisefy(key);
  }

  /**
   * The function `getFromParams` takes a key and a set of parameters, encrypts the parameters, and
   * retrieves the value associated with the final key.
   * @param {string} key - The `key` parameter is a string that represents the key used to retrieve a
   * value from a data store.
   * @param {any} params - The `params` parameter is an object that contains additional information or
   * data that you want to include in the key. It can be of any type, as indicated by the `any` type
   * annotation.
   * @returns a Promise that resolves to a string or null.
   */
  getFromParams(key: string, params: any): Promise<string | null> {
    const finalKey = `${key}:${this.encryptParams(params)}`;
    return this.get(finalKey);
  }

  /**
   * The function `getKeys` returns a promise that resolves to an array of strings, which are the keys
   * that match the given pattern in a Redis database.
   * @param {string} pattern - The `pattern` parameter is a string that represents a pattern to match
   * against keys in a Redis database. The pattern can include wildcards such as `*` (matches any
   * number of characters) and `?` (matches a single character). The `getKeys` function uses this
   * pattern to retrieve
   * @returns The function `getKeys` is returning a Promise that resolves to an array of strings.
   */
  getKeys(pattern: string): Promise<string[]> {
    const getKeysPromisefy = util.promisify(this.redis.keys).bind(this.redis);
    return getKeysPromisefy(pattern);
  }

  /**
   * The `del` function deletes a key from a Redis database and returns a promise that resolves to the
   * number of keys deleted.
   * @param {string} key - The `key` parameter is a string that represents the key of the data that you
   * want to delete from the Redis database.
   * @returns The `del` function is returning a `Promise<number>`.
   */
  del(key: string): Promise<number> {
    const delPromisefy = util.promisify(this.redis.del).bind(this.redis);
    return delPromisefy(key);
  }

  /**
   * The function `delFromPattern` deletes all keys that match a given pattern.
   * @param {string} pattern - The `pattern` parameter is a string that represents a pattern used to
   * match keys in a data store. The `delFromPattern` function uses this pattern to retrieve all keys
   * that match the pattern and then deletes each key from the data store.
   */
  async delFromPattern(pattern: string): Promise<void> {
    const all = await this.getKeys(pattern);
    for (const item of all) this.del(item);
  }

  /**
   * The function `delFromParams` takes a key and a set of parameters, encrypts the parameters, and
   * deletes the corresponding value from the database.
   * @param {string} key - A string representing the key to be used for deletion.
   * @param {any} params - The `params` parameter is of type `any`, which means it can accept any data
   * type. It is used to pass additional parameters or data to the function.
   * @returns a Promise that resolves to a number.
   */
  delFromParams(key: string, params: any): Promise<number> {
    const finalKey = `${key}:${this.encryptParams(params)}`;
    return this.del(finalKey);
  }

  /**
   * The function encrypts the given parameters by converting them to a JSON string, hashing it using
   * SHA256 algorithm, and then encoding the hash in base64 format.
   * @param {any} params - The `params` parameter is of type `any`, which means it can be any data type.
   * It is used as input to the `encryptParams` function.
   * @returns The encrypted hash of the JSON stringified version of the input parameters, encoded in
   * base64 format.
   */
  private encryptParams(params: any) {
    const str = JSON.stringify(params);
    return crypto.createHash('sha256').update(str).digest('base64');
  }
}
