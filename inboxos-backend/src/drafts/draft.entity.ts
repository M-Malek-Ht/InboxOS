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

  @Column({ default: 'draft' })
  status: 'draft' | 'sent';

  @CreateDateColumn()
  createdAt: Date;
}
