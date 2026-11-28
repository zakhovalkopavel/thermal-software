import {
  Alert,
  Button,
  Checkbox,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { CMS_QUERY_KEYS } from '@/modules/cms/constants/cms-query-keys.constants';
import type { CmsPage, PageKind } from '@/modules/cms/types/page.type';
import { adminListPages, adminUpdatePage } from '../api/admin.api';
import { HtmlEditor } from '../components/HtmlEditor';

const KINDS: PageKind[] = ['calc', 'hub', 'info', 'standalone'];

export function AdminPageEditPage() {
  const [params] = useSearchParams();
  const path = params.get('path') || '/';
  const queryClient = useQueryClient();
  const pages = useQuery({
    queryKey: CMS_QUERY_KEYS.adminPages,
    queryFn: adminListPages,
  });
  const current = useMemo(
    () => (pages.data ?? []).find((page) => page.path === path),
    [pages.data, path],
  );
  const [draft, setDraft] = useState<Partial<CmsPage>>({});
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (current) {
      setDraft(current);
    }
  }, [current]);

  const save = useMutation({
    mutationFn: () =>
      adminUpdatePage(path, {
        kind: draft.kind,
        title: draft.title,
        resume: draft.resume,
        bodyHtml: draft.bodyHtml,
        seoTitle: draft.seoTitle,
        seoDescription: draft.seoDescription,
        seoKeywords: draft.seoKeywords,
        ogImageUrl: draft.ogImageUrl,
        canonicalPath: draft.canonicalPath,
        published: draft.published,
      }),
    onSuccess: async () => {
      setMessage('Saved');
      await queryClient.invalidateQueries({ queryKey: CMS_QUERY_KEYS.adminPages });
      await queryClient.invalidateQueries({ queryKey: CMS_QUERY_KEYS.page(path) });
    },
    onError: () => setMessage('Save failed'),
  });

  if (pages.isLoading) {
    return <Typography>Loading…</Typography>;
  }
  if (!current) {
    return <Alert severity="warning">Page not found: {path}</Alert>;
  }

  const showBody = draft.kind === 'info' || draft.kind === 'standalone';

  return (
    <Stack spacing={2}>
      <Button component={RouterLink} to="/admin" sx={{ alignSelf: 'flex-start' }}>
        Back to pages
      </Button>
      <Typography variant="h5">Edit {path}</Typography>
      {message ? <Alert severity={message === 'Saved' ? 'success' : 'error'}>{message}</Alert> : null}
      <TextField
        select
        label="Kind"
        value={draft.kind || 'calc'}
        onChange={(event) =>
          setDraft((previous) => ({ ...previous, kind: event.target.value as PageKind }))
        }
      >
        {KINDS.map((kind) => (
          <MenuItem key={kind} value={kind}>
            {kind}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        label="Title"
        value={draft.title || ''}
        onChange={(event) => setDraft((previous) => ({ ...previous, title: event.target.value }))}
        fullWidth
      />
      <TextField
        label="Resume"
        value={draft.resume || ''}
        onChange={(event) => setDraft((previous) => ({ ...previous, resume: event.target.value }))}
        fullWidth
        multiline
        minRows={2}
      />
      {showBody ? (
        <HtmlEditor
          value={draft.bodyHtml || ''}
          onChange={(html) => setDraft((previous) => ({ ...previous, bodyHtml: html }))}
        />
      ) : (
        <Alert severity="info">Calc/hub pages use SEO + resume only (no body).</Alert>
      )}
      <Typography variant="h6">SEO</Typography>
      <TextField
        label="SEO title"
        value={draft.seoTitle || ''}
        onChange={(event) => setDraft((previous) => ({ ...previous, seoTitle: event.target.value }))}
        fullWidth
      />
      <TextField
        label="SEO description"
        value={draft.seoDescription || ''}
        onChange={(event) =>
          setDraft((previous) => ({ ...previous, seoDescription: event.target.value }))
        }
        fullWidth
        multiline
        minRows={2}
      />
      <TextField
        label="SEO keywords"
        value={draft.seoKeywords || ''}
        onChange={(event) =>
          setDraft((previous) => ({ ...previous, seoKeywords: event.target.value }))
        }
        fullWidth
      />
      <TextField
        label="OG image URL"
        value={draft.ogImageUrl || ''}
        onChange={(event) =>
          setDraft((previous) => ({ ...previous, ogImageUrl: event.target.value }))
        }
        fullWidth
      />
      <TextField
        label="Canonical path"
        value={draft.canonicalPath || ''}
        onChange={(event) =>
          setDraft((previous) => ({ ...previous, canonicalPath: event.target.value }))
        }
        fullWidth
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={Boolean(draft.published)}
            onChange={(event) =>
              setDraft((previous) => ({ ...previous, published: event.target.checked }))
            }
          />
        }
        label="Published"
      />
      <Button variant="contained" onClick={() => save.mutate()} disabled={save.isPending}>
        Save
      </Button>
    </Stack>
  );
}
