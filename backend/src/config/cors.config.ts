// backend/src/config/cors.config.ts
// Fonte única da política de CORS, usada tanto pelo HTTP (main.ts)
// quanto pelo WebSocket (gateways/biometria.gateway.ts).

export function getAllowedOrigins(): string[] {
  const allowedOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map((url) => url.trim())
    : ['http://localhost:5173'];

  // Sempre incluir a URL do Vercel em produção
  const vercelUrlWithHyphen = 'https://biometria-afs.vercel.app';
  const vercelUrlNoHyphen = 'https://biometriaafs.vercel.app';
  // Origem do site onde a extensão é injetada
  const seducOrigin = 'https://professor.seduc.ce.gov.br';

  for (const origin of [vercelUrlWithHyphen, vercelUrlNoHyphen, seducOrigin]) {
    if (!allowedOrigins.includes(origin)) {
      allowedOrigins.push(origin);
    }
  }

  return allowedOrigins;
}

export function corsOriginValidator(
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void,
): void {
  // Permitir requests sem origin (ex: extensões, curl, mobile)
  if (!origin) {
    return callback(null, true);
  }

  // Permitir chrome-extension:// origins
  if (origin.startsWith('chrome-extension://')) {
    return callback(null, true);
  }

  if (getAllowedOrigins().includes(origin)) {
    return callback(null, true);
  }

  callback(new Error(`Origin ${origin} não permitida pelo CORS`));
}
