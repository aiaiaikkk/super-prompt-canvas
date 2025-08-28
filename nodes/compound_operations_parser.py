"""
复合操作解析器 - Compound Operations Parser
基于Kontext数据集发现的48次多步骤复合操作 (4.7%的数据集)
处理形如"Remove A and B. Add C + modify D + change E to F"的复杂多步骤指令
"""

from typing import Dict, List, Tuple, Optional, Set
import re
from dataclasses import dataclass
from enum import Enum


class OperationType(Enum):
    """基础操作类型"""
    REMOVE = "remove"
    ADD = "add" 
    CHANGE = "change"
    REPLACE = "replace"
    MAKE = "make"
    TURN = "turn"
    PUT = "put"
    GIVE = "give"


class CompoundComplexity(Enum):
    """复合操作复杂度级别"""
    SIMPLE = "simple"       # 2步操作
    MEDIUM = "medium"       # 3-4步操作  
    COMPLEX = "complex"     # 5+步操作


@dataclass
class AtomicOperation:
    """原子操作单元"""
    operation_type: OperationType
    target_object: str
    modification_details: str
    execution_order: int
    dependencies: List[int] = None  # 依赖的操作序号


@dataclass
class CompoundInstruction:
    """复合指令分析结果"""
    original_instruction: str
    atomic_operations: List[AtomicOperation]
    complexity_level: CompoundComplexity
    execution_strategy: str
    cognitive_load: float


class CompoundOperationsParser:
    """复合操作解析器"""
    
    def __init__(self):
        self.operation_patterns = self._load_operation_patterns()
        self.conjunction_patterns = self._load_conjunction_patterns()
        self.sequence_indicators = self._load_sequence_indicators()
        self.dependency_rules = self._load_dependency_rules()
    
    def _load_operation_patterns(self) -> Dict[str, List[str]]:
        """加载操作模式"""
        return {
            "remove": [
                r"remove\s+(.*?)(?:[,.]|\s+and\s+|\s*$)",
                r"delete\s+(.*?)(?:[,.]|\s+and\s+|\s*$)",
                r"take\s+away\s+(.*?)(?:[,.]|\s+and\s+|\s*$)"
            ],
            "add": [
                r"add\s+(.*?)(?:[,.]|\s+and\s+|\s*$)",
                r"put\s+(.*?)(?:[,.]|\s+and\s+|\s*$)",
                r"place\s+(.*?)(?:[,.]|\s+and\s+|\s*$)",
                r"include\s+(.*?)(?:[,.]|\s+and\s+|\s*$)"
            ],
            "change": [
                r"change\s+(.*?)\s+to\s+(.*?)(?:[,.]|\s+and\s+|\s*$)",
                r"modify\s+(.*?)(?:[,.]|\s+and\s+|\s*$)",
                r"alter\s+(.*?)(?:[,.]|\s+and\s+|\s*$)"
            ],
            "replace": [
                r"replace\s+(.*?)\s+with\s+(.*?)(?:[,.]|\s+and\s+|\s*$)",
                r"substitute\s+(.*?)\s+with\s+(.*?)(?:[,.]|\s+and\s+|\s*$)",
                r"swap\s+(.*?)\s+for\s+(.*?)(?:[,.]|\s+and\s+|\s*$)"
            ],
            "make": [
                r"make\s+(.*?)(?:[,.]|\s+and\s+|\s*$)",
                r"create\s+(.*?)(?:[,.]|\s+and\s+|\s*$)"
            ],
            "turn": [
                r"turn\s+(.*?)\s+into\s+(.*?)(?:[,.]|\s+and\s+|\s*$)",
                r"transform\s+(.*?)\s+into\s+(.*?)(?:[,.]|\s+and\s+|\s*$)"
            ]
        }
    
    def _load_conjunction_patterns(self) -> List[str]:
        """加载连接词模式"""
        return [
            r"\s*,\s*",           # 逗号分隔
            r"\s+and\s+",         # and连接
            r"\s*\.\s*",          # 句号分隔
            r"\s*;\s*",           # 分号分隔
            r"\s*,\s*then\s+",    # then连接
            r"\s*,\s*also\s+",    # also连接
            r"\s*\.\s*[A-Z]",     # 句号+大写字母开头
        ]
    
    def _load_sequence_indicators(self) -> Dict[str, int]:
        """加载序列指示词"""
        return {
            "first": 1, "then": 2, "next": 3, "after": 4, "finally": 5,
            "also": 0, "and": 0, "additionally": 0,  # 0表示并行操作
            "before": -1, "prior": -1  # 负数表示前置条件
        }
    
    def _load_dependency_rules(self) -> Dict[str, List[str]]:
        """加载依赖关系规则"""
        return {
            "remove_before_add": ["remove", "add"],      # 删除操作应在添加前
            "change_before_style": ["change", "make"],   # 内容修改应在风格变换前
            "position_after_creation": ["add", "put"],   # 定位应在创建后
            "replace_atomic": ["replace"]                # 替换操作通常是原子性的
        }
    
    def parse_compound_instruction(self, instruction: str) -> CompoundInstruction:
        """解析复合指令"""
        # Step 1: 检测是否为复合指令
        if not self._is_compound_instruction(instruction):
            return self._create_simple_instruction(instruction)
        
        # Step 2: 分割成原子操作
        raw_operations = self._split_into_raw_operations(instruction)
        
        # Step 3: 解析每个原子操作
        atomic_operations = []
        for i, raw_op in enumerate(raw_operations):
            atomic_op = self._parse_atomic_operation(raw_op, i)
            if atomic_op:
                atomic_operations.append(atomic_op)
        
        # Step 4: 分析依赖关系
        self._analyze_dependencies(atomic_operations)
        
        # Step 5: 确定复杂度和执行策略
        complexity = self._determine_complexity(atomic_operations)
        strategy = self._determine_execution_strategy(atomic_operations, complexity)
        cognitive_load = self._calculate_cognitive_load(atomic_operations, complexity)
        
        return CompoundInstruction(
            original_instruction=instruction,
            atomic_operations=atomic_operations,
            complexity_level=complexity,
            execution_strategy=strategy,
            cognitive_load=cognitive_load
        )
    
    def _is_compound_instruction(self, instruction: str) -> bool:
        """检测是否为复合指令"""
        # 检查连接词数量
        conjunction_count = sum(
            len(re.findall(pattern, instruction, re.IGNORECASE))
            for pattern in self.conjunction_patterns
        )
        
        # 检查动词数量
        operation_verbs = ["remove", "add", "change", "replace", "make", "turn", "put", "give"]
        verb_count = sum(
            1 for verb in operation_verbs 
            if len(re.findall(rf'\b{verb}\b', instruction, re.IGNORECASE)) > 0
        )
        
        # 复合指令特征: 多个连接词或多个操作动词
        return conjunction_count >= 1 or verb_count >= 2
    
    def _split_into_raw_operations(self, instruction: str) -> List[str]:
        """分割成原始操作片段"""
        # 使用多种分隔符分割
        separators = [r'\.\s*', r',\s*and\s+', r',\s*then\s+', r';\s*', r',\s*also\s+']
        
        parts = [instruction]
        for separator in separators:
            new_parts = []
            for part in parts:
                new_parts.extend(re.split(separator, part, flags=re.IGNORECASE))
            parts = new_parts
        
        # 清理和过滤
        cleaned_parts = []
        for part in parts:
            part = part.strip()
            if part and len(part.split()) >= 2:  # 至少包含动词和宾语
                cleaned_parts.append(part)
        
        return cleaned_parts
    
    def _parse_atomic_operation(self, raw_operation: str, order: int) -> Optional[AtomicOperation]:
        """解析原子操作"""
        raw_operation = raw_operation.strip().lower()
        
        # 尝试匹配不同操作类型的模式
        for operation_name, patterns in self.operation_patterns.items():
            for pattern in patterns:
                match = re.search(pattern, raw_operation, re.IGNORECASE)
                if match:
                    operation_type = OperationType(operation_name)
                    
                    if operation_name in ["change", "replace", "turn"]:
                        # 双参数操作 (A to B, A with B)
                        target_object = match.group(1).strip()
                        modification_details = match.group(2).strip() if match.lastindex >= 2 else ""
                    else:
                        # 单参数操作
                        target_object = match.group(1).strip()
                        modification_details = ""
                    
                    return AtomicOperation(
                        operation_type=operation_type,
                        target_object=target_object,
                        modification_details=modification_details,
                        execution_order=order
                    )
        
        # 如果没有匹配到明确模式，尝试通用解析
        words = raw_operation.split()
        if words:
            first_word = words[0]
            operation_verbs = [op.value for op in OperationType]
            if first_word in operation_verbs:
                return AtomicOperation(
                    operation_type=OperationType(first_word),
                    target_object=" ".join(words[1:]),
                    modification_details="",
                    execution_order=order
                )
        
        return None
    
    def _analyze_dependencies(self, atomic_operations: List[AtomicOperation]):
        """分析操作间的依赖关系"""
        for i, current_op in enumerate(atomic_operations):
            dependencies = []
            
            # 检查基于规则的依赖
            for rule_name, rule_sequence in self.dependency_rules.items():
                if current_op.operation_type.value in rule_sequence:
                    current_index = rule_sequence.index(current_op.operation_type.value)
                    
                    # 寻找前置依赖操作
                    for j, other_op in enumerate(atomic_operations[:i]):
                        if (other_op.operation_type.value in rule_sequence and
                            rule_sequence.index(other_op.operation_type.value) < current_index):
                            dependencies.append(j)
            
            # 检查对象依赖关系
            for j, other_op in enumerate(atomic_operations[:i]):
                if self._has_object_dependency(current_op, other_op):
                    dependencies.append(j)
            
            current_op.dependencies = dependencies if dependencies else None
    
    def _has_object_dependency(self, current_op: AtomicOperation, 
                             other_op: AtomicOperation) -> bool:
        """检查对象级别的依赖关系"""
        # 如果当前操作的目标对象在前一个操作中被修改/创建
        current_target = current_op.target_object.lower()
        other_target = other_op.target_object.lower()
        other_modification = other_op.modification_details.lower()
        
        # 检查对象引用重叠
        current_words = set(current_target.split())
        other_words = set(other_target.split())
        modification_words = set(other_modification.split()) if other_modification else set()
        
        # 如果有共同的关键词，可能存在依赖
        overlap = current_words.intersection(other_words.union(modification_words))
        return len(overlap) > 0
    
    def _determine_complexity(self, atomic_operations: List[AtomicOperation]) -> CompoundComplexity:
        """确定复合操作复杂度"""
        op_count = len(atomic_operations)
        
        if op_count <= 2:
            return CompoundComplexity.SIMPLE
        elif op_count <= 4:
            return CompoundComplexity.MEDIUM
        else:
            return CompoundComplexity.COMPLEX
    
    def _determine_execution_strategy(self, atomic_operations: List[AtomicOperation],
                                    complexity: CompoundComplexity) -> str:
        """确定执行策略"""
        has_dependencies = any(op.dependencies for op in atomic_operations)
        
        if complexity == CompoundComplexity.SIMPLE and not has_dependencies:
            return "parallel_execution"
        elif has_dependencies:
            return "dependency_ordered_execution"
        else:
            return "sequential_execution"
    
    def _calculate_cognitive_load(self, atomic_operations: List[AtomicOperation],
                                complexity: CompoundComplexity) -> float:
        """计算认知负荷"""
        base_load = {
            CompoundComplexity.SIMPLE: 3.2,
            CompoundComplexity.MEDIUM: 4.5,
            CompoundComplexity.COMPLEX: 5.8
        }[complexity]
        
        # 依赖关系增加认知负荷
        dependency_penalty = sum(
            0.3 * len(op.dependencies) if op.dependencies else 0
            for op in atomic_operations
        )
        
        # 操作类型复杂度影响
        operation_complexity = {
            OperationType.REMOVE: 1.0,
            OperationType.ADD: 1.2,
            OperationType.CHANGE: 1.5,
            OperationType.REPLACE: 1.8,
            OperationType.MAKE: 1.3,
            OperationType.TURN: 2.0,
            OperationType.PUT: 1.1,
            OperationType.GIVE: 1.1
        }
        
        type_complexity = sum(
            operation_complexity.get(op.operation_type, 1.0) 
            for op in atomic_operations
        ) / len(atomic_operations)
        
        return min(base_load + dependency_penalty + type_complexity * 0.5, 7.0)
    
    def _create_simple_instruction(self, instruction: str) -> CompoundInstruction:
        """创建简单指令对象"""
        # 尝试解析为单个原子操作
        atomic_op = self._parse_atomic_operation(instruction, 0)
        if not atomic_op:
            # 如果无法解析，创建通用操作
            atomic_op = AtomicOperation(
                operation_type=OperationType.MAKE,
                target_object=instruction,
                modification_details="",
                execution_order=0
            )
        
        return CompoundInstruction(
            original_instruction=instruction,
            atomic_operations=[atomic_op],
            complexity_level=CompoundComplexity.SIMPLE,
            execution_strategy="single_operation",
            cognitive_load=2.8
        )
    
    def generate_execution_prompt(self, compound_instruction: CompoundInstruction) -> str:
        """生成执行提示"""
        if compound_instruction.complexity_level == CompoundComplexity.SIMPLE:
            return self._generate_simple_prompt(compound_instruction)
        else:
            return self._generate_complex_prompt(compound_instruction)
    
    def _generate_simple_prompt(self, compound_instruction: CompoundInstruction) -> str:
        """生成简单复合操作提示"""
        op = compound_instruction.atomic_operations[0]
        
        return f"""简单操作执行专家: 执行基础图像编辑操作，确保高质量结果。

操作详情:
- 操作类型: {op.operation_type.value}
- 目标对象: {op.target_object}
- 修改说明: {op.modification_details or '按指令执行'}

执行要求:
- 保持图像质量和视觉协调性
- 确保操作结果的自然真实性
- 维持原有场景的整体风格

原始指令: "{compound_instruction.original_instruction}"
认知负荷: {compound_instruction.cognitive_load}

输出: 高质量的单步操作执行结果。"""
    
    def _generate_complex_prompt(self, compound_instruction: CompoundInstruction) -> str:
        """生成复杂复合操作提示"""
        operations_summary = []
        for i, op in enumerate(compound_instruction.atomic_operations, 1):
            dep_info = f" (依赖步骤: {op.dependencies})" if op.dependencies else ""
            operations_summary.append(
                f"  {i}. {op.operation_type.value}: {op.target_object} "
                f"{op.modification_details}{dep_info}"
            )
        
        return f"""复合操作执行大师: 系统化执行多步骤图像编辑任务，确保各步骤协调配合。

复合操作分析:
复杂度级别: {compound_instruction.complexity_level.value}
执行策略: {compound_instruction.execution_strategy}
认知负荷: {compound_instruction.cognitive_load}

操作步骤序列:
{chr(10).join(operations_summary)}

执行原则:
- 严格按照依赖关系顺序执行操作
- 确保每个步骤的结果为下一步提供正确基础
- 保持整体视觉连贯性和风格一致性
- 避免操作间的冲突和视觉不协调

技术要求:
- 每个原子操作都要达到专业质量标准
- 妥善处理操作间的过渡和融合效果
- 保持最终结果的整体性和完整性
- 考虑各操作对整体构图和色彩的影响

原始复合指令: "{compound_instruction.original_instruction}"

输出: 专业级多步骤操作的协调执行结果，实现复杂编辑任务的完整实现。"""
    
    def get_parser_statistics(self) -> Dict:
        """获取解析器统计信息"""
        return {
            "supported_operations": len(OperationType),
            "operation_patterns": sum(len(patterns) for patterns in self.operation_patterns.values()),
            "conjunction_patterns": len(self.conjunction_patterns),
            "dependency_rules": len(self.dependency_rules),
            "complexity_levels": len(CompoundComplexity),
            "max_cognitive_load": 7.0
        }


# 使用示例和测试
if __name__ == "__main__":
    parser = CompoundOperationsParser()
    
    # 测试用例
    test_instructions = [
        "remove the woman and dog. add a tiger drinking water",
        'change "Sweet Escape" to "Bagel Dreams", replace the popsicle with a bagel',
        "Make his face very fat, add the words \"Pweese\" beneath him",
        "remove the fireplace, change the color to purple",
        "turn both of the men into storm troopers"
    ]
    
    for instruction in test_instructions:
        result = parser.parse_compound_instruction(instruction)
        prompt = parser.generate_execution_prompt(result)
        
        print(f"\n原始指令: {instruction}")
        print(f"复杂度: {result.complexity_level.value}")
        print(f"原子操作数: {len(result.atomic_operations)}")
        print(f"执行策略: {result.execution_strategy}")
        print(f"认知负荷: {result.cognitive_load}")
        print(f"生成提示: {prompt[:200]}...")
        
        # 显示原子操作详情
        print("原子操作分解:")
        for i, op in enumerate(result.atomic_operations, 1):
            deps = f" (依赖: {op.dependencies})" if op.dependencies else ""
            print(f"  {i}. {op.operation_type.value}: {op.target_object} {op.modification_details}{deps}")