import { DataSource } from "typeorm";
import { randomUUID } from "crypto";

export abstract class BaseSeeder {
  protected dataSource: DataSource;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  abstract run(): Promise<void>;

  protected async getRepository<T>(entity: new () => T) {
    return this.dataSource.getRepository(entity);
  }

  protected async clearTable<T>(entity: new () => T) {
    const repository = await this.getRepository(entity);
    // Use query to delete all records to avoid foreign key constraint issues
    await repository.query(`DELETE FROM ${repository.metadata.tableName}`);
  }

  protected async saveEntities<T>(entity: new () => T, data: any[]) {
    const repository = await this.getRepository(entity);
    const entities = repository.create(data);
    return await repository.save(entities);
  }

  protected generateId(): string {
    return randomUUID();
  }
}
