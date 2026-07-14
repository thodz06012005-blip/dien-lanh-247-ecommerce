import { Module } from '@nestjs/common';
import { ContentController } from './content.controller';
import { ContentMediaService } from './content-media.service';
import { ContentRevisionService } from './content-revision.service';
import { ContentService } from './content.service';
import { EditorialCmsController } from './editorial-cms.controller';
import { EditorialCmsService } from './editorial-cms.service';
import { TaxonomyController } from './taxonomy.controller';
import { TaxonomyService } from './taxonomy.service';

@Module({
  controllers: [ContentController, TaxonomyController, EditorialCmsController],
  providers: [
    ContentService,
    TaxonomyService,
    ContentRevisionService,
    ContentMediaService,
    EditorialCmsService,
  ],
  exports: [ContentService, TaxonomyService, EditorialCmsService],
})
export class ContentModule {}
