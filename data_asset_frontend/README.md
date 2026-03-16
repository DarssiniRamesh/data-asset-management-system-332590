# Lightweight React Template for KAVIA

This project provides a minimal React template with a clean, modern UI and minimal dependencies.

## Features

- **Lightweight**: No heavy UI frameworks - uses only vanilla CSS and React
- **Modern UI**: Clean, responsive design with KAVIA brand styling
- **Fast**: Minimal dependencies for quick loading times
- **Simple**: Easy to understand and modify

## Getting Started

In the project directory, you can run:

### `npm start`

Runs the app in development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

### `npm test`

Launches the test runner in interactive watch mode.

### `npm run test:ci`

Runs tests in non-interactive CI mode (sets `CI=true`).

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

## Playwright E2E (BRD backend flows)

This repo includes Playwright tests under `data_asset_frontend/e2e/**` that validate backend-relevant BRD flows via UI and direct API:

- Add Asset (API create + UI list visibility)
- Edit Asset (API update + UI details visibility)
- Delete Asset (RBAC: Editor forbidden, Admin allowed)
- Copy Asset (UI "Confirmation!" modal + lineage visibility best-effort)

### One-time install (browsers)

```bash
npm run e2e:install
```

### Run suite

Make sure the app and backend are running (in this workspace they are typically already running on ports 3000/3001).

```bash
npm run e2e
```

### Useful commands

```bash
npm run e2e:ui
npm run e2e:report
```

### Environment variables

Playwright uses the same variables as the app:

- `REACT_APP_FRONTEND_URL` (defaults to `http://localhost:3000`)
- `REACT_APP_API_BASE` (defaults to `http://localhost:3001`)

## Coding standard tooling (lint/format)

This frontend is configured to enforce consistent style via ESLint + Prettier.

### `npm run lint`

Runs ESLint in CI-friendly mode.

### `npm run lint:fix`

Runs ESLint with auto-fixes enabled.

### `npm run format`

Formats the codebase with Prettier (writes changes).

### `npm run format:check`

Checks formatting with Prettier (does not write changes; use in CI).

## Customization

### Colors

The main brand colors are defined as CSS variables in `src/App.css`:

```css
:root {
  --kavia-orange: #E87A41;
  --kavia-dark: #1A1A1A;
  --text-color: #ffffff;
  --text-secondary: rgba(255, 255, 255, 0.7);
  --border-color: rgba(255, 255, 255, 0.1);
}
```

### Components

This template uses pure HTML/CSS components instead of a UI framework. You can find component styles in `src/App.css`. 

Common components include:
- Buttons (`.btn`, `.btn-large`)
- Container (`.container`)
- Navigation (`.navbar`)
- Typography (`.title`, `.subtitle`, `.description`)

## Learn More

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
