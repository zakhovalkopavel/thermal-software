import { Box, Card, CardActionArea, CardContent, Chip, Grid, Stack, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import { HealthWidget } from './components/HealthWidget';
import { HOME_MODULES } from './constants/home-modules.constants';

export function Home() {
  return (
    <Stack spacing={4}>
      <Box>
        <Typography variant="h4" gutterBottom>
          Engineering calculations
        </Typography>
        <Typography color="text.secondary">
          Pick a material or a process, set the conditions and calculate.
        </Typography>
      </Box>
      <Grid container spacing={3}>
        {HOME_MODULES.map((module) => (
          <Grid key={module.path} size={{ xs: 12, md: 6 }}>
            <Card sx={{ height: '100%' }}>
              <CardActionArea component={Link} to={module.path} sx={{ height: '100%' }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h5" gutterBottom>
                    {module.title}
                  </Typography>
                  <Typography color="text.secondary" sx={{ mb: 2 }}>
                    {module.description}
                  </Typography>
                  <Stack direction="row" flexWrap="wrap" gap={1}>
                    {module.items.map((item) => (
                      <Chip key={item} label={item} size="small" />
                    ))}
                  </Stack>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
      <HealthWidget />
    </Stack>
  );
}
