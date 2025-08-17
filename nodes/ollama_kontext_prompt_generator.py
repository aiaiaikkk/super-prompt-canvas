"""
Ollama Kontext Prompt Generator - 纯后端Ollama提示词生成节点
解决云端环境HTTPS/HTTP混合内容问题的完美方案

功能特点：
- 完全后端处理，无需前端Ollama连接
- 集成引导词选择系统
- 自动检测可用Ollama模型
- 支持云端和本地环境
- 专业的提示词模板系统
"""

import json
import time
import random
import os
import sys
from typing import Dict, List, Any, Tuple, Optional

try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False
    requests = None

try:
    import torch
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False
    torch = None

CATEGORY_TYPE = "🎨 LRPG Canvas"

class OllamaKontextPromptGenerator:
    """
    Ollama Kontext提示词生成器 - 纯后端实现
    解决云端HTTPS/HTTP混合内容问题
    """
    
    def __init__(self):
        self.ollama_url = "http://127.0.0.1:11434"
        
    @classmethod
    def INPUT_TYPES(cls):
        # 获取可用的Ollama模型
        available_models = cls._get_available_models()
        
        # 编辑意图选项 - 16种操作
        editing_intents = [
            "颜色修改", "物体移除", "物体替换", "物体添加",
            "背景更换", "换脸", "质量增强", "图像修复",
            "风格转换", "文字编辑", "光线调整", "透视校正",
            "模糊/锐化", "局部变形", "构图调整", "通用编辑"
        ]
        
        # 应用场景选项 - 16种场景
        application_scenarios = [
            "电商产品", "社交媒体", "营销活动", "人像摄影",
            "生活方式", "美食摄影", "房地产", "时尚零售",
            "汽车展示", "美妆化妆品", "企业品牌", "活动摄影",
            "产品目录", "艺术创作", "纪实摄影", "自动选择"
        ]
        
        return {
            "required": {
                "description": ("STRING", {
                    "default": "将选定区域的颜色改为红色",
                    "multiline": True,
                    "placeholder": "请描述您想要进行的编辑..."
                }),
                "editing_intent": (editing_intents, {
                    "default": "颜色修改"
                }),
                "application_scenario": (application_scenarios, {
                    "default": "电商产品"
                }),
                "ollama_model": (available_models, {
                    "default": available_models[0] if available_models else "deepseek-r1:1.5b"
                }),
                "temperature": ("FLOAT", {
                    "default": 0.7,
                    "min": 0.0,
                    "max": 2.0,
                    "step": 0.1,
                    "display": "slider"
                }),
                "seed": ("INT", {
                    "default": 42,
                    "min": 0,
                    "max": 1000000
                }),
            },
            "optional": {
                "custom_guidance": ("STRING", {
                    "default": "",
                    "multiline": True,
                    "placeholder": "可选：自定义引导词..."
                }),
                "ollama_url": ("STRING", {
                    "default": "http://127.0.0.1:11434",
                    "placeholder": "Ollama服务地址"
                }),
            }
        }
    
    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("generated_prompt",)
    FUNCTION = "generate_prompt"
    CATEGORY = CATEGORY_TYPE
    OUTPUT_NODE = False
    
    @classmethod
    def _get_available_models(cls):
        """获取可用的Ollama模型列表"""
        try:
            if not REQUESTS_AVAILABLE:
                return ["deepseek-r1:1.5b", "qwen3:4b", "qwen3:8b"]
            
            response = requests.get("http://127.0.0.1:11434/api/tags", timeout=3)
            if response.status_code == 200:
                models_data = response.json()
                models = [model['name'] for model in models_data.get('models', [])]
                return models if models else ["deepseek-r1:1.5b"]
            else:
                return ["deepseek-r1:1.5b", "qwen3:4b", "qwen3:8b"]
        except:
            return ["deepseek-r1:1.5b", "qwen3:4b", "qwen3:8b"]
    
    def _get_guidance_template(self, editing_intent: str, application_scenario: str) -> str:
        """根据编辑意图和应用场景生成引导词模板"""
        
        # 编辑意图模板
        intent_templates = {
            "颜色修改": "Transform the selected area to the specified color with natural blending and seamless integration",
            "物体移除": "Remove the selected object completely while reconstructing the background naturally",
            "物体替换": "Replace the selected object with the described item maintaining proper lighting and perspective",
            "物体添加": "Add the described element to the selected area with realistic placement and lighting",
            "背景更换": "Change the background to the specified environment while preserving subject lighting",
            "换脸": "Replace the face in the selected area with natural expression and proper lighting match",
            "质量增强": "Enhance the overall quality with improved sharpness, detail, and professional finish",
            "图像修复": "Repair and restore the damaged areas with seamless texture reconstruction",
            "风格转换": "Apply the specified artistic style while maintaining the core composition",
            "文字编辑": "Modify or add text elements with professional typography and layout",
            "光线调整": "Adjust lighting conditions to create the desired mood and atmosphere",
            "透视校正": "Correct perspective distortion while maintaining natural proportions",
            "模糊/锐化": "Apply selective focus adjustments to enhance visual hierarchy",
            "局部变形": "Apply geometric transformations to the selected area naturally",
            "构图调整": "Recompose the image elements for improved visual balance",
            "通用编辑": "Apply the requested editing with professional quality and attention to detail"
        }
        
        # 应用场景优化词
        scenario_enhancements = {
            "电商产品": "with clean, professional appearance suitable for product catalogs",
            "社交媒体": "optimized for social media with engaging visual appeal",
            "营销活动": "designed for marketing campaigns with strong visual impact",
            "人像摄影": "with professional portrait quality and natural skin tones",
            "生活方式": "capturing authentic lifestyle moments with warm atmosphere",
            "美食摄影": "with appetizing presentation and proper food styling",
            "房地产": "showcasing architectural features with professional real estate quality",
            "时尚零售": "with fashion-forward styling and premium brand aesthetic",
            "汽车展示": "highlighting automotive features with showroom quality",
            "美妆化妆品": "with beauty-focused enhancement and glamorous appeal",
            "企业品牌": "maintaining corporate professionalism and brand consistency",
            "活动摄影": "capturing dynamic moments with event documentation quality",
            "产品目录": "with catalog-ready presentation and consistent lighting",
            "艺术创作": "with artistic interpretation and creative visual expression",
            "纪实摄影": "maintaining authenticity with documentary-style realism",
            "自动选择": "with intelligent optimization for the specific content type"
        }
        
        base_template = intent_templates.get(editing_intent, intent_templates["通用编辑"])
        scenario_enhancement = scenario_enhancements.get(application_scenario, scenario_enhancements["自动选择"])
        
        return f"{base_template} {scenario_enhancement}"
    
    def _call_ollama_api(self, prompt: str, model: str, temperature: float, 
                        seed: int, ollama_url: str) -> str:
        """调用Ollama API生成提示词"""
        try:
            if not REQUESTS_AVAILABLE:
                raise Exception("requests库未安装，无法调用Ollama API")
            
            # 构建系统提示词
            system_prompt = """You are an ENGLISH-ONLY image editing prompt generator.

CRITICAL RULES:
1. Output in ENGLISH ONLY - NO Chinese characters allowed
2. Generate ONE clear, concise editing instruction (30-80 words)
3. Use professional photography and editing terminology
4. Focus on technical accuracy and visual quality
5. Include specific details about lighting, composition, and quality

FORMAT: Start with an action verb, describe the target and method, end with quality terms.
EXAMPLE: "Transform the selected area to vibrant red color while maintaining natural lighting and seamless edge blending with professional quality finish"

REMEMBER: ENGLISH ONLY OUTPUT - Any Chinese characters will be rejected."""
            
            # 构建用户提示词
            user_prompt = f"""Based on this editing request: "{prompt}"

Generate a professional English editing instruction that:
- Clearly describes the editing action
- Includes technical details for quality results
- Uses professional editing terminology
- Focuses on achieving realistic, natural results

Output format: Single paragraph, 30-80 words, English only."""
            
            # 调用Ollama API
            api_url = f"{ollama_url}/api/generate"
            payload = {
                "model": model,
                "prompt": user_prompt,
                "system": system_prompt,
                "stream": False,
                "options": {
                    "temperature": temperature,
                    "seed": seed,
                    "num_predict": 150,
                    "top_k": 50,
                    "top_p": 0.9,
                    "repeat_penalty": 1.1
                }
            }
            
            response = requests.post(api_url, json=payload, timeout=60)
            response.raise_for_status()
            
            result = response.json()
            generated_text = result.get('response', '').strip()
            
            # 清理响应
            cleaned_text = self._clean_response(generated_text)
            
            return cleaned_text
            
        except Exception as e:
            print(f"[Ollama Kontext] API调用失败: {e}")
            # 返回备用模板
            return self._get_fallback_prompt(prompt)
    
    def _clean_response(self, response: str) -> str:
        """清理Ollama响应，确保输出英文"""
        import re
        
        if not response:
            return "Apply professional editing to the selected area with high quality results"
        
        # 检测中文字符
        chinese_pattern = re.compile(r'[\u4e00-\u9fff]+')
        has_chinese = bool(chinese_pattern.search(response))
        
        if has_chinese:
            print("[Ollama Kontext] 检测到中文输出，使用英文备用方案")
            # 尝试提取英文部分
            english_sentences = re.findall(r'[A-Z][a-zA-Z\s,\.;:\-!?]+[\.!?]', response)
            if english_sentences:
                longest = max(english_sentences, key=len)
                if len(longest) > 20:
                    return longest.strip()
        
        # 清理格式
        cleaned = re.sub(r'^[:\-\s]*', '', response)  # 移除开头的符号
        cleaned = re.sub(r'\n+', ' ', cleaned)        # 替换换行符
        cleaned = re.sub(r'\s+', ' ', cleaned)        # 合并多余空格
        
        return cleaned.strip()
    
    def _get_fallback_prompt(self, description: str) -> str:
        """生成备用提示词"""
        # 基于描述内容生成智能备用词
        desc_lower = description.lower()
        
        if any(word in desc_lower for word in ['color', '颜色', 'red', 'blue', 'green', '红', '蓝', '绿']):
            return "Transform the selected area to the specified color with natural blending and seamless integration"
        elif any(word in desc_lower for word in ['remove', '移除', 'delete', '删除']):
            return "Remove the selected object completely while reconstructing the background naturally"
        elif any(word in desc_lower for word in ['replace', '替换', 'change', '更换']):
            return "Replace the selected element with the described item maintaining proper lighting and perspective"
        elif any(word in desc_lower for word in ['add', '添加', 'insert', '插入']):
            return "Add the described element to the selected area with realistic placement and lighting"
        elif any(word in desc_lower for word in ['enhance', '增强', 'improve', '改善']):
            return "Enhance the selected area with improved quality, sharpness, and professional finish"
        else:
            return "Apply professional editing to the selected area according to the specified requirements with high quality results"
    
    def generate_prompt(self, description: str, editing_intent: str, application_scenario: str,
                       ollama_model: str, temperature: float, seed: int,
                       custom_guidance: str = "", ollama_url: str = "http://127.0.0.1:11434"):
        """生成Kontext提示词"""
        try:
            print(f"[Ollama Kontext] 开始生成提示词...")
            print(f"[Ollama Kontext] 模型: {ollama_model}, 意图: {editing_intent}, 场景: {application_scenario}")
            
            # 构建完整的提示词
            if custom_guidance:
                full_prompt = f"{description}\n\n自定义引导: {custom_guidance}"
            else:
                guidance_template = self._get_guidance_template(editing_intent, application_scenario)
                full_prompt = f"{description}\n\n引导模板: {guidance_template}"
            
            # 调用Ollama API
            generated_prompt = self._call_ollama_api(
                prompt=full_prompt,
                model=ollama_model,
                temperature=temperature,
                seed=seed,
                ollama_url=ollama_url
            )
            
            print(f"[Ollama Kontext] 提示词生成完成: {generated_prompt[:50]}...")
            
            return (generated_prompt,)
            
        except Exception as e:
            print(f"[Ollama Kontext] 生成失败: {e}")
            # 返回备用提示词
            fallback_prompt = self._get_fallback_prompt(description)
            return (fallback_prompt,)

# 注册节点
NODE_CLASS_MAPPINGS = {
    "OllamaKontextPromptGenerator": OllamaKontextPromptGenerator,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "OllamaKontextPromptGenerator": "🦙 Ollama Kontext Prompt Generator",
}

print("[Ollama Kontext] Ollama Kontext Prompt Generator node registered")