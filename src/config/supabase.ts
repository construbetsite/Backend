import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './env';

// 🔥 CORREÇÃO (R8): cliente com timeout de rede configurado.
// Sem limite, um request pendurado ao banco prende o handler indefinidamente
// e esgota as conexões/concurrência do servidor.
const SUPABASE_TIMEOUT_MS = 10_000; // 10s

export const supabase: SupabaseClient = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    global: {
      headers: { 'x-client-info': 'landingpage-api' },
      // AbortSignal.timeout encerra requests que excederem o limite (Node 18+)
      fetch: (url, init) =>
        fetch(url, { ...init, signal: AbortSignal.timeout(SUPABASE_TIMEOUT_MS) }),
    },
    // Service-role: sem sessão de usuário no servidor — evita overhead desnecessário
    auth: { persistSession: false, autoRefreshToken: false },
  }
);