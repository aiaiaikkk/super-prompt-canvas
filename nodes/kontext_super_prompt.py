"""
Kontext Super Prompt Node
Kontext超级提示词生成节点 - 复现Visual Prompt Editor完整功能

接收🎨 LRPG Canvas的图层信息，提供全面编辑功能：
- 局部编辑：针对选定图层的精确编辑
- 全局编辑：整体图像处理操作  
- 文字编辑：文本内容编辑和操作
- 专业操作：高级专业编辑工具
- 自动生成修饰约束性提示词
"""

import json
import base64
import time
import random
from typing import Dict, List, Any, Tuple, Optional
from datetime import datetime

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
    from server import PromptServer
    COMFY_AVAILABLE = True
except ImportError:
    COMFY_AVAILABLE = False

CATEGORY_TYPE = "🎨 LRPG Canvas"

class KontextSuperPrompt:
    """
    Kontext超级提示词生成器节点
    复现Visual Prompt Editor的完整编辑功能
    """
    
    # 基础错误处理的提示词映射 - 只保留最常用的映射
    BASIC_PROMPT_MAPPING = {
        # 基础约束性提示词
        'natural blending': '自然融合',
        'improved detail': '细节改善', 
        'professional quality': '专业品质',
        'seamless integration': '无缝集成',
        
        # 基础修饰性提示词
        'enhanced quality': '增强质量',
        'improved visual impact': '提升视觉效果',
        'professional finish': '专业完成度',
        'artistic excellence': '艺术卓越'
    }
    
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "layer_info": ("LAYER_INFO",),
                "image": ("IMAGE",),
            },
            "hidden": {
                "unique_id": "UNIQUE_ID",
                "edit_mode": (["局部编辑", "全局编辑", "文字编辑", "专业操作"], {"default": "局部编辑"}),
                "operation_type": ("STRING", {"default": "", "multiline": False}),
                "description": ("STRING", {"default": "", "multiline": True}),
                "constraint_prompts": ("STRING", {"default": "", "multiline": True}),
                "decorative_prompts": ("STRING", {"default": "", "multiline": True}),
                "selected_layers": ("STRING", {"default": "", "multiline": True}),
                "auto_generate": ("BOOLEAN", {"default": True}),
                "generated_prompt": ("STRING", {"default": "", "multiline": True}),
            },
        }
    
    RETURN_TYPES = ("IMAGE", "STRING")
    RETURN_NAMES = ("edited_image", "generated_prompt")
    FUNCTION = "process_super_prompt"
    CATEGORY = CATEGORY_TYPE
    OUTPUT_NODE = False
    
    @classmethod
    def IS_CHANGED(cls, **kwargs):
        # 强制每次都重新执行
        return float(time.time())
    
    def process_super_prompt(self, layer_info, image, unique_id="", edit_mode="局部编辑", 
                           operation_type="", description="", constraint_prompts="", 
                           decorative_prompts="", selected_layers="", auto_generate=True, 
                           generated_prompt=""):
        """
        处理Kontext超级提示词生成
        """
        try:
            print(f"[Kontext Super Prompt] 开始处理超级提示词生成，节点ID: {unique_id}")
            print(f"[Kontext Super Prompt] 编辑模式: {edit_mode}")
            print(f"[Kontext Super Prompt] 操作类型: '{operation_type}'")
            print(f"[Kontext Super Prompt] 描述: '{description}'")
            print(f"[Kontext Super Prompt] 约束提示词: '{constraint_prompts}'")
            print(f"[Kontext Super Prompt] 修饰提示词: '{decorative_prompts}'")
            print(f"[Kontext Super Prompt] 自动生成: {auto_generate}")
            print(f"[Kontext Super Prompt] 前端传来的生成提示词: '{generated_prompt}'")
            print(f"[Kontext Super Prompt] 前端传来的生成提示词长度: {len(generated_prompt)}")
            
            # 优先使用前端传来的generated_prompt，如果没有则使用后端生成
            if generated_prompt and generated_prompt.strip():
                print("[Kontext Super Prompt] 使用前端生成的提示词")
                final_generated_prompt = generated_prompt.strip()
            else:
                print("[Kontext Super Prompt] 前端未提供提示词，使用后端生成")
                # 解析图层信息
                parsed_layer_info = self.parse_layer_info(layer_info)
                
                # 解析选中的图层
                selected_layer_ids = self.parse_selected_layers(selected_layers)
                
                # 解析约束性和修饰性提示词
                constraint_list = self.parse_prompt_list(constraint_prompts)
                decorative_list = self.parse_prompt_list(decorative_prompts)
                
                # 生成基础fallback提示词
                positive_prompt, negative_prompt, full_description = self.generate_basic_fallback_prompts(
                    edit_mode=edit_mode,
                    operation_type=operation_type,
                    description=description,
                    constraint_prompts=constraint_list,
                    decorative_prompts=decorative_list
                )
                
                # 合并所有提示词信息为一个完整的生成提示词
                final_generated_prompt = f"{positive_prompt}\n\nNegative: {negative_prompt}\n\n{full_description}"
            
            # 构建编辑数据（用于调试和扩展）
            edit_data = {
                'node_id': unique_id,
                'edit_mode': edit_mode,
                'operation_type': operation_type,
                'description': description,
                'generated_prompt_source': 'frontend' if generated_prompt and generated_prompt.strip() else 'backend',
                'timestamp': time.time()
            }
            
            print(f"[Kontext Super Prompt] 最终生成提示词来源: {edit_data['generated_prompt_source']}")
            return (image, final_generated_prompt)
            
        except Exception as e:
            print(f"[Kontext Super Prompt] 处理错误: {str(e)}")
            import traceback
            traceback.print_exc()
            
            # 返回默认值
            default_edit_data = {
                'node_id': unique_id,
                'edit_mode': edit_mode,
                'error': str(e),
                'timestamp': time.time()
            }
            return (image, "处理出错：" + str(e))
    
    def parse_layer_info(self, layer_info):
        """解析图层信息"""
        if isinstance(layer_info, dict):
            return layer_info
        return {}
    
    def parse_selected_layers(self, selected_layers_str):
        """解析选中的图层"""
        if not selected_layers_str:
            return []
        try:
            return json.loads(selected_layers_str)
        except:
            return []
    
    def parse_prompt_list(self, prompt_str):
        """解析提示词列表"""
        if not prompt_str:
            return []
        
        # 支持多种分隔符
        prompts = []
        for line in prompt_str.split('\n'):
            line = line.strip()
            if line:
                # 支持逗号分隔
                if ',' in line:
                    prompts.extend([p.strip() for p in line.split(',') if p.strip()])
                else:
                    prompts.append(line)
        return prompts
    
    def translate_basic_prompts(self, prompts):
        """将基础英文提示词转换为中文显示"""
        translated = []
        for prompt in prompts:
            if prompt in self.BASIC_PROMPT_MAPPING:
                translated.append(self.BASIC_PROMPT_MAPPING[prompt])
            else:
                translated.append(prompt)  # 保持原文，如果没有映射
        return translated
    
    def generate_fallback_prompt(self, edit_mode, operation_type, description):
        """生成基础fallback提示词 - 仅在前端未提供时使用"""
        # 基础提示词模板
        basic_templates = {
            'change_color': f'change color to {description or "specified color"}',
            'blur_background': f'blur background while keeping {description or "subject"} sharp',
            'enhance_quality': f'enhance quality of {description or "image"}',
        }
        
        # 基础约束和修饰词
        basic_constraints = ['natural blending', 'seamless integration']
        basic_decoratives = ['improved detail', 'enhanced quality']
        
        # 构建基础提示词
        if operation_type and operation_type in basic_templates:
            base_prompt = basic_templates[operation_type]
        else:
            base_prompt = f"{edit_mode}: {description or 'apply editing'}"
        
        return base_prompt, basic_constraints, basic_decoratives
    
    def generate_basic_fallback_prompts(self, edit_mode, operation_type, description, 
                                       constraint_prompts, decorative_prompts):
        """生成基础fallback提示词 - 仅在前端完全失效时使用"""
        # 使用精简的fallback生成器
        base_prompt, basic_constraints, basic_decoratives = self.generate_fallback_prompt(
            edit_mode, operation_type, description
        )
        
        # 组合提示词
        all_constraints = constraint_prompts + basic_constraints
        all_decoratives = decorative_prompts + basic_decoratives
        
        # 构建正向提示词
        positive_parts = [base_prompt]
        if all_constraints:
            positive_parts.extend(all_constraints[:3])  # 限制数量
        if all_decoratives:
            positive_parts.extend(all_decoratives[:2])   # 限制数量
        
        positive_prompt = ", ".join(positive_parts)
        
        # 基础负向提示词
        negative_prompt = "artifacts, distortions, unnatural appearance, poor quality, inconsistencies, blurry, low quality, artifacts, distorted, unnatural, poor composition, bad anatomy, incorrect proportions"
        
        # 构建完整描述
        full_description_parts = [
            f"编辑模式：{edit_mode}",
            f"操作类型：{operation_type or '未指定'}",
            f"描述：{description or '未提供'}",
        ]
        
        if all_constraints:
            constraint_display = self.translate_basic_prompts(all_constraints[:3])
            full_description_parts.append(f"约束性提示词：{', '.join(constraint_display)}")
        
        if all_decoratives:
            decorative_display = self.translate_basic_prompts(all_decoratives[:2])
            full_description_parts.append(f"修饰性提示词：{', '.join(decorative_display)}")
        
        full_description = " | ".join(full_description_parts)
        
        return positive_prompt, negative_prompt, full_description


# 注册节点
NODE_CLASS_MAPPINGS = {
    "KontextSuperPrompt": KontextSuperPrompt,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "KontextSuperPrompt": "🎯 Kontext Super Prompt",
}

print("[Kontext Super Prompt] 🎯 Kontext超级提示词节点已注册")