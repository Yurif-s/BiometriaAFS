export const TIME_ZONE = 'America/Fortaleza';

function paraDateNoFuso(value) {
  if (value instanceof Date) return value;
  if (typeof value !== 'string') return new Date(value);

  const texto = value.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
    return new Date(`${texto}T00:00:00-03:00`);
  }

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?$/.test(texto)) {
    return new Date(`${texto}-03:00`);
  }

  return new Date(texto);
}

export function dataBR(value = new Date()) {
  const date = paraDateNoFuso(value);
  if (!Number.isFinite(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const part = (type) => parts.find(p => p.type === type).value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function horarioBR(value, options = {}) {
  const date = paraDateNoFuso(value);
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', ...options,
    timeZone: TIME_ZONE, hourCycle: 'h23',
  });
}

export function dataHoraBR(value) {
  const date = paraDateNoFuso(value);
  return date.toLocaleString('pt-BR', { timeZone: TIME_ZONE });
}

// datetime-local não contém fuso. Seus campos representam o horário da escola.
export function paraInputDataHora(value) {
  const date = paraDateNoFuso(value);
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
