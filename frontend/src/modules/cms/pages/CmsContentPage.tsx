import { Alert, CircularProgress, Stack, Typography } from '@mui/material';
import { useLocation } from 'react-router-dom';
import { HtmlContent } from '../components/HtmlContent';
import { InfoPageBackLink } from '../components/InfoPageBackLink';
import { useCmsPage } from '../hooks/useCmsPage';

export function CmsContentPage() {
  const location = useLocation();
  const page = useCmsPage(location.pathname);
  const isInfoPage = location.pathname.startsWith('/info/');

  if (page.isLoading) {
    return <CircularProgress />;
  }
  if (page.isError || !page.data) {
    return <Alert severity="warning">This page is not published yet.</Alert>;
  }

  return (
    <Stack spacing={2}>
      {isInfoPage ? <InfoPageBackLink /> : null}
      <Typography variant="h4">{page.data.title}</Typography>
      {page.data.resume ? (
        <Typography color="text.secondary">{page.data.resume}</Typography>
      ) : null}
      {page.data.bodyHtml ? <HtmlContent html={page.data.bodyHtml} /> : null}
    </Stack>
  );
}
