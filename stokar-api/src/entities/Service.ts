import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { numericTransformer } from '../utils/numeric';
import { ServiceType } from './ServiceType';

/** Serviço do catálogo, com o valor padrão (ex.: Trocar pneu, Realizar pintura). */
@Entity('services')
export class Service {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 160 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  /** Valor padrão; contratos podem definir outro valor para o mesmo serviço */
  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0, transformer: numericTransformer })
  price!: number;

  /** Duração estimada, em minutos */
  @Column({ name: 'estimated_minutes', type: 'int', nullable: true })
  estimatedMinutes!: number | null;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @Column({ name: 'service_type_id', type: 'uuid', nullable: true })
  serviceTypeId!: string | null;

  @ManyToOne(() => ServiceType, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'service_type_id' })
  serviceType?: ServiceType | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
