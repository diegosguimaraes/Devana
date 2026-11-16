// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
} from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Button, Modal } from '../../components/ui';
import { getEscrowTimelineSteps } from '../../hooks/useEscrow';
import type { ActiveUserProfileData, AppBid, AppProject } from '../../types/domain';
import { EscrowView } from '../escrow/components/EscrowView';
import { useProjectFilters } from '../projects/hooks/useProjects';

afterEach(() => {
  cleanup();
});

const SAMPLE_USER: ActiveUserProfileData = {
  uid: 'owner_1',
  displayName: 'Marina Silva',
  roleType: 'client',
  specialty: 'Produto & Arquitetura',
  hourlyRate: 0,
  githubUsername: 'marinasilva',
  bio: 'Contratante Devana',
  avatarUrl: '/src/assets/images/avatar_client_1_1794833038783.jpg',
  reputationScore: 5,
  completedProjects: 3,
  isAvailableForHire: false,
  isVerifiedAuth: true,
};

const SAMPLE_PROJECTS: AppProject[] = [
  {
    id: 'proj_api',
    title: 'Gateway de Pagamentos PIX',
    description: 'Implementação de webhooks PIX e conciliação bancária.',
    category: 'Backend & APIs',
    budget: 4500,
    deadlineDays: 14,
    repoUrl: 'https://github.com/devana/pix-gateway',
    ownerId: 'owner_1',
    ownerName: 'Marina Silva',
    assignedFreelancerId: 'dev_1',
    assignedFreelancerName: 'Lucas Andrade',
    status: 'in_progress',
    escrowStatus: 'funded',
    createdAtIso: '2026-11-10T10:00:00Z',
  },
  {
    id: 'proj_ui',
    title: 'Design System React 19',
    description: 'Biblioteca acessível WCAG AA com Tailwind v4.',
    category: 'Frontend & UI',
    budget: 2800,
    deadlineDays: 10,
    repoUrl: '',
    ownerId: 'owner_2',
    ownerName: 'Carlos Mendes',
    assignedFreelancerId: '',
    assignedFreelancerName: '',
    status: 'open',
    escrowStatus: 'unfunded',
    createdAtIso: '2026-11-12T10:00:00Z',
  },
];

const SAMPLE_BIDS: Record<string, AppBid[]> = {
  proj_api: [],
  proj_ui: [],
};

describe('Devana UI Primitives & Critical Hooks', () => {
  it('renders Button loading state with aria-busy and disabled interaction', () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Publicar Projeto
      </Button>
    );

    const btn = screen.getByRole('button', { name: /Publicar Projeto/i });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'true');
    fireEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('closes Modal dialog when pressing Escape and exposes aria-modal', () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="Nova Proposta Técnica">
        <p>Conteúdo do modal acessível</p>
      </Modal>
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('computes Escrow timeline steps accurately for funded, released, and refunded states', () => {
    const funded = getEscrowTimelineSteps('funded');
    expect(funded.map((s) => s.done)).toEqual([true, true, false]);

    const released = getEscrowTimelineSteps('released');
    expect(released.map((s) => s.done)).toEqual([true, true, true]);

    const refunded = getEscrowTimelineSteps('refunded');
    expect(refunded.map((s) => s.key)).toEqual(['unfunded', 'funded', 'refunded']);
    expect(refunded.every((s) => s.done)).toBe(true);
  });

  it('filters and resets projects dynamically with useProjectFilters', () => {
    const { result } = renderHook(() => {
      const [search, setSearch] = React.useState('');
      return {
        search,
        setSearch,
        ...useProjectFilters(SAMPLE_PROJECTS, SAMPLE_BIDS, search, setSearch),
      };
    });

    expect(result.current.filteredProjects).toHaveLength(2);

    act(() => {
      result.current.setCategoryFilter('Frontend & UI');
    });
    expect(result.current.filteredProjects).toHaveLength(1);
    expect(result.current.filteredProjects[0]?.id).toBe('proj_ui');

    act(() => {
      result.current.setCategoryFilter('Todos');
      result.current.setSearch('PIX');
    });
    expect(result.current.filteredProjects).toHaveLength(1);
    expect(result.current.filteredProjects[0]?.id).toBe('proj_api');

    act(() => {
      result.current.clearProjectFilters();
    });
    expect(result.current.search).toBe('');
    expect(result.current.hasActiveFilters).toBe(false);
  });

  it('triggers Escrow release callback only for authenticated project owner', () => {
    const onRelease = vi.fn(async () => {});
    const onFeedback = vi.fn();

    render(
      <EscrowView
        currentUser={SAMPLE_USER}
        selectedProject={SAMPLE_PROJECTS[0]!}
        currentReviews={[]}
        allReviews={[]}
        requireVerifiedAuth={() => true}
        onReleaseEscrow={onRelease}
        onSubmitReview={async () => 'rev_1'}
        onGoToMarketplace={() => {}}
        onFeedback={onFeedback}
      />
    );

    const releaseBtn = screen.getByRole('button', {
      name: /Aprovar Entrega & Liberar/i,
    });
    fireEvent.click(releaseBtn);
    expect(onRelease).toHaveBeenCalledTimes(1);
  });
});
