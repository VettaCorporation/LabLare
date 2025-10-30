import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Instancia o Resend usando a API Key do .env.local
const resend = new Resend(process.env.RESEND_API_KEY);

// O e-mail para ONDE você quer receber as mensagens de contato
// Substitua pelo seu e-mail pessoal ou profissional.
const SEU_EMAIL_DE_DESTINO = 'vettacontatto@gmail.com';

// O e-mail que aparecerá no campo "De:"
// Para testes, o Resend permite usar 'onboarding@resend.dev'
// Para produção, você DEVE verificar seu domínio no painel do Resend.
const EMAIL_REMETENTE_VERIFICADO = 'onboarding@resend.dev';

export async function POST(request: Request) {
  try {
    // 1. Processa o corpo (body) da requisição (os dados do formulário)
    const body = await request.json();
    const { nome, email, telefone, mensagem } = body;

    // 2. Validação simples (pode ser melhorada com Zod, por exemplo)
    if (!nome || !email || !mensagem) {
      return NextResponse.json(
        { error: 'Campos obrigatórios (nome, email, mensagem) faltando.' },
        { status: 400 } // Bad Request
      );
    }

    // 3. Envia o e-mail usando o Resend
    const data = await resend.emails.send({
      from: `Contato LabLare <${EMAIL_REMETENTE_VERIFICADO}>`, // Ex: "Nome do Site <contato@seusite.com>"
      to: [SEU_EMAIL_DE_DESTINO], // O e-mail que VAI RECEBER a mensagem
      subject: `Nova Mensagem de Contato de: ${nome}`,
      
      // O campo 'replyto' faz com que, ao clicar "Responder" no seu Gmail,
      // a resposta vá direto para o e-mail do *visitante* que preencheu o form.
      // (Linha corrigida - sem underscore)
      replyTo: email, 

      // Conteúdo do e-mail (pode ser texto puro, HTML ou um componente React)
      // Vamos usar HTML simples para formatar bem os dados:
      html: `
        <h1>Nova mensagem do site LabLare</h1>
        <p>Você recebeu um novo contato através do formulário do site.</p>
        <hr>
        <p><strong>Nome:</strong> ${nome}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Telefone:</strong> ${telefone || 'Não informado'}</p>
        <p><strong>Mensagem:</strong></p>
        <p>${mensagem}</p>
        <hr>
      `,
    });

    // 4. Retorna sucesso
    if (data.error) {
       // Se o Resend retornar um erro (ex: chave errada)
       return NextResponse.json({ error: data.error.message }, { status: 500 });
    }
    
    return NextResponse.json({
      message: 'Email enviado com sucesso!',
      data: data.data?.id, // Retorna o ID do e-mail enviado
    });

  } catch (error) {
    // 5. Trata erros inesperados
    if (error instanceof Error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Erro desconhecido' }, { status: 500 });
  }
}