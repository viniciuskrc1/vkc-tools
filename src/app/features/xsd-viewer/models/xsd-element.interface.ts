/**
 * Representa um elemento XSD com todas suas propriedades
 */
export interface XsdElement {
  name: string;
  type?: string;
  ref?: string; // Referência a outro elemento
  minOccurs?: number | string; // 'unbounded' ou número
  maxOccurs?: number | string; // 'unbounded' ou número
  nillable?: boolean;
  default?: string;
  fixed?: string;
  description?: string; // Annotation/documentation
  children?: XsdElement[];
  attributes?: XsdAttribute[];
  isComplexType?: boolean;
  isSimpleType?: boolean;
  complexType?: XsdComplexType;
  simpleType?: XsdSimpleType;
  compositorType?: 'sequence' | 'choice' | 'all'; // Tipo de compositor (sequence, choice, all)
  namespace?: string;
  qualified?: boolean; // form="qualified"
}

/**
 * Representa um atributo XSD
 */
export interface XsdAttribute {
  name: string;
  type?: string;
  use?: 'optional' | 'required' | 'prohibited';
  default?: string;
  fixed?: string;
  description?: string;
  namespace?: string;
}

/**
 * Representa um ComplexType XSD
 */
export interface XsdComplexType {
  name?: string;
  base?: string; // Extensão de outro tipo
  mixed?: boolean;
  abstract?: boolean;
  compositorType?: 'sequence' | 'choice' | 'all';
  children?: XsdElement[];
  attributes?: XsdAttribute[];
  description?: string;
}

/**
 * Representa um SimpleType XSD
 */
export interface XsdSimpleType {
  name?: string;
  base?: string;
  restriction?: XsdRestriction;
  union?: XsdUnion;
  list?: XsdList;
  description?: string;
}

/**
 * Restrição de tipo simples
 */
export interface XsdRestriction {
  base?: string;
  minInclusive?: string;
  maxInclusive?: string;
  minExclusive?: string;
  maxExclusive?: string;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  enumeration?: string[];
  whiteSpace?: 'preserve' | 'replace' | 'collapse';
  totalDigits?: number;
  fractionDigits?: number;
}

/**
 * Union de tipos
 */
export interface XsdUnion {
  memberTypes?: string[];
}

/**
 * Lista de tipos
 */
export interface XsdList {
  itemType?: string;
}

/**
 * Representa um schema XSD completo
 */
export interface XsdSchema {
  targetNamespace?: string;
  xmlns?: string;
  elementFormDefault?: 'qualified' | 'unqualified';
  attributeFormDefault?: 'qualified' | 'unqualified';
  elements: XsdElement[];
  complexTypes: XsdComplexType[];
  simpleTypes: XsdSimpleType[];
  imports: XsdImport[];
  includes: XsdInclude[];
}

/**
 * Import de outro schema
 */
export interface XsdImport {
  namespace?: string;
  schemaLocation?: string;
}

/**
 * Include de outro schema
 */
export interface XsdInclude {
  schemaLocation?: string;
}

