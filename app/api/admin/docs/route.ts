import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function GET() {
  try {
    const content = readFileSync(join(process.cwd(), 'app docs.md'), 'utf-8')
    return NextResponse.json({ content })
  } catch {
    return NextResponse.json({ error: 'Documentation file not found' }, { status: 404 })
  }
}
