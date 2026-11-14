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
import { Contract } from './Contract';
import { Customer } from './Customer';
import { RequestOrigin, RequestPriority, RequestStatus } from './enums';
import { ServiceRequestItem } from './ServiceRequestItem';
import { ServiceRequestService } from './ServiceRequestService';
import { Vehicle } from './Vehicle';
import { User } from './User';

@Entity('service_requests')
@Index(['status'])
@Index(['customerId'])
export class ServiceRequest {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Número sequencial amigável; exposto como `code` (ex.: SS-000042) */
  @Column({ type: 'int', unique: true })
  @Generated('increment')
  number!: number;

  code?: string;

  @Column({ type: 'varchar', length: 160 })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'enum', enum: RequestPriority, enumName: 'request_priority', default: RequestPriority.MEDIUM })
  priority!: RequestPriority;

  @Column({ type: 'enum', enum: RequestStatus, enumName: 'request_status', default: RequestStatus.OPEN })
  status!: RequestStatus;

  /** Motivo da rejeição ou do cancelamento */
  @Column({ name: 'status_reason', type: 'text', nullable: true })
  statusReason!: string | null;

  @Column({ name: 'resolution_notes', type: 'text', nullable: true })
  resolutionNotes!: string | null;

  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate!: string | null;

  @Column({ name: 'requester_id', type: 'uuid' })
  requesterId!: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'requester_id' })
  requester?: User;

  @Column({ name: 'assignee_id', type: 'uuid', nullable: true })
  assigneeId!: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assignee_id' })
  assignee?: User | null;

  /** Cliente atendido (vazio nas solicitações internas do almoxarifado) */
  @Column({ name: 'customer_id', type: 'uuid', nullable: true })
  customerId!: string | null;

  @ManyToOne(() => Customer, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'customer_id' })
  customer?: Customer | null;

  /** Contrato que cobre o serviço: define os preços negociados */
  @Column({ name: 'contract_id', type: 'uuid', nullable: true })
  contractId!: string | null;

  @ManyToOne(() => Contract, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'contract_id' })
  contract?: Contract | null;

  @Column({ name: 'vehicle_id', type: 'uuid', nullable: true })
  vehicleId!: string | null;

  @ManyToOne(() => Vehicle, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle?: Vehicle | null;

  @Column({ type: 'varchar', length: 10, default: RequestOrigin.WEB })
  origin!: RequestOrigin;

  /** Desconto em reais aplicado sobre o total (serviços + peças) */
  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0, transformer: numericTransformer })
  discount!: number;

  /** Serviços do catálogo executados (mão de obra), com o valor cobrado */
  @OneToMany(() => ServiceRequestService, (line) => line.serviceRequest, { cascade: ['insert'] })
  services?: ServiceRequestService[];

  /** Materiais do estoque necessários; baixados automaticamente na conclusão */
  @OneToMany(() => ServiceRequestItem, (item) => item.serviceRequest, { cascade: ['insert'] })
  items?: ServiceRequestItem[];

  @Column({ name: 'approved_at', type: 'timestamptz', nullable: true })
  approvedAt!: Date | null;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt!: Date | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @AfterLoad()
  @AfterInsert()
  setCode(): void {
    if (this.number != null) this.code = `SS-${String(this.number).padStart(6, '0')}`;
  }
}
