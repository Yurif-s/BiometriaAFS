export const TIME_ZONE = 'America/Fortaleza';

export function dataBR(value = new Date()) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const part = (type) => parts.find(p => p.type === type).value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function horarioBR(value, options = {}) {
  return new Date(value).toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', ...options,
    timeZone: TIME_ZONE, hourCycle: 'h23',
  });
}

export function dataHoraBR(value) {
  return new Date(value).toLocaleString('pt-BR', { timeZone: TIME_ZONE });
}

// datetime-local não contém fuso. Seus campos representam o horário da escola.
export function paraInputDataHora(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  return `${dataBR(date)}T${horarioBR(date)}.${String(date.getUTCMilliseconds()).padStart(3, '0')}`;
}

export function deInputDataHora(value) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?$/.test(value)) {
    throw new Error('Informe uma data e um horário válidos.');
  }
  const date = new Date(`${value}-03:00`);
  if (!Number.isFinite(date.getTime()) || dataBR(date) !== value.slice(0, 10)) {
    throw new Error('Informe uma data e um horário válidos.');
  }
  return date.toISOString();
}
