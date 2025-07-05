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
                    "change_color",
                    "change_style", 
                    "replace_object",
                    "add_object",
                    "remove_object",
                    "change_texture",
                    "change_pose",
                    "change_expression", 
                    "change_clothing",
                    "change_background",
                    "enhance_quality",
                    "custom"
                ], {"default": "change_color"}),
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
                    print(f"🔍 后端收到annotation_data长度: {len(annotation_data)} 字符")
                    
                    # Check if the data has an "annotations" key (new format)
                    if isinstance(parsed_data, dict):
                        if "annotations" in parsed_data:
                            layers_data = parsed_data["annotations"]
                            print(f"📊 后端解析到 {len(layers_data)} 个标注")
                            # 详细调试每个标注
                            for i, layer in enumerate(layers_data):
                                print(f"📍 标注{i+1}: 类型={layer.get('type')}, ID={layer.get('id')}")
                                if layer.get('type') == 'brush':
                                    print(f"🖌️ 画笔数据: points={len(layer.get('points', []))}, brushSize={layer.get('brushSize')}, brushFeather={layer.get('brushFeather')}")
                        elif "layers_data" in parsed_data:  # Alternative key
                            layers_data = parsed_data["layers_data"]
                        else:
                            layers_data = []
                            print("⚠️ 后端: 解析的数据中没有找到annotations或layers_data字段")
                        
                        # Extract include_annotation_numbers setting
                        include_annotation_numbers = parsed_data.get("include_annotation_numbers", True)
                        
                        # Extract synced operation type and text from frontend
                        synced_operation_type = parsed_data.get("operation_type")
                        synced_target_description = parsed_data.get("target_description")
                        
                        # Use synced values if available (frontend takes priority)
                        if synced_operation_type and synced_operation_type != "custom":
                            prompt_template = synced_operation_type
                            print(f"🔄 Using synced operation type from frontend: {synced_operation_type}")
                        
                        if synced_target_description:
                            text_prompt = synced_target_description
                            print(f"🔄 Using synced text prompt from frontend: {synced_target_description}")
                        
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
                color = layer.get("color", "#ff0000")
                
                # Color mapping for structured description
                color_map = {
                    '#ff0000': 'red',
                    '#00ff00': 'green', 
                    '#ffff00': 'yellow',
                    '#0000ff': 'blue'
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
        
        # 2. Use the same template system as frontend (exact match)
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
        
        # Get template function (direct match, no mapping needed)
        template_func = operation_templates.get(template, operation_templates['custom'])
        
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
            
            # Convert torch tensor to PIL Image first to get dimensions
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
            
            # Get image dimensions
            img_width, img_height = pil_image.size
            
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
            
            # Create drawing object
            draw = ImageDraw.Draw(pil_image, 'RGBA')
            
            # Color mapping (base RGB values, alpha will be calculated per annotation) - 标准纯色
            color_map = {
                '#ff0000': (255, 0, 0),      # Standard Red
                '#00ff00': (0, 255, 0),      # Standard Green  
                '#ffff00': (255, 255, 0),    # Standard Yellow
                '#0000ff': (0, 0, 255)       # Standard Blue
            }
            
            # 前端SVG现在使用图像实际尺寸作为viewBox，所以坐标转换比例是1:1
            print(f"🖼️ 后端图像渲染 - 图像尺寸: {img_width}x{img_height}")
            
            # 定义填充样式应用函数
            def apply_fill_style(draw, coords, color_rgb, fill_mode, shape_type, opacity=50):
                """根据填充模式和不透明度绘制形状"""
                # 计算不透明度值 (0-255)
                fill_alpha = int(opacity * 255 / 100)
                stroke_alpha = min(int((opacity + 30) * 255 / 100), 255)  # 边框稍微更不透明一些
                
                if fill_mode == 'outline':
                    # 空心样式 - 只绘制边框
                    outline_color = (color_rgb[0], color_rgb[1], color_rgb[2], stroke_alpha)
                    if shape_type == 'rectangle':
                        x1, y1, x2, y2 = coords
                        draw.rectangle([x1, y1, x2, y2], outline=outline_color, width=3)
                    elif shape_type == 'ellipse':
                        x1, y1, x2, y2 = coords  
                        draw.ellipse([x1, y1, x2, y2], outline=outline_color, width=3)
                    elif shape_type == 'polygon':
                        draw.polygon(coords, outline=outline_color, width=3)
                else:
                    # 实心样式 - 填充 (默认)
                    fill_color = (color_rgb[0], color_rgb[1], color_rgb[2], fill_alpha)
                    if shape_type == 'rectangle':
                        x1, y1, x2, y2 = coords
                        draw.rectangle([x1, y1, x2, y2], fill=fill_color)
                    elif shape_type == 'ellipse':
                        x1, y1, x2, y2 = coords
                        draw.ellipse([x1, y1, x2, y2], fill=fill_color)
                    elif shape_type == 'polygon':
                        draw.polygon(coords, fill=fill_color)
            
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
                color_hex = layer.get('color', '#ff0000')
                color_rgb = color_map.get(color_hex, (255, 0, 0))  # 获取RGB值
                layer_type = layer.get('type', 'rectangle')
                opacity = layer.get('opacity', 50)  # 获取不透明度，默认50%
                
                # 🔍 调试：输出每个标注的不透明度信息
                print(f"🎨 标注{i+1}渲染信息: 类型={layer_type}, 颜色={color_hex}, 不透明度={opacity}%")
                
                # Check if coordinates exist and are valid
                # Support multiple coordinate formats: 1) start/end, 2) geometry.coordinates
                has_coordinates = False
                start_point = None
                end_point = None
                fill_mode = layer.get('fillMode', 'filled')  # 获取填充模式
                
                print(f"🔍 标注{i+1} 坐标检查: type={layer_type}, 包含keys={list(layer.keys())}")
                
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
                            
                elif layer_type == 'brush':
                    # 画笔标注的坐标检查
                    if 'points' in layer and isinstance(layer['points'], list):
                        brush_points = layer['points']
                        print(f"🖌️ 画笔标注{i+1}: 找到points字段，长度={len(brush_points)}")
                        if len(brush_points) >= 1 and all(isinstance(p, dict) and 'x' in p and 'y' in p for p in brush_points):
                            has_coordinates = True
                            print(f"🖌️ 画笔标注{i+1}: 坐标验证通过")
                        else:
                            print(f"🖌️ 画笔标注{i+1}: 坐标验证失败")
                
                if not has_coordinates:
                    print(f"⚠️ 标注{i+1}: 没有有效坐标，跳过渲染")
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
                    
                    print(f"🔴 矩形标注 {i}: 原始坐标({start_point['x']:.1f},{start_point['y']:.1f})-({end_point['x']:.1f},{end_point['y']:.1f}) → 图像坐标({x1},{y1})-({x2},{y2}), 填充模式: {fill_mode}, 不透明度: {opacity}%")
                    print(f"🔴 矩形绘制前: draw对象={id(draw)}, 图像对象={id(pil_image)}, 图像模式={pil_image.mode}")
                    apply_fill_style(draw, (x1, y1, x2, y2), color_rgb, fill_mode, 'rectangle', opacity)
                    print(f"🔴 矩形绘制后: 完成矩形绘制")
                    
                    # Draw annotation number at top-left corner
                    annotation_number = layer.get('number', i + 1)
                    color_rgba = (*color_rgb, 255)  # 转换为RGBA格式给编号使用
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
                    
                    print(f"🟡 椭圆标注 {i}: 原始坐标({start_point['x']:.1f},{start_point['y']:.1f})-({end_point['x']:.1f},{end_point['y']:.1f}) → 图像坐标({x1},{y1})-({x2},{y2}), 填充模式: {fill_mode}, 不透明度: {opacity}%")
                    apply_fill_style(draw, (x1, y1, x2, y2), color_rgb, fill_mode, 'ellipse', opacity)
                    
                    # Draw annotation number at top-left corner
                    annotation_number = layer.get('number', i + 1)
                    color_rgba = (*color_rgb, 255)  # 转换为RGBA格式给编号使用
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
                        
                        print(f"🔗 多边形标注 {i}: {len(points)}个点, 缩放比例({scale_x:.3f}, {scale_y:.3f}), 填充模式: {fill_mode}, 不透明度: {opacity}%")
                        apply_fill_style(draw, polygon_points, color_rgb, fill_mode, 'polygon', opacity)
                        
                        # Draw annotation number at first point
                        annotation_number = layer.get('number', i + 1)
                        first_point = points[0]
                        color_rgba = (*color_rgb, 255)  # 转换为RGBA格式给编号使用
                        draw_annotation_number(draw, first_point, annotation_number, color_rgba, scale_x, scale_y)
                        
                        rendered_count += 1
                        
                elif layer_type == 'arrow' and start_point and end_point:
                    # Arrow annotation
                    # 使用动态检测的缩放比例进行坐标转换
                    x1 = int(start_point['x'] * scale_x)
                    y1 = int(start_point['y'] * scale_y)
                    x2 = int(end_point['x'] * scale_x)
                    y2 = int(end_point['y'] * scale_y)
                    
                    # Draw arrow line with opacity
                    arrow_alpha = int(opacity * 255 / 100)
                    line_color = (*color_rgb, arrow_alpha)
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
                    color_rgba = (*color_rgb, 255)  # 转换为RGBA格式给编号使用
                    draw_annotation_number(draw, start_point, annotation_number, color_rgba, scale_x, scale_y)
                    
                    rendered_count += 1
                    
                elif layer_type == 'brush' and 'points' in layer:
                    # Brush annotation with path data
                    points = layer.get('points', [])
                    path_data = layer.get('pathData', '')
                    
                    print(f"🖌️ 画笔标注 {i}: 开始处理，points类型={type(points)}, 长度={len(points) if points else 0}")
                    
                    if not points or len(points) == 0:
                        print(f"⚠️ 画笔标注 {i}: 没有路径点，跳过渲染")
                        continue
                    
                    # 检查points的第一个元素结构
                    if len(points) > 0:
                        print(f"🖌️ 画笔标注 {i}: 第一个点结构={points[0]}")
                    
                    # 验证所有点都有x,y坐标
                    valid_points = [p for p in points if isinstance(p, dict) and 'x' in p and 'y' in p]
                    print(f"🖌️ 画笔标注 {i}: 有效点数量={len(valid_points)}/{len(points)}")
                    
                    if len(valid_points) == 0:
                        print(f"⚠️ 画笔标注 {i}: 没有有效的坐标点，跳过渲染")
                        continue
                    
                    points = valid_points  # 使用验证过的点
                    
                    # 获取画笔参数
                    brush_size = layer.get('brushSize', 20)
                    brush_feather = layer.get('brushFeather', 5)
                    
                    # 绘制画笔路径
                    if brush_feather > 0:
                        # 带羽化的画笔路径
                        from PIL import ImageFilter
                        
                        # 创建临时图像用于绘制路径
                        temp_img = Image.new('RGBA', (img_width, img_height), (0, 0, 0, 0))
                        temp_draw = ImageDraw.Draw(temp_img)
                        
                        # 转换路径点并绘制
                        scaled_points = []
                        for point in points:
                            scaled_x = int(point['x'] * scale_x)
                            scaled_y = int(point['y'] * scale_y)
                            scaled_points.append((scaled_x, scaled_y))
                        
                        if len(scaled_points) >= 2:
                            # 绘制路径
                            stroke_width = int(brush_size * max(scale_x, scale_y))
                            stroke_alpha = int(opacity * 255 / 100)
                            stroke_color = (*color_rgb, stroke_alpha)
                            
                            print(f"🖌️ 画笔渲染 {i}: 羽化路径，width={stroke_width}, alpha={stroke_alpha}, color={stroke_color}")
                            
                            # 绘制线段连接各点
                            for j in range(len(scaled_points) - 1):
                                temp_draw.line([scaled_points[j], scaled_points[j + 1]], 
                                             fill=stroke_color, width=stroke_width)
                            
                            # 在每个点绘制圆形以形成连续路径
                            radius = stroke_width // 2
                            for point in scaled_points:
                                temp_draw.ellipse([
                                    point[0] - radius, point[1] - radius,
                                    point[0] + radius, point[1] + radius
                                ], fill=stroke_color)
                            
                            print(f"🖌️ 画笔渲染 {i}: 完成羽化绘制，准备合成")
                        
                        # 应用羽化效果
                        feather_pixels = int(brush_feather * max(scale_x, scale_y))
                        if feather_pixels > 0:
                            temp_img = temp_img.filter(ImageFilter.GaussianBlur(feather_pixels))
                        
                        # 将羽化后的图像合成到主图像
                        print(f"🖌️ 画笔合成: 主图像尺寸={pil_image.size}, 临时图像尺寸={temp_img.size}")
                        # 保持RGBA模式以便后续标注绘制
                        pil_image = Image.alpha_composite(pil_image.convert('RGBA'), temp_img)
                        # 重要：更新draw对象到新的合成图像
                        draw = ImageDraw.Draw(pil_image, 'RGBA')
                        print(f"🖌️ 画笔合成完成: {i}，新draw对象={id(draw)}, 新图像对象={id(pil_image)}, 图像模式={pil_image.mode}")
                    else:
                        # 无羽化的实心路径
                        scaled_points = []
                        for point in points:
                            scaled_x = int(point['x'] * scale_x)
                            scaled_y = int(point['y'] * scale_y)
                            scaled_points.append((scaled_x, scaled_y))
                        
                        if len(scaled_points) >= 2:
                            stroke_width = int(brush_size * max(scale_x, scale_y))
                            stroke_alpha = int(opacity * 255 / 100)
                            stroke_color = (*color_rgb, stroke_alpha)
                            
                            # 绘制路径
                            for j in range(len(scaled_points) - 1):
                                draw.line([scaled_points[j], scaled_points[j + 1]], 
                                         fill=stroke_color, width=stroke_width)
                            
                            # 在每个点绘制圆形以形成连续路径
                            radius = stroke_width // 2
                            for point in scaled_points:
                                draw.ellipse([
                                    point[0] - radius, point[1] - radius,
                                    point[0] + radius, point[1] + radius
                                ], fill=stroke_color)
                    
                    print(f"🖌️ 画笔路径 {i}: {len(points)}个点, 大小={brush_size}, 羽化={brush_feather}, 不透明度={opacity}%")
                    
                    # Draw annotation number at first point
                    if points:
                        annotation_number = layer.get('number', i + 1)
                        color_rgba = (*color_rgb, 255)
                        first_point = points[0]
                        draw_annotation_number(draw, first_point, annotation_number, color_rgba, scale_x, scale_y)
                    
                    rendered_count += 1
            
            numbers_status = "包含编号" if include_annotation_numbers else "不包含编号"
            print(f"✅ 后端标注渲染完成: 总共{len(layers_data)}个标注，成功渲染{rendered_count}个 ({numbers_status})")
            
            # 如果图像在RGBA模式，转换为RGB模式
            if pil_image.mode == 'RGBA':
                print(f"🔄 转换最终图像从RGBA到RGB模式")
                pil_image = pil_image.convert('RGB')
            
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