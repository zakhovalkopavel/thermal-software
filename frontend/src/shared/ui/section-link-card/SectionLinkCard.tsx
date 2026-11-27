import { Box, Card, CardActionArea, CardContent, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

type SectionLinkCardProps = {
  to: string;
  label: string;
  description: string;
  icon: ReactNode;
};

export function SectionLinkCard({ to, label, description, icon }: SectionLinkCardProps) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardActionArea component={Link} to={to} sx={{ height: '100%', alignItems: 'stretch' }}>
        <CardContent sx={{ height: '100%' }}>
          <Stack direction="row" spacing={2} alignItems="flex-start">
            <Box
              sx={{
                color: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mt: 0.25,
              }}
              aria-hidden
            >
              {icon}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h6" gutterBottom>
                {label}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {description}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
