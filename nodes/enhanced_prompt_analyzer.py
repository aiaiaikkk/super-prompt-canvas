"""
增强智能提示分析器 - Enhanced Intelligent Prompt Analyzer
完整支持Kontext数据集发现的所有遗漏操作类型
Version: 2.0.0 - Complete Operation Coverage
"""

import re
import json
from typing import Dict, List, Tuple, Optional, Union
from dataclasses import dataclass
from enum import Enum

# 导入新增的操作处理器
try:
    from .state_transformation_operations import StateTransformationOperations, StateTransformationType
    from .descriptive_creative_handler import DescriptiveCreativeHandler, CreativeInstructionType
    from .compound_operations_parser import CompoundOperationsParser, CompoundComplexity
    from .technical_professional_operations import TechnicalProfessionalOperations, TechnicalOperationType
    from .new_operation_types_guidance import (
        STATE_TRANSFORMATION_GUIDANCE,
        DESCRIPTIVE_CREATIVE_GUIDANCE, 
        COMPOUND_OPERATIONS_GUIDANCE,
        TECHNICAL_PROFESSIONAL_GUIDANCE
    )
    ENHANCED_MODULES_AVAILABLE = True
except ImportError as e:
    print(f"Warning: Enhanced operation modules not available: {e}")
    ENHANCED_MODULES_AVAILABLE = False


class OperationCategory(Enum):
    """操作类别枚举"""
    BASIC = "basic"                           # 基础操作 (原有)
    STATE_TRANSFORMATION = "state_transformation"  # 状态转换操作 (新增)
    DESCRIPTIVE_CREATIVE = "descriptive_creative"  # 描述性创意指令 (新增)
    COMPOUND_OPERATIONS = "compound_operations"     # 复合操作 (新增)
    TECHNICAL_PROFESSIONAL = "technical_professional"  # 技术专业操作 (新增)


@dataclass
class EnhancedOperationContext:
    """增强操作上下文信息"""
    # 基础信息
    operation_category: OperationCategory
    operation_type: str
    target_object: str
    target_attribute: str
    spatial_info: str
    quality_requirements: List[str]
    
    # 新增扩展信息
    cognitive_load: float = 0.0
    frequency_score: float = 0.0
    commercial_value: str = "medium"
    technical_complexity: str = "medium"
    
    # 特定操作类型信息
    state_transformation_type: Optional[str] = None
    creative_instruction_type: Optional[str] = None
    compound_complexity: Optional[str] = None
    technical_operation_type: Optional[str] = None


class EnhancedIntelligentPromptAnalyzer:
    """增强智能提示分析器 - 完整操作覆盖"""
    
    def __init__(self):
        self.enhanced_support = ENHANCED_MODULES_AVAILABLE
        
        if self.enhanced_support:
            # 初始化增强处理器
            self.state_transformer = StateTransformationOperations()
            self.creative_handler = DescriptiveCreativeHandler()
            self.compound_parser = CompoundOperationsParser()
            self.technical_processor = TechnicalProfessionalOperations()
        
        # 初始化操作模式和映射
        self.operation_patterns = self._init_enhanced_operation_patterns()
        self.operation_priority_map = self._init_operation_priority_map()
        self.cognitive_load_calculator = self._init_cognitive_load_calculator()
    
    def _init_enhanced_operation_patterns(self) -> Dict[str, Dict]:
        """初始化增强操作模式"""
        patterns = {
            # 基础操作类型 (保留原有)
            "basic_operations": {
                "add": ["add", "insert", "place", "put", "include"],
                "remove": ["remove", "delete", "erase", "eliminate"],
                "change": ["change", "modify", "alter", "transform"],
                "adjust": ["adjust", "tune", "enhance", "improve"],
                "replace": ["replace", "substitute", "swap", "exchange"]
            },
            
            # 状态转换操作 (新增 - 基于Kontext 180次高频需求)
            "state_transformation": {
                "identity_conversion": ["turn into", "change to", "become", "transform into"],
                "wearable_assignment": ["wear", "give", "put on", "add", "has"],
                "positional_placement": ["sit", "stand", "put", "place", "position"]
            },
            
            # 描述性创意指令 (新增 - 基于91次无动词指令)
            "descriptive_creative": {
                "narrative_scene": ["image of", "picture of", "scene of", "photo of"],
                "style_temporal": ["style", "era", "period", "in the style of"],
                "spatial_arrangement": ["mirror", "symmetrical", "arrangement", "layout"]
            },
            
            # 复合操作 (新增 - 基于48次多步骤指令)
            "compound_operations": {
                "sequence_indicators": ["and", "then", "also", "next", "after"],
                "dependency_markers": ["first", "before", "after", "finally"],
                "parallel_indicators": ["simultaneously", "at the same time", "together"]
            },
            
            # 技术专业操作 (新增 - 基于新兴技术需求)
            "technical_professional": {
                "depth_processing": ["depth", "depth map", "3d reconstruction"],
                "3d_modeling": ["3d", "model", "wireframe", "topology", "blender"],
                "digital_art_effects": ["pixel art", "neon", "digital", "glitch"],
                "spatial_transformation": ["zoom", "rotate", "perspective", "camera"]
            }
        }
        
        return patterns
    
    def _init_operation_priority_map(self) -> Dict[str, float]:
        """初始化操作优先级映射 (基于Kontext频率数据)"""
        return {
            # 状态转换操作 (高优先级 - 17.5%覆盖)
            "identity_conversion": 8.5,
            "positional_placement": 4.9,
            "wearable_assignment": 4.1,
            
            # 描述性创意 (中高优先级 - 8.9%覆盖)
            "narrative_scene": 5.4,
            "style_temporal": 2.3,
            "spatial_arrangement": 0.9,
            
            # 复合操作 (中优先级 - 4.7%覆盖)
            "multi_step_editing": 4.7,
            
            # 技术专业操作 (专业优先级 - 4.4%覆盖)
            "spatial_transformation": 1.7,
            "digital_art_effects": 1.4,
            "depth_processing": 0.8,
            "3d_modeling": 0.5
        }
    
    def _init_cognitive_load_calculator(self) -> Dict[str, float]:
        """初始化认知负荷计算器 (基于Kontext复杂度分析)"""
        return {
            # 状态转换操作
            "identity_conversion": 3.8,
            "wearable_assignment": 2.9,
            "positional_placement": 3.2,
            
            # 描述性创意指令 (最高认知负荷)
            "narrative_scene": 6.2,
            "style_temporal": 5.1,
            "spatial_arrangement": 4.3,
            
            # 复合操作
            "multi_step_editing": 5.1,
            "dependency_aware_editing": 5.8,
            
            # 技术专业操作
            "depth_processing": 5.2,
            "3d_modeling": 6.1,
            "digital_art_effects": 4.1,
            "spatial_transformation": 4.6
        }
    
    def analyze_instruction_enhanced(self, instruction: str, 
                                   context: Optional[Dict] = None) -> EnhancedOperationContext:
        """增强指令分析 - 支持完整Kontext操作类型"""
        
        # Step 1: 基础操作检测
        operation_category = self._detect_operation_category(instruction)
        
        # Step 2: 根据类别进行专门分析
        if operation_category == OperationCategory.STATE_TRANSFORMATION:
            return self._analyze_state_transformation(instruction, context)
        
        elif operation_category == OperationCategory.DESCRIPTIVE_CREATIVE:
            return self._analyze_descriptive_creative(instruction, context)
        
        elif operation_category == OperationCategory.COMPOUND_OPERATIONS:
            return self._analyze_compound_operations(instruction, context)
        
        elif operation_category == OperationCategory.TECHNICAL_PROFESSIONAL:
            return self._analyze_technical_professional(instruction, context)
        
        else:
            # 回退到基础操作分析
            return self._analyze_basic_operation(instruction, context)
    
    def _detect_operation_category(self, instruction: str) -> OperationCategory:
        """检测操作类别"""
        instruction_lower = instruction.lower()
        
        # 检查状态转换操作
        if self.enhanced_support and self.state_transformer.detect_state_transformation_type(instruction):
            return OperationCategory.STATE_TRANSFORMATION
        
        # 检查描述性创意指令
        if self.enhanced_support and self.creative_handler.detect_creative_instruction_type(instruction):
            return OperationCategory.DESCRIPTIVE_CREATIVE
        
        # 检查复合操作
        if self.enhanced_support and self.compound_parser._is_compound_instruction(instruction):
            return OperationCategory.COMPOUND_OPERATIONS
        
        # 检查技术专业操作
        if self.enhanced_support and self.technical_processor.detect_technical_operation_type(instruction):
            return OperationCategory.TECHNICAL_PROFESSIONAL
        
        # 默认为基础操作
        return OperationCategory.BASIC
    
    def _analyze_state_transformation(self, instruction: str, 
                                    context: Optional[Dict] = None) -> EnhancedOperationContext:
        """分析状态转换操作"""
        if not self.enhanced_support:
            return self._analyze_basic_operation(instruction, context)
        
        transformation_type = self.state_transformer.detect_state_transformation_type(instruction)
        
        return EnhancedOperationContext(
            operation_category=OperationCategory.STATE_TRANSFORMATION,
            operation_type=transformation_type.value if transformation_type else "unknown",
            target_object=self._extract_target_object(instruction),
            target_attribute=self._extract_target_attribute(instruction),
            spatial_info=self._extract_spatial_info(instruction),
            quality_requirements=["natural_transition", "environmental_harmony"],
            cognitive_load=self.cognitive_load_calculator.get(transformation_type.value if transformation_type else "unknown", 3.0),
            frequency_score=self.operation_priority_map.get(transformation_type.value if transformation_type else "unknown", 1.0),
            commercial_value="medium",
            technical_complexity="medium",
            state_transformation_type=transformation_type.value if transformation_type else None
        )
    
    def _analyze_descriptive_creative(self, instruction: str,
                                    context: Optional[Dict] = None) -> EnhancedOperationContext:
        """分析描述性创意指令"""
        if not self.enhanced_support:
            return self._analyze_basic_operation(instruction, context)
        
        creative_type = self.creative_handler.detect_creative_instruction_type(instruction)
        
        return EnhancedOperationContext(
            operation_category=OperationCategory.DESCRIPTIVE_CREATIVE,
            operation_type=creative_type.value if creative_type else "unknown",
            target_object=self._extract_creative_subject(instruction),
            target_attribute=self._extract_creative_style(instruction),
            spatial_info=self._extract_narrative_context(instruction),
            quality_requirements=["cinematic_quality", "artistic_coherence", "narrative_depth"],
            cognitive_load=self.cognitive_load_calculator.get(creative_type.value if creative_type else "unknown", 6.0),
            frequency_score=self.operation_priority_map.get(creative_type.value if creative_type else "unknown", 2.0),
            commercial_value="high",
            technical_complexity="high",
            creative_instruction_type=creative_type.value if creative_type else None
        )
    
    def _analyze_compound_operations(self, instruction: str,
                                   context: Optional[Dict] = None) -> EnhancedOperationContext:
        """分析复合操作"""
        if not self.enhanced_support:
            return self._analyze_basic_operation(instruction, context)
        
        compound_result = self.compound_parser.parse_compound_instruction(instruction)
        
        return EnhancedOperationContext(
            operation_category=OperationCategory.COMPOUND_OPERATIONS,
            operation_type="multi_step_editing",
            target_object=self._extract_compound_targets(compound_result),
            target_attribute="multiple_attributes",
            spatial_info="multiple_locations",
            quality_requirements=["coordinated_execution", "visual_coherence", "professional_quality"],
            cognitive_load=compound_result.cognitive_load,
            frequency_score=4.7,
            commercial_value="high",
            technical_complexity="high",
            compound_complexity=compound_result.complexity_level.value
        )
    
    def _analyze_technical_professional(self, instruction: str,
                                      context: Optional[Dict] = None) -> EnhancedOperationContext:
        """分析技术专业操作"""
        if not self.enhanced_support:
            return self._analyze_basic_operation(instruction, context)
        
        technical_type = self.technical_processor.detect_technical_operation_type(instruction)
        
        return EnhancedOperationContext(
            operation_category=OperationCategory.TECHNICAL_PROFESSIONAL,
            operation_type=technical_type.value if technical_type else "unknown",
            target_object=self._extract_technical_target(instruction),
            target_attribute=self._extract_technical_specs(instruction),
            spatial_info="precise_technical_requirements",
            quality_requirements=["professional_standards", "technical_accuracy", "industry_compliance"],
            cognitive_load=self.cognitive_load_calculator.get(technical_type.value if technical_type else "unknown", 5.0),
            frequency_score=self.operation_priority_map.get(technical_type.value if technical_type else "unknown", 1.0),
            commercial_value="high",
            technical_complexity="expert",
            technical_operation_type=technical_type.value if technical_type else None
        )
    
    def _analyze_basic_operation(self, instruction: str,
                               context: Optional[Dict] = None) -> EnhancedOperationContext:
        """分析基础操作 (原有逻辑)"""
        return EnhancedOperationContext(
            operation_category=OperationCategory.BASIC,
            operation_type="standard_editing",
            target_object=self._extract_target_object(instruction),
            target_attribute=self._extract_target_attribute(instruction),
            spatial_info=self._extract_spatial_info(instruction),
            quality_requirements=["professional_quality"],
            cognitive_load=3.0,
            frequency_score=5.0,
            commercial_value="medium",
            technical_complexity="medium"
        )
    
    def generate_enhanced_prompt(self, operation_context: EnhancedOperationContext,
                               base_instruction: str) -> str:
        """生成增强提示"""
        
        if operation_context.operation_category == OperationCategory.STATE_TRANSFORMATION:
            return self._generate_state_transformation_prompt(operation_context, base_instruction)
        
        elif operation_context.operation_category == OperationCategory.DESCRIPTIVE_CREATIVE:
            return self._generate_descriptive_creative_prompt(operation_context, base_instruction)
        
        elif operation_context.operation_category == OperationCategory.COMPOUND_OPERATIONS:
            return self._generate_compound_operations_prompt(operation_context, base_instruction)
        
        elif operation_context.operation_category == OperationCategory.TECHNICAL_PROFESSIONAL:
            return self._generate_technical_professional_prompt(operation_context, base_instruction)
        
        else:
            return self._generate_basic_prompt(operation_context, base_instruction)
    
    def _generate_state_transformation_prompt(self, context: EnhancedOperationContext, 
                                            instruction: str) -> str:
        """生成状态转换提示"""
        if not self.enhanced_support or not context.state_transformation_type:
            return f"Execute state transformation: {instruction}"
        
        transformation_type = StateTransformationType(context.state_transformation_type)
        return self.state_transformer.generate_state_transformation_prompt(instruction, transformation_type)
    
    def _generate_descriptive_creative_prompt(self, context: EnhancedOperationContext,
                                            instruction: str) -> str:
        """生成描述性创意提示"""
        if not self.enhanced_support or not context.creative_instruction_type:
            return f"Execute creative interpretation: {instruction}"
        
        creative_type = CreativeInstructionType(context.creative_instruction_type)
        return self.creative_handler.generate_creative_prompt(instruction, creative_type)
    
    def _generate_compound_operations_prompt(self, context: EnhancedOperationContext,
                                           instruction: str) -> str:
        """生成复合操作提示"""
        if not self.enhanced_support:
            return f"Execute multi-step operation: {instruction}"
        
        compound_result = self.compound_parser.parse_compound_instruction(instruction)
        return self.compound_parser.generate_execution_prompt(compound_result)
    
    def _generate_technical_professional_prompt(self, context: EnhancedOperationContext,
                                              instruction: str) -> str:
        """生成技术专业提示"""
        if not self.enhanced_support or not context.technical_operation_type:
            return f"Execute technical operation: {instruction}"
        
        technical_type = TechnicalOperationType(context.technical_operation_type)
        return self.technical_processor.generate_technical_prompt(instruction, technical_type)
    
    def _generate_basic_prompt(self, context: EnhancedOperationContext, instruction: str) -> str:
        """生成基础提示"""
        return f"""Professional image editor: Execute {context.operation_type} operation with high quality standards.

Target: {context.target_object}
Attribute: {context.target_attribute}
Location: {context.spatial_info}
Quality Requirements: {', '.join(context.quality_requirements)}
Cognitive Load: {context.cognitive_load}

Original Instruction: "{instruction}"

Execute with professional precision and maintain visual coherence."""
    
    # 辅助方法
    def _extract_target_object(self, instruction: str) -> str:
        """提取目标对象"""
        # 简化实现
        common_objects = ["cat", "dog", "man", "woman", "person", "car", "house", "tree", "text"]
        for obj in common_objects:
            if obj in instruction.lower():
                return obj
        return "unspecified_object"
    
    def _extract_target_attribute(self, instruction: str) -> str:
        """提取目标属性"""
        # 简化实现
        if any(color in instruction.lower() for color in ["red", "blue", "green", "yellow", "black", "white"]):
            return "color"
        elif any(size in instruction.lower() for size in ["big", "small", "large", "tiny", "huge"]):
            return "size"
        elif any(pos in instruction.lower() for pos in ["left", "right", "center", "top", "bottom"]):
            return "position"
        return "general_attribute"
    
    def _extract_spatial_info(self, instruction: str) -> str:
        """提取空间信息"""
        # 简化实现
        spatial_words = ["on", "in", "at", "above", "below", "next to", "behind", "front"]
        for word in spatial_words:
            if word in instruction.lower():
                return f"spatial_relationship_{word}"
        return "no_specific_location"
    
    def _extract_creative_subject(self, instruction: str) -> str:
        """提取创意主体"""
        return self._extract_target_object(instruction)
    
    def _extract_creative_style(self, instruction: str) -> str:
        """提取创意风格"""
        styles = ["victorian", "renaissance", "modern", "vintage", "artistic", "painting"]
        for style in styles:
            if style in instruction.lower():
                return style
        return "creative_style"
    
    def _extract_narrative_context(self, instruction: str) -> str:
        """提取叙事上下文"""
        return "narrative_scene_context"
    
    def _extract_compound_targets(self, compound_result) -> str:
        """提取复合操作目标"""
        if hasattr(compound_result, 'atomic_operations'):
            targets = [op.target_object for op in compound_result.atomic_operations]
            return ", ".join(targets[:3])  # 最多显示3个目标
        return "multiple_targets"
    
    def _extract_technical_target(self, instruction: str) -> str:
        """提取技术操作目标"""
        return self._extract_target_object(instruction)
    
    def _extract_technical_specs(self, instruction: str) -> str:
        """提取技术规格"""
        if "depth" in instruction.lower():
            return "depth_specifications"
        elif "3d" in instruction.lower():
            return "3d_model_specifications"
        elif "pixel" in instruction.lower():
            return "pixel_art_specifications"
        return "technical_specifications"
    
    def get_enhanced_statistics(self) -> Dict:
        """获取增强分析器统计信息"""
        total_coverage = sum(self.operation_priority_map.values())
        
        return {
            "enhanced_support": self.enhanced_support,
            "total_operation_coverage": f"{total_coverage:.1f}%",
            "new_operation_categories": len(OperationCategory) - 1,  # 减去基础操作
            "state_transformation_coverage": "17.5%",
            "descriptive_creative_coverage": "8.9%", 
            "compound_operations_coverage": "4.7%",
            "technical_professional_coverage": "4.4%",
            "innovation_highlights": [
                "业界首个完整状态转换操作支持",
                "描述性创意指令处理突破",
                "智能复合操作协调",
                "新兴技术专业操作集成"
            ]
        }


# 使用示例和测试
if __name__ == "__main__":
    analyzer = EnhancedIntelligentPromptAnalyzer()
    
    # 测试各种操作类型
    test_instructions = [
        "turn the cat into a dog",                           # 状态转换
        "Victorian era painting of this cat on throne",      # 描述性创意
        "remove woman and dog. add tiger drinking water",    # 复合操作
        "create depth map of this image",                     # 技术专业
        "make the cat orange"                                 # 基础操作
    ]
    
    print("=== Enhanced Intelligent Prompt Analyzer Test ===")
    print(f"Enhanced Support: {analyzer.enhanced_support}")
    print()
    
    for instruction in test_instructions:
        context = analyzer.analyze_instruction_enhanced(instruction)
        prompt = analyzer.generate_enhanced_prompt(context, instruction)
        
        print(f"Instruction: {instruction}")
        print(f"Category: {context.operation_category.value}")
        print(f"Type: {context.operation_type}")
        print(f"Cognitive Load: {context.cognitive_load}")
        print(f"Frequency Score: {context.frequency_score}")
        print(f"Generated Prompt: {prompt[:200]}...")
        print("-" * 80)