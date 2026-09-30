import { Fragment, useState } from 'react';
import { Box, Chip, Collapse, List, ListItemButton, ListItemText, TextField, Typography } from '@mui/material';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { RAW_MATERIALS_UI } from './constants/raw-materials-ui.constants';
import type { MaterialCategoryListProps } from './types/material-category-list-props.type';

export function MaterialCategoryList({ categories, expanded, onExpand, selectedId, onSelect }: MaterialCategoryListProps) {
  const [search, setSearch] = useState('');
  const needle = search.trim().toLowerCase();
  const visible = categories
    .map((category) => ({
      ...category,
      matches: category.materials.filter(
        (entry) => !needle || entry.name.toLowerCase().includes(needle) || entry.materialId.includes(needle),
      ),
    }))
    .filter((category) => category.matches.length > 0);

  return (
    <Box>
      <TextField size="small" fullWidth label="Search materials" value={search} onChange={(event) => setSearch(event.target.value)} />
      <List
        dense
        sx={{ mt: 1, maxHeight: RAW_MATERIALS_UI.listMaxHeight, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 1 }}
      >
        {visible.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
            No material matches “{search}”.
          </Typography>
        )}
        {visible.map((category) => {
          const open = Boolean(needle) || expanded === category.group;
          return (
            <Fragment key={category.group}>
              <ListItemButton onClick={() => onExpand(expanded === category.group ? null : category.group)}>
                <ListItemText primary={category.label} slotProps={{ primary: { fontWeight: 600 } }} />
                <Chip size="small" label={needle ? `${category.matches.length}/${category.materials.length}` : category.materials.length} sx={{ mr: 1 }} />
                {open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
              </ListItemButton>
              <Collapse in={open} unmountOnExit>
                <List dense disablePadding>
                  {category.matches.map((entry) => (
                    <ListItemButton
                      key={entry.materialId}
                      selected={entry.materialId === selectedId}
                      onClick={() => onSelect(entry.materialId, category.group)}
                      sx={{ pl: 4 }}
                    >
                      <ListItemText primary={entry.name} secondary={entry.materialId} />
                    </ListItemButton>
                  ))}
                </List>
              </Collapse>
            </Fragment>
          );
        })}
      </List>
    </Box>
  );
}
