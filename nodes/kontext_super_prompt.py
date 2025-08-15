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
import os
import sys
from typing import Dict, List, Any, Tuple, Optional
from datetime import datetime

# 添加节点目录到系统路径以导入其他节点
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

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
                "tab_mode": (["manual", "api", "ollama"], {"default": "manual"}),
                "edit_mode": (["局部编辑", "全局编辑", "文字编辑", "专业操作"], {"default": "局部编辑"}),
                "operation_type": ("STRING", {"default": "", "multiline": False}),
                "description": ("STRING", {"default": "", "multiline": True}),
                "constraint_prompts": ("STRING", {"default": "", "multiline": True}),
                "decorative_prompts": ("STRING", {"default": "", "multiline": True}),
                "selected_layers": ("STRING", {"default": "", "multiline": True}),
                "auto_generate": ("BOOLEAN", {"default": True}),
                "generated_prompt": ("STRING", {"default": "", "multiline": True}),
                
                # API选项卡参数
                "api_provider": ("STRING", {"default": "siliconflow"}),
                "api_key": ("STRING", {"default": ""}),
                "api_model": ("STRING", {"default": "deepseek-ai/DeepSeek-V3"}),
                "api_editing_intent": ("STRING", {"default": "general_editing"}),
                "api_processing_style": ("STRING", {"default": "auto_smart"}),
                "api_seed": ("INT", {"default": 0}),
                "api_custom_guidance": ("STRING", {"default": "", "multiline": True}),
                
                # Ollama选项卡参数
                "ollama_url": ("STRING", {"default": "http://127.0.0.1:11434"}),
                "ollama_model": ("STRING", {"default": ""}),
                "ollama_temperature": ("FLOAT", {"default": 0.7}),
                "ollama_editing_intent": ("STRING", {"default": "general_editing"}),
                "ollama_processing_style": ("STRING", {"default": "auto_smart"}),
                "ollama_seed": ("INT", {"default": 42}),
                "ollama_custom_guidance": ("STRING", {"default": "", "multiline": True}),
                "ollama_enable_visual": ("BOOLEAN", {"default": False}),
                "ollama_auto_unload": ("BOOLEAN", {"default": False}),
            },
        }
    
    RETURN_TYPES = ("IMAGE", "STRING")
    RETURN_NAMES = ("edited_image", "generated_prompt")
    FUNCTION = "process_super_prompt"
    CATEGORY = CATEGORY_TYPE
    OUTPUT_NODE = False
    
    @classmethod
    def IS_CHANGED(cls, **kwargs):
        # 强制每次都重新执行，同时强制刷新节点定义
        import time
        return str(time.time()) + "_force_refresh"
    
    def process_super_prompt(self, layer_info, image, tab_mode="manual", unique_id="", edit_mode="局部编辑", 
                           operation_type="", description="", constraint_prompts="", 
                           decorative_prompts="", selected_layers="", auto_generate=True, 
                           generated_prompt="", 
                           # API选项卡参数
                           api_provider="siliconflow", api_key="", api_model="deepseek-ai/DeepSeek-V3",
                           api_editing_intent="general_editing", api_processing_style="auto_smart",
                           api_seed=0, api_custom_guidance="",
                           # Ollama选项卡参数  
                           ollama_url="http://127.0.0.1:11434", ollama_model="", ollama_temperature=0.7,
                           ollama_editing_intent="general_editing", ollama_processing_style="auto_smart",
                           ollama_seed=42, ollama_custom_guidance="", ollama_enable_visual=False,
                           ollama_auto_unload=False):
        """
        处理Kontext超级提示词生成
        """
        try:
            print(f"[Kontext Super Prompt] 开始处理超级提示词生成，节点ID: {unique_id}")
            print(f"[Kontext Super Prompt] 选项卡模式: {tab_mode}")
            print(f"[Kontext Super Prompt] 编辑模式: {edit_mode}")
            print(f"[Kontext Super Prompt] 描述: '{description}'")
            print(f"[Kontext Super Prompt] 前端生成提示词: '{generated_prompt}'")
            
            # 根据选项卡模式处理
            if tab_mode == "api" and generated_prompt and generated_prompt.strip():
                print("[Kontext Super Prompt] 使用前端API生成的提示词")
                final_generated_prompt = generated_prompt.strip()
            elif tab_mode == "api" and api_key:
                print("[Kontext Super Prompt] 前端未生成提示词，使用后端API生成")
                final_generated_prompt = self.process_api_mode(
                    layer_info, description, api_provider, api_key, api_model,
                    api_editing_intent, api_processing_style, api_seed, 
                    api_custom_guidance, image
                )
            elif tab_mode == "ollama" and ollama_model:
                print("[Kontext Super Prompt] 使用Ollama模式生成提示词")
                final_generated_prompt = self.process_ollama_mode(
                    layer_info, description, ollama_url, ollama_model, ollama_temperature,
                    ollama_editing_intent, ollama_processing_style, ollama_seed,
                    ollama_custom_guidance, ollama_enable_visual, ollama_auto_unload, image
                )
            elif generated_prompt and generated_prompt.strip():
                print("[Kontext Super Prompt] 使用前端生成的提示词（非API模式）")
                final_generated_prompt = generated_prompt.strip()
            else:
                print("[Kontext Super Prompt] 使用手动模式生成提示词")
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
    
    def process_api_mode(self, layer_info, description, api_provider, api_key, api_model,
                        editing_intent, processing_style, seed, custom_guidance, image):
        """处理API模式的提示词生成"""
        try:
            import requests
            import re
            import hashlib
            
            if not api_key:
                print("[Kontext Super Prompt] API密钥为空")
                return f"API密钥为空: {description or '无描述'}"
            
            # API提供商配置
            api_configs = {
                'siliconflow': {
                    'base_url': 'https://api.siliconflow.cn/v1/chat/completions',
                    'default_model': 'deepseek-ai/DeepSeek-V3'
                },
                'zhipu': {
                    'base_url': 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
                    'default_model': 'glm-4.5'
                },
                'deepseek': {
                    'base_url': 'https://api.deepseek.com/v1/chat/completions',
                    'default_model': 'deepseek-chat'
                }
            }
            
            # 获取API配置
            api_config = api_configs.get(api_provider, api_configs['siliconflow'])
            model = api_model or api_config['default_model']
            
            # 构建系统提示词
            system_prompt = """You are an AI image editing prompt expert. Generate clean, professional English prompts for AI image editing tools.

CRITICAL: Generate ONLY ONE single prompt. Do not provide multiple options, variations, or numbered lists.

Requirements:
- Output exactly ONE cohesive prompt (50-150 words)
- Be specific and descriptive about the requested changes
- Use professional image editing terminology
- Each generation should be unique even for the same input
- Do NOT include titles, headers, or any formatting
- Do NOT provide multiple prompts or variations
- Just the prompt text itself, nothing else"""
            
            if editing_intent == "creative_enhancement":
                system_prompt += "\n- Prioritize artistic and creative improvements"
            elif editing_intent == "technical_correction":
                system_prompt += "\n- Focus on technical accuracy and corrections"
            elif editing_intent == "style_transformation":
                system_prompt += "\n- Emphasize style changes and artistic transformation"
            
            if processing_style == "auto_smart":
                system_prompt += "\n- Use intelligent automatic processing"
            elif processing_style == "manual_precise":
                system_prompt += "\n- Require precise manual control"
            elif processing_style == "balanced_hybrid":
                system_prompt += "\n- Balance automatic and manual approaches"
            
            # 添加随机元素确保每次生成不同
            import time
            random_seed = int(time.time() * 1000) % 1000000
            
            # 构建用户提示词
            user_prompt = f"Generate a complete and detailed English prompt for the following image editing task: {description}"
            if custom_guidance:
                user_prompt += f"\n\nAdditional guidance: {custom_guidance}"
            user_prompt += f"\n\nVariation seed: {random_seed}"  # 添加随机种子
            user_prompt += "\n\nRemember: Output ONLY ONE single prompt. No titles, numbers, or multiple variations."
            
            # 发送API请求
            headers = {
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {api_key}'
            }
            
            data = {
                'model': model,
                'messages': [
                    {'role': 'system', 'content': system_prompt},
                    {'role': 'user', 'content': user_prompt}
                ],
                'temperature': 0.7 + (random_seed % 20) / 100,  # 0.7-0.89的随机温度
                'max_tokens': 500,  # 增加到500确保有足够空间生成
                'top_p': 0.95
            }
            
            response = requests.post(api_config['base_url'], headers=headers, json=data, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            api_response = result['choices'][0]['message']['content']
            
            # 调试：显示原始响应
            print(f"[Kontext Super Prompt] API原始响应: {api_response[:200]}..." if len(api_response) > 200 else f"[Kontext Super Prompt] API原始响应: {api_response}")
            
            # 清理响应，提取纯净提示词
            cleaned_response = self._clean_api_response(api_response)
            
            # 调试：显示清理后的响应
            print(f"[Kontext Super Prompt] 清理后响应: {cleaned_response[:200]}..." if len(cleaned_response) > 200 else f"[Kontext Super Prompt] 清理后响应: {cleaned_response}")
            
            print(f"[Kontext Super Prompt] ✅ {api_provider} API生成完成！")
            print(f"[Kontext Super Prompt] 模型: {model}")
            print(f"[Kontext Super Prompt] 输入: \"{description}\"")
            
            return cleaned_response
                
        except Exception as e:
            print(f"[Kontext Super Prompt] API模式处理错误: {e}")
            return f"API处理错误: {description or '无描述'}"
    
    def process_ollama_mode(self, layer_info, description, ollama_url, ollama_model, 
                           temperature, editing_intent, processing_style, seed,
                           custom_guidance, enable_visual, auto_unload, image):
        """处理Ollama模式的提示词生成"""
        try:
            from ollama_flux_kontext_enhancer import OllamaFluxKontextEnhancerV2
            
            # 创建Ollama增强器实例
            ollama_enhancer = OllamaFluxKontextEnhancerV2()
            
            # 转换图层信息为JSON字符串
            layer_info_str = json.dumps(layer_info) if isinstance(layer_info, dict) else str(layer_info)
            
            # 调用Ollama增强器
            enhanced_instructions, system_prompt = ollama_enhancer.enhance_flux_instructions(
                layer_info=layer_info_str,
                edit_description=description,
                model=ollama_model,
                auto_unload_model=auto_unload,
                editing_intent=editing_intent,
                processing_style=processing_style,
                image=image,
                url=ollama_url,
                temperature=temperature,
                enable_visual_analysis=enable_visual,
                seed=seed,
                load_saved_guidance="none",
                save_guidance=False,
                guidance_name="",
                custom_guidance=custom_guidance
            )
            
            if enhanced_instructions:
                return enhanced_instructions
            else:
                print("[Kontext Super Prompt] Ollama模式生成失败，使用fallback")
                return f"Ollama生成失败: {description or '无描述'}"
                
        except Exception as e:
            print(f"[Kontext Super Prompt] Ollama模式处理错误: {e}")
            return f"Ollama处理错误: {description or '无描述'}"
    
    def _clean_api_response(self, response):
        """清理API响应，提取纯净提示词"""
        import re
        
        if not response:
            return response
        
        # 如果响应包含多个Prompt编号，只提取第一个
        if '### Prompt' in response or 'Prompt 1:' in response:
            print("[Kontext Super Prompt] 检测到多个提示词格式，提取第一个")
            
            # 尝试提取第一个引号内的提示词
            first_quoted_match = re.search(r'"([^"]{30,})"', response)
            if first_quoted_match:
                print("[Kontext Super Prompt] 提取第一个引号中的提示词")
                return first_quoted_match.group(1).strip()
            
            # 尝试提取第一个提示词段落
            first_prompt_match = re.search(r'(?:Prompt \d+:.*?)"([^"]+)"', response, re.DOTALL)
            if first_prompt_match:
                print("[Kontext Super Prompt] 提取第一个编号提示词")
                return first_prompt_match.group(1).strip()
        
        # 尝试提取引号中的提示词
        quoted_match = re.search(r'"([^"]{30,})"', response)
        if quoted_match:
            print("[Kontext Super Prompt] 提取引号中的提示词")
            return quoted_match.group(1).strip()
        
        # 清理标题和前缀
        patterns_to_remove = [
            r'^###.*$',            # 移除Markdown标题
            r'^Prompt \d+:.*$',    # 移除"Prompt 1:"等
            r'^---.*$',            # 移除分隔线
            r'^.*?prompt:\s*',     # 移除prompt前缀
        ]
        
        cleaned = response.strip()
        
        # 尝试提取代码块中的提示词
        code_block_match = re.search(r'```[^`]*?\n(.*?)\n```', response, re.DOTALL)
        if code_block_match and len(code_block_match.group(1).strip()) > 20:
            print("[Kontext Super Prompt] 提取代码块中的提示词")
            return code_block_match.group(1).strip()
        
        # 应用清理模式
        for pattern in patterns_to_remove:
            cleaned = re.sub(pattern, '', cleaned, flags=re.MULTILINE | re.IGNORECASE)
        
        # 清理多余空行
        cleaned = re.sub(r'\n{2,}', '\n', cleaned).strip()
        
        # 如果没有做任何处理或结果太短，返回原始内容
        if not cleaned or len(cleaned) < 10:
            print("[Kontext Super Prompt] 清理结果过短，返回原始内容")
            return response.strip()
        
        return cleaned.strip()


# 注册节点
NODE_CLASS_MAPPINGS = {
    "KontextSuperPrompt": KontextSuperPrompt,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "KontextSuperPrompt": "🎯 Kontext Super Prompt",
}

print("[Kontext Super Prompt] Kontext Super Prompt node registered")