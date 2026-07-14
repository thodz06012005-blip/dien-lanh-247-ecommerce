import { Controller, Get } from '@nestjs/common';
import { TaxonomyService } from './taxonomy.service';

@Controller('content')
export class TaxonomyController {
  constructor(private readonly taxonomyService: TaxonomyService) {}

  @Get('categories')
  listCategories() {
    return this.taxonomyService.listPostCategories();
  }

  @Get('tags')
  listTags() {
    return this.taxonomyService.listTags();
  }
}
