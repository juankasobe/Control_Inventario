# Control Inventario

Desktop inventory management app built with Angular, Electron, and Firebase Firestore. It lets users manage products, adjust stock, and review stock movement history with an audit trail.

## Features

- Product listing, creation, editing, and deletion.
- Stock increases and decreases with invoice and description metadata.
- Firestore-backed movement history per product.
- Canonical stock movement model with legacy read compatibility.
- Transactional stock updates so stock quantity and audit records stay consistent.
- Search and pagination for movement history.
- Electron desktop packaging through Electron Forge.

## Tech Stack

| Area | Tooling |
| --- | --- |
| Frontend | Angular 19, TypeScript |
| Desktop | Electron, Electron Forge |
| Data | Firebase Firestore, AngularFire |
| UI | Angular Material, Tailwind CSS, Flowbite, SweetAlert2, ngx-toastr |
| Tests | Karma, Jasmine, Angular TestBed |

## Getting Started

### Prerequisites

- Node.js compatible with Angular 19.
- npm.
- Firebase project configured for Firestore.

### Install dependencies

```bash
npm install
```

### Run tests

```bash
npm test
```

### Run the Angular build

```bash
npm run build
```

### Start the Electron app

```bash
npm start
```

## Available Scripts

| Command | Description |
| --- | --- |
| `npm start` | Starts the Electron Forge app. |
| `npm run electron` | Runs Electron directly with `main.js`. |
| `npm run electron-build` | Builds Angular and launches Electron. |
| `npm run build` | Builds the Angular app. |
| `npm run watch` | Builds Angular in watch mode. |
| `npm test` | Runs Angular/Karma tests once. |
| `npm run package` | Packages the desktop app with Electron Forge. |
| `npm run make` | Creates distributable installers/packages. |

## Project Structure

```text
src/app/
  components/
    agregar/                 Product create/edit/delete screen
    listar/                  Product list and stock adjustment screen
    movimientos-producto/    Stock movement history screen
    navbar/                  App navigation
  interface/                 Product and stock movement contracts
  service/                   Firestore inventory service
main.js                      Electron main process
forge.config.js              Electron Forge configuration
```

## Data Model

Products are stored in Firestore under `Productos/{productId}`.

Stock movements are stored under:

```text
Productos/{productId}/cambiosStock/{movementId}
```

New movement records use these canonical fields:

```ts
descripcion: string;
timestamp: unknown;
tipo: 'entrada' | 'salida';
```

Legacy documents using `descipcion`, `timeStamp`, `compra`, or `venta` are still read through compatibility mapping.

## Verification

Before publishing or packaging, run:

```bash
npm test
npx tsc -p tsconfig.app.json --noEmit
npm run build
```

## Notes

- Generated folders such as `node_modules/`, `dist/`, `out/`, `coverage/`, and `.angular/` are ignored.
- Electron renderer Node integration is disabled in `main.js` while context isolation remains enabled.
- Firebase web configuration is currently defined in `src/app/app.config.ts`.
