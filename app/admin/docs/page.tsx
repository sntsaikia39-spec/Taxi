'use client'

import { useEffect, useState, useCallback, useRef, type PointerEvent as ReactPointerEvent } from 'react'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'
import { ProtectedAdminPage } from '@/components/ProtectedAdminPage'

// ── Mermaid diagram renderer ──────────────────────────────────────────────
let mermaidInitialized = false

// ── Lightbox ─────────────────────────────────────────────────────────────
function DiagramLightbox({ svg, onClose }: { svg: string; onClose: () => void }) {
  const [scale, setScale] = useState(1)
  const offsetRef = useRef({ x: 0, y: 0 })
  const [, forceRender] = useState(0)
  const dragging = useRef(false)
  const last = useRef({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)

  // close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const applyTransform = (s: number, ox: number, oy: number) => {
    if (innerRef.current) {
      innerRef.current.style.transform = `translate(${ox}px, ${oy}px) scale(${s})`
    }
  }

  const zoom = (delta: number) => {
    setScale(s => {
      const next = Math.min(8, Math.max(0.2, s + delta))
      applyTransform(next, offsetRef.current.x, offsetRef.current.y)
      return next
    })
  }

  // wheel zoom — use native listener so we can call preventDefault
  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    const handler = (e: WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY < 0 ? 0.15 : -0.15
      setScale(s => {
        const next = Math.min(8, Math.max(0.2, s + delta))
        applyTransform(next, offsetRef.current.x, offsetRef.current.y)
        return next
      })
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [])

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    // ignore clicks on toolbar buttons
    if ((e.target as HTMLElement).closest('button')) return
    dragging.current = true
    last.current = { x: e.clientX, y: e.clientY }
    canvasRef.current?.setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return
    offsetRef.current = {
      x: offsetRef.current.x + e.clientX - last.current.x,
      y: offsetRef.current.y + e.clientY - last.current.y,
    }
    last.current = { x: e.clientX, y: e.clientY }
    applyTransform(scale, offsetRef.current.x, offsetRef.current.y)
  }
  const onPointerUp = () => { dragging.current = false }

  const resetView = () => {
    offsetRef.current = { x: 0, y: 0 }
    setScale(1)
    applyTransform(1, 0, 0)
    forceRender(n => n + 1)
  }

  const downloadSvg = () => {
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'diagram.svg'; a.click()
    URL.revokeObjectURL(url)
  }

  const downloadPng = () => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(svg, 'image/svg+xml')
    const svgEl = doc.documentElement
    const w = svgEl.getAttribute('width') || '1200'
    const h = svgEl.getAttribute('height') || '800'
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const scale = 2
      canvas.width = parseFloat(w) * scale
      canvas.height = parseFloat(h) * scale
      const ctx = canvas.getContext('2d')!
      ctx.scale(scale, scale)
      ctx.drawImage(img, 0, 0)
      const a = document.createElement('a')
      a.href = canvas.toDataURL('image/png')
      a.download = 'diagram.png'; a.click()
    }
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  }

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex flex-col"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* toolbar */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2 bg-black/60 border-b border-white/10">
        <div className="flex items-center gap-1">
          <button onClick={() => zoom(0.25)} title="Zoom in"
            className="p-2 rounded-lg text-white hover:bg-white/10 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35M11 8v6M8 11h6"/>
            </svg>
          </button>
          <button onClick={() => zoom(-0.25)} title="Zoom out"
            className="p-2 rounded-lg text-white hover:bg-white/10 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35M8 11h6"/>
            </svg>
          </button>
          <button onClick={resetView} title="Reset"
            className="p-2 rounded-lg text-white hover:bg-white/10 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
            </svg>
          </button>
          <span className="text-white/40 text-xs ml-2">{Math.round(scale * 100)}%</span>
        </div>

        <div className="flex items-center gap-1">
          <button onClick={downloadSvg} title="Download SVG"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            SVG
          </button>
          <button onClick={downloadPng} title="Download PNG"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            PNG
          </button>
          <button onClick={onClose} title="Close (Esc)"
            className="p-2 rounded-lg text-white hover:bg-white/10 transition-colors ml-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      {/* pan/zoom canvas */}
      <div
        ref={canvasRef}
        className="flex-1 overflow-hidden cursor-grab active:cursor-grabbing select-none relative"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          ref={innerRef}
          style={{ transform: `translate(0px, 0px) scale(1)`, transformOrigin: 'center center', pointerEvents: 'none' }}
          className="absolute inset-0 flex items-center justify-center p-8"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>

      <p className="shrink-0 text-center text-[10px] text-white/30 pb-2">Scroll to zoom · Drag to pan · Click outside or Esc to close</p>
    </div>
  )
}

function MermaidDiagram({ chart }: { chart: string }) {
  const [svg, setSvg] = useState('')
  const [failed, setFailed] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const idRef = useRef(`mmd-${Math.random().toString(36).slice(2, 9)}`)

  useEffect(() => {
    let active = true
    import('mermaid')
      .then(({ default: mermaid }) => {
        if (!mermaidInitialized) {
          mermaid.initialize({
            startOnLoad: false,
            securityLevel: 'loose',
            theme: 'base',
            fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
            themeVariables: {
              primaryColor: '#fef9c3',
              primaryBorderColor: '#ca8a04',
              primaryTextColor: '#1c1917',
              lineColor: '#94a3b8',
              secondaryColor: '#dcfce7',
              tertiaryColor: '#dbeafe',
              background: '#ffffff',
              mainBkg: '#fef9c3',
              nodeBorder: '#ca8a04',
              clusterBkg: '#f8fafc',
              clusterBorder: '#e2e8f0',
              titleColor: '#1c1917',
              edgeLabelBackground: '#ffffff',
              actorBkg: '#fef9c3',
              actorBorder: '#ca8a04',
              actorTextColor: '#1c1917',
              activationBkgColor: '#fef08a',
              signalColor: '#475569',
              signalTextColor: '#1e293b',
              labelBoxBkgColor: '#fef9c3',
              labelBoxBorderColor: '#ca8a04',
              noteBkgColor: '#e0f2fe',
              noteBorderColor: '#7dd3fc',
              noteTextColor: '#0c4a6e',
              attributeBackgroundColorEven: '#fffbeb',
              attributeBackgroundColorOdd: '#ffffff',
              fillType0: '#dbeafe',
              fillType1: '#dcfce7',
              fillType2: '#fef9c3',
              fillType3: '#fce7f3',
              fillType4: '#ede9fe',
              fillType5: '#fee2e2',
              fillType6: '#cffafe',
              fillType7: '#fae8ff',
            },
          })
          mermaidInitialized = true
        }
        return mermaid.render(idRef.current, chart.trim())
      })
      .then(({ svg: rendered }) => {
        if (active) setSvg(rendered)
      })
      .catch(() => {
        if (active) setFailed(true)
      })
    return () => {
      active = false
    }
  }, [chart])

  if (failed) {
    return (
      <div className="my-5 p-4 rounded-xl border border-red-200 bg-red-50">
        <p className="text-red-500 text-xs font-semibold mb-2">Diagram could not be rendered. Source:</p>
        <pre className="text-[11px] text-gray-600 font-mono overflow-x-auto whitespace-pre-wrap">{chart}</pre>
      </div>
    )
  }

  if (!svg) {
    return (
      <div data-mermaid-loading className="my-5 h-24 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center">
        <span className="text-gray-400 text-xs animate-pulse">Rendering diagram…</span>
      </div>
    )
  }

  const downloadSvg = () => {
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'diagram.svg'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      {lightboxOpen && <DiagramLightbox svg={svg} onClose={() => setLightboxOpen(false)} />}
      <div className="my-6 rounded-xl border border-gray-200 shadow-sm bg-white overflow-hidden group">
        {/* toolbar */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gray-50/80">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Diagram</span>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setLightboxOpen(true)}
              title="Zoom / fullscreen"
              className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-200 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
              </svg>
              Expand
            </button>
            <button
              onClick={downloadSvg}
              title="Download SVG"
              className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-200 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              SVG
            </button>
          </div>
        </div>
        {/* diagram */}
        <div
          className="p-4 md:p-6 overflow-x-auto cursor-zoom-in"
          onClick={() => setLightboxOpen(true)}
          title="Click to expand"
        >
          <div className="flex justify-center min-w-fit mx-auto [&_svg]:max-w-full [&_svg]:h-auto" dangerouslySetInnerHTML={{ __html: svg }} />
        </div>
      </div>
    </>
  )
}

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
  let inCode = false
  return markdown.split('\n').reduce<TocEntry[]>((acc, line) => {
    if (line.trimStart().startsWith('```')) { inCode = !inCode; return acc }
    if (inCode) return acc
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

  const fetchDocs = useCallback(() => {
    setLoading(true)
    setError(null)
    fetch('/api/admin/docs')
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error)
        setContent(data.content)
        setToc(extractToc(data.content))
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchDocs() }, [fetchDocs])

  const [printing, setPrinting] = useState(false)

  const handlePrint = useCallback(() => {
    setPrinting(true)
    const waitAndPrint = (attempts = 0) => {
      if (!document.querySelector('[data-mermaid-loading]') || attempts >= 25) {
        setPrinting(false)
        window.print()
      } else {
        setTimeout(() => waitAndPrint(attempts + 1), 300)
      }
    }
    waitAndPrint()
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
      if (match[1] === 'mermaid') {
        return <MermaidDiagram chart={String(children)} />
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
      <div id="docs-shell" className="flex flex-col h-[100dvh] bg-[#fafafa] overflow-hidden">

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
              v2.0
            </span>
            <button
              onClick={handlePrint}
              disabled={loading || printing}
              title="Download / print as PDF"
              className="flex items-center gap-1.5 text-xs text-gray-600 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <svg
                className={`w-3.5 h-3.5 ${printing ? 'animate-pulse' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span className="hidden sm:inline">{printing ? 'Preparing…' : 'Download'}</span>
            </button>
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

        <div id="docs-body" className="flex flex-1 overflow-hidden">

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
                  <span>Rina&apos;s Tours and Travels · App Documentation v2.0 · 2026-05-12</span>
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
