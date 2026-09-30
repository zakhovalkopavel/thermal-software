import type { WallLayerDraft } from './wall-layer-draft.type';

export type WallLayersEditorProps = {
  value: WallLayerDraft[];
  onChange: (next: WallLayerDraft[]) => void;
  title?: string;
};
