import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { SectionIntro } from './SectionIntro';

vi.mock('../hooks/useCmsPage', () => ({
  useCmsPage: () => ({
    data: {
      path: '/info/materials/gases/pure',
      kind: 'info',
      title: 'Pure gas',
      resume: 'Cp, Cv, γ, M, μ, ν, ρ, λ and Pr of pure gases versus temperature.',
      bodyHtml:
        '<h2>Overview</h2><p>Overview text.</p><h3 id="prop-cp">Cp</h3><p>Cp details.</p>',
      published: true,
    },
    isLoading: false,
    isError: false,
  }),
}));

function renderIntro() {
  const client = new QueryClient();
  return render(
    <QueryClientProvider client={client}>
      <SectionIntro infoPath="/info/materials/gases/pure" />
    </QueryClientProvider>,
  );
}

describe('SectionIntro', () => {
  it('shows short resume and expands on more', () => {
    renderIntro();
    expect(screen.getByRole('button', { name: 'Cp' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '… more' })).toBeInTheDocument();
    expect(screen.queryByText('Overview text.')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '… more' }));
    expect(screen.getByText('Overview text.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'less' })).toBeInTheDocument();
  });

  it('expands to full info when a property token is clicked', () => {
    const scrollIntoView = vi.fn();
    const original = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = scrollIntoView;

    renderIntro();
    fireEvent.click(screen.getByRole('button', { name: 'Cp' }));
    expect(screen.getByText('Cp details.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'less' })).toBeInTheDocument();

    Element.prototype.scrollIntoView = original;
  });

  it('collapses back to the short resume on less', () => {
    renderIntro();
    fireEvent.click(screen.getByRole('button', { name: '… more' }));
    fireEvent.click(screen.getByRole('button', { name: 'less' }));
    expect(screen.getByRole('button', { name: '… more' })).toBeInTheDocument();
    expect(screen.queryByText('Overview text.')).not.toBeInTheDocument();
  });
});
