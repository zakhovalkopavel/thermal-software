#!/usr/bin/env python3
"""
Test Table Extraction with Lakatos Reference Images
Verify that table structure is preserved correctly
"""

import sys
sys.path.insert(0, '/app/src')

from PIL import Image
import pytesseract
from pathlib import Path

def test_table_extraction(image_path):
    """Test improved table extraction on reference image"""
    print(f"\n{'='*80}")
    print(f"Testing: {image_path.name}")
    print('='*80)

    # Load image
    cropped = Image.open(image_path)
    print(f"Image size: {cropped.size}")

    # OCR configuration
    tesseract_config = '--psm 6 --oem 3'

    # Get structured data
    data = pytesseract.image_to_data(cropped, lang='eng+ces+pol',
                                     config=tesseract_config,
                                     output_type=pytesseract.Output.DICT)

    # Collect all words with positions
    words_data = []
    for i in range(len(data['text'])):
        if data['conf'][i] > 30 and data['text'][i].strip():
            words_data.append({
                'text': data['text'][i],
                'left': data['left'][i],
                'top': data['top'][i],
                'width': data['width'][i],
                'height': data['height'][i]
            })

    print(f"Words detected: {len(words_data)}")

    if not words_data:
        print("❌ No text detected!")
        return

    # Group into rows by vertical position
    words_data.sort(key=lambda w: w['top'])

    rows = []
    current_row = [words_data[0]]
    current_y = words_data[0]['top']
    row_height_threshold = 15

    for word in words_data[1:]:
        if abs(word['top'] - current_y) < row_height_threshold:
            current_row.append(word)
        else:
            current_row.sort(key=lambda w: w['left'])
            rows.append(current_row)
            current_row = [word]
            current_y = word['top']

    if current_row:
        current_row.sort(key=lambda w: w['left'])
        rows.append(current_row)

    print(f"Rows detected: {len(rows)}")

    # Detect columns
    all_x_positions = set()
    for row in rows:
        for word in row:
            all_x_positions.add(word['left'])

    sorted_x = sorted(all_x_positions)

    column_positions = []
    if sorted_x:
        current_col = [sorted_x[0]]
        col_threshold = 30

        for x_pos in sorted_x[1:]:
            if x_pos - current_col[-1] < col_threshold:
                current_col.append(x_pos)
            else:
                column_positions.append(sum(current_col) / len(current_col))
                current_col = [x_pos]

        if current_col:
            column_positions.append(sum(current_col) / len(current_col))

    print(f"Columns detected: {len(column_positions)}")

    # Build CSV
    csv_rows = []
    for row_idx, row_words in enumerate(rows):
        row_cells = [''] * len(column_positions)

        for word in row_words:
            distances = [abs(word['left'] - col_x) for col_x in column_positions]
            col_idx = distances.index(min(distances))

            if row_cells[col_idx]:
                row_cells[col_idx] += ' ' + word['text']
            else:
                row_cells[col_idx] = word['text']

        csv_rows.append(row_cells)

    # Print result
    print("\n" + "CSV OUTPUT:")
    print("-" * 80)
    for idx, row in enumerate(csv_rows[:5]):  # Show first 5 rows
        print(f"Row {idx}: {' | '.join(row)}")

    if len(csv_rows) > 5:
        print(f"... ({len(csv_rows) - 5} more rows)")

    # Check for issues
    print("\n" + "ANALYSIS:")
    print("-" * 80)

    # Check column count consistency
    col_counts = [len(row) for row in csv_rows]
    if len(set(col_counts)) == 1:
        print(f"✓ All rows have same column count: {col_counts[0]}")
    else:
        print(f"⚠️ Inconsistent columns: {set(col_counts)}")

    # Check for mixed content in first row
    first_row = csv_rows[0] if csv_rows else []
    if any(cell.lower().replace(' ', '').isdigit() for cell in first_row if cell):
        print("⚠️ First row contains numbers (might be mixed with data)")
    else:
        print("✓ First row looks like header (no pure numbers)")

    # Check for chemical formulas
    chem_patterns = ['2O', '2O3', 'CaO', 'MgO', 'BaO', 'ZnO', 'PbO']
    has_chem = False
    for row in csv_rows[:2]:  # Check first 2 rows
        for cell in row:
            if any(pattern in cell for pattern in chem_patterns):
                has_chem = True
                print(f"✓ Chemical formulas detected: {cell}")
                break
        if has_chem:
            break


def main():
    """Test on reference images"""
    lakatos_dir = Path('/app/shared/sources/lakatos')

    # Test table headers
    test_images = [
        'table_header_from_page_3.png',
        'table_from_page_1.png',
        'table_from_page_2.png',
    ]

    for img_name in test_images:
        img_path = lakatos_dir / img_name
        if img_path.exists():
            test_table_extraction(img_path)
        else:
            print(f"⚠️ Not found: {img_name}")

    print("\n" + "="*80)
    print("Testing complete!")
    print("="*80)

if __name__ == "__main__":
    main()

