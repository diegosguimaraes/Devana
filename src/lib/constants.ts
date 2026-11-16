import { VALIDATION_CONSTANTS } from '../firebase';

export const PLATFORM_COMMISSION_RATE = 0;
export const MIN_PROJECT_BUDGET_BRL = 50;
export const MAX_PROJECT_BUDGET_BRL = 10_000_000;

export const PROJECT_WRITE_CATEGORIES = [
  'Backend & APIs',
  'Frontend & UI',
  'Cloud & DevOps',
  'Dados & IA',
  'Mobile',
  'Segurança & Auditoria',
] as const;

export const PROJECT_CATEGORIES = ['Todos', ...PROJECT_WRITE_CATEGORIES] as const;

export const PROJECT_STATUS_LABELS: Record<
  'open' | 'in_progress' | 'completed' | 'cancelled',
  string
> = {
  open: 'Aberto',
  in_progress: 'Em Execução',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};

export const ESCROW_STATUS_LABELS: Record<'unfunded' | 'funded' | 'released', string> = {
  unfunded: 'Orçamento Fixo',
  funded: 'Garantia Depositada',
  released: 'Pagamento Liberado',
};

export const INPUT_BASE_CLASS =
  'w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-indigo-600 dark:focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-900 transition-colors';

export function sanitizeFirestoreUid(uid: string): string {
  return uid.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, VALIDATION_CONSTANTS.ID_MAX_LENGTH);
}
