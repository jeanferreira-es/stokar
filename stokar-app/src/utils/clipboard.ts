import * as Clipboard from 'expo-clipboard';

/** Copia o texto para a área de transferência. Devolve false se o aparelho recusar. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await Clipboard.setStringAsync(text);
    return true;
  } catch {
    return false;
  }
}
