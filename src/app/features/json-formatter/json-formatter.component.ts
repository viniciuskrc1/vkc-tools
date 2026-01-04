import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TextareaComponent, SelectComponent, SelectOption, InputComponent } from '../../shared/forms';
import { HelpModalComponent, IHelpItem } from '../../shared/ui/help-modal';
import { JsonPathParser } from './components/json-tree-view/json-path-parser';
import { JsonTreeViewComponent } from './components/json-tree-view';

@Component({
  selector: 'app-json-formatter',
  standalone: true,
  imports: [CommonModule, FormsModule, TextareaComponent, SelectComponent, InputComponent, JsonTreeViewComponent, HelpModalComponent],
  templateUrl: './json-formatter.component.html',
  styleUrls: ['./json-formatter.component.scss']
})
export class JsonFormatterComponent {
  public jsonInput: string = '';
  public jsonPath: string = '';
  public formattedJson: string = '';
  public formattedJsonObject: any = null;
  public errorMessage: string = '';
  public statusMessage: string = '';
  public formatOption: 'format' | 'minify' = 'format';
  public viewMode: 'text' | 'tree' = 'text'; // Modo de visualização: texto ou árvore
  public formatOptions: SelectOption[] = [
    { value: 'format', label: 'Formatar (Beauty Format)' },
    { value: 'minify', label: 'Compactar (Minify)' }
  ];
  public showHelpModal: boolean = false;
  public helpItems: IHelpItem[] = [
    { text: 'Escolha a opção: Formatar (beauty format) ou Compactar (minify)' },
    { text: 'Cole o JSON no campo acima' },
    { text: 'Opcional: Use JSONPath para filtrar (ex: $.id, $.user.name, $.items[0])' },
    { text: 'No modo "Formatar", o JSON será exibido formatado em texto por padrão' },
    { text: 'Use o botão "Árvore" para alternar para visualização em formato de árvore (com botões de expandir/colapsar)' },
    { text: 'No modo "Compactar", o JSON será exibido em formato texto compactado' },
    { text: 'Use o botão "Copiar" para copiar o JSON processado' },
    { text: 'Use o botão "Baixar" para salvar como arquivo .json' }
  ];

  public onJsonInput(): void {
    this.errorMessage = '';
    this.statusMessage = '';
    this.formattedJson = '';
    this.formattedJsonObject = null;

    if (!this.jsonInput.trim()) {
      return;
    }

    this.processJson();
  }

  public onJsonPathInput(): void {
    if (this.jsonInput.trim()) {
      this.processJson();
    }
  }

  public onFormatOptionChange(): void {
    // Reseta para modo texto quando muda a opção
    this.viewMode = 'text';
    if (this.jsonInput.trim()) {
      this.processJson();
    }
  }

  public toggleViewMode(): void {
    this.viewMode = this.viewMode === 'text' ? 'tree' : 'text';
  }

  public processJson(): void {
    if (this.formatOption === 'format') {
      this.formatJson();
    } else {
      this.minifyJson();
    }
  }

  public formatJson(): void {
    try {
      // Remove espaços em branco no início e fim
      const trimmedInput = this.jsonInput.trim();

      // Tenta fazer o parse do JSON
      let parsedJson = JSON.parse(trimmedInput);

      // Aplica JSONPath se especificado
      if (this.jsonPath && this.jsonPath.trim()) {
        const filteredValue = JsonPathParser.apply(parsedJson, this.jsonPath.trim());
        if (filteredValue === null || filteredValue === undefined) {
          this.errorMessage = 'JSONPath não encontrou nenhum resultado.';
          this.formattedJson = '';
          this.formattedJsonObject = null;
          return;
        }
        parsedJson = filteredValue;
      }

      // Armazena o objeto parseado para uso no tree view
      this.formattedJsonObject = parsedJson;

      // Formata o JSON com indentação de 2 espaços
      this.formattedJson = JSON.stringify(parsedJson, null, 2);
      this.errorMessage = '';
    } catch (error) {
      this.errorMessage = 'JSON inválido. Por favor, verifique o formato.';
      this.formattedJson = '';
      this.formattedJsonObject = null;
      console.error('Erro ao formatar JSON:', error);
    }
  }

  public minifyJson(): void {
    try {
      // Remove espaços em branco no início e fim
      const trimmedInput = this.jsonInput.trim();

      // Tenta fazer o parse do JSON
      let parsedJson = JSON.parse(trimmedInput);

      // Aplica JSONPath se especificado
      if (this.jsonPath && this.jsonPath.trim()) {
        const filteredValue = JsonPathParser.apply(parsedJson, this.jsonPath.trim());
        if (filteredValue === null || filteredValue === undefined) {
          this.errorMessage = 'JSONPath não encontrou nenhum resultado.';
          this.formattedJson = '';
          this.formattedJsonObject = null;
          return;
        }
        parsedJson = filteredValue;
      }

      // Compacta o JSON removendo todos os espaços
      this.formattedJson = JSON.stringify(parsedJson);
      this.formattedJsonObject = parsedJson;
      this.errorMessage = '';
    } catch (error) {
      this.errorMessage = 'JSON inválido. Por favor, verifique o formato.';
      this.formattedJson = '';
      this.formattedJsonObject = null;
      console.error('Erro ao compactar JSON:', error);
    }
  }

  public async copyFormattedJson(): Promise<void> {
    if (!this.formattedJson) {
      this.statusMessage = 'Nada para copiar. Processe um JSON primeiro.';
      return;
    }

    try {
      await navigator.clipboard.writeText(this.formattedJson);
      const action = this.formatOption === 'format' ? 'formatado' : 'compactado';
      this.statusMessage = `JSON ${action} copiado para a área de transferência!`;
      setTimeout(() => {
        this.statusMessage = '';
      }, 3000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
      this.statusMessage = 'Erro ao copiar. Verifique se o navegador suporta a funcionalidade de cópia.';
    }
  }

  public downloadJson(): void {
    if (!this.formattedJson) {
      this.statusMessage = 'Nada para baixar. Processe um JSON primeiro.';
      return;
    }

    try {
      const blob = new Blob([this.formattedJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const fileName = this.formatOption === 'format' ? 'formatted.json' : 'minified.json';
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      const action = this.formatOption === 'format' ? 'formatado' : 'compactado';
      this.statusMessage = `JSON ${action} baixado com sucesso!`;
      setTimeout(() => {
        this.statusMessage = '';
      }, 3000);
    } catch (error) {
      this.statusMessage = 'Erro ao fazer download do JSON.';
      console.error('Erro ao fazer download:', error);
    }
  }

  public clearInput(): void {
    this.jsonInput = '';
    this.jsonPath = '';
    this.formattedJson = '';
    this.formattedJsonObject = null;
    this.errorMessage = '';
    this.statusMessage = '';
    this.viewMode = 'text';
  }

  public openHelpModal(): void {
    this.showHelpModal = true;
  }

  public closeHelpModal(): void {
    this.showHelpModal = false;
  }
}

