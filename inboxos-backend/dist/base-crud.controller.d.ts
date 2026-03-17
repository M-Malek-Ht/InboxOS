import { BaseEntityService } from 'base-entity.service';
export declare abstract class BaseCrudController<T extends {
    id: string;
}, CreateDto, UpdateDto> {
    protected readonly service: BaseEntityService<T, CreateDto, UpdateDto>;
    constructor(service: BaseEntityService<T, CreateDto, UpdateDto>);
    abstract list(): any;
    create(dto: CreateDto): Promise<T>;
    update(id: string, dto: UpdateDto): Promise<T>;
    remove(id: string): Promise<{
        ok: boolean;
    }>;
}
