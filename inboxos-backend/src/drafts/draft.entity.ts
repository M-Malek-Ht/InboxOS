import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('drafts')
export class DraftEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'text' })
  emailId: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ default: 1 })
  version: number;

  @Column({ default: 'Professional' })
  tone: string;

  @Column({ default: 'Medium' })
  length: string;

  @Column({ type: 'text', nullable: true })
  instruction: string | null;

  @Column({ default: 'draft' })
  status: 'draft' | 'sent';

  @CreateDateColumn()
  createdAt: Date;
}
