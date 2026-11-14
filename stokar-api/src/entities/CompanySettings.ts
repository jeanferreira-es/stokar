import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { PixKeyType } from './enums';

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

  /* ---------- Pagamento ---------- */

  @Column({ name: 'pix_key_type', type: 'varchar', length: 10, nullable: true })
  pixKeyType!: PixKeyType | null;

  /** Chave PIX exibida no aplicativo e nas notas */
  @Column({ name: 'pix_key', type: 'varchar', length: 140, nullable: true })
  pixKey!: string | null;

  /** Cidade do recebedor: necessária para gerar o "PIX copia e cola" com o valor */
  @Column({ name: 'pix_city', type: 'varchar', length: 60, nullable: true })
  pixCity!: string | null;

  /** Orientações de pagamento para o cliente (outras formas, prazo, envio do comprovante...) */
  @Column({ name: 'payment_instructions', type: 'text', nullable: true })
  paymentInstructions!: string | null;

  /** Regra opcional: só deixa concluir o serviço depois de registrar o pagamento */
  @Column({ name: 'require_payment_to_complete', type: 'boolean', default: false })
  requirePaymentToComplete!: boolean;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
