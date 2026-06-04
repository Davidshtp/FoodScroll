import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryUploadError, CloudinaryDeleteError } from '../../domain/errors/domain.errors';
import {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  CLOUDINARY_FOLDER,
} from '../config/constants';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger('CloudinaryService');

  constructor(private readonly configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>(CLOUDINARY_CLOUD_NAME),
      api_key: this.configService.get<string>(CLOUDINARY_API_KEY),
      api_secret: this.configService.get<string>(CLOUDINARY_API_SECRET),
    });
  }

  async uploadImage(file: Express.Multer.File): Promise<string> {
    return new Promise((resolve, reject) => {
      const folder = this.configService.get<string>(CLOUDINARY_FOLDER) || 'avatars/customers';
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          quality: 'auto',
          fetch_format: 'auto',
          transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
        },
        (error, result) => {
          if (error) {
            this.logger.error(`Cloudinary upload error: ${error.message}`);
            reject(new CloudinaryUploadError(error.message));
          } else if (result) {
            resolve(result.secure_url);
          } else {
            reject(new CloudinaryUploadError('No result returned from Cloudinary'));
          }
        },
      );
      uploadStream.on('error', (err) => {
        this.logger.error(`Cloudinary stream error: ${err.message}`);
        reject(new CloudinaryUploadError(err.message));
      });
      uploadStream.end(file.buffer);
    });
  }

  isCloudinaryUrl(url: string): boolean {
    return url.includes('res.cloudinary.com');
  }

  private extractPublicId(imageUrl: string): string {
    const parts = imageUrl.split('/');
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex === -1) {
      throw new CloudinaryDeleteError(`Could not parse Cloudinary URL: ${imageUrl}`);
    }
    const afterUpload = parts.slice(uploadIndex + 1);
    const pathWithExt = afterUpload.join('/');
    const extIndex = pathWithExt.lastIndexOf('.');
    const pathWithoutExt = extIndex > 0 ? pathWithExt.substring(0, extIndex) : pathWithExt;
    const segments = pathWithoutExt.split('/');
    if (segments.length > 1 && /^v\d+$/.test(segments[0])) {
      segments.shift();
    }
    return segments.join('/');
  }

  async deleteImage(imageUrl: string): Promise<void> {
    if (!this.isCloudinaryUrl(imageUrl)) {
      return;
    }
    try {
      const publicId = this.extractPublicId(imageUrl);
      await new Promise<void>((resolve, reject) => {
        cloudinary.uploader.destroy(publicId, (error) => {
          if (error) {
            reject(new CloudinaryDeleteError(error.message));
          } else {
            resolve();
          }
        });
      });
    } catch (error) {
      if (error instanceof CloudinaryDeleteError) {
        throw error;
      }
      this.logger.error(`Failed to delete image: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw new CloudinaryDeleteError(error instanceof Error ? error.message : 'Unknown error');
    }
  }
}
