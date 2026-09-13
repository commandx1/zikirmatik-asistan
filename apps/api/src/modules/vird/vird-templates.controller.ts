import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { VirdTemplatesService } from './vird-templates.service';

/**
 * Kasıtlı olarak VirdController'dan (class-level @UseGuards(JwtAuthGuard))
 * AYRI bir controller. NestJS'te class-level ve method-level guard'lar
 * BİRLİKTE (üst üste, hepsi) çalışır — VirdController'a bir method'da
 * @UseGuards(OptionalJwtAuthGuard) eklemek onu JwtAuthGuard'ın ARDINDAN
 * ikinci bir guard yapardı, JwtAuthGuard token yoksa zaten 401 fırlattığı
 * için misafiri yine reddederdi. Şablonlar misafir için de (mobil çevrimdışı
 * kullanabilsin) erişilebilir olmalı, bu yüzden ayrı bir controller'da
 * yalnızca route-bazlı OptionalJwtAuthGuard kullanılır.
 */
@Controller('v1/vird/templates')
export class VirdTemplatesController {
  constructor(private readonly templatesService: VirdTemplatesService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  findAll() {
    return this.templatesService.findAllActive();
  }

  @Get(':key')
  @UseGuards(OptionalJwtAuthGuard)
  findOne(@Param('key') key: string) {
    return this.templatesService.findByKey(key);
  }
}
