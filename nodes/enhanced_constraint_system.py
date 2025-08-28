"""
增强约束系统
基于1026官方数据集分析的三层约束架构
实现操作特异性约束 + 认知负荷适配 + 应用场景约束
Version: 1.0.0 - 基于深度数据分析
"""

import json
import random
from typing import Dict, List, Tuple, Optional, Set
from dataclasses import dataclass
from .guidance_templates import KONTEXT_EDITING_TYPES

@dataclass
class ConstraintProfile:
    """约束配置文件"""
    operation_constraints: List[str]    # 操作特异性约束
    cognitive_constraints: List[str]    # 认知负荷约束
    context_constraints: List[str]      # 应用场景约束
    total_complexity: float            # 总体复杂度
    constraint_density: int            # 约束密度

class EnhancedConstraintSystem:
    """增强约束系统 - 基于1026数据集分析"""
    
    def __init__(self):
        self.operation_constraints = self._init_operation_constraints()
        self.cognitive_constraints = self._init_cognitive_constraints()
        self.context_constraints = self._init_context_constraints()
        self.semantic_modifiers = self._init_semantic_modifiers()
    
    def _init_operation_constraints(self) -> Dict[str, Dict]:
        """初始化操作特异性约束（基于1026数据集高频模式）"""
        return {
            # 添加操作约束
            "add": {
                "technical": [
                    "seamless visual integration with existing lighting conditions",
                    "perspective geometry alignment maintaining spatial consistency", 
                    "accurate shadow casting based on light source direction",
                    "edge blending with sub-pixel precision for natural transitions",
                    "depth of field matching to preserve focus hierarchy"
                ],
                "aesthetic": [
                    "visual weight balance maintaining compositional harmony",
                    "style consistency matching existing artistic direction",
                    "color temperature coordination with ambient lighting",
                    "texture pattern continuation for material coherence",
                    "scale proportion accuracy maintaining realistic relationships"
                ],
                "quality": [
                    "detail richness preservation at all resolution levels",
                    "natural edge transitions without visible artifacts",
                    "material property consistency across surface variations",
                    "realistic reflection and refraction behavior",
                    "professional finishing with commercial quality standards"
                ]
            },
            
            # 删除操作约束
            "remove": {
                "technical": [
                    "content-aware background reconstruction maintaining pattern continuity",
                    "texture synthesis preserving surrounding material properties",
                    "geometric structure preservation without distortion artifacts",
                    "intelligent fill algorithms adapting to environmental context",
                    "seam elimination using advanced blending techniques"
                ],
                "aesthetic": [
                    "compositional rebalancing after object removal",
                    "visual focal point natural redistribution",
                    "background flow continuity maintaining scene coherence",
                    "depth layer preservation for spatial authenticity",
                    "atmospheric perspective maintenance"
                ],
                "quality": [
                    "invisible trace elimination with forensic-level precision",
                    "natural background extension without repetitive patterns",
                    "detail preservation in surrounding areas",
                    "edge cleanup with anti-aliasing optimization",
                    "professional quality output ready for publication"
                ]
            },
            
            # 颜色修改约束
            "color_modification": {
                "technical": [
                    "color space management preserving ICC profile accuracy",
                    "white balance precision maintaining neutral references",
                    "saturation control preventing clipping in any channel",
                    "hue shift accuracy maintaining color relationships",
                    "luminance preservation during chromatic adjustments"
                ],
                "aesthetic": [
                    "emotional color expression enhancing intended mood",
                    "visual hierarchy reinforcement through color contrast",
                    "atmospheric mood creation using temperature shifts",
                    "brand color consistency maintaining identity standards",
                    "harmonic color relationships following theory principles"
                ],
                "quality": [
                    "natural color transition without banding artifacts",
                    "detail retention during color space conversions", 
                    "skin tone authenticity preservation in portraits",
                    "material color accuracy for product photography",
                    "color grading precision matching professional standards"
                ]
            },
            
            # 形态变换约束（基于1026高频操作）
            "shape_transformation": {
                "technical": [
                    "morphological transformation preserving core structure",
                    "proportional scaling maintaining anatomical accuracy",
                    "skeletal structure preservation during deformation",
                    "surface continuity maintenance across transformation boundaries"
                ],
                "aesthetic": [
                    "natural movement flow expressing intended action",
                    "gesture authenticity maintaining character personality",
                    "postural dynamics enhancing narrative expression",
                    "compositional balance adjustment after transformation"
                ],
                "quality": [
                    "smooth surface interpolation without mesh artifacts",
                    "detail preservation during geometric manipulation",
                    "edge quality maintenance during scaling operations",
                    "realistic deformation following physical properties"
                ]
            },
            
            # 文字操作约束  
            "text_operation": {
                "technical": [
                    "font rendering with proper anti-aliasing optimization",
                    "character spacing precision following typographic standards",
                    "text baseline alignment maintaining reading flow",
                    "resolution independence ensuring scalability"
                ],
                "aesthetic": [
                    "typographic hierarchy supporting content structure",
                    "readability optimization across viewing distances",
                    "style integration matching visual design language",
                    "contrast enhancement for accessibility compliance"
                ],
                "quality": [
                    "sharp character edges preventing blurriness",
                    "color accuracy maintaining brand identity",
                    "background integration without visual conflicts",
                    "professional typography following design standards"
                ]
            },
            
            # 背景替换约束
            "background_replacement": {
                "technical": [
                    "edge detection precision for clean subject extraction",
                    "lighting condition matching between subject and background",
                    "perspective alignment maintaining spatial believability",
                    "color temperature consistency across scene elements"
                ],
                "aesthetic": [
                    "thematic coherence supporting narrative context",
                    "environmental storytelling through background choice",
                    "mood reinforcement through atmospheric elements",
                    "visual depth enhancement using background layers"
                ],
                "quality": [
                    "seamless integration eliminating selection artifacts",
                    "shadow casting accuracy on new background surface",
                    "atmospheric perspective matching for depth realism",
                    "professional compositing quality ready for commercial use"
                ]
            }
        }
    
    def _init_cognitive_constraints(self) -> Dict[str, Dict]:
        """初始化认知负荷约束（基于1026数据集认知负荷分析）"""
        return {
            # 低认知负荷约束（2.695 - 局部编辑）
            "low_load_2.7": {
                "constraint_count": 3,
                "complexity_level": "direct_technical",
                "technical_focus": [
                    "precise execution following exact specifications",
                    "technical standard compliance ensuring quality",
                    "quality assurance verification at completion"
                ],
                "processing_style": "linear_execution",
                "output_characteristics": [
                    "immediate visual feedback",
                    "predictable results", 
                    "minimal interpretation required"
                ]
            },
            
            # 中认知负荷约束（3.229 - 全局编辑）
            "medium_load_3.2": {
                "constraint_count": 6,
                "complexity_level": "contextual_professional",
                "professional_requirements": [
                    "industry standard adherence maintaining commercial viability",
                    "contextual scene adaptation supporting narrative coherence",
                    "aesthetic standard application following design principles",
                    "functional requirement integration ensuring usability",
                    "professional quality benchmarking against industry standards",
                    "user experience optimization through visual hierarchy"
                ],
                "processing_style": "multi_dimensional_analysis", 
                "output_characteristics": [
                    "professional polish",
                    "contextual appropriateness",
                    "commercial viability"
                ]
            },
            
            # 中高认知负荷约束（3.457 - 文字编辑）
            "medium_high_load_3.5": {
                "constraint_count": 7,
                "complexity_level": "linguistic_contextual",
                "linguistic_requirements": [
                    "semantic accuracy preserving intended meaning",
                    "cultural context sensitivity avoiding misinterpretation",
                    "readability optimization across demographic groups",
                    "brand voice consistency maintaining identity standards",
                    "accessibility compliance ensuring inclusive design",
                    "linguistic flow enhancement supporting comprehension",
                    "visual hierarchy support through typographic emphasis"
                ],
                "processing_style": "semantic_understanding",
                "output_characteristics": [
                    "semantic precision",
                    "cultural appropriateness", 
                    "communicative effectiveness"
                ]
            },
            
            # 高认知负荷约束（5.794 - 创意重构）
            "high_load_5.8": {
                "constraint_count": 12,
                "complexity_level": "creative_conceptual",
                "creative_requirements": [
                    "conceptual innovation pushing creative boundaries beyond conventional limits",
                    "artistic expression authenticity maintaining emotional resonance and cultural relevance",
                    "philosophical depth integration weaving meaningful narratives into visual metaphors",
                    "cultural symbol utilization respecting heritage while enabling contemporary interpretation",
                    "emotional resonance cultivation creating lasting psychological impact on viewers",
                    "narrative structure sophistication supporting complex storytelling through visual elements",
                    "metaphorical thinking application transforming abstract concepts into tangible representations",
                    "artistic movement integration honoring historical context while enabling modern innovation", 
                    "creative synthesis achievement combining disparate elements into cohesive artistic statements",
                    "imaginative leap facilitation transcending literal interpretation for conceptual exploration",
                    "artistic authenticity preservation maintaining creative integrity throughout transformation",
                    "visionary expression enablement allowing unprecedented creative possibilities to emerge"
                ],
                "processing_style": "non_linear_creative",
                "output_characteristics": [
                    "conceptual breakthrough",
                    "emotional impact",
                    "cultural significance"
                ]
            }
        }
    
    def _init_context_constraints(self) -> Dict[str, Dict]:
        """初始化应用场景约束"""
        return {
            # 产品展示约束
            "product_showcase": {
                "lighting": [
                    "studio standard illumination eliminating harsh shadows while preserving texture detail",
                    "product texture enhancement highlighting material quality and craftsmanship",
                    "reflection control precision minimizing distracting glare while maintaining material authenticity",
                    "color temperature consistency ensuring accurate product representation across platforms"
                ],
                "composition": [
                    "product prominence establishment through strategic positioning and scale optimization",
                    "background simplification eliminating visual distractions while maintaining context",
                    "multiple angle demonstration supporting comprehensive product understanding",
                    "brand consistency maintenance aligning with established visual identity guidelines"
                ],
                "commercial": [
                    "marketplace optimization ensuring compatibility with e-commerce platform requirements",
                    "conversion optimization through visual appeal enhancement and trust signal integration",
                    "catalog standard compliance meeting industry benchmarks for professional presentation",
                    "target market adaptation ensuring cultural and demographic appropriateness"
                ]
            },
            
            # 创意表达约束
            "creative_expression": {
                "artistic": [
                    "artistic movement integration honoring historical context while enabling contemporary innovation",
                    "creative concept manifestation transforming abstract ideas into compelling visual narratives",
                    "visual language innovation developing unique aesthetic vocabulary for enhanced expression",
                    "cultural dialogue facilitation bridging traditional wisdom with modern creative exploration"
                ],
                "emotional": [
                    "emotional depth cultivation creating psychological resonance through carefully crafted visual elements",
                    "audience empathy activation using universal human experiences as creative foundation",
                    "storytelling sophistication weaving complex narratives through symbolic visual arrangements",
                    "authentic expression preservation maintaining creative integrity while maximizing emotional impact"
                ],
                "cultural": [
                    "cultural symbol integration respecting heritage while enabling meaningful contemporary interpretation",
                    "contemporary relevance establishment connecting historical significance with modern cultural discourse",
                    "social commentary facilitation using visual metaphors to explore significant societal themes",
                    "cross-cultural dialogue enablement fostering understanding through shared visual experiences"
                ]
            },
            
            # 营销传播约束
            "marketing_communication": {
                "conversion": [
                    "attention capture optimization using proven visual psychology principles",
                    "call-to-action support through strategic visual hierarchy and emphasis placement",
                    "trust signal integration building confidence through professional presentation standards",
                    "emotional trigger activation connecting product benefits with customer desires"
                ],
                "brand": [
                    "brand identity reinforcement ensuring consistent visual language across touchpoints",
                    "market positioning support through strategic aesthetic choices aligned with target demographics",
                    "competitive differentiation highlighting unique value propositions through distinctive visual approach",
                    "brand personality expression communicating core values through carefully curated visual elements"
                ],
                "effectiveness": [
                    "message clarity optimization ensuring primary communication objectives are achieved",
                    "audience engagement enhancement through culturally relevant and emotionally resonant imagery",
                    "campaign cohesion maintenance supporting broader marketing strategy objectives",
                    "performance optimization enabling measurable improvement in key marketing metrics"
                ]
            }
        }
    
    def _init_semantic_modifiers(self) -> Dict[str, Dict]:
        """初始化语义修饰词分级系统（基于1026数据认知负荷分析）"""
        return {
            # 第一级：技术精确性修饰词（低认知负荷）
            "level_1_technical": {
                "precision": ["precisely calibrated", "exactly specified", "technically accurate", "systematically executed"],
                "quality": ["professionally finished", "industry standard", "technically sound", "quality assured"], 
                "execution": ["methodically applied", "systematically implemented", "carefully executed", "precisely controlled"]
            },
            
            # 第二级：专业语境修饰词（中认知负荷）
            "level_2_professional": {
                "commercial": ["commercially viable", "market-ready", "brand-compliant", "professionally polished"],
                "contextual": ["contextually appropriate", "situationally optimized", "environmentally integrated", "thematically coherent"],
                "aesthetic": ["aesthetically balanced", "visually harmonious", "compositionally strong", "stylistically consistent"]
            },
            
            # 第三级：创意概念修饰词（高认知负荷）
            "level_3_creative": {
                "conceptual": ["conceptually revolutionary", "philosophically profound", "intellectually stimulating", "metaphorically rich"],
                "artistic": ["artistically transcendent", "creatively groundbreaking", "visually poetic", "aesthetically transformative"],
                "cultural": ["culturally resonant", "socially meaningful", "historically significant", "universally compelling"]
            }
        }
    
    def generate_constraint_profile(self, operation_type: str, cognitive_load: float, 
                                  context_type: str = "product_showcase") -> ConstraintProfile:
        """生成约束配置文件（核心算法）"""
        
        # 第一步：认知负荷分类和基础约束数量计算
        load_category = self._categorize_cognitive_load(cognitive_load)
        base_constraint_count = self.cognitive_constraints[load_category]["constraint_count"]
        
        # 第二步：操作特异性约束选择（40%权重）
        operation_constraint_count = max(1, int(base_constraint_count * 0.4))
        operation_constraints = self._select_operation_constraints(
            operation_type, operation_constraint_count
        )
        
        # 第三步：认知负荷约束添加（40%权重）
        cognitive_constraint_count = max(1, int(base_constraint_count * 0.4))
        cognitive_constraints = self._select_cognitive_constraints(
            load_category, cognitive_constraint_count
        )
        
        # 第四步：应用场景约束补充（20%权重）
        context_constraint_count = max(1, int(base_constraint_count * 0.2))
        context_constraints = self._select_context_constraints(
            context_type, context_constraint_count
        )
        
        return ConstraintProfile(
            operation_constraints=operation_constraints,
            cognitive_constraints=cognitive_constraints, 
            context_constraints=context_constraints,
            total_complexity=cognitive_load,
            constraint_density=len(operation_constraints) + len(cognitive_constraints) + len(context_constraints)
        )
    
    def _categorize_cognitive_load(self, cognitive_load: float) -> str:
        """认知负荷分类（基于1026数据集标准）"""
        if cognitive_load <= 3.0:
            return "low_load_2.7"
        elif cognitive_load <= 3.5:
            return "medium_load_3.2"  
        elif cognitive_load <= 4.0:
            return "medium_high_load_3.5"
        else:
            return "high_load_5.8"
    
    def _select_operation_constraints(self, operation_type: str, count: int) -> List[str]:
        """选择操作特异性约束"""
        if operation_type not in self.operation_constraints:
            operation_type = "add"  # 默认操作类型
        
        constraints = []
        op_constraints = self.operation_constraints[operation_type]
        
        # 平衡选择：技术、美学、质量各占1/3
        categories = ["technical", "aesthetic", "quality"]
        for category in categories:
            if category in op_constraints:
                available = op_constraints[category]
                select_count = max(1, count // 3)
                constraints.extend(random.sample(available, min(select_count, len(available))))
        
        # 如果还需要更多约束，随机补充
        while len(constraints) < count:
            all_available = []
            for category in categories:
                if category in op_constraints:
                    all_available.extend(op_constraints[category])
            
            remaining = [c for c in all_available if c not in constraints]
            if not remaining:
                break
                
            constraints.append(random.choice(remaining))
        
        return constraints[:count]
    
    def _select_cognitive_constraints(self, load_category: str, count: int) -> List[str]:
        """选择认知负荷约束"""
        constraints = []
        cognitive_data = self.cognitive_constraints[load_category]
        
        # 根据认知负荷类别选择合适的约束类型
        if load_category == "low_load_2.7":
            constraints.extend(random.sample(
                cognitive_data["technical_focus"], 
                min(count, len(cognitive_data["technical_focus"]))
            ))
        elif load_category == "medium_load_3.2":
            constraints.extend(random.sample(
                cognitive_data["professional_requirements"],
                min(count, len(cognitive_data["professional_requirements"]))  
            ))
        elif load_category == "medium_high_load_3.5":
            constraints.extend(random.sample(
                cognitive_data["linguistic_requirements"],
                min(count, len(cognitive_data["linguistic_requirements"]))
            ))
        else:  # high_load_5.8
            constraints.extend(random.sample(
                cognitive_data["creative_requirements"],
                min(count, len(cognitive_data["creative_requirements"]))
            ))
        
        return constraints[:count]
    
    def _select_context_constraints(self, context_type: str, count: int) -> List[str]:
        """选择应用场景约束"""
        if context_type not in self.context_constraints:
            context_type = "product_showcase"  # 默认场景
            
        constraints = []
        context_data = self.context_constraints[context_type]
        
        # 从不同约束类别中平均选择
        categories = list(context_data.keys())
        for category in categories:
            available = context_data[category]
            select_count = max(1, count // len(categories))
            constraints.extend(random.sample(available, min(select_count, len(available))))
        
        return constraints[:count]
    
    def apply_semantic_modifiers(self, constraints: List[str], cognitive_load: float) -> List[str]:
        """应用语义修饰词增强"""
        load_category = self._categorize_cognitive_load(cognitive_load)
        
        # 选择合适级别的修饰词
        if load_category == "low_load_2.7":
            modifier_level = "level_1_technical"
        elif load_category in ["medium_load_3.2", "medium_high_load_3.5"]:
            modifier_level = "level_2_professional"
        else:
            modifier_level = "level_3_creative"
        
        modifiers = self.semantic_modifiers[modifier_level]
        enhanced_constraints = []
        
        for constraint in constraints:
            # 随机选择修饰词类别
            modifier_category = random.choice(list(modifiers.keys()))
            modifier = random.choice(modifiers[modifier_category])
            
            # 增强约束表达
            enhanced_constraint = f"{constraint} with {modifier} attention to detail"
            enhanced_constraints.append(enhanced_constraint)
        
        return enhanced_constraints
    
    def build_comprehensive_prompt(self, constraint_profile: ConstraintProfile, 
                                 edit_description: str) -> str:
        """构建综合提示词（集成所有约束层）"""
        
        prompt_sections = []
        
        # 操作分析部分
        prompt_sections.append(f"""
## Task Analysis
User Request: {edit_description}
Complexity Level: {constraint_profile.total_complexity:.2f}
Constraint Density: {constraint_profile.constraint_density} requirements

## Operation-Specific Requirements
""")
        
        for i, constraint in enumerate(constraint_profile.operation_constraints, 1):
            prompt_sections.append(f"{i}. {constraint}")
        
        # 认知负荷适配部分
        prompt_sections.append(f"""

## Cognitive Processing Requirements
""")
        
        for i, constraint in enumerate(constraint_profile.cognitive_constraints, 1):
            prompt_sections.append(f"{i}. {constraint}")
        
        # 应用场景部分
        prompt_sections.append(f"""

## Context Application Standards  
""")
        
        for i, constraint in enumerate(constraint_profile.context_constraints, 1):
            prompt_sections.append(f"{i}. {constraint}")
        
        # 执行指令部分
        prompt_sections.append(f"""

## Execution Protocol
Generate a single comprehensive English editing instruction that integrates all above requirements.
Output format: [precise action] + [specific target] + [detailed result] + [quality markers]
Length: 30-60 words optimized for clarity and completeness.
""")
        
        return "".join(prompt_sections)

# 全局约束系统实例
enhanced_constraint_system = EnhancedConstraintSystem()