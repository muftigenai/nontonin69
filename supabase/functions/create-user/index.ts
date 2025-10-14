import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Membuat Supabase admin client yang memiliki hak akses penuh
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { email, password, full_name, role } = await req.json()

    if (!email || !password || !full_name || !role) {
      return new Response(JSON.stringify({ error: 'Data yang dikirim tidak lengkap' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 1. Membuat pengguna di sistem autentikasi Supabase
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Langsung konfirmasi email pengguna
      user_metadata: { full_name },
    })

    if (authError) {
      throw authError
    }

    const user = authData.user;
    if (!user) {
        throw new Error("Gagal membuat pengguna di sistem autentikasi.")
    }

    // 2. Memperbarui profil pengguna dengan nama lengkap dan peran yang sesuai
    // Trigger 'handle_new_user' akan membuat profil dasar, lalu kita perbarui di sini.
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ full_name, role })
      .eq('id', user.id)

    if (profileError) {
      // Jika pembaruan profil gagal, idealnya pengguna auth dihapus untuk konsistensi.
      // Untuk saat ini, kita laporkan errornya.
      throw profileError
    }

    return new Response(JSON.stringify({ message: 'Pengguna berhasil dibuat', user }), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})