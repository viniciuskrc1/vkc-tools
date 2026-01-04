import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ITreeNode } from '../../models';

@Component({
  selector: 'app-json-tree-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './json-tree-view.component.html',
  styleUrls: ['./json-tree-view.component.scss']
})
export class JsonTreeViewComponent implements OnChanges {
  @Input() json: any;
  @Input() expanded: boolean = true;

  public tree: ITreeNode[] = [];

  public ngOnChanges(): void {
    if (this.json !== undefined && this.json !== null) {
      this.tree = [this.buildTree('root', this.json, 0, this.expanded)];
    } else {
      this.tree = [];
    }
  }

  private buildTree(key: string, value: any, level: number, expanded: boolean): ITreeNode {
    const type = this.getType(value);
    const node: ITreeNode = {
      key,
      value,
      type,
      expanded,
      level
    };

    if (type === 'object' && value !== null) {
      node.children = Object.keys(value).map(k =>
        this.buildTree(k, value[k], level + 1, expanded)
      );
    } else if (type === 'array') {
      node.children = value.map((item: any, index: number) =>
        this.buildTree(index.toString(), item, level + 1, expanded)
      );
    }

    return node;
  }

  private getType(value: any): 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null' {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object') return 'object';
    return typeof value as 'string' | 'number' | 'boolean';
  }

  public toggle(node: ITreeNode): void {
    if (node.type === 'object' || node.type === 'array') {
      node.expanded = !node.expanded;
    }
  }

  public getValueDisplay(node: ITreeNode): string {
    if (node.type === 'string') {
      return `"${node.value}"`;
    }
    if (node.type === 'null') {
      return 'null';
    }
    if (node.type === 'array') {
      return `[${node.value.length}]`;
    }
    if (node.type === 'object') {
      const keys = Object.keys(node.value);
      return `{${keys.length}}`;
    }
    return String(node.value);
  }

  public isExpandable(node: ITreeNode): boolean {
    return node.type === 'object' || node.type === 'array';
  }

  public renderNodes(nodes: ITreeNode[] | undefined): ITreeNode[] {
    return nodes || [];
  }
}
