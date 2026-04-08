import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'

import { Drawer } from './drawer'

function Harness({
  initialOpen = false,
  withFooter = false,
  description,
}: {
  initialOpen?: boolean
  withFooter?: boolean
  description?: string
}) {
  const [open, setOpen] = useState(initialOpen)
  return (
    <div>
      <button type="button" onClick={() => setOpen(true)}>
        Open drawer
      </button>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="Record outcome"
        description={description}
        footer={
          withFooter ? (
            <button type="button">Save outcome</button>
          ) : undefined
        }
      >
        <label htmlFor="note">Note</label>
        <textarea id="note" />
      </Drawer>
    </div>
  )
}

describe('Drawer', () => {
  afterEach(() => {
    // ensure body scroll lock is reset between tests
    document.body.style.overflow = ''
  })

  it('does not render anything while closed', () => {
    render(<Harness />)
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.queryByText('Record outcome')).toBeNull()
  })

  it('renders the title and children when opened', () => {
    render(<Harness initialOpen />)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-labelledby', 'drawer-title')
    expect(screen.getByText('Record outcome')).toBeInTheDocument()
    expect(screen.getByLabelText('Note')).toBeInTheDocument()
  })

  it('exposes the description as aria-describedby', () => {
    render(<Harness initialOpen description="What happened on the call?" />)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-describedby', 'drawer-description')
    expect(screen.getByText('What happened on the call?')).toBeInTheDocument()
  })

  it('renders the optional footer when provided', () => {
    render(<Harness initialOpen withFooter />)
    expect(screen.getByRole('button', { name: 'Save outcome' })).toBeInTheDocument()
  })

  it('closes when the close button is clicked', () => {
    render(<Harness initialOpen />)
    fireEvent.click(screen.getByRole('button', { name: 'Close drawer' }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('closes when Escape is pressed', () => {
    render(<Harness initialOpen />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('locks body scroll while open and restores it on close', () => {
    render(<Harness />)
    expect(document.body.style.overflow).toBe('')
    fireEvent.click(screen.getByRole('button', { name: 'Open drawer' }))
    expect(document.body.style.overflow).toBe('hidden')
    fireEvent.click(screen.getByRole('button', { name: 'Close drawer' }))
    expect(document.body.style.overflow).toBe('')
  })

  it('moves focus to the first focusable element when opened', async () => {
    render(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: 'Open drawer' }))
    // useEffect schedules focus via setTimeout(0); wait a tick
    await new Promise((r) => setTimeout(r, 0))
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Close drawer' }))
  })
})
