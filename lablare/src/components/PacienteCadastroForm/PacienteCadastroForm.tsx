// src/components/PacienteCadastroForm/PacienteCadastroForm.tsx
"use client";

import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { isValidCPF } from "@/utils/cpfValidator";
import { formatCpfOnType } from "@/utils/cpfFormatter";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
interface Paciente {
  id_paciente: number;
  nome_completo: string;
  cpf: string;
  data_nascimento: string;
  sexo?: string | null;
  email?: string | null;
  contato?: string | null;
}

interface PacienteCadastroFormProps {
  onPatientSaved: (patient: Paciente) => void;
  onCancel: () => void;
  initialData?: Paciente | null;
}

const initialState = {
  nome_completo: "",
  cpf: "",
  data_nascimento: "",
  sexo: "",
  email: "",
  contato: "",
};

const formatPhoneOnType = (phone: string): string => {
  const d = phone.replace(/\D/g, "");
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10)
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`; // (DD) XXXX-XXXX
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`; // (DD) XXXXX-XXXX
};

export default function PacienteCadastroForm({
  onPatientSaved,
  onCancel,
  initialData,
}: PacienteCadastroFormProps) {
  const [formData, setFormData] = useState(initialState);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const isEditing = !!initialData;

  useEffect(() => {
    if (initialData) {
      setFormData({
        nome_completo: initialData.nome_completo,
        cpf: initialData.cpf,
        data_nascimento: new Date(initialData.data_nascimento)
          .toISOString()
          .split("T")[0],
        sexo: initialData.sexo || "",
        email: initialData.email || "",
        contato: initialData.contato || "",
      });
    } else {
      setFormData(initialState);
    }
  }, [initialData]);

  // --- VALIDAÇÃO (padrão do componente) ---
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Nome
    const nome = (formData.nome_completo ?? "").trim();
    if (!nome) {
      newErrors.nome_completo = "O nome completo é obrigatório.";
    }

    // CPF (somente dígitos) + validação
    const cpfDigits = (formData.cpf ?? "").replace(/\D/g, "");
    if (!cpfDigits || !isValidCPF(cpfDigits)) {
      newErrors.cpf = "O CPF fornecido é inválido.";
    }

    // Data de nascimento (>= 1910-01-01 e <= hoje) — espera AAAA-MM-DD
    const dobStr = (formData.data_nascimento ?? "").trim();
    if (!dobStr) {
      newErrors.data_nascimento = "A data de nascimento é obrigatória.";
    } else {
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dobStr);
      if (!m) {
        newErrors.data_nascimento = "Use o formato AAAA-MM-DD.";
      } else {
        const [_, yStr, moStr, dStr] = m;
        const y = parseInt(yStr, 10);
        const mo = parseInt(moStr, 10);
        const d = parseInt(dStr, 10);

        // monta em UTC para evitar fuso
        const dob = new Date(Date.UTC(y, mo - 1, d));
        const isRealDate =
          dob.getUTCFullYear() === y &&
          dob.getUTCMonth() === mo - 1 &&
          dob.getUTCDate() === d;

        if (!isRealDate) {
          newErrors.data_nascimento = "Data de nascimento inválida.";
        } else {
          const MIN_YEAR = 1910;
          const today = new Date();
          const todayUTC = new Date(
            Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
          );
          if (y < MIN_YEAR) {
            newErrors.data_nascimento = `Apenas datas a partir de ${MIN_YEAR}.`;
          } else if (dob > todayUTC) {
            newErrors.data_nascimento =
              "A data de nascimento não pode ser no futuro.";
          }
        }
      }
    }

    const email = (formData.email ?? "").trim();
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
      if (!emailRegex.test(email) || email.length > 254) {
        newErrors.email = "O formato do e-mail é inválido.";
      }
    }

    // Contato (opcional) — 10 ou 11 dígitos (DDD + número)
    if (formData.contato) {
      const d = formData.contato.replace(/\D/g, "");
      if (d.length < 10 || d.length > 11) {
        newErrors.contato = "Informe DDD + número (10 ou 11 dígitos).";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));

    if (name === "cpf") {
      const formattedCpf = formatCpfOnType(value);
      setFormData((prev) => ({ ...prev, cpf: formattedCpf }));
    } else if (name === "contato") {
      const formattedPhone = formatPhoneOnType(value);
      setFormData((prev) => ({ ...prev, contato: formattedPhone }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Por favor, corrija os erros no formulário.");
      return;
    }
    setLoading(true);

    try {
      const method = isEditing ? "PUT" : "POST";
      const url = isEditing
        ? `/api/pacientes/${(initialData as Paciente)?.id_paciente}`
        : "/api/pacientes";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Falha ao salvar o paciente.");
      }

      const result = await response.json();
      onPatientSaved(result);
      toast.success("Paciente salvo com sucesso!");

      if (!isEditing) setFormData(initialState);
    } catch (error: any) {
      console.error("Erro ao salvar paciente:", error);
      toast.error(
        error?.message || "Não foi possível salvar o paciente. Tente novamente."
      );
    } finally {
      setLoading(false);
    }
  };

  // Limites para o input date
  const maxDate = new Date().toISOString().split("T")[0];

  // --- RENDER ---
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {isEditing ? "Editar Paciente" : "Cadastro de Novo Paciente"}
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Preencha os campos abaixo para{" "}
          {isEditing ? "atualizar os dados do" : "cadastrar um novo"} paciente.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="p-6 space-y-6">
          {/* Dados Pessoais */}
          <div>
            <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Dados Pessoais
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nome Completo */}
              <div className="md:col-span-2">
                <label
                  htmlFor="nome_completo"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Nome Completo *
                </label>
                <input
                  type="text"
                  name="nome_completo"
                  id="nome_completo"
                  value={formData.nome_completo}
                  onChange={handleChange}
                  placeholder="Digite o nome completo"
                  className={`form-input ${
                    errors.nome_completo ? "input-error" : ""
                  }`}
                />
                {errors.nome_completo && (
                  <p className="form-error-message">{errors.nome_completo}</p>
                )}
              </div>

              {/* CPF */}
              <div>
                <label
                  htmlFor="cpf"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  CPF *
                </label>
                <input
                  type="text"
                  name="cpf"
                  id="cpf"
                  value={formData.cpf}
                  onChange={handleChange}
                  disabled={isEditing}
                  inputMode="numeric"
                  maxLength={14}
                  placeholder="000.000.000-00"
                  className={`form-input ${errors.cpf ? "input-error" : ""} ${
                    isEditing
                      ? "cursor-not-allowed bg-gray-100 dark:bg-gray-800"
                      : ""
                  }`}
                />
                {errors.cpf && (
                  <p className="form-error-message">{errors.cpf}</p>
                )}
              </div>

              {/* Data de Nascimento */}
              <div>
                <label
                  htmlFor="data_nascimento"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Data de Nascimento *
                </label>
                <input
                  type="date"
                  name="data_nascimento"
                  id="data_nascimento"
                  value={formData.data_nascimento}
                  onChange={handleChange}
                  min="1910-01-01"
                  max={maxDate}
                  className={`form-input ${
                    errors.data_nascimento ? "input-error" : ""
                  }`}
                />
                {errors.data_nascimento && (
                  <p className="form-error-message">{errors.data_nascimento}</p>
                )}
              </div>
            </div>
          </div>

          {/* Informações Adicionais */}
          <div>
            <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Informações Adicionais
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sexo */}
              <div>
                <label
                  htmlFor="sexo"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Sexo
                </label>
                <select
                  name="sexo"
                  id="sexo"
                  value={formData.sexo}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="">Selecione...</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Feminino">Feminino</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="contato@email.com"
                  className={`form-input ${errors.email ? "input-error" : ""}`}
                />
                {errors.email && (
                  <p className="form-error-message">{errors.email}</p>
                )}
              </div>

              {/* Contato (Telefone) */}
              <div className="md:col-span-2">
                <label
                  htmlFor="contato"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Contato (Telefone)
                </label>
                <input
                  type="text"
                  name="contato"
                  id="contato"
                  value={formData.contato}
                  onChange={handleChange}
                  inputMode="tel"
                  placeholder="(81) 99999-8888"
                  maxLength={15}
                  className={`form-input ${
                    errors.contato ? "input-error" : ""
                  }`}
                />
                {errors.contato && (
                  <p className="form-error-message">{errors.contato}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="p-6 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-4 rounded-b-lg">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-wait transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900"
          >
            {loading && (
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            )}
            {loading
              ? "Salvando..."
              : isEditing
              ? "Salvar Alterações"
              : "Cadastrar Paciente"}
          </button>
        </div>
      </form>
    </div>
  );
}
