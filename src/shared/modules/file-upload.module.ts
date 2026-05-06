import { Global, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MinioService } from "../services/minio.service";
import { FileUploadService } from "../services/file-upload.service";
import { File } from "../entities/file.entity";

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([File])],
  providers: [MinioService, FileUploadService],
  exports: [MinioService, FileUploadService]
})
export class FileUploadModule {}
