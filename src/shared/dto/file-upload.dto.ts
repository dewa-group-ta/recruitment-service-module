import { IsEnum, IsOptional, IsString, IsUUID } from "class-validator";
import { FileType } from "../entities/file.entity";

export class FileUploadDto {
  @IsEnum(FileType)
  fileType!: FileType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  folder?: string;

  @IsOptional()
  @IsUUID()
  relatedEntityId?: string;

  @IsOptional()
  @IsString()
  relatedEntity?: string;
}

export class FileResponseDto {
  id!: string;
  fileName!: string;
  originalName!: string;
  filePath!: string;
  fileSize!: number;
  mimeType!: string;
  fileType!: FileType;
  description?: string;
  url!: string;
  uploadedAt!: Date;
}
