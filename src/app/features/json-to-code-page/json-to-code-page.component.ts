import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TextareaComponent, SelectComponent, SelectOption, InputComponent } from '../../shared/forms';
import { HelpModalComponent, IHelpItem } from '../../shared/ui/help-modal';
import { ModalService, IModalConfig } from '../../shared/ui/modal';
import { CodeLanguage } from './enums';
import { CodeGeneratorService } from './services';

@Component({
  selector: 'app-json-to-code-page',
  standalone: true,
  imports: [CommonModule, FormsModule, TextareaComponent, SelectComponent, InputComponent, HelpModalComponent],
  templateUrl: './json-to-code-page.component.html',
  styleUrls: ['./json-to-code-page.component.scss']
})
export class JsonToCodePageComponent {
  public jsonInput: string = '';
  public className: string = '';
  public classSuffix: string = '';
  public language: CodeLanguage = CodeLanguage.TypeScript;
  public generatedCode: string = '';
  public editedCode: string = '';
  public errorMessage: string = '';
  public statusMessage: string = '';
  public showHelpModal: boolean = false;
  public helpItems: IHelpItem[] = [
    { text: 'Selecione a linguagem desejada: TypeScript ou Java' },
    { text: 'Informe o nome da classe principal (ex: Product)' },
    { text: 'Opcional: Informe um sufixo para as classes (ex: Omie)' },
    { text: 'Cole o JSON no campo acima' },
    { text: 'O código será gerado automaticamente' },
    { text: 'Para TypeScript: Será gerada uma interface com prefixo "I" (ex: IProduct)' },
    { text: 'Para Java: Será gerada uma classe DTO com sufixo "Dto" (ex: ProductDto) usando Lombok' },
    { text: 'Todas as classes/interfaces aninhadas serão geradas automaticamente' },
    { text: 'Você pode editar o código gerado no preview' },
    { text: 'Use o botão "Copiar" para copiar o código para a área de transferência' },
    { text: 'Use o botão "Baixar" para salvar o código (único arquivo ou arquivos separados)' }
  ];

  public languageOptions: SelectOption[] = [
    { value: CodeLanguage.TypeScript, label: 'TypeScript' },
    { value: CodeLanguage.Java, label: 'Java' }
  ];

  private readonly codeGeneratorService = inject(CodeGeneratorService);
  private readonly modalService = inject(ModalService);

  public onJsonInput(): void {
    this.errorMessage = '';
    this.statusMessage = '';
    this.generateCode();
  }

  public onClassNameInput(): void {
    this.errorMessage = '';
    this.statusMessage = '';
    this.generateCode();
  }

  public onClassSuffixInput(): void {
    this.errorMessage = '';
    this.statusMessage = '';
    this.generateCode();
  }

  public onLanguageChange(): void {
    this.errorMessage = '';
    this.statusMessage = '';
    this.generateCode();
  }

  public onCodeEdit(): void {
    // Quando o usuário edita o código, não fazemos nada além de atualizar editedCode
  }

  public generateCode(): void {
    if (!this.jsonInput.trim()) {
      this.generatedCode = '';
      this.editedCode = '';
      return;
    }

    if (!this.className.trim()) {
      this.generatedCode = '';
      this.editedCode = '';
      return;
    }

    try {
      this.generatedCode = this.codeGeneratorService.generateCode(
        this.jsonInput,
        this.language,
        this.className,
        this.classSuffix
      );
      this.editedCode = this.generatedCode;
      this.errorMessage = '';
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao gerar código';
      this.errorMessage = errorMessage;
      this.generatedCode = '';
      this.editedCode = '';
    }
  }

  public async copyCode(): Promise<void> {
    const codeToCopy = this.editedCode || this.generatedCode;

    if (!codeToCopy) {
      this.statusMessage = 'Nada para copiar. Gere o código primeiro.';
      setTimeout(() => {
        this.statusMessage = '';
      }, 3000);
      return;
    }

    try {
      await navigator.clipboard.writeText(codeToCopy);
      this.statusMessage = 'Código copiado para a área de transferência!';
      setTimeout(() => {
        this.statusMessage = '';
      }, 3000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
      this.statusMessage = 'Erro ao copiar. Verifique se o navegador suporta a funcionalidade de cópia.';
      setTimeout(() => {
        this.statusMessage = '';
      }, 3000);
    }
  }

  public downloadCode(): void {
    const codeToDownload = this.editedCode || this.generatedCode;

    if (!codeToDownload) {
      this.statusMessage = 'Nada para baixar. Gere o código primeiro.';
      setTimeout(() => {
        this.statusMessage = '';
      }, 3000);
      return;
    }

    const config: IModalConfig = {
      modalTitle: 'Download',
      message: 'Deseja baixar os arquivos separados?',
      confirmText: 'Sim, separados',
      cancelText: 'Não, arquivo único',
      showCancel: true,
      onConfirm: () => this.downloadSeparatedFiles(),
      onCancel: () => this.downloadSingleFile()
    };

    this.modalService.show(config);
  }

  private downloadSingleFile(): void {
    const codeToDownload = this.editedCode || this.generatedCode;

    if (!codeToDownload) {
      return;
    }

    try {
      const extension = this.language === CodeLanguage.TypeScript ? 'ts' : 'java';
      const suffixPart = this.classSuffix ? this.capitalizeFirst(this.classSuffix) : '';
      const fileName = this.language === CodeLanguage.TypeScript
        ? `I${this.capitalizeFirst(this.className)}${suffixPart}.${extension}`
        : `${this.capitalizeFirst(this.className)}${suffixPart}Dto.${extension}`;

      const blob = new Blob([codeToDownload], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      this.statusMessage = 'Código baixado com sucesso!';
      setTimeout(() => {
        this.statusMessage = '';
      }, 3000);
    } catch (error) {
      this.statusMessage = 'Erro ao fazer download do código.';
      setTimeout(() => {
        this.statusMessage = '';
      }, 3000);
      console.error('Erro ao fazer download:', error);
    }
  }

  private downloadSeparatedFiles(): void {
    if (!this.jsonInput.trim() || !this.className.trim()) {
      return;
    }

    try {
      const classes = this.codeGeneratorService.generateClassesArray(
        this.jsonInput,
        this.language,
        this.className,
        this.classSuffix
      );

      if (classes.length === 0) {
        this.statusMessage = 'Nenhuma classe para baixar.';
        setTimeout(() => {
          this.statusMessage = '';
        }, 3000);
        return;
      }

      const extension = this.language === CodeLanguage.TypeScript ? 'ts' : 'java';
      classes.forEach((classData, index) => {
        setTimeout(() => {
          const fileName = `${classData.name}.${extension}`;
          const blob = new Blob([classData.code], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, index * 100); // Pequeno delay entre downloads
      });

      this.statusMessage = `${classes.length} arquivo(s) baixado(s) com sucesso!`;
      setTimeout(() => {
        this.statusMessage = '';
      }, 3000);
    } catch (error) {
      this.statusMessage = 'Erro ao fazer download dos arquivos.';
      setTimeout(() => {
        this.statusMessage = '';
      }, 3000);
      console.error('Erro ao fazer download:', error);
    }
  }

  public clearInput(): void {
    this.jsonInput = '';
    this.className = '';
    this.classSuffix = '';
    this.generatedCode = '';
    this.editedCode = '';
    this.errorMessage = '';
    this.statusMessage = '';
  }

  public openHelpModal(): void {
    this.showHelpModal = true;
  }

  public closeHelpModal(): void {
    this.showHelpModal = false;
  }

  private capitalizeFirst(str: string): string {
    if (!str) {
      return '';
    }
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

