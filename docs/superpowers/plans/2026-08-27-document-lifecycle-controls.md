# Document Lifecycle Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make archive failures actionable and allow irreversible deletion only after a revision has been archived and its title has been re-entered.

**Architecture:** The document service emits typed lifecycle errors that survive the safe API boundary. Archived deletion is a separate service/repository operation, leaving draft deletion behavior intact and enforcing locale-history invariants inside one SQL transaction. The editor focuses workflow feedback and uses a title prompt before issuing permanent deletion.

**Tech Stack:** Next.js 16.3 App Router, React 19.2, TypeScript 5.9, Zod 4, Drizzle SQL, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-08-27-admin-ai-document-lifecycle-design.md`

## Global Constraints

- Published and scheduled revisions can never be permanently deleted.
- Archived deletion requires `{ permanent: true, confirmation: currentTitle }` at the API boundary.
- Compare confirmations after Unicode NFKC normalization and trimming; require an exact case-sensitive match.
- Preserve at least one Korean revision while any English revision exists.
- Remove an empty series in the same transaction as its final revision.
- Audit only series ID, locale, revision number, prior status, target, and actor; never audit title or Markdown.
- Keep public cache invalidation conservative after archive and permanent deletion.
- Use existing admin styles and native browser confirmation primitives.

---

## File Structure

- `lib/documents/service.ts` — typed archive errors and archived deletion validation.
- `lib/documents/types.ts` — repository contract for archived deletion.
- `lib/documents/store.ts` — locked archived-revision deletion transaction and audit.
- `lib/http/admin-documents.ts` — safe lifecycle error/status mapping.
- `app/api/admin/documents/[revisionId]/route.ts` — strict draft/archived DELETE body union.
- `components/admin/document-editor.tsx` — focused action feedback and typed delete prompt.
- `tests/documents/workflow.test.ts` — lifecycle invariants.
- `tests/documents/publication-store.test.ts` — deletion transaction result mapping.
- `tests/documents/admin-api.test.ts` — request and safe error contract.
- `tests/components/document-admin.test.tsx` — visible workflow interaction behavior.

---

### Task 1: Introduce actionable archive errors

**Files:**
- Modify: `lib/documents/service.ts`
- Modify: `lib/http/admin-documents.ts`
- Modify: `tests/documents/workflow.test.ts`
- Modify: `tests/documents/admin-api.test.ts`

**Interfaces:**
- Produces: `DocumentServiceErrorCode` values `archive_dependency`, `revision_changed`, and `invalid_state`.
- Consumes: the existing safe `{ error: code }` API response shape.

- [ ] **Step 1: Write failing workflow tests**

```ts
await expect(service.archive(korean.id, actor, now)).rejects.toMatchObject({ code: "archive_dependency" })
await expect(service.archive(archived.id, actor, now)).rejects.toMatchObject({ code: "invalid_state" })
await expect(service.archive(stalePublished.id, actor, now)).rejects.toMatchObject({ code: "revision_changed" })
```

- [ ] **Step 2: Run workflow tests and verify RED**

Run: `npm run test:unit -- tests/documents/workflow.test.ts`

Expected: FAIL because all three cases currently collapse to `conflict`.

- [ ] **Step 3: Emit the exact domain codes**

Extend `DocumentServiceErrorCode`. Use `invalid_state` for non-published input, `archive_dependency` for the Korean/English rule, and `revision_changed` when `archiveCurrent` returns null. Keep raw messages server-only.

- [ ] **Step 4: Write failing API mapping tests**

For each new code, reject from the injected service, assert status 409, exact `{ error: code }`, `Cache-Control: no-store`, and absence of the service message.

- [ ] **Step 5: Implement safe response mapping and verify GREEN**

Keep all three codes at HTTP 409 and serialize only the code. Run:

`npm run test:unit -- tests/documents/workflow.test.ts tests/documents/admin-api.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit actionable archive errors**

```bash
git add lib/documents/service.ts lib/http/admin-documents.ts tests/documents/workflow.test.ts tests/documents/admin-api.test.ts
git commit -m "fix: explain document archive conflicts"
```

---

### Task 2: Add archived-only permanent deletion

**Files:**
- Modify: `lib/documents/types.ts`
- Modify: `lib/documents/service.ts`
- Modify: `lib/documents/store.ts`
- Modify: `app/api/admin/documents/[revisionId]/route.ts`
- Modify: `lib/http/admin-documents.ts`
- Modify: `tests/documents/workflow.test.ts`
- Modify: `tests/documents/publication-store.test.ts`
- Modify: `tests/documents/admin-api.test.ts`

**Interfaces:**
- Produces: `DocumentRepository.deleteArchived(revisionId, actor)`, `documentService.deleteArchived(revisionId, confirmation, actor)`, and errors `confirmation_mismatch`, `delete_dependency`, `invalid_state`.
- Consumes: current `deleteDraft` for an empty DELETE body.

- [ ] **Step 1: Write failing service tests**

```ts
await expect(service.deleteArchived(archived.id, "  Archived title  ", actor)).resolves.toBeUndefined()
await expect(service.deleteArchived(archived.id, "wrong", actor)).rejects.toMatchObject({ code: "confirmation_mismatch" })
await expect(service.deleteArchived(published.id, published.title, actor)).rejects.toMatchObject({ code: "invalid_state" })
```

Also seed a sole archived Korean revision plus any English history and assert `delete_dependency`; seed a newer Korean revision and assert the older archived Korean revision may be deleted.

- [ ] **Step 2: Run workflow tests and verify RED**

Run: `npm run test:unit -- tests/documents/workflow.test.ts`

Expected: FAIL because `deleteArchived` does not exist.

- [ ] **Step 3: Add the service and repository contracts**

Add `deleteArchived(revisionId: string, actor: AdminActor): Promise<void>` to `DocumentRepository`. In the service, require status `archived`, compare `confirmation.normalize("NFKC").trim()` with `revision.title.normalize("NFKC").trim()`, inspect series states for the final-Korean dependency, then call the repository.

- [ ] **Step 4: Write failing store tests**

Assert the generated deletion path accepts only an archived row, records `priorStatus: "archived"` and `revision`, deletes an empty series, and maps a missing eligible row to a stable conflict without exposing content.

- [ ] **Step 5: Implement the locked deletion SQL**

Mirror the existing draft deletion CTE but require `status = 'archived'`. Lock the series and all revisions, repeat the final-Korean invariant inside SQL to close races, delete the eligible revision, delete the series only when it was the sole revision, and write `document.delete` metadata with `seriesId`, `locale`, `revision`, and `priorStatus`.

- [ ] **Step 6: Write failing DELETE API tests**

```ts
expect(await handleDeleteDocument(jsonRequest(path, {
  permanent: true, confirmation: revision.title,
}, { method: "DELETE" }), revision.id, deps)).toMatchObject({ status: 200 })
expect(deps.service.deleteArchived).toHaveBeenCalledWith(revision.id, revision.title, actor)
```

Assert `{ permanent: true }`, extra keys, wrong types, and a nonempty draft-deletion body return 400 without a service call. Assert `confirmation_mismatch` uses 422 and `delete_dependency`/`invalid_state` use 409.

- [ ] **Step 7: Implement the strict DELETE body union**

Use:

```ts
const deleteSchema = z.union([
  z.object({}).strict(),
  z.object({ permanent: z.literal(true), confirmation: z.string().min(1).max(160) }).strict(),
])
```

Dispatch the empty object to `deleteDraft`; dispatch the permanent shape to `deleteArchived`. Return `{ ok: true }` and no-store headers.

- [ ] **Step 8: Run document domain/API tests and verify GREEN**

Run: `npm run test:unit -- tests/documents/workflow.test.ts tests/documents/publication-store.test.ts tests/documents/admin-api.test.ts`

Expected: PASS.

- [ ] **Step 9: Commit permanent deletion**

```bash
git add lib/documents app/api/admin/documents lib/http/admin-documents.ts tests/documents
git commit -m "feat: delete archived document revisions"
```

---

### Task 3: Make lifecycle feedback visible in the editor

**Files:**
- Modify: `components/admin/document-editor.tsx`
- Modify: `app/admin/admin.module.css`
- Modify: `tests/components/document-admin.test.tsx`

**Interfaces:**
- Consumes: safe archive/delete error codes and DELETE permanent body.
- Produces: focused workflow alerts and archived-only `Delete permanently` interaction.

- [ ] **Step 1: Write failing archive-feedback tests**

Mock an `{ error: "archive_dependency" }` 409 response, click Archive, and assert the alert says `Archive the published English revision first.` and receives focus. Repeat `revision_changed` and `invalid_state` with their exact actionable messages.

- [ ] **Step 2: Write failing permanent-delete tests**

Render an archived revision, assert `Delete permanently` is present, mock `window.prompt` with the exact title, click, and assert:

```ts
expect(fetch).toHaveBeenCalledWith(`/api/admin/documents/${revision.id}`, {
  method: "DELETE",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ permanent: true, confirmation: revision.title }),
})
expect(router.replace).toHaveBeenCalledWith("/admin/documents")
```

Assert prompt cancellation makes no request and published/scheduled revisions never show the permanent-delete action.

- [ ] **Step 3: Run component tests and verify RED**

Run: `npm run test:unit -- tests/components/document-admin.test.tsx`

Expected: FAIL because errors are generic and archived deletion is absent.

- [ ] **Step 4: Implement actionable error mapping and focus**

Extend `mutationErrorMessage` for all lifecycle codes. Add `const errorRef = useRef<HTMLParagraphElement>(null)` and a `useEffect` that focuses it when `error` changes. Render the immutable-workflow alert next to actions with `tabIndex={-1}`.

- [ ] **Step 5: Implement archived deletion**

Add `deleteArchived` that calls `window.prompt("Type the document title to delete it permanently:", "")`, cancels on `null`, sends the strict DELETE body, and on success retires the navigation guard and routes to `/admin/documents`. Reuse the existing danger button style and disable it while pending.

- [ ] **Step 6: Run editor tests and verify GREEN**

Run: `npm run test:unit -- tests/components/document-admin.test.tsx`

Expected: PASS.

- [ ] **Step 7: Commit lifecycle UI**

```bash
git add components/admin/document-editor.tsx app/admin/admin.module.css tests/components/document-admin.test.tsx
git commit -m "fix: surface document lifecycle actions"
```

---

### Task 4: Verify the integrated feature branch

**Files:**
- Modify: `docs/superpowers/plans/2026-08-27-document-lifecycle-controls.md` only to check completed steps.
- Modify: `docs/superpowers/plans/2026-08-27-agent-setup-simplification.md` only to check completed steps.

**Interfaces:**
- Consumes: both completed subsystems.
- Produces: a reviewable stacked pull request with reproducible verification evidence.

- [ ] **Step 1: Run formatting and static checks**

Run: `git diff --check && npm run typecheck && npm run lint`

Expected: every command exits 0.

- [ ] **Step 2: Run the full unit suite**

Run: `npm run test:unit`

Expected: all test files pass.

- [ ] **Step 3: Run the production build**

Run: `npm run build`

Expected: Next.js build succeeds and all admin/document routes appear.

- [ ] **Step 4: Review the complete branch diff**

Run: `git diff --stat codex/document-publish-fix...HEAD && git diff --check codex/document-publish-fix...HEAD`

Expected: only the approved Agent setup, document lifecycle, tests, docs, and styles are present.

- [ ] **Step 5: Push and create the stacked PR**

```bash
git push -u origin codex/admin-ai-document-lifecycle
gh pr create --base codex/document-publish-fix --head codex/admin-ai-document-lifecycle --title "feat: simplify AI setup and document lifecycle" --body-file /tmp/laflabs-admin-ai-document-pr.md
```

The PR body must state that PR #7 is its temporary base, list the security invariants, and include exact typecheck/lint/test/build results.
