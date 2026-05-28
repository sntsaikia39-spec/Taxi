import { readFile } from 'fs/promises'
import path from 'path'

import { requireAdminRequest } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

function parseCarModelCsv(csv: string): string[] {
  const lines = csv
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length === 0) return []

  const rawValues = lines
    .slice(1)
    .map((line) => line.replace(/^"|"$/g, '').trim())
    .filter(Boolean)

  return Array.from(new Set(rawValues)).sort((a, b) => a.localeCompare(b, 'en-IN'))
}

export async function GET(request: Request) {
  const unauthorized = requireAdminRequest(request)
  if (unauthorized) return unauthorized

  try {
    const filePath = path.join(process.cwd(), 'app', 'assets', 'Car_names.csv')
    const csv = await readFile(filePath, 'utf8')
    const models = parseCarModelCsv(csv)

    return Response.json({ success: true, models })
  } catch (error) {
    console.error('Error loading car model library:', error)
    return Response.json(
      { success: false, error: 'Failed to load car model library' },
      { status: 500 }
    )
  }
}
