export declare class CreateDraftDto {
    content?: string;
    tone?: string;
    length?: string;
    instruction?: string;
    status?: 'draft' | 'sent';
    emailFrom?: string;
    emailSubject?: string;
    emailBody?: string;
}
