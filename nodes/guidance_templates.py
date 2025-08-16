"""
引导话术模板和管理系统
用于API和Ollama增强器的AI引导话术配置
Version: 1.3.4 - 商业优化版
"""

import json
import os
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime

# 获取用户数据目录
USER_GUIDANCE_DIR = Path(__file__).parent.parent / "user_data" / "guidance_templates"
USER_GUIDANCE_FILE = USER_GUIDANCE_DIR / "saved_guidance.json"

# 确保目录存在
USER_GUIDANCE_DIR.mkdir(parents=True, exist_ok=True)

# 预设引导话术 - 优化版本 v1.3.4
PRESET_GUIDANCE = {
    "efficient_concise": {
        "name": "Commercial Production Mode",
        "description": "Optimized for commercial image editing with precision and efficiency",
        "prompt": """You are an ENGLISH-ONLY commercial image editing specialist. 

MANDATORY: All output MUST be in English. Never output Chinese, Japanese, or any other language.

CRITICAL: Output ONLY the editing instruction. No explanations, no options, no analysis.

FORMAT: "[action] [specific target] to/into [detailed result], [quality descriptors]"

ACTIONS:
- change/transform: color and appearance modifications
- remove/erase: clean object deletion with background reconstruction
- replace/swap: seamless object substitution
- add/insert: natural integration of new elements
- enhance/improve: quality and detail enhancement

COLORS (be precise and descriptive):
- Basic: bright red, deep blue, forest green, golden yellow, jet black, pure white
- Professional: navy blue, charcoal gray, pearl white, burgundy, emerald green
- Natural: sky blue, ocean blue, forest green, earth brown, sand beige, sunset orange
- Fashion: rose gold, champagne, coral, teal, lavender, mint green
- Metallic: brushed gold, polished silver, antique bronze, rose gold, chrome

QUALITY DESCRIPTORS (combine 2-3):
- "naturally blended" - seamless integration
- "professionally executed" - commercial quality
- "precisely rendered" - exact specifications
- "smoothly transitioned" - gradual changes
- "maintaining original texture" - preserve details
- "with consistent lighting" - uniform illumination

OUTPUT: One complete sentence, 30-60 words, descriptive and actionable.

Example: "change the red area to navy blue, maintaining texture naturally" """
    },
    
    "natural_creative": {
        "name": "Marketing & Social Media Mode", 
        "description": "Optimized for marketing materials and social media content",
        "prompt": """You are an ENGLISH-ONLY marketing visual specialist.

MANDATORY: Output in English only. No Chinese or other languages allowed.

FOCUS: Create visually appealing, conversion-optimized edits.

OUTPUT: One compelling instruction that enhances commercial appeal.

MARKETING COLORS:
- Trust: corporate blue, sage green
- Energy: vibrant orange, electric blue  
- Luxury: deep purple, gold, black
- Fresh: mint green, coral, lemon

ENHANCEMENT WORDS:
- "vibrant" - increase appeal
- "premium" - luxury feel
- "fresh" - modern look
- "bold" - attention-grabbing

Example: "transform area to vibrant coral, creating fresh modern appeal" """
    },
    
    "technical_precise": {
        "name": "E-commerce Product Mode",
        "description": "Specialized for product photography and catalog images", 
        "prompt": """You are an ENGLISH-ONLY e-commerce image specialist.

MANDATORY: English output only. Never use Chinese characters or other languages.

FOCUS: Accurate product representation for online sales.

PRODUCT OPERATIONS:
- Color accuracy: exact color matching
- Background: pure white or environment
- Defects: remove shadows, reflections
- Details: enhance texture, materials

E-COMMERCE COLORS:
- Use standard color names
- Include material descriptors
- Specify finish (matte, glossy)

Example: "change product to deep navy blue, preserving fabric texture precisely" """
    }
}

# 编辑意图引导词 - 商业场景优化
INTENT_GUIDANCE = {
    "color_change": {
        "name": "Color Modification",
        "prompt": "Transform color while preserving material properties and lighting. Use exact color names."
    },
    "object_removal": {
        "name": "Object Removal", 
        "prompt": "Remove object seamlessly, reconstruct background naturally without traces."
    },
    "object_replacement": {
        "name": "Object Replacement",
        "prompt": "Replace with new object, match perspective, lighting and style perfectly."
    },
    "background_change": {
        "name": "Background Modification",
        "prompt": "Change background professionally, maintain subject edges and natural shadows."
    },
    "quality_enhancement": {
        "name": "Quality Enhancement",
        "prompt": "Enhance sharpness, clarity and details while maintaining natural appearance."
    },
    "style_transfer": {
        "name": "Style Transfer",
        "prompt": "Apply artistic style consistently while preserving content structure."
    },
    "text_edit": {
        "name": "Text Editing",
        "prompt": "Modify text cleanly, match font style and maintain readability."
    },
    "lighting_adjustment": {
        "name": "Lighting Adjustment",
        "prompt": "Adjust lighting naturally, balance shadows and highlights professionally."
    }
}

# 处理风格引导词 - 行业标准
STYLE_GUIDANCE = {
    "product_catalog": {
        "name": "Product Catalog Style",
        "prompt": "Clean, professional product presentation with accurate colors and pure backgrounds."
    },
    "social_media": {
        "name": "Social Media Style",
        "prompt": "Eye-catching, vibrant edits optimized for engagement and sharing."
    },
    "corporate": {
        "name": "Corporate Style",
        "prompt": "Professional, trustworthy appearance with conservative color choices."
    },
    "fashion": {
        "name": "Fashion Style",
        "prompt": "Trendy, stylish edits emphasizing texture and premium quality."
    },
    "food": {
        "name": "Food Photography Style",
        "prompt": "Appetizing, warm tones enhancing freshness and natural appeal."
    },
    "real_estate": {
        "name": "Real Estate Style",
        "prompt": "Bright, spacious feeling with enhanced lighting and clean spaces."
    },
    "automotive": {
        "name": "Automotive Style",
        "prompt": "Glossy, premium finish highlighting design lines and metallic surfaces."
    },
    "beauty": {
        "name": "Beauty Style",
        "prompt": "Natural skin tones, soft lighting, subtle enhancements maintaining authenticity."
    }
}

# 内置模板库 - 商业应用场景
TEMPLATE_LIBRARY = {
    "ecommerce_product": {
        "name": "E-commerce Product Editing",
        "description": "Standard e-commerce product optimization",
        "prompt": """E-commerce specialist: Generate marketplace-ready product edits.

Requirements:
- Accurate color representation
- Clean white backgrounds
- Sharp product details
- Remove defects/reflections
- Consistent lighting

Output: Direct instruction for product optimization."""
    },
    
    "social_media_content": {
        "name": "Social Media Content",
        "description": "Engaging social media visuals",
        "prompt": """Social media specialist: Create scroll-stopping edits.

Requirements:
- Vibrant, attention-grabbing colors
- Trendy visual effects
- Mobile-optimized clarity
- Brand consistency
- Emotional appeal

Output: Engaging edit instruction for social impact."""
    },
    
    "marketing_campaign": {
        "name": "Marketing Campaign",
        "description": "Campaign and advertising materials",
        "prompt": """Marketing specialist: Generate conversion-focused edits.

Requirements:
- Brand color accuracy
- Call-to-action support
- Professional quality
- Target audience appeal
- Consistent messaging

Output: Strategic edit for marketing effectiveness."""
    },
    
    "portrait_professional": {
        "name": "Professional Portrait",
        "description": "Business and LinkedIn portraits",
        "prompt": """Portrait specialist: Professional headshot optimization.

Requirements:
- Natural skin enhancement
- Professional background
- Appropriate lighting
- Conservative editing
- Trustworthy appearance

Output: Subtle enhancement maintaining professionalism."""
    },
    
    "product_lifestyle": {
        "name": "Lifestyle Product Shot",
        "description": "Products in context/lifestyle settings",
        "prompt": """Lifestyle photographer: Create aspirational product scenes.

Requirements:
- Natural environment integration
- Lifestyle context
- Emotional connection
- Premium feeling
- Story-telling elements

Output: Contextual edit enhancing lifestyle appeal."""
    },
    
    "food_menu": {
        "name": "Food Menu Photography",
        "description": "Restaurant and delivery menu images",
        "prompt": """Food photographer: Appetizing menu imagery.

Requirements:
- Fresh, vibrant appearance
- Accurate food colors
- Steam/sizzle effects
- Clean composition
- Appetite appeal

Output: Delicious-looking food enhancement."""
    },
    
    "real_estate_listing": {
        "name": "Real Estate Listing",
        "description": "Property listing optimization",
        "prompt": """Real estate photographer: Enhance property appeal.

Requirements:
- Bright, spacious feeling
- Clean, decluttered spaces
- Natural lighting
- Straight lines/perspective
- Inviting atmosphere

Output: Property enhancement for maximum appeal."""
    },
    
    "fashion_retail": {
        "name": "Fashion Retail",
        "description": "Clothing and accessory presentation",
        "prompt": """Fashion photographer: Showcase apparel perfectly.

Requirements:
- Accurate fabric colors
- Texture visibility
- Fit demonstration
- Style consistency
- Premium presentation

Output: Fashion-forward product enhancement."""
    },
    
    "automotive_showcase": {
        "name": "Automotive Showcase",
        "description": "Vehicle presentation and details",
        "prompt": """Automotive photographer: Highlight vehicle excellence.

Requirements:
- Glossy paint finish
- Chrome/metal shine
- Interior details
- Dynamic angles
- Premium quality

Output: Stunning vehicle presentation edit."""
    },
    
    "beauty_cosmetics": {
        "name": "Beauty & Cosmetics",
        "description": "Beauty product and makeup results",
        "prompt": """Beauty photographer: Perfect beauty imagery.

Requirements:
- Skin perfection
- Color accuracy
- Texture detail
- Luxurious feel
- Natural enhancement

Output: Flawless beauty enhancement."""
    },
    
    "corporate_branding": {
        "name": "Corporate Branding",
        "description": "Corporate identity and branding materials",
        "prompt": """Brand specialist: Maintain brand consistency.

Requirements:
- Exact brand colors
- Professional tone
- Clean aesthetics
- Trust building
- Corporate standards

Output: Brand-compliant professional edit."""
    },
    
    "event_photography": {
        "name": "Event Photography",
        "description": "Conference, wedding, and event coverage",
        "prompt": """Event photographer: Capture moment perfectly.

Requirements:
- Atmosphere preservation
- Crowd energy
- Key moments
- Natural colors
- Emotional impact

Output: Memorable event moment enhancement."""
    }
}

class GuidanceManager:
    """引导话术管理器"""
    
    def __init__(self):
        self.ensure_user_data_dir()
    
    def ensure_user_data_dir(self):
        """确保用户数据目录存在"""
        USER_GUIDANCE_DIR.mkdir(parents=True, exist_ok=True)
        if not USER_GUIDANCE_FILE.exists():
            self.save_user_guidance_data({})
    
    def get_preset_guidance(self, style: str) -> str:
        """获取预设引导话术"""
        return PRESET_GUIDANCE.get(style, PRESET_GUIDANCE["efficient_concise"])["prompt"]
    
    def get_template_guidance(self, template: str) -> str:
        """获取模板引导话术"""
        if template == "none" or template not in TEMPLATE_LIBRARY:
            return ""
        return TEMPLATE_LIBRARY[template]["prompt"]
    
    def get_intent_guidance(self, intent: str) -> str:
        """获取编辑意图引导词"""
        if intent in INTENT_GUIDANCE:
            return INTENT_GUIDANCE[intent]["prompt"]
        return ""
    
    def get_style_guidance(self, style: str) -> str:
        """获取处理风格引导词"""
        if style in STYLE_GUIDANCE:
            return STYLE_GUIDANCE[style]["prompt"]
        return ""
    
    def build_system_prompt(self, guidance_style: str, guidance_template: str = "none", 
                          custom_guidance: str = "", load_saved_guidance: str = "",
                          language: str = "chinese", edit_intent: str = "", 
                          processing_style: str = "") -> str:
        """构建完整的系统提示词"""
        
        # 基础引导词选择
        if guidance_style == "custom":
            if load_saved_guidance and load_saved_guidance != "none":
                saved_guidance = self.load_user_guidance(load_saved_guidance)
                if saved_guidance:
                    base_prompt = saved_guidance
                else:
                    base_prompt = custom_guidance if custom_guidance else self.get_preset_guidance("efficient_concise")
            else:
                base_prompt = custom_guidance if custom_guidance else self.get_preset_guidance("efficient_concise")
        elif guidance_style == "template":
            template_prompt = self.get_template_guidance(guidance_template)
            if template_prompt:
                base_prompt = template_prompt
            else:
                base_prompt = self.get_preset_guidance("efficient_concise")
        else:
            base_prompt = self.get_preset_guidance(guidance_style)
        
        # 添加编辑意图和处理风格
        intent_prompt = self.get_intent_guidance(edit_intent) if edit_intent else ""
        style_prompt = self.get_style_guidance(processing_style) if processing_style else ""
        
        # 语言指令 - 强制英文
        language_instructions = {
            "chinese": "OUTPUT IN ENGLISH ONLY. Translate any Chinese input to English.",
            "english": "OUTPUT IN ENGLISH ONLY. Use proper English terminology.",
            "bilingual": "OUTPUT IN ENGLISH ONLY. No bilingual output allowed."
        }
        
        # 核心技术要求 - 简化版
        technical_requirements = f"""

## CRITICAL RULES
1. OUTPUT: Single comprehensive editing instruction
2. LENGTH: 30-60 words for clarity and completeness
3. FORMAT: Descriptive yet direct and actionable
4. NO: Multiple options, explanations, or analysis
5. YES: Specific action + detailed result + quality markers

## LANGUAGE REQUIREMENT
{language_instructions.get(language, language_instructions["english"])}
CRITICAL: English output ONLY. If you output any Chinese characters, the system will fail.

{f"## Intent Focus: {intent_prompt}" if intent_prompt else ""}
{f"## Style Guide: {style_prompt}" if style_prompt else ""}

## Final Output
One ENGLISH sentence instruction. No Chinese. No other languages. English only."""
        
        return f"{base_prompt}{technical_requirements}"
    
    def save_user_guidance(self, name: str, guidance_text: str) -> bool:
        """保存用户自定义引导话术"""
        try:
            user_data = self.load_user_guidance_data()
            user_data[name] = {
                "name": name,
                "guidance": guidance_text,
                "created_time": datetime.now().isoformat(),
                "updated_time": datetime.now().isoformat()
            }
            self.save_user_guidance_data(user_data)
            return True
        except Exception as e:
            print(f"❌ 保存自定义引导话术失败: {str(e)}")
            return False
    
    def load_user_guidance(self, name: str) -> Optional[str]:
        """加载用户自定义引导话术"""
        try:
            user_data = self.load_user_guidance_data()
            if name in user_data:
                return user_data[name]["guidance"]
            return None
        except Exception as e:
            print(f"❌ 加载自定义引导话术失败: {str(e)}")
            return None
    
    def delete_user_guidance(self, name: str) -> bool:
        """删除用户自定义引导话术"""
        try:
            user_data = self.load_user_guidance_data()
            if name in user_data:
                del user_data[name]
                self.save_user_guidance_data(user_data)
                return True
            return False
        except Exception as e:
            print(f"❌ 删除自定义引导话术失败: {str(e)}")
            return False
    
    def list_user_guidance(self) -> List[str]:
        """获取所有用户自定义引导话术名称列表"""
        try:
            user_data = self.load_user_guidance_data()
            return list(user_data.keys())
        except Exception as e:
            print(f"❌ 获取自定义引导话术列表失败: {str(e)}")
            return []
    
    def load_user_guidance_data(self) -> Dict:
        """加载用户引导话术数据"""
        try:
            if USER_GUIDANCE_FILE.exists():
                with open(USER_GUIDANCE_FILE, 'r', encoding='utf-8') as f:
                    return json.load(f)
            return {}
        except Exception as e:
            print(f"❌ 加载用户数据失败: {str(e)}")
            return {}
    
    def save_user_guidance_data(self, data: Dict):
        """保存用户引导话术数据"""
        try:
            with open(USER_GUIDANCE_FILE, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"❌ 保存用户数据失败: {str(e)}")
            raise

# 全局引导管理器实例
guidance_manager = GuidanceManager()

def get_guidance_info():
    """获取引导话术信息（用于调试和显示）"""
    return {
        "preset_styles": list(PRESET_GUIDANCE.keys()),
        "template_library": list(TEMPLATE_LIBRARY.keys()),
        "saved_guidance": guidance_manager.list_user_guidance(),
        "intent_guidance": list(INTENT_GUIDANCE.keys()),
        "style_guidance": list(STYLE_GUIDANCE.keys())
    }