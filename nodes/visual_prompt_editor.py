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
            }
        }
    
    RETURN_TYPES = ("IMAGE", "STRING")
    RETURN_NAMES = (
        "processed_image", 
        "structured_prompt"
    )
    FUNCTION = "visual_prompt_edit"
    CATEGORY = "kontext/core"
    DESCRIPTION = "Unified visual annotation editor with structured prompt generation. layers_json is optional - can work standalone or with pre-detected layers."
    
    def visual_prompt_edit(self, image: torch.Tensor, annotation_data: str = None,
                          text_prompt: str = "", prompt_template: str = "object_edit"):
        """Unified visual prompt editing functionality"""
        
        try:
            # Process annotation data
            layers_data = []
            include_annotation_numbers = True  # Default to including numbers
            
            if annotation_data and annotation_data.strip():
                try:
                    parsed_data = json.loads(annotation_data)
                    
                    # Check if the data has an "annotations" key (new format)
                    if isinstance(parsed_data, dict):
                        if "annotations" in parsed_data:
                            layers_data = parsed_data["annotations"]
                        elif "layers_data" in parsed_data:  # Alternative key
                            layers_data = parsed_data["layers_data"]
                        else:
                            layers_data = []
                        
                        # Extract include_annotation_numbers setting
                        include_annotation_numbers = parsed_data.get("include_annotation_numbers", True)
                        
                    elif isinstance(parsed_data, list):
                        layers_data = parsed_data
                    else:
                        layers_data = []
                            
                except json.JSONDecodeError as e:
                    print(f"Warning: JSON parsing failed: {e}")
                    layers_data = []
            
            # Generate default selection (first 3 objects)
            selected_ids = [layer.get("id", f"layer_{i}") 
                          for i, layer in enumerate(layers_data[:3])]
            
            # Generate structured prompt output
            structured_prompt = self._generate_structured_prompt(
                layers_data, selected_ids, prompt_template, text_prompt, include_annotation_numbers
            )
            
            # If there's layer data, render annotations on image
            if layers_data and len(layers_data) > 0:
                output_image = self._render_annotations_on_image(image, layers_data, include_annotation_numbers)
            else:
                output_image = image
            
            return (
                output_image,  # Image with annotations
                structured_prompt,  # Structured prompt string
            )
            
        except Exception as e:
            return self._create_fallback_output(image, str(e))
    
    
    def _generate_structured_prompt(self, layers_data: List[Dict], 
                                   selected_ids: List[str], 
                                   template: str, text_prompt: str = "", 
                                   include_annotation_numbers: bool = True) -> str:
        """Generate structured prompt string using the same templates as frontend"""
        
        # 1. Object (对象) - 明确指定要编辑的区域或对象
        selected_objects = []
        
        for layer in layers_data:
            if layer.get("id") in selected_ids:
                layer_type = layer.get("type", "object")
                color = layer.get("color", "#f44336")
                
                # Color mapping for structured description
                color_map = {
                    '#f44336': 'red',
                    '#4caf50': 'green', 
                    '#ffeb3b': 'yellow',
                    '#2196f3': 'blue'
                }
                
                # Shape mapping for structured description
                shape_map = {
                    'rectangle': 'rectangular',
                    'circle': 'circular',
                    'arrow': 'arrow-marked',
                    'freehand': 'outlined'
                }
                
                color_name = color_map.get(color, 'marked')
                shape_name = shape_map.get(layer_type, 'marked')
                number = layer.get("number", len(selected_objects) + 1)
                
                # Build structured object description
                if include_annotation_numbers:
                    object_desc = f"the {color_name} {shape_name} marked area (annotation {number})"
                else:
                    object_desc = f"the {color_name} {shape_name} marked area"
                selected_objects.append(object_desc)
        
        # Format objects list for structured prompt
        if selected_objects:
            if len(selected_objects) == 1:
                objects_str = selected_objects[0]
            elif len(selected_objects) == 2:
                objects_str = f"{selected_objects[0]} and {selected_objects[1]}"
            else:
                objects_str = f"{', '.join(selected_objects[:-1])}, and {selected_objects[-1]}"
        else:
            objects_str = "the selected marked areas"
        
        # 2. Use the same template system as frontend
        operation_templates = {
            'change_color': lambda target: f"Change the color of {{object}} to {target or 'red'}",
            'change_style': lambda target: f"Transform {{object}} to {target or 'cartoon style'}",
            'replace_object': lambda target: f"Replace {{object}} with {target or 'a different object'}",
            'add_object': lambda target: f"Add {target or 'a new object'} near {{object}}",
            'remove_object': lambda target: "Remove {object} from the image",
            'change_texture': lambda target: f"Change the texture of {{object}} to {target or 'smooth texture'}",
            'change_pose': lambda target: f"Change the pose of {{object}} to {target or 'a different pose'}",
            'change_expression': lambda target: f"Change the facial expression of {{object}} to {target or 'happy expression'}",
            'change_clothing': lambda target: f"Change the clothing of {{object}} to {target or 'different outfit'}",
            'change_background': lambda target: f"Change the background to {target or 'a new environment'}",
            'enhance_quality': lambda target: "Enhance the quality of {object}",
            'custom': lambda target: target or "Apply custom modification to the selected region"
        }
        
        # Map old template names to new ones for backward compatibility
        template_mapping = {
            "object_edit": "change_color",
            "style_transfer": "change_style", 
            "background_replace": "change_background",
            "character_consistency": "change_pose",
            "lighting_enhancement": "enhance_quality",
            "remove_object": "remove_object",
            "add_object": "add_object",
            "custom": "custom"
        }
        
        # Get the mapped template
        mapped_template = template_mapping.get(template, "custom")
        
        # Get template function
        template_func = operation_templates.get(mapped_template, operation_templates['custom'])
        
        # Generate prompt using template
        target_text = text_prompt.strip() if text_prompt.strip() else None
        structured_prompt = template_func(target_text)
        
        # Replace {object} placeholder with actual object description
        structured_prompt = structured_prompt.replace('{object}', objects_str)
        
        return structured_prompt
    
    def _render_annotations_on_image(self, image: torch.Tensor, layers_data: List[Dict], include_annotation_numbers: bool = True) -> torch.Tensor:
        """Render annotations on image"""
        try:
            from PIL import Image, ImageDraw, ImageFont
            
            # Helper function to draw annotation numbers
            def draw_annotation_number(draw, position, number, color_rgba, scale_x=1.0, scale_y=1.0):
                """Draw annotation number label at specified position"""
                if not include_annotation_numbers:
                    return
                    
                try:
                    # Calculate font size based on image size
                    font_size = max(12, int(min(img_width, img_height) * 0.03))
                    
                    # Try to use a nice font, fallback to default
                    try:
                        font = ImageFont.truetype("arial.ttf", font_size)
                    except:
                        try:
                            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
                        except:
                            try:
                                font = ImageFont.load_default()
                            except:
                                font = None
                    
                    # Position for number label
                    x = int(position['x'] * scale_x)
                    y = int(position['y'] * scale_y)
                    
                    # Text styling
                    text = str(number)
                    
                    # Get text bounding box
                    if font:
                        bbox = draw.textbbox((0, 0), text, font=font)
                        text_width = bbox[2] - bbox[0]
                        text_height = bbox[3] - bbox[1]
                    else:
                        # Fallback dimensions
                        text_width = len(text) * 8
                        text_height = 12
                    
                    # Background circle for number
                    circle_radius = max(text_width, text_height) // 2 + 4
                    circle_center = (x, y)
                    
                    # Draw background circle
                    circle_color = (color_rgba[0], color_rgba[1], color_rgba[2], 200)  # More opaque background
                    draw.ellipse([
                        circle_center[0] - circle_radius,
                        circle_center[1] - circle_radius,
                        circle_center[0] + circle_radius,
                        circle_center[1] + circle_radius
                    ], fill=circle_color)
                    
                    # Draw white border
                    draw.ellipse([
                        circle_center[0] - circle_radius,
                        circle_center[1] - circle_radius,
                        circle_center[0] + circle_radius,
                        circle_center[1] + circle_radius
                    ], outline=(255, 255, 255, 255), width=2)
                    
                    # Draw text
                    text_x = circle_center[0] - text_width // 2
                    text_y = circle_center[1] - text_height // 2
                    
                    if font:
                        draw.text((text_x, text_y), text, fill=(255, 255, 255, 255), font=font)
                    else:
                        draw.text((text_x, text_y), text, fill=(255, 255, 255, 255))
                    
                except Exception as e:
                    print(f"Warning: Failed to draw annotation number {number}: {e}")
            
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
            
            # 前端SVG现在使用图像实际尺寸作为viewBox，所以坐标转换比例是1:1
            print(f"🖼️ 后端图像渲染 - 图像尺寸: {img_width}x{img_height}")
            
            # 定义填充样式应用函数
            def apply_fill_style(draw, coords, color_rgba, fill_mode, shape_type):
                """根据填充模式绘制形状"""
                if fill_mode == 'outline':
                    # 空心样式 - 只绘制边框
                    if shape_type == 'rectangle':
                        x1, y1, x2, y2 = coords
                        outline_color = (color_rgba[0], color_rgba[1], color_rgba[2], 255)  # 不透明边框
                        draw.rectangle([x1, y1, x2, y2], outline=outline_color, width=3)
                    elif shape_type == 'ellipse':
                        x1, y1, x2, y2 = coords  
                        outline_color = (color_rgba[0], color_rgba[1], color_rgba[2], 255)  # 不透明边框
                        draw.ellipse([x1, y1, x2, y2], outline=outline_color, width=3)
                    elif shape_type == 'polygon':
                        outline_color = (color_rgba[0], color_rgba[1], color_rgba[2], 255)  # 不透明边框
                        draw.polygon(coords, outline=outline_color, width=3)
                else:
                    # 实心样式 - 填充 (默认)
                    if shape_type == 'rectangle':
                        x1, y1, x2, y2 = coords
                        draw.rectangle([x1, y1, x2, y2], fill=color_rgba)
                    elif shape_type == 'ellipse':
                        x1, y1, x2, y2 = coords
                        draw.ellipse([x1, y1, x2, y2], fill=color_rgba)
                    elif shape_type == 'polygon':
                        draw.polygon(coords, fill=color_rgba)
            
            # 检查是否所有标注都使用相同的坐标基准
            # 如果坐标值都在图像尺寸范围内，则直接使用；否则进行比例转换
            def detect_coordinate_scale(layers_data, img_width, img_height):
                """检测坐标是否需要缩放转换"""
                max_x = max_y = 0
                coord_count = 0
                
                for layer in layers_data:
                    if 'start' in layer and 'end' in layer:
                        start, end = layer['start'], layer['end']
                        if isinstance(start, dict) and isinstance(end, dict):
                            max_x = max(max_x, abs(start.get('x', 0)), abs(end.get('x', 0)))
                            max_y = max(max_y, abs(start.get('y', 0)), abs(end.get('y', 0)))
                            coord_count += 1
                    elif 'geometry' in layer and 'coordinates' in layer['geometry']:
                        coords = layer['geometry']['coordinates']
                        if isinstance(coords, list) and len(coords) >= 4:
                            max_x = max(max_x, abs(coords[0]), abs(coords[2]))
                            max_y = max(max_y, abs(coords[1]), abs(coords[3]))
                            coord_count += 1
                            
                if coord_count == 0:
                    return 1.0, 1.0  # 没有坐标数据，使用1:1
                    
                # 如果最大坐标值明显超出图像尺寸，说明使用的是比例坐标
                scale_x = img_width / max_x if max_x > img_width * 1.5 else 1.0
                scale_y = img_height / max_y if max_y > img_height * 1.5 else 1.0
                
                print(f"🔍 坐标缩放检测 - 最大坐标: ({max_x}, {max_y}), 缩放比例: ({scale_x:.3f}, {scale_y:.3f})")
                return scale_x, scale_y
            
            # 检测坐标缩放比例
            scale_x, scale_y = detect_coordinate_scale(layers_data, img_width, img_height)
            
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
                fill_mode = layer.get('fillMode', 'filled')  # 获取填充模式
                
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
                    # 使用动态检测的缩放比例进行坐标转换
                    x1 = int(start_point['x'] * scale_x)
                    y1 = int(start_point['y'] * scale_y)
                    x2 = int(end_point['x'] * scale_x)
                    y2 = int(end_point['y'] * scale_y)
                    
                    # Ensure correct coordinate order
                    x1, x2 = min(x1, x2), max(x1, x2)
                    y1, y2 = min(y1, y2), max(y1, y2)
                    
                    print(f"🔴 矩形标注 {i}: 原始坐标({start_point['x']:.1f},{start_point['y']:.1f})-({end_point['x']:.1f},{end_point['y']:.1f}) → 图像坐标({x1},{y1})-({x2},{y2}), 填充模式: {fill_mode}")
                    apply_fill_style(draw, (x1, y1, x2, y2), color_rgba, fill_mode, 'rectangle')
                    
                    # Draw annotation number at top-left corner
                    annotation_number = layer.get('number', i + 1)
                    draw_annotation_number(draw, start_point, annotation_number, color_rgba, scale_x, scale_y)
                    
                    rendered_count += 1
                    
                elif layer_type == 'circle' and start_point and end_point:
                    # Ellipse annotation
                    # 使用动态检测的缩放比例进行坐标转换
                    x1 = int(start_point['x'] * scale_x)
                    y1 = int(start_point['y'] * scale_y)
                    x2 = int(end_point['x'] * scale_x)
                    y2 = int(end_point['y'] * scale_y)
                    
                    # Ensure correct coordinate order
                    x1, x2 = min(x1, x2), max(x1, x2)
                    y1, y2 = min(y1, y2), max(y1, y2)
                    
                    print(f"🟡 椭圆标注 {i}: 原始坐标({start_point['x']:.1f},{start_point['y']:.1f})-({end_point['x']:.1f},{end_point['y']:.1f}) → 图像坐标({x1},{y1})-({x2},{y2}), 填充模式: {fill_mode}")
                    apply_fill_style(draw, (x1, y1, x2, y2), color_rgba, fill_mode, 'ellipse')
                    
                    # Draw annotation number at top-left corner
                    annotation_number = layer.get('number', i + 1)
                    draw_annotation_number(draw, start_point, annotation_number, color_rgba, scale_x, scale_y)
                    
                    rendered_count += 1
                    
                elif layer_type == 'freehand' and 'points' in layer:
                    # Polygon annotation
                    points = layer['points']
                    
                    if len(points) >= 3:
                        polygon_points = []
                        for point in points:
                            x = int(point['x'] * scale_x)
                            y = int(point['y'] * scale_y)
                            polygon_points.append((x, y))
                        
                        print(f"🔗 多边形标注 {i}: {len(points)}个点, 缩放比例({scale_x:.3f}, {scale_y:.3f}), 填充模式: {fill_mode}")
                        apply_fill_style(draw, polygon_points, color_rgba, fill_mode, 'polygon')
                        
                        # Draw annotation number at first point
                        annotation_number = layer.get('number', i + 1)
                        first_point = points[0]
                        draw_annotation_number(draw, first_point, annotation_number, color_rgba, scale_x, scale_y)
                        
                        rendered_count += 1
                        
                elif layer_type == 'arrow' and start_point and end_point:
                    # Arrow annotation
                    # 使用动态检测的缩放比例进行坐标转换
                    x1 = int(start_point['x'] * scale_x)
                    y1 = int(start_point['y'] * scale_y)
                    x2 = int(end_point['x'] * scale_x)
                    y2 = int(end_point['y'] * scale_y)
                    
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
                    
                    print(f"➡️ 箭头标注 {i}: 原始坐标({start_point['x']:.1f},{start_point['y']:.1f})-({end_point['x']:.1f},{end_point['y']:.1f}) → 图像坐标({x1},{y1})-({x2},{y2})")
                    
                    # Draw annotation number at start point
                    annotation_number = layer.get('number', i + 1)
                    draw_annotation_number(draw, start_point, annotation_number, color_rgba, scale_x, scale_y)
                    
                    rendered_count += 1
            
            numbers_status = "包含编号" if include_annotation_numbers else "不包含编号"
            print(f"✅ 后端标注渲染完成: 总共{len(layers_data)}个标注，成功渲染{rendered_count}个 ({numbers_status})")
            
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
    
    
    def _create_fallback_output(self, image: torch.Tensor, error_msg: str):
        """Create fallback output"""
        fallback_structured_prompt = "Edit the selected areas according to requirements"
        
        return (
            image,  # Image
            fallback_structured_prompt  # Structured prompt
        )

# Node registration
NODE_CLASS_MAPPINGS = {
    "VisualPromptEditor": VisualPromptEditor,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "VisualPromptEditor": "🎨 Visual Prompt Editor",
}