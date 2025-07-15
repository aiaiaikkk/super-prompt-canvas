"""
智能提示分析器
根据编辑意图和具体描述，动态生成深度的、针对性的AI提示
"""

import re
import json
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass

@dataclass
class OperationContext:
    """操作上下文信息"""
    operation_type: str  # 操作类型：add, remove, change, adjust, etc.
    target_object: str   # 目标对象：人物、物体、背景等
    target_attribute: str  # 目标属性：颜色、形状、材质等
    spatial_info: str    # 空间信息：位置、区域等
    quality_requirements: List[str]  # 质量要求

@dataclass
class SceneConstraints:
    """场景约束条件"""
    lighting_requirements: List[str]
    color_harmony: List[str]
    perspective_considerations: List[str]
    material_properties: List[str]
    environmental_factors: List[str]

class IntelligentPromptAnalyzer:
    """智能提示分析器"""
    
    def __init__(self):
        self.operation_patterns = self._init_operation_patterns()
        self.intent_constraints = self._init_intent_constraints()
        self.quality_modifiers = self._init_quality_modifiers()
    
    def _init_operation_patterns(self) -> Dict[str, List[str]]:
        """初始化操作模式识别"""
        return {
            "add": ["add", "insert", "place", "put", "include", "添加", "放置", "插入"],
            "remove": ["remove", "delete", "erase", "eliminate", "删除", "移除", "去掉"],
            "change": ["change", "modify", "alter", "transform", "更改", "修改", "改变"],
            "adjust": ["adjust", "tune", "enhance", "improve", "调整", "优化", "增强"],
            "replace": ["replace", "substitute", "swap", "exchange", "替换", "更换"],
            "color": ["color", "hue", "shade", "tint", "颜色", "色调", "色彩"],
            "resize": ["resize", "scale", "enlarge", "shrink", "缩放", "放大", "缩小"],
            "move": ["move", "relocate", "position", "shift", "移动", "重新定位"],
            # 新增：来自kontext-presets的操作类型
            "relight": ["relight", "lighting", "illuminate", "light", "重新照明", "照明", "打光"],
            "zoom": ["zoom", "focus", "close-up", "wide", "缩放", "聚焦", "特写"],
            "teleport": ["teleport", "relocate", "transport", "context", "场景切换", "重新定位", "传送"],
            "colorize": ["colorize", "restore", "enhance color", "着色", "上色", "色彩增强"],
            "stylize": ["stylize", "cartoon", "artistic", "style", "风格化", "卡通化", "艺术化"],
            "professional": ["professional", "product", "catalog", "commercial", "专业化", "产品", "商业"]
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
        """分析操作上下文"""
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
        
        return OperationContext(
            operation_type=operation_type,
            target_object=target_object,
            target_attribute=target_attribute,
            spatial_info=spatial_info,
            quality_requirements=quality_requirements
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