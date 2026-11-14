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
  PrimaryGeneratedColumn,
} from 'typeorm';
import { numericTransformer } from '../utils/numeric';
import { Customer } from './Customer';
import { InvoiceStatus } from './enums';
import { ServiceRequest } from './ServiceRequest';
import { User } from './User';

export interface InvoiceLine {
  kind: 'SERVICE' | 'PART';
  description: string;
  quantity: number;
  unit: string | null;
  unitPrice: number;
  total: number;
}

export interface InvoiceParty {
  name: string;
  document: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
}

export interface InvoiceReference {
  requestCode: string;
  title: string;
  vehicle: string | null;
  contractCode: string | null;
  completedAt: string | null;
}

/**
 * Nota de serviço (documento não fiscal) emitida a partir de uma solicitação
 * concluída. Guarda uma cópia dos dados no momento da emissão, para que a nota
 * não mude se o cadastro do cliente ou os preços forem alterados depois.
 */
@Entity('invoices')
@Index(['customerId'])
@Index(['serviceRequestId'])
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Número sequencial; exposto como `code` (ex.: NS-000015) */
  @Column({ type: 'int', unique: true })
  @Generated('increment')
  number!: number;

  code?: string;

  @Column({ type: 'enum', enum: InvoiceStatus, enumName: 'invoice_status', default: InvoiceStatus.ISSUED })
  status!: InvoiceStatus;

  @Column({ name: 'service_request_id', type: 'uuid' })
  serviceRequestId!: string;

  @ManyToOne(() => ServiceRequest, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'service_request_id' })
  serviceRequest?: ServiceRequest;

  @Column({ name: 'customer_id', type: 'uuid', nullable: true })
  customerId!: string | null;

  @ManyToOne(() => Customer, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'customer_id' })
  customer?: Customer | null;

  /** Dados da oficina no momento da emissão */
  @Column({ type: 'jsonb' })
  issuer!: InvoiceParty;

  /** Dados do cliente no momento da emissão (null = cliente não identificado) */
  @Column({ type: 'jsonb', nullable: true })
  recipient!: InvoiceParty | null;

  /** Resumo do que foi atendido: código/título da solicitação, veículo, contrato */
  @Column({ type: 'jsonb' })
  reference!: InvoiceReference;

  @Column({ type: 'jsonb' })
  lines!: InvoiceLine[];

  @Column({ name: 'services_total', type: 'numeric', precision: 14, scale: 2, transformer: numericTransformer })
  servicesTotal!: number;

  @Column({ name: 'parts_total', type: 'numeric', precision: 14, scale: 2, transformer: numericTransformer })
  partsTotal!: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0, transformer: numericTransformer })
  discount!: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, transformer: numericTransformer })
  total!: number;

  /** Observações impressas na nota (garantia, forma de pagamento...) */
  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ name: 'issued_by_id', type: 'uuid', nullable: true })
  issuedById!: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'issued_by_id' })
  issuedBy?: User | null;

  @CreateDateColumn({ name: 'issued_at', type: 'timestamptz' })
  issuedAt!: Date;

  @Column({ name: 'cancelled_at', type: 'timestamptz', nullable: true })
  cancelledAt!: Date | null;

  @Column({ name: 'cancel_reason', type: 'text', nullable: true })
  cancelReason!: string | null;

  @AfterLoad()
  @AfterInsert()
  setCode(): void {
    if (this.number != null) this.code = `NS-${String(this.number).padStart(6, '0')}`;
  }
}
