---
name: bengkel-pos-receipts
description: Design, fix, and verify BengkelPro POS transaction receipts, thermal printouts, and their PDF/share output. Use for nota/struk layout and print behavior, not general transaction changes.
---

# BengkelPro Receipts

The customer-facing receipt is rendered by `src/components/InvoiceModal.tsx`. Its visual reference is the live preview in `src/components/SettingsView.tsx` under **Pengaturan → Isi Nota & Struk**. The same receipt DOM node is captured by `html2canvas-pro` and embedded into the PDF used for printing and WhatsApp sharing.

## Receipt content

- Use immutable transaction snapshots for the receipt header, footer, and warranty wording.
- Show merchant details, invoice number, date, customer/vehicle when applicable, purchased services/parts, discount, payment total/status, and warranty when the transaction grants it. Use the merchant phone in the header as the sole customer-help contact.
- Do not put internal intake details on a customer receipt. A service complaint (`complaint`) must never be rendered; it remains in the staff-facing service record.
- Do not add receipt settings that duplicate operational data. Warranty duration and terms belong to the transaction warranty flow and its immutable snapshots; do not expose a separate general warranty-text input. Do not add a separate help-contact input when the business phone already appears in the receipt header.
- Omit optional phone, odometer, mechanic, warranty, and footer sections when their setting or snapshot is absent.

## Layout and output

- Treat the Settings receipt preview as the visual contract. Match its card treatment, header, metadata grid, dividers, line-item hierarchy, total block, warranty/contact, and footer before adding transaction-specific values. Do not introduce a parallel receipt style in `InvoiceModal`.
- The modal may display the same responsive card as Settings. Apply the selected 58 mm or 80 mm width only while capturing the receipt for PDF, so the user-facing preview and the settings preview remain visually equivalent.
- Design for the selected thermal paper width first. Keep metadata in a stable reading order; avoid sparse two-column grids that detach labels and values on narrow receipts.
- The selected 58 mm or 80 mm width must affect the captured receipt node before PDF generation. Printing and sharing must use the same PDF path.
- A responsive modal may scroll, but the captured receipt must expose its full height without clipping.
- Preserve monochrome thermal printing and accessible labels for modal controls.

## Verification

Run `npm run lint` and, when feasible, `npm run build`. Compare the transaction note against Settings preview before delivery, then inspect both 58 mm and 80 mm with long customer names, services with parts, and retail sales. Confirm complaint text is absent and captured output is not clipped.
