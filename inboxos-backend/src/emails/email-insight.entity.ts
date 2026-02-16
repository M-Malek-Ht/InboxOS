import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('email_insights')
@Index(['userId', 'emailId'], { unique: true })
export class EmailInsightEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  userId: string;

  @Column({ type: 'text' })
  emailId: string;

  @Column({ default: 'Other' })
  category: string;

  @Column({ default: 50 })
  priorityScore: number;

  @Column({ default: false })
  needsReply: boolean;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  tags: string[];

  @Column({ type: 'text', default: '' })
  summary: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
