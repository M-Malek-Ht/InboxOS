import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('emails')
export class EmailEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  from: string;

  @Column({ default: '' })
  to: string;

  @Column()
  subject: string;

  @Column({ default: '' })
  snippet: string;

  @Column({ type: 'text', default: '' })
  body: string;

  @Column({ default: false })
  isRead: boolean;

  @Column({ default: false })
  isSent: boolean;

  @Column({ default: false })
  isTrashed: boolean;

  // Switched from @CreateDateColumn so we can set the original provider date
  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  receivedAt: Date;

  // For Gmail/Microsoft emails cached locally: stores the provider's message ID
  // so we can call untrash/delete on the right remote message.
  @Column({ type: 'varchar', nullable: true, default: null })
  externalId: string | null;
}
