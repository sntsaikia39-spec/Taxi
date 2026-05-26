import { NextRequest, NextResponse } from 'next/server'
import { scanSystemConflicts } from '@/lib/conflicts'
import { requireAdminRequest } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/conflicts
 *
 * Reports:
 * - assignment_conflicts: same physical car assigned to overlapping active
 *   bookings, or one booking assigned to multiple vehicles at overlapping times
 * - model_conflicts: true simultaneous model over-subscription, using assigned
 *   cars' actual models and unassigned bookings' requested models
 */
export async function GET(request: NextRequest) {
  const unauthorized = requireAdminRequest(request)
  if (unauthorized) return unauthorized

  try {
    const conflicts = await scanSystemConflicts()
    return NextResponse.json({ success: true, ...conflicts })
  } catch (error) {
    console.error('Conflict detection error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
