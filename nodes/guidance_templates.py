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

# Kontext架构 - 基于1026样本数据的编辑类型配置
KONTEXT_EDITING_TYPES = {
    "local_editing": {
        "name": "局部编辑", 
        "description": "精准定向的对象属性修改",
        "operation_types": {
            "shape_transformation": {
                "name": "形态变化",
                "priority": 1,
                "tips": [
                    "🎭 描述具体动作：使用动词+状态描述，如'make him dance'比'change pose'更有效",
                    "👤 保持身份一致：变化姿态时确保角色特征不变，避免面部扭曲",
                    "⚡ 动作自然度：选择符合人体工学的姿态，避免不可能的动作组合",
                    "🎯 焦点明确：一次只改变一个主要动作，避免复杂组合导致混乱"
                ],
                "specific_operations": [
                    {"id": "body_posture", "name": "身体姿态调整", "example": "make her dance", 
                     "guidance": "使用具体动作词汇，如'dance', 'sit', 'run', 'jump'。避免模糊描述如'change pose'",
                     "presets": [
                         {"id": "dancing", "name": "跳舞动作", "prompt": "make character dance", "description": "让角色开始跳舞"},
                         {"id": "sitting", "name": "坐下姿势", "prompt": "make character sit down", "description": "让角色坐下"},
                         {"id": "standing", "name": "站立姿势", "prompt": "make character stand up", "description": "让角色站起来"},
                         {"id": "jumping", "name": "跳跃动作", "prompt": "make character jump", "description": "让角色跳跃"},
                         {"id": "running", "name": "跑步动作", "prompt": "make character run", "description": "让角色跑步"},
                         {"id": "lying_down", "name": "躺下姿势", "prompt": "make character lie down", "description": "让角色躺下"}
                     ]}, 
                    {"id": "hand_gesture", "name": "手势动作修改", "example": "do heart hands",
                     "guidance": "描述标准手势：'peace sign', 'thumbs up', 'pointing', 'waving'。双手动作要保持协调",
                     "presets": [
                         {"id": "heart_hands", "name": "比心手势", "prompt": "do heart hands", "description": "双手组成心形手势"},
                         {"id": "thumbs_up", "name": "竖大拇指", "prompt": "give thumbs up", "description": "向上竖起大拇指"},
                         {"id": "peace_sign", "name": "比耶手势", "prompt": "do peace sign", "description": "伸出食指和中指做V字手势"},
                         {"id": "pointing", "name": "指向手势", "prompt": "pointing at camera", "description": "手指指向镜头或特定方向"},
                         {"id": "waving", "name": "挥手手势", "prompt": "waving at camera", "description": "向镜头挥手打招呼"},
                         {"id": "ok_sign", "name": "OK手势", "prompt": "make OK sign", "description": "拇指和食指组成圆形OK手势"}
                     ]},
                    {"id": "facial_expression", "name": "表情状态变化", "example": "change expression",
                     "guidance": "使用情感词汇：'smiling', 'surprised', 'angry', 'sad'。微表情比夸张表情更自然",
                     "presets": [
                         {"id": "smiling", "name": "微笑表情", "prompt": "make character smile", "description": "让角色微笑"},
                         {"id": "laughing", "name": "大笑表情", "prompt": "make character laugh", "description": "让角色大笑"},
                         {"id": "surprised", "name": "惊讶表情", "prompt": "make character look surprised", "description": "让角色显得惊讶"},
                         {"id": "angry", "name": "生气表情", "prompt": "make character look angry", "description": "让角色显得生气"},
                         {"id": "sad", "name": "悲伤表情", "prompt": "make character look sad", "description": "让角色显得悲伤"},
                         {"id": "serious", "name": "严肃表情", "prompt": "make character look serious", "description": "让角色显得严肃"}
                     ]},
                    {"id": "body_feature", "name": "身体特征调整", "example": "make head gigantic",
                     "guidance": "指定程度：'slightly larger', 'much bigger', 'extremely small'。保持整体比例协调"}
                ]
            },
            "color_modification": {
                "name": "颜色修改",
                "priority": 2,
                "tips": [
                    "🎨 颜色精确性：使用具体颜色名，如'bright red', 'forest green', 'sky blue'",
                    "💎 材质保持：添加'keep texture'或'maintain material'保持原有质感",
                    "🌈 渐变效果：'rainbow', 'gradient from blue to red', 'ombre effect'",
                    "🔍 对象特定：明确指定要改色的对象，避免影响整个画面"
                ],
                "specific_operations": [
                    {"id": "single_color", "name": "单一颜色变换", "example": "make cat orange",
                     "guidance": "格式：'make [对象] [颜色]'。使用精确颜色词：'bright orange', 'deep blue', 'metallic silver'",
                     "presets": [
                         {"id": "red", "name": "红色", "prompt": "change to bright red", "description": "改为明亮的红色"},
                         {"id": "blue", "name": "蓝色", "prompt": "change to deep blue", "description": "改为深蓝色"},
                         {"id": "green", "name": "绿色", "prompt": "change to forest green", "description": "改为森林绿色"},
                         {"id": "orange", "name": "橙色", "prompt": "change to bright orange", "description": "改为明亮的橙色"},
                         {"id": "purple", "name": "紫色", "prompt": "change to royal purple", "description": "改为皇家紫色"},
                         {"id": "yellow", "name": "黄色", "prompt": "change to golden yellow", "description": "改为金黄色"},
                         {"id": "black", "name": "黑色", "prompt": "change to jet black", "description": "改为纯黑色"},
                         {"id": "white", "name": "白色", "prompt": "change to pure white", "description": "改为纯白色"},
                         {"id": "rainbow", "name": "彩虹色", "prompt": "rainbow colored", "description": "改为彩虹色"}
                     ]},
                    {"id": "multi_object", "name": "多对象统一颜色", "example": "make all signs green", 
                     "guidance": "使用'all'或'every'修饰：'make all cars red', 'change every sign to blue'"},
                    {"id": "gradient_color", "name": "渐变色彩应用", "example": "rainbow color",
                     "guidance": "渐变类型：'rainbow colored', 'gradient from X to Y', 'ombre effect', 'multicolored'"},
                    {"id": "texture_preserve", "name": "材质颜色保持", "example": "keep texture",
                     "guidance": "保质感描述：'keep original texture', 'maintain material quality', 'preserve surface details'"}
                ]
            },
            "object_removal": {
                "name": "对象删除",
                "priority": 3,
                "tips": [
                    "🎯 精确定位：明确指定要删除的对象，如'remove the red car'而非'remove car'",
                    "🔧 自动修复：删除后背景会自动修复，保持画面完整性",
                    "👁️ 边缘处理：系统会自动处理删除区域的边缘，实现无痕融合",
                    "⚠️ 影响评估：删除主要对象可能影响整体构图，需谨慎考虑"
                ],
                "specific_operations": [
                    {"id": "body_part", "name": "身体部位删除", "example": "remove hand in middle",
                     "guidance": "具体描述部位：'remove left hand', 'remove extra finger', 'remove the hand holding object'"},
                    {"id": "background_element", "name": "背景元素删除", "example": "remove house",
                     "guidance": "背景对象：'remove building', 'remove tree', 'remove car in background'。会自动填补天空或环境"},
                    {"id": "decoration", "name": "装饰元素删除", "example": "remove hat",
                     "guidance": "装饰品：'remove hat', 'remove glasses', 'remove jewelry'。保持人物自然外观"},
                    {"id": "seamless_repair", "name": "无痕背景修复", "example": "seamless background",
                     "guidance": "添加修复要求：'remove object with seamless background', 'clean removal with natural fill'"}
                ]
            },
            "attribute_adjustment": {
                "name": "属性修改",
                "priority": 4,
                "tips": [
                    "👤 身份保持：修改属性时保持人物的基本身份和特征一致",
                    "🎨 风格协调：新增属性要与整体风格和时代背景协调",
                    "⚖️ 渐进调整：年龄变化使用渐进词汇，如'slightly older', 'much younger'",
                    "🔍 细节精确：面部特征修改要具体，如'add small beard'而非'add facial hair'"
                ],
                "specific_operations": [
                    {"id": "age_change", "name": "年龄特征变化", "example": "make her old/young",
                     "guidance": "年龄描述：'make older', 'make younger', 'elderly version', 'child version'。可指定程度：'slightly', 'much', 'very'"},
                    {"id": "hairstyle", "name": "发型样式调整", "example": "make bald",
                     "guidance": "发型类型：'long hair', 'short hair', 'curly hair', 'bald'。颜色：'blonde hair', 'black hair'"},
                    {"id": "clothing", "name": "服饰配件添加", "example": "add cowboy hat",
                     "guidance": "服饰类型：'add hat', 'add glasses', 'add suit', 'add dress'。风格要与人物协调"},
                    {"id": "facial_feature", "name": "面部特征修改", "example": "add beard",
                     "guidance": "面部特征：'add beard', 'add mustache', 'add wrinkles', 'add freckles'。描述大小和颜色"}
                ]
            },
            "size_scale": {
                "name": "尺寸缩放",
                "priority": 5,
                "tips": [
                    "📏 程度明确：使用具体程度词，如'much bigger', 'slightly smaller', 'extremely large'",
                    "⚖️ 比例协调：注意整体比例关系，避免不自然的尺寸对比",
                    "🎯 对象特定：明确指定缩放对象，避免影响其他元素",
                    "🔄 渐进调整：大幅度尺寸变化可能需要多次微调"
                ],
                "specific_operations": [
                    {"id": "enlarge_object", "name": "对象放大", "example": "make bigger",
                     "guidance": "放大程度：'make bigger', 'much larger', 'double size', 'extremely large'。指定对象：'make cat bigger'"},
                    {"id": "shrink_object", "name": "对象缩小", "example": "make smaller",
                     "guidance": "缩小程度：'make smaller', 'much smaller', 'half size', 'tiny'。保持细节清晰"},
                    {"id": "proportion_adjust", "name": "比例调整", "example": "adjust proportions",
                     "guidance": "比例描述：'adjust proportions', 'fix proportions', 'make proportional'。针对不协调的对象"},
                    {"id": "size_normalize", "name": "尺寸标准化", "example": "normalize size",
                     "guidance": "标准化：'normalize size', 'standard proportions', 'realistic size'。使对象符合常规尺寸"}
                ]
            },
            "position_movement": {
                "name": "位置移动",
                "priority": 6,
                "tips": [
                    "🎯 位置精确：使用方位词，如'move to left', 'center', 'upper right corner'",
                    "↻ 旋转角度：可指定具体角度，如'rotate 45 degrees', 'turn clockwise'",
                    "📐 对齐基准：指定对齐基准，如'align with horizon', 'center with main object'", 
                    "🔄 相对位置：使用相对描述，如'move closer to', 'place behind'"
                ],
                "specific_operations": [
                    {"id": "location_change", "name": "位置变更", "example": "move to center",
                     "guidance": "位置描述：'move to center', 'move to left/right', 'move up/down', 'place in corner'"},
                    {"id": "rotation_adjust", "name": "旋转调整", "example": "rotate object", 
                     "guidance": "旋转描述：'rotate 90 degrees', 'turn clockwise', 'flip horizontally', 'tilt slightly'"},
                    {"id": "spatial_arrangement", "name": "空间排列", "example": "arrange objects",
                     "guidance": "排列方式：'arrange in line', 'spread out', 'group together', 'evenly distribute'"},
                    {"id": "alignment_fix", "name": "对齐修正", "example": "align properly",
                     "guidance": "对齐方式：'align horizontally', 'align vertically', 'center align', 'align with background'"}
                ]
            },
            "texture_material": {
                "name": "材质纹理",
                "priority": 7,
                "tips": [
                    "🔍 材质精确：使用具体材质名，如'metallic', 'wooden', 'glass', 'fabric'",
                    "✨ 光泽控制：描述光泽程度，如'matte finish', 'glossy surface', 'semi-transparent'",
                    "🌊 纹理细节：指定纹理类型，如'rough texture', 'smooth surface', 'bumpy'",
                    "💎 真实感：材质变化要符合物理规律，保持真实感"
                ],
                "specific_operations": [
                    {"id": "surface_texture", "name": "表面纹理修改", "example": "make smooth/rough",
                     "guidance": "纹理类型：'smooth surface', 'rough texture', 'bumpy', 'grainy', 'polished', 'weathered'"},
                    {"id": "material_change", "name": "材料属性变化", "example": "make metallic",
                     "guidance": "材料类型：'metallic', 'wooden', 'plastic', 'glass', 'ceramic', 'fabric', 'stone'"},
                    {"id": "transparency_adjust", "name": "透明度调整", "example": "make transparent",
                     "guidance": "透明程度：'transparent', 'semi-transparent', 'translucent', 'opaque', 'glass-like'"},
                    {"id": "reflectivity_control", "name": "反射率控制", "example": "add reflection",
                     "guidance": "反射效果：'add reflection', 'mirror-like', 'matte finish', 'glossy surface', 'shiny'"}
                ]
            },
            "object_addition": {
                "name": "对象添加",
                "priority": 8,
                "tips": [
                    "➕ 自然融合：新添加的对象要与原有场景风格、光照、透视保持一致",
                    "📍 位置明确：指定添加位置，如'add cat next to the tree', 'add star above the house'",
                    "⚖️ 尺寸适宜：新对象尺寸要与场景比例协调，避免过大或过小",
                    "🎨 风格统一：添加对象的艺术风格要与整体画面保持一致"
                ],
                "specific_operations": [
                    {"id": "body_part_add", "name": "身体部位添加", "example": "add second thumb",
                     "guidance": "身体部位：'add second thumb', 'add extra finger', 'add wing', 'add tail'。指定位置和大小"},
                    {"id": "decoration_add", "name": "装饰元素添加", "example": "add monkey on sign",
                     "guidance": "装饰添加：'add monkey on sign', 'add flower in hair', 'add sticker on wall'。明确添加位置"},
                    {"id": "background_element_add", "name": "背景元素添加", "example": "add snowman",
                     "guidance": "背景对象：'add snowman', 'add tree', 'add building', 'add cloud'。考虑远近关系"},
                    {"id": "functional_add", "name": "功能性添加", "example": "add words beneath",
                     "guidance": "功能元素：'add text beneath', 'add arrow pointing', 'add frame around'。服务于表达目的"}
                ]
            },
            "object_replacement": {
                "name": "对象替换", 
                "priority": 9,
                "tips": [
                    "🔄 完整替换：明确指定要替换的源对象和目标对象",
                    "📐 空间适配：新对象要适配原对象的空间位置和尺寸",
                    "🎨 风格匹配：替换对象的风格、光照要与整体场景协调",
                    "🔍 细节保持：保持替换后场景的合理性和逻辑性"
                ],
                "specific_operations": [
                    {"id": "material_replace", "name": "材质替换", "example": "carpet to wood floor",
                     "guidance": "格式：'change [原材质] to [新材质]'。如：'carpet to wood floor', 'concrete to marble'"},
                    {"id": "logo_replace", "name": "标识替换", "example": "logo to Apple Logo", 
                     "guidance": "标识替换：'change logo to Apple logo', 'replace sign with McDonald\\'s sign'。保持标识完整性"},
                    {"id": "background_replace", "name": "背景替换", "example": "galaxy background",
                     "guidance": "背景描述：'galaxy background', 'forest background', 'city skyline background'。考虑主体适配"},
                    {"id": "complete_replace", "name": "完全替换", "example": "mech to hot air balloon",
                     "guidance": "完整替换：'replace [原对象] with [新对象]'。如：'replace car with bicycle', 'mech to hot air balloon'"}
                ]
            }
        }
    },
    
    "global_editing": {
        "name": "全局编辑",
        "description": "对整个图像进行全局性转换",
        "operation_types": {
            "state_transformation": {
                "name": "整体状态改变",
                "priority": 1,
                "tips": [
                    "🎬 状态明确：清楚描述目标状态，如'make this a real photo', 'convert to digital art'",
                    "🔄 完整转换：状态改变影响整个画面，包括光照、材质、细节等",
                    "🎯 风格一致：转换后的整体风格要保持内在一致性",
                    "💡 质量提升：通常伴随画质和细节的整体提升"
                ],
                "specific_operations": [
                    {"id": "reality_conversion", "name": "真实化处理", "example": "make this real photo",
                     "guidance": "真实化描述：'make this a real photo', 'photorealistic version', 'convert to reality'。提升细节和真实感"},
                    {"id": "virtual_processing", "name": "虚拟化处理", "example": "digital art",
                     "guidance": "数字化风格：'digital art', 'computer graphics', 'game art style', '3D rendering style'"},
                    {"id": "material_conversion", "name": "材质转换", "example": "cinematic quality",
                     "guidance": "质感转换：'cinematic quality', 'professional photography', 'high-end rendering', 'studio lighting'"},
                    {"id": "concept_reconstruction", "name": "概念重构", "example": "geometric elements",
                     "guidance": "概念化：'geometric elements', 'abstract interpretation', 'minimalist version', 'conceptual art style'"}
                ]
            },
            "artistic_style": {
                "name": "艺术风格转换", 
                "priority": 2,
                "tips": [
                    "🎨 风格明确：指定具体艺术风格，如'renaissance painting', 'impressionist style'",
                    "📚 历史准确：了解艺术风格的特征，确保转换效果符合风格特点",
                    "🖌️ 技法体现：不同风格有不同的绘画技法和视觉特征",
                    "🌈 色彩协调：艺术风格转换会影响整体色彩表现"
                ],
                "specific_operations": [
                    {"id": "classical_painting", "name": "经典绘画风格", "example": "renaissance painting",
                     "guidance": "经典风格：'renaissance painting', 'baroque style', 'classical art', 'oil painting style'。注重细节和光影"},
                    {"id": "modern_drawing", "name": "现代绘图风格", "example": "crayon drawing",
                     "guidance": "现代技法：'crayon drawing', 'watercolor painting', 'acrylic painting', 'mixed media art'。表现技法特色"},
                    {"id": "animation_style", "name": "动画艺术风格", "example": "anime artwork",
                     "guidance": "动画风格：'anime artwork', 'cartoon style', 'Disney animation', 'manga style'。突出线条和色彩"},
                    {"id": "sketch_technique", "name": "素描技法风格", "example": "charcoal sketch",
                     "guidance": "素描类型：'charcoal sketch', 'pencil drawing', 'ink sketch', 'line art'。强调线条和明暗"}
                ]
            },
            "perspective_composition": {
                "name": "视角构图调整",
                "priority": 3,
                "tips": [
                    "📷 摄影原理：运用摄影构图法则，如三分法、黄金比例等",
                    "🔍 焦点管理：明确主体焦点，避免视觉混乱",
                    "📐 透视准确：调整透视要符合空间几何原理",
                    "⚖️ 平衡美感：注意画面的视觉平衡和韵律感"
                ],
                "specific_operations": [
                    {"id": "camera_movement", "name": "镜头推拉", "example": "zoom in/out",
                     "guidance": "镜头操作：'zoom in', 'zoom out', 'close-up view', 'wide-angle view', 'pull back camera'"},
                    {"id": "focus_positioning", "name": "焦点定位", "example": "focus on subject",
                     "guidance": "焦点控制：'focus on subject', 'blur background', 'sharp foreground', 'depth of field effect'"},
                    {"id": "composition_balance", "name": "构图平衡", "example": "rebalance composition",
                     "guidance": "构图调整：'rebalance composition', 'center the subject', 'rule of thirds', 'improve framing'"},
                    {"id": "perspective_adjust", "name": "透视调整", "example": "adjust perspective",
                     "guidance": "透视修正：'adjust perspective', 'correct distortion', 'straighten horizon', 'fix viewing angle'"}
                ]
            },
            "environment_atmosphere": {
                "name": "环境氛围调整",
                "priority": 4,
                "tips": [
                    "💡 光线自然：光照变化要符合自然规律和时间逻辑",
                    "🌤️ 氛围一致：整体氛围要与主题和情绪相协调",
                    "🎨 色温匹配：不同时间和季节有不同的色温特征",
                    "🔄 渐变过渡：氛围调整通常需要渐变过渡，避免突兀"
                ],
                "specific_operations": [
                    {"id": "lighting_control", "name": "明暗控制", "example": "darker/brighter",
                     "guidance": "光线调整：'brighter', 'darker', 'increase lighting', 'add shadows', 'soft lighting', 'dramatic lighting'"},
                    {"id": "time_transformation", "name": "时间变换", "example": "day/night time",
                     "guidance": "时间转换：'change to night time', 'make it daytime', 'sunset lighting', 'sunrise atmosphere', 'twilight mood'"},
                    {"id": "season_conversion", "name": "季节转换", "example": "summer/winter",
                     "guidance": "季节变化：'winter scene', 'summer atmosphere', 'autumn colors', 'spring freshness'。注意植被和天气"},
                    {"id": "mood_creation", "name": "情绪营造", "example": "warm/cold atmosphere",
                     "guidance": "情绪氛围：'warm atmosphere', 'cold mood', 'cozy feeling', 'mysterious ambiance', 'romantic lighting'"}
                ]
            },
            "background_replacement": {
                "name": "背景场景替换",
                "priority": 5,
                "tips": [
                    "🎭 主体保护：替换背景时保持前景主体的完整性和边缘质量",
                    "🎨 风格匹配：新背景要与前景的光照、色调、风格协调",
                    "🌍 空间合理：背景要符合主体的空间关系和尺度比例",
                    "✨ 自然融合：注意光线方向和阴影的合理性"
                ],
                "specific_operations": [
                    {"id": "theme_transformation", "name": "主题转换", "example": "egyptian themed",
                     "guidance": "主题背景：'egyptian themed', 'medieval castle', 'futuristic city', 'tropical paradise'。完整主题设定"},
                    {"id": "color_background", "name": "色彩背景", "example": "rainbow background",
                     "guidance": "色彩背景：'rainbow background', 'gradient background', 'solid color background', 'abstract colorful'"},
                    {"id": "scene_cleaning", "name": "场景清理", "example": "clean background",
                     "guidance": "背景简化：'clean background', 'simple background', 'remove clutter', 'white background', 'minimalist'"},
                    {"id": "environment_reconstruction", "name": "环境重构", "example": "different setting",
                     "guidance": "环境变换：'forest setting', 'urban environment', 'beach scene', 'mountain landscape', 'indoor studio'"}
                ]
            },
            "color_scheme": {
                "name": "色彩方案变更",
                "priority": 6,
                "tips": [
                    "🎨 色彩理论：运用色彩搭配原理，如互补色、类似色等",
                    "🎯 主题一致：色彩方案要与整体主题和情绪相符",
                    "⚖️ 平衡协调：避免色彩过于突兀，保持视觉和谐",
                    "📈 层次分明：通过色彩层次引导视觉焦点"
                ],
                "specific_operations": [
                    {"id": "tone_adjustment", "name": "色调调整", "example": "reddish palette",
                     "guidance": "色调方向：'reddish palette', 'cool tones', 'warm colors', 'monochromatic', 'sepia tones'"},
                    {"id": "color_scheme_change", "name": "配色方案", "example": "blue yellow scheme",
                     "guidance": "配色组合：'blue yellow scheme', 'red green contrast', 'pastel colors', 'earth tones', 'neon colors'"},
                    {"id": "style_unification", "name": "风格统一", "example": "harmonize colors",
                     "guidance": "统一协调：'harmonize colors', 'unify color scheme', 'balance color palette', 'consistent coloring'"},
                    {"id": "palette_transformation", "name": "调色板变换", "example": "vintage color palette",
                     "guidance": "调色板风格：'vintage palette', 'modern color scheme', 'retro colors', 'contemporary palette'"}
                ]
            },
            "filter_effects": {
                "name": "滤镜效果应用",
                "priority": 7,
                "tips": [
                    "⚖️ 适度使用：滤镜效果要适度，避免过度处理影响自然感",
                    "🎯 目的明确：根据需要选择合适的滤镜类型和强度",
                    "💎 质量保持：应用滤镜时保持图像的基本质量和细节",
                    "🔄 可逆思维：考虑滤镜效果的可调整性和后续修改需求"
                ],
                "specific_operations": [
                    {"id": "blur_control", "name": "模糊控制", "example": "add/remove blur",
                     "guidance": "模糊调整：'add blur', 'remove blur', 'motion blur', 'gaussian blur', 'background blur'"},
                    {"id": "sharpening_effect", "name": "锐化效果", "example": "enhance sharpness",
                     "guidance": "锐化增强：'enhance sharpness', 'increase clarity', 'crisp details', 'sharpen edges'"},
                    {"id": "contrast_adjustment", "name": "对比调整", "example": "improve contrast", 
                     "guidance": "对比优化：'improve contrast', 'increase contrast', 'boost saturation', 'enhance visibility'"},
                    {"id": "artistic_filters", "name": "艺术滤镜", "example": "vintage filter effect",
                     "guidance": "艺术效果：'vintage filter', 'film grain', 'HDR effect', 'cross-processing', 'lomography style'"}
                ]
            }
        }
    },

    "creative_reconstruction": {
        "name": "创意重构", 
        "description": "想象力驱动的创造性场景重构",
        "badge": "🆕 高创造性",
        "operation_types": {
            "scene_building": {
                "name": "创意场景构建",
                "priority": 1,
                "tips": [
                    "🌟 想象力释放：大胆描述超现实或奇幻场景，如'dog as solar system sun'",
                    "📖 叙事完整：构建有故事性的场景，考虑前因后果和情境逻辑", 
                    "🎨 视觉冲击：追求视觉震撼效果，使用生动的比喻和描述",
                    "🔮 概念转化：将抽象概念转化为具体的视觉元素"
                ],
                "specific_operations": [
                    {"id": "fantasy_scene", "name": "奇幻场景创造", "example": "dog as solar system sun made of plasma",
                     "guidance": "奇幻描述：使用'as'连接现实与幻想，如'cat as dragon', 'tree as giant mushroom'。描述材质和光效"},
                    {"id": "surreal_construction", "name": "超现实构造", "example": "tower of cows stretching to clouds",
                     "guidance": "超现实组合：打破物理规律，如'tower of cows', 'floating island', 'upside-down city'。突出不可能性"},
                    {"id": "concept_art", "name": "概念艺术表达", "example": "abstract artistic interpretation",
                     "guidance": "概念化表达：'abstract interpretation', 'symbolic representation', 'metaphorical scene'。抽象与具象结合"},
                    {"id": "narrative_scene", "name": "叙事性场景", "example": "story-driven scene creation",
                     "guidance": "故事场景：构建有情节的场景，如'epic battle scene', 'romantic encounter', 'mysterious discovery'"}
                ]
            },
            "style_creation": {
                "name": "风格模仿创作",
                "priority": 2,
                "tips": [
                    "🎨 风格识别：准确描述参考风格的特征，如'impressionist brush strokes'",
                    "🔄 风格迁移：使用'in the style of'或'apply style'进行风格转换",
                    "⚖️ 内容保持：在改变风格的同时保持原有内容的可识别性",
                    "🎭 创新融合：结合多种风格元素创造独特的视觉表达"
                ],
                "specific_operations": [
                    {"id": "style_transfer", "name": "艺术风格迁移", "example": "art in this style of rusted car",
                     "guidance": "风格迁移：'in the style of [艺术家/风格]', 'apply [风格名] style', 'mimic [参考对象] style'",
                     "presets": [
                         {"id": "anime_style", "name": "动漫风格", "prompt": "in the style of anime artwork", "description": "转换为日本动漫风格"},
                         {"id": "realistic_photo", "name": "写实照片", "prompt": "make this a real photo", "description": "转换为真实照片风格"},
                         {"id": "charcoal_sketch", "name": "炭笔素描", "prompt": "make this into a charcoal sketch", "description": "转换为炭笔素描风格"},
                         {"id": "oil_painting", "name": "油画风格", "prompt": "make this into an oil painting", "description": "转换为经典油画风格"},
                         {"id": "watercolor", "name": "水彩画", "prompt": "make this into a watercolor painting", "description": "转换为水彩画风格"},
                         {"id": "cinematic", "name": "电影风格", "prompt": "make this cinematic", "description": "转换为电影风格"},
                         {"id": "cartoon", "name": "卡通风格", "prompt": "make this into a cartoon", "description": "转换为卡通风格"},
                         {"id": "pixel_art", "name": "像素艺术", "prompt": "make this into pixel art", "description": "转换为像素艺术风格"}
                     ]},
                    {"id": "reference_application", "name": "参考风格应用", "example": "apply reference style",
                     "guidance": "参考应用：'apply reference style', 'use this visual style', 'match this aesthetic'。需要明确参考源"},
                    {"id": "style_fusion", "name": "主题风格融合", "example": "blend style with theme",
                     "guidance": "融合创新：'blend [风格A] with [风格B]', 'combine [主题] with [风格]', 'mix different styles'"},
                    {"id": "brand_adaptation", "name": "品牌风格适配", "example": "brand style adaptation",
                     "guidance": "品牌风格：'adapt to [品牌名] style', 'corporate visual identity', 'brand-consistent design'"}
                ]
            },
            "character_action": {
                "name": "角色动作设定",
                "priority": 3,
                "tips": [
                    "🎭 动作清晰：使用明确的动作描述词，如'dancing', 'fighting', 'embracing'",
                    "🎬 情境合理：动作要符合角色身份和场景环境",
                    "💫 动态感受：通过动作传达情感和故事内容",
                    "🔄 互动自然：角色与环境或其他角色的互动要自然流畅"
                ],
                "specific_operations": [
                    {"id": "action_instruction", "name": "动作指令执行", "example": "make character perform action",
                     "guidance": "动作指令：'make character dance', 'have him jump', 'she is running'。使用主动语态描述"},
                    {"id": "pose_setting", "name": "姿态场景设定", "example": "set in specific pose",
                     "guidance": "姿态描述：'dramatic pose', 'heroic stance', 'relaxed sitting', 'elegant posture'。描述具体姿态"},
                    {"id": "environment_interaction", "name": "环境互动表现", "example": "interacting with environment",
                     "guidance": "环境互动：'touching the wall', 'climbing the tree', 'sitting on the bench'。明确互动对象"},
                    {"id": "narrative_behavior", "name": "叙事行为展示", "example": "story-based behavior",
                     "guidance": "叙事行为：结合故事情节，如'preparing for battle', 'celebrating victory', 'mourning loss'"}
                ]
            },
            "media_transformation": {
                "name": "媒介形式转换",
                "priority": 4,
                "tips": [
                    "🎨 媒介特征：了解不同媒介的视觉特征和表现方式",
                    "🔄 形式转换：明确指定目标媒介类型，如'as sculpture', 'as painting'",
                    "💡 创新表达：利用媒介转换探索新的视觉表现可能性",
                    "⚖️ 本质保持：在形式变化中保持内容的核心特征"
                ],
                "specific_operations": [
                    {"id": "painting_art", "name": "绘画艺术", "example": "transform to painting",
                     "guidance": "绘画转换：'as oil painting', 'watercolor version', 'acrylic art style', 'brush stroke painting'"},
                    {"id": "sculpture_form", "name": "雕塑立体", "example": "sculptural representation",
                     "guidance": "雕塑形式：'as marble sculpture', 'bronze statue', '3D sculptural form', 'carved relief'"},
                    {"id": "digital_art", "name": "数字艺术", "example": "digital art medium",
                     "guidance": "数字媒介：'digital art style', 'computer graphics', 'vector art', 'pixel art style'"},
                    {"id": "concept_design", "name": "概念设计", "example": "concept design form",
                     "guidance": "概念设计：'concept art style', 'design prototype', 'technical illustration', 'blueprint style'"}
                ]
            },
            "environment_reconstruction": {
                "name": "场景环境重构",
                "priority": 5,
                "tips": [
                    "🌍 空间想象：重新构想整体空间布局和环境特征",
                    "🏗️ 逻辑重构：新环境要有内在的空间逻辑和合理性",
                    "🎭 叙事环境：通过环境重构支撑故事情节和情绪表达",
                    "🔄 主体适配：确保主体对象在新环境中的合理性"
                ],
                "specific_operations": [
                    {"id": "setting_reconstruction", "name": "环境重构", "example": "reconstruct setting",
                     "guidance": "环境重建：'reconstruct as [新环境]', 'transform setting to [场所]', 'reimagine environment'"},
                    {"id": "spatial_transformation", "name": "空间转换", "example": "transform spatial context",
                     "guidance": "空间变换：'change spatial context', 'alter perspective', 'modify spatial relationships'"},
                    {"id": "location_setting", "name": "情境设定", "example": "specific location context",
                     "guidance": "场所设定：'set in [具体地点]', 'location context of [环境]', 'place in [时空背景]'"},
                    {"id": "environmental_storytelling", "name": "环境叙事", "example": "environmental storytelling",
                     "guidance": "环境叙事：通过环境元素讲述故事，如'post-apocalyptic ruins', 'magical forest setting'"}
                ]
            },
            "material_transformation": {
                "name": "材质形态转换",
                "priority": 6,
                "tips": [
                    "💎 材质理解：明确不同材质的视觉特征和物理属性",
                    "🔄 形态转换：在保持基本形状的基础上改变材质属性",
                    "🎨 工艺感受：体现不同材质的工艺制作特征",
                    "💫 功能考量：考虑新材质形态的实用性和美观性"
                ],
                "specific_operations": [
                    {"id": "physical_transformation", "name": "物理转换", "example": "different materials",
                     "guidance": "材质转换：'made of [材质]', 'transform to [新材质]', 'different material version'"},
                    {"id": "craft_form", "name": "工艺品形态", "example": "craft/artifact form",
                     "guidance": "工艺品化：'as handcrafted item', 'artisan-made version', 'traditional craft style'"},
                    {"id": "collectible_form", "name": "收藏品形式", "example": "collectible form",
                     "guidance": "收藏品化：'as collectible item', 'museum piece', 'limited edition version', 'vintage collectible'"},
                    {"id": "functional_object", "name": "功能物品", "example": "functional object",
                     "guidance": "功能化：'as functional [用途]', 'practical version', 'everyday object', 'utility design'"}
                ]
            }
        }
    },

    "text_editing": {
        "name": "文字编辑",
        "description": "专门处理图像中的文字内容",
        "operation_types": {
            "content_replace": {
                "name": "文字内容替换",
                "priority": 1,
                "tips": [
                    "📝 精确引用：用双引号精确引用原文字，确保系统准确识别",
                    "🔄 格式统一：使用'Make \"原文\" say \"新文\"'或'change \"原文\" to \"新文\"'格式",
                    "🎯 内容匹配：替换内容的长度和复杂度要与原文协调",
                    "💡 上下文合理：新文字要符合图像的整体语境和主题"
                ],
                "specific_operations": [
                    {"id": "word_replace", "name": "单词替换", "example": 'Make "HongKong" say "King Kong"',
                     "guidance": "单词替换格式：'Make \"原单词\" say \"新单词\"'。确保原词引用准确，新词长度适宜"},
                    {"id": "phrase_replace", "name": "短语替换", "example": 'change text to say "big bagel boys"',
                     "guidance": "短语替换：'change text to say \"新短语\"'。适用于多词组合的替换"},
                    {"id": "sentence_replace", "name": "句子替换", "example": 'text says "remember to eat your veggies"',
                     "guidance": "句子替换：'text says \"完整句子\"'。用于完整句子的替换，注意语法完整性"},
                    {"id": "multi_text_replace", "name": "多文本替换", "example": 'change all text to new content',
                     "guidance": "批量替换：'change all text to \"统一内容\"'。适用于多处文字的统一替换"}
                ]
            },
            "content_add": {
                "name": "文字添加",
                "priority": 2,
                "tips": [
                    "➕ 位置明确：指定添加位置，如'beneath', 'above', 'next to', 'in corner'",
                    "📝 内容引用：用双引号明确标示要添加的文字内容", 
                    "🎨 风格协调：新添加的文字要与原有文字风格协调一致",
                    "⚖️ 大小适宜：新文字的大小要与图像比例和其他文字协调"
                ],
                "specific_operations": [
                    {"id": "text_insert", "name": "文字插入", "example": 'add text "Pweese" beneath him',
                     "guidance": "文字插入：'add text \"内容\" [位置]'，如'add text \"Hello\" above the car'。明确内容和位置"},
                    {"id": "label_add", "name": "标签添加", "example": 'add label "Cool Little Easel"',
                     "guidance": "标签添加：'add label \"标签内容\"'。用于为对象添加名称或说明标签"},
                    {"id": "caption_add", "name": "说明文字添加", "example": 'add caption below image',
                     "guidance": "说明文字：'add caption \"说明内容\"'。用于添加图片说明或描述性文字"},
                    {"id": "watermark_add", "name": "水印文字添加", "example": 'add watermark text',
                     "guidance": "水印添加：'add watermark \"水印内容\"'。通常添加版权或品牌信息"}
                ]
            },
            "style_modify": {
                "name": "文字样式修改",
                "priority": 3,
                "tips": [
                    "🎨 效果精准：使用具体效果名，如'rainbow colored', 'metallic gold'",
                    "🗒️ 字体协调：字体样式要与整体设计风格保持一致",
                    "✨ 特效适度：文字特效要适度，不影响可读性",
                    "🌈 颜色表达：颜色描述要精确，如'bright red', 'gradient blue'"
                ],
                "specific_operations": [
                    {"id": "color_change", "name": "文字颜色修改", "example": "make text rainbow colored",
                     "guidance": "颜色效果：'rainbow colored', 'gradient red to blue', 'metallic gold', 'neon bright'。使用具体颜色名"},
                    {"id": "font_change", "name": "字体样式修改", "example": "change font to bold",
                     "guidance": "字体样式：'bold', 'italic', 'underline', 'strikethrough'。可组合使用"},
                    {"id": "effect_add", "name": "文字特效添加", "example": "add shadow to text",
                     "guidance": "特效类型：'add shadow', 'add glow effect', '3D effect', 'embossed style'。注意不影响可读性"},
                    {"id": "outline_modify", "name": "文字轮廓修改", "example": "add text outline",
                     "guidance": "轮廓效果：'add outline', 'thick border', 'colored outline', 'remove outline'。可指定轮廓颜色"}
                ]
            },
            "size_adjust": {
                "name": "文字大小调整",
                "priority": 4,
                "tips": [
                    "📏 程度明确：使用具体程度词，如'much larger', 'slightly smaller'",
                    "⚖️ 比例协调：文字大小要与图像比例和其他文字协调",
                    "🔍 可读性保持：调整后的文字要保持清晰可读",
                    "🎯 焦点适度：文字大小要符合其重要性和层次"
                ],
                "specific_operations": [
                    {"id": "enlarge_text", "name": "文字放大", "example": "make text larger",
                     "guidance": "放大程度：'make larger', 'much bigger', 'double size', 'increase font size'。可指定具体倍数"},
                    {"id": "shrink_text", "name": "文字缩小", "example": "make text smaller",
                     "guidance": "缩小程度：'make smaller', 'much smaller', 'half size', 'reduce font size'。保持可读性"},
                    {"id": "proportion_fix", "name": "比例调整", "example": "adjust text proportions",
                     "guidance": "比例修正：'adjust proportions', 'fix text scaling', 'balance text sizes'。针对多段文字"},
                    {"id": "scale_normalize", "name": "尺寸标准化", "example": "normalize text size",
                     "guidance": "标准化：'normalize text size', 'standard font size', 'consistent sizing'。统一文字大小"}
                ]
            },
            "position_change": {
                "name": "文字位置变更",
                "priority": 5,
                "tips": [
                    "🎨 位置精确：使用方位词，如'at bottom', 'in center', 'upper right'",
                    "📐 对齐方式：明确指定对齐方式，如'center align', 'left align'",
                    "↻ 旋转角度：可指定具体角度，如'rotate 45 degrees'",
                    "⚖️ 布局平衡：调整后的文字要与整体布局协调"
                ],
                "specific_operations": [
                    {"id": "move_text", "name": "文字移动", "example": "move text to bottom",
                     "guidance": "移动位置：'move to bottom', 'move to left', 'place at center', 'position above'。明确指定目标位置"},
                    {"id": "align_text", "name": "文字对齐", "example": "center align text",
                     "guidance": "对齐方式：'center align', 'left align', 'right align', 'justify text'。适用于多行文字"},
                    {"id": "rotate_text", "name": "文字旋转", "example": "rotate text 45 degrees",
                     "guidance": "旋转描述：'rotate 90 degrees', 'tilt text', 'vertical text', 'diagonal text'。注意可读性"},
                    {"id": "spacing_adjust", "name": "间距调整", "example": "adjust text spacing",
                     "guidance": "间距控制：'increase spacing', 'tighter spacing', 'letter spacing', 'line spacing'。优化可读性"}
                ]
            },
            "text_remove": {
                "name": "文字删除",
                "priority": 6,
                "tips": [
                    "🎯 精确指定：明确指定要删除的文字，避免误删",
                    "🔧 背景修复：系统会自动修复删除后的背景区域",
                    "✨ 无痕处理：删除后保持背景的自然性和完整性",
                    "🔍 细节保持：保持其他元素的清晰度和质量"
                ],
                "specific_operations": [
                    {"id": "text_erase", "name": "文字擦除", "example": "remove all text",
                     "guidance": "全部删除：'remove all text', 'erase text completely', 'delete all words'。清理所有文字内容"},
                    {"id": "partial_remove", "name": "部分文字删除", "example": "remove specific words",
                     "guidance": "部分删除：'remove \"specific text\"', 'delete certain words', 'erase selected text'。精确指定内容"},
                    {"id": "background_repair", "name": "背景修复", "example": "remove text with background repair",
                     "guidance": "背景修复：'remove text and repair background', 'seamless text removal'。重点关注背景恢复"},
                    {"id": "clean_removal", "name": "干净移除", "example": "cleanly remove text",
                     "guidance": "干净删除：'cleanly remove text', 'professional text removal', 'invisible removal'。追求最佳效果"}
                ]
            }
        }
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
    },
    "face_swap": {
        "name": "Face Swap",
        "prompt": "Place face on target, make it natural, keep face unchanged, fix the edges."
    },
    "face_preservation": {
        "name": "Face Preservation",
        "prompt": "Keep face unchanged, maintain face features, preserve face shape."
    },
    "character_consistency": {
        "name": "Character Consistency", 
        "prompt": "Keep face features unchanged, maintain face appearance, preserve identity."
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
    },
    "face_swap_natural": {
        "name": "Natural Face Swap Style",
        "prompt": "Seamless face swapping with natural integration, preserving facial characteristics and authentic appearance."
    },
    "portrait_preservation": {
        "name": "Portrait Preservation Style", 
        "prompt": "Maintain original facial features and identity while applying professional portrait enhancements."
    },
    "character_maintained": {
        "name": "Character Maintained Style",
        "prompt": "Preserve distinctive character traits, personality expressions, and recognizable features during modifications."
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
    },
    
    "face_swap_preserve": {
        "name": "Face Swap - Preserve Identity",
        "description": "Face swapping while maintaining original facial characteristics",
        "prompt": """Face swap specialist: Place face on target while keeping face unchanged.

REQUIREMENTS:
- Keep face unchanged
- Make edges smooth
- Fix skin tone
- Keep face features
- Make it look natural
- Fix the lighting

KEYWORDS:
- "keep face unchanged"
- "make edges smooth" 
- "fix skin tone"
- "make it natural"
- "keep face shape"
- "fix the edges"

Output: Place face naturally with unchanged features."""
    },
    
    "face_swap_seamless": {
        "name": "Face Swap - Seamless Blend",
        "description": "Professional face swapping with perfect integration",
        "prompt": """Professional face swap specialist: Place face and make it look real.

REQUIREMENTS:
- Fix skin tone
- Make edges smooth
- Fix the lighting
- Make it look real
- Keep background unchanged
- Make it natural

QUALITY MARKERS:
- "make edges smooth"
- "fix lighting"
- "fix skin tone"
- "make it look real"
- "keep unchanged"
- "make it natural"

Output: Place face naturally with smooth edges."""
    },
    
    "face_swap_character": {
        "name": "Face Swap - Character Consistency",
        "description": "Face swapping while maintaining character appearance",
        "prompt": """Character consistency specialist: Place face while keeping character unchanged.

CHARACTER PRESERVATION:
- Keep face unchanged
- Make expression natural
- Keep face features
- Make it look consistent
- Keep face appearance
- Make it look real

KEYWORDS:
- "keep face unchanged"
- "keep face features"
- "make it natural"
- "keep appearance"
- "make it consistent"
- "keep unchanged"

Output: Place face naturally keeping character consistent."""
    },
    
    "face_enhancement_preserve": {
        "name": "Face Enhancement - Natural Preservation",
        "description": "Facial enhancement while keeping natural appearance",
        "prompt": """Natural enhancement specialist: Make face better while keeping it unchanged.

NATURAL PRESERVATION:
- Make face better
- Keep face unchanged
- Make skin smoother
- Make it look natural
- Keep face shape
- Make quality better

ENHANCEMENT KEYWORDS:
- "make face better"
- "keep unchanged"
- "make skin smooth"
- "make it natural"
- "keep face shape"
- "make quality better"

Output: Make face better while keeping it natural."""
    },
    
    "portrait_face_consistent": {
        "name": "Portrait Face - Consistent Features",
        "description": "Portrait editing with consistent facial characteristics",
        "prompt": """Portrait consistency specialist: Edit portrait while keeping face unchanged.

FACIAL CONSISTENCY:
- Keep face unchanged
- Make skin natural
- Keep face shape
- Keep face features
- Make it consistent
- Keep face appearance

CONSISTENCY MARKERS:
- "keep face unchanged"
- "make skin natural"
- "keep face shape"
- "keep face features"
- "make it consistent"
- "keep appearance"

Output: Edit portrait keeping face completely unchanged."""
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
            return False
    
    def load_user_guidance(self, name: str) -> Optional[str]:
        """加载用户自定义引导话术"""
        try:
            user_data = self.load_user_guidance_data()
            if name in user_data:
                return user_data[name]["guidance"]
            return None
        except Exception as e:
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
            return False
    
    def list_user_guidance(self) -> List[str]:
        """获取所有用户自定义引导话术名称列表"""
        try:
            user_data = self.load_user_guidance_data()
            return list(user_data.keys())
        except Exception as e:
            return []
    
    def load_user_guidance_data(self) -> Dict:
        """加载用户引导话术数据"""
        try:
            if USER_GUIDANCE_FILE.exists():
                with open(USER_GUIDANCE_FILE, 'r', encoding='utf-8') as f:
                    return json.load(f)
            return {}
        except Exception as e:
            return {}
    
    def save_user_guidance_data(self, data: Dict):
        """保存用户引导话术数据"""
        try:
            with open(USER_GUIDANCE_FILE, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        except Exception as e:
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