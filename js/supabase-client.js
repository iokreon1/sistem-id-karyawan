import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

// Pastikan library supabase tersedia dari CDN di HTML
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default supabase;
