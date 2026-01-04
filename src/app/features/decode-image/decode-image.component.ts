import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HelpModalComponent, IHelpItem } from '../../shared/ui/help-modal';

@Component({
  selector: 'app-decode-image',
  standalone: true,
  imports: [CommonModule, FormsModule, HelpModalComponent],
  templateUrl: './decode-image.component.html',
  styleUrls: ['./decode-image.component.scss']
})
export class DecodeImageComponent {
  public base64Input: string = '';
  public imagePreview: string | null = null;
  public errorMessage: string = '';
  public fileName: string = 'decoded-image';
  public showHelpModal: boolean = false;
  public helpItems: IHelpItem[] = [
    { text: 'Cole o código base64 da imagem no campo acima' },
    { text: 'O preview será exibido automaticamente' },
    { text: 'Clique em "Download da Imagem" para salvar' },
    { text: 'Suporta formatos: JPG, PNG, GIF, WEBP, BMP' }
  ];

  public onBase64Input(): void {
    this.errorMessage = '';
    this.imagePreview = null;

    if (!this.base64Input.trim()) {
      return;
    }

    this.decodeBase64();
  }

  public decodeBase64(): void {
    try {
      // Remove possíveis prefixos de data URL
      let base64Data = this.base64Input.trim();
      
      // Remove data:image/...;base64, se existir
      const base64Match = base64Data.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
      if (base64Match) {
        base64Data = base64Match[2];
        // Extrai a extensão do tipo de imagem
        const imageType = base64Match[1];
        this.fileName = `decoded-image.${imageType}`;
      } else {
        // Tenta detectar o tipo de imagem pelo conteúdo
        const imageType = this.detectImageType(base64Data);
        this.fileName = `decoded-image.${imageType}`;
      }

      // Valida se é base64 válido
      if (!this.isValidBase64(base64Data)) {
        this.errorMessage = 'Base64 inválido. Por favor, verifique o formato.';
        return;
      }

      // Cria a URL da imagem
      this.imagePreview = `data:image/${this.getImageTypeFromBase64(base64Data)};base64,${base64Data}`;
    } catch (error) {
      this.errorMessage = 'Erro ao decodificar a imagem. Verifique se o base64 está correto.';
      console.error('Erro ao decodificar base64:', error);
    }
  }

  public downloadImage(): void {
    if (!this.imagePreview) {
      return;
    }

    try {
      // Cria um link temporário para download
      const link = document.createElement('a');
      link.href = this.imagePreview;
      link.download = this.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      this.errorMessage = 'Erro ao fazer download da imagem.';
      console.error('Erro ao fazer download:', error);
    }
  }

  public clearInput(): void {
    this.base64Input = '';
    this.imagePreview = null;
    this.errorMessage = '';
    this.fileName = 'decoded-image';
  }

  private isValidBase64(str: string): boolean {
    try {
      // Remove espaços e quebras de linha
      const cleanStr = str.replace(/\s/g, '');
      // Verifica se contém apenas caracteres base64 válidos
      return /^[A-Za-z0-9+/]*={0,2}$/.test(cleanStr);
    } catch {
      return false;
    }
  }

  private detectImageType(base64: string): string {
    // Tenta detectar o tipo pela assinatura do base64
    const signatures: { [key: string]: string } = {
      '/9j/': 'jpg',
      'iVBORw0KGgo': 'png',
      'R0lGODlh': 'gif',
      'UklGR': 'webp',
      'Qk0=': 'bmp'
    };

    for (const [signature, type] of Object.entries(signatures)) {
      if (base64.startsWith(signature)) {
        return type;
      }
    }

    return 'png'; // Default
  }

  private getImageTypeFromBase64(base64: string): string {
    return this.detectImageType(base64);
  }

  public openHelpModal(): void {
    this.showHelpModal = true;
  }

  public closeHelpModal(): void {
    this.showHelpModal = false;
  }
}

