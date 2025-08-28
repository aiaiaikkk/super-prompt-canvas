"""
描述性创意指令处理器 - Descriptive Creative Instructions Handler
基于Kontext数据集发现的91次"无动词"创意指令模式 (8.9%的数据集)
业界首次系统化处理描述性创意指令的AI编辑模块
"""

from typing import Dict, List, Tuple, Optional, Set
import re
from dataclasses import dataclass
from enum import Enum
import nltk
from collections import Counter


class CreativeInstructionType(Enum):
    """描述性创意指令类型"""
    NARRATIVE_SCENE = "narrative_scene"           # 叙事场景描述 (60%)
    STYLE_TEMPORAL = "style_temporal"             # 风格时代描述 (25%) 
    SPATIAL_ARRANGEMENT = "spatial_arrangement"   # 空间布局描述 (10%)
    ARTISTIC_MEDIUM = "artistic_medium"           # 艺术媒介描述 (5%)


@dataclass
class CreativeInstructionPattern:
    """创意指令模式定义"""
    instruction_type: CreativeInstructionType
    frequency: float
    cognitive_load: float
    linguistic_features: List[str]
    examples: List[str]
    generation_template: str


class DescriptiveCreativeHandler:
    """描述性创意指令处理器"""
    
    def __init__(self):
        self.patterns = self._initialize_creative_patterns()
        self.temporal_markers = self._load_temporal_markers()
        self.spatial_markers = self._load_spatial_markers()
        self.artistic_mediums = self._load_artistic_mediums()
        self.narrative_structures = self._load_narrative_structures()
        
        # 初始化语言处理组件
        try:
            import nltk
            self.use_nltk = True
        except ImportError:
            self.use_nltk = False
    
    def _initialize_creative_patterns(self) -> Dict[str, CreativeInstructionPattern]:
        """初始化创意指令模式"""
        return {
            "narrative_scene": CreativeInstructionPattern(
                instruction_type=CreativeInstructionType.NARRATIVE_SCENE,
                frequency=5.4,  # 91次中的60% ≈ 5.4% of total dataset
                cognitive_load=6.2,  # 最高复杂度
                linguistic_features=[
                    "rich_adjective_usage",
                    "complex_noun_phrases", 
                    "prepositional_phrases",
                    "temporal_references",
                    "spatial_relationships"
                ],
                examples=[
                    "Victorian era painting of this cat on a throne",
                    "Image of street with dozen posters all over fence",
                    "This duck on bike in forest",
                    "Candid photo of wrecked pirate ship on beach"
                ],
                generation_template="""叙事场景创作大师: 将描述性文本转化为具有强烈叙事性的视觉场景。

创作核心原则:
- 深度理解描述中的时空背景和情感氛围
- 构建富有故事感和画面感的完整场景
- 平衡现实主义与艺术表现力
- 确保场景元素之间的逻辑关联和视觉协调

叙事场景构建要素:
- 时代背景: 准确把握历史时期的视觉特征和文化符号
- 空间环境: 创造立体可信的场景空间和环境氛围  
- 角色设定: 角色在场景中的合理性和戏剧性表现
- 情绪渲染: 通过光线、色彩、构图传达特定情感和氛围

技术实现标准:
- 电影级别的场景构建和光影处理
- 历史考据准确的服装、建筑、道具细节
- 自然真实的角色表情和身体语言
- 整体画面的戏剧张力和视觉冲击力

输出: 电影级叙事场景创建指令，实现描述文本的视觉化呈现。"""
            ),
            
            "style_temporal": CreativeInstructionPattern(
                instruction_type=CreativeInstructionType.STYLE_TEMPORAL,
                frequency=2.3,  # 91次中的25% ≈ 2.3% of total dataset
                cognitive_load=5.1,
                linguistic_features=[
                    "style_references",
                    "temporal_markers",
                    "artistic_movement_names",
                    "technique_descriptions"
                ],
                examples=[
                    "This image in style of Van Gogh's The Starry Night",
                    "Old Victorian era painting of this cat",
                    "Renaissance style portrait of this person",
                    "Art deco poster of this design"
                ],
                generation_template="""艺术风格时代专家: 精确重现特定历史时期和艺术风格的视觉特征。

风格重现原则:
- 深入研究目标时代的艺术特征和文化背景
- 准确应用特定艺术流派的技法和表现手段
- 保持风格的历史真实性和艺术完整性
- 将现代元素自然融入历史艺术语言

时代风格要素:
- 绘画技法: 笔触、色彩运用、明暗处理的时代特征
- 构图法则: 不同时期的构图习惯和视觉规律
- 色彩体系: 特定时代的色彩偏好和颜料使用特点
- 文化符号: 服装、建筑、装饰的历史特征

技术执行要求:
- 艺术史考据的准确性和深度
- 传统绘画技法的数字化精确还原
- 保持艺术风格的纯正性和辨识度
- 现代主题与古典技法的和谐统一

输出: 历史艺术风格精确复现指令，实现跨时代的艺术创作融合。"""
            ),
            
            "spatial_arrangement": CreativeInstructionPattern(
                instruction_type=CreativeInstructionType.SPATIAL_ARRANGEMENT,
                frequency=0.9,  # 91次中的10% ≈ 0.9% of total dataset
                cognitive_load=4.3,
                linguistic_features=[
                    "spatial_prepositions",
                    "directional_markers", 
                    "arrangement_descriptions",
                    "geometric_relationships"
                ],
                examples=[
                    "Mirror image symmetrical down the middle",
                    "Street with dozen posters all over fence",
                    "Object centered in frame with background elements",
                    "Arrangement of multiple elements in balanced composition"
                ],
                generation_template="""空间布局设计师: 精确控制画面元素的空间关系和视觉平衡。

空间设计原则:
- 运用经典构图法则创建视觉平衡和引导
- 精确计算元素间的比例关系和空间分布
- 利用透视和景深创造立体空间感
- 通过重复、对比、节奏营造视觉韵律

空间布局技法:
- 对称与非对称: 根据表达需要选择平衡方式
- 主次关系: 通过大小、位置、色彩建立视觉层次
- 引导线条: 利用线条和形状引导观众视线
- 留白运用: 通过空白空间强化主体表现力

技术实现细节:
- 精确的几何关系计算和空间定位
- 合理的透视关系和景深层次处理
- 优化的视觉重量分布和平衡点设置
- 和谐的色彩分布和明暗对比安排

输出: 专业级空间布局设计指令，实现精确的视觉构图和空间关系。"""
            ),
            
            "artistic_medium": CreativeInstructionPattern(
                instruction_type=CreativeInstructionType.ARTISTIC_MEDIUM,
                frequency=0.4,  # 91次中的5% ≈ 0.4% of total dataset
                cognitive_load=3.8,
                linguistic_features=[
                    "medium_specifications",
                    "technique_references",
                    "material_descriptions",
                    "process_implications"
                ],
                examples=[
                    "Charcoal sketch of this scene",
                    "Watercolor painting interpretation",
                    "Digital art rendering with specific technique",
                    "Oil painting with impasto technique"
                ],
                generation_template="""艺术媒介专家: 精确模拟不同艺术媒介的材质特性和表现技法。

媒介特性还原:
- 深入理解各种艺术媒介的物理特性和表现局限
- 准确再现不同材料的纹理质感和视觉效果  
- 掌握传统技法的数字化表现方法
- 保持媒介固有的艺术风格和表现力

媒介类型专精:
- 传统绘画: 油画、水彩、丙烯、素描、版画等
- 数字艺术: CG绘画、概念设计、数字插画等
- 雕塑立体: 石雕、木雕、金属、陶瓷等材质表现
- 综合媒介: 拼贴、混合媒介、实验性材料运用

技术实现要求:
- 材质纹理的真实感和触觉暗示
- 工具痕迹和制作过程的自然表现
- 媒介局限性的合理体现和艺术化处理  
- 传统工艺与现代表达的创新结合

输出: 专业级艺术媒介模拟指令，实现传统艺术技法的数字化精确重现。"""
            )
        }
    
    def _load_temporal_markers(self) -> Dict[str, List[str]]:
        """加载时代标记词汇"""
        return {
            "historical_periods": [
                "victorian", "renaissance", "medieval", "baroque", "art deco",
                "ancient", "classical", "gothic", "romantic", "modern"
            ],
            "time_indicators": [
                "era", "period", "age", "century", "time", "old", "vintage", 
                "antique", "historic", "traditional", "contemporary"
            ],
            "style_movements": [
                "impressionist", "expressionist", "cubist", "surrealist",
                "abstract", "realist", "minimalist", "pop art"
            ]
        }
    
    def _load_spatial_markers(self) -> Dict[str, List[str]]:
        """加载空间标记词汇"""
        return {
            "positioning": [
                "on", "in", "above", "below", "next to", "behind", "in front",
                "center", "middle", "edge", "corner", "side"
            ],
            "arrangement": [
                "symmetrical", "balanced", "scattered", "arranged", "organized",
                "clustered", "spread", "distributed", "aligned"
            ],
            "directional": [
                "left", "right", "up", "down", "north", "south", "east", "west",
                "clockwise", "counterclockwise", "diagonal", "vertical", "horizontal"
            ]
        }
    
    def _load_artistic_mediums(self) -> Dict[str, List[str]]:
        """加载艺术媒介词汇"""
        return {
            "traditional_painting": [
                "oil painting", "watercolor", "acrylic", "tempera", "fresco",
                "gouache", "casein", "encaustic"
            ],
            "drawing_media": [
                "pencil", "charcoal", "ink", "pastel", "conte", "graphite",
                "pen and ink", "marker", "colored pencil"
            ],
            "digital_media": [
                "digital art", "cg", "photoshop painting", "concept art",
                "matte painting", "digital illustration"
            ],
            "printmaking": [
                "etching", "lithograph", "woodcut", "screen print", "engraving",
                "linocut", "monotype"
            ]
        }
    
    def _load_narrative_structures(self) -> Dict[str, List[str]]:
        """加载叙事结构模式"""
        return {
            "character_focus": [
                "portrait of", "image of", "picture of", "photo of",
                "depicting", "showing", "featuring"
            ],
            "scene_setting": [
                "in a", "at the", "on a", "during", "while", "as",
                "scene of", "view of", "landscape of"
            ],
            "action_narrative": [
                "doing", "performing", "engaged in", "in the act of",
                "caught in", "captured while", "moment of"
            ],
            "atmospheric": [
                "mood of", "feeling of", "atmosphere of", "sense of",
                "evoking", "suggesting", "conveying"
            ]
        }
    
    def detect_creative_instruction_type(self, instruction: str) -> Optional[CreativeInstructionType]:
        """检测描述性创意指令类型"""
        instruction_lower = instruction.lower().strip()
        
        # 首先检查是否真的是描述性指令（无明确动词）
        if not self._is_descriptive_instruction(instruction_lower):
            return None
        
        # 检查叙事场景模式
        if self._has_narrative_elements(instruction_lower):
            return CreativeInstructionType.NARRATIVE_SCENE
        
        # 检查风格时代模式
        if self._has_style_temporal_elements(instruction_lower):
            return CreativeInstructionType.STYLE_TEMPORAL
        
        # 检查空间布局模式
        if self._has_spatial_arrangement_elements(instruction_lower):
            return CreativeInstructionType.SPATIAL_ARRANGEMENT
        
        # 检查艺术媒介模式
        if self._has_artistic_medium_elements(instruction_lower):
            return CreativeInstructionType.ARTISTIC_MEDIUM
        
        # 默认归类为叙事场景（最常见）
        return CreativeInstructionType.NARRATIVE_SCENE
    
    def _is_descriptive_instruction(self, instruction: str) -> bool:
        """判断是否为描述性指令"""
        # 检查是否以动词开头或包含明确的命令动词
        command_verbs = [
            "make", "create", "turn", "change", "add", "remove", "replace",
            "put", "place", "move", "rotate", "flip", "zoom", "crop"
        ]
        
        words = instruction.split()
        if not words:
            return False
        
        # 如果以命令动词开头，不是描述性指令
        if words[0] in command_verbs:
            return False
        
        # 如果包含"this [noun]"模式，很可能是描述性指令
        if re.search(r'\bthis\s+\w+', instruction):
            return True
        
        # 如果包含时代/风格描述词，很可能是描述性指令
        temporal_words = []
        for category in self.temporal_markers.values():
            temporal_words.extend(category)
        
        if any(word in instruction for word in temporal_words):
            return True
        
        # 如果包含"image of", "picture of"等模式
        descriptive_patterns = ["image of", "picture of", "photo of", "painting of", "drawing of"]
        if any(pattern in instruction for pattern in descriptive_patterns):
            return True
        
        return False
    
    def _has_narrative_elements(self, instruction: str) -> bool:
        """检查是否包含叙事元素"""
        # 检查角色、场景、动作的复杂组合
        narrative_indicators = 0
        
        # 角色指示
        if any(word in instruction for word in ["cat", "dog", "man", "woman", "person", "character"]):
            narrative_indicators += 1
        
        # 场景指示  
        if any(word in instruction for word in ["throne", "street", "forest", "beach", "park", "room"]):
            narrative_indicators += 1
        
        # 复杂描述（超过5个词）
        if len(instruction.split()) > 5:
            narrative_indicators += 1
        
        # 介词短语（表示复杂空间关系）
        prepositions = ["on", "in", "at", "with", "of", "above", "below", "next to"]
        if sum(1 for prep in prepositions if prep in instruction) >= 2:
            narrative_indicators += 1
        
        return narrative_indicators >= 2
    
    def _has_style_temporal_elements(self, instruction: str) -> bool:
        """检查是否包含风格时代元素"""
        temporal_words = []
        for category in self.temporal_markers.values():
            temporal_words.extend(category)
        
        return any(word in instruction for word in temporal_words)
    
    def _has_spatial_arrangement_elements(self, instruction: str) -> bool:
        """检查是否包含空间布局元素"""
        spatial_words = []
        for category in self.spatial_markers.values():
            spatial_words.extend(category)
        
        spatial_count = sum(1 for word in spatial_words if word in instruction)
        return spatial_count >= 2 or "mirror" in instruction or "symmetrical" in instruction
    
    def _has_artistic_medium_elements(self, instruction: str) -> bool:
        """检查是否包含艺术媒介元素"""
        medium_words = []
        for category in self.artistic_mediums.values():
            medium_words.extend(category)
        
        return any(medium in instruction for medium in medium_words)
    
    def generate_creative_prompt(self, instruction: str, 
                               creative_type: CreativeInstructionType) -> str:
        """生成创意指令提示"""
        pattern = self.patterns.get(creative_type.value)
        if not pattern:
            return instruction
        
        # 分析指令的具体内容
        content_analysis = self._analyze_creative_content(instruction, creative_type)
        
        # 生成增强的执行指令
        enhanced_instruction = self._generate_enhanced_instruction(
            instruction, creative_type, content_analysis
        )
        
        return f"""{pattern.generation_template}

具体创作任务: {enhanced_instruction}

原始描述: "{instruction}"
创意类型: {creative_type.value}
认知负荷: {pattern.cognitive_load}
预期频率: {pattern.frequency}%

内容分析: {content_analysis}

执行要求: 充分发挥描述性文本的视觉化潜力，创造具有强烈艺术感染力和技术完成度的作品。"""
    
    def _analyze_creative_content(self, instruction: str, 
                                creative_type: CreativeInstructionType) -> str:
        """分析创意内容"""
        analysis_parts = []
        
        if creative_type == CreativeInstructionType.NARRATIVE_SCENE:
            # 分析叙事元素
            characters = self._extract_characters(instruction)
            settings = self._extract_settings(instruction)
            atmosphere = self._extract_atmosphere(instruction)
            
            if characters:
                analysis_parts.append(f"主角: {', '.join(characters)}")
            if settings:
                analysis_parts.append(f"场景: {', '.join(settings)}")
            if atmosphere:
                analysis_parts.append(f"氛围: {', '.join(atmosphere)}")
        
        elif creative_type == CreativeInstructionType.STYLE_TEMPORAL:
            # 分析风格时代
            style_refs = self._extract_style_references(instruction)
            time_period = self._extract_time_period(instruction)
            
            if style_refs:
                analysis_parts.append(f"风格参考: {', '.join(style_refs)}")
            if time_period:
                analysis_parts.append(f"时代: {time_period}")
        
        return "; ".join(analysis_parts) if analysis_parts else "标准创意描述处理"
    
    def _extract_characters(self, instruction: str) -> List[str]:
        """提取角色信息"""
        characters = []
        character_words = ["cat", "dog", "man", "woman", "person", "character", "figure"]
        for word in character_words:
            if word in instruction.lower():
                characters.append(word)
        return characters
    
    def _extract_settings(self, instruction: str) -> List[str]:
        """提取场景信息"""
        settings = []
        setting_words = [
            "throne", "street", "forest", "beach", "park", "room", "garden",
            "kitchen", "office", "cafe", "restaurant", "church", "castle"
        ]
        for word in setting_words:
            if word in instruction.lower():
                settings.append(word)
        return settings
    
    def _extract_atmosphere(self, instruction: str) -> List[str]:
        """提取氛围信息"""
        atmosphere = []
        atmosphere_words = [
            "dark", "bright", "moody", "cheerful", "mysterious", "romantic",
            "dramatic", "peaceful", "energetic", "melancholy"
        ]
        for word in atmosphere_words:
            if word in instruction.lower():
                atmosphere.append(word)
        return atmosphere
    
    def _extract_style_references(self, instruction: str) -> List[str]:
        """提取风格参考"""
        styles = []
        style_patterns = [
            r"style of ([^,]+)",
            r"in.*style",
            r"([a-zA-Z]+) era",
            r"([a-zA-Z]+) period"
        ]
        
        for pattern in style_patterns:
            matches = re.findall(pattern, instruction, re.IGNORECASE)
            styles.extend(matches)
        
        return styles
    
    def _extract_time_period(self, instruction: str) -> Optional[str]:
        """提取时代信息"""
        temporal_words = []
        for category in self.temporal_markers.values():
            temporal_words.extend(category)
        
        for word in temporal_words:
            if word in instruction.lower():
                return word
        
        return None
    
    def _generate_enhanced_instruction(self, instruction: str, 
                                     creative_type: CreativeInstructionType,
                                     content_analysis: str) -> str:
        """生成增强指令"""
        base_enhancement = f"Create a professional-quality visual interpretation of: {instruction}"
        
        type_specific_enhancements = {
            CreativeInstructionType.NARRATIVE_SCENE: 
                "Focus on cinematic storytelling, rich environmental details, and emotional resonance.",
            CreativeInstructionType.STYLE_TEMPORAL:
                "Ensure historical accuracy and authentic period style characteristics.",
            CreativeInstructionType.SPATIAL_ARRANGEMENT:
                "Emphasize precise compositional balance and spatial relationships.",
            CreativeInstructionType.ARTISTIC_MEDIUM:
                "Accurately simulate the specified medium's material properties and techniques."
        }
        
        specific_enhancement = type_specific_enhancements.get(
            creative_type, 
            "Apply standard creative interpretation principles."
        )
        
        return f"{base_enhancement} {specific_enhancement}"
    
    def get_handler_statistics(self) -> Dict:
        """获取处理器统计信息"""
        total_frequency = sum(pattern.frequency for pattern in self.patterns.values())
        
        return {
            "total_coverage": f"{total_frequency}%",
            "pattern_types": len(self.patterns),
            "average_cognitive_load": sum(
                pattern.cognitive_load for pattern in self.patterns.values()
            ) / len(self.patterns),
            "linguistic_features_count": sum(
                len(pattern.linguistic_features) for pattern in self.patterns.values()
            ),
            "examples_count": sum(
                len(pattern.examples) for pattern in self.patterns.values()
            )
        }


# 使用示例和测试
if __name__ == "__main__":
    handler = DescriptiveCreativeHandler()
    
    # 测试用例
    test_instructions = [
        "Victorian era painting of this cat on a throne",
        "This duck on a bike in a forest", 
        "Mirror the image so its symmetrical down the middle",
        "Charcoal sketch of this scene",
        "Image of a street with a dozen posters all over a fence"
    ]
    
    for instruction in test_instructions:
        creative_type = handler.detect_creative_instruction_type(instruction)
        if creative_type:
            prompt = handler.generate_creative_prompt(instruction, creative_type)
            print(f"\n指令: {instruction}")
            print(f"类型: {creative_type.value}")
            print(f"生成提示: {prompt[:300]}...")
        else:
            print(f"\n指令: {instruction} - 非描述性创意指令")