import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('emails')
export class EmailEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  from: string;

  @Column()
  subject: string;

  @Column({ default: '' })
  snippet: string;

  @Column({ type: 'text', default: '' })
  body: string;

  @CreateDateColumn()
  receivedAt: Date;
}
