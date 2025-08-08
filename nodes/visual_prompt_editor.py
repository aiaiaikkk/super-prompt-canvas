"""
Visual Prompt Editor Node
Visual prompt editor node for ComfyUI

Combines visual annotation editing and structured prompt generation functionality
Double-click node to open unified editing interface: left side for graphic annotation, right side for prompt editing
"""

import json
import base64
import time
from typing import Dict, List, Any, Tuple, Optional
from datetime import datetime
from PIL import Image, ImageDraw, ImageFont
from PIL import Image as PILImage
# from threading import Event  # 不再需要Event，Widget架构不需要异步等待

# Optional dependencies
try:
    import torch
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False
    torch = None

try:
    import numpy as np
    NUMPY_AVAILABLE = True
except ImportError:
    NUMPY_AVAILABLE = False
    np = None

try:
    import comfy.model_management as model_management
    from nodes import MAX_RESOLUTION
    from server import PromptServer
    COMFY_AVAILABLE = True
except ImportError:
    COMFY_AVAILABLE = False
    MAX_RESOLUTION = 8192

# 移除WebSocket相关的存储函数，Widget架构不需要

# 添加HTTP路由处理前端数据
try:
    from aiohttp import web
    from server import PromptServer
    
    # ✅ 移除WebSocket逻辑，使用Widget数据流架构
    print("[Kontext] 使用Widget数据流架构，无需HTTP路由或WebSocket")
            
except ImportError:
    print("[Kontext] 警告: aiohttp不可用，事件驱动功能将受限")

class VisualPromptEditor:
    """Visual Prompt Editor Node - Unified annotation editing and prompt generation"""
    
    def __init__(self):
        self.node_id = None
    
    @classmethod
    def clean_nodes(cls):
        """Widget架构无需存储清理"""
        print(f"[Kontext] Widget架构，无需清理存储")
    
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
            },
            "hidden": {"unique_id": "UNIQUE_ID"}
        }
    
    RETURN_TYPES = ("IMAGE", "STRING", "STRING", "STRING")
    RETURN_NAMES = (
        "processed_image", 
        "structured_prompt",
        "annotation_data",
        "model_instruction"
    )
    FUNCTION = "visual_prompt_edit"
    CATEGORY = "lrpg_super_prompt/core"
    DESCRIPTION = "🎨 LRPG Super Prompt Visual Editor - Unified visual annotation editor with multimodal AI prompt generation capabilities"
    
    def visual_prompt_edit(self, image = None, annotation_data: str = None,
                          canvas_width: int = 800, canvas_height: int = 600, unique_id=None):
        """
        LRPG Transform-First架构 - 事件驱动响应式处理
        从annotation_data架构彻底升级为Transform-First + Event-Driven架构
        """
        
        try:
            # ===== Widget架构初始化 =====
            self.node_id = unique_id
            print(f"[Kontext] 🚀 启动Widget数据流处理 (Node: {unique_id})")
            print(f"[Kontext] 📊 输入图像尺寸: {image.shape if image is not None else 'None'}")
            
            print(f"[Kontext] 📝 annotation_data长度: {len(annotation_data) if annotation_data else 0} 字符")
            
            # ✅ Widget架构：直接使用annotation_data，无需WebSocket通信
            print(f"[Kontext] 📊 Widget架构启动，直接读取annotation_data")
            
            # ✅ Widget架构：无需等待WebSocket，直接处理annotation_data
            print(f"[Kontext] 📊 Widget架构：直接处理annotation_data参数")
            frontend_data = None  # 不再使用WebSocket数据
            self.clean_nodes()
            
            # ===== Transform-First 数据处理 =====
            # 优先使用事件驱动的前端数据
            
            # 1. 初始化Transform数据容器
            transform_data = {}
            canvas_data = {}
            user_edited_prompt = ""
            constraint_prompts = []
            decorative_prompts = []
            
            # 2. 处理数据（优先级：annotation_data > 默认）
            if annotation_data and annotation_data.strip():
                # Widget数据流：直接处理annotation_data
                print(f"[Kontext] 📦 处理annotation_data，长度: {len(annotation_data)} 字符")
                print(f"[Kontext] 🔍 annotation_data内容: {annotation_data[:200]}...")  # 显示前200字符
                
                try:
                    parsed_data = json.loads(annotation_data)
                    
                    # Transform-First数据检测和处理
                    if self._is_transform_first_data(parsed_data):
                        print(f"[Kontext] ✅ 检测到Transform-First数据格式")
                        transform_data, canvas_data = self._process_transform_first_data(parsed_data)
                    else:
                        print(f"[Kontext] 🔄 旧格式数据，转换为Transform-First格式")
                        transform_data, canvas_data = self._convert_legacy_to_transform(parsed_data)
                    
                    # 提取用户编辑的提示词（兼容新旧字段名）
                    user_edited_prompt = parsed_data.get("user_prompt", 
                                                        parsed_data.get("userEditedPrompt", ""))
                    constraint_prompts = parsed_data.get("constraint_prompts",
                                                        parsed_data.get("constraintPrompts", []))
                    decorative_prompts = parsed_data.get("decorative_prompts",
                                                        parsed_data.get("decorativePrompts", []))
                    
                except json.JSONDecodeError as e:
                    print(f"[Kontext] ⚠️ 数据解析失败: {e}")
                    # 使用默认Transform数据
                    transform_data, canvas_data = self._create_default_transform_data(image, canvas_width, canvas_height)
            else:
                print(f"[Kontext] 📝 无输入数据，使用默认Transform配置")
                transform_data, canvas_data = self._create_default_transform_data(image, canvas_width, canvas_height)
            
            # 3. Transform-First图像处理和合成
            print(f"[LRPG] 🎨 开始Transform-First图像合成")
            print(f"[LRPG] 🔍 Transform数据详情: {transform_data}")
            print(f"[LRPG] 🔍 Canvas数据详情: {canvas_data}")
            print(f"[LRPG] 🔍 图像输入: {image is not None}, 尺寸: {image.shape if image is not None else 'None'}")
            
            result_image = self._apply_transform_first_processing(
                image, transform_data, canvas_data, canvas_width, canvas_height
            )
            
            # 4. 生成Transform-First提示词
            # 提取operation_type和target_description
            operation_type = parsed_data.get("operation_type", "custom") if 'parsed_data' in locals() else "custom"
            target_description = parsed_data.get("target_description", "") if 'parsed_data' in locals() else ""
            
            structured_prompt = self._generate_transform_based_prompt(
                transform_data, user_edited_prompt, constraint_prompts, decorative_prompts,
                operation_type, target_description
            )
            
            # 5. 构建输出数据
            enhanced_prompts = self._build_enhanced_prompts(constraint_prompts, decorative_prompts)
            
            print(f"[LRPG] ✅ Transform-First处理完成")
            print(f"[LRPG] 📊 输出图像尺寸: {result_image.shape}")
            print(f"[LRPG] 📝 生成提示词长度: {len(structured_prompt)} 字符")
            
            return (
                result_image,
                structured_prompt,
                enhanced_prompts,
                json.dumps({
                    "version": "transform_first_1.0",
                    "transform_data": transform_data,
                    "canvas_data": canvas_data,
                    "processing_timestamp": time.time()
                })
            )
            
        except Exception as e:
            print(f"[LRPG] ❌ Transform-First处理失败: {str(e)}")
            import traceback
            traceback.print_exc()
            
            # 错误情况下返回原图
            fallback_prompt = "Transform-First processing failed, using original image"
            return (
                image if image is not None else torch.zeros((1, 512, 512, 3)),
                fallback_prompt,
                "[]", 
                json.dumps({"error": str(e), "version": "transform_first_1.0"})
            )

    # ===== Transform-First 核心处理方法 =====
    
    def _is_transform_first_data(self, data):
        """检测是否为Transform-First数据格式"""
        return (
            isinstance(data, dict) and 
            ("layer_transforms" in data or "transform_data" in data or 
             "canvas_data" in data or "transform_version" in data)
        )
    
    def _process_transform_first_data(self, data):
        """处理LRPG统一格式数据 - 无转换"""
        layer_transforms = data.get("layer_transforms", {})
        
        print(f"[LRPG] 📊 统一格式图层数: {len(layer_transforms)}")
        
        # ✅ 调试：打印实际接收的数据
        for layer_id, layer_data in layer_transforms.items():
            if layer_id != 'background':
                print(f"[LRPG] 🔍 图层 {layer_id} 数据:")
                print(f"  - centerX: {layer_data.get('centerX', 'NOT_FOUND')}")
                print(f"  - centerY: {layer_data.get('centerY', 'NOT_FOUND')}")
                print(f"  - scaleX: {layer_data.get('scaleX', 'NOT_FOUND')}")
                print(f"  - angle: {layer_data.get('angle', 'NOT_FOUND')}")
                print(f"  - type: {layer_data.get('type', 'NOT_FOUND')}")
                # 🔧 检查points数据（多边形）
                if layer_data.get('type') == 'polygon':
                    points = layer_data.get('points', [])
                    print(f"  - points: {'有' if points else '无'} ({len(points)} 个点)")
                    if points:
                        print(f"  - points示例: {points[:2]}{'...' if len(points) > 2 else ''}")
                print(f"  - crop_path: {'有' if layer_data.get('crop_path') else '无'} ({len(layer_data.get('crop_path', []))} 个点)")
        
        # ✅ LRPG格式：直接使用，无转换
        background = layer_transforms.get('background', {})
        canvas_data = {
            'width': background.get('width', 800),
            'height': background.get('height', 600)
        }
        
        print(f"[LRPG] 🎨 Canvas尺寸: {canvas_data['width']}x{canvas_data['height']}")
        print(f"[LRPG] ✅ LRPG统一格式处理完成")
        
        return layer_transforms, canvas_data
    
    def _convert_layer_to_kontext_format(self, layer_data):
        """将单个图层从旧格式转换为Kontext格式"""
        try:
            # 提取旧格式数据
            position = layer_data.get('position', {})
            size = layer_data.get('size', {})
            transform = layer_data.get('transform', {})
            
            left = position.get('left', 0)
            top = position.get('top', 0)
            width = size.get('width', 100)
            height = size.get('height', 100)
            scaleX = transform.get('scaleX', 1)
            scaleY = transform.get('scaleY', 1)
            angle = transform.get('angle', 0)
            
            # ✅ 转换为Kontext中心点坐标系统
            centerX = left + width / 2
            centerY = top + height / 2
            
            kontext_layer = {
                'centerX': centerX,
                'centerY': centerY,
                'scaleX': scaleX,
                'scaleY': scaleY,
                'angle': angle,
                'width': width,
                'height': height,
                'flipX': layer_data.get('flipX', False),
                'flipY': layer_data.get('flipY', False),
                'type': layer_data.get('type', 'rect'),
                'style': layer_data.get('style', {}),
                'converted_from_legacy': True
            }
            
            print(f"[LRPG] 🔄 旧格式转换:")
            print(f"  - 位置: ({left}, {top}) + 尺寸: ({width}, {height})")
            print(f"  - 转换为中心点: ({centerX:.1f}, {centerY:.1f})")
            print(f"  - 变换: 缩放({scaleX:.3f}, {scaleY:.3f}), 旋转{angle:.1f}°")
            
            return kontext_layer
            
        except Exception as e:
            print(f"[LRPG] ❌ 图层格式转换失败: {str(e)}")
            return layer_data
    
    def _convert_legacy_to_transform(self, data):
        """将旧的annotation数据转换为Transform-First格式"""
        print(f"[LRPG] 🔄 转换旧格式annotation数据为Transform格式")
        
        transform_data = {}
        canvas_data = {
            "background_color": data.get("backgroundColor", "#ffffff"),
            "version": "converted_from_legacy"
        }
        
        # 尝试从annotation数据提取transform信息
        annotations = data.get("annotations", [])
        for i, annotation in enumerate(annotations):
            if annotation.get("fabricObject"):
                fabric_obj = annotation["fabricObject"]
                transform_data[f"layer_{i}"] = {
                    "centerX": fabric_obj.get("left", 0) + fabric_obj.get("width", 0) / 2,
                    "centerY": fabric_obj.get("top", 0) + fabric_obj.get("height", 0) / 2,
                    "scaleX": fabric_obj.get("scaleX", 1),
                    "scaleY": fabric_obj.get("scaleY", 1),
                    "angle": fabric_obj.get("angle", 0),
                    "width": fabric_obj.get("width", 100),
                    "height": fabric_obj.get("height", 100),
                    "type": annotation.get("type", "unknown")
                }
        
        print(f"[LRPG] ✅ 已转换 {len(transform_data)} 个图层为Transform格式")
        return transform_data, canvas_data
    
    def _create_default_transform_data(self, image, canvas_width, canvas_height):
        """创建默认的Transform数据"""
        transform_data = {}
        canvas_data = {
            "width": canvas_width,
            "height": canvas_height,
            "background_color": "#ffffff",
            "version": "default_transform_first"
        }
        
        if image is not None:
            # 为输入图像创建默认transform
            img_height, img_width = image.shape[1], image.shape[2]
            transform_data["background_image"] = {
                "centerX": canvas_width / 2,
                "centerY": canvas_height / 2,
                "scaleX": 1.0,
                "scaleY": 1.0,
                "angle": 0,
                "width": img_width,
                "height": img_height,
                "type": "background"
            }
        
        return transform_data, canvas_data
    
    def _apply_transform_first_processing(self, image, transform_data, canvas_data, canvas_width, canvas_height):
        """🚀 Kontext Transform-First图像处理 - 分辨率独立HD还原算法"""
        print(f"[LRPG] 🎯 启动Transform-First高清还原处理")
        print(f"[LRPG] 📊 接收参数:")
        print(f"  - 输入图像: {image is not None}, 形状: {image.shape if image is not None else 'None'}")
        print(f"  - 变换数据: {type(transform_data)}, 图层数: {len(transform_data) if transform_data else 0}")
        print(f"  - 画布数据: {canvas_data}")
        print(f"  - 目标画布尺寸: {canvas_width} x {canvas_height}")
        
        if image is None:
            print(f"[LRPG] ⚠️ 图像为空，创建默认HD画布")
            return torch.ones((1, canvas_height, canvas_width, 3), dtype=torch.float32)
        
        if not transform_data:
            print(f"[LRPG] ℹ️ 无变换数据，返回原图")
            return image
        
        # ✅ Kontext核心：HD还原算法预处理
        hd_scale = self._calculate_hd_scale(transform_data, canvas_data, image.shape)
        scaled_transform_data = self._scale_hd_transforms(transform_data, hd_scale)
        
        print(f"[LRPG] 🔬 HD还原分析:")
        print(f"  - HD缩放比例: {hd_scale:.3f}")
        print(f"  - 原始变换数: {len(transform_data)}")
        print(f"  - HD变换数: {len(scaled_transform_data)}")
        
        print(f"[LRPG] 🎨 开始Transform-First变换处理")
        
        # 确保图像格式正确
        if len(image.shape) == 3:
            image = image.unsqueeze(0)
        if image.shape[-1] != 3 and image.shape[1] == 3:
            image = image.permute(0, 2, 3, 1)
        
        try:
            import cv2
            import numpy as np
            from PIL import Image as PILImage, ImageDraw
            
            # 处理批量图像 - 支持多图像输入
            batch_size = image.shape[0]
            print(f"[LRPG] 📦 检测到批量图像: {batch_size} 张")
            
            # 获取图层列表（排除background）
            layer_ids = [layer_id for layer_id in scaled_transform_data.keys() if layer_id != 'background']
            print(f"[LRPG] 📊 图层数量: {len(layer_ids)}, 图像数量: {batch_size}")
            print(f"[LRPG] 📋 图层列表: {layer_ids}")
            
            processed_images = []
            
            # 使用实际画布尺寸（从canvas_data获取）
            actual_canvas_width = canvas_data.get('width', canvas_width)
            actual_canvas_height = canvas_data.get('height', canvas_height)
            
            # 为每张图像单独处理
            for batch_idx in range(batch_size):
                print(f"[LRPG] 🔄 处理第 {batch_idx + 1}/{batch_size} 张图像")
                
                # 转换当前图像为PIL图像进行处理
                img_array = image[batch_idx].cpu().numpy()
                if img_array.max() <= 1.0:
                    img_array = (img_array * 255).astype(np.uint8)
                else:
                    img_array = img_array.astype(np.uint8)
                
                # 创建画布
                canvas = PILImage.fromarray(img_array)
                draw = ImageDraw.Draw(canvas)
                
                print(f"[LRPG] 🖼️ 第{batch_idx + 1}张图像尺寸: {canvas.size}")
                print(f"[LRPG] 🎨 目标画布尺寸: {actual_canvas_width}x{actual_canvas_height}")
                
                # 🚀 新架构：多图像合成处理
                print(f"[LRPG] 🎨 开始多图像合成处理 - 输入图像{batch_idx + 1}")
                
                # 检查是否需要合成模式
                has_multiple_sources = any(
                    layer_data.get('source') == 'upload' 
                    for layer_data in scaled_transform_data.values() 
                    if isinstance(layer_data, dict) and 'source' in layer_data
                )
                
                # 🎯 检查input图像是否被显著变换
                has_transformed_input = False
                for layer_id, layer_data in scaled_transform_data.items():
                    if isinstance(layer_data, dict) and layer_data.get('source') == 'input':
                        # 检查是否偏离了默认的居中满屏状态
                        centerX = layer_data.get('centerX', actual_canvas_width/2)
                        centerY = layer_data.get('centerY', actual_canvas_height/2)
                        scaleX = layer_data.get('scaleX', 1.0)
                        scaleY = layer_data.get('scaleY', 1.0)
                        
                        # 计算预期的居中位置
                        expected_centerX = actual_canvas_width / 2
                        expected_centerY = actual_canvas_height / 2
                        
                        # 检查位置偏移
                        position_offset = abs(centerX - expected_centerX) + abs(centerY - expected_centerY)
                        
                        # 检查缩放变化（不是接近1.0的满屏缩放）
                        scale_change = abs(1.0 - scaleX) + abs(1.0 - scaleY)
                        
                        if position_offset > 50 or scale_change > 0.3:  # 显著变换阈值
                            has_transformed_input = True
                            print(f"[LRPG] 🎯 检测到input图像变换: 位置偏移={position_offset:.1f}, 缩放变化={scale_change:.2f}")
                            break
                
                needs_composite_canvas = has_multiple_sources or has_transformed_input
                
                if needs_composite_canvas:
                    # 合成模式：创建空白画布（多图像或变换后的单图像）
                    canvas = self._create_composite_canvas(actual_canvas_width, actual_canvas_height)
                    if has_multiple_sources:
                        print(f"[LRPG] 🎨 创建合成画布（多图像模式）: {canvas.size}")
                    else:
                        print(f"[LRPG] 🎨 创建合成画布（单图像变换模式）: {canvas.size}")
                else:
                    # 单图像原始模式：使用输入图像作为基础
                    canvas = PILImage.fromarray(img_array)
                    print(f"[LRPG] 📷 使用输入图像作为基础（未变换）: {canvas.size}")
                
                # 处理所有图层
                for layer_id in layer_ids:
                    layer_data = scaled_transform_data.get(layer_id)
                    if layer_data:
                        print(f"[LRPG] 🔄 处理图层: {layer_id}")
                        canvas = self._process_image_layer(canvas, layer_data, layer_id, 
                                                         image[batch_idx] if layer_data.get('source') == 'input' else None,
                                                         actual_canvas_width, actual_canvas_height)
                    else:
                        print(f"[LRPG] ⚠️ 图层数据缺失: {layer_id}")
                
                # 转换当前处理的图像回tensor并添加到批次中
                result_array = np.array(canvas).astype(np.float32) / 255.0
                processed_images.append(result_array)
                
                print(f"[LRPG] ✅ 第{batch_idx + 1}张图像处理完成")
            
            # 将所有处理后的图像合并为批次tensor
            if processed_images:
                batch_tensor = torch.from_numpy(np.stack(processed_images, axis=0))
                print(f"[LRPG] ✅ Transform-First批量处理完成，输出 {len(processed_images)} 张图像")
                return batch_tensor
            else:
                print(f"[LRPG] ⚠️ 没有处理任何图像")
                return image
                
        except Exception as e:
            print(f"[LRPG] ❌ Transform-First处理失败: {str(e)}")
            import traceback
            traceback.print_exc()
            return image
    
    def _create_composite_canvas(self, width, height):
        """创建空白合成画布"""
        from PIL import Image as PILImage
        return PILImage.new('RGB', (width, height), (255, 255, 255))
    
    def _process_image_layer(self, canvas, layer_data, layer_id, input_tensor, canvas_width, canvas_height):
        """处理单个图像图层"""
        try:
            import base64
            import io
            import numpy as np
            from PIL import Image as PILImage
            
            source = layer_data.get('source', 'input')
            print(f"[LRPG] 📷 图层{layer_id}源类型: {source}")
            # 🔍 调试：显示原始层数据
            debug_fabricId = layer_data.get('_debug_fabricId', 'none')
            debug_name = layer_data.get('_debug_name', 'none')
            print(f"[LRPG] 🔍 图层{layer_id}调试信息: fabricId={debug_fabricId}, name={debug_name}")
            # 🔍 CRITICAL调试：显示完整layer_data结构
            print(f"[LRPG] 🚨 CRITICAL: layer_data完整结构: {layer_data}")
            print(f"[LRPG] 🚨 CRITICAL: layer_data keys: {list(layer_data.keys())}")
            if 'image_data' in layer_data:
                image_data_len = len(str(layer_data['image_data'])) if layer_data['image_data'] else 0
                print(f"[LRPG] 🚨 CRITICAL: image_data存在且长度: {image_data_len}")
            else:
                print(f"[LRPG] 🚨 CRITICAL: image_data字段缺失")
            
            if source == 'input':
                # 输入图像：使用传入的tensor数据
                if input_tensor is not None:
                    img_array = input_tensor.cpu().numpy()
                    if img_array.max() <= 1.0:
                        img_array = (img_array * 255).astype(np.uint8)
                    else:
                        img_array = img_array.astype(np.uint8)
                    source_image = PILImage.fromarray(img_array)
                    print(f"[LRPG] ✅ 加载输入图像: {source_image.size}")
                else:
                    print(f"[LRPG] ⚠️ 输入图像tensor为空，跳过此图层")
                    return canvas  # 正确：继续处理其他图层
                    
            elif source == 'upload':
                # 上传图像：解码base64数据
                image_data = layer_data.get('image_data')
                if not image_data:
                    print(f"[LRPG] ⚠️ 上传图像数据为空，跳过")
                    return canvas
                    
                try:
                    # 解码base64图像
                    if image_data.startswith('data:image/'):
                        # 完整的data URL
                        header, encoded = image_data.split(',', 1)
                        image_bytes = base64.b64decode(encoded)
                    else:
                        # 纯base64数据
                        image_bytes = base64.b64decode(image_data)
                    
                    source_image = PILImage.open(io.BytesIO(image_bytes)).convert('RGB')
                    print(f"[LRPG] ✅ 解码上传图像: {source_image.size}")
                    
                except Exception as e:
                    print(f"[LRPG] ❌ 解码上传图像失败: {str(e)}")
                    return canvas
                    
            elif source == 'annotation':
                # 标注处理：绘制几何形状
                print(f"[LRPG] 🎯 处理标注: {layer_data.get('type', 'unknown')}")
                canvas = self._draw_annotation_on_canvas(canvas, layer_data, canvas_width, canvas_height)
                return canvas
                
            else:
                print(f"[LRPG] ❓ 未知图像源类型: {source}")
                return canvas
            
            # 应用变换并合成到画布
            transformed_image = self._apply_image_transform(source_image, layer_data)
            canvas = self._composite_image_to_canvas(canvas, transformed_image, layer_data)
            
            return canvas
            
        except Exception as e:
            print(f"[LRPG] ❌ 处理图层{layer_id}失败: {str(e)}")
            return canvas
    
    def _draw_annotation_on_canvas(self, canvas, layer_data, canvas_width, canvas_height):
        """在画布上绘制标注"""
        try:
            from PIL import Image as PILImage, ImageDraw
            
            # 获取标注参数
            annotation_type = layer_data.get('type', 'rect')
            centerX = layer_data.get('centerX', 0)
            centerY = layer_data.get('centerY', 0)
            width = layer_data.get('width', 100)
            height = layer_data.get('height', 100)
            
            # 计算左上角坐标
            left = centerX - width / 2
            top = centerY - height / 2
            right = centerX + width / 2
            bottom = centerY + height / 2
            
            print(f"[LRPG] 🔲 绘制{annotation_type}标注: 中心({centerX}, {centerY}), 尺寸({width}, {height})")
            print(f"[LRPG] 📍 标注坐标: ({left}, {top}) -> ({right}, {bottom})")
            
            # 🔧 从前端数据中读取颜色和透明度信息
            # 获取颜色信息 (支持 fill 和 stroke 属性)
            color_hex = layer_data.get('fill') or layer_data.get('stroke') or '#ff0000'
            if color_hex.startswith('#'):
                color_hex = color_hex[1:]  # 去掉#号
            
            # 将十六进制颜色转换为RGB
            try:
                r = int(color_hex[0:2], 16)
                g = int(color_hex[2:4], 16) 
                b = int(color_hex[4:6], 16)
            except (ValueError, IndexError):
                r, g, b = 255, 0, 0  # 默认红色
            
            # 🔧 获取透明度信息（优化后的多路径支持）
            # 优先级：style.opacity > 直接属性 > 默认值
            opacity = None
            
            # 方法1：从style对象获取（主要路径）
            if 'style' in layer_data and layer_data['style'] and 'opacity' in layer_data['style']:
                opacity = layer_data['style'].get('opacity')
                print(f"[LRPG] 🔍 从style.opacity获取: {opacity}")
            
            # 方法2：直接从layer_data获取（备用路径）
            elif 'opacity' in layer_data:
                opacity = layer_data.get('opacity')
                print(f"[LRPG] 🔍 从layer_data.opacity获取: {opacity}")
            
            # 方法3：尝试从其他可能的路径获取
            elif 'fill_opacity' in layer_data:
                opacity = layer_data.get('fill_opacity')
                print(f"[LRPG] 🔍 从fill_opacity获取: {opacity}")
                
            # 默认值
            if opacity is None:
                opacity = 0.5  # 默认50%透明度
                print(f"[LRPG] 🔍 使用默认opacity: {opacity}")
            
            # 确保opacity在正确范围内
            if opacity > 1:
                opacity = opacity / 100.0  # 如果是百分比形式，转换为小数
            
            alpha = int(opacity * 255)
            
            # 🔧 调试：打印style内容确认修复效果
            if 'style' in layer_data:
                print(f"[LRPG] 🔍 style内容: {layer_data.get('style', {})}")
            
            print(f"[LRPG] 🎨 标注样式: 颜色=#{color_hex}, 透明度={opacity:.2f} (alpha={alpha})")
            
            # 🔧 使用透明度混合绘制方法
            if opacity < 1.0:  # 需要透明度
                # 创建一个RGBA透明图层用于绘制标注
                annotation_layer = PILImage.new('RGBA', canvas.size, (0, 0, 0, 0))
                draw_layer = ImageDraw.Draw(annotation_layer)
                
                # 设置绘制样式（RGBA颜色）
                outline_color = (r, g, b, 255)  # 边框完全不透明
                fill_color = (r, g, b, alpha)   # 填充使用设置的透明度
                
                if annotation_type == 'rect':
                    # 在透明图层上绘制矩形
                    draw_layer.rectangle([left, top, right, bottom], outline=outline_color, fill=fill_color, width=2)
                    print(f"[LRPG] ✅ 透明矩形标注已绘制到图层")
                    
                elif annotation_type == 'circle':
                    # 在透明图层上绘制圆形/椭圆
                    draw_layer.ellipse([left, top, right, bottom], outline=outline_color, fill=fill_color, width=2)
                    print(f"[LRPG] ✅ 透明圆形标注已绘制到图层")
                    
                elif annotation_type == 'polygon':
                    # 绘制多边形
                    points = layer_data.get('points', [])
                    if points and len(points) >= 3:
                        # 将points转换为PIL格式的坐标列表 [(x1,y1), (x2,y2), ...]
                        polygon_coords = []
                        for point in points:
                            if isinstance(point, dict) and 'x' in point and 'y' in point:
                                polygon_coords.extend([point['x'], point['y']])
                            elif isinstance(point, (list, tuple)) and len(point) >= 2:
                                polygon_coords.extend([point[0], point[1]])
                        
                        if len(polygon_coords) >= 6:  # 至少3个点
                            draw_layer.polygon(polygon_coords, outline=outline_color, fill=fill_color)
                            print(f"[LRPG] ✅ 透明多边形标注已绘制到图层: {len(points)} 个点")
                        else:
                            print(f"[LRPG] ⚠️ 多边形坐标数据不足: {polygon_coords}")
                    else:
                        print(f"[LRPG] ⚠️ 多边形缺少points数据: {points}")
                        
                elif annotation_type == 'text' or annotation_type == 'i-text':
                    # 🎯 新增：文字标注绘制（透明版）
                    text_content = layer_data.get('text', 'Text')
                    font_size = layer_data.get('fontSize', 20)
                    
                    try:
                        from PIL import ImageFont
                        import os
                        
                        # 中文字体回退列表
                        chinese_fonts = [
                            "C:/Windows/Fonts/msyh.ttf",      # 微软雅黑
                            "C:/Windows/Fonts/simsun.ttc",    # 宋体
                            "C:/Windows/Fonts/simhei.ttf",    # 黑体
                            "C:/Windows/Fonts/simkai.ttf",    # 楷体
                            "msyh.ttf",                       # 系统路径微软雅黑
                            "simsun.ttc",                     # 系统路径宋体
                            "simhei.ttf"                      # 系统路径黑体
                        ]
                        
                        font = None
                        for font_path in chinese_fonts:
                            try:
                                if os.path.exists(font_path) or not font_path.startswith("C:/"):
                                    font = ImageFont.truetype(font_path, font_size)
                                    print(f"[LRPG] ✅ 成功加载中文字体: {font_path}")
                                    break
                            except Exception as e:
                                print(f"[LRPG] ⚠️ 字体加载失败 {font_path}: {str(e)}")
                                continue
                        
                        if font is None:
                            font = ImageFont.load_default()
                            print(f"[LRPG] ⚠️ 使用默认字体，可能不支持中文")
                        
                        # 计算文字位置 (centerX, centerY 为中心点)
                        text_x = int(centerX - width / 2)
                        text_y = int(centerY - height / 2)
                        
                        # 在透明图层上绘制文字
                        draw_layer.text((text_x, text_y), text_content, font=font, fill=fill_color)
                        print(f"[LRPG] ✅ 透明文字标注已绘制: '{text_content}'")
                        
                    except Exception as e:
                        print(f"[LRPG] ❌ 文字标注绘制失败: {str(e)}")
                        # 回退：使用基本绘制
                        draw_layer.text((int(centerX), int(centerY)), text_content, fill=fill_color)
                        
                else:
                    print(f"[LRPG] ⚠️ 未支持的标注类型: {annotation_type}")
                
                # 🎨 将透明图层混合到主画布上
                if canvas.mode != 'RGBA':
                    canvas = canvas.convert('RGBA')
                canvas = PILImage.alpha_composite(canvas, annotation_layer)
                # 转换回RGB（如果需要）
                if canvas.mode == 'RGBA':
                    # 创建白色背景并合成
                    background = PILImage.new('RGB', canvas.size, (255, 255, 255))
                    background.paste(canvas, mask=canvas.split()[-1])  # 使用alpha通道作为mask
                    canvas = background
                    
                print(f"[LRPG] ✅ 透明标注已混合到主画布")
                
            else:  # 完全不透明，使用原来的方法
                draw = ImageDraw.Draw(canvas)
                # 设置绘制样式（RGB颜色）
                outline_color = (r, g, b)
                fill_color = (r, g, b)
                
                if annotation_type == 'rect':
                    # 绘制矩形
                    draw.rectangle([left, top, right, bottom], outline=outline_color, fill=fill_color, width=2)
                    print(f"[LRPG] ✅ 不透明矩形标注已绘制")
                    
                elif annotation_type == 'circle':
                    # 绘制圆形/椭圆
                    draw.ellipse([left, top, right, bottom], outline=outline_color, fill=fill_color, width=2)
                    print(f"[LRPG] ✅ 不透明圆形标注已绘制")
                    
                elif annotation_type == 'polygon':
                    # 绘制多边形
                    points = layer_data.get('points', [])
                    if points and len(points) >= 3:
                        # 将points转换为PIL格式的坐标列表 [(x1,y1), (x2,y2), ...]
                        polygon_coords = []
                        for point in points:
                            if isinstance(point, dict) and 'x' in point and 'y' in point:
                                polygon_coords.extend([point['x'], point['y']])
                            elif isinstance(point, (list, tuple)) and len(point) >= 2:
                                polygon_coords.extend([point[0], point[1]])
                        
                        if len(polygon_coords) >= 6:  # 至少3个点
                            draw.polygon(polygon_coords, outline=outline_color, fill=fill_color)
                            print(f"[LRPG] ✅ 不透明多边形标注已绘制: {len(points)} 个点")
                        else:
                            print(f"[LRPG] ⚠️ 多边形坐标数据不足: {polygon_coords}")
                    else:
                        print(f"[LRPG] ⚠️ 多边形缺少points数据: {points}")
                        
                elif annotation_type == 'text' or annotation_type == 'i-text':
                    # 🎯 新增：文字标注绘制（不透明版）
                    text_content = layer_data.get('text', 'Text')
                    font_size = layer_data.get('fontSize', 20)
                    
                    try:
                        from PIL import ImageFont
                        import os
                        
                        # 中文字体回退列表
                        chinese_fonts = [
                            "C:/Windows/Fonts/msyh.ttf",      # 微软雅黑
                            "C:/Windows/Fonts/simsun.ttc",    # 宋体
                            "C:/Windows/Fonts/simhei.ttf",    # 黑体
                            "C:/Windows/Fonts/simkai.ttf",    # 楷体
                            "msyh.ttf",                       # 系统路径微软雅黑
                            "simsun.ttc",                     # 系统路径宋体
                            "simhei.ttf"                      # 系统路径黑体
                        ]
                        
                        font = None
                        for font_path in chinese_fonts:
                            try:
                                if os.path.exists(font_path) or not font_path.startswith("C:/"):
                                    font = ImageFont.truetype(font_path, font_size)
                                    print(f"[LRPG] ✅ 成功加载中文字体: {font_path}")
                                    break
                            except Exception as e:
                                print(f"[LRPG] ⚠️ 字体加载失败 {font_path}: {str(e)}")
                                continue
                        
                        if font is None:
                            font = ImageFont.load_default()
                            print(f"[LRPG] ⚠️ 使用默认字体，可能不支持中文")
                        
                        # 计算文字位置 (centerX, centerY 为中心点)
                        text_x = int(centerX - width / 2)
                        text_y = int(centerY - height / 2)
                        
                        # 绘制文字
                        draw.text((text_x, text_y), text_content, font=font, fill=fill_color)
                        print(f"[LRPG] ✅ 不透明文字标注已绘制: '{text_content}'")
                        
                    except Exception as e:
                        print(f"[LRPG] ❌ 文字标注绘制失败: {str(e)}")
                        # 回退：使用基本绘制
                        draw.text((int(centerX), int(centerY)), text_content, fill=fill_color)
                        
                else:
                    print(f"[LRPG] ⚠️ 未支持的标注类型: {annotation_type}")
            
            return canvas
            
        except Exception as e:
            print(f"[LRPG] ❌ 绘制标注失败: {str(e)}")
            return canvas
    
    def _apply_image_transform(self, image, layer_data):
        """对图像应用变换"""
        try:
            from PIL import Image as PILImage
            # 获取变换参数
            scaleX = layer_data.get('scaleX', 1)
            scaleY = layer_data.get('scaleY', 1)
            angle = layer_data.get('angle', 0)
            flipX = layer_data.get('flipX', False)
            flipY = layer_data.get('flipY', False)
            
            # 应用缩放
            if scaleX != 1 or scaleY != 1:
                new_width = int(image.width * scaleX)
                new_height = int(image.height * scaleY)
                image = image.resize((new_width, new_height), PILImage.LANCZOS)
                print(f"[LRPG] 📏 图像缩放: {scaleX}x{scaleY} -> {image.size}")
            
            # 应用旋转
            if angle != 0:
                image = image.rotate(-angle, expand=True, fillcolor=(255, 255, 255))
                print(f"[LRPG] 🔄 图像旋转: {angle}度")
            
            # 应用翻转
            if flipX:
                image = image.transpose(PILImage.FLIP_LEFT_RIGHT)
                print(f"[LRPG] ↔️ 水平翻转")
            if flipY:
                image = image.transpose(PILImage.FLIP_TOP_BOTTOM)
                print(f"[LRPG] ↕️ 垂直翻转")
            
            return image
            
        except Exception as e:
            print(f"[LRPG] ❌ 图像变换失败: {str(e)}")
            return image
    
    def _composite_image_to_canvas(self, canvas, image, layer_data):
        """将变换后的图像合成到画布上"""
        try:
            from PIL import Image as PILImage
            # 计算粘贴位置（从中心点坐标转换为左上角坐标）
            centerX = layer_data.get('centerX', 0)
            centerY = layer_data.get('centerY', 0)
            
            left = int(centerX - image.width / 2)
            top = int(centerY - image.height / 2)
            
            print(f"[LRPG] 📍 图像定位: 中心({centerX}, {centerY}) -> 左上角({left}, {top})")
            
            # 创建带透明度的图像用于合成
            if image.mode != 'RGBA':
                image = image.convert('RGBA')
            
            # 粘贴到画布
            if canvas.mode != 'RGBA':
                canvas = canvas.convert('RGBA')
            
            canvas.paste(image, (left, top), image)
            
            # 转换回RGB
            if canvas.mode == 'RGBA':
                canvas = canvas.convert('RGB')
            
            print(f"[LRPG] ✅ 图像已合成到画布")
            return canvas
            
        except Exception as e:
            print(f"[LRPG] ❌ 图像合成失败: {str(e)}")
            return canvas
            
    def _apply_single_layer_transform(self, canvas, layer_data, draw, actual_canvas_width, actual_canvas_height):
        """对单个图层应用变换"""
        try:
            if not layer_data:
                return canvas
                
            # ✅ LRPG统一格式：直接提取参数
            layer_type = layer_data.get('type', 'image')
            centerX = layer_data.get('centerX', 0)
            centerY = layer_data.get('centerY', 0)
            scaleX = layer_data.get('scaleX', 1)
            scaleY = layer_data.get('scaleY', 1)
            angle = layer_data.get('angle', 0)
            width = layer_data.get('width', 100)
            height = layer_data.get('height', 100)
            flipX = layer_data.get('flipX', False)
            flipY = layer_data.get('flipY', False)
            crop_path = layer_data.get('crop_path', [])
            
            print(f"[LRPG] 📍 LRPG变换参数:")
            print(f"  - 中心点: ({centerX:.1f}, {centerY:.1f})")
            print(f"  - 缩放: {scaleX:.3f} x {scaleY:.3f}")
            print(f"  - 旋转: {angle:.1f}°")
            print(f"  - 翻转: X={flipX}, Y={flipY}")
            print(f"  - 裁切: {len(crop_path)} 个点")
            
            # ✅ LRPG架构：只对标注图层应用定位变换，输入图像直接处理
            if layer_type != 'image':
                return self._apply_lrpg_transform_to_image(
                    canvas, centerX, centerY, scaleX, scaleY, angle, 
                    flipX, flipY, crop_path
                )
            
            if layer_type == 'image':
                # 🚀 LRPG架构：输入图像直接变换，无需重新定位
                print(f"[LRPG] 🖼️ 处理输入图像变换")
                
                # 检查是否需要应用变换
                needs_transform = (abs(angle) > 0.1 or abs(scaleX - 1) > 0.01 or 
                                 abs(scaleY - 1) > 0.01 or flipX or flipY)
                
                if needs_transform:
                    print(f"[LRPG] 🔧 在固定画布{actual_canvas_width}x{actual_canvas_height}上应用图像变换:")
                    print(f"  - 缩放: ({scaleX:.3f}, {scaleY:.3f})")  
                    print(f"  - 旋转: {angle:.1f}°")
                    print(f"  - 翻转: X={flipX}, Y={flipY}")
                    
                    # ✅ 保持画布尺寸，在画布上应用变换
                    # 1. 先对图像应用变换
                    work_image = canvas.copy()
                    
                    if abs(scaleX - 1) > 0.01 or abs(scaleY - 1) > 0.01:
                        new_width = int(canvas.size[0] * scaleX)
                        new_height = int(canvas.size[1] * scaleY)
                        work_image = work_image.resize((new_width, new_height), PILImage.Resampling.LANCZOS)
                        print(f"[LRPG] 📏 图像缩放至: {new_width}x{new_height}")
                        
                    if flipX:
                        work_image = work_image.transpose(PILImage.Transpose.FLIP_LEFT_RIGHT)
                        print(f"[LRPG] ↔️ 图像X轴翻转")
                    if flipY:
                        work_image = work_image.transpose(PILImage.Transpose.FLIP_TOP_BOTTOM) 
                        print(f"[LRPG] ↕️ 图像Y轴翻转")
                        
                    if abs(angle) > 0.1:
                        work_image = work_image.rotate(-angle, expand=True, fillcolor=(255, 255, 255))
                        print(f"[LRPG] 🔄 图像旋转: {angle}°")
                    
                    # 2. 创建固定尺寸画布并按前端位置放置变换后的图像
                    final_canvas = PILImage.new('RGB', (actual_canvas_width, actual_canvas_height), (255, 255, 255))
                    
                    # ✅ LRPG统一坐标系：模仿lg_tools，中心点转左上角（PIL标准）
                    work_width, work_height = work_image.size
                    paste_x = int(centerX - work_width / 2)
                    paste_y = int(centerY - work_height / 2)
                    
                    print(f"[LRPG] 📍 统一坐标转换: 中心点({centerX}, {centerY}) -> 左上角({paste_x}, {paste_y})")
                    
                    # 确保图像不完全超出画布范围
                    paste_x = max(-work_width//2, min(paste_x, actual_canvas_width - work_width//2))
                    paste_y = max(-work_height//2, min(paste_y, actual_canvas_height - work_height//2))
                    
                    print(f"[LRPG] 🎯 边界修正后粘贴位置: ({paste_x}, {paste_y})")
                    
                    final_canvas.paste(work_image, (paste_x, paste_y))
                    canvas = final_canvas
                    
                    print(f"[LRPG] ✅ 图像变换完成，变换后图像{work_width}x{work_height}已放置在{actual_canvas_width}x{actual_canvas_height}画布的({paste_x}, {paste_y})位置")
                else:
                    print(f"[LRPG] ℹ️ 输入图像无需变换，保持画布尺寸{actual_canvas_width}x{actual_canvas_height}")
                
                # ✂️ 处理输入图像的裁切路径
                if len(crop_path) >= 3:
                    print(f"[LRPG] ✂️ 对输入图像应用裁切，路径点数: {len(crop_path)}")
                    canvas = self._apply_lrpg_crop(canvas, crop_path)
                    print(f"[LRPG] ✅ 输入图像裁切完成")
                else:
                    if len(crop_path) == 0:
                        print(f"[LRPG] ✅ 输入图像无需裁切 - 接收到已处理图像或无裁切操作")
                    else:
                        print(f"[LRPG] ⚠️ 裁切路径点数不足({len(crop_path)}个)，跳过裁切")
            
            return canvas
            
        except Exception as e:
            print(f"[LRPG] ❌ 单图层变换失败: {str(e)}")
            import traceback
            traceback.print_exc()
            return canvas
    
    def _apply_crop_to_pil(self, pil_image, crop_transforms):
        """对PIL图像应用裁切变换"""
        try:
            from PIL import Image, ImageDraw
            import numpy as np
            
            for crop_transform in crop_transforms:
                if crop_transform.get('type') == 'crop_mask':
                    crop_path = crop_transform.get('crop_path', [])
                    if len(crop_path) < 3:
                        continue
                    
                    # 创建蒙版
                    mask = Image.new('L', pil_image.size, 0)
                    draw = ImageDraw.Draw(mask)
                    
                    # 转换路径点
                    polygon_points = [(int(point['x']), int(point['y'])) for point in crop_path]
                    draw.polygon(polygon_points, fill=255)
                    
                    # 应用蒙版
                    result = Image.new('RGBA', pil_image.size, (0, 0, 0, 0))
                    result.paste(pil_image, mask=mask)
                    pil_image = result.convert('RGB')
                    
            return pil_image
        except Exception as e:
            print(f"[LRPG] ❌ PIL裁切失败: {str(e)}")
            return pil_image
    
    def _apply_crop_transform(self, image, crop_transform):
        """应用Transform-First裁切变换到图像"""
        try:
            import cv2
            import numpy as np
            from PIL import Image, ImageDraw
            
            # 获取裁切路径点
            crop_path = crop_transform.get('crop_path', [])
            if len(crop_path) < 3:
                print(f"[LRPG] ⚠️ 裁切路径点数不足，跳过裁切")
                return image
            
            # 将tensor转换为numpy数组
            if len(image.shape) == 4:
                img_array = image[0].numpy()  # 取第一个batch
            else:
                img_array = image.numpy()
                
            # 确保值在0-255范围内
            if img_array.max() <= 1.0:
                img_array = (img_array * 255).astype(np.uint8)
            else:
                img_array = img_array.astype(np.uint8)
            
            height, width = img_array.shape[:2]
            
            # 创建蒙版
            mask = Image.new('L', (width, height), 0)
            draw = ImageDraw.Draw(mask)
            
            # 将裁切路径转换为PIL坐标
            polygon_points = [(int(point['x']), int(point['y'])) for point in crop_path]
            
            # 绘制裁切区域（白色为保留区域）
            draw.polygon(polygon_points, fill=255)
            
            # 将蒙版转换为numpy数组
            mask_array = np.array(mask)
            
            # 应用蒙版到图像
            if len(img_array.shape) == 3:  # RGB图像
                # 将蒙版应用到每个通道
                for i in range(3):
                    img_array[:, :, i] = np.where(mask_array > 0, img_array[:, :, i], 0)
            
            # 转换回tensor
            result_tensor = torch.from_numpy(img_array.astype(np.float32) / 255.0)
            
            # 确保维度正确
            if len(result_tensor.shape) == 3:
                result_tensor = result_tensor.unsqueeze(0)
            
            print(f"[LRPG] ✂️ 裁切变换完成，处理了 {len(polygon_points)} 个路径点")
            return result_tensor
            
        except Exception as e:
            print(f"[LRPG] ❌ 裁切变换失败: {str(e)}")
            return image  # 失败时返回原图
    
    def _generate_transform_based_prompt(self, transform_data, user_prompt, constraint_prompts, decorative_prompts, 
                                       operation_type="custom", target_description=""):
        """基于Transform数据生成提示词"""
        if user_prompt and user_prompt.strip():
            print(f"[LRPG] ✅ 使用用户编辑的提示词")
            return user_prompt.strip()
        
        # 基于operation_type生成结构化提示词
        print(f"[LRPG] 🤖 自动生成提示词 - 操作类型: {operation_type}")
        
        # 操作类型模板
        operation_templates = {
            'add_object': lambda desc: f"add {desc or 'a new object'} to the image",
            'change_color': lambda desc: f"make the selected area {desc or 'red'}",
            'change_style': lambda desc: f"turn the selected area into {desc or 'cartoon'} style",
            'replace_object': lambda desc: f"replace the selected area with {desc or 'a different object'}",
            'remove_object': lambda desc: "remove the selected area",
            'enhance_quality': lambda desc: "enhance the image quality",
            'custom': lambda desc: desc or "apply modifications to the image"
        }
        
        # 生成基础提示词
        template_func = operation_templates.get(operation_type, operation_templates['custom'])
        base_prompt = template_func(target_description)
        
        prompt_parts = [base_prompt]
        
        # 如果有transform数据，添加变换信息
        if transform_data:
            layer_count = len(transform_data)
            print(f"[LRPG] 📊 应用了 {layer_count} 个图层变换")
        
        # 添加约束提示词
        if constraint_prompts:
            prompt_parts.extend(constraint_prompts)
        
        # 添加装饰提示词  
        if decorative_prompts:
            prompt_parts.extend(decorative_prompts)
        
        final_prompt = ", ".join(prompt_parts)
        print(f"[LRPG] 🤖 自动生成Transform提示词: {final_prompt[:100]}...")
        
        return final_prompt
    
    def _build_enhanced_prompts(self, constraint_prompts, decorative_prompts):
        """构建增强提示词JSON"""
        enhanced_data = {
            "constraint_prompts": constraint_prompts,
            "decorative_prompts": decorative_prompts,
            "version": "transform_first_1.0"
        }
        return json.dumps(enhanced_data)
    
    # ===== Kontext分辨率独立HD还原算法核心方法 =====
    
    def _calculate_hd_scale(self, transform_data, canvas_data, image_shape):
        """计算HD还原缩放比例 - Kontext分辨率独立算法"""
        try:
            # 获取画布实际尺寸
            canvas_width = canvas_data.get('width', 800)
            canvas_height = canvas_data.get('height', 600)
            
            # 获取图像实际分辨率
            if len(image_shape) >= 3:
                img_height, img_width = image_shape[1], image_shape[2]
            else:
                img_height, img_width = image_shape[0], image_shape[1]
            
            # 找到主要的图像图层来计算缩放比例
            image_layer = None
            for layer_id, layer_data in transform_data.items():
                if layer_data.get('type') == 'image':
                    image_layer = layer_data
                    break
            
            if not image_layer:
                print(f"[LRPG] ⚠️ 未找到图像图层，使用默认缩放比例1.0")
                return 1.0
            
            # ✅ Kontext算法：计算前端显示vs高清原图的比例
            frontend_width = image_layer.get('width', img_width)
            frontend_height = image_layer.get('height', img_height)
            
            # 处理显示缩放的影响
            display_scale_info = image_layer.get('display_scale', {})
            if display_scale_info.get('optimized', False):
                frontend_scale = display_scale_info.get('scaleX', 1)
                actual_frontend_width = frontend_width * frontend_scale
                actual_frontend_height = frontend_height * frontend_scale
            else:
                actual_frontend_width = frontend_width
                actual_frontend_height = frontend_height
            
            # 计算HD还原比例
            scale_x = img_width / actual_frontend_width if actual_frontend_width > 0 else 1.0
            scale_y = img_height / actual_frontend_height if actual_frontend_height > 0 else 1.0
            
            # 使用最小的缩放比例保持宽高比
            hd_scale = min(scale_x, scale_y)
            
            print(f"[LRPG] 🔬 HD缩放比例计算:")
            print(f"  - 原图尺寸: {img_width} x {img_height}")
            print(f"  - 前端尺寸: {actual_frontend_width:.1f} x {actual_frontend_height:.1f}")
            print(f"  - 缩放比例: X={scale_x:.3f}, Y={scale_y:.3f}")
            print(f"  - 最终HD比例: {hd_scale:.3f}")
            
            return max(hd_scale, 0.1)  # 确保比例不会过小
            
        except Exception as e:
            print(f"[LRPG] ❌ HD缩放比例计算失败: {str(e)}")
            return 1.0
    
    def _scale_hd_transforms(self, transform_data, scale):
        """将前端显示变换映射到高分辨率变换 - Kontext分辨率独立算法"""
        try:
            hd_transform_data = {}
            
            for layer_id, layer_data in transform_data.items():
                if layer_data.get('type') == 'image':
                    # ✅ Kontext算法：图像图层的HD变换映射
                    hd_transform_data[layer_id] = {
                        'centerX': layer_data.get('centerX', 0) * scale,     # 中心点X按比例映射
                        'centerY': layer_data.get('centerY', 0) * scale,     # 中心点Y按比例映射
                        'scaleX': layer_data.get('scaleX', 1) * scale,       # 缩放叠加
                        'scaleY': layer_data.get('scaleY', 1) * scale,       # 缩放叠加
                        'angle': layer_data.get('angle', 0),                # 角度保持不变
                        'width': layer_data.get('width', 100),              # 原始尺寸不变
                        'height': layer_data.get('height', 100),            # 原始尺寸不变
                        'flipX': layer_data.get('flipX', False),            # 翻转不变
                        'flipY': layer_data.get('flipY', False),            # 翻转不变
                        'type': layer_data.get('type'),
                        'hd_scale_applied': scale,
                        # 🚀 CRITICAL: 保留图像源信息和数据
                        'source': layer_data.get('source'),
                        'image_data': layer_data.get('image_data'),
                        '_debug_fabricId': layer_data.get('_debug_fabricId'),
                        '_debug_name': layer_data.get('_debug_name'),
                        'crop_path': layer_data.get('crop_path', [])
                    }
                else:
                    # 标注图层的HD变换映射
                    hd_layer_data = {
                        'centerX': layer_data.get('centerX', 0) * scale,
                        'centerY': layer_data.get('centerY', 0) * scale,
                        'scaleX': layer_data.get('scaleX', 1),              # 标注缩放保持不变
                        'scaleY': layer_data.get('scaleY', 1),
                        'angle': layer_data.get('angle', 0),
                        'width': layer_data.get('width', 100) * scale,      # 标注尺寸按比例映射
                        'height': layer_data.get('height', 100) * scale,
                        'flipX': layer_data.get('flipX', False),
                        'flipY': layer_data.get('flipY', False),
                        'type': layer_data.get('type'),
                        'style': layer_data.get('style', {}),
                        'hd_scale_applied': scale,
                        # 🚀 CRITICAL: 保留标注源信息
                        'source': layer_data.get('source'),
                        '_debug_fabricId': layer_data.get('_debug_fabricId'),
                        '_debug_name': layer_data.get('_debug_name')
                    }
                    
                    # 🔧 针对不同类型标注添加特殊属性
                    annotation_type = layer_data.get('type')
                    if annotation_type == 'polygon':
                        # 为多边形添加points数据，并缩放坐标
                        original_points = layer_data.get('points', [])
                        if original_points:
                            hd_layer_data['points'] = [
                                {'x': point.get('x', 0) * scale, 'y': point.get('y', 0) * scale}
                                for point in original_points
                            ]
                            print(f"[LRPG] 🎯 HD缩放多边形points: {len(original_points)} 个点，缩放比例: {scale}")
                        else:
                            hd_layer_data['points'] = []
                            print(f"[LRPG] ⚠️ 多边形没有points数据")
                    elif annotation_type == 'path':
                        # 为路径添加path数据
                        hd_layer_data['path'] = layer_data.get('path', [])
                    elif annotation_type == 'text' or annotation_type == 'i-text':
                        # 🎯 新增：为文字标注添加文字相关数据
                        hd_layer_data['text'] = layer_data.get('text', 'Text')
                        hd_layer_data['fontSize'] = layer_data.get('fontSize', 20) * scale  # 🔧 字体大小按HD比例缩放
                        hd_layer_data['fontFamily'] = layer_data.get('fontFamily', 'Arial')
                        hd_layer_data['fontWeight'] = layer_data.get('fontWeight', 'normal')
                        hd_layer_data['textAlign'] = layer_data.get('textAlign', 'left')
                        print(f"[LRPG] 🎯 HD缩放文字标注: 原始字体大小{layer_data.get('fontSize', 20)} -> HD字体大小{hd_layer_data['fontSize']}")
                    
                    hd_transform_data[layer_id] = hd_layer_data
                
                print(f"[LRPG] 🔄 HD映射图层 {layer_id}:")
                print(f"  - 原始中心: ({layer_data.get('centerX', 0):.1f}, {layer_data.get('centerY', 0):.1f})")
                print(f"  - HD中心: ({hd_transform_data[layer_id]['centerX']:.1f}, {hd_transform_data[layer_id]['centerY']:.1f})")
            
            return hd_transform_data
            
        except Exception as e:
            print(f"[LRPG] ❌ HD变换映射失败: {str(e)}")
            return transform_data
    
    def _apply_affine_transform_on_canvas(self, canvas, centerX, centerY, scaleX, scaleY, angle, flipX, flipY, canvas_width, canvas_height):
        """✅ Kontext核心：仿射变换矩阵在固定画布内数学重建"""
        try:
            from PIL import Image, ImageDraw
            import numpy as np
            import math
            
            print(f"[LRPG] 🔧 应用仿射变换:")
            print(f"  - 中心: ({centerX:.1f}, {centerY:.1f})")
            print(f"  - 缩放: ({scaleX:.3f}, {scaleY:.3f})")
            print(f"  - 旋转: {angle:.1f}°")
            print(f"  - 翻转: X={flipX}, Y={flipY}")
            
            # ✅ LRPG架构：在固定画布尺寸内应用变换
            if abs(angle) > 0.1:
                # 使用仿射变换在画布中心进行旋转
                # 计算旋转中心点（基于用户在前端的操作）
                rotation_center_x = centerX
                rotation_center_y = centerY
                
                # 如果旋转中心超出画布范围，调整到画布内
                rotation_center_x = max(0, min(canvas_width, rotation_center_x))
                rotation_center_y = max(0, min(canvas_height, rotation_center_y))
                
                print(f"[LRPG] 🔄 以点({rotation_center_x:.1f}, {rotation_center_y:.1f})为中心旋转{angle:.1f}°")
                
                # ✅ 关键：保持画布尺寸，只在内部旋转
                rotated_canvas = canvas.rotate(
                    angle, 
                    center=(rotation_center_x, rotation_center_y), 
                    fillcolor='white',
                    expand=False  # ✅ 关键：不扩展画布，保持固定尺寸
                )
                
                # 确保画布尺寸完全一致
                if rotated_canvas.size != (canvas_width, canvas_height):
                    print(f"[LRPG] ⚠️ 画布尺寸不一致，调整: {rotated_canvas.size} -> ({canvas_width}, {canvas_height})")
                    # 如果尺寸不一致，裁剪或填充到目标尺寸
                    temp_canvas = Image.new('RGB', (canvas_width, canvas_height), 'white')
                    
                    # 计算居中粘贴的位置
                    paste_x = (canvas_width - rotated_canvas.size[0]) // 2
                    paste_y = (canvas_height - rotated_canvas.size[1]) // 2
                    temp_canvas.paste(rotated_canvas, (paste_x, paste_y))
                    rotated_canvas = temp_canvas
                
                canvas = rotated_canvas
                print(f"[LRPG] ✅ 旋转完成，保持画布尺寸: {canvas.size}")
            
            # 处理翻转变换
            if flipX or flipY:
                if flipX and not flipY:
                    canvas = canvas.transpose(Image.FLIP_LEFT_RIGHT)
                    print(f"[LRPG] ↔️ 应用X轴翻转")
                elif flipY and not flipX:
                    canvas = canvas.transpose(Image.FLIP_TOP_BOTTOM)
                    print(f"[LRPG] ↕️ 应用Y轴翻转")
                elif flipX and flipY:
                    canvas = canvas.transpose(Image.FLIP_LEFT_RIGHT).transpose(Image.FLIP_TOP_BOTTOM)
                    print(f"[LRPG] ↔️↕️ 应用双轴翻转")
            
            # ✅ 最终验证：确保画布尺寸完全正确
            final_size = canvas.size
            if final_size != (canvas_width, canvas_height):
                print(f"[LRPG] 🔧 最终尺寸调整: {final_size} -> ({canvas_width}, {canvas_height})")
                canvas = canvas.resize((canvas_width, canvas_height), Image.LANCZOS)
            
            print(f"[LRPG] ✅ 仿射变换完成，最终画布尺寸: {canvas.size}")
            return canvas
            
        except Exception as e:
            print(f"[LRPG] ❌ 仿射变换失败: {str(e)}")
            import traceback
            traceback.print_exc()
            return canvas

    # ===== 废弃旧方法的存根，保持兼容性 =====
    
    def _render_annotations_on_image(self, image, layers_data, include_annotation_numbers=True, annotation_data_json=None):
        """
        废弃方法 - Transform-First架构不再使用annotation渲染
        保留存根确保兼容性
        """
        print("[LRPG] ⚠️ 调用了废弃的_render_annotations_on_image方法，已重定向到Transform-First处理")
        return self._apply_transform_first_processing(image, {}, {}, 800, 600)
    
    def _apply_lrpg_transform_to_image(self, original_canvas, center_x, center_y, scale_x, scale_y, angle, flip_x, flip_y, crop_path):
        """LRPG统一格式变换处理 - 正确处理图像在画布上的定位"""
        try:
            print(f"[LRPG] 🎨 应用LRPG变换:")
            print(f"  - 中心点: ({center_x:.1f}, {center_y:.1f})")
            print(f"  - 缩放: ({scale_x:.3f}, {scale_y:.3f})")
            print(f"  - 旋转: {angle:.1f}°")
            print(f"  - 翻转: X={flip_x}, Y={flip_y}")
            print(f"  - 裁切点数: {len(crop_path)}")
            
            # 获取原始画布尺寸
            canvas_width, canvas_height = original_canvas.size
            print(f"[LRPG] 📐 画布尺寸: {canvas_width}x{canvas_height}")
            
            # 创建工作图像副本
            work_image = original_canvas.copy()
            
            # 1. 应用缩放变换
            if abs(scale_x - 1) > 0.01 or abs(scale_y - 1) > 0.01:
                print(f"[LRPG] 🔍 应用缩放变换")
                new_width = int(canvas_width * scale_x)
                new_height = int(canvas_height * scale_y) 
                work_image = work_image.resize((new_width, new_height), Image.Resampling.LANCZOS)
            
            # 2. 应用翻转变换
            if flip_x:
                work_image = work_image.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
                print(f"[LRPG] ↔️ 应用X轴翻转")
            if flip_y:
                work_image = work_image.transpose(Image.Transpose.FLIP_TOP_BOTTOM)
                print(f"[LRPG] ↕️ 应用Y轴翻转")
            
            # 3. 应用旋转变换
            if abs(angle) > 0.1:
                work_image = work_image.rotate(-angle, expand=True, fillcolor=(255, 255, 255))
                print(f"[LRPG] 🔄 应用旋转变换: {angle}°")
            
            # 4. 创建最终画布并定位图像
            final_canvas = Image.new('RGB', (canvas_width, canvas_height), (255, 255, 255))
            
            # 计算图像在画布上的位置
            img_width, img_height = work_image.size
            
            # 从中心点计算左上角位置
            paste_x = int(center_x - img_width / 2)
            paste_y = int(center_y - img_height / 2)
            
            print(f"[LRPG] 📍 图像定位: 变换后尺寸 {img_width}x{img_height}, 粘贴位置 ({paste_x}, {paste_y})")
            
            # 确保粘贴位置在画布范围内
            paste_x = max(0, min(paste_x, canvas_width))
            paste_y = max(0, min(paste_y, canvas_height))
            
            # 计算实际可粘贴的区域
            max_width = min(img_width, canvas_width - paste_x)
            max_height = min(img_height, canvas_height - paste_y)
            
            if max_width > 0 and max_height > 0:
                # 裁剪工作图像到可粘贴区域
                crop_box = (0, 0, max_width, max_height)
                cropped_image = work_image.crop(crop_box)
                final_canvas.paste(cropped_image, (paste_x, paste_y))
                print(f"[LRPG] ✅ 图像已定位到画布: 实际粘贴区域 {max_width}x{max_height}")
            else:
                print(f"[LRPG] ⚠️ 图像完全超出画布范围，使用原始图像")
                return original_canvas
            
            # 5. LRPG格式裁切处理
            if len(crop_path) >= 3:
                print(f"[LRPG] ✂️ 应用LRPG格式裁切")
                final_canvas = self._apply_lrpg_crop(final_canvas, crop_path)
            
            print(f"[LRPG] ✅ LRPG变换完成")
            return final_canvas
            
        except Exception as e:
            print(f"[LRPG] ❌ LRPG变换失败: {str(e)}")
            return original_canvas

    def _apply_lrpg_crop(self, pil_image, crop_path):
        """应用LRPG格式裁切"""
        try:
            from PIL import Image, ImageDraw
            
            # 创建蒙版
            mask = Image.new('L', pil_image.size, 0)
            draw = ImageDraw.Draw(mask)
            
            # 转换裁切路径点
            polygon_points = [(int(point.get('x', 0)), int(point.get('y', 0))) for point in crop_path]
            draw.polygon(polygon_points, fill=255)
            
            # 应用蒙版
            result = Image.new('RGBA', pil_image.size, (0, 0, 0, 0))
            result.paste(pil_image, mask=mask)
            result = result.convert('RGB')
            
            print(f"[LRPG] OK: LRPG裁切完成，使用 {len(polygon_points)} 个点")
            return result
            
        except Exception as e:
            print(f"[LRPG] ERROR: LRPG裁切失败: {str(e)}")
            return pil_image

    def _create_fallback_output(self, image = None, error_msg: str = ""):
        """LRPG Transform-First架构的错误回退处理"""
        print(f"[LRPG] Transform-First错误回退: {error_msg}")
        
        # 创建最小输出
        if TORCH_AVAILABLE and torch is not None:
            fallback_image = image if image is not None else torch.zeros((1, 800, 600, 3), dtype=torch.float32)
        else:
            # 如果没有torch，创建一个简单的占位符
            fallback_image = image if image is not None else None
        fallback_prompt = "Transform-First处理出现错误"
        fallback_transform_data = json.dumps({"status": "error", "message": error_msg})
        fallback_instruction = "请检查输入数据格式"
        
        return (fallback_image, fallback_prompt, fallback_transform_data, fallback_instruction)
    
    def __del__(self):
        """Widget架构无需析构清理"""
        pass


# Node registration - only if dependencies are available
if TORCH_AVAILABLE and NUMPY_AVAILABLE and COMFY_AVAILABLE:
    NODE_CLASS_MAPPINGS = {
        "VisualPromptEditor": VisualPromptEditor,
    }
    
    NODE_DISPLAY_NAME_MAPPINGS = {
        "VisualPromptEditor": "Visual Prompt Editor",
    }
    
    print("[OK] VisualPromptEditor node registered successfully")
else:
    NODE_CLASS_MAPPINGS = {}
    NODE_DISPLAY_NAME_MAPPINGS = {}
    
    print("[WARN] VisualPromptEditor node skipped due to missing dependencies:")
    if not TORCH_AVAILABLE:
        print("  - Missing: torch")
    if not NUMPY_AVAILABLE:
        print("  - Missing: numpy")
    if not COMFY_AVAILABLE:
        print("  - Missing: ComfyUI dependencies")
