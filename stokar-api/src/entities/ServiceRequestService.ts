import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { numericTransformer } from '../utils/numeric';
import { Service } from './Service';
import { ServiceRequest } from './ServiceRequest';

/** Serviço (mão de obra) lançado em uma solicitação, com o valor cobrado. */
@Entity('service_request_services')
@Index(['serviceRequestId'])
export class ServiceRequestService {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'service_request_id', type: 'uuid' })
  serviceRequestId!: string;

  @ManyToOne(() => ServiceRequest, (request) => request.services, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'service_request_id' })
  serviceRequest?: ServiceRequest;

  /** Serviço do catálogo de origem (vazio para um serviço avulso digitado na hora) */
  @Column({ name: 'service_id', type: 'uuid', nullable: true })
  serviceId!: string | null;

  @ManyToOne(() => Service, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'service_id' })
  service?: Service | null;

  /** Nome do serviço no momento do lançamento (preservado se o catálogo mudar) */
  @Column({ type: 'varchar', length: 200 })
  description!: string;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 1, transformer: numericTransformer })
  quantity!: number;

  @Column({ name: 'unit_price', type: 'numeric', precision: 14, scale: 2, default: 0, transformer: numericTransformer })
  unitPrice!: number;
}
