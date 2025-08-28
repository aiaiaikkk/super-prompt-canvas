"""
技术专业操作扩展模块 - Technical Professional Operations Extension
基于Kontext数据集发现的新兴技术需求，扩展原有6大专业场景
新增: 3D建模、深度处理、数字艺术、空间变换等高价值技术操作
"""

from typing import Dict, List, Tuple, Optional, Set
import re
from dataclasses import dataclass
from enum import Enum


class TechnicalOperationType(Enum):
    """技术操作类型"""
    DEPTH_PROCESSING = "depth_processing"         # 深度图处理 (8次)
    THREE_D_MODELING = "3d_modeling"              # 3D建模 (5次)
    DIGITAL_ART_EFFECTS = "digital_art_effects"   # 数字艺术效果 (14次)
    SPATIAL_TRANSFORMATION = "spatial_transformation"  # 空间变换 (17次)
    TECHNICAL_ANALYSIS = "technical_analysis"     # 技术分析 (3次)


@dataclass
class TechnicalOperationConfig:
    """技术操作配置"""
    operation_type: TechnicalOperationType
    market_demand: str  # "emerging", "growing", "established"
    technical_complexity: str  # "low", "medium", "high", "expert"
    frequency: float
    commercial_value: str  # "high", "medium", "low"
    examples: List[str]
    prompt_template: str
    prerequisites: List[str]
    output_specifications: Dict[str, str]


class TechnicalProfessionalOperations:
    """技术专业操作处理器"""
    
    def __init__(self):
        self.operations_config = self._initialize_technical_operations()
        self.depth_patterns = self._load_depth_processing_patterns()
        self.modeling_3d_patterns = self._load_3d_modeling_patterns()
        self.digital_art_patterns = self._load_digital_art_patterns()
        self.spatial_patterns = self._load_spatial_transformation_patterns()
        
        # 技术词汇库
        self.technical_vocabulary = self._load_technical_vocabulary()
    
    def _initialize_technical_operations(self) -> Dict[str, TechnicalOperationConfig]:
        """初始化技术操作配置"""
        return {
            "depth_processing": TechnicalOperationConfig(
                operation_type=TechnicalOperationType.DEPTH_PROCESSING,
                market_demand="emerging",
                technical_complexity="high",
                frequency=0.8,  # 8/1026
                commercial_value="high",
                examples=[
                    "depth map of this image",
                    "turn this into a grayscale depth map",
                    "create an oil painting using this depth map",
                    "using the depth map create an image of a toy plastic robot"
                ],
                prompt_template="""深度图处理专家: 执行基于深度信息的高级图像处理和3D视觉重建。

深度处理核心技术:
- 精确的深度信息提取和量化
- 基于深度的图层分离和重构
- 深度图到3D模型的转换技术
- 多视角深度信息融合处理

技术实现标准:
- 深度精度: 支持16位或32位深度精度
- 空间分辨率: 保持与源图像一致的分辨率
- 边缘保持: 确保物体边界的深度连续性
- 噪声控制: 有效抑制深度估计中的噪声

深度应用场景:
- 深度图生成: 从2D图像估计精确深度信息
- 3D重建: 基于深度图创建三维模型
- 景深模拟: 基于深度的焦点控制和模糊效果
- 空间分析: 物体间距离和空间关系分析

输出规范: 16位灰度深度图，近处为白色(255)，远处为黑色(0)，包含完整的空间深度信息。""",
                prerequisites=[
                    "计算机视觉基础", "深度估计算法", "3D几何知识", "图像处理专业技能"
                ],
                output_specifications={
                    "format": "16-bit grayscale depth map",
                    "near_color": "white (255)",
                    "far_color": "black (0)", 
                    "precision": "sub-pixel accuracy",
                    "edge_handling": "preserved boundaries"
                }
            ),
            
            "3d_modeling": TechnicalOperationConfig(
                operation_type=TechnicalOperationType.THREE_D_MODELING,
                market_demand="growing",
                technical_complexity="expert",
                frequency=0.5,  # 5/1026
                commercial_value="high",
                examples=[
                    "show this object as a 3d grayscale model in blender",
                    "turn into a 3d low poly asset",
                    "show object with wireframe topology visible",
                    "3d model with topology visible"
                ],
                prompt_template="""3D建模技术专家: 执行专业级3D模型生成和拓扑结构优化。

3D建模技术核心:
- 精确的几何拓扑结构构建
- 优化的多边形网格生成
- 专业的UV贴图坐标系统
- 标准的3D软件工作流程集成

建模技术规范:
- 拓扑结构: 四边形为主的清洁拓扑
- 面数控制: 根据用途优化多边形密度
- 边线流向: 遵循形体结构的自然流线
- 材质分离: 为不同材质区域预留UV空间

专业建模要求:
- Blender兼容性: 支持标准Blender工作流程
- 低多边形优化: 游戏/实时渲染级别的几何优化
- 拓扑可视化: 清晰展示wireframe和顶点分布
- 工业标准: 符合3D行业的建模规范和最佳实践

技术输出标准:
- 清洁的四边形拓扑结构
- 优化的面数和顶点分布
- 可编辑的几何体层次结构
- 标准的3D文件格式导出能力

输出: 专业级3D模型，包含优化拓扑、材质分区、可视化wireframe结构。""",
                prerequisites=[
                    "3D建模软件熟练", "拓扑学原理", "多边形建模技术", "UV贴图知识"
                ],
                output_specifications={
                    "topology": "quad-based clean topology",
                    "polygon_count": "optimized for usage",
                    "uv_mapping": "non-overlapping UV layout",
                    "software_compatibility": "Blender standard",
                    "file_formats": "OBJ, FBX, GLB support"
                }
            ),
            
            "digital_art_effects": TechnicalOperationConfig(
                operation_type=TechnicalOperationType.DIGITAL_ART_EFFECTS,
                market_demand="established",
                technical_complexity="medium",
                frequency=1.4,  # 14/1026
                commercial_value="medium",
                examples=[
                    "turn into pixel art",
                    "make it neon colors",
                    "turn into a neon sign on brick wall",
                    "recolor with neon colors"
                ],
                prompt_template="""数字艺术效果专家: 执行现代数字艺术风格和视觉特效创作。

数字艺术技术体系:
- 像素艺术: 精确的像素级控制和色彩量化
- 霓虹效果: 发光、辉光、色彩饱和度增强
- 赛博朋克风格: 未来主义色彩和科技感元素
- 数字故障: Glitch效果和数据损坏美学

像素艺术专业技法:
- 色彩量化: 有限调色板的精确色彩管理
- 像素完美对齐: 严格的像素边界控制
- 抗锯齿处理: 选择性的边缘平滑技术
- 分辨率控制: 多层次分辨率的艺术表现

霓虹发光技术:
- 发光内核: 高饱和度的核心色彩
- 辉光扩散: 渐变式的光晕扩散效果
- 色彩混合: 多重发光色彩的层次混合
- 环境反射: 霓虹光对周围环境的影响模拟

商业应用价值:
- 品牌视觉: 独特的数字艺术品牌形象
- 游戏美术: 像素风格和霓虹风格游戏资源
- 社交媒体: 吸引眼球的视觉内容创作
- 数字营销: 现代感强烈的推广物料

输出: 高品质数字艺术作品，具备强烈的现代视觉冲击力和商业应用价值。""",
                prerequisites=[
                    "数字艺术理论", "色彩理论", "视觉效果制作", "品牌设计经验"
                ],
                output_specifications={
                    "pixel_art_dpi": "72-300 DPI scalable",
                    "neon_glow": "multi-layer glow effects",
                    "color_profile": "sRGB high saturation",
                    "format_support": "PNG, SVG vector support",
                    "commercial_use": "print and digital ready"
                }
            ),
            
            "spatial_transformation": TechnicalOperationConfig(
                operation_type=TechnicalOperationType.SPATIAL_TRANSFORMATION,
                market_demand="growing",
                technical_complexity="medium",
                frequency=1.7,  # 17/1026
                commercial_value="medium",
                examples=[
                    "zoom in on the man",
                    "camera zoomed out showing more of scene",
                    "rotate this object counterclockwise",
                    "turn object to face camera directly"
                ],
                prompt_template="""空间变换技术专家: 执行精确的相机控制和空间几何变换操作。

相机控制技术:
- 精确的焦距控制和画面裁切
- 相机位置的三维空间调整
- 透视关系的数学计算和校正
- 景深和焦点的专业控制

空间几何变换:
- 旋转: 三维空间的精确角度控制
- 缩放: 保持长宽比的智能缩放技术
- 平移: 空间位置的精确定位
- 透视校正: 几何失真的数学修正

透视和构图原理:
- 单点透视: 建筑和室内空间的标准透视
- 两点透视: 建筑外观的专业透视处理
- 三点透视: 极端视角的透视校正
- 构图法则: 黄金分割和三分法则应用

技术实现标准:
- 亚像素精度: 精确到0.1像素的位置控制
- 插值算法: 高质量的图像重采样技术
- 边缘处理: 变换后的边缘抗锯齿处理
- 质量保持: 变换过程中的图像质量维护

商业应用场景:
- 产品摄影: 完美角度的产品展示
- 建筑摄影: 专业的建筑空间表现
- 人像摄影: 最佳构图的人像调整
- 全景摄影: 广角和全景的空间处理

输出: 专业级空间变换结果，保持最高图像质量和准确的几何关系。""",
                prerequisites=[
                    "几何学基础", "透视原理", "摄影构图", "图像处理算法"
                ],
                output_specifications={
                    "precision": "sub-pixel accuracy",
                    "quality_preservation": "minimal quality loss",
                    "geometric_accuracy": "mathematically correct",
                    "edge_handling": "anti-aliased edges",
                    "format_compatibility": "full format support"
                }
            ),
            
            "technical_analysis": TechnicalOperationConfig(
                operation_type=TechnicalOperationType.TECHNICAL_ANALYSIS,
                market_demand="emerging",
                technical_complexity="expert",
                frequency=0.3,  # 3/1026
                commercial_value="high",
                examples=[
                    "analyze technical specifications of image",
                    "provide detailed technical breakdown",
                    "generate technical documentation"
                ],
                prompt_template="""技术分析专家: 执行专业级图像技术分析和规格文档生成。

技术分析维度:
- 图像质量评估: 分辨率、色彩深度、压缩率分析
- 几何结构分析: 透视、比例、空间关系评估
- 色彩科学分析: 色域、色温、色彩管理检测
- 技术规格提取: 元数据、拍摄参数、设备信息

专业分析工具:
- 直方图分析: RGB和HSV色彩分布分析
- 频域分析: FFT变换的频率特征分析
- 边缘检测: Canny、Sobel等算法的结构分析
- 纹理分析: GLCM纹理特征的定量分析

技术文档标准:
- ISO标准兼容: 符合国际图像质量标准
- 专业术语使用: 准确的技术术语和测量单位
- 量化指标: 具体的数值指标和评估分数
- 改进建议: 基于分析结果的优化建议

输出规范:
- 完整技术报告: 多维度的技术分析文档
- 可视化图表: 直方图、频谱图等分析图表
- 改进方案: 具体的技术改进路径
- 标准符合性: 行业标准的符合性评估

商业价值:
- 质量控制: 企业级图像质量管理
- 技术咨询: 专业的图像技术咨询服务
- 标准制定: 内部图像质量标准的制定
- 问题诊断: 图像技术问题的专业诊断

输出: 专业级技术分析报告，提供全面的图像技术评估和优化建议。""",
                prerequisites=[
                    "图像处理理论", "色彩科学", "计算机视觉", "数据分析", "技术文档写作"
                ],
                output_specifications={
                    "report_format": "professional technical documentation",
                    "analysis_depth": "multi-dimensional assessment",
                    "quantitative_metrics": "numerical quality indicators",
                    "visualization": "charts and analytical graphics",
                    "actionable_recommendations": "specific improvement plans"
                }
            )
        }
    
    def _load_depth_processing_patterns(self) -> Dict[str, List[str]]:
        """加载深度处理模式"""
        return {
            "depth_map_keywords": [
                "depth map", "depth", "grayscale depth", "depth information",
                "z-buffer", "distance map", "depth channel"
            ],
            "depth_operations": [
                "create depth map", "generate depth", "extract depth",
                "depth analysis", "depth reconstruction", "depth enhancement"
            ],
            "depth_applications": [
                "3d reconstruction", "depth of field", "parallax effect",
                "volume rendering", "stereo vision", "spatial analysis"
            ]
        }
    
    def _load_3d_modeling_patterns(self) -> Dict[str, List[str]]:
        """加载3D建模模式"""
        return {
            "modeling_software": [
                "blender", "maya", "3ds max", "cinema 4d", "zbrush",
                "houdini", "modo", "lightwave"
            ],
            "topology_terms": [
                "topology", "wireframe", "mesh", "vertices", "edges", "faces",
                "quads", "triangles", "polygon", "subdivision"
            ],
            "modeling_types": [
                "low poly", "high poly", "retopology", "sculpting",
                "hard surface", "organic modeling", "procedural"
            ],
            "3d_formats": [
                "obj", "fbx", "gltf", "collada", "3ds", "ply", "stl"
            ]
        }
    
    def _load_digital_art_patterns(self) -> Dict[str, List[str]]:
        """加载数字艺术模式"""
        return {
            "pixel_art": [
                "pixel art", "8-bit", "16-bit", "retro", "arcade",
                "pixelated", "low resolution", "dithering"
            ],
            "neon_effects": [
                "neon", "glow", "fluorescent", "bright", "vivid",
                "electric", "cyberpunk", "synthwave"
            ],
            "digital_styles": [
                "digital art", "cg", "computer graphics", "digital painting",
                "concept art", "matte painting", "photobash"
            ],
            "color_schemes": [
                "neon colors", "electric blue", "hot pink", "lime green",
                "cyber colors", "retrowave", "vaporwave"
            ]
        }
    
    def _load_spatial_transformation_patterns(self) -> Dict[str, List[str]]:
        """加载空间变换模式"""
        return {
            "camera_operations": [
                "zoom in", "zoom out", "camera", "close up", "wide shot",
                "pan", "tilt", "dolly", "track"
            ],
            "rotation_operations": [
                "rotate", "turn", "spin", "clockwise", "counterclockwise",
                "flip", "mirror", "reverse"
            ],
            "perspective_operations": [
                "perspective", "angle", "viewpoint", "view", "face camera",
                "front view", "side view", "top view", "isometric"
            ],
            "spatial_relationships": [
                "in front", "behind", "above", "below", "left", "right",
                "center", "corner", "edge", "middle"
            ]
        }
    
    def _load_technical_vocabulary(self) -> Dict[str, List[str]]:
        """加载技术词汇库"""
        return {
            "quality_terms": [
                "high resolution", "4k", "8k", "ultra hd", "professional quality",
                "commercial grade", "broadcast quality", "archival quality"
            ],
            "technical_terms": [
                "algorithm", "processing", "analysis", "optimization", "enhancement",
                "reconstruction", "synthesis", "generation", "transformation"
            ],
            "measurement_units": [
                "pixels", "dpi", "ppi", "megapixels", "bit depth", "color space",
                "gamma", "contrast ratio", "dynamic range"
            ]
        }
    
    def detect_technical_operation_type(self, instruction: str) -> Optional[TechnicalOperationType]:
        """检测技术操作类型"""
        instruction_lower = instruction.lower()
        
        # 检查深度处理
        depth_keywords = []
        for category in self.depth_patterns.values():
            depth_keywords.extend(category)
        if any(keyword in instruction_lower for keyword in depth_keywords):
            return TechnicalOperationType.DEPTH_PROCESSING
        
        # 检查3D建模
        modeling_keywords = []
        for category in self.modeling_3d_patterns.values():
            modeling_keywords.extend(category)
        if any(keyword in instruction_lower for keyword in modeling_keywords):
            return TechnicalOperationType.THREE_D_MODELING
        
        # 检查数字艺术效果
        digital_keywords = []
        for category in self.digital_art_patterns.values():
            digital_keywords.extend(category)
        if any(keyword in instruction_lower for keyword in digital_keywords):
            return TechnicalOperationType.DIGITAL_ART_EFFECTS
        
        # 检查空间变换
        spatial_keywords = []
        for category in self.spatial_patterns.values():
            spatial_keywords.extend(category)
        if any(keyword in instruction_lower for keyword in spatial_keywords):
            return TechnicalOperationType.SPATIAL_TRANSFORMATION
        
        # 检查技术分析
        analysis_indicators = ["analyze", "analysis", "technical", "specifications", "breakdown"]
        if any(indicator in instruction_lower for indicator in analysis_indicators):
            return TechnicalOperationType.TECHNICAL_ANALYSIS
        
        return None
    
    def generate_technical_prompt(self, instruction: str, 
                                operation_type: TechnicalOperationType) -> str:
        """生成技术操作提示"""
        config = self.operations_config.get(operation_type.value)
        if not config:
            return instruction
        
        # 分析技术要求
        technical_analysis = self._analyze_technical_requirements(instruction, operation_type)
        
        # 生成增强的技术指令
        enhanced_instruction = self._generate_technical_instruction(
            instruction, operation_type, technical_analysis
        )
        
        return f"""{config.prompt_template}

具体技术任务: {enhanced_instruction}

原始指令: "{instruction}"
技术类型: {operation_type.value}
市场需求: {config.market_demand}
技术复杂度: {config.technical_complexity}
商业价值: {config.commercial_value}
预期频率: {config.frequency}%

技术要求分析: {technical_analysis}

前置条件: {', '.join(config.prerequisites)}

输出规范:
{chr(10).join(f'- {key}: {value}' for key, value in config.output_specifications.items())}

执行要求: 严格按照专业技术标准执行，确保输出符合行业规范和商业应用要求。"""
    
    def _analyze_technical_requirements(self, instruction: str, 
                                      operation_type: TechnicalOperationType) -> str:
        """分析技术要求"""
        analysis_parts = []
        
        if operation_type == TechnicalOperationType.DEPTH_PROCESSING:
            if "depth map" in instruction.lower():
                analysis_parts.append("深度图生成需求")
            if "grayscale" in instruction.lower():
                analysis_parts.append("灰度深度表示")
            if "3d" in instruction.lower():
                analysis_parts.append("3D重建应用")
        
        elif operation_type == TechnicalOperationType.THREE_D_MODELING:
            if "blender" in instruction.lower():
                analysis_parts.append("Blender工作流程")
            if "wireframe" in instruction.lower():
                analysis_parts.append("拓扑结构可视化")
            if "low poly" in instruction.lower():
                analysis_parts.append("低多边形优化")
        
        elif operation_type == TechnicalOperationType.DIGITAL_ART_EFFECTS:
            if "pixel art" in instruction.lower():
                analysis_parts.append("像素艺术风格")
            if "neon" in instruction.lower():
                analysis_parts.append("霓虹发光效果")
            if "colors" in instruction.lower():
                analysis_parts.append("色彩处理需求")
        
        elif operation_type == TechnicalOperationType.SPATIAL_TRANSFORMATION:
            if "zoom" in instruction.lower():
                analysis_parts.append("焦距控制")
            if "rotate" in instruction.lower():
                analysis_parts.append("旋转变换")
            if "camera" in instruction.lower():
                analysis_parts.append("相机视角调整")
        
        return "; ".join(analysis_parts) if analysis_parts else "标准技术处理"
    
    def _generate_technical_instruction(self, instruction: str, 
                                       operation_type: TechnicalOperationType,
                                       technical_analysis: str) -> str:
        """生成技术指令"""
        base_instruction = f"Execute professional-grade {operation_type.value.replace('_', ' ')} operation: {instruction}"
        
        type_specific_requirements = {
            TechnicalOperationType.DEPTH_PROCESSING: 
                "Generate accurate depth information with precise spatial relationships.",
            TechnicalOperationType.THREE_D_MODELING:
                "Create clean topology with optimized polygon distribution.",
            TechnicalOperationType.DIGITAL_ART_EFFECTS:
                "Apply stylistic effects while maintaining visual coherence.",
            TechnicalOperationType.SPATIAL_TRANSFORMATION:
                "Ensure geometric accuracy and quality preservation.",
            TechnicalOperationType.TECHNICAL_ANALYSIS:
                "Provide comprehensive technical assessment with actionable insights."
        }
        
        specific_requirement = type_specific_requirements.get(
            operation_type, 
            "Apply standard professional technical processing."
        )
        
        return f"{base_instruction} {specific_requirement}"
    
    def get_technical_statistics(self) -> Dict:
        """获取技术操作统计信息"""
        total_frequency = sum(config.frequency for config in self.operations_config.values())
        
        high_value_operations = [
            config for config in self.operations_config.values()
            if config.commercial_value == "high"
        ]
        
        emerging_operations = [
            config for config in self.operations_config.values()
            if config.market_demand == "emerging"
        ]
        
        return {
            "total_coverage": f"{total_frequency}%",
            "operation_types": len(self.operations_config),
            "high_commercial_value": len(high_value_operations),
            "emerging_demand": len(emerging_operations),
            "technical_complexity_distribution": {
                complexity: len([
                    config for config in self.operations_config.values()
                    if config.technical_complexity == complexity
                ])
                for complexity in ["low", "medium", "high", "expert"]
            },
            "average_frequency": total_frequency / len(self.operations_config)
        }


# 使用示例和测试
if __name__ == "__main__":
    tech_ops = TechnicalProfessionalOperations()
    
    # 测试用例
    test_instructions = [
        "create a depth map of this image",
        "show this as a 3d model in blender with wireframe visible",
        "turn this into pixel art with neon colors",
        "zoom in on the subject and rotate 45 degrees clockwise",
        "analyze the technical quality of this photograph"
    ]
    
    for instruction in test_instructions:
        operation_type = tech_ops.detect_technical_operation_type(instruction)
        if operation_type:
            prompt = tech_ops.generate_technical_prompt(instruction, operation_type)
            print(f"\n指令: {instruction}")
            print(f"技术类型: {operation_type.value}")
            print(f"生成提示: {prompt[:300]}...")
        else:
            print(f"\n指令: {instruction} - 未检测到技术操作类型")