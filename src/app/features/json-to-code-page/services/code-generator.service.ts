import { Injectable } from '@angular/core';
import { CodeLanguage } from '../enums';

interface ClassInfo {
  name: string;
  properties: Array<{ name: string; originalName: string; type: string; isComplexType: boolean }>;
  dependencies: Set<string>;
}

@Injectable({
  providedIn: 'root'
})
export class CodeGeneratorService {
  private classRegistry: Map<string, ClassInfo> = new Map();

  public generateCode(jsonString: string, language: CodeLanguage, className: string, classSuffix: string = ''): string {
    if (!jsonString || !className) {
      return '';
    }

    try {
      const jsonObject = JSON.parse(jsonString);
      this.classRegistry.clear();

      if (language === CodeLanguage.TypeScript) {
        return this.generateTypeScriptInterfaces(jsonObject, className, classSuffix);
      } else if (language === CodeLanguage.Java) {
        return this.generateJavaClasses(jsonObject, className, classSuffix);
      }

      return '';
    } catch (error) {
      throw new Error('JSON inválido. Por favor, verifique o formato.');
    }
  }

  public generateClassesArray(jsonString: string, language: CodeLanguage, className: string, classSuffix: string = ''): Array<{ name: string; code: string }> {
    if (!jsonString || !className) {
      return [];
    }

    try {
      const jsonObject = JSON.parse(jsonString);
      this.classRegistry.clear();

      const orderedClasses = language === CodeLanguage.TypeScript
        ? this.processAndGetClassesForTypeScript(jsonObject, className, classSuffix)
        : this.processAndGetClassesForJava(jsonObject, className, classSuffix);

      const classes: Array<{ name: string; code: string }> = [];
      orderedClasses.forEach(classInfo => {
        const code = language === CodeLanguage.TypeScript
          ? this.generateTypeScriptInterface(classInfo)
          : this.generateJavaClass(classInfo);
        classes.push({ name: classInfo.name, code });
      });

      return classes;
    } catch (error) {
      throw new Error('JSON inválido. Por favor, verifique o formato.');
    }
  }

  private processAndGetClassesForTypeScript(obj: any, className: string, suffix: string): ClassInfo[] {
    const suffixPart = suffix ? this.capitalizeFirst(suffix) : '';
    const rootInterfaceName = `I${this.capitalizeFirst(className)}${suffixPart}`;
    this.processObjectForTypeScript(obj, rootInterfaceName, '', suffix);
    return this.getOrderedClasses();
  }

  private processAndGetClassesForJava(obj: any, className: string, suffix: string): ClassInfo[] {
    const suffixPart = suffix ? this.capitalizeFirst(suffix) : '';
    const rootClassName = `${this.capitalizeFirst(className)}${suffixPart}Dto`;
    this.processObjectForJava(obj, rootClassName, '', suffix);
    return this.getOrderedClasses();
  }

  private generateTypeScriptInterfaces(obj: any, className: string, suffix: string): string {
    const suffixPart = suffix ? this.capitalizeFirst(suffix) : '';
    const rootInterfaceName = `I${this.capitalizeFirst(className)}${suffixPart}`;

    // Processa o objeto raiz e identifica todas as classes necessárias
    this.processObjectForTypeScript(obj, rootInterfaceName, '', suffix);

    // Ordena as interfaces por dependências
    const orderedClasses = this.getOrderedClasses();

    // Gera todas as interfaces
    const interfaces: string[] = [];
    orderedClasses.forEach(classInfo => {
      interfaces.push(this.generateTypeScriptInterface(classInfo));
    });

    return interfaces.join('\n\n');
  }

  private generateJavaClasses(obj: any, className: string, suffix: string): string {
    const suffixPart = suffix ? this.capitalizeFirst(suffix) : '';
    const rootClassName = `${this.capitalizeFirst(className)}${suffixPart}Dto`;

    // Processa o objeto raiz e identifica todas as classes necessárias
    this.processObjectForJava(obj, rootClassName, '', suffix);

    // Ordena as classes por dependências
    const orderedClasses = this.getOrderedClasses();

    // Gera todas as classes
    const classes: string[] = [];
    orderedClasses.forEach(classInfo => {
      classes.push(this.generateJavaClass(classInfo));
    });

    return classes.join('\n\n');
  }

  private processObjectForTypeScript(obj: any, className: string, propertyKey: string, suffix: string = ''): string {
    if (obj === null || obj === undefined) {
      return 'any';
    }

    if (Array.isArray(obj)) {
      if (obj.length > 0) {
        // Usa o nome da propriedade para gerar o nome da classe do item
        const suffixPart = suffix ? this.capitalizeFirst(suffix) : '';
        const itemClassName = propertyKey ? `I${this.capitalizeFirst(propertyKey)}${suffixPart}` : `${className}Item`;
        const itemType = this.processObjectForTypeScript(obj[0], itemClassName, '', suffix);
        return `${itemType}[]`;
      }
      return 'any[]';
    }

    if (typeof obj === 'object') {
      // Garante que o nome da classe tenha "I" no início para TypeScript
      const interfaceName = className.startsWith('I') ? className : `I${className}`;

      // Se já existe uma interface para este objeto, reutiliza
      if (this.classRegistry.has(interfaceName)) {
        return interfaceName;
      }

      const properties: Array<{ name: string; originalName: string; type: string; isComplexType: boolean }> = [];
      const dependencies = new Set<string>();

      Object.keys(obj).forEach((key) => {
        const value = obj[key];
        const originalName = key;
        const propertyName = this.toCamelCase(key);
        // Gera nome da classe baseado na propriedade
        const suffixPart = suffix ? this.capitalizeFirst(suffix) : '';
        const propertyClassName = `I${this.capitalizeFirst(key)}${suffixPart}`;
        const type = this.processObjectForTypeScript(value, propertyClassName, key, suffix);

        // Verifica se é um tipo complexo (interface criada)
        const isComplexType = type.startsWith('I') && type !== interfaceName && !type.endsWith('[]');

        if (isComplexType && type !== 'any' && type !== 'any[]') {
          dependencies.add(type.replace('[]', ''));
        }

        properties.push({ name: propertyName, originalName, type, isComplexType });
      });

      this.classRegistry.set(interfaceName, {
        name: interfaceName,
        properties,
        dependencies
      });

      return interfaceName;
    }

    const typeMap: Record<string, string> = {
      'string': 'string',
      'number': 'number',
      'boolean': 'boolean'
    };

    return typeMap[typeof obj] || 'any';
  }

  private processObjectForJava(obj: any, className: string, propertyKey: string, suffix: string = ''): string {
    if (obj === null || obj === undefined) {
      return 'Object';
    }

    if (Array.isArray(obj)) {
      if (obj.length > 0) {
        // Usa o nome da propriedade para gerar o nome da classe do item
        const suffixPart = suffix ? this.capitalizeFirst(suffix) : '';
        const itemClassName = propertyKey ? `${this.capitalizeFirst(propertyKey)}${suffixPart}Dto` : `${className}ItemDto`;
        const itemType = this.processObjectForJava(obj[0], itemClassName, '', suffix);
        if (itemType === 'Object') {
          return 'List<Object>';
        }
        return `List<${itemType}>`;
      }
      return 'List<Object>';
    }

    if (typeof obj === 'object') {
      // Garante que o nome da classe tenha "Dto" no final para Java
      const classDtoName = className.endsWith('Dto') ? className : `${className}Dto`;

      // Se já existe uma classe para este objeto, reutiliza
      if (this.classRegistry.has(classDtoName)) {
        return classDtoName;
      }

      const properties: Array<{ name: string; originalName: string; type: string; isComplexType: boolean }> = [];
      const dependencies = new Set<string>();

      Object.keys(obj).forEach((key) => {
        const value = obj[key];
        const originalName = key;
        const propertyName = this.toCamelCase(key);
        // Gera nome da classe baseado na propriedade
        const suffixPart = suffix ? this.capitalizeFirst(suffix) : '';
        const propertyClassName = `${this.capitalizeFirst(key)}${suffixPart}Dto`;
        const type = this.processObjectForJava(value, propertyClassName, key, suffix);

        // Verifica se é um tipo complexo (classe criada)
        const isComplexType = type.endsWith('Dto') && type !== classDtoName && !type.startsWith('List<');

        if (isComplexType) {
          dependencies.add(type);
        } else if (type.startsWith('List<') && type !== 'List<Object>') {
          const innerType = type.replace('List<', '').replace('>', '');
          if (innerType.endsWith('Dto')) {
            dependencies.add(innerType);
          }
        }

        properties.push({ name: propertyName, originalName, type, isComplexType });
      });

      this.classRegistry.set(classDtoName, {
        name: classDtoName,
        properties,
        dependencies
      });

      return classDtoName;
    }

    const typeMap: Record<string, string> = {
      'string': 'String',
      'number': this.isInteger(obj) ? 'Long' : 'Double',
      'boolean': 'Boolean'
    };

    return typeMap[typeof obj] || 'Object';
  }

  private getOrderedClasses(): ClassInfo[] {
    const ordered: ClassInfo[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (className: string): void => {
      if (visiting.has(className)) {
        return; // Ciclo detectado, ignora
      }
      if (visited.has(className)) {
        return;
      }

      const classInfo = this.classRegistry.get(className);
      if (!classInfo) {
        return;
      }

      visiting.add(className);

      // Visita dependências primeiro
      classInfo.dependencies.forEach(dep => {
        visit(dep);
      });

      visiting.delete(className);
      visited.add(className);
      ordered.push(classInfo);
    };

    this.classRegistry.forEach((_, className) => {
      visit(className);
    });

    return ordered;
  }

  private generateTypeScriptInterface(classInfo: ClassInfo): string {
    const interfaceName = classInfo.name;

    if (classInfo.properties.length === 0) {
      return `export interface ${interfaceName} {\n}`;
    }

    let code = `export interface ${interfaceName} {\n`;

    classInfo.properties.forEach((prop) => {
      code += `  ${prop.name}: ${prop.type};\n`;
    });

    code += '}';

    return code;
  }

  private generateJavaClass(classInfo: ClassInfo): string {
    const className = classInfo.name;
    const needsListImport = classInfo.properties.some(prop => prop.type.startsWith('List<'));

    let code = 'package com.example.dto;\n\n';
    code += 'import com.fasterxml.jackson.annotation.JsonInclude;\n';
    code += 'import com.fasterxml.jackson.annotation.JsonInclude.Include;\n';
    code += 'import com.fasterxml.jackson.annotation.JsonProperty;\n';
    code += 'import lombok.AllArgsConstructor;\n';
    code += 'import lombok.Builder;\n';
    code += 'import lombok.Data;\n';
    code += 'import lombok.NoArgsConstructor;\n';

    if (needsListImport) {
      code += 'import java.util.List;\n';
    }

    code += '\n';
    code += '@Data\n';
    code += '@AllArgsConstructor\n';
    code += '@NoArgsConstructor\n';
    code += '@Builder\n';
    code += '@JsonInclude(Include.NON_NULL)\n';
    code += `public class ${className} {\n\n`;

    if (classInfo.properties.length === 0) {
      code += '}';
      return code;
    }

    classInfo.properties.forEach((prop) => {
      // Adiciona @JsonProperty em todos os campos com o nome original
      code += `  @JsonProperty("${prop.originalName}")\n`;
      code += `  private ${prop.type} ${prop.name};\n`;
    });

    code += '}';

    return code;
  }

  private isInteger(value: number): boolean {
    return Number.isInteger(value);
  }

  private capitalizeFirst(str: string): string {
    if (!str) {
      return '';
    }
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private toCamelCase(str: string): string {
    return str.replace(/[-_](.)/g, (_, char) => char.toUpperCase());
  }
}
