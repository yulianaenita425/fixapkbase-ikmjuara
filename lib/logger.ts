// lib/logger.ts
import { supabase } from "./supabaseClient"

export const saveLog = async (username: string, role: string, description: string, actionType: string) => {
  const { error } = await supabase
    .from("activity_logs")
    .insert([
      { 
        username, 
        role, 
        description, 
        action_type: actionType, // 'input', 'edit', 'hapus', 'login'
        created_at: new Date().toISOString() 
      }
    ])
  if (error) console.error("Gagal menyimpan log:", error)
}