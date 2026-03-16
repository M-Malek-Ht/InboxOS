import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskEntity } from './task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { BaseEntityService } from '../base-entity.service';

@Injectable()
export class TasksService extends BaseEntityService<TaskEntity, CreateTaskDto, UpdateTaskDto> {
  constructor(
    @InjectRepository(TaskEntity)
    repo: Repository<TaskEntity>,
  ) {
    super(repo);
  }

  list() {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async create(dto: CreateTaskDto) {
    const task = this.repo.create({
      title: dto.title,
      description: dto.description ?? '',
      status: dto.status ?? 'Backlog',
      priority: dto.priority ?? 'Med',
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
    });
    return this.repo.save(task);
  }

  async update(id: string, dto: UpdateTaskDto) {
    const task = await this.repo.findOne({ where: { id } });
    if (!task) throw new NotFoundException('Task not found');

    if (dto.title !== undefined) task.title = dto.title;
    if (dto.description !== undefined) task.description = dto.description;
    if (dto.status !== undefined) task.status = dto.status as any;
    if (dto.priority !== undefined) task.priority = dto.priority as any;
    if (dto.dueDate !== undefined) task.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;

    return this.repo.save(task);
  }
