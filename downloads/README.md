# /downloads — lead-magnet PDFs

The `/blueprint` landing page and its welcome email link to two static PDFs that
**must be dropped into this folder before launch** (they are produced separately —
do not generate them):

| File name (exact) | Tool |
|---|---|
| `breakthrough-blueprint.pdf` | The Breakthrough Blueprint |
| `precision-field-toolkit.pdf` | The Precision Field Toolkit |

Both the success-panel download buttons (`blueprint.html`) and the Resend welcome
email (`app/email_client.py → send_blueprint`) reference these exact paths:

- https://keyshiftlondon.org/downloads/breakthrough-blueprint.pdf
- https://keyshiftlondon.org/downloads/precision-field-toolkit.pdf

Until the files are present, those links will 404. Keep the filenames exactly as above.
