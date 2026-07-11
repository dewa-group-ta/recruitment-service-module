import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Like, FindManyOptions, FindOptionsWhere } from "typeorm";
import { ApplicantSource } from "../entities/applicant-source.entity";
import { CreateApplicantSourceDto } from "../dto/create-applicant-source.dto";
import { UpdateApplicantSourceDto } from "../dto/update-applicant-source.dto";
import { QueryApplicantSourceDto } from "../dto/query-applicant-source.dto";
import { Pagination } from "src/shared/paginate";

@Injectable()
export class ApplicantSourceService {
  constructor(
    @InjectRepository(ApplicantSource)
    private readonly applicantSourceRepository: Repository<ApplicantSource>
  ) {}

  async create(
    createApplicantSourceDto: CreateApplicantSourceDto
  ): Promise<ApplicantSource> {
    const applicantSource = this.applicantSourceRepository.create(
      createApplicantSourceDto
    );
    return await this.applicantSourceRepository.save(applicantSource);
  }

  async findAll(): Promise<ApplicantSource[]> {
    return await this.applicantSourceRepository.find({
      order: { sortOrder: "ASC", name: "ASC" }
    });
  }

  async findActive(): Promise<ApplicantSource[]> {
    return await this.applicantSourceRepository.find({
      where: { isActive: true },
      order: { sortOrder: "ASC", name: "ASC" }
    });
  }

  async findOne(id: string): Promise<ApplicantSource> {
    const applicantSource = await this.applicantSourceRepository.findOne({
      where: { id }
    });

    if (!applicantSource) {
      throw new NotFoundException(`Applicant source with ID ${id} not found`);
    }

    return applicantSource;
  }

  async update(
    id: string,
    updateApplicantSourceDto: UpdateApplicantSourceDto
  ): Promise<ApplicantSource> {
    const applicantSource = await this.findOne(id);

    Object.assign(applicantSource, updateApplicantSourceDto);
    return await this.applicantSourceRepository.save(applicantSource);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.applicantSourceRepository.softDelete(id);
  }

  async toggleActive(id: string): Promise<ApplicantSource> {
    const applicantSource = await this.findOne(id);
    applicantSource.isActive = !applicantSource.isActive;
    return await this.applicantSourceRepository.save(applicantSource);
  }

  async findWithPagination(
    queryDto: QueryApplicantSourceDto
  ): Promise<Pagination<ApplicantSource>> {
    const {
      page = 1,
      limit = 10,
      search,
      isActive,
      sortBy = "sortOrder",
      sortOrder = "ASC"
    } = queryDto;

    const whereConditions: FindOptionsWhere<ApplicantSource> = {};

    if (isActive !== undefined) {
      whereConditions.isActive = isActive;
    }

    if (search) {
      whereConditions.name = Like(`%${search}%`);
    }

    const findOptions: FindManyOptions<ApplicantSource> = {
      where: whereConditions,
      order: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit
    };

    const [data, totalItems] =
      await this.applicantSourceRepository.findAndCount(findOptions);

    const totalPages = Math.ceil(totalItems / limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total_items: totalItems,
        total_pages: totalPages
      }
    };
  }

  async getStatistics(): Promise<{
    total: number;
    active: number;
    inactive: number;
  }> {
    const [total, active] = await Promise.all([
      this.applicantSourceRepository.count(),
      this.applicantSourceRepository.count({ where: { isActive: true } })
    ]);

    return {
      total,
      active,
      inactive: total - active
    };
  }

  /**
   * validasi customSource wajib diisi hanya kalau applicant source "others" dipilih.
   */
  async validateCustomSource(
    customSource: string,
    applicantSourceIds: string[]
  ): Promise<boolean> {
    if (!applicantSourceIds || applicantSourceIds.length === 0) {
      return true;
    }

    try {
      const othersSource = await this.applicantSourceRepository.findOneBy({
        name: "Others"
      });

      if (!othersSource) {
        return true; // source "others" belum ada di data, anggap validasi lolos
      }

      const isOthersSelected = applicantSourceIds.includes(othersSource.id);

      if (isOthersSelected) {
        return Boolean(customSource && customSource.trim().length > 0);
      }

      return Boolean(!customSource || customSource.trim().length === 0);
    } catch (error) {
      console.error("Error in custom source validation:", error);
      return true; // gagal validasi dianggap lolos (fail-open), bukan block applicant
    }
  }

  /**
   * pesan error untuk validasi customSource.
   */
  getErrorMessage(applicantSourceIds: string[]): string {
    if (!applicantSourceIds || applicantSourceIds.length === 0) {
      return "Custom source is not required when no applicant sources are selected";
    }

    // cek "others" secara sederhana (beda dengan pengecekan di validateCustomSource) karena di sini belum ada akses ke id sumber yang sebenarnya
    const hasOthers = applicantSourceIds.some(
      (id: string) =>
        typeof id === "string" &&
        (id === "others" || id.toLowerCase().includes("others"))
    );

    if (hasOthers) {
      return "Custom source is required when Others is selected";
    }

    return "Custom source should not be provided when Others is not selected";
  }
}
