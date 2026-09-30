import { Box, Button, IconButton, Link, Stack, Tooltip, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { NumberField } from '../../../components/calc';
import { MaterialPicker } from '../../materials';
import type { MaterialPickerKind, MaterialPickerSelection } from '../../materials';
import { PROCESSES_UI } from '../constants/processes-ui.constants';
import { toNewWallLayerDraft } from '../mappers/new-wall-layer-draft.mapper';
import type { WallLayerDraft } from '../types/wall-layer-draft.type';
import type { WallLayersEditorProps } from '../types/wall-layers-editor-props.type';

const WALL_KINDS: MaterialPickerKind[] = ['metal', 'refractory'];

const propertiesHref = (selection: MaterialPickerSelection) => {
  const route = selection.kind === 'metal' ? PROCESSES_UI.materialRoutes.metal : PROCESSES_UI.materialRoutes.refractory;
  return `${route}?${PROCESSES_UI.materialParam}=${encodeURIComponent(selection.materialId)}`;
};

export function WallLayersEditor({ value, onChange, title = 'Layers (inside → outside)' }: WallLayersEditorProps) {
  const update = (id: string, patch: Partial<Omit<WallLayerDraft, 'id'>>) =>
    onChange(value.map((layer) => (layer.id === id ? { ...layer, ...patch } : layer)));
  const move = (index: number, offset: number) => {
    const next = [...value];
    const [layer] = next.splice(index, 1);
    next.splice(index + offset, 0, layer);
    onChange(next);
  };

  return (
    <Stack spacing={1}>
      <Typography variant="subtitle2">{title}</Typography>
      {value.map((layer, index) => (
        <Stack key={layer.id} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ width: 20 }}>
            {index + 1}
          </Typography>
          <Box sx={{ flex: 1, minWidth: 180 }}>
            <MaterialPicker kinds={WALL_KINDS} value={layer.material} onChange={(material) => update(layer.id, { material })} />
          </Box>
          <Box sx={{ width: 120 }}>
            <NumberField
              label="Thickness"
              unit="mm"
              value={layer.thicknessMm}
              onChange={(thicknessMm) => update(layer.id, { thicknessMm })}
              min={PROCESSES_UI.wallLayer.thicknessMin_mm}
            />
          </Box>
          <Tooltip title="View properties">
            <span>
              <IconButton
                size="small"
                component={Link}
                href={layer.material ? propertiesHref(layer.material) : undefined}
                target="_blank"
                rel="noopener"
                disabled={!layer.material}
              >
                <OpenInNewIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <IconButton size="small" aria-label="Move up" disabled={index === 0} onClick={() => move(index, -1)}>
            <ArrowUpwardIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" aria-label="Move down" disabled={index === value.length - 1} onClick={() => move(index, 1)}>
            <ArrowDownwardIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" aria-label="Remove layer" onClick={() => onChange(value.filter((item) => item.id !== layer.id))}>
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Stack>
      ))}
      <Box>
        <Button size="small" startIcon={<AddIcon />} onClick={() => onChange([...value, toNewWallLayerDraft()])}>
          Add layer
        </Button>
      </Box>
    </Stack>
  );
}
