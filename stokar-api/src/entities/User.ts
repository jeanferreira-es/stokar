import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Customer } from './Customer';
import { UserRole } from './enums';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'varchar', length: 180, unique: true })
  email!: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 100, select: false })
  passwordHash!: string;

  @Column({ type: 'enum', enum: UserRole, enumName: 'user_role', default: UserRole.REQUESTER })
  role!: UserRole;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone!: string | null;

  /** Preenchido para o perfil CLIENT: o cliente (pessoa ou empresa) que este usuário representa */
  @Column({ name: 'customer_id', type: 'uuid', nullable: true })
  customerId!: string | null;

  @ManyToOne(() => Customer, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'customer_id' })
  customer?: Customer | null;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  /** Se o usuário quer receber as notificações também por e-mail */
  @Column({ name: 'email_notifications', type: 'boolean', default: true })
  emailNotifications!: boolean;

  /** Incrementado no logout/troca de senha para invalidar tokens antigos */
  @Column({ name: 'token_version', type: 'int', default: 0, select: false })
  tokenVersion!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
