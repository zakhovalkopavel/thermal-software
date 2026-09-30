import { Card, CardActionArea, CardContent, Grid, Stack, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import { MATERIALS_SECTIONS } from './constants/materials-sections.constants';

export function MaterialsHub() {
  return (
    <Stack spacing={2}>
      <Typography variant="h5">Materials</Typography>
      <Typography color="text.secondary">
        Each section selects its own kind of material, sets the conditions and calculates the properties that kind has.
      </Typography>
      <Grid container spacing={2}>
        {MATERIALS_SECTIONS.map((section) => (
          <Grid key={section.route} size={{ xs: 12, sm: 6, lg: 4 }}>
            <Card sx={{ height: '100%' }}>
              <CardActionArea component={Link} to={section.route} sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {section.label}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {section.description}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}
