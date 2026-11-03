"""Unit tests for hybrid NBS OCR helpers (Surya boxes → PIL → Indra order)."""
from __future__ import annotations

import numpy as np
from PIL import Image

from phase_diagrams.nbs.nbs_hybrid_ocr import (
    boxes_to_ndarray,
    crop_line_strips,
    refine_reading_order,
    select_onnx_providers,
    select_torch_device,
    sort_boxes_reading_order,
)


def test_sort_boxes_reading_order_top_to_bottom_then_left():
    boxes = [
        (100.0, 80.0, 200.0, 100.0),   # row 2 left
        (10.0, 10.0, 90.0, 30.0),      # row 1 left
        (120.0, 12.0, 200.0, 28.0),    # row 1 right
        (20.0, 82.0, 80.0, 98.0),      # row 2 left-er
    ]
    ordered = sort_boxes_reading_order(boxes)
    assert ordered[0][:2] == (10.0, 10.0)
    assert ordered[1][:2] == (120.0, 12.0)
    assert ordered[2][0] < ordered[3][0]


def test_crop_line_strips_clamps_and_sizes():
    picture = Image.new("RGB", (100, 50), color=(255, 255, 255))
    crops = crop_line_strips(picture, [(-5.0, 10.0, 40.0, 30.0), (90.0, 40.0, 200.0, 80.0)], pad=2)
    assert len(crops) == 2
    assert crops[0].size[0] > 0 and crops[0].size[1] > 0
    assert crops[1].size[0] > 0


def test_boxes_to_ndarray_empty_and_shape():
    assert boxes_to_ndarray([]).shape == (0, 4)
    arr = boxes_to_ndarray([(1.0, 2.0, 3.0, 4.0)])
    assert arr.dtype == np.float32
    assert arr.tolist() == [[1.0, 2.0, 3.0, 4.0]]


def test_refine_reading_order_falls_back_without_model():
    class _Rec:
        pass

    boxes = boxes_to_ndarray([(0, 0, 10, 10), (0, 20, 10, 30)])
    assert refine_reading_order(_Rec(), boxes, ["a", "b"], (100, 100)) == [0, 1]


def test_refine_reading_order_uses_indra_permutation():
    class _Rec:
        def reading_order(self, boxes, texts, wh):
            return [1, 0], None, None

    boxes = boxes_to_ndarray([(0, 0, 10, 10), (0, 20, 10, 30)])
    assert refine_reading_order(_Rec(), boxes, ["a", "b"], (100, 100)) == [1, 0]


def test_device_helpers_return_known_values():
    assert select_torch_device() in {"cpu", "cuda", "mps"}
    providers = select_onnx_providers()
    assert providers
    assert providers[-1] == "CPUExecutionProvider" or "CPUExecutionProvider" in providers
