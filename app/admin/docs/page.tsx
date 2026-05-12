'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'
import { ProtectedAdminPage } from '@/components/ProtectedAdminPage'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-{2,}/g, '-')
}

function childrenToText(children: React.ReactNode): string {
  if (typeof children === 'string') return children
  if (Array.isArray(children)) return children.map(childrenToText).join('')
  return ''
}

interface TocEntry {
  level: number
  text: string
  id: string
}

function extractToc(markdown: string): TocEntry[] {
  return markdown.split('\n').reduce<TocEntry[]>((acc, line) => {
    const m = line.match(/^(#{1,4})\s+(.+)/)
    if (!m) return acc
    const level = m[1].length
    const text = m[2]
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/`/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .trim()
    acc.push({ level, text, id: slugify(text) })
    return acc
  }, [])
}

export default function AdminDocsPage() {
  const router = useRouter()
  const [content, setContent] = useState('')
  const [toc, setToc] = useState<TocEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeId, setActiveId] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    fetch('/api/admin/docs')
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error)
        setContent(data.content)
        setToc(extractToc(data.content))
        setLoading(false)
      })
      .catch(e => {
        setError(e.message)
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (!toc.length) return
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries.filter(e => e.isIntersecting)
        if (visible.length > 0) setActiveId(visible[0].target.id)
      },
      { rootMargin: '-10% 0% -80% 0%', threshold: 0 }
    )
    toc.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [toc])

  const makeId = useCallback(
    (children: React.ReactNode) => slugify(childrenToText(children)),
    []
  )

  const components: Components = {
    h1: ({ children }) => {
      const id = makeId(children)
      return (
        <h1 id={id} className="text-3xl font-bold text-gray-900 mt-2 mb-6 pb-4 border-b-[3px] border-yellow-400 scroll-mt-20">
          {children}
        </h1>
      )
    },
    h2: ({ children }) => {
      const id = makeId(children)
      return (
        <h2 id={id} className="text-xl font-bold text-gray-900 mt-12 mb-4 pb-2 border-b border-gray-200 scroll-mt-20">
          {children}
        </h2>
      )
    },
    h3: ({ children }) => {
      const id = makeId(children)
      return (
        <h3 id={id} className="text-base font-bold text-gray-800 mt-8 mb-3 scroll-mt-20">
          {children}
        </h3>
      )
    },
    h4: ({ children }) => {
      const id = makeId(children)
      return (
        <h4 id={id} className="text-sm font-semibold text-gray-700 mt-6 mb-2 scroll-mt-20">
          {children}
        </h4>
      )
    },
    p: ({ children }) => (
      <p className="text-gray-700 leading-7 mb-4 text-sm">{children}</p>
    ),
    a: ({ href, children }) => (
      <a
        href={href}
        className="text-amber-600 hover:text-amber-800 underline underline-offset-2 font-medium"
        target={href?.startsWith('http') ? '_blank' : undefined}
        rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
      >
        {children}
      </a>
    ),
    ul: ({ children }) => (
      <ul className="list-disc list-outside ml-5 mb-4 space-y-1.5 text-sm text-gray-700">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal list-outside ml-5 mb-4 space-y-1.5 text-sm text-gray-700">{children}</ol>
    ),
    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-yellow-400 pl-4 py-2 my-4 bg-amber-50 rounded-r-lg text-gray-600 italic text-sm">
        {children}
      </blockquote>
    ),
    hr: () => <hr className="my-10 border-gray-100" />,
    code({ className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '')
      if (!match) {
        return (
          <code
            className="bg-gray-100 text-rose-600 px-1.5 py-0.5 rounded text-[0.82em] font-mono"
            {...props}
          >
            {children}
          </code>
        )
      }
      return (
        <div className="relative my-5 rounded-xl overflow-hidden border border-[#313244]">
          <div className="flex items-center justify-between px-4 py-2 bg-[#181825] border-b border-[#313244]">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#f38ba8]" />
              <span className="w-3 h-3 rounded-full bg-[#f9e2af]" />
              <span className="w-3 h-3 rounded-full bg-[#a6e3a1]" />
            </div>
            <span className="text-[10px] font-mono text-[#6c7086] uppercase tracking-wider">
              {match[1]}
            </span>
          </div>
          <pre className="bg-[#1e1e2e] text-[#cdd6f4] p-4 overflow-x-auto text-xs font-mono leading-relaxed">
            <code>{children}</code>
          </pre>
        </div>
      )
    },
    pre: ({ children }) => <>{children}</>,
    table: ({ children }) => (
      <div className="overflow-x-auto my-6 rounded-xl border border-gray-200 shadow-sm">
        <table className="w-full text-sm border-collapse">{children}</table>
      </div>
    ),
    thead: ({ children }) => (
      <thead className="bg-gradient-to-r from-gray-50 to-gray-100">{children}</thead>
    ),
    tbody: ({ children }) => (
      <tbody className="divide-y divide-gray-100">{children}</tbody>
    ),
    tr: ({ children }) => (
      <tr className="hover:bg-amber-50/40 transition-colors">{children}</tr>
    ),
    th: ({ children }) => (
      <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider border-b border-gray-200">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="px-4 py-3 text-gray-700 align-top text-sm border-r last:border-r-0 border-gray-100">
        {children}
      </td>
    ),
    strong: ({ children }) => (
      <strong className="font-semibold text-gray-900">{children}</strong>
    ),
    em: ({ children }) => (
      <em className="italic text-gray-500">{children}</em>
    ),
  }

  return (
    <ProtectedAdminPage>
      <div className="flex flex-col h-[100dvh] bg-[#fafafa] overflow-hidden">

        {/* ── Top bar ──────────────────────────────────────────────── */}
        <header className="shrink-0 flex items-center justify-between px-4 md:px-6 h-14 bg-white border-b border-gray-200 shadow-sm z-50">
          <div className="flex items-center gap-2 text-sm min-w-0">
            <button
              onClick={() => router.push('/admin')}
              className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 transition-colors font-medium shrink-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:inline">Admin</span>
            </button>
            <svg className="w-3.5 h-3.5 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="font-semibold text-gray-900 truncate">App Documentation</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden sm:flex items-center gap-1.5 text-[11px] text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
              v1.0
            </span>
            <button
              className="md:hidden flex items-center gap-1.5 text-xs text-gray-600 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 font-medium"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              Contents
            </button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">

          {/* ── Sidebar TOC ──────────────────────────────────────────── */}
          <aside
            className={`
              ${mobileMenuOpen ? 'fixed inset-0 z-40' : 'hidden md:flex'}
              md:relative md:z-auto w-64 lg:w-72 shrink-0 flex-col
              bg-white border-r border-gray-200 overflow-y-auto
            `}
          >
            {mobileMenuOpen && (
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 md:hidden">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Table of Contents</p>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-gray-400 hover:text-gray-700 p-1"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            <div className="px-3 pt-5 pb-10">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3 px-2 hidden md:block">
                On this page
              </p>
              <nav className="space-y-px">
                {toc.map((entry, i) => {
                  const isActive = activeId === entry.id
                  return (
                    <a
                      key={i}
                      href={`#${entry.id}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`
                        block rounded-md leading-snug transition-all duration-150
                        ${entry.level === 1
                          ? 'px-2 py-1.5 text-[13px] font-bold text-gray-900 mt-5 mb-1'
                          : ''}
                        ${entry.level === 2
                          ? 'px-2 py-1 text-xs font-semibold'
                          : ''}
                        ${entry.level === 3
                          ? 'pl-5 pr-2 py-1 text-[11px]'
                          : ''}
                        ${entry.level === 4
                          ? 'pl-8 pr-2 py-0.5 text-[10px] text-gray-400'
                          : ''}
                        ${isActive
                          ? 'bg-yellow-50 text-yellow-700 font-semibold border-l-2 border-yellow-500 rounded-l-none'
                          : entry.level <= 2
                          ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                        }
                      `}
                    >
                      {entry.level === 3 && (
                        <span className="inline-block w-1 h-1 rounded-full bg-current mr-1.5 mb-0.5 opacity-40" />
                      )}
                      {entry.text}
                    </a>
                  )
                })}
              </nav>
            </div>
          </aside>

          {/* ── Main content ─────────────────────────────────────────── */}
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto px-5 md:px-10 lg:px-16 py-8 md:py-12">

              {loading && (
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                  <div className="w-9 h-9 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-gray-400 font-medium">Loading documentation…</p>
                </div>
              )}

              {error && (
                <div className="text-center py-24">
                  <div className="text-5xl mb-4">📄</div>
                  <p className="text-red-500 font-semibold mb-2">Failed to load documentation</p>
                  <p className="text-sm text-gray-400 mb-6">{error}</p>
                  <button
                    onClick={() => router.push('/admin')}
                    className="text-sm text-yellow-600 underline hover:text-yellow-800 font-medium"
                  >
                    ← Back to Admin Panel
                  </button>
                </div>
              )}

              {!loading && !error && content && (
                <article>
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
                    {content}
                  </ReactMarkdown>
                </article>
              )}

              {!loading && !error && (
                <footer className="mt-16 pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
                  <span>Rina&apos;s Tours and Travels · App Documentation v1.0 · 2026-05-12</span>
                  <button
                    onClick={() => router.push('/admin')}
                    className="flex items-center gap-1.5 text-yellow-600 hover:text-yellow-800 font-medium transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Admin Panel
                  </button>
                </footer>
              )}

            </div>
          </main>

        </div>
      </div>
    </ProtectedAdminPage>
  )
}
