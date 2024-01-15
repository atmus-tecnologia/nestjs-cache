import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import { CacheService } from './cache.service';
import { CACHE_CONFIG_OPTIONS } from './constants';
import {
  CacheModuleAsyncOptions,
  CacheModuleOptions,
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
    return [
      {
        provide: CACHE_CONFIG_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      },
    ];
  }
}
