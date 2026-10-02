import { supabase } from './supabase'

export type AdminFlock = { id: string; name: string; owner_id: string }
export type AdminUser = { user_id: string; display_name: string }

export async function listAdminFlocks(): Promise<AdminFlock[]> {
  const { data, error } = await supabase
    .from('flocks')
    .select('id, name, owner_id')
    .order('name', { ascending: true })
  if (error) throw error
  return data
}

export async function listAdminUsers(): Promise<AdminUser[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, display_name')
    .order('display_name', { ascending: true })
  if (error) throw error
  return data
}

export async function deleteAdminFlock(flockId: string): Promise<void> {
  const { error } = await supabase.from('flocks').delete().eq('id', flockId)
  if (error) throw error
}
