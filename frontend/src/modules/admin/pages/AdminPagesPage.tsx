import {
  Alert,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Button,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { Link as RouterLink } from 'react-router-dom';
import { CMS_QUERY_KEYS } from '@/modules/cms/constants/cms-query-keys.constants';
import { adminListPages } from '../api/admin.api';

export function AdminPagesPage() {
  const pages = useQuery({
    queryKey: CMS_QUERY_KEYS.adminPages,
    queryFn: adminListPages,
  });

  if (pages.isLoading) {
    return <CircularProgress />;
  }
  if (pages.isError) {
    return <Alert severity="error">Failed to load pages</Alert>;
  }

  return (
    <>
      <Typography variant="h5" gutterBottom>
        Pages
      </Typography>
      <Paper>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Path</TableCell>
              <TableCell>Kind</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Published</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {(pages.data ?? []).map((page) => (
              <TableRow key={page.path}>
                <TableCell>{page.path}</TableCell>
                <TableCell>{page.kind}</TableCell>
                <TableCell>{page.title}</TableCell>
                <TableCell>{page.published ? 'yes' : 'no'}</TableCell>
                <TableCell align="right">
                  <Button
                    component={RouterLink}
                    to={`/admin/pages/edit?path=${encodeURIComponent(page.path)}`}
                    size="small"
                  >
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </>
  );
}
