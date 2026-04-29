'use client'

import { useEffect, useState } from 'react'

interface ChangelogEntry {
  date: string
  hash?: string
  author?: string
  changes: string[]
}

export default function ChangelogPage() {
  const [entries, setEntries] = useState<ChangelogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchChangelog = async () => {
      try {
        const response = await fetch('/api/changelog')
        const data = await response.json()

        if (data.success) {
          setEntries(data.entries)
        } else {
          setError(data.error || 'Failed to load changelog')
        }
      } catch (err) {
        setError('Error fetching changelog')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchChangelog()
  }, [])

  return (
    <div className="min-h-screen bg-black text-white p-4 font-mono text-sm overflow-auto">
      {/* Terminal Header */}
      <div className="border-b border-gray-700 pb-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-green-400">$</span>
          <span>cat changelog.md</span>
        </div>
        <div className="text-gray-500 text-xs">
          TaxiHollongi Changelog - {new Date().toLocaleString()}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-yellow-400">
          <span className="animate-pulse">➜</span> Loading changelog...
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-red-400">
          <span>❌ Error: {error}</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && entries.length === 0 && (
        <div className="text-gray-500">
          <span className="text-blue-400">[INFO]</span> No changelog entries yet. Changelog will be
          updated with each commit.
        </div>
      )}

      {/* Changelog Entries */}
      {!loading && !error && entries.length > 0 && (
        <div className="space-y-6">
          {entries.map((entry, index) => (
            <div key={index} className="border-l border-gray-700 pl-4">
              {/* Entry Header */}
              <div className="text-cyan-400 font-bold mb-2">
                ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              </div>

              <div className="mb-3">
                <span className="text-green-400">[{entry.date}]</span>
                {entry.hash && (
                  <>
                    <span className="text-gray-500"> @ </span>
                    <span className="text-yellow-400">{entry.hash}</span>
                  </>
                )}
              </div>

              {entry.author && (
                <div className="text-gray-400 mb-2">
                  <span className="text-blue-400">Author:</span> {entry.author}
                </div>
              )}

              {/* Changes List */}
              {entry.changes.length > 0 && (
                <div className="ml-2 text-gray-300">
                  <div className="text-white mb-2">Changes:</div>
                  {entry.changes.map((change, changeIndex) => (
                    <div key={changeIndex} className="ml-4 mb-1">
                      <span className="text-magenta-500">→</span> {change}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Terminal Footer */}
          <div className="border-t border-gray-700 pt-4 mt-6 text-gray-500 text-xs">
            <span className="text-green-400">$</span> Total entries: {entries.length}
          </div>
        </div>
      )}
    </div>
  )
}
