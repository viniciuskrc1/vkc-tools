import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FileSelectorComponent, InputComponent } from '../../shared/forms';
import { XsdParserService } from './services';
import { XsdTreeViewComponent, XsdTreeNode } from './components/xsd-tree-view';
import { XsdSchema, XsdElement, XsdAttribute } from './models';

@Component({
  selector: 'app-xsd-viewer',
  standalone: true,
  imports: [CommonModule, FormsModule, FileSelectorComponent, InputComponent, XsdTreeViewComponent],
  templateUrl: './xsd-viewer.component.html',
  styleUrls: ['./xsd-viewer.component.scss']
})
export class XsdViewerComponent {
  public xsdFiles: File[] = [];
  public isProcessing: boolean = false;
  public errorMessage: string = '';
  public schemas: XsdSchema[] = [];
  public selectedNode: XsdTreeNode | null = null;
  public searchTerm: string = '';
  public showOnlyRequired: boolean = false;

  private xsdParserService = inject(XsdParserService);

  public onFileListSelected(fileList: FileList): void {
    this.xsdFiles = Array.from(fileList);
    this.errorMessage = '';
    this.processXsdFiles();
  }

  private async processXsdFiles(): Promise<void> {
    if (this.xsdFiles.length === 0) {
      this.schemas = [];
      return;
    }

    this.isProcessing = true;
    this.errorMessage = '';
    this.selectedNode = null;

    try {
      this.schemas = await this.xsdParserService.parseMultipleXsd(this.xsdFiles);
      console.log('Schemas parseados:', this.schemas);
    } catch (error) {
      this.errorMessage = 'Erro ao processar arquivos XSD. Verifique se os arquivos são válidos.';
      console.error('Erro:', error);
      this.schemas = [];
    } finally {
      this.isProcessing = false;
    }
  }

  public onNodeSelected(node: XsdTreeNode): void {
    // Atualiza o nó selecionado
    this.selectedNode = node;
  }

  public clearSelection(): void {
    this.selectedNode = null;
  }

  public getNodeDetails(): any {
    if (!this.selectedNode) {
      return null;
    }

    const node = this.selectedNode.node;
    const nodeData = node as XsdElement | XsdAttribute;

    return {
      ...nodeData,
      name: this.selectedNode.name,
      type: this.selectedNode.type,
      isRequired: this.selectedNode.isRequired,
      isOptional: this.selectedNode.isOptional,
      occurrences: this.selectedNode.occurrences,
      compositorType: this.selectedNode.compositorType,
      namespace: this.selectedNode.namespace,
      description: this.selectedNode.description || nodeData.description
    };
  }
}
