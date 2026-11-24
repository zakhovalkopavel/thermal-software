"""
dataset_layout — Folder and file layout shared by the compound-data and JANAF datasets.

Layout of both datasets::

    <dataset>/index.json, units.json, sources.json
    <dataset>/inorganic/<main element>/<formula>-<name>.json
    <dataset>/organic/<family>/<formula>-<name>.json

Sub-modules
-----------
  dataset_layout.compound_file_name — compound_file_name, name_slug (file stem from formula and name)
  dataset_layout.unique_file_paths  — unique_file_paths (case-insensitive collision handling)
  dataset_layout.clear_dataset_dir  — clear_dataset_dir (empty the dataset folder before a rewrite)

Spec
----
  docs/scripts/COMPOUND_DATA_SPEC.md
"""

from dataset_layout.clear_dataset_dir  import CLASS_FOLDERS, clear_dataset_dir
from dataset_layout.compound_file_name import compound_file_name, name_slug
from dataset_layout.unique_file_paths  import unique_file_paths

__all__ = [
    "CLASS_FOLDERS",
    "clear_dataset_dir",
    "compound_file_name",
    "name_slug",
    "unique_file_paths",
]
