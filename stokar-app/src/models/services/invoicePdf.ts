import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { Invoice } from '../types';
import { API_URL, ApiError, freshAccessToken } from './http';

/**
 * Baixa o PDF da nota (a rota exige o token no cabeçalho) para o cache do app
 * e abre a folha de compartilhamento do sistema, de onde o usuário visualiza,
 * salva ou envia o arquivo.
 */
export async function openInvoicePdf(invoice: Pick<Invoice, 'id' | 'code'>): Promise<void> {
  const token = await freshAccessToken();

  const folder = new Directory(Paths.cache, 'notas');
  if (!folder.exists) folder.create({ intermediates: true });
  const target = new File(folder, `nota-${invoice.code}.pdf`);
  if (target.exists) target.delete();

  let file: File;
  try {
    file = await File.downloadFileAsync(`${API_URL}/invoices/${invoice.id}/pdf`, target, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new ApiError(0, 'Não foi possível baixar a nota. Verifique a internet e tente de novo');
  }

  if (!(await Sharing.isAvailableAsync())) {
    throw new ApiError(0, 'Este aparelho não consegue abrir ou compartilhar arquivos');
  }
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle: `Nota ${invoice.code}`,
  });
}
