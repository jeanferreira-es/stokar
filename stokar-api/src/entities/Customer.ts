import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { CustomerType } from './enums';

/** Cliente da oficina: pessoa física ou empresa (com ou sem contrato). */
@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'enum', enum: CustomerType, enumName: 'customer_type', default: CustomerType.PERSON })
  type!: CustomerType;

  /** Nome da pessoa ou razão social */
  @Column({ type: 'varchar', length: 160 })
  name!: string;

  /** Nome fantasia (empresas) */
  @Column({ name: 'trade_name', type: 'varchar', length: 160, nullable: true })
  tradeName!: string | null;

  /** CPF ou CNPJ, somente dígitos */
  @Column({ type: 'varchar', length: 20, nullable: true, unique: true })
  document!: string | null;

  @Column({ type: 'varchar', length: 180, nullable: true })
  email!: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address!: string | null;

  /** Anotações internas da oficina (não aparecem para o cliente) */
  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
