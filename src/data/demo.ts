import { supabase } from './supabase'

export async function initializeDemoWorkspace() {
  const { error } = await supabase.rpc('initialize_demo_workspace')

  if (error) {
    throw error
  }
}
