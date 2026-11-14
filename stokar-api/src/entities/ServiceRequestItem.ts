import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { numericTransformer } from '../utils/numeric';
import { Product } from './Product';
import { ServiceRequest } from './ServiceRequest';

@Entity('service_request_items')
@Unique(['serviceRequestId', 'productId'])
export class ServiceRequestItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'service_request_id', type: 'uuid' })
  serviceRequestId!: string;

  @ManyToOne(() => ServiceRequest, (request) => request.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'service_request_id' })
  serviceRequest?: ServiceRequest;

  @Column({ name: 'product_id', type: 'uuid' })
  productId!: string;

  @ManyToOne(() => Product, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_id' })
  product?: Product;

  @Column({ type: 'numeric', precision: 14, scale: 3, transformer: numericTransformer })
  quantity!: number;

  /** Valor cobrado por unidade na nota de serviço */
  @Column({ name: 'unit_price', type: 'numeric', precision: 14, scale: 2, default: 0, transformer: numericTransformer })
  unitPrice!: number;
}
