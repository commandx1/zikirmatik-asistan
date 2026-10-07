import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DevicesModule } from '../devices/devices.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import {
  AuthIdentity,
  AuthIdentitySchema,
} from './schemas/auth-identity.schema';
import {
  RefreshToken,
  RefreshTokenSchema,
} from './schemas/refresh-token.schema';

@Module({
  imports: [
    UsersModule,
    DevicesModule,
    MongooseModule.forFeature([
      { name: AuthIdentity.name, schema: AuthIdentitySchema },
      { name: RefreshToken.name, schema: RefreshTokenSchema },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
