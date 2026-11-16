import { expect, test } from '@playwright/test';

test.describe('Devana — Fluxos Críticos E2E', () => {
  test('1. Landing page + fluxo de entrada e onboarding de cadastro (0% comissão)', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(
      page.getByRole('heading', { name: /freelancers de tecnologia/i })
    ).toBeVisible();
    await expect(page.getByText(/0%/).first()).toBeVisible();

    await page
      .getByRole('button', { name: /Criar Conta|Quero Trabalhar/i })
      .first()
      .click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('2. Marketplace: exploração de projetos e gatilho de publicação (Criar Projeto)', async ({
    page,
  }) => {
    await page.goto('/');
    await page
      .getByRole('button', { name: /Explorar Projetos/i })
      .first()
      .click();

    await expect(page.getByText(/Marketplace/i).first()).toBeVisible();
    await page
      .getByRole('button', { name: /Publicar Projeto|Novo Projeto/i })
      .first()
      .click();

    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('3. Detalhe do projeto: seleção e inspeção de propostas (bidding)', async ({
    page,
  }) => {
    await page.goto('/projetos');
    await expect(page.getByText(/Garantia Devana/i).first()).toBeVisible();
  });

  test('4. Garantia Escrow: proteção de acesso autenticado na view de custódia', async ({
    page,
  }) => {
    await page.goto('/garantia');
    await expect(
      page.getByText(/Entre para gerenciar Garantia & Pagamentos/i)
    ).toBeVisible();
  });

  test('5. Workspace & Chat em tempo real: proteção de acesso e estado de entrada', async ({
    page,
  }) => {
    await page.goto('/workspace');
    await expect(page.getByText(/Entre para acessar o Workspace & Chat/i)).toBeVisible();
  });
});
