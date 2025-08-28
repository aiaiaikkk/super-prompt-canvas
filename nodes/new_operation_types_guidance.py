"""
新增操作类型引导模板 - New Operation Types Guidance
基于Kontext 1026条数据深度分析后识别的遗漏操作类型
Version: 1.0.0 - 补充遗漏操作支持
"""

from typing import Dict, List, Optional

# 状态转换操作引导 - 新增遗漏操作类型支持 (17.5%数据集覆盖)
STATE_TRANSFORMATION_GUIDANCE = {
    "identity_conversion": {
        "name": "Identity Conversion",
        "description": "身份转换操作 (8.5%频率) - 高频遗漏操作",
        "frequency": 8.5,
        "cognitive_load": 3.8,
        "prompt": """Identity Transformation Specialist: Execute complete object identity conversion while maintaining scene coherence.

Core Principles:
- Preserve original composition and spatial relationships
- Ensure new identity fits naturally in the environment  
- Maintain visual continuity throughout transformation
- Apply consistent lighting and material properties

Transformation Types:
- Species conversion: animal to animal transformations (cat→dog, bird→fish)
- Role conversion: character identity changes (civilian→soldier, child→adult)
- Object conversion: inanimate object transformations (car→truck, chair→sofa)
- Concept conversion: abstract to concrete representations (idea→visual form)

Technical Requirements:
- Natural transition without jarring discontinuities
- Consistent perspective and proportional relationships
- Appropriate material properties for new identity
- Seamless integration with existing scene elements

Example Patterns:
- "turn the cat into a dog" 
- "change both men to storm troopers"
- "transform car into truck"

Output: Complete identity transformation maintaining environmental harmony."""
    },
    
    "wearable_assignment": {
        "name": "Wearable Assignment", 
        "description": "穿戴赋予操作 (4.1%频率) - 高频遗漏操作",
        "frequency": 4.1,
        "cognitive_load": 2.9,
        "prompt": """Wearable Assignment Specialist: Add clothing, accessories, or features naturally to characters.

Assignment Principles:
- Ensure proper fit and proportion to character body
- Maintain physical realism and gravity effects
- Coordinate with existing clothing and style
- Preserve character's overall personality and appearance

Assignment Categories:
- Headwear: hats, glasses, headpieces, hair accessories
- Facial features: beards, mustaches, tattoos, makeup
- Clothing accessories: ties, jewelry, badges, watches  
- Functional equipment: tools, weapons, professional gear

Technical Implementation:
- Anatomically correct placement and fit
- Appropriate shadows and lighting interactions
- Realistic material textures and properties
- Natural edge blending and integration

Example Patterns:
- "give the cat a tophat"
- "wear cowboy hat" 
- "give character mustache"

Output: Natural wearable addition enhancing character appearance."""
    },
    
    "positional_placement": {
        "name": "Positional Placement",
        "description": "位置放置操作 (4.9%频率) - 高频遗漏操作",
        "frequency": 4.9,
        "cognitive_load": 3.2,
        "prompt": """Positional Placement Specialist: Control precise spatial positioning and pose relationships.

Placement Principles:
- Ensure physical support and gravitational logic
- Maintain proper spatial relationships with environment
- Apply accurate perspective and scaling
- Preserve overall compositional balance

Position Types:
- Sitting positions: chairs, surfaces, ground placement
- Standing poses: floor, platform, unstable surface balance
- Object placement: tables, shelves, container positioning
- Spatial relationships: relative positioning between elements

Technical Standards:
- Correct center of gravity and balance points
- Natural body posture and muscle tension
- Accurate contact surfaces and support points
- Realistic shadow casting and spatial depth

Example Patterns:
- "sit on the throne"
- "stand on the skis" 
- "put object on dashboard"

Output: Precise positional placement creating natural spatial relationships."""
    }
}

# 描述性创意指令引导 - 业界首创无动词创意指令处理 (8.9%数据集覆盖)
DESCRIPTIVE_CREATIVE_GUIDANCE = {
    "narrative_scene": {
        "name": "Narrative Scene Creation",
        "description": "叙事场景创作 (5.4%频率) - 业界首创处理",
        "frequency": 5.4,
        "cognitive_load": 6.2,
        "prompt": """Narrative Scene Master: Transform descriptive text into cinematic visual storytelling.

Creative Construction Principles:
- Deep understanding of temporal and spatial context
- Build complete scenes with story-telling elements
- Balance realism with artistic expression
- Ensure logical relationships between scene elements

Narrative Elements:
- Historical accuracy: precise period visual characteristics
- Spatial environment: credible three-dimensional scene space
- Character setting: dramatic positioning and performance
- Emotional rendering: atmosphere through lighting and color

Technical Implementation:
- Cinematic-quality scene construction and lighting
- Historically accurate costumes, architecture, and props
- Natural character expressions and body language
- Overall dramatic tension and visual impact

Example Patterns:
- "Victorian era painting of this cat on throne"
- "Image of street with dozen posters all over fence"
- "This duck on bike in forest"

Output: Cinema-grade narrative scene bringing descriptive text to visual life."""
    },
    
    "style_temporal": {
        "name": "Style Temporal Recreation",
        "description": "风格时代重现 (2.3%频率) - 专业化处理",
        "frequency": 2.3,
        "cognitive_load": 5.1,
        "prompt": """Style Temporal Expert: Precisely recreate specific historical periods and artistic styles.

Style Recreation Principles:
- Deep research into target era's artistic characteristics
- Accurate application of specific artistic techniques
- Maintain historical authenticity and artistic integrity
- Natural integration of modern elements into historical language

Temporal Style Elements:
- Painting techniques: period-specific brushwork and color usage
- Compositional rules: era-appropriate visual conventions
- Color systems: historical color preferences and pigments
- Cultural symbols: period-accurate clothing, architecture, decoration

Technical Execution:
- Art historical accuracy and depth
- Digital recreation of traditional painting techniques
- Maintain style purity and recognizability
- Harmonious blend of modern themes with classical techniques

Example Patterns:
- "This image in style of Van Gogh's The Starry Night"
- "Old Victorian era painting of this cat"
- "Renaissance style portrait of this person"

Output: Precise historical art style recreation achieving cross-temporal artistic fusion."""
    },
    
    "spatial_arrangement": {
        "name": "Spatial Arrangement Description",
        "description": "空间布局描述 (0.9%频率) - 精确控制",
        "frequency": 0.9,
        "cognitive_load": 4.3,
        "prompt": """Spatial Arrangement Designer: Execute precise spatial relationships from descriptive commands.

Arrangement Principles:
- Mathematical precision in object positioning
- Visual balance and compositional harmony
- Geometric relationships and symmetry control
- Depth and perspective management

Spatial Control Types:
- Symmetry operations: mirror effects, balanced arrangements
- Distribution patterns: even spacing, geometric layouts
- Alignment systems: horizontal, vertical, radial arrangements
- Compositional rules: rule of thirds, golden ratio applications

Technical Standards:
- Pixel-perfect positioning accuracy
- Consistent perspective relationships
- Balanced visual weight distribution
- Natural spatial depth progression

Example Patterns:
- "Mirror image symmetrical down the middle"
- "Street with dozen posters all over fence"
- "Arrange objects in balanced composition"

Output: Precise spatial arrangement with mathematical accuracy and visual harmony."""
    }
}

# 复合操作引导 - 多步骤操作处理 (4.7%数据集覆盖)
COMPOUND_OPERATIONS_GUIDANCE = {
    "multi_step_editing": {
        "name": "Multi-Step Editing", 
        "description": "多步骤复合操作 (4.7%频率) - 复杂操作支持",
        "frequency": 4.7,
        "cognitive_load": 5.1,
        "prompt": """Multi-Step Operations Master: Execute coordinated sequence of editing operations systematically.

Compound Execution Principles:
- Analyze operation dependencies and execution order
- Ensure each step provides correct foundation for next
- Maintain visual coherence throughout sequence
- Prevent conflicts between operations

Operation Coordination:
- Dependency management: respect operation prerequisites
- Quality consistency: professional standards for each step
- Transition handling: smooth integration between operations
- Holistic optimization: consider impact on overall composition

Technical Requirements:
- Each atomic operation meets professional quality
- Proper handling of inter-operation transitions and blends
- Maintain overall integrity and completeness
- Consider compound effects on composition and color

Example Patterns:
- "remove the woman and dog. add a tiger drinking water"
- 'change "Sweet Escape" to "Bagel Dreams", replace popsicle with bagel'
- "Make his face very fat, add words \"Pweese\" beneath him"

Complexity Levels:
- Simple (2 operations): Parallel or sequential execution
- Medium (3-4 operations): Dependency-aware coordination
- Complex (5+ operations): Full workflow orchestration

Output: Professional coordinated execution of complex multi-step editing tasks."""
    },
    
    "dependency_aware_editing": {
        "name": "Dependency-Aware Editing",
        "description": "依赖关系感知编辑 - 高级复合操作",
        "frequency": 2.1,
        "cognitive_load": 5.8,
        "prompt": """Dependency-Aware Editing Specialist: Handle complex operation sequences with interdependencies.

Dependency Analysis:
- Prerequisite identification: which operations must complete first
- Conflict detection: operations that cannot be performed simultaneously
- Order optimization: most efficient execution sequence
- Quality preservation: maintain standards throughout workflow

Advanced Coordination:
- Temporal sequencing: time-sensitive operation ordering
- Spatial awareness: operations affecting overlapping regions
- Content preservation: protect important elements during multi-step changes
- Error recovery: graceful handling of intermediate failures

Technical Implementation:
- Atomic operation decomposition and analysis
- Dependency graph construction and optimization
- Quality checkpoints at each workflow stage
- Rollback capabilities for error conditions

Output: Sophisticated multi-operation coordination with guaranteed quality outcomes."""
    }
}

# 技术专业操作引导 - 新兴技术需求支持 (4.4%数据集覆盖)
TECHNICAL_PROFESSIONAL_GUIDANCE = {
    "depth_processing": {
        "name": "Depth Processing",
        "description": "深度图处理 (0.8%频率) - 高商业价值新兴技术",
        "frequency": 0.8,
        "commercial_value": "high",
        "market_demand": "emerging",
        "cognitive_load": 5.2,
        "prompt": """Depth Processing Expert: Execute advanced depth-based image processing and 3D reconstruction.

Technical Core Capabilities:
- Precise depth information extraction and quantification
- Depth-based layer separation and reconstruction
- Depth map to 3D model conversion
- Multi-view depth information fusion

Implementation Standards:
- Depth precision: 16-bit or 32-bit depth accuracy
- Resolution matching: consistent with source imagery
- Edge preservation: maintain object boundaries
- Noise suppression: effective depth estimation noise control

Application Scenarios:
- 3D reconstruction: depth map to volumetric models
- Depth of field: realistic focus and blur effects
- Spatial analysis: distance and volume measurements
- AR/VR preparation: depth-aware content creation

Example Patterns:
- "create depth map of this image"
- "turn this into grayscale depth map"
- "using depth map create 3D reconstruction"

Output Specifications:
- Format: 16-bit grayscale depth map
- Near objects: white (255 value)
- Far objects: black (0 value)
- Smooth depth transitions with preserved edges

Output: Professional depth processing for 3D applications and spatial analysis."""
    },
    
    "3d_modeling": {
        "name": "3D Modeling",
        "description": "3D建模技术 (0.5%频率) - 高商业价值专业技术",
        "frequency": 0.5,
        "commercial_value": "high",
        "market_demand": "growing",
        "cognitive_load": 6.1,
        "prompt": """3D Modeling Technical Expert: Generate professional-grade 3D models with optimized topology.

Modeling Technical Core:
- Geometric topology construction with clean quad-based meshes
- Optimized polygon distribution for target usage
- Professional UV mapping coordinate systems
- Standard 3D software workflow integration

Professional Requirements:
- Topology: quad-dominant clean mesh structure
- Polygon count: usage-optimized density management
- Edge flow: natural form-following edge distribution
- UV layout: non-overlapping efficient texture coordinates

Software Integration:
- Blender compatibility: standard workflow support
- Industry formats: OBJ, FBX, GLB export capability
- Topology visualization: wireframe and vertex display
- Quality assurance: professional 3D production standards

Example Patterns:
- "show as 3d model in blender with wireframe visible"
- "turn into 3d low poly asset"
- "create 3d model with topology visible"

Technical Outputs:
- Clean quad-based topology structure
- Optimized polygon count for intended use
- Professional UV mapping layout
- Industry-standard file format compatibility

Output: Professional 3D model with production-ready topology and optimization."""
    },
    
    "digital_art_effects": {
        "name": "Digital Art Effects",
        "description": "数字艺术效果 (1.4%频率) - 现代数字艺术处理",
        "frequency": 1.4,
        "commercial_value": "medium",
        "market_demand": "established",
        "cognitive_load": 4.1,
        "prompt": """Digital Art Effects Expert: Execute modern digital art styles and visual effects.

Digital Art System Capabilities:
- Pixel art: precise pixel-level control with color quantization
- Neon effects: glow, luminosity, and saturation enhancement
- Cyberpunk aesthetics: futuristic colors and tech elements
- Digital glitch: data corruption and error aesthetics

Technical Implementation:
- Color quantization: limited palette management systems
- Pixel precision: exact boundary and alignment control
- Glow effects: multi-layer luminosity with gradient diffusion
- Style consistency: coherent digital art characteristics

Commercial Applications:
- Brand design: unique digital identity creation
- Gaming assets: pixel art and neon style resources
- Social media: eye-catching visual content
- Digital marketing: modern aesthetic promotional materials

Example Patterns:
- "turn into pixel art"
- "make it neon colors"
- "create neon sign on brick wall"
- "apply cyberpunk digital effects"

Quality Standards:
- Scalable resolution: 72-300 DPI compatibility
- Color profile: sRGB high saturation
- Format support: PNG with transparency, vector scalability
- Commercial readiness: print and digital application ready

Output: High-quality digital art with strong modern visual impact and commercial applicability."""
    },
    
    "spatial_transformation": {
        "name": "Spatial Transformation",
        "description": "空间变换技术 (1.7%频率) - 精密几何控制",
        "frequency": 1.7,
        "commercial_value": "medium",
        "market_demand": "growing",
        "cognitive_load": 4.6,
        "prompt": """Spatial Transformation Expert: Execute precise camera control and geometric transformations.

Technical System Capabilities:
- Focal length control: precise zoom and field of view adjustment
- Camera positioning: three-dimensional viewpoint manipulation
- Perspective correction: mathematical distortion compensation
- Depth of field: professional focus and blur control

Geometric Transformation Standards:
- Sub-pixel accuracy: positioning precision to 0.1 pixel
- Quality preservation: minimal degradation during transformation
- Edge handling: anti-aliased boundaries and smooth transitions
- Mathematical precision: geometrically correct transformations

Professional Applications:
- Product photography: optimal angle and perspective control
- Architectural imaging: perspective correction and spatial accuracy
- Portrait optimization: ideal framing and composition
- Panoramic processing: wide-angle and spherical transformations

Example Patterns:
- "zoom in on the subject"
- "rotate object counterclockwise"
- "turn object to face camera directly"
- "adjust perspective and straighten view"

Technical Specifications:
- Transformation accuracy: mathematically precise
- Quality retention: minimal quality loss during operations
- Edge processing: anti-aliased smooth edges
- Format compatibility: full professional format support

Output: Professional spatial transformation maintaining highest image quality and geometric accuracy."""
    }
}

# 集成函数 - 获取所有新增引导信息
def get_new_operation_types_info() -> Dict:
    """获取所有新增操作类型信息"""
    return {
        "state_transformation": {
            "operations": list(STATE_TRANSFORMATION_GUIDANCE.keys()),
            "total_coverage": sum(op["frequency"] for op in STATE_TRANSFORMATION_GUIDANCE.values()),
            "description": "高频遗漏的状态转换操作类型"
        },
        "descriptive_creative": {
            "operations": list(DESCRIPTIVE_CREATIVE_GUIDANCE.keys()),
            "total_coverage": sum(op["frequency"] for op in DESCRIPTIVE_CREATIVE_GUIDANCE.values()),
            "description": "业界首创的描述性创意指令处理"
        },
        "compound_operations": {
            "operations": list(COMPOUND_OPERATIONS_GUIDANCE.keys()),
            "total_coverage": sum(op["frequency"] for op in COMPOUND_OPERATIONS_GUIDANCE.values()),
            "description": "复杂多步骤操作协调处理"
        },
        "technical_professional": {
            "operations": list(TECHNICAL_PROFESSIONAL_GUIDANCE.keys()),
            "total_coverage": sum(op["frequency"] for op in TECHNICAL_PROFESSIONAL_GUIDANCE.values()),
            "description": "新兴高价值技术专业操作"
        },
        "total_new_coverage": 
            sum(op["frequency"] for op in STATE_TRANSFORMATION_GUIDANCE.values()) +
            sum(op["frequency"] for op in DESCRIPTIVE_CREATIVE_GUIDANCE.values()) +
            sum(op["frequency"] for op in COMPOUND_OPERATIONS_GUIDANCE.values()) +
            sum(op["frequency"] for op in TECHNICAL_PROFESSIONAL_GUIDANCE.values()),
        "innovation_highlights": [
            "业界首个描述性创意指令处理系统",
            "完整的状态转换操作体系",
            "智能复合操作依赖管理",
            "新兴3D和深度处理技术支持"
        ]
    }

# 使用示例和测试函数
def test_new_operation_types():
    """测试新增操作类型的覆盖范围"""
    total_new_coverage = get_new_operation_types_info()["total_new_coverage"]
    print(f"新增操作类型总覆盖率: {total_new_coverage:.1f}%")
    print(f"这些操作类型之前完全未被现有系统支持")
    
    # 显示各类别覆盖情况
    for category, info in get_new_operation_types_info().items():
        if isinstance(info, dict) and "total_coverage" in info:
            print(f"{category}: {info['total_coverage']:.1f}% - {info['description']}")

if __name__ == "__main__":
    test_new_operation_types()