import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

export const CloudinaryProvider = {
  provide: 'CLOUDINARY',
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    return cloudinary.config({
      cloud_name: configService.get('CLOUDINARY_CLOUD_NAME') || 'demo',
      api_key: configService.get('CLOUDINARY_API_KEY') || 'demo_key',
      api_secret: configService.get('CLOUDINARY_API_SECRET') || 'demo_secret',
    });
  },
};
