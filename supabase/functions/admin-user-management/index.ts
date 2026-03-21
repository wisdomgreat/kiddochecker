
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Ideally restricted to KIDDOCHECKER domain in production
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  isVolunteer?: boolean;
  staffPin?: string;
  department?: string;
  specialties?: string[];
  maxHoursPerWeek?: number;
  staffGroups?: string[];
}

interface UpdateUserRequest {
  userId: string;
  updates: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    role?: string;
    isActive?: boolean;
    isVolunteer?: boolean;
    staffPin?: string;
    department?: string;
    staffGroups?: string[];
    specialties?: string[];
    maxHoursPerWeek?: number;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Get Authentication Context
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

    // Create a regular client to verify the user's identity
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      console.error('User verification failed:', userError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Create admin client for privileged operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // 3. Extract request payload early to check action
    const { action, ...data } = await req.json();
    console.log(`Admin user management action: ${action}`, data);

    // 4. Verify Authorization
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role, is_super_admin')
      .eq('user_id', user.id)
      .single();

    const isAdmin = roleData?.role === 'admin' || roleData?.role === 'super_admin' || roleData?.is_super_admin === true;
    const isStaff = roleData?.role === 'staff' || roleData?.role === 'teacher';

    if (roleError || (!isAdmin && !(isStaff && action === 'create_visitor'))) {
      console.error('Unauthorized access attempt by:', user.id, 'Role:', roleData?.role);
      return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    switch (action) {
      case 'create_visitor':
      case 'create_user': {
        const { email, password, firstName, lastName, phone, role, staffGroups } = data as CreateUserRequest;

        console.log(`Creating user: ${email} with role: ${role}`);

        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: email || `guest_${crypto.randomUUID().substring(0,8)}@kiddochecker.local`,
          password: password || crypto.randomUUID(),
          email_confirm: true,
          user_metadata: {
            first_name: firstName,
            last_name: lastName,
            phone: phone || null
          }
        });

        if (authError) {
          console.error('Auth user creation error:', authError);
          // Return as success: false so it's not a 500
          return new Response(JSON.stringify({
            success: false,
            error: `Auth Error: ${authError.message}`
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (!authData.user) {
          return new Response(JSON.stringify({
            success: false,
            error: 'User creation failed - no user data returned'
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        console.log('User created successfully in Auth:', authData.user.id);

        // We use upsert for profile and role to handle potential race conditions with handle_new_user trigger

        // 1. Profile
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .upsert({
            id: authData.user.id,
            first_name: firstName,
            last_name: lastName,
            phone: phone || null,
            staff_pin: (data as CreateUserRequest).staffPin || null,
            department: (data as CreateUserRequest).department || null,
            specialties: (data as CreateUserRequest).specialties || [],
            max_hours_per_week: (data as CreateUserRequest).maxHoursPerWeek || 40
          }, { onConflict: 'id' });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          // Non-fatal, we continue
        }

        // 2. Role
        const { error: roleError } = await supabaseAdmin
          .from('user_roles')
          .upsert({
            user_id: authData.user.id,
            role: role as any,
            is_super_admin: role === 'super_admin',
            is_volunteer: (data as CreateUserRequest).isVolunteer ?? false,
            verification_status: action === 'create_visitor' ? 'verified' : 'unverified'
          }, { onConflict: 'user_id' });

        if (roleError) {
          console.error('Role assignment error:', roleError);
          return new Response(JSON.stringify({
            success: false,
            error: `Failed to set role: ${roleError.message}`
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Add new staff group memberships if provided
        if (staffGroups && staffGroups.length > 0) {
          const groupRows = staffGroups.map((groupId: string) => ({
            group_id: groupId,
            profile_id: authData.user.id
          }));
          const { error: groupError } = await supabaseAdmin
            .from('staff_group_members')
            .insert(groupRows);
          if (groupError) {
            console.error('Group assignment error:', groupError);
            // This is non-fatal for user creation, but log it.
          }
        }

        return new Response(JSON.stringify({
          success: true,
          user: {
            id: authData.user.id,
            email: authData.user.email,
            first_name: firstName,
            last_name: lastName,
            role: role,
            is_active: true
          },
          message: 'User created successfully'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'update_user': {
        const { userId, updates } = data as UpdateUserRequest;

        if (updates.firstName || updates.lastName || updates.phone || updates.staffPin !== undefined || updates.department !== undefined || updates.specialties !== undefined || updates.maxHoursPerWeek !== undefined) {
          const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({
              first_name: updates.firstName,
              last_name: updates.lastName,
              phone: updates.phone,
              staff_pin: updates.staffPin,
              department: updates.department,
              specialties: updates.specialties,
              max_hours_per_week: updates.maxHoursPerWeek,
            })
            .eq('id', userId);

           if (profileError) {
             console.error('Profile update error:', profileError);
             // If trigger rejected it, we want to return a nice message
             if (profileError.message.includes('Super-Admins')) {
               return new Response(JSON.stringify({
                 success: false,
                 error: profileError.message
               }), {
                 status: 200,
                 headers: { ...corsHeaders, 'Content-Type': 'application/json' },
               });
             }
             throw profileError;
           }
         }

        if (updates.staffGroups !== undefined) {
          // Sync group memberships
          // 1. Remove existing
          await supabaseAdmin
            .from('staff_group_members')
            .delete()
            .eq('profile_id', userId);
          
          // 2. Add new
          if (updates.staffGroups && updates.staffGroups.length > 0) {
            const groupRows = updates.staffGroups.map((groupId: string) => ({
              group_id: groupId,
              profile_id: userId
            }));
            const { error: groupError } = await supabaseAdmin
              .from('staff_group_members')
              .insert(groupRows);
            if (groupError) {
              console.error('Group update error:', groupError);
              throw groupError;
            }
          }
        }

        if (updates.role !== undefined || updates.isVolunteer !== undefined) {
          const roleUpdate: Record<string, any> = {};
          if (updates.role !== undefined) {
            roleUpdate.role = updates.role as any;
            roleUpdate.is_super_admin = updates.role === 'super_admin';
          }
          if (updates.isVolunteer !== undefined) {
            roleUpdate.is_volunteer = updates.isVolunteer;
          }

          const { error: roleError } = await supabaseAdmin
            .from('user_roles')
            .update(roleUpdate)
            .eq('user_id', userId);

          if (roleError) {
            console.error('Role update error:', roleError);
            throw roleError;
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
        if (error) throw error;

        return new Response(JSON.stringify({
          success: true,
          message: 'User deleted successfully'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'resend_welcome_email': {
        const { userId, email, firstName } = data;

        // Generate a new temporary password
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
        const array = new Uint8Array(16);
        crypto.getRandomValues(array);
        const tempPassword = Array.from(array, (byte) => chars[byte % chars.length]).join('');

        // Update user password in Auth
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          password: tempPassword
        });

        if (authError) {
          console.error('Error updating user password for resend:', authError);
          throw authError;
        }

        // Trigger the send-email function
        // Note: Edge functions can't easily call other edge functions via supabaseClient.functions.invoke 
        // without passing the auth context manually or using a fetch.
        // We will return the tempPassword and let the frontend call send-email for now, 
        // to stay consistent with how addStaff does it.
        // POSSIBLY BETTER: Just do the fetch here.

        return new Response(JSON.stringify({
          success: true,
          tempPassword,
          message: 'Password reset and ready for resend'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_users': {
        const { data: users, error } = await supabaseAdmin.rpc('get_users_with_roles');
        if (error) throw error;

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
    console.error('Unexpected error in admin-user-management:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'An unexpected error occurred'
    }), {
      status: 200, // Return 200 even for errors to simplify client handling
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
