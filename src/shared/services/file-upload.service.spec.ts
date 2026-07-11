import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { NotFoundException, ForbiddenException } from "@nestjs/common";
import { FileUploadService } from "./file-upload.service";
import { MinioService } from "./minio.service";
import { File } from "../entities/file.entity";
import { FileUploadDto } from "../dto/file-upload.dto";

describe("FileUploadService", () => {
  let service: FileUploadService;
  let fileRepository: jest.Mocked<Repository<File>>;
  let minioService: jest.Mocked<MinioService>;

  const mockFile = {
    id: "file-1",
    fileName: "test-file-123.jpg",
    originalName: "test-image.jpg",
    filePath: "uploads/test-file-123.jpg",
    fileSize: 1024,
    mimeType: "image/jpeg",
    bucket: "recruitment-files",
    fileType: "RESUME",
    description: "Test file upload",
    uploadedById: "user-1",
    relatedEntity: "APPLICANT",
    relatedEntityId: "applicant-1",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockUploadResult = {
    fileName: "test-file-123.jpg",
    originalName: "test-image.jpg",
    filePath: "uploads/test-file-123.jpg",
    fileSize: 1024,
    mimeType: "image/jpeg",
    url: "https://minio.example.com/recruitment-files/uploads/test-file-123.jpg"
  };

  const mockMulterFile: Express.Multer.File = {
    fieldname: "file",
    originalname: "test-image.jpg",
    encoding: "7bit",
    mimetype: "image/jpeg",
    size: 1024,
    buffer: Buffer.from("test file content"),
    destination: "",
    filename: "",
    path: "",
    stream: null
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileUploadService,
        {
          provide: getRepositoryToken(File),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn()
          }
        },
        {
          provide: MinioService,
          useValue: {
            uploadFile: jest.fn(),
            getFileUrl: jest.fn(),
            deleteFile: jest.fn()
          }
        }
      ]
    }).compile();

    service = module.get<FileUploadService>(FileUploadService);
    fileRepository = module.get(getRepositoryToken(File));
    minioService = module.get(MinioService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("uploadFile", () => {
    const uploadDto: FileUploadDto = {
      fileType: "RESUME",
      description: "Test file upload",
      folder: "uploads",
      relatedEntity: "APPLICANT",
      relatedEntityId: "applicant-1"
    };

    it("should upload file successfully", async () => {
      minioService.uploadFile.mockResolvedValue(mockUploadResult);
      fileRepository.create.mockReturnValue(mockFile as any);
      fileRepository.save.mockResolvedValue(mockFile as any);

      const result = await service.uploadFile(
        mockMulterFile,
        uploadDto,
        "user-1"
      );

      expect(minioService.uploadFile).toHaveBeenCalledWith(
        mockMulterFile,
        "uploads"
      );
      expect(fileRepository.create).toHaveBeenCalledWith({
        fileName: "test-file-123.jpg",
        originalName: "test-image.jpg",
        filePath: "uploads/test-file-123.jpg",
        fileSize: 1024,
        mimeType: "image/jpeg",
        bucket: "recruitment-files",
        fileType: "RESUME",
        description: "Test file upload",
        uploadedById: "user-1",
        relatedEntity: "APPLICANT",
        relatedEntityId: "applicant-1"
      });
      expect(fileRepository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.id).toBe("file-1");
      expect(result.url).toBe(
        "https://minio.example.com/recruitment-files/uploads/test-file-123.jpg"
      );
    });

    it("should upload file with default folder when not provided", async () => {
      const uploadDtoWithoutFolder = { ...uploadDto };
      delete uploadDtoWithoutFolder.folder;
      minioService.uploadFile.mockResolvedValue(mockUploadResult);
      fileRepository.create.mockReturnValue(mockFile as any);
      fileRepository.save.mockResolvedValue(mockFile as any);

      const result = await service.uploadFile(
        mockMulterFile,
        uploadDtoWithoutFolder,
        "user-1"
      );

      expect(minioService.uploadFile).toHaveBeenCalledWith(
        mockMulterFile,
        "uploads"
      );
      expect(result).toBeDefined();
    });

    it("should upload file without uploadedById when not provided", async () => {
      minioService.uploadFile.mockResolvedValue(mockUploadResult);
      fileRepository.create.mockReturnValue(mockFile as any);
      fileRepository.save.mockResolvedValue(mockFile as any);

      const result = await service.uploadFile(mockMulterFile, uploadDto);

      expect(fileRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          uploadedById: undefined
        })
      );
      expect(result).toBeDefined();
    });

    it("should throw error when MinIO upload fails", async () => {
      minioService.uploadFile.mockRejectedValue(
        new Error("MinIO upload failed")
      );

      await expect(
        service.uploadFile(mockMulterFile, uploadDto, "user-1")
      ).rejects.toThrow("MinIO upload failed");
    });

    it("should throw error when database save fails", async () => {
      minioService.uploadFile.mockResolvedValue(mockUploadResult);
      fileRepository.create.mockReturnValue(mockFile as any);
      fileRepository.save.mockRejectedValue(new Error("Database save failed"));

      await expect(
        service.uploadFile(mockMulterFile, uploadDto, "user-1")
      ).rejects.toThrow("Database save failed");
    });
  });

  describe("getFileById", () => {
    it("should return file when found", async () => {
      fileRepository.findOne.mockResolvedValue(mockFile as any);
      minioService.getFileUrl.mockResolvedValue(
        "https://minio.example.com/recruitment-files/uploads/test-file-123.jpg"
      );

      const result = await service.getFileById("file-1");

      expect(fileRepository.findOne).toHaveBeenCalledWith({
        where: { id: "file-1", isActive: true }
      });
      expect(minioService.getFileUrl).toHaveBeenCalledWith(
        "uploads/test-file-123.jpg"
      );
      expect(result).toBeDefined();
      expect(result.id).toBe("file-1");
      expect(result.url).toBe(
        "https://minio.example.com/recruitment-files/uploads/test-file-123.jpg"
      );
    });

    it("should throw NotFoundException when file not found", async () => {
      fileRepository.findOne.mockResolvedValue(null);

      await expect(service.getFileById("nonexistent-id")).rejects.toThrow(
        NotFoundException
      );
    });

    it("should throw error when MinIO URL generation fails", async () => {
      fileRepository.findOne.mockResolvedValue(mockFile as any);
      minioService.getFileUrl.mockRejectedValue(
        new Error("MinIO URL generation failed")
      );

      await expect(service.getFileById("file-1")).rejects.toThrow(
        "MinIO URL generation failed"
      );
    });
  });

  describe("deleteFile", () => {
    it("should delete file successfully", async () => {
      fileRepository.findOne.mockResolvedValue(mockFile as any);
      minioService.deleteFile.mockResolvedValue(undefined);
      fileRepository.update.mockResolvedValue({ affected: 1 } as any);

      await service.deleteFile("file-1");

      expect(fileRepository.findOne).toHaveBeenCalledWith({
        where: { id: "file-1", isActive: true }
      });
      expect(minioService.deleteFile).toHaveBeenCalledWith(
        "uploads/test-file-123.jpg"
      );
      expect(fileRepository.update).toHaveBeenCalledWith("file-1", {
        isActive: false
      });
    });

    it("should throw NotFoundException when file not found", async () => {
      fileRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteFile("nonexistent-id")).rejects.toThrow(
        NotFoundException
      );
    });

    it("should throw error when MinIO deletion fails", async () => {
      fileRepository.findOne.mockResolvedValue(mockFile as any);
      minioService.deleteFile.mockRejectedValue(
        new Error("MinIO deletion failed")
      );

      await expect(service.deleteFile("file-1")).rejects.toThrow(
        "MinIO deletion failed"
      );
    });

    it("should throw error when database update fails", async () => {
      fileRepository.findOne.mockResolvedValue(mockFile as any);
      minioService.deleteFile.mockResolvedValue(undefined);
      fileRepository.update.mockRejectedValue(
        new Error("Database update failed")
      );

      await expect(service.deleteFile("file-1")).rejects.toThrow(
        "Database update failed"
      );
    });
  });

  describe("getFilesByEntity", () => {
    it("should return files for specific entity", async () => {
      const mockFiles = [mockFile];
      fileRepository.find.mockResolvedValue(mockFiles as any);
      minioService.getFileUrl.mockResolvedValue(
        "https://minio.example.com/recruitment-files/uploads/test-file-123.jpg"
      );

      const result = await service.getFilesByEntity("APPLICANT", "applicant-1");

      expect(fileRepository.find).toHaveBeenCalledWith({
        where: {
          relatedEntity: "APPLICANT",
          relatedEntityId: "applicant-1",
          isActive: true
        },
        order: { createdAt: "DESC" }
      });
      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("file-1");
    });

    it("should return empty array when no files found", async () => {
      fileRepository.find.mockResolvedValue([]);

      const result = await service.getFilesByEntity("APPLICANT", "applicant-1");

      expect(result).toBeDefined();
      expect(result).toHaveLength(0);
    });

    it("should throw error when database query fails", async () => {
      fileRepository.find.mockRejectedValue(new Error("Database query failed"));

      await expect(
        service.getFilesByEntity("APPLICANT", "applicant-1")
      ).rejects.toThrow("Database query failed");
    });
  });

  describe("updateFileMetadata", () => {
    it("should update file metadata successfully", async () => {
      const updateData = {
        description: "Updated description",
        fileType: "COVER_LETTER"
      };
      fileRepository.findOne.mockResolvedValue(mockFile as any);
      fileRepository.update.mockResolvedValue({ affected: 1 } as any);

      const result = await service.updateFileMetadata("file-1", updateData);

      expect(fileRepository.findOne).toHaveBeenCalledWith({
        where: { id: "file-1", isActive: true }
      });
      expect(fileRepository.update).toHaveBeenCalledWith("file-1", updateData);
      expect(result).toBeDefined();
      expect(result.message).toBe("File metadata updated successfully");
    });

    it("should throw NotFoundException when file not found", async () => {
      const updateData = { description: "Updated description" };
      fileRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateFileMetadata("nonexistent-id", updateData)
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw error when database update fails", async () => {
      const updateData = { description: "Updated description" };
      fileRepository.findOne.mockResolvedValue(mockFile as any);
      fileRepository.update.mockRejectedValue(
        new Error("Database update failed")
      );

      await expect(
        service.updateFileMetadata("file-1", updateData)
      ).rejects.toThrow("Database update failed");
    });
  });
});
