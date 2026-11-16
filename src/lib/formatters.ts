import { Timestamp } from 'firebase/firestore';

export function formatCurrencyBrl(value: number, fractionDigits = 0): string {
  return `R$ ${value.toLocaleString('pt-BR', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })}`;
}

export function formatHours(hours: number): string {
  return `${hours.toFixed(1)} h`;
}

export function formatTimeHm(isoDate: string): string {
  return new Date(isoDate).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateShort(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('pt-BR');
}

export function formatStopwatchTimer(totalSec: number): string {
  const safe = Math.max(0, Math.floor(totalSec));
  const hrs = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function formatTimestampToIso(val: unknown): string {
  if (!val) return new Date().toISOString();
  if (val instanceof Timestamp) {
    return val.toDate().toISOString();
  }
  if (typeof val === 'string') return val;
  return new Date().toISOString();
}
