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
      const folder = this.configService.get<string>(CLOUDINARY_FOLDER) || 'Image-Post';
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          quality: 'auto',
          fetch_format: 'auto',
          transformation: [{ width: 1920, height: 1920, crop: 'limit' }],
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

  async uploadImages(files: Express.Multer.File[]): Promise<string[]> {
    try {
      return await Promise.all(files.map(file => this.uploadImage(file)));
    } catch (error) {
      if (error instanceof CloudinaryUploadError) {
        throw error;
      }
      this.logger.error(`Failed to upload images: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw new CloudinaryUploadError('Failed to upload images to cloud storage');
    }
  }

  private extractPublicId(imageUrl: string): string {
    const folder = this.configService.get<string>(CLOUDINARY_FOLDER) || 'Image-Post';
    const parts = imageUrl.split('/');
    const folderIndex = parts.indexOf(folder);
    if (folderIndex === -1) {
      throw new CloudinaryDeleteError(`Could not parse Cloudinary URL: ${imageUrl}`);
    }
    const publicIdParts = parts.slice(folderIndex);
    const publicIdWithExt = publicIdParts.join('/');
    const extIndex = publicIdWithExt.lastIndexOf('.');
    return extIndex > 0 ? publicIdWithExt.substring(0, extIndex) : publicIdWithExt;
  }

  async deleteImage(imageUrl: string): Promise<void> {
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

  async deleteImages(urls: string[]): Promise<void> {
    const results = await Promise.allSettled(
      urls.map(url => this.deleteImage(url)),
    );
    const rejected = results.filter(r => r.status === 'rejected') as PromiseRejectedResult[];
    if (rejected.length > 0) {
      const messages = rejected.map(r => r.reason instanceof Error ? r.reason.message : 'Unknown error');
      throw new CloudinaryDeleteError(
        `${rejected.length} image(s) failed to delete: ${messages.join('; ')}`,
      );
    }
  }
}
