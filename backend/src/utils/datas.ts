import { BadRequestException } from '@nestjs/common';

// A frequência escolar usa o horário do Ceará (UTC-3), independentemente do servidor.
export const TIME_ZONE = 'America/Fortaleza';

export function dataBR(data = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(data);
  const part = (type: string) => parts.find(p => p.type === type)!.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function validarData(data: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    throw new BadRequestException('Data deve estar no formato YYYY-MM-DD.');
  }
  const parsed = new Date(`${data}T12:00:00Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== data) {
    throw new BadRequestException('Data inválida.');
  }
  return data;
}

export function inicioDoDiaBR(data: string | Date = new Date()): Date {
  const dia = typeof data === 'string' ? validarData(data) : dataBR(data);
  return new Date(`${dia}T00:00:00-03:00`);
}

export function fimDoDiaBR(data: string | Date = new Date()): Date {
  return new Date(inicioDoDiaBR(data).getTime() + 86_400_000 - 1);
}

export function adicionarDiasBR(data: Date, dias: number): Date {
  return new Date(inicioDoDiaBR(data).getTime() + dias * 86_400_000);
}

export function horarioBR(data: Date, segundos = false): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit',
    ...(segundos ? { second: '2-digit' as const } : {}), hourCycle: 'h23',
  }).format(data);
}

export function horarioNoDiaBR(data: Date, horario: string): Date {
  return new Date(`${dataBR(data)}T${horario}-03:00`);
}

export function interpretarHorario(value: string | Date): Date {
  if (value instanceof Date) {
    if (!Number.isFinite(value.getTime())) throw new BadRequestException('Horário inválido.');
    return new Date(value);
  }
  // Datas sem hora e horários sem offset são interpretados no fuso da escola.
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return inicioDoDiaBR(value);
  validarData(value.slice(0, 10));
  if (!/^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d(:[0-5]\d(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})?$/.test(value)) {
    throw new BadRequestException('Horário inválido.');
  }
  const date = new Date(/(Z|[+-]\d{2}:\d{2})$/.test(value) ? value : `${value}-03:00`);
  if (!Number.isFinite(date.getTime())) throw new BadRequestException('Horário inválido.');
  return date;
}
