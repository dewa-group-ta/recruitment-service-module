import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { Logger } from "@nestjs/common";
import { MinioService } from "./minio.service";
import * as Minio from "minio";

jest.mock("minio");
const mockMinio = Minio as jest.Mocked<typeof Minio>;

describe("MinioService", () => {
  let service: MinioService;
  let configService: jest.Mocked<ConfigService>;
  let mockMinioClient: jest.Mocked<Minio.Client>;

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
    mockMinioClient = {
      bucketExists: jest.fn(),
      makeBucket: jest.fn(),
      putObject: jest.fn(),
      removeObject: jest.fn(),
      presignedGetObject: jest.fn()
    } as any;

    mockMinio.Client.mockImplementation(() => mockMinioClient);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MinioService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn()
          }
        }
      ]
    }).compile();

    service = module.get<MinioService>(MinioService);
    configService = module.get(ConfigService);

    configService.get.mockImplementation((key: string, defaultValue?: any) => {
      const config = {
        "minio.bucketName": "recruitment-files",
        "minio.endPoint": "localhost",
        "minio.port": 9000,
        "minio.useSSL": false,
        "minio.accessKey": "minioadmin",
        "minio.secretKey": "minioadmin"
      };
      return config[key] || defaultValue;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("onModuleInit", () => {
    it("should initialize MinIO client successfully with existing bucket", async () => {
      mockMinioClient.bucketExists.mockResolvedValue(true);

      await service.onModuleInit();

      expect(mockMinio.Client).toHaveBeenCalledWith({
        endPoint: "localhost",
        port: 9000,
        useSSL: false,
        accessKey: "minioadmin",
        secretKey: "minioadmin"
      });
      expect(mockMinioClient.bucketExists).toHaveBeenCalledWith(
        "recruitment-files"
      );
      expect(mockMinioClient.makeBucket).not.toHaveBeenCalled();
    });

    it("should create bucket when it does not exist", async () => {
      mockMinioClient.bucketExists.mockResolvedValue(false);
      mockMinioClient.makeBucket.mockResolvedValue(undefined);

      await service.onModuleInit();

      expect(mockMinioClient.bucketExists).toHaveBeenCalledWith(
        "recruitment-files"
      );
      expect(mockMinioClient.makeBucket).toHaveBeenCalledWith(
        "recruitment-files",
        "us-east-1"
      );
    });

    it("should throw error when MinIO client initialization fails", async () => {
      mockMinioClient.bucketExists.mockRejectedValue(
        new Error("Connection failed")
      );

      await expect(service.onModuleInit()).rejects.toThrow("Connection failed");
    });

    it("should use default values when config is not provided", async () => {
      configService.get.mockReturnValue(undefined);
      mockMinioClient.bucketExists.mockResolvedValue(true);

      await service.onModuleInit();

      expect(mockMinio.Client).toHaveBeenCalledWith({
        endPoint: "localhost",
        port: 9000,
        useSSL: false,
        accessKey: "minioadmin",
        secretKey: "minioadmin"
      });
    });
  });

  describe("uploadFile", () => {
    beforeEach(async () => {
      mockMinioClient.bucketExists.mockResolvedValue(true);
      await service.onModuleInit();
    });

    it("should upload file successfully", async () => {
      mockMinioClient.putObject.mockResolvedValue(undefined);
      mockMinioClient.presignedGetObject.mockResolvedValue(
        "https://minio.example.com/recruitment-files/uploads/test-file-123.jpg"
      );

      const result = await service.uploadFile(mockMulterFile, "uploads");

      expect(mockMinioClient.putObject).toHaveBeenCalledWith(
        "recruitment-files",
        expect.stringMatching(/^uploads\/[a-f0-9-]+\.jpg$/),
        mockMulterFile.buffer,
        1024,
        {
          "Content-Type": "image/jpeg",
          "Original-Name": "test-image.jpg",
          "x-amz-acl": "public-read"
        }
      );
      expect(result).toBeDefined();
      expect(result.originalName).toBe("test-image.jpg");
      expect(result.fileSize).toBe(1024);
      expect(result.mimeType).toBe("image/jpeg");
      expect(result.url).toBe(
        "https://minio.example.com/recruitment-files/uploads/test-file-123.jpg"
      );
    });

    it("should upload file with default folder when not provided", async () => {
      mockMinioClient.putObject.mockResolvedValue(undefined);
      mockMinioClient.presignedGetObject.mockResolvedValue(
        "https://minio.example.com/recruitment-files/uploads/test-file-123.jpg"
      );

      const result = await service.uploadFile(mockMulterFile);

      expect(mockMinioClient.putObject).toHaveBeenCalledWith(
        "recruitment-files",
        expect.stringMatching(/^uploads\/[a-f0-9-]+\.jpg$/),
        mockMulterFile.buffer,
        1024,
        expect.any(Object)
      );
      expect(result).toBeDefined();
    });

    it("should generate unique file names", async () => {
      mockMinioClient.putObject.mockResolvedValue(undefined);
      mockMinioClient.presignedGetObject.mockResolvedValue(
        "https://minio.example.com/recruitment-files/uploads/test-file-123.jpg"
      );

      const result1 = await service.uploadFile(mockMulterFile, "uploads");
      const result2 = await service.uploadFile(mockMulterFile, "uploads");

      expect(result1.fileName).not.toBe(result2.fileName);
      expect(result1.filePath).not.toBe(result2.filePath);
    });

    it("should throw error when file upload fails", async () => {
      mockMinioClient.putObject.mockRejectedValue(new Error("Upload failed"));

      await expect(
        service.uploadFile(mockMulterFile, "uploads")
      ).rejects.toThrow("Failed to upload file");
    });

    it("should throw error when URL generation fails", async () => {
      mockMinioClient.putObject.mockResolvedValue(undefined);
      mockMinioClient.presignedGetObject.mockRejectedValue(
        new Error("URL generation failed")
      );

      await expect(
        service.uploadFile(mockMulterFile, "uploads")
      ).rejects.toThrow("Failed to upload file");
    });
  });

  describe("deleteFile", () => {
    beforeEach(async () => {
      mockMinioClient.bucketExists.mockResolvedValue(true);
      await service.onModuleInit();
    });

    it("should delete file successfully", async () => {
      mockMinioClient.removeObject.mockResolvedValue(undefined);

      await service.deleteFile("uploads/test-file-123.jpg");

      expect(mockMinioClient.removeObject).toHaveBeenCalledWith(
        "recruitment-files",
        "uploads/test-file-123.jpg"
      );
    });

    it("should throw error when file deletion fails", async () => {
      mockMinioClient.removeObject.mockRejectedValue(
        new Error("Deletion failed")
      );

      await expect(
        service.deleteFile("uploads/test-file-123.jpg")
      ).rejects.toThrow("Failed to delete file");
    });
  });

  describe("getFileUrl", () => {
    beforeEach(async () => {
      mockMinioClient.bucketExists.mockResolvedValue(true);
      await service.onModuleInit();
    });

    it("should generate presigned URL successfully", async () => {
      const expectedUrl =
        "https://minio.example.com/recruitment-files/uploads/test-file-123.jpg?X-Amz-Algorithm=...";
      mockMinioClient.presignedGetObject.mockResolvedValue(expectedUrl);

      const result = await service.getFileUrl("uploads/test-file-123.jpg");

      expect(mockMinioClient.presignedGetObject).toHaveBeenCalledWith(
        "recruitment-files",
        "uploads/test-file-123.jpg",
        7 * 24 * 60 * 60 // 7 days in seconds
      );
      expect(result).toBe(expectedUrl);
    });

    it("should throw error when URL generation fails", async () => {
      mockMinioClient.presignedGetObject.mockRejectedValue(
        new Error("URL generation failed")
      );

      await expect(
        service.getFileUrl("uploads/test-file-123.jpg")
      ).rejects.toThrow("Failed to get file URL");
    });
  });

  describe("generateFileName", () => {
    beforeEach(async () => {
      mockMinioClient.bucketExists.mockResolvedValue(true);
      await service.onModuleInit();
    });

    it("should generate unique file names with UUID", () => {
      const fileName1 = (service as any).generateFileName("test.jpg");
      const fileName2 = (service as any).generateFileName("test.jpg");

      expect(fileName1).toMatch(/^[a-f0-9-]+\.jpg$/);
      expect(fileName2).toMatch(/^[a-f0-9-]+\.jpg$/);
      expect(fileName1).not.toBe(fileName2);
    });

    it("should preserve file extension", () => {
      const fileName = (service as any).generateFileName("document.pdf");

      expect(fileName).toMatch(/\.pdf$/);
    });

    it("should handle files without extension", () => {
      const fileName = (service as any).generateFileName("README");

      expect(fileName).toMatch(/^[a-f0-9-]+$/);
    });
  });
});
