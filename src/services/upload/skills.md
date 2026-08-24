# upload service skills

Use when editing `src/services/upload/` or wiring a new upload UI to it.

## Do
- Call `fileUploadService.makeRequest(files, customData)`; it reuses the in-flight promise if a request is already pending.
- Gate at 100 MB per file (`upload_file_too_big` → `EditorMessageKey.SINGLE_UPLOAD_SIZE_ERR`) and 500 MB total (`upload_size_big` → `EditorMessageKey.UPLOAD_SIZE_BIG`); skip the total-size toast when `customData.subfolder === 'images'`.
- Sanitize `file_sn`/`file_on`/`ext` with `sanitizeFileArrays` — drop empty `file_sn`, derive `ext` from the sn extension when missing.
- Build the FormData body via `getDefaultDocBag({ stripAcl: true })` — never send `_w`/`_r` on upload.

## Do not
- Force `Content-Type: multipart/form-data` on the request — let the browser/axios set the boundary.
- Wire this service into figures/query/supplementary dialogs in this plan; only the service exists so far.
- Throw on HTTP failure — `console.error` and return `null`, matching legacy `FileUploadModule.js`.

## Related
- Parent: [../README.md](../README.md)
- Sibling: [../error/skills.md](../error/skills.md)
- Index: [docs/SKILLS_AND_WORKFLOWS.md](../../../docs/SKILLS_AND_WORKFLOWS.md)
