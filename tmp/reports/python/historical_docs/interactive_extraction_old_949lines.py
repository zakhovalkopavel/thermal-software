#!/usr/bin/env python3
"""
Interactive OCR Extraction with Visual Review - COMPLETE VERSION
Extract → Auto-detect regions → Review → OCR → Save

Features:
- Auto-detect graphics (min 10% page size)
- Auto-detect text blocks
- Visual buttons for navigation and actions
- Proper per-page region storage
- Graphics saved separately
- Standard output format
"""

import sys
import json
from pathlib import Path
from PIL import Image
import cv2
import numpy as np
from datetime import datetime
import logging
import pytesseract

sys.path.insert(0, '/app/src')

from pdf2image import convert_from_path
from ocr.config import ExtractionConfig
from ocr.scientific_ocr_processor import ScientificOCRProcessor
from ocr.language_detector import LanguageDetector

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class Button:
    """Clickable button for UI"""
    def __init__(self, x, y, w, h, label, action, color=(100, 100, 100)):
        self.x = x
        self.y = y
        self.w = w
        self.h = h
        self.label = label
        self.action = action
        self.color = color
        self.hover = False

    def contains(self, px, py):
        return self.x <= px <= self.x + self.w and self.y <= py <= self.y + self.h

    def draw(self, image):
        color = tuple(int(c * 1.3) if c * 1.3 <= 255 else 255 for c in self.color) if self.hover else self.color
        # Draw button background
        cv2.rectangle(image, (self.x, self.y), (self.x + self.w, self.y + self.h), color, -1)
        # Draw white border
        cv2.rectangle(image, (self.x, self.y), (self.x + self.w, self.y + self.h), (255, 255, 255), 3)

        # Center text with larger font
        text_size = cv2.getTextSize(self.label, cv2.FONT_HERSHEY_SIMPLEX, 0.8, 2)[0]
        text_x = self.x + (self.w - text_size[0]) // 2
        text_y = self.y + (self.h + text_size[1]) // 2
        cv2.putText(image, self.label, (text_x, text_y),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)


class InteractiveOCRExtractor:
    """Extract with interactive review"""

    def __init__(self, file_path: Path, output_dir: Path, config: ExtractionConfig):
        self.file_path = Path(file_path)
        self.output_dir = Path(output_dir)
        self.config = config
        self.scientific_processor = ScientificOCRProcessor()

        # Language detection
        available_langs = ['eng', 'fra', 'deu', 'ces', 'pol', 'ukr', 'rus', 'jpn', 'chi_sim']
        self.language_detector = LanguageDetector(available_langs)
        self.detected_languages = None

        # Page data
        self.total_pages = 0
        self.page_images = []
        self.page_regions = {}  # page_num -> list of regions
        self.current_page = 1

        # UI state
        self.drawing = False
        self.resizing = False
        self.moving = False
        self.selected_idx = None
        self.selected_indices = []  # Multiple selection support
        self.start_point = None
        self.current_point = None
        self.resize_start_bbox = None
        self.resize_direction = None
        self.hover_resize_idx = None
        self.hover_resize_dir = None
        self.button_action = None  # Store button click result

        # Buttons
        self.buttons = []

        # Region types
        self.REGION_TYPES = {
            'table': (0, 255, 0),
            'text': (0, 255, 255),
            'graphic': (0, 0, 255),
            'ignore': (128, 128, 128)
        }

    def extract_with_review(self):
        """Main workflow"""
        print("\n" + "="*80)
        print("INTERACTIVE OCR EXTRACTION")
        print("="*80)
        print(f"File: {self.file_path.name}")
        print("="*80)

        # Convert to images
        logger.info("Converting to images...")
        if self.file_path.suffix.lower() == '.pdf':
            self.page_images = convert_from_path(str(self.file_path), dpi=self.config.dpi)
        else:
            self.page_images = [Image.open(str(self.file_path))]

        self.total_pages = len(self.page_images)
        logger.info(f"Loaded {self.total_pages} page(s)")

        # Auto-detect languages from first page
        logger.info("Auto-detecting languages...")
        self.detected_languages = self.language_detector.detect_languages(
            self.page_images[0],
            max_langs=3
        )
        lang_string = self.language_detector.build_lang_string(self.detected_languages)
        self.config.ocr_lang = lang_string
        logger.info(f"Detected languages: {lang_string}")

        # Auto-detect regions for all pages
        logger.info("Auto-detecting regions...")
        for page_num in range(1, self.total_pages + 1):
            self.page_regions[page_num] = self.auto_detect_regions(page_num)
            logger.info(f"Page {page_num}: {len(self.page_regions[page_num])} regions detected")

        # Visual review
        logger.info("Starting visual review...")
        self.review_all_pages()

        # OCR and save
        logger.info("Processing regions...")
        self.process_and_save()

        print("\n" + "="*80)
        print("EXTRACTION COMPLETE!")
        print(f"Output: {self.output_dir}")
        print("="*80)

    def auto_detect_regions(self, page_num):
        """Auto-detect graphics and text blocks"""
        pil_image = self.page_images[page_num - 1]
        img_array = np.array(pil_image)
        gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)

        page_h, page_w = gray.shape
        min_graphic_w = int(page_w * 0.1)  # 10% minimum width
        min_graphic_h = int(page_h * 0.1)  # 10% minimum height

        regions = []

        # Detect graphics using edge density
        edges = cv2.Canny(gray, 50, 150)
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        for contour in contours:
            x, y, w, h = cv2.boundingRect(contour)

            # Check minimum size for graphics
            if w >= min_graphic_w and h >= min_graphic_h:
                roi = edges[y:y+h, x:x+w]
                edge_density = np.sum(roi > 0) / (w * h)

                if edge_density > 0.05:  # Likely a graphic
                    regions.append({
                        'bbox': (x, y, w, h),
                        'type': 'graphic'
                    })

        # Detect text blocks using OCR
        try:
            data = pytesseract.image_to_data(pil_image, output_type=pytesseract.Output.DICT)

            # Group words into text blocks (paragraphs)
            text_blocks = []
            current_block = None
            last_block_num = -1

            for i in range(len(data['text'])):
                # Higher confidence threshold to reduce artifacts
                if data['conf'][i] > 50 and data['text'][i].strip() and len(data['text'][i].strip()) > 2:
                    x, y, w, h = data['left'][i], data['top'][i], data['width'][i], data['height'][i]
                    block_num = data['block_num'][i]

                    # Check if overlaps with existing graphics
                    overlaps = False
                    for region in regions:
                        if region['type'] == 'graphic':
                            rx, ry, rw, rh = region['bbox']
                            # Add margin around graphics to avoid edge artifacts
                            margin = 20
                            if not (x + w < rx - margin or x > rx + rw + margin or
                                   y + h < ry - margin or y > ry + rh + margin):
                                overlaps = True
                                break

                    if not overlaps:
                        # New block or continuation of previous
                        if current_block is None or block_num != last_block_num:
                            # Save previous block if it exists and is large enough
                            if current_block is not None:
                                bx, by, bx2, by2 = current_block
                                block_w = bx2 - bx
                                block_h = by2 - by
                                # Stricter minimum size: 150px wide, 60px tall (ensures real paragraphs)
                                # Also check aspect ratio to avoid artifacts
                                aspect_ratio = block_w / block_h if block_h > 0 else 0
                                if block_w > 150 and block_h > 60 and aspect_ratio > 1.5:
                                    regions.append({
                                        'bbox': (bx, by, block_w, block_h),
                                        'type': 'text'
                                    })

                            # Start new block
                            current_block = [x, y, x + w, y + h]
                            last_block_num = block_num
                        else:
                            # Expand current block
                            current_block[0] = min(current_block[0], x)
                            current_block[1] = min(current_block[1], y)
                            current_block[2] = max(current_block[2], x + w)
                            current_block[3] = max(current_block[3], y + h)

            # Add last block if valid
            if current_block is not None:
                bx, by, bx2, by2 = current_block
                block_w = bx2 - bx
                block_h = by2 - by
                aspect_ratio = block_w / block_h if block_h > 0 else 0
                if block_w > 150 and block_h > 60 and aspect_ratio > 1.5:
                    regions.append({
                        'bbox': (bx, by, block_w, block_h),
                        'type': 'text'
                    })

        except Exception as e:
            logger.warning(f"Text detection failed: {e}")

        return regions

    def review_all_pages(self):
        """Review with navigation"""
        page_num = 1

        while page_num >= 1 and page_num <= self.total_pages:
            result = self.review_page(page_num)

            if result == 'quit':
                break
            elif isinstance(result, int):
                page_num = result
            else:
                page_num = result if result else page_num + 1

    def review_page(self, page_num):
        """Review single page with UI buttons"""
        print(f"\n{'='*80}")
        print(f"PAGE {page_num}/{self.total_pages}")
        print(f"{'='*80}")

        pil_image = self.page_images[page_num - 1]
        base_image = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)

        # Create buttons
        self.create_buttons(base_image.shape[1], base_image.shape[0])

        # Window
        window_name = f"Page {page_num}/{self.total_pages} - Review Regions"
        cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)
        cv2.resizeWindow(window_name, 1400, 900)
        cv2.setMouseCallback(window_name, lambda event, x, y, flags, param: self.mouse_callback(event, x, y, flags, param, page_num))

        # Load regions for this page
        current_regions = self.page_regions[page_num]

        # Print help
        self.print_help()

        # Main loop
        while True:
            display_image = self.draw_ui(base_image.copy(), current_regions, page_num)
            cv2.imshow(window_name, display_image)

            # Check if button was clicked
            if self.button_action:
                action = self.button_action
                self.button_action = None  # Reset

                if action == 'prev':
                    self.page_regions[page_num] = current_regions
                    cv2.destroyAllWindows()
                    return max(page_num - 1, 1)
                elif action == 'next':
                    self.page_regions[page_num] = current_regions
                    cv2.destroyAllWindows()
                    return min(page_num + 1, self.total_pages)
                elif action == 'quit':
                    self.page_regions[page_num] = current_regions
                    cv2.destroyAllWindows()
                    return 'quit'

            key = cv2.waitKey(1) & 0xFF

            if key == ord('q'):
                self.page_regions[page_num] = current_regions
                cv2.destroyAllWindows()
                return 'quit'
            elif key == ord('n'):
                self.page_regions[page_num] = current_regions
                cv2.destroyAllWindows()
                return min(page_num + 1, self.total_pages)
            elif key == ord('p'):
                self.page_regions[page_num] = current_regions
                cv2.destroyAllWindows()
                return max(page_num - 1, 1)
            elif key == ord('t'):
                self.change_type(current_regions, 'table')
            elif key == ord('g'):
                self.change_type(current_regions, 'graphic')
            elif key == ord('x'):
                self.change_type(current_regions, 'text')
            elif key == ord('d'):
                self.delete_selected(current_regions)
            elif key == ord('h'):
                self.print_help()
            elif key >= ord('1') and key <= ord('9'):
                target = int(chr(key))
                if target <= self.total_pages:
                    self.page_regions[page_num] = current_regions
                    cv2.destroyAllWindows()
                    return target

    def create_buttons(self, img_w, img_h):
        """Create UI buttons at top - LARGER and outside preview"""
        self.buttons = []
        button_h = 50  # Larger buttons (was 40)
        button_y = 10
        spacing = 10
        x = 20

        # Navigation buttons
        self.buttons.append(Button(x, button_y, 100, button_h, "< Prev", "prev", (80, 80, 150)))
        x += 100 + spacing

        self.buttons.append(Button(x, button_y, 100, button_h, "Next >", "next", (80, 80, 150)))
        x += 100 + spacing

        x += 20  # Extra spacing

        # Type buttons - LARGER
        self.buttons.append(Button(x, button_y, 80, button_h, "T", "table", (0, 180, 0)))
        x += 80 + spacing

        self.buttons.append(Button(x, button_y, 80, button_h, "G", "graphic", (0, 0, 180)))
        x += 80 + spacing

        self.buttons.append(Button(x, button_y, 80, button_h, "X", "text", (0, 180, 180)))
        x += 80 + spacing

        x += 20  # Extra spacing

        # Delete button - LARGER and more visible
        self.buttons.append(Button(x, button_y, 100, button_h, "Delete", "delete", (180, 0, 0)))
        x += 100 + spacing

        x += 20  # Extra spacing

        # Quit button
        self.buttons.append(Button(x, button_y, 80, button_h, "Quit", "quit", (120, 120, 120)))

    def mouse_callback(self, event, x, y, flags, param, page_num):
        """Handle mouse events"""
        current_regions = self.page_regions[page_num]

        if event == cv2.EVENT_LBUTTONDOWN:
            # Check buttons first
            for btn in self.buttons:
                if btn.contains(x, y):
                    self.button_action = self.handle_button_click(btn.action, current_regions)
                    return

            # Check resize handles
            clicked_idx = self.find_region_at(x, y, current_regions)

            if clicked_idx is not None:
                # Multi-selection support
                if flags & cv2.EVENT_FLAG_SHIFTKEY:
                    # Shift+Click: Add to selection
                    if clicked_idx not in self.selected_indices:
                        self.selected_indices.append(clicked_idx)
                    self.selected_idx = clicked_idx
                elif flags & cv2.EVENT_FLAG_CTRLKEY:
                    # Ctrl+Click: Toggle selection
                    if clicked_idx in self.selected_indices:
                        self.selected_indices.remove(clicked_idx)
                        self.selected_idx = self.selected_indices[-1] if self.selected_indices else None
                    else:
                        self.selected_indices.append(clicked_idx)
                        self.selected_idx = clicked_idx
                else:
                    # Normal click: Single selection
                    self.selected_indices = [clicked_idx]
                    self.selected_idx = clicked_idx

                region = current_regions[clicked_idx]

                if self.is_near_corner(x, y, region):
                    self.resizing = True
                    self.resize_start_bbox = region['bbox']
                    self.resize_direction = self.get_resize_direction(x, y, region)
                else:
                    self.moving = True

                self.start_point = (x, y)
            else:
                # Start drawing
                self.drawing = True
                self.start_point = (x, y)
                if not (flags & (cv2.EVENT_FLAG_SHIFTKEY | cv2.EVENT_FLAG_CTRLKEY)):
                    self.selected_idx = None
                    self.selected_indices = []

        elif event == cv2.EVENT_MOUSEMOVE:
            # Update button hover states
            for btn in self.buttons:
                btn.hover = btn.contains(x, y)

            # Handle resize preview
            if not self.drawing and not self.moving and not self.resizing:
                for idx, region in enumerate(current_regions):
                    if self.is_near_corner(x, y, region):
                        self.hover_resize_idx = idx
                        self.hover_resize_dir = self.get_resize_direction(x, y, region)
                        break
                else:
                    self.hover_resize_idx = None
                    self.hover_resize_dir = None

            if self.drawing:
                self.current_point = (x, y)
            elif self.moving and self.selected_indices:
                # Move all selected regions together
                dx = x - self.start_point[0]
                dy = y - self.start_point[1]

                for idx in self.selected_indices:
                    if idx < len(current_regions):
                        region = current_regions[idx]
                        bx, by, bw, bh = region['bbox']
                        region['bbox'] = (bx + dx, by + dy, bw, bh)

                self.start_point = (x, y)
            elif self.resizing and self.selected_idx is not None:
                self.apply_resize(x, y, current_regions[self.selected_idx])

        elif event == cv2.EVENT_LBUTTONUP:
            if self.drawing and self.start_point and self.current_point:
                x1, y1 = self.start_point
                x2, y2 = self.current_point
                x_min, x_max = min(x1, x2), max(x1, x2)
                y_min, y_max = min(y1, y2), max(y1, y2)
                w, h = x_max - x_min, y_max - y_min

                if w > 20 and h > 20:
                    current_regions.append({
                        'bbox': (x_min, y_min, w, h),
                        'type': 'table'
                    })
                    new_idx = len(current_regions) - 1
                    self.selected_idx = new_idx
                    self.selected_indices = [new_idx]

            self.drawing = False
            self.moving = False
            self.resizing = False
            self.start_point = None
            self.current_point = None
            self.resize_start_bbox = None
            self.resize_direction = None

    def handle_button_click(self, action, current_regions):
        """Handle button actions and return navigation command if needed"""
        if action == "prev":
            return "prev"
        elif action == "next":
            return "next"
        elif action == "quit":
            return "quit"
        elif action == "table":
            self.change_type(current_regions, 'table')
        elif action == "graphic":
            self.change_type(current_regions, 'graphic')
        elif action == "text":
            self.change_type(current_regions, 'text')
        elif action == "delete":
            self.delete_selected(current_regions)
        return None

    def draw_ui(self, image, regions, page_num):
        """Draw complete UI"""
        # Draw buttons
        for btn in self.buttons:
            btn.draw(image)

        # Draw page number and selection count
        page_info = f"Page {page_num}/{self.total_pages}"
        if self.selected_indices:
            page_info += f" | Selected: {len(self.selected_indices)}"
        cv2.putText(image, page_info,
                   (image.shape[1] - 300, 35),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

        # Draw regions
        for idx, region in enumerate(regions):
            x, y, w, h = region['bbox']
            region_type = region.get('type', 'table')
            color = self.REGION_TYPES.get(region_type, (255, 255, 255))

            # Highlight if selected (single or multi)
            is_selected = idx in self.selected_indices
            thickness = 3 if is_selected else 2

            # Rectangle
            cv2.rectangle(image, (x, y), (x+w, y+h), color, thickness)

            # Semi-transparent overlay (more transparent if selected)
            overlay = image.copy()
            cv2.rectangle(overlay, (x, y), (x+w, y+h), color, -1)
            alpha = 0.25 if is_selected else 0.15
            cv2.addWeighted(overlay, alpha, image, 1.0 - alpha, 0, image)

            # Label
            label = f"{region_type.upper()} #{idx+1}"
            if is_selected and len(self.selected_indices) > 1:
                label += " ✓"  # Checkmark for multi-select
            cv2.putText(image, label, (x, y-5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

            # Resize handles (only for primary selected)
            if idx == self.selected_idx:
                handle_radius = 12
                corners_info = [
                    ((x, y), 'TL'),
                    ((x+w, y), 'TR'),
                    ((x, y+h), 'BL'),
                    ((x+w, y+h), 'BR')
                ]
                for (cx, cy), label in corners_info:
                    # Draw handle
                    cv2.circle(image, (cx, cy), handle_radius, (255, 255, 255), 3)
                    cv2.circle(image, (cx, cy), handle_radius-3, color, -1)
                    cv2.circle(image, (cx, cy), 2, (0, 0, 0), -1)
                    # Add small label
                    cv2.putText(image, label, (cx-10, cy-15),
                               cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1)

            # Hover feedback - show which corner you can resize from
            if idx == self.hover_resize_idx:
                bx, by, bw, bh = region['bbox']
                hover_pos = {
                    'top-left': (bx, by),
                    'top-right': (bx+bw, by),
                    'bottom-left': (bx, by+bh),
                    'bottom-right': (bx+bw, by+bh)
                }
                if self.hover_resize_dir in hover_pos:
                    hx, hy = hover_pos[self.hover_resize_dir]
                    # Large yellow circle to show you can resize from here
                    cv2.circle(image, (hx, hy), 20, (0, 255, 255), 3)
                    # Direction arrow or text
                    dir_text = self.hover_resize_dir.upper().replace('-', ' ')
                    cv2.putText(image, dir_text, (hx + 25, hy),
                               cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 2)

            # Active resize feedback - show which corner is being resized NOW
            if idx == self.selected_idx and self.resizing and self.resize_direction:
                bx, by, bw, bh = self.resize_start_bbox
                active_pos = {
                    'top-left': (bx, by),
                    'top-right': (bx+bw, by),
                    'bottom-left': (bx, by+bh),
                    'bottom-right': (bx+bw, by+bh)
                }
                if self.resize_direction in active_pos:
                    ax, ay = active_pos[self.resize_direction]
                    # Pulsing red circle to show active resize
                    cv2.circle(image, (ax, ay), 25, (0, 0, 255), 4)
                    cv2.putText(image, "RESIZING", (ax + 30, ay),
                               cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)

        # Drawing preview
        if self.drawing and self.start_point and self.current_point:
            cv2.rectangle(image, self.start_point, self.current_point, (255, 255, 0), 2)

        return image

    def find_region_at(self, x, y, regions):
        """Find region at point"""
        for idx, region in enumerate(regions):
            bx, by, bw, bh = region['bbox']
            if bx <= x <= bx+bw and by <= y <= by+bh:
                return idx
        return None

    def is_near_corner(self, x, y, region, threshold=30):
        """Check if near corner"""
        bx, by, bw, bh = region['bbox']
        corners = [(bx, by), (bx+bw, by), (bx, by+bh), (bx+bw, by+bh)]
        for cx, cy in corners:
            if abs(x - cx) < threshold and abs(y - cy) < threshold:
                return True
        return False

    def get_resize_direction(self, x, y, region, threshold=30):
        """Get resize direction"""
        bx, by, bw, bh = region['bbox']
        if abs(x - bx) < threshold and abs(y - by) < threshold:
            return 'top-left'
        elif abs(x - (bx+bw)) < threshold and abs(y - by) < threshold:
            return 'top-right'
        elif abs(x - bx) < threshold and abs(y - (by+bh)) < threshold:
            return 'bottom-left'
        elif abs(x - (bx+bw)) < threshold and abs(y - (by+bh)) < threshold:
            return 'bottom-right'
        return None

    def apply_resize(self, x, y, region):
        """Apply resize from ANY corner"""
        ox, oy, ow, oh = self.resize_start_bbox

        if self.resize_direction == 'bottom-right':
            # Drag bottom-right corner: both width and height increase
            region['bbox'] = (ox, oy, max(20, x-ox), max(20, y-oy))
        elif self.resize_direction == 'top-left':
            # Drag top-left corner: move top-left, adjust width/height
            nx = min(x, ox+ow-20)
            ny = min(y, oy+oh-20)
            region['bbox'] = (nx, ny, max(20, (ox+ow)-nx), max(20, (oy+oh)-ny))
        elif self.resize_direction == 'top-right':
            # Drag top-right corner: move top, increase width
            ny = min(y, oy+oh-20)
            region['bbox'] = (ox, ny, max(20, x-ox), max(20, (oy+oh)-ny))
        elif self.resize_direction == 'bottom-left':
            # Drag bottom-left corner: move left, increase height
            nx = min(x, ox+ow-20)
            region['bbox'] = (nx, oy, max(20, (ox+ow)-nx), max(20, y-oy))
        else:
            # Fallback: treat as bottom-right
            region['bbox'] = (ox, oy, max(20, x-ox), max(20, y-oy))

    def change_type(self, regions, new_type):
        """Change region type for all selected regions"""
        if self.selected_indices:
            for idx in self.selected_indices:
                if idx < len(regions):
                    regions[idx]['type'] = new_type
            count = len(self.selected_indices)
            print(f"✓ Changed {count} region(s) to {new_type}")

    def delete_selected(self, regions):
        """Delete all selected regions"""
        if self.selected_indices:
            # Sort in reverse to delete from end first (preserves indices)
            for idx in sorted(self.selected_indices, reverse=True):
                if idx < len(regions):
                    del regions[idx]
            count = len(self.selected_indices)
            self.selected_idx = None
            self.selected_indices = []
            print(f"✓ Deleted {count} region(s)")

    def process_and_save(self):
        """OCR and save results"""
        self.output_dir.mkdir(parents=True, exist_ok=True)

        # Create subdirectories
        tables_dir = self.output_dir / 'tables'
        graphics_dir = self.output_dir / 'graphics'
        tables_dir.mkdir(exist_ok=True)
        graphics_dir.mkdir(exist_ok=True)

        pages_data = []

        for page_num in range(1, self.total_pages + 1):
            regions = self.page_regions[page_num]
            pil_image = self.page_images[page_num - 1]

            page_data = {
                'page_number': page_num,
                'content_sequence': []
            }

            table_count = 0
            graphic_count = 0

            for idx, region in enumerate(regions):
                if region['type'] == 'ignore':
                    continue

                x, y, w, h = region['bbox']
                cropped = pil_image.crop((x, y, x+w, y+h))

                if region['type'] == 'graphic':
                    # Save graphic
                    graphic_count += 1
                    filename = f"page_{page_num:03d}_graphic_{graphic_count:03d}.png"
                    graphic_path = graphics_dir / filename
                    cropped.save(graphic_path)

                    page_data['content_sequence'].append({
                        'type': 'graphic',
                        'index': graphic_count,
                        'position': {'x': x, 'y': y, 'width': w, 'height': h},
                        'file': str(graphic_path.relative_to(self.output_dir))
                    })
                    logger.info(f"Saved graphic: {filename}")

                elif region['type'] in ['table', 'text']:
                    # OCR
                    if region['type'] == 'table':
                        # For tables, use better structure preservation
                        try:
                            # Use Tesseract config optimized for tables
                            tesseract_config = '--psm 6 --oem 3'  # Assume uniform block of text

                            # Get structured data from Tesseract
                            data = pytesseract.image_to_data(cropped, lang=self.config.ocr_lang,
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

                            if not words_data:
                                raise Exception("No text detected in table")

                            # Group into rows by vertical position
                            # Sort by top position first
                            words_data.sort(key=lambda w: w['top'])

                            rows = []
                            current_row = [words_data[0]]
                            current_y = words_data[0]['top']
                            row_height_threshold = 15  # Words within 15px vertically are same row

                            for word in words_data[1:]:
                                if abs(word['top'] - current_y) < row_height_threshold:
                                    # Same row
                                    current_row.append(word)
                                else:
                                    # New row
                                    # Sort current row by horizontal position
                                    current_row.sort(key=lambda w: w['left'])
                                    rows.append(current_row)
                                    current_row = [word]
                                    current_y = word['top']

                            # Add last row
                            if current_row:
                                current_row.sort(key=lambda w: w['left'])
                                rows.append(current_row)

                            # Detect columns by analyzing word positions across rows
                            # Collect all unique x-positions
                            all_x_positions = set()
                            for row in rows:
                                for word in row:
                                    all_x_positions.add(word['left'])

                            # Sort x-positions to define column boundaries
                            sorted_x = sorted(all_x_positions)

                            # Group x-positions into columns (cluster nearby positions)
                            column_positions = []
                            if sorted_x:
                                current_col = [sorted_x[0]]
                                col_threshold = 30  # Positions within 30px are same column

                                for x_pos in sorted_x[1:]:
                                    if x_pos - current_col[-1] < col_threshold:
                                        current_col.append(x_pos)
                                    else:
                                        # Average position for this column
                                        column_positions.append(sum(current_col) / len(current_col))
                                        current_col = [x_pos]

                                if current_col:
                                    column_positions.append(sum(current_col) / len(current_col))

                            # Build CSV with proper column alignment
                            csv_rows = []
                            for row_words in rows:
                                # Assign each word to a column
                                row_cells = [''] * len(column_positions)

                                for word in row_words:
                                    # Find closest column
                                    distances = [abs(word['left'] - col_x) for col_x in column_positions]
                                    col_idx = distances.index(min(distances))

                                    # Append to cell (in case multiple words in same cell)
                                    if row_cells[col_idx]:
                                        row_cells[col_idx] += ' ' + word['text']
                                    else:
                                        row_cells[col_idx] = word['text']

                                # Join cells with tabs
                                csv_rows.append('\t'.join(row_cells))

                            text = '\n'.join(csv_rows)
                            text = self.scientific_processor.process_text(text)

                        except Exception as e:
                            logger.warning(f"Table structure extraction failed: {e}, using simple OCR")
                            text = pytesseract.image_to_string(cropped, lang=self.config.ocr_lang)
                            text = self.scientific_processor.process_text(text)
                    else:
                        # For text, simple OCR is fine
                        text = pytesseract.image_to_string(cropped, lang=self.config.ocr_lang)
                        text = self.scientific_processor.process_text(text)

                    if region['type'] == 'table':
                        table_count += 1
                        filename = f"page_{page_num:03d}_table_{table_count:03d}.csv"
                        csv_path = tables_dir / filename

                        # Save as CSV
                        with open(csv_path, 'w', encoding='utf-8') as f:
                            f.write(text)

                        page_data['content_sequence'].append({
                            'type': 'table',
                            'index': table_count,
                            'position': {'x': x, 'y': y, 'width': w, 'height': h},
                            'file': str(csv_path.relative_to(self.output_dir)),
                            'text': text
                        })
                        logger.info(f"Saved table: {filename}")
                    else:
                        page_data['content_sequence'].append({
                            'type': 'text',
                            'index': idx,
                            'position': {'x': x, 'y': y, 'width': w, 'height': h},
                            'text': text
                        })

            pages_data.append(page_data)

        # Save document.json
        document = {
            'metadata': {
                'source_file': self.file_path.name,
                'total_pages': self.total_pages,
                'extraction_date': datetime.now().isoformat(),
                'summary': {
                    'total_regions': sum(len(self.page_regions[p]) for p in self.page_regions),
                    'graphics': sum(1 for p in pages_data for c in p['content_sequence'] if c['type'] == 'graphic'),
                    'tables': sum(1 for p in pages_data for c in p['content_sequence'] if c['type'] == 'table'),
                    'text_blocks': sum(1 for p in pages_data for c in p['content_sequence'] if c['type'] == 'text')
                }
            },
            'pages': pages_data
        }

        json_path = self.output_dir / 'document.json'
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(document, f, indent=2, ensure_ascii=False)

        logger.info(f"Saved: {json_path}")

    def print_help(self):
        """Print help"""
        print("\n" + "="*80)
        print("CONTROLS:")
        print("  Mouse:")
        print("    Click + Drag = Draw region")
        print("    Click region = Select (single)")
        print("    Shift+Click = Add to selection (multi-select)")
        print("    Ctrl+Click = Toggle selection")
        print("    Drag corner = Resize (single)")
        print("    Drag box = Move (all selected move together)")
        print("")
        print("  Buttons: < Prev | Next > | T (Table) | G (Graphic) | X (Text) | Delete")
        print("")
        print("  Keys:")
        print("    P=Prev | N=Next | T=Table | G=Graphic | X=Text")
        print("    D=Delete (all selected) | Q=Quit | H=Help")
        print("="*80)


def main():
    if len(sys.argv) < 2:
        print("Usage: python interactive_extraction.py <file>")
        return 1

    file_path = Path(sys.argv[1])
    if not file_path.exists():
        print(f"Error: File not found: {file_path}")
        return 1

    # Output directory
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_dir = Path(f"/app/shared/processed/{file_path.stem}_{timestamp}")

    # Config (language will be auto-detected)
    config = ExtractionConfig(
        sources_dir=file_path.parent,
        processed_dir=output_dir,
        ocr_lang='eng',  # Placeholder, will be replaced by auto-detection
        dpi=300
    )

    # Run
    extractor = InteractiveOCRExtractor(file_path, output_dir, config)
    extractor.extract_with_review()

    return 0


if __name__ == "__main__":
    sys.exit(main())

