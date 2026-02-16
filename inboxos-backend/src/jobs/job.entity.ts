import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('jobs')
export class JobEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** classify | draft | extractDates  — extensible for workflows, calendar, etc. */
  @Column()
  type: string;

  /** queued → processing → done | failed */
  @Column({ default: 'queued' })
  status: string;

  /** Arbitrary JSON input for the processor (email data, options, etc.) */
  @Column({ type: 'jsonb', nullable: true })
  payload: Record<string, any> | null;

  /** JSON result when status = 'done' */
  @Column({ type: 'jsonb', nullable: true })
  result: Record<string, any> | null;

  /** Error message when status = 'failed' */
  @Column({ type: 'text', nullable: true })
  error: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
