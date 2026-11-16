import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Modal } from '../../../components/ui';
import {
  INPUT_BASE_CLASS,
  PROJECT_WRITE_CATEGORIES,
  validateProjectInput,
} from '../../../lib';
import type { ActiveUserProfileData, AppProject } from '../../../types/domain';
import type { CreateProjectPayload } from '../types';

export interface NewProjectModalProps {
  open: boolean;
  currentUser: ActiveUserProfileData | null;
  onClose: () => void;
  onSubmitProject: (
    user: ActiveUserProfileData,
    payload: CreateProjectPayload
  ) => Promise<string>;
  onFeedback: (feedback: { type: 'success' | 'error'; text: string }) => void;
  onProjectCreated: (title: string, budget: number) => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  open,
  currentUser,
  onClose,
  onSubmitProject,
  onFeedback,
  onProjectCreated,
}) => {
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<AppProject['category']>('Backend & APIs');
  const [budget, setBudget] = useState<string>('');
  const [deadline, setDeadline] = useState<string>('14');
  const [repoUrl, setRepoUrl] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || submitting) return;

    const validation = validateProjectInput({
      title,
      description,
      budget,
      deadlineDays: deadline,
      repoUrl,
    });

    if (validation.ok === false) {
      onFeedback({ type: 'error', text: validation.error });
      return;
    }

    setSubmitting(true);
    try {
      await onSubmitProject(currentUser, {
        ...validation.data,
        category,
      });

      setTitle('');
      setDescription('');
      setBudget('');
      setRepoUrl('');
      onClose();
      onProjectCreated(validation.data.title, validation.data.budget);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Publicar um Projeto Gratuitamente"
      description="Receba propostas de especialistas verificados com 0% de taxa."
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
            Nome do Projeto (5 a 140 caracteres)
          </label>
          <input
            type="text"
            required
            minLength={5}
            maxLength={140}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Desenvolvimento de API Node.js + Integração de Pagamentos"
            className={INPUT_BASE_CLASS}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
              Categoria
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as AppProject['category'])}
              className={INPUT_BASE_CLASS}
            >
              {PROJECT_WRITE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
              Orçamento Fixo (R$)
            </label>
            <input
              type="number"
              min={50}
              max={10000000}
              required
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className={`${INPUT_BASE_CLASS} font-mono tabular-nums`}
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
              Prazo Estimado (Dias)
            </label>
            <input
              type="number"
              min={1}
              max={365}
              required
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className={`${INPUT_BASE_CLASS} font-mono tabular-nums`}
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
            Repositório Git Vinculado (proprietario/repositorio)
          </label>
          <input
            type="text"
            required
            maxLength={300}
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            className={`${INPUT_BASE_CLASS} font-mono`}
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
            Descrição Detalhada do Projeto
          </label>
          <textarea
            rows={4}
            required
            minLength={10}
            maxLength={3000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descreva o que precisa ser desenvolvido, tecnologias desejadas e entregáveis..."
            className={INPUT_BASE_CLASS}
          />
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-lg cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
          >
            <Plus className="w-4 h-4" />
            <span>{submitting ? 'Publicando...' : 'Publicar Projeto Agora'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
