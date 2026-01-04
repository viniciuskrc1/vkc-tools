export interface ITreeNode {
  key: string;
  value: any;
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  expanded: boolean;
  children?: ITreeNode[];
  level: number;
}

