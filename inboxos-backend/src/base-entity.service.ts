import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';

@Injectable()
export abstract class BaseEntityService<T extends { id: string }, CreateDto, UpdateDto> {
  constructor(protected readonly repo: Repository<T>) {}

  abstract list(orderBy?: keyof T, order?: 'ASC' | 'DESC'): Promise<T[]>;

  abstract create(dto: CreateDto): Promise<T>;

  abstract update(id: string, dto: UpdateDto): Promise<T>;

  async remove(id: string) {
    const res = await this.repo.delete({ id } as any);
    if (res.affected === 0) throw new NotFoundException(`${this.repo.metadata.name} not found`);
    return { ok: true };
  }
}