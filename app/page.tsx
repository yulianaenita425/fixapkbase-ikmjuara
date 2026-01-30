'use client'
import { useEffect } from 'react'
// import { supabase } from '@/lib/supabaseClient'

export default function Home() {
  useEffect(() => {
    // const testConnection = async () => {
    //   const { data, error } = await supabase.from('ikm_binaan').select('*').limit(1)
    //   console.log('DATA:', data)
    //   console.log('ERROR:', error)
    // }
    // testConnection()
  }, [])

  return (
    <div className="p-10 text-xl font-bold">
      Database IKM JUARA Terhubung 🚀
    </div>
  )
}