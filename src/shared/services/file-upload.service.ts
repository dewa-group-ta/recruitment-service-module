import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { MinioService } from "./minio.service";
import { File } from "../entities/file.entity";
import { FileUploadDto, FileResponseDto } from "../dto/file-upload.dto";

@Injectable()
export class FileUploadService {
  private readonly logger = new Logger(FileUploadService.name);

  constructor(
    @InjectRepository(File)
    private readonly fileRepository: Repository<File>,
    private readonly minioService: MinioService
  ) {}

  async uploadFile(
    file: Express.Multer.File,
    uploadDto: FileUploadDto,
    uploadedById?: string
  ): Promise<FileResponseDto> {
    try {
      const uploadResult = await this.minioService.uploadFile(
        file,
        uploadDto.folder || "uploads"
      );

      const fileEntity = this.fileRepository.create({
        fileName: uploadResult.fileName,
        originalName: uploadResult.originalName,
        filePath: uploadResult.filePath,
        fileSize: uploadResult.fileSize,
        mimeType: uploadResult.mimeType,
        bucket: "recruitment-files",
        fileType: uploadDto.fileType,
        description: uploadDto.description,
        uploadedById,
        relatedEntity: uploadDto.relatedEntity,
        relatedEntityId: uploadDto.relatedEntityId
      });

      const savedFile = await this.fileRepository.save(fileEntity);

      return {
        id: savedFile.id,
        fileName: savedFile.fileName,
        originalName: savedFile.originalName,
        filePath: savedFile.filePath,
        fileSize: savedFile.fileSize,
        mimeType: savedFile.mimeType,
        fileType: savedFile.fileType,
        description: savedFile.description,
        url: uploadResult.url,
        uploadedAt: savedFile.createdAt
      };
    } catch (error) {
      this.logger.error("Failed to upload file", error);
      throw error;
    }
  }

  async getFileById(id: string): Promise<FileResponseDto> {
    const file = await this.fileRepository.findOne({
      where: { id, isActive: true }
    });

    if (!file) {
      throw new NotFoundException("File not found");
    }

    const url = await this.minioService.getFileUrl(file.filePath);

    return {
      id: file.id,
      fileName: file.fileName,
      originalName: file.originalName,
      filePath: file.filePath,
      fileSize: file.fileSize,
      mimeType: file.mimeType,
      fileType: file.fileType,
      description: file.description,
      url,
      uploadedAt: file.createdAt
    };
  }

  async deleteFile(id: string): Promise<void> {
    const file = await this.fileRepository.findOne({
      where: { id, isActive: true }
    });

    if (!file) {
      throw new NotFoundException("File not found");
    }

    try {
      await this.minioService.deleteFile(file.filePath);

      await this.fileRepository.update(id, { isActive: false });

      this.logger.log(`File ${id} deleted successfully`);
    } catch (error) {
      this.logger.error(`Failed to delete file ${id}`, error);
      throw error;
    }
  }

  async deleteFileByPath(filePath: string): Promise<void> {
    await this.minioService.deleteFile(filePath);
    await this.fileRepository.update({ filePath }, { isActive: false });
  }

  async validateFileOwnership(
    fileId: string,
    applicantId: string
  ): Promise<void> {
    const file = await this.fileRepository.findOne({
      where: { id: fileId, isActive: true }
    });

    if (!file) {
      throw new NotFoundException("File not found");
    }

    if (file.uploadedById !== applicantId) {
      throw new ForbiddenException("You can only delete your own files");
    }
  }

  async getFilesByEntity(
    relatedEntity: string,
    relatedEntityId: string
  ): Promise<FileResponseDto[]> {
    const files = await this.fileRepository.find({
      where: {
        relatedEntity,
        relatedEntityId,
        isActive: true
      },
      order: { createdAt: "DESC" }
    });

    const filesWithUrls = await Promise.all(
      files.map(async (file) => {
        const url = await this.minioService.getFileUrl(file.filePath);
        return {
          id: file.id,
          fileName: file.fileName,
          originalName: file.originalName,
          filePath: file.filePath,
          fileSize: file.fileSize,
          mimeType: file.mimeType,
          fileType: file.fileType,
          description: file.description,
          url,
          uploadedAt: file.createdAt
        };
      })
    );

    return filesWithUrls;
  }

  /**
   * alias untuk getFileById (saat ini belum ada logika publik yang berbeda).
   */
  async getPublicFileById(id: string): Promise<FileResponseDto> {
    return this.getFileById(id);
  }
}
