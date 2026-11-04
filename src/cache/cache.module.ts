import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import { CacheService } from './cache.service';
import { CACHE_CONFIG_OPTIONS } from './constants';
import {
  CacheModuleAsyncOptions,
  CacheModuleOptions,
  CacheModuleOptionsFactory,
} from './module-options.interface';

@Global()
@Module({})
export class CacheModule {
  static register(options: CacheModuleOptions): DynamicModule {
    return {
      module: CacheModule,
      providers: [
        {
          provide: CACHE_CONFIG_OPTIONS,
          useValue: options,
        },
        CacheService,
      ],
      exports: [CacheService],
    };
  }

  static registerAsync(options: CacheModuleAsyncOptions): DynamicModule {
    const asyncProviders = this.createAsyncProviders(options);
    return {
      module: CacheModule,
      imports: options.imports || [],
      providers: [...asyncProviders, CacheService],
      exports: [CacheService],
    };
  }

  private static createAsyncProviders(
    options: CacheModuleAsyncOptions,
  ): Provider[] {
    if (options.useFactory) {
      return [{ provide: CACHE_CONFIG_OPTIONS, useFactory: options.useFactory, inject: options.inject || [] }];
    }
    const factory = options.useClass || options.useExisting;
    if (!factory) throw new Error('CacheModule.registerAsync requires useFactory, useClass or useExisting');
    return [
      ...(options.useClass ? [options.useClass] : []),
      { provide: CACHE_CONFIG_OPTIONS, useFactory: (instance: CacheModuleOptionsFactory) => instance.createCacheOptions(), inject: [factory] },
    ];
  }
}
