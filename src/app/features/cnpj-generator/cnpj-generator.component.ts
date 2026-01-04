import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CnpjGeneratorService } from './services/cnpj-generator.service';

@Component({
  selector: 'app-cnpj-generator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cnpj-generator.component.html',
  styleUrls: ['./cnpj-generator.component.scss']
})
export class CnpjGeneratorComponent {
  public generatedCnpj: string = '';
  public formattedCnpj: string = '';

  private cnpjGeneratorService = inject(CnpjGeneratorService);

  public generateCnpj(): void {
    this.generatedCnpj = this.cnpjGeneratorService.generateValidCnpj();
    this.formattedCnpj = this.cnpjGeneratorService.formatCnpj(this.generatedCnpj);
  }

  public async copyCnpj(): Promise<void> {
    if (!this.generatedCnpj) {
      return;
    }

    try {
      await navigator.clipboard.writeText(this.formattedCnpj);
    } catch (err) {
      console.error('Erro ao copiar:', err);
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = this.formattedCnpj;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  }

  public copyUnformattedCnpj(): void {
    if (!this.generatedCnpj) {
      return;
    }

    navigator.clipboard.writeText(this.generatedCnpj).catch(err => {
      console.error('Erro ao copiar:', err);
    });
  }
}

