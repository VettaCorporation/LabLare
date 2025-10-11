import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { Parser } from 'xml2js';

const prisma = new PrismaClient();

async function main() {
    try {
        const xmlFilePath = path.join(__dirname, 'data', 'privilegios.xml');
        const xmlDataString = fs.readFileSync(xmlFilePath, 'utf8');
        const parser = new Parser();
        const result = await parser.parseStringPromise(xmlDataString);
        const privilegiosDoXml = result.TABELA.PRIVILEGIO;

        const rotasPrivilegios = privilegiosDoXml.map((p: any) => ({
            nome: p.NOME[0],
            rota: p.ROTA[0],
            descricao: p.DESCRICAO[0],
        }));

        await prisma.$transaction(
            rotasPrivilegios.map(p => prisma.privilegio.upsert({
                where: { rota: p.rota },
                update: { nome: p.nome, descricao: p.descricao },
                create: { nome: p.nome, rota: p.rota, descricao: p.descricao },
            }))
        );

        const adm = await prisma.perfil.findUnique({ where: { nome_perfil: 'Administrador' } });
        const recep = await prisma.perfil.findUnique({ where: { nome_perfil: 'Recepcionista' } });

        if (!adm || !recep) {
            console.error('Perfis Administrador ou Recepcionista não encontrados.');
            return;
        }

        const rotasRecepcionista = [
            '/dashboard',
            '/dashboard/solicitar-exame',
            '/dashboard/pedidos',
            '/dashboard/pacientes',
            '/dashboard/etiqueta',
            '/dashboard/configuracoes',
        ];

        const privilegiosRecepcionista = await prisma.privilegio.findMany({
            where: {
                rota: { in: rotasRecepcionista },
            },
        });

        await prisma.perfil.update({
            where: { id_perfil: recep.id_perfil },
            data: {
                privilegios: {
                    set: [],
                    connect: privilegiosRecepcionista.map(p => ({ id_privilegio: p.id_privilegio })),
                },
            },
        });

        const todosPrivilegios = await prisma.privilegio.findMany();
        await prisma.perfil.update({
            where: { id_perfil: adm.id_perfil },
            data: {
                privilegios: {
                    set: [],
                    connect: todosPrivilegios.map(p => ({ id_privilegio: p.id_privilegio })),
                },
            },
        });

    } catch (error) {
        console.error('Ocorreu um erro durante a importação:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();