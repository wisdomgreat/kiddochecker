
import { supabase } from "@/integrations/supabase/client";

export class SecurityGroupService {
    static async getGroups() {
        const { data, error } = await supabase
            .from('security_groups')
            .select(`
                *,
                group_permissions (
                    permissions (name)
                )
            `);
        if (error) throw error;
        return data;
    }

    static async getUserGroups(userId: string) {
        const { data, error } = await supabase
            .from('user_security_groups')
            .select('group_id')
            .eq('user_id', userId);
        if (error) throw error;
        return data.map(g => g.group_id);
    }

    static async assignUserToGroup(userId: string, groupId: string) {
        const { error } = await supabase
            .from('user_security_groups')
            .insert({ user_id: userId, group_id: groupId });
        if (error) throw error;
        return true;
    }

    static async removeUserFromGroup(userId: string, groupId: string) {
        const { error } = await supabase
            .from('user_security_groups')
            .delete()
            .eq('user_id', userId)
            .eq('group_id', groupId);
        if (error) throw error;
        return true;
    }

    static async getGroupMembers(groupId: string) {
        const { data, error } = await supabase
            .from('user_security_groups')
            .select(`
                user_id,
                profiles:profiles (
                    first_name,
                    last_name,
                    email
                )
            `)
            .eq('group_id', groupId);
        if (error) throw error;
        return data;
    }
}
