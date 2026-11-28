import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { InfoPageBackLink } from './InfoPageBackLink';

describe('InfoPageBackLink', () => {
  it('links back using the derived calculator path', () => {
    render(
      <MemoryRouter initialEntries={['/info/materials/gases/details/heat-capacity']}>
        <Routes>
          <Route path="/info/materials/*" element={<InfoPageBackLink />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: 'Back to calculator' })).toHaveAttribute(
      'href',
      '/materials/gases',
    );
  });

  it('prefers the back query parameter', () => {
    render(
      <MemoryRouter initialEntries={['/info/processes/htc/details/nusselt-correlations?back=/processes/htc']}>
        <Routes>
          <Route path="/info/processes/*" element={<InfoPageBackLink />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: 'Back to calculator' })).toHaveAttribute(
      'href',
      '/processes/htc',
    );
  });
});
