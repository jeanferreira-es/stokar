import {
  AfterInsert,
  AfterLoad,
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { numericTransformer } from '../utils/numeric';
import { ContractService } from './ContractService';
import { Customer } from './Customer';
import { ContractStatus } from './enums';

/** Contrato de prestação de serviços com um cliente (normalmente uma empresa). */
@Entity('contracts')
@Index(['customerId'])
export class Contract {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Número sequencial amigável; exposto como `code` (ex.: CT-000007) */
  @Column({ type: 'int', unique: true })
  @Generated('increment')
  number!: number;

  code?: string;

  @Column({ type: 'varchar', length: 160 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'enum', enum: ContractStatus, enumName: 'contract_status', default: ContractStatus.ACTIVE })
  status!: ContractStatus;

  @Column({ name: 'start_date', type: 'date' })
  startDate!: string;

  /** Vazio = prazo indeterminado */
  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate!: string | null;

  /** Mensalidade fixa, quando houver (informativo) */
  @Column({ name: 'monthly_value', type: 'numeric', precision: 14, scale: 2, nullable: true, transformer: numericTransformer })
  monthlyValue!: number | null;

  /** Desconto (%) sobre o valor padrão dos serviços sem preço negociado */
  @Column({ name: 'discount_percent', type: 'numeric', precision: 5, scale: 2, default: 0, transformer: numericTransformer })
  discountPercent!: number;

  @Column({ name: 'customer_id', type: 'uuid' })
  customerId!: string;

  @ManyToOne(() => Customer, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'customer_id' })
  customer?: Customer;

  /** Serviços com preço negociado neste contrato */
  @OneToMany(() => ContractService, (item) => item.contract, { cascade: ['insert'] })
  services?: ContractService[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @AfterLoad()
  @AfterInsert()
  setCode(): void {
    if (this.number != null) this.code = `CT-${String(this.number).padStart(6, '0')}`;
  }
}
