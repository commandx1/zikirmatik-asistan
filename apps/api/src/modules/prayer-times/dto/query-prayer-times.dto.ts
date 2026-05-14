import { IsString } from 'class-validator';

export class QueryPrayerTimesDto {
  @IsString()
  city!: string;
}
