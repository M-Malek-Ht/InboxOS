import { UsersService } from './users.service';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    findByEmail(email: string): Promise<import("./entities/user.entity").User | null>;
}
