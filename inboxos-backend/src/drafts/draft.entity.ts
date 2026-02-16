import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { EmailEntity } from '../emails/email.entity';

@Entity('drafts')
export class DraftEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  emailId: string;

  @ManyToOne(() => EmailEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'emailId' })
  email: EmailEntity;

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
