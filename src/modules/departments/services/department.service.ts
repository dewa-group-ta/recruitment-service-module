import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindManyOptions, Like, IsNull } from "typeorm";
import { Department } from "../entities/department.entity";
import {
  CreateDepartmentDto,
  UpdateDepartmentDto,
  QueryDepartmentDto,
  DepartmentResponseDto
} from "../dto";
import { Pagination } from "src/shared/paginate";

@Injectable()
export class DepartmentService {
  constructor(
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>
  ) {}

  async create(
    createDepartmentDto: CreateDepartmentDto
  ): Promise<DepartmentResponseDto> {
    try {
      const existingDepartment = await this.departmentRepository.findOne({
        where: { name: createDepartmentDto.name, deletedAt: IsNull() }
      });

      if (existingDepartment) {
        throw new ConflictException(
          `Department with name '${createDepartmentDto.name}' already exists`
        );
      }

      if (createDepartmentDto.code) {
        const existingCode = await this.departmentRepository.findOne({
          where: { code: createDepartmentDto.code, deletedAt: IsNull() }
        });

        if (existingCode) {
          throw new ConflictException(
            `Department with code '${createDepartmentDto.code}' already exists`
          );
        }
      }

      const department = this.departmentRepository.create(createDepartmentDto);
      const savedDepartment = await this.departmentRepository.save(department);

      return this.mapToResponseDto(savedDepartment);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to create department: ${error.message}`
      );
    }
  }

  async findAll(
    queryDto: QueryDepartmentDto
  ): Promise<Pagination<DepartmentResponseDto>> {
    const { page, limit, keyword, sort_by, order, isActive } = queryDto;
    const skip = (page - 1) * limit;

    const whereConditions: any = {
      deletedAt: IsNull()
    };

    if (keyword) {
      whereConditions.name = Like(`%${keyword}%`);
    }

    if (isActive !== undefined) {
      whereConditions.isActive = isActive;
    }

    const findOptions: FindManyOptions<Department> = {
      where: whereConditions,
      skip,
      take: limit,
      order: {
        [sort_by || "createdAt"]: order || "DESC"
      }
    };

    const [departments, total] =
      await this.departmentRepository.findAndCount(findOptions);

    const totalPages = Math.ceil(total / limit);

    return new Pagination({
      data: departments.map((department) => this.mapToResponseDto(department)),
      page,
      limit,
      total_items: total,
      total_pages: totalPages
    });
  }

  async findOne(id: string): Promise<DepartmentResponseDto> {
    const department = await this.departmentRepository.findOne({
      where: { id, deletedAt: IsNull() }
    });

    if (!department) {
      throw new NotFoundException(`Department with ID '${id}' not found`);
    }

    return this.mapToResponseDto(department);
  }

  async update(
    id: string,
    updateDepartmentDto: UpdateDepartmentDto
  ): Promise<DepartmentResponseDto> {
    try {
      const department = await this.departmentRepository.findOne({
        where: { id, deletedAt: IsNull() }
      });

      if (!department) {
        throw new NotFoundException(`Department with ID '${id}' not found`);
      }

      if (
        updateDepartmentDto.name &&
        updateDepartmentDto.name !== department.name
      ) {
        const existingDepartment = await this.departmentRepository.findOne({
          where: { name: updateDepartmentDto.name, deletedAt: IsNull() }
        });

        if (existingDepartment) {
          throw new ConflictException(
            `Department with name '${updateDepartmentDto.name}' already exists`
          );
        }
      }

      if (
        updateDepartmentDto.code &&
        updateDepartmentDto.code !== department.code
      ) {
        const existingCode = await this.departmentRepository.findOne({
          where: { code: updateDepartmentDto.code, deletedAt: IsNull() }
        });

        if (existingCode) {
          throw new ConflictException(
            `Department with code '${updateDepartmentDto.code}' already exists`
          );
        }
      }

      Object.assign(department, updateDepartmentDto);
      const updatedDepartment =
        await this.departmentRepository.save(department);

      return this.mapToResponseDto(updatedDepartment);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to update department: ${error.message}`
      );
    }
  }

  async remove(id: string, deletedById: string): Promise<{ message: string }> {
    try {
      const department = await this.departmentRepository.findOne({
        where: { id, deletedAt: IsNull() }
      });

      if (!department) {
        throw new NotFoundException(`Department with ID '${id}' not found`);
      }

      await this.departmentRepository.update(id, {
        deletedAt: new Date(),
        deletedById
      });

      return { message: "Department deleted successfully" };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to delete department: ${error.message}`
      );
    }
  }

  async restore(id: string): Promise<DepartmentResponseDto> {
    try {
      const department = await this.departmentRepository.findOne({
        where: { id },
        withDeleted: true
      });

      if (!department) {
        throw new NotFoundException(`Department with ID '${id}' not found`);
      }

      if (!department.deletedAt) {
        throw new BadRequestException("Department is not deleted");
      }

      await this.departmentRepository.query(
        "UPDATE departments SET deleted_at = NULL, deleted_by = NULL WHERE id = $1",
        [id]
      );

      const restoredDepartment = await this.departmentRepository.findOne({
        where: { id }
      });

      if (!restoredDepartment) {
        throw new NotFoundException(
          `Department with ID '${id}' not found after restore`
        );
      }

      return this.mapToResponseDto(restoredDepartment);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to restore department: ${error.message}`
      );
    }
  }

  async findActive(): Promise<DepartmentResponseDto[]> {
    const departments = await this.departmentRepository.find({
      where: { isActive: true, deletedAt: IsNull() },
      order: { name: "ASC" }
    });

    return departments.map((department) => this.mapToResponseDto(department));
  }

  private mapToResponseDto(department: Department): DepartmentResponseDto {
    return {
      id: department.id,
      name: department.name,
      code: department.code,
      description: department.description,
      isActive: department.isActive,
      createdById: department.createdById,
      updatedById: department.updatedById,
      createdAt: department.createdAt,
      updatedAt: department.updatedAt,
      deletedAt: department.deletedAt || undefined,
      deletedById: department.deletedById || undefined
    };
  }
}
