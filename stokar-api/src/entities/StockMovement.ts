import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { numericTransformer } from '../utils/numeric';
import { MovementType } from './enums';
import { Product } from './Product';
import { ServiceRequest } from './ServiceRequest';
import { Supplier } from './Supplier';
import { User } from './User';

/** Registro imutável de cada entrada, saída ou ajuste de estoque. */
@Entity('stock_movements')
@Index(['productId', 'createdAt'])
export class StockMovement {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'enum', enum: MovementType, enumName: 'movement_type' })
  type!: MovementType;

  /** Quantidade movimentada (sempre positiva) */
  @Column({ type: 'numeric', precision: 14, scale: 3, transformer: numericTransformer })
  quantity!: number;

  @Column({ name: 'balance_before', type: 'numeric', precision: 14, scale: 3, transformer: numericTransformer })
  balanceBefore!: number;

  @Column({ name: 'balance_after', type: 'numeric', precision: 14, scale: 3, transformer: numericTransformer })
  balanceAfter!: number;

  @Column({ name: 'unit_cost', type: 'numeric', precision: 14, scale: 4, nullable: true, transformer: numericTransformer })
  unitCost!: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reason!: string | null;

  /** Nota fiscal, requisição ou outro documento de referência */
  @Column({ type: 'varchar', length: 60, nullable: true })
  document!: string | null;

  @Column({ name: 'product_id', type: 'uuid' })
  productId!: string;

  @ManyToOne(() => Product, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_id' })
  product?: Product;

  @Column({ name: 'supplier_id', type: 'uuid', nullable: true })
  supplierId!: string | null;

  @ManyToOne(() => Supplier, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'supplier_id' })
  supplier?: Supplier | null;

  @Column({ name: 'service_request_id', type: 'uuid', nullable: true })
  serviceRequestId!: string | null;

  @ManyToOne(() => ServiceRequest, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'service_request_id' })
  serviceRequest?: ServiceRequest | null;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
