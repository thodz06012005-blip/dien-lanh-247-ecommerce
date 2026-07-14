import { Module } from '@nestjs/common';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';
import { TaxonomyController } from './taxonomy.controller';
import { TaxonomyService } from './taxonomy.service';

@Module({
  controllers: [ContentController, TaxonomyController],
  providers: [ContentService, TaxonomyService],
  exports: [ContentService, TaxonomyService],
})
export class ContentModule {}
