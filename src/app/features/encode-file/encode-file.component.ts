import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HelpModalComponent, IHelpItem } from '../../shared/ui/help-modal';

@Component({
  selector: 'app-encode-file',
  standalone: true,
  imports: [CommonModule, HelpModalComponent],
  templateUrl: './encode-file.component.html',
  styleUrls: ['./encode-file.component.scss']
})
export class EncodeFileComponent {
  public base64Output: string = '';
  public fileName: string = '';
  public fileType: string = '';
  public isLoading: boolean = false;
  public errorMessage: string = '';
  public isCopied: boolean = false;
  public showHelpModal: boolean = false;
  public helpItems: IHelpItem[] = [
    { text: 'Selecione um arquivo clicando na área ou arrastando o arquivo' },
    { text: 'O arquivo será convertido automaticamente para base64' },
    { text: 'Clique em "Copiar" para copiar o base64 para a área de transferência' },
    { text: 'Suporta qualquer tipo de arquivo: imagens, PDFs, XMLs, etc.' }
  ];

  public onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    this.encodeFile(file);
  }

  public onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const file = event.dataTransfer?.files[0];
    if (file) {
      this.encodeFile(file);
    }
  }

  public onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  public onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  public encodeFile(file: File): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.base64Output = '';
    this.fileName = file.name;
    this.fileType = file.type || this.getFileTypeFromName(file.name);
    this.isCopied = false;

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const result = reader.result as string;
        // Mantém o prefixo completo data:...;base64,
        this.base64Output = result;
        this.isLoading = false;
      } catch (error) {
        this.errorMessage = 'Erro ao codificar o arquivo. Tente novamente.';
        this.isLoading = false;
        console.error('Erro ao codificar arquivo:', error);
      }
    };

    reader.onerror = () => {
      this.errorMessage = 'Erro ao ler o arquivo. Verifique se o arquivo está válido.';
      this.isLoading = false;
    };

    reader.readAsDataURL(file);
  }

  public copyToClipboard(): void {
    if (!this.base64Output) {
      return;
    }

    navigator.clipboard.writeText(this.base64Output).then(() => {
      this.isCopied = true;
      setTimeout(() => {
        this.isCopied = false;
      }, 2000);
    }).catch((error) => {
      this.errorMessage = 'Erro ao copiar para a área de transferência.';
      console.error('Erro ao copiar:', error);
    });
  }

  public clearOutput(): void {
    this.base64Output = '';
    this.fileName = '';
    this.fileType = '';
    this.errorMessage = '';
    this.isCopied = false;
    
    // Limpa o input file
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  private getFileTypeFromName(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    const mimeTypes: { [key: string]: string } = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'pdf': 'application/pdf',
      'xml': 'application/xml',
      'txt': 'text/plain',
      'json': 'application/json'
    };
    return mimeTypes[extension] || 'application/octet-stream';
  }

  public openHelpModal(): void {
    this.showHelpModal = true;
  }

  public closeHelpModal(): void {
    this.showHelpModal = false;
  }
}

