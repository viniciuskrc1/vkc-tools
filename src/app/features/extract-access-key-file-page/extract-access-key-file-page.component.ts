import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccessKeyExtractorService } from './services/access-key-extractor.service';

@Component({
  selector: 'app-extract-access-key-file-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './extract-access-key-file-page.component.html',
  styleUrls: ['./extract-access-key-file-page.component.scss']
})
export class ExtractAccessKeyFilePageComponent {
  public accessKeys: string[] = [];
  public selectedIndex: number = -1;
  public isProcessing: boolean = false;
  public isDragging: boolean = false;
  public statusMessage: string = 'Selecione os arquivos PDF ou arraste-os para cá';
  public progressMessage: string = '';

  private extractorService = inject(AccessKeyExtractorService);

  public async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const files = Array.from(input.files);
      await this.processFiles(files);
    }
  }

  public async onDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    if (event.dataTransfer?.files) {
      const files = Array.from(event.dataTransfer.files).filter(file =>
        file.name.toLowerCase().endsWith('.pdf')
      );

      if (files.length > 0) {
        await this.processFiles(files);
      } else {
        this.statusMessage = 'Nenhum arquivo PDF encontrado nos arquivos arrastados.';
      }
    }
  }

  public onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  public onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  public async processFiles(files: File[]): Promise<void> {
    this.isProcessing = true;
    this.accessKeys = [];
    this.selectedIndex = -1;
    this.statusMessage = 'Processando arquivos...';

    const extractedKeys: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      this.progressMessage = `Processando ${i + 1} de ${files.length}: ${file.name}`;

      try {
        const key = await this.extractorService.extractAccessKey(file);

        if (key && key.length > 0) {
          extractedKeys.push(key);
        }
      } catch (error) {
        console.error(`Erro ao processar ${file.name}:`, error);
      }
    }

    this.accessKeys = extractedKeys;
    this.isProcessing = false;
    this.progressMessage = '';

    if (extractedKeys.length === 0) {
      this.statusMessage = 'Nenhuma Chave de Acesso encontrada nos arquivos.';
    } else {
      this.statusMessage = `Processamento concluído! ${extractedKeys.length} chave(s) encontrada(s).`;
    }
  }

  public selectItem(index: number): void {
    this.selectedIndex = index;
  }

  public async copyKey(key: string, event?: Event): Promise<void> {
    if (event) {
      event.stopPropagation();
    }

    try {
      // Usa a API moderna do Clipboard (navigator.clipboard)
      await navigator.clipboard.writeText(key);
      this.statusMessage = 'Chave copiada para a área de transferência!';
    } catch (err) {
      console.error('Erro ao copiar:', err);
      this.statusMessage = 'Erro ao copiar. Verifique se o navegador suporta a funcionalidade de cópia.';
    }
  }

  public async copyAll(): Promise<void> {
    if (this.accessKeys.length === 0) {
      this.statusMessage = 'Nenhuma chave para copiar';
      return;
    }

    const allKeys = this.accessKeys.join('\n');
    await this.copyKey(allKeys);
    this.statusMessage = 'Todas as chaves copiadas para a área de transferência!';
  }

  public onKeyDown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key === 'c' && this.selectedIndex >= 0) {
      event.preventDefault();
      if (this.accessKeys[this.selectedIndex]) {
        this.copyKey(this.accessKeys[this.selectedIndex]);
      }
    }
  }
}

