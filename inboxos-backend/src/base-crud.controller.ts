import { Body, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BaseEntityService } from '../base-entity.service';

@UseGuards(JwtAuthGuard)
export abstract class BaseCrudController<T, CreateDto, UpdateDto> {
  constructor(protected readonly service: BaseEntityService<T, CreateDto, UpdateDto>) {}

  @Get()
  abstract list();

  @Post()
  create(@Body() dto: CreateDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}