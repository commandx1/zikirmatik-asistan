import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { validateEnv } from './config/env.validation';
import { AppController } from './app.controller';
import { RenderKeepAliveService } from './common/services/render-keep-alive.service';
import { AiModule } from './modules/ai/ai.module';
import { AuthModule } from './modules/auth/auth.module';
import { DhikrLogsModule } from './modules/dhikr-logs/dhikr-logs.module';
import { DhikrsModule } from './modules/dhikrs/dhikrs.module';
import { SpecialDaysModule } from './modules/special-days/special-days.module';
import { StreaksModule } from './modules/streaks/streaks.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { UsersModule } from './modules/users/users.module';
import { PrayerTimesModule } from './modules/prayer-times/prayer-times.module';
import { UserDhikrsModule } from './modules/user-dhikrs/user-dhikrs.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { DhikrCollectionsModule } from './modules/dhikr-collections/dhikr-collections.module';
import { StatsModule } from './modules/stats/stats.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
      validate: validateEnv,
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.getOrThrow<string>('MONGODB_URI'),
        autoIndex: true,
      }),
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    UsersModule,
    DhikrsModule,
    DhikrLogsModule,
    StreaksModule,
    AiModule,
    SpecialDaysModule,
    SubscriptionsModule,
    PrayerTimesModule,
    UserDhikrsModule,
    WebhooksModule,
    DhikrCollectionsModule,
    StatsModule,
  ],
  controllers: [AppController],
  providers: [JwtAuthGuard, RenderKeepAliveService],
})
export class AppModule {}
