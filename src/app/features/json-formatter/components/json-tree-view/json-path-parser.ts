/**
 * Parser básico de JSONPath
 * Suporta sintaxe simples como: $.id, $.users[0], $.user.name, etc.
 */
export class JsonPathParser {
  /**
   * Aplica um JSONPath ao objeto JSON
   * @param json Objeto JSON
   * @param path JSONPath (ex: $.id, $.user.name, $.items[0])
   * @returns Valor encontrado ou null
   */
  public static apply(json: any, path: string): any {
    if (!path || !path.trim()) {
      return json;
    }

    const cleanPath = path.trim();

    // Remove o $ inicial se existir
    let pathParts = cleanPath.startsWith('$') 
      ? cleanPath.substring(1).trim() 
      : cleanPath;

    if (!pathParts || pathParts === '.') {
      return json;
    }

    // Remove o ponto inicial se existir
    if (pathParts.startsWith('.')) {
      pathParts = pathParts.substring(1);
    }

    if (!pathParts) {
      return json;
    }

    try {
      return this.traverse(json, pathParts);
    } catch (error) {
      console.error('Erro ao aplicar JSONPath:', error);
      return null;
    }
  }

  private static traverse(obj: any, path: string): any {
    if (!path) {
      return obj;
    }

    // Processa índice de array [0]
    const arrayMatch = path.match(/^(\w+)\[(\d+)\](.*)$/);
    if (arrayMatch) {
      const [, key, index, rest] = arrayMatch;
      const value = obj[key];
      if (Array.isArray(value) && value[parseInt(index)]) {
        return this.traverse(value[parseInt(index)], rest);
      }
      return null;
    }

    // Processa propriedade simples .prop
    const propMatch = path.match(/^(\w+)(.*)$/);
    if (propMatch) {
      const [, key, rest] = propMatch;
      
      if (obj && typeof obj === 'object' && key in obj) {
        const value = obj[key];
        
        // Remove ponto inicial do resto do path
        const nextPath = rest.startsWith('.') ? rest.substring(1) : rest;
        return this.traverse(value, nextPath);
      }
      
      return null;
    }

    return obj;
  }
}

