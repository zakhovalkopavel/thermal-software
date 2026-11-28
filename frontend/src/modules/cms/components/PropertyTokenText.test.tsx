import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PropertyTokenText } from './PropertyTokenText';

describe('PropertyTokenText', () => {
  it('wraps known property symbols without matching letters inside words', () => {
    render(
      <PropertyTokenText text="Cp, Cv, γ, M, μ, ν, ρ, λ and Pr of pure gases versus temperature." />,
    );
    expect(screen.getByRole('button', { name: 'Cp' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pr' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'a' })).not.toBeInTheDocument();
  });

  it('invokes onTokenActivate when a token is clicked', () => {
    const onTokenActivate = vi.fn();
    render(<PropertyTokenText text="Plot Cp versus T." onTokenActivate={onTokenActivate} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cp' }));
    expect(onTokenActivate).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'cp', symbol: 'Cp', anchorId: 'prop-cp' }),
    );
  });
});
