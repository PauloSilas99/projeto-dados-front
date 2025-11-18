# Excel → PDF Front-end

Interface em React para converter planilhas Excel em arquivos PDF utilizando uma biblioteca de conversão já existente.

## Pré-requisitos

- Node.js 18+
- Biblioteca de conversão exposta no navegador (ex.: adicionada via `<script>` antes do bundle). A aplicação espera encontrar `window.ExcelPdf` com os métodos:
  - `convert(file: File, options?): Promise<Blob | ArrayBuffer | Uint8Array>`
  - `getSheetNames?(file: File): Promise<string[]>`

## Como executar

Instale as dependências e inicie o ambiente de desenvolvimento:

```bash
npm install
npm run dev
```

O Vite exibirá a URL local (por padrão `http://localhost:5173`).

## Fluxo de uso

1. Carregue a biblioteca de conversão antes do bundle (por exemplo, adicionando `<script src="/path/para/biblioteca.js"></script>` em `index.html`).
2. Acesse a aplicação e envie uma planilha Excel arrastando o arquivo ou usando o seletor.
3. Configure as opções (orientação, ajuste à página, exibição de grades, aba específica).
4. Clique em **Converter para PDF** para gerar o arquivo.
5. Baixe o PDF finalizado diretamente pela interface.

Se a biblioteca expuser `getSheetNames`, o usuário poderá escolher qual aba converter; caso contrário, todas as abas serão utilizadas.

## Estrutura principal

- `src/App.tsx`: tela principal com upload, configurações e estados de conversão.
- `src/lib/excelPdf.ts`: wrapper responsável por acessar a biblioteca global e normalizar o retorno para `Blob`.
- `src/index.css` e `src/App.css`: estilos globais e específicos da interface.

## Próximos passos sugeridos

- Adicionar mensagens de progresso vindas da biblioteca, se disponíveis.
- Integrar opções avançadas específicas da implementação da conversão.
- Criar testes de integração com a biblioteca final para garantir a compatibilidade.
