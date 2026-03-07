/**
 * childrenService — Centralised data-access layer for child records.
 * All hooks that need to read/write children should call through here,
 * keeping Supabase schema knowledge in one place.
 */
import { supabase } from '@/integrations/supabase/client';
import type { Child } from '@/hooks/useChildren';

export const childrenService = {
  /** Fetch all children (admin/staff view). */
  async getAll(): Promise<Child[]> {
    const { data, error } = await supabase
      .from('children')
      .select('*')
      .order('first_name');
    if (error) throw error;
    return data ?? [];
  },

  /** Fetch children belonging to a specific parent. */
  async getByParent(parentId: string): Promise<Child[]> {
    const { data, error } = await supabase
      .from('children')
      .select('*')
      .eq('parent_id', parentId)
      .order('first_name');
    if (error) throw error;
    return data ?? [];
  },

  /** Create a new child record linked to a parent. */
  async create(
    parentId: string,
    childData: Omit<Child, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Child> {
    const { data, error } = await supabase
      .from('children')
      .insert({ ...childData, parent_id: parentId })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /** Update an existing child record. */
  async update(
    childId: string,
    updates: Partial<Omit<Child, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<Child> {
    const { data, error } = await supabase
      .from('children')
      .update(updates)
      .eq('id', childId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /** Delete a child record. */
  async delete(childId: string): Promise<void> {
    const { error } = await supabase
      .from('children')
      .delete()
      .eq('id', childId);
    if (error) throw error;
  },

  /** Fetch a single child's medical profile. */
  async getMedicalProfile(childId: string) {
    const { data, error } = await (supabase as any)
      .from('child_medical_profiles')
      .select('*')
      .eq('child_id', childId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  /** Upsert a child's medical profile. */
  async upsertMedicalProfile(childId: string, profile: Record<string, unknown>) {
    const { data, error } = await (supabase as any)
      .from('child_medical_profiles')
      .upsert({ ...profile, child_id: childId }, { onConflict: 'child_id' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};
