import PDFDocument from 'pdfkit';
import { env } from '../config/env';
import { Invoice, InvoiceLine, InvoiceParty, InvoiceStatus } from '../entities';

const COLORS = {
  brand: '#F26A0F',
  ink: '#1A0E03',
  text: '#181D23',
  muted: '#6E7A87',
  line: '#DDE1E5',
  soft: '#F4F5F7',
  danger: '#C0341F',
};

const MARGIN = 40;
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const quantity = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 });
const dateTime = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: env.APP_TIMEZONE });
const dateOnly = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeZone: env.APP_TIMEZONE });

export function formatDocument(document: string | null): string | null {
  if (!document) return null;
  if (document.length === 11) return document.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  if (document.length === 14) return document.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  return document;
}

/** Desenha a marca do Stokar (mesmos traços do stokar-logo.svg, viewBox 48x48). */
function drawLogo(doc: PDFKit.PDFDocument, x: number, y: number, size: number): void {
  doc.save();
  doc.translate(x, y).scale(size / 48);
  doc.roundedRect(0, 0, 48, 48, 13).fill(COLORS.brand);
  doc.lineWidth(5).lineJoin('round').path('M30 14.5H15.5V24h17v9.5H18').stroke(COLORS.ink);
  doc.path('M29 8.5l7 6-7 6z').fill(COLORS.ink);
  doc.path('M19 27.5l-7 6 7 6z').fill(COLORS.ink);
  doc.restore();
}

function partyBlock(doc: PDFKit.PDFDocument, title: string, party: InvoiceParty | null, x: number, y: number, width: number): number {
  doc.font('Helvetica-Bold').fontSize(8).fillColor(COLORS.muted).text(title.toUpperCase(), x, y, { width, characterSpacing: 0.6 });
  doc.moveDown(0.3);
  if (!party) {
    doc.font('Helvetica').fontSize(10).fillColor(COLORS.text).text('Cliente não identificado', { width });
    return doc.y;
  }
  doc.font('Helvetica-Bold').fontSize(11).fillColor(COLORS.text).text(party.name, { width });
  doc.font('Helvetica').fontSize(9).fillColor(COLORS.muted);
  const document = formatDocument(party.document);
  if (document) doc.text(`${party.document!.length === 14 ? 'CNPJ' : 'CPF'}: ${document}`, { width });
  if (party.address) doc.text(party.address, { width });
  const contact = [party.phone, party.email].filter(Boolean).join('  |  ');
  if (contact) doc.text(contact, { width });
  return doc.y;
}

/** Gera o PDF da nota de serviço em memória. */
/** Situação do pagamento no momento em que o PDF é gerado (não faz parte da cópia guardada na nota). */
export interface InvoicePayment {
  paidAt: Date | null;
  methodLabel: string | null;
  pixKey: string | null;
  instructions: string | null;
}

const dateFormat = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeZone: env.APP_TIMEZONE });

export function renderInvoicePdf(invoice: Invoice, payment?: InvoicePayment): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: MARGIN,
      bufferPages: true,
      info: { Title: `Nota de serviço ${invoice.code}`, Author: invoice.issuer.name, Creator: 'Stokar' },
    });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageWidth = doc.page.width;
    const contentWidth = pageWidth - MARGIN * 2;
    const right = pageWidth - MARGIN;
    const bottom = () => doc.page.height - MARGIN - 30;

    /* ---------- Cabeçalho ---------- */
    drawLogo(doc, MARGIN, MARGIN, 40);
    doc.font('Helvetica-Bold').fontSize(16).fillColor(COLORS.text).text(invoice.issuer.name, MARGIN + 52, MARGIN + 4, { width: 280 });
    doc.font('Helvetica').fontSize(9).fillColor(COLORS.muted).text('Nota de serviço', MARGIN + 52, doc.y + 1);

    doc.font('Helvetica-Bold').fontSize(18).fillColor(COLORS.brand).text(invoice.code ?? '', MARGIN, MARGIN + 2, { width: contentWidth, align: 'right' });
    doc.font('Helvetica').fontSize(9).fillColor(COLORS.muted).text(`Emitida em ${dateTime.format(new Date(invoice.issuedAt))}`, MARGIN, MARGIN + 24, { width: contentWidth, align: 'right' });

    let y = MARGIN + 58;
    doc.moveTo(MARGIN, y).lineTo(right, y).lineWidth(1).stroke(COLORS.line);
    y += 14;

    /* ---------- Prestador e cliente ---------- */
    const half = (contentWidth - 20) / 2;
    const leftEnd = partyBlock(doc, 'Prestador', invoice.issuer, MARGIN, y, half);
    const rightEnd = partyBlock(doc, 'Cliente', invoice.recipient, MARGIN + half + 20, y, half);
    y = Math.max(leftEnd, rightEnd) + 14;

    /* ---------- Referência ---------- */
    const ref = invoice.reference;
    const facts: Array<[string, string]> = [['Solicitação', `${ref.requestCode} — ${ref.title}`]];
    if (ref.vehicle) facts.push(['Veículo/equipamento', ref.vehicle]);
    if (ref.contractCode) facts.push(['Contrato', ref.contractCode]);
    if (ref.completedAt) facts.push(['Serviço concluído em', dateOnly.format(new Date(ref.completedAt))]);

    const boxTop = y;
    doc.font('Helvetica').fontSize(9);
    const factsHeight = facts.reduce((h, [, value]) => h + doc.heightOfString(value, { width: contentWidth - 150 }) + 4, 0);
    doc.roundedRect(MARGIN, boxTop, contentWidth, factsHeight + 16, 6).fill(COLORS.soft);
    y = boxTop + 10;
    for (const [label, value] of facts) {
      doc.font('Helvetica').fontSize(9).fillColor(COLORS.muted).text(label, MARGIN + 12, y, { width: 120 });
      doc.font('Helvetica-Bold').fillColor(COLORS.text).text(value, MARGIN + 138, y, { width: contentWidth - 150 });
      y = doc.y + 4;
    }
    y = boxTop + factsHeight + 16 + 18;

    /* ---------- Itens ---------- */
    const col = { desc: MARGIN, qty: MARGIN + contentWidth - 250, unit: MARGIN + contentWidth - 170, total: MARGIN + contentWidth - 85 };
    const tableHeader = (title: string) => {
      doc.font('Helvetica-Bold').fontSize(10).fillColor(COLORS.text).text(title, MARGIN, y);
      y = doc.y + 6;
      doc.font('Helvetica-Bold').fontSize(8).fillColor(COLORS.muted);
      doc.text('DESCRIÇÃO', col.desc, y, { width: col.qty - col.desc - 10 });
      doc.text('QTD.', col.qty, y, { width: 70, align: 'right' });
      doc.text('VALOR UNIT.', col.unit, y, { width: 75, align: 'right' });
      doc.text('TOTAL', col.total, y, { width: 85, align: 'right' });
      y += 14;
      doc.moveTo(MARGIN, y).lineTo(right, y).lineWidth(0.8).stroke(COLORS.line);
      y += 6;
    };
    const ensureSpace = (needed: number, title?: string) => {
      if (y + needed <= bottom()) return;
      doc.addPage();
      y = MARGIN;
      if (title) tableHeader(`${title} (continuação)`);
    };
    const table = (title: string, lines: InvoiceLine[], subtotal: number) => {
      if (lines.length === 0) return;
      ensureSpace(80);
      tableHeader(title);
      for (const line of lines) {
        doc.font('Helvetica').fontSize(9.5);
        const height = doc.heightOfString(line.description, { width: col.qty - col.desc - 10 });
        ensureSpace(height + 12, title);
        doc.font('Helvetica').fontSize(9.5).fillColor(COLORS.text);
        doc.text(line.description, col.desc, y, { width: col.qty - col.desc - 10 });
        doc.text(`${quantity.format(line.quantity)}${line.unit ? ` ${line.unit}` : ''}`, col.qty, y, { width: 70, align: 'right' });
        doc.text(currency.format(line.unitPrice), col.unit, y, { width: 75, align: 'right' });
        doc.text(currency.format(line.total), col.total, y, { width: 85, align: 'right' });
        y += height + 6;
        doc.moveTo(MARGIN, y).lineTo(right, y).lineWidth(0.5).stroke(COLORS.line);
        y += 6;
      }
      doc.font('Helvetica').fontSize(9).fillColor(COLORS.muted).text(`Subtotal de ${title.toLowerCase()}`, col.qty - 60, y, { width: 205, align: 'right' });
      doc.font('Helvetica-Bold').fillColor(COLORS.text).text(currency.format(subtotal), col.total, y, { width: 85, align: 'right' });
      y += 26;
    };

    table('Serviços', invoice.lines.filter((l) => l.kind === 'SERVICE'), invoice.servicesTotal);
    table('Peças e materiais', invoice.lines.filter((l) => l.kind === 'PART'), invoice.partsTotal);

    /* ---------- Totais ---------- */
    ensureSpace(90);
    const totalsX = right - 240;
    const totalRow = (label: string, value: string, bold = false) => {
      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(bold ? 12 : 9.5).fillColor(bold ? COLORS.text : COLORS.muted);
      doc.text(label, totalsX, y, { width: 130 });
      doc.fillColor(COLORS.text).text(value, totalsX + 130, y, { width: 110, align: 'right' });
      y += bold ? 20 : 15;
    };
    totalRow('Serviços', currency.format(invoice.servicesTotal));
    totalRow('Peças e materiais', currency.format(invoice.partsTotal));
    if (invoice.discount > 0) totalRow('Desconto', `- ${currency.format(invoice.discount)}`);
    y += 2;
    doc.moveTo(totalsX, y).lineTo(right, y).lineWidth(1).stroke(COLORS.text);
    y += 8;
    totalRow('Total', currency.format(invoice.total), true);

    /* ---------- Pagamento ---------- */
    if (payment && invoice.status !== InvoiceStatus.CANCELLED) {
      const lines: string[] = [];
      if (payment.paidAt) {
        lines.push(`Pago em ${dateFormat.format(payment.paidAt)}${payment.methodLabel ? ` (${payment.methodLabel})` : ''}.`);
      } else {
        lines.push('Pagamento pendente.');
        if (payment.pixKey) lines.push(`PIX — chave: ${payment.pixKey}`);
        if (payment.instructions) lines.push(payment.instructions);
      }
      const text = lines.join('\n');
      doc.font('Helvetica').fontSize(9);
      ensureSpace(doc.heightOfString(text, { width: contentWidth }) + 40);
      y += 10;
      doc.font('Helvetica-Bold').fontSize(8).fillColor(COLORS.muted).text('PAGAMENTO', MARGIN, y, { characterSpacing: 0.6 });
      doc.font('Helvetica').fontSize(9).fillColor(COLORS.text).text(text, MARGIN, doc.y + 4, { width: contentWidth });
      y = doc.y;
    }

    /* ---------- Observações ---------- */
    if (invoice.notes) {
      doc.font('Helvetica').fontSize(9);
      ensureSpace(doc.heightOfString(invoice.notes, { width: contentWidth }) + 40);
      y += 10;
      doc.font('Helvetica-Bold').fontSize(8).fillColor(COLORS.muted).text('OBSERVAÇÕES', MARGIN, y, { characterSpacing: 0.6 });
      doc.font('Helvetica').fontSize(9).fillColor(COLORS.text).text(invoice.notes, MARGIN, doc.y + 4, { width: contentWidth });
      y = doc.y;
    }

    /* ---------- Rodapé e marca de cancelamento em todas as páginas ---------- */
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i += 1) {
      doc.switchToPage(i);
      if (invoice.status === InvoiceStatus.CANCELLED) {
        doc.save();
        doc.rotate(-30, { origin: [pageWidth / 2, doc.page.height / 2] });
        doc.font('Helvetica-Bold').fontSize(90).fillColor(COLORS.danger).opacity(0.14);
        doc.text('CANCELADA', 0, doc.page.height / 2 - 50, { width: pageWidth, align: 'center', lineBreak: false });
        doc.restore();
      }
      const footerY = doc.page.height - MARGIN - 14;
      doc.font('Helvetica').fontSize(8).fillColor(COLORS.muted).opacity(1);
      doc.text('Documento sem valor fiscal. Não substitui a nota fiscal de serviço (NFS-e).', MARGIN, footerY, {
        width: contentWidth - 80,
        lineBreak: false,
      });
      doc.text(`Página ${i - range.start + 1} de ${range.count}`, right - 80, footerY, { width: 80, align: 'right', lineBreak: false });
    }

    doc.end();
  });
}
