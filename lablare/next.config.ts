import type { NextConfig } from 'next';

const isProd = process.env.NODE_ENV === 'production';

// CSP em modo Report-Only (P2.E fase 1).
//
// O header NÃO bloqueia nada — apenas instrui o browser a reportar
// violações em /api/csp-report. Permanecemos em Report-Only por algumas
// semanas com tráfego real para mapear o que precisa ser ajustado antes
// de promover para enforcing (sem o sufixo -Report-Only).
//
// Permissivo onde Next/Tailwind/Recharts exigem:
//   - 'unsafe-inline' em script-src e style-src: Next gera scripts e
//     estilos inline (Tailwind 4 também). Sem nonces, é necessário.
//   - 'unsafe-eval' em script-src: hot-reload em dev e algumas libs (leaflet
//     internamente faz eval em casos isolados). Em prod podemos remover
//     na promoção a enforcing.
//   - data:/blob: em img-src: next/image, leaflet tiles e exports PDF.
//   - https: em connect-src: futuras integrações (Sentry, etc).
const cspReportOnly = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https:",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  'report-uri /api/csp-report',
].join('; ');

// Headers de segurança aplicados a todas as rotas (inclusive /api).
const securityHeaders = [
  // Anti-clickjacking
  { key: 'X-Frame-Options', value: 'DENY' },
  // Anti MIME-sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Limita o que vai no header Referer ao navegar entre origens
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Restringe APIs do browser. geolocation=(self) preserva o botão
  // "Localizar-me" do MapComponent (Leaflet).
  {
    key: 'Permissions-Policy',
    value:
      'camera=(), microphone=(), geolocation=(self), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()',
  },
  // CSP em modo observação. Não bloqueia — apenas reporta violações.
  // Promover para 'Content-Security-Policy' (enforcing) após 2-4 semanas
  // de tráfego real sem violações inesperadas.
  { key: 'Content-Security-Policy-Report-Only', value: cspReportOnly },
  // HSTS apenas em produção (browsers ignoram em http://localhost mesmo,
  // mas ser explícito evita pegadinhas se algum dev rodar HTTPS local).
  ...(isProd
    ? [
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload',
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  webpack(config) {
    // regra para importar .svg como componente
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ['@svgr/webpack'],
    });
    return config;
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        // Assets estáticos em public/assets/ (logo, ícones, imagens). Cache
        // moderado de 1 dia: arquivos raramente mudam, mas como não temos
        // hash no filename, evitamos imutabilidade + ano para não engessar.
        source: '/assets/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, must-revalidate' },
        ],
      },
      {
        // APIs retornam dados dinâmicos e/ou sensíveis. Nunca devem ser
        // cacheadas por browser, proxy ou CDN. Defesa em profundidade.
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
        ],
      },
    ];
  },
};

export default nextConfig;
