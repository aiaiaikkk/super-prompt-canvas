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

# 导入增强约束系统
try:
    from .intelligent_constraint_generator import intelligent_constraint_generator
    ENHANCED_SYSTEM_AVAILABLE = True
    print("[Kontext Super Prompt] 增强约束系统已加载")
except ImportError as e:
    ENHANCED_SYSTEM_AVAILABLE = False
    intelligent_constraint_generator = None
    print(f"[Kontext Super Prompt] 增强约束系统加载失败: {e}")

# 配置管理器已移除，API密钥需要每次手动输入
CONFIG_AVAILABLE = False

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

CATEGORY_TYPE = "🎨 Super Canvas"

class KontextSuperPrompt:
    """
    Kontext超级提示词生成器节点
    复现Visual Prompt Editor的完整编辑功能
    """
    
    # 增强约束系统 - 基于1026数据集分析的三层约束架构
    ENHANCED_CONSTRAINT_SYSTEM = {
        # 第一层：操作特异性约束映射
        'operation_constraints': {
            'add': ['seamless visual integration', 'perspective geometry alignment', 'natural edge transitions'],
            'remove': ['content-aware background reconstruction', 'invisible trace elimination', 'natural background extension'],
            'color': ['color space management precision', 'natural color transitions', 'material authenticity preservation'],
            'shape': ['morphological structure preservation', 'proportional scaling accuracy', 'surface continuity maintenance'],
            'text': ['typographic hierarchy support', 'readability optimization', 'professional typography standards'],
            'background': ['lighting condition matching', 'atmospheric perspective alignment', 'seamless compositing quality']
        },
        
        # 第二层：认知负荷适配约束
        'cognitive_constraints': {
            'low_complexity': ['precise technical execution', 'quality standard compliance', 'immediate visual feedback'],
            'medium_complexity': ['professional polish integration', 'contextual appropriateness', 'commercial viability assurance'],
            'high_complexity': ['conceptual innovation achievement', 'artistic expression authenticity', 'emotional resonance cultivation']
        },
        
        # 第三层：语义修饰词强度分级
        'semantic_modifiers': {
            'level_1_technical': ['precisely executed', 'technically accurate', 'systematically controlled', 'quality assured'],
            'level_2_professional': ['commercially viable', 'professionally polished', 'contextually optimized', 'aesthetically balanced'],
            'level_3_creative': ['conceptually revolutionary', 'artistically transcendent', 'culturally resonant', 'visually transformative']
        }
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
                pass
        
        return {
            "required": {
                "layer_info": ("LAYER_INFO",),
                "image": ("IMAGE",),
            },
            "optional": {
            },
            "hidden": {
                "unique_id": "UNIQUE_ID",
                "tab_mode": (["manual", "api", "ollama"], {"default": ui_settings.get("last_tab", "manual")}),
                "edit_mode": (["局部编辑", "全局编辑", "文字编辑", "专业操作"], {"default": "局部编辑"}),
                "operation_type": ("STRING", {"default": "", "multiline": False}),
                "constraint_prompts": ("STRING", {"default": "", "multiline": True}),
                "decorative_prompts": ("STRING", {"default": "", "multiline": True}),
                "selected_layers": ("STRING", {"default": "", "multiline": True}),
                "auto_generate": ("BOOLEAN", {"default": True}),
                
                # 局部编辑选项卡 - 持久化数据
                "local_description": ("STRING", {"default": "", "multiline": True}),
                "local_generated_prompt": ("STRING", {"default": "", "multiline": True}),
                "local_operation_type": ("STRING", {"default": "add_object"}),
                "local_selected_constraints": ("STRING", {"default": "", "multiline": True}),
                "local_selected_decoratives": ("STRING", {"default": "", "multiline": True}),
                
                # 全局编辑选项卡 - 持久化数据
                "global_description": ("STRING", {"default": "", "multiline": True}),
                "global_generated_prompt": ("STRING", {"default": "", "multiline": True}),
                "global_operation_type": ("STRING", {"default": "global_color_grade"}),
                "global_selected_constraints": ("STRING", {"default": "", "multiline": True}),
                "global_selected_decoratives": ("STRING", {"default": "", "multiline": True}),
                
                # 文字编辑选项卡 - 持久化数据
                "text_description": ("STRING", {"default": "", "multiline": True}),
                "text_generated_prompt": ("STRING", {"default": "", "multiline": True}),
                "text_operation_type": ("STRING", {"default": "text_add"}),
                "text_selected_constraints": ("STRING", {"default": "", "multiline": True}),
                "text_selected_decoratives": ("STRING", {"default": "", "multiline": True}),
                
                # 专业操作选项卡 - 持久化数据
                "professional_description": ("STRING", {"default": "", "multiline": True}),
                "professional_generated_prompt": ("STRING", {"default": "", "multiline": True}),
                "professional_operation_type": ("STRING", {"default": "geometric_warp"}),
                "professional_selected_constraints": ("STRING", {"default": "", "multiline": True}),
                "professional_selected_decoratives": ("STRING", {"default": "", "multiline": True}),
                
                # API选项卡 - 持久化数据
                "api_description": ("STRING", {"default": "", "multiline": True}),
                "api_generated_prompt": ("STRING", {"default": "", "multiline": True}),
                "api_provider": ("STRING", {"default": api_settings.get("last_provider", "siliconflow")}),
                "api_key": ("STRING", {"default": "", "placeholder": "API密钥将自动保存和加载"}),
                "api_model": ("STRING", {"default": api_settings.get("last_model", "deepseek-ai/DeepSeek-V3")}),
                "api_editing_intent": ("STRING", {"default": api_settings.get("last_editing_intent", "general_editing")}),
                "api_processing_style": ("STRING", {"default": api_settings.get("last_processing_style", "auto_smart")}),
                "api_seed": ("INT", {"default": 0}),
                "api_custom_guidance": ("STRING", {"default": "", "multiline": True}),
                
                # Ollama选项卡 - 持久化数据
                "ollama_description": ("STRING", {"default": "", "multiline": True}),
                "ollama_generated_prompt": ("STRING", {"default": "", "multiline": True}),
                "ollama_url": ("STRING", {"default": ollama_settings.get("last_url", "http://127.0.0.1:11434")}),
                "ollama_model": ("STRING", {"default": ollama_settings.get("last_model", "")}),
                "ollama_temperature": ("FLOAT", {"default": ollama_settings.get("last_temperature", 0.7)}),
                "ollama_editing_intent": ("STRING", {"default": ollama_settings.get("last_editing_intent", "general_editing")}),
                "ollama_processing_style": ("STRING", {"default": ollama_settings.get("last_processing_style", "auto_smart")}),
                "ollama_seed": ("INT", {"default": 42}),
                "ollama_custom_guidance": ("STRING", {"default": "", "multiline": True}),
                "ollama_enable_visual": ("BOOLEAN", {"default": ollama_settings.get("enable_visual", False)}),
                "ollama_auto_unload": ("BOOLEAN", {"default": ollama_settings.get("auto_unload", False)}),
                
                # 兼容旧版本 - 保留原始字段
                "description": ("STRING", {"default": "", "multiline": True}),
                "generated_prompt": ("STRING", {"default": "", "multiline": True}),
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
                pass
    
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
    
    @classmethod
    def IS_CHANGED(cls, **kwargs):
        # 智能变化检测：只在关键参数改变时触发重新执行
        # 这样既保持widget状态，又支持随机性和配置更新
        
        # 提取关键参数用于变化检测
        api_seed = kwargs.get("api_seed", 0)
        ollama_seed = kwargs.get("ollama_seed", 42)
        tab_mode = kwargs.get("tab_mode", "manual")
        api_provider = kwargs.get("api_provider", "siliconflow")
        api_model = kwargs.get("api_model", "")
        ollama_model = kwargs.get("ollama_model", "")
        
        # 构建变化检测字符串（不包含时间戳）
        change_factors = [
            f"api_seed:{api_seed}",
            f"ollama_seed:{ollama_seed}",
            f"tab_mode:{tab_mode}",
            f"api_provider:{api_provider}",
            f"api_model:{api_model}",
            f"ollama_model:{ollama_model}",
        ]
        
        change_string = "|".join(change_factors)
        return change_string
    
    def process_super_prompt(self, layer_info, image, 
                           # Optional参数 - 每个选项卡的独立数据
                           # 局部编辑
                           local_description="", local_generated_prompt="", local_operation_type="add_object",
                           local_selected_constraints="", local_selected_decoratives="",
                           # 全局编辑
                           global_description="", global_generated_prompt="", global_operation_type="global_color_grade",
                           global_selected_constraints="", global_selected_decoratives="",
                           # 文字编辑
                           text_description="", text_generated_prompt="", text_operation_type="text_add",
                           text_selected_constraints="", text_selected_decoratives="",
                           # 专业操作
                           professional_description="", professional_generated_prompt="", professional_operation_type="geometric_warp",
                           professional_selected_constraints="", professional_selected_decoratives="",
                           # API选项卡
                           api_description="", api_generated_prompt="",
                           api_provider="siliconflow", api_key="", api_model="deepseek-ai/DeepSeek-V3",
                           # Ollama选项卡
                           ollama_description="", ollama_generated_prompt="",
                           ollama_url="http://127.0.0.1:11434", ollama_model="",
                           # 兼容旧版本
                           description="", generated_prompt="",
                           # Hidden参数
                           tab_mode="manual", unique_id="", edit_mode="局部编辑", 
                           operation_type="", constraint_prompts="", 
                           decorative_prompts="", selected_layers="", auto_generate=True, 
                           # API选项卡参数
                           api_editing_intent="general_editing", api_processing_style="auto_smart",
                           api_seed=0, api_custom_guidance="",
                           # Ollama选项卡参数  
                           ollama_temperature=0.7, ollama_editing_intent="general_editing", 
                           ollama_processing_style="auto_smart", ollama_seed=42, 
                           ollama_custom_guidance="", ollama_enable_visual=False,
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
                        
                        save_api_settings(api_provider, api_model, api_editing_intent, api_processing_style)
                        
                        # 如果没有提供API密钥，尝试从配置加载
                        if not api_key or not api_key.strip():
                            saved_key = get_api_key(api_provider)
                            if saved_key:
                                api_key = saved_key
                    
                    # 如果是Ollama模式，保存Ollama设置
                    elif tab_mode == "ollama":
                        config_manager.save_ollama_settings(
                            ollama_url, ollama_model, ollama_temperature,
                            ollama_editing_intent, ollama_processing_style,
                            ollama_enable_visual, ollama_auto_unload
                        )
                        
                except Exception as e:
                    pass
            
            # 根据选项卡模式处理
            if tab_mode == "api":
                # API模式：优先使用api_generated_prompt，然后是generated_prompt，最后是实时生成
                if api_generated_prompt and api_generated_prompt.strip():
                    # 清理api_generated_prompt，去除调试信息
                    print(f"[DEBUG] API模式 - 收到api_generated_prompt")
                    print(f"[DEBUG] 内容前100字符: {api_generated_prompt[:100]}...")
                    final_generated_prompt = self._extract_clean_prompt_from_api_output(api_generated_prompt.strip())
                    print(f"[DEBUG] 提取后的结果: {final_generated_prompt}")
                elif generated_prompt and generated_prompt.strip():
                    # generated_prompt也可能包含调试信息，需要清理
                    print(f"[DEBUG] API模式 - 使用generated_prompt")
                    print(f"[DEBUG] 内容前100字符: {generated_prompt[:100]}...")
                    final_generated_prompt = self._extract_clean_prompt_from_api_output(generated_prompt.strip())
                    print(f"[DEBUG] 清理后: {final_generated_prompt}")
                elif api_key:
                    final_generated_prompt = self.process_api_mode(
                        layer_info, description, api_provider, api_key, api_model,
                        api_editing_intent, api_processing_style, api_seed, 
                        api_custom_guidance, image
                    )
                else:
                    final_generated_prompt = ""
            elif tab_mode == "ollama":
                # Ollama模式：优先使用ollama_generated_prompt，然后是generated_prompt，最后是实时生成
                if ollama_generated_prompt and ollama_generated_prompt.strip():
                    # 清理ollama_generated_prompt，去除调试信息
                    final_generated_prompt = self._extract_clean_prompt_from_ollama_output(ollama_generated_prompt.strip())
                elif generated_prompt and generated_prompt.strip():
                    # generated_prompt也可能包含调试信息，需要清理
                    final_generated_prompt = self._extract_clean_prompt_from_ollama_output(generated_prompt.strip())
                elif ollama_model:
                    final_generated_prompt = self.process_ollama_mode(
                        layer_info, description, ollama_url, ollama_model, ollama_temperature,
                        ollama_editing_intent, ollama_processing_style, ollama_seed,
                        ollama_custom_guidance, ollama_enable_visual, ollama_auto_unload, image
                    )
                else:
                    final_generated_prompt = ""
            elif generated_prompt and generated_prompt.strip():
                # 非API/Ollama模式，但generated_prompt可能仍包含调试信息
                print(f"[DEBUG] 使用generated_prompt (非API/Ollama模式)")
                print(f"[DEBUG] 内容前100字符: {generated_prompt[:100]}...")
                # 尝试清理，如果包含调试信息
                if '✅' in generated_prompt or '生成的提示词' in generated_prompt:
                    final_generated_prompt = self._extract_clean_prompt_from_api_output(generated_prompt.strip())
                    print(f"[DEBUG] 清理后: {final_generated_prompt}")
                else:
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
    
    def _analyze_operation_type(self, description, editing_intent):
        """分析编辑操作类型，用于智能约束生成"""
        description_lower = (description or "").lower()
        intent_lower = (editing_intent or "").lower()
        
        # 基于描述关键词分析操作类型
        if any(keyword in description_lower for keyword in ['add', 'insert', 'place', 'put', '添加', '放置']):
            return 'add'
        elif any(keyword in description_lower for keyword in ['remove', 'delete', 'erase', 'clear', '删除', '移除']):
            return 'remove'  
        elif any(keyword in description_lower for keyword in ['color', 'colour', 'paint', 'tint', 'shade', '颜色', '着色']):
            return 'color'
        elif any(keyword in description_lower for keyword in ['shape', 'form', 'outline', 'contour', '形状', '轮廓']):
            return 'shape'
        elif any(keyword in description_lower for keyword in ['text', 'word', 'letter', 'font', '文字', '文本']):
            return 'text'
        elif any(keyword in description_lower for keyword in ['background', 'backdrop', 'bg', '背景']):
            return 'background'
        else:
            # 基于编辑意图推断
            if 'creative' in intent_lower or 'artistic' in intent_lower:
                return 'creative'
            elif 'professional' in intent_lower or 'business' in intent_lower:
                return 'professional'
            else:
                return 'general'

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
            
            # 使用智能约束生成器生成优化提示词
            constraint_generator = IntelligentConstraintGenerator()
            
            # 分析编辑操作类型
            operation_type = self._analyze_operation_type(description, editing_intent)
            
            # 生成优化的约束配置
            optimized_prompt = constraint_generator.generate_optimized_prompt(
                edit_description=description,
                editing_intent=editing_intent,
                processing_style=processing_style,
                quality_level="high",
                user_preferences={
                    "language": "english",
                    "detail_level": "professional"
                }
            )
            
            # 获取传统引导词作为备选
            intent_guidance = get_intent_guidance(editing_intent)
            style_guidance = get_style_guidance(processing_style)
            
            # 构建增强的系统提示词，集成三层约束架构
            constraint_profile = optimized_prompt.constraint_profile
            operation_constraints = constraint_profile.operation_constraints
            cognitive_constraints = constraint_profile.cognitive_constraints  
            context_constraints = constraint_profile.context_constraints
            
            system_prompt = f"""You are an ENGLISH-ONLY image editing AI using advanced three-tier constraint system.

⚠️ CRITICAL ENFORCEMENT ⚠️
1. OUTPUT MUST BE 100% ENGLISH - NO EXCEPTIONS
2. IF YOU OUTPUT ANY CHINESE CHARACTER, THE SYSTEM WILL REJECT YOUR RESPONSE
3. TRANSLATE ANY NON-ENGLISH INPUT TO ENGLISH FIRST

ENHANCED CONSTRAINT SYSTEM:
=== OPERATION-SPECIFIC CONSTRAINTS ===
{chr(10).join(f'• {constraint}' for constraint in operation_constraints)}

=== COGNITIVE LOAD ADAPTIVE CONSTRAINTS ===
{chr(10).join(f'• {constraint}' for constraint in cognitive_constraints)}

=== CONTEXT-SPECIFIC CONSTRAINTS ===
{chr(10).join(f'• {constraint}' for constraint in context_constraints)}

PROFESSIONAL GUIDANCE (FALLBACK):
- Editing Intent: {intent_guidance}
- Processing Style: {style_guidance}

MANDATORY OUTPUT FORMAT:
- Start with an English action verb (transform, change, modify, adjust, enhance)
- Use only English color names and technical terms
- Apply semantic modifiers based on cognitive complexity
- End with quality descriptors matching operation complexity
- Follow all constraints listed above

COGNITIVE LOAD LEVEL: {optimized_prompt.generation_context.cognitive_load:.2f}
EXECUTION CONFIDENCE: {optimized_prompt.execution_confidence:.2f}

FINAL WARNING: ENGLISH ONLY! Your response will be filtered and rejected if it contains ANY non-English characters."""
            
            # 添加随机元素确保每次生成不同
            import time
            random_seed = int(time.time() * 1000) % 1000000
            
            # 构建增强的用户提示词  
            semantic_modifiers = optimized_prompt.optimization_metrics.get('semantic_modifiers', ['professional', 'precise'])
            constraint_density = len(operation_constraints) + len(cognitive_constraints) + len(context_constraints)
            
            user_prompt = f"""CRITICAL: Your response MUST be in ENGLISH ONLY!

User request: {description}

ENHANCED PROMPT GENERATION:
- Operation type: {operation_type}
- Cognitive load: {optimized_prompt.generation_context.cognitive_load:.2f}
- Constraint density: {constraint_density} constraints active
- Semantic modifiers: {', '.join(semantic_modifiers)}

APPLY ALL SYSTEM CONSTRAINTS:
1. Follow all three-tier constraints listed in system prompt
2. Output detailed English prompt (80-150 words based on complexity)
3. Use proper English grammar and technical vocabulary
4. NO Chinese characters allowed (系统将拒绝任何中文)
5. Start with appropriate action verb for {operation_type} operation
6. Apply semantic modifiers: {', '.join(semantic_modifiers)}
7. Match quality descriptors to cognitive load level
8. Incorporate operation-specific technical requirements

FALLBACK GUIDANCE:
- Intent guidance: {intent_guidance}
- Style guidance: {style_guidance}

{f'Additional guidance: {custom_guidance}' if custom_guidance else ''}

Variation seed: {random_seed}
Confidence target: {optimized_prompt.execution_confidence:.2f}

REMEMBER: ENGLISH ONLY! Apply all constraints from system prompt!"""
            
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
            return f"API处理错误: {description or '无描述'}"
    
    def process_ollama_mode(self, layer_info, description, ollama_url, ollama_model, 
                           temperature, editing_intent, processing_style, seed,
                           custom_guidance, enable_visual, auto_unload, image):
        """处理Ollama模式的提示词生成 - 集成增强约束系统"""
        try:
            import requests
            
            # 使用智能约束生成器
            constraint_generator = IntelligentConstraintGenerator()
            operation_type = self._analyze_operation_type(description, editing_intent)
            
            # 生成优化的约束配置
            optimized_prompt = constraint_generator.generate_optimized_prompt(
                edit_description=description,
                editing_intent=editing_intent,
                processing_style=processing_style,
                quality_level="high",
                user_preferences={
                    "language": "english",
                    "detail_level": "professional"
                }
            )
            
            # 获取增强约束
            constraint_profile = optimized_prompt.constraint_profile
            operation_constraints = constraint_profile.operation_constraints
            cognitive_constraints = constraint_profile.cognitive_constraints
            
            # 构建增强的系统提示词
            system_prompt = f"""You are an ENGLISH-ONLY image editing assistant using enhanced constraint system.

CRITICAL RULES:
1. Output in ENGLISH ONLY
2. Never use Chinese characters or any other language
3. Apply all operation-specific constraints listed below
4. Use proper English color names and technical terms

OPERATION-SPECIFIC CONSTRAINTS:
{chr(10).join(f'• {constraint}' for constraint in operation_constraints)}

COGNITIVE ADAPTIVE CONSTRAINTS:
{chr(10).join(f'• {constraint}' for constraint in cognitive_constraints)}

OPERATION TYPE: {operation_type}
COGNITIVE LOAD: {optimized_prompt.generation_context.cognitive_load:.2f}
CONFIDENCE TARGET: {optimized_prompt.execution_confidence:.2f}

FORMAT: Apply semantic modifiers: {', '.join(optimized_prompt.optimization_metrics.get('semantic_modifiers', ['professional']))}

REMEMBER: ENGLISH ONLY OUTPUT with enhanced constraints!"""
            
            # 构建增强的用户提示词（Ollama模式）
            semantic_modifiers = optimized_prompt.optimization_metrics.get('semantic_modifiers', ['professional', 'precise'])
            constraint_density = len(operation_constraints) + len(cognitive_constraints)
            
            user_prompt = f"""Generate ENGLISH editing instruction for: {description}

ENHANCED PARAMETERS:
- Operation type: {operation_type}
- Semantic modifiers: {', '.join(semantic_modifiers)}
- Constraint density: {constraint_density} constraints active
- Target cognitive load: {optimized_prompt.generation_context.cognitive_load:.2f}

APPLY ALL SYSTEM CONSTRAINTS and generate precise English instruction (50-100 words).

{f'Additional guidance: {custom_guidance}' if custom_guidance else ''}

OUTPUT IN ENGLISH ONLY with enhanced constraint application!"""
            
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
    
    def _extract_clean_prompt_from_api_output(self, api_output):
        """从API输出中提取纯净的提示词"""
        
        # 调试输出
        print(f"[DEBUG] 开始提取，输入长度: {len(api_output)}")
        
        # 方法1: 查找"生成的提示词:"并提取之后的所有内容
        markers = ['生成的提示词:', '生成的提示词：']
        for marker in markers:
            if marker in api_output:
                # 找到标记的位置
                idx = api_output.index(marker)
                # 提取标记后的所有内容
                after_marker = api_output[idx + len(marker):].strip()
                
                # 如果有内容，处理并返回
                if after_marker:
                    # 按行分割，取第一个非空行（通常就是提示词）
                    lines = after_marker.split('\n')
                    for line in lines:
                        line = line.strip()
                        if line and not line.startswith('✅'):
                            # 去除可能的引号
                            clean = line.strip('"').strip("'").strip()
                            print(f"[DEBUG] 提取成功: {clean}")
                            return clean
        
        # 方法2: 提取最后一个有意义的行
        lines = api_output.strip().split('\n')
        for line in reversed(lines):
            line = line.strip()
            # 跳过调试信息行
            if (line and 
                not line.startswith('✅') and 
                not line.startswith('模型:') and 
                not line.startswith('输入:') and
                len(line) > 20):  # 确保是实际的提示词，不是短标签
                clean = line.strip('"').strip("'").strip()
                print(f"[DEBUG] 通过最后一行提取: {clean}")
                return clean
        
        # 如果都失败了，返回原始内容
        print(f"[DEBUG] 提取失败，返回原始内容")
        return api_output.strip()
    
    def _extract_clean_prompt_from_ollama_output(self, ollama_output):
        """从Ollama输出中提取纯净的提示词"""
        import re
        
        # 与_extract_clean_prompt_from_api_output类似的逻辑
        if '生成的提示词:' in ollama_output or '生成的提示词\uff1a' in ollama_output:
            pattern = r'生成的提示词[:：]\s*\n?(.+?)$'
            match = re.search(pattern, ollama_output, re.DOTALL)
            if match:
                clean_prompt = match.group(1).strip()
                clean_prompt = clean_prompt.strip('"').strip("'").strip()
                return clean_prompt
        
        if 'generated prompt:' in ollama_output.lower() or 'prompt:' in ollama_output.lower():
            pattern = r'(?:generated prompt:|prompt:)\s*(.+?)(?:\n\n|$)'
            match = re.search(pattern, ollama_output, re.IGNORECASE | re.DOTALL)
            if match:
                clean_prompt = match.group(1).strip()
                clean_prompt = clean_prompt.strip('"').strip("'").strip()
                return clean_prompt
        
        # 提取最后一行有效内容
        lines = ollama_output.strip().split('\n')
        for line in reversed(lines):
            line = line.strip()
            if line and not line.startswith('✅') and not line.startswith('模型:') and not line.startswith('输入:'):
                return line.strip('"').strip("'").strip()
        
        return ollama_output.strip()


# 注册节点
NODE_CLASS_MAPPINGS = {
    "KontextSuperPrompt": KontextSuperPrompt,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "KontextSuperPrompt": "✨ Super Prompt",
}

