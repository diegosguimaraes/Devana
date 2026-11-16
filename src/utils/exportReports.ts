export interface ExportProjectMetric {
  id: string;
  title: string;
  category: string;
  budget: number;
  status: string;
  escrowStatus: string;
  ownerName: string;
  assignedFreelancerName: string;
}

export interface ExportWorklogEntry {
  id: string;
  projectTitle: string;
  freelancerName: string;
  hours: number;
  commitHash: string;
  branchName: string;
  commitMessage: string;
  createdAtIso: string;
}

export function exportMetricsToCsv(
  projects: ExportProjectMetric[],
  worklogs: ExportWorklogEntry[]
): void {
  const headers = [
    'Tipo',
    'Projeto',
    'Categoria_Branch',
    'Responsavel',
    'Valor_BRL_ou_Horas',
    'Status_ou_CommitSHA',
    'Escrow_ou_Mensagem',
  ];

  const escapeCsvCell = (val: string | number) => {
    const str = String(val ?? '').replace(/"/g, '""');
    // Prevent CSV Formula Injection
    const safeStr = /^[=+\-@]/.test(str) ? `'${str}` : str;
    return `"${safeStr}"`;
  };

  const rows: string[] = [headers.join(',')];

  for (const p of projects) {
    rows.push(
      [
        escapeCsvCell('PROJETO'),
        escapeCsvCell(p.title),
        escapeCsvCell(p.category),
        escapeCsvCell(p.assignedFreelancerName || p.ownerName),
        escapeCsvCell(`R$ ${p.budget.toFixed(2)}`),
        escapeCsvCell(p.status),
        escapeCsvCell(`Escrow: ${p.escrowStatus} (Taxa 0%)`),
      ].join(',')
    );
  }

  for (const w of worklogs) {
    rows.push(
      [
        escapeCsvCell('COMMIT_WORKLOG'),
        escapeCsvCell(w.projectTitle),
        escapeCsvCell(w.branchName),
        escapeCsvCell(w.freelancerName),
        escapeCsvCell(`${w.hours.toFixed(1)}h`),
        escapeCsvCell(w.commitHash),
        escapeCsvCell(w.commitMessage),
      ].join(',')
    );
  }

  const csvContent = '\uFEFF' + rows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `devana-relatorio-metricas-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function exportMetricsToPdf(
  projects: ExportProjectMetric[],
  worklogs: ExportWorklogEntry[],
  summary: {
    totalEscrowBrl: number;
    totalHours: number;
    totalCommits: number;
    averageRating: number;
    checksumSha256: string;
  }
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const margin = 40;
  let y = 48;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Devana — Relatorio Executivo de Engenharia & Custodia', margin, y);

  y += 20;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(90, 100, 115);
  doc.text(
    `Gerado em: ${new Date().toLocaleString('pt-BR')}  |  Taxa da Plataforma: 0% (100% Gratuito)`,
    margin,
    y
  );

  y += 16;
  doc.text(`Integridade SHA-256: ${summary.checksumSha256.slice(0, 48)}...`, margin, y);

  y += 26;
  doc.setDrawColor(220, 225, 230);
  doc.line(margin, y, 555, y);

  y += 22;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('1. Indicadores Consolidados de Desempenho', margin, y);

  y += 18;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(
    `Volume em Custodia (Escrow): R$ ${summary.totalEscrowBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    margin,
    y
  );
  y += 15;
  doc.text(
    `Horas de Engenharia Auditadas: ${summary.totalHours.toFixed(1)} horas`,
    margin,
    y
  );
  y += 15;
  doc.text(`Commits Vinculados a Entregas: ${summary.totalCommits} commits`, margin, y);
  y += 15;
  doc.text(
    `Indice de Reputacao Verificada: ${summary.averageRating.toFixed(2)} / 5.00`,
    margin,
    y
  );

  y += 26;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('2. Projetos & Contratos de Custodia', margin, y);

  y += 18;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  for (const p of projects.slice(0, 12)) {
    if (y > 760) {
      doc.addPage();
      y = 48;
    }
    doc.setFont('helvetica', 'bold');
    doc.text(
      `• ${p.title.slice(0, 58)} (${p.category}) — R$ ${p.budget.toLocaleString('pt-BR')}`,
      margin,
      y
    );
    y += 13;
    doc.setFont('helvetica', 'normal');
    doc.text(
      `   Status: ${p.status.toUpperCase()} | Escrow: ${p.escrowStatus.toUpperCase()} | Especialista: ${p.assignedFreelancerName || 'Aberto a propostas'}`,
      margin,
      y
    );
    y += 16;
  }

  y += 12;
  if (y > 720) {
    doc.addPage();
    y = 48;
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('3. Historico de Commits & Monitoramento de Horas', margin, y);

  y += 18;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  for (const w of worklogs.slice(0, 15)) {
    if (y > 760) {
      doc.addPage();
      y = 48;
    }
    doc.text(
      `[${w.commitHash.slice(0, 8)}] (${w.branchName}) ${w.hours.toFixed(1)}h — ${w.freelancerName}: ${w.commitMessage.slice(0, 65)}`,
      margin,
      y
    );
    y += 14;
  }

  doc.save(`devana-relatorio-executivo-${new Date().toISOString().slice(0, 10)}.pdf`);
}
