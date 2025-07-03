"""
Visual Prompt Editor Node
Visual prompt editor node for ComfyUI

Combines visual annotation editing and structured prompt generation functionality
Double-click node to open unified editing interface: left side for graphic annotation, right side for prompt editing
"""

import json
import base64
import numpy as np
import torch
from typing import Dict, List, Any, Tuple, Optional
from datetime import datetime

try:
    import comfy.model_management as model_management
    from nodes import MAX_RESOLUTION
    COMFY_AVAILABLE = True
except ImportError:
    COMFY_AVAILABLE = False
    MAX_RESOLUTION = 8192

class VisualPromptEditor:
    """Visual Prompt Editor Node - Unified annotation editing and prompt generation"""
    
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "image": ("IMAGE",),
            },
            "optional": {
                "annotation_data": ("STRING", {"tooltip": "JSON annotation data from frontend editor"}),
                "text_prompt": ("STRING", {"multiline": True, "default": "", "tooltip": "Additional text instructions for the edit"}),
                "enable_editing": ("BOOLEAN", {"default": True}),
                "auto_generate_prompts": ("BOOLEAN", {"default": True}),
                "prompt_template": ([
                    "object_edit", 
                    "style_transfer", 
                    "background_replace", 
                    "character_consistency", 
                    "lighting_enhancement",
                    "remove_object",
                    "add_object",
                    "custom"
                ], {"default": "object_edit"}),
                "clip": ("CLIP", {"tooltip": "Optional: Flux dual CLIP encoder (CLIP-L + T5-XXL) for advanced conditioning"}),
                "guidance": ("FLOAT", {"default": 3.5, "min": 0.0, "max": 100.0, "step": 0.1, "tooltip": "Flux guidance scale"}),
                "weight_clip_l": ("FLOAT", {"default": 1.0, "min": 0.0, "max": 2.0, "step": 0.1, "tooltip": "CLIP-L encoder weight"}),
                "weight_t5xxl": ("FLOAT", {"default": 1.0, "min": 0.0, "max": 2.0, "step": 0.1, "tooltip": "T5-XXL encoder weight"}),
                "negative_prompt": ("STRING", {"multiline": True, "default": "", "tooltip": "Negative prompt for what to avoid"}),
            }
        }
    
    RETURN_TYPES = ("IMAGE", "STRING", "STRING", "CONDITIONING", "CONDITIONING", "STRING", "STRING")
    RETURN_NAMES = (
        "processed_image", 
        "edited_layers_json", 
        "selected_layer_ids",
        "conditioning_positive",
        "conditioning_negative", 
        "positive_prompt",
        "editing_metadata"
    )
    FUNCTION = "visual_prompt_edit"
    CATEGORY = "kontext/core"
    DESCRIPTION = "Unified visual annotation editor with structured prompt generation. layers_json is optional - can work standalone or with pre-detected layers."
    
    def visual_prompt_edit(self, image: torch.Tensor, annotation_data: str = None,
                          text_prompt: str = "", enable_editing: bool = True, 
                          auto_generate_prompts: bool = True, prompt_template: str = "object_edit", 
                          clip=None, guidance: float = 3.5, weight_clip_l: float = 1.0, weight_t5xxl: float = 1.0,
                          negative_prompt: str = ""):
        """Unified visual prompt editing functionality"""
        
        try:
            # Process annotation data
            if annotation_data and annotation_data.strip():
                try:
                    parsed_data = json.loads(annotation_data)
                    
                    # Check if the data has an "annotations" key (new format)
                    if isinstance(parsed_data, dict) and "annotations" in parsed_data:
                        layers_data = parsed_data["annotations"]
                    elif isinstance(parsed_data, list):
                        layers_data = parsed_data
                    else:
                        layers_data = []
                            
                except json.JSONDecodeError as e:
                    print(f"Warning: JSON parsing failed: {e}")
                    layers_data = []
            else:
                layers_data = []
            
            # Create editor data
            editor_data = {
                "image_id": f"vpe_{hash(str(image.shape))}",
                "layers": layers_data,
                "editing_enabled": enable_editing,
                "prompt_template": prompt_template,
                "guidance": guidance,
                "weight_clip_l": weight_clip_l,
                "weight_t5xxl": weight_t5xxl,
                "timestamp": datetime.now().isoformat()
            }
            
            # Generate default selection (first 3 objects)
            selected_ids = [layer.get("id", f"layer_{i}") 
                          for i, layer in enumerate(layers_data[:3])]
            
            # Generate structured prompts
            prompts = self._generate_unified_prompts(
                layers_data, selected_ids, prompt_template, text_prompt
            )
            
            # Create conditioning - use CLIP if available, otherwise fallback
            if clip is not None:
                conditioning_positive, conditioning_negative = self._create_flux_conditioning(
                    clip, prompts, negative_prompt, guidance, weight_clip_l, weight_t5xxl
                )
            else:
                conditioning_positive, conditioning_negative = self._create_fallback_conditioning(
                    prompts, negative_prompt, guidance
                )
            
            # Create editing metadata
            editing_metadata = {
                "total_layers": len(layers_data),
                "selected_count": len(selected_ids),
                "prompt_template": prompt_template,
                "auto_generated": auto_generate_prompts,
                "guidance": guidance,
                "weights": {
                    "clip_l": weight_clip_l,
                    "t5xxl": weight_t5xxl
                },
                "editor_data": editor_data,
                "prompt_analysis": self._analyze_prompt_quality(prompts["positive"])
            }
            
            # If there's layer data, render annotations on image
            if layers_data and len(layers_data) > 0:
                output_image = self._render_annotations_on_image(image, layers_data)
            else:
                output_image = image
            
            return (
                output_image,  # Image with annotations
                json.dumps(layers_data, indent=2),  # Edited layer data
                json.dumps(selected_ids),  # Selected layer IDs
                conditioning_positive,  # Flux positive conditioning
                conditioning_negative,  # Flux negative conditioning 
                prompts["positive"],  # Positive prompt text
                json.dumps(editing_metadata, indent=2),  # Editing metadata
            )
            
        except Exception as e:
            return self._create_fallback_output(image, str(e))
    
    def _generate_unified_prompts(self, layers_data: List[Dict], 
                                 selected_ids: List[str], 
                                 template: str, text_prompt: str = "") -> Dict[str, str]:
        """Generate unified structured prompts"""
        
        # Get information about selected objects
        selected_objects = []
        object_details = []
        
        for layer in layers_data:
            if layer.get("id") in selected_ids:
                layer_type = layer.get("type", "object")
                layer_name = layer.get("name", f"{layer_type}")
                selected_objects.append(layer_name)
                
                # Add detailed description
                detail = f"{layer_type}"
                if "color" in layer:
                    detail += f" in {layer['color']}"
                object_details.append(detail)
        
        # Build base prompt based on template
        templates = {
            "object_edit": "professional photo editing of {objects}, high quality, detailed, realistic lighting",
            "style_transfer": "artistic style transfer applied to {objects}, creative interpretation, enhanced aesthetics",
            "background_replace": "seamless background replacement around {objects}, natural integration, professional compositing",
            "character_consistency": "character consistency enhancement for {objects}, maintaining identity, detailed features",
            "lighting_enhancement": "professional lighting enhancement on {objects}, dramatic shadows, realistic illumination",
            "remove_object": "clean object removal from scene, seamless content fill, natural background extension",
            "add_object": "natural object addition to scene, realistic integration, proper lighting and shadows",
            "custom": "{text_prompt}"
        }
        
        # Format objects list
        if selected_objects:
            objects_str = ", ".join(selected_objects[:3])  # Limit to first 3
            if len(selected_objects) > 3:
                objects_str += f" and {len(selected_objects) - 3} more objects"
        else:
            objects_str = "selected areas"
        
        # Generate positive prompt
        base_template = templates.get(template, templates["object_edit"])
        positive_prompt = base_template.format(objects=objects_str, text_prompt=text_prompt)
        
        # Add quality enhancers
        if template != "custom":
            positive_prompt += ", 8k resolution, sharp focus, professional quality"
        
        # Add text prompt if provided and not custom template
        if text_prompt and template != "custom":
            positive_prompt += f", {text_prompt}"
        
        return {
            "positive": positive_prompt,
            "negative": "low quality, blurry, artifacts, distorted, watermark",
            "clip_l": positive_prompt,
            "t5xxl": positive_prompt + ", masterpiece, highly detailed, photorealistic"
        }
    
    def _render_annotations_on_image(self, image: torch.Tensor, layers_data: List[Dict]) -> torch.Tensor:
        """Render annotations on image"""
        try:
            from PIL import Image, ImageDraw
            
            # Convert torch tensor to PIL Image
            if len(image.shape) == 4:
                # Batch dimension exists, take first
                img_array = image[0].cpu().numpy()
            else:
                img_array = image.cpu().numpy()
            
            # Ensure value range is [0, 1]
            if img_array.max() <= 1.0:
                img_array = (img_array * 255).astype(np.uint8)
            else:
                img_array = img_array.astype(np.uint8)
                
            # Convert to PIL Image
            if len(img_array.shape) == 3:
                pil_image = Image.fromarray(img_array, 'RGB')
            else:
                pil_image = Image.fromarray(img_array, 'L')
                pil_image = pil_image.convert('RGB')
            
            # Create drawing object
            draw = ImageDraw.Draw(pil_image, 'RGBA')
            
            # Color mapping
            color_map = {
                '#f44336': (244, 67, 54, 128),    # Red, 50% transparency
                '#4caf50': (76, 175, 80, 128),    # Green, 50% transparency  
                '#ffeb3b': (255, 235, 59, 128),   # Yellow, 50% transparency
                '#2196f3': (33, 150, 243, 128)    # Blue, 50% transparency
            }
            
            # Get image dimensions
            img_width, img_height = pil_image.size
            
            # Render each annotation
            rendered_count = 0
            for i, layer in enumerate(layers_data):
                color_hex = layer.get('color', '#f44336')
                color_rgba = color_map.get(color_hex, (255, 0, 0, 128))
                layer_type = layer.get('type', 'rectangle')
                
                # Check if coordinates exist and are valid
                # Support multiple coordinate formats: 1) start/end, 2) geometry.coordinates
                has_coordinates = False
                start_point = None
                end_point = None
                
                if layer_type in ['rectangle', 'circle', 'arrow']:
                    # Format 1: Direct start/end coordinates
                    if 'start' in layer and 'end' in layer:
                        start = layer['start'] 
                        end = layer['end']
                        if isinstance(start, dict) and isinstance(end, dict):
                            if all(key in start for key in ['x', 'y']) and all(key in end for key in ['x', 'y']):
                                has_coordinates = True
                                start_point = start
                                end_point = end
                        
                    # Format 2: Geometry coordinates [x1, y1, x2, y2]
                    elif 'geometry' in layer and 'coordinates' in layer['geometry']:
                        coords = layer['geometry']['coordinates']
                        if isinstance(coords, list) and len(coords) >= 4:
                            x1, y1, x2, y2 = coords[:4]
                            start_point = {'x': x1, 'y': y1}
                            end_point = {'x': x2, 'y': y2}
                            has_coordinates = True
                        
                elif layer_type == 'freehand' or layer_type == 'polygon':
                    if 'points' in layer and isinstance(layer['points'], list):
                        points = layer['points']
                        if len(points) >= 3 and all(isinstance(p, dict) and 'x' in p and 'y' in p for p in points):
                            has_coordinates = True
                
                if not has_coordinates:
                    continue
                
                if layer_type == 'rectangle' and start_point and end_point:
                    # Rectangle annotation
                    # Convert SVG coordinates to image coordinates (assuming SVG viewBox is 1000x1000)
                    x1 = int((start_point['x'] / 1000.0) * img_width)
                    y1 = int((start_point['y'] / 1000.0) * img_height)
                    x2 = int((end_point['x'] / 1000.0) * img_width)
                    y2 = int((end_point['y'] / 1000.0) * img_height)
                    
                    # Ensure correct coordinate order
                    x1, x2 = min(x1, x2), max(x1, x2)
                    y1, y2 = min(y1, y2), max(y1, y2)
                    
                    draw.rectangle([x1, y1, x2, y2], fill=color_rgba)
                    rendered_count += 1
                    
                elif layer_type == 'circle' and start_point and end_point:
                    # Ellipse annotation
                    x1 = int((start_point['x'] / 1000.0) * img_width)
                    y1 = int((start_point['y'] / 1000.0) * img_height)
                    x2 = int((end_point['x'] / 1000.0) * img_width)
                    y2 = int((end_point['y'] / 1000.0) * img_height)
                    
                    # Ensure correct coordinate order
                    x1, x2 = min(x1, x2), max(x1, x2)
                    y1, y2 = min(y1, y2), max(y1, y2)
                    
                    draw.ellipse([x1, y1, x2, y2], fill=color_rgba)
                    rendered_count += 1
                    
                elif layer_type == 'freehand' and 'points' in layer:
                    # Polygon annotation
                    points = layer['points']
                    
                    if len(points) >= 3:
                        polygon_points = []
                        for point in points:
                            x = int((point['x'] / 1000.0) * img_width)
                            y = int((point['y'] / 1000.0) * img_height)
                            polygon_points.append((x, y))
                        
                        draw.polygon(polygon_points, fill=color_rgba)
                        rendered_count += 1
                        
                elif layer_type == 'arrow' and start_point and end_point:
                    # Arrow annotation
                    # Convert SVG coordinates to image coordinates
                    x1 = int((start_point['x'] / 1000.0) * img_width)
                    y1 = int((start_point['y'] / 1000.0) * img_height)
                    x2 = int((end_point['x'] / 1000.0) * img_width)
                    y2 = int((end_point['y'] / 1000.0) * img_height)
                    
                    # Draw arrow line
                    line_color = (color_rgba[0], color_rgba[1], color_rgba[2], 255)  # Use opaque color for line
                    draw.line([x1, y1, x2, y2], fill=line_color, width=6)
                    
                    # Calculate arrow head
                    import math
                    
                    # Arrow length and angle
                    arrow_length = 20
                    arrow_angle = math.pi / 6  # 30 degrees
                    
                    # Calculate line angle
                    dx = x2 - x1
                    dy = y2 - y1
                    line_angle = math.atan2(dy, dx)
                    
                    # Calculate arrow two vertices
                    arrow_x1 = x2 - arrow_length * math.cos(line_angle - arrow_angle)
                    arrow_y1 = y2 - arrow_length * math.sin(line_angle - arrow_angle)
                    arrow_x2 = x2 - arrow_length * math.cos(line_angle + arrow_angle)
                    arrow_y2 = y2 - arrow_length * math.sin(line_angle + arrow_angle)
                    
                    # Draw arrow head (triangle)
                    arrow_points = [(x2, y2), (int(arrow_x1), int(arrow_y1)), (int(arrow_x2), int(arrow_y2))]
                    draw.polygon(arrow_points, fill=line_color)
                    
                    rendered_count += 1
            
            # Convert back to torch tensor
            output_array = np.array(pil_image)
            output_tensor = torch.from_numpy(output_array).float() / 255.0
            
            # Ensure correct dimensions
            if len(image.shape) == 4:
                output_tensor = output_tensor.unsqueeze(0)
            
            return output_tensor
            
        except Exception as e:
            print(f"Warning: Failed to render annotations on image: {e}")
            return image  # Return original image if rendering fails
    
    def _create_flux_conditioning(self, clip, prompts: Dict[str, str], negative_prompt: str = "", 
                                 guidance: float = 3.5, weight_clip_l: float = 1.0, weight_t5xxl: float = 1.0):
        """Create Flux-compatible conditioning using real CLIP encoding"""
        try:
            # Prepare positive prompts
            positive_clip_l = prompts.get("clip_l", prompts.get("positive", ""))
            positive_t5xxl = prompts.get("t5xxl", prompts.get("positive", ""))
            
            # Prepare negative prompts
            negative_clip_l = negative_prompt if negative_prompt else "low quality, blurry, artifacts"
            negative_t5xxl = negative_prompt if negative_prompt else "low quality, blurry, distorted, artifacts, watermark"
            
            # Create positive conditioning
            positive_tokens = clip.tokenize(positive_clip_l)
            if hasattr(clip, 'tokenize') and "t5xxl" in str(type(clip)).lower():
                # Flux/SD3 dual encoder
                positive_tokens["t5xxl"] = clip.tokenize(positive_t5xxl)["t5xxl"]
                conditioning_positive = clip.encode_from_tokens_scheduled(
                    positive_tokens, 
                    add_dict={"guidance": guidance, "weight_clip_l": weight_clip_l, "weight_t5xxl": weight_t5xxl}
                )
            else:
                # Standard CLIP encoder fallback
                conditioning_positive = clip.encode_from_tokens(positive_tokens)
            
            # Create negative conditioning
            negative_tokens = clip.tokenize(negative_clip_l)
            if hasattr(clip, 'tokenize') and "t5xxl" in str(type(clip)).lower():
                # Flux/SD3 dual encoder
                negative_tokens["t5xxl"] = clip.tokenize(negative_t5xxl)["t5xxl"]
                conditioning_negative = clip.encode_from_tokens_scheduled(
                    negative_tokens,
                    add_dict={"guidance": guidance, "weight_clip_l": weight_clip_l, "weight_t5xxl": weight_t5xxl}
                )
            else:
                # Standard CLIP encoder fallback
                conditioning_negative = clip.encode_from_tokens(negative_tokens)
            
            return conditioning_positive, conditioning_negative
            
        except Exception as e:
            print(f"Warning: Flux conditioning creation failed: {e}")
            # Fallback to simulated conditioning
            return self._create_fallback_conditioning(prompts, negative_prompt, guidance)
    
    def _create_fallback_conditioning(self, prompts: Dict[str, str], negative_prompt: str, guidance: float):
        """Create fallback conditioning when real CLIP encoding fails"""
        fallback_positive = {
            "model_cond": prompts.get("positive", "high quality image editing"),
            "guidance": guidance,
            "type": "fallback",
            "timestamp": datetime.now().isoformat()
        }
        
        fallback_negative = {
            "model_cond": negative_prompt or "low quality, blurry, artifacts",
            "guidance": guidance,
            "type": "fallback",
            "timestamp": datetime.now().isoformat()
        }
        
        return [fallback_positive], [fallback_negative]
    
    def _analyze_prompt_quality(self, prompt: str) -> Dict:
        """Analyze prompt quality"""
        word_count = len(prompt.split())
        char_count = len(prompt)
        
        # Quality scoring
        score = 50.0
        suggestions = []
        
        # Length analysis
        if word_count < 5:
            score -= 20
            suggestions.append("Prompt too short, add more details")
        elif word_count > 100:
            score -= 10
            suggestions.append("Prompt quite long, consider simplifying")
        else:
            score += 10
        
        # Professional vocabulary detection
        professional_words = [
            "professional", "high quality", "masterpiece", "detailed", 
            "8k", "realistic", "lighting", "composition"
        ]
        found_professional = sum(1 for word in professional_words if word in prompt.lower())
        score += found_professional * 5
        
        # Negative word detection
        negative_words = ["low quality", "blurry", "bad", "ugly", "distorted"]
        found_negative = sum(1 for word in negative_words if word in prompt.lower())
        if found_negative > 0:
            suggestions.append("Consider moving negative terms to negative prompt")
        
        score = max(0, min(100, score))
        
        return {
            "score": score,
            "word_count": word_count,
            "char_count": char_count,
            "professional_terms": found_professional,
            "suggestions": suggestions
        }
    
    def _create_fallback_output(self, image: torch.Tensor, error_msg: str):
        """Create fallback output"""
        fallback_prompts = {
            "positive": "high quality image editing, professional enhancement",
            "negative": "blurry, low quality, artifacts"
        }
        
        fallback_metadata = {
            "status": "error",
            "error": error_msg,
            "timestamp": datetime.now().isoformat()
        }
        
        # Create empty conditioning
        empty_conditioning = [{"model_cond": "", "type": "fallback"}]
        
        return (
            image,
            "[]",  # Empty layer data
            "[]",  # Empty selection
            empty_conditioning,  # Empty positive conditioning
            empty_conditioning,  # Empty negative conditioning
            fallback_prompts["positive"],  # Positive prompt text
            json.dumps(fallback_metadata)  # Editing metadata
        )

# Node registration
NODE_CLASS_MAPPINGS = {
    "VisualPromptEditor": VisualPromptEditor,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "VisualPromptEditor": "🎨 Visual Prompt Editor",
}