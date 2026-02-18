import { DraftsService } from './drafts.service';
export declare class AllDraftsController {
    private readonly drafts;
    constructor(drafts: DraftsService);
    listAll(): Promise<import("./draft.entity").DraftEntity[]>;
}
