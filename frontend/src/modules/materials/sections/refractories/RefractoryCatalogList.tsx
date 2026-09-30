import { useState } from 'react';
import {
  Box,
  Checkbox,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  TextField,
  Typography,
} from '@mui/material';
import type { RefractoryCatalogListProps } from './types/refractory-catalog-list-props.type';

export function RefractoryCatalogList({ groups, selected, onChange, max }: RefractoryCatalogListProps) {
  const [search, setSearch] = useState('');
  const needle = search.trim().toLowerCase();
  const visible = groups
    .map((group) => ({
      ...group,
      products: group.products.filter(
        (product) => !needle || product.name.toLowerCase().includes(needle) || product.materialId.includes(needle),
      ),
    }))
    .filter((group) => group.products.length > 0);

  const toggle = (materialId: string) =>
    onChange(selected.includes(materialId) ? selected.filter((id) => id !== materialId) : [...selected, materialId]);

  return (
    <Box>
      <TextField size="small" fullWidth label="Search products" value={search} onChange={(event) => setSearch(event.target.value)} />
      <Typography variant="caption" color="text.secondary">
        Selected {selected.length} of max {max}
      </Typography>
      <List dense sx={{ maxHeight: 380, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 1 }}>
        {visible.map((group) => (
          <li key={group.key}>
            <ul style={{ padding: 0 }}>
              <ListSubheader sx={{ lineHeight: '32px', display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: group.color }} />
                {group.label}
              </ListSubheader>
              {group.products.map((product) => {
                const checked = selected.includes(product.materialId);
                return (
                  <ListItemButton
                    key={product.materialId}
                    onClick={() => toggle(product.materialId)}
                    disabled={!checked && selected.length >= max}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Checkbox edge="start" size="small" checked={checked} tabIndex={-1} disableRipple />
                    </ListItemIcon>
                    <ListItemText primary={product.name} secondary={product.materialId} />
                  </ListItemButton>
                );
              })}
            </ul>
          </li>
        ))}
      </List>
    </Box>
  );
}
