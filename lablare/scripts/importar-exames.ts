// scripts/importar-exames.ts


import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { Parser } from 'xml2js';
import iconv from 'iconv-lite';

// Inicializa o cliente do Prisma
const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando script de importação de exames...');

  try {
    // Caminho para o arquivo XML
    const xmlFilePath = path.join(__dirname, 'data', 'tabexalhpV2.xml');

    // 1. Ler o arquivo como um buffer para tratar o encoding
    console.log(`Lendo arquivo: ${xmlFilePath}`);
    const fileBuffer = fs.readFileSync(xmlFilePath);

    // 2. Decodificar o buffer de ISO-8859-1 para UTF-8
    const xmlDataString = iconv.decode(fileBuffer, 'ISO-8859-1');

    // 3. Iniciar o parser de XML
    const parser = new Parser();
    const result = await parser.parseStringPromise(xmlDataString);

    // Acessar a lista de exames dentro da tag <TABELA>
    const examesDoXml = result.TABELA.EXAME;
    console.log(`Encontrados ${examesDoXml.length} exames no arquivo XML.`);

    let examesCriados = 0;
    let examesAtualizados = 0;

    // 4. Iterar sobre cada exame do XML e salvar no banco
    for (const exameXml of examesDoXml) {
      // Extrair os dados. O xml2js cria arrays para cada tag.
      const codigo = exameXml.MNEXA[0];
      const nome = exameXml.DESCEXA[0];

      if (!codigo || !nome) {
        console.warn('Exame sem código ou nome encontrado, pulando...');
        continue;
      }

      // 5. Usar "upsert" do Prisma.
      // Isso vai criar o exame se ele não existir (pelo 'codigo_pardini').
      // Se já existir, vai apenas atualizá-lo. Isso evita duplicatas.
      const exameDb = await prisma.exameCatalogo.upsert({
        where: {
          codigo_pardini: codigo,
        },
        update: {
          nome_exame: nome,
        },
        create: {
          codigo_pardini: codigo,
          nome_exame: nome,
          preco: 0, // Definindo um preço padrão
          descricao: `Material: ${exameXml.MNMAT[0]}`, // Exemplo de uso de outro campo
        },
      });

      // Checa se o registro foi criado ou atualizado para o log
      if (exameDb.id_exame_catalogo > 0 && exameDb.nome_exame === nome) {
          // Esta lógica é simplificada. A detecção real de "criado vs atualizado"
          // exigiria uma leitura prévia, mas o upsert já faz o trabalho correto.
      }
    }
    
    // Contagem final (simplificada)
    const totalExamesFinal = await prisma.exameCatalogo.count();
    console.log(`\nImportação concluída!`);
    console.log(`Total de exames no catálogo agora: ${totalExamesFinal}`);

  } catch (error) {
    console.error('Ocorreu um erro durante a importação:', error);
  } finally {
    // 6. Garantir que a conexão com o banco seja fechada
    await prisma.$disconnect();
    console.log('Conexão com o banco de dados fechada.');
  }
}

// Executa a função principal
main();