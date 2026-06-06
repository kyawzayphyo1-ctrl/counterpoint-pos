# Counterpoint PoS

A small tablet and mobile point-of-sale starter app.

## What it does

- Product grid with search and category tabs
- Standalone category page with editable product details
- Barcode and product image fields
- Settings for printer test print, dark mode, item layout, and language
- IndexedDB local database with browser-storage fallback
- Backup export/import and per-staff PIN login/signup
- Receipt print buttons and barcode camera scan where supported
- Tap-to-add cart
- Quantity controls and discount field
- Cash checkout with change due
- Buying price, selling price, and profit estimate
- Quantity bought, quantity left, and automatic stock reduction after sales
- Receipt history saved in the browser
- Add-product form saved in the browser
- PWA manifest and service worker for local install/offline testing

## Open it

Open `index.html` in a browser, or serve the folder locally if you want install/offline behavior.

The app stores products and receipts in the browser using `localStorage`.
