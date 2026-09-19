import { Logger, Module, OnApplicationShutdown } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { ConnectionStates, type Connection } from 'mongoose';
import { flushDrain } from './common/logging/app-logger';
import { validateEnv } from './config/env.validation';
import { AppController } from './app.controller';
import { AiModule } from './modules/ai/ai.module';
import { AiChatModule } from './modules/ai-chat/ai-chat.module';
import { AuthModule } from './modules/auth/auth.module';
import { CirclesModule } from './modules/circles/circles.module';
import { DevicesModule } from './modules/devices/devices.module';
import { DhikrLogsModule } from './modules/dhikr-logs/dhikr-logs.module';
import { DhikrsModule } from './modules/dhikrs/dhikrs.module';
import { PushModule } from './modules/push/push.module';
import { SpecialDaysModule } from './modules/special-days/special-days.module';
import { StreaksModule } from './modules/streaks/streaks.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { UsersModule } from './modules/users/users.module';
import { UserDhikrsModule } from './modules/user-dhikrs/user-dhikrs.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { DhikrCollectionsModule } from './modules/dhikr-collections/dhikr-collections.module';
import { StatsModule } from './modules/stats/stats.module';
import { EventsModule } from './modules/events/events.module';
import { PushCampaignsModule } from './modules/push-campaigns/push-campaigns.module';
import { VirdModule } from './modules/vird/vird.module';
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
        onConnectionCreate: (c: Connection) => {
          const logger = new Logger('Mongo');
          let downAlerted = false;

          c.on('disconnected', () => {
            logger.warn({ event: 'mongo.disconnected' });
            const timer = setTimeout(() => {
              if (c.readyState !== ConnectionStates.connected) {
                downAlerted = true;
                logger.error({
                  event: 'mongo.down',
                  message: "Mongo 30 sn'den uzun süredir bağlı değil",
                  alert: 'mongo.down',
                });
              }
            }, 30_000);
            timer.unref();
          });

          c.on('connected', () => {
            logger.log({
              event: 'mongo.connected',
              ...(downAlerted && {
                alert: 'mongo.recovered',
                message: 'Mongo bağlantısı geri geldi',
              }),
            });
            downAlerted = false;
          });

          c.on('error', (e: Error) => {
            logger.error({ event: 'mongo.error', message: e.message });
          });
        },
      }),
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    UsersModule,
    DhikrsModule,
    DhikrLogsModule,
    StreaksModule,
    AiModule,
    AiChatModule,
    SpecialDaysModule,
    SubscriptionsModule,
    UserDhikrsModule,
    WebhooksModule,
    DhikrCollectionsModule,
    StatsModule,
    DevicesModule,
    PushModule,
    EventsModule,
    PushCampaignsModule,
    VirdModule,
    CirclesModule,
  ],
  controllers: [AppController],
  providers: [JwtAuthGuard],
})
export class AppModule implements OnApplicationShutdown {
  onApplicationShutdown() {
    return flushDrain();
  }
}
