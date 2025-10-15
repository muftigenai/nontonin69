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
    // 1. Create an admin client using the service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 2. Get the user data from the request body
    const { email, password, full_name, role } = await req.json()

    if (!email || !password || !full_name || !role) {
      return new Response(JSON.stringify({ error: 'Email, password, nama lengkap, dan peran dibutuhkan.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 3. Create the user in Supabase Auth
    const { data: { user }, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // The user is automatically confirmed
    })

    if (createError) {
      throw createError
    }
    if (!user) {
      throw new Error("Gagal membuat pengguna.")
    }

    // 4. The `handle_new_user` trigger has already created a profile.
    //    Now, update it with the full name and the selected role.
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ full_name, role })
      .eq('id', user.id)

    if (profileError) {
      // Log the error, but don't fail the whole request as the auth user was created.
      console.error(`Gagal memperbarui profil untuk pengguna ${user.id}:`, profileError)
    }

    return new Response(JSON.stringify({ user }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})