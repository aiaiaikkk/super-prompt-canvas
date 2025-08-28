"""
状态转换操作模块 - State Transformation Operations
基于Kontext数据集分析，处理身份转换、穿戴赋予、位置放置等高频遗漏操作
覆盖180次高频需求 (17.5%的数据集)
"""

from typing import Dict, List, Tuple, Optional
import re
from dataclasses import dataclass
from enum import Enum


class StateTransformationType(Enum):
    """状态转换操作类型枚举"""
    IDENTITY_CONVERSION = "identity_conversion"      # 身份转换 (87次, 8.5%)
    WEARABLE_ASSIGNMENT = "wearable_assignment"      # 穿戴赋予 (42次, 4.1%)
    POSITIONAL_PLACEMENT = "positional_placement"    # 位置放置 (50次, 4.9%)


@dataclass
class StateTransformationConfig:
    """状态转换配置"""
    operation_type: StateTransformationType
    frequency: float
    cognitive_load: float
    patterns: List[str]
    examples: List[str]
    prompt_template: str


class StateTransformationOperations:
    """状态转换操作处理器"""
    
    def __init__(self):
        self.operations_config = self._initialize_operations()
        self.identity_patterns = self._load_identity_patterns()
        self.wearable_patterns = self._load_wearable_patterns()
        self.position_patterns = self._load_position_patterns()
    
    def _initialize_operations(self) -> Dict[str, StateTransformationConfig]:
        """初始化状态转换操作配置"""
        return {
            "identity_conversion": StateTransformationConfig(
                operation_type=StateTransformationType.IDENTITY_CONVERSION,
                frequency=8.5,
                cognitive_load=3.8,
                patterns=["turn into", "turn to", "change to", "become", "transform into"],
                examples=[
                    "turn the cat into a dog",
                    "turn both men into storm troopers", 
                    "change the man to a robot",
                    "turn this into a neon sign"
                ],
                prompt_template="""身份转换专家: 执行对象身份的完整转换，保持场景协调性。

转换原则:
- 保持原有构图和基本场景设置
- 确保新身份在环境中的合理性和协调性
- 维持转换前后的视觉连贯性
- 保留重要的场景元素和背景关系

身份转换类型:
- 物种转换: 动物之间的转换 (cat → dog, bird → fish)
- 角色转换: 人物身份改变 (civilian → soldier, child → adult)
- 物体转换: 无生物转换 (car → truck, chair → sofa)
- 概念转换: 抽象概念具象化 (idea → visual representation)

技术要求:
- 自然过渡，避免突兀感
- 保持光线和材质的一致性
- 确保转换后的比例和尺寸合理
- 维持原有的动作和姿态特征

输出: 完整的身份转换指令，确保视觉连贯性和场景合理性。"""
            ),
            
            "wearable_assignment": StateTransformationConfig(
                operation_type=StateTransformationType.WEARABLE_ASSIGNMENT,
                frequency=4.1,
                cognitive_load=2.9,
                patterns=["wear", "give", "put on", "add", "has"],
                examples=[
                    "give the cat a tophat",
                    "wear a cowboy hat",
                    "give the character a mustache",
                    "put on sunglasses"
                ],
                prompt_template="""穿戴配饰专家: 为角色添加服装、配饰或身体特征，确保自然协调。

配饰添加原则:
- 确保配饰与角色身形匹配
- 保持配饰的物理合理性和重力效果
- 考虑配饰与原有服装的搭配协调
- 维持角色的整体风格和个性特征

配饰类型分类:
- 头部配饰: 帽子、眼镜、头饰、发型装饰
- 身体特征: 胡须、纹身、疤痕、装饰元素  
- 服装配件: 领带、胸针、手表、首饰
- 功能装备: 工具、武器、专业设备

技术实现要求:
- 自然贴合，符合人体工程学
- 正确的阴影和光线反射效果
- 保持配饰的材质特性表现
- 确保不遮挡重要的面部或身体特征

输出: 精确的配饰添加指令，实现自然协调的角色增强效果。"""
            ),
            
            "positional_placement": StateTransformationConfig(
                operation_type=StateTransformationType.POSITIONAL_PLACEMENT,
                frequency=4.9,
                cognitive_load=3.2,
                patterns=["sit", "stand", "put", "place", "position", "on"],
                examples=[
                    "sit on the throne",
                    "stand on the skis",
                    "put this object on the dashboard",
                    "place the bottle on the beach"
                ],
                prompt_template="""位置放置专家: 精确控制对象的空间位置和姿态关系。

位置设定原则:
- 确保物理重力和支撑的合理性
- 保持对象与环境的空间关系协调
- 考虑透视和比例的准确性
- 维持场景的整体构图平衡

位置类型处理:
- 坐姿设定: 椅子、沙发、地面、台阶等支撑面
- 站立姿态: 地面、平台、不稳定表面的平衡
- 物体放置: 桌面、架子、容器内的摆放
- 空间关系: 前后、左右、上下的相对位置

技术实现标准:
- 正确的重心和平衡点计算
- 自然的身体姿态和肌肉张力表现
- 准确的接触面和支撑点处理
- 合理的阴影投射和空间感表达

输出: 精确的位置放置指令，实现自然真实的空间关系效果。"""
            )
        }
    
    def _load_identity_patterns(self) -> Dict[str, List[str]]:
        """加载身份转换模式库"""
        return {
            "animal_conversions": [
                "cat → dog", "dog → cat", "bird → fish", "fish → bird",
                "horse → zebra", "cow → bull", "chicken → rooster"
            ],
            "human_conversions": [
                "man → woman", "child → adult", "civilian → soldier",
                "doctor → teacher", "worker → manager"
            ],
            "object_conversions": [
                "car → truck", "chair → sofa", "book → tablet",
                "phone → computer", "hat → helmet"
            ],
            "fantasy_conversions": [
                "person → robot", "animal → mythical creature",
                "object → magical item", "building → castle"
            ]
        }
    
    def _load_wearable_patterns(self) -> Dict[str, List[str]]:
        """加载穿戴配饰模式库"""
        return {
            "headwear": [
                "hat", "cap", "helmet", "crown", "headband",
                "glasses", "sunglasses", "goggles"
            ],
            "facial_features": [
                "mustache", "beard", "glasses", "monocle",
                "scar", "tattoo", "makeup"
            ],
            "clothing": [
                "suit", "dress", "jacket", "coat", "shirt",
                "tie", "scarf", "gloves"
            ],
            "accessories": [
                "watch", "jewelry", "chain", "badge",
                "pin", "brooch", "earrings"
            ]
        }
    
    def _load_position_patterns(self) -> Dict[str, List[str]]:
        """加载位置放置模式库"""
        return {
            "sitting_surfaces": [
                "chair", "sofa", "bench", "stool", "throne",
                "floor", "ground", "steps", "edge"
            ],
            "standing_surfaces": [
                "floor", "ground", "platform", "stage", "hill",
                "skis", "surfboard", "skateboard"
            ],
            "placement_locations": [
                "table", "shelf", "dashboard", "desk", "counter",
                "beach", "park", "garden", "room"
            ],
            "spatial_relationships": [
                "on top of", "next to", "in front of", "behind",
                "above", "below", "inside", "outside"
            ]
        }
    
    def detect_state_transformation_type(self, instruction: str) -> Optional[StateTransformationType]:
        """检测状态转换操作类型"""
        instruction_lower = instruction.lower()
        
        # 检查身份转换模式
        identity_triggers = ["turn into", "turn to", "change to", "become", "transform into", "turn", "change"]
        if any(trigger in instruction_lower for trigger in identity_triggers):
            # 进一步检查是否是身份转换而不是属性修改
            if any(word in instruction_lower for word in ["dog", "cat", "person", "robot", "statue", "sign", "neon"]):
                return StateTransformationType.IDENTITY_CONVERSION
        
        # 检查穿戴赋予模式
        wearable_triggers = ["wear", "give", "put on", "add", "has"]
        wearable_objects = ["hat", "glasses", "mustache", "suit", "tie", "watch", "chain", "beard", "helmet"]
        if (any(trigger in instruction_lower for trigger in wearable_triggers) and 
            any(obj in instruction_lower for obj in wearable_objects)):
            return StateTransformationType.WEARABLE_ASSIGNMENT
        
        # 检查位置放置模式
        position_triggers = ["sit", "stand", "put", "place", "position"]
        position_objects = ["throne", "chair", "table", "dashboard", "beach", "floor", "ground", "on", "in"]
        if (any(trigger in instruction_lower for trigger in position_triggers) or
            any(obj in instruction_lower for obj in position_objects)):
            return StateTransformationType.POSITIONAL_PLACEMENT
        
        return None
    
    def generate_state_transformation_prompt(self, instruction: str, 
                                           transformation_type: StateTransformationType) -> str:
        """生成状态转换提示"""
        config = self.operations_config.get(transformation_type.value)
        if not config:
            return instruction
        
        # 获取基础模板
        base_template = config.prompt_template
        
        # 分析具体的转换内容
        transformation_details = self._analyze_transformation_details(instruction, transformation_type)
        
        # 生成具体的执行指令
        execution_instruction = self._generate_execution_instruction(instruction, transformation_details)
        
        return f"""{base_template}

具体执行任务: {execution_instruction}

原始指令: "{instruction}"
操作类型: {transformation_type.value}
认知负荷: {config.cognitive_load}
预期频率: {config.frequency}%

执行要求: 确保转换的自然性和视觉连贯性，维持场景的整体协调。"""
    
    def _analyze_transformation_details(self, instruction: str, 
                                      transformation_type: StateTransformationType) -> Dict:
        """分析转换详情"""
        details = {
            "source_object": None,
            "target_object": None,
            "transformation_context": None,
            "special_requirements": []
        }
        
        instruction_lower = instruction.lower()
        
        if transformation_type == StateTransformationType.IDENTITY_CONVERSION:
            # 解析 "turn A into B" 模式
            if "into" in instruction_lower:
                parts = instruction_lower.split("into")
                if len(parts) == 2:
                    details["source_object"] = parts[0].strip().replace("turn", "").replace("change", "").strip()
                    details["target_object"] = parts[1].strip()
            elif "to" in instruction_lower and ("turn" in instruction_lower or "change" in instruction_lower):
                parts = instruction_lower.split(" to ")
                if len(parts) == 2:
                    details["source_object"] = parts[0].strip()
                    details["target_object"] = parts[1].strip()
        
        elif transformation_type == StateTransformationType.WEARABLE_ASSIGNMENT:
            # 解析穿戴配饰
            for category, items in self.wearable_patterns.items():
                for item in items:
                    if item in instruction_lower:
                        details["target_object"] = item
                        details["transformation_context"] = category
                        break
        
        elif transformation_type == StateTransformationType.POSITIONAL_PLACEMENT:
            # 解析位置关系
            for category, locations in self.position_patterns.items():
                for location in locations:
                    if location in instruction_lower:
                        details["target_object"] = location
                        details["transformation_context"] = category
                        break
        
        return details
    
    def _generate_execution_instruction(self, instruction: str, details: Dict) -> str:
        """生成执行指令"""
        if details["source_object"] and details["target_object"]:
            return f"Transform {details['source_object']} into {details['target_object']}, maintaining scene coherence and visual quality."
        elif details["target_object"]:
            return f"Apply {details['target_object']} modification as specified, ensuring natural integration with existing elements."
        else:
            return f"Execute the transformation as described: {instruction}"
    
    def get_operation_statistics(self) -> Dict:
        """获取操作统计信息"""
        total_frequency = sum(config.frequency for config in self.operations_config.values())
        
        return {
            "total_coverage": f"{total_frequency}%",
            "operation_types": len(self.operations_config),
            "average_cognitive_load": sum(config.cognitive_load for config in self.operations_config.values()) / len(self.operations_config),
            "patterns_count": {
                op_type: len(config.patterns) 
                for op_type, config in self.operations_config.items()
            }
        }


# 使用示例和测试
if __name__ == "__main__":
    state_ops = StateTransformationOperations()
    
    # 测试用例
    test_instructions = [
        "turn the cat into a dog",
        "give the man a cowboy hat", 
        "put the object on the dashboard",
        "make her sit on the throne",
        "turn both men into storm troopers"
    ]
    
    for instruction in test_instructions:
        transformation_type = state_ops.detect_state_transformation_type(instruction)
        if transformation_type:
            prompt = state_ops.generate_state_transformation_prompt(instruction, transformation_type)
            print(f"\n指令: {instruction}")
            print(f"类型: {transformation_type.value}")
            print(f"生成提示: {prompt[:200]}...")
        else:
            print(f"\n指令: {instruction} - 未检测到状态转换操作")