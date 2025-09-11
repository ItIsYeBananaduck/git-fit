# Technically Fit

A comprehensive fitness marketplace that combines mobile and web applications for fitness tracking, training programs, and trainer-client interactions.

## Prerequisites

- Node.js (version 20 or later)
- pnpm (version 10.13.1)

## Quick Setup

For a one-command setup that handles all prerequisites and dependencies:

```bash
./scripts/setup-dev.sh
```

## Manual Setup

### 1. Install pnpm

If you don't have pnpm installed:

```bash
npm install -g pnpm@10.13.1
```

### 2. Install Dependencies

Install root dependencies:
```bash
pnpm install
```

Install app dependencies:
```bash
cd app
pnpm install
```

### 3. Build and Test

Build the application:
```bash
cd app
pnpm run build
```

Run tests:
```bash
cd app
pnpm run test
```

## Development

Start the development server:
```bash
cd app
pnpm run dev
```

## Troubleshooting

If you encounter "pnpm command not found" errors:
1. Ensure pnpm is installed globally: `npm install -g pnpm@10.13.1`
2. Verify installation: `which pnpm && pnpm --version`
3. If lockfile issues occur, run: `pnpm install --no-frozen-lockfile`

For CI/CD environments, the workflow automatically handles pnpm installation and dependency management.