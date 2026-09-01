import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CodeBlockLanguageControls } from './codeBlockLanguageControls'

function codeBlockDom(blockId = 'code-block-1') {
  const editorElement = document.createElement('div')
  editorElement.className = 'bn-editor'
  editorElement.setAttribute('contenteditable', 'false')

  const editorRoot = document.createElement('div')
  editorRoot.className = 'editor__blocknote-container'
  const componentHost = document.createElement('div')

  const blockContainer = document.createElement('div')
  blockContainer.dataset.nodeType = 'blockContainer'
  blockContainer.dataset.id = blockId

  const blockContent = document.createElement('div')
  blockContent.className = 'bn-block-content'
  blockContent.dataset.contentType = 'codeBlock'

  const nativeControl = document.createElement('select')
  nativeControl.disabled = true
  nativeControl.append(new Option('Plain Text', 'text'), new Option('C++', 'cpp'))
  nativeControl.value = 'text'

  const controlHost = document.createElement('div')
  controlHost.appendChild(nativeControl)
  blockContent.appendChild(controlHost)
  blockContainer.appendChild(blockContent)
  editorElement.appendChild(blockContainer)
  editorRoot.append(editorElement, componentHost)
  document.body.appendChild(editorRoot)

  return { componentHost, controlHost, editorElement, editorRoot, nativeControl }
}

describe('CodeBlockLanguageControls', () => {
  it('replaces a stale disabled native picker with a live shadcn language control', async () => {
    const { componentHost, editorElement, editorRoot, nativeControl } = codeBlockDom()
    editorElement.remove()
    const editor = {
      domElement: editorElement.parentElement,
      getBlock: vi.fn(() => ({ id: 'code-block-1', type: 'codeBlock' })),
      isEditable: false,
      onChange: vi.fn(() => vi.fn()),
      updateBlock: vi.fn(),
    }

    render(<CodeBlockLanguageControls editor={editor as never} />, { container: componentHost })

    await act(async () => {
      editor.domElement = editorElement
      editorRoot.prepend(editorElement)
    })

    const trigger = await waitFor(() => {
      const control = document.querySelector('[data-slot="select-trigger"]')
      if (!control || control.tagName !== 'BUTTON') throw new Error('Language trigger was unavailable')
      return control
    })
    expect(trigger.closest('[data-code-block-id]')).toHaveAttribute('data-code-block-id', 'code-block-1')
    expect(trigger).toBeDisabled()
    expect(nativeControl).toBeDisabled()

    await act(async () => {
      editor.isEditable = true
      editorElement.setAttribute('contenteditable', 'true')
    })
    await waitFor(() => expect(trigger).toBeEnabled())

    fireEvent.click(trigger)
    fireEvent.click(await screen.findByRole('option', { name: 'C++' }))

    expect(editor.updateBlock).toHaveBeenCalledWith('code-block-1', {
      props: { language: 'cpp' },
    })
  })

  it('anchors the live picker in an editor-local layer outside ProseMirror content', async () => {
    const blockId = 'code-block-scroll-anchor'
    const { componentHost, controlHost, editorElement, editorRoot } = codeBlockDom(blockId)
    const editor = {
      domElement: editorElement,
      getBlock: vi.fn(() => ({ id: blockId, type: 'codeBlock' })),
      isEditable: false,
      onChange: vi.fn(() => vi.fn()),
      updateBlock: vi.fn(),
    }

    render(<CodeBlockLanguageControls editor={editor as never} />, { container: componentHost })

    const overlay = await waitFor(() => {
      const control = document.querySelector(
        `.editor__code-block-language-overlay[data-code-block-id="${blockId}"]`,
      )
      if (!control) throw new Error('Language overlay was unavailable')
      return control
    })

    expect(overlay.parentElement).toHaveClass('editor__code-block-language-layer')
    expect(editorRoot).toContainElement(overlay)
    expect(controlHost).not.toContainElement(overlay)
  })
})
