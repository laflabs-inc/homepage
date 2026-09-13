# CodeMirror Markdown Live Preview Design

**Date:** 2026-09-12  
**Status:** Approved direction, pending implementation-plan review

## Problem

The current admin Markdown editor renders every inactive Markdown AST block and replaces the active block with a separate `textarea`. This makes the document look like a live preview, but it splits one document into multiple browser inputs. Cursor movement, selection, blank lines, Korean IME input, undo history, and Enter behavior therefore have to be reconstructed manually.

The most visible failure is Enter at the end of a block. Markdown parser ranges include or sit next to separator whitespace, so an attempted new block can produce the same source value or an empty synthetic range. The cursor appears to move, but the line is not reliably persisted and the keystroke feels ignored. More exceptions around AST ranges would preserve this underlying mismatch.

## Product Direction

Use an Obsidian-style editing model rather than a Notion-style storage model.

- The canonical document remains one exact Markdown string.
- One CodeMirror 6 editor owns input, selection, composition, history, clipboard, and cursor movement.
- Markdown syntax is visible around the current cursor block.
- Complete blocks outside the cursor are replaced with rendered widgets using the existing `MarkdownBody` renderer.
- Full source mode uses the same editor state with preview decorations disabled.

Obsidian's Live Preview similarly keeps Markdown editable in one view and exposes underlying syntax around the cursor. CodeMirror models the document as a flat string and applies presentation through state-backed decorations. Notion and GitBook instead use block-native document models and treat Markdown mainly as an input or interchange format; adopting that approach would require replacing the current Markdown API and storage contract.

References:

- https://help.obsidian.md/Live%2Bpreview%2Bupdate
- https://codemirror.net/docs/guide/
- https://codemirror.net/examples/decoration/
- https://www.notion.com/help/writing-and-editing-basics
- https://gitbook.com/docs/content-editor/blocks

## Scope

### Included

- Replace the block-per-`textarea` live editor with one CodeMirror 6 instance.
- Preserve the existing `value: string` and `onChange(value)` component contract.
- Preserve exact Markdown storage and the existing full-source option.
- Render inactive top-level Markdown blocks with the existing production renderer.
- Keep the active top-level block as editable Markdown source.
- Provide predictable paragraph, heading, list, quote, code, table, math, HTML, and diagram editing.
- Retain desktop and mobile admin layouts.
- Preserve keyboard accessibility and add an editor-level accessible label.

### Excluded

- Notion-style drag handles, slash commands, nested block databases, or block IDs.
- Changing database schemas or API payloads from Markdown to JSON.
- Collaborative editing, comments, presence, or revision diffs.
- Replacing the public `MarkdownBody` renderer.
- A new formatting toolbar.

## Interaction Model

### Continuous document behavior

The editor must never create a second input for another block. Clicking rendered content moves the single CodeMirror selection into that source range. All changes become normal CodeMirror transactions, so native undo, redo, selection, paste, mobile composition, and IME behavior remain intact.

### Enter behavior

- In a paragraph or heading, Enter ends the current block and starts a new paragraph. The Markdown transaction inserts the paragraph separator required by the stored format and places the cursor in the new editable line.
- An empty line remains visible while it contains the cursor. Pressing Enter again advances to another empty line instead of being swallowed.
- Shift+Enter inserts an intentional hard line break inside the current text block.
- Lists and blockquotes use Markdown-aware continuation: continue the current marker, and exit the structure from an empty item.
- Code fences, tables, display math, HTML, Mermaid, and other structurally multiline blocks keep Enter inside the current structure.
- Mod/Ctrl+Enter exits a structurally multiline block and creates a paragraph after it.

### Preview behavior

- The top-level block containing the primary selection remains source.
- A selection crossing several blocks leaves every intersecting block as source so drag selection is not interrupted.
- Inactive, complete top-level blocks become non-editable preview widgets.
- Blank separator lines are never replaced by widgets. They remain part of the editor document and can hold the cursor.
- Clicking a preview widget maps the pointer to the widget's source range and reveals that block for editing.
- Source mode removes preview replacements without recreating the editor or losing selection/history.

### Complex Markdown

The existing unified/remark parser remains responsible for identifying top-level ranges because it already understands GFM, math, raw HTML, and the project's supported document syntax. A range is previewed only when parsing yields a complete top-level node that does not intersect the selection. Incomplete fences or temporarily invalid Markdown remain raw source until they become complete, avoiding flicker and data loss while typing.

## Architecture

### `MarkdownLiveEditor`

The React component owns lifecycle integration only:

- create and destroy one `EditorView`;
- synchronize external `value` changes without resetting history for local changes;
- send document-changing transactions through `onChange`;
- toggle live-preview/source compartments;
- expose the existing accessible labels and mode controls.

It must not manually emulate cursor navigation or keep an `ActiveRange` React state.

### Live-preview extension

A dedicated CodeMirror extension derives decorations from:

- current editor document;
- parsed top-level Markdown ranges;
- current selection ranges;
- live-preview mode state.

It creates direct replacement decorations for inactive ranges because those widgets affect vertical layout. Decorations are recomputed after document or selection changes and are mapped through normal transactions.

### Rendered block widget

Each replacement widget mounts the existing `MarkdownBody` into a DOM container. The widget:

- receives only the exact Markdown source for its top-level node;
- is visually consistent with the public document renderer;
- maps pointer activation back to its original source offset;
- destroys its React root when CodeMirror removes the widget;
- does not introduce its own editable elements.

Interactive public-renderer controls that would steal editor input are disabled or ignored inside editor widgets. Links do not navigate from the authoring surface on a normal click.

### Markdown input commands

Input behavior lives in focused CodeMirror commands, not React key handlers. Commands inspect the parsed node at the selection and produce one transaction for Enter, Shift+Enter, list continuation, or complex-block exit. Each command returns `false` when it does not own the context so CodeMirror's default behavior can proceed.

## Data Flow

1. `DocumentEditor` passes the stored Markdown string into `MarkdownLiveEditor`.
2. CodeMirror creates an `EditorState` containing that exact string.
3. The preview extension parses the current state and replaces inactive complete nodes visually; the underlying string is unchanged.
4. User input produces a CodeMirror transaction.
5. The update listener calls `onChange(nextDocumentString)` once for document-changing transactions.
6. Parent state updates are ignored when they match the current CodeMirror document; genuine external replacements dispatch a minimal full-document transaction.
7. Draft save and publication APIs continue receiving the same Markdown field as before.

## Failure Handling

- If a block cannot be parsed or rendered, show its source rather than an error widget.
- A renderer exception must be isolated to its widget and must not destroy the editor view.
- Exceeding the current `maxLength` rejects the transaction and leaves selection and content unchanged.
- Switching modes or receiving an external value must not recreate the editor.
- Server-side rendering must not access browser-only CodeMirror APIs; editor construction happens in the client lifecycle.

## Styling

- Preserve LafLabs' square paper/ink/blue admin design.
- Remove visible active-block boxes and textarea borders.
- Use one continuous writing surface with the same content width in source and live-preview modes.
- Keep the caret and selection visible without a persistent block highlight.
- Rendered blocks retain current typography; raw source uses a restrained monospace style only where Markdown syntax is exposed.
- Mobile uses the native virtual keyboard and must not cause horizontal document overflow.
- Respect reduced-motion preferences; no editor animation is required.

## Testing

### Unit tests

- Active-range calculation keeps the selected node in source and previews only complete inactive nodes.
- Multi-block selections leave every intersecting node editable.
- Paragraph Enter inserts a persistent next paragraph and moves selection.
- Repeated Enter preserves navigable empty lines.
- Shift+Enter creates a hard break.
- Lists and quotes continue and exit correctly.
- Code, table, math, HTML, and Mermaid blocks retain internal Enter behavior.
- Invalid or incomplete Markdown remains source.
- Maximum-length transactions are rejected without moving the selection.

### Component tests

- External value synchronization does not loop through `onChange`.
- Live/source mode toggling preserves document, cursor, and history.
- Widget activation reveals the corresponding source range.
- Korean composition events produce one correct document update and are not intercepted by Enter commands mid-composition.
- Existing document create, draft, summary, and publish tests remain green.

### Manual preview checks

- Desktop and mobile typing, Enter, repeated Enter, Backspace, selection, paste, undo, and redo.
- Korean two-set keyboard composition on mobile and desktop.
- Editing each supported complex Markdown example from the existing Markdown guide.
- No layout overflow in the compact metadata panel or writing surface.

## Migration and Rollback

No stored content migration is needed because Markdown remains canonical. The old block-per-textarea implementation is removed rather than retained behind a permanent compatibility layer. The full-source mode remains an immediate escape hatch for unsupported syntax. A single component-level rollback can restore the previous editor if the preview extension proves unstable before merge.

## Success Criteria

- Enter never appears ignored in prose, headings, or empty lines.
- The browser exposes one editable surface for the document, not one input per block.
- Cursor, selection, undo, paste, and Korean IME behave consistently across preview and source modes.
- Existing Markdown content round-trips byte-for-byte unless the user edits it.
- All currently supported rendered Markdown elements remain available outside the active source range.
