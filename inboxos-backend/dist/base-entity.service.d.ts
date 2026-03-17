import { Repository } from 'typeorm';
export declare abstract class BaseEntityService<T extends {
    id: string;
}, CreateDto, UpdateDto> {
    protected readonly repo: Repository<T>;
    constructor(repo: Repository<T>);
    abstract list(orderBy?: keyof T, order?: 'ASC' | 'DESC'): Promise<T[]>;
    abstract create(dto: CreateDto): Promise<T>;
    abstract update(id: string, dto: UpdateDto): Promise<T>;
    remove(id: string): Promise<{
        ok: boolean;
    }>;
}
