import { DraftsService } from './drafts.service';
export declare class AllDraftsController {
    private readonly drafts;
    constructor(drafts: DraftsService);
    listAll(req: any): Promise<import("./draft.entity").DraftEntity[]>;
}
