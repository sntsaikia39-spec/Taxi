const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const START_COMMIT = 'ff71300'
const CHANGELOG_PATH = path.join(process.cwd(), 'changelog.md')

function run(cmd) {
  return execSync(cmd, { cwd: process.cwd(), encoding: 'utf-8' }).trim()
}

function generateChangelog() {
  try {
    // Unshallow if Vercel did a shallow clone
    const shallowFile = path.join(process.cwd(), '.git', 'shallow')
    if (fs.existsSync(shallowFile)) {
      try {
        run('git fetch --unshallow --quiet')
        console.log('Unshallowed git repo for full history')
      } catch (_) {}
    }

    // Get commits from START_COMMIT (inclusive) to HEAD
    let gitLog = ''
    try {
      gitLog = run(
        `git log ${START_COMMIT}^..HEAD --pretty=format:"%H|%ad|%s|%an" --date=short --no-merges`
      )
    } catch (_) {
      // START_COMMIT not in history (very shallow clone) — use all available commits
      gitLog = run(`git log --pretty=format:"%H|%ad|%s|%an" --date=short --no-merges`)
    }

    if (!gitLog) {
      console.log('No commits found — keeping existing changelog.md')
      return
    }

    // Parse commits
    const commits = gitLog
      .split('\n')
      .filter(Boolean)
      .map(line => {
        const idx1 = line.indexOf('|')
        const idx2 = line.indexOf('|', idx1 + 1)
        const idx3 = line.lastIndexOf('|')
        return {
          hash: line.substring(0, idx1).substring(0, 7),
          date: line.substring(idx1 + 1, idx2),
          subject: line.substring(idx2 + 1, idx3),
          author: line.substring(idx3 + 1),
        }
      })

    // Group by date (newest first)
    const byDate = new Map()
    for (const commit of commits) {
      if (!byDate.has(commit.date)) {
        byDate.set(commit.date, { authors: new Set(), changes: [] })
      }
      const entry = byDate.get(commit.date)
      entry.authors.add(commit.author)
      entry.changes.push(commit.subject)
    }

    const dates = [...byDate.keys()].sort((a, b) => b.localeCompare(a))

    // Build markdown
    let md = '# Changelog\n\nAll notable changes to TaxiHollongi will be documented in this file.\n\n---\n\n'

    for (const date of dates) {
      const { authors, changes } = byDate.get(date)
      md += `## [${date}]\n\n`
      md += `**Author:** ${[...authors].join(', ')}\n\n`
      md += `### Changes\n`
      for (const change of changes) {
        md += `- ${change}\n`
      }
      md += '\n'
    }

    md += '---\n\n> This changelog is automatically updated on every build. Latest updates appear at the top.\n'

    fs.writeFileSync(CHANGELOG_PATH, md)
    console.log(`✅ Changelog generated: ${commits.length} commits across ${dates.length} day(s)`)
  } catch (err) {
    console.warn('⚠️  Could not generate changelog:', err.message)
    console.warn('Keeping existing changelog.md unchanged')
  }
}

generateChangelog()
