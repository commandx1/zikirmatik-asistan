import { IsString, Length } from 'class-validator';
import { CIRCLE_CODE_LENGTH } from '../circles.constants';

export class JoinCircleDto {
  // Servis normalize eder (ayraçları atar + uppercase); "ABCD-EFGH" gibi
  // ayraçlı ham girdiye yer bırakmak için üst sınır gevşek tutulur.
  @IsString()
  @Length(CIRCLE_CODE_LENGTH, CIRCLE_CODE_LENGTH * 2)
  code!: string;
}
