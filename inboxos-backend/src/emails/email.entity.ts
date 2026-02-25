import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

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

  @CreateDateColumn()
  receivedAt: Date;
}
