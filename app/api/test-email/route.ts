import { Resend } from 'resend'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const to = request.nextUrl.searchParams.get('to')

  const diagnostics: Record<string, any> = {
    RESEND_API_KEY_set: !!process.env.RESEND_API_KEY,
    RESEND_API_KEY_prefix: process.env.RESEND_API_KEY?.slice(0, 8) + '...',
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    to_param: to,
  }

  if (!process.env.RESEND_API_KEY) {
    return Response.json({ error: 'RESEND_API_KEY not set', diagnostics }, { status: 500 })
  }

  if (!to) {
    return Response.json({ error: 'Pass ?to=your@email.com', diagnostics })
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const result = await resend.emails.send({
      from: `Rina's Tours and Travels <${process.env.RESEND_FROM_EMAIL || 'noreply@rinastoursandtravels.in'}>`,
      to,
      subject: 'Test Email — Rina\'s Tours and Travels',
      html: '<p>If you see this, Resend is working correctly from Vercel.</p>',
    })

    return Response.json({ success: true, result, diagnostics })
  } catch (error: any) {
    return Response.json({ success: false, error: error?.message, details: error, diagnostics }, { status: 500 })
  }
}
