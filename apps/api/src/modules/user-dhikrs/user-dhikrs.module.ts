import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserDhikrsController } from './user-dhikrs.controller';
import { UserDhikrsService } from './user-dhikrs.service';
import { UserDhikr, UserDhikrSchema } from './schemas/user-dhikr.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserDhikr.name, schema: UserDhikrSchema },
    ]),
  ],
  controllers: [UserDhikrsController],
  providers: [UserDhikrsService],
})
export class UserDhikrsModule {}
