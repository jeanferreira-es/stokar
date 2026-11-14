import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Customer } from './Customer';

/** Veículo ou equipamento de um cliente que recebe os serviços. */
@Entity('vehicles')
@Index(['customerId'])
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'customer_id', type: 'uuid' })
  customerId!: string;

  @ManyToOne(() => Customer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer?: Customer;

  /** Placa (ou número de série, para equipamentos), em maiúsculas e sem separadores */
  @Column({ type: 'varchar', length: 20, nullable: true, unique: true })
  plate!: string | null;

  @Column({ type: 'varchar', length: 60, nullable: true })
  brand!: string | null;

  @Column({ type: 'varchar', length: 100 })
  model!: string;

  @Column({ type: 'int', nullable: true })
  year!: number | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  color!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
