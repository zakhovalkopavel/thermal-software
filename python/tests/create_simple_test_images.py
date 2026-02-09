#!/usr/bin/env python3
"""
Simple Test Data Generator - Creates ultra-clean images for OCR
"""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from typing import List

def create_simple_table(data: List[List[str]], output_path: Path):
    """Create a super simple table image optimized for OCR"""

    rows = len(data)
    cols = len(data[0]) if data else 0

    # Calculate column widths based on content length
    col_widths = []
    for col_idx in range(cols):
        max_len = 0
        for row in data:
            if col_idx < len(row):
                max_len = max(max_len, len(str(row[col_idx])))
        # Base width + extra per character (minimum 200px, 25px per char)
        col_widths.append(max(200, 150 + max_len * 25))

    cell_height = 100
    padding = 100

    # Calculate image size
    width = 2 * padding + sum(col_widths)
    height = 2 * padding + rows * cell_height

    # Create white image
    img = Image.new('RGB', (width, height), 'white')
    draw = ImageDraw.Draw(img)

    # Try to load a basic font - reasonable size for OCR
    font = None
    for font_path in [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    ]:
        try:
            font = ImageFont.truetype(font_path, size=14)
            break
        except:
            continue

    # Draw grid - THIN lines (thick lines confuse OCR)
    # Horizontal lines
    for i in range(rows + 1):
        y = padding + i * cell_height
        draw.line([(padding, y), (padding + sum(col_widths), y)], fill='black', width=1)

    # Vertical lines
    x_pos = padding
    for j in range(cols + 1):
        draw.line([(x_pos, padding), (x_pos, padding + rows * cell_height)], fill='black', width=1)
        if j < cols:
            x_pos += col_widths[j]

    # Draw text - CENTERED in cells
    for i, row in enumerate(data):
        x_pos = padding
        for j, cell_text in enumerate(row):
            if j >= len(col_widths):
                break
            text = str(cell_text)
            # Center text in cell
            x = x_pos + 30
            y = padding + i * cell_height + 35

            if font:
                draw.text((x, y), text, fill='black', font=font)
            else:
                # Fallback: use default but make bolder
                for dx in [-1, 0, 1]:
                    for dy in [-1, 0, 1]:
                        draw.text((x+dx*2, y+dy*2), text, fill='black')

            x_pos += col_widths[j]

    img.save(output_path)
    print(f"Created: {output_path}")

def main():
    output_dir = Path("/app/shared/sources")

    # Materials table
    materials_data = [
        ['Material', 'Density', 'Conductivity', 'MaxTemp'],
        ['Alumina', '3.9', '30', '1750'],
        ['SiC', '3.2', '120', '1650'],
        ['Mullite', '2.8', '5', '1600'],
    ]
    create_simple_table(materials_data, output_dir / "test_sample_table.png")

    # Composition table
    composition_data = [
        ['Component', 'Al2O3', 'SiO2', 'CaO', 'MgO'],
        ['Fireclay', '45', '52', '1', '1'],
        ['Mullite', '72', '28', '0', '0'],
        ['HighAlumina', '85', '12', '2', '1'],
    ]
    create_simple_table(composition_data, output_dir / "test_composition_table.png")

    print("\nTest images created successfully!")

if __name__ == "__main__":
    main()

