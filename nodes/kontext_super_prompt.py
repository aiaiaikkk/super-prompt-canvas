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

# 导入配置管理器
try:
    from config_manager import config_manager, get_api_key, save_api_key, get_api_settings, save_api_settings
    CONFIG_AVAILABLE = True
    print("[Kontext Super Prompt] Configuration manager loaded successfully")
except ImportError as e:
    CONFIG_AVAILABLE = False
    print(f"[Kontext Super Prompt] Configuration manager not available: {e}")

# 方案A专业引导词库
GUIDANCE_LIBRARY_A = {
    "editing_intents": {
        "color_adjustment": [
            "precise color grading and tonal balance adjustment",
            "selective color modification with natural transitions",
            "hue, saturation and luminance fine-tuning",
            "color harmony optimization and palette refinement",
            "advanced color correction with preserved details"
        ],
        "object_removal": [
            "seamless object erasure with intelligent content-aware fill",
            "advanced inpainting with texture and pattern reconstruction",
            "clean removal with contextual background regeneration",
            "professional retouching with invisible object extraction",
            "content-aware deletion with natural scene completion"
        ],
        "object_replacement": [
            "intelligent object substitution with matched lighting and perspective",
            "seamless element swapping with proper shadow and reflection",
            "context-aware replacement maintaining scene coherence",
            "professional object exchange with realistic integration",
            "smart substitution with automatic color and scale matching"
        ],
        "object_addition": [
            "realistic object insertion with proper depth and occlusion",
            "natural element placement with accurate shadows and lighting",
            "contextual object addition with scene-aware compositing",
            "professional element integration with believable interactions",
            "intelligent object placement with automatic perspective matching"
        ],
        "background_change": [
            "professional background replacement with edge refinement",
            "environmental substitution with matched lighting conditions",
            "seamless backdrop swapping with hair and transparency handling",
            "studio-quality background modification with depth preservation",
            "intelligent scene replacement with automatic color grading"
        ],
        "face_swap": [
            "advanced facial replacement with expression preservation",
            "seamless face swapping with skin tone matching",
            "professional identity transfer with natural blending",
            "intelligent facial substitution with feature alignment",
            "realistic face exchange with age and lighting adaptation"
        ],
        "quality_enhancement": [
            "professional upscaling with detail enhancement and noise reduction",
            "AI-powered quality improvement with texture preservation",
            "advanced sharpening and clarity optimization",
            "intelligent detail recovery with artifact removal",
            "studio-grade enhancement with dynamic range expansion"
        ],
        "image_restoration": [
            "professional damage repair and artifact removal",
            "historical photo restoration with detail reconstruction",
            "advanced scratch and tear healing with texture synthesis",
            "intelligent restoration with color and contrast recovery",
            "museum-quality preservation with authentic detail retention"
        ],
        "style_transfer": [
            "artistic style application with content preservation",
            "professional aesthetic transformation with selective stylization",
            "intelligent style mapping with detail retention",
            "creative interpretation with balanced artistic expression",
            "advanced neural style transfer with customizable intensity"
        ],
        "text_editing": [
            "professional typography modification and text replacement",
            "intelligent text editing with font matching",
            "seamless text overlay with proper perspective and distortion",
            "advanced text manipulation with style preservation",
            "clean text removal and insertion with background recovery"
        ],
        "lighting_adjustment": [
            "professional lighting enhancement with natural shadows",
            "studio lighting simulation with directional control",
            "ambient light modification with mood preservation",
            "advanced exposure correction with highlight and shadow recovery",
            "cinematic lighting effects with realistic light propagation"
        ],
        "perspective_correction": [
            "professional lens distortion and perspective correction",
            "architectural straightening with proportion preservation",
            "advanced geometric transformation with content awareness",
            "keystone correction with automatic crop optimization",
            "wide-angle distortion removal with natural field of view"
        ],
        "blur_sharpen": [
            "selective focus adjustment with depth-aware processing",
            "professional bokeh simulation with realistic blur circles",
            "intelligent sharpening with edge preservation",
            "motion blur addition or removal with directional control",
            "tilt-shift effect with miniature scene simulation"
        ],
        "local_deformation": [
            "precise mesh-based warping with smooth transitions",
            "intelligent liquify with automatic proportion adjustment",
            "professional shape modification with natural deformation",
            "content-aware scaling with important feature preservation",
            "advanced morphing with realistic tissue behavior"
        ],
        "composition_adjustment": [
            "professional reframing with rule of thirds optimization",
            "intelligent cropping with subject-aware composition",
            "dynamic layout adjustment with visual balance enhancement",
            "golden ratio composition with automatic guide alignment",
            "cinematic aspect ratio conversion with content preservation"
        ],
        "general_editing": [
            "comprehensive image optimization with intelligent enhancement",
            "multi-aspect improvement with balanced adjustments",
            "professional post-processing with workflow automation",
            "adaptive editing with content-aware optimization",
            "flexible enhancement pipeline with customizable parameters"
        ]
    },
    "processing_styles": {
        "ecommerce_product": [
            "clean e-commerce presentation with pure white background and studio lighting",
            "professional product showcase with shadow detail and color accuracy",
            "commercial quality with floating product and reflection effects",
            "marketplace-ready presentation with standardized lighting setup",
            "retail-optimized display with crisp edges and neutral backdrop"
        ],
        "social_media": [
            "Instagram-worthy aesthetic with vibrant colors and high engagement appeal",
            "viral-ready content with thumb-stopping visual impact",
            "influencer-style presentation with trendy filters and effects",
            "platform-optimized format with mobile-first composition",
            "shareable content with emotional resonance and visual storytelling"
        ],
        "marketing_campaign": [
            "compelling campaign visual with strong brand message integration",
            "conversion-focused design with clear call-to-action placement",
            "professional advertising quality with psychological impact",
            "multi-channel campaign asset with consistent brand identity",
            "high-impact promotional material with memorable visual hook"
        ],
        "portrait_professional": [
            "executive headshot quality with confident professional presence",
            "LinkedIn-optimized portrait with approachable business aesthetic",
            "corporate photography standard with formal lighting setup",
            "professional profile image with personality and credibility",
            "studio portrait quality with flattering light and composition"
        ],
        "lifestyle": [
            "authentic lifestyle capture with natural, candid moments",
            "aspirational living aesthetic with warm, inviting atmosphere",
            "editorial lifestyle quality with storytelling elements",
            "wellness-focused imagery with organic, mindful presentation",
            "contemporary lifestyle documentation with relatable scenarios"
        ],
        "food_photography": [
            "appetizing food presentation with steam and freshness indicators",
            "culinary art photography with ingredient highlighting",
            "restaurant menu quality with professional food styling",
            "cookbook-worthy capture with recipe visualization",
            "gourmet presentation with texture emphasis and garnish details"
        ],
        "real_estate": [
            "MLS-ready property showcase with wide-angle room capture",
            "architectural photography standard with vertical line correction",
            "luxury real estate presentation with HDR processing",
            "virtual tour quality with consistent exposure across rooms",
            "property listing optimization with bright, spacious feel"
        ],
        "fashion_retail": [
            "editorial fashion quality with dynamic pose and movement",
            "lookbook presentation with outfit detail emphasis",
            "runway-inspired capture with dramatic lighting",
            "e-commerce fashion standard with consistent model positioning",
            "luxury brand aesthetic with premium texture showcase"
        ],
        "automotive": [
            "showroom quality presentation with paint reflection detail",
            "automotive advertising standard with dynamic angle selection",
            "dealership display quality with feature highlighting",
            "car enthusiast photography with performance emphasis",
            "luxury vehicle showcase with premium detailing focus"
        ],
        "beauty_cosmetics": [
            "beauty campaign quality with flawless skin retouching",
            "cosmetic product showcase with texture and color accuracy",
            "makeup artistry documentation with before/after clarity",
            "skincare photography with healthy glow emphasis",
            "beauty editorial standard with artistic color grading"
        ],
        "corporate_branding": [
            "brand guideline compliant with consistent visual identity",
            "corporate communication standard with professional polish",
            "annual report quality with data visualization clarity",
            "company culture showcase with authentic employee moments",
            "B2B presentation standard with trust-building imagery"
        ],
        "event_photography": [
            "event documentation with decisive moment capture",
            "conference photography standard with speaker and audience coverage",
            "wedding photography quality with emotional storytelling",
            "concert capture with stage lighting and crowd energy",
            "corporate event coverage with networking moment emphasis"
        ],
        "product_catalog": [
            "catalog-ready presentation with consistent angle and lighting",
            "technical documentation quality with detail visibility",
            "e-commerce grid compatibility with standardized framing",
            "print catalog standard with color accuracy and sharpness",
            "inventory photography with SKU identification clarity"
        ],
        "artistic_creation": [
            "gallery-worthy artistic interpretation with conceptual depth",
            "fine art photography standard with emotional expression",
            "creative vision with experimental technique application",
            "artistic portfolio quality with unique visual signature",
            "contemporary art aesthetic with boundary-pushing composition"
        ],
        "documentary": [
            "photojournalistic integrity with unaltered reality capture",
            "documentary storytelling with contextual environment",
            "street photography aesthetic with decisive moment timing",
            "reportage quality with narrative sequence potential",
            "archival documentation standard with historical accuracy"
        ],
        "auto_smart": [
            "AI-optimized enhancement with intelligent scene detection",
            "automatic quality improvement with balanced adjustments",
            "smart processing with content-aware optimization",
            "one-click enhancement with professional results",
            "adaptive editing with machine learning refinement"
        ]
    }
}

def get_intent_guidance(intent_key):
    """获取编辑意图引导词（方案A）"""
    options = GUIDANCE_LIBRARY_A["editing_intents"].get(intent_key, GUIDANCE_LIBRARY_A["editing_intents"]["general_editing"])
    return random.choice(options)

def get_style_guidance(style_key):
    """获取处理风格引导词（方案A）"""
    options = GUIDANCE_LIBRARY_A["processing_styles"].get(style_key, GUIDANCE_LIBRARY_A["processing_styles"]["auto_smart"])
    return random.choice(options)

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
        # 从配置管理器加载默认设置
        api_settings = {}
        ollama_settings = {}
        ui_settings = {}
        
        if CONFIG_AVAILABLE:
            try:
                api_settings = get_api_settings()
                ollama_settings = config_manager.get_ollama_settings()
                ui_settings = config_manager.get_ui_settings()
            except Exception as e:
                print(f"[Kontext Super Prompt] Failed to load settings: {e}")
        
        return {
            "required": {
                "layer_info": ("LAYER_INFO",),
                "image": ("IMAGE",),
            },
            "hidden": {
                "unique_id": "UNIQUE_ID",
                "tab_mode": (["manual", "api", "ollama"], {"default": ui_settings.get("last_tab", "manual")}),
                "edit_mode": (["局部编辑", "全局编辑", "文字编辑", "专业操作"], {"default": "局部编辑"}),
                "operation_type": ("STRING", {"default": "", "multiline": False}),
                "description": ("STRING", {"default": "", "multiline": True}),
                "constraint_prompts": ("STRING", {"default": "", "multiline": True}),
                "decorative_prompts": ("STRING", {"default": "", "multiline": True}),
                "selected_layers": ("STRING", {"default": "", "multiline": True}),
                "auto_generate": ("BOOLEAN", {"default": True}),
                "generated_prompt": ("STRING", {"default": "", "multiline": True}),
                
                # API选项卡参数 - 从配置加载默认值
                "api_provider": ("STRING", {"default": api_settings.get("last_provider", "siliconflow")}),
                "api_key": ("STRING", {"default": "", "placeholder": "API密钥将自动保存和加载"}),
                "api_model": ("STRING", {"default": api_settings.get("last_model", "deepseek-ai/DeepSeek-V3")}),
                "api_editing_intent": ("STRING", {"default": api_settings.get("last_editing_intent", "general_editing")}),
                "api_processing_style": ("STRING", {"default": api_settings.get("last_processing_style", "auto_smart")}),
                "api_seed": ("INT", {"default": 0}),
                "api_custom_guidance": ("STRING", {"default": "", "multiline": True}),
                
                # Ollama选项卡参数 - 从配置加载默认值
                "ollama_url": ("STRING", {"default": ollama_settings.get("last_url", "http://127.0.0.1:11434")}),
                "ollama_model": ("STRING", {"default": ollama_settings.get("last_model", "")}),
                "ollama_temperature": ("FLOAT", {"default": ollama_settings.get("last_temperature", 0.7)}),
                "ollama_editing_intent": ("STRING", {"default": ollama_settings.get("last_editing_intent", "general_editing")}),
                "ollama_processing_style": ("STRING", {"default": ollama_settings.get("last_processing_style", "auto_smart")}),
                "ollama_seed": ("INT", {"default": 42}),
                "ollama_custom_guidance": ("STRING", {"default": "", "multiline": True}),
                "ollama_enable_visual": ("BOOLEAN", {"default": ollama_settings.get("enable_visual", False)}),
                "ollama_auto_unload": ("BOOLEAN", {"default": ollama_settings.get("auto_unload", False)}),
            },
        }
    
    RETURN_TYPES = ("IMAGE", "STRING")
    RETURN_NAMES = ("edited_image", "generated_prompt")
    FUNCTION = "process_super_prompt"
    CATEGORY = CATEGORY_TYPE
    OUTPUT_NODE = False
    
    def __init__(self):
        """初始化节点并自动填充保存的设置"""
        super().__init__()
        
        # 如果配置管理器可用，自动填充保存的API密钥
        if CONFIG_AVAILABLE:
            try:
                self._auto_fill_saved_settings()
            except Exception as e:
                print(f"[Kontext] 自动填充设置失败: {e}")
    
    def _auto_fill_saved_settings(self):
        """自动填充保存的设置"""
        if not hasattr(self, 'widgets') or not self.widgets:
            return
            
        # 获取保存的设置
        api_settings = get_api_settings()
        ollama_settings = config_manager.get_ollama_settings()
        
        # 自动填充API密钥
        api_provider_widget = next((w for w in self.widgets if hasattr(w, 'name') and w.name == "api_provider"), None)
        api_key_widget = next((w for w in self.widgets if hasattr(w, 'name') and w.name == "api_key"), None)
        
        if api_provider_widget and api_key_widget:
            provider = api_provider_widget.value
            saved_key = get_api_key(provider)
            if saved_key and (not api_key_widget.value or api_key_widget.value.strip() == ""):
                api_key_widget.value = saved_key
                print(f"[Kontext] 自动填充 {provider} API密钥")
    
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
            # 保存用户设置到配置管理器
            if CONFIG_AVAILABLE:
                try:
                    # 保存UI设置（当前选项卡）
                    config_manager.save_ui_settings(tab_mode)
                    
                    # 如果是API模式，保存API设置和密钥
                    if tab_mode == "api":
                        if api_key and api_key.strip():
                            save_api_key(api_provider, api_key.strip())
                            print(f"[Kontext] API密钥已保存为 {api_provider}")
                        
                        save_api_settings(api_provider, api_model, api_editing_intent, api_processing_style)
                        
                        # 如果没有提供API密钥，尝试从配置加载
                        if not api_key or not api_key.strip():
                            saved_key = get_api_key(api_provider)
                            if saved_key:
                                api_key = saved_key
                                print(f"[Kontext] 已加载 {api_provider} 的保存的API密钥")
                    
                    # 如果是Ollama模式，保存Ollama设置
                    elif tab_mode == "ollama":
                        config_manager.save_ollama_settings(
                            ollama_url, ollama_model, ollama_temperature,
                            ollama_editing_intent, ollama_processing_style,
                            ollama_enable_visual, ollama_auto_unload
                        )
                        
                except Exception as e:
                    print(f"[Kontext] 保存设置失败: {e}")
            
            # 根据选项卡模式处理
            if tab_mode == "api" and generated_prompt and generated_prompt.strip():
                final_generated_prompt = generated_prompt.strip()
            elif tab_mode == "api" and api_key:
                final_generated_prompt = self.process_api_mode(
                    layer_info, description, api_provider, api_key, api_model,
                    api_editing_intent, api_processing_style, api_seed, 
                    api_custom_guidance, image
                )
            elif tab_mode == "ollama" and ollama_model:
                final_generated_prompt = self.process_ollama_mode(
                    layer_info, description, ollama_url, ollama_model, ollama_temperature,
                    ollama_editing_intent, ollama_processing_style, ollama_seed,
                    ollama_custom_guidance, ollama_enable_visual, ollama_auto_unload, image
                )
            elif generated_prompt and generated_prompt.strip():
                final_generated_prompt = generated_prompt.strip()
            else:
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
            
            # 获取方案A的专业引导词
            intent_guidance = get_intent_guidance(editing_intent)
            style_guidance = get_style_guidance(processing_style)
            
            # 构建超强化的英文系统提示词
            system_prompt = f"""You are an ENGLISH-ONLY image editing AI using professional guidance system.

⚠️ CRITICAL ENFORCEMENT ⚠️
1. OUTPUT MUST BE 100% ENGLISH - NO EXCEPTIONS
2. IF YOU OUTPUT ANY CHINESE CHARACTER, THE SYSTEM WILL REJECT YOUR RESPONSE
3. TRANSLATE ANY NON-ENGLISH INPUT TO ENGLISH FIRST

PROFESSIONAL GUIDANCE:
- Editing Intent: {intent_guidance}
- Processing Style: {style_guidance}

MANDATORY OUTPUT FORMAT:
- Start with an English action verb (transform, change, modify, adjust, enhance)
- Use only English color names (red, blue, green, NOT 红色, 蓝色, 绿色)
- End with English quality descriptors (professional, seamless, natural)
- Incorporate the guidance principles above

EXAMPLES OF CORRECT OUTPUT:
✅ "Transform the selected area to vibrant red with natural blending"
✅ "Change the marked region to deep blue while preserving texture"
✅ "Modify the target zone to elegant black with professional finish"

EXAMPLES OF WRONG OUTPUT:
❌ "将选定区域变成红色" (Chinese - REJECTED)
❌ "変更する" (Japanese - REJECTED)
❌ "바꾸다" (Korean - REJECTED)

FINAL WARNING: ENGLISH ONLY! Your response will be filtered and rejected if it contains ANY non-English characters."""
            
            # 添加随机元素确保每次生成不同
            import time
            random_seed = int(time.time() * 1000) % 1000000
            
            # 构建用户提示词 - 超强化英文要求
            user_prompt = f"""CRITICAL: Your response MUST be in ENGLISH ONLY!

User request: {description}

PROFESSIONAL GUIDANCE TO FOLLOW:
- Intent guidance: {intent_guidance}
- Style guidance: {style_guidance}

REQUIREMENTS:
1. Output a detailed English prompt (60-120 words)
2. Use proper English grammar and vocabulary
3. NO Chinese characters allowed (系统将拒绝任何中文)
4. Start with an action verb in English
5. Include specific English descriptors and professional terms
6. Incorporate the professional guidance above
7. Provide detailed technical specifications and quality requirements

{f'Additional guidance: {custom_guidance}' if custom_guidance else ''}

Variation seed: {random_seed}

REMEMBER: ENGLISH ONLY! Any non-English output will be rejected."""
            
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
                'max_tokens': 350,  # 提高token限制以支持更详细的输出
                'top_p': 0.9,
                'presence_penalty': 0.1,  # 避免重复
                'frequency_penalty': 0.1,  # 增加多样性
                'language': 'en'  # 强制英文输出（某些API支持）
            }
            
            response = requests.post(api_config['base_url'], headers=headers, json=data, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            api_response = result['choices'][0]['message']['content']
            
            # 调试：显示原始响应
            
            # 清理响应，提取纯净提示词
            cleaned_response = self._clean_api_response(api_response)
            
            # 二次验证：确保没有中文
            if cleaned_response and any('\u4e00' <= char <= '\u9fff' for char in cleaned_response):
                print(f"[Kontext Super Prompt] ⚠️ 清理后仍包含中文，使用备用英文")
                # 根据描述生成备用英文
                if 'color' in description.lower() or '颜色' in description:
                    return "Transform the selected area to the specified color with natural blending"
                elif 'remove' in description.lower() or '删除' in description or '移除' in description:
                    return "Remove the selected object seamlessly from the image"
                elif 'add' in description.lower() or '添加' in description:
                    return "Add the requested element to the selected area naturally"
                elif 'style' in description.lower() or '风格' in description:
                    return "Apply the specified style transformation to the marked region"
                else:
                    return "Edit the selected area according to the specified requirements"
            
            return cleaned_response if cleaned_response else "Apply professional editing to the marked area"
                
        except Exception as e:
            print(f"[Kontext Super Prompt] API模式处理错误: {e}")
            return f"API处理错误: {description or '无描述'}"
    
    def process_ollama_mode(self, layer_info, description, ollama_url, ollama_model, 
                           temperature, editing_intent, processing_style, seed,
                           custom_guidance, enable_visual, auto_unload, image):
        """处理Ollama模式的提示词生成 - 强制英文输出"""
        try:
            import requests
            
            # 构建强制英文的系统提示词
            system_prompt = """You are an ENGLISH-ONLY image editing assistant using Ollama.

CRITICAL RULES:
1. Output in ENGLISH ONLY
2. Never use Chinese characters or any other language
3. Generate ONE clear English instruction (30-60 words)
4. Use proper English color names and terms

If input is in Chinese, translate to English first.

FORMAT: [English verb] [target] to [English result], [quality terms].

REMEMBER: ENGLISH ONLY OUTPUT."""
            
            # 构建用户提示词
            user_prompt = f"Generate ENGLISH editing instruction for: {description}"
            if custom_guidance:
                user_prompt += f" Additional: {custom_guidance}"
            user_prompt += "\nOUTPUT IN ENGLISH ONLY."
            
            # 调用Ollama API
            response = requests.post(
                f"{ollama_url}/api/generate",
                json={
                    "model": ollama_model,
                    "prompt": user_prompt,
                    "system": system_prompt,
                    "temperature": temperature,
                    "seed": seed,
                    "stream": False,
                    "options": {
                        "num_predict": 200,  # 限制输出长度
                        "stop": ["\n\n", "###", "---"],  # 停止标记
                    }
                },
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                generated_text = result.get('response', '')
                
                # 清理和验证输出
                cleaned_text = self._clean_api_response(generated_text)
                
                # 检查是否包含中文字符
                if any('\u4e00' <= char <= '\u9fff' for char in cleaned_text):
                    # 如果包含中文，返回默认英文
                    return f"Transform marked area as requested: {description}"
                
                return cleaned_text if cleaned_text else f"Transform marked area: {description}"
            else:
                return f"Ollama request failed: {description}"
                
        except Exception as e:
            print(f"[Kontext Super Prompt] Ollama模式处理错误: {e}")
            # 返回英文fallback
            return f"Apply editing to marked area: {description}"
    
    def _clean_api_response(self, response):
        """清理API响应，确保只输出英文提示词"""
        import re
        
        if not response:
            return "Edit the selected area as requested"
        
        # 检测中文字符
        chinese_pattern = re.compile('[\u4e00-\u9fff]+')
        has_chinese = bool(chinese_pattern.search(response))
        
        # 如果包含中文，进行强力处理
        if has_chinese:
            print(f"[Kontext Super Prompt] ⚠️ API返回包含中文，强制转换为英文")
            
            # 尝试提取所有英文句子
            english_sentences = re.findall(r'[A-Z][a-zA-Z\s,\.\-;:]+[\.]', response)
            if english_sentences:
                # 找到最长的英文句子
                longest = max(english_sentences, key=len)
                if len(longest) > 30:
                    return longest.strip()
            
            # 尝试提取任何英文片段
            english_parts = re.findall(r'[a-zA-Z][a-zA-Z\s,\.\-]+', response)
            if english_parts:
                # 过滤太短的片段
                valid_parts = [p for p in english_parts if len(p) > 10]
                if valid_parts:
                    # 合并有效的英文部分
                    english_text = ' '.join(valid_parts)
                    if len(english_text) > 20:
                        return english_text.strip()
            
            # 如果无法提取有效英文，返回通用英文指令
            return "Apply the requested editing to the marked area with professional quality"
        
        # 如果响应包含多个Prompt编号，只提取第一个
        if '### Prompt' in response or 'Prompt 1:' in response:
            
            # 尝试提取第一个引号内的提示词
            first_quoted_match = re.search(r'"([^"]{30,})"', response)
            if first_quoted_match:
                return first_quoted_match.group(1).strip()
            
            # 尝试提取第一个提示词段落
            first_prompt_match = re.search(r'(?:Prompt \d+:.*?)"([^"]+)"', response, re.DOTALL)
            if first_prompt_match:
                return first_prompt_match.group(1).strip()
        
        # 尝试提取引号中的提示词
        quoted_match = re.search(r'"([^"]{30,})"', response)
        if quoted_match:
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
            return code_block_match.group(1).strip()
        
        # 应用清理模式
        for pattern in patterns_to_remove:
            cleaned = re.sub(pattern, '', cleaned, flags=re.MULTILINE | re.IGNORECASE)
        
        # 清理多余空行
        cleaned = re.sub(r'\n{2,}', '\n', cleaned).strip()
        
        # 如果没有做任何处理或结果太短，返回原始内容
        if not cleaned or len(cleaned) < 10:
            return response.strip()
        
        return cleaned.strip()


# 注册节点
NODE_CLASS_MAPPINGS = {
    "KontextSuperPrompt": KontextSuperPrompt,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "KontextSuperPrompt": "🎯 Kontext Super Prompt",
}

