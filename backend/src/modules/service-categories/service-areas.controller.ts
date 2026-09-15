import { Controller, Get } from '@nestjs/common';
import { ServiceCategoriesService } from './service-categories.service';

@Controller('service-areas')
export class ServiceAreasController {
  constructor(private readonly serviceCategories: ServiceCategoriesService) {}

  @Get()
  findAll() {
    return this.serviceCategories.findAreas();
  }
}
