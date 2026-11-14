import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Customer } from './Customer';
import { User } from './User';

/** Conversa entre um usuário do aplicativo e a equipe da oficina (uma por usuário). */
@Entity('conversations')
@Index(['lastMessageAt'])
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({ name: 'customer_id', type: 'uuid', nullable: true })
  customerId!: string | null;

  @ManyToOne(() => Customer, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'customer_id' })
  customer?: Customer | null;

  @Column({ name: 'last_message_at', type: 'timestamptz', nullable: true })
  lastMessageAt!: Date | null;

  @Column({ name: 'last_message_preview', type: 'varchar', length: 200, nullable: true })
  lastMessagePreview!: string | null;

  /** Mensagens do cliente ainda não lidas pela equipe */
  @Column({ name: 'unread_by_staff', type: 'int', default: 0 })
  unreadByStaff!: number;

  /** Mensagens da equipe ainda não lidas pelo cliente */
  @Column({ name: 'unread_by_client', type: 'int', default: 0 })
  unreadByClient!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
