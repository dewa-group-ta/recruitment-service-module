import { BadRequestException } from "@nestjs/common";
import {
  FileValidationPipe,
  FileValidationOptions
} from "./file-validation.pipe";

describe("FileValidationPipe", () => {
  let pipe: FileValidationPipe;

  const mockFile: Express.Multer.File = {
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

  describe("default options", () => {
    beforeEach(() => {
      pipe = new FileValidationPipe();
    });

    it("should pass validation for valid file", () => {
      const result = pipe.transform(mockFile);

      expect(result).toBe(mockFile);
    });

    it("should throw BadRequestException when no file provided", () => {
      expect(() => pipe.transform(null)).toThrow(BadRequestException);
      expect(() => pipe.transform(undefined)).toThrow(BadRequestException);
    });
  });

  describe("maxSize validation", () => {
    beforeEach(() => {
      const options: FileValidationOptions = {
        maxSize: 500 // 500 bytes
      };
      pipe = new FileValidationPipe(options);
    });

    it("should pass validation when file size is within limit", () => {
      const smallFile = { ...mockFile, size: 400 };

      const result = pipe.transform(smallFile);

      expect(result).toBe(smallFile);
    });

    it("should throw BadRequestException when file size exceeds limit", () => {
      const largeFile = { ...mockFile, size: 600 };

      expect(() => pipe.transform(largeFile)).toThrow(BadRequestException);
      expect(() => pipe.transform(largeFile)).toThrow(
        "File size exceeds maximum allowed size of 500 bytes"
      );
    });

    it("should pass validation when file size equals limit", () => {
      const exactSizeFile = { ...mockFile, size: 500 };

      const result = pipe.transform(exactSizeFile);

      expect(result).toBe(exactSizeFile);
    });
  });

  describe("allowedMimeTypes validation", () => {
    beforeEach(() => {
      const options: FileValidationOptions = {
        allowedMimeTypes: ["image/jpeg", "image/png", "application/pdf"]
      };
      pipe = new FileValidationPipe(options);
    });

    it("should pass validation for allowed MIME types", () => {
      const jpegFile = { ...mockFile, mimetype: "image/jpeg" };
      const pngFile = { ...mockFile, mimetype: "image/png" };
      const pdfFile = { ...mockFile, mimetype: "application/pdf" };

      expect(pipe.transform(jpegFile)).toBe(jpegFile);
      expect(pipe.transform(pngFile)).toBe(pngFile);
      expect(pipe.transform(pdfFile)).toBe(pdfFile);
    });

    it("should throw BadRequestException for disallowed MIME types", () => {
      const textFile = { ...mockFile, mimetype: "text/plain" };

      expect(() => pipe.transform(textFile)).toThrow(BadRequestException);
      expect(() => pipe.transform(textFile)).toThrow(
        "File type text/plain is not allowed. Allowed types: image/jpeg, image/png, application/pdf"
      );
    });

    it("should be case sensitive for MIME types", () => {
      const upperCaseFile = { ...mockFile, mimetype: "IMAGE/JPEG" };

      expect(() => pipe.transform(upperCaseFile)).toThrow(BadRequestException);
    });
  });

  describe("allowedExtensions validation", () => {
    beforeEach(() => {
      const options: FileValidationOptions = {
        allowedExtensions: ["jpg", "jpeg", "png", "pdf"]
      };
      pipe = new FileValidationPipe(options);
    });

    it("should pass validation for allowed extensions", () => {
      const jpgFile = { ...mockFile, originalname: "test.jpg" };
      const jpegFile = { ...mockFile, originalname: "test.jpeg" };
      const pngFile = { ...mockFile, originalname: "test.png" };
      const pdfFile = { ...mockFile, originalname: "test.pdf" };

      expect(pipe.transform(jpgFile)).toBe(jpgFile);
      expect(pipe.transform(jpegFile)).toBe(jpegFile);
      expect(pipe.transform(pngFile)).toBe(pngFile);
      expect(pipe.transform(pdfFile)).toBe(pdfFile);
    });

    it("should pass validation for extensions with different cases", () => {
      const upperCaseFile = { ...mockFile, originalname: "test.JPG" };
      const mixedCaseFile = { ...mockFile, originalname: "test.JpEg" };

      expect(pipe.transform(upperCaseFile)).toBe(upperCaseFile);
      expect(pipe.transform(mixedCaseFile)).toBe(mixedCaseFile);
    });

    it("should throw BadRequestException for disallowed extensions", () => {
      const txtFile = { ...mockFile, originalname: "test.txt" };
      const docFile = { ...mockFile, originalname: "test.doc" };

      expect(() => pipe.transform(txtFile)).toThrow(BadRequestException);
      expect(() => pipe.transform(txtFile)).toThrow(
        "File extension .txt is not allowed. Allowed extensions: jpg, jpeg, png, pdf"
      );
      expect(() => pipe.transform(docFile)).toThrow(BadRequestException);
    });

    it("should throw BadRequestException for files without extensions", () => {
      const noExtensionFile = { ...mockFile, originalname: "test" };

      expect(() => pipe.transform(noExtensionFile)).toThrow(
        BadRequestException
      );
      expect(() => pipe.transform(noExtensionFile)).toThrow(
        "File extension .undefined is not allowed. Allowed extensions: jpg, jpeg, png, pdf"
      );
    });

    it("should handle files with multiple dots in filename", () => {
      const multiDotFile = { ...mockFile, originalname: "test.backup.jpg" };

      const result = pipe.transform(multiDotFile);

      expect(result).toBe(multiDotFile);
    });
  });

  describe("combined validations", () => {
    beforeEach(() => {
      const options: FileValidationOptions = {
        maxSize: 1000,
        allowedMimeTypes: ["image/jpeg", "image/png"],
        allowedExtensions: ["jpg", "jpeg", "png"]
      };
      pipe = new FileValidationPipe(options);
    });

    it("should pass validation when all conditions are met", () => {
      const validFile = {
        ...mockFile,
        size: 800,
        mimetype: "image/jpeg",
        originalname: "test.jpg"
      };

      const result = pipe.transform(validFile);

      expect(result).toBe(validFile);
    });

    it("should fail validation when size exceeds limit", () => {
      const invalidSizeFile = {
        ...mockFile,
        size: 1200,
        mimetype: "image/jpeg",
        originalname: "test.jpg"
      };

      expect(() => pipe.transform(invalidSizeFile)).toThrow(
        BadRequestException
      );
      expect(() => pipe.transform(invalidSizeFile)).toThrow(
        "File size exceeds maximum allowed size of 1000 bytes"
      );
    });

    it("should fail validation when MIME type is not allowed", () => {
      const invalidMimeFile = {
        ...mockFile,
        size: 800,
        mimetype: "text/plain",
        originalname: "test.jpg"
      };

      expect(() => pipe.transform(invalidMimeFile)).toThrow(
        BadRequestException
      );
      expect(() => pipe.transform(invalidMimeFile)).toThrow(
        "File type text/plain is not allowed. Allowed types: image/jpeg, image/png"
      );
    });

    it("should fail validation when extension is not allowed", () => {
      const invalidExtFile = {
        ...mockFile,
        size: 800,
        mimetype: "image/jpeg",
        originalname: "test.txt"
      };

      expect(() => pipe.transform(invalidExtFile)).toThrow(BadRequestException);
      expect(() => pipe.transform(invalidExtFile)).toThrow(
        "File extension .txt is not allowed. Allowed extensions: jpg, jpeg, png"
      );
    });
  });

  describe("edge cases", () => {
    beforeEach(() => {
      pipe = new FileValidationPipe();
    });

    it("should handle empty filename", () => {
      const emptyNameFile = { ...mockFile, originalname: "" };

      expect(() => pipe.transform(emptyNameFile)).toThrow(BadRequestException);
    });

    it("should handle filename with only dots", () => {
      const dotsFile = { ...mockFile, originalname: "..." };

      expect(() => pipe.transform(dotsFile)).toThrow(BadRequestException);
    });

    it("should handle zero size file", () => {
      const zeroSizeFile = { ...mockFile, size: 0 };

      const result = pipe.transform(zeroSizeFile);

      expect(result).toBe(zeroSizeFile);
    });

    it("should handle very large file size", () => {
      const largeFile = { ...mockFile, size: Number.MAX_SAFE_INTEGER };

      const result = pipe.transform(largeFile);

      expect(result).toBe(largeFile);
    });
  });
});
