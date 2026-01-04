import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CpfGeneratorService } from './services/cpf-generator.service';

@Component({
  selector: 'app-cpf-generator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cpf-generator.component.html',
  styleUrls: ['./cpf-generator.component.scss']
})
export class CpfGeneratorComponent {
  public generatedCpf: string = '';
  public formattedCpf: string = '';

  private cpfGeneratorService = inject(CpfGeneratorService);

  public generateCpf(): void {
    this.generatedCpf = this.cpfGeneratorService.generateValidCpf();
    this.formattedCpf = this.cpfGeneratorService.formatCpf(this.generatedCpf);
  }

  public async copyCpf(): Promise<void> {
    if (!this.generatedCpf) {
      return;
    }

    try {
      await navigator.clipboard.writeText(this.formattedCpf);
    } catch (err) {
      console.error('Erro ao copiar:', err);
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = this.formattedCpf;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  }

  public copyUnformattedCpf(): void {
    if (!this.generatedCpf) {
      return;
    }

    navigator.clipboard.writeText(this.generatedCpf).catch(err => {
      console.error('Erro ao copiar:', err);
    });
  }
}

