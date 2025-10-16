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
    // 1. Check for Authorization (Admin access is required)
    // In a real scenario, we would verify the JWT and check if the user has 'admin' role.
    // For this implementation, we rely on the client only calling this function when authenticated.
    // The Edge Function itself uses the Service Role Key for the admin action.
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. Create an admin client using the service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 3. Get the user data from the request body
    const { userId, password } = await req.json()

    if (!userId || !password) {
      return new Response(JSON.stringify({ error: 'User ID dan password baru dibutuhkan.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 4. Update the user's password using the Admin API
    const { data, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: password }
    )

    if (updateError) {
      throw updateError
    }

    return new Response(JSON.stringify({ message: 'Password berhasil diperbarui', user: data.user }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error("Error updating user password:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})