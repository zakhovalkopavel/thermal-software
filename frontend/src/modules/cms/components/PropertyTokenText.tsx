import { Box, Link, Tooltip, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { PROPERTY_TERMS_BY_SYMBOL_LENGTH } from '../constants/property-terms.constants';
import type { PropertyTerm } from '../types/property-term.type';

type PropertyTokenTextProps = {
  text: string;
  onTokenActivate?: (term: PropertyTerm) => void;
};

type TextSegment = { kind: 'text'; value: string } | { kind: 'token'; term: PropertyTerm };

const BOUNDARY = /[\s,;:()[\]/.·↔→+\-]/;

function isBoundaryChar(char: string | undefined): boolean {
  return char === undefined || BOUNDARY.test(char);
}

function splitByPropertyTokens(text: string): TextSegment[] {
  if (!text) {
    return [];
  }
  const segments: TextSegment[] = [];
  let cursor = 0;
  let index = 0;
  while (index < text.length) {
    let matched: PropertyTerm | null = null;
    for (const term of PROPERTY_TERMS_BY_SYMBOL_LENGTH) {
      if (!text.startsWith(term.symbol, index)) {
        continue;
      }
      const before = index === 0 ? undefined : text[index - 1];
      const after = text[index + term.symbol.length];
      if (isBoundaryChar(before) && isBoundaryChar(after)) {
        matched = term;
        break;
      }
    }
    if (matched) {
      if (cursor < index) {
        segments.push({ kind: 'text', value: text.slice(cursor, index) });
      }
      segments.push({ kind: 'token', term: matched });
      index += matched.symbol.length;
      cursor = index;
      continue;
    }
    index += 1;
  }
  if (cursor < text.length) {
    segments.push({ kind: 'text', value: text.slice(cursor) });
  }
  return segments;
}

export function PropertyTokenText({ text, onTokenActivate }: PropertyTokenTextProps) {
  const segments = splitByPropertyTokens(text);
  const nodes: ReactNode[] = segments.map((segment, index) => {
    if (segment.kind === 'text') {
      return (
        <Box component="span" key={`t-${index}`}>
          {segment.value}
        </Box>
      );
    }
    const { term } = segment;
    return (
      <Tooltip key={`p-${term.id}-${index}`} title={term.tooltip} describeChild>
        <Link
          component="button"
          type="button"
          variant="body2"
          underline="always"
          onClick={() => onTokenActivate?.(term)}
          sx={{
            verticalAlign: 'baseline',
            font: 'inherit',
            cursor: 'pointer',
            color: 'primary.main',
            textDecorationStyle: 'dotted',
          }}
        >
          {term.symbol}
        </Link>
      </Tooltip>
    );
  });

  return (
    <Typography component="span" variant="body2" color="text.secondary">
      {nodes}
    </Typography>
  );
}
