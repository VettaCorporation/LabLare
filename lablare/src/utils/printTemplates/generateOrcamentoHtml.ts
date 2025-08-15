// Tipagem para os dados completos do orçamento
interface OrcamentoCompleto {
  id_orcamento: number;
  data_criacao: string;
  data_validade: string;
  valor_bruto: number;
  desconto: number;
  valor_final: number;
  paciente: {
    nome_completo: string;
    cpf: string;
  };
  recepcionista: {
    nome_completo: string;
  };
  itens: Array<{
    exame_catalogo: {
      nome_exame: string;
    };
    preco_exame: number;
  }>;
}

export function generateOrcamentoHtml(orcamento: OrcamentoCompleto): string {
  const dataCriacao = new Date(orcamento.data_criacao).toLocaleDateString('pt-BR');
  const dataValidade = new Date(orcamento.data_validade).toLocaleDateString('pt-BR');
  
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Orçamento #${orcamento.id_orcamento}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; color: #333; }
        .container { max-width: 800px; margin: auto; border: 1px solid #eee; padding: 30px; box-shadow: 0 0 10px rgba(0,0,0,0.05); }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0047AB; padding-bottom: 20px; margin-bottom: 20px; }
        .header h1 { color: #0047AB; margin: 0; }
        .lab-info { text-align: right; font-size: 12px; color: #555; }
        .patient-info { background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 30px; font-size: 14px; }
        .patient-info p { margin: 5px 0; }
        table { width: 100%; border-collapse: collapse; font-size: 14px; }
        th, td { border-bottom: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: 600; }
        .totals { margin-top: 30px; float: right; width: 250px; }
        .totals p { display: flex; justify-content: space-between; margin: 8px 0; font-size: 14px; }
        .totals .final-total { font-size: 16px; font-weight: bold; border-top: 1px solid #ccc; padding-top: 8px; }
        .footer { text-align: center; margin-top: 80px; font-size: 12px; color: #777; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div>
            <h1>Orçamento</h1>
            <p>Número: #${orcamento.id_orcamento}</p>
          </div>
          <div class="lab-info">
            <strong>Lare Laboratórios</strong><br>
            Rua Exemplo, 123 - Cidade, UF<br>
            (XX) XXXX-XXXX<br>
            contato@larelaboratorio.com.br
          </div>
        </div>
        <div class="patient-info">
          <p><strong>Paciente:</strong> ${orcamento.paciente.nome_completo}</p>
          <p><strong>CPF:</strong> ${orcamento.paciente.cpf}</p>
          <p><strong>Data de Emissão:</strong> ${dataCriacao}</p>
          <p><strong>Válido até:</strong> ${dataValidade}</p>
        </div>
        <h3>Exames Orçados</h3>
        <table>
          <thead>
            <tr>
              <th>Exame</th>
              <th>Valor (R$)</th>
            </tr>
          </thead>
          <tbody>
            ${orcamento.itens.map(item => `
              <tr>
                <td>${item.exame_catalogo.nome_exame}</td>
                <td>${Number(item.preco_exame).toFixed(2).replace('.', ',')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="totals">
          <p><span>Subtotal:</span> <span>R$ ${Number(orcamento.valor_bruto).toFixed(2).replace('.', ',')}</span></p>
          <p><span>Desconto:</span> <span>- R$ ${Number(orcamento.desconto).toFixed(2).replace('.', ',')}</span></p>
          <p class="final-total"><span>TOTAL:</span> <span>R$ ${Number(orcamento.valor_final).toFixed(2).replace('.', ',')}</span></p>
        </div>
        <div style="clear:both;"></div>
        <div class="footer">
          <p>Este orçamento é válido até ${dataValidade}. Valores sujeitos a alteração após esta data.</p>
        </div>
      </div>
      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `;
}