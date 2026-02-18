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
exports.EventsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const event_entity_1 = require("./event.entity");
let EventsService = class EventsService {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
    list(from, to) {
        return this.repo.find({ order: { startAt: 'ASC' } });
    }
    async create(dto) {
        const event = this.repo.create({
            title: dto.title,
            startAt: new Date(dto.startAt),
            endAt: new Date(dto.endAt),
            location: dto.location ?? '',
            notes: dto.notes ?? '',
        });
        return this.repo.save(event);
    }
    async update(id, dto) {
        const event = await this.repo.findOne({ where: { id } });
        if (!event)
            throw new common_1.NotFoundException('Event not found');
        if (dto.title !== undefined)
            event.title = dto.title;
        if (dto.startAt !== undefined)
            event.startAt = new Date(dto.startAt);
        if (dto.endAt !== undefined)
            event.endAt = new Date(dto.endAt);
        if (dto.location !== undefined)
            event.location = dto.location ?? '';
        if (dto.notes !== undefined)
            event.notes = dto.notes ?? '';
        return this.repo.save(event);
    }
    async remove(id) {
        const res = await this.repo.delete({ id });
        if (res.affected === 0)
            throw new common_1.NotFoundException('Event not found');
        return { ok: true };
    }
};
exports.EventsService = EventsService;
exports.EventsService = EventsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(event_entity_1.EventEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], EventsService);
//# sourceMappingURL=events.service.js.map