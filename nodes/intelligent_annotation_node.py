"""
ComfyUI Intelligent Annotation Node
ComfyUI Intelligent Annotation Node

Integrate intelligent annotation service into ComfyUI workflow
"""

import asyncio
import json
import logging
from typing import Dict, List, Tuple, Any

import torch
import numpy as np
from PIL import Image

# ComfyUI imports (assuming running in ComfyUI environment)
try:
    import comfy.model_management as model_management
    import folder_paths
    from nodes import MAX_RESOLUTION
    COMFY_AVAILABLE = True
except ImportError:
    COMFY_AVAILABLE = False
    MAX_RESOLUTION = 8192

# Import internal annotation service
try:
    from annotation_service import annotate_image, get_annotation_service
    SERVICE_AVAILABLE = True
except ImportError:
    SERVICE_AVAILABLE = False
    logger.warning("Annotation service not available")

logger = logging.getLogger(__name__)

class ComfyUIAnnotationHelper:
    """ComfyUI annotation helper class"""
    
    def __init__(self, service_url: str = "http://localhost:8001"):
        self.service_url = service_url
    
    def check_service_availability(self) -> bool:
        """Check service availability"""
        try:
            import requests
            response = requests.get(f"{self.service_url}/health", timeout=5)
            return response.status_code == 200
        except:
            return False
    
    def tensor_to_layers(self, image_tensor: torch.Tensor, **kwargs) -> List[Dict]:
        """Convert tensor to layer data (simplified version)"""
        # Should call actual detection service here
        # Now returning simulated data
        return [
            {
                "id": "layer_1",
                "class_name": "person",
                "confidence": 0.85,
                "boundingBox": {"left": 100, "top": 100, "right": 200, "bottom": 200},
                "semanticAnnotation": {"category": "person", "confidence": 0.85}
            }
        ]
    
    def layers_to_masks(self, layers: List[Dict], image_size: Tuple[int, int]) -> List[np.ndarray]:
        """Convert layers to mask arrays"""
        masks = []
        height, width = image_size
        
        for layer in layers:
            mask = np.zeros((height, width), dtype=np.float32)
            bbox = layer.get('boundingBox', {})
            if bbox:
                left = max(0, int(bbox.get('left', 0)))
                top = max(0, int(bbox.get('top', 0)))
                right = min(width, int(bbox.get('right', width)))
                bottom = min(height, int(bbox.get('bottom', height)))
                mask[top:bottom, left:right] = 1.0
            masks.append(mask)
        
        return masks

class IntelligentAnnotationNode:
    """Intelligent annotation node"""
    
    def __init__(self):
        self.service_available = SERVICE_AVAILABLE
        self.annotation_helper = None
        self.last_service_url = None
    
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "image": ("IMAGE",),
                "detection_model": (["yolo", "simple"], {"default": "yolo"}),
                "confidence_threshold": ("FLOAT", {
                    "default": 0.5, 
                    "min": 0.0, 
                    "max": 1.0, 
                    "step": 0.01
                }),
                "max_objects": ("INT", {
                    "default": 20,
                    "min": 1,
                    "max": 100,
                    "step": 1
                }),
                "generate_masks": ("BOOLEAN", {"default": True}),
                "mask_format": (["tensor", "rle", "polygon", "bitmap"], {"default": "tensor"}),
            },
            "optional": {
                "service_url": ("STRING", {"default": "http://localhost:8001"}),
                "iou_threshold": ("FLOAT", {
                    "default": 0.5,
                    "min": 0.0,
                    "max": 1.0, 
                    "step": 0.01
                }),
            }
        }
    
    RETURN_TYPES = ("IMAGE", "MASK", "STRING", "STRING")
    RETURN_NAMES = ("image", "masks", "layers_json", "statistics")
    FUNCTION = "annotate_image"
    CATEGORY = "kontext/annotation"
    DESCRIPTION = "Automatically detect and segment objects in images"
    
    def __init__(self):
        self.service_available = SERVICE_AVAILABLE
    
    def _get_annotation_helper(self, service_url: str) -> ComfyUIAnnotationHelper:
        """Get annotation helper instance"""
        if self.annotation_helper is None or self.last_service_url != service_url:
            self.annotation_helper = ComfyUIAnnotationHelper(service_url)
            self.last_service_url = service_url
        return self.annotation_helper
    
    def annotate_image(
        self,
        image: torch.Tensor,
        detection_model: str = "yolo",
        confidence_threshold: float = 0.5,
        max_objects: int = 20,
        generate_masks: bool = True,
        mask_format: str = "tensor",
        service_url: str = "http://localhost:8001",
        iou_threshold: float = 0.5,
    ) -> Tuple[torch.Tensor, torch.Tensor, str, str]:
        """
        Execute intelligent annotation
        
        Args:
            image: Input image tensor [batch, height, width, channels]
            detection_model: Detection model type
            confidence_threshold: Confidence threshold
            max_objects: Maximum number of objects
            generate_masks: Whether to generate masks
            mask_format: Mask format
            service_url: Service URL
            iou_threshold: IOU threshold
            
        Returns:
            (original image, mask tensor, layer JSON, statistics)
        """
        try:
            # Get annotation helper
            helper = self._get_annotation_helper(service_url)
            
            # Check service availability
            if not helper.check_service_availability():
                logger.warning("Annotation service not available, returning empty results")
                return self._create_empty_result(image)
            
            # Execute annotation
            layers = helper.tensor_to_layers(
                image,
                detection_model=detection_model,
                confidence_threshold=confidence_threshold,
                iou_threshold=iou_threshold,
                max_objects=max_objects,
                generate_masks=generate_masks,
                mask_format=mask_format
            )
            
            if not layers:
                logger.info("No objects detected")
                return self._create_empty_result(image)
            
            # Extract image dimensions
            batch_size, height, width, channels = image.shape
            
            # Convert layers to masks
            mask_arrays = helper.layers_to_masks(layers, (height, width))
            
            # Create mask tensor
            if mask_arrays:
                # Stack all masks
                masks_tensor = torch.stack([
                    torch.from_numpy(mask) for mask in mask_arrays
                ])
                # Ensure correct mask shape [num_masks, height, width]
                if len(masks_tensor.shape) == 3:
                    masks_tensor = masks_tensor.unsqueeze(0)  # Add batch dimension
            else:
                # Create empty mask
                masks_tensor = torch.zeros((1, 1, height, width), dtype=torch.float32)
            
            # Generate layer JSON
            layers_json = json.dumps(layers, indent=2, ensure_ascii=False)
            
            # Generate statistics
            statistics = self._generate_statistics_string(layers)
            
            logger.info(f"Annotation completed: {len(layers)} objects detected")
            
            return (image, masks_tensor, layers_json, statistics)
            
        except Exception as e:
            logger.error(f"Annotation failed: {e}")
            return self._create_empty_result(image, error=str(e))
    
    def _create_empty_result(
        self, 
        image: torch.Tensor, 
        error: str = None
    ) -> Tuple[torch.Tensor, torch.Tensor, str, str]:
        """Create empty result"""
        batch_size, height, width, channels = image.shape
        
        # Empty mask
        empty_mask = torch.zeros((1, 1, height, width), dtype=torch.float32)
        
        # Empty layer JSON
        empty_layers = json.dumps([], indent=2)
        
        # Statistics
        if error:
            statistics = f"Error: {error}\nDetected objects: 0"
        else:
            statistics = "Detected objects: 0\nNo objects found in image"
        
        return (image, empty_mask, empty_layers, statistics)
    
    def _generate_statistics_string(self, layers: List[Dict]) -> str:
        """Generate statistics string"""
        if not layers:
            return "Detected objects: 0"
        
        # Count categories
        categories = {}
        total_confidence = 0.0
        
        for layer in layers:
            semantic = layer.get('semanticAnnotation', {})
            category = semantic.get('category', 'unknown')
            confidence = semantic.get('confidence', 0.0)
            
            if category not in categories:
                categories[category] = {'count': 0, 'avg_confidence': 0.0}
            categories[category]['count'] += 1
            total_confidence += confidence
        
        # Calculate average confidence
        avg_confidence = total_confidence / len(layers) if layers else 0.0
        
        # Build statistics string
        stats = [
            f"Detected objects: {len(layers)}",
            f"Average confidence: {avg_confidence:.2f}",
            "\nCategories:"
        ]
        
        for category, info in categories.items():
            stats.append(f"  {category}: {info['count']}")
        
        return "\n".join(stats)

class LayerToMaskNode:
    """Layer to mask node"""
    
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "layers_json": ("STRING", {"forceInput": True}),
                "image_width": ("INT", {"default": 512, "min": 64, "max": MAX_RESOLUTION}),
                "image_height": ("INT", {"default": 512, "min": 64, "max": MAX_RESOLUTION}),
                "layer_index": ("INT", {"default": 0, "min": 0, "max": 99}),
            },
            "optional": {
                "combine_all": ("BOOLEAN", {"default": False}),
            }
        }
    
    RETURN_TYPES = ("MASK",)
    RETURN_NAMES = ("mask",)
    FUNCTION = "layer_to_mask"
    CATEGORY = "kontext/annotation"
    DESCRIPTION = "Convert layer data to ComfyUI mask format"
    
    def layer_to_mask(
        self,
        layers_json: str,
        image_width: int,
        image_height: int,
        layer_index: int = 0,
        combine_all: bool = False
    ) -> Tuple[torch.Tensor]:
        """
        Convert layer data to mask
        
        Args:
            layers_json: Layer JSON data
            image_width: Image width
            image_height: Image height
            layer_index: Layer index (if not combining)
            combine_all: Whether to combine all layers
            
        Returns:
            Mask tensor
        """
        try:
            # Parse layer data
            layers = json.loads(layers_json) if layers_json else []
            
            if not layers:
                # Return empty mask
                return (torch.zeros((1, image_height, image_width), dtype=torch.float32),)
            
            # Create annotation helper
            helper = ComfyUIAnnotationHelper()
            
            if combine_all:
                # Combine all layers
                combined_mask = np.zeros((image_height, image_width), dtype=np.float32)
                
                mask_arrays = helper.layers_to_masks(layers, (image_height, image_width))
                for mask_array in mask_arrays:
                    combined_mask = np.maximum(combined_mask, mask_array)
                
                mask_tensor = torch.from_numpy(combined_mask).unsqueeze(0)
                
            else:
                # Use layer at specified index
                if layer_index >= len(layers):
                    layer_index = len(layers) - 1
                
                target_layer = [layers[layer_index]] if layer_index < len(layers) else []
                mask_arrays = helper.layers_to_masks(target_layer, (image_height, image_width))
                
                if mask_arrays:
                    mask_tensor = torch.from_numpy(mask_arrays[0]).unsqueeze(0)
                else:
                    mask_tensor = torch.zeros((1, image_height, image_width), dtype=torch.float32)
            
            return (mask_tensor,)
            
        except Exception as e:
            logger.error(f"Layer to mask conversion failed: {e}")
            # Return empty mask
            return (torch.zeros((1, image_height, image_width), dtype=torch.float32),)

class LayerFilterNode:
    """Layer filter node"""
    
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "layers_json": ("STRING", {"forceInput": True}),
                "filter_type": (["category", "confidence", "label", "size"], {"default": "category"}),
                "filter_value": ("STRING", {"default": "person"}),
            },
            "optional": {
                "min_confidence": ("FLOAT", {
                    "default": 0.0,
                    "min": 0.0,
                    "max": 1.0,
                    "step": 0.01
                }),
                "min_size": ("INT", {"default": 0, "min": 0, "max": 100000}),
            }
        }
    
    RETURN_TYPES = ("STRING", "STRING")
    RETURN_NAMES = ("filtered_layers", "filter_stats")
    FUNCTION = "filter_layers"
    CATEGORY = "kontext/annotation"
    DESCRIPTION = "Filter layers based on various criteria"
    
    def filter_layers(
        self,
        layers_json: str,
        filter_type: str = "category",
        filter_value: str = "person",
        min_confidence: float = 0.0,
        min_size: int = 0
    ) -> Tuple[str, str]:
        """
        Filter layers
        
        Args:
            layers_json: Input layer JSON
            filter_type: Filter type
            filter_value: Filter value
            min_confidence: Minimum confidence
            min_size: Minimum size
            
        Returns:
            (filtered layer JSON, filter statistics)
        """
        try:
            # Parse layer data
            layers = json.loads(layers_json) if layers_json else []
            
            if not layers:
                return (json.dumps([]), "No layers to filter")
            
            original_count = len(layers)
            filtered_layers = []
            
            for layer in layers:
                # Confidence filtering
                semantic = layer.get('semanticAnnotation', {})
                confidence = semantic.get('confidence', 0.0)
                if confidence < min_confidence:
                    continue
                
                # Size filtering
                bbox = layer.get('boundingBox', {})
                if bbox:
                    width = bbox.get('right', 0) - bbox.get('left', 0)
                    height = bbox.get('bottom', 0) - bbox.get('top', 0)
                    size = width * height
                    if size < min_size:
                        continue
                
                # Type-specific filtering
                if filter_type == "category":
                    category = semantic.get('category', '')
                    if filter_value.lower() not in category.lower():
                        continue
                        
                elif filter_type == "label":
                    label = semantic.get('label', '')
                    if filter_value.lower() not in label.lower():
                        continue
                        
                elif filter_type == "confidence":
                    threshold = float(filter_value) if filter_value.replace('.', '').isdigit() else 0.5
                    if confidence < threshold:
                        continue
                
                # Passed all filter conditions
                filtered_layers.append(layer)
            
            # Generate filter statistics
            filtered_count = len(filtered_layers)
            stats = f"Original: {original_count}, Filtered: {filtered_count}, Removed: {original_count - filtered_count}"
            
            return (json.dumps(filtered_layers, indent=2), stats)
            
        except Exception as e:
            logger.error(f"Layer filtering failed: {e}")
            return (layers_json, f"Filter failed: {str(e)}")

# Node mapping
NODE_CLASS_MAPPINGS = {
    "IntelligentAnnotationNode": IntelligentAnnotationNode,
    "LayerToMaskNode": LayerToMaskNode,
    "LayerFilterNode": LayerFilterNode,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "IntelligentAnnotationNode": "🤖 Intelligent Annotation",
    "LayerToMaskNode": "🎯 Layer to Mask", 
    "LayerFilterNode": "🔍 Layer Filter",
}

# Export
__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS"]