import {
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { VIRD_SLOT_KEY_ENUM, type VirdSlotKey } from '../../vird/vird.types';

/**
 * `POST /v1/ai/vird-programs` gövdesi. `userId` YOKTUR — AI Rehber'in eski
 * (`CreateAiRecommendationDto.userId`) deseninin aksine, kullanıcı kimliği
 * yalnızca `@CurrentUserId()` (JWT) üzerinden alınır; istemcinin bunu ayrıca
 * body'ye koyması gerekmez (bkz. ai.controller.ts createVirdProgram).
 */
export class CreateAiVirdProgramDto {
  @IsUUID('4')
  flowId!: string;

  @IsOptional()
  @IsString()
  freeText?: string;

  @IsIn([7, 14, 30])
  durationDays!: 7 | 14 | 30;

  @IsArray()
  @ArrayNotEmpty()
  @IsIn(Object.values(VIRD_SLOT_KEY_ENUM), { each: true })
  slots!: VirdSlotKey[];

  @IsOptional()
  @IsArray()
  @IsIn([1, 2, 3, 4, 5], { each: true })
  prayerSelection?: number[];

  @IsOptional()
  @IsIn(['tr', 'en'])
  locale?: 'tr' | 'en';
}
