import { PipeTransform, Injectable, BadRequestException } from "@nestjs/common";

export interface FileValidationOptions {
  maxSize?: number; // in bytes
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
}

@Injectable()
export class FileValidationPipe implements PipeTransform {
  constructor(private readonly options: FileValidationOptions = {}) {}

  transform(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException("No file provided");
    }

    // Check file size
    if (this.options.maxSize && file.size > this.options.maxSize) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${this.options.maxSize} bytes`
      );
    }

    // Check MIME type
    if (
      this.options.allowedMimeTypes &&
      !this.options.allowedMimeTypes.includes(file.mimetype)
    ) {
      throw new BadRequestException(
        `File type ${file.mimetype} is not allowed. Allowed types: ${this.options.allowedMimeTypes.join(", ")}`
      );
    }

    // Check file extension
    if (this.options.allowedExtensions) {
      const fileExtension = file.originalname.split(".").pop()?.toLowerCase();
      if (
        !fileExtension ||
        !this.options.allowedExtensions.includes(fileExtension)
      ) {
        throw new BadRequestException(
          `File extension .${fileExtension} is not allowed. Allowed extensions: ${this.options.allowedExtensions.join(", ")}`
        );
      }
    }

    return file;
  }
}
