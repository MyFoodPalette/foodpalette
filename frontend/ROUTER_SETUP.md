# TanStack Router Setup

This project now uses TanStack Router for client-side routing.

## Routes

- `/` - Home page (existing Vite + React demo)
- `/test-fetchsuggestions` - Test page for calling the Supabase `fetchSuggestions` function

## Configuration

### Environment Variables

Create a `.env` file in the `frontend` directory with the following variables:

```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Replace `your-anon-key-here` with your actual Supabase anonymous key.

## Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. The TanStack Router plugin will automatically generate the route tree (`routeTree.gen.ts`) based on the files in `src/routes/`.

## Route Structure

```
src/routes/
├── __root.tsx          # Root layout with navigation
├── index.tsx           # Home page (/)
└── test-fetchsuggestions.tsx  # Test page (/test-fetchsuggestions)
```

## Adding New Routes

To add a new route, create a new file in `src/routes/`:

- `src/routes/about.tsx` → `/about`
- `src/routes/blog/index.tsx` → `/blog`
- `src/routes/blog/$postId.tsx` → `/blog/:postId`

The TanStack Router Vite plugin will automatically regenerate the route tree.

## Features

- **Type-safe routing** - Full TypeScript support with autocomplete
- **File-based routing** - Routes are automatically generated from the file structure
- **Navigation** - Global navigation in the root layout
- **Dev tools** - TanStack Router DevTools included in development mode
