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

CATEGORY_TYPE = "🎨 Super Canvas"

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
        
        # 编辑意图选项 - 17种操作（添加"无"选项）
        editing_intents = [
            "无", "颜色修改", "物体移除", "物体替换", "物体添加",
            "背景更换", "换脸", "质量增强", "图像修复",
            "风格转换", "文字编辑", "光线调整", "透视校正",
            "模糊/锐化", "局部变形", "构图调整", "通用编辑"
        ]
        
        # 应用场景选项 - 17种场景（添加"无"选项）
        application_scenarios = [
            "无", "电商产品", "社交媒体", "营销活动", "人像摄影",
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
                    "default": "无"
                }),
                "application_scenario": (application_scenarios, {
                    "default": "无"
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
        """根据编辑意图和应用场景生成引导词模板 - 使用方案A专业引导词库"""
        
        # 方案A - 编辑意图专业引导词 (随机选择变体)
        intent_templates = {
            "颜色修改": [
                "precise color grading and tonal balance adjustment",
                "selective color modification with natural transitions",
                "hue, saturation and luminance fine-tuning",
                "color harmony optimization and palette refinement",
                "advanced color correction with preserved details"
            ],
            "物体移除": [
                "seamless object erasure with intelligent content-aware fill",
                "advanced inpainting with texture and pattern reconstruction",
                "clean removal with contextual background regeneration",
                "professional retouching with invisible object extraction",
                "content-aware deletion with natural scene completion"
            ],
            "物体替换": [
                "intelligent object substitution with matched lighting and perspective",
                "seamless element swapping with proper shadow and reflection",
                "context-aware replacement maintaining scene coherence",
                "professional object exchange with realistic integration",
                "smart substitution with automatic color and scale matching"
            ],
            "物体添加": [
                "realistic object insertion with proper depth and occlusion",
                "natural element placement with accurate shadows and lighting",
                "contextual object addition with scene-aware compositing",
                "professional element integration with believable interactions",
                "intelligent object placement with automatic perspective matching"
            ],
            "背景更换": [
                "professional background replacement with edge refinement",
                "environmental substitution with matched lighting conditions",
                "seamless backdrop swapping with hair and transparency handling",
                "studio-quality background modification with depth preservation",
                "intelligent scene replacement with automatic color grading"
            ],
            "换脸": [
                "place face on target, make it natural",
                "place face and fix skin tone",
                "put face on image, make edges smooth",
                "place face and keep face unchanged",
                "put face naturally and fix the edges"
            ],
            "质量增强": [
                "professional upscaling with detail enhancement and noise reduction",
                "AI-powered quality improvement with texture preservation",
                "advanced sharpening and clarity optimization",
                "intelligent detail recovery with artifact removal",
                "studio-grade enhancement with dynamic range expansion"
            ],
            "图像修复": [
                "professional damage repair and artifact removal",
                "historical photo restoration with detail reconstruction",
                "advanced scratch and tear healing with texture synthesis",
                "intelligent restoration with color and contrast recovery",
                "museum-quality preservation with authentic detail retention"
            ],
            "风格转换": [
                "artistic style application with content preservation",
                "professional aesthetic transformation with selective stylization",
                "intelligent style mapping with detail retention",
                "creative interpretation with balanced artistic expression",
                "advanced neural style transfer with customizable intensity"
            ],
            "文字编辑": [
                "professional typography modification and text replacement",
                "intelligent text editing with font matching",
                "seamless text overlay with proper perspective and distortion",
                "advanced text manipulation with style preservation",
                "clean text removal and insertion with background recovery"
            ],
            "光线调整": [
                "professional lighting enhancement with natural shadows",
                "studio lighting simulation with directional control",
                "ambient light modification with mood preservation",
                "advanced exposure correction with highlight and shadow recovery",
                "cinematic lighting effects with realistic light propagation"
            ],
            "透视校正": [
                "professional lens distortion and perspective correction",
                "architectural straightening with proportion preservation",
                "advanced geometric transformation with content awareness",
                "keystone correction with automatic crop optimization",
                "wide-angle distortion removal with natural field of view"
            ],
            "模糊/锐化": [
                "selective focus adjustment with depth-aware processing",
                "professional bokeh simulation with realistic blur circles",
                "intelligent sharpening with edge preservation",
                "motion blur addition or removal with directional control",
                "tilt-shift effect with miniature scene simulation"
            ],
            "局部变形": [
                "precise mesh-based warping with smooth transitions",
                "intelligent liquify with automatic proportion adjustment",
                "professional shape modification with natural deformation",
                "content-aware scaling with important feature preservation",
                "advanced morphing with realistic tissue behavior"
            ],
            "构图调整": [
                "professional reframing with rule of thirds optimization",
                "intelligent cropping with subject-aware composition",
                "dynamic layout adjustment with visual balance enhancement",
                "golden ratio composition with automatic guide alignment",
                "cinematic aspect ratio conversion with content preservation"
            ],
            "通用编辑": [
                "comprehensive image optimization with intelligent enhancement",
                "multi-aspect improvement with balanced adjustments",
                "professional post-processing with workflow automation",
                "adaptive editing with content-aware optimization",
                "flexible enhancement pipeline with customizable parameters"
            ]
        }
        
        # 方案A - 应用场景专业引导词 (随机选择变体)
        scenario_enhancements = {
            "电商产品": [
                "clean e-commerce presentation with pure white background and studio lighting",
                "professional product showcase with shadow detail and color accuracy",
                "commercial quality with floating product and reflection effects",
                "marketplace-ready presentation with standardized lighting setup",
                "retail-optimized display with crisp edges and neutral backdrop"
            ],
            "社交媒体": [
                "Instagram-worthy aesthetic with vibrant colors and high engagement appeal",
                "viral-ready content with thumb-stopping visual impact",
                "influencer-style presentation with trendy filters and effects",
                "platform-optimized format with mobile-first composition",
                "shareable content with emotional resonance and visual storytelling"
            ],
            "营销活动": [
                "compelling campaign visual with strong brand message integration",
                "conversion-focused design with clear call-to-action placement",
                "professional advertising quality with psychological impact",
                "multi-channel campaign asset with consistent brand identity",
                "high-impact promotional material with memorable visual hook"
            ],
            "人像摄影": [
                "executive headshot quality with confident professional presence",
                "LinkedIn-optimized portrait with approachable business aesthetic",
                "corporate photography standard with formal lighting setup",
                "professional profile image with personality and credibility",
                "studio portrait quality with flattering light and composition"
            ],
            "生活方式": [
                "authentic lifestyle capture with natural, candid moments",
                "aspirational living aesthetic with warm, inviting atmosphere",
                "editorial lifestyle quality with storytelling elements",
                "wellness-focused imagery with organic, mindful presentation",
                "contemporary lifestyle documentation with relatable scenarios"
            ],
            "美食摄影": [
                "appetizing food presentation with steam and freshness indicators",
                "culinary art photography with ingredient highlighting",
                "restaurant menu quality with professional food styling",
                "cookbook-worthy capture with recipe visualization",
                "gourmet presentation with texture emphasis and garnish details"
            ],
            "房地产": [
                "MLS-ready property showcase with wide-angle room capture",
                "architectural photography standard with vertical line correction",
                "luxury real estate presentation with HDR processing",
                "virtual tour quality with consistent exposure across rooms",
                "property listing optimization with bright, spacious feel"
            ],
            "时尚零售": [
                "editorial fashion quality with dynamic pose and movement",
                "lookbook presentation with outfit detail emphasis",
                "runway-inspired capture with dramatic lighting",
                "e-commerce fashion standard with consistent model positioning",
                "luxury brand aesthetic with premium texture showcase"
            ],
            "汽车展示": [
                "showroom quality presentation with paint reflection detail",
                "automotive advertising standard with dynamic angle selection",
                "dealership display quality with feature highlighting",
                "car enthusiast photography with performance emphasis",
                "luxury vehicle showcase with premium detailing focus"
            ],
            "美妆化妆品": [
                "beauty campaign quality with flawless skin retouching",
                "cosmetic product showcase with texture and color accuracy",
                "makeup artistry documentation with before/after clarity",
                "skincare photography with healthy glow emphasis",
                "beauty editorial standard with artistic color grading"
            ],
            "企业品牌": [
                "brand guideline compliant with consistent visual identity",
                "corporate communication standard with professional polish",
                "annual report quality with data visualization clarity",
                "company culture showcase with authentic employee moments",
                "B2B presentation standard with trust-building imagery"
            ],
            "活动摄影": [
                "event documentation with decisive moment capture",
                "conference photography standard with speaker and audience coverage",
                "wedding photography quality with emotional storytelling",
                "concert capture with stage lighting and crowd energy",
                "corporate event coverage with networking moment emphasis"
            ],
            "产品目录": [
                "catalog-ready presentation with consistent angle and lighting",
                "technical documentation quality with detail visibility",
                "e-commerce grid compatibility with standardized framing",
                "print catalog standard with color accuracy and sharpness",
                "inventory photography with SKU identification clarity"
            ],
            "艺术创作": [
                "gallery-worthy artistic interpretation with conceptual depth",
                "fine art photography standard with emotional expression",
                "creative vision with experimental technique application",
                "artistic portfolio quality with unique visual signature",
                "contemporary art aesthetic with boundary-pushing composition"
            ],
            "纪实摄影": [
                "photojournalistic integrity with unaltered reality capture",
                "documentary storytelling with contextual environment",
                "street photography aesthetic with decisive moment timing",
                "reportage quality with narrative sequence potential",
                "archival documentation standard with historical accuracy"
            ],
            "自动选择": [
                "AI-optimized enhancement with intelligent scene detection",
                "automatic quality improvement with balanced adjustments",
                "smart processing with content-aware optimization",
                "one-click enhancement with professional results",
                "adaptive editing with machine learning refinement"
            ]
        }
        
        # 随机选择变体以增加多样性
        intent_options = intent_templates.get(editing_intent, intent_templates["通用编辑"])
        scenario_options = scenario_enhancements.get(application_scenario, scenario_enhancements["自动选择"])
        
        selected_intent = random.choice(intent_options)
        selected_scenario = random.choice(scenario_options)
        
        return f"{selected_intent}, {selected_scenario}"
    
    def _call_ollama_api(self, prompt: str, model: str, temperature: float, 
                        seed: int, ollama_url: str) -> str:
        """调用Ollama API生成提示词"""
        try:
            if not REQUESTS_AVAILABLE:
                raise Exception("requests库未安装，无法调用Ollama API")
            
            # 简化系统提示词 - 适合小模型
            system_prompt = """You generate English image editing instructions. Output only the instruction, no explanation."""
            
            # 简化用户提示词 - 直接给出目标格式
            user_prompt = f"""Task: {prompt}

Write one English sentence that describes how to edit the image. Start with an action word like "Transform", "Remove", "Add", or "Enhance". 

Example format: "Transform the selected area to red color with natural blending and professional quality"

Your instruction:"""
            
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
                    "num_predict": 200,
                    "top_k": 20,
                    "top_p": 0.8,
                    "repeat_penalty": 1.05
                }
            }
            
            
            response = requests.post(api_url, json=payload, timeout=60)
            response.raise_for_status()
            
            result = response.json()
            generated_text = result.get('response', '').strip()
            
            
            if not generated_text:
                raise Exception(f"模型返回空响应: {result}")
            
            # 清理响应
            cleaned_text = self._clean_response(generated_text)
            
            return cleaned_text
            
        except Exception as e:
            # 返回备用模板
            return self._get_fallback_prompt(prompt)
    
    def _clean_response(self, response: str) -> str:
        """清理Ollama响应，提取实际的编辑指令"""
        import re
        
        if not response:
            return "Apply professional editing to the selected area with high quality results"
        
        
        # 1. 处理 <think> 标签 - 提取思考后的内容
        if '<think>' in response:
            # 查找 </think> 后的内容
            think_end = response.find('</think>')
            if think_end != -1:
                after_think = response[think_end + 8:].strip()
                if after_think:
                    response = after_think
                else:
                    # 如果 </think> 后没有内容，尝试提取 <think> 内的最后一句
                    think_content = response[response.find('<think>') + 7:think_end]
                    # 查找最后一个完整的英文句子
                    sentences = re.findall(r'[A-Z][^.!?]*[.!?]', think_content)
                    if sentences:
                        response = sentences[-1].strip()
        
        # 2. 提取英文编辑指令句子
        # 查找以动词开头的完整英文句子
        instruction_patterns = [
            r'(Transform[^.!?]*[.!?])',
            r'(Remove[^.!?]*[.!?])',
            r'(Add[^.!?]*[.!?])',
            r'(Enhance[^.!?]*[.!?])',
            r'(Apply[^.!?]*[.!?])',
            r'(Change[^.!?]*[.!?])',
            r'(Convert[^.!?]*[.!?])',
            r'([A-Z][a-z]+\s+the\s+selected[^.!?]*[.!?])'
        ]
        
        for pattern in instruction_patterns:
            matches = re.findall(pattern, response, re.IGNORECASE)
            if matches:
                instruction = matches[0].strip()
                return instruction
        
        # 3. fallback - 查找任何完整的英文句子
        english_sentences = re.findall(r'[A-Z][a-zA-Z\s,\.;:\-!?()]+[\.!?]', response)
        if english_sentences:
            # 选择最长的句子
            longest = max(english_sentences, key=len)
            if len(longest) > 15:
                return longest.strip()
        
        # 4. 最终清理
        cleaned = re.sub(r'^[:\-\s<>]+', '', response)  # 移除开头的符号
        cleaned = re.sub(r'[<>].*?[<>]', '', cleaned)   # 移除标签
        cleaned = re.sub(r'\n+', ' ', cleaned)          # 替换换行符
        cleaned = re.sub(r'\s+', ' ', cleaned)          # 合并多余空格
        
        result = cleaned.strip()
        return result if result else "Apply professional editing to the selected area with high quality results"
    
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
            
            # 构建完整的提示词
            if custom_guidance:
                full_prompt = f"{description}\n\n自定义引导: {custom_guidance}"
            elif editing_intent == "无" and application_scenario == "无":
                # 当编辑意图和处理风格都为"无"时，直接使用用户描述，不添加引导词
                full_prompt = description
            elif editing_intent == "无" or application_scenario == "无":
                # 当其中一个为"无"时，只使用另一个生成引导词
                if editing_intent != "无":
                    guidance_template = self._get_guidance_template(editing_intent, "自动选择")
                else:
                    guidance_template = self._get_guidance_template("通用编辑", application_scenario)
                full_prompt = f"{description}\n\n引导模板: {guidance_template}"
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
            
            
            return (generated_prompt,)
            
        except Exception as e:
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

