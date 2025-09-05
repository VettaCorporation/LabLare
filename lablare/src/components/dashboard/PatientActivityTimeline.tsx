import React from 'react';
import { UserCircleIcon, CalendarDaysIcon, ClockIcon, EnvelopeIcon, PhoneIcon } from '@heroicons/react/24/outline';

// A interface Patient permanece a mesma
interface Patient {
  id: string;
  name: string;
  age: number;
  email: string;
  contact: string;
  lastRequest: string;
}

interface PatientActivityTimelineProps {
  patients: Patient[];
}

export default function PatientActivityTimeline({ patients }: PatientActivityTimelineProps) {
  // Se não houver pacientes, exibe uma mensagem simples
  if (!patients || patients.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Nenhuma atividade de paciente recente para exibir.
      </p>
    );
  }

  // Renderiza apenas a lista, sem o card ou título
  return (
    <div className="space-y-6">
      {patients.map((patient, index) => (
        <div key={patient.id} className="flex items-start gap-4">
          {/* Ícone de Usuário e linha da timeline */}
          <div className="flex flex-col items-center">
            <UserCircleIcon className="h-8 w-8 text-gray-500 dark:text-gray-400" />
            {index < patients.length - 1 && (
              <div className="w-0.5 h-16 bg-gray-300 dark:bg-gray-700 my-1"></div>
            )}
          </div>

          {/* Detalhes do Paciente */}
          <div className="flex-1">
            <p className="font-semibold text-gray-800 dark:text-gray-200">{patient.name}</p>
            <div className="mt-1 flex flex-col space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                    <CalendarDaysIcon className="h-4 w-4" />
                    <span>{patient.age} anos</span>
                </div>
                <div className="flex items-center gap-2">
                    <EnvelopeIcon className="h-4 w-4" />
                    <span>{patient.email}</span>
                </div>
                <div className="flex items-center gap-2">
                    <PhoneIcon className="h-4 w-4" />
                    <span>{patient.contact}</span>
                </div>
                <div className="flex items-center gap-2">
                    <ClockIcon className="h-4 w-4" />
                    <span>Última Solicitação: {patient.lastRequest}</span>
                </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}