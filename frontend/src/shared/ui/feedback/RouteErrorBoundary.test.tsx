import { render, screen } from '@testing-library/react';
import { createMemoryRouter, Outlet, RouterProvider, type RouteObject } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RouteErrorBoundary } from './RouteErrorBoundary';

const CRASH_MESSAGE = 'section exploded';
const LAYOUT_TEXT = 'Layout header';

const ROUTES: RouteObject[] = [
  {
    path: '/',
    element: (
      <>
        <p>{LAYOUT_TEXT}</p>
        <Outlet />
      </>
    ),
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        errorElement: <RouteErrorBoundary />,
        children: [
          { index: true, element: <p>home</p> },
          {
            path: 'crash',
            Component: () => {
              throw new Error(CRASH_MESSAGE);
            },
          },
        ],
      },
    ],
  },
];

function renderAt(path: string) {
  render(<RouterProvider router={createMemoryRouter(ROUTES, { initialEntries: [path] })} />);
}

describe('RouteErrorBoundary', () => {
  beforeEach(() => {
    // React logs every error caught by a boundary; here those errors are the expected outcome.
    vi.mocked(console.error).mockImplementation(() => {});
  });

  it('shows the error message of a throwing route inside the parent layout', async () => {
    renderAt('/crash');

    expect(await screen.findByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument();
    expect(screen.getByText(CRASH_MESSAGE)).toBeInTheDocument();
    expect(screen.getByText(LAYOUT_TEXT)).toBeInTheDocument();
  });

  it('links back to the home page', async () => {
    renderAt('/crash');

    expect(await screen.findByRole('link', { name: 'Back to home' })).toHaveAttribute('href', '/');
  });

  it('shows status and status text for a route error response', async () => {
    renderAt('/does-not-exist');

    expect(await screen.findByText('404 Not Found')).toBeInTheDocument();
  });
});
