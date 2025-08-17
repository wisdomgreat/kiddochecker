
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
}

interface UpdateUserRequest {
  userId: string;
  updates: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    role?: string;
    isActive?: boolean;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { action, ...data } = await req.json();
    console.log(`Admin user management action: ${action}`, data);

    switch (action) {
      case 'create_user': {
        const { email, password, firstName, lastName, phone, role } = data as CreateUserRequest;

        // Create user with admin client
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            first_name: firstName,
            last_name: lastName,
            phone: phone || null
          }
        });

        if (authError) {
          console.error('Auth user creation error:', authError);
          throw new Error(`Failed to create user: ${authError.message}`);
        }

        if (!authData.user) {
          throw new Error('User creation failed - no user data returned');
        }

        console.log('User created successfully:', authData.user.id);

        // Create profile
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .upsert({
            id: authData.user.id,
            first_name: firstName,
            last_name: lastName,
            phone: phone || null
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
        }

        // Assign role
        const { error: roleError } = await supabaseAdmin
          .from('user_roles')
          .upsert({
            user_id: authData.user.id,
            role: role as any,
            is_super_admin: role === 'super_admin'
          });

        if (roleError) {
          console.error('Role assignment error:', roleError);
          throw new Error(`Failed to assign role: ${roleError.message}`);
        }

        return new Response(JSON.stringify({ 
          success: true, 
          user: {
            id: authData.user.id,
            email: authData.user.email,
            first_name: firstName,
            last_name: lastName,
            role: role,
            is_super_admin: role === 'super_admin',
            is_active: true
          },
          message: 'User created successfully'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'update_user': {
        const { userId, updates } = data as UpdateUserRequest;

        // Update profile if needed
        if (updates.firstName || updates.lastName || updates.phone) {
          const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({
              first_name: updates.firstName,
              last_name: updates.lastName,
              phone: updates.phone,
            })
            .eq('id', userId);

          if (profileError) {
            console.error('Profile update error:', profileError);
            throw new Error(`Failed to update profile: ${profileError.message}`);
          }
        }

        // Update role if needed
        if (updates.role) {
          const { error: roleError } = await supabaseAdmin
            .from('user_roles')
            .update({
              role: updates.role as any,
              is_super_admin: updates.role === 'super_admin'
            })
            .eq('user_id', userId);

          if (roleError) {
            console.error('Role update error:', roleError);
            throw new Error(`Failed to update role: ${roleError.message}`);
          }
        }

        return new Response(JSON.stringify({ 
          success: true,
          message: 'User updated successfully'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'delete_user': {
        const { userId } = data;

        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (error) {
          console.error('User deletion error:', error);
          throw new Error(`Failed to delete user: ${error.message}`);
        }

        return new Response(JSON.stringify({ 
          success: true,
          message: 'User deleted successfully'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_users': {
        const { data: users, error } = await supabaseAdmin.rpc('get_users_with_roles');
        
        if (error) {
          console.error('Error fetching users:', error);
          throw new Error(`Failed to fetch users: ${error.message}`);
        }

        return new Response(JSON.stringify({ 
          success: true,
          users: users || []
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error: any) {
    console.error('Error in admin-user-management function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || 'An unexpected error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
