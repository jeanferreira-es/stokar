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
import { Category } from './Category';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 60, unique: true })
  sku!: string;

  @Column({ type: 'varchar', length: 160 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  /** Unidade de medida: UN, CX, KG, L, M... */
  @Column({ type: 'varchar', length: 10, default: 'UN' })
  unit!: string;

  /** Saldo atual. Só é alterado pelas movimentações de estoque. */
  @Column({ type: 'numeric', precision: 14, scale: 3, default: 0, transformer: numericTransformer })
  quantity!: number;

  /** Estoque mínimo: ao atingir este valor é disparado o alerta de estoque baixo */
  @Column({ name: 'min_quantity', type: 'numeric', precision: 14, scale: 3, default: 0, transformer: numericTransformer })
  minQuantity!: number;

  /** Custo médio ponderado, recalculado a cada entrada com custo informado */
  @Column({ name: 'cost_price', type: 'numeric', precision: 14, scale: 4, default: 0, transformer: numericTransformer })
  costPrice!: number;

  /** Preço de venda sugerido quando a peça entra em um serviço */
  @Column({ name: 'sale_price', type: 'numeric', precision: 14, scale: 2, default: 0, transformer: numericTransformer })
  salePrice!: number;

  /** Endereço físico no almoxarifado (ex.: "Corredor B / Prateleira 3") */
  @Column({ type: 'varchar', length: 80, nullable: true })
  location!: string | null;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @Column({ name: 'category_id', type: 'uuid', nullable: true })
  categoryId!: string | null;

  @ManyToOne(() => Category, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'category_id' })
  category?: Category | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
