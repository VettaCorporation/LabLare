// src/app/dashboard/cadastrar-exames/page.tsx
//
// Tela legada de cadastro de exames. Funcionalidade duplicava a do par
// /dashboard/exames (listagem) + /dashboard/exames/novo (criação completa
// com origem e código Pardini). Mantida apenas como redirect para evitar
// 404 em bookmarks antigos. Pode ser removida fisicamente quando ninguém
// referenciar mais (ver Privilegio.rota no banco).

import { redirect } from 'next/navigation';

export default function CadastrarExamesLegadoPage() {
  redirect('/dashboard/exames');
}
