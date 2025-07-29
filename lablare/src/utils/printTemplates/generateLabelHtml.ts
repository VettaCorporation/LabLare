// lablare/src/utils/printTemplates/generateLabelHtml.ts

/**
 * @typedef {object} PacienteData
 * @property {string} nome_completo
 * @property {string} cpf
 */
interface PacienteData {
  nome_completo: string;
  cpf: string;
}

/**
 * @typedef {object} ExameData
 * @property {string} nome_exame
 */
interface ExameData {
  nome_exame: string;
}

/**
 * Gera o conteúdo HTML completo para a impressão de etiquetas de amostras.
 * @param {PacienteData} paciente - Objeto do paciente com nome_completo, cpf.
 * @param {number} idade - Idade calculada do paciente.
 * @param {ExameData[]} examesSelecionados - Array de exames com nome_exame.
 * @returns {string} O conteúdo HTML completo para a janela de impressão.
 */
export function generateLabelHtml(paciente: PacienteData, idade: number, examesSelecionados: ExameData[]): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Etiquetas de Amostras</title>
      <style>
        body { font-family: sans-serif; margin: 0; padding: 20px; }
        .etiqueta-container {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); /* Ajuste a largura da etiqueta aqui */
          gap: 20px;
          page-break-after: always; /* Garante que uma nova página comece após todas as etiquetas */
        }
        .etiqueta {
          border: 1px solid #000;
          padding: 10px;
          width: 180px; /* Largura fixa da etiqueta */
          height: 100px; /* Altura fixa da etiqueta */
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          font-size: 10px;
          box-sizing: border-box; /* Inclui padding e border no width/height */
        }
        .etiqueta h3 { margin: 0 0 5px 0; font-size: 12px; }
        .etiqueta p { margin: 0 0 2px 0; }
        .etiqueta .exames { font-size: 9px; margin-top: 5px; }

        /* Estilos para impressão */
        @media print {
          body { margin: 0; padding: 0; }
          .etiqueta-container {
            grid-template-columns: repeat(auto-fill, minmax(2in, 1fr)); /* Exemplo para 2 polegadas na impressão */
            gap: 0.25in;
            padding: 0.5in; /* Margens da página de impressão */
          }
          .etiqueta {
            width: 1.8in; /* Largura da etiqueta para impressão */
            height: 0.9in; /* Altura da etiqueta para impressão */
            border: 1px solid black;
            page-break-inside: avoid; /* Evita quebras dentro da etiqueta */
          }
        }
      </style>
    </head>
    <body>
      <div class="etiqueta-container">
        ${examesSelecionados.map(exame => `
          <div class="etiqueta">
            <h3>${paciente.nome_completo}</h3>
            <p>Idade: ${idade} anos</p>
            <p>CPF: ${paciente.cpf}</p>
            <div class="exames">
              <strong>Exame:</strong> ${exame.nome_exame}
            </div>
          </div>
        `).join('')}
      </div>
      <script>
        // Aciona a impressão automaticamente quando a janela é carregada
        window.onload = function() {
          window.print();
          // Opcional: Fechar a janela após a impressão (pode não funcionar em todos os navegadores)
          // window.onafterprint = function() { window.close(); };
        };
      </script>
    </body>
    </html>
  `;
}
