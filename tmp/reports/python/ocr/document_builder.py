"""
Document JSON builder for OCR extraction results
"""

import json
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime

logger = logging.getLogger(__name__)


class DocumentBuilder:
    """Build complete document.json with all content, metadata, and summaries"""

    def __init__(self, output_dir: Path):
        """
        Initialize document builder

        Args:
            output_dir: Directory where document.json will be saved
        """
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        logger.info(f"Document builder initialized: {self.output_dir}")

    def build_document_json(
        self,
        source_file: str,
        pages_data: List[Dict[str, Any]],
        metadata: Dict[str, Any]
    ) -> Path:
        """
        Build complete document.json with all content embedded

        Args:
            source_file: Name of source PDF/image file
            pages_data: List of page data with content sequences
            metadata: Extraction metadata (config, timestamps, etc.)

        Returns:
            Path to saved document.json
        """
        logger.info(f"Building document.json for {source_file}")

        # Collect all tables and graphics metadata
        all_tables = []
        all_graphics = []

        for page in pages_data:
            for item in page.get('content_sequence', []):
                if item['type'] == 'table' and 'metadata' in item:
                    all_tables.append(item['metadata'])
                elif item['type'] == 'graphic' and 'metadata' in item:
                    all_graphics.append(item['metadata'])

        # Build complete document structure
        document = {
            "metadata": {
                "source_file": source_file,
                "total_pages": len(pages_data),
                "extraction_date": metadata.get('extraction_date', datetime.utcnow().isoformat() + 'Z'),
                "extraction_duration_seconds": metadata.get('extraction_duration_seconds', 0),
                "languages_detected": metadata.get('languages_detected', ['eng']),
                "config": metadata.get('config', {}),
                "summary": {
                    "text_blocks": sum(
                        len([i for i in p.get('content_sequence', []) if i['type'] == 'text'])
                        for p in pages_data
                    ),
                    "tables": len(all_tables),
                    "graphics": len(all_graphics),
                    "pages_processed": len(pages_data),
                    "pages_with_graphics": len([p for p in pages_data if any(i['type'] == 'graphic' for i in p.get('content_sequence', []))]),
                    "pages_with_tables": len([p for p in pages_data if any(i['type'] == 'table' for i in p.get('content_sequence', []))])
                }
            },
            "pages": pages_data,
            "tables": all_tables,
            "graphics": all_graphics
        }

        # Save document.json
        output_path = self.output_dir / "document.json"
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(document, f, indent=2, ensure_ascii=False)

        logger.info(f"Saved document.json: {output_path}")
        return output_path

    def generate_page_summary_text(self, page_data: Dict[str, Any]) -> str:
        """
        Generate plain text summary for a page

        Args:
            page_data: Page data with content_sequence

        Returns:
            Plain text summary string
        """
        page_num = page_data['page_number']
        content_seq = page_data.get('content_sequence', [])

        lines = [
            f"PAGE {page_num} SUMMARY",
            "=" * 50,
            ""
        ]

        text_count = 0
        table_count = 0
        graphic_count = 0

        for item in content_seq:
            item_type = item['type']

            if item_type == 'text':
                text_count += 1
                lines.append(f"[TEXT BLOCK {item['index']}]")
                lines.append(item.get('text', ''))
                lines.append("")

            elif item_type == 'table':
                table_count += 1
                lines.append(f"[TABLE {item['index']}] - {item.get('description', 'Table')}")
                lines.append(f"File: {item['file']}")
                lines.append(f"Rows: {item.get('rows', 'N/A')}, Columns: {item.get('columns', 'N/A')}")

                # Add preview rows if available
                if 'preview_rows' in item and item['preview_rows']:
                    lines.append("Preview:")
                    headers = item.get('column_headers', [])
                    if headers:
                        lines.append(" | ".join(headers))
                        lines.append("-" * 50)
                    for row in item['preview_rows'][:3]:  # Show first 3 rows
                        lines.append(" | ".join(str(cell) for cell in row))
                lines.append("")

            elif item_type == 'graphic':
                graphic_count += 1
                lines.append(f"[GRAPHIC {item['index']}] - {item.get('description', 'Graphic')}")
                lines.append(f"File: {item['file']}")
                lines.append(f"Type: {item.get('graphic_type', 'Unknown')}")
                lines.append(f"Position: ({item['position']['x']}, {item['position']['y']}, "
                           f"{item['position']['width']}x{item['position']['height']})")
                lines.append("")

        lines.append("=" * 50)
        lines.append(f"Total elements: {len(content_seq)} "
                    f"({text_count} text blocks, {table_count} tables, {graphic_count} graphics)")

        return "\n".join(lines)

    def generate_page_summary_html(self, page_data: Dict[str, Any]) -> str:
        """
        Generate HTML summary for a page

        Args:
            page_data: Page data with content_sequence

        Returns:
            HTML summary string
        """
        page_num = page_data['page_number']
        content_seq = page_data.get('content_sequence', [])

        html_parts = [
            '<!DOCTYPE html>',
            '<html>',
            '<head>',
            '    <meta charset="UTF-8">',
            f'    <title>Page {page_num} Summary</title>',
            '    <style>',
            '        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }',
            '        h1 { color: #333; border-bottom: 2px solid #4CAF50; padding-bottom: 10px; }',
            '        .content-block { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }',
            '        .text-block { background-color: #f9f9f9; }',
            '        .table-block { background-color: #f0f8ff; }',
            '        .graphic-block { background-color: #fff8f0; }',
            '        .header { font-weight: bold; color: #333; margin-bottom: 10px; font-size: 1.1em; }',
            '        table { border-collapse: collapse; width: 100%; margin-top: 10px; }',
            '        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }',
            '        th { background-color: #4CAF50; color: white; }',
            '        img { max-width: 100%; height: auto; border: 1px solid #ccc; margin-top: 10px; }',
            '        .metadata { font-size: 0.9em; color: #666; margin-top: 10px; }',
            '        .position { font-size: 0.85em; color: #888; }',
            '    </style>',
            '</head>',
            '<body>',
            f'    <h1>Page {page_num} Summary</h1>',
        ]

        for item in content_seq:
            item_type = item['type']

            if item_type == 'text':
                html_parts.extend([
                    '    <div class="content-block text-block">',
                    f'        <div class="header">[TEXT BLOCK {item["index"]}]</div>',
                    f'        <p>{self._escape_html(item.get("text", ""))}</p>',
                    '    </div>',
                ])

            elif item_type == 'table':
                html_parts.extend([
                    '    <div class="content-block table-block">',
                    f'        <div class="header">[TABLE {item["index"]}] - {self._escape_html(item.get("description", "Table"))}</div>',
                ])

                # Add table preview if available
                if 'preview_rows' in item and item['preview_rows']:
                    html_parts.append('        <table>')
                    headers = item.get('column_headers', [])
                    if headers:
                        html_parts.append('            <tr>')
                        for header in headers:
                            html_parts.append(f'                <th>{self._escape_html(str(header))}</th>')
                        html_parts.append('            </tr>')

                    for row in item['preview_rows'][:5]:  # Show first 5 rows
                        html_parts.append('            <tr>')
                        for cell in row:
                            html_parts.append(f'                <td>{self._escape_html(str(cell))}</td>')
                        html_parts.append('            </tr>')
                    html_parts.append('        </table>')

                html_parts.extend([
                    f'        <div class="metadata">',
                    f'            File: {item["file"]} | Rows: {item.get("rows", "N/A")}, Columns: {item.get("columns", "N/A")}',
                    '        </div>',
                    '    </div>',
                ])

            elif item_type == 'graphic':
                html_parts.extend([
                    '    <div class="content-block graphic-block">',
                    f'        <div class="header">[GRAPHIC {item["index"]}] - {self._escape_html(item.get("description", "Graphic"))}</div>',
                    f'        <img src="{item["file"]}" alt="{self._escape_html(item.get("description", "Graphic"))}">',
                    f'        <div class="metadata">',
                    f'            File: {item["file"]} | Type: {item.get("graphic_type", "Unknown")}',
                    f'        </div>',
                    '    </div>',
                ])

        html_parts.extend([
            f'    <hr>',
            f'    <p><strong>Total elements:</strong> {len(content_seq)}</p>',
            '</body>',
            '</html>',
        ])

        return '\n'.join(html_parts)

    def _escape_html(self, text: str) -> str:
        """Escape HTML special characters"""
        return (text
                .replace('&', '&amp;')
                .replace('<', '&lt;')
                .replace('>', '&gt;')
                .replace('"', '&quot;')
                .replace("'", '&#39;'))

    def build_content_sequence(
        self,
        text_blocks: List[Dict[str, Any]],
        tables: List[Dict[str, Any]],
        graphics: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Build ordered content sequence from text, tables, and graphics

        Args:
            text_blocks: List of text block dicts with position
            tables: List of table dicts with position
            graphics: List of graphic dicts with position

        Returns:
            Ordered list of content items by vertical position
        """
        # Combine all content with type markers
        all_content = []

        for idx, text in enumerate(text_blocks, 1):
            all_content.append({
                'type': 'text',
                'index': idx,
                'y_pos': text['position']['y'],
                'data': text
            })

        for idx, table in enumerate(tables, 1):
            all_content.append({
                'type': 'table',
                'index': idx,
                'y_pos': table['position']['y'],
                'data': table
            })

        for idx, graphic in enumerate(graphics, 1):
            all_content.append({
                'type': 'graphic',
                'index': idx,
                'y_pos': graphic['position']['y'],
                'data': graphic
            })

        # Sort by vertical position
        all_content.sort(key=lambda x: x['y_pos'])

        # Build final content sequence
        content_sequence = []
        text_idx = 1
        table_idx = 1
        graphic_idx = 1

        for item in all_content:
            if item['type'] == 'text':
                content_sequence.append({
                    'type': 'text',
                    'index': text_idx,
                    'text': item['data']['text'],
                    'position': item['data']['position']
                })
                text_idx += 1

            elif item['type'] == 'table':
                content_sequence.append({
                    'type': 'table',
                    'index': table_idx,
                    'file': item['data']['file'],
                    'description': item['data'].get('description', ''),
                    'rows': item['data'].get('rows', 0),
                    'columns': item['data'].get('columns', 0),
                    'column_headers': item['data'].get('column_headers', []),
                    'preview_rows': item['data'].get('preview_rows', []),
                    'position': item['data']['position'],
                    'metadata': item['data']
                })
                table_idx += 1

            elif item['type'] == 'graphic':
                content_sequence.append({
                    'type': 'graphic',
                    'index': graphic_idx,
                    'file': item['data']['file'],
                    'description': item['data'].get('description', ''),
                    'graphic_type': item['data'].get('graphic_type', 'unknown'),
                    'edge_density': item['data'].get('edge_density', 0),
                    'file_size_bytes': item['data'].get('file_size_bytes', 0),
                    'position': item['data']['position'],
                    'metadata': item['data']
                })
                graphic_idx += 1

        return content_sequence

