"""
Custom Model Prompt Generator
支持加载微调+量化的模型，专门用于提示词生成

支持的模型：
- qwen-8b-instruct (微调 + 4位量化)
- deepseek-7b-base (微调 + 4位量化)
"""

import os
import sys
import json
import torch
import traceback
from typing import Optional, Dict, Any, Tuple, List
import folder_paths
import glob

# 尝试导入llama-cpp-python
try:
    from llama_cpp import Llama
    LLAMA_CPP_AVAILABLE = True
except ImportError:
    LLAMA_CPP_AVAILABLE = False

# 获取专用模型目录路径
def get_custom_model_directory():
    """获取自定义模型目录路径"""
    # ComfyUI/models/custom_prompt_models/
    # __file__ = /path/to/ComfyUI/custom_nodes/kontext-super-prompt/nodes/local_ai_prompt_generator.py
    # 需要向上4级: nodes -> kontext-super-prompt -> custom_nodes -> ComfyUI
    current_file = os.path.abspath(__file__)
    nodes_dir = os.path.dirname(current_file)  # .../nodes/
    plugin_dir = os.path.dirname(nodes_dir)   # .../kontext-super-prompt/
    custom_nodes_dir = os.path.dirname(plugin_dir)  # .../custom_nodes/
    comfyui_root = os.path.dirname(custom_nodes_dir)  # .../ComfyUI/
    
    models_dir = os.path.join(comfyui_root, "models", "custom_prompt_models")
    
    
    # 确保目录存在
    os.makedirs(models_dir, exist_ok=True)
    return models_dir

def scan_model_files():
    """扫描模型目录中的.gguf文件"""
    model_dir = get_custom_model_directory()
    gguf_files = glob.glob(os.path.join(model_dir, "*.gguf"))
    
    # 调试信息
    
    # 返回文件名（不含路径）
    model_names = [os.path.basename(f) for f in gguf_files]
    
    if not model_names:
        model_names = ["请将.gguf模型文件放入models/custom_prompt_models目录"]
    else:
        pass
    
    return model_names

def detect_model_names():
    """从模型文件名提取模型名称"""
    model_files = scan_model_files()
    model_names = []
    
    for model_file in model_files:
        if model_file == "请将.gguf模型文件放入models/custom_prompt_models目录":
            continue
            
        # 提取模型名称（去除扩展名）
        model_name = os.path.splitext(model_file)[0]
        if model_name not in model_names:
            model_names.append(model_name)
    
    if not model_names:
        model_names = ["请先添加模型文件"]
    
    return model_names


class CustomModelPromptGenerator:
    """
    Custom Model Prompt Generator
    支持微调+量化模型的ComfyUI节点
    """
    
    def __init__(self):
        self.model = None
        self.current_model_path = None
        self.model_cache = {}
        
        # 默认的提示词模板
        self.prompt_templates = {
            "qwen": {
                "system": "你是一个专业的图像编辑提示词生成器。根据用户的编辑要求，生成精确的、结构化的提示词。",
                "template": "<|im_start|>system\n{system}<|im_end|>\n<|im_start|>user\n{user_input}<|im_end|>\n<|im_start|>assistant\n"
            },
            "deepseek": {
                "system": "You are a professional image editing prompt generator. Generate precise, structured prompts based on user editing requirements.",
                "template": "### System:\n{system}\n\n### User:\n{user_input}\n\n### Assistant:\n"
            }
        }
    
    @classmethod
    def INPUT_TYPES(cls):
        model_files = scan_model_files()
        model_names = detect_model_names()
        return {
            "required": {
                "editing_request": ("STRING", {
                    "multiline": True,
                    "default": "请描述你想要的图像编辑效果",
                    "placeholder": "例如：将背景改为蓝天白云，增加温暖的阳光效果",
                    "rows": 4
                }),
                "model_name": (model_names, {
                    "default": model_names[0] if model_names else "请先添加模型文件"
                }),
                "model_file": (model_files, {
                    "default": model_files[0] if model_files else "请将.gguf模型文件放入models/custom_prompt_models目录"
                }),
                "max_tokens": ("INT", {
                    "default": 512,
                    "min": 64,
                    "max": 2048,
                    "step": 64
                }),
                "temperature": ("FLOAT", {
                    "default": 0.7,
                    "min": 0.1,
                    "max": 2.0,
                    "step": 0.1
                }),
                "top_p": ("FLOAT", {
                    "default": 0.9,
                    "min": 0.1,
                    "max": 1.0,
                    "step": 0.05
                })
            },
            "optional": {
                "layers_info": ("LAYERS_INFO",),
                "image": ("IMAGE",),
                "custom_system_prompt": ("STRING", {
                    "multiline": True,
                    "default": "",
                    "placeholder": "自定义系统提示词（可选）",
                    "rows": 3
                })
            }
        }
    
    RETURN_TYPES = ("STRING", "STRING")
    RETURN_NAMES = ("enhanced_prompt", "raw_output")
    FUNCTION = "generate_prompt"
    CATEGORY = "🎨 Super Canvas"
    
    def load_model(self, model_file: str) -> bool:
        """加载量化模型"""
        if not LLAMA_CPP_AVAILABLE:
            raise Exception("llama-cpp-python not installed. Please run: pip install llama-cpp-python")
        
        # 构建完整的模型路径
        model_dir = get_custom_model_directory()
        model_path = os.path.join(model_dir, model_file)
        
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"模型文件不存在: {model_path}")
        
        # 检查是否已经加载了相同的模型
        if self.current_model_path == model_path and self.model is not None:
            return True
        
        try:
            
            # 根据模型类型设置参数
            model_params = {
                "model_path": model_path,
                "n_ctx": 4096,  # 上下文长度
                "n_batch": 512,  # 批处理大小
                "n_threads": -1,  # 使用所有CPU线程
                "verbose": False
            }
            
            # 检查是否有GPU支持
            if torch.cuda.is_available():
                model_params["n_gpu_layers"] = -1  # 使用所有GPU层
            
            self.model = Llama(**model_params)
            self.current_model_path = model_path
            
            return True
            
        except Exception as e:
            traceback.print_exc()
            self.model = None
            self.current_model_path = None
            return False
    
    def build_prompt(self, editing_request: str, model_name: str, custom_system: str = "") -> str:
        """构建适合模型的提示词"""
        
        # 根据模型名称选择模板
        if "qwen" in model_name.lower():
            template_config = self.prompt_templates["qwen"]
        elif "deepseek" in model_name.lower():
            template_config = self.prompt_templates["deepseek"]
        else:
            # 对于未知模型，默认使用通用格式
            template_config = self.prompt_templates["deepseek"]  # 使用更通用的格式
        
        # 使用自定义系统提示词或默认提示词
        system_prompt = custom_system.strip() if custom_system.strip() else template_config["system"]
        
        # 构建用户输入
        user_input = f"""请根据以下图像编辑要求，生成一个详细的、结构化的提示词：

编辑要求：{editing_request}

请生成符合以下格式的提示词：
1. 主要编辑内容描述
2. 风格和质量要求  
3. 技术参数建议

输出格式要求：
- 使用英文描述
- 结构清晰，逗号分隔
- 包含质量标签如 "high quality, detailed, professional"
- 避免负面描述"""
        
        # 应用模板
        full_prompt = template_config["template"].format(
            system=system_prompt,
            user_input=user_input
        )
        
        return full_prompt
    
    def generate_prompt(self, editing_request: str, model_name: str, model_file: str, 
                       max_tokens: int, temperature: float, top_p: float,
                       layers_info=None, image=None, custom_system_prompt: str = "") -> Tuple[str, str]:
        """生成增强的提示词"""
        
        try:
            # 验证模型文件
            if not model_file.strip() or model_file == "请将.gguf模型文件放入models/custom_prompt_models目录":
                raise ValueError("请选择有效的模型文件")
            
            if not model_file.endswith('.gguf'):
                raise ValueError("模型文件必须是 .gguf 格式")
            
            # 处理输入数据
            enhanced_request = editing_request
            if layers_info:
                # 处理Super Canvas的图层信息
                if isinstance(layers_info, dict):
                    layer_count = len(layers_info.get('layers', [])) if 'layers' in layers_info else 0
                    if layer_count > 0:
                        layer_info = f"\n图层信息: {layer_count} 个图层"
                        enhanced_request += layer_info
                elif isinstance(layers_info, (list, tuple)):
                    layer_info = f"\n图层信息: {len(layers_info)} 个图层"
                    enhanced_request += layer_info
                else:
                    # 其他格式的图层信息
                    enhanced_request += f"\n图层数据: {str(layers_info)[:100]}..."
            
            # 加载模型
            if not self.load_model(model_file):
                raise Exception("模型加载失败")
            
            # 构建提示词
            full_prompt = self.build_prompt(enhanced_request, model_name, custom_system_prompt)
            
            
            # 生成参数
            generation_params = {
                "prompt": full_prompt,
                "max_tokens": max_tokens,
                "temperature": temperature,
                "top_p": top_p,
                "stop": ["<|im_end|>", "### User:", "\n\n###"],  # 停止标记
                "echo": False
            }
            
            # 执行推理
            response = self.model(**generation_params)
            
            # 提取生成的文本
            raw_output = response['choices'][0]['text'].strip()
            
            # 后处理：提取有效的提示词部分
            enhanced_prompt = self.post_process_output(raw_output)
            
            
            return (enhanced_prompt, raw_output)
            
        except Exception as e:
            error_msg = f"提示词生成失败: {str(e)}"
            traceback.print_exc()
            return (error_msg, str(e))
    
    def post_process_output(self, raw_output: str) -> str:
        """后处理模型输出，提取干净的提示词"""
        
        # 移除常见的前缀和后缀
        prefixes_to_remove = [
            "根据您的编辑要求",
            "以下是生成的提示词",
            "生成的提示词如下",
            "Based on your editing request",
            "Here is the generated prompt",
            "The generated prompt is"
        ]
        
        processed = raw_output.strip()
        
        # 移除前缀
        for prefix in prefixes_to_remove:
            if processed.lower().startswith(prefix.lower()):
                processed = processed[len(prefix):].strip()
                if processed.startswith("：") or processed.startswith(":"):
                    processed = processed[1:].strip()
        
        # 移除多余的换行和空格
        processed = " ".join(processed.split())
        
        # 确保以高质量标签结尾
        quality_tags = ["high quality", "detailed", "professional", "8k", "masterpiece"]
        has_quality_tag = any(tag in processed.lower() for tag in quality_tags)
        
        if not has_quality_tag:
            processed += ", high quality, detailed, professional"
        
        return processed

# Web API接口 - 用于动态刷新模型列表
try:
    from server import PromptServer
    from aiohttp import web
    WEB_API_AVAILABLE = True
except ImportError:
    WEB_API_AVAILABLE = False

if WEB_API_AVAILABLE:
    @PromptServer.instance.routes.post("/custom_model_generator/refresh_models")
    async def refresh_custom_models(request):
        """刷新自定义模型列表API"""
        try:
            # 重新扫描模型目录
            model_files = scan_model_files()
            model_names = detect_model_names()
            
            
            return web.json_response({
                "success": True,
                "model_files": model_files,
                "model_names": model_names,
                "count": len([f for f in model_files if f != "请将.gguf模型文件放入models/custom_prompt_models目录"])
            })
            
        except Exception as e:
            return web.json_response({
                "success": False,
                "error": str(e)
            }, status=500)

# 注册节点
NODE_CLASS_MAPPINGS = {
    "CustomModelPromptGenerator": CustomModelPromptGenerator
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "CustomModelPromptGenerator": "🤖 Custom Model Prompt Generator"
}