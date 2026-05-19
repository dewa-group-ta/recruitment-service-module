import { ApiProperty } from "@nestjs/swagger";

export class CvDocumentResponseDto {
  @ApiProperty({ example: "uuid-..." })
  id!: string;

  @ApiProperty({ example: "uuid-..." })
  applicationId!: string;

  @ApiProperty({ example: "Budi Santoso", nullable: true })
  applicantName!: string | null;

  @ApiProperty({
    type: [String],
    example: ["Node.js", "PostgreSQL", "Docker"],
    nullable: true,
    description: "Skill hasil parsing LLM — digunakan Jaccard similarity"
  })
  skills!: string[] | null;

  @ApiProperty({ nullable: true })
  parsedAt!: Date | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}