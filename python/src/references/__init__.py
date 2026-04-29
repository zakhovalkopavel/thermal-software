"""
references — Python mirror of the project's literature reference system.

Provides ``RefKey`` and ``REFERENCES_META`` matching the TypeScript definitions:
  backend/src/common/thermal/enum/ref-key.enum.ts
  backend/src/common/thermal/dto/ref-key.dto.ts

Source of truth: docs/REFERENCES.md

Usage
-----
  from references import RefKey, REFERENCES_META

  # Reference a source in a docstring — use RefKey identifiers:
  #   Refs: RefKey.NASA7, RefKey.NASA9

  # Look up metadata at runtime:
  meta = REFERENCES_META[RefKey.NASA7]
  print(meta['index'], meta['name'], meta.get('url'))
"""

from references.ref_key      import RefKey
from references.references_meta import REFERENCES_META

__all__ = ['RefKey', 'REFERENCES_META']

