"""
创意重构引擎
基于Kontext数据集分析的创意重构系统
专门处理高认知负荷的创意编辑任务 (cognitive_load: 5.794)
Version: 1.0.0 - 基于1026样本分析
"""

import re
import json
from typing import Dict, List, Tuple, Optional, Set
from dataclasses import dataclass
from .guidance_templates import KONTEXT_EDITING_TYPES

@dataclass
class CreativeContext:
    """创意上下文信息"""
    source_concept: str      # 源概念：原始对象/场景
    target_concept: str      # 目标概念：想要转换成的概念
    metaphor_bridge: str     # 隐喻桥梁：连接源和目标的概念桥梁
    transformation_type: str # 转换类型：形态、概念、风格、场景
    creative_intensity: float # 创意强度：1-10
    narrative_context: str   # 叙事背景：故事情境

@dataclass
class MetaphorMapping:
    """隐喻映射结构"""
    source_domain: str       # 源域
    target_domain: str       # 目标域
    shared_properties: List[str] # 共同属性
    transformation_rules: List[str] # 转换规则

class CreativeReconstructionEngine:
    """创意重构引擎"""
    
    def __init__(self):
        self.creative_patterns = self._init_creative_patterns()
        self.metaphor_database = self._init_metaphor_database()
        self.narrative_templates = self._init_narrative_templates()
        self.cognitive_enhancers = self._init_cognitive_enhancers()
    
    def _init_creative_patterns(self) -> Dict[str, Dict]:
        """初始化创意模式库"""
        return {
            "scene_building": {
                "description": "场景构建类创意重构",
                "cognitive_load": 5.2,
                "patterns": [
                    "将{object}置于{fantastical_setting}中",
                    "创建{object}与{environment}的超现实融合",
                    "构建围绕{object}的{mood}氛围场景"
                ],
                "enhancement_keywords": [
                    "超现实主义", "梦幻场景", "时空穿越", "维度交错",
                    "史诗级", "电影级", "概念艺术", "未来主义"
                ]
            },
            "style_creation": {
                "description": "风格创造类创意重构", 
                "cognitive_load": 6.1,
                "patterns": [
                    "以{art_style}重新诠释{object}",
                    "融合{style1}和{style2}创造全新视觉语言",
                    "用{cultural_context}的美学重塑{object}"
                ],
                "enhancement_keywords": [
                    "艺术大师级", "独特美学", "视觉革命", "风格融合",
                    "文化符号", "时代特征", "艺术流派", "视觉诗学"
                ]
            },
            "conceptual_transformation": {
                "description": "概念转换类创意重构",
                "cognitive_load": 6.5,
                "patterns": [
                    "将{concrete_object}抽象化为{abstract_concept}",
                    "让{object}体现{philosophical_idea}的本质",
                    "通过{symbolic_language}重新定义{object}"
                ],
                "enhancement_keywords": [
                    "哲学思辨", "概念艺术", "象征主义", "隐喻表达",
                    "深层意义", "精神内核", "本质呈现", "思想可视化"
                ]
            }
        }
    
    def _init_metaphor_database(self) -> Dict[str, List[MetaphorMapping]]:
        """初始化隐喻映射数据库"""
        return {
            "natural_elements": [
                MetaphorMapping(
                    source_domain="动物",
                    target_domain="自然现象",
                    shared_properties=["力量", "流动性", "生命力"],
                    transformation_rules=[
                        "保持生物特征的识别性",
                        "融入自然元素的物理特性",
                        "创造视觉上的和谐统一"
                    ]
                ),
                MetaphorMapping(
                    source_domain="人造物",
                    target_domain="有机形态",
                    shared_properties=["结构", "功能", "美学"],
                    transformation_rules=[
                        "机械结构生物化",
                        "保持原始功能暗示",
                        "增加有机质感和纹理"
                    ]
                )
            ],
            "temporal_concepts": [
                MetaphorMapping(
                    source_domain="现代物体",
                    target_domain="古代文明",
                    shared_properties=["文明符号", "技术水平", "美学标准"],
                    transformation_rules=[
                        "现代功能古典化表达",
                        "融入历史文化元素",
                        "保持时代特色识别度"
                    ]
                )
            ],
            "dimensional_shifts": [
                MetaphorMapping(
                    source_domain="三维实体",
                    target_domain="能量形态",
                    shared_properties=["存在感", "视觉冲击", "空间占据"],
                    transformation_rules=[
                        "实体到能量的渐变过程",
                        "保持形态核心特征",
                        "增强神秘和超自然感"
                    ]
                )
            ]
        }
    
    def _init_narrative_templates(self) -> Dict[str, Dict]:
        """初始化叙事模板库"""
        return {
            "hero_journey": {
                "description": "英雄之旅叙事框架",
                "stages": [
                    "平凡世界中的{object}",
                    "{object}接受召唤进入未知领域", 
                    "{object}在{mystical_realm}中获得力量",
                    "{object}以全新形态回归，带来智慧"
                ],
                "visual_cues": ["光环效应", "能量散发", "威严姿态", "智慧眼神"]
            },
            "metamorphosis": {
                "description": "变形记叙事框架",
                "stages": [
                    "{object}的原始状态展示",
                    "变形过程的关键时刻",
                    "新形态的惊艳呈现",
                    "新旧形态的对比与和谐"
                ],
                "visual_cues": ["渐变过程", "能量流动", "形态融合", "时间痕迹"]
            },
            "genesis": {
                "description": "创世纪叙事框架",
                "stages": [
                    "混沌中孕育的{object}",
                    "{object}的诞生时刻",
                    "{object}创造其世界",
                    "{object}作为世界中心的确立"
                ],
                "visual_cues": ["宇宙能量", "创造光芒", "生命萌发", "秩序建立"]
            }
        }
    
    def _init_cognitive_enhancers(self) -> Dict[str, List[str]]:
        """初始化认知增强器"""
        return {
            "visual_complexity": [
                "多重视觉层次", "复合材质表现", "光影戏剧化",
                "细节丰富化", "质感对比", "色彩层次深化"
            ],
            "conceptual_depth": [
                "哲学内涵体现", "文化符号融入", "时空维度拓展",
                "情感共鸣增强", "象征意义深化", "精神层面表达"
            ],
            "technical_excellence": [
                "电影级渲染", "大师级构图", "专业级光影",
                "艺术级质感", "史诗级氛围", "概念级创新"
            ]
        }
    
    def analyze_creative_intent(self, description: str, operation_type: str = None) -> CreativeContext:
        """分析创意意图"""
        
        # 提取源概念和目标概念
        source_concept = self._extract_source_concept(description)
        target_concept = self._extract_target_concept(description)
        
        # 识别隐喻桥梁
        metaphor_bridge = self._identify_metaphor_bridge(source_concept, target_concept, description)
        
        # 确定转换类型
        transformation_type = self._determine_transformation_type(description, operation_type)
        
        # 计算创意强度
        creative_intensity = self._calculate_creative_intensity(description)
        
        # 提取叙事背景
        narrative_context = self._extract_narrative_context(description)
        
        return CreativeContext(
            source_concept=source_concept,
            target_concept=target_concept,
            metaphor_bridge=metaphor_bridge,
            transformation_type=transformation_type,
            creative_intensity=creative_intensity,
            narrative_context=narrative_context
        )
    
    def generate_creative_prompt(self, context: CreativeContext, style_requirements: List[str] = None) -> Dict[str, str]:
        """生成创意重构提示"""
        
        # 选择最适合的创意模式
        creative_pattern = self._select_creative_pattern(context)
        
        # 应用隐喻映射
        metaphor_mapping = self._apply_metaphor_mapping(context)
        
        # 构建叙事框架
        narrative_structure = self._build_narrative_structure(context)
        
        # 生成增强关键词
        enhancement_keywords = self._generate_enhancement_keywords(context, style_requirements)
        
        # 组装最终提示
        creative_prompt = self._assemble_creative_prompt(
            creative_pattern, metaphor_mapping, narrative_structure, enhancement_keywords
        )
        
        return {
            "main_prompt": creative_prompt["main"],
            "enhancement_prompt": creative_prompt["enhancement"],
            "technical_prompt": creative_prompt["technical"],
            "negative_prompt": creative_prompt["negative"],
            "complexity_score": context.creative_intensity,
            "cognitive_load": self._calculate_cognitive_load(context)
        }
    
    def _extract_source_concept(self, description: str) -> str:
        """提取源概念"""
        # 识别描述中的原始对象
        object_patterns = [
            r"将(.+?)变成", r"让(.+?)成为", r"把(.+?)转换",
            r"使(.+?)变为", r"(.+?)要成为", r"原本是(.+?)的"
        ]
        
        for pattern in object_patterns:
            match = re.search(pattern, description)
            if match:
                return match.group(1).strip()
        
        # 默认提取第一个名词作为源概念
        words = description.split()
        for word in words:
            if len(word) > 1 and not any(char in word for char in ['的', '是', '要', '将']):
                return word
        
        return "对象"
    
    def _extract_target_concept(self, description: str) -> str:
        """提取目标概念"""
        # 识别描述中的目标对象
        target_patterns = [
            r"变成(.+)", r"成为(.+)", r"转换成(.+)",
            r"变为(.+)", r"像(.+?)一样", r"具有(.+?)特征"
        ]
        
        for pattern in target_patterns:
            match = re.search(pattern, description)
            if match:
                return match.group(1).strip()
        
        return "新形态"
    
    def _identify_metaphor_bridge(self, source: str, target: str, description: str) -> str:
        """识别隐喻桥梁"""
        
        # 查找描述中的连接词
        bridge_keywords = [
            "像", "如同", "仿佛", "宛如", "好似", "犹如",
            "通过", "借助", "融合", "结合", "混合"
        ]
        
        for keyword in bridge_keywords:
            if keyword in description:
                # 提取桥梁概念
                parts = description.split(keyword)
                if len(parts) > 1:
                    bridge_context = parts[1][:50]  # 取后续50字符作为桥梁描述
                    return f"{keyword}{bridge_context}"
        
        # 基于源和目标概念推断隐喻桥梁
        metaphor_maps = self.metaphor_database
        for category, mappings in metaphor_maps.items():
            for mapping in mappings:
                if source in mapping.source_domain or target in mapping.target_domain:
                    return f"通过{mapping.shared_properties[0]}的共同特性"
        
        return "创意转换"
    
    def _determine_transformation_type(self, description: str, operation_type: str = None) -> str:
        """确定转换类型"""
        
        if operation_type in self.creative_patterns:
            return operation_type
        
        # 基于描述内容判断
        type_keywords = {
            "scene_building": ["场景", "环境", "世界", "空间", "背景", "氛围"],
            "style_creation": ["风格", "艺术", "画风", "美学", "流派", "样式"],
            "conceptual_transformation": ["概念", "思想", "哲学", "象征", "精神", "本质"]
        }
        
        for trans_type, keywords in type_keywords.items():
            if any(keyword in description for keyword in keywords):
                return trans_type
        
        return "scene_building"  # 默认场景构建
    
    def _calculate_creative_intensity(self, description: str) -> float:
        """计算创意强度 (1-10)"""
        
        intensity_indicators = {
            "extreme_words": ["完全", "彻底", "极其", "超级", "史诗", "传奇"] * 0.5,
            "fantasy_elements": ["魔法", "超自然", "神话", "传说", "奇幻", "梦幻"] * 0.8,
            "impossible_combinations": ["时空", "维度", "宇宙", "无限", "永恒"] * 1.0,
            "sensory_richness": ["绚烂", "璀璨", "震撼", "惊艳", "壮观"] * 0.6,
            "complexity_markers": ["复杂", "精细", "层次", "深度", "立体"] * 0.4
        }
        
        base_intensity = 5.0
        
        for category, keywords_weight in intensity_indicators.items():
            keywords = list(keywords_weight)[::2]  # 提取关键词
            weight = keywords_weight[0] if isinstance(keywords_weight, list) else 0.5
            
            matches = sum(1 for keyword in keywords if keyword in description)
            base_intensity += matches * weight
        
        return min(10.0, max(1.0, base_intensity))
    
    def _extract_narrative_context(self, description: str) -> str:
        """提取叙事背景"""
        
        narrative_markers = [
            "故事", "传说", "历史", "未来", "过去", "现在",
            "冒险", "旅程", "探索", "发现", "成长", "变化"
        ]
        
        context_parts = []
        for marker in narrative_markers:
            if marker in description:
                context_parts.append(marker)
        
        if context_parts:
            return f"{'/'.join(context_parts[:3])}叙事框架"
        else:
            return "开放式创意叙事"
    
    def _select_creative_pattern(self, context: CreativeContext) -> Dict:
        """选择创意模式"""
        return self.creative_patterns.get(context.transformation_type, 
                                        self.creative_patterns["scene_building"])
    
    def _apply_metaphor_mapping(self, context: CreativeContext) -> Dict:
        """应用隐喻映射"""
        
        # 根据源概念和目标概念查找最佳映射
        best_mapping = None
        max_relevance = 0
        
        for category, mappings in self.metaphor_database.items():
            for mapping in mappings:
                relevance = 0
                if context.source_concept in mapping.source_domain:
                    relevance += 2
                if context.target_concept in mapping.target_domain:
                    relevance += 2
                if any(prop in context.metaphor_bridge for prop in mapping.shared_properties):
                    relevance += 1
                
                if relevance > max_relevance:
                    max_relevance = relevance
                    best_mapping = mapping
        
        if best_mapping:
            return {
                "mapping": best_mapping,
                "transformation_guide": best_mapping.transformation_rules,
                "shared_properties": best_mapping.shared_properties
            }
        else:
            # 创建默认映射
            return {
                "mapping": None,
                "transformation_guide": ["保持核心特征", "融入新元素", "创造视觉和谐"],
                "shared_properties": ["形态", "功能", "美学"]
            }
    
    def _build_narrative_structure(self, context: CreativeContext) -> Dict:
        """构建叙事结构"""
        
        # 基于创意强度选择叙事模板
        if context.creative_intensity >= 8.0:
            template_name = "genesis"
        elif context.creative_intensity >= 6.0:
            template_name = "metamorphosis"
        else:
            template_name = "hero_journey"
        
        template = self.narrative_templates[template_name]
        
        return {
            "template": template_name,
            "stages": [stage.format(object=context.source_concept, 
                                  mystical_realm=context.target_concept) 
                      for stage in template["stages"]],
            "visual_cues": template["visual_cues"]
        }
    
    def _generate_enhancement_keywords(self, context: CreativeContext, style_requirements: List[str] = None) -> List[str]:
        """生成增强关键词"""
        
        keywords = []
        
        # 基于创意强度添加技术关键词
        if context.creative_intensity >= 7.0:
            keywords.extend(self.cognitive_enhancers["technical_excellence"][:3])
        
        # 基于转换类型添加特定关键词  
        pattern = self.creative_patterns[context.transformation_type]
        keywords.extend(pattern["enhancement_keywords"][:4])
        
        # 添加概念深度关键词
        keywords.extend(self.cognitive_enhancers["conceptual_depth"][:2])
        
        # 如果有风格要求，融入风格关键词
        if style_requirements:
            keywords.extend(style_requirements[:3])
        
        return list(set(keywords))  # 去重
    
    def _assemble_creative_prompt(self, pattern: Dict, mapping: Dict, narrative: Dict, keywords: List[str]) -> Dict[str, str]:
        """组装创意提示"""
        
        # 主提示：核心创意描述
        main_prompt_parts = [
            f"创意重构: {pattern['description']}",
            f"转换指导: {', '.join(mapping['transformation_guide'][:2])}",
            f"叙事框架: {narrative['template']}"
        ]
        main_prompt = ", ".join(main_prompt_parts)
        
        # 增强提示：视觉和技术增强
        enhancement_prompt_parts = [
            ", ".join(keywords[:6]),
            ", ".join(narrative['visual_cues'][:3]),
            "超高质量, 8K分辨率, 专业级渲染"
        ]
        enhancement_prompt = ", ".join(enhancement_prompt_parts)
        
        # 技术提示：技术规格
        technical_prompt = "masterpiece, ultra high quality, professional grade, cinematic lighting, detailed textures, perfect composition"
        
        # 负面提示：避免的元素
        negative_prompt = "low quality, blurry, amateur, simple, basic, ordinary, mundane, cliché, unimaginative"
        
        return {
            "main": main_prompt,
            "enhancement": enhancement_prompt,
            "technical": technical_prompt,
            "negative": negative_prompt
        }
    
    def _calculate_cognitive_load(self, context: CreativeContext) -> float:
        """计算认知负荷"""
        
        base_load = 5.794  # Kontext数据集中创意重构的平均认知负荷
        
        # 根据创意强度调整
        intensity_modifier = (context.creative_intensity - 5.0) * 0.2
        
        # 根据转换类型调整
        type_modifiers = {
            "scene_building": 0.0,
            "style_creation": 0.3, 
            "conceptual_transformation": 0.7
        }
        type_modifier = type_modifiers.get(context.transformation_type, 0.0)
        
        final_load = base_load + intensity_modifier + type_modifier
        return round(final_load, 2)

# 全局实例
creative_reconstruction_engine = CreativeReconstructionEngine()

def get_creative_engine() -> CreativeReconstructionEngine:
    """获取创意重构引擎实例"""
    return creative_reconstruction_engine

def analyze_creative_request(description: str, operation_type: str = None) -> Dict:
    """分析创意重构请求"""
    engine = get_creative_engine()
    context = engine.analyze_creative_intent(description, operation_type)
    return engine.generate_creative_prompt(context)

def get_creative_complexity(description: str) -> Dict[str, float]:
    """获取创意复杂度信息"""
    engine = get_creative_engine()
    context = engine.analyze_creative_intent(description)
    
    return {
        "creative_intensity": context.creative_intensity,
        "cognitive_load": engine._calculate_cognitive_load(context),
        "complexity_level": "高复杂度创意重构" if context.creative_intensity >= 7.0 else "中等复杂度创意重构"
    }