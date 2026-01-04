import { Injectable } from '@angular/core';
import {
  ACCESS_KEY_VARIATIONS,
  MIN_LINE_LENGTH,
  MAX_LINES_AFTER_KEY,
  MAX_LINES_COMBINED,
  EXPECTED_KEY_LENGTH,
  MIN_KEY_LENGTH,
  SAMPLE_TEXT_LENGTH,
  FORMATTED_KEY_PATTERN
} from '../constants';

@Injectable({
  providedIn: 'root'
})
export class AccessKeyExtractorService {
  public async extractAccessKey(file: File): Promise<string | null> {
    try {
      // Read file as ArrayBuffer
      const arrayBuffer = await this.readFileAsArrayBuffer(file);

      // Use pdfjs-dist to extract text
      const pdfjsLib = await import('pdfjs-dist');

      // Configure worker
      if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
      }

      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;

      let fullText = '';

      // Extract text from all pages
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
      }

      return this.extractKeyFromText(fullText);
    } catch (error) {
      console.error('Erro ao processar PDF:', error);
      throw error;
    }
  }

  private readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result instanceof ArrayBuffer) {
          resolve(e.target.result);
        } else {
          reject(new Error('Failed to read file as ArrayBuffer'));
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  private extractKeyFromText(text: string): string | null {
    this.logSampleText(text);

    const lines = text.split(/\r?\n/);
    const accessKeyLineIndex = this.findAccessKeyLine(lines);

    if (accessKeyLineIndex >= 0) {
      // Primeiro tenta encontrar na mesma linha onde encontrou "CHAVE DE ACESSO"
      const sameLineResult = this.extractKeyFromLine(lines[accessKeyLineIndex], accessKeyLineIndex);
      if (sameLineResult) {
        return sameLineResult;
      }

      // Depois tenta nas linhas seguintes
      const result = this.searchInLinesAfterKey(lines, accessKeyLineIndex);
      if (result) {
        return result;
      }
    }

    // Try to find "CHAVE DE ACESSO" with various variations in the full text
    for (const variation of ACCESS_KEY_VARIATIONS) {
      const pattern = new RegExp(
        `${this.escapeRegex(variation)}\\s*:?\\s*[^0-9]{0,200}?(\\d{44}\\s?\\d{4}|\\d{48})`,
        'i'
      );
      const match = text.match(pattern);
      if (match && match[1]) {
        const cleaned = this.cleanAccessKeyNumber(match[1]);
        if (cleaned && cleaned.length >= MIN_KEY_LENGTH) {
          console.log(`Chave encontrada usando variação: ${variation}`);
          return cleaned;
        }
      }
    }

    // Try other search patterns
    const result = this.searchWithPatterns(text);
    if (result) {
      return result;
    }

    console.log('Nenhuma chave encontrada no PDF');
    return null;
  }

  private logSampleText(text: string): void {
    if (text.length > 0) {
      const sample = text.length > SAMPLE_TEXT_LENGTH
        ? text.substring(0, SAMPLE_TEXT_LENGTH)
        : text;
      console.log('Amostra do texto extraído:', sample);
    }
  }

  private findAccessKeyLine(lines: string[]): number {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.toUpperCase().includes('CHAVE') && line.toUpperCase().includes('ACESSO')) {
        console.log(`Linha encontrada com 'CHAVE DE ACESSO' (índice ${i}): ${line}`);
        this.logNextLines(lines, i);
        return i;
      }
    }
    return -1;
  }

  private logNextLines(lines: string[], accessKeyLineIndex: number): void {
    console.log('Próximas 10 linhas após \'CHAVE DE ACESSO\':');
    for (let j = 1; j <= MAX_LINES_AFTER_KEY && (accessKeyLineIndex + j) < lines.length; j++) {
      console.log(`  [${accessKeyLineIndex + j}] ${lines[accessKeyLineIndex + j].trim()}`);
    }
  }

  private searchInLinesAfterKey(lines: string[], accessKeyLineIndex: number): string | null {
    // Search line by line
    for (let i = 1; i <= MAX_LINES_AFTER_KEY && (accessKeyLineIndex + i) < lines.length; i++) {
      const line = lines[accessKeyLineIndex + i].trim();

      if (line.length < MIN_LINE_LENGTH) {
        continue;
      }

      const result = this.extractKeyFromLine(line, accessKeyLineIndex + i);
      if (result) {
        return result;
      }
    }

    // Search in combined lines
    return this.searchInCombinedLines(lines, accessKeyLineIndex);
  }

  private extractKeyFromLine(line: string, lineNumber: number): string | null {
    // Se a linha contém "CHAVE DE ACESSO", procura a chave após esse texto
    const upperLine = line.toUpperCase();
    const chaveIndex = upperLine.indexOf('CHAVE');
    const acessoIndex = upperLine.indexOf('ACESSO');

    let searchStartIndex = 0;
    if (chaveIndex >= 0 && acessoIndex >= 0) {
      // Procura a partir do final de "ACESSO"
      searchStartIndex = Math.max(chaveIndex, acessoIndex) + 6;
    }

    // Primeiro tenta o padrão formatado (12 grupos de 4 dígitos com espaços)
    // Procura especificamente após "CHAVE DE ACESSO" se estiver na linha
    const lineAfterChave = searchStartIndex > 0 ? line.substring(searchStartIndex) : line;

    // Padrão formatado: 12 grupos de 4 dígitos separados por espaço
    const formattedPattern = /(\d{4}\s+\d{4}\s+\d{4}\s+\d{4}\s+\d{4}\s+\d{4}\s+\d{4}\s+\d{4}\s+\d{4}\s+\d{4}\s+\d{4}\s+\d{4})/;
    const formattedMatch = lineAfterChave.match(formattedPattern);
    if (formattedMatch) {
      const formatted = formattedMatch[1];
      const cleaned = formatted.replace(/\s+/g, '');
      if (cleaned.length === EXPECTED_KEY_LENGTH && cleaned.startsWith('3')) {
        console.log(`✓ Chave encontrada (formato formatado) na linha ${lineNumber}: ${line}`);
        console.log(`  Chave: ${cleaned}`);
        return cleaned;
      }
    }

    // Tenta padrão mais flexível: grupos de 4 dígitos com espaços variáveis
    const flexibleFormattedPattern = /(\d{4}[\s]+\d{4}[\s]+\d{4}[\s]+\d{4}[\s]+\d{4}[\s]+\d{4}[\s]+\d{4}[\s]+\d{4}[\s]+\d{4}[\s]+\d{4}[\s]+\d{4}[\s]+\d{4})/;
    const flexibleMatch = lineAfterChave.match(flexibleFormattedPattern);
    if (flexibleMatch) {
      const formatted = flexibleMatch[1];
      const cleaned = formatted.replace(/\s+/g, '');
      if (cleaned.length === EXPECTED_KEY_LENGTH && cleaned.startsWith('3')) {
        console.log(`✓ Chave encontrada (padrão flexível formatado) na linha ${lineNumber}: ${line}`);
        console.log(`  Chave: ${cleaned}`);
        return cleaned;
      }
    }

    // Se não encontrou formatado, procura por 48 dígitos consecutivos após "CHAVE DE ACESSO"
    const digitsAfterChave = lineAfterChave.replace(/[^\d]/g, '');
    if (digitsAfterChave.length >= EXPECTED_KEY_LENGTH) {
      // Pega os primeiros 48 dígitos após "CHAVE DE ACESSO"
      const key48 = digitsAfterChave.substring(0, EXPECTED_KEY_LENGTH);
      if (key48.startsWith('3')) {
        console.log(`✓ Chave encontrada (48 dígitos após CHAVE DE ACESSO) na linha ${lineNumber}: ${line}`);
        console.log(`  Chave: ${key48}`);
        return key48;
      }
    }

    // Fallback: procura em toda a linha por padrão formatado
    const allFormattedMatches = line.match(/(\d{4}\s+){11}\d{4}/g);
    if (allFormattedMatches && allFormattedMatches.length > 0) {
      // Prioriza chaves que começam com 3
      for (const match of allFormattedMatches) {
        const cleaned = match.replace(/\s+/g, '');
        if (cleaned.length === EXPECTED_KEY_LENGTH && cleaned.startsWith('3')) {
          console.log(`✓ Chave encontrada (formato formatado, começa com 3) na linha ${lineNumber}: ${line}`);
          console.log(`  Chave: ${cleaned}`);
          return cleaned;
        }
      }
      // Se não encontrou começando com 3, retorna a primeira válida
      for (const match of allFormattedMatches) {
        const cleaned = match.replace(/\s+/g, '');
        if (cleaned.length === EXPECTED_KEY_LENGTH) {
          console.log(`✓ Chave encontrada (formato formatado) na linha ${lineNumber}: ${line}`);
          console.log(`  Chave: ${cleaned}`);
          return cleaned;
        }
      }
    }

    // Último fallback: procura por 48 dígitos consecutivos que começam com 3
    const allDigits = line.replace(/[^\d]/g, '');
    if (allDigits.length >= EXPECTED_KEY_LENGTH) {
      // Procura por sequências de 48 dígitos que começam com 3
      for (let i = 0; i <= allDigits.length - EXPECTED_KEY_LENGTH; i++) {
        const candidate = allDigits.substring(i, i + EXPECTED_KEY_LENGTH);
        if (candidate.startsWith('3')) {
          console.log(`✓ Chave encontrada (48 dígitos começando com 3) na linha ${lineNumber}: ${line}`);
          console.log(`  Chave: ${candidate}`);
          return candidate;
        }
      }
    }

    return null;
  }

  private searchInCombinedLines(lines: string[], accessKeyLineIndex: number): string | null {
    const searchArea: string[] = [];
    for (let i = 1; i <= MAX_LINES_COMBINED && (accessKeyLineIndex + i) < lines.length; i++) {
      searchArea.push(lines[accessKeyLineIndex + i]);
    }

    const searchText = searchArea.join(' ');

    // Exact pattern: 12 groups of 4 digits
    const exactMatch = searchText.match(FORMATTED_KEY_PATTERN);
    if (exactMatch) {
      const found = exactMatch[0];
      const cleaned = found.replace(/\s+/g, '');
      if (cleaned.length === EXPECTED_KEY_LENGTH) {
        console.log('✓ Chave encontrada (padrão exato de 12 grupos)!');
        return cleaned;
      }
    }

    // Flexible search
    const normalizedSearch = searchText.replace(/[^0-9\s]/g, '');
    const flexiblePattern = /([\d\s]{50,100})/;
    const flexibleMatch = normalizedSearch.match(flexiblePattern);
    if (flexibleMatch) {
      const candidate = flexibleMatch[1];
      const digitsOnly = candidate.replace(/\s+/g, '');
      if (digitsOnly.length === EXPECTED_KEY_LENGTH) {
        console.log('✓ Chave encontrada (busca flexível)!');
        return digitsOnly;
      }
    }

    return null;
  }

  private searchWithPatterns(text: string): string | null {
    // Search with variations of "CHAVE DE ACESSO"
    for (const variation of ACCESS_KEY_VARIATIONS) {
      const pattern = new RegExp(
        `${this.escapeRegex(variation)}\\s*:?\\s*[^0-9]{0,200}?(\\d{44}\\s?\\d{4}|\\d{48})`,
        'i'
      );
      const match = text.match(pattern);
      if (match && match[1]) {
        const cleaned = this.cleanAccessKeyNumber(match[1]);
        if (cleaned && cleaned.length >= MIN_KEY_LENGTH) {
          console.log(`Chave encontrada usando variação: ${variation}`);
          return cleaned;
        }
      }
    }

    // Pattern for 48 consecutive digits
    const generic48Digits = /\b(\d{48})\b/;
    const genericMatch = text.match(generic48Digits);
    if (genericMatch && genericMatch[1]) {
      const cleaned = this.cleanAccessKeyNumber(genericMatch[1]);
      if (cleaned && cleaned.length === EXPECTED_KEY_LENGTH) {
        console.log('Chave encontrada usando padrão GENERIC_48_DIGITS');
        return cleaned;
      }
    }

    // Pattern for long numbers (44+ digits)
    const longNumberPattern = /(\d{44,})/;
    const longMatch = text.match(longNumberPattern);
    if (longMatch && longMatch[1] && longMatch[1].length >= MIN_KEY_LENGTH) {
      const cleaned = this.cleanAccessKeyNumber(longMatch[1]);
      if (cleaned && cleaned.length >= MIN_KEY_LENGTH) {
        if (cleaned.length > EXPECTED_KEY_LENGTH) {
          return cleaned.substring(0, EXPECTED_KEY_LENGTH);
        }
        console.log('Chave encontrada usando padrão de número longo');
        return cleaned;
      }
    }

    return null;
  }

  private cleanAccessKeyNumber(accessKey: string): string | null {
    const cleaned = accessKey.replace(/\s+/g, '').replace(/[^0-9]/g, '');

    if (cleaned.length === EXPECTED_KEY_LENGTH) {
      return cleaned;
    } else if (cleaned.length > EXPECTED_KEY_LENGTH) {
      return cleaned.substring(0, EXPECTED_KEY_LENGTH);
    } else if (cleaned.length >= MIN_KEY_LENGTH) {
      return cleaned;
    }

    return null;
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

