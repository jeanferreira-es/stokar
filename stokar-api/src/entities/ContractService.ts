import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { numericTransformer } from '../utils/numeric';
import { Contract } from './Contract';
import { Service } from './Service';

/** Preço negociado de um serviço dentro de um contrato. */
@Entity('contract_services')
@Unique(['contractId', 'serviceId'])
export class ContractService {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'contract_id', type: 'uuid' })
  contractId!: string;

  @ManyToOne(() => Contract, (contract) => contract.services, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contract_id' })
  contract?: Contract;

  @Column({ name: 'service_id', type: 'uuid' })
  serviceId!: string;

  @ManyToOne(() => Service, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'service_id' })
  service?: Service;

  @Column({ type: 'numeric', precision: 14, scale: 2, transformer: numericTransformer })
  price!: number;
}
