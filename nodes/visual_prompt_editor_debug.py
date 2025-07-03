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
            # Enhanced debugging - detailed input tracking
            print(f"\n{'='*60}")
            print(f"🔍 VPE backend received parameters (INPUT CONNECTION METHOD):")
            print(f"  - image shape: {image.shape if image is not None else 'None'}")
            print(f"  - annotation_data type: {type(annotation_data)}")
            print(f"  - annotation_data length: {len(annotation_data) if annotation_data else 0}")
            print(f"  - annotation_data is None: {annotation_data is None}")
            print(f"  - annotation_data is empty: {annotation_data == '' if annotation_data else True}")
            print(f"  - enable_editing: {enable_editing}")
            print(f"  - prompt_template: {prompt_template}")
            print(f"🚀 USING INPUT CONNECTION APPROACH - NO MORE WIDGET DEPENDENCY!")
            
            # Debug widget state
            print(f"🔍 Widget debugging:")
            if hasattr(self, 'widgets'):
                print(f"  - Node has widgets: {len(self.widgets) if self.widgets else 0}")
                for i, widget in enumerate(self.widgets or []):
                    print(f"  - Widget {i}: name='{widget.name}', value='{widget.value}', type={type(widget.value)}")
            else:
                print(f"  - Node has no widgets attribute")

            # Debug node properties
            if hasattr(self, 'properties'):
                print(f"🔍 Node properties: {list(self.properties.keys()) if self.properties else 'None'}")
                if self.properties and 'layers_json_fallback' in self.properties:
                    fallback_data = self.properties['layers_json_fallback']
                    print(f"  - Fallback data length: {len(fallback_data) if fallback_data else 0}")
            else:
                print(f"  - Node has no properties attribute")
                
            # Debug all available attributes
            print(f"🔍 Node attributes:")
            node_attrs = [attr for attr in dir(self) if not attr.startswith('_')]
            print(f"  - Available attributes: {node_attrs}")
            
            # Check if there are any other data storage mechanisms
            if hasattr(self, 'inputs_cache'):
                print(f"  - inputs_cache: {self.inputs_cache}")
            if hasattr(self, 'data'):
                print(f"  - data: {self.data}")
            if hasattr(self, 'inputs'):
                print(f"  - inputs: {self.inputs}")
            if hasattr(self, 'outputs'):
                print(f"  - outputs: {self.outputs}")
            
            # Parse annotation data using INPUT CONNECTION (no more widget fallbacks needed!)
            print(f"\n🚀 Using INPUT CONNECTION - Direct annotation data access:")
            
            if annotation_data and annotation_data.strip():
                print(f"✅ Got annotation data from INPUT CONNECTION (length: {len(annotation_data)})")
                print(f"🔍 First 500 chars: {annotation_data[:500]}...")
                print(f"🔍 Last 200 chars: {annotation_data[-200:]}...")
                try:
                    parsed_data = json.loads(annotation_data)
                    print(f"✅ Successfully parsed JSON")
                    
                    # Check if the data has an "annotations" key (new format)
                    if isinstance(parsed_data, dict) and "annotations" in parsed_data:
                        layers_data = parsed_data["annotations"]
                        print(f"🔍 Using annotations array from parsed data, got {len(layers_data)} layers")
                    elif isinstance(parsed_data, list):
                        layers_data = parsed_data
                        print(f"🔍 Using direct array format, got {len(layers_data)} layers")
                    else:
                        print(f"⚠️ Unexpected data format: {type(parsed_data)}, keys: {list(parsed_data.keys()) if isinstance(parsed_data, dict) else 'N/A'}")
                        layers_data = []
                    
                    # ENHANCED DEBUGGING: Print full structure of first layer
                    if layers_data and len(layers_data) > 0:
                        print(f"🔍 DETAILED FIRST LAYER ANALYSIS:")
                        first_layer = layers_data[0]
                        print(f"  - Complete first layer: {json.dumps(first_layer, indent=2)}")
                        print(f"  - Available keys: {list(first_layer.keys())}")
                        print(f"  - Layer type: {first_layer.get('type', 'N/A')}")
                        print(f"  - Has coordinates: start={('start' in first_layer)}, end={('end' in first_layer)}, points={('points' in first_layer)}")
                        print(f"  - Has geometry: {('geometry' in first_layer)}")
                        
                        if 'start' in first_layer and 'end' in first_layer:
                            print(f"  - Start coordinates: {first_layer['start']}")
                            print(f"  - End coordinates: {first_layer['end']}")
                        if 'geometry' in first_layer:
                            print(f"  - Geometry data: {first_layer['geometry']}")
                        if 'points' in first_layer:
                            print(f"  - Points count: {len(first_layer['points'])}")
                            print(f"  - First few points: {first_layer['points'][:3] if len(first_layer['points']) > 0 else 'None'}")
                            
                except json.JSONDecodeError as e:
                    print(f"❌ JSON parsing failed: {e}")
                    print(f"🔍 Raw annotation_data content: {repr(annotation_data)}")
                    layers_data = []
            else:
                print(f"ℹ️ No annotation data provided, using empty list")
                layers_data = []
            
            # Detailed validation of each layer's data structure (if we have data)
            if layers_data:
                valid_layers = 0
                for i, layer in enumerate(layers_data):
                    layer_info = {
                        'index': i,
                        'id': layer.get('id', 'N/A'),
                        'type': layer.get('type', 'N/A'),
                        'color': layer.get('color', 'N/A'),
                        'has_start': 'start' in layer,
                        'has_end': 'end' in layer,
                        'has_points': 'points' in layer
                    }
                    print(f"  📝 Layer {i}: {layer_info}")
                    
                    # Validate data integrity
                    layer_type = layer.get('type', '')
                    is_valid = False
                    
                    if layer_type in ['rectangle', 'circle', 'arrow']:
                        if 'start' in layer and 'end' in layer:
                            start = layer['start']
                            end = layer['end']
                            if isinstance(start, dict) and isinstance(end, dict) and 'x' in start and 'y' in start and 'x' in end and 'y' in end:
                                is_valid = True
                                print(f"    ✅ {layer_type} data valid: start({start['x']:.1f},{start['y']:.1f}) -> end({end['x']:.1f},{end['y']:.1f})")
                            else:
                                print(f"    ❌ {layer_type} coordinate data format error: start={start}, end={end}")
                        else:
                            print(f"    ❌ {layer_type} missing start or end coordinates")
                    elif layer_type == 'freehand':
                        if 'points' in layer and isinstance(layer['points'], list) and len(layer['points']) >= 3:
                            points = layer['points']
                            if all(isinstance(p, dict) and 'x' in p and 'y' in p for p in points):
                                is_valid = True
                                print(f"    ✅ freehand data valid: {len(points)} points")
                            else:
                                print(f"    ❌ freehand point data format error")
                        else:
                            print(f"    ❌ freehand missing points or insufficient points")
                    else:
                        print(f"    ❌ Unknown layer type: {layer_type}")
                    
                    if is_valid:
                        valid_layers += 1
                
                print(f"📊 Data validation result: {valid_layers}/{len(layers_data)} layers have valid data")
            
            # 创建编辑器数据
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
                print("🔗 CLIP model connected, using real CLIP encoding")
                conditioning_positive, conditioning_negative = self._create_flux_conditioning(
                    clip, prompts, negative_prompt, guidance, weight_clip_l, weight_t5xxl
                )
            else:
                print("⚠️ No CLIP model connected, using text-only output")
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
                print(f"🎨 Preparing to render {len(layers_data)} annotations on image")
                print(f"🖼️ Original image info: shape={image.shape}, dtype={image.dtype}")
                
                # CRITICAL DEBUGGING: Trace coordinate systems
                print(f"🔍 COORDINATE SYSTEM ANALYSIS:")
                print(f"  - SVG viewBox assumption: 1000x1000 (frontend coordinate system)")
                print(f"  - Image tensor shape: {image.shape}")
                if len(image.shape) == 4:
                    actual_height, actual_width = image.shape[1], image.shape[2]
                elif len(image.shape) == 3:
                    actual_height, actual_width = image.shape[0], image.shape[1]
                else:
                    actual_height, actual_width = image.shape[-2], image.shape[-1]
                print(f"  - Actual image dimensions: {actual_width}x{actual_height}")
                print(f"  - Coordinate conversion ratio: SVG→Image = 1000→{actual_width}x{actual_height}")
                
                output_image = self._render_annotations_on_image(image, layers_data)
                print(f"🎨 Annotation rendering complete, output image: shape={output_image.shape}, dtype={output_image.dtype}")
            else:
                print("ℹ️ No layer data, returning original image")
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
                class_name = layer.get("class_name", "object")
                confidence = layer.get("confidence", 0.5)
                area = layer.get("area", 0)
                
                selected_objects.append(class_name)
                object_details.append({
                    "name": class_name,
                    "confidence": confidence,
                    "area": area,
                    "geometry": layer.get("geometry", {})
                })
        
        # Advanced prompt templates
        templates = {
            "object_edit": {
                "positive": f"professional photo editing of {', '.join(selected_objects)}, high quality, detailed, masterpiece, 8k resolution",
                "negative": "blurry, low quality, distorted, artifacts, watermark, text",
                "clip_l": f"edit {', '.join(selected_objects)}",
                "t5xxl": f"Professional high-quality editing of {', '.join(selected_objects)} while maintaining original composition and lighting. Enhance details and clarity without changing the overall scene structure."
            },
            "style_transfer": {
                "positive": f"artistic style transfer applied to {', '.join(selected_objects)}, maintaining composition, professional artwork, high quality",
                "negative": "lose original structure, distorted proportions, bad anatomy",
                "clip_l": f"artistic {', '.join(selected_objects)}",
                "t5xxl": f"Apply sophisticated artistic style to {', '.join(selected_objects)} while preserving their original form, position, and proportions. The style should enhance the visual appeal without compromising the structural integrity of the subjects."
            },
            "background_replace": {
                "positive": f"replace background while keeping {', '.join(selected_objects)} in exact same position and pose, realistic lighting, seamless integration",
                "negative": "change subject position, alter object properties, floating objects, inconsistent lighting",
                "clip_l": f"background change, keep {', '.join(selected_objects)}",
                "t5xxl": f"Replace the background environment while maintaining {', '.join(selected_objects)} in their exact current positions and poses. Ensure realistic lighting and shadows that integrate the subjects naturally with the new background."
            },
            "character_consistency": {
                "positive": f"maintain character consistency for {', '.join(selected_objects)}, same facial features, same clothing, same style, character reference sheet",
                "negative": "different appearance, changed facial features, inconsistent style, different clothing",
                "clip_l": f"consistent {', '.join(selected_objects)}",
                "t5xxl": f"Maintain perfect character consistency for {', '.join(selected_objects)}, preserving all facial features, clothing details, and distinctive characteristics. Ensure the character(s) remain recognizable and consistent with their established appearance."
            },
            "lighting_enhancement": {
                "positive": f"enhance lighting and shadows for {', '.join(selected_objects)}, dramatic lighting, professional photography, realistic shadows",
                "negative": "flat lighting, unrealistic shadows, overexposed, underexposed",
                "clip_l": f"enhanced lighting {', '.join(selected_objects)}",
                "t5xxl": f"Enhance the lighting and shadow effects for {', '.join(selected_objects)} with professional photography techniques. Create dramatic yet natural lighting that highlights the subjects' features and adds depth to the scene."
            },
            "remove_object": {
                "positive": f"seamlessly remove {', '.join(selected_objects)} from scene, natural background extension, no traces left",
                "negative": "visible removal artifacts, unnatural transitions, incomplete removal",
                "clip_l": f"remove {', '.join(selected_objects)}",
                "t5xxl": f"Completely and seamlessly remove {', '.join(selected_objects)} from the image, intelligently filling the space with appropriate background content that matches the surrounding environment naturally."
            },
            "add_object": {
                "positive": f"add new objects similar to {', '.join(selected_objects)}, realistic integration, proper lighting and shadows",
                "negative": "floating objects, inconsistent lighting, unrealistic placement",
                "clip_l": f"add objects like {', '.join(selected_objects)}",
                "t5xxl": f"Add new objects or elements that complement the existing {', '.join(selected_objects)}, ensuring they integrate naturally with proper lighting, shadows, and perspective that matches the scene."
            },
            "custom": {
                "positive": f"high quality image editing of {', '.join(selected_objects)}, professional result",
                "negative": "low quality, artifacts, distortion",
                "clip_l": f"edit {', '.join(selected_objects)}",
                "t5xxl": f"Apply custom editing techniques to {', '.join(selected_objects)} according to specific requirements while maintaining professional quality and realistic results."
            }
        }
        
        # Get template or use default
        template_data = templates.get(template, templates["object_edit"])
        
        # If no objects selected, use generic prompts
        if not selected_objects:
            template_data = {
                "positive": "high quality image editing, professional photo enhancement, masterpiece",
                "negative": "blurry, low quality, distorted, artifacts",
                "clip_l": "image editing",
                "t5xxl": "Professional high-quality image editing and enhancement"
            }
        
        # Incorporate user text prompt if provided
        if text_prompt and text_prompt.strip():
            # Enhance prompts with user text
            template_data["positive"] = f"{template_data['positive']}, {text_prompt.strip()}"
            template_data["t5xxl"] = f"{template_data['t5xxl']} User instruction: {text_prompt.strip()}"
        
        return template_data
    
    def _render_annotations_on_image(self, image: torch.Tensor, layers_data: List[Dict]) -> torch.Tensor:
        """Render annotations on image"""
        try:
            from PIL import Image, ImageDraw
            
            print(f"🎨 Starting annotation rendering: {len(layers_data)} layers")
            
            # Convert torch tensor to PIL Image
            if len(image.shape) == 4:
                # Batch dimension exists, take first
                img_array = image[0].cpu().numpy()
                print(f"📐 Remove batch dimension: {image.shape} -> {img_array.shape}")
            else:
                img_array = image.cpu().numpy()
                print(f"📐 Image array shape: {img_array.shape}")
            
            # Ensure value range is [0, 1]
            if img_array.max() <= 1.0:
                img_array = (img_array * 255).astype(np.uint8)
                print(f"🔢 Value range conversion: [0,1] -> [0,255]")
            else:
                img_array = img_array.astype(np.uint8)
                print(f"🔢 Value range maintained: [0,255]")
                
            # Convert to PIL Image
            if len(img_array.shape) == 3:
                pil_image = Image.fromarray(img_array, 'RGB')
                print(f"🖼️ Created RGB image: {pil_image.size}")
            else:
                pil_image = Image.fromarray(img_array, 'L')
                pil_image = pil_image.convert('RGB')
                print(f"🖼️ Grayscale to RGB image: {pil_image.size}")
            
            # Create drawing object
            draw = ImageDraw.Draw(pil_image, 'RGBA')
            print(f"🖌️ Created drawing object")
            
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
                print(f"🖌️ Processing layer {i}: {layer.get('id', 'N/A')}")
                
                color_hex = layer.get('color', '#f44336')
                color_rgba = color_map.get(color_hex, (255, 0, 0, 128))
                layer_type = layer.get('type', 'rectangle')
                
                print(f"  - Color: {color_hex} -> {color_rgba}")
                print(f"  - Type: {layer_type}")
                print(f"  - Full layer data: {json.dumps(layer, indent=2)}")
                
                # CRITICAL: Check if coordinates exist and are valid
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
                                print(f"  ✅ Valid {layer_type} coordinates (start/end format): start={start}, end={end}")
                            else:
                                print(f"  ❌ Missing x/y in start/end coordinates: start={start}, end={end}")
                        else:
                            print(f"  ❌ Start/end coordinates not dict: start={type(start)}, end={type(end)}")
                    
                    # Format 2: Geometry coordinates [x1, y1, x2, y2]
                    elif 'geometry' in layer and 'coordinates' in layer['geometry']:
                        coords = layer['geometry']['coordinates']
                        if isinstance(coords, list) and len(coords) >= 4:
                            x1, y1, x2, y2 = coords[:4]
                            start_point = {'x': x1, 'y': y1}
                            end_point = {'x': x2, 'y': y2}
                            has_coordinates = True
                            print(f"  ✅ Valid {layer_type} coordinates (geometry format): coords={coords}")
                        else:
                            print(f"  ❌ Invalid geometry coordinates: {coords}")
                    else:
                        print(f"  ❌ Missing both start/end and geometry coordinates")
                        
                elif layer_type == 'freehand' or layer_type == 'polygon':
                    if 'points' in layer and isinstance(layer['points'], list):
                        points = layer['points']
                        if len(points) >= 3 and all(isinstance(p, dict) and 'x' in p and 'y' in p for p in points):
                            has_coordinates = True
                            print(f"  ✅ Valid freehand coordinates: {len(points)} points")
                        else:
                            print(f"  ❌ Invalid freehand points: count={len(points)}, valid={[isinstance(p, dict) and 'x' in p and 'y' in p for p in points[:3]]}")
                    else:
                        print(f"  ❌ Missing or invalid points array")
                
                if not has_coordinates:
                    print(f"  ⚠️ SKIPPING layer {i} due to invalid coordinates")
                    continue
                
                if layer_type == 'rectangle' and start_point and end_point:
                    # Rectangle annotation
                    print(f"  - Original coordinates: start={start_point}, end={end_point}")
                    
                    # Convert SVG coordinates to image coordinates (assuming SVG viewBox is 1000x1000)
                    x1 = int((start_point['x'] / 1000.0) * img_width)
                    y1 = int((start_point['y'] / 1000.0) * img_height)
                    x2 = int((end_point['x'] / 1000.0) * img_width)
                    y2 = int((end_point['y'] / 1000.0) * img_height)
                    
                    # Ensure correct coordinate order
                    x1, x2 = min(x1, x2), max(x1, x2)
                    y1, y2 = min(y1, y2), max(y1, y2)
                    
                    print(f"  - Converted coordinates: ({x1},{y1}) -> ({x2},{y2})")
                    print(f"  - Rectangle size: {x2-x1}x{y2-y1}")
                    
                    draw.rectangle([x1, y1, x2, y2], fill=color_rgba)
                    rendered_count += 1
                    print(f"  ✅ Rectangle annotation rendered")
                    
                elif layer_type == 'circle' and start_point and end_point:
                    # Ellipse annotation
                    print(f"  - Original coordinates: start={start_point}, end={end_point}")
                    
                    x1 = int((start_point['x'] / 1000.0) * img_width)
                    y1 = int((start_point['y'] / 1000.0) * img_height)
                    x2 = int((end_point['x'] / 1000.0) * img_width)
                    y2 = int((end_point['y'] / 1000.0) * img_height)
                    
                    # Ensure correct coordinate order
                    x1, x2 = min(x1, x2), max(x1, x2)
                    y1, y2 = min(y1, y2), max(y1, y2)
                    
                    print(f"  - Converted coordinates: ({x1},{y1}) -> ({x2},{y2})")
                    print(f"  - Ellipse size: {x2-x1}x{y2-y1}")
                    
                    draw.ellipse([x1, y1, x2, y2], fill=color_rgba)
                    rendered_count += 1
                    print(f"  ✅ Ellipse annotation rendered")
                    
                elif layer_type == 'freehand' and 'points' in layer:
                    # Polygon annotation
                    points = layer['points']
                    print(f"  - Original point count: {len(points)}")
                    
                    if len(points) >= 3:
                        polygon_points = []
                        for point in points:
                            x = int((point['x'] / 1000.0) * img_width)
                            y = int((point['y'] / 1000.0) * img_height)
                            polygon_points.append((x, y))
                        
                        print(f"  - Converted point count: {len(polygon_points)}")
                        print(f"  - Polygon bounds: x=[{min(p[0] for p in polygon_points)}-{max(p[0] for p in polygon_points)}], y=[{min(p[1] for p in polygon_points)}-{max(p[1] for p in polygon_points)}]")
                        
                        draw.polygon(polygon_points, fill=color_rgba)
                        rendered_count += 1
                        print(f"  ✅ Polygon annotation rendered")
                    else:
                        print(f"  ⚠️ Insufficient polygon points: {len(points)} < 3")
                        
                elif layer_type == 'arrow' and start_point and end_point:
                    # Arrow annotation
                    print(f"  - Original coordinates: start={start_point}, end={end_point}")
                    
                    # Convert SVG coordinates to image coordinates
                    x1 = int((start_point['x'] / 1000.0) * img_width)
                    y1 = int((start_point['y'] / 1000.0) * img_height)
                    x2 = int((end_point['x'] / 1000.0) * img_width)
                    y2 = int((end_point['y'] / 1000.0) * img_height)
                    
                    print(f"  - Converted coordinates: ({x1},{y1}) -> ({x2},{y2})")
                    
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
                    print(f"  ✅ Arrow annotation rendered: line length={math.sqrt(dx*dx + dy*dy):.1f}px, angle={math.degrees(line_angle):.1f}°")
                    
                else:
                    print(f"  ⚠️ Unknown annotation type or missing required data: type={layer_type}, has_start={'start' in layer}, has_end={'end' in layer}, has_points={'points' in layer}")
            
            print(f"🎨 Annotation rendering summary: {rendered_count}/{len(layers_data)} annotations successfully rendered")
            
            # Convert back to torch tensor
            output_array = np.array(pil_image)
            output_tensor = torch.from_numpy(output_array).float() / 255.0
            
            # Ensure correct dimensions
            if len(image.shape) == 4:
                output_tensor = output_tensor.unsqueeze(0)
            
            return output_tensor
            
        except Exception as e:
            print(f"Warning: Failed to render annotations on image: {e}")
            return image  # 如果渲染失败，返回原图像
    
    def _create_flux_conditioning(self, clip, prompts: Dict[str, str], negative_prompt: str = "", 
                                 guidance: float = 3.5, weight_clip_l: float = 1.0, weight_t5xxl: float = 1.0):
        """Create Flux-compatible conditioning using real CLIP encoding"""
        try:
            print(f"🔧 Creating Flux conditioning with CLIP model: {type(clip)}")
            
            # Prepare positive prompts
            positive_clip_l = prompts.get("clip_l", prompts.get("positive", ""))
            positive_t5xxl = prompts.get("t5xxl", prompts.get("positive", ""))
            
            # Prepare negative prompts
            negative_clip_l = negative_prompt if negative_prompt else "low quality, blurry, artifacts"
            negative_t5xxl = negative_prompt if negative_prompt else "low quality, blurry, distorted, artifacts, watermark"
            
            print(f"📝 Positive CLIP-L: {positive_clip_l}")
            print(f"📝 Positive T5-XXL: {positive_t5xxl}")
            print(f"📝 Negative: {negative_clip_l}")
            
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
            
            print(f"✅ Flux conditioning created successfully")
            return conditioning_positive, conditioning_negative
            
        except Exception as e:
            print(f"❌ Flux conditioning creation failed: {e}")
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

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS"]