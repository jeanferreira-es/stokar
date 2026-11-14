import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

/** Dados da oficina (registro único, id = 1). Aparecem no cabeçalho das notas e no aplicativo. */
@Entity('company_settings')
export class CompanySettings {
  @PrimaryColumn({ type: 'int' })
  id!: number;

  @Column({ type: 'varchar', length: 160 })
  name!: string;

  /** CNPJ ou CPF */
  @Column({ type: 'varchar', length: 20, nullable: true })
  document!: string | null;

  @Column({ type: 'varchar', length: 180, nullable: true })
  email!: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address!: string | null;

  /** Texto padrão no rodapé das notas (garantia, forma de pagamento...) */
  @Column({ name: 'invoice_footer', type: 'text', nullable: true })
  invoiceFooter!: string | null;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
