import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'

export const Route = createRootRoute({
  component: () => (
    <>
      <div style={{ padding: '1rem', borderBottom: '1px solid #ccc' }}>
        <nav style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/" style={{ textDecoration: 'none' }} activeProps={{ style: { fontWeight: 'bold' } }}>
            Home
          </Link>
          <Link to="/test-fetchsuggestions" style={{ textDecoration: 'none' }} activeProps={{ style: { fontWeight: 'bold' } }}>
            Test Fetch Suggestions
          </Link>
        </nav>
      </div>
      <Outlet />
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </>
  ),
})
