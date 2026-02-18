"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TasksService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const task_entity_1 = require("./task.entity");
let TasksService = class TasksService {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
    list() {
        return this.repo.find({ order: { createdAt: 'DESC' } });
    }
    async create(dto) {
        const task = this.repo.create({
            title: dto.title,
            description: dto.description ?? '',
            status: dto.status ?? 'todo',
            priority: dto.priority ?? 'medium',
            dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        });
        return this.repo.save(task);
    }
    async update(id, dto) {
        const task = await this.repo.findOne({ where: { id } });
        if (!task)
            throw new common_1.NotFoundException('Task not found');
        if (dto.title !== undefined)
            task.title = dto.title;
        if (dto.description !== undefined)
            task.description = dto.description;
        if (dto.status !== undefined)
            task.status = dto.status;
        if (dto.priority !== undefined)
            task.priority = dto.priority;
        if (dto.dueDate !== undefined)
            task.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
        return this.repo.save(task);
    }
    async remove(id) {
        const res = await this.repo.delete({ id });
        if (res.affected === 0)
            throw new common_1.NotFoundException('Task not found');
        return { ok: true };
    }
};
exports.TasksService = TasksService;
exports.TasksService = TasksService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(task_entity_1.TaskEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], TasksService);
//# sourceMappingURL=tasks.service.js.map