"""
智能约束生成器
基于1026数据集分析的智能约束选择和生成算法
集成认知负荷自适应机制和语义修饰词优化
Version: 1.0.0 - 数据驱动优化版
"""

import re
import json
import random
import hashlib
from typing import Dict, List, Tuple, Optional, Set
from dataclasses import dataclass, asdict
from .enhanced_constraint_system import enhanced_constraint_system, ConstraintProfile
from .intelligent_prompt_analyzer import IntelligentPromptAnalyzer
from .guidance_templates import KONTEXT_EDITING_TYPES

@dataclass
class GenerationContext:
    """生成上下文信息"""
    edit_description: str
    operation_type: str
    cognitive_load: float
    context_type: str
    user_preferences: Dict
    quality_level: str

@dataclass 
class OptimizedPromptOutput:
    """优化后的提示词输出"""
    final_prompt: str
    constraint_profile: ConstraintProfile
    generation_context: GenerationContext
    optimization_metrics: Dict
    execution_confidence: float

class IntelligentConstraintGenerator:
    """智能约束生成器 - 核心优化引擎"""
    
    def __init__(self):
        self.constraint_system = enhanced_constraint_system
        self.prompt_analyzer = IntelligentPromptAnalyzer()
        self.context_mapping = self._init_context_mapping()
        self.optimization_cache = {}
        
    def _init_context_mapping(self) -> Dict[str, str]:
        """初始化上下文映射（基于1026数据集应用场景分析）"""
        return {
            # 电商场景映射
            "product": "product_showcase",
            "ecommerce": "product_showcase", 
            "catalog": "product_showcase",
            "商品": "product_showcase",
            "产品": "product_showcase",
            
            # 营销场景映射
            "marketing": "marketing_communication",
            "campaign": "marketing_communication",
            "advertising": "marketing_communication", 
            "营销": "marketing_communication",
            "广告": "marketing_communication",
            
            # 创意场景映射
            "creative": "creative_expression",
            "artistic": "creative_expression",
            "art": "creative_expression",
            "创意": "creative_expression", 
            "艺术": "creative_expression"
        }
    
    def generate_optimized_prompt(self, edit_description: str, 
                                editing_intent: str = "general_editing",
                                processing_style: str = "auto_smart",
                                quality_level: str = "professional",
                                user_preferences: Dict = None) -> OptimizedPromptOutput:
        """生成优化提示词（主要接口）"""
        
        # 第一步：智能分析编辑上下文
        generation_context = self._analyze_edit_context(
            edit_description, editing_intent, processing_style, 
            quality_level, user_preferences or {}
        )
        
        # 第二步：生成约束配置文件
        constraint_profile = self._generate_constraint_profile(generation_context)
        
        # 第三步：优化约束表达
        optimized_profile = self._optimize_constraint_expression(
            constraint_profile, generation_context
        )
        
        # 第四步：构建最终提示词
        final_prompt = self._build_final_prompt(optimized_profile, generation_context)
        
        # 第五步：质量评估和优化指标
        optimization_metrics = self._calculate_optimization_metrics(
            optimized_profile, generation_context
        )
        
        # 第六步：执行信心度评估
        execution_confidence = self._assess_execution_confidence(
            optimized_profile, generation_context, optimization_metrics
        )
        
        return OptimizedPromptOutput(
            final_prompt=final_prompt,
            constraint_profile=optimized_profile,
            generation_context=generation_context,
            optimization_metrics=optimization_metrics,
            execution_confidence=execution_confidence
        )
    
    def _analyze_edit_context(self, edit_description: str, editing_intent: str,
                            processing_style: str, quality_level: str,
                            user_preferences: Dict) -> GenerationContext:
        """分析编辑上下文（智能分析引擎）"""
        
        # 使用智能分析器分析操作上下文
        operation_context = self.prompt_analyzer.analyze_operation_context(
            edit_description
        )
        
        # 计算认知负荷（基于1026数据集标准）
        cognitive_load = self._calculate_cognitive_load(
            operation_context, editing_intent, edit_description
        )
        
        # 推断应用场景类型
        context_type = self._infer_context_type(
            edit_description, processing_style, user_preferences
        )
        
        return GenerationContext(
            edit_description=edit_description,
            operation_type=operation_context.operation_type,
            cognitive_load=cognitive_load,
            context_type=context_type,
            user_preferences=user_preferences,
            quality_level=quality_level
        )
    
    def _calculate_cognitive_load(self, operation_context, editing_intent: str, 
                                edit_description: str) -> float:
        """计算认知负荷（基于1026数据集认知模型）"""
        
        # 基础认知负荷（来自1026数据集统计）
        base_loads = {
            "local_editing": 2.695,
            "global_editing": 3.229,
            "text_editing": 3.457,
            "creative_reconstruction": 5.794
        }
        
        # 确定编辑类别
        if editing_intent in base_loads:
            base_load = base_loads[editing_intent]
        else:
            # 根据操作复杂度推断
            if operation_context.operation_type in ["add", "remove", "color"]:
                base_load = base_loads["local_editing"]
            elif operation_context.operation_type in ["style_transfer", "background"]:
                base_load = base_loads["global_editing"]
            elif "text" in edit_description.lower() or "字" in edit_description:
                base_load = base_loads["text_editing"]
            else:
                base_load = base_loads["local_editing"]
        
        # 复杂度修正因子
        complexity_factors = {
            "multiple_objects": 1.3,  # 多对象处理
            "creative_concept": 1.8,  # 创意概念
            "artistic_style": 1.5,    # 艺术风格
            "technical_precision": 1.2, # 技术精度
        }
        
        # 分析描述文本的复杂度指标
        description_lower = edit_description.lower()
        final_load = base_load
        
        if any(word in description_lower for word in ["creative", "artistic", "concept", "imagine"]):
            final_load *= complexity_factors["creative_concept"]
        elif any(word in description_lower for word in ["style", "art", "painting", "drawing"]):
            final_load *= complexity_factors["artistic_style"]  
        elif any(word in description_lower for word in ["multiple", "all", "several", "many"]):
            final_load *= complexity_factors["multiple_objects"]
        elif any(word in description_lower for word in ["precise", "exact", "specific", "detailed"]):
            final_load *= complexity_factors["technical_precision"]
        
        return min(final_load, 6.0)  # 上限为6.0
    
    def _infer_context_type(self, edit_description: str, processing_style: str,
                          user_preferences: Dict) -> str:
        """推断应用场景类型"""
        
        # 优先使用用户偏好
        if user_preferences.get("preferred_context"):
            return user_preferences["preferred_context"]
        
        # 处理风格映射
        style_context_map = {
            "ecommerce_product": "product_showcase",
            "social_media": "marketing_communication", 
            "marketing_campaign": "marketing_communication",
            "creative_design": "creative_expression"
        }
        
        if processing_style in style_context_map:
            return style_context_map[processing_style]
        
        # 基于描述文本推断
        description_lower = edit_description.lower()
        
        # 检查关键词匹配
        for keyword, context in self.context_mapping.items():
            if keyword in description_lower:
                return context
        
        # 默认场景
        return "product_showcase"
    
    def _generate_constraint_profile(self, context: GenerationContext) -> ConstraintProfile:
        """生成约束配置文件"""
        return self.constraint_system.generate_constraint_profile(
            context.operation_type,
            context.cognitive_load,
            context.context_type
        )
    
    def _optimize_constraint_expression(self, profile: ConstraintProfile,
                                      context: GenerationContext) -> ConstraintProfile:
        """优化约束表达（语义增强）"""
        
        # 应用语义修饰词增强
        enhanced_operation_constraints = self.constraint_system.apply_semantic_modifiers(
            profile.operation_constraints, context.cognitive_load
        )
        
        enhanced_cognitive_constraints = self.constraint_system.apply_semantic_modifiers(
            profile.cognitive_constraints, context.cognitive_load
        )
        
        enhanced_context_constraints = self.constraint_system.apply_semantic_modifiers(
            profile.context_constraints, context.cognitive_load
        )
        
        # 根据质量级别进行表达优化
        if context.quality_level == "premium":
            enhanced_operation_constraints = self._enhance_for_premium_quality(
                enhanced_operation_constraints
            )
        elif context.quality_level == "basic":
            enhanced_operation_constraints = self._simplify_for_basic_quality(
                enhanced_operation_constraints
            )
        
        return ConstraintProfile(
            operation_constraints=enhanced_operation_constraints,
            cognitive_constraints=enhanced_cognitive_constraints,
            context_constraints=enhanced_context_constraints,
            total_complexity=profile.total_complexity,
            constraint_density=len(enhanced_operation_constraints) + 
                             len(enhanced_cognitive_constraints) +
                             len(enhanced_context_constraints)
        )
    
    def _enhance_for_premium_quality(self, constraints: List[str]) -> List[str]:
        """为高端质量增强约束表达"""
        premium_modifiers = [
            "with meticulous precision and attention to detail",
            "achieving luxury-grade quality standards", 
            "delivering exceptional professional results",
            "maintaining premium commercial viability"
        ]
        
        enhanced = []
        for constraint in constraints:
            modifier = random.choice(premium_modifiers)
            enhanced.append(f"{constraint}, {modifier}")
        
        return enhanced
    
    def _simplify_for_basic_quality(self, constraints: List[str]) -> List[str]:
        """为基础质量简化约束表达"""
        # 简化复杂的约束表达，保留核心要求
        simplified = []
        for constraint in constraints:
            # 移除过于复杂的修饰词
            simplified_constraint = re.sub(
                r'\s+with\s+[^,]+attention\s+to\s+detail', '', constraint
            )
            simplified.append(simplified_constraint)
        
        return simplified
    
    def _build_final_prompt(self, profile: ConstraintProfile, 
                          context: GenerationContext) -> str:
        """构建最终提示词"""
        
        # 使用增强约束系统构建综合提示词
        comprehensive_prompt = self.constraint_system.build_comprehensive_prompt(
            profile, context.edit_description
        )
        
        # 添加特定优化指令
        optimization_instructions = self._generate_optimization_instructions(
            context, profile
        )
        
        final_prompt = f"""{comprehensive_prompt}

## Optimization Instructions
{optimization_instructions}

## Final Requirements
- Output: Single comprehensive English editing instruction
- Integration: Seamlessly combine all constraint requirements
- Quality: {context.quality_level.title()} grade execution
- Confidence Level: Target >{self._get_target_confidence(context.cognitive_load):.1f}
"""
        
        return final_prompt
    
    def _generate_optimization_instructions(self, context: GenerationContext,
                                          profile: ConstraintProfile) -> str:
        """生成优化指令"""
        
        instructions = []
        
        # 基于认知负荷的优化指令
        if context.cognitive_load <= 3.0:
            instructions.append("Focus on technical precision and immediate execution clarity")
        elif context.cognitive_load <= 4.0:
            instructions.append("Balance technical requirements with professional polish")
        else:
            instructions.append("Integrate creative vision with technical excellence")
        
        # 基于应用场景的优化指令
        if context.context_type == "product_showcase":
            instructions.append("Prioritize commercial viability and marketplace standards")
        elif context.context_type == "creative_expression":
            instructions.append("Emphasize artistic impact and emotional resonance")
        else:  # marketing_communication
            instructions.append("Optimize for audience engagement and conversion effectiveness")
        
        return "\n".join(f"- {instruction}" for instruction in instructions)
    
    def _calculate_optimization_metrics(self, profile: ConstraintProfile,
                                      context: GenerationContext) -> Dict:
        """计算优化指标"""
        
        return {
            "constraint_density": profile.constraint_density,
            "cognitive_complexity": context.cognitive_load,
            "semantic_richness": self._calculate_semantic_richness(profile),
            "context_alignment": self._calculate_context_alignment(profile, context),
            "technical_precision": self._calculate_technical_precision(profile),
            "execution_clarity": self._calculate_execution_clarity(profile)
        }
    
    def _calculate_semantic_richness(self, profile: ConstraintProfile) -> float:
        """计算语义丰富度"""
        total_words = 0
        unique_concepts = set()
        
        all_constraints = (profile.operation_constraints + 
                         profile.cognitive_constraints + 
                         profile.context_constraints)
        
        for constraint in all_constraints:
            words = constraint.lower().split()
            total_words += len(words)
            
            # 提取概念词（去除介词、连词等）
            concept_words = [w for w in words if len(w) > 3]
            unique_concepts.update(concept_words)
        
        if total_words == 0:
            return 0.0
        
        return len(unique_concepts) / total_words
    
    def _calculate_context_alignment(self, profile: ConstraintProfile, 
                                   context: GenerationContext) -> float:
        """计算上下文对齐度"""
        # 分析约束是否与应用场景匹配
        context_keywords = {
            "product_showcase": ["product", "commercial", "professional", "quality"],
            "creative_expression": ["creative", "artistic", "expression", "aesthetic"],
            "marketing_communication": ["marketing", "engagement", "conversion", "brand"]
        }
        
        relevant_keywords = context_keywords.get(context.context_type, [])
        
        match_count = 0
        total_constraints = len(profile.context_constraints)
        
        for constraint in profile.context_constraints:
            constraint_lower = constraint.lower()
            if any(keyword in constraint_lower for keyword in relevant_keywords):
                match_count += 1
        
        return match_count / max(total_constraints, 1)
    
    def _calculate_technical_precision(self, profile: ConstraintProfile) -> float:
        """计算技术精确度"""
        technical_indicators = [
            "precise", "accurate", "exact", "specific", "systematic",
            "controlled", "calibrated", "measured", "specified"
        ]
        
        precision_count = 0
        total_constraints = len(profile.operation_constraints)
        
        for constraint in profile.operation_constraints:
            constraint_lower = constraint.lower()
            if any(indicator in constraint_lower for indicator in technical_indicators):
                precision_count += 1
        
        return precision_count / max(total_constraints, 1)
    
    def _calculate_execution_clarity(self, profile: ConstraintProfile) -> float:
        """计算执行清晰度"""
        clarity_score = 0.0
        total_constraints = profile.constraint_density
        
        if total_constraints == 0:
            return 0.0
        
        # 评估约束表达的清晰度
        all_constraints = (profile.operation_constraints +
                         profile.cognitive_constraints + 
                         profile.context_constraints)
        
        for constraint in all_constraints:
            # 清晰度指标：句子长度适中，结构清晰
            words = constraint.split()
            word_count = len(words)
            
            if 5 <= word_count <= 15:  # 理想长度范围
                clarity_score += 1.0
            elif word_count < 5:  # 过短
                clarity_score += 0.5
            else:  # 过长
                clarity_score += 0.3
        
        return clarity_score / total_constraints
    
    def _assess_execution_confidence(self, profile: ConstraintProfile,
                                   context: GenerationContext,
                                   metrics: Dict) -> float:
        """评估执行信心度"""
        
        confidence_factors = []
        
        # 因子1：认知负荷匹配度
        target_load = self._get_target_cognitive_load(context.quality_level)
        load_match = 1.0 - abs(context.cognitive_load - target_load) / 6.0
        confidence_factors.append(load_match * 0.3)
        
        # 因子2：约束密度合理性
        optimal_density = self._get_optimal_constraint_density(context.cognitive_load)
        density_score = 1.0 - abs(profile.constraint_density - optimal_density) / optimal_density
        confidence_factors.append(max(0.0, density_score) * 0.25)
        
        # 因子3：语义丰富度
        confidence_factors.append(min(metrics["semantic_richness"], 1.0) * 0.2)
        
        # 因子4：上下文对齐度
        confidence_factors.append(metrics["context_alignment"] * 0.15)
        
        # 因子5：执行清晰度
        confidence_factors.append(metrics["execution_clarity"] * 0.1)
        
        return sum(confidence_factors)
    
    def _get_target_confidence(self, cognitive_load: float) -> float:
        """获取目标信心度"""
        if cognitive_load <= 3.0:
            return 0.9  # 简单任务高信心度
        elif cognitive_load <= 4.0:
            return 0.8  # 中等任务中高信心度
        else:
            return 0.7  # 复杂任务合理信心度
    
    def _get_target_cognitive_load(self, quality_level: str) -> float:
        """获取目标认知负荷"""
        targets = {
            "basic": 2.5,
            "professional": 3.5, 
            "premium": 4.5
        }
        return targets.get(quality_level, 3.5)
    
    def _get_optimal_constraint_density(self, cognitive_load: float) -> int:
        """获取最优约束密度"""
        if cognitive_load <= 3.0:
            return 6
        elif cognitive_load <= 4.0:
            return 9
        else:
            return 12

# 全局智能约束生成器实例
intelligent_constraint_generator = IntelligentConstraintGenerator()