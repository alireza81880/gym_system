/**
 * Gym OS - Desktop License Client Configuration
 * 
 * Defines standard client-side Supabase connection parameters for Desktop Runtime.
 * 
 * SECURITY DIRECTIVE:
 * ONLY standard, public/publishable client parameters (SUPABASE_URL and SUPABASE_ANON_KEY)
 * are stored here.
 * NEVER place, import, or bundle:
 * - SUPABASE_SERVICE_ROLE_KEY
 * - LICENSE_SERVICE_KEY
 * - ED25519_PRIVATE_KEY
 * or any administrative secret keys in this file or any desktop client module.
 */

const LICENSE_CONFIG = Object.freeze({
  // Default public production Supabase project URL
  SUPABASE_URL: 'https://nljscutjnbioyesaklce.supabase.co',

  // Default publishable anon client key (grants public/anon role only, subject to RLS)
  SUPABASE_ANON_KEY: 'sb_publishable_pZfmbSQ5INwCY2JpPXZd9A_zH0OBLTZ',
});

module.exports = LICENSE_CONFIG;
