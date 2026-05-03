import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Endereços fixos do formulário público de contato.
const SEU_EMAIL_DE_DESTINO = 'vettacontatto@gmail.com';
// Para produção, verificar domínio próprio no painel do Resend.
const EMAIL_REMETENTE_VERIFICADO = 'onboarding@resend.dev';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nome, email, telefone, mensagem } = body;

    if (!nome || !email || !mensagem) {
      return NextResponse.json(
        { error: 'Campos obrigatórios (nome, email, mensagem) faltando.' },
        { status: 400 },
      );
    }

    // Lazy-init do Resend: instanciar no module load quebra `next build`
    // quando RESEND_API_KEY não está setada (Resend lança no construtor).
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Serviço de envio de e-mail não configurado.' },
        { status: 503 },
      );
    }
    const resend = new Resend(apiKey);

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