import { Injectable, Logger, OnModuleInit, Global } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as Minio from "minio";

@Global()
@Injectable()
export class MinioService implements OnModuleInit {
  private readonly logger = new Logger(MinioService.name);
  private minioClient!: Minio.Client;
  private readonly bucketName: string;

  constructor(private readonly configService: ConfigService) {
    this.bucketName =
      this.configService.get<string>("minio.bucketName") || "recruitment-files";
  }

  async onModuleInit() {
    const accessKey = this.configService.get<string>("minio.accessKey");
    const secretKey = this.configService.get<string>("minio.secretKey");
    if (!accessKey || !secretKey) {
      throw new Error("MinIO credentials (MINIO_ACCESS_KEY, MINIO_SECRET_KEY) must be set in environment");
    }

    this.minioClient = new Minio.Client({
      endPoint: this.configService.get<string>("minio.endPoint") ?? "localhost",
      port: this.configService.get<number>("minio.port") ?? 9000,
      useSSL: this.configService.get<boolean>("minio.useSSL") ?? false,
      accessKey,
      secretKey,
      region: this.configService.get<string>("minio.region") ?? "us-east-1",
    });

    try {
      const bucketExists = await this.minioClient.bucketExists(this.bucketName);
      if (!bucketExists) {
        await this.minioClient.makeBucket(
          this.bucketName,
          this.configService.get<string>("minio.region") ?? "us-east-1",
        );
        this.logger.log(`Bucket ${this.bucketName} created successfully`);
      }
      this.logger.log("MinIO client initialized successfully");
    } catch (error) {
      // Bucket check failed — log warning but don't crash app.
      // Bucket already exists in S3; actual upload errors surface per-request.
      this.logger.warn(`Bucket check failed, continuing: ${(error as Error).message}`);
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = "uploads"
  ): Promise<{
    fileName: string;
    originalName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    url: string;
  }> {
    try {
      const fileName = this.generateFileName(file.originalname);
      const filePath = `${folder}/${fileName}`;

      await this.minioClient.putObject(
        this.bucketName,
        filePath,
        file.buffer,
        file.size,
        {
          "Content-Type": file.mimetype,
          "Original-Name": file.originalname,
        }
      );

      const url = await this.getFileUrl(filePath);

      return {
        fileName,
        originalName: file.originalname,
        filePath,
        fileSize: file.size,
        mimeType: file.mimetype,
        url
      };
    } catch (error) {
      this.logger.error("Failed to upload file to MinIO", error);
      throw new Error("Failed to upload file");
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      await this.minioClient.removeObject(this.bucketName, filePath);
      this.logger.log(`File ${filePath} deleted successfully`);
    } catch (error) {
      this.logger.error(`Failed to delete file ${filePath}`, error);
      throw new Error("Failed to delete file");
    }
  }

  async getFileUrl(filePath: string): Promise<string> {
    try {
      const url = await this.minioClient.presignedGetObject(
        this.bucketName,
        filePath,
        24 * 60 * 60
      ); // 24 hours
      return url;
    } catch (error) {
      this.logger.error(`Failed to get file URL for ${filePath}`, error);
      throw new Error("Failed to get file URL");
    }
  }

  /**
   * Mengambil file dari MinIO sebagai Buffer.
   * Digunakan oleh scoring service untuk mengirim dokumen CV ke FastAPI
   * dalam bentuk multipart/form-data.
   *
   * @param filePath - Path file di dalam bucket (contoh: "cv/1234-abc.pdf")
   * @returns Buffer isi file
   */
  async getFileBuffer(filePath: string): Promise<Buffer> {
    try {
      const stream = await this.minioClient.getObject(
        this.bucketName,
        filePath
      );

      return new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = [];
        stream.on("data", (chunk: Buffer) => chunks.push(chunk));
        stream.on("end", () => resolve(Buffer.concat(chunks)));
        stream.on("error", reject);
      });
    } catch (error) {
      this.logger.error(`Failed to get file buffer for ${filePath}`, error);
      throw new Error(`Failed to retrieve file from storage: ${filePath}`);
    }
  }

  private generateFileName(originalName: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = originalName.split(".").pop();
    return `${timestamp}-${randomString}.${extension}`;
  }
}
