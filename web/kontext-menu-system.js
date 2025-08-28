/**
 * Kontext菜单系统 - 基于1026样本数据的选项卡和双下拉框系统
 * Version: 3.0.0 - 集成三层约束架构优化
 */

// Kontext菜单系统命名空间
window.KontextMenuSystem = window.KontextMenuSystem || {
    version: '3.0.0',
    
    // 基于1026数据集分析的三层约束架构
    ENHANCED_CONSTRAINT_SYSTEM: {
        // 操作特异性约束（第一层）
        operation_constraints: {
            add_operations: {
                technical: [
                    "layer blending using screen or overlay modes for natural integration",
                    "edge feathering with 2-3 pixel soft transition zones",
                    "shadow casting analysis for realistic placement depth",
                    "color temperature matching to maintain lighting consistency",
                    "resolution scaling maintaining pixel density standards"
                ],
                aesthetic: [
                    "compositional balance following rule of thirds principles",
                    "visual hierarchy enhancement through strategic placement",
                    "color harmony integration with existing palette",
                    "style consistency matching original artistic direction",
                    "focal point creation without disrupting main subject"
                ],
                quality: [
                    "seamless edge integration without visible boundaries",
                    "natural lighting coherence across all elements",
                    "material properties consistency for believable results",
                    "edge cleanup with anti-aliasing optimization",
                    "professional quality output ready for publication"
                ]
            },
            color_modification: {
                technical: [
                    "color space management preserving ICC profile accuracy",
                    "white balance precision maintaining neutral references",
                    "saturation control preventing clipping in any channel",
                    "hue shift accuracy maintaining color relationships",
                    "luminance preservation during chromatic adjustments"
                ],
                aesthetic: [
                    "emotional color expression enhancing intended mood",
                    "visual hierarchy reinforcement through color contrast",
                    "atmospheric mood creation using temperature shifts",
                    "brand color consistency maintaining identity standards",
                    "harmonic color relationships following theory principles"
                ],
                quality: [
                    "natural color transition without banding artifacts",
                    "detail retention during color space conversions",
                    "skin tone authenticity preservation in portraits",
                    "material color accuracy for product photography",
                    "color grading precision matching professional standards"
                ]
            },
            remove_operations: {
                technical: [
                    "content-aware fill algorithms for seamless background reconstruction",
                    "edge detection precision preventing unwanted deletions",
                    "texture synthesis matching surrounding area patterns",
                    "frequency separation maintaining detail consistency",
                    "artifact prevention using advanced inpainting techniques"
                ],
                aesthetic: [
                    "compositional rebalancing after element removal",
                    "visual flow optimization maintaining viewer engagement",
                    "negative space utilization for improved design",
                    "focus redirection to primary subjects",
                    "artistic integrity preservation during modifications"
                ],
                quality: [
                    "invisible removal traces with perfect background matching",
                    "natural texture continuation across edited boundaries",
                    "lighting consistency throughout reconstructed areas",
                    "edge refinement eliminating selection artifacts",
                    "professional standard output suitable for commercial use"
                ]
            },
            shape_operations: {
                technical: [
                    "geometric transformation maintaining perspective accuracy",
                    "mesh deformation using controlled vertex manipulation",
                    "proportional scaling preserving anatomical correctness",
                    "edge warping with controlled distortion boundaries",
                    "vector path precision for clean geometric forms"
                ],
                aesthetic: [
                    "form enhancement improving visual appeal",
                    "silhouette optimization for stronger recognition",
                    "proportional harmony following golden ratio principles",
                    "dynamic pose creation increasing visual interest",
                    "style consistency matching overall artistic vision"
                ],
                quality: [
                    "smooth transformation curves preventing angular artifacts",
                    "detail preservation during geometric modifications",
                    "natural deformation maintaining believable physics",
                    "edge quality optimization for crisp boundaries",
                    "professional execution suitable for commercial applications"
                ]
            },
            text_operations: {
                technical: [
                    "font rendering at optimal resolution preventing pixelation",
                    "kerning adjustment for professional typography standards",
                    "text path precision maintaining perfect alignment",
                    "layer blending for realistic text integration",
                    "Unicode support ensuring international character compatibility"
                ],
                aesthetic: [
                    "typography hierarchy establishing clear information priority",
                    "font selection matching overall design aesthetic",
                    "color contrast optimization for maximum readability",
                    "spatial relationship balance with surrounding elements",
                    "style consistency maintaining brand identity standards"
                ],
                quality: [
                    "crisp text rendering without aliasing artifacts",
                    "perfect integration with background elements",
                    "consistent baseline alignment across all text elements",
                    "professional typography standards for commercial use",
                    "scalable output maintaining clarity at all sizes"
                ]
            },
            background_operations: {
                technical: [
                    "perspective matching ensuring realistic spatial relationships",
                    "lighting analysis for consistent illumination direction",
                    "color temperature coordination maintaining atmospheric unity",
                    "depth of field simulation creating realistic focus planes",
                    "edge masking precision for seamless subject integration"
                ],
                aesthetic: [
                    "atmospheric mood enhancement supporting narrative goals",
                    "compositional strength through strategic background design",
                    "visual depth creation using atmospheric perspective",
                    "color harmony establishment supporting overall palette",
                    "stylistic consistency maintaining artistic coherence"
                ],
                quality: [
                    "seamless subject integration without visible compositing edges",
                    "natural environmental lighting throughout the scene",
                    "realistic spatial relationships maintaining believability",
                    "professional composition standards for commercial applications",
                    "high-resolution output suitable for large format printing"
                ]
            }
        },
        
        // 认知负荷自适应约束（第二层）
        cognitive_constraints: {
            low_load_2_7: [
                "single operation focus maintaining cognitive simplicity",
                "clear instruction interpretation preventing confusion",
                "immediate visual feedback for quick result assessment",
                "minimal parameter adjustment reducing decision complexity",
                "straightforward execution path minimizing cognitive overhead"
            ],
            medium_load_3_2: [
                "dual-focus task management balancing multiple objectives",
                "moderate complexity parameter coordination",
                "sequential step execution requiring planning ahead",
                "quality-speed optimization requiring balanced decisions",
                "intermediate skill requirement for optimal results"
            ],
            medium_high_load_3_5: [
                "multi-element coordination requiring sustained attention",
                "complex parameter interaction management",
                "artistic judgment integration with technical precision",
                "iterative refinement process requiring patience",
                "advanced technique application for professional results"
            ],
            high_load_5_8: [
                "comprehensive system thinking managing multiple variables",
                "expert-level judgment integration across all aspects",
                "creative problem-solving for unique challenges",
                "advanced technique synthesis creating innovative solutions",
                "professional mastery demonstration through complex execution"
            ]
        },
        
        // 应用场景约束（第三层）
        context_constraints: {
            product_showcase: [
                "commercial photography standards ensuring professional presentation",
                "brand consistency maintenance supporting marketing objectives",
                "detail clarity optimization for product feature visibility",
                "clean background approach minimizing visual distractions",
                "lighting optimization highlighting key product attributes"
            ],
            creative_expression: [
                "artistic vision support enabling creative freedom",
                "emotional impact enhancement through strategic modifications",
                "style experimentation encouraging innovative approaches",
                "personal aesthetic development supporting individual voice",
                "creative boundary pushing while maintaining technical quality"
            ],
            marketing_communication: [
                "message clarity optimization ensuring effective communication",
                "audience engagement enhancement through strategic visual choices",
                "brand alignment maintenance supporting marketing objectives",
                "conversion optimization through persuasive visual elements",
                "market positioning support through strategic presentation"
            ]
        }
    },
    
    // 基于操作类型的固定约束和修饰词系统
    OPERATION_SPECIFIC_CONSTRAINTS: {
        // 对象删除操作
        object_removal: {
            constraints: [
                { zh: "边缘检测精确防止误删", en: "edge detection precision preventing unwanted deletions" },
                { zh: "内容感知填充无缝修复", en: "content-aware fill algorithms for seamless background reconstruction" }, 
                { zh: "保持周围纹理一致", en: "texture synthesis matching surrounding area patterns" },
                { zh: "频率分离保持细节", en: "frequency separation maintaining detail consistency" }
            ],
            modifiers: [
                { zh: "精确", en: "precise" },
                { zh: "清洁", en: "clean" },
                { zh: "自然", en: "natural" },
                { zh: "专业", en: "professional" }
            ]
        },

        // 对象替换操作
        object_replacement: {
            constraints: [
                { zh: "尺寸比例精确匹配", en: "scale and proportion accurate matching" },
                { zh: "光照一致性保持", en: "lighting consistency throughout replacement" },
                { zh: "透视角度准确对齐", en: "perspective angle precise alignment" },
                { zh: "材质属性自然融合", en: "material properties natural integration" }
            ],
            modifiers: [
                { zh: "无缝", en: "seamless" },
                { zh: "自然", en: "natural" },
                { zh: "平滑", en: "smooth" },
                { zh: "专业", en: "professional" }
            ]
        },

        // 颜色修改操作
        color_modification: {
            constraints: [
                { zh: "色彩空间管理准确", en: "color space management preserving ICC profile accuracy" },
                { zh: "白平衡精度保持", en: "white balance precision maintaining neutral references" },
                { zh: "饱和度控制防溢出", en: "saturation control preventing clipping in any channel" },
                { zh: "色相偏移准确维持", en: "hue shift accuracy maintaining color relationships" }
            ],
            modifiers: [
                { zh: "鲜艳", en: "vibrant" },
                { zh: "和谐", en: "harmonious" },
                { zh: "平衡", en: "balanced" },
                { zh: "自然", en: "natural" }
            ]
        },

        // 形状操作
        shape_operations: {
            constraints: [
                { zh: "几何变换保持透视", en: "geometric transformation maintaining perspective accuracy" },
                { zh: "网格变形控制顶点", en: "mesh deformation using controlled vertex manipulation" },
                { zh: "比例缩放解剖正确", en: "proportional scaling preserving anatomical correctness" },
                { zh: "边缘扭曲控制边界", en: "edge warping with controlled distortion boundaries" }
            ],
            modifiers: [
                { zh: "平滑", en: "smooth" },
                { zh: "精确", en: "precise" },
                { zh: "自然", en: "natural" },
                { zh: "优雅", en: "elegant" }
            ]
        },

        // 添加操作
        add_operations: {
            constraints: [
                { zh: "图层混合屏幕叠加", en: "layer blending using screen or overlay modes for natural integration" },
                { zh: "边缘羽化软过渡", en: "edge feathering with 2-3 pixel soft transition zones" },
                { zh: "阴影投射深度分析", en: "shadow casting analysis for realistic placement depth" },
                { zh: "色温匹配保持一致", en: "color temperature matching to maintain lighting consistency" }
            ],
            modifiers: [
                { zh: "和谐", en: "harmonious" },
                { zh: "自然", en: "natural" },
                { zh: "平衡", en: "balanced" },
                { zh: "增强", en: "enhanced" }
            ]
        },

        // 默认通用
        default: {
            constraints: [
                { zh: "保持自然外观", en: "maintain natural appearance" },
                { zh: "确保技术精度", en: "ensure technical precision" },
                { zh: "维持视觉连贯性", en: "maintain visual coherence" },
                { zh: "专业质量标准", en: "professional quality standards" }
            ],
            modifiers: [
                { zh: "美丽", en: "beautiful" },
                { zh: "详细", en: "detailed" },
                { zh: "自然", en: "natural" },
                { zh: "优质", en: "high-quality" }
            ]
        }
    },

    // 中英文约束对照表（前端显示中文，生成时使用英文）
    CONSTRAINT_TRANSLATIONS: {
        // 删除操作约束翻译
        "content-aware fill algorithms for seamless background reconstruction": "智能填充算法实现无缝背景重建",
        "edge detection precision preventing unwanted deletions": "边缘检测精度防止误删",
        "texture synthesis matching surrounding area patterns": "纹理合成匹配周围区域模式",
        "frequency separation maintaining detail consistency": "频率分离保持细节一致性",
        "artifact prevention using advanced inpainting techniques": "高级修复技术防止伪影",
        "compositional rebalancing after element removal": "元素移除后的构图重新平衡",
        "visual flow optimization maintaining viewer engagement": "优化视觉流保持观者参与度",
        "negative space utilization for improved design": "负空间利用改善设计",
        "focus redirection to primary subjects": "焦点重定向到主要对象",
        "artistic integrity preservation during modifications": "修改过程中保持艺术完整性",
        "invisible removal traces with perfect background matching": "完美背景匹配的隐形删除痕迹",
        "natural texture continuation across edited boundaries": "编辑边界的自然纹理延续",
        "lighting consistency throughout reconstructed areas": "重建区域的光照一致性",
        "edge refinement eliminating selection artifacts": "边缘精细化消除选择伪影",
        "professional standard output suitable for commercial use": "符合商业使用的专业标准输出",
        
        // 颜色修改约束翻译
        "color space management preserving ICC profile accuracy": "色彩空间管理保持ICC配置文件精度",
        "white balance precision maintaining neutral references": "白平衡精度保持中性参考",
        "saturation control preventing clipping in any channel": "饱和度控制防止任何通道削波",
        "hue shift accuracy maintaining color relationships": "色调偏移精度保持色彩关系",
        "luminance preservation during chromatic adjustments": "色度调整期间的亮度保持",
        "emotional color expression enhancing intended mood": "情感色彩表达增强预期情绪",
        "visual hierarchy reinforcement through color contrast": "通过色彩对比强化视觉层次",
        "atmospheric mood creation using temperature shifts": "使用温度偏移创造氛围情绪",
        "brand color consistency maintaining identity standards": "品牌色彩一致性保持身份标准",
        "harmonic color relationships following theory principles": "遵循理论原则的和谐色彩关系",
        "natural color transition without banding artifacts": "无条纹伪影的自然色彩过渡",
        "detail retention during color space conversions": "色彩空间转换期间的细节保持",
        "skin tone authenticity preservation in portraits": "肖像中肤色真实性保持",
        "material color accuracy for product photography": "产品摄影的材质色彩精度",
        "color grading precision matching professional standards": "色彩分级精度匹配专业标准",
        
        // 添加操作约束翻译
        "layer blending using screen or overlay modes for natural integration": "使用屏幕或叠加模式进行图层混合实现自然融合",
        "edge feathering with 2-3 pixel soft transition zones": "2-3像素软过渡区域的边缘羽化",
        "shadow casting analysis for realistic placement depth": "阴影投射分析实现真实的放置深度",
        "color temperature matching to maintain lighting consistency": "色温匹配保持光照一致性",
        "resolution scaling maintaining pixel density standards": "分辨率缩放保持像素密度标准",
        "compositional balance following rule of thirds principles": "遵循三分法原则的构图平衡",
        "visual hierarchy enhancement through strategic placement": "通过战略位置增强视觉层次",
        "color harmony integration with existing palette": "与现有调色板的色彩和谐融合",
        "style consistency matching original artistic direction": "风格一致性匹配原始艺术方向",
        "focal point creation without disrupting main subject": "创建焦点而不干扰主要对象",
        "seamless edge integration without visible boundaries": "无可见边界的无缝边缘融合",
        "natural lighting coherence across all elements": "所有元素的自然光照连贯性",
        "material properties consistency for believable results": "材质属性一致性实现可信结果",
        "edge cleanup with anti-aliasing optimization": "边缘清理与抗锯齿优化",
        "professional quality output ready for publication": "准备发布的专业质量输出",
        
        // 认知负荷约束翻译
        "single operation focus maintaining cognitive simplicity": "单一操作焦点保持认知简洁性",
        "clear instruction interpretation preventing confusion": "清晰指令解释防止混淆",
        "immediate visual feedback for quick result assessment": "即时视觉反馈快速结果评估",
        "minimal parameter adjustment reducing decision complexity": "最小参数调整减少决策复杂性",
        "straightforward execution path minimizing cognitive overhead": "直接执行路径最小化认知开销",
        "dual-focus task management balancing multiple objectives": "双焦点任务管理平衡多个目标",
        "moderate complexity parameter coordination": "中等复杂度参数协调",
        "sequential step execution requiring planning ahead": "需要提前规划的顺序步骤执行",
        "quality-speed optimization requiring balanced decisions": "需要平衡决策的质量-速度优化",
        "intermediate skill requirement for optimal results": "获得最佳结果的中级技能要求",
        "multi-element coordination requiring sustained attention": "需要持续注意力的多元素协调",
        "complex parameter interaction management": "复杂参数交互管理",
        "artistic judgment integration with technical precision": "艺术判断与技术精度的整合",
        "iterative refinement process requiring patience": "需要耐心的迭代精化过程",
        "advanced technique application for professional results": "高级技术应用获得专业结果",
        "comprehensive system thinking managing multiple variables": "管理多个变量的综合系统思维",
        "expert-level judgment integration across all aspects": "跨所有方面的专家级判断整合",
        "creative problem-solving for unique challenges": "针对独特挑战的创意问题解决",
        "advanced technique synthesis creating innovative solutions": "高级技术综合创造创新解决方案",
        "professional mastery demonstration through complex execution": "通过复杂执行演示专业掌握",
        
        // 上下文约束翻译
        "commercial photography standards ensuring professional presentation": "商业摄影标准确保专业呈现",
        "brand consistency maintenance supporting marketing objectives": "品牌一致性维护支持营销目标",
        "detail clarity optimization for product feature visibility": "细节清晰度优化提高产品特征可见性",
        "clean background approach minimizing visual distractions": "清洁背景方法最小化视觉干扰",
        "lighting optimization highlighting key product attributes": "光照优化突出关键产品属性",
        "artistic vision support enabling creative freedom": "艺术视野支持实现创意自由",
        "emotional impact enhancement through strategic modifications": "通过战略修改增强情感影响",
        "style experimentation encouraging innovative approaches": "风格实验鼓励创新方法",
        "personal aesthetic development supporting individual voice": "个人美学发展支持个人声音",
        "creative boundary pushing while maintaining technical quality": "在保持技术质量的同时推动创意边界",
        "message clarity optimization ensuring effective communication": "信息清晰度优化确保有效沟通",
        "audience engagement enhancement through strategic visual choices": "通过战略视觉选择增强观众参与度",
        "brand alignment maintenance supporting marketing objectives": "品牌对齐维护支持营销目标",
        "conversion optimization through persuasive visual elements": "通过有说服力的视觉元素优化转化",
        "market positioning support through strategic presentation": "通过战略呈现支持市场定位"
    },
    
    // 语义修饰词中英文对照
    MODIFIER_TRANSLATIONS: {
        "precise": "精确",
        "accurate": "准确", 
        "clean": "清洁",
        "sharp": "锐利",
        "detailed": "详细",
        "professional": "专业",
        "technical": "技术",
        "exact": "精确",
        "systematic": "系统",
        "methodical": "有条理",
        "sophisticated": "精致",
        "refined": "精细",
        "polished": "完善",
        "elegant": "优雅",
        "premium": "高端",
        "advanced": "高级",
        "expert": "专家",
        "mastery": "精通",
        "excellence": "卓越",
        "superior": "优越",
        "innovative": "创新",
        "imaginative": "富有想象力",
        "artistic": "艺术",
        "expressive": "表现力",
        "inspired": "灵感",
        "visionary": "有远见",
        "creative": "创意",
        "original": "原创",
        "unique": "独特",
        "transformative": "变革性"
    },
    
    // 基于1026数据集的语义修饰词分级系统
    SEMANTIC_MODIFIERS: {
        level_1_technical: [
            "precise", "accurate", "clean", "sharp", "detailed", 
            "professional", "technical", "exact", "systematic", "methodical"
        ],
        level_2_professional: [
            "sophisticated", "refined", "polished", "elegant", "premium",
            "advanced", "expert", "mastery", "excellence", "superior"
        ],
        level_3_creative: [
            "innovative", "imaginative", "artistic", "expressive", "inspired",
            "visionary", "creative", "original", "unique", "transformative"
        ]
    },
    
    // 基于Kontext数据的编辑类型配置
    EDITING_TYPES_CONFIG: {
        local_editing: {
            id: 'local_editing',
            name: '局部编辑',
            emoji: '🎯',
            description: '',
            priority: 1,
            operations: {
                shape_transformation: {
                    id: 'shape_transformation',
                    name: '形态变化',
                    priority: 1,
                    badge: '⭐',
                    specifics: [
                        { id: 'body_posture', name: '身体姿态调整', example: 'make her dance' },
                        { id: 'hand_gesture', name: '手势动作修改', example: 'do heart hands' },
                        { id: 'facial_expression', name: '表情状态变化', example: 'change expression' },
                        { id: 'body_feature', name: '身体特征调整', example: 'make head gigantic' }
                    ]
                },
                color_modification: {
                    id: 'color_modification',
                    name: '颜色修改',
                    priority: 2,
                    specifics: [
                        { id: 'single_color', name: '单一颜色变换', example: 'make cat orange' },
                        { id: 'multi_object', name: '多对象统一颜色', example: 'make all signs green' },
                        { id: 'gradient_color', name: '渐变色彩应用', example: 'rainbow color' },
                        { id: 'texture_preserve', name: '材质颜色保持', example: 'keep texture' }
                    ]
                },
                object_removal: {
                    id: 'object_removal',
                    name: '对象删除',
                    priority: 3,
                    specifics: [
                        { id: 'body_part', name: '身体部位删除', example: 'remove hand in middle' },
                        { id: 'background_element', name: '背景元素删除', example: 'remove house' },
                        { id: 'decoration', name: '装饰元素删除', example: 'remove hat' },
                        { id: 'seamless_repair', name: '无痕背景修复', example: 'seamless background' }
                    ]
                },
                attribute_adjustment: {
                    id: 'attribute_adjustment',
                    name: '属性修改',
                    priority: 4,
                    specifics: [
                        { id: 'age_change', name: '年龄特征变化', example: 'make her old/young' },
                        { id: 'hairstyle', name: '发型样式调整', example: 'make bald' },
                        { id: 'clothing', name: '服饰配件添加', example: 'add cowboy hat' },
                        { id: 'facial_feature', name: '面部特征修改', example: 'add beard' }
                    ]
                },
                size_scale: {
                    id: 'size_scale',
                    name: '尺寸缩放',
                    priority: 5,
                    specifics: [
                        { id: 'enlarge_object', name: '对象放大', example: 'make bigger' },
                        { id: 'shrink_object', name: '对象缩小', example: 'make smaller' },
                        { id: 'proportion_adjust', name: '比例调整', example: 'adjust proportions' },
                        { id: 'size_normalize', name: '尺寸标准化', example: 'normalize size' }
                    ]
                },
                position_movement: {
                    id: 'position_movement',
                    name: '位置移动',
                    priority: 6,
                    specifics: [
                        { id: 'location_change', name: '位置变更', example: 'move to center' },
                        { id: 'rotation_adjust', name: '旋转调整', example: 'rotate object' },
                        { id: 'spatial_arrangement', name: '空间排列', example: 'arrange objects' },
                        { id: 'alignment_fix', name: '对齐修正', example: 'align properly' }
                    ]
                },
                texture_material: {
                    id: 'texture_material',
                    name: '材质纹理',
                    priority: 7,
                    specifics: [
                        { id: 'surface_texture', name: '表面纹理修改', example: 'make smooth/rough' },
                        { id: 'material_change', name: '材料属性变化', example: 'make metallic' },
                        { id: 'transparency_adjust', name: '透明度调整', example: 'make transparent' },
                        { id: 'reflectivity_control', name: '反射率控制', example: 'add reflection' }
                    ]
                },
                object_addition: {
                    id: 'object_addition',
                    name: '对象添加',
                    priority: 8,
                    badge: '⭐',
                    specifics: [
                        { id: 'body_part_add', name: '身体部位添加', example: 'add second thumb' },
                        { id: 'decoration_add', name: '装饰元素添加', example: 'add monkey on sign' },
                        { id: 'background_element_add', name: '背景元素添加', example: 'add snowman' },
                        { id: 'functional_add', name: '功能性添加', example: 'add words beneath' }
                    ]
                },
                object_replacement: {
                    id: 'object_replacement',
                    name: '对象替换',
                    priority: 9,
                    specifics: [
                        { id: 'material_replace', name: '材质替换', example: 'carpet to wood floor' },
                        { id: 'logo_replace', name: '标识替换', example: 'logo to Apple Logo' },
                        { id: 'background_replace', name: '背景替换', example: 'galaxy background' },
                        { id: 'complete_replace', name: '完全替换', example: 'mech to hot air balloon' }
                    ]
                }
            }
        },
        
        creative_reconstruction: {
            id: 'creative_reconstruction',
            name: '创意重构',
            emoji: '🎭',
            description: '想象力驱动的创造性场景重构',
            priority: 4,
            operations: {
                scene_building: {
                    id: 'scene_building',
                    name: '创意场景构建',
                    priority: 1,
                    badge: '⭐',
                    complexity: '极高',
                    specifics: [
                        { id: 'fantasy_scene', name: '奇幻场景创造', example: 'dog as solar system sun made of plasma', complexity: '极高' },
                        { id: 'surreal_construction', name: '超现实构造', example: 'tower of cows stretching to clouds', complexity: '极高' },
                        { id: 'concept_art', name: '概念艺术表达', example: 'abstract artistic interpretation', complexity: '高' },
                        { id: 'narrative_scene', name: '叙事性场景', example: 'story-driven scene creation', complexity: '高' }
                    ]
                },
                style_creation: {
                    id: 'style_creation',
                    name: '风格模仿创作',
                    priority: 2,
                    complexity: '高',
                    specifics: [
                        { id: 'style_transfer', name: '艺术风格迁移', example: 'art in this style of rusted car', complexity: '高' },
                        { id: 'reference_application', name: '参考风格应用', example: 'apply reference style', complexity: '中' },
                        { id: 'style_fusion', name: '主题风格融合', example: 'blend style with theme', complexity: '高' },
                        { id: 'brand_adaptation', name: '品牌风格适配', example: 'brand style adaptation', complexity: '中' }
                    ]
                },
                character_action: {
                    id: 'character_action',
                    name: '角色动作设定',
                    priority: 3,
                    complexity: '中',
                    specifics: [
                        { id: 'action_instruction', name: '动作指令执行', example: 'make character perform action', complexity: '中' },
                        { id: 'pose_setting', name: '姿态场景设定', example: 'set in specific pose', complexity: '中' },
                        { id: 'environment_interaction', name: '环境互动表现', example: 'interacting with environment', complexity: '高' },
                        { id: 'narrative_behavior', name: '叙事行为展示', example: 'story-based behavior', complexity: '高' }
                    ]
                },
                media_transformation: {
                    id: 'media_transformation',
                    name: '媒介形式转换',
                    priority: 4,
                    complexity: '高',
                    specifics: [
                        { id: 'painting_art', name: '绘画艺术', example: 'transform to painting', complexity: '高' },
                        { id: 'sculpture_form', name: '雕塑立体', example: 'sculptural representation', complexity: '高' },
                        { id: 'digital_art', name: '数字艺术', example: 'digital art medium', complexity: '中' },
                        { id: 'concept_design', name: '概念设计', example: 'concept design form', complexity: '高' }
                    ]
                },
                environment_reconstruction: {
                    id: 'environment_reconstruction',
                    name: '场景环境重构',
                    priority: 5,
                    complexity: '极高',
                    specifics: [
                        { id: 'setting_reconstruction', name: '环境重构', example: 'reconstruct setting', complexity: '极高' },
                        { id: 'spatial_transformation', name: '空间转换', example: 'transform spatial context', complexity: '高' },
                        { id: 'location_setting', name: '情境设定', example: 'specific location context', complexity: '中' },
                        { id: 'environmental_storytelling', name: '环境叙事', example: 'environmental storytelling', complexity: '高' }
                    ]
                },
                material_transformation: {
                    id: 'material_transformation',
                    name: '材质形态转换',
                    priority: 6,
                    complexity: '高',
                    specifics: [
                        { id: 'physical_transformation', name: '物理转换', example: 'different materials', complexity: '高' },
                        { id: 'craft_form', name: '工艺品形态', example: 'craft/artifact form', complexity: '中' },
                        { id: 'collectible_form', name: '收藏品形式', example: 'collectible form', complexity: '中' },
                        { id: 'functional_object', name: '功能物品', example: 'functional object', complexity: '中' }
                    ]
                }
            }
        },
        
        text_editing: {
            id: 'text_editing',
            name: '文字编辑',
            emoji: '📝',
            description: '专门处理图像中的文字内容',
            priority: 2,
            operations: {
                content_replace: {
                    id: 'content_replace',
                    name: '文字内容替换',
                    priority: 1,
                    specifics: [
                        { id: 'word_replace', name: '单词替换', example: 'Make "HongKong" say "King Kong"' },
                        { id: 'phrase_replace', name: '短语替换', example: 'change text to say "big bagel boys"' },
                        { id: 'sentence_replace', name: '句子替换', example: 'text says "remember to eat your veggies"' },
                        { id: 'multi_text_replace', name: '多文本替换', example: 'change all text to new content' }
                    ]
                },
                content_add: {
                    id: 'content_add',
                    name: '文字添加',
                    priority: 2,
                    badge: '⭐',
                    specifics: [
                        { id: 'text_insert', name: '文字插入', example: 'add text "Pweese" beneath him' },
                        { id: 'label_add', name: '标签添加', example: 'add label "Cool Little Easel"' },
                        { id: 'caption_add', name: '说明文字添加', example: 'add caption below image' },
                        { id: 'watermark_add', name: '水印文字添加', example: 'add watermark text' }
                    ]
                },
                style_modify: {
                    id: 'style_modify',
                    name: '文字样式修改',
                    priority: 3,
                    specifics: [
                        { id: 'color_change', name: '文字颜色修改', example: 'make text rainbow colored' },
                        { id: 'font_change', name: '字体样式修改', example: 'change font to bold' },
                        { id: 'effect_add', name: '文字特效添加', example: 'add shadow to text' },
                        { id: 'outline_modify', name: '文字轮廓修改', example: 'add text outline' }
                    ]
                },
                size_adjust: {
                    id: 'size_adjust',
                    name: '文字大小调整',
                    priority: 4,
                    specifics: [
                        { id: 'enlarge_text', name: '文字放大', example: 'make text larger' },
                        { id: 'shrink_text', name: '文字缩小', example: 'make text smaller' },
                        { id: 'proportion_fix', name: '比例调整', example: 'adjust text proportions' },
                        { id: 'scale_normalize', name: '尺寸标准化', example: 'normalize text size' }
                    ]
                },
                position_change: {
                    id: 'position_change',
                    name: '文字位置变更',
                    priority: 5,
                    specifics: [
                        { id: 'move_text', name: '文字移动', example: 'move text to bottom' },
                        { id: 'align_text', name: '文字对齐', example: 'center align text' },
                        { id: 'rotate_text', name: '文字旋转', example: 'rotate text 45 degrees' },
                        { id: 'spacing_adjust', name: '间距调整', example: 'adjust text spacing' }
                    ]
                },
                text_remove: {
                    id: 'text_remove',
                    name: '文字删除',
                    priority: 6,
                    specifics: [
                        { id: 'text_erase', name: '文字擦除', example: 'remove all text' },
                        { id: 'partial_remove', name: '部分文字删除', example: 'remove specific words' },
                        { id: 'background_repair', name: '背景修复', example: 'remove text with background repair' },
                        { id: 'clean_removal', name: '干净移除', example: 'cleanly remove text' }
                    ]
                }
            }
        },
        
        global_editing: {
            id: 'global_editing',
            name: '全局编辑',
            emoji: '🌍',
            description: '对整个图像进行全局性转换',
            priority: 3,
            operations: {
                state_transformation: {
                    id: 'state_transformation',
                    name: '整体状态改变',
                    priority: 1,
                    badge: '⭐',
                    specifics: [
                        { id: 'reality_conversion', name: '真实化处理', example: 'make this real photo' },
                        { id: 'virtual_processing', name: '虚拟化处理', example: 'digital art' },
                        { id: 'material_conversion', name: '材质转换', example: 'cinematic quality' },
                        { id: 'concept_reconstruction', name: '概念重构', example: 'geometric elements' },
                        { id: 'upscale_enhancement', name: '高清化', example: 'high quality detailed 4K' }
                    ]
                },
                artistic_style: {
                    id: 'artistic_style',
                    name: '艺术风格转换',
                    priority: 2,
                    specifics: [
                        { id: 'classical_painting', name: '经典绘画风格', example: 'renaissance painting' },
                        { id: 'modern_drawing', name: '现代绘图风格', example: 'crayon drawing' },
                        { id: 'animation_style', name: '动画艺术风格', example: 'anime artwork' },
                        { id: 'sketch_technique', name: '素描技法风格', example: 'charcoal sketch' }
                    ]
                },
                perspective_composition: {
                    id: 'perspective_composition',
                    name: '视角构图调整',
                    priority: 3,
                    specifics: [
                        { id: 'camera_movement', name: '镜头推拉', example: 'zoom in/out' },
                        { id: 'focus_positioning', name: '焦点定位', example: 'focus on subject' },
                        { id: 'composition_balance', name: '构图平衡', example: 'rebalance composition' },
                        { id: 'perspective_adjust', name: '透视调整', example: 'adjust perspective' }
                    ]
                },
                environment_atmosphere: {
                    id: 'environment_atmosphere',
                    name: '环境氛围调整',
                    priority: 4,
                    specifics: [
                        { id: 'lighting_control', name: '明暗控制', example: 'darker/brighter' },
                        { id: 'time_transformation', name: '时间变换', example: 'day/night time' },
                        { id: 'season_conversion', name: '季节转换', example: 'summer/winter' },
                        { id: 'mood_creation', name: '情绪营造', example: 'warm/cold atmosphere' }
                    ]
                },
                background_replacement: {
                    id: 'background_replacement',
                    name: '背景场景替换',
                    priority: 5,
                    specifics: [
                        { id: 'theme_transformation', name: '主题转换', example: 'egyptian themed' },
                        { id: 'color_background', name: '色彩背景', example: 'rainbow background' },
                        { id: 'scene_cleaning', name: '场景清理', example: 'clean background' },
                        { id: 'environment_reconstruction', name: '环境重构', example: 'different setting' }
                    ]
                },
                color_scheme: {
                    id: 'color_scheme',
                    name: '色彩方案变更',
                    priority: 6,
                    specifics: [
                        { id: 'tone_adjustment', name: '色调调整', example: 'reddish palette' },
                        { id: 'color_scheme_change', name: '配色方案', example: 'blue yellow scheme' },
                        { id: 'style_unification', name: '风格统一', example: 'harmonize colors' },
                        { id: 'palette_transformation', name: '调色板变换', example: 'vintage color palette' }
                    ]
                },
                filter_effects: {
                    id: 'filter_effects',
                    name: '滤镜效果应用',
                    priority: 7,
                    specifics: [
                        { id: 'blur_control', name: '模糊控制', example: 'add/remove blur' },
                        { id: 'sharpening_effect', name: '锐化效果', example: 'enhance sharpness' },
                        { id: 'contrast_adjustment', name: '对比调整', example: 'improve contrast' },
                        { id: 'artistic_filters', name: '艺术滤镜', example: 'vintage filter effect' }
                    ]
                }
            }
        },
        
        professional_operations: {
            id: 'professional_operations',
            name: '专业操作',
            emoji: '💼',
            description: '商业级专业编辑场景',
            priority: 5,
            badge: '商业版',
            operations: {
                ecommerce: {
                    id: 'ecommerce',
                    name: '电商产品级',
                    emoji: '🛍️',
                    priority: 1,
                    specifics: [
                        { id: 'color_accuracy', name: '色彩准确性控制', example: 'accurate product colors' },
                        { id: 'background_clean', name: '背景纯净化处理', example: 'clean white background' },
                        { id: 'detail_enhance', name: '产品细节增强', example: 'enhance product details' },
                        { id: 'defect_remove', name: '缺陷修复处理', example: 'remove defects' }
                    ]
                },
                portrait: {
                    id: 'portrait',
                    name: '人像专业级',
                    emoji: '👤',
                    priority: 2,
                    specifics: [
                        { id: 'skin_natural', name: '自然肌肤处理', example: 'natural skin enhancement' },
                        { id: 'feature_preserve', name: '特征保持技术', example: 'preserve facial features' },
                        { id: 'background_pro', name: '背景专业化', example: 'professional background' },
                        { id: 'lighting_opt', name: '光线优化调整', example: 'optimize portrait lighting' }
                    ]
                },
                architecture: {
                    id: 'architecture',
                    name: '建筑空间级',
                    emoji: '🏢',
                    priority: 3,
                    specifics: [
                        { id: 'structure_enhance', name: '结构增强处理', example: 'enhance architectural structure' },
                        { id: 'lighting_arch', name: '建筑照明优化', example: 'optimize building lighting' },
                        { id: 'material_realistic', name: '材质真实化', example: 'realistic material rendering' },
                        { id: 'perspective_correct', name: '透视校正', example: 'correct perspective distortion' }
                    ]
                },
                food: {
                    id: 'food',
                    name: '美食摄影级',
                    emoji: '🍽️',
                    priority: 4,
                    specifics: [
                        { id: 'food_appeal', name: '食物诱人度提升', example: 'make food more appetizing' },
                        { id: 'freshness_enhance', name: '新鲜度增强', example: 'enhance food freshness' },
                        { id: 'color_vibrant', name: '色彩鲜活化', example: 'vibrant food colors' },
                        { id: 'texture_detail', name: '质感细节增强', example: 'enhance food texture details' }
                    ]
                },
                fashion: {
                    id: 'fashion',
                    name: '时尚零售级',
                    emoji: '👗',
                    priority: 5,
                    specifics: [
                        { id: 'fabric_texture', name: '面料质感增强', example: 'enhance fabric texture' },
                        { id: 'color_accurate', name: '色彩准确呈现', example: 'accurate color representation' },
                        { id: 'style_highlight', name: '款式特点突出', example: 'highlight style features' },
                        { id: 'brand_consistency', name: '品牌一致性', example: 'maintain brand consistency' }
                    ]
                },
                nature: {
                    id: 'nature',
                    name: '自然风光级',
                    emoji: '🌲',
                    priority: 6,
                    specifics: [
                        { id: 'landscape_enhance', name: '风景增强处理', example: 'enhance landscape beauty' },
                        { id: 'natural_color', name: '自然色彩优化', example: 'optimize natural colors' },
                        { id: 'atmospheric_effect', name: '大气效果增强', example: 'enhance atmospheric effects' },
                        { id: 'seasonal_mood', name: '季节氛围营造', example: 'create seasonal mood' }
                    ]
                }
            }
        }
    },

    // 获取选项卡配置
    getTabConfig() {
        const configs = Object.values(this.EDITING_TYPES_CONFIG);
        return configs.sort((a, b) => a.priority - b.priority);
    },

    // 获取操作类型配置
    getOperationConfig(editingType) {
        const config = this.EDITING_TYPES_CONFIG[editingType];
        if (!config) return [];
        
        const operations = Object.values(config.operations);
        return operations.sort((a, b) => a.priority - b.priority);
    },

    // 获取具体操作配置
    getSpecificConfig(editingType, operationType) {
        const config = this.EDITING_TYPES_CONFIG[editingType];
        if (!config || !config.operations[operationType]) return [];
        
        return config.operations[operationType].specifics || [];
    },

    // 生成选项卡显示名称
    getTabDisplayName(config) {
        return `${config.emoji} ${config.name}`;
    },

    // 生成操作显示名称
    getOperationDisplayName(operation) {
        let displayName = operation.name;
        if (operation.badge) {
            displayName += ` ${operation.badge}`;
        }
        return displayName;
    },

    // 生成具体操作显示名称
    getSpecificDisplayName(specific) {
        return `${specific.name} "${specific.example}"`;
    },

    // 获取复杂度信息

    // 关键词输入提示 - 基于1026样本关键词模式深度分析
    getOperationTips(operationType) {
        const tipsMap = {
            // 局部编辑关键词输入提示
            shape_transformation: [
                '🔑 动作关键词：输入动作词汇，如 "dance", "sit", "jump", "wave hand"',
                '💡 状态描述：输入目标状态，如 "lying down", "standing up", "crouching"',
                '🎯 身体部位：输入具体部位+动作，如 "head turn", "arm raise", "leg bend"',
                '⚡ 表情变化：输入表情词，如 "smile", "frown", "surprised", "angry"'
            ],
            color_modification: [
                '🎨 颜色词汇：输入颜色名称，如 "red", "blue", "rainbow", "gold"',
                '🔍 对象+颜色：指定对象，如 "cat orange", "dress blue", "hair green"',
                '🌈 特殊效果：输入效果词，如 "gradient", "metallic", "glowing", "transparent"',
                '💎 材质保持：加入材质词，如 "keep texture", "matte finish", "glossy"'
            ],
            object_removal: [
                '❌ 对象名称：直接输入要删除的对象，如 "hat", "car", "tree"',
                '🎯 位置描述：加入位置，如 "hand middle", "background house", "left side"',
                '🏷️ 颜色+对象：更精确，如 "red car", "blue hat", "tall building"',
                '🔧 自动修复：删除后背景会自动修复，输入对象名即可'
            ],
            attribute_adjustment: [
                '👤 年龄关键词：输入 "old", "young", "older", "teenager", "elderly"',
                '💇 发型描述：输入 "bald", "long hair", "curly", "straight", "ponytail"',
                '👔 配饰添加：输入 "beard", "glasses", "hat", "necklace", "earrings"',
                '🎨 特征描述：输入 "muscular", "thin", "tall", "freckles", "scar"'
            ],
            size_scale: [
                '📏 尺寸关键词：输入 "bigger", "smaller", "huge", "tiny", "normal size"',
                '🔢 程度修饰：加入程度，如 "much bigger", "slightly smaller", "extremely large"',
                '📐 对象+尺寸：指定对象，如 "head bigger", "car smaller", "text larger"',
                '⚖️ 比例控制：输入 "proportional", "maintain ratio", "resize"'
            ],
            position_movement: [
                '📍 方向关键词：输入 "left", "right", "up", "down", "center", "corner"',
                '🎯 位置描述：输入 "move to", "place at", "shift", "relocate"',
                '↻ 旋转角度：输入 "rotate", "turn", "flip", "45 degrees", "upside down"',
                '📐 对齐方式：输入 "align", "center", "top", "bottom", "middle"'
            ],
            texture_material: [
                '🔍 材质名称：输入 "metallic", "wooden", "glass", "fabric", "plastic"',
                '✨ 表面效果：输入 "glossy", "matte", "rough", "smooth", "bumpy"',
                '💎 光泽程度：输入 "shiny", "dull", "reflective", "transparent", "opaque"',
                '🌊 纹理类型：输入 "textured", "pattern", "grain", "marble", "leather"'
            ],
            object_addition: [
                '➕ 新对象名：输入要添加的对象，如 "cat", "tree", "star", "text"',
                '📍 位置关键词：加入位置，如 "next to", "above", "behind", "in corner"',
                '🎨 风格描述：输入 "cute cat", "big tree", "golden star", "red text"',
                '⚖️ 尺寸控制：输入 "small", "large", "normal", "tiny", "huge"'
            ],
            object_replacement: [
                '🔄 原对象-新对象：输入 "car - bike", "apple - orange", "dog - cat"',
                '🎯 精确替换：输入 "replace red car with blue bike"',
                '🏷️ 对象描述：输入具体特征，如 "old chair - modern sofa"',
                '🔍 保持位置：替换会自动保持原对象的位置和尺寸'
            ],
            
            // 全局编辑关键词输入提示
            state_transformation: [
                '🎬 状态关键词：输入 "realistic", "cartoon", "painting", "sketch", "3D"',
                '💡 质量描述：输入 "high quality", "professional", "cinematic", "detailed"',
                '🔄 转换类型：输入 "real photo", "digital art", "oil painting", "pencil drawing"',
                '✨ 风格指定：输入 "photorealistic", "artistic", "stylized", "abstract"',
                '📈 高清化：输入 "4K", "8K", "ultra HD", "sharp", "crisp", "upscaled"'
            ],
            artistic_style: [
                '🎨 艺术风格：输入 "impressionist", "renaissance", "modern", "abstract"',
                '🖌️ 绘画技法：输入 "oil painting", "watercolor", "pencil sketch", "digital art"',
                '🏛️ 艺术流派：输入 "cubist", "surreal", "minimalist", "baroque"',
                '🌈 色彩风格：输入 "vibrant", "muted", "monochrome", "pastel"'
            ],
            perspective_composition: [
                '📷 视角关键词：输入 "close up", "wide angle", "bird view", "low angle"',
                '🔍 焦点控制：输入 "focus on", "blur background", "sharp details", "depth"',
                '📐 构图调整：输入 "center", "rule of thirds", "symmetry", "balance"',
                '🎯 镜头效果：输入 "zoom in", "zoom out", "tilt", "pan"'
            ],
            environment_atmosphere: [
                '💡 光线关键词：输入 "bright", "dark", "soft light", "dramatic lighting"',
                '🌤️ 氛围描述：输入 "warm", "cool", "moody", "cheerful", "mysterious"',
                '⏰ 时间设定：输入 "morning", "sunset", "night", "golden hour", "twilight"',
                '🌈 色温控制：输入 "warm tone", "cool tone", "natural light", "artificial light"'
            ],
            background_replacement: [
                '🌍 背景类型：输入 "beach", "forest", "city", "studio", "galaxy", "abstract"',
                '🎨 背景风格：输入 "clean white", "colorful", "minimalist", "detailed", "blurred"',
                '🌈 颜色背景：输入 "rainbow background", "blue sky", "gradient", "solid color"',
                '🎭 主题背景：输入 "egyptian", "medieval", "futuristic", "natural", "urban"'
            ],
            color_scheme: [
                '🎨 色彩方案：输入 "warm colors", "cool colors", "monochrome", "complementary"',
                '🌈 具体颜色：输入 "blue yellow", "red green", "purple orange", "black white"',
                '📊 色调控制：输入 "vibrant", "muted", "saturated", "desaturated", "pastel"',
                '🎯 主色调：输入 "dominant red", "blue theme", "golden palette", "earth tones"'
            ],
            filter_effects: [
                '🎞️ 滤镜类型：输入 "vintage", "sepia", "black white", "high contrast", "soft"',
                '✨ 视觉效果：输入 "blur", "sharpen", "glow", "vignette", "grain"',
                '🔄 调整参数：输入 "bright", "dark", "contrast", "saturation", "exposure"',
                '🎨 艺术效果：输入 "dreamy", "dramatic", "ethereal", "cinematic", "retro"'
            ],
            
            // 创意重构关键词输入提示
            scene_building: [
                '🌟 创意概念：输入大胆想象，如 "dog as sun", "tower of cars", "floating city"',
                '📖 故事元素：输入情节词汇，如 "magical forest", "space adventure", "underwater world"',
                '🎨 视觉比喻：输入比喻描述，如 "person made of clouds", "building like flower"',
                '🔮 奇幻元素：输入 "flying", "glowing", "transparent", "giant", "miniature"'
            ],
            style_creation: [
                '🎨 目标风格：输入 "anime style", "cartoon style", "realistic style", "abstract style"',
                '🔄 风格转换：输入 "in style of", "like painting", "as sculpture", "photographic style"',
                '💡 艺术表现：输入 "expressionist", "impressionist", "pop art", "street art"',
                '🎭 视觉特征：输入 "bold colors", "soft lines", "geometric", "organic shapes"'
            ],
            character_action: [
                '🎭 动作关键词：输入 "dancing", "running", "flying", "fighting", "embracing"',
                '💫 情感表达：输入 "happy", "sad", "angry", "excited", "peaceful", "dramatic"',
                '🎬 场景互动：输入 "interacting with", "looking at", "holding", "touching"',
                '🌟 动态描述：输入 "motion blur", "freeze action", "dynamic pose", "energy"'
            ],
            media_transformation: [
                '🎨 媒介类型：输入 "sculpture", "painting", "drawing", "digital art", "photography"',
                '💎 材料指定：输入 "marble statue", "oil painting", "pencil sketch", "metal sculpture"',
                '🔄 形式转换：输入 "as artwork", "like masterpiece", "gallery piece", "museum quality"',
                '✨ 工艺特征：输入 "handmade", "crafted", "artistic", "professional", "detailed"'
            ],
            environment_reconstruction: [
                '🌍 新环境：输入 "space station", "underwater", "mountain top", "desert", "jungle"',
                '🏗️ 空间重构：输入 "rebuild setting", "different location", "new world", "alternate reality"',
                '🎭 情境设定：输入 "post-apocalyptic", "futuristic", "medieval", "prehistoric", "alien world"',
                '🌈 环境氛围：输入 "mysterious", "peaceful", "dangerous", "magical", "scientific"'
            ],
            material_transformation: [
                '💎 目标材料：输入 "gold", "crystal", "wood", "metal", "fabric", "stone"',
                '🔄 形态转换：输入 "glass version", "wooden replica", "metal sculpture", "fabric art"',
                '🎨 工艺形式：输入 "handcrafted", "carved", "molded", "woven", "forged"',
                '✨ 质感描述：输入 "smooth", "rough", "polished", "aged", "pristine", "weathered"'
            ],
            
            // 文字编辑关键词输入提示  
            content_replace: [
                '📝 原文-新文：输入 "Hello - Hi", "Welcome - Greetings", "Sale - Discount"',
                '🎯 文字内容：用逗号分隔，如 "old text, new text"',
                '🔄 替换格式：输入要改变的文字内容，系统自动识别位置',
                '💡 简洁输入：只需输入新的文字内容，如 "New Text"'
            ],
            content_add: [
                '➕ 文字内容：输入要添加的文字，如 "Hello World", "Sale 50%", "Welcome"',
                '📍 位置+文字：输入 "bottom: Thank you", "top: Title", "corner: Logo"',
                '🏷️ 标签样式：输入 "red text", "big title", "small caption", "bold text"',
                '⚖️ 大小指定：输入 "large: Hello", "small: subtitle", "medium: content"'
            ],
            style_modify: [
                '🎨 颜色效果：输入 "rainbow", "gold", "red", "blue", "gradient", "metallic"',
                '✨ 文字特效：输入 "glow", "shadow", "outline", "3d effect", "emboss"',
                '🗒️ 字体样式：输入 "bold", "italic", "underline", "strikethrough", "caps"',
                '🌈 组合效果：输入 "red bold", "blue glow", "gold metallic", "rainbow gradient"'
            ],
            size_adjust: [
                '📏 尺寸关键词：输入 "bigger", "smaller", "larger", "tiny", "huge", "normal"',
                '🔢 程度描述：输入 "much larger", "slightly smaller", "extremely big", "very small"',
                '📐 相对大小：输入 "double size", "half size", "2x bigger", "50% smaller"',
                '🎯 精确控制：输入具体大小词汇，如 "headline size", "caption size"'
            ],
            position_change: [
                '📍 位置词汇：输入 "center", "left", "right", "top", "bottom", "corner"',
                '↻ 移动方向：输入 "move up", "move down", "shift left", "move right"',
                '📐 对齐方式：输入 "center align", "left align", "right align", "justify"',
                '🔄 旋转角度：输入 "rotate", "tilt", "45 degrees", "vertical", "horizontal"'
            ],
            text_remove: [
                '❌ 删除指定：输入要删除的具体文字，如 "Welcome", "Sale", "Title"',
                '🎯 位置描述：输入 "top text", "bottom text", "all text", "watermark"',
                '🏷️ 文字特征：输入 "red text", "large text", "bold words", "small print"',
                '✨ 清理选项：输入 "clean removal", "keep background", "seamless delete"'
            ]
        };
        
        return tipsMap[operationType] || ['输入相关关键词，系统将自动补全完整提示'];
    },

    // 关键词转完整提示词系统 - 基于1026样本语法模式
    convertKeywordsToPrompt(operationType, specificOperation, keywords, editingType = 'local_editing') {
        if (!keywords || keywords.trim() === '') return '';
        
        // 清理和分割关键词
        const cleanKeywords = keywords.toLowerCase().trim();
        const keywordList = cleanKeywords.split(/[,，\s]+/).filter(k => k.length > 0);
        
        // 获取转换模式
        const conversionPatterns = this.getConversionPatterns();
        const pattern = conversionPatterns[operationType] || conversionPatterns.default;
        
        // 根据具体操作类型和关键词生成完整提示词
        return this.buildPromptFromKeywords(pattern, specificOperation, keywordList, editingType);
    },

    // 获取关键词转换模式
    getConversionPatterns() {
        return {
            // 局部编辑转换模式
            shape_transformation: {
                body_posture: (keywords, self) => {
                    const action = keywords.find(k => ['dance', 'sit', 'jump', 'run', 'walk', 'stand', 'lie', 'crouch'].includes(k)) || keywords[0];
                    return `make ${self.detectSubject(keywords)} ${action}`;
                },
                hand_gesture: (keywords, self) => {
                    const gesture = keywords.find(k => ['wave', 'point', 'peace', 'thumbs', 'clap', 'heart'].includes(k)) || keywords[0];
                    return `make ${self.detectSubject(keywords)} do ${gesture} ${keywords.includes('hands') ? 'hands' : 'gesture'}`;
                },
                facial_expression: (keywords, self) => {
                    const expression = keywords.find(k => ['smile', 'frown', 'angry', 'surprised', 'sad', 'happy'].includes(k)) || keywords[0];
                    return `make ${self.detectSubject(keywords)} ${expression}`;
                },
                body_feature: (keywords, self) => {
                    const feature = keywords[0];
                    const size = keywords.find(k => ['big', 'small', 'large', 'tiny', 'huge', 'gigantic'].includes(k)) || '';
                    return `make ${self.detectSubject(keywords)} ${feature} ${size}`.trim();
                }
            },
            
            color_modification: {
                single_color: (keywords, self) => {
                    const color = self.detectColor(keywords);
                    const object = self.detectObject(keywords);
                    return `make ${object} ${color}`;
                },
                multi_object: (keywords, self) => {
                    const color = self.detectColor(keywords);
                    const objects = keywords.find(k => ['all', 'every', 'signs', 'cars', 'buildings'].includes(k)) || 'all objects';
                    return `make ${objects} ${color}`;
                },
                gradient_color: (keywords, self) => {
                    if (keywords.includes('rainbow')) return 'make rainbow colored';
                    const colors = keywords.filter(k => self.isColor(k));
                    if (colors.length >= 2) return `gradient from ${colors[0]} to ${colors[1]}`;
                    return `${colors[0] || keywords[0]} gradient effect`;
                },
                texture_preserve: (keywords, self) => {
                    const color = self.detectColor(keywords);
                    return `change color to ${color}, keep original texture`;
                }
            },
            
            object_removal: {
                body_part: (keywords, self) => {
                    const part = keywords.find(k => ['hand', 'finger', 'arm', 'leg', 'foot'].includes(k)) || keywords[0];
                    const position = keywords.find(k => ['left', 'right', 'middle', 'extra'].includes(k)) || '';
                    return `remove ${position} ${part}`.trim();
                },
                background_element: (keywords, self) => {
                    const element = keywords.find(k => ['house', 'car', 'tree', 'building', 'sign'].includes(k)) || keywords[0];
                    return `remove ${element} in background`;
                },
                decoration: (keywords, self) => {
                    const item = keywords.find(k => ['hat', 'glasses', 'jewelry', 'watch', 'ring'].includes(k)) || keywords[0];
                    return `remove ${item}`;
                },
                seamless_repair: (keywords, self) => {
                    const object = keywords[0];
                    return `remove ${object} with seamless background`;
                }
            },
            
            object_addition: {
                body_part_add: (keywords, self) => {
                    const part = keywords[0];
                    const number = keywords.find(k => ['second', 'third', 'extra', 'another'].includes(k)) || '';
                    return `add ${number} ${part}`.trim();
                },
                decoration_add: (keywords, self) => {
                    const item = keywords[0];
                    const location = self.detectLocation(keywords);
                    return `add ${item}${location ? ' ' + location : ''}`;
                },
                background_element_add: (keywords, self) => {
                    const element = keywords[0];
                    const location = self.detectLocation(keywords) || 'in background';
                    return `add ${element} ${location}`;
                },
                functional_add: (keywords, self) => {
                    const function_word = keywords.includes('text') ? 'words' : keywords[0];
                    const position = self.detectLocation(keywords) || 'beneath';
                    return `add ${function_word} ${position}`;
                }
            },
            
            // 文字编辑转换模式
            content_replace: {
                word_replace: (keywords, self) => {
                    if (keywords.length >= 2) {
                        return `make "${keywords[0]}" say "${keywords.slice(1).join(' ')}"`;
                    }
                    return `change text to "${keywords.join(' ')}"`;
                },
                phrase_replace: (keywords, self) => {
                    return `change text to say "${keywords.join(' ')}"`;
                },
                sentence_replace: (keywords, self) => {
                    return `text says "${keywords.join(' ')}"`;
                },
                multi_text_replace: (keywords, self) => {
                    return `change all text to "${keywords.join(' ')}"`;
                }
            },
            
            content_add: {
                text_insert: (keywords, self) => {
                    const text = keywords.filter(k => !['bottom', 'top', 'beneath', 'above'].includes(k)).join(' ');
                    const position = self.detectLocation(keywords) || 'beneath';
                    return `add text "${text}" ${position}`;
                },
                label_add: (keywords, self) => {
                    const label = keywords.join(' ');
                    return `add label "${label}"`;
                },
                caption_add: (keywords, self) => {
                    const caption = keywords.join(' ');
                    return `add caption "${caption}" below image`;
                },
                watermark_add: (keywords, self) => {
                    const watermark = keywords.join(' ');
                    return `add watermark text "${watermark}"`;
                }
            },
            
            // 对象替换转换模式
            object_replacement: {
                complete_replace: (keywords, self) => {
                    // 处理 "apple - orange" 或 "apple to orange" 格式
                    const keywordText = keywords.join(' ');
                    let sourceObj, targetObj;
                    
                    if (keywordText.includes(' - ')) {
                        [sourceObj, targetObj] = keywordText.split(' - ').map(s => s.trim());
                    } else if (keywordText.includes('->')) {
                        // 兼容旧格式
                        [sourceObj, targetObj] = keywordText.split('->').map(s => s.trim());
                    } else if (keywordText.includes('→')) {
                        // 兼容旧的箭头符号
                        [sourceObj, targetObj] = keywordText.split('→').map(s => s.trim());
                    } else if (keywordText.includes(' to ')) {
                        [sourceObj, targetObj] = keywordText.split(' to ').map(s => s.trim());
                    } else if (keywordText.includes(' with ')) {
                        // "replace apple with orange" 格式
                        const replaceMatch = keywordText.match(/replace\s+(.+?)\s+with\s+(.+)/);
                        if (replaceMatch) {
                            sourceObj = replaceMatch[1];
                            targetObj = replaceMatch[2];
                        }
                    } else if (keywords.length >= 2) {
                        // 假设前两个词是源对象和目标对象
                        sourceObj = keywords[0];
                        targetObj = keywords[1];
                    } else {
                        // 只有一个关键词，假设替换为该对象
                        targetObj = keywords[0];
                        return `replace selected object with ${targetObj}`;
                    }
                    
                    if (sourceObj && targetObj) {
                        return `replace ${sourceObj} with ${targetObj}`;
                    } else if (targetObj) {
                        return `replace selected object with ${targetObj}`;
                    }
                    
                    return keywords.join(' ');
                },
                material_replace: (keywords, self) => {
                    const material = keywords.find(k => ['wood', 'metal', 'glass', 'plastic', 'stone', 'fabric'].includes(k)) || keywords[0];
                    return `change material to ${material}`;
                },
                logo_replace: (keywords, self) => {
                    const logo = keywords.join(' ');
                    return `replace logo with ${logo}`;
                },
                background_replace: (keywords, self) => {
                    const background = keywords.join(' ');
                    return `replace background with ${background}`;
                }
            },
            
            // 对象操作转换模式
            object_manipulation: {
                replace_object: (keywords, self) => {
                    // 处理 "apple - orange" 格式
                    const input = keywords.join(' ');
                    if (input.includes('-')) {
                        const parts = input.split('-').map(p => p.trim());
                        if (parts.length === 2) {
                            return `replace ${parts[0]} with ${parts[1]}`;
                        }
                    }
                    // 处理其他格式
                    if (keywords.length >= 2) {
                        const object = keywords[0];
                        const target = keywords.slice(1).join(' ');
                        return `replace ${object} with ${target}`;
                    }
                    return keywords.join(' ');
                },
                add_object: (keywords, self) => {
                    const object = keywords.join(' ');
                    return `add ${object} to the scene`;
                },
                remove_object: (keywords, self) => {
                    const object = keywords.join(' ');
                    return `remove ${object} from the scene`;
                },
                default: (keywords) => {
                    return keywords.join(' ');
                }
            },

            // 属性调整转换模式
            attribute_adjustment: {
                age_change: (keywords, self) => {
                    const ageKeyword = keywords.find(k => ['old', 'young', 'older', 'younger', 'elderly', 'teenager'].includes(k)) || keywords[0];
                    const subject = self.detectSubject(keywords);
                    return `make ${subject} ${ageKeyword}`;
                },
                hairstyle: (keywords, self) => {
                    const style = keywords.find(k => ['bald', 'long', 'short', 'curly', 'straight', 'ponytail'].includes(k)) || keywords[0];
                    const subject = self.detectSubject(keywords);
                    return `make ${subject} ${style}`;
                },
                clothing: (keywords, self) => {
                    const item = keywords[0];
                    const subject = self.detectSubject(keywords);
                    return `add ${item} to ${subject}`;
                },
                facial_feature: (keywords, self) => {
                    const feature = keywords[0];
                    const subject = self.detectSubject(keywords);
                    return `add ${feature} to ${subject}`;
                }
            },

            // 尺寸缩放转换模式  
            size_scale: {
                enlarge_object: (keywords, self) => {
                    const degree = keywords.find(k => ['much', 'slightly', 'extremely', 'very'].includes(k)) || '';
                    return `make ${degree} bigger`.trim();
                },
                shrink_object: (keywords, self) => {
                    const degree = keywords.find(k => ['much', 'slightly', 'extremely', 'very'].includes(k)) || '';
                    return `make ${degree} smaller`.trim();
                },
                proportion_adjust: (keywords, self) => {
                    return `adjust proportions ${keywords.join(' ')}`.trim();
                },
                size_normalize: (keywords, self) => {
                    return `normalize size to standard proportions`;
                }
            },

            // 位置移动转换模式
            position_movement: {
                location_change: (keywords, self) => {
                    const direction = keywords.find(k => ['left', 'right', 'up', 'down', 'center', 'corner'].includes(k)) || keywords[0];
                    return `move to ${direction}`;
                },
                rotation_adjust: (keywords, self) => {
                    const degree = keywords.find(k => k.includes('degree')) || keywords[0];
                    return `rotate ${degree}`;
                },
                spatial_arrangement: (keywords, self) => {
                    return `arrange ${keywords.join(' ')}`;
                },
                alignment_fix: (keywords, self) => {
                    const alignment = keywords.find(k => ['center', 'left', 'right', 'top', 'bottom'].includes(k)) || 'properly';
                    return `align ${alignment}`;
                }
            },

            // 材质纹理转换模式
            texture_material: {
                surface_texture: (keywords, self) => {
                    const texture = keywords.find(k => ['smooth', 'rough', 'glossy', 'matte', 'bumpy'].includes(k)) || keywords[0];
                    return `make surface ${texture}`;
                },
                material_change: (keywords, self) => {
                    const material = keywords.find(k => ['metallic', 'wooden', 'glass', 'fabric', 'plastic'].includes(k)) || keywords[0];
                    return `change material to ${material}`;
                },
                transparency_adjust: (keywords, self) => {
                    const level = keywords.find(k => ['transparent', 'opaque', 'translucent'].includes(k)) || 'transparent';
                    return `make ${level}`;
                },
                reflectivity_control: (keywords, self) => {
                    if (keywords.includes('reflection')) return 'add reflection effect';
                    return `adjust reflectivity ${keywords.join(' ')}`;
                }
            },
            
            // 全局状态转换模式
            state_transformation: {
                reality_conversion: (keywords, self) => {
                    const subject = self.detectSubject(keywords) || 'image';
                    const quality = keywords.find(k => ['photo', 'realistic', 'real'].includes(k)) ? 'realistic photo' : 'real';
                    return `make ${subject} ${quality}`;
                },
                virtual_processing: (keywords, self) => {
                    const style = keywords.find(k => ['digital', 'art', 'cartoon', '3d'].includes(k)) || 'digital art';
                    return `convert to ${style} style`;
                },
                material_conversion: (keywords, self) => {
                    const material = keywords.find(k => ['cinematic', 'professional', 'artistic'].includes(k)) || keywords[0];
                    return `convert to ${material} quality`;
                },
                concept_reconstruction: (keywords, self) => {
                    const concept = keywords.find(k => ['geometric', 'abstract', 'minimalist'].includes(k)) || keywords[0];
                    return `convert to ${concept} style`;
                },
                upscale_enhancement: (keywords, self) => {
                    // 基于训练数据集的高清化提示词模式
                    const qualityKeywords = keywords.filter(k => ['4k', '8k', 'hd', 'uhd', 'high', 'ultra', 'sharp', 'crisp', 'detailed', 'quality'].includes(k));
                    const basePrompt = qualityKeywords.length > 0 ? qualityKeywords.join(' ') : 'high quality detailed';
                    
                    // 根据关键词组合生成优化的高清化提示词
                    if (keywords.includes('4k') || keywords.includes('8k')) {
                        return `upscale to ${keywords.includes('8k') ? '8K' : '4K'} ultra high definition, sharp details, crisp quality`;
                    } else if (keywords.includes('sharp') || keywords.includes('crisp')) {
                        return `enhance sharpness and detail quality, crisp high definition`;
                    } else if (keywords.includes('detailed')) {
                        return `enhance fine details, high quality textures, professional grade`;
                    } else {
                        return `upscale to high definition, enhanced detail quality, sharp and crisp`;
                    }
                }
            },
            
            // 创意重构转换模式 - 基于Style Reference训练数据
            scene_building: {
                // 直接处理完整的关键词短语，不需要具体操作类型
                default: (keywords, self) => {
                    const concept = keywords.join(' ');
                    return `${concept}, fantasy art style, highly detailed, cinematic lighting, masterpiece`;
                }
            },
            style_creation: {
                default: (keywords, self) => {
                    const style = keywords.join(' ');
                    return `artwork in ${style}, professional masterpiece, trending on artstation, highly detailed`;
                }
            },
            character_action: {
                default: (keywords, self) => {
                    const action = keywords.join(' ');
                    return `${action}, dynamic pose, cinematic composition, dramatic lighting, professional photography`;
                }
            },
            media_transformation: {
                default: (keywords, self) => {
                    const medium = keywords.join(' ');
                    return `${medium}, intricate details, professional craftsmanship, museum quality, highly detailed`;
                }
            },
            environment_reconstruction: {
                default: (keywords, self) => {
                    const environment = keywords.join(' ');
                    return `${environment}, epic landscape, atmospheric perspective, highly detailed, cinematic`;
                }
            },
            material_transformation: {
                default: (keywords, self) => {
                    const material = keywords.join(' ');
                    return `${material}, realistic textures, subsurface scattering, physical based rendering, 8k resolution`;
                }
            },
              
            // 默认转换模式
            default: {
                default: (keywords) => {
                    return keywords.join(' ');
                }
            }
        };
    },

    // 构建完整提示词
    buildPromptFromKeywords(pattern, specificOperation, keywordList, editingType) {
        try {
            // 获取特定操作的转换函数
            const conversionFunc = pattern[specificOperation] || pattern.default || ((k) => k.join(' '));
            
            // 执行转换，传递self引用
            const result = conversionFunc(keywordList, this);
            
            // 确保结果是字符串
            return typeof result === 'string' ? result : keywordList.join(' ');
        } catch (error) {
            console.warn('Keyword conversion failed:', error);
            return keywordList.join(' ');
        }
    },

    // 辅助方法：检测主体对象
    detectSubject(keywords) {
        const subjects = ['person', 'character', 'figure', 'man', 'woman', 'him', 'her'];
        const found = keywords.find(k => subjects.includes(k));
        return found || 'subject';
    },

    // 辅助方法：检测颜色
    detectColor(keywords) {
        const colors = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'black', 'white', 'brown', 'gray', 'gold', 'silver', 'rainbow'];
        return keywords.find(k => colors.includes(k)) || keywords[0];
    },

    // 辅助方法：检测对象
    detectObject(keywords) {
        const objects = ['cat', 'dog', 'car', 'house', 'tree', 'person', 'dress', 'shirt', 'hair'];
        const found = keywords.find(k => objects.includes(k));
        return found || 'object';
    },

    // 辅助方法：检测位置
    detectLocation(keywords) {
        const locations = ['left', 'right', 'top', 'bottom', 'center', 'above', 'below', 'beneath', 'next to', 'behind', 'in front'];
        return keywords.find(k => locations.includes(k));
    },

    // 辅助方法：判断是否为颜色
    isColor(word) {
        const colors = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'black', 'white', 'brown', 'gray', 'gold', 'silver'];
        return colors.includes(word);
    },

    // 智能约束选择算法（基于1026数据集分析）
    generateEnhancedConstraints(operationType, description, editingIntent, processingStyle) {
        try {
            // 第一步：分析认知负荷
            const cognitiveLoad = this.calculateCognitiveLoad(description, editingIntent, operationType);
            
            // 第二步：选择操作特异性约束
            const operationConstraints = this.selectOperationConstraints(operationType, processingStyle);
            
            // 第三步：选择认知负荷自适应约束
            const cognitiveConstraints = this.selectCognitiveConstraints(cognitiveLoad);
            
            // 第四步：选择应用场景约束
            const contextConstraints = this.selectContextConstraints(editingIntent);
            
            // 第五步：应用语义修饰词
            const semanticModifiers = this.selectSemanticModifiers(cognitiveLoad, processingStyle);
            
            return {
                operation_constraints: operationConstraints,
                cognitive_constraints: cognitiveConstraints,
                context_constraints: contextConstraints,
                semantic_modifiers: semanticModifiers,
                cognitive_load: cognitiveLoad,
                constraint_density: operationConstraints.length + cognitiveConstraints.length + contextConstraints.length
            };
        } catch (error) {
            console.warn('Enhanced constraint generation failed, using fallback:', error);
            return this.generateFallbackConstraints(operationType, description);
        }
    },
    
    // 认知负荷计算（基于1026数据集编辑复杂度分析）
    calculateCognitiveLoad(description, editingIntent, operationType) {
        // 基础认知负荷映射（来自1026数据集分析）
        const baseLoads = {
            "local_editing": 2.695,
            "global_editing": 3.229, 
            "text_editing": 3.457,
            "creative_reconstruction": 5.794
        };
        
        let baseLoad = baseLoads[editingIntent] || baseLoads["local_editing"];
        
        // 操作类型修正
        const operationFactors = {
            "add_operations": 1.1,
            "color_modification": 0.9,
            "remove_operations": 1.3,
            "shape_operations": 1.4,
            "text_operations": 1.2,
            "background_operations": 1.6
        };
        
        baseLoad *= (operationFactors[operationType] || 1.0);
        
        // 描述复杂度分析
        const descriptionLower = (description || "").toLowerCase();
        const complexityFactors = {
            "multiple_objects": 1.3,
            "creative_concept": 1.8,
            "artistic_style": 1.5,
            "technical_precision": 1.2
        };
        
        if (descriptionLower.includes("multiple") || descriptionLower.includes("all") || descriptionLower.includes("several")) {
            baseLoad *= complexityFactors["multiple_objects"];
        } else if (descriptionLower.includes("creative") || descriptionLower.includes("artistic") || descriptionLower.includes("imagine")) {
            baseLoad *= complexityFactors["creative_concept"];
        } else if (descriptionLower.includes("style") || descriptionLower.includes("art") || descriptionLower.includes("painting")) {
            baseLoad *= complexityFactors["artistic_style"];
        } else if (descriptionLower.includes("precise") || descriptionLower.includes("exact") || descriptionLower.includes("detailed")) {
            baseLoad *= complexityFactors["technical_precision"];
        }
        
        return Math.min(baseLoad, 6.0); // 上限6.0
    },
    
    // 选择操作特异性约束
    selectOperationConstraints(operationType, processingStyle) {
        const constraints = this.ENHANCED_CONSTRAINT_SYSTEM.operation_constraints[operationType];
        if (!constraints) return [];
        
        // 根据处理风格选择约束类型
        let selectedType = "technical";
        if (processingStyle === "artistic" || processingStyle === "creative") {
            selectedType = "aesthetic";
        } else if (processingStyle === "professional" || processingStyle === "commercial") {
            selectedType = "quality";
        }
        
        const typeConstraints = constraints[selectedType] || constraints.technical || [];
        
        // 随机选择2-3个约束避免过载
        const selectedConstraints = [];
        const shuffled = [...typeConstraints].sort(() => 0.5 - Math.random());
        const count = Math.min(3, Math.max(2, Math.floor(shuffled.length * 0.6)));
        
        return shuffled.slice(0, count);
    },
    
    // 选择认知负荷自适应约束
    selectCognitiveConstraints(cognitiveLoad) {
        let loadCategory = "low_load_2_7";
        if (cognitiveLoad >= 5.5) {
            loadCategory = "high_load_5_8";
        } else if (cognitiveLoad >= 3.4) {
            loadCategory = "medium_high_load_3_5";
        } else if (cognitiveLoad >= 3.1) {
            loadCategory = "medium_load_3_2";
        }
        
        const constraints = this.ENHANCED_CONSTRAINT_SYSTEM.cognitive_constraints[loadCategory] || [];
        
        // 根据认知负荷选择约束数量
        const constraintCount = Math.min(2, Math.max(1, Math.floor(cognitiveLoad - 2)));
        const shuffled = [...constraints].sort(() => 0.5 - Math.random());
        
        return shuffled.slice(0, constraintCount);
    },
    
    // 选择应用场景约束
    selectContextConstraints(editingIntent) {
        // 编辑意图到应用场景的映射
        const contextMapping = {
            "local_editing": "product_showcase",
            "global_editing": "marketing_communication", 
            "creative_reconstruction": "creative_expression",
            "text_editing": "marketing_communication",
            "professional_operations": "product_showcase"
        };
        
        const contextType = contextMapping[editingIntent] || "product_showcase";
        const constraints = this.ENHANCED_CONSTRAINT_SYSTEM.context_constraints[contextType] || [];
        
        // 选择1-2个上下文约束
        const shuffled = [...constraints].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 2);
    },
    
    // 选择语义修饰词
    selectSemanticModifiers(cognitiveLoad, processingStyle) {
        let modifierLevel = "level_1_technical";
        if (cognitiveLoad >= 5.0) {
            modifierLevel = "level_3_creative";
        } else if (cognitiveLoad >= 3.5) {
            modifierLevel = "level_2_professional";
        }
        
        // 根据处理风格调整修饰词级别
        if (processingStyle === "artistic" || processingStyle === "creative") {
            modifierLevel = "level_3_creative";
        } else if (processingStyle === "professional") {
            modifierLevel = "level_2_professional";
        }
        
        const modifiers = this.SEMANTIC_MODIFIERS[modifierLevel] || this.SEMANTIC_MODIFIERS.level_1_technical;
        
        // 选择2-4个修饰词
        const shuffled = [...modifiers].sort(() => 0.5 - Math.random());
        const count = Math.min(4, Math.max(2, Math.floor(cognitiveLoad)));
        
        return shuffled.slice(0, count);
    },
    
    // 备用约束生成（基本版本）
    generateFallbackConstraints(operationType, description) {
        return {
            operation_constraints: ["professional quality output", "seamless integration"],
            cognitive_constraints: ["clear execution path"],
            context_constraints: ["maintain visual consistency"],
            semantic_modifiers: ["professional", "precise"],
            cognitive_load: 3.0,
            constraint_density: 5
        };
    },
    
    // 生成带中英文对照的增强约束（前端显示中文，生成时保存英文）
    generateEnhancedConstraintsWithTranslation(operationType, description, editingIntent, processingStyle) {
        // 先生成英文约束
        const englishResult = this.generateEnhancedConstraints(operationType, description, editingIntent, processingStyle);
        
        // 转换为中文显示
        const chineseResult = {
            // 显示用的中文约束
            display_operation_constraints: englishResult.operation_constraints.map(c => 
                this.CONSTRAINT_TRANSLATIONS[c] || c
            ),
            display_cognitive_constraints: englishResult.cognitive_constraints.map(c => 
                this.CONSTRAINT_TRANSLATIONS[c] || c
            ),
            display_context_constraints: englishResult.context_constraints.map(c => 
                this.CONSTRAINT_TRANSLATIONS[c] || c
            ),
            display_semantic_modifiers: englishResult.semantic_modifiers.map(m => 
                this.MODIFIER_TRANSLATIONS[m] || m
            ),
            
            // 生成用的英文约束（原始）
            operation_constraints: englishResult.operation_constraints,
            cognitive_constraints: englishResult.cognitive_constraints,
            context_constraints: englishResult.context_constraints,
            semantic_modifiers: englishResult.semantic_modifiers,
            
            // 其他属性保持不变
            cognitive_load: englishResult.cognitive_load,
            constraint_density: englishResult.constraint_density
        };
        
        return chineseResult;
    },

    // 自动操作类型检测系统 - 基于系统中实际存在的操作类型
    autoDetectOperationType(description) {
        if (!description || typeof description !== 'string') {
            return { operationType: 'remove_operations', specificOperation: 'content_remove' };
        }

        const text = description.toLowerCase().trim();
        
        // 1. 对象替换检测 (最高优先级) - 检测 "A - B" 格式
        if (text.includes(' - ') || text.includes('->') || text.includes('→') || 
            text.includes(' to ') || text.match(/replace\s+.+\s+with/)) {
            return { operationType: 'object_replacement', specificOperation: 'complete_replace' };
        }
        
        // 2. 颜色修改检测
        if (text.match(/\b(red|blue|green|yellow|black|white|pink|purple|orange|brown|gray|grey|color|colour)\b/)) {
            return { operationType: 'color_modification', specificOperation: 'single_color' };
        }
        
        // 3. 移除操作检测
        if (text.match(/\b(remove|delete|erase|clear|eliminate)\b/)) {
            return { operationType: 'remove_operations', specificOperation: 'content_remove' };
        }
        
        // 4. 添加操作检测
        if (text.match(/\b(add|insert|place|put|create)\b/)) {
            return { operationType: 'add_operations', specificOperation: 'object_addition' };
        }
        
        // 5. 形状操作检测
        if (text.match(/\b(resize|scale|rotate|move|transform|stretch|shrink|bigger|smaller|larger)\b/)) {
            return { operationType: 'shape_operations', specificOperation: 'size_adjustment' };
        }
        
        // 6. 文本操作检测
        if (text.match(/\b(text|word|letter|font|write)\b/)) {
            return { operationType: 'text_operations', specificOperation: 'text_content' };
        }
        
        // 7. 背景操作检测
        if (text.match(/\b(background|backdrop)\b/)) {
            return { operationType: 'background_operations', specificOperation: 'background_replace' };
        }
        
        // 8. 形状变换检测 (表情和姿态)
        if (text.match(/\b(smile|frown|happy|sad|angry|surprised|wave|point|sit|stand|run|walk)\b/)) {
            return { operationType: 'shape_transformation', specificOperation: 'facial_expression' };
        }
        
        // 9. 默认对于简短的两个词描述，通常是对象替换
        const words = text.split(/\s+/).filter(w => w.length > 0);
        if (words.length === 2) {
            return { operationType: 'object_replacement', specificOperation: 'complete_replace' };
        }
        
        // 默认返回移除操作
        return { operationType: 'remove_operations', specificOperation: 'content_remove' };
    },

    // 根据操作类型获取固定的约束和修饰词
    getConstraintsForOperation(operationType) {
        // 映射操作类型到约束系统
        const operationMap = {
            // 基础操作类型
            'object_removal': 'object_removal',
            'object_replacement': 'object_replacement', 
            'color_modification': 'color_modification',
            'shape_operations': 'shape_operations',
            'add_operations': 'add_operations',
            'shape_transformation': 'shape_operations',
            'attribute_adjustment': 'default',
            'size_scale': 'shape_operations',
            'position_movement': 'shape_operations', 
            'texture_material': 'color_modification',
            'object_addition': 'add_operations',
            
            // 全局编辑操作类型
            'state_transformation': 'color_modification',
            'artistic_style': 'color_modification',
            'perspective_composition': 'shape_operations',
            'environment_atmosphere': 'color_modification',
            'background_replacement': 'object_replacement',
            'color_scheme': 'color_modification',
            'filter_effects': 'color_modification',
            
            // 文字编辑操作类型
            'content_replace': 'object_replacement',
            'content_add': 'add_operations',
            'style_modify': 'color_modification',
            'size_adjust': 'shape_operations',
            'position_change': 'shape_operations',
            'text_remove': 'object_removal',
            
            // 专业操作类型
            'ecommerce': 'color_modification',
            'portrait': 'object_replacement',
            'architecture': 'shape_operations',
            'food': 'color_modification',
            'fashion': 'color_modification',
            'nature': 'color_modification'
        };

        const mappedType = operationMap[operationType] || 'default';
        const constraintData = this.OPERATION_SPECIFIC_CONSTRAINTS[mappedType];
        
        if (!constraintData) {
            return this.OPERATION_SPECIFIC_CONSTRAINTS.default;
        }

        return constraintData;
    }
};

// 创建双下拉框UI组件
window.KontextMenuSystem.createDropdownUI = function(container, callbacks = {}) {
    const menuSystem = this;
    
    // 清空容器
    container.innerHTML = '';
    
    // 创建下拉框容器
    const dropdownContainer = document.createElement('div');
    dropdownContainer.className = 'kontext-dropdown-container';
    dropdownContainer.style.cssText = `
        display: flex;
        gap: 16px;
        padding: 12px;
        background: #1a1a1a;
        border-bottom: 1px solid #444;
        align-items: end;
    `;
    
    // 第一个下拉框 - 操作类型
    const operationGroup = document.createElement('div');
    operationGroup.className = 'dropdown-group';
    operationGroup.style.cssText = 'flex: 1;';
    
    const operationLabel = document.createElement('label');
    operationLabel.textContent = '操作类型:';
    operationLabel.style.cssText = `
        display: block;
        margin-bottom: 6px;
        font-size: 9px;
        color: #ccc;
        font-weight: 500;
    `;
    
    const operationSelect = document.createElement('select');
    operationSelect.className = 'operation-select';
    operationSelect.style.cssText = `
        width: 100%;
        padding: 6px 8px;
        background: #2a2a2a;
        border: 1px solid #555;
        border-radius: 4px;
        color: #fff;
        font-size: 12px;
        cursor: pointer;
    `;
    
    operationGroup.appendChild(operationLabel);
    operationGroup.appendChild(operationSelect);
    
    // 第二个下拉框 - 具体操作
    const specificGroup = document.createElement('div');
    specificGroup.className = 'dropdown-group';
    specificGroup.style.cssText = 'flex: 1;';
    
    const specificLabel = document.createElement('label');
    specificLabel.textContent = '具体操作:';
    specificLabel.style.cssText = operationLabel.style.cssText;
    
    const specificSelect = document.createElement('select');
    specificSelect.className = 'specific-select';
    specificSelect.style.cssText = operationSelect.style.cssText;
    specificSelect.disabled = true;
    
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '请先选择操作类型';
    specificSelect.appendChild(defaultOption);
    
    specificGroup.appendChild(specificLabel);
    specificGroup.appendChild(specificSelect);
    
    // 添加到容器
    dropdownContainer.appendChild(operationGroup);
    dropdownContainer.appendChild(specificGroup);
    container.appendChild(dropdownContainer);
    
    // 复杂度提示区域
    const hintArea = document.createElement('div');
    hintArea.className = 'operation-hint';
    hintArea.style.cssText = `
        padding: 8px 12px;
        background: #0d1117;
        border-bottom: 1px solid #444;
        font-size: 9px;
        color: #888;
        display: none;
    `;
    container.appendChild(hintArea);
    
    // 事件处理
    let currentEditingType = '';
    
    // 更新操作类型选项
    function updateOperationTypes(editingType) {
        currentEditingType = editingType;
        
        // 清空操作类型选项
        operationSelect.innerHTML = '<option value="">选择操作类型</option>';
        
        // 重置具体操作
        specificSelect.innerHTML = '<option value="">请先选择操作类型</option>';
        specificSelect.disabled = true;
        hintArea.style.display = 'none';
        
        if (!editingType) return;
        
        // 添加新选项
        const operations = menuSystem.getOperationConfig(editingType);
        operations.forEach(operation => {
            const option = document.createElement('option');
            option.value = operation.id;
            option.textContent = menuSystem.getOperationDisplayName(operation);
            operationSelect.appendChild(option);
        });
        
        // 显示复杂度信息
        const config = menuSystem.EDITING_TYPES_CONFIG[editingType];
        if (config) {
            hintArea.innerHTML = `
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span>${config.description}</span>
                    ${config.badge ? `<span style="background: #333; padding: 2px 6px; border-radius: 3px;">${config.badge}</span>` : ''}
                </div>
            `;
            hintArea.style.display = 'block';
        }
    }
    
    // 操作类型选择变化
    operationSelect.addEventListener('change', function() {
        const operationType = this.value;
        
        // 清空具体操作
        specificSelect.innerHTML = '<option value="">选择具体操作</option>';
        
        if (!operationType) {
            specificSelect.disabled = true;
            return;
        }
        
        // 添加具体操作选项
        const specifics = menuSystem.getSpecificConfig(currentEditingType, operationType);
        specifics.forEach(specific => {
            const option = document.createElement('option');
            option.value = specific.id;
            option.textContent = menuSystem.getSpecificDisplayName(specific);
            specificSelect.appendChild(option);
        });
        
        specificSelect.disabled = false;
        
        // 回调
        if (callbacks.onOperationChange) {
            callbacks.onOperationChange(currentEditingType, operationType);
        }
    });
    
    // 具体操作选择变化
    specificSelect.addEventListener('change', function() {
        const specificOperation = this.value;
        
        if (callbacks.onSpecificChange) {
            callbacks.onSpecificChange(currentEditingType, operationSelect.value, specificOperation);
        }
    });
    
    // 返回更新函数
    return {
        updateOperationTypes,
        setEditingType: updateOperationTypes,  // 添加别名方法
        getSelectedOperation: () => operationSelect.value,
        getSelectedSpecific: () => specificSelect.value,
        reset: () => {
            operationSelect.selectedIndex = 0;
            specificSelect.innerHTML = '<option value="">请先选择操作类型</option>';
            specificSelect.disabled = true;
            hintArea.style.display = 'none';
        }
    };
};

console.log('✅ Kontext Menu System v3.0.0 with Enhanced Constraint System loaded');

