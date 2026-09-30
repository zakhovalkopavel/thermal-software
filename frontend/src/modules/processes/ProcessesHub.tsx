import { Card, CardActionArea, CardContent, Grid, Stack, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import { PROCESSES_SECTIONS } from './constants/processes-sections.constants';

export function ProcessesHub() {
  return (
    <Stack spacing={2}>
      <Typography variant="h5">Processes</Typography>
      <Typography color="text.secondary">
        Furnace tasks built on the Materials catalogues: combustion, heat loss through the wall, heat transfer, recuperation and transient heating.
      </Typography>
      <Grid container spacing={2}>
        {PROCESSES_SECTIONS.map((section) => (
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
