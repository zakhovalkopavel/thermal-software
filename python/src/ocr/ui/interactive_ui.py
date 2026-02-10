"""
Interactive UI for OCR region review
Handles all mouse/keyboard interaction and visual display
"""

import cv2
import numpy as np
from typing import Dict, List, Optional, Tuple
from PIL import Image


class Button:
    """UI Button component"""
    def __init__(self, x, y, w, h, label, action, color=(100, 100, 100)):
        self.x, self.y, self.w, self.h = x, y, w, h
        self.label = label
        self.action = action
        self.color = color
        self.hover = False

    def contains(self, px, py):
        return self.x <= px <= self.x + self.w and self.y <= py <= self.y + self.h

    def draw(self, image):
        color = tuple(int(c * 1.3) if c * 1.3 <= 255 else 255 for c in self.color) if self.hover else self.color
        cv2.rectangle(image, (self.x, self.y), (self.x + self.w, self.y + self.h), color, -1)
        cv2.rectangle(image, (self.x, self.y), (self.x + self.w, self.y + self.h), (255, 255, 255), 3)

        text_size = cv2.getTextSize(self.label, cv2.FONT_HERSHEY_SIMPLEX, 0.8, 2)[0]
        text_x = self.x + (self.w - text_size[0]) // 2
        text_y = self.y + (self.h + text_size[1]) // 2
        cv2.putText(image, self.label, (text_x, text_y),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)


class InteractiveUI:
    """Interactive review interface with mouse/keyboard controls"""

    REGION_TYPES = {
        'table': (0, 255, 0),
        'text': (0, 255, 255),
        'graphic': (0, 0, 255),
        'ignore': (128, 128, 128)
    }

    def __init__(self, page_images: List[Image.Image], page_regions: Dict[int, List]):
        self.page_images = page_images
        self.page_regions = page_regions
        self.total_pages = len(page_images)

        # UI state
        self.drawing = False
        self.resizing = False
        self.moving = False
        self.selected_idx = None
        self.selected_indices = []
        self.start_point = None
        self.current_point = None
        self.resize_start_bbox = None
        self.resize_direction = None
        self.hover_resize_idx = None
        self.hover_resize_dir = None
        self.button_action = None

        self.buttons = []

    def review_all_pages(self) -> Dict[int, List]:
        """Review all pages and return approved regions"""
        page_num = 1

        while 1 <= page_num <= self.total_pages:
            result = self._review_page(page_num)

            if result == 'quit':
                break
            elif isinstance(result, int):
                page_num = result
            else:
                page_num = result if result else page_num + 1

        return self.page_regions

    def _review_page(self, page_num):
        """Review single page with UI"""
        print(f"\n{'='*80}")
        print(f"PAGE {page_num}/{self.total_pages}")
        print(f"{'='*80}")

        pil_image = self.page_images[page_num - 1]
        base_image = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)

        self._create_buttons(base_image.shape[1])

        window_name = f"Page {page_num}/{self.total_pages} - Review Regions"
        cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)
        cv2.resizeWindow(window_name, 1400, 900)
        cv2.setMouseCallback(window_name, lambda e, x, y, f, p: self._mouse_callback(e, x, y, f, page_num))

        current_regions = self.page_regions[page_num]
        self._print_help()

        while True:
            display_image = self._draw_ui(base_image.copy(), current_regions, page_num)
            cv2.imshow(window_name, display_image)

            # Check button actions
            if self.button_action:
                action = self.button_action
                self.button_action = None

                if action in ['prev', 'next', 'quit']:
                    self.page_regions[page_num] = current_regions
                    cv2.destroyAllWindows()
                    if action == 'prev':
                        return max(page_num - 1, 1)
                    elif action == 'next':
                        return min(page_num + 1, self.total_pages)
                    else:
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
                self._change_type(current_regions, 'table')
            elif key == ord('g'):
                self._change_type(current_regions, 'graphic')
            elif key == ord('x'):
                self._change_type(current_regions, 'text')
            elif key == ord('d'):
                self._delete_selected(current_regions)
            elif key == ord('h'):
                self._print_help()
            elif ord('1') <= key <= ord('9'):
                target = int(chr(key))
                if target <= self.total_pages:
                    self.page_regions[page_num] = current_regions
                    cv2.destroyAllWindows()
                    return target

    def _create_buttons(self, img_w):
        """Create UI buttons"""
        self.buttons = []
        y, h, spacing = 10, 50, 10
        x = 20

        buttons_config = [
            (100, "< Prev", "prev", (80, 80, 150)),
            (100, "Next >", "next", (80, 80, 150)),
            (80, "T", "table", (0, 180, 0)),
            (80, "G", "graphic", (0, 0, 180)),
            (80, "X", "text", (0, 180, 180)),
            (100, "Delete", "delete", (180, 0, 0)),
            (80, "Quit", "quit", (120, 120, 120))
        ]

        for width, label, action, color in buttons_config:
            self.buttons.append(Button(x, y, width, h, label, action, color))
            x += width + spacing

    def _mouse_callback(self, event, x, y, flags, page_num):
        """Handle mouse events"""
        current_regions = self.page_regions[page_num]

        if event == cv2.EVENT_LBUTTONDOWN:
            # Check buttons first
            for btn in self.buttons:
                if btn.contains(x, y):
                    self.button_action = self._handle_button_click(btn.action, current_regions)
                    return

            clicked_idx = self._find_region_at(x, y, current_regions)

            if clicked_idx is not None:
                # Multi-selection
                if flags & cv2.EVENT_FLAG_SHIFTKEY:
                    if clicked_idx not in self.selected_indices:
                        self.selected_indices.append(clicked_idx)
                    self.selected_idx = clicked_idx
                elif flags & cv2.EVENT_FLAG_CTRLKEY:
                    if clicked_idx in self.selected_indices:
                        self.selected_indices.remove(clicked_idx)
                        self.selected_idx = self.selected_indices[-1] if self.selected_indices else None
                    else:
                        self.selected_indices.append(clicked_idx)
                        self.selected_idx = clicked_idx
                else:
                    self.selected_indices = [clicked_idx]
                    self.selected_idx = clicked_idx

                region = current_regions[clicked_idx]

                if self._is_near_corner(x, y, region):
                    self.resizing = True
                    self.resize_start_bbox = region['bbox']
                    self.resize_direction = self._get_resize_direction(x, y, region)
                else:
                    self.moving = True

                self.start_point = (x, y)
            else:
                self.drawing = True
                self.start_point = (x, y)
                if not (flags & (cv2.EVENT_FLAG_SHIFTKEY | cv2.EVENT_FLAG_CTRLKEY)):
                    self.selected_idx = None
                    self.selected_indices = []

        elif event == cv2.EVENT_MOUSEMOVE:
            # Update button hover
            for btn in self.buttons:
                btn.hover = btn.contains(x, y)

            # Handle resize preview
            if not self.drawing and not self.moving and not self.resizing:
                for idx, region in enumerate(current_regions):
                    if self._is_near_corner(x, y, region):
                        self.hover_resize_idx = idx
                        self.hover_resize_dir = self._get_resize_direction(x, y, region)
                        break
                else:
                    self.hover_resize_idx = None
                    self.hover_resize_dir = None

            if self.drawing:
                self.current_point = (x, y)
            elif self.moving and self.selected_indices:
                dx = x - self.start_point[0]
                dy = y - self.start_point[1]
                for idx in self.selected_indices:
                    if idx < len(current_regions):
                        region = current_regions[idx]
                        bx, by, bw, bh = region['bbox']
                        region['bbox'] = (bx + dx, by + dy, bw, bh)
                self.start_point = (x, y)
            elif self.resizing and self.selected_idx is not None:
                self._apply_resize(x, y, current_regions[self.selected_idx])

        elif event == cv2.EVENT_LBUTTONUP:
            if self.drawing and self.start_point and self.current_point:
                x1, y1 = self.start_point
                x2, y2 = self.current_point
                x_min, x_max = min(x1, x2), max(x1, x2)
                y_min, y_max = min(y1, y2), max(y1, y2)
                w, h = x_max - x_min, y_max - y_min

                if w > 20 and h > 20:
                    current_regions.append({'bbox': (x_min, y_min, w, h), 'type': 'table'})
                    self.selected_idx = len(current_regions) - 1
                    self.selected_indices = [self.selected_idx]

            self.drawing = False
            self.moving = False
            self.resizing = False
            self.start_point = None
            self.current_point = None
            self.resize_start_bbox = None
            self.resize_direction = None

    def _handle_button_click(self, action, current_regions):
        """Handle button actions"""
        if action in ['prev', 'next', 'quit']:
            return action
        elif action == 'table':
            self._change_type(current_regions, 'table')
        elif action == 'graphic':
            self._change_type(current_regions, 'graphic')
        elif action == 'text':
            self._change_type(current_regions, 'text')
        elif action == 'delete':
            self._delete_selected(current_regions)
        return None

    def _draw_ui(self, image, regions, page_num):
        """Draw complete UI"""
        # Draw buttons
        for btn in self.buttons:
            btn.draw(image)

        # Draw page number and selection count
        page_info = f"Page {page_num}/{self.total_pages}"
        if self.selected_indices:
            page_info += f" | Selected: {len(self.selected_indices)}"
        cv2.putText(image, page_info, (image.shape[1] - 300, 35),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

        # Draw regions
        for idx, region in enumerate(regions):
            x, y, w, h = region['bbox']
            region_type = region.get('type', 'table')
            color = self.REGION_TYPES.get(region_type, (255, 255, 255))

            is_selected = idx in self.selected_indices
            thickness = 3 if is_selected else 2

            cv2.rectangle(image, (x, y), (x+w, y+h), color, thickness)

            overlay = image.copy()
            cv2.rectangle(overlay, (x, y), (x+w, y+h), color, -1)
            alpha = 0.25 if is_selected else 0.15
            cv2.addWeighted(overlay, alpha, image, 1.0 - alpha, 0, image)

            label = f"{region_type.upper()} #{idx+1}"
            if is_selected and len(self.selected_indices) > 1:
                label += " ✓"
            cv2.putText(image, label, (x, y-5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

            # Resize handles
            if idx == self.selected_idx:
                handle_radius = 12
                corners_info = [((x, y), 'TL'), ((x+w, y), 'TR'), ((x, y+h), 'BL'), ((x+w, y+h), 'BR')]
                for (cx, cy), label_text in corners_info:
                    cv2.circle(image, (cx, cy), handle_radius, (255, 255, 255), 3)
                    cv2.circle(image, (cx, cy), handle_radius-3, color, -1)
                    cv2.circle(image, (cx, cy), 2, (0, 0, 0), -1)
                    cv2.putText(image, label_text, (cx-10, cy-15),
                               cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1)

            # Hover feedback
            if idx == self.hover_resize_idx and self.hover_resize_dir:
                bx, by, bw, bh = region['bbox']
                hover_pos = {
                    'top-left': (bx, by),
                    'top-right': (bx+bw, by),
                    'bottom-left': (bx, by+bh),
                    'bottom-right': (bx+bw, by+bh)
                }
                if self.hover_resize_dir in hover_pos:
                    hx, hy = hover_pos[self.hover_resize_dir]
                    cv2.circle(image, (hx, hy), 20, (0, 255, 255), 3)
                    dir_text = self.hover_resize_dir.upper().replace('-', ' ')
                    cv2.putText(image, dir_text, (hx + 25, hy),
                               cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 2)

            # Active resize feedback
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
                    cv2.circle(image, (ax, ay), 25, (0, 0, 255), 4)
                    cv2.putText(image, "RESIZING", (ax + 30, ay),
                               cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)

        # Drawing preview
        if self.drawing and self.start_point and self.current_point:
            cv2.rectangle(image, self.start_point, self.current_point, (255, 255, 0), 2)

        return image

    def _find_region_at(self, x, y, regions):
        """Find region containing point"""
        for idx, region in enumerate(regions):
            bx, by, bw, bh = region['bbox']
            if bx <= x <= bx+bw and by <= y <= by+bh:
                return idx
        return None

    def _is_near_corner(self, x, y, region, threshold=30):
        """Check if near corner"""
        bx, by, bw, bh = region['bbox']
        corners = [(bx, by), (bx+bw, by), (bx, by+bh), (bx+bw, by+bh)]
        for cx, cy in corners:
            if abs(x - cx) < threshold and abs(y - cy) < threshold:
                return True
        return False

    def _get_resize_direction(self, x, y, region, threshold=30):
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

    def _apply_resize(self, x, y, region):
        """Apply resize from any corner"""
        ox, oy, ow, oh = self.resize_start_bbox

        if self.resize_direction == 'bottom-right':
            region['bbox'] = (ox, oy, max(20, x-ox), max(20, y-oy))
        elif self.resize_direction == 'top-left':
            nx = min(x, ox+ow-20)
            ny = min(y, oy+oh-20)
            region['bbox'] = (nx, ny, max(20, (ox+ow)-nx), max(20, (oy+oh)-ny))
        elif self.resize_direction == 'top-right':
            ny = min(y, oy+oh-20)
            region['bbox'] = (ox, ny, max(20, x-ox), max(20, (oy+oh)-ny))
        elif self.resize_direction == 'bottom-left':
            nx = min(x, ox+ow-20)
            region['bbox'] = (nx, oy, max(20, (ox+ow)-nx), max(20, y-oy))
        else:
            region['bbox'] = (ox, oy, max(20, x-ox), max(20, y-oy))

    def _change_type(self, regions, new_type):
        """Change region type for all selected regions"""
        if self.selected_indices:
            for idx in self.selected_indices:
                if idx < len(regions):
                    regions[idx]['type'] = new_type
            print(f"✓ Changed {len(self.selected_indices)} region(s) to {new_type}")

    def _delete_selected(self, regions):
        """Delete all selected regions"""
        if self.selected_indices:
            for idx in sorted(self.selected_indices, reverse=True):
                if idx < len(regions):
                    del regions[idx]
            count = len(self.selected_indices)
            self.selected_idx = None
            self.selected_indices = []
            print(f"✓ Deleted {count} region(s)")

    def _print_help(self):
        """Print help"""
        print("\n" + "="*80)
        print("CONTROLS:")
        print("  Mouse:")
        print("    Click + Drag = Draw region")
        print("    Shift+Click = Add to selection")
        print("    Ctrl+Click = Toggle selection")
        print("    Drag corner = Resize")
        print("    Drag box = Move (all selected)")
        print("")
        print("  Buttons: < Prev | Next > | T | G | X | Delete | Quit")
        print("  Keys: P=Prev | N=Next | T=Table | G=Graphic | X=Text | D=Delete | Q=Quit")
        print("="*80)

