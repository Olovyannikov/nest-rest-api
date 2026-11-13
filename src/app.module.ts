import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ProductsModule } from './products/products.module.js';

import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env.local',
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const user = encodeURIComponent(config.getOrThrow<string>('ROOT_USER'));
        const password = encodeURIComponent(
          config.getOrThrow<string>('ROOT_PWD'),
        );
        const host = config.getOrThrow<string>('ROOT_HOST');

        return {
          uri: `mongodb://${user}:${password}@${host}`,
          // Пользователь создан в базе admin, а не в той, к которой подключаемся.
          authSource: config.get<string>('ROOT_AUTH_SOURCE', 'admin'),
        };
      },
    }),
    ProductsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
