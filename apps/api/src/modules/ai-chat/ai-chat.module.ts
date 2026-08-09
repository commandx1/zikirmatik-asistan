import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/schemas/user.schema';
import { AiModule } from '../ai/ai.module';
import { AiChatController } from './ai-chat.controller';
import { AiChatService } from './ai-chat.service';
import {
  AiChatMessage,
  AiChatMessageSchema,
} from './schemas/ai-chat-message.schema';
import {
  AiConversation,
  AiConversationSchema,
} from './schemas/ai-conversation.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AiConversation.name, schema: AiConversationSchema },
      { name: AiChatMessage.name, schema: AiChatMessageSchema },
      { name: User.name, schema: UserSchema },
    ]),
    // AiService (searchSourcePassagesForAgent, ensureCreditAccessForFlow,
    // debitCreditForFlow) ve AiProgressGateway'i (exports listesine
    // yeni bir şey eklemeden) yeniden kullanmak için AiModule import edilir.
    AiModule,
  ],
  controllers: [AiChatController],
  providers: [AiChatService],
  exports: [AiChatService],
})
export class AiChatModule {}
