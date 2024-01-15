import { ModuleMetadata, Type } from '@nestjs/common';
import { RedisOptions } from 'ioredis';

export type CacheModuleOptions = RedisOptions;

export interface CacheModuleOptionsFactory {
  createCacheOptions(): Promise<CacheModuleOptions> | CacheModuleOptions;
}

export interface CacheModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  useClass?: Type<CacheModuleOptionsFactory>;
  useFactory?: (
    ...args: any[]
  ) => Promise<CacheModuleOptions> | CacheModuleOptions;
  inject?: any[];
}
