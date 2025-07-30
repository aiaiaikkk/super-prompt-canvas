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
from PIL import Image, ImageDraw, ImageFont

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
            },
            "optional": {
                "image": ("IMAGE",),
                "annotation_data": ("STRING", {"tooltip": "JSON annotation data from frontend editor"}),
                "canvas_width": ("INT", {"default": 800, "min": 200, "max": 2048, "step": 10, "tooltip": "Canvas width in pixels"}),
                "canvas_height": ("INT", {"default": 600, "min": 200, "max": 2048, "step": 10, "tooltip": "Canvas height in pixels"}),
            }
        }
    
    RETURN_TYPES = ("IMAGE", "STRING", "STRING", "STRING")
    RETURN_NAMES = (
        "processed_image", 
        "structured_prompt",
        "annotation_data",
        "model_instruction"
    )
    FUNCTION = "visual_prompt_edit"
    CATEGORY = "kontext_super_prompt/core"
    DESCRIPTION = "🎨 Kontext Super Prompt Visual Editor - Unified visual annotation editor with multimodal AI prompt generation capabilities"
    
    def visual_prompt_edit(self, image: torch.Tensor = None, annotation_data: str = None,
                          canvas_width: int = 800, canvas_height: int = 600):
        """Unified visual prompt editing functionality"""
        
        try:
            # Process annotation data and canvas image
            layers_data = []
            include_annotation_numbers = True  # Default to including numbers
            text_prompt = ""  # Initialize text_prompt from annotation data
            # Initialize enhanced prompts with defaults - 🔴 支持多选格式
            constraint_prompts = []
            decorative_prompts = []
            user_edited_prompt = ""  # 🔴 初始化用户编辑的提示词变量
            parsed_data = None  # 🔧 初始化parsed_data变量，确保作用域正确
            prompt_template = "change_color"  # Default operation type
            
            # 🎯 新增：画布图像数据
            canvas_image_data = None
            canvas_background_color = '#ffffff'
            fabric_json_data = None
            
            if annotation_data and annotation_data.strip():
                try:
                    parsed_data = json.loads(annotation_data)
                    print(f"🔍 Backend received annotation_data length: {len(annotation_data)} characters")
                    
                    # Check if the data has an "annotations" key (new format)
                    if isinstance(parsed_data, dict):
                        # 🎯 检查是否包含完整画布图像数据 (v3.1格式)
                        if "canvasImageDataURL" in parsed_data:
                            canvas_image_data = parsed_data["canvasImageDataURL"]
                            canvas_background_color = parsed_data.get("backgroundColor", "#ffffff")
                            fabric_json_data = parsed_data.get("fabricJSON")
                            print(f"🎨 Found complete canvas image data: background={canvas_background_color}, image size: {len(canvas_image_data) if canvas_image_data else 0} chars")
                            
                        if "annotations" in parsed_data:
                            layers_data = parsed_data["annotations"]
                            print(f"📊 Backend parsed {len(layers_data)} annotations")
                            # 详细调试每个标注
                            for i, layer in enumerate(layers_data):
                                print(f"📍 Annotation {i+1}: type={layer.get('type')}, ID={layer.get('id')}")
                                if layer.get('type') == 'brush':
                                    print(f"🖌️ Brush data: points={len(layer.get('points', []))}, brushSize={layer.get('brushSize')}, brushFeather={layer.get('brushFeather')}")
                        elif "layers_data" in parsed_data:  # Alternative key
                            layers_data = parsed_data["layers_data"]
                        else:
                            layers_data = []
                            print("⚠️ Backend: No annotations or layers_data field found in parsed data")
                        
                        # Extract include_annotation_numbers setting
                        include_annotation_numbers = parsed_data.get("include_annotation_numbers", True)
                        
                        # Extract synced operation type and text from frontend
                        synced_operation_type = parsed_data.get("operation_type")
                        synced_target_description = parsed_data.get("target_description")
                        
                        # Extract constraint and decorative prompts - 🔴 支持多选格式
                        constraint_prompts = parsed_data.get("constraint_prompts", []) or parsed_data.get("constraint_prompt", "")
                        decorative_prompts = parsed_data.get("decorative_prompts", []) or parsed_data.get("decorative_prompt", "")
                        print(f"🔒 Constraint prompts: {constraint_prompts}")
                        print(f"🎨 Decorative prompts: {decorative_prompts}")
                        
                        # Extract selected annotations with individual operation types
                        selected_annotations = parsed_data.get("selected_annotations", [])
                        print(f"📝 Selected annotations: {len(selected_annotations)} items, with individual operation types")
                        
                        # Extract user-edited positive_prompt - 🔴 新增：读取用户修改后的提示词
                        user_edited_prompt = parsed_data.get("positive_prompt", "")
                        if user_edited_prompt and user_edited_prompt.strip():
                            print(f"✅ Detected user-modified prompt: {user_edited_prompt[:50]}...")
                        else:
                            print("⚠️ No user-modified prompt detected, will use auto-generation")
                        
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
            
            # 🔴 优先使用用户修改后的提示词，否则生成新的
            if user_edited_prompt and user_edited_prompt.strip():
                # 用户已经修改了提示词，直接使用
                structured_prompt = user_edited_prompt.strip()
                print(f"✅ Using user-modified prompt: {structured_prompt[:100]}...")
            else:
                # 用户没有修改，使用自动生成
                enhanced_prompts = {
                    'constraint_prompts': constraint_prompts,
                    'decorative_prompts': decorative_prompts
                }
                    
                structured_prompt = self._generate_structured_prompt(
                    layers_data, selected_ids, prompt_template, text_prompt, include_annotation_numbers, enhanced_prompts, selected_annotations
                )
                print(f"🤖 Using auto-generated prompt: {structured_prompt[:100]}...")
            
            # 🎯 Process image - 优先使用完整画布图像
            if canvas_image_data:
                # 使用Fabric.js导出的完整画布图像
                print(f"✅ Using complete canvas image from Fabric.js (DataURL format)")
                output_image = self._process_canvas_image_data(canvas_image_data, canvas_width, canvas_height)
            elif image is None:
                # 创建默认的空白画布（如果没有输入图像）
                blank_image = torch.zeros((1, canvas_height, canvas_width, 3), dtype=torch.float32)
                if layers_data and len(layers_data) > 0:
                    output_image = self._render_annotations_on_image(blank_image, layers_data, include_annotation_numbers, parsed_data)
                else:
                    output_image = blank_image
            else:
                # 有输入图像的情况
                if layers_data and len(layers_data) > 0:
                    output_image = self._render_annotations_on_image(image, layers_data, include_annotation_numbers, parsed_data)
                else:
                    output_image = image
            
            # Create annotation data output
            annotation_output = json.dumps({
                "annotations": layers_data,
                "operation_type": prompt_template,
                "target_description": text_prompt,
                "constraint_prompts": constraint_prompts,
                "decorative_prompts": decorative_prompts,
                "selected_annotations": selected_annotations,  # 🔴 新增：包含每个标注的独立操作类型
                "multi_layer_operations": len(selected_annotations) > 1  # 🔴 新增：标识是否为多层独立操作
            }, ensure_ascii=False, indent=2)
            
            # 🔴 新增：生成给大模型的完整指令
            model_instruction = self._generate_model_instruction(structured_prompt, constraint_prompts, decorative_prompts, selected_annotations)
            
            return (
                output_image,  # Image with annotations
                structured_prompt,  # Structured prompt string
                annotation_output,  # Annotation data JSON
                model_instruction  # Complete instruction for the model
            )
            
        except Exception as e:
            return self._create_fallback_output(image, str(e))
    
    def _generate_structured_prompt(self, layers_data: List[Dict], 
                                   selected_ids: List[str], 
                                   template: str, text_prompt: str = "", 
                                   include_annotation_numbers: bool = True,
                                   enhanced_prompts: Dict = None,
                                   selected_annotations: List[Dict] = None) -> str:
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
        
        # 2. Flux Kontext优化模板系统 - 与前端完全一致
        operation_templates = {
            # 局部编辑模板 (L01-L18) - 🔴 Flux Kontext优化
            'change_color': lambda target: f"make {{object}} {target or 'red'}",  # 🔴 官方高频动词"make"
            'change_style': lambda target: f"turn {{object}} into {target or 'cartoon'} style",  # 🔴 官方"turn into"
            'replace_object': lambda target: f"replace {{object}} with {target or 'a different object'}",  # 🔴 官方"replace with"
            'add_object': lambda target: f"add {target or 'a new object'} to {{object}}",  # 🔴 官方"add to"
            'remove_object': lambda target: "remove the {object}",  # 🔴 官方"remove the"
            'change_texture': lambda target: f"change {{object}} texture to {target or 'smooth'}",  # 🔴 官方"change to"
            'change_pose': lambda target: f"make {{object}} {target or 'standing'} pose",  # 🔴 官方"make pose"
            'change_expression': lambda target: f"give {{object}} {target or 'happy'} expression",  # 🔴 官方"give"
            'change_clothing': lambda target: f"change {{object}} clothing to {target or 'casual clothes'}",
            'change_background': lambda target: f"change the background to {target or 'natural landscape'}",
            'enhance_quality': lambda target: f"enhance {{object}} quality",  # 🔴 官方简洁表达
            'blur_background': lambda target: f"blur the background behind {{object}}",  # 🔴 官方模糊句式
            'adjust_lighting': lambda target: f"adjust lighting on {{object}}",  # 🔴 官方光照调整
            'resize_object': lambda target: f"make {{object}} {target or 'larger'} size",  # 🔴 官方尺寸调整
            'enhance_skin_texture': lambda target: f"enhance {{object}} skin texture",  # 🔴 官方皮肤纹理
            # 🔴 新增局部编辑模板 (L16-L18)
            'character_expression': lambda target: f"make the person {target or 'smile'}",  # 🔴 新增角色表情
            'character_hair': lambda target: f"give the person {target or 'blonde'} hair",  # 🔴 新增发型编辑
            'character_accessories': lambda target: f"give the person {target or 'glasses'}",  # 🔴 新增配饰
            
            # 全局编辑模板 (G01-G12) - 🔴 Flux Kontext优化
            'global_color_grade': lambda target: f"apply {target or 'cinematic'} color grading to entire image",
            'global_style_transfer': lambda target: f"turn entire image into {target or 'vintage'} style",
            'global_brightness_contrast': lambda target: f"adjust image brightness and contrast to {target or 'high'}",
            'global_hue_saturation': lambda target: f"change image hue and saturation to {target or 'vibrant'}",
            'global_sharpen_blur': lambda target: f"apply {target or 'strong'} sharpening to entire image",
            'global_noise_reduction': lambda target: f"reduce noise in entire image",
            'global_enhance': lambda target: f"enhance entire image quality",
            'global_filter': lambda target: f"apply {target or 'sepia'} filter to entire image",
            # 🔴 新增全局编辑模板 (G09-G12)
            'character_age': lambda target: f"make the person look {target or 'older'}",  # 🔴 新增年龄编辑
            'detail_enhance': lambda target: f"add more details to {target or 'the background'}",  # 🔴 新增细节增强
            'realism_enhance': lambda target: f"make {target or 'the portrait'} more realistic",  # 🔴 新增真实感
            'camera_operation': lambda target: f"zoom out and show {target or 'full body'}",  # 🔴 新增镜头操作
            
            # 文字编辑模板 (T01-T05) - 🔴 全新类型
            'text_add': lambda target: f'add text saying "{target or "Hello World"}"',  # 🔴 新增文字添加
            'text_remove': lambda target: "remove the text",  # 🔴 新增文字删除
            'text_edit': lambda target: f'change the text to "{target or "Welcome"}"',  # 🔴 新增文字编辑
            'text_resize': lambda target: f"make the text {target or 'bigger'} size",  # 🔴 新增文字大小
            'object_combine': lambda target: f"combine {{object}} with {target or 'the background'}",  # 🔴 新增对象组合
            
            # 专业操作模板 (P01-P14) - 🔴 Flux Kontext优化
            'geometric_warp': lambda target: f"apply {target or 'perspective'} geometric transformation to {{object}}",
            'perspective_transform': lambda target: f"transform {{object}} perspective to {target or 'frontal'}",
            'lens_distortion': lambda target: f"apply {target or 'barrel'} lens distortion to {{object}}",
            'global_perspective': lambda target: f"correct perspective of entire image",
            'content_aware_fill': lambda target: f"remove {{object}} and fill with surrounding content",
            'seamless_removal': lambda target: f"seamlessly remove {{object}}",
            'smart_patch': lambda target: f"patch {{object}} area with smart content",
            'style_blending': lambda target: f"blend {{object}} with {target or 'oil painting'} style",
            'collage_integration': lambda target: f"integrate {{object}} into {target or 'artistic'} composition",
            'texture_mixing': lambda target: f"mix {{object}} texture with {target or 'metal'}",
            'precision_cutout': lambda target: f"precisely cut out {{object}}",
            'alpha_composite': lambda target: f"composite {{object}} onto {target or 'new background'}",
            'mask_feathering': lambda target: f"apply soft feathering to {{object}} edges",
            'depth_composite': lambda target: f"composite {{object}} with depth blending",
            
            'custom': lambda target: target or "Apply custom modification to the selected region"
        }
        
        # 🔴 新逻辑：处理多个标注的独立操作类型
        if selected_annotations and len(selected_annotations) > 0:
            # 多标注独立操作模式
            prompt_parts = []
            
            for annotation in selected_annotations:
                annotation_id = annotation.get('id')
                operation_type = annotation.get('operationType', template)
                individual_description = annotation.get('description', text_prompt)
                
                # 找到对应的图层数据
                layer_data = next((layer for layer in layers_data if layer.get('id') == annotation_id), None)
                if not layer_data:
                    continue
                
                # 构建单个标注的对象描述
                layer_type = layer_data.get("type", "object")
                color = layer_data.get("color", "#ff0000")
                number = layer_data.get("number", 1)
                
                # Color mapping
                color_map = {
                    '#ff0000': 'red',
                    '#00ff00': 'green', 
                    '#ffff00': 'yellow',
                    '#0000ff': 'blue'
                }
                # Shape mapping
                shape_map = {
                    'rectangle': 'rectangular',
                    'circle': 'circular',
                    'arrow': 'arrow-marked',
                    'freehand': 'outlined'
                }
                
                color_name = color_map.get(color, 'marked')
                shape_name = shape_map.get(layer_type, 'marked')
                
                # Build object description for this annotation
                if include_annotation_numbers:
                    object_desc = f"the {color_name} {shape_name} marked area (annotation {number})"
                else:
                    object_desc = f"the {color_name} {shape_name} marked area"
                
                # Get template function for this specific annotation
                template_func = operation_templates.get(operation_type, operation_templates['custom'])
                target_text = individual_description.strip() if individual_description.strip() else None
                
                # Generate prompt for this annotation
                annotation_prompt = template_func(target_text)
                annotation_prompt = annotation_prompt.replace('{object}', object_desc)
                
                prompt_parts.append(annotation_prompt)
            
            # Combine all annotation prompts
            if len(prompt_parts) == 1:
                structured_prompt = prompt_parts[0]
            else:
                structured_prompt = "; ".join(prompt_parts)
        else:
            # 原有逻辑：全局操作模式（向后兼容）
            template_func = operation_templates.get(template, operation_templates['custom'])
            target_text = text_prompt.strip() if text_prompt.strip() else None
            structured_prompt = template_func(target_text)
            structured_prompt = structured_prompt.replace('{object}', objects_str)
        
        # Add enhanced prompts if provided - 🔴 支持多选提示词
        if enhanced_prompts:
            # 支持单个字符串（向后兼容）和多选数组
            constraint_prompts = enhanced_prompts.get('constraint_prompts', []) or enhanced_prompts.get('constraint_prompt', '')
            decorative_prompts = enhanced_prompts.get('decorative_prompts', []) or enhanced_prompts.get('decorative_prompt', '')
            
            # 处理约束性提示词
            if constraint_prompts:
                if isinstance(constraint_prompts, list) and constraint_prompts:
                    structured_prompt += f", {', '.join(constraint_prompts)}"
                elif isinstance(constraint_prompts, str) and constraint_prompts.strip():
                    structured_prompt += f", {constraint_prompts}"
                    
            # 处理修饰性提示词  
            if decorative_prompts:
                if isinstance(decorative_prompts, list) and decorative_prompts:
                    structured_prompt += f", {', '.join(decorative_prompts)}"
                elif isinstance(decorative_prompts, str) and decorative_prompts.strip():
                    structured_prompt += f", {decorative_prompts}"
        
        return structured_prompt
    
    def _render_annotations_on_image(self, image: torch.Tensor, layers_data: List[Dict], include_annotation_numbers: bool = True, annotation_data_json: Dict = None) -> torch.Tensor:
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
                """Draw annotation number label at specified position - simplified style without circles"""
                if not include_annotation_numbers:
                    return
                    
                try:
                    # Calculate font size based on image size - larger for better visibility
                    font_size = max(24, int(min(img_width, img_height) * 0.04))
                    
                    # Try to use a nice font, fallback to default
                    try:
                        font = ImageFont.truetype("arial.ttf", font_size)
                    except:
                        try:
                            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
                        except:
                            try:
                                font = ImageFont.load_default()
                                # Scale up the default font size if possible
                                if hasattr(font, 'font_size'):
                                    font.font_size = font_size
                            except:
                                font = None
                    
                    # Position for number label - already calculated as outside position
                    x = int(position['x'] * scale_x)
                    y = int(position['y'] * scale_y)
                    
                    # Text styling
                    text = str(number)
                    
                    # Draw text with black outline for high contrast
                    outline_width = 2
                    text_color = (255, 255, 255, 255)  # White text
                    outline_color = (0, 0, 0, 255)     # Black outline
                    
                    # Draw text outline (multiple passes for better effect)
                    for dx in range(-outline_width, outline_width + 1):
                        for dy in range(-outline_width, outline_width + 1):
                            if dx != 0 or dy != 0:  # Don't draw at center position
                                if font:
                                    draw.text((x + dx, y + dy), text, fill=outline_color, font=font)
                                else:
                                    draw.text((x + dx, y + dy), text, fill=outline_color)
                    
                    # Draw main text
                    if font:
                        draw.text((x, y), text, fill=text_color, font=font)
                    else:
                        draw.text((x, y), text, fill=text_color)
                    
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
            print(f"🖼️ Backend image rendering - Image size: {img_width}x{img_height}")
            
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
            def get_coordinate_scale_from_frontend(annotation_data_json, img_width, img_height):
                """从前端数据获取准确的坐标缩放比例"""
                try:
                    # 尝试从前端数据获取缩放信息
                    if annotation_data_json and 'image_scale_info' in annotation_data_json:
                        scale_info = annotation_data_json['image_scale_info']
                        if scale_info and 'scale_x' in scale_info and 'scale_y' in scale_info:
                            scale_x = float(scale_info['scale_x'])
                            scale_y = float(scale_info['scale_y'])
                            
                            # 🔧 关键修复：获取画布偏移信息，用于坐标转换
                            canvas_offset_x = scale_info.get('canvas_offset_x', 0)
                            canvas_offset_y = scale_info.get('canvas_offset_y', 0)
                            
                            print(f"✅ [SCALE] 使用前端精确缩放信息: scale_x={scale_x:.3f}, scale_y={scale_y:.3f}")
                            print(f"📊 [SCALE] 显示尺寸: {scale_info.get('display_width', 'N/A')}x{scale_info.get('display_height', 'N/A')}")
                            print(f"📊 [SCALE] 原始尺寸: {scale_info.get('natural_width', 'N/A')}x{scale_info.get('natural_height', 'N/A')}")
                            print(f"📍 [SCALE] 画布偏移: ({canvas_offset_x}, {canvas_offset_y})")
                            
                            # 返回缩放因子和偏移信息
                            return scale_x, scale_y, canvas_offset_x, canvas_offset_y
                except Exception as e:
                    print(f"⚠️ [SCALE] 获取前端缩放信息失败: {e}")
                
                # 回退到原有的检测逻辑（但这通常不准确）
                print("⚠️ [SCALE] 前端缩放信息不可用，使用回退检测逻辑")
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
                    return 1.0, 1.0, 0, 0
                    
                scale_x = img_width / max_x if max_x > img_width * 1.5 else 1.0
                scale_y = img_height / max_y if max_y > img_height * 1.5 else 1.0
                
                print(f"🔍 [SCALE] 回退检测结果 - Max coords: ({max_x}, {max_y}), Scale ratio: ({scale_x:.3f}, {scale_y:.3f})")
                return scale_x, scale_y, 0, 0  # 回退时无偏移信息
            
            # 获取坐标缩放比例和偏移信息（优先使用前端精确信息）
            scale_result = get_coordinate_scale_from_frontend(annotation_data_json, img_width, img_height)
            if len(scale_result) == 4:
                scale_x, scale_y, canvas_offset_x, canvas_offset_y = scale_result
            else:
                scale_x, scale_y = scale_result
                canvas_offset_x, canvas_offset_y = 0, 0
            
            # Render each annotation
            rendered_count = 0
            for i, layer in enumerate(layers_data):
                color_hex = layer.get('color', '#ff0000')
                color_rgb = color_map.get(color_hex, (255, 0, 0))  # 获取RGB值
                layer_type = layer.get('type', 'rectangle')
                opacity = layer.get('opacity', 50)  # 获取不透明度，默认50%
                
                # 🔍 调试：输出每个标注的不透明度信息
                print(f"🎨 Annotation {i+1} render info: type={layer_type}, color={color_hex}, opacity={opacity}%")
                
                # Check if coordinates exist and are valid
                # Support multiple coordinate formats: 1) start/end, 2) geometry.coordinates
                has_coordinates = False
                start_point = None
                end_point = None
                fill_mode = layer.get('fillMode', 'filled')  # 获取填充模式
                
                print(f"🔍 Annotation {i+1} coordinate check: type={layer_type}, contains keys={list(layer.keys())}")
                
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
                    # 🔧 关键修复：前端坐标基于显示尺寸，转换到原始图像坐标系
                    # display坐标 ÷ scale = original坐标
                    x1 = int((start_point['x'] - canvas_offset_x) / scale_x)
                    y1 = int((start_point['y'] - canvas_offset_y) / scale_y)
                    x2 = int((end_point['x'] - canvas_offset_x) / scale_x)
                    y2 = int((end_point['y'] - canvas_offset_y) / scale_y)
                    
                    # Ensure correct coordinate order
                    x1, x2 = min(x1, x2), max(x1, x2)
                    y1, y2 = min(y1, y2), max(y1, y2)
                    
                    print(f"🔴 Rectangle annotation {i}: original coords({start_point['x']:.1f},{start_point['y']:.1f})-({end_point['x']:.1f},{end_point['y']:.1f}) → image coords({x1},{y1})-({x2},{y2}), fill mode: {fill_mode}, opacity: {opacity}%")
                    print(f"🔴 Before rectangle drawing: draw object={id(draw)}, image object={id(pil_image)}, image mode={pil_image.mode}")
                    apply_fill_style(draw, (x1, y1, x2, y2), color_rgb, fill_mode, 'rectangle', opacity)
                    print(f"🔴 After rectangle drawing: Rectangle drawing completed")
                    
                    # Draw annotation number at top-left corner outside the annotation
                    annotation_number = layer.get('number', i + 1)
                    color_rgba = (*color_rgb, 255)  # 转换为RGBA格式给编号使用
                    # Calculate position outside the rectangle (top-left corner with small offset)
                    number_position = {
                        'x': min(start_point['x'], end_point['x']) - 8,
                        'y': min(start_point['y'], end_point['y']) - 8
                    }
                    draw_annotation_number(draw, number_position, annotation_number, color_rgba, scale_x, scale_y)
                    
                    rendered_count += 1
                    
                elif layer_type == 'circle' and start_point and end_point:
                    # Ellipse annotation
                    # 🔧 关键修复：前端坐标基于显示尺寸，转换到原始图像坐标系
                    x1 = int((start_point['x'] - canvas_offset_x) / scale_x)
                    y1 = int((start_point['y'] - canvas_offset_y) / scale_y)
                    x2 = int((end_point['x'] - canvas_offset_x) / scale_x)
                    y2 = int((end_point['y'] - canvas_offset_y) / scale_y)
                    
                    # Ensure correct coordinate order
                    x1, x2 = min(x1, x2), max(x1, x2)
                    y1, y2 = min(y1, y2), max(y1, y2)
                    
                    print(f"🟡 椭圆标注 {i}: 原始坐标({start_point['x']:.1f},{start_point['y']:.1f})-({end_point['x']:.1f},{end_point['y']:.1f}) → 图像坐标({x1},{y1})-({x2},{y2}), 填充模式: {fill_mode}, 不透明度: {opacity}%")
                    apply_fill_style(draw, (x1, y1, x2, y2), color_rgb, fill_mode, 'ellipse', opacity)
                    
                    # Draw annotation number at top-left corner outside the annotation
                    annotation_number = layer.get('number', i + 1)
                    color_rgba = (*color_rgb, 255)  # 转换为RGBA格式给编号使用
                    # Calculate position outside the ellipse (top-left corner with small offset)
                    number_position = {
                        'x': min(start_point['x'], end_point['x']) - 8,
                        'y': min(start_point['y'], end_point['y']) - 8
                    }
                    draw_annotation_number(draw, number_position, annotation_number, color_rgba, scale_x, scale_y)
                    
                    rendered_count += 1
                    
                elif layer_type == 'freehand' and 'points' in layer:
                    # Polygon annotation
                    points = layer['points']
                    
                    if len(points) >= 3:
                        polygon_points = []
                        for point in points:
                            # 🔧 关键修复：先减去画布偏移，再应用缩放
                            x = int((point['x'] - canvas_offset_x) * scale_x)
                            y = int((point['y'] - canvas_offset_y) * scale_y)
                            polygon_points.append((x, y))
                        
                        print(f"🔗 多边形标注 {i}: {len(points)}个点, 缩放比例({scale_x:.3f}, {scale_y:.3f}), 填充模式: {fill_mode}, 不透明度: {opacity}%")
                        apply_fill_style(draw, polygon_points, color_rgb, fill_mode, 'polygon', opacity)
                        
                        # Draw annotation number outside the polygon (offset from first point)
                        annotation_number = layer.get('number', i + 1)
                        first_point = points[0]
                        color_rgba = (*color_rgb, 255)  # 转换为RGBA格式给编号使用
                        # Calculate position outside the polygon (small offset from first point)
                        number_position = {
                            'x': first_point['x'] - 8,
                            'y': first_point['y'] - 8
                        }
                        draw_annotation_number(draw, number_position, annotation_number, color_rgba, scale_x, scale_y)
                        
                        rendered_count += 1
                        
                elif layer_type == 'arrow' and start_point and end_point:
                    # Arrow annotation
                    # 🔧 关键修复：前端坐标基于显示尺寸，转换到原始图像坐标系
                    x1 = int((start_point['x'] - canvas_offset_x) / scale_x)
                    y1 = int((start_point['y'] - canvas_offset_y) / scale_y)
                    x2 = int((end_point['x'] - canvas_offset_x) / scale_x)
                    y2 = int((end_point['y'] - canvas_offset_y) / scale_y)
                    
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
                    
                    print(f"➡️ Arrow annotation {i}: original coords({start_point['x']:.1f},{start_point['y']:.1f})-({end_point['x']:.1f},{end_point['y']:.1f}) → image coords({x1},{y1})-({x2},{y2})")
                    
                    # Draw annotation number outside the arrow (offset from start point)
                    annotation_number = layer.get('number', i + 1)
                    color_rgba = (*color_rgb, 255)  # 转换为RGBA格式给编号使用
                    # Calculate position outside the arrow (small offset from start point)
                    number_position = {
                        'x': start_point['x'] - 8,
                        'y': start_point['y'] - 8
                    }
                    draw_annotation_number(draw, number_position, annotation_number, color_rgba, scale_x, scale_y)
                    
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
                            # 🔧 关键修复：先减去画布偏移，再应用缩放
                            scaled_x = int((point['x'] - canvas_offset_x) * scale_x)
                            scaled_y = int((point['y'] - canvas_offset_y) * scale_y)
                            scaled_points.append((scaled_x, scaled_y))
                        
                        if len(scaled_points) >= 2:
                            # 绘制路径
                            stroke_width = int(brush_size * max(scale_x, scale_y))
                            stroke_alpha = int(opacity * 255 / 100)
                            stroke_color = (*color_rgb, stroke_alpha)
                            
                            print(f"🖌️ Brush rendering {i}: feathered path, width={stroke_width}, alpha={stroke_alpha}, color={stroke_color}")
                            
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
                            
                            print(f"🖌️ Brush rendering {i}: feathering drawing completed, preparing composition")
                        
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
                            # 🔧 关键修复：先减去画布偏移，再应用缩放
                            scaled_x = int((point['x'] - canvas_offset_x) * scale_x)
                            scaled_y = int((point['y'] - canvas_offset_y) * scale_y)
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
                    
                    # Draw annotation number outside the brush path (offset from first point)
                    if points:
                        annotation_number = layer.get('number', i + 1)
                        color_rgba = (*color_rgb, 255)
                        first_point = points[0]
                        # Calculate position outside the brush path (small offset from first point)
                        number_position = {
                            'x': first_point['x'] - 8,
                            'y': first_point['y'] - 8
                        }
                        draw_annotation_number(draw, number_position, annotation_number, color_rgba, scale_x, scale_y)
                    
                    rendered_count += 1
            
            numbers_status = "with numbers" if include_annotation_numbers else "without numbers"
            print(f"✅ Backend annotation rendering completed: Total {len(layers_data)} annotations, successfully rendered {rendered_count} ({numbers_status})")
            
            # 如果图像在RGBA模式，转换为RGB模式
            if pil_image.mode == 'RGBA':
                print(f"🔄 Converting final image from RGBA to RGB mode")
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
    
    def _generate_model_instruction(self, structured_prompt: str, constraint_prompts: List[str], decorative_prompts: List[str], selected_annotations: List[Dict]) -> str:
        """
        生成给大模型的完整指令
        包含基础提示词、约束性提示词、修饰性提示词和元数据信息
        """
        instruction_parts = []
        
        # 1. 基础操作指令
        instruction_parts.append(f"OPERATION: {structured_prompt}")
        
        # 2. 约束性提示词（质量和技术要求）
        if constraint_prompts:
            constraints_text = ", ".join(constraint_prompts)
            instruction_parts.append(f"CONSTRAINTS: {constraints_text}")
        
        # 3. 修饰性提示词（风格和视觉效果）
        if decorative_prompts:
            decoratives_text = ", ".join(decorative_prompts)
            instruction_parts.append(f"STYLE: {decoratives_text}")
        
        # 4. 元数据信息
        metadata = []
        if selected_annotations:
            metadata.append(f"annotations_count: {len(selected_annotations)}")
            
            # 统计操作类型
            operation_types = {}
            for ann in selected_annotations:
                op_type = ann.get('operationType', 'unknown')
                operation_types[op_type] = operation_types.get(op_type, 0) + 1
            
            if operation_types:
                op_summary = ", ".join([f"{op}({count})" for op, count in operation_types.items()])
                metadata.append(f"operations: {op_summary}")
        
        if metadata:
            instruction_parts.append(f"METADATA: {'; '.join(metadata)}")
        
        # 组合完整指令
        complete_instruction = " | ".join(instruction_parts)
        
        return complete_instruction
    
    def _process_canvas_image_data(self, canvas_data_url: str, target_width: int = None, target_height: int = None) -> torch.Tensor:
        """
        处理来自Fabric.js的完整画布图像数据
        使用官方toDataURL()导出的DataURL格式图像
        """
        try:
            # 解析DataURL格式 (data:image/png;base64,<base64_data>)
            if not canvas_data_url.startswith('data:image/'):
                raise ValueError("Invalid DataURL format")
            
            # 提取base64数据
            header, base64_data = canvas_data_url.split(',', 1)
            image_format = header.split(';')[0].split('/')[1]  # 获取图像格式 (png, jpeg等)
            
            # 解码base64数据
            image_bytes = base64.b64decode(base64_data)
            
            # 使用PIL加载图像
            from PIL import Image as PILImage
            import io
            
            pil_image = PILImage.open(io.BytesIO(image_bytes))
            
            # 确保图像是RGB模式
            if pil_image.mode != 'RGB':
                pil_image = pil_image.convert('RGB')
            
            # 获取图像尺寸
            original_width, original_height = pil_image.size
            print(f"🎨 Canvas image loaded: {original_width}x{original_height}, format: {image_format}")
            
            # 如果指定了目标尺寸，进行缩放
            if target_width and target_height:
                if original_width != target_width or original_height != target_height:
                    pil_image = pil_image.resize((target_width, target_height), PILImage.Resampling.LANCZOS)
                    print(f"🔄 Canvas image resized to: {target_width}x{target_height}")
            
            # 转换为numpy数组
            img_array = np.array(pil_image)
            
            # 转换为torch tensor [0, 1]范围
            img_tensor = torch.from_numpy(img_array).float() / 255.0
            
            # 添加batch维度 [1, H, W, C]
            if len(img_tensor.shape) == 3:
                img_tensor = img_tensor.unsqueeze(0)
            
            print(f"✅ Canvas image processed successfully: {img_tensor.shape}")
            return img_tensor
            
        except Exception as e:
            print(f"❌ Failed to process canvas image data: {e}")
            # 降级到空白画布
            fallback_width = target_width or 800
            fallback_height = target_height or 600
            return torch.ones((1, fallback_height, fallback_width, 3), dtype=torch.float32)
    
    def _create_fallback_output(self, image: torch.Tensor, error_msg: str):
        """Create fallback output"""
        fallback_structured_prompt = "Edit the selected areas according to requirements"
        
        # Create fallback annotation data
        fallback_annotation_data = json.dumps({
            "annotations": [],
            "operation_type": "fallback",
            "target_description": "fallback output",
            "constraint_prompts": [],
            "decorative_prompts": []
        }, ensure_ascii=False, indent=2)
        
        # Create fallback model instruction
        fallback_model_instruction = f"Fallback instruction: {fallback_structured_prompt}. Error: {error_msg}"
        
        # Handle case when image is None
        if image is None:
            # 创建默认的空白画布
            fallback_image = torch.zeros((1, canvas_height, canvas_width, 3), dtype=torch.float32)
        else:
            fallback_image = image
        
        return (
            fallback_image,  # Image
            fallback_structured_prompt,  # Structured prompt
            fallback_annotation_data,  # Annotation data
            fallback_model_instruction  # Model instruction
        )

# Node registration
NODE_CLASS_MAPPINGS = {
    "VisualPromptEditor": VisualPromptEditor,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "VisualPromptEditor": "🎨 Visual Prompt Editor",
}