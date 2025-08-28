"""
智能提示分析器 - Enhanced Version
根据编辑意图和具体描述，动态生成深度的、针对性的AI提示
新增: Kontext遗漏操作类型支持，复合操作解析，创意指令处理
Version: 2.0.0 - 完整操作覆盖
"""

import re
import json
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from .guidance_templates import KONTEXT_EDITING_TYPES

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
except ImportError as e:
    print(f"Warning: Some new operation modules not available: {e}")
    # 提供备用方案
    STATE_TRANSFORMATION_GUIDANCE = {}
    DESCRIPTIVE_CREATIVE_GUIDANCE = {}
    COMPOUND_OPERATIONS_GUIDANCE = {}
    TECHNICAL_PROFESSIONAL_GUIDANCE = {}

@dataclass
class OperationContext:
    """操作上下文信息"""
    operation_type: str  # 操作类型：add, remove, change, adjust, etc.
    target_object: str   # 目标对象：人物、物体、背景等
    target_attribute: str  # 目标属性：颜色、形状、材质等
    spatial_info: str    # 空间信息：位置、区域等
    quality_requirements: List[str]  # 质量要求
    editing_category: str = ""  # Kontext编辑类别
    cognitive_load: float = 0.0  # 认知负荷

@dataclass
class SceneConstraints:
    """场景约束条件"""
    lighting_requirements: List[str]
    color_harmony: List[str]
    perspective_considerations: List[str]
    material_properties: List[str]
    environmental_factors: List[str]

class IntelligentPromptAnalyzer:
    """智能提示分析器 - Enhanced Version with Complete Operation Coverage"""
    
    def __init__(self):
        self.operation_patterns = self._init_operation_patterns()
        self.intent_constraints = self._init_intent_constraints()
        self.quality_modifiers = self._init_quality_modifiers()
        
        # 初始化新增的操作处理器
        try:
            self.state_transformer = StateTransformationOperations()
            self.creative_handler = DescriptiveCreativeHandler()
            self.compound_parser = CompoundOperationsParser()
            self.technical_processor = TechnicalProfessionalOperations()
            self.enhanced_support = True
        except:
            self.enhanced_support = False
            print("Running in basic mode - enhanced operation support not available")
        
        # 操作模式映射 
        self.operation_patterns = self._init_operation_patterns()
        self.intent_constraints = self._init_intent_constraints()
        self.quality_modifiers = self._init_quality_modifiers()
    
    def _init_operation_patterns(self) -> Dict[str, List[str]]:
        """初始化操作模式识别 - 基于Kontext数据集完整分析"""
        return {
            # 基础操作类型 (原有)
            "add": ["add", "insert", "place", "put", "include", "添加", "放置", "插入", "增加"],
            "remove": ["remove", "delete", "erase", "eliminate", "删除", "移除", "去掉", "清除"],
            "change": ["change", "modify", "alter", "transform", "更改", "修改", "改变", "转换"],
            "adjust": ["adjust", "tune", "enhance", "improve", "调整", "优化", "增强", "完善"],
            "replace": ["replace", "substitute", "swap", "exchange", "替换", "更换", "换成"],
            
            # 状态转换操作 (新增 - 基于Kontext发现的遗漏模式)
            "turn": ["turn", "convert", "make into", "become", "transform into", "转变", "变成"],
            "wear": ["wear", "put on", "have on", "dressed in", "穿着", "戴着", "佩戴"],
            "give": ["give", "grant", "provide", "equip with", "赋予", "给予", "配备"],
            "sit": ["sit", "seat", "position on", "place on", "坐", "坐在", "放置于"],
            "stand": ["stand", "position", "place upright", "站", "站立", "竖立"],
            "put": ["put", "place", "set", "position", "放", "置于", "摆放"],
            
            # 描述性创意指令 (新增 - 无动词模式)
            "descriptive": ["this", "image of", "picture of", "scene of", "painting of"],
            "temporal_style": ["era", "period", "style", "in the style of", "风格", "时代"],
            
            # 复合操作连接词 (新增)
            "compound_connectors": ["and", "then", "also", "additionally", "afterwards", "next"],
            
            # 技术专业操作 (新增)
            "technical": ["depth", "3d", "model", "wireframe", "topology", "pixel art", "neon"],
            
            # 来自Kontext高频操作 (基于1026样本分析)
            "shape_transformation": ["变形", "变成", "转换", "变为", "变化成", "shape", "transform", "morph", "reshape"],
            "color_modification": ["改色", "变色", "换色", "调色", "着色", "上色", "color", "colorize", "recolor"],
            "text_operation": ["文字", "文本", "字体", "标题", "修改文字", "text", "font", "typography", "字"],
            "background_replacement": ["背景", "换背景", "背景替换", "场景", "background", "backdrop", "环境"],
            "object_removal": ["去除", "移除", "删掉", "擦除", "消除", "hide", "eliminate", "erase"],
            "style_transfer": ["风格", "艺术化", "风格转换", "画风", "style", "artistic", "stylize"],
            
            # 专业场景操作
            "relight": ["重新照明", "打光", "照明", "光线", "lighting", "illuminate", "relight"],
            "zoom": ["缩放", "聚焦", "特写", "放大", "缩小", "zoom", "focus", "close-up", "wide"],
            "teleport": ["场景切换", "传送", "重新定位", "背景切换", "teleport", "context", "relocate"],
            "professional": ["专业化", "产品", "商业", "目录", "professional", "product", "catalog", "commercial"],
            
            # 创意重构操作 (高认知负荷)
            "scene_building": ["场景构建", "创建场景", "建立环境", "创造世界", "构建", "建造", "创作场景"],
            "style_creation": ["风格创作", "创造风格", "艺术创作", "独特风格", "新风格", "原创风格"],
            "conceptual_transformation": ["概念转换", "抽象化", "象征化", "概念艺术", "思想转化", "哲学表达"],
            "creative_fusion": ["创意融合", "混合创作", "超现实", "梦幻", "想象", "创意", "融合", "幻想"]
        }
    
    def _init_intent_constraints(self) -> Dict[str, Dict]:
        """初始化意图约束条件"""
        return {
            "product_showcase": {
                "lighting": ["专业产品照明", "避免过度反光", "突出产品质感", "保持阴影细节", 
                           "专业摄影棚照明", "戏剧性色彩变化", "自然光融合", "多角度照明设置"],
                "color": ["色彩还原准确", "保持品牌色调", "避免色彩失真", "增强产品吸引力",
                         "目录级色彩标准", "专业调色", "色彩空间管理"],
                "composition": ["产品为主体", "背景简洁", "突出产品特征", "符合电商标准",
                              "多种场景展示", "产品使用场景", "不同拍摄角度", "变焦级别多样"],
                "quality": ["高清晰度", "细节丰富", "专业质感", "商业级别", "目录标准", "专业产品摄影"]
            },
            "portrait_enhancement": {
                "lighting": ["自然光线效果", "柔和人像光", "避免过度曝光", "保持肌肤质感"],
                "color": ["自然肤色", "温暖色调", "避免过度饱和", "保持人物特征"],
                "composition": ["人物为焦点", "背景虚化自然", "符合人像摄影规范"],
                "quality": ["肌肤细腻", "五官清晰", "表情自然", "整体和谐"]
            },
            "creative_design": {
                "lighting": ["艺术光效", "创意照明", "戏剧性光影", "情绪化光线"],
                "color": ["大胆色彩运用", "创意色彩搭配", "艺术色调", "视觉冲击力"],
                "composition": ["打破常规", "创意构图", "艺术表现", "独特视角"],
                "quality": ["艺术美感", "创意表达", "视觉震撼", "情感共鸣"]
            },
            "professional_editing": {
                "lighting": ["精确曝光控制", "高光阴影平衡", "专业级光线处理"],
                "color": ["色彩科学管理", "白平衡精确", "色彩空间标准", "专业调色"],
                "composition": ["技术精准", "专业标准", "后期工艺", "质量控制"],
                "quality": ["技术完美", "专业级别", "精确处理", "标准化输出"]
            },
            "architectural_photo": {
                "lighting": ["建筑光影", "空间光线", "结构照明", "环境光效"],
                "color": ["真实色彩", "材质表现", "空间感", "建筑美学"],
                "composition": ["透视准确", "结构清晰", "空间层次", "建筑特色"],
                "quality": ["结构精准", "细节丰富", "空间感强", "专业水准"]
            },
            "food_styling": {
                "lighting": ["食物照明", "诱人光效", "质感突出", "食欲激发"],
                "color": ["食物色彩", "新鲜感", "诱人色调", "食欲色彩"],
                "composition": ["食物为主", "诱人摆盘", "食欲构图", "美食呈现"],
                "quality": ["食物质感", "新鲜诱人", "美食美学", "食欲激发"]
            },
            "fashion_retail": {
                "lighting": ["时尚光线", "质感照明", "品牌调性", "商品展示"],
                "color": ["流行色彩", "品牌色调", "时尚感", "商品真实"],
                "composition": ["时尚构图", "商品突出", "品牌形象", "零售标准"],
                "quality": ["时尚美感", "商品质感", "品牌品质", "零售级别"]
            },
            "landscape_nature": {
                "lighting": ["自然光线", "环境光效", "时间光影", "季节特色"],
                "color": ["自然色彩", "环境色调", "季节色彩", "自然和谐"],
                "composition": ["自然构图", "环境层次", "自然美感", "生态和谐"],
                "quality": ["自然真实", "环境美感", "生态美学", "自然震撼"]
            }
        }
    
    def _init_quality_modifiers(self) -> Dict[str, List[str]]:
        """初始化质量修饰词"""
        return {
            "technical": ["精确", "专业", "标准", "技术", "科学", "系统"],
            "creative": ["创意", "艺术", "美感", "灵感", "独特", "创新"],
            "natural": ["自然", "真实", "和谐", "平衡", "舒适", "温暖"],
            "commercial": ["商业", "专业", "标准", "品质", "吸引", "有效"]
        }
    
    def analyze_operation_context(self, edit_description: str, annotation_data: str = "") -> OperationContext:
        """分析操作上下文 - 增强版，集成Kontext分析"""
        # 识别操作类型
        operation_type = self._identify_operation_type(edit_description)
        
        # 提取目标对象
        target_object = self._extract_target_object(edit_description)
        
        # 提取目标属性
        target_attribute = self._extract_target_attribute(edit_description)
        
        # 提取空间信息
        spatial_info = self._extract_spatial_info(edit_description, annotation_data)
        
        # 生成质量要求
        quality_requirements = self._generate_quality_requirements(operation_type, target_object)
        
        # 新增：Kontext编辑类别识别
        editing_category = self._identify_kontext_editing_category(operation_type, edit_description)
        
        # 新增：计算认知负荷
        cognitive_load = self._calculate_cognitive_load(operation_type, edit_description, editing_category)
        
        
        return OperationContext(
            operation_type=operation_type,
            target_object=target_object,
            target_attribute=target_attribute,
            spatial_info=spatial_info,
            quality_requirements=quality_requirements,
            editing_category=editing_category,
            cognitive_load=cognitive_load
        )
    
    def _identify_operation_type(self, description: str) -> str:
        """识别操作类型"""
        description_lower = description.lower()
        
        for op_type, patterns in self.operation_patterns.items():
            for pattern in patterns:
                if pattern in description_lower:
                    return op_type
        
        return "adjust"  # 默认为调整操作
    
    def _extract_target_object(self, description: str) -> str:
        """提取目标对象"""
        # 常见目标对象模式
        object_patterns = {
            "人物": ["person", "people", "human", "man", "woman", "人", "人物", "人员"],
            "车辆": ["car", "vehicle", "truck", "bike", "车", "汽车", "车辆"],
            "建筑": ["building", "house", "structure", "建筑", "房子", "建筑物"],
            "天空": ["sky", "cloud", "heaven", "天空", "云", "天"],
            "背景": ["background", "backdrop", "背景", "后景"],
            "植物": ["tree", "plant", "flower", "grass", "树", "植物", "花", "草"],
            "产品": ["product", "item", "object", "产品", "物品", "商品"]
        }
        
        description_lower = description.lower()
        for obj_type, patterns in object_patterns.items():
            for pattern in patterns:
                if pattern in description_lower:
                    return obj_type
        
        return "对象"
    
    def _extract_target_attribute(self, description: str) -> str:
        """提取目标属性"""
        attribute_patterns = {
            "颜色": ["color", "hue", "shade", "颜色", "色彩", "色调"],
            "大小": ["size", "scale", "大小", "尺寸", "缩放"],
            "位置": ["position", "location", "place", "位置", "地点"],
            "材质": ["material", "texture", "surface", "材质", "质感", "表面"],
            "亮度": ["brightness", "light", "lighting", "亮度", "光线", "照明"],
            "形状": ["shape", "form", "形状", "外形"],
            "样式": ["style", "appearance", "样式", "外观", "风格"]
        }
        
        description_lower = description.lower()
        for attr_type, patterns in attribute_patterns.items():
            for pattern in patterns:
                if pattern in description_lower:
                    return attr_type
        
        return "外观"
    
    def _extract_spatial_info(self, description: str, annotation_data: str) -> str:
        """提取空间信息"""
        spatial_info = []
        
        # 从annotation_data中提取区域信息
        if annotation_data:
            try:
                # 尝试解析annotation数据
                if "annotation" in description.lower():
                    spatial_info.append("标注区域")
                if "red" in description.lower() or "红色" in description:
                    spatial_info.append("红色标记区域")
                if "blue" in description.lower() or "蓝色" in description:
                    spatial_info.append("蓝色标记区域")
            except:
                pass
        
        # 从描述中提取位置信息
        position_patterns = ["left", "right", "center", "top", "bottom", "corner", 
                           "左", "右", "中间", "上", "下", "角落"]
        
        for pattern in position_patterns:
            if pattern in description.lower():
                spatial_info.append(f"位置:{pattern}")
        
        return ", ".join(spatial_info) if spatial_info else "指定区域"
    
    def _generate_quality_requirements(self, operation_type: str, target_object: str) -> List[str]:
        """生成质量要求"""
        base_requirements = ["自然真实", "无违和感", "高质量"]
        
        # 根据操作类型添加特定要求
        type_requirements = {
            "add": ["无缝融合", "光影一致", "透视准确"],
            "remove": ["背景修复", "无痕迹", "自然填充"],
            "change": ["过渡自然", "保持一致性", "细节丰富"],
            "color": ["色彩和谐", "不失真", "符合光源"]
        }
        
        # 根据目标对象添加特定要求
        object_requirements = {
            "人物": ["肌肤自然", "五官清晰", "表情真实"],
            "车辆": ["反光真实", "细节清晰", "质感强"],
            "建筑": ["结构准确", "材质真实", "透视正确"],
            "天空": ["色彩自然", "云层真实", "光线合理"]
        }
        
        requirements = base_requirements.copy()
        requirements.extend(type_requirements.get(operation_type, []))
        requirements.extend(object_requirements.get(target_object, []))
        
        return requirements
    
    def generate_scene_constraints(self, editing_intent: str, operation_context: OperationContext) -> SceneConstraints:
        """生成场景约束条件"""
        intent_data = self.intent_constraints.get(editing_intent, {})
        
        # 基于意图和操作上下文生成约束
        lighting_requirements = intent_data.get("lighting", [])
        color_harmony = intent_data.get("color", [])
        perspective_considerations = intent_data.get("composition", [])
        material_properties = []
        environmental_factors = intent_data.get("quality", [])
        
        # 根据操作类型调整约束
        if operation_context.operation_type == "add":
            lighting_requirements.extend(["新增元素光照一致", "阴影合理", "反射准确"])
            perspective_considerations.extend(["透视匹配", "比例协调", "空间感"])
        elif operation_context.operation_type == "remove":
            environmental_factors.extend(["背景修复无痕", "纹理连续", "色彩平滑"])
        elif operation_context.operation_type == "color":
            color_harmony.extend(["色彩过渡自然", "饱和度合理", "明度平衡"])
        
        # 根据目标对象调整约束
        if operation_context.target_object == "人物":
            material_properties.extend(["肌肤质感", "服装材质", "毛发细节"])
        elif operation_context.target_object == "车辆":
            material_properties.extend(["金属质感", "玻璃反射", "橡胶材质"])
        elif operation_context.target_object == "建筑":
            material_properties.extend(["建筑材质", "表面纹理", "结构细节"])
        
        return SceneConstraints(
            lighting_requirements=lighting_requirements,
            color_harmony=color_harmony,
            perspective_considerations=perspective_considerations,
            material_properties=material_properties,
            environmental_factors=environmental_factors
        )
    
    def build_intelligent_prompt(self, editing_intent: str, processing_style: str, 
                               edit_description: str, annotation_data: str = "") -> str:
        """构建智能提示"""
        
        # 1. 分析操作上下文
        operation_context = self.analyze_operation_context(edit_description, annotation_data)
        
        # 2. 生成场景约束
        scene_constraints = self.generate_scene_constraints(editing_intent, operation_context)
        
        # 3. 选择基础模板
        base_template = self._select_base_template(editing_intent, processing_style)
        
        # 4. 生成专业化指令（新增）
        professional_instructions = self._generate_professional_instructions(
            operation_context, editing_intent
        )
        
        # 5. 构建增强提示
        enhanced_prompt = self._construct_enhanced_prompt(
            base_template, operation_context, scene_constraints, edit_description, professional_instructions
        )
        
        return enhanced_prompt
    
    def _generate_professional_instructions(self, operation_context: OperationContext, editing_intent: str) -> List[str]:
        """生成专业化指令（基于kontext-presets的技巧）"""
        instructions = []
        
        # 基于操作类型生成专业指令
        if operation_context.operation_type == "relight":
            instructions.extend([
                "提供多种照明设置建议",
                "包含戏剧性色彩变化",
                "建议不同时间段的自然光效果",
                "专业摄影棚照明配置"
            ])
        elif operation_context.operation_type == "zoom":
            instructions.extend([
                "提供不同级别的缩放建议",
                "聚焦于主要对象",
                "保持画面构图平衡",
                "考虑细节展示需求"
            ])
        elif operation_context.operation_type == "professional":
            instructions.extend([
                "采用专业产品摄影标准",
                "提供多种场景展示方案",
                "包含产品使用场景",
                "确保目录级别的质量"
            ])
        
        # 基于编辑意图生成专业指令
        if editing_intent == "product_showcase":
            instructions.extend([
                "描述多种场景：简单产品展示或使用场景",
                "建议多样的光照设置和拍摄角度",
                "提供至少一个产品使用场景",
                "确保专业目录标准"
            ])
        elif editing_intent == "portrait_enhancement":
            instructions.extend([
                "保持相同姿态和背景",
                "确保看起来自然",
                "适应主体特征",
                "描述具体的视觉编辑方法"
            ])
        elif editing_intent == "creative_design":
            instructions.extend([
                "提供多种艺术方向",
                "包含风格、文化或时代参考",
                "打破常规构图",
                "创造独特视角"
            ])
        
        return instructions
    
    def _select_base_template(self, editing_intent: str, processing_style: str) -> str:
        """选择基础模板"""
        # 这里可以引用原有的guidance_templates
        from guidance_templates import TEMPLATE_LIBRARY
        
        # 映射到模板
        template_map = {
            "product_showcase": "ecommerce_product",
            "portrait_enhancement": "portrait_beauty",
            "creative_design": "creative_design",
            "architectural_photo": "architecture_photo",
            "food_styling": "food_photography",
            "fashion_retail": "fashion_retail",
            "landscape_nature": "landscape_nature",
            "professional_editing": "professional_editing"
        }
        
        template_key = template_map.get(editing_intent, "none")
        
        if template_key != "none" and template_key in TEMPLATE_LIBRARY:
            return TEMPLATE_LIBRARY[template_key]["prompt"]
        
        # 默认模板
        return """你是专业的图像编辑AI助手，请根据用户需求生成精确的编辑指令。"""
    
    def _construct_enhanced_prompt(self, base_template: str, operation_context: OperationContext,
                                 scene_constraints: SceneConstraints, edit_description: str, 
                                 professional_instructions: List[str]) -> str:
        """构建增强提示"""
        
        # 构建操作分析部分
        operation_analysis = f"""
## 操作分析
- **操作类型**: {operation_context.operation_type}
- **目标对象**: {operation_context.target_object}
- **目标属性**: {operation_context.target_attribute}
- **空间信息**: {operation_context.spatial_info}
- **用户描述**: {edit_description}

## 专业要求
"""
        
        # 添加光照要求
        if scene_constraints.lighting_requirements:
            operation_analysis += f"### 光照处理\n"
            for req in scene_constraints.lighting_requirements:
                operation_analysis += f"- {req}\n"
        
        # 添加色彩要求
        if scene_constraints.color_harmony:
            operation_analysis += f"### 色彩管理\n"
            for req in scene_constraints.color_harmony:
                operation_analysis += f"- {req}\n"
        
        # 添加构图要求
        if scene_constraints.perspective_considerations:
            operation_analysis += f"### 构图考量\n"
            for req in scene_constraints.perspective_considerations:
                operation_analysis += f"- {req}\n"
        
        # 添加材质要求
        if scene_constraints.material_properties:
            operation_analysis += f"### 材质表现\n"
            for req in scene_constraints.material_properties:
                operation_analysis += f"- {req}\n"
        
        # 添加质量要求
        if operation_context.quality_requirements:
            operation_analysis += f"### 质量标准\n"
            for req in operation_context.quality_requirements:
                operation_analysis += f"- {req}\n"
        
        # 添加环境因素
        if scene_constraints.environmental_factors:
            operation_analysis += f"### 环境因素\n"
            for req in scene_constraints.environmental_factors:
                operation_analysis += f"- {req}\n"
        
        # 添加专业化指令（新增）
        if professional_instructions:
            operation_analysis += f"### 专业化指令\n"
            for instruction in professional_instructions:
                operation_analysis += f"- {instruction}\n"
        
        # 构建最终提示
        enhanced_prompt = f"""{base_template}

{operation_analysis}

## 输出要求
请根据以上分析，生成精确的Flux Kontext编辑指令。指令应该：
1. 准确描述操作内容和目标
2. 包含必要的质量和技术要求
3. 考虑场景的整体协调性
4. 使用专业的图像编辑术语
5. 提供多样化的实现方案
6. 确保专业级别的输出质量

请确保指令具有可执行性、专业性和完整性，并遵循专业化指令的要求。"""
        
        return enhanced_prompt
    
    # 新增：Kontext集成方法
    def _identify_kontext_editing_category(self, operation_type: str, description: str) -> str:
        """识别Kontext编辑类别"""
        
        # 创意重构检测 (高认知负荷)
        creative_indicators = [
            "创意", "想象", "梦幻", "超现实", "魔法", "变成", "化身", "转化",
            "创造", "构建场景", "风格创作", "概念", "抽象", "象征", "哲学"
        ]
        
        description_lower = description.lower()
        creative_score = sum(1 for indicator in creative_indicators if indicator in description)
        
        if creative_score >= 2 or operation_type in ["scene_building", "style_creation", "conceptual_transformation", "creative_fusion"]:
            return "creative_reconstruction"
        
        # 局部编辑检测 (最高频使用)
        local_indicators = [
            "局部", "部分", "某个", "这里", "那里", "选中", "标记", "区域", "位置"
        ]
        local_score = sum(1 for indicator in local_indicators if indicator in description)
        
        if local_score > 0 or operation_type in ["shape_transformation", "color_modification", "object_removal"]:
            return "local_editing"
        
        # 全局编辑检测 (全局处理)  
        global_indicators = [
            "整体", "全部", "所有", "整个", "全局", "总体", "完全", "全面"
        ]
        global_score = sum(1 for indicator in global_indicators if indicator in description)
        
        if global_score > 0 or operation_type in ["background_replacement", "style_transfer", "relight"]:
            return "global_editing"
        
        # 文字编辑检测 (文字专用)
        if operation_type == "text_operation" or any(word in description for word in ["文字", "文本", "字体", "标题"]):
            return "text_editing"
        
        # 专业操作检测
        if operation_type == "professional":
            return "professional_operations"
        
        # 默认返回局部编辑（最高频）
        return "local_editing"
    
    def _calculate_cognitive_load(self, operation_type: str, description: str, editing_category: str) -> float:
        """计算认知负荷 - 基于Kontext数据集"""
        
        # Kontext数据集中的平均认知负荷
        category_loads = {
            "local_editing": 2.695,
            "global_editing": 3.229, 
            "creative_reconstruction": 5.794,
            "text_editing": 3.457,
            "professional_operations": 3.8
        }
        
        base_load = category_loads.get(editing_category, 3.0)
        
        # 基于操作类型的调整因子
        operation_modifiers = {
            "scene_building": 1.8,
            "style_creation": 1.5,
            "conceptual_transformation": 2.0,
            "creative_fusion": 1.6,
            "shape_transformation": 0.8,
            "color_modification": 0.5,
            "text_operation": 0.7,
            "background_replacement": 1.0,
            "object_removal": 0.6,
            "style_transfer": 1.2
        }
        
        modifier = operation_modifiers.get(operation_type, 1.0)
        
        # 基于描述复杂度的调整
        complexity_indicators = ["复杂", "详细", "精细", "多层", "深度", "高级", "专业"]
        complexity_score = sum(1 for indicator in complexity_indicators if indicator in description)
        complexity_adjustment = complexity_score * 0.3
        
        final_load = base_load * modifier + complexity_adjustment
        return round(min(10.0, final_load), 2)
    
    def analyze_with_creative_engine(self, description: str) -> Dict:
        """结合创意重构引擎进行分析"""
        
        # 先进行基础分析
        context = self.analyze_operation_context(description)
        
        # 如果是创意重构类型，使用创意引擎
        if context.editing_category == "creative_reconstruction":
            try:
                creative_engine = get_creative_engine()
                creative_analysis = creative_engine.analyze_creative_request(description, context.operation_type)
                
                return {
                    "basic_analysis": context,
                    "creative_analysis": creative_analysis,
                    "recommendation": "建议使用创意重构引擎进行处理",
                    "complexity_warning": context.cognitive_load >= 5.0
                }
            except Exception as e:
                print(f"创意引擎分析失败: {e}")
                return {
                    "basic_analysis": context,
                    "creative_analysis": None,
                    "recommendation": "使用基础分析结果",
                    "complexity_warning": False
                }
        else:
            return {
                "basic_analysis": context,
                "creative_analysis": None,
                "recommendation": "使用标准编辑流程",
                "complexity_warning": False
            }
    
    def get_operation_statistics(self, operation_type: str = None, editing_category: str = None) -> Dict:
        """获取操作统计信息"""
        
        stats = {
            "total_operations": len(self.operation_patterns),
            "categories": {
                "local_editing": {"cognitive_load": 2.695},
                "global_editing": {"cognitive_load": 3.229},
                "creative_reconstruction": {"cognitive_load": 5.794},
                "text_editing": {"cognitive_load": 3.457},
                "professional_operations": {"cognitive_load": 3.8}
            }
        }
        
        if editing_category and editing_category in stats["categories"]:
            return {
                "category": editing_category,
                "info": stats["categories"][editing_category],
                "recommended_operations": self._get_recommended_operations(editing_category)
            }
        
        return stats
    
    def _get_recommended_operations(self, editing_category: str) -> List[str]:
        """获取推荐操作"""
        
        recommendations = {
            "local_editing": ["shape_transformation", "color_modification", "object_removal", "text_operation", "attribute_adjustment", "size_scale", "position_movement", "texture_material"],
            "global_editing": ["state_transformation", "artistic_style"], 
            "creative_reconstruction": ["scene_building", "style_creation", "character_action"],
            "text_editing": ["text_operation"],
            "professional_operations": ["professional"]
        }
        
        return recommendations.get(editing_category, [])