import { CacheModule, type CacheModuleOptions } from '@atmus/nestjs-cache';
const options: CacheModuleOptions = { lazyConnect: true };
CacheModule.register(options);
