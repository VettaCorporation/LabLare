import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function corrigirDatas() {
  console.log('Iniciando a verificação e correção das datas de nascimento...');

  try {
    const todosPacientes = await prisma.paciente.findMany({
        select: {
            id_paciente: true,
            nome_completo: true,
            data_nascimento: true,
        }
    });

    console.log(`Encontrados ${todosPacientes.length} pacientes para verificação.`);
    let datasCorrigidas = 0;

    for (const paciente of todosPacientes) {
      const dataAtual = paciente.data_nascimento;
      const dataFormatada = new Date(dataAtual);

      if (isNaN(dataFormatada.getTime())) {
        console.warn(`AVISO: Paciente ID ${paciente.id_paciente} (${paciente.nome_completo}) possui uma data inválida: ${dataAtual}. Pulando...`);
        continue;
      }

      await prisma.paciente.update({
        where: { id_paciente: paciente.id_paciente },
        data: { data_nascimento: dataFormatada },
      });
      
      datasCorrigidas++;
    }

    console.log(`\nCorreção finalizada!`);
    console.log(`${datasCorrigidas} de ${todosPacientes.length} registros de pacientes foram verificados e atualizados com sucesso.`);

  } catch (error) {
    console.error('Ocorreu um erro durante o processo de correção:', error);
  } finally {
    await prisma.$disconnect();
  }
}

corrigirDatas();