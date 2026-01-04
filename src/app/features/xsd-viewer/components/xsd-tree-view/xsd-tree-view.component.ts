import { Component, Input, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { XsdSchema, XsdElement, XsdAttribute } from '../../models';

export interface XsdTreeNode {
  id: string;
  name: string;
  type: 'element' | 'attribute' | 'complexType' | 'simpleType' | 'root';
  node: XsdElement | XsdAttribute | any;
  expanded: boolean;
  level: number;
  children?: XsdTreeNode[];
  isRequired: boolean;
  isOptional: boolean;
  occurrences?: string; // "1..1", "0..1", "0..*", "1..*"
  compositorType?: 'sequence' | 'choice' | 'all';
  namespace?: string;
  description?: string;
}

@Component({
  selector: 'app-xsd-tree-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './xsd-tree-view.component.html',
  styleUrls: ['./xsd-tree-view.component.scss']
})
export class XsdTreeViewComponent implements OnChanges {
  @Input() schemas: XsdSchema[] = [];
  @Input() expanded: boolean = false;
  @Input() searchTerm: string = '';
  @Output() nodeSelected = new EventEmitter<XsdTreeNode>();

  public tree: XsdTreeNode[] = [];
  public filteredTree: XsdTreeNode[] = [];
  public selectedNode: XsdTreeNode | null = null;

  public ngOnChanges(changes: SimpleChanges): void {
    // Se os schemas mudaram, reconstruir a árvore
    if (changes['schemas']) {
      if (this.schemas && this.schemas.length > 0) {
        this.buildTree();
        this.applyFilters();
      } else {
        this.tree = [];
        this.filteredTree = [];
      }
    }

    // Se apenas o searchTerm mudou, apenas reaplicar filtros
    if (changes['searchTerm'] && this.tree.length > 0) {
      this.applyFilters();
    }

    // Se filteredTree não foi inicializado, inicializa
    if (this.filteredTree.length === 0 && this.tree.length > 0) {
      this.filteredTree = this.tree;
    }
  }

  private buildTree(): void {
    this.tree = [];

    this.schemas.forEach((schema, schemaIndex) => {
      schema.elements.forEach((element, index) => {
        const rootNode = this.createElementNode(element, 0, schema, `${schemaIndex}-${index}`);
        this.tree.push(rootNode);
      });
    });
  }

  private applyFilters(): void {
    if (!this.searchTerm || this.searchTerm.trim() === '') {
      this.filteredTree = this.tree;
      return;
    }

    const searchLower = this.searchTerm.toLowerCase().trim();
    this.filteredTree = this.tree
      .map(node => this.filterNode(node, searchLower))
      .filter(node => node !== null) as XsdTreeNode[];
  }

  private filterNode(node: XsdTreeNode, searchTerm: string): XsdTreeNode | null {
    const matches = node.name.toLowerCase().includes(searchTerm);

    if (matches) {
      // Se o nó corresponde, retorna o nó original com expanded true
      return { ...node, expanded: true };
    }

    // Verifica se algum filho corresponde
    if (node.children && node.children.length > 0) {
      const filteredChildren = node.children
        .map(child => this.filterNode(child, searchTerm))
        .filter(child => child !== null) as XsdTreeNode[];

      if (filteredChildren.length > 0) {
        // Retorna uma cópia mas mantém a referência original do node
        const filteredNode = { ...node, children: filteredChildren, expanded: true };
        return filteredNode;
      }
    }

    return null;
  }

  private createElementNode(
    element: XsdElement,
    level: number,
    schema: XsdSchema,
    id: string
  ): XsdTreeNode {
    const minOccurs = this.parseOccurs(element.minOccurs);
    const maxOccurs = this.parseOccurs(element.maxOccurs);
    const isRequired = minOccurs >= 1;
    const isOptional = minOccurs === 0;
    const occurrences = this.formatOccurrences(minOccurs, maxOccurs);

    const node: XsdTreeNode = {
      id,
      name: element.name,
      type: 'element',
      node: element,
      expanded: this.expanded,
      level,
      isRequired,
      isOptional,
      occurrences,
      compositorType: element.compositorType,
      namespace: schema.targetNamespace,
      description: element.description
    };

    // Adiciona filhos
    if (element.children && element.children.length > 0) {
      node.children = element.children.map((child, childIndex) =>
        this.createElementNode(child, level + 1, schema, `${id}-${childIndex}`)
      );
    }

    // Adiciona atributos
    if (element.attributes && element.attributes.length > 0) {
      const attributeNodes = element.attributes.map((attr, attrIndex) =>
        this.createAttributeNode(attr, level + 1, `${id}-attr-${attrIndex}`)
      );
      node.children = [...(node.children || []), ...attributeNodes];
    }

    return node;
  }

  private createAttributeNode(
    attribute: XsdAttribute,
    level: number,
    id: string
  ): XsdTreeNode {
    const isRequired = attribute.use === 'required';
    const isOptional = attribute.use !== 'required' && attribute.use !== 'prohibited';

    return {
      id,
      name: attribute.name,
      type: 'attribute',
      node: attribute,
      expanded: false,
      level,
      isRequired,
      isOptional,
      namespace: attribute.namespace,
      description: attribute.description
    };
  }

  private parseOccurs(occurs?: number | string): number {
    if (occurs === undefined || occurs === 'unbounded') {
      return Infinity;
    }
    return typeof occurs === 'string' ? parseInt(occurs, 10) : occurs;
  }

  private formatOccurrences(min: number, max: number): string {
    const minStr = min === Infinity ? '*' : min.toString();
    const maxStr = max === Infinity ? '*' : max.toString();
    return `${minStr}..${maxStr}`;
  }

  public toggle(node: XsdTreeNode): void {
    if (node.children && node.children.length > 0) {
      node.expanded = !node.expanded;
    }
  }

  public selectNode(node: XsdTreeNode, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    // Busca o nó original na árvore para manter a referência correta
    // Se estiver usando filteredTree, busca no tree original
    const originalNode = this.findNodeById(this.tree, node.id) || node;
    this.selectedNode = originalNode;
    // Emite o evento de forma síncrona
    this.nodeSelected.emit(originalNode);
  }

  // Wrapper para usar no template com evento
  public selectNodeWithEvent = (node: XsdTreeNode, event?: Event): void => {
    this.selectNode(node, event);
  }

  private findNodeById(nodes: XsdTreeNode[], id: string): XsdTreeNode | null {
    for (const node of nodes) {
      if (node.id === id) {
        return node;
      }
      if (node.children && node.children.length > 0) {
        const found = this.findNodeById(node.children, id);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }

  public isExpandable(node: XsdTreeNode): boolean {
    return node.children !== undefined && node.children.length > 0;
  }

  public getNodeIcon(node: XsdTreeNode): string {
    switch (node.type) {
      case 'element':
        return '📦';
      case 'attribute':
        return '🏷️';
      case 'complexType':
        return '🔷';
      case 'simpleType':
        return '🔹';
      default:
        return '📄';
    }
  }

  public getCompositorIcon(compositorType?: string): string {
    switch (compositorType) {
      case 'choice':
        return '⚡'; // Indica escolha
      case 'all':
        return '🔄'; // Indica todos
      case 'sequence':
        return '➡️'; // Indica sequência
      default:
        return '';
    }
  }
}
