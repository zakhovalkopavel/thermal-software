import { Box, Button, Stack } from '@mui/material';
import { useCallback, useState } from 'react';
import { useCmsPage } from '../hooks/useCmsPage';
import type { PropertyTerm } from '../types/property-term.type';
import { HtmlContent } from './HtmlContent';
import { PropertyTokenText } from './PropertyTokenText';

type SectionIntroProps = {
  infoPath: string;
  fallbackResume?: string;
};

function scrollToAnchor(anchorId: string): void {
  window.requestAnimationFrame(() => {
    document.getElementById(anchorId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

export function SectionIntro({ infoPath, fallbackResume }: SectionIntroProps) {
  const page = useCmsPage(infoPath);
  const [expanded, setExpanded] = useState(false);

  const resume = page.data?.resume?.trim() || fallbackResume?.trim() || '';
  const bodyHtml = page.data?.bodyHtml?.trim() || '';

  const expandToTerm = useCallback((term: PropertyTerm) => {
    setExpanded(true);
    scrollToAnchor(term.anchorId);
  }, []);

  if (!resume && !bodyHtml) {
    return null;
  }

  if (expanded && bodyHtml) {
    return (
      <Stack spacing={1} sx={{ mb: 0.5 }}>
        <HtmlContent html={bodyHtml} />
        <Box>
          <Button size="small" onClick={() => setExpanded(false)}>
            less
          </Button>
        </Box>
      </Stack>
    );
  }

  if (!resume) {
    return null;
  }

  return (
    <Stack spacing={0.5} sx={{ mb: 0.5 }}>
      <Box>
        <PropertyTokenText text={resume} onTokenActivate={bodyHtml ? expandToTerm : undefined} />
        {bodyHtml ? (
          <>
            {' '}
            <Button size="small" onClick={() => setExpanded(true)} sx={{ verticalAlign: 'baseline', minWidth: 0, px: 0.5 }}>
              … more
            </Button>
          </>
        ) : null}
      </Box>
    </Stack>
  );
}
