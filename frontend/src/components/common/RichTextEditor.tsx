import { useEffect, useRef, useCallback, type KeyboardEvent } from 'react'
import { Bold, Italic, Underline, List, Link, AlignLeft, AlignCenter, AlignRight, RotateCcw, RotateCw } from 'react-feather'

interface Props {
  value: string          // HTML string
  onChange: (html: string) => void
  placeholder?: string
  disabled?: boolean
  minHeight?: number
  onCtrlEnter?: () => void
}

// Sanitizzazione minima: rimuove script e handler inline
function sanitize(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
}

export function richToPlain(html: string): string {
  const div = document.createElement('div')
  div.innerHTML = html
  return div.textContent ?? ''
}

export default function RichTextEditor({
  value, onChange, placeholder, disabled, minHeight = 120, onCtrlEnter,
}: Props) {
  const editorRef = useRef<HTMLDivElement>(null)
  const isInternalChange = useRef(false)

  // Imposta contenuto iniziale al mount soltanto
  useEffect(() => {
    if (editorRef.current && value) {
      editorRef.current.innerHTML = sanitize(value)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Reset esterno (es. dopo invio messaggio: value torna '')
  useEffect(() => {
    if (isInternalChange.current) {
      isInternalChange.current = false
      return
    }
    if (!editorRef.current) return
    if (value === '' && editorRef.current.innerHTML !== '') {
      editorRef.current.innerHTML = ''
    }
  }, [value])

  const handleInput = useCallback(() => {
    if (!editorRef.current) return
    isInternalChange.current = true
    onChange(sanitize(editorRef.current.innerHTML))
  }, [onChange])

  const exec = useCallback((command: string, arg?: string) => {
    editorRef.current?.focus()
    document.execCommand(command, false, arg)
    handleInput()
  }, [handleInput])

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault(); onCtrlEnter?.()
    }
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'b') { e.preventDefault(); exec('bold') }
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'i') { e.preventDefault(); exec('italic') }
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'u') { e.preventDefault(); exec('underline') }
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); exec('undo') }
    if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); exec('redo') }
  }

  const insertLink = useCallback(() => {
    const url = window.prompt('Inserisci URL:', 'https://')
    if (url) exec('createLink', url)
  }, [exec])

  const ToolBtn = ({
    title, onMouseDown, children,
  }: { title: string; onMouseDown: () => void; children: React.ReactNode }) => (
    <button
      type='button'
      title={title}
      disabled={disabled}
      className='btn btn-sm btn-light p-1 d-flex align-items-center justify-content-center'
      style={{ width: 28, height: 28 }}
      onMouseDown={(e) => { e.preventDefault(); onMouseDown() }}
    >
      {children}
    </button>
  )

  const Divider = () => (
    <span style={{ width: 1, background: '#dee2e6', margin: '0 4px', alignSelf: 'stretch' }} />
  )

  return (
    <div
      className={`rich-editor${disabled ? ' rich-editor--disabled' : ''}`}
      style={{ border: '1px solid #dee2e6', borderRadius: 4, overflow: 'hidden' }}
    >
      {/* ── Toolbar ── */}
      <div className='rich-editor__toolbar d-flex align-items-center flex-wrap gap-1 px-2 py-1 border-bottom bg-light'>

        {/* Formato testo */}
        <ToolBtn title='Grassetto (Ctrl+B)' onMouseDown={() => exec('bold')}><Bold size={13} /></ToolBtn>
        <ToolBtn title='Corsivo (Ctrl+I)' onMouseDown={() => exec('italic')}><Italic size={13} /></ToolBtn>
        <ToolBtn title='Sottolineato (Ctrl+U)' onMouseDown={() => exec('underline')}><Underline size={13} /></ToolBtn>

        <Divider />

        {/* Titoli */}
        <ToolBtn title='Titolo H2' onMouseDown={() => exec('formatBlock', '<h2>')}>
          <span style={{ fontSize: 11, fontWeight: 700, lineHeight: 1 }}>H2</span>
        </ToolBtn>
        <ToolBtn title='Titolo H3' onMouseDown={() => exec('formatBlock', '<h3>')}>
          <span style={{ fontSize: 11, fontWeight: 700, lineHeight: 1 }}>H3</span>
        </ToolBtn>
        <ToolBtn title='Testo normale' onMouseDown={() => exec('formatBlock', '<p>')}>
          <span style={{ fontSize: 11, lineHeight: 1 }}>¶</span>
        </ToolBtn>

        <Divider />

        {/* Liste */}
        <ToolBtn title='Elenco puntato' onMouseDown={() => exec('insertUnorderedList')}>
          <List size={13} />
        </ToolBtn>
        <ToolBtn title='Elenco numerato' onMouseDown={() => exec('insertOrderedList')}>
          <span style={{ fontSize: 11, lineHeight: 1 }}>1.</span>
        </ToolBtn>

        <Divider />

        {/* Allineamento */}
        <ToolBtn title='Allinea sinistra' onMouseDown={() => exec('justifyLeft')}><AlignLeft size={13} /></ToolBtn>
        <ToolBtn title='Centra' onMouseDown={() => exec('justifyCenter')}><AlignCenter size={13} /></ToolBtn>
        <ToolBtn title='Allinea destra' onMouseDown={() => exec('justifyRight')}><AlignRight size={13} /></ToolBtn>

        <Divider />

        {/* Link */}
        <ToolBtn title='Inserisci link' onMouseDown={insertLink}><Link size={13} /></ToolBtn>

        <Divider />

        {/* Undo/Redo */}
        <ToolBtn title='Annulla (Ctrl+Z)' onMouseDown={() => exec('undo')}><RotateCcw size={13} /></ToolBtn>
        <ToolBtn title='Ripristina (Ctrl+Y)' onMouseDown={() => exec('redo')}><RotateCw size={13} /></ToolBtn>
      </div>

      {/* ── Area di testo ── */}
      {/* NON usare dangerouslySetInnerHTML — causa reset cursore ad ogni keystroke */}
      <div
        ref={editorRef}
        contentEditable={!disabled}
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        data-placeholder={placeholder}
        style={{
          minHeight,
          padding: '10px 12px',
          outline: 'none',
          fontSize: 14,
          lineHeight: 1.6,
          color: disabled ? '#6c757d' : '#212529',
          cursor: disabled ? 'not-allowed' : 'text',
          overflowY: 'auto',
        }}
      />

      <style>{`
        .rich-editor [data-placeholder]:empty::before {
          content: attr(data-placeholder);
          color: #adb5bd;
          pointer-events: none;
        }
        .rich-editor ul, .rich-editor ol { margin: 4px 0; padding-left: 22px; }
        .rich-editor p { margin: 0 0 4px 0; }
        .rich-editor h2 { font-size: 1.1rem; font-weight: 700; margin: 6px 0 4px 0; }
        .rich-editor h3 { font-size: 1rem; font-weight: 600; margin: 4px 0 2px 0; }
        .rich-editor a { color: #0d6efd; text-decoration: underline; }
        .rich-editor--disabled { background: #f8f9fa; opacity: 0.75; }
      `}</style>
    </div>
  )
}
