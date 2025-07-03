"""
Layer to Mask Node
Layer to Mask Node

Convert annotation layer data to ComfyUI mask format, supporting multiple conversion modes
"""

import json
import logging
from typing import Dict, List

import torch
import numpy as np

logger = logging.getLogger(__name__)

class LayerToMaskNode:
    """Layer to mask node - Convert editing results to masks"""
    
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "image_width": ("INT", {"default": 512, "min": 64, "max": 4096}),
                "image_height": ("INT", {"default": 512, "min": 64, "max": 4096}),
            },
            "optional": {
                "layers_json": ("STRING", {"forceInput": True, "multiline": True}),
                "selected_layer_ids": ("STRING", {"forceInput": True}),
                "mask_mode": (["selected_only", "all_layers", "inverse"], {"default": "selected_only"}),
                "feather": ("INT", {"default": 0, "min": 0, "max": 50, "description": "Edge feather pixels"}),
            }
        }
    
    RETURN_TYPES = ("MASK", "STRING")
    RETURN_NAMES = ("mask", "conversion_info")
    FUNCTION = "convert"
    CATEGORY = "kontext/core"
    DESCRIPTION = "Convert layer data to ComfyUI compatible masks"
    
    def convert(self, image_width: int = 512, image_height: int = 512,
                layers_json: str = None, selected_layer_ids: str = None,
                mask_mode: str = "selected_only", feather: int = 0):
        """Convert layer data to mask"""
        
        try:
            # Parse data
            layers_data = json.loads(layers_json) if layers_json else []
            selected_ids = json.loads(selected_layer_ids) if selected_layer_ids else []
            
            # Create mask
            mask = np.zeros((image_height, image_width), dtype=np.float32)
            processed_layers = 0
            
            for layer in layers_data:
                layer_id = layer.get("id", "")
                
                # Decide whether to process this layer based on mode
                should_process = False
                if mask_mode == "selected_only" and layer_id in selected_ids:
                    should_process = True
                elif mask_mode == "all_layers":
                    should_process = True
                elif mask_mode == "inverse" and layer_id not in selected_ids:
                    should_process = True
                
                if should_process:
                    layer_mask = self._layer_to_mask(layer, image_width, image_height)
                    mask = np.maximum(mask, layer_mask)
                    processed_layers += 1
            
            # Apply feather effect
            if feather > 0:
                mask = self._apply_feather(mask, feather)
            
            # Convert to PyTorch tensor
            mask_tensor = torch.from_numpy(mask).unsqueeze(0)
            
            # Create conversion info
            conversion_info = {
                "processed_layers": processed_layers,
                "total_layers": len(layers_data),
                "selected_layers": len(selected_ids),
                "mask_mode": mask_mode,
                "feather": feather,
                "output_size": [image_width, image_height],
                "mask_coverage": float(np.mean(mask > 0))
            }
            
            logger.info(f"Mask conversion: {processed_layers} layers, coverage: {conversion_info['mask_coverage']:.2%}")
            
            return (mask_tensor, json.dumps(conversion_info, indent=2))
            
        except Exception as e:
            logger.error(f"Layer to mask conversion failed: {e}")
            # Return empty mask
            empty_mask = torch.zeros((1, image_height, image_width))
            error_info = {"error": str(e), "status": "failed"}
            return (empty_mask, json.dumps(error_info))
    
    def _layer_to_mask(self, layer: Dict, width: int, height: int) -> np.ndarray:
        """Convert single layer to mask"""
        
        mask = np.zeros((height, width), dtype=np.float32)
        
        geometry = layer.get("geometry", {})
        geom_type = geometry.get("type", "rectangle")
        
        if geom_type == "rectangle":
            coords = geometry.get("coordinates", [0, 0, 100, 100])
            x1, y1, x2, y2 = coords
            x1, x2 = max(0, min(x1, x2)), min(width, max(x1, x2))
            y1, y2 = max(0, min(y1, y2)), min(height, max(y1, y2))
            mask[y1:y2, x1:x2] = 1.0
            
        elif geom_type == "circle":
            coords = geometry.get("coordinates", [50, 50, 25])
            cx, cy, r = coords
            y_indices, x_indices = np.ogrid[:height, :width]
            circle_mask = (x_indices - cx) ** 2 + (y_indices - cy) ** 2 <= r ** 2
            mask[circle_mask] = 1.0
            
        elif geom_type == "polygon":
            # Polygon mask processing
            coords = geometry.get("coordinates", [])
            if len(coords) >= 6:  # At least 3 points
                try:
                    import cv2
                    points = np.array(coords).reshape(-1, 2).astype(np.int32)
                    cv2.fillPoly(mask, [points], 1.0)
                except ImportError:
                    logger.warning("OpenCV not available for polygon mask")
        
        # If mask data exists, use it preferentially
        if "mask" in layer and layer["mask"]:
            try:
                # Decode base64 encoded mask data
                import base64
                mask_data = base64.b64decode(layer["mask"])
                decoded_mask = np.frombuffer(mask_data, dtype=np.float32)
                if decoded_mask.size == width * height:
                    mask = decoded_mask.reshape((height, width))
            except Exception as e:
                logger.warning(f"Failed to decode mask data: {e}")
        
        return mask
    
    def _apply_feather(self, mask: np.ndarray, feather_pixels: int) -> np.ndarray:
        """Apply feather effect"""
        if feather_pixels <= 0:
            return mask
        
        try:
            import cv2
            from scipy import ndimage
            
            # Use Gaussian blur to implement feathering
            blurred = cv2.GaussianBlur(mask, (feather_pixels*2+1, feather_pixels*2+1), feather_pixels/3)
            return blurred
            
        except ImportError:
            # Fallback to simple averaging filter
            from scipy import ndimage
            kernel_size = feather_pixels * 2 + 1
            kernel = np.ones((kernel_size, kernel_size)) / (kernel_size * kernel_size)
            return ndimage.convolve(mask, kernel, mode='constant')

# Node registration
NODE_CLASS_MAPPINGS = {
    "LayerToMaskNode": LayerToMaskNode,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "LayerToMaskNode": "🎯 Layer to Mask",
}

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS"]