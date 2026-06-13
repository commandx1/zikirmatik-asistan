import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DhikrsModule } from '../dhikrs/dhikrs.module';
import { DhikrCollectionsController } from './dhikr-collections.controller';
import { DhikrCollectionsService } from './dhikr-collections.service';
import {
  DhikrCollection,
  DhikrCollectionSchema,
} from './schemas/dhikr-collection.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DhikrCollection.name, schema: DhikrCollectionSchema },
    ]),
    DhikrsModule,
  ],
  controllers: [DhikrCollectionsController],
  providers: [DhikrCollectionsService],
})
export class DhikrCollectionsModule {}
