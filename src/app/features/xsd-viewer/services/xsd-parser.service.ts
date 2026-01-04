import { Injectable } from '@angular/core';
import { XsdSchema, XsdElement, XsdComplexType, XsdSimpleType, XsdAttribute, XsdImport, XsdInclude, XsdRestriction } from '../models';

@Injectable({
  providedIn: 'root'
})
export class XsdParserService {
  private schemaCache: Map<string, XsdSchema> = new Map();

  /**
   * Parseia um arquivo XSD
   */
  public async parseXsd(file: File): Promise<XsdSchema> {
    const text = await this.readFileAsText(file);
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, 'text/xml');

    // Verifica erros de parsing
    const parseError = xmlDoc.querySelector('parsererror');
    if (parseError) {
      throw new Error(`Erro ao parsear XSD: ${parseError.textContent}`);
    }

    const schemaElement = xmlDoc.documentElement;
    if (schemaElement.nodeName !== 'schema' && !schemaElement.nodeName.includes('schema')) {
      throw new Error('Arquivo não é um XSD válido');
    }

    const schema: XsdSchema = {
      targetNamespace: this.getAttribute(schemaElement, 'targetNamespace'),
      elementFormDefault: this.getAttribute(schemaElement, 'elementFormDefault') as 'qualified' | 'unqualified' | undefined,
      attributeFormDefault: this.getAttribute(schemaElement, 'attributeFormDefault') as 'qualified' | 'unqualified' | undefined,
      elements: [],
      complexTypes: [],
      simpleTypes: [],
      imports: [],
      includes: []
    };

    // Processa elementos filhos
    Array.from(schemaElement.children).forEach(child => {
      const nodeName = child.nodeName;
      const localName = nodeName.includes(':') ? nodeName.split(':')[1] : nodeName;

      switch (localName) {
        case 'element':
          const element = this.parseElement(child, schema);
          if (element) {
            schema.elements.push(element);
          }
          break;
        case 'complexType':
          const complexType = this.parseComplexType(child, schema);
          if (complexType) {
            schema.complexTypes.push(complexType);
          }
          break;
        case 'simpleType':
          const simpleType = this.parseSimpleType(child, schema);
          if (simpleType) {
            schema.simpleTypes.push(simpleType);
          }
          break;
        case 'import':
          schema.imports.push(this.parseImport(child));
          break;
        case 'include':
          schema.includes.push(this.parseInclude(child));
          break;
      }
    });

    // Cache do schema
    if (schema.targetNamespace) {
      this.schemaCache.set(schema.targetNamespace, schema);
    }

    return schema;
  }

  /**
   * Parseia múltiplos arquivos XSD e resolve referências
   */
  public async parseMultipleXsd(files: File[]): Promise<XsdSchema[]> {
    const schemas: XsdSchema[] = [];

    for (const file of files) {
      try {
        const schema = await this.parseXsd(file);
        schemas.push(schema);
      } catch (error) {
        console.error(`Erro ao parsear arquivo ${file.name}:`, error);
      }
    }

    // Resolve referências entre schemas
    this.resolveReferences(schemas);

    return schemas;
  }

  /**
   * Parseia um elemento XSD
   */
  private parseElement(elementNode: Element, schema: XsdSchema): XsdElement | null {
    const name = this.getAttribute(elementNode, 'name');
    const ref = this.getAttribute(elementNode, 'ref');

    if (!name && !ref) {
      return null;
    }

    const element: XsdElement = {
      name: name || ref || '',
      ref: ref || undefined,
      type: this.getAttribute(elementNode, 'type'),
      minOccurs: this.getAttribute(elementNode, 'minOccurs') || '1',
      maxOccurs: this.getAttribute(elementNode, 'maxOccurs') || '1',
      nillable: this.getAttribute(elementNode, 'nillable') === 'true',
      default: this.getAttribute(elementNode, 'default'),
      fixed: this.getAttribute(elementNode, 'fixed'),
      description: this.getAnnotation(elementNode),
      children: [],
      attributes: [],
      compositorType: 'sequence'
    };

    // Processa tipo complexo inline
    const complexTypeNode = elementNode.querySelector('complexType');
    if (complexTypeNode) {
      element.complexType = this.parseComplexType(complexTypeNode, schema);
      element.isComplexType = true;
      if (element.complexType) {
        element.children = element.complexType.children;
        element.attributes = element.complexType.attributes;
        element.compositorType = element.complexType.compositorType;
      }
    }

    // Processa tipo simples inline
    const simpleTypeNode = elementNode.querySelector('simpleType');
    if (simpleTypeNode) {
      element.simpleType = this.parseSimpleType(simpleTypeNode, schema);
      element.isSimpleType = true;
    }

    return element;
  }

  /**
   * Parseia um ComplexType
   */
  private parseComplexType(complexTypeNode: Element, schema: XsdSchema): XsdComplexType {
    const complexType: XsdComplexType = {
      name: this.getAttribute(complexTypeNode, 'name'),
      base: this.getAttribute(complexTypeNode.querySelector('extension, restriction') || complexTypeNode, 'base'),
      mixed: this.getAttribute(complexTypeNode, 'mixed') === 'true',
      abstract: this.getAttribute(complexTypeNode, 'abstract') === 'true',
      description: this.getAnnotation(complexTypeNode),
      children: [],
      attributes: [],
      compositorType: 'sequence'
    };

    // Detecta compositor (sequence, choice, all)
    let compositorNode = complexTypeNode.querySelector('sequence, choice, all');
    if (!compositorNode) {
      compositorNode = complexTypeNode;
    }

    const compositorType = compositorNode.nodeName.includes(':')
      ? compositorNode.nodeName.split(':')[1]
      : compositorNode.nodeName;

    complexType.compositorType = compositorType as 'sequence' | 'choice' | 'all';

    // Processa elementos filhos
    Array.from(compositorNode.children).forEach(child => {
      const localName = child.nodeName.includes(':') ? child.nodeName.split(':')[1] : child.nodeName;

      if (localName === 'element') {
        const childElement = this.parseElement(child, schema);
        if (childElement) {
          complexType.children = complexType.children || [];
          complexType.children.push(childElement);
        }
      } else if (localName === 'attribute') {
        const attr = this.parseAttribute(child);
        if (attr) {
          complexType.attributes = complexType.attributes || [];
          complexType.attributes.push(attr);
        }
      } else if (['sequence', 'choice', 'all'].includes(localName)) {
        // Compositor aninhado
        Array.from(child.children).forEach(grandChild => {
          if (grandChild.nodeName.includes('element')) {
            const childElement = this.parseElement(grandChild as Element, schema);
            if (childElement) {
              complexType.children = complexType.children || [];
              complexType.children.push(childElement);
            }
          }
        });
      }
    });

    // Processa atributos diretos no complexType
    Array.from(complexTypeNode.querySelectorAll('attribute')).forEach(attrNode => {
      const attr = this.parseAttribute(attrNode);
      if (attr) {
        complexType.attributes = complexType.attributes || [];
        complexType.attributes.push(attr);
      }
    });

    return complexType;
  }

  /**
   * Parseia um SimpleType
   */
  private parseSimpleType(simpleTypeNode: Element, schema: XsdSchema): XsdSimpleType {
    const simpleType: XsdSimpleType = {
      name: this.getAttribute(simpleTypeNode, 'name'),
      description: this.getAnnotation(simpleTypeNode)
    };

    const restrictionNode = simpleTypeNode.querySelector('restriction');
    const unionNode = simpleTypeNode.querySelector('union');
    const listNode = simpleTypeNode.querySelector('list');

    if (restrictionNode) {
      simpleType.restriction = this.parseRestriction(restrictionNode);
      simpleType.base = simpleType.restriction.base;
    } else if (unionNode) {
      simpleType.union = {
        memberTypes: this.getAttribute(unionNode, 'memberTypes')?.split(' ') || []
      };
    } else if (listNode) {
      simpleType.list = {
        itemType: this.getAttribute(listNode, 'itemType')
      };
    }

    return simpleType;
  }

  /**
   * Parseia uma restrição
   */
  private parseRestriction(restrictionNode: Element): XsdRestriction {
    const restriction: XsdRestriction = {
      base: this.getAttribute(restrictionNode, 'base')
    };

    Array.from(restrictionNode.children).forEach(child => {
      const localName = child.nodeName.includes(':') ? child.nodeName.split(':')[1] : child.nodeName;
      const value = child.getAttribute('value') || child.textContent || '';

      switch (localName) {
        case 'minInclusive':
        case 'maxInclusive':
        case 'minExclusive':
        case 'maxExclusive':
        case 'pattern':
        case 'whiteSpace':
          restriction[localName as keyof XsdRestriction] = value as any;
          break;
        case 'minLength':
        case 'maxLength':
        case 'totalDigits':
        case 'fractionDigits':
          (restriction as any)[localName] = parseInt(value, 10) || 0;
          break;
        case 'enumeration':
          if (!restriction.enumeration) {
            restriction.enumeration = [];
          }
          restriction.enumeration.push(value);
          break;
      }
    });

    return restriction;
  }

  /**
   * Parseia um atributo
   */
  private parseAttribute(attrNode: Element): XsdAttribute | null {
    const name = this.getAttribute(attrNode, 'name') || this.getAttribute(attrNode, 'ref');
    if (!name) {
      return null;
    }

    return {
      name,
      type: this.getAttribute(attrNode, 'type'),
      use: (this.getAttribute(attrNode, 'use') || 'optional') as 'optional' | 'required' | 'prohibited',
      default: this.getAttribute(attrNode, 'default'),
      fixed: this.getAttribute(attrNode, 'fixed'),
      description: this.getAnnotation(attrNode)
    };
  }

  /**
   * Parseia um import
   */
  private parseImport(importNode: Element): XsdImport {
    return {
      namespace: this.getAttribute(importNode, 'namespace'),
      schemaLocation: this.getAttribute(importNode, 'schemaLocation')
    };
  }

  /**
   * Parseia um include
   */
  private parseInclude(includeNode: Element): XsdInclude {
    return {
      schemaLocation: this.getAttribute(includeNode, 'schemaLocation')
    };
  }

  /**
   * Extrai annotation/documentation
   */
  private getAnnotation(element: Element): string | undefined {
    const annotation = element.querySelector('annotation');
    if (!annotation) {
      return undefined;
    }

    const documentation = annotation.querySelector('documentation');
    if (documentation) {
      return documentation.textContent?.trim() || undefined;
    }

    return annotation.textContent?.trim() || undefined;
  }

  /**
   * Obtém atributo do elemento
   */
  private getAttribute(element: Element, name: string): string | undefined {
    const value = element.getAttribute(name);
    return value || undefined;
  }

  /**
   * Lê arquivo como texto
   */
  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  /**
   * Resolve referências entre schemas
   */
  private resolveReferences(schemas: XsdSchema[]): void {
    // Armazena os schemas no cache
    schemas.forEach(schema => {
      if (schema.targetNamespace) {
        this.schemaCache.set(schema.targetNamespace, schema);
      }
    });

    // Resolve referências de tipos nos elementos
    schemas.forEach(schema => {
      schema.elements.forEach(element => {
        this.resolveElementType(element, schemas);
      });
    });
  }

  /**
   * Resolve o tipo de um elemento buscando nos complexTypes e simpleTypes
   */
  private resolveElementType(element: XsdElement, schemas: XsdSchema[]): void {
    if (!element.type) {
      return;
    }

    // Remove namespace do tipo se houver (tns:NomeTipo ou NomeTipo)
    const typeName = element.type.includes(':')
      ? element.type.split(':')[1]
      : element.type;

    // Busca o tipo em todos os schemas
    for (const schema of schemas) {
      // Busca em complexTypes
      const complexType = schema.complexTypes.find(ct => ct.name === typeName);
      if (complexType) {
        element.complexType = complexType;
        element.isComplexType = true;
        element.children = complexType.children || [];
        element.attributes = complexType.attributes || [];
        element.compositorType = complexType.compositorType || 'sequence';

        // Resolve recursivamente os filhos
        if (element.children) {
          element.children.forEach(child => {
            this.resolveElementType(child, schemas);
          });
        }
        return;
      }

      // Busca em simpleTypes
      const simpleType = schema.simpleTypes.find(st => st.name === typeName);
      if (simpleType) {
        element.simpleType = simpleType;
        element.isSimpleType = true;
        return;
      }
    }
  }
}

