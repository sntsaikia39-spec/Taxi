import { readFileSync } from 'fs'
import { join } from 'path'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const changelogPath = join(process.cwd(), 'changelog.md')
    const content = readFileSync(changelogPath, 'utf-8')

    // Parse markdown to extract changelog entries
    const entries = parseChangelog(content)

    return NextResponse.json({
      success: true,
      entries: entries,
      lastUpdated: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error reading changelog:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to read changelog',
        entries: [],
      },
      { status: 500 }
    )
  }
}

interface ChangelogEntry {
  date: string
  hash?: string
  author?: string
  changes: string[]
  fullText: string
}

function parseChangelog(content: string): ChangelogEntry[] {
  const entries: ChangelogEntry[] = []
  const lines = content.split('\n')
  let currentEntry: ChangelogEntry | null = null
  let inChangesSection = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Match version/date headers like "## [2024-01-15]" or "## [Unreleased]"
    const headerMatch = line.match(/^##\s+\[([\w\d\-]+)\]\s*(?:-\s*Commit\s+(\w+))?/)
    if (headerMatch) {
      if (currentEntry && currentEntry.changes.length > 0) {
        entries.push(currentEntry)
      }

      currentEntry = {
        date: headerMatch[1],
        hash: headerMatch[2] || undefined,
        author: undefined,
        changes: [],
        fullText: line,
      }
      inChangesSection = false
      continue
    }

    // Match author line
    if (currentEntry && line.match(/^\*\*Author:\*\*/)) {
      const author = line.replace(/^\*\*Author:\*\*\s*/, '').trim()
      currentEntry.author = author
      currentEntry.fullText += '\n' + line
      continue
    }

    // Match "### Changes" section
    if (line.match(/^###\s+Changes/)) {
      inChangesSection = true
      continue
    }

    // Capture change items (bullet points)
    if (inChangesSection && line.match(/^-\s+/)) {
      const change = line.replace(/^-\s+/, '').trim()
      if (currentEntry) {
        currentEntry.changes.push(change)
        currentEntry.fullText += '\n' + line
      }
    } else if (line.trim() && !line.startsWith('#') && inChangesSection && currentEntry) {
      // Keep capturing until we hit a new section
      if (line.match(/^###/) || line.match(/^##/) || line.match(/^\*\*/)) {
        inChangesSection = false
      }
    }
  }

  // Don't forget the last entry
  if (currentEntry && currentEntry.changes.length > 0) {
    entries.push(currentEntry)
  }

  return entries
}
