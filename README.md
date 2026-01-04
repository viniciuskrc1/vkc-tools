# VKC Tools

Coleção de ferramentas úteis para desenvolvedores, reunidas em uma única aplicação web.

## 🚀 Sobre o Projeto

VKC Tools é uma aplicação web desenvolvida em Angular 14 que reúne diversas ferramentas práticas para uso no dia a dia do desenvolvimento. A aplicação foi construída com componentes standalone, seguindo as melhores práticas do Angular moderno.

## 🛠️ Ferramentas Disponíveis

### 📄 Extrator de Chave de Acesso
Extrai chaves de acesso de arquivos PDF de notas fiscais eletrônicas (NF-e). Permite processar múltiplos arquivos de uma vez, com suporte a arrastar e soltar, e copiar todas as chaves extraídas.

### 🔢 Gerador de CPF
Gera números de CPF válidos para uso em testes e desenvolvimento. Todos os CPFs gerados são válidos conforme o algoritmo de validação.

### 🏢 Gerador de CNPJ
Gera números de CNPJ válidos para uso em testes e desenvolvimento. Todos os CNPJs gerados são válidos conforme o algoritmo de validação.

### 📍 Buscar CEP
Consulta informações de endereço através do CEP. Exibe dados completos do endereço, incluindo logradouro, bairro, cidade, UF, e integração com Google Maps para visualização da localização.

### 🖼️ Decode Image
Decodifica imagens em base64 e exibe o preview. Suporta múltiplos formatos (JPG, PNG, GIF, WEBP, BMP) e permite fazer download da imagem decodificada.

### 📦 Encode File
Converte arquivos para base64. Suporta qualquer tipo de arquivo (imagens, PDFs, XMLs, etc.) e permite copiar o código base64 gerado para a área de transferência.

### 📋 JSON Formatter
Formata e compacta JSON de forma rápida e fácil. Inclui visualização em formato de árvore com botões de expandir/colapsar, suporte a JSONPath para filtrar dados, e opções para copiar ou baixar o JSON processado.

### 📄 XSD Viewer
Visualizador de arquivos XSD (XML Schema Definition) com interface em árvore. Facilita a navegação e compreensão de esquemas XML complexos, mostrando elementos, atributos e tipos de forma hierárquica.

### 💻 JSON para Código
Gera código a partir de JSON. Suporta geração de interfaces TypeScript (com prefixo "I") e classes Java DTO (com sufixo "Dto" usando Lombok). Gera automaticamente todas as classes/interfaces aninhadas e permite edição do código gerado.

## 🏗️ Tecnologias Utilizadas

- **Angular 14** - Framework principal
- **TypeScript** - Linguagem de programação
- **RxJS** - Programação reativa
- **SCSS** - Estilização
- **Standalone Components** - Arquitetura moderna do Angular

## 📦 Desenvolvimento

Este projeto foi gerado com [Angular CLI](https://github.com/angular/angular-cli) versão 14.

### Pré-requisitos

- Node.js (versão recomendada: 16.x ou superior)
- npm ou yarn

### Instalação

```bash
npm install
```

### Servidor de Desenvolvimento

Execute `ng serve` para iniciar o servidor de desenvolvimento. Navegue até `http://localhost:4200/`. A aplicação será recarregada automaticamente se você alterar qualquer um dos arquivos de origem.

```bash
ng serve
```

### Build

Execute `ng build` para compilar o projeto. Os artefatos de compilação serão armazenados no diretório `dist/`.

```bash
ng build
```

Para build de produção:

```bash
ng build --configuration production
```

## 📁 Estrutura do Projeto

```
src/
├── app/
│   ├── features/          # Features/Módulos da aplicação
│   │   ├── cep-search/                    # Buscar CEP
│   │   ├── cnpj-generator/                # Gerador de CNPJ
│   │   ├── cpf-generator/                 # Gerador de CPF
│   │   ├── decode-image/                  # Decode Image
│   │   ├── encode-file/                   # Encode File
│   │   ├── extract-access-key-file-page/  # Extrator de Chave de Acesso
│   │   ├── home/                          # Componente home principal
│   │   ├── json-formatter/                # JSON Formatter
│   │   ├── json-to-code-page/             # JSON para Código
│   │   └── xsd-viewer/                    # XSD Viewer
│   └── shared/            # Componentes e serviços compartilhados
│       ├── forms/         # Componentes de formulário reutilizáveis
│       ├── layout/        # Componentes de layout
│       └── ui/            # Componentes de UI reutilizáveis
│           ├── help-modal/    # Modal de ajuda
│           └── modal/         # Modal genérico
├── environments/          # Arquivos de ambiente
└── styles.scss           # Estilos globais
```

### Organização das Features

Cada feature segue uma estrutura padronizada:

- `[feature-name]-page.component.ts/html/scss` - Componente principal da página
- `[feature-name]-page.routes.ts` - Rotas da feature
- `index.ts` - Barrel exports
- `models/` - Interfaces específicas da feature
- `services/` - Serviços específicos da feature
- `pipes/` - Pipes personalizados (quando necessário)
- `components/` - Componentes específicos da feature (quando necessário)

## 🎯 Características Principais

- ✅ Componentes standalone
- ✅ Arquitetura modular e escalável
- ✅ Componentes reutilizáveis
- ✅ Interface responsiva e moderna
- ✅ UX intuitiva com modais de ajuda
- ✅ Suporte a drag and drop em várias features
- ✅ Integração com APIs externas (ViaCEP, Google Maps)

## 📝 Licença

Este projeto é de uso pessoal/privado.
