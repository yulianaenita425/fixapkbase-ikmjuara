import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Definisikan interface agar TypeScript tidak bingung
interface WebhookPayload {
  record: {
    nama_lengkap: string;
    nama_usaha: string;
    no_hp: string;
  };
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req: Request) => {
  try {
    const { record }: WebhookPayload = await req.json()

    const { nama_lengkap, nama_usaha, no_hp } = record

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Sistem IKM Juara <onboarding@resend.dev>',
        to: ['yulianaenita425@gmail.com'], // GANTI dengan email Anda
        subject: `🚨 PENDAFTAR BARU: ${nama_usaha}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2>Ada Pendaftaran IKM Baru!</h2>
            <p><strong>Nama Pemilik:</strong> ${nama_lengkap}</p>
            <p><strong>Nama Usaha:</strong> ${nama_usaha}</p>
            <p><strong>WhatsApp:</strong> ${no_hp}</p>
            <br>
            <p>Segera cek dashboard admin untuk verifikasi data.</p>
          </div>
        `,
      }),
    })

    const data = await res.json()
    return new Response(JSON.stringify(data), { 
      status: 200, 
      headers: { "Content-Type": "application/json" } 
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
})