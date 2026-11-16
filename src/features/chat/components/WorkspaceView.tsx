import React, { useState } from 'react';
import {
  ChevronRight,
  Clock,
  FolderGit2,
  GitBranch,
  GitCommit,
  MessageSquare,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Send,
} from 'lucide-react';
import { AuthGatePanel } from '../../../components/AuthGatePanel';
import {
  ApiClientError,
  INPUT_BASE_CLASS,
  formatStopwatchTimer,
  validateWorklogInput,
} from '../../../lib';
import type {
  ActiveUserProfileData,
  AppChatMessage,
  AppProject,
  AppWorklog,
} from '../../../types/domain';
import { fetchGithubCommitsApi } from '../api/chatApi';
import { useWorkroomStopwatch } from '../hooks/useRealtime';
import type { GithubCommitItem, LogWorklogPayload } from '../types';

export interface WorkspaceViewProps {
  currentUser: ActiveUserProfileData | null;
  selectedProject: AppProject | null;
  projects: AppProject[];
  currentWorklogs: AppWorklog[];
  currentMessages: AppChatMessage[];
  roomUsers: Array<{ userId: string; userName: string }>;
  typingUser: string | null;
  requireVerifiedAuth: () => boolean;
  onSelectProject: (projectId: string) => void;
  onLogWorklog: (
    project: AppProject,
    user: ActiveUserProfileData,
    payload: LogWorklogPayload
  ) => Promise<string>;
  onSendChatMessage: (
    project: AppProject,
    user: ActiveUserProfileData,
    text: string
  ) => Promise<string>;
  onEmitTyping: () => void;
  onPushAlert: (title: string, category: 'commit' | 'message') => void;
  onGoToMarketplace: () => void;
  onFeedback: (feedback: { type: 'success' | 'error'; text: string }) => void;
}

export const WorkspaceView: React.FC<WorkspaceViewProps> = ({
  currentUser,
  selectedProject,
  projects,
  currentWorklogs,
  currentMessages,
  roomUsers,
  typingUser,
  requireVerifiedAuth,
  onSelectProject,
  onLogWorklog,
  onSendChatMessage,
  onEmitTyping,
  onPushAlert,
  onGoToMarketplace,
  onFeedback,
}) => {
  const { timerRunning, timerSeconds, toggleRunning, reset } = useWorkroomStopwatch();

  const [wlHours, setWlHours] = useState<string>('1.0');
  const [wlCommitHash, setWlCommitHash] = useState<string>('');
  const [wlBranch, setWlBranch] = useState<string>('main');
  const [wlMessage, setWlMessage] = useState<string>('');
  const [githubRepoInput, setGithubRepoInput] = useState<string>('');
  const [githubCommits, setGithubCommits] = useState<GithubCommitItem[]>([]);
  const [githubLoading, setGithubLoading] = useState<boolean>(false);
  const [chatInput, setChatInput] = useState<string>('');

  if (!currentUser) {
    return (
      <div className="max-w-lg mx-auto bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
        <AuthGatePanel
          initialMode="login"
          title="Entre para acessar o Diário de Trabalho"
          subtitle="O registro de horas, sincronização Git e chat em tempo real são protegidos por autenticação."
          onSuccess={(msg) => onFeedback({ type: 'success', text: msg })}
        />
      </div>
    );
  }

  if (!selectedProject) {
    return (
      <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center space-y-3">
        <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
          Nenhum projeto selecionado para a Sala de Trabalho
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Publique um projeto ou selecione uma oportunidade no Marketplace para registrar
          commits e conversar no chat.
        </p>
        <button
          type="button"
          onClick={onGoToMarketplace}
          className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer"
        >
          Ir para o Marketplace
        </button>
      </div>
    );
  }

  const handleFetchGithubCommits = async () => {
    const repo = githubRepoInput.trim();
    if (!repo) return;
    setGithubLoading(true);
    try {
      const data = await fetchGithubCommitsApi(repo);
      if (Array.isArray(data.commits)) {
        setGithubCommits(data.commits);
        onFeedback({
          type: 'success',
          text: `${data.commits.length} commits sincronizados de ${data.repo}.`,
        });
      }
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : 'Erro ao consultar o proxy GitHub no servidor.';
      onFeedback({ type: 'error', text: message });
    } finally {
      setGithubLoading(false);
    }
  };

  const handleLogWorklogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireVerifiedAuth()) return;

    const validation = validateWorklogInput({
      hours: wlHours,
      commitHash: wlCommitHash,
      branchName: wlBranch,
      commitMessage: wlMessage,
    });

    if (validation.ok === false) {
      onFeedback({ type: 'error', text: validation.error });
      return;
    }

    await onLogWorklog(selectedProject, currentUser, validation.data);

    setWlCommitHash('');
    setWlMessage('');

    onPushAlert(
      `Commit ${validation.data.commitHash.slice(0, 8)} (${validation.data.hours}h) registrado no Diário de Trabalho`,
      'commit'
    );
    onFeedback({
      type: 'success',
      text: `Commit ${validation.data.commitHash.slice(0, 8)} e ${validation.data.hours}h registrados no Firestore.`,
    });
  };

  const handleSendChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireVerifiedAuth()) return;
    const text = chatInput.trim();
    if (!text) return;

    setChatInput('');
    await onSendChatMessage(selectedProject, currentUser, text);
    onPushAlert(
      `Nova mensagem de ${currentUser.displayName} em ${selectedProject.title}`,
      'message'
    );
  };

  return (
    <div className="space-y-5">
      {/* Workspace Header & Integrated Time Diary Toolbar */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 lg:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
            <span className="font-semibold text-[var(--primary)]">
              Sala de Trabalho Devana
            </span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span>{selectedProject.category}</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-mono">{selectedProject.repoUrl}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
              {selectedProject.title}
            </h1>
            <select
              aria-label="Trocar projeto na sala de trabalho"
              value={selectedProject.id}
              onChange={(e) => onSelectProject(e.target.value)}
              className="px-3 py-1.5 text-xs bg-[var(--surface-subtle)] border border-[var(--border)] rounded-lg font-medium"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  Trocar: {p.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Compact Time Diary Controls (Stopwatch isolated in feature) */}
        <div className="flex flex-wrap items-center gap-4 pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l border-[var(--border)] lg:pl-6 shrink-0">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-[var(--primary)] shrink-0" />
            <div>
              <span className="text-[11px] font-semibold text-[var(--text-muted)] block">
                Diário de Trabalho
              </span>
              <span className="text-xl font-bold font-mono tabular-nums text-[var(--text-primary)]">
                {formatStopwatchTimer(timerSeconds)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleRunning}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {timerRunning ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pausar</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Contabilizar</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                const hrs = Math.max(0.5, Number((timerSeconds / 3600).toFixed(1)));
                setWlHours(String(hrs));
                onFeedback({
                  type: 'success',
                  text: `${hrs}h transferidas para o registro de entrega.`,
                });
              }}
              className="px-3 py-2 text-xs font-medium text-[var(--primary)] bg-[var(--primary-subtle)] border border-indigo-200 dark:border-indigo-800 rounded-xl whitespace-nowrap shrink-0 cursor-pointer"
            >
              Usar Horas
            </button>
            <button
              type="button"
              aria-label="Reiniciar cronômetro"
              onClick={reset}
              className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-xl cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left 7 Cols: GitHub Sync + Worklog Form + Commit Table */}
        <div className="lg:col-span-7 space-y-5">
          {/* GitHub Commits Sync */}
          <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xs">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-indigo-600 dark:text-sky-400" />
                <span>Conectar Repositório Git (Histórico de Commits)</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Importe commits reais do GitHub para anexar como comprovação técnica no
                Diário de Trabalho.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={githubRepoInput}
                onChange={(e) => setGithubRepoInput(e.target.value)}
                placeholder="proprietario/repositorio (ex: facebook/react)"
                className={`${INPUT_BASE_CLASS} font-mono flex-1`}
              />
              <button
                type="button"
                onClick={handleFetchGithubCommits}
                disabled={githubLoading}
                className="px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${githubLoading ? 'animate-spin' : ''}`}
                />
                <span>{githubLoading ? 'Sincronizando...' : 'Importar Commits'}</span>
              </button>
            </div>

            {githubCommits.length > 0 && (
              <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                {githubCommits.map((c) => (
                  <div
                    key={c.sha}
                    className="p-3 text-xs flex items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-900/40"
                  >
                    <div className="min-w-0">
                      <span className="font-mono font-bold text-indigo-600 dark:text-sky-400 mr-2">
                        {c.sha}
                      </span>
                      <span className="text-slate-700 dark:text-slate-200 truncate">
                        {c.message}
                      </span>
                      <span className="block text-[11px] text-slate-400 mt-0.5">
                        {c.author} · {new Date(c.date).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setWlCommitHash(c.sha);
                        setWlMessage(c.message);
                      }}
                      className="px-2.5 py-1 text-[11px] font-semibold text-indigo-600 dark:text-sky-400 border border-indigo-200 dark:border-indigo-800 rounded-md hover:bg-indigo-50 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Selecionar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Log Hours & Commit Form */}
          <form
            onSubmit={handleLogWorklogSubmit}
            className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xs"
          >
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Registrar Entrega no Diário de Trabalho
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">
                  Horas Trabalhadas
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="24"
                  required
                  value={wlHours}
                  onChange={(e) => setWlHours(e.target.value)}
                  className={`${INPUT_BASE_CLASS} font-mono tabular-nums`}
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">
                  Hash do Commit (SHA)
                </label>
                <input
                  type="text"
                  required
                  minLength={7}
                  maxLength={40}
                  value={wlCommitHash}
                  onChange={(e) => setWlCommitHash(e.target.value)}
                  className={`${INPUT_BASE_CLASS} font-mono`}
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Branch</label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={wlBranch}
                  onChange={(e) => setWlBranch(e.target.value)}
                  className={`${INPUT_BASE_CLASS} font-mono`}
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-slate-500 mb-1">
                Resumo das Alterações Entregues
              </label>
              <input
                type="text"
                required
                minLength={3}
                maxLength={500}
                value={wlMessage}
                onChange={(e) => setWlMessage(e.target.value)}
                className={INPUT_BASE_CLASS}
              />
            </div>

            <button
              type="submit"
              className="px-4 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors inline-flex items-center gap-2 cursor-pointer"
            >
              <GitCommit className="w-4 h-4" />
              <span>Salvar Horas &amp; Commit</span>
            </button>
          </form>

          {/* Worklogs Table */}
          <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                Registros do Diário de Trabalho ({currentWorklogs.length})
              </h3>
              <span className="text-xs font-mono tabular-nums text-indigo-600 dark:text-sky-400 font-bold">
                Total: {currentWorklogs.reduce((acc, w) => acc + w.hours, 0).toFixed(1)}{' '}
                horas
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-900/50">
                    <th className="py-2.5 px-4 font-semibold">Commit</th>
                    <th className="py-2.5 px-4 font-semibold">Branch</th>
                    <th className="py-2.5 px-4 font-semibold">Entrega</th>
                    <th className="py-2.5 px-4 font-semibold">Especialista</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Horas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {currentWorklogs.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-6 px-4 text-center text-xs text-slate-500 dark:text-slate-400"
                      >
                        Nenhuma entrega registrada neste projeto ainda.
                      </td>
                    </tr>
                  ) : (
                    currentWorklogs.map((wl) => (
                      <tr
                        key={wl.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                      >
                        <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-sky-400">
                          {wl.commitHash.slice(0, 8)}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <GitBranch className="w-3 h-3" />
                            {wl.branchName}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-800 dark:text-slate-200">
                          {wl.commitMessage}
                        </td>
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                          {wl.freelancerName}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                          {wl.hours.toFixed(1)} h
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 5 Cols: Devana Real-Time Project Chat */}
        <div className="lg:col-span-5 bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col h-[680px] shadow-2xs sticky top-20 overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-[#2D1B4E] text-white">
            <div className="flex items-center gap-2.5">
              <MessageSquare className="w-4 h-4 text-sky-400" />
              <div>
                <h2 className="text-sm font-bold">Chat em Tempo Real do Projeto</h2>
                <p className="text-[11px] text-indigo-200">
                  Sincronizado via WebSocket ·{' '}
                  <span className="font-mono tabular-nums">
                    {Math.max(1, roomUsers.length)} online agora
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            {currentMessages.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-12">
                Nenhuma mensagem enviada neste projeto ainda.
              </p>
            ) : (
              currentMessages.map((msg) => {
                const isMine = msg.senderId === currentUser.uid;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-1">
                      <span className="font-semibold text-slate-600 dark:text-slate-300">
                        {msg.senderName}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        {new Date(msg.createdAtIso).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                        isMine
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })
            )}
            {typingUser && (
              <p className="text-[11px] italic text-indigo-600 dark:text-sky-400">
                {typingUser} está digitando...
              </p>
            )}
          </div>

          <form
            onSubmit={handleSendChatSubmit}
            className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
          >
            <input
              type="text"
              value={chatInput}
              onChange={(e) => {
                setChatInput(e.target.value);
                onEmitTyping();
              }}
              placeholder="Escreva uma mensagem para o cliente ou especialista..."
              maxLength={1000}
              className={`${INPUT_BASE_CLASS} flex-1`}
            />
            <button
              type="submit"
              className="px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Enviar</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
