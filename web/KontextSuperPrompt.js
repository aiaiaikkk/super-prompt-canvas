// Kontext Super Prompt Node - 完整复现Visual Prompt Editor功能
import { app } from "../../scripts/app.js";
import { api } from "../../scripts/api.js";

// Kontext Super Prompt 命名空间 - 资源隔离机制
window.KontextSuperPromptNS = window.KontextSuperPromptNS || {
    instances: new Map(), // 存储所有实例
    constants: {},        // 存储常量
    utils: {},           // 存储工具函数
    version: '1.3.4',    // 版本信息
    
    // 注册实例
    registerInstance(nodeId, instance) {
        this.instances.set(nodeId, instance);
    },
    
    // 注销实例
    unregisterInstance(nodeId) {
        if (this.instances.has(nodeId)) {
            const instance = this.instances.get(nodeId);
            if (instance && instance.cleanup) {
                instance.cleanup();
            }
            this.instances.delete(nodeId);
        }
    },
    
    // 获取实例
    getInstance(nodeId) {
        return this.instances.get(nodeId);
    },
    
    // 清理所有实例
    cleanup() {
        this.instances.forEach((instance, nodeId) => {
            this.unregisterInstance(nodeId);
        });
    },
    
    // 性能监控工具
    performance: {
        metrics: new Map(),
        
        // 开始性能计时
        startTimer(key, label = '') {
            this.metrics.set(key, {
                label: label || key,
                startTime: performance.now(),
                endTime: null,
                duration: null,
                memoryStart: this.getMemoryUsage()
            });
        },
        
        // 结束性能计时
        endTimer(key) {
            const metric = this.metrics.get(key);
            if (metric) {
                metric.endTime = performance.now();
                metric.duration = metric.endTime - metric.startTime;
                metric.memoryEnd = this.getMemoryUsage();
                metric.memoryDelta = metric.memoryEnd - metric.memoryStart;
                
                return metric;
            }
            return null;
        },
        
        // 获取内存使用情况
        getMemoryUsage() {
            if (performance.memory) {
                return performance.memory.usedJSHeapSize / 1024 / 1024; // MB
            }
            return 0;
        },
        
        // 获取性能报告
        getReport() {
            const report = {
                totalMetrics: this.metrics.size,
                completedMetrics: 0,
                totalTime: 0,
                memoryUsage: this.getMemoryUsage(),
                details: []
            };
            
            this.metrics.forEach((metric, key) => {
                if (metric.duration !== null) {
                    report.completedMetrics++;
                    report.totalTime += metric.duration;
                    report.details.push({
                        key,
                        label: metric.label,
                        duration: metric.duration,
                        memoryDelta: metric.memoryDelta
                    });
                }
            });
            
            return report;
        },
        
        // 清理性能指标
        clear() {
            this.metrics.clear();
        }
    }
};

// 将常量移到命名空间中
const KSP_NS = window.KontextSuperPromptNS;

// 确保constants对象已初始化
if (!KSP_NS.constants) {
    KSP_NS.constants = {};
}

// 编辑意图引导词模板
KSP_NS.constants.INTENT_PROMPTS = {
    color_change: "Transform {target} color to {new_color}, maintain original lighting and texture, professional color grading, natural color transition",
    object_removal: "Remove {object} completely, seamlessly fill background, maintain perspective and lighting consistency, clean removal, invisible editing",
    object_replacement: "Replace {original_object} with {new_object}, match lighting, scale, and perspective of original scene, seamless integration",
    object_addition: "Add {new_object} to {location}, integrate naturally with existing lighting, shadows, and perspective, realistic insertion",
    background_change: "Replace background with {new_background}, maintain subject lighting and edges, seamless composition, perfect edge detection",
    face_swap: "Replace face with {target_face}, maintain original pose, lighting, and facial expression naturally, seamless face swap",
    quality_enhancement: "Enhance image quality, increase resolution, reduce noise, sharpen details while maintaining natural appearance",
    image_restoration: "Repair damaged areas, restore missing parts, fix {defect_type}, maintain original image style and quality",
    style_transfer: "Transform image to {target_style} style, maintain subject recognition while applying artistic interpretation",
    text_edit: "Edit text from '{original_text}' to '{new_text}', maintain font style, perspective, and integration",
    lighting_adjustment: "Adjust lighting to {lighting_description}, modify shadows and highlights while maintaining natural appearance",
    perspective_correction: "Correct perspective distortion, straighten {target_elements}, maintain proportions and natural geometry",
    blur_sharpen: "Apply {blur_type} effect to {target_area}, create {desired_effect} while maintaining image quality",
    local_deformation: "Modify {target_area} shape/size, apply {transformation_type}, maintain natural proportions and context",
    composition_adjustment: "Reframe composition to {new_composition}, adjust {framing_elements}, maintain visual balance"
};

// 应用场景引导词模板
KSP_NS.constants.SCENE_PROMPTS = {
    ecommerce_product: "Clean product presentation, neutral background, even lighting, sharp details, commercial photography standard",
    social_media: "Engaging visual content, trendy aesthetics, platform-optimized format, eye-catching appeal, vibrant color palette",
    marketing_campaign: "Bold promotional imagery, campaign-driven aesthetics, brand message support, conversion-focused visuals",
    portrait_professional: "Professional headshot quality, executive presence, corporate standard, confidence projection",
    lifestyle: "Authentic lifestyle representation, aspirational living, natural moments, relatable scenarios",
    food_photography: "Appetizing food presentation, culinary artistry, restaurant quality, food styling excellence",
    real_estate: "Property showcase excellence, architectural photography, space maximization, luxury presentation",
    fashion_retail: "Fashion photography excellence, style showcase, trend representation, retail presentation",
    automotive: "Automotive photography excellence, vehicle showcase, performance emphasis, luxury automobile presentation",
    beauty_cosmetics: "Beauty product excellence, cosmetic presentation, skin tone accuracy, makeup artistry showcase",
    corporate_branding: "Corporate brand representation, professional identity, business excellence, brand consistency",
    event_photography: "Event documentation excellence, moment capture, celebration atmosphere, professional event photography",
    product_catalog: "Catalog photography standard, product line presentation, systematic showcase, inventory documentation",
    artistic_creation: "Artistic expression freedom, creative vision support, fine art quality, gallery presentation",
    documentary: "Documentary authenticity, journalistic integrity, real moment capture, storytelling excellence"
};

// 将常量存储到命名空间，避免全局污染
KSP_NS.constants.OPERATION_CATEGORIES = {
    local: {
        name: '🎯 局部编辑',
        description: 'Local object-specific editing operations',
        templates: [
            'add_object', 'change_color', 'change_style', 'replace_object', 'remove_object',
            'change_texture', 'change_pose', 'change_expression', 'change_clothing', 'change_background',
            'enhance_quality', 'blur_background', 'adjust_lighting', 'resize_object', 'enhance_skin_texture',
            'character_expression', 'character_hair', 'character_accessories'
        ]
    },
    global: {
        name: '🌍 全局编辑', 
        description: 'Whole image processing operations',
        templates: [
            'global_color_grade', 'global_style_transfer', 'global_brightness_contrast',
            'global_hue_saturation', 'global_sharpen_blur', 'global_noise_reduction',
            'global_enhance', 'global_filter', 'character_age', 'detail_enhance',
            'realism_enhance', 'camera_operation', 'global_perspective'
        ]
    },
    text: {
        name: '📝 文字编辑',
        description: 'Text editing and manipulation operations',
        templates: ['text_add', 'text_remove', 'text_edit', 'text_resize', 'object_combine']
    },
    professional: {
        name: '🔧 专业操作',
        description: 'Advanced professional editing tools', 
        templates: [
            'geometric_warp', 'perspective_transform', 'lens_distortion', 'content_aware_fill',
            'seamless_removal', 'smart_patch', 'style_blending', 'collage_integration',
            'texture_mixing', 'precision_cutout', 'alpha_composite', 'mask_feathering', 'depth_composite',
            'professional_product', 'zoom_focus', 'stylize_local', 'custom'
        ]
    },
    api: {
        name: '🌐 远程API',
        description: 'Remote cloud AI model enhancement',
        templates: ['api_enhance']
    },
    ollama: {
        name: '🦙 本地Ollama',
        description: 'Local Ollama model enhancement',
        templates: ['ollama_enhance']
    }
};

KSP_NS.constants.OPERATION_TEMPLATES = {
    'change_color': { template: 'transform {object} color to {target}', label: '颜色变换', category: 'local' },
    'change_style': { template: 'reimagine {object} in {target} aesthetic', label: '风格重构', category: 'local' },
    'replace_object': { template: 'thoughtfully replace {object} with {target}', label: '智能替换', category: 'local' },
    'add_object': { template: 'thoughtfully introduce {target} to complement {object}', label: '智能添加', category: 'local' },
    'remove_object': { template: 'seamlessly eliminate {object} while preserving scene integrity', label: '无缝移除', category: 'local' },
    'change_texture': { template: 'transform {object} surface to {target} texture', label: '纹理增强', category: 'local' },
    'change_pose': { template: 'guide {object} into {target} pose', label: '姿态调整', category: 'local' },
    'change_expression': { template: 'inspire {object} with {target} expression', label: '表情增强', category: 'local' },
    'change_clothing': { template: 'dress {object} in {target} attire', label: '服装造型', category: 'local' },
    'change_background': { template: 'change the background to {target}', label: '背景更改', category: 'local' },
    'enhance_quality': { template: 'enhance {object} quality', label: '质量增强', category: 'local' },
    'blur_background': { template: 'blur the background behind {object}', label: '背景虚化', category: 'local' },
    'adjust_lighting': { template: 'adjust lighting on {object}', label: '光照调整', category: 'local' },
    'resize_object': { template: 'make {object} {target} size', label: '大小调整', category: 'local' },
    'enhance_skin_texture': { template: 'enhance skin texture while {target}', label: '皮肤纹理增强', category: 'local' },
    'character_expression': { template: 'change character expression to {target}', label: '角色表情', category: 'local' },
    'character_hair': { template: 'change character hair to {target}', label: '角色发型', category: 'local' },
    'character_accessories': { template: 'add {target} accessories to character', label: '角色配饰', category: 'local' },
    
    'global_color_grade': { template: 'apply {target} color grading to entire image', label: '色彩分级', category: 'global' },
    'global_style_transfer': { template: 'turn entire image into {target} style', label: '风格转换', category: 'global' },
    'global_brightness_contrast': { template: 'adjust image brightness and contrast to {target}', label: '亮度对比度', category: 'global' },
    'global_hue_saturation': { template: 'change image hue and saturation to {target}', label: '色相饱和度', category: 'global' },
    'global_sharpen_blur': { template: 'apply {target} sharpening to entire image', label: '锐化模糊', category: 'global' },
    'global_noise_reduction': { template: 'reduce noise in entire image', label: '噪点消除', category: 'global' },
    'global_enhance': { template: 'enhance entire image quality', label: '全局增强', category: 'global' },
    'global_filter': { template: 'apply {target} filter to entire image', label: '滤镜效果', category: 'global' },
    'character_age': { template: 'make the person look {target}', label: '年龄调整', category: 'global' },
    'detail_enhance': { template: 'add more details to {object}', label: '细节增强', category: 'global' },
    'realism_enhance': { template: 'make {object} more realistic', label: '真实感增强', category: 'global' },
    'camera_operation': { template: 'zoom out and show {target}', label: '镜头操作', category: 'global' },
    'global_perspective': { template: 'adjust global perspective to {target}', label: '全局透视', category: 'global' },
    
    'text_add': { template: 'add text saying "{target}"', label: '添加文字', category: 'text' },
    'text_remove': { template: 'remove the text', label: '移除文字', category: 'text' },
    'text_edit': { template: 'change the text to "{target}"', label: '编辑文字', category: 'text' },
    'text_resize': { template: 'make the text {target} size', label: '文字大小', category: 'text' },
    'object_combine': { template: 'combine text with {target}', label: '对象合并', category: 'text' },
    
    'geometric_warp': { template: 'apply {target} geometric transformation', label: '几何变形', category: 'professional' },
    'perspective_transform': { template: 'transform perspective to {target}', label: '透视变换', category: 'professional' },
    'lens_distortion': { template: 'correct lens distortion with {target}', label: '镜头畸变', category: 'professional' },
    'content_aware_fill': { template: 'fill selected area with {target}', label: '内容感知填充', category: 'professional' },
    'seamless_removal': { template: 'seamlessly remove {target}', label: '无缝移除', category: 'professional' },
    'smart_patch': { template: 'smart patch with {target}', label: '智能修补', category: 'professional' },
    'style_blending': { template: 'blend styles with {target}', label: '风格混合', category: 'professional' },
    'collage_integration': { template: 'integrate into collage with {target}', label: '拼贴集成', category: 'professional' },
    'texture_mixing': { template: 'mix textures with {target}', label: '纹理混合', category: 'professional' },
    'precision_cutout': { template: 'precise cutout of {target}', label: '精确抠图', category: 'professional' },
    'alpha_composite': { template: 'composite with alpha using {target}', label: '透明合成', category: 'professional' },
    'mask_feathering': { template: 'feather mask edges with {target}', label: '遮罩羽化', category: 'professional' },
    'depth_composite': { template: 'composite with depth using {target}', label: '深度合成', category: 'professional' },
    'professional_product': { template: 'create professional product presentation with {target}', label: '专业产品', category: 'professional' },
    'zoom_focus': { template: 'apply zoom focus effect with {target}', label: '缩放聚焦', category: 'professional' },
    'stylize_local': { template: 'apply local stylization with {target}', label: '局部风格化', category: 'professional' },
    'custom': { template: 'apply custom editing with {target}', label: '自定义', category: 'professional' },
    
    // API和Ollama增强模板
    'api_enhance': { template: 'enhance with cloud AI model: {target}', label: 'AI增强', category: 'api' },
    'ollama_enhance': { template: 'enhance with local Ollama model: {target}', label: 'Ollama增强', category: 'ollama' }
};

KSP_NS.constants.CONSTRAINT_PROMPTS = {
    // === 🎨 外观转换约束 ===
    'change_color': [
        '保持原始材质纹理（织物编织、皮肤毛孔、表面粗糙度）',
        '保持重新着色表面的一致性光照反射和阴影',
        '避免颜色渗入相邻物体或区域',
        '保持相对于场景光照的相同饱和度和亮度水平'
    ],
    
    'replace_object': [
        '匹配原始物体的精确透视角度和观察方向',
        '复制场景中的光照方向、强度和色温',
        '缩放替换物以保持现实的比例关系',
        '集成与场景光照条件匹配的投射阴影'
    ],
    
    'change_style': [
        '保持物体的基本几何结构和比例',
        '在应用风格元素时保持可识别的关键特征',
        '确保风格变化不与周围的真实环境冲突',
        '保持边缘过渡平滑以避免刺眼的视觉断裂'
    ],

    'change_expression': [
        '保持双侧面部对称和自然的肌肉运动模式',
        '保持个人面部特征和骨骼结构特征',
        '确保表情变化遵循现实的面部解剖约束',
        '保持眼神接触方向和注视焦点与原始一致'
    ],
    
    'change_clothing': [
        '确保织物悬垂遵循现实物理和身体轮廓',
        '将服装风格与个人的年龄、体型和场合背景相匹配',
        '保持与肤色和周围环境的适当色彩和谐',
        '保持通过服装可见的原始身体比例'
    ],
    
    'change_texture': [
        '保持原始表面材质的物理光学属性（反射率、粗糙度、折射率）',
        '确保新纹理与原始几何形状和曲面完美贴合',
        '维持纹理映射的透视正确性和比例一致性',
        '避免纹理替换造成的光照不匹配或阴影异常'
    ],
    
    'change_pose': [
        '遵循人体解剖关节限制和自然的运动范围',
        '保持现实的重量分布和平衡点',
        '在姿势变化过程中保持肌肉张力一致性',
        '确保新姿势在环境背景中逻辑合理'
    ],

    'change_background': [
        '匹配大气透视深度线索（色温、对比度淡化）',
        '使光照方向和色温与新环境对齐',
        '保持主体和背景之间的边缘质量和自然互动',
        '保持前景和背景元素之间一致的比例关系'
    ],
    
    'add_object': [
        '根据场景中的距离和透视计算正确尺寸',
        '复制包括阴影和反射的现有光照条件',
        '确保添加的物体不违反物理空间占用',
        '匹配现有场景元素的视觉风格和质量水平'
    ],
    
    'remove_object': [
        '分析周围图案和纹理以进行连贯重建',
        '保持连续的透视线和消失点',
        '在填充区域保持光照梯度和阴影图案',
        '避免创造不可能的空间配置'
    ],

    'resize_object': [
        '在缩放过程中保持像素质量并避免插值伪影',
        '按比例调整阴影大小和投射角度到新比例',
        '在场景的空间层次中保持相对定位',
        '确保调整大小的物体不会创造不现实的比例关系'
    ],
    
    'adjust_lighting': [
        '尊重物体的表面材质属性（反射率、半透明性）',
        '保持与场景中其他光源一致的色温',
        '基于新的光照方向计算真实的阴影投射',
        '在调整整体光照时保持精细的表面细节'
    ],

    'global_color_grade': [
        '在所有人类主体中保持自然的肤色准确性',
        '在阴影和高光中保持重要细节的可见性',
        '保持色彩关系和谐并避免不现实的色彩偏移',
        '保持足够的对比度以获得视觉清晰度和深度感知'
    ],
    
    'global_style_transfer': [
        '保持基本构图元素和焦点层次结构',
        '为重要视觉信息保持足够的细节',
        '确保风格应用不会损害图像可读性',
        '保持艺术转换适合原始主题'
    ],
    
    'enhance_quality': [
        '避免产生不现实边缘光晕的过度锐化',
        '平衡降噪与精细纹理细节的保持',
        '保持自然的色彩饱和度水平而不过度增强',
        '保持原始摄影特征和真实性'
    ],

    'text_add': [
        '选择与图像美感和历史时期相匹配的排版',
        '通过适当的对比度确保文本在背景上的可读性',
        '定位文本以增强而不是遮挡重要视觉元素',
        '为图像分辨率和观看上下文适当缩放文本'
    ],
    
    'text_remove': [
        '分析底层纹理和图案以进行无缝重建',
        '在移除文本的地方保持一致的光照和阴影图案',
        '保留可能在文本后面的任何重要视觉信息',
        '避免创造明显的矩形补丁或不自然的纹理过渡'
    ],
    
    'text_edit': [
        '匹配原始文本的字体特征（样式、粗细、间距）',
        '保持相同的文本放置和对齐原则',
        '保持原始颜色关系和文本处理效果',
        '确保新文本长度适当适合可用空间'
    ],

    'content_aware_fill': [
        '分析多个周围区域以进行一致的图案采样',
        '保持自然的随机性以避免明显的重复图案',
        '保持光照梯度和方向性纹理流动',
        '确保填充的内容不会创造不可能的视觉矛盾'
    ],
    
    'perspective_transform': [
        '保持在校正视图中应该保持笔直的直线',
        '保持建筑元素之间的比例关系',
        '确保变换不会创造不可能的几何配置',
        '保持遵循光学物理学原理的现实观看角度'
    ],
    
    'enhance_skin_texture': [
        '保持自然的皮肤毛孔和微纹理细节',
        '避免塑料或过度光滑的人工外观',
        '保持一致的肤色变化和瑕疵特征',
        '确保现实的次表面散射和半透明效果'
    ],
    
    'blur_background': [
        '在模糊背景时保持对主体的清晰聚焦',
        '基于焦距创建自然的景深渐进',
        '避免清晰和模糊区域之间不自然的生硬过渡',
        '通过模糊保持背景光照和色彩氛围'
    ],
    
    'character_expression': [
        '保持面部双侧对称和自然的肌肉运动模式',
        '保持个人面部特征和骨骼结构特征',
        '确保表情变化遵循真实的人体解剖学约束',
        '避免不自然的表情扭曲和非对称变形'
    ],
    
    'character_hair': [
        '保持头发的自然垂坠和重力物理效应',
        '确保发丝束的自然分离和聚集模式',
        '避免头发与头皮的不自然分离或悬浮',
        '维持头发纹理的连贯性和自然光泽反射'
    ],
    
    'character_accessories': [
        '确保配饰与人物比例和穿戴方式的真实性',
        '保持配饰在三维空间中的自然位置关系',
        '避免配饰与人物其他元素的视觉冲突',
        '确保配饰的材质和光照与环境一致'
    ],
    
    // === 🔍 全局增强约束 ===
    'detail_enhance': [
        '保持原始构图和主要元素不变',
        '在增强细节时避免过度锐化造成的不自然边缘',
        '保持纹理增强的真实性和材质物理属性',
        '确保细节层次分明，避免扁平化处理'
    ],
    
    'global_perspective': [
        '保持建筑结构和空间关系的合理性',
        '确保透视校正不会扭曲重要物体比例',
        '维持水平线和垂直线的自然对齐',
        '避免过度透视调整造成的视觉失真'
    ],
    
    'realism_enhance': [
        '增强细节时保持摄影真实感',
        '避免过度处理导致的人工痕迹',
        '保持光影关系的物理正确性',
        '确保材质纹理的自然表现'
    ],
    
    // === 🔧 专业操作约束 ===
    'geometric_warp': [
        '保持几何变换的视觉合理性',
        '确保变形不破坏空间逻辑关系',
        '维持关键结构元素的完整性',
        '避免产生不可能的空间配置'
    ],
    
    'perspective_transform': [
        '保持透视变换的几何正确性',
        '确保变换后的空间关系合理',
        '维持建筑线条的规律性对齐',
        '避免透视扭曲影响视觉平衡'
    ],
    
    'lens_distortion': [
        '精确校正镜头畸变保持直线性',
        '确保校正过程不损失图像边缘信息',
        '维持校正后的比例关系准确性',
        '避免过度校正导致的反向扭曲'
    ],
    
    'content_aware_fill': [
        '确保填充内容与周围环境无缝融合',
        '保持填充区域的光照一致性',
        '维持原始图像的纹理和质感',
        '避免产生重复图案或不自然拼接'
    ],
    
    'seamless_removal': [
        '确保移除后的区域自然重构',
        '保持移除操作的背景连续性',
        '维持原始透视和空间关系',
        '避免留下可见的编辑痕迹'
    ],
    
    'smart_patch': [
        '智能匹配周围区域的纹理特征',
        '保持修补区域的自然过渡',
        '维持原始图像的色调一致性',
        '确保修补效果无缝融入整体'
    ],
    
    // 通用约束
    'general': ['自然外观', '技术精度', '视觉连贯性', '质量控制']
};

// 修饰性提示词模板
KSP_NS.constants.DECORATIVE_PROMPTS = {
    // 局部编辑修饰 (L01-L18)
    'change_color': [
        '应用色彩和谐原理（互补、类似或三角色彩方案）',
        '在保持自然外观的同时增强色彩活力',
        '创造带有微妙渐变效果的平滑色彩过渡',
        '优化色彩平衡以创造视觉兴趣和焦点强调'
    ],
    'change_style': [
        '运用精湛技巧应用复杂的艺术诠释',
        '创造增强艺术吸引力的视觉冲击风格适应',
        '保持风格化和可识别性之间的优雅平衡',
        '通过风格应用发展丰富的视觉纹理和深度'
    ],
    'replace_object': [
        '确保替换物增强整体构图平衡',
        '创造自然的视觉流动和眼睛在场景中的移动',
        '优化大小和位置以获得黄金比例关系',
        '增强场景的叙事连贯性和情感冲击力'
    ],
    'add_object': [
        '增强构图兴趣和视觉叙事丰富性',
        '创造自然的焦点层次和眼睛移动引导',
        '通过深思熟虑的物体选择发展情境叙事',
        '优化空间关系以获得最大视觉和谐'
    ],
    'remove_object': [
        '创造更清晰、更集中的构图强调',
        '增强视觉简洁性和优雅的极简主义',
        '优化空间流动和负空间关系',
        '发展改进的视觉层次和焦点清晰度'
    ],
    'change_texture': [
        '高分辨率材质细节渲染（织物编织、皮革纹理、木材年轮、金属划痕）',
        '物理基于渲染的材质光学属性（反射、折射、次表面散射）',
        '真实感表面微凹凸和法线映射效果',
        '专业级材质质感和触觉视觉体验'
    ],
    'change_pose': [
        '创造动态能量和优雅的运动流动',
        '增强肢体语言沟通和情感表达',
        '优化比例关系以获得最大视觉吸引力',
        '发展增强叙事冲击力的引人注目的姿态语言'
    ],
    'change_expression': [
        '创造真实的情感共鸣和人类连接',
        '通过细微改进增强自然面部吸引力',
        '发展传达引人注目个性的表现深度',
        '优化面部和谐与对称性以获得最大视觉吸引力'
    ],
    'change_clothing': [
        '应用时尚设计原则以实现风格精致',
        '增强身体轮廓和比例吸引力',
        '创造与肤色和环境相辅相成的色彩协调',
        '发展纹理丰富度和织物真实性以获得视觉奢华感'
    ],
    'change_background': [
        '创造大气深度和环境情绪增强',
        '通过环境设计发展丰富的情境叙事',
        '优化构图框架和负空间利用',
        '通过环境心理学原理增强情感共鸣'
    ],
    'enhance_quality': [
        '达到水晶般清晰的专业摄影标准',
        '增强精细细节定义以获得最大视觉清晰度',
        '发展丰富的纹理深度和触觉视觉质量',
        '优化动态范围以获得惊人的视觉冲击力'
    ],
    'blur_background': [
        '创造具有美学质量的复杂散景效果',
        '通过选择性焦点控制增强主体分离',
        '发展具有平滑衰减的自然深度渐进',
        '通过战略性散焦优化构图强调'
    ],
    'adjust_lighting': [
        '创造戏剧性的明暗对比效果以获得情感深度',
        '增强三维形态建模和雕塑品质',
        '通过精密的光照设计发展大气情绪',
        '优化高光和阴影关系以获得最大视觉冲击力'
    ],
    'resize_object': [
        '优化比例关系以获得黄金比例和谐',
        '增强视觉重量分布和构图平衡',
        '通过战略性尺寸创造改进的焦点强调',
        '发展更好的空间节奏和视觉流动模式'
    ],
    'enhance_skin_texture': [
        '实现具有真实微纹理的自然皮肤外观',
        '在保持个体特征的同时增强皮肤质量',
        '发展现实的次表面散射和半透明效果',
        '优化肤色和谐和自然美'
    ],
    'character_expression': [
        '创造具有人际连接的真实情感共鸣',
        '在保持个体身份的同时增强面部表现力',
        '发展传达叙事深度的微妙情感细节',
        '优化面部和谐以实现最大视觉吸引力'
    ],
    'character_hair': [
        '实现自然流动且符合重力的头发动态',
        '在保持个人风格的同时增强头发质量',
        '发展适合角色身份的头发风格表现',
        '优化头发外观以实现专业造型效果'
    ],
    'character_accessories': [
        '创造与整体风格完美协调的配饰设计',
        '确保配饰的尺寸和佩戴方式完全贴合',
        '实现配饰与人物形象的自然融合',
        '发展具有时尚前瞻性的配饰美学'
    ],
    
    // 全局编辑修饰 (G01-G12)
    'global_color_grade': [
        '创造具有专业电影级品质的电影色彩调色板',
        '发展丰富的色调深度和复杂的色彩关系',
        '通过色彩心理学原理增强情感冲击力',
        '通过战略性色彩强调优化视觉层次'
    ],
    'global_style_transfer': [
        '创造具有复杂美学愿景的艺术杰作品质',
        '通过创意风格诠释发展独特的视觉身份',
        '通过风格应用增强文化和艺术意义',
        '在保持构图卓越的同时优化创意表达'
    ],
    'global_brightness_contrast': [
        '完美的曝光平衡',
        '戏剧性对比',
        '增强的动态范围',
        '专业质量'
    ],
    'global_hue_saturation': [
        '充满活力但仍自然的颜色',
        '和谐的调色板',
        '丰富的饱和度',
        '色彩准确的结果'
    ],
    'global_sharpen_blur': [
        '水晶般清晰的锐度',
        '艺术性模糊效果',
        '增强的清晰度',
        '专业处理'
    ],
    'global_noise_reduction': [
        '干净平滑的结果',
        '无伪影的图像',
        '原始质量',
        '专业清理'
    ],
    'global_enhance': [
        '惊人的视觉冲击力',
        '增强的美感',
        '杰作品质',
        '专业精修'
    ],
    'global_filter': [
        '艺术滤镜效果',
        '风格增强',
        '创意转换',
        '视觉吸引力'
    ],
    'character_age': [
        '年龄适当的外观',
        '自然衰老过程',
        '永恒之美',
        '真实的性格'
    ],
    'detail_enhance': [
        '微观纹理细节增强（皮肤毛孔、织物纹理、木材纹理）',
        '边缘锐度优化保持自然柔和过渡',
        '层次化细节渲染（前景、中景、背景）',
        '专业级细节平衡避免过度处理'
    ],
    'global_perspective': [
        '完美的透视对齐',
        '自然视点校正',
        '专业透视控制',
        '准确的空间关系'
    ],
    'geometric_warp': [
        '精确的几何变换',
        '自然的扭曲流动',
        '专业变形控制',
        '无缝形状操作'
    ],
    'realism_enhance': [
        '照片级真实感渲染',
        '自然光影物理模拟',
        '材质真实性增强',
        '专业摄影品质'
    ],
    'perspective_transform': [
        '精密透视几何校正',
        '建筑线条完美对齐',
        '空间深度层次优化',
        '专业透视重构'
    ],
    'lens_distortion': [
        '精确镜头畸变校正',
        '光学失真完美修复',
        '边缘直线性恢复',
        '专业镜头校准效果'
    ],
    'content_aware_fill': [
        '智能内容无缝生成',
        '周围环境完美匹配',
        '自然纹理延续',
        '专业级内容填充'
    ],
    'seamless_removal': [
        '无痕迹对象移除',
        '背景智能重构',
        '自然空间填补',
        '专业级清理效果'
    ],
    'camera_operation': [
        '专业构图',
        '电影级构图',
        '完美透视',
        '艺术视角'
    ],
    'relight_scene': [
        '自然光照',
        '大气照明',
        '戏剧性光影效果',
        '专业照明'
    ],
    'colorize_image': [
        '充满活力但仍自然的颜色',
        '真实的色彩再现',
        '和谐的色彩调色板',
        '专业着色'
    ],
    'teleport_context': [
        '无缝上下文集成',
        '自然环境融合',
        '完美的场景和谐',
        '专业合成'
    ],
    
    // 文本编辑修饰 (T01-T05)
    'text_add': [
        '应用专业排版设计原则以获得最大可读性',
        '创造优雅的文本集成以增强整体构图',
        '通过字体大小和粗细关系发展适当的视觉层次',
        '优化色彩对比和空间关系以获得视觉和谐'
    ],
    'text_remove': [
        '创造没有文本中断的无缝视觉流动',
        '增强构图纯度和视觉优雅',
        '优化空间关系和负空间利用',
        '在核心视觉元素上发展更清洁的美学焦点'
    ],
    'text_edit': [
        '增强文本沟通清晰度和视觉冲击力',
        '创造改进的排版复杂性和专业外观',
        '在保持美学集成的同时优化文本可读性',
        '发展一致的视觉品牌和风格连贯性'
    ],
    'text_resize': [
        '完美的文本比例',
        '最佳文本大小',
        '平衡的文本布局',
        '专业文本缩放'
    ],
    'object_combine': [
        '无缝物体集成',
        '完美的视觉和谐',
        '自然的物体关系',
        '专业构图'
    ],
    
    // 专业操作修饰 (P01-P14)
    'geometric_warp': [
        '精确的几何变换',
        '自然的扭曲流动',
        '专业变形',
        '无缝形状操作'
    ],
    'perspective_transform': [
        '创造建筑优雅和几何精度',
        '增强空间清晰度和尺寸准确性',
        '发展专业建筑摄影质量',
        '优化观看角度以获得最大视觉冲击力和清晰度'
    ],
    'lens_distortion': [
        '真实镜头模拟',
        '自然光学效果',
        '专业扭曲',
        '真实的镜头特征'
    ],
    'global_perspective': [
        '完美的透视对齐',
        '自然视点校正',
        '专业透视控制',
        '准确的空间关系'
    ],
    'content_aware_fill': [
        '创造无形、无缝的重建和自然的有机流动',
        '增强整体构图完整性和视觉连贯性',
        '发展丰富的纹理真实性和表面质量',
        '优化空间关系以改善视觉和谐'
    ],
    'seamless_removal': [
        '无形物体移除',
        '完美的背景重建',
        '智能区域填充',
        '专业物体移除'
    ],
    'smart_patch': [
        '智能补丁合成',
        '无缝纹理混合',
        '智能图案匹配',
        '专业区域修复'
    ],
    'style_blending': [
        '和谐的风格混合',
        '完美的艺术融合',
        '自然的风格过渡',
        '专业风格集成'
    ],
    'collage_integration': [
        '无缝拼贴组装',
        '完美的艺术构图',
        '自然元素和谐',
        '专业拼贴创作'
    ],
    'texture_mixing': [
        '真实的纹理混合',
        '完美的材料集成',
        '自然的表面互动',
        '专业纹理合成'
    ],
    'precision_cutout': [
        '像素级精确提取',
        '完美的边缘定义',
        '自然的边界创建',
        '专业物体隔离'
    ],
    'alpha_composite': [
        '完美的透明度处理',
        '自然图层混合',
        '专业Alpha合成',
        '无缝透明效果'
    ],
    'mask_feathering': [
        '柔和边缘过渡',
        '自然的边界混合',
        '完美的羽化控制',
        '专业边缘精修'
    ],
    'depth_composite': [
        '准确的深度感知',
        '自然的空间关系',
        '完美的深度集成',
        '专业3D合成'
    ],
    'professional_product': [
        '目录品质展示',
        '完美的产品展示',
        '专业商业质量',
        '零售标准结果'
    ],
    
    // 额外操作类型修饰
    'zoom_focus': [
        '戏剧性焦点增强',
        '电影级深度',
        '专业缩放质量',
        '艺术放大'
    ],
    'stylize_local': [
        '艺术风格增强',
        '创意转换',
        '独特的艺术风格',
        '风格化完美'
    ],
    'custom': [
        '个性化增强',
        '创意自由',
        '独特的艺术视野',
        '定制完美'
    ],
    
    'blur_background': [
        '创造具有美学质量的复杂散景效果',
        '通过选择性焦点控制增强主体分离',
        '发展具有平滑衰减的自然深度渐进',
        '通过战略性散焦优化构图强调'
    ],
    
    'character_expression': [
        '创造具有人际连接的真实情感共鸣',
        '在保持个体身份的同时增强面部表现力',
        '发展传达叙事深度的微妙情感细节',
        '优化面部和谐以实现最大视觉吸引力'
    ],
    
    'character_hair': [
        '实现自然流动且符合重力的头发动态',
        '在保持个人风格的同时增强头发质量',
        '发展适合角色身份的头发风格表现',
        '优化头发外观以实现专业造型效果'
    ],
    
    'character_accessories': [
        '创造与整体风格完美协调的配饰设计',
        '确保配饰的尺寸和佩戴方式完全贴合',
        '实现配饰与人物形象的自然融合',
        '发展具有时尚前瞻性的配饰美学'
    ],
    
    // 通用修饰
    'general': [
        '增强质量',
        '改善视觉冲击力', 
        '专业完成',
        '艺术卓越',
        '杰作级精修',
        '惊人的视觉吸引力',
        '最佳清晰度',
        '完美执行'
    ]
};

// 中英文提示词映射表
KSP_NS.constants.PROMPT_TRANSLATION_MAP = {
    '保持原始材质纹理（织物编织、皮肤毛孔、表面粗糙度）': 'preserve original material textures (fabric weave, skin pores, surface roughness)',
    '保持重新着色表面的一致性光照反射和阴影': 'maintain consistent lighting reflections and shadows on the recolored surface',
    '避免颜色渗入相邻物体或区域': 'avoid color bleeding into adjacent objects or areas',
    '保持相对于场景光照的相同饱和度和亮度水平': 'keep the same level of saturation and brightness relative to scene lighting',
    '匹配原始物体的精确透视角度和观察方向': 'match the exact perspective angle and viewing direction of the original object',
    '复制场景中的光照方向、强度和色温': 'replicate the lighting direction, intensity, and color temperature from the scene',
    '缩放替换物以保持现实的比例关系': 'scale the replacement to maintain realistic proportional relationships',
    '集成与场景光照条件匹配的投射阴影': 'integrate cast shadows that match the scene\'s lighting conditions',
    '保持物体的基本几何结构和比例': 'preserve the object\'s fundamental geometric structure and proportions',
    '在应用风格元素时保持可识别的关键特征': 'maintain recognizable key features while applying stylistic elements',
    '确保风格变化不与周围的真实环境冲突': 'ensure the style change doesn\'t conflict with the surrounding realistic environment',
    '保持边缘过渡平滑以避免刺眼的视觉断裂': 'keep edge transitions smooth to avoid jarring visual breaks',
    '自然外观': 'natural appearance',
    '技术精度': 'technical precision',
    '视觉连贯性': 'visual coherence',
    '质量控制': 'quality control',
    
    // 全局增强约束翻译
    '保持原始构图和主要元素不变': 'preserve original composition and main elements unchanged',
    '在增强细节时避免过度锐化造成的不自然边缘': 'avoid unnatural edges from over-sharpening during detail enhancement',
    '保持纹理增强的真实性和材质物理属性': 'maintain texture enhancement authenticity and material physical properties',
    '确保细节层次分明，避免扁平化处理': 'ensure distinct detail hierarchy, avoid flattening treatment',
    '保持建筑结构和空间关系的合理性': 'maintain architectural structure and spatial relationship rationality',
    '确保透视校正不会扭曲重要物体比例': 'ensure perspective correction doesn\'t distort important object proportions',
    '维持水平线和垂直线的自然对齐': 'maintain natural alignment of horizontal and vertical lines',
    '避免过度透视调整造成的视觉失真': 'avoid visual distortion from excessive perspective adjustments',
    '增强细节时保持摄影真实感': 'maintain photographic authenticity during detail enhancement',
    '避免过度处理导致的人工痕迹': 'avoid artificial traces from over-processing',
    '保持光影关系的物理正确性': 'maintain physical correctness of light-shadow relationships',
    '确保材质纹理的自然表现': 'ensure natural representation of material textures',
    
    // 专业操作约束翻译
    '保持几何变换的视觉合理性': 'maintain visual rationality of geometric transformations',
    '确保变形不破坏空间逻辑关系': 'ensure deformation doesn\'t break spatial logical relationships',
    '维持关键结构元素的完整性': 'maintain integrity of key structural elements',
    '避免产生不可能的空间配置': 'avoid creating impossible spatial configurations',
    '保持透视变换的几何正确性': 'maintain geometric correctness of perspective transformation',
    '确保变换后的空间关系合理': 'ensure reasonable spatial relationships after transformation',
    '维持建筑线条的规律性对齐': 'maintain regular alignment of architectural lines',
    '避免透视扭曲影响视觉平衡': 'avoid perspective distortion affecting visual balance',
    '精确校正镜头畸变保持直线性': 'precisely correct lens distortion maintaining linearity',
    '确保校正过程不损失图像边缘信息': 'ensure correction process doesn\'t lose image edge information',
    '维持校正后的比例关系准确性': 'maintain accuracy of proportional relationships after correction',
    '避免过度校正导致的反向扭曲': 'avoid reverse distortion from over-correction',
    '确保填充内容与周围环境无缝融合': 'ensure filled content seamlessly blends with surrounding environment',
    '保持填充区域的光照一致性': 'maintain lighting consistency in filled areas',
    '维持原始图像的纹理和质感': 'preserve original image texture and tactile quality',
    '避免产生重复图案或不自然拼接': 'avoid creating repetitive patterns or unnatural stitching',
    '确保移除后的区域自然重构': 'ensure removed areas are naturally reconstructed',
    '保持移除操作的背景连续性': 'maintain background continuity during removal operations',
    '维持原始透视和空间关系': 'preserve original perspective and spatial relationships',
    '避免留下可见的编辑痕迹': 'avoid leaving visible editing traces',
    '智能匹配周围区域的纹理特征': 'intelligently match texture characteristics of surrounding areas',
    '保持修补区域的自然过渡': 'maintain natural transitions in patched areas',
    '维持原始图像的色调一致性': 'preserve tonal consistency of original image',
    '确保修补效果无缝融入整体': 'ensure patching effects blend seamlessly into the whole',
    '保持原始表面材质的物理光学属性（反射率、粗糙度、折射率）': 'maintain original surface material physical-optical properties (reflectivity, roughness, refraction)',
    '确保新纹理与原始几何形状和曲面完美贴合': 'ensure new texture perfectly conforms to original geometric shapes and surfaces',
    '维持纹理映射的透视正确性和比例一致性': 'maintain perspective correctness and proportional consistency in texture mapping',
    '避免纹理替换造成的光照不匹配或阴影异常': 'avoid lighting mismatches or shadow anomalies from texture replacement',
    
    // 修饰性提示词映射
    '应用色彩和谐原理（互补、类似或三角色彩方案）': 'apply color harmony principles (complementary, analogous, or triadic schemes)',
    '在保持自然外观的同时增强色彩活力': 'enhance color vibrancy while maintaining natural appearance',
    '创造带有微妙渐变效果的平滑色彩过渡': 'create smooth color transitions with subtle gradient effects',
    '优化色彩平衡以创造视觉兴趣和焦点强调': 'optimize color balance to create visual interest and focal emphasis',
    '增强质量': 'enhanced quality',
    '改善视觉冲击力': 'improved visual impact',
    '专业完成': 'professional finish',
    '艺术卓越': 'artistic excellence',
    '杰作级精修': 'masterpiece-level refinement',
    '惊人的视觉吸引力': 'stunning visual appeal',
    '最佳清晰度': 'optimal clarity',
    '完美执行': 'perfect execution',
    
    // 添加更多映射...
    '保持双侧面部对称和自然的肌肉运动模式': 'maintain bilateral facial symmetry and natural muscle movement patterns',
    '保持个人面部特征和骨骼结构特征': 'preserve individual facial features and bone structure characteristics',
    '确保表情变化遵循现实的面部解剖约束': 'ensure expression changes follow realistic facial anatomy constraints',
    '保持眼神接触方向和注视焦点与原始一致': 'keep eye contact direction and gaze focus consistent with the original',
    '确保织物悬垂遵循现实物理和身体轮廓': 'ensure fabric draping follows realistic physics and body contours',
    '将服装风格与个人的年龄、体型和场合背景相匹配': 'match clothing style to the person\'s age, body type, and occasion context',
    '保持与肤色和周围环境的适当色彩和谐': 'maintain proper color harmony with skin tone and surrounding environment',
    '保持通过服装可见的原始身体比例': 'preserve original body proportions visible through clothing fit',
    '遵循人体解剖关节限制和自然的运动范围': 'follow human anatomical joint limitations and natural range of motion',
    '保持现实的重量分布和平衡点': 'maintain realistic weight distribution and balance points',
    '在姿势变化过程中保持肌肉张力一致性': 'preserve muscle tension consistency throughout the pose change',
    '确保新姿势在环境背景中逻辑合理': 'ensure the new pose fits logically within the environmental context',
    '匹配大气透视深度线索（色温、对比度淡化）': 'match atmospheric perspective depth cues (color temperature, contrast fading)',
    '使光照方向和色温与新环境对齐': 'align lighting direction and color temperature with the new environment',
    '保持主体和背景之间的边缘质量和自然互动': 'preserve edge quality and natural interaction between subject and background',
    '保持前景和背景元素之间一致的比例关系': 'maintain consistent scale relationships between foreground and background elements',
    '根据场景中的距离和透视计算正确尺寸': 'calculate correct size based on distance and perspective in the scene',
    '复制包括阴影和反射的现有光照条件': 'replicate existing lighting conditions including shadows and reflections',
    '确保添加的物体不违反物理空间占用': 'ensure the added object doesn\'t violate physical space occupancy',
    '匹配现有场景元素的视觉风格和质量水平': 'match the visual style and quality level of existing scene elements',
    '分析周围图案和纹理以进行连贯重建': 'analyze surrounding patterns and textures for coherent reconstruction',
    '保持连续的透视线和消失点': 'maintain continuous perspective lines and vanishing points',
    '在填充区域保持光照梯度和阴影图案': 'preserve lighting gradients and shadow patterns in the filled area',
    '避免创造不可能的空间配置': 'avoid creating impossible spatial configurations',
    '在缩放过程中保持像素质量并避免插值伪影': 'maintain pixel quality and avoid interpolation artifacts during scaling',
    '按比例调整阴影大小和投射角度到新比例': 'adjust shadow size and casting angle proportionally to the new scale',
    '在场景的空间层次中保持相对定位': 'preserve relative positioning within the scene\'s spatial hierarchy',
    '确保调整大小的物体不会创造不现实的比例关系': 'ensure the resized object doesn\'t create unrealistic proportional relationships',
    '尊重物体的表面材质属性（反射率、半透明性）': 'respect the object\'s surface material properties (reflectivity, translucency)',
    '保持与场景中其他光源一致的色温': 'maintain consistent color temperature with other light sources in the scene',
    '基于新的光照方向计算真实的阴影投射': 'calculate realistic shadow casting based on the new lighting direction',
    '在调整整体光照时保持精细的表面细节': 'preserve fine surface details while adjusting overall illumination',
    '在所有人类主体中保持自然的肤色准确性': 'maintain natural skin tone accuracy across all human subjects',
    '在阴影和高光中保持重要细节的可见性': 'preserve important detail visibility in shadows and highlights',
    '保持色彩关系和谐并避免不现实的色彩偏移': 'keep color relationships harmonious and avoid unrealistic color casts',
    '保持足够的对比度以获得视觉清晰度和深度感知': 'maintain adequate contrast for visual clarity and depth perception',
    '保持基本构图元素和焦点层次结构': 'preserve essential compositional elements and focal point hierarchy',
    '为重要视觉信息保持足够的细节': 'maintain sufficient detail for important visual information',
    '确保风格应用不会损害图像可读性': 'ensure style application doesn\'t compromise image readability',
    '保持艺术转换适合原始主题': 'keep the artistic transformation appropriate to the original subject matter',
    '避免产生不现实边缘光晕的过度锐化': 'avoid over-sharpening that creates unrealistic edge halos',
    '平衡降噪与精细纹理细节的保持': 'balance noise reduction with preservation of fine texture details',
    '保持自然的色彩饱和度水平而不过度增强': 'maintain natural color saturation levels without over-enhancement',
    '保持原始摄影特征和真实性': 'preserve the original photographic character and authenticity',
    '选择与图像美感和历史时期相匹配的排版': 'choose typography that matches the image\'s aesthetic and historical period',
    '通过适当的对比度确保文本在背景上的可读性': 'ensure text readability against the background through appropriate contrast',
    '定位文本以增强而不是遮挡重要视觉元素': 'position text to enhance rather than obstruct important visual elements',
    '为图像分辨率和观看上下文适当缩放文本': 'scale text appropriately for the image resolution and viewing context',
    '分析底层纹理和图案以进行无缝重建': 'analyze underlying textures and patterns for seamless reconstruction',
    '在移除文本的地方保持一致的光照和阴影图案': 'maintain consistent lighting and shadow patterns where text was removed',
    '保留可能在文本后面的任何重要视觉信息': 'preserve any important visual information that might be behind the text',
    '避免创造明显的矩形补丁或不自然的纹理过渡': 'avoid creating obvious rectangular patches or unnatural texture transitions',
    '匹配原始文本的字体特征（样式、粗细、间距）': 'match the original text\'s font characteristics (style, weight, spacing)',
    '保持相同的文本放置和对齐原则': 'maintain the same text placement and alignment principles',
    '保持原始颜色关系和文本处理效果': 'preserve original color relationships and text treatment effects',
    '确保新文本长度适当适合可用空间': 'ensure new text length fits appropriately within the available space',
    '分析多个周围区域以进行一致的图案采样': 'analyze multiple surrounding areas for consistent pattern sampling',
    '保持自然的随机性以避免明显的重复图案': 'maintain natural randomness to avoid obvious repetitive patterns',
    '保持光照梯度和方向性纹理流动': 'preserve lighting gradients and directional texture flows',
    '确保填充的内容不会创造不可能的视觉矛盾': 'ensure filled content doesn\'t create impossible visual contradictions',
    '保持在校正视图中应该保持笔直的直线': 'maintain straight lines that should remain straight in the corrected view',
    '保持建筑元素之间的比例关系': 'preserve proportional relationships between architectural elements',
    '确保变换不会创造不可能的几何配置': 'ensure the transformation doesn\'t create impossible geometric configurations',
    '保持遵循光学物理学原理的现实观看角度': 'maintain realistic viewing angles that follow optical physics principles',
    
    // 修饰性提示词映射
    '运用精湛技巧应用复杂的艺术诠释': 'apply sophisticated artistic interpretation with masterful technique',
    '创造增强艺术吸引力的视觉冲击风格适应': 'create visually striking style adaptation that enhances artistic appeal',
    '保持风格化和可识别性之间的优雅平衡': 'maintain elegant balance between stylization and recognizability',
    '通过风格应用发展丰富的视觉纹理和深度': 'develop rich visual texture and depth through style application',
    '确保替换物增强整体构图平衡': 'ensure the replacement enhances the overall compositional balance',
    '创造自然的视觉流动和眼睛在场景中的移动': 'create natural visual flow and eye movement through the scene',
    '优化大小和位置以获得黄金比例关系': 'optimize size and placement for golden ratio proportional relationships',
    '增强场景的叙事连贯性和情感冲击力': 'enhance narrative coherence and emotional impact of the scene',
    '增强构图兴趣和视觉叙事丰富性': 'enhance compositional interest and visual narrative richness',
    '创造自然的焦点层次和眼睛移动引导': 'create natural focal point hierarchy and eye movement guidance',
    '通过深思熟虑的物体选择发展情境叙事': 'develop contextual storytelling through thoughtful object selection',
    '优化空间关系以获得最大视觉和谐': 'optimize spatial relationships for maximum visual harmony',
    '创造更清晰、更集中的构图强调': 'create cleaner, more focused compositional emphasis',
    '增强视觉简洁性和优雅的极简主义': 'enhance visual simplicity and elegant minimalism',
    '优化空间流动和负空间关系': 'optimize spatial flow and negative space relationships',
    '发展改进的视觉层次和焦点清晰度': 'develop improved visual hierarchy and focal point clarity',
    '真实的材质属性': 'realistic material properties',
    '精细的表面质量': 'detailed surface quality',
    '触觉真实感': 'tactile authenticity',
    '专业纹理处理': 'professional texturing',
    '创造动态能量和优雅的运动流动': 'create dynamic energy and graceful movement flow',
    '增强肢体语言沟通和情感表达': 'enhance body language communication and emotional expression',
    '优化比例关系以获得最大视觉吸引力': 'optimize proportional relationships for maximum visual appeal',
    '发展增强叙事冲击力的引人注目的姿态语言': 'develop compelling gesture language that enhances narrative impact',
    '创造真实的情感共鸣和人类连接': 'create authentic emotional resonance and human connection',
    '通过细微改进增强自然面部吸引力': 'enhance natural facial attractiveness through subtle refinements',
    '发展传达引人注目个性的表现深度': 'develop expressive depth that conveys compelling personality',
    '优化面部和谐与对称性以获得最大视觉吸引力': 'optimize facial harmony and symmetry for maximum visual appeal',
    '应用时尚设计原则以实现风格精致': 'apply fashion design principles for stylistic sophistication',
    '增强身体轮廓和比例吸引力': 'enhance body silhouette and proportional attractiveness',
    '创造与肤色和环境相辅相成的色彩协调': 'create color coordination that complements skin tone and environment',
    '发展纹理丰富度和织物真实性以获得视觉奢华感': 'develop texture richness and fabric authenticity for visual luxury',
    '创造大气深度和环境情绪增强': 'create atmospheric depth and environmental mood enhancement',
    '通过环境设计发展丰富的情境叙事': 'develop rich contextual storytelling through environmental design',
    '优化构图框架和负空间利用': 'optimize compositional framing and negative space utilization',
    '通过环境心理学原理增强情感共鸣': 'enhance emotional resonance through environmental psychology principles',
    '达到水晶般清晰的专业摄影标准': 'achieve crystal-clear professional photography standards',
    '增强精细细节定义以获得最大视觉清晰度': 'enhance fine detail definition for maximum visual clarity',
    '发展丰富的纹理深度和触觉视觉质量': 'develop rich texture depth and tactile visual quality',
    '优化动态范围以获得惊人的视觉冲击力': 'optimize dynamic range for stunning visual impact',
    '美丽的焦外成像': 'beautiful bokeh',
    '艺术性的景深': 'artistic depth of field',
    '专业肖像外观': 'professional portrait look',
    '优雅的焦点': 'elegant focus',
    '创造戏剧性的明暗对比效果以获得情感深度': 'create dramatic chiaroscuro effects for emotional depth',
    '增强三维形态建模和雕塑品质': 'enhance three-dimensional form modeling and sculptural quality',
    '通过精密的光照设计发展大气情绪': 'develop atmospheric mood through sophisticated lighting design',
    '优化高光和阴影关系以获得最大视觉冲击力': 'optimize highlight and shadow relationships for maximum visual impact',
    '优化比例关系以获得黄金比例和谐': 'optimize proportional relationships for golden ratio harmony',
    '增强视觉重量分布和构图平衡': 'enhance visual weight distribution and compositional balance',
    '通过战略性尺寸创造改进的焦点强调': 'create improved focal point emphasis through strategic sizing',
    '发展更好的空间节奏和视觉流动模式': 'develop better spatial rhythm and visual flow patterns',
    '真实的皮肤细节': 'realistic skin detail',
    '自然的毛孔结构': 'natural pore structure',
    '健康的皮肤外观': 'healthy skin appearance',
    '照片级真实纹理': 'photorealistic texture',
    '情感引人入胜': 'emotionally engaging',
    '自然富有表现力': 'naturally expressive',
    '迷人的面部特征': 'captivating facial features',
    '真实的人类情感': 'authentic human emotion',
    '自然的头发流动': 'natural hair flow',
    '真实的头发纹理': 'realistic hair texture',
    '风格上恰当': 'stylistically appropriate',
    '专业造型': 'professionally styled',
    '风格上匹配': 'stylistically matching',
    '完美合身': 'perfectly fitted',
    '自然融合': 'naturally integrated',
    '前卫设计': 'fashion-forward design',
    
    '创造具有专业电影级品质的电影色彩调色板': 'create cinematic color palette with professional film-grade quality',
    '发展丰富的色调深度和复杂的色彩关系': 'develop rich tonal depth and sophisticated color relationships',
    '通过色彩心理学原理增强情感冲击力': 'enhance emotional impact through color psychology principles',
    '通过战略性色彩强调优化视觉层次': 'optimize visual hierarchy through strategic color emphasis',
    '创造具有复杂美学愿景的艺术杰作品质': 'create artistic masterpiece quality with sophisticated aesthetic vision',
    '通过创意风格诠释发展独特的视觉身份': 'develop unique visual identity through creative style interpretation',
    '通过风格应用增强文化和艺术意义': 'enhance cultural and artistic significance through style application',
    '在保持构图卓越的同时优化创意表达': 'optimize creative expression while maintaining compositional excellence',
    '完美的曝光平衡': 'perfect exposure balance',
    '戏剧性对比': 'dramatic contrast',
    '增强的动态范围': 'enhanced dynamic range',
    '专业质量': 'professional quality',
    '充满活力但仍自然的颜色': 'vibrant yet natural colors',
    '和谐的调色板': 'harmonious palette',
    '丰富的饱和度': 'rich saturation',
    '色彩准确的结果': 'color-accurate result',
    '水晶般清晰的锐度': 'crystal clear sharpness',
    '艺术性模糊效果': 'artistic blur effect',
    '增强的清晰度': 'enhanced clarity',
    '专业处理': 'professional processing',
    '干净平滑的结果': 'clean smooth result',
    '无伪影的图像': 'artifact-free image',
    '原始质量': 'pristine quality',
    '专业清理': 'professional cleanup',
    '惊人的视觉冲击力': 'stunning visual impact',
    '增强的美感': 'enhanced beauty',
    '杰作品质': 'masterpiece quality',
    '专业精修': 'professional refinement',
    '艺术滤镜效果': 'artistic filter effect',
    '风格增强': 'stylistic enhancement',
    '创意转换': 'creative transformation',
    '视觉吸引力': 'visually appealing',
    '年龄适当的外观': 'age-appropriate appearance',
    '自然衰老过程': 'natural aging process',
    '永恒之美': 'timeless beauty',
    '真实的性格': 'authentic character',
    '复杂细节保存': 'intricate detail preservation',
    '增强的纹理清晰度': 'enhanced texture clarity',
    '精细的表面质量': 'refined surface quality',
    '专业细节渲染': 'professional detail rendering',
    '微观纹理细节增强（皮肤毛孔、织物纹理、木材纹理）': 'microscopic texture detail enhancement (skin pores, fabric weave, wood grain)',
    '边缘锐度优化保持自然柔和过渡': 'edge sharpness optimization maintaining natural soft transitions',
    '层次化细节渲染（前景、中景、背景）': 'layered detail rendering (foreground, midground, background)',
    '专业级细节平衡避免过度处理': 'professional-grade detail balance avoiding over-processing',
    '完美的透视对齐': 'perfect perspective alignment',
    '自然视点校正': 'natural viewpoint correction',
    '专业透视控制': 'professional perspective control',
    '准确的空间关系': 'accurate spatial relationships',
    '精确的几何变换': 'precise geometric transformations',
    '自然的扭曲流动': 'natural distortion flow',
    '专业变形控制': 'professional deformation control',
    '无缝形状操作': 'seamless shape manipulation',
    '照片级真实感渲染': 'photorealistic rendering',
    '自然光影物理模拟': 'natural light-shadow physics simulation',
    '材质真实性增强': 'material authenticity enhancement',
    '专业摄影品质': 'professional photography quality',
    '精密透视几何校正': 'precision perspective geometry correction',
    '建筑线条完美对齐': 'architectural line perfect alignment',
    '空间深度层次优化': 'spatial depth layer optimization',
    '专业透视重构': 'professional perspective reconstruction',
    '精确镜头畸变校正': 'precise lens distortion correction',
    '光学失真完美修复': 'optical distortion perfect repair',
    '边缘直线性恢复': 'edge linearity restoration',
    '专业镜头校准效果': 'professional lens calibration effects',
    '智能内容无缝生成': 'intelligent content seamless generation',
    '周围环境完美匹配': 'surrounding environment perfect matching',
    '自然纹理延续': 'natural texture continuation',
    '专业级内容填充': 'professional-grade content filling',
    '无痕迹对象移除': 'traceless object removal',
    '背景智能重构': 'background intelligent reconstruction',
    '自然空间填补': 'natural space filling',
    '专业级清理效果': 'professional-grade cleanup effects',
    '高分辨率材质细节渲染（织物编织、皮革纹理、木材年轮、金属划痕）': 'high-resolution material detail rendering (fabric weave, leather texture, wood grain, metal scratches)',
    '物理基于渲染的材质光学属性（反射、折射、次表面散射）': 'physically-based rendering material optical properties (reflection, refraction, subsurface scattering)',
    '真实感表面微凹凸和法线映射效果': 'realistic surface micro-bumps and normal mapping effects',
    '专业级材质质感和触觉视觉体验': 'professional-grade material texture and tactile visual experience',
    '照片级真实准确度': 'photorealistic accuracy',
    '逼真渲染': 'life-like rendering',
    '自然外观': 'natural appearance',
    '专业现实主义': 'professional realism',
    '专业构图': 'professional framing',
    '电影级构图': 'cinematic composition',
    '完美透视': 'perfect perspective',
    '艺术视角': 'artistic viewpoint',
    '自然光照': 'natural lighting',
    '大气照明': 'atmospheric illumination',
    '戏剧性光影效果': 'dramatic light play',
    '专业照明': 'professional lighting',
    '充满活力但仍自然的颜色': 'vibrant yet natural colors',
    '真实的色彩再现': 'authentic color reproduction',
    '和谐的色彩调色板': 'harmonious color palette',
    '专业着色': 'professional colorization',
    '无缝上下文集成': 'seamless context integration',
    '自然环境融合': 'natural environment blending',
    '完美的场景和谐': 'perfect scene harmony',
    '专业合成': 'professional compositing',
    '应用专业排版设计原则以获得最大可读性': 'apply professional typography design principles for maximum readability',
    '创造优雅的文本集成以增强整体构图': 'create elegant text integration that enhances overall composition',
    '通过字体大小和粗细关系发展适当的视觉层次': 'develop appropriate visual hierarchy through font size and weight relationships',
    '优化色彩对比和空间关系以获得视觉和谐': 'optimize color contrast and spatial relationships for visual harmony',
    '创造没有文本中断的无缝视觉流动': 'create seamless visual flow without textual interruption',
    '增强构图纯度和视觉优雅': 'enhance compositional purity and visual elegance',
    '优化空间关系和负空间利用': 'optimize spatial relationships and negative space utilization',
    '在核心视觉元素上发展更清洁的美学焦点': 'develop cleaner aesthetic focus on core visual elements',
    '增强文本沟通清晰度和视觉冲击力': 'enhance textual communication clarity and visual impact',
    '创造改进的排版复杂性和专业外观': 'create improved typographic sophistication and professional appearance',
    '在保持美学集成的同时优化文本可读性': 'optimize text readability while maintaining aesthetic integration',
    '发展一致的视觉品牌和风格连贯性': 'develop consistent visual branding and stylistic coherence',
    '完美的文本比例': 'perfect text proportions',
    '最佳文本大小': 'optimal text sizing',
    '平衡的文本布局': 'balanced text layout',
    '专业文本缩放': 'professional text scaling',
    '无缝物体集成': 'seamless object integration',
    '完美的视觉和谐': 'perfect visual harmony',
    '自然的物体关系': 'natural object relationships',
    '专业构图': 'professional composition',
    '精确的几何变换': 'precise geometric transformation',
    '自然的扭曲流动': 'natural distortion flow',
    '专业变形': 'professional warping',
    '无缝形状操作': 'seamless shape manipulation',
    '创造建筑优雅和几何精度': 'create architectural elegance and geometric precision',
    '增强空间清晰度和尺寸准确性': 'enhance spatial clarity and dimensional accuracy',
    '发展专业建筑摄影质量': 'develop professional architectural photography quality',
    '优化观看角度以获得最大视觉冲击力和清晰度': 'optimize viewing angle for maximum visual impact and clarity',
    
    '保持自然的皮肤毛孔和微纹理细节': 'preserving natural skin tone',
    '避免塑料或过度光滑的人工外观': 'maintaining pore authenticity',
    '保持一致的肤色变化和瑕疵特征': 'avoiding over-smoothing artifacts',
    '确保现实的次表面散射和半透明效果': 'ensuring realistic subsurface scattering',
    
    '在模糊背景时保持对主体的清晰聚焦': 'preserving subject sharpness',
    '基于焦距创建自然的景深渐进': 'maintaining edge definition',
    '避免清晰和模糊区域之间不自然的生硬过渡': 'avoiding halo effects',
    '通过模糊保持背景光照和色彩氛围': 'natural depth of field gradation',
    
    '保持面部双侧对称和自然的肌肉运动模式': 'maintaining facial symmetry',
    '保持个人面部特征和骨骼结构特征': 'preserving natural emotion',
    '确保表情变化遵循真实的人体解剖学约束': 'avoiding forced expressions',
    '避免不自然的表情扭曲和非对称变形': 'ensuring anatomical accuracy',
    
    '保持头发的自然垂坠和重力物理效应': 'ensuring realistic hair physics',
    '确保发丝束的自然分离和聚集模式': 'maintaining hair texture quality',
    '避免头发与头皮的不自然分离或悬浮': 'avoiding unnatural hair placement',
    '维持头发纹理的连贯性和自然光泽反射': 'preserving natural hair flow',
    
    '确保配饰与人物比例和穿戴方式的真实性': 'ensuring proper fit and scale',
    '保持配饰在三维空间中的自然位置关系': 'maintaining realistic positioning',
    '避免配饰与人物其他元素的视觉冲突': 'avoiding visual conflicts',
    '确保配饰的材质和光照与环境一致': 'ensuring realistic positioning',
    
    '实现具有真实微纹理的自然皮肤外观': 'realistic skin detail',
    '在保持个体特征的同时增强皮肤质量': 'natural pore structure', 
    '发展现实的次表面散射和半透明效果': 'healthy skin appearance',
    '优化肤色和谐和自然美': 'photorealistic texture',
    
    '创造具有美学质量的复杂散景效果': 'beautiful bokeh',
    '通过选择性焦点控制增强主体分离': 'artistic depth of field',
    '发展具有平滑衰减的自然深度渐进': 'professional portrait look',
    '通过战略性散焦优化构图强调': 'sophisticated background separation',
    
    '创造具有人际连接的真实情感共鸣': 'emotionally engaging',
    '在保持个体身份的同时增强面部表现力': 'naturally expressive',
    '发展传达叙事深度的微妙情感细节': 'captivating facial features',
    '优化面部和谐以实现最大视觉吸引力': 'authentic human emotion',
    
    '实现自然流动且符合重力的头发动态': 'natural hair flow',
    '在保持个人风格的同时增强头发质量': 'realistic hair texture',
    '发展适合角色身份的头发风格表现': 'stylistically appropriate',
    '优化头发外观以实现专业造型效果': 'professionally styled',
    
    '创造与整体风格完美协调的配饰设计': 'stylistically matching',
    '确保配饰的尺寸和佩戴方式完全贴合': 'perfectly fitted',
    '实现配饰与人物形象的自然融合': 'naturally integrated',
    '发展具有时尚前瞻性的配饰美学': 'fashion-forward design'
};

// 将中文提示词转换为英文
function translatePromptsToEnglish(chinesePrompts) {
    return chinesePrompts.map(prompt => KSP_NS.constants.PROMPT_TRANSLATION_MAP[prompt] || prompt);
}

// 定义界面尺寸
KSP_NS.constants.EDITOR_SIZE = {
    WIDTH: 800, // 1000 * 0.8 - 减小20%
    HEIGHT: 700,
    LAYER_PANEL_HEIGHT: 144, // 180 * 0.8 - 减小20%
    TOOLBAR_HEIGHT: 50,
    TAB_HEIGHT: 40
};

class KontextSuperPrompt {
    constructor(node) {
        // 开始性能监控
        KSP_NS.performance.startTimer(`node_${node.id}_init`, `节点 ${node.id} 初始化`);
        
        this.node = node;
        
        // 在命名空间中注册此实例
        KSP_NS.registerInstance(node.id, this);
        this.layerInfo = null;
        this.selectedLayers = [];
        this.currentEditMode = "局部编辑";
        this.currentCategory = 'local';
        this.currentOperationType = '';
        this.description = '';
        this.selectedConstraints = [];
        this.selectedDecoratives = [];
        this.autoGenerate = true;
        this.generatedPrompt = '';
        
        // 事件监听器管理系统 - 防止堆积和内存泄漏
        this._eventListeners = [];
        this._apiEventListeners = [];
        this._timeouts = [];
        this._intervals = [];
        
        // 初始化UI
        this.initEditor();
    }

    // 事件监听器管理方法 - 统一管理所有监听器以防止内存泄漏
    addEventListenerManaged(element, event, handler, options = false) {
        element.addEventListener(event, handler, options);
        this._eventListeners.push({ element, event, handler, options });
    }

    addAPIEventListenerManaged(event, handler) {
        if (api && api.addEventListener) {
            api.addEventListener(event, handler);
            this._apiEventListeners.push({ event, handler });
        }
    }

    addTimeoutManaged(callback, delay) {
        const timeoutId = setTimeout(callback, delay);
        this._timeouts.push(timeoutId);
        return timeoutId;
    }

    addIntervalManaged(callback, interval) {
        const intervalId = setInterval(callback, interval);
        this._intervals.push(intervalId);
        return intervalId;
    }

    // 清理所有事件监听器和定时器
    cleanup() {
        // 清理DOM事件监听器
        this._eventListeners.forEach(({ element, event, handler, options }) => {
            if (element && element.removeEventListener) {
                element.removeEventListener(event, handler, options);
            }
        });
        this._eventListeners = [];

        // 清理API事件监听器
        this._apiEventListeners.forEach(({ event, handler }) => {
            if (api && api.removeEventListener) {
                api.removeEventListener(event, handler);
            }
        });
        this._apiEventListeners = [];

        // 清理定时器
        this._timeouts.forEach(timeoutId => clearTimeout(timeoutId));
        this._timeouts = [];

        this._intervals.forEach(intervalId => clearInterval(intervalId));
        this._intervals = [];

        // 清理渲染相关的定时器
        if (this._renderTimeout) {
            clearTimeout(this._renderTimeout);
            this._renderTimeout = null;
        }

        // 清理图层检查定时器
        if (this.layerCheckInterval) {
            clearInterval(this.layerCheckInterval);
            this.layerCheckInterval = null;
        }

        // 输出性能报告
        const report = KSP_NS.performance.getReport();
        if (report.completedMetrics > 0) {
        }
        
        // 从命名空间注销实例
        if (this.node && this.node.id) {
            KSP_NS.unregisterInstance(this.node.id);
        }

    }

    initEditor() {
        
        // 创建主容器
        this.editorContainer = document.createElement('div');
        this.editorContainer.className = 'kontext-super-prompt-container';
        this.editorContainer.style.cssText = `
            width: ${KSP_NS.constants.EDITOR_SIZE.WIDTH}px;
            height: ${KSP_NS.constants.EDITOR_SIZE.HEIGHT}px;
            background: #1a1a1a;
            border: 1px solid #444;
            border-radius: 8px;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        `;

        // 工具栏已移除 - 不再需要标题、图层选择计数和自动生成功能

        // 创建标签栏
        this.tabBar = this.createTabBar();
        this.editorContainer.appendChild(this.tabBar);

        // 创建主内容区域
        this.contentArea = this.createContentArea();
        this.editorContainer.appendChild(this.contentArea);

        // 将容器添加到节点
        this.domWidget = this.node.addDOMWidget("kontext_super_prompt", "div", this.editorContainer, {
            serialize: false,
            hideOnZoom: false,
            getValue: () => this.getEditorData(),
            setValue: (value) => this.setEditorData(value)
        });

        // 设置节点尺寸
        const nodeWidth = 816; // 1020 * 0.8 - 减小20%
        const nodeHeight = 750; // KSP_NS.constants.EDITOR_SIZE.HEIGHT + 50
        this.node.size = [nodeWidth, nodeHeight];
        this.node.setSize?.(this.node.size);
        
        // 确保节点重新计算大小
        this.updateNodeSize();

        // 设置事件监听
        this.setupEventListeners();
        
        // 初始化隐藏widget
        this.createHiddenWidgets({
            edit_mode: this.currentEditMode,
            operation_type: this.currentOperationType,
            description: this.description,
            constraint_prompts: '',
            decorative_prompts: '',
            selected_layers: JSON.stringify(this.selectedLayers),
            auto_generate: this.autoGenerate,
            generated_prompt: this.generatedPrompt
        });
        
        // 初始化显示（切换到默认标签页）
        this.switchTab('local');
        
        // 设置默认操作类型（匹配global标签页）
        this.currentOperationType = 'global_color_grade'; // 全局编辑的默认操作类型
        
        // 保存初始操作类型，避免被其他操作覆盖
        const initialOperationType = this.currentOperationType;
        
        setTimeout(() => {
            // 确保操作类型没有被覆盖
            if (!this.currentOperationType || this.currentOperationType === '') {
                this.currentOperationType = initialOperationType;
            }
            
            // 确保下拉框被正确设置并触发变化事件
            const selects = this.editorContainer.querySelectorAll('.operation-select');
            selects.forEach(select => {
                const option = select.querySelector(`option[value="${this.currentOperationType}"]`);
                if (option) {
                    select.value = this.currentOperationType;
                    // 触发change事件来更新提示词
                    const event = new Event('change', { bubbles: true });
                    select.dispatchEvent(event);
                }
            });
            
            this.updateOperationButtons(); // 更新按钮状态
            
            // 提示词将在标签页切换时按需加载
            
            this.refreshLayerInfo();
            
            // 强制再次尝试显示提示词
            setTimeout(() => {
                
                if (this.constraintContainer && this.constraintContainer.children.length === 0) {
                    // 使用通用约束提示词强制填充
                    this.updateConstraintContainer(KSP_NS.constants.CONSTRAINT_PROMPTS.general || ['natural appearance', 'technical precision', 'visual coherence', 'quality control']);
                }
                if (this.decorativeContainer && this.decorativeContainer.children.length === 0) {
                    // 使用通用修饰提示词强制填充
                    this.updateDecorativeContainer(KSP_NS.constants.DECORATIVE_PROMPTS.general || ['enhanced quality', 'improved visual impact', 'professional finish', 'artistic excellence']);
                }
                
                // 再次强制检查
                setTimeout(() => {
                    // Final check completed
                }, 500);
            }, 1000);
        }, 500);
    }

    createToolbar() {
        const toolbar = document.createElement('div');
        toolbar.className = 'kontext-toolbar';
        toolbar.style.cssText = `
            height: ${KSP_NS.constants.EDITOR_SIZE.TOOLBAR_HEIGHT}px;
            background: #2a2a2a;
            border-bottom: 1px solid #444;
            display: flex;
            align-items: center;
            padding: 0 16px;
            gap: 16px;
        `;

        // 标题
        const title = document.createElement('div');
        title.style.cssText = `
            color: #fff;
            font-size: 14px;
            font-weight: bold;
        `;
        title.textContent = '🎯 Kontext Super Prompt 生成器';

        // 自动生成开关
        const autoGenLabel = document.createElement('label');
        autoGenLabel.style.cssText = `
            display: flex;
            align-items: center;
            color: #ccc;
            font-size: 12px;
            cursor: pointer;
            margin-left: auto;
        `;

        this.autoGenCheckbox = document.createElement('input');
        this.autoGenCheckbox.type = 'checkbox';
        this.autoGenCheckbox.checked = this.autoGenerate;
        this.autoGenCheckbox.style.cssText = `
            margin-right: 6px;
            accent-color: #9C27B0;
        `;

        autoGenLabel.appendChild(this.autoGenCheckbox);
        autoGenLabel.appendChild(document.createTextNode('自动生成约束修饰词'));

        // 选中图层计数
        this.layerCountDisplay = document.createElement('span');
        this.layerCountDisplay.style.cssText = `
            color: #888;
            font-size: 12px;
        `;
        this.updateLayerCountDisplay();

        toolbar.appendChild(title);
        toolbar.appendChild(this.layerCountDisplay);
        toolbar.appendChild(autoGenLabel);

        return toolbar;
    }

    createTabBar() {
        const tabBar = document.createElement('div');
        tabBar.className = 'kontext-tab-bar';
        tabBar.style.cssText = `
            height: ${KSP_NS.constants.EDITOR_SIZE.TAB_HEIGHT}px;
            background: #2a2a2a;
            border-bottom: 1px solid #444;
            display: flex;
            align-items: center;
        `;

        const tabs = [
            { id: 'local', name: '🎯 局部编辑' },
            { id: 'global', name: '🌍 全局编辑' },
            { id: 'text', name: '📝 文字编辑' },
            { id: 'professional', name: '🔧 专业操作' },
            { id: 'api', name: '🌐 远程API' },
            { id: 'ollama', name: '🦙 本地Ollama' }
        ];

        tabs.forEach(tab => {
            const tabButton = document.createElement('button');
            tabButton.className = `tab-button tab-${tab.id}`;
            tabButton.textContent = tab.name;
            tabButton.style.cssText = `
                background: none;
                border: none;
                color: #888;
                padding: 8px 16px;
                font-size: 12px;
                cursor: pointer;
                border-bottom: 2px solid transparent;
                transition: all 0.2s;
            `;

            this.addEventListenerManaged(tabButton, 'click', () => {
                this.switchTab(tab.id);
            });

            tabBar.appendChild(tabButton);
        });

        return tabBar;
    }

    createContentArea() {
        const contentArea = document.createElement('div');
        contentArea.className = 'kontext-content-area';
        contentArea.style.cssText = `
            flex: 1;
            display: flex;
            overflow: hidden;
        `;

        // 左侧面板 - 图层选择
        this.leftPanel = this.createLeftPanel();
        contentArea.appendChild(this.leftPanel);

        // 右侧面板 - 编辑控制
        this.rightPanel = this.createRightPanel();
        contentArea.appendChild(this.rightPanel);

        return contentArea;
    }

    createLeftPanel() {
        const panel = document.createElement('div');
        panel.className = 'kontext-left-panel';
        panel.style.cssText = `
            width: 216px;
            background: #1a1a1a;
            border-right: 1px solid #444;
            display: flex;
            flex-direction: column;
        `;

        // 图层面板标题
        const header = document.createElement('div');
        header.style.cssText = `
            padding: 12px;
            background: #2a2a2a;
            border-bottom: 1px solid #444;
            color: #fff;
            font-size: 12px;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: space-between;
        `;

        const title = document.createElement('span');
        title.textContent = '📋 图层选择';

        const buttonGroup = document.createElement('div');
        buttonGroup.style.cssText = `
            display: flex;
            gap: 4px;
        `;

        const refreshBtn = document.createElement('button');
        refreshBtn.textContent = '🔄';
        refreshBtn.title = '刷新图层信息';
        refreshBtn.style.cssText = `
            background: #4CAF50;
            color: white;
            border: 1px solid #66bb6a;
            border-radius: 3px;
            padding: 2px 6px;
            font-size: 10px;
            cursor: pointer;
        `;

        const selectAllBtn = document.createElement('button');
        selectAllBtn.textContent = '全选/取消';
        selectAllBtn.style.cssText = `
            background: #444;
            color: white;
            border: 1px solid #666;
            border-radius: 3px;
            padding: 2px 8px;
            font-size: 10px;
            cursor: pointer;
        `;

        buttonGroup.appendChild(refreshBtn);
        buttonGroup.appendChild(selectAllBtn);
        header.appendChild(title);
        header.appendChild(buttonGroup);

        // 图层列表
        this.layerList = document.createElement('div');
        this.layerList.className = 'layer-list';
        this.layerList.style.cssText = `
            flex: 1;
            overflow-y: auto;
            padding: 8px;
        `;

        panel.appendChild(header);
        panel.appendChild(this.layerList);

        // 绑定按钮事件 - 使用管理方法防止监听器泄漏
        this.addEventListenerManaged(refreshBtn, 'click', () => {
            this.refreshLayerInfo();
        });

        this.addEventListenerManaged(selectAllBtn, 'click', () => {
            this.toggleSelectAll();
        });

        return panel;
    }

    createRightPanel() {
        const panel = document.createElement('div');
        panel.className = 'kontext-right-panel';
        panel.style.cssText = `
            flex: 1;
            background: #1a1a1a;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        `;

        // 创建各个编辑模式的内容面板
        this.tabContents = {
            local: this.createLocalEditPanel(),
            global: this.createGlobalEditPanel(), 
            text: this.createTextEditPanel(),
            professional: this.createProfessionalEditPanel(),
            api: this.createAPIEditPanel(),
            ollama: this.createOllamaEditPanel()
        };

        // 添加所有面板，但只显示当前激活的
        Object.values(this.tabContents).forEach(content => {
            panel.appendChild(content);
        });

        return panel;
    }

    createLocalEditPanel() {
        const panel = document.createElement('div');
        panel.className = 'edit-panel local-edit-panel';
        panel.style.cssText = `
            flex: 1;
            display: none;
            flex-direction: column;
            padding: 16px;
            overflow-y: auto;
        `;

        // 操作类型选择
        const operationSection = this.createOperationTypeSection('local');
        panel.appendChild(operationSection);

        // 描述输入
        const descriptionSection = this.createDescriptionSection();
        panel.appendChild(descriptionSection);

        const constraintSection = this.createConstraintPromptsSection();
        panel.appendChild(constraintSection);

        // 修饰性提示词
        const decorativeSection = this.createDecorativePromptsSection();
        panel.appendChild(decorativeSection);

        // 生成按钮
        const generateSection = this.createGenerateSection();
        panel.appendChild(generateSection);

        return panel;
    }

    createGlobalEditPanel() {
        const panel = document.createElement('div');
        panel.className = 'edit-panel global-edit-panel';
        panel.style.cssText = `
            flex: 1;
            display: none;
            flex-direction: column;
            padding: 16px;
            overflow-y: auto;
        `;

        // 全局编辑不需要图层选择提示
        const notice = document.createElement('div');
        notice.style.cssText = `
            background: #2a4a2a;
            border: 1px solid #4a8a4a;
            border-radius: 4px;
            padding: 8px 12px;
            margin-bottom: 16px;
            color: #8FBC8F;
            font-size: 12px;
        `;
        notice.textContent = 'ℹ️ 全局编辑将应用于整个图像，无需选择图层';
        panel.appendChild(notice);

        // 操作类型选择
        const operationSection = this.createOperationTypeSection('global');
        panel.appendChild(operationSection);

        // 描述输入
        const descriptionSection = this.createDescriptionSection();
        panel.appendChild(descriptionSection);

        const constraintSection = this.createConstraintPromptsSection();
        panel.appendChild(constraintSection);

        // 修饰性提示词
        const decorativeSection = this.createDecorativePromptsSection();
        panel.appendChild(decorativeSection);

        // 生成按钮
        const generateSection = this.createGenerateSection();
        panel.appendChild(generateSection);

        return panel;
    }

    createTextEditPanel() {
        const panel = document.createElement('div');
        panel.className = 'edit-panel text-edit-panel';
        panel.style.cssText = `
            flex: 1;
            display: none;
            flex-direction: column;
            padding: 16px;
            overflow-y: auto;
        `;

        // 文字编辑需要图层选择提示
        const notice = document.createElement('div');
        notice.style.cssText = `
            background: #4a3a2a;
            border: 1px solid #8a6a4a;
            border-radius: 4px;
            padding: 8px 12px;
            margin-bottom: 16px;
            color: #DEB887;
            font-size: 12px;
        `;
        notice.textContent = '⚠️ 文字编辑需要选择包含文字的图层';
        panel.appendChild(notice);

        // 操作类型选择
        const operationSection = this.createOperationTypeSection('text');
        panel.appendChild(operationSection);

        // 描述输入
        const descriptionSection = this.createDescriptionSection();
        panel.appendChild(descriptionSection);

        const constraintSection = this.createConstraintPromptsSection();
        panel.appendChild(constraintSection);

        // 修饰性提示词
        const decorativeSection = this.createDecorativePromptsSection();
        panel.appendChild(decorativeSection);

        // 生成按钮
        const generateSection = this.createGenerateSection();
        panel.appendChild(generateSection);

        return panel;
    }

    createProfessionalEditPanel() {
        const panel = document.createElement('div');
        panel.className = 'edit-panel professional-edit-panel';
        panel.style.cssText = `
            flex: 1;
            display: none;
            flex-direction: column;
            padding: 16px;
            overflow-y: auto;
        `;

        // 专业操作说明
        const notice = document.createElement('div');
        notice.style.cssText = `
            background: #2a2a4a;
            border: 1px solid #4a4a8a;
            border-radius: 4px;
            padding: 8px 12px;
            margin-bottom: 16px;
            color: #9999ff;
            font-size: 12px;
        `;
        notice.textContent = '🔧 专业操作支持全局和局部编辑，可选择性使用图层';
        panel.appendChild(notice);

        // 操作类型选择
        const operationSection = this.createOperationTypeSection('professional');
        panel.appendChild(operationSection);

        // 描述输入
        const descriptionSection = this.createDescriptionSection();
        panel.appendChild(descriptionSection);

        const constraintSection = this.createConstraintPromptsSection();
        panel.appendChild(constraintSection);

        // 修饰性提示词
        const decorativeSection = this.createDecorativePromptsSection();
        panel.appendChild(decorativeSection);

        // 生成按钮
        const generateSection = this.createGenerateSection();
        panel.appendChild(generateSection);

        return panel;
    }

    createAPIEditPanel() {
        const panel = document.createElement('div');
        panel.className = 'edit-panel api-edit-panel';
        panel.style.cssText = `
            flex: 1;
            display: none;
            flex-direction: column;
            padding: 16px;
            overflow-y: auto;
        `;

        // API编辑说明
        const notice = document.createElement('div');
        notice.style.cssText = `
            background: #2a4a4a;
            border: 1px solid #4a8a8a;
            border-radius: 4px;
            padding: 8px 12px;
            margin-bottom: 16px;
            color: #8FBC8F;
            font-size: 12px;
        `;
        notice.textContent = '🌐 使用云端AI模型生成高质量的编辑提示词';
        panel.appendChild(notice);

        // API配置区域
        const apiConfigSection = this.createAPIConfigSection();
        panel.appendChild(apiConfigSection);

        // 描述输入
        const descriptionSection = this.createDescriptionSection();
        panel.appendChild(descriptionSection);

        // 生成按钮
        const generateSection = this.createGenerateSection();
        panel.appendChild(generateSection);

        return panel;
    }

    createOllamaEditPanel() {
        const panel = document.createElement('div');
        panel.className = 'edit-panel ollama-edit-panel';
        panel.style.cssText = `
            flex: 1;
            display: none;
            flex-direction: column;
            padding: 16px;
            overflow-y: auto;
        `;

        // Ollama编辑说明
        const notice = document.createElement('div');
        notice.style.cssText = `
            background: #4a2a4a;
            border: 1px solid #8a4a8a;
            border-radius: 6px;
            padding: 12px;
            margin-bottom: 16px;
            color: #FF9999;
            font-size: 12px;
        `;
        notice.textContent = '🦙 使用本地Ollama模型生成私密安全的编辑提示词';
        panel.appendChild(notice);

        // Ollama服务管理区域
        const serviceManagementSection = this.createOllamaServiceManagementSection();
        panel.appendChild(serviceManagementSection);

        // 模型转换器区域
        const converterSection = this.createModelConverterSection();
        panel.appendChild(converterSection);

        // Ollama配置区域
        const ollamaConfigSection = this.createOllamaConfigSection();
        panel.appendChild(ollamaConfigSection);

        // 描述输入
        const descriptionSection = this.createDescriptionSection();
        panel.appendChild(descriptionSection);

        // 生成按钮
        const generateSection = this.createGenerateSection();
        panel.appendChild(generateSection);

        return panel;
    }

    createOperationTypeSection(category) {
        const section = document.createElement('div');
        section.className = 'operation-type-section';
        section.style.cssText = `
            margin-bottom: 16px;
        `;

        // 标题
        const title = document.createElement('div');
        title.style.cssText = `
            color: #fff;
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 8px;
        `;
        title.textContent = '🎨 操作类型';

        // 操作类型下拉框
        const operationSelect = document.createElement('select');
        operationSelect.className = `operation-select operation-select-${category}`;
        operationSelect.style.cssText = `
            width: 100%;
            background: #333;
            color: #fff;
            border: 1px solid #555;
            border-radius: 4px;
            padding: 8px 12px;
            font-size: 12px;
            cursor: pointer;
            outline: none;
        `;

        // 添加默认选项
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = '请选择操作类型...';
        defaultOption.disabled = true;
        // 不设置 selected = true，让初始化代码来设置正确的选项
        operationSelect.appendChild(defaultOption);

        // 添加操作选项
        const templates = KSP_NS.constants.OPERATION_CATEGORIES[category]?.templates || [];
        templates.forEach(templateId => {
            const template = KSP_NS.constants.OPERATION_TEMPLATES[templateId];
            if (template) {
                const option = document.createElement('option');
                option.value = templateId;
                option.textContent = template.label;
                operationSelect.appendChild(option);
            }
        });

        // 添加事件监听
        operationSelect.addEventListener('change', (e) => {
            if (e.target.value) {
                this.selectOperationType(e.target.value);
            }
        });

        section.appendChild(title);
        section.appendChild(operationSelect);

        return section;
    }

    createDescriptionSection() {
        const section = document.createElement('div');
        section.className = 'description-section';
        section.style.cssText = `
            margin-bottom: 16px;
        `;

        // 标题
        const title = document.createElement('div');
        title.style.cssText = `
            color: #fff;
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 8px;
        `;
        title.textContent = '✏️ 编辑描述';

        // 输入框
        const descriptionTextarea = document.createElement('textarea');
        descriptionTextarea.placeholder = '输入详细的编辑描述...';
        descriptionTextarea.style.cssText = `
            width: 100%;
            height: 80px;
            background: #2a2a2a;
            color: white;
            border: 1px solid #444;
            border-radius: 4px;
            padding: 8px;
            font-size: 12px;
            font-family: inherit;
            resize: vertical;
            outline: none;
        `;
        
        // 为每个描述输入框添加事件监听
        descriptionTextarea.addEventListener('input', (e) => {
            const newValue = e.target.value;
            
            // 调试：检测是否有模板文本被意外写入
            if (newValue && newValue.includes('transform') && newValue.includes('selected area')) {
                console.warn('[Kontext Super Prompt] ⚠️ 警告：检测到模板文本被写入描述字段:', newValue);
                console.trace('[Kontext Super Prompt] 调用堆栈：');
            }
            
            this.description = newValue;
            // 同步更新所有面板的描述输入框
            this.updateAllDescriptionTextareas();
            this.notifyNodeUpdate();
        });
        
        // 设置初始值
        if (this.description) {
            descriptionTextarea.value = this.description;
        }

        section.appendChild(title);
        section.appendChild(descriptionTextarea);
        
        // 保存引用以便后续更新
        this.descriptionTextarea = descriptionTextarea;

        return section;
    }

    createConstraintPromptsSection() {
        const section = document.createElement('div');
        section.className = 'constraint-prompts-section';
        section.style.cssText = `
            margin-bottom: 16px;
        `;

        // 标题
        const title = document.createElement('div');
        title.style.cssText = `
            color: #fff;
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        `;

        const titleText = document.createElement('span');
        titleText.textContent = '🛡️ 约束性提示词';

        title.appendChild(titleText);

        const constraintContainer = document.createElement('div');
        constraintContainer.className = 'constraint-prompts-container';
        constraintContainer.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 4px;
            max-height: 120px;
            overflow-y: auto;
            padding: 8px;
            background: #2a2a2a;
            border: 1px solid #444;
            border-radius: 4px;
        `;
        
        // 设置全局引用（用于当前活动的容器）
        if (!this.constraintContainer) {
            this.constraintContainer = constraintContainer;
        }

        section.appendChild(title);
        section.appendChild(constraintContainer);

        // 自动添加按钮已移除

        return section;
    }

    createDecorativePromptsSection() {
        const section = document.createElement('div');
        section.className = 'decorative-prompts-section';
        section.style.cssText = `
            margin-bottom: 16px;
        `;

        // 标题
        const title = document.createElement('div');
        title.style.cssText = `
            color: #fff;
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        `;

        const titleText = document.createElement('span');
        titleText.textContent = '✨ 修饰性提示词';

        title.appendChild(titleText);

        // 修饰词容器 - 创建独立容器而不是覆盖全局引用
        const decorativeContainer = document.createElement('div');
        decorativeContainer.className = 'decorative-prompts-container';
        decorativeContainer.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 4px;
            max-height: 120px;
            overflow-y: auto;
            padding: 8px;
            background: #2a2a2a;
            border: 1px solid #444;
            border-radius: 4px;
        `;
        
        // 设置全局引用（用于当前活动的容器）
        if (!this.decorativeContainer) {
            this.decorativeContainer = decorativeContainer;
        }

        section.appendChild(title);
        section.appendChild(decorativeContainer);

        // 自动添加按钮已移除

        return section;
    }

    createGenerateSection() {
        const section = document.createElement('div');
        section.className = 'generate-section';
        section.style.cssText = `
            margin-top: auto;
            padding-top: 16px;
            border-top: 1px solid #444;
        `;

        // 预览文本框标题
        const previewTitle = document.createElement('div');
        previewTitle.style.cssText = `
            color: #fff;
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 8px;
        `;
        previewTitle.textContent = '📝 提示词预览';
        
        // 创建预览文本框（每个panel都创建新的textarea，但共享数据）
        const promptPreviewTextarea = document.createElement('textarea');
        promptPreviewTextarea.placeholder = '生成的超级提示词将在此处显示，可编辑修改...';
        promptPreviewTextarea.style.cssText = `
            width: 100%;
            height: 180px;
            background: #2a2a2a;
            color: #fff;
            border: 1px solid #444;
            border-radius: 4px;
            padding: 8px;
            font-size: 12px;
            resize: vertical;
            font-family: monospace;
            margin-bottom: 12px;
            box-sizing: border-box;
        `;
        
        // 设置初始值（如果已经有生成的提示词）
        if (this.generatedPrompt) {
            promptPreviewTextarea.value = this.generatedPrompt;
        }
        
        // 添加事件监听器
        promptPreviewTextarea.addEventListener('input', (e) => {
            this.generatedPrompt = e.target.value;
            this.updateAllPreviewTextareas();
            this.updateNodeWidgets({
                edit_mode: this.currentEditMode,
                operation_type: this.currentOperationType,
                description: this.description,
                constraint_prompts: translatePromptsToEnglish(this.selectedConstraints).join('\n'),
                decorative_prompts: translatePromptsToEnglish(this.selectedDecoratives).join('\n'),
                selected_layers: JSON.stringify(this.selectedLayers),
                auto_generate: this.autoGenerate,
                generated_prompt: this.generatedPrompt
            });
        });
        
        // 保存所有textarea的引用
        if (!this.previewTextareas) {
            this.previewTextareas = [];
        }
        this.previewTextareas.push(promptPreviewTextarea);

        const buttonGroup = document.createElement('div');
        buttonGroup.style.cssText = `
            display: flex;
            gap: 8px;
        `;

        const generateBtn = document.createElement('button');
        generateBtn.textContent = '🎯 生成超级提示词';
        generateBtn.style.cssText = `
            flex: 1;
            background: linear-gradient(45deg, #9C27B0, #673AB7);
            color: white;
            border: none;
            border-radius: 6px;
            padding: 12px 16px;
            font-size: 13px;
            cursor: pointer;
            font-weight: 600;
            box-shadow: 0 2px 4px rgba(156, 39, 176, 0.3);
            transition: all 0.2s;
        `;

        const copyBtn = document.createElement('button');
        copyBtn.textContent = '📋 复制';
        copyBtn.style.cssText = `
            background: #2196F3;
            color: white;
            border: none;
            border-radius: 6px;
            padding: 12px 16px;
            font-size: 13px;
            cursor: pointer;
            font-weight: 600;
            min-width: 60px;
        `;

        buttonGroup.appendChild(generateBtn);
        buttonGroup.appendChild(copyBtn);
        
        section.appendChild(previewTitle);
        section.appendChild(promptPreviewTextarea);
        section.appendChild(buttonGroup);

        // 绑定事件
        generateBtn.addEventListener('click', () => {
            this.generateSuperPrompt();
        });

        copyBtn.addEventListener('click', () => {
            this.copyToClipboard();
        });

        return section;
    }

    createAPIConfigSection() {
        const section = document.createElement('div');
        section.className = 'api-config-section';
        section.style.cssText = `
            margin-bottom: 16px;
            padding: 12px;
            border: 1px solid #4a8a8a;
            border-radius: 6px;
            background: #1a2a2a;
        `;

        const title = document.createElement('div');
        title.style.cssText = `
            color: #8FBC8F;
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 12px;
        `;
        title.textContent = '🌐 远程API配置';

        // API提供商选择
        const providerRow = document.createElement('div');
        providerRow.style.cssText = `display: flex; align-items: center; margin-bottom: 8px;`;
        
        const providerLabel = document.createElement('span');
        providerLabel.style.cssText = `color: #ccc; font-size: 11px; width: 80px;`;
        providerLabel.textContent = 'API提供商:';
        
        const providerSelect = document.createElement('select');
        providerSelect.className = 'api-provider-select';
        providerSelect.style.cssText = `
            flex: 1; background: #2a2a2a; color: #fff; border: 1px solid #555;
            border-radius: 3px; padding: 4px 8px; font-size: 11px;
        `;
        const providerOptions = [
            { value: 'siliconflow', text: 'SiliconFlow (DeepSeek)' },
            { value: 'deepseek', text: 'DeepSeek 官方' },
            { value: 'qianwen', text: '千问 (阿里云)' },
            { value: 'zhipu', text: '智谱AI (GLM)' },
            { value: 'moonshot', text: 'Moonshot (Kimi)' },
            { value: 'gemini', text: 'Google Gemini' },
            { value: 'openai', text: 'OpenAI' }
        ];
        providerOptions.forEach(provider => {
            const option = document.createElement('option');
            option.value = provider.value;
            option.textContent = provider.text;
            providerSelect.appendChild(option);
        });

        // API Key输入
        const keyRow = document.createElement('div');
        keyRow.style.cssText = `display: flex; align-items: center; margin-bottom: 8px;`;
        
        const keyLabel = document.createElement('span');
        keyLabel.style.cssText = `color: #ccc; font-size: 11px; width: 80px;`;
        keyLabel.textContent = 'API Key:';
        
        const keyInput = document.createElement('input');
        keyInput.className = 'api-key-input';
        keyInput.type = 'password';
        keyInput.placeholder = '输入API密钥...';
        keyInput.style.cssText = `
            flex: 1; background: #2a2a2a; color: #fff; border: 1px solid #555;
            border-radius: 3px; padding: 4px 8px; font-size: 11px;
        `;

        // 模型选择
        const modelRow = document.createElement('div');
        modelRow.style.cssText = `display: flex; align-items: center; margin-bottom: 8px;`;
        
        const modelLabel = document.createElement('span');
        modelLabel.style.cssText = `color: #ccc; font-size: 11px; width: 80px;`;
        modelLabel.textContent = '模型:';
        
        const modelSelect = document.createElement('select');
        modelSelect.className = 'api-model-select';
        modelSelect.style.cssText = `
            flex: 1; background: #2a2a2a; color: #fff; border: 1px solid #555;
            border-radius: 3px; padding: 4px 8px; font-size: 11px;
        `;
        // 定义每个提供商的默认模型
        const providerModels = {
            'siliconflow': ['deepseek-ai/DeepSeek-V3', 'deepseek-ai/DeepSeek-R1'],
            'deepseek': ['deepseek-chat'],
            'qianwen': ['qwen-turbo', 'qwen-plus', 'qwen-max'],
            'zhipu': ['glm-4', 'glm-4-flash', 'glm-4-plus', 'glm-4v', 'glm-4v-plus'],
            'moonshot': ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
            'gemini': ['gemini-pro', 'gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-1.5-flash'],
            'openai': ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'gpt-4o', 'gpt-4o-mini', 'o1-mini', 'o1-preview']
        };
        
        // 更新模型列表的函数
        const updateModelList = async (provider) => {
            modelSelect.innerHTML = '';
            
            // 添加加载提示
            const loadingOption = document.createElement('option');
            loadingOption.value = '';
            loadingOption.textContent = '加载模型列表中...';
            modelSelect.appendChild(loadingOption);
            
            try {
                // 尝试动态获取模型列表
                const apiKey = this.apiConfig?.keyInput?.value || '';
                if (apiKey && this.supportsDynamicModels(provider)) {
                    const dynamicModels = await this.fetchDynamicModels(provider, apiKey);
                    if (dynamicModels && dynamicModels.length > 0) {
                        modelSelect.innerHTML = '';
                        dynamicModels.forEach(model => {
                            const option = document.createElement('option');
                            option.value = model;
                            option.textContent = model;
                            modelSelect.appendChild(option);
                        });
                        return;
                    }
                }
            } catch (error) {
                console.warn(`动态获取${provider}模型失败:`, error);
            }
            
            // 回退到预定义模型列表
            modelSelect.innerHTML = '';
            const models = providerModels[provider] || ['custom-model'];
            models.forEach(model => {
                const option = document.createElement('option');
                option.value = model;
                option.textContent = model;
                modelSelect.appendChild(option);
            });
        };
        
        // 初始化模型列表
        updateModelList('siliconflow');
        
        // 监听提供商变化
        providerSelect.addEventListener('change', () => {
            updateModelList(providerSelect.value);
        });

        // 监听API key变化，自动更新模型列表
        let keyInputTimeout;
        keyInput.addEventListener('input', () => {
            // 防抖动，避免频繁请求
            clearTimeout(keyInputTimeout);
            keyInputTimeout = setTimeout(() => {
                const provider = providerSelect.value;
                const apiKey = keyInput.value.trim();
                if (apiKey && this.supportsDynamicModels(provider)) {
                    updateModelList(provider);
                }
            }, 1000); // 1秒延迟
        });

        // 编辑意图选择
        const intentRow = document.createElement('div');
        intentRow.style.cssText = `display: flex; align-items: center; margin-bottom: 8px;`;
        
        const intentLabel = document.createElement('span');
        intentLabel.style.cssText = `color: #ccc; font-size: 11px; width: 80px;`;
        intentLabel.textContent = '编辑意图:';
        
        const intentSelect = document.createElement('select');
        intentSelect.className = 'api-intent-select';
        intentSelect.style.cssText = `
            flex: 1; background: #2a2a2a; color: #fff; border: 1px solid #555;
            border-radius: 3px; padding: 4px 8px; font-size: 11px;
        `;
        const intents = [
            // 编辑意图类型 - 具体的操作动作
            { value: 'color_change', text: '颜色修改' },
            { value: 'object_removal', text: '物体移除' },
            { value: 'object_replacement', text: '物体替换' },
            { value: 'object_addition', text: '物体添加' },
            { value: 'background_change', text: '背景更换' },
            { value: 'face_swap', text: '换脸' },
            { value: 'quality_enhancement', text: '质量增强' },
            { value: 'image_restoration', text: '图像修复' },
            { value: 'style_transfer', text: '风格转换' },
            { value: 'text_edit', text: '文字编辑' },
            { value: 'lighting_adjustment', text: '光线调整' },
            { value: 'perspective_correction', text: '透视校正' },
            { value: 'blur_sharpen', text: '模糊/锐化' },
            { value: 'local_deformation', text: '局部变形' },
            { value: 'composition_adjustment', text: '构图调整' },
            { value: 'general_editing', text: '通用编辑' }
        ];
        intents.forEach(intent => {
            const option = document.createElement('option');
            option.value = intent.value;
            option.textContent = intent.text;
            if (intent.value === 'general_editing') option.selected = true;
            intentSelect.appendChild(option);
        });

        // 处理风格选择
        const styleRow = document.createElement('div');
        styleRow.style.cssText = `display: flex; align-items: center; margin-bottom: 8px;`;
        
        const styleLabel = document.createElement('span');
        styleLabel.style.cssText = `color: #ccc; font-size: 11px; width: 80px;`;
        styleLabel.textContent = '处理风格:';
        
        const styleSelect = document.createElement('select');
        styleSelect.className = 'api-style-select';
        styleSelect.style.cssText = `
            flex: 1; background: #2a2a2a; color: #fff; border: 1px solid #555;
            border-radius: 3px; padding: 4px 8px; font-size: 11px;
        `;
        const styles = [
            // 应用场景/风格 - 用于什么场景
            { value: 'ecommerce_product', text: '电商产品' },
            { value: 'social_media', text: '社交媒体' },
            { value: 'marketing_campaign', text: '营销活动' },
            { value: 'portrait_professional', text: '专业肖像' },
            { value: 'lifestyle', text: '生活方式' },
            { value: 'food_photography', text: '美食摄影' },
            { value: 'real_estate', text: '房地产' },
            { value: 'fashion_retail', text: '时尚零售' },
            { value: 'automotive', text: '汽车展示' },
            { value: 'beauty_cosmetics', text: '美妆化妆品' },
            { value: 'corporate_branding', text: '企业品牌' },
            { value: 'event_photography', text: '活动摄影' },
            { value: 'product_catalog', text: '产品目录' },
            { value: 'artistic_creation', text: '艺术创作' },
            { value: 'documentary', text: '纪实摄影' },
            { value: 'auto_smart', text: '智能自动' }
        ];
        styles.forEach(style => {
            const option = document.createElement('option');
            option.value = style.value;
            option.textContent = style.text;
            if (style.value === 'auto_smart') option.selected = true;
            styleSelect.appendChild(option);
        });

        providerRow.appendChild(providerLabel);
        providerRow.appendChild(providerSelect);
        keyRow.appendChild(keyLabel);
        keyRow.appendChild(keyInput);
        modelRow.appendChild(modelLabel);
        modelRow.appendChild(modelSelect);
        intentRow.appendChild(intentLabel);
        intentRow.appendChild(intentSelect);
        styleRow.appendChild(styleLabel);
        styleRow.appendChild(styleSelect);

        section.appendChild(title);
        section.appendChild(providerRow);
        section.appendChild(keyRow);
        section.appendChild(modelRow);
        section.appendChild(intentRow);
        section.appendChild(styleRow);

        // 保存配置到实例
        this.apiConfig = {
            providerSelect,
            keyInput,
            modelSelect,
            intentSelect,
            styleSelect
        };

        return section;
    }

    createOllamaServiceManagementSection() {
        const section = document.createElement('div');
        section.className = 'ollama-service-section';
        section.style.cssText = `
            margin-bottom: 16px;
            padding: 12px;
            border: 1px solid #666;
            border-radius: 6px;
            background: rgba(255, 255, 255, 0.03);
        `;

        // 紧凑的一行布局
        const controlRow = document.createElement('div');
        controlRow.style.cssText = `
            display: flex; 
            align-items: center; 
            gap: 6px; 
            font-size: 11px;
        `;
        
        // 服务标识
        const serviceLabel = document.createElement('span');
        serviceLabel.textContent = '🦙';
        serviceLabel.style.cssText = `font-size: 14px;`;
        
        // 状态显示
        this.ollamaStatusDisplay = document.createElement('span');
        this.ollamaStatusDisplay.style.cssText = `
            padding: 2px 6px; font-size: 10px; border-radius: 2px;
            font-weight: bold; min-width: 50px; text-align: center;
        `;
        this.ollamaStatusDisplay.textContent = '检测中';
        this.updateOllamaServiceStatus('检测中');

        // 启动/停止按钮
        this.ollamaServiceButton = document.createElement('button');
        this.ollamaServiceButton.style.cssText = `
            padding: 3px 8px; border: none; border-radius: 3px;
            background: #4CAF50; color: white; font-size: 10px;
            cursor: pointer; font-weight: bold; min-width: 40px;
        `;
        this.ollamaServiceButton.textContent = '启动';
        this.ollamaServiceButton.onclick = () => this.toggleOllamaService();

        // 释放内存按钮
        const unloadButton = document.createElement('button');
        unloadButton.style.cssText = `
            padding: 3px 8px; border: none; border-radius: 3px;
            background: #FF9800; color: white; font-size: 10px;
            cursor: pointer; font-weight: bold;
        `;
        unloadButton.textContent = '释放';
        unloadButton.title = '释放模型内存';
        unloadButton.onclick = () => this.unloadOllamaModels();

        // 刷新按钮
        const refreshButton = document.createElement('button');
        refreshButton.style.cssText = `
            padding: 3px 6px; border: none; border-radius: 3px;
            background: #2196F3; color: white; font-size: 10px;
            cursor: pointer; font-weight: bold;
        `;
        refreshButton.textContent = '🔄';
        refreshButton.title = '刷新状态';
        refreshButton.onclick = () => this.checkOllamaServiceStatus();

        // 组装元素 - 一行排列
        controlRow.appendChild(serviceLabel);
        controlRow.appendChild(this.ollamaStatusDisplay);
        controlRow.appendChild(this.ollamaServiceButton);
        controlRow.appendChild(unloadButton);
        controlRow.appendChild(refreshButton);
        
        section.appendChild(controlRow);

        // 初始状态检查
        this.checkOllamaServiceStatus();

        return section;
    }

    createOllamaConfigSection() {
        const section = document.createElement('div');
        section.className = 'ollama-config-section';
        section.style.cssText = `
            margin-bottom: 16px;
            padding: 12px;
            border: 1px solid #8a4a8a;
            border-radius: 6px;
            background: #2a1a2a;
        `;

        const title = document.createElement('div');
        title.style.cssText = `
            color: #FF9999;
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 12px;
        `;
        title.textContent = '🦙 本地Ollama配置';

        // Ollama URL输入
        const urlRow = document.createElement('div');
        urlRow.style.cssText = `display: flex; align-items: center; margin-bottom: 8px;`;
        
        const urlLabel = document.createElement('span');
        urlLabel.style.cssText = `color: #ccc; font-size: 11px; width: 80px;`;
        urlLabel.textContent = '服务地址:';
        
        const urlInput = document.createElement('input');
        urlInput.value = 'http://127.0.0.1:11434';
        urlInput.style.cssText = `
            flex: 1; background: #2a2a2a; color: #fff; border: 1px solid #555;
            border-radius: 3px; padding: 4px 8px; font-size: 11px;
        `;

        // 模型选择
        const modelRow = document.createElement('div');
        modelRow.style.cssText = `display: flex; align-items: center; margin-bottom: 8px;`;
        
        const modelLabel = document.createElement('span');
        modelLabel.style.cssText = `color: #ccc; font-size: 11px; width: 80px;`;
        modelLabel.textContent = '模型:';
        
        const modelSelect = document.createElement('select');
        modelSelect.style.cssText = `
            flex: 1; background: #2a2a2a; color: #fff; border: 1px solid #555;
            border-radius: 3px; padding: 4px 8px; font-size: 11px;
        `;
        
        // 添加刷新按钮
        const refreshBtn = document.createElement('button');
        refreshBtn.textContent = '🔄';
        refreshBtn.style.cssText = `
            margin-left: 4px; background: #444; color: #fff; border: 1px solid #666;
            border-radius: 3px; padding: 4px 8px; cursor: pointer; font-size: 11px;
        `;
        
        // 温度设置
        const tempRow = document.createElement('div');
        tempRow.style.cssText = `display: flex; align-items: center; margin-bottom: 8px;`;
        
        const tempLabel = document.createElement('span');
        tempLabel.style.cssText = `color: #ccc; font-size: 11px; width: 80px;`;
        tempLabel.textContent = '温度:';
        
        const tempInput = document.createElement('input');
        tempInput.type = 'range';
        tempInput.min = '0.1';
        tempInput.max = '1.0';
        tempInput.step = '0.1';
        tempInput.value = '0.7';
        tempInput.style.cssText = `flex: 1; margin-right: 8px;`;
        
        const tempValue = document.createElement('span');
        tempValue.style.cssText = `color: #ccc; font-size: 11px; width: 30px;`;
        tempValue.textContent = '0.7';

        tempInput.addEventListener('input', () => {
            tempValue.textContent = tempInput.value;
        });

        urlRow.appendChild(urlLabel);
        urlRow.appendChild(urlInput);
        modelRow.appendChild(modelLabel);
        modelRow.appendChild(modelSelect);
        modelRow.appendChild(refreshBtn);
        tempRow.appendChild(tempLabel);
        tempRow.appendChild(tempInput);
        tempRow.appendChild(tempValue);

        // 编辑意图选择
        const intentRow = document.createElement('div');
        intentRow.style.cssText = `display: flex; align-items: center; margin-bottom: 8px;`;
        
        const intentLabel = document.createElement('span');
        intentLabel.style.cssText = `color: #ccc; font-size: 11px; width: 80px;`;
        intentLabel.textContent = '编辑意图:';
        
        const intentSelect = document.createElement('select');
        intentSelect.className = 'ollama-editing-intent';
        intentSelect.style.cssText = `
            flex: 1; background: #2a2a2a; color: #fff; border: 1px solid #555;
            border-radius: 3px; padding: 4px 8px; font-size: 11px;
        `;
        const intents = [
            // 编辑意图类型 - 与API模式保持一致
            { value: 'color_change', label: '颜色修改' },
            { value: 'object_removal', label: '物体移除' },
            { value: 'object_replacement', label: '物体替换' },
            { value: 'object_addition', label: '物体添加' },
            { value: 'background_change', label: '背景更换' },
            { value: 'face_swap', label: '换脸' },
            { value: 'quality_enhancement', label: '质量增强' },
            { value: 'image_restoration', label: '图像修复' },
            { value: 'style_transfer', label: '风格转换' },
            { value: 'text_edit', label: '文字编辑' },
            { value: 'lighting_adjustment', label: '光线调整' },
            { value: 'perspective_correction', label: '透视校正' },
            { value: 'blur_sharpen', label: '模糊/锐化' },
            { value: 'local_deformation', label: '局部变形' },
            { value: 'composition_adjustment', label: '构图调整' },
            { value: 'general_editing', label: '通用编辑' }
        ];
        intents.forEach(intent => {
            const option = document.createElement('option');
            option.value = intent.value;
            option.textContent = intent.label;
            if (intent.value === 'general_editing') option.selected = true;
            intentSelect.appendChild(option);
        });

        // 处理风格选择
        const styleRow = document.createElement('div');
        styleRow.style.cssText = `display: flex; align-items: center; margin-bottom: 8px;`;
        
        const styleLabel = document.createElement('span');
        styleLabel.style.cssText = `color: #ccc; font-size: 11px; width: 80px;`;
        styleLabel.textContent = '处理风格:';
        
        const styleSelect = document.createElement('select');
        styleSelect.className = 'ollama-processing-style';
        styleSelect.style.cssText = `
            flex: 1; background: #2a2a2a; color: #fff; border: 1px solid #555;
            border-radius: 3px; padding: 4px 8px; font-size: 11px;
        `;
        const styles = [
            // 应用场景/风格 - 与API模式保持一致
            { value: 'ecommerce_product', label: '电商产品' },
            { value: 'social_media', label: '社交媒体' },
            { value: 'marketing_campaign', label: '营销活动' },
            { value: 'portrait_professional', label: '专业肖像' },
            { value: 'lifestyle', label: '生活方式' },
            { value: 'food_photography', label: '美食摄影' },
            { value: 'real_estate', label: '房地产' },
            { value: 'fashion_retail', label: '时尚零售' },
            { value: 'automotive', label: '汽车展示' },
            { value: 'beauty_cosmetics', label: '美妆化妆品' },
            { value: 'corporate_branding', label: '企业品牌' },
            { value: 'event_photography', label: '活动摄影' },
            { value: 'product_catalog', label: '产品目录' },
            { value: 'artistic_creation', label: '艺术创作' },
            { value: 'documentary', label: '纪实摄影' },
            { value: 'auto_smart', label: '智能自动' }
        ];
        styles.forEach(style => {
            const option = document.createElement('option');
            option.value = style.value;
            option.textContent = style.label;
            if (style.value === 'auto_smart') option.selected = true;
            styleSelect.appendChild(option);
        });

        // 自定义指引文本框（默认隐藏）
        const guidanceRow = document.createElement('div');
        guidanceRow.className = 'ollama-custom-guidance-row';
        guidanceRow.style.cssText = `display: none; margin-bottom: 8px;`;
        
        const guidanceLabel = document.createElement('div');
        guidanceLabel.style.cssText = `color: #ccc; font-size: 11px; margin-bottom: 4px;`;
        guidanceLabel.textContent = '自定义指引:';
        
        const guidanceTextarea = document.createElement('textarea');
        guidanceTextarea.className = 'ollama-custom-guidance';
        guidanceTextarea.placeholder = '输入自定义AI指引...';
        guidanceTextarea.style.cssText = `
            width: 100%; height: 60px; background: #2a2a2a; color: #fff; 
            border: 1px solid #555; border-radius: 3px; padding: 4px 8px; 
            font-size: 11px; resize: vertical; box-sizing: border-box;
        `;

        // 当选择自定义指引时显示文本框
        styleSelect.addEventListener('change', () => {
            guidanceRow.style.display = styleSelect.value === 'custom_guidance' ? 'block' : 'none';
        });

        // 额外选项
        const optionsRow = document.createElement('div');
        optionsRow.style.cssText = `display: flex; align-items: center; margin-bottom: 8px; gap: 16px;`;
        
        const visualCheckbox = document.createElement('input');
        visualCheckbox.type = 'checkbox';
        visualCheckbox.className = 'ollama-enable-visual';
        visualCheckbox.id = 'ollama-visual';
        
        const visualLabel = document.createElement('label');
        visualLabel.htmlFor = 'ollama-visual';
        visualLabel.style.cssText = `color: #ccc; font-size: 11px; cursor: pointer;`;
        visualLabel.textContent = '启用视觉分析';
        
        const unloadCheckbox = document.createElement('input');
        unloadCheckbox.type = 'checkbox';
        unloadCheckbox.className = 'ollama-auto-unload';
        unloadCheckbox.id = 'ollama-unload';
        
        const unloadLabel = document.createElement('label');
        unloadLabel.htmlFor = 'ollama-unload';
        unloadLabel.style.cssText = `color: #ccc; font-size: 11px; cursor: pointer;`;
        unloadLabel.textContent = '自动卸载模型';

        optionsRow.appendChild(visualCheckbox);
        optionsRow.appendChild(visualLabel);
        optionsRow.appendChild(unloadCheckbox);
        optionsRow.appendChild(unloadLabel);

        intentRow.appendChild(intentLabel);
        intentRow.appendChild(intentSelect);
        styleRow.appendChild(styleLabel);
        styleRow.appendChild(styleSelect);
        guidanceRow.appendChild(guidanceLabel);
        guidanceRow.appendChild(guidanceTextarea);

        section.appendChild(title);
        section.appendChild(urlRow);
        section.appendChild(modelRow);
        section.appendChild(tempRow);
        section.appendChild(intentRow);
        section.appendChild(styleRow);
        section.appendChild(guidanceRow);
        section.appendChild(optionsRow);

        // 保存引用以便后续访问
        this.ollamaUrlInput = urlInput;
        this.ollamaModelSelect = modelSelect;
        this.ollamaTempInput = tempInput;
        this.ollamaIntentSelect = intentSelect;
        this.ollamaStyleSelect = styleSelect;
        this.ollamaGuidanceTextarea = guidanceTextarea;
        this.ollamaVisualCheckbox = visualCheckbox;
        this.ollamaUnloadCheckbox = unloadCheckbox;

        // 添加刷新模型列表功能
        refreshBtn.addEventListener('click', async () => {
            try {
                const url = urlInput.value || 'http://127.0.0.1:11434';
                const response = await fetch('/ollama_flux_enhancer/get_models', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url })
                });
                const models = await response.json();
                
                // 清空并重新填充模型列表
                modelSelect.innerHTML = '';
                if (models && models.length > 0) {
                    models.forEach(model => {
                        const option = document.createElement('option');
                        option.value = model;
                        option.textContent = model;
                        modelSelect.appendChild(option);
                    });
                } else {
                    const option = document.createElement('option');
                    option.value = '';
                    option.textContent = '未找到模型';
                    modelSelect.appendChild(option);
                }
            } catch (e) {
                console.error('获取Ollama模型失败:', e);
            }
        });

        return section;
    }

    createModelConverterSection() {
        const section = document.createElement('div');
        section.className = 'model-converter-section';
        section.style.cssText = `
            margin-bottom: 16px;
            padding: 12px;
            border: 1px solid #6a4a8a;
            border-radius: 6px;
            background: #1a1a2a;
        `;

        const title = document.createElement('div');
        title.style.cssText = `
            color: #BB99FF;
            font-size: 11px;
            font-weight: bold;
            margin-bottom: 8px;
        `;
        title.textContent = '🔄 GGUF模型转换器';

        // 扫描按钮和状态显示
        const scanRow = document.createElement('div');
        scanRow.style.cssText = `display: flex; align-items: center; margin-bottom: 6px; gap: 6px;`;
        
        const scanBtn = document.createElement('button');
        scanBtn.textContent = '扫描GGUF模型';
        scanBtn.style.cssText = `
            background: #4a6a8a; color: #fff; border: 1px solid #6a8aaa;
            border-radius: 3px; padding: 4px 8px; cursor: pointer; font-size: 10px;
        `;
        
        const statusSpan = document.createElement('span');
        statusSpan.style.cssText = `color: #999; font-size: 10px; flex: 1;`;
        statusSpan.textContent = '请先扫描GGUF模型文件';

        scanRow.appendChild(scanBtn);
        scanRow.appendChild(statusSpan);

        // 模型列表容器
        const modelsContainer = document.createElement('div');
        modelsContainer.className = 'gguf-models-container';
        modelsContainer.style.cssText = `
            max-height: 120px; overflow-y: auto; border: 1px solid #444;
            border-radius: 3px; background: #1a1a1a; margin-bottom: 6px;
            display: none;
        `;

        // 说明文字
        const helpText = document.createElement('div');
        helpText.style.cssText = `color: #888; font-size: 9px; margin-top: 4px; line-height: 1.2;`;
        helpText.textContent = '将GGUF模型文件放置到 ComfyUI/models/ollama_import/ 目录下，点击扫描后可转换为Ollama格式';

        section.appendChild(title);
        section.appendChild(scanRow);
        section.appendChild(modelsContainer);
        section.appendChild(helpText);

        // 绑定扫描事件
        scanBtn.addEventListener('click', () => {
            this.scanGGUFModels(statusSpan, modelsContainer);
        });

        return section;
    }

    async scanGGUFModels(statusSpan, modelsContainer) {
        try {
            statusSpan.textContent = '正在扫描模型文件...';
            statusSpan.style.color = '#ff9';
            
            const response = await fetch('/ollama_converter/models');
            const data = await response.json();
            
            if (data.models && data.models.length > 0) {
                this.displayGGUFModels(data.models, modelsContainer, statusSpan);
                statusSpan.textContent = `发现 ${data.models.length} 个GGUF模型`;
                statusSpan.style.color = '#9f9';
                modelsContainer.style.display = 'block';
            } else {
                statusSpan.textContent = '未发现GGUF模型文件';
                statusSpan.style.color = '#f99';
                modelsContainer.style.display = 'none';
            }
        } catch (error) {
            console.error('[Model Converter] 扫描失败:', error);
            statusSpan.textContent = '扫描失败: ' + error.message;
            statusSpan.style.color = '#f99';
            modelsContainer.style.display = 'none';
        }
    }

    displayGGUFModels(models, container, statusSpan) {
        container.innerHTML = '';
        
        models.forEach(model => {
            const modelItem = document.createElement('div');
            modelItem.style.cssText = `
                padding: 6px; border-bottom: 1px solid #333; display: flex;
                align-items: center; justify-content: space-between;
            `;
            
            const modelInfo = document.createElement('div');
            modelInfo.style.cssText = `flex: 1;`;
            
            const modelName = document.createElement('div');
            modelName.style.cssText = `color: #fff; font-size: 10px; font-weight: bold;`;
            modelName.textContent = model.name;
            
            const modelDetails = document.createElement('div');
            modelDetails.style.cssText = `color: #888; font-size: 9px; margin-top: 1px;`;
            modelDetails.textContent = `文件大小: ${(model.file_size / 1024 / 1024 / 1024).toFixed(2)} GB`;
            
            const convertBtn = document.createElement('button');
            convertBtn.style.cssText = `
                padding: 3px 6px; font-size: 9px; border-radius: 2px;
                border: 1px solid; cursor: pointer;
            `;
            
            if (model.is_converted) {
                convertBtn.textContent = '已转换';
                convertBtn.style.cssText += `
                    background: #2a4a2a; color: #9f9; border-color: #4a6a4a;
                    cursor: default;
                `;
                convertBtn.disabled = true;
            } else {
                convertBtn.textContent = '转换';
                convertBtn.style.cssText += `
                    background: #4a2a8a; color: #fff; border-color: #6a4aaa;
                `;
                convertBtn.addEventListener('click', () => {
                    this.convertGGUFModel(model, convertBtn, statusSpan);
                });
            }
            
            modelInfo.appendChild(modelName);
            modelInfo.appendChild(modelDetails);
            modelItem.appendChild(modelInfo);
            modelItem.appendChild(convertBtn);
            container.appendChild(modelItem);
        });
    }

    async convertGGUFModel(model, button, statusSpan) {
        try {
            button.textContent = '转换中...';
            button.disabled = true;
            button.style.background = '#444';
            statusSpan.textContent = `正在转换模型: ${model.name}`;
            statusSpan.style.color = '#ff9';
            
            const response = await fetch('/ollama_converter/convert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model_name: model.name })
            });
            
            const result = await response.json();
            
            if (result.success) {
                button.textContent = '已转换';
                button.style.background = '#2a4a2a';
                button.style.color = '#9f9';
                button.style.borderColor = '#4a6a4a';
                statusSpan.textContent = `转换成功: ${model.ollama_name}`;
                statusSpan.style.color = '#9f9';
                
                // 刷新Ollama模型列表
                if (this.ollamaModelSelect) {
                    this.refreshOllamaModels();
                }
            } else {
                button.textContent = '转换失败';
                button.disabled = false;
                button.style.background = '#4a2a2a';
                button.style.color = '#f99';
                statusSpan.textContent = `转换失败: ${result.message}`;
                statusSpan.style.color = '#f99';
            }
        } catch (error) {
            console.error('[Model Converter] 转换失败:', error);
            button.textContent = '转换失败';
            button.disabled = false;
            button.style.background = '#4a2a2a';
            button.style.color = '#f99';
            statusSpan.textContent = '转换失败: ' + error.message;
            statusSpan.style.color = '#f99';
        }
    }

    async refreshOllamaModels() {
        try {
            const url = this.ollamaUrlInput?.value || 'http://127.0.0.1:11434';
            const response = await fetch('/ollama_flux_enhancer/get_models', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });
            const models = await response.json();
            
            if (this.ollamaModelSelect && models && models.length > 0) {
                const currentValue = this.ollamaModelSelect.value;
                this.ollamaModelSelect.innerHTML = '';
                models.forEach(model => {
                    const option = document.createElement('option');
                    option.value = model;
                    option.textContent = model;
                    this.ollamaModelSelect.appendChild(option);
                });
                
                // 恢复之前的选择
                if (currentValue && models.includes(currentValue)) {
                    this.ollamaModelSelect.value = currentValue;
                }
            }
        } catch (error) {
            console.error('[Model Converter] 刷新Ollama模型列表失败:', error);
        }
    }

    switchTab(tabId) {
        // 如果正在从API或Ollama更新，不执行切换
        if (this.isUpdatingFromAPI || this.isUpdatingFromOllama) {
            return;
        }
        
        const tabButtons = this.tabBar.querySelectorAll('.tab-button');
        tabButtons.forEach(btn => {
            if (btn.classList.contains(`tab-${tabId}`)) {
                btn.style.color = '#9C27B0';
                btn.style.borderBottomColor = '#9C27B0';
                btn.style.background = '#2a1a2a';
            } else {
                btn.style.color = '#888';
                btn.style.borderBottomColor = 'transparent';
                btn.style.background = 'none';
            }
        });

        // 显示对应的内容面板
        Object.entries(this.tabContents).forEach(([key, panel]) => {
            const shouldShow = key === tabId;
            panel.style.display = shouldShow ? 'flex' : 'none';
            
            if (shouldShow) {
                // Debug panel state information removed during cleanup
                
                // 深度检查约束和修饰容器在每个标签页的状态
                setTimeout(() => {
                    
                    // 查找约束容器
                    const constraintSection = panel.querySelector('.constraint-prompts-section');
                    const constraintContainer = panel.querySelector('.constraint-prompts-container');
                    //     sectionExists: !!constraintSection,
                    //     containerExists: !!constraintContainer,
                    //     sectionDisplay: constraintSection ? window.getComputedStyle(constraintSection).display : 'N/A',
                    //     containerDisplay: constraintContainer ? window.getComputedStyle(constraintContainer).display : 'N/A',
                    //     containerChildren: constraintContainer ? constraintContainer.children.length : 0,
                    //     sectionOffsetHeight: constraintSection ? constraintSection.offsetHeight : 0,
                    //     containerOffsetHeight: constraintContainer ? constraintContainer.offsetHeight : 0
                    // });
                    
                    // 查找修饰容器
                    const decorativeSection = panel.querySelector('.decorative-prompts-section');
                    const decorativeContainer = panel.querySelector('.decorative-prompts-container');
                    //     sectionExists: !!decorativeSection,
                    //     containerExists: !!decorativeContainer,
                    //     sectionDisplay: decorativeSection ? window.getComputedStyle(decorativeSection).display : 'N/A',
                    //     containerDisplay: decorativeContainer ? window.getComputedStyle(decorativeContainer).display : 'N/A',
                    //     containerChildren: decorativeContainer ? decorativeContainer.children.length : 0,
                    //     sectionOffsetHeight: decorativeSection ? decorativeSection.offsetHeight : 0,
                    //     containerOffsetHeight: decorativeContainer ? decorativeContainer.offsetHeight : 0
                    // });
                    
                    //     globalConstraintSame: this.constraintContainer === constraintContainer,
                    //     globalDecorativeSame: this.decorativeContainer === decorativeContainer,
                    //     globalConstraintInThisTab: panel.contains(this.constraintContainer),
                    //     globalDecorativeInThisTab: panel.contains(this.decorativeContainer)
                    // });
                }, 100);
            }
        });

        this.currentCategory = tabId;
        this.currentEditMode = KSP_NS.constants.OPERATION_CATEGORIES[tabId].name.replace(/^\W+\s/, '');
        
        const currentPanel = this.tabContents[tabId];
        if (currentPanel) {
            const newConstraintContainer = currentPanel.querySelector('.constraint-prompts-container');
            const newDecorativeContainer = currentPanel.querySelector('.decorative-prompts-container');
            
            if (newConstraintContainer) {
                this.constraintContainer = newConstraintContainer;
            }
            
            if (newDecorativeContainer) {
                this.decorativeContainer = newDecorativeContainer;
            }
            
            // 标签页切换后，根据新的操作类型重新加载提示词选项
            setTimeout(() => {
                if (this.constraintContainer && this.decorativeContainer && this.currentOperationType) {
                    this.loadDefaultPrompts();
                }
            }, 150); // 延迟更长一些，确保操作类型已经设置
        }
        
        // 设置每个标签页的默认操作类型
        const defaultOperations = {
            'local': 'change_color',
            'global': 'global_color_grade', 
            'text': 'text_add',
            'professional': 'geometric_warp',
            'api': 'api_enhance',
            'ollama': 'ollama_enhance'
        };
        
        // 在API和Ollama模式下，清除任何可能导致模板生成的操作类型
        if (tabId === 'api' || tabId === 'ollama') {
            // API和Ollama模式专用操作类型，不会触发模板生成
            this.currentOperationType = defaultOperations[tabId] || '';
            // 额外保护：如果操作类型可能触发模板，立即清除
            if (this.currentOperationType && this.currentOperationType.includes('change_color')) {
                console.warn('[Kontext Super Prompt] API/Ollama模式下检测到模板操作类型，已清除');
                this.currentOperationType = tabId === 'api' ? 'api_enhance' : 'ollama_enhance';
            }
        } else {
            this.currentOperationType = defaultOperations[tabId] || '';
        }
        
        // 延迟执行确保DOM完全更新
        setTimeout(() => {
            this.updateOperationButtons();
            
            // 自动生成已移除
            if (this.currentOperationType) {
            }
        }, 100);
        
        this.updatePromptContainers();
    }

    selectOperationType(operationType) {
        this.currentOperationType = operationType;
        this.updateOperationButtons();
        
        // 重新加载对应操作类型的提示词选项（不自动选中）
        if (this.constraintContainer && this.decorativeContainer) {
            this.loadDefaultPrompts();
        }
        
        this.notifyNodeUpdate();
    }

    updateOperationButtons() {
        const selects = this.editorContainer.querySelectorAll('.operation-select');
        selects.forEach(select => {
            // 查找当前操作类型是否在这个下拉框中
            const option = select.querySelector(`option[value="${this.currentOperationType}"]`);
            if (option) {
                select.value = this.currentOperationType;
                select.style.borderColor = '#9C27B0';
                select.style.background = '#444';
            } else {
                select.value = '';
                select.style.borderColor = '#555';
                select.style.background = '#333';
            }
        });
    }

    autoAddConstraints() {
        
        let constraints;
        if (!this.currentOperationType || this.currentOperationType === '') {
            // 如果没有选择操作类型，使用通用约束提示词
            constraints = KSP_NS.constants.CONSTRAINT_PROMPTS.general || ['natural appearance', 'technical precision', 'visual coherence', 'quality control'];
        } else {
            constraints = KSP_NS.constants.CONSTRAINT_PROMPTS[this.currentOperationType] || KSP_NS.constants.CONSTRAINT_PROMPTS.general || ['natural appearance', 'technical precision', 'visual coherence', 'quality control'];
        }
        
        this.updateConstraintContainer(constraints);
    }

    autoAddDecoratives() {
        
        let decoratives;
        if (!this.currentOperationType || this.currentOperationType === '') {
            // 如果没有选择操作类型，使用通用修饰提示词
            decoratives = KSP_NS.constants.DECORATIVE_PROMPTS.general || ['enhanced quality', 'improved visual impact', 'professional finish', 'artistic excellence'];
        } else {
            decoratives = KSP_NS.constants.DECORATIVE_PROMPTS[this.currentOperationType] || KSP_NS.constants.DECORATIVE_PROMPTS.general || ['enhanced quality', 'improved visual impact', 'professional finish', 'artistic excellence'];
        }
        
        this.updateDecorativeContainer(decoratives);
    }

    loadDefaultPrompts() {
        // 如果正在生成提示词，跳过重新加载以避免清空选择状态
        if (this.isGeneratingPrompt) {
            return;
        }
        
        
        // 根据当前操作类型加载相应的约束性提示词（不自动选中）
        let constraints;
        if (!this.currentOperationType) {
            constraints = KSP_NS.constants.CONSTRAINT_PROMPTS.general || ['natural appearance', 'technical precision', 'visual coherence', 'quality control'];
        } else {
            constraints = KSP_NS.constants.CONSTRAINT_PROMPTS[this.currentOperationType] || KSP_NS.constants.CONSTRAINT_PROMPTS.general || ['natural appearance', 'technical precision', 'visual coherence', 'quality control'];
        }
        this.updateConstraintContainer(constraints, false); // false表示不自动选中
        
        // 根据当前操作类型加载相应的修饰性提示词（不自动选中）
        let decoratives;
        if (!this.currentOperationType) {
            decoratives = KSP_NS.constants.DECORATIVE_PROMPTS.general || ['enhanced quality', 'improved visual impact', 'professional finish', 'artistic excellence'];
        } else {
            decoratives = KSP_NS.constants.DECORATIVE_PROMPTS[this.currentOperationType] || KSP_NS.constants.DECORATIVE_PROMPTS.general || ['enhanced quality', 'improved visual impact', 'professional finish', 'artistic excellence'];
        }
        this.updateDecorativeContainer(decoratives, false); // false表示不自动选中
        
    }

    updateConstraintContainer(constraints, autoSelect = true) {
        
        // 保存现有的选择状态
        const previousSelections = new Set(this.selectedConstraints || []);
        
        this.constraintContainer.innerHTML = '';
        
        const containerStyle = window.getComputedStyle(this.constraintContainer);
        
        if (!constraints || !Array.isArray(constraints)) {
            console.error('[Kontext Super Prompt] 约束提示词数据无效:', constraints);
            return;
        }
        
        
        constraints.forEach(constraint => {
            const label = document.createElement('label');
            label.style.cssText = `
                display: flex;
                align-items: center;
                cursor: pointer;
                font-size: 11px;
                color: #ccc;
                padding: 2px 0;
            `;

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.style.cssText = `
                margin-right: 6px;
                accent-color: #4CAF50;
            `;

            // 恢复之前的选择状态，如果存在的话
            if (previousSelections.has(constraint)) {
                checkbox.checked = true;
            } else if (autoSelect && this.autoGenerate) {
                checkbox.checked = true;
            }

            checkbox.addEventListener('change', () => {
                this.updateSelectedConstraints();
            });

            const text = document.createElement('span');
            text.textContent = constraint;
            text.style.cssText = `
                line-height: 1.2;
            `;

            label.appendChild(checkbox);
            label.appendChild(text);
            this.constraintContainer.appendChild(label);
            
            //     offsetWidth: label.offsetWidth,
            //     offsetHeight: label.offsetHeight,
            //     isConnected: label.isConnected,
            //     display: window.getComputedStyle(label).display,
            //     visibility: window.getComputedStyle(label).visibility
            // });
        });
        
        //     childElementCount: this.constraintContainer.childElementCount,
        //     scrollHeight: this.constraintContainer.scrollHeight,
        //     offsetHeight: this.constraintContainer.offsetHeight
        // });

        this.updateSelectedConstraints();
    }

    updateDecorativeContainer(decoratives, autoSelect = true) {
        
        // 保存现有的选择状态
        const previousSelections = new Set(this.selectedDecoratives || []);
        
        this.decorativeContainer.innerHTML = '';
        
        //     isConnected: this.decorativeContainer.isConnected,
        //     parentElement: this.decorativeContainer.parentElement,
        //     offsetWidth: this.decorativeContainer.offsetWidth,
        //     offsetHeight: this.decorativeContainer.offsetHeight,
        //     computedStyle: window.getComputedStyle(this.decorativeContainer).display,
        //     visibility: window.getComputedStyle(this.decorativeContainer).visibility
        // });
        
        if (!decoratives || !Array.isArray(decoratives)) {
            console.error('[Kontext Super Prompt] 修饰提示词数据无效:', decoratives);
            return;
        }
        
        
        decoratives.forEach(decorative => {
            const label = document.createElement('label');
            label.style.cssText = `
                display: flex;
                align-items: center;
                cursor: pointer;
                font-size: 11px;
                color: #ccc;
                padding: 2px 0;
            `;

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.style.cssText = `
                margin-right: 6px;
                accent-color: #9C27B0;
            `;

            // 恢复之前的选择状态，如果存在的话
            if (previousSelections.has(decorative)) {
                checkbox.checked = true;
            } else if (autoSelect && this.autoGenerate) {
                checkbox.checked = true;
            }

            checkbox.addEventListener('change', () => {
                this.updateSelectedDecoratives();
            });

            const text = document.createElement('span');
            text.textContent = decorative;
            text.style.cssText = `
                line-height: 1.2;
            `;

            label.appendChild(checkbox);
            label.appendChild(text);
            this.decorativeContainer.appendChild(label);
            
            //     offsetWidth: label.offsetWidth,
            //     offsetHeight: label.offsetHeight,
            //     isConnected: label.isConnected,
            //     display: window.getComputedStyle(label).display,
            //     visibility: window.getComputedStyle(label).visibility
            // });
        });
        
        //     childElementCount: this.decorativeContainer.childElementCount,
        //     scrollHeight: this.decorativeContainer.scrollHeight,
        //     offsetHeight: this.decorativeContainer.offsetHeight
        // });

        this.updateSelectedDecoratives();
    }

    updateSelectedConstraints() {
        const checkboxes = this.constraintContainer.querySelectorAll('input[type="checkbox"]:checked');
        this.selectedConstraints = Array.from(checkboxes).map(cb => 
            cb.nextElementSibling.textContent
        );
        this.notifyNodeUpdate();
    }

    updateSelectedDecoratives() {
        const checkboxes = this.decorativeContainer.querySelectorAll('input[type="checkbox"]:checked');
        this.selectedDecoratives = Array.from(checkboxes).map(cb => 
            cb.nextElementSibling.textContent
        );
        this.notifyNodeUpdate();
    }
    
    forceUpdateSelections() {
        
        // 强制更新描述字段 - 从当前活动面板读取
        const panelClassMap = {
            '局部编辑': 'local-edit-panel',
            '全局编辑': 'global-edit-panel', 
            '文字编辑': 'text-edit-panel',
            '专业操作': 'professional-edit-panel'
        };
        const panelClass = panelClassMap[this.currentEditMode];
        const currentPanel = document.querySelector(`.${panelClass}`);
        
        if (currentPanel) {
            const descriptionTextarea = currentPanel.querySelector('textarea[placeholder*="描述"]');
            if (descriptionTextarea) {
                const currentDescription = descriptionTextarea.value;
                this.description = currentDescription;
            } else {
                console.warn("[Kontext Super Prompt] 未找到描述输入框");
            }
            
            // 强制更新操作类型 - 从当前活动面板读取下拉框选中的操作类型
            const operationSelect = currentPanel.querySelector('.operation-select');
            if (operationSelect && operationSelect.value) {
                const currentOperationType = operationSelect.value;
                this.currentOperationType = currentOperationType;
            } else {
            }
        } else {
            console.warn(`[Kontext Super Prompt] 未找到当前面板: ${panelClass}`);
        }
        
        // 强制更新约束提示词选择
        if (this.constraintContainer) {
            const constraintCheckboxes = this.constraintContainer.querySelectorAll('input[type="checkbox"]:checked');
            const newConstraints = Array.from(constraintCheckboxes).map(cb => cb.nextElementSibling.textContent);
            this.selectedConstraints = newConstraints;
        } else {
            console.warn("[Kontext Super Prompt] 约束容器不存在");
        }
        
        // 强制更新修饰提示词选择  
        if (this.decorativeContainer) {
            const decorativeCheckboxes = this.decorativeContainer.querySelectorAll('input[type="checkbox"]:checked');
            const newDecoratives = Array.from(decorativeCheckboxes).map(cb => cb.nextElementSibling.textContent);
            this.selectedDecoratives = newDecoratives;
        } else {
            console.warn("[Kontext Super Prompt] 修饰容器不存在");
        }
    }

    updatePromptContainers() {
        // 清空约束和修饰词容器
        if (this.constraintContainer) {
            this.constraintContainer.innerHTML = '';
        }
        if (this.decorativeContainer) {
            this.decorativeContainer.innerHTML = '';
        }
    }

    setupEventListeners() {
        // 自动生成开关（已移除，保留代码以防错误）
        if (this.autoGenCheckbox) {
            this.autoGenCheckbox.addEventListener('change', (e) => {
                this.autoGenerate = e.target.checked;
                this.notifyNodeUpdate();
            });
        }

        // 描述输入事件监听已移到createDescriptionSection中，确保每个面板的输入框都有监听
        
        // 结束性能监控
        KSP_NS.performance.endTimer(`node_${this.node.id}_init`);
    }

    updateLayerInfo(layerInfo) {
        
        // 递归防护：防止updateLayerInfo和tryGetLayerInfoFromConnectedNode之间的无限递归
        if (this._updateLayerInfoInProgress) {
            return;
        }
        
        if (!layerInfo) {
            console.warn("[Kontext Super Prompt] layerInfo为空，尝试主动获取");
            // 设置递归防护标志
            this._updateLayerInfoInProgress = true;
            try {
                this.tryGetLayerInfoFromConnectedNode();
            } finally {
                // 确保无论成功失败都重置标志
                this._updateLayerInfoInProgress = false;
            }
            return;
        }
        
        this.layerInfo = layerInfo;
        //     layers: layerInfo.layers?.length || 0,
        //     canvasSize: layerInfo.canvas_size,
        //     transformData: layerInfo.transform_data ? Object.keys(layerInfo.transform_data).length : 0
        // });
        
        // 使用防抖动批量渲染
        this.scheduleRender();
    }

    scheduleRender() {
        // 直接同步渲染，确保画布立即显示
        try {
            this.renderLayerList();
            this.updateLayerCountDisplay();
        } catch (error) {
            console.error('[Kontext Super Prompt] 渲染失败:', error);
        }
    }

    batchRender() {
        // 简化为直接调用渲染
        this.scheduleRender();
    }

    tryGetLayerInfoFromConnectedNode() {
        
        if (!this.node.inputs || !this.node.inputs[0] || !this.node.inputs[0].link) {
            return;
        }

        const link = app.graph.links[this.node.inputs[0].link];
        if (!link) return;

        const sourceNode = app.graph.getNodeById(link.origin_id);
        if (!sourceNode) return;


        // 直接从LRPG Canvas节点获取实时图层数据
        if (sourceNode.type === "LRPGCanvas") {
            
            let layerInfo = null;
            
            // 方式1: 从LRPG Canvas节点的canvasInstance属性获取
            if (sourceNode.canvasInstance && sourceNode.canvasInstance.canvas) {
                const fabricCanvas = sourceNode.canvasInstance.canvas;
                
                // 直接从Fabric.js画布提取图层数据
                layerInfo = this.extractLayerInfoFromFabricCanvas(fabricCanvas);
                if (layerInfo && layerInfo.layers && layerInfo.layers.length > 0) {
                }
            }
            
            // 方式1备用: 从DOM元素获取LRPG Canvas实例
            if (!layerInfo && sourceNode.canvasElement) {
                const canvasElement = sourceNode.canvasElement.querySelector('canvas');
                if (canvasElement && canvasElement.__fabric) {
                    const fabricCanvas = canvasElement.__fabric;
                    
                    // 直接从Fabric.js画布提取图层数据
                    layerInfo = this.extractLayerInfoFromFabricCanvas(fabricCanvas);
                }
            }
            
            // 方式2: 尝试从节点的自定义属性获取
            if (!layerInfo && sourceNode.lrpgCanvas) {
                if (sourceNode.lrpgCanvas.extractTransformData) {
                    const transformData = sourceNode.lrpgCanvas.extractTransformData();
                    layerInfo = this.buildLayerInfoFromTransformData(transformData, sourceNode);
                }
            }
            
            // 方式3: 从nodeData存储获取
            if (!layerInfo && window.PromptServer) {
                // 尝试获取已存储的画布数据
                fetch('/lrpg_canvas_get_data', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ node_id: sourceNode.id.toString() })
                }).then(response => response.json())
                .then(data => {
                    if (data && data.transform_data) {
                        const realLayerInfo = this.buildLayerInfoFromTransformData(data.transform_data, sourceNode);
                        if (realLayerInfo && realLayerInfo.layers && realLayerInfo.layers.length > 0) {
                            // 检查递归防护：只有在非递归状态下才调用updateLayerInfo
                            if (!this._updateLayerInfoInProgress) {
                                this.updateLayerInfo(realLayerInfo);
                            }
                        }
                    }
                }).catch(err => {
                });
            }
            
            // 如果还没有获取到，使用测试数据
            if (!layerInfo || !layerInfo.layers || layerInfo.layers.length === 0) {
                layerInfo = {
                    layers: [
                        {
                            id: "test_layer_1",
                            name: "测试图层 1 (等待真实数据)",
                            visible: true,
                            locked: false,
                            z_index: 0,
                            transform: {
                                name: "测试图层 1",
                                visible: true,
                                locked: false
                            }
                        }
                    ],
                    canvas_size: { width: 500, height: 500 },
                    transform_data: {
                        background: { width: 500, height: 500 }
                    }
                };
            }
            
            if (layerInfo) {
                // 检查递归防护：只有在非递归状态下才调用updateLayerInfo
                if (!this._updateLayerInfoInProgress) {
                    this.updateLayerInfo(layerInfo);
                }
            }
            
            this.setupLRPGCanvasListener(sourceNode);
        }
    }

    extractLayerInfoFromFabricCanvas(fabricCanvas) {
        // 防御性检查：确保是有效的Fabric.js实例且与其他插件兼容
        if (!fabricCanvas) {
            console.warn('[Kontext Super Prompt] Fabric.js canvas实例为空');
            return null;
        }
        
        // 检查Fabric.js对象的完整性，防止版本冲突
        if (!fabricCanvas.getObjects || typeof fabricCanvas.getObjects !== 'function') {
            console.warn('[Kontext Super Prompt] 无效的Fabric.js实例或版本不兼容');
            return null;
        }
        
        let objects;
        try {
            objects = fabricCanvas.getObjects();
        } catch (error) {
            console.warn('[Kontext Super Prompt] 获取Fabric.js对象失败:', error);
            return null;
        }
        
        if (!Array.isArray(objects)) {
            console.warn('[Kontext Super Prompt] Fabric.js返回的对象不是数组');
            return null;
        }
        
        const layers = [];
        
        objects.forEach((obj, index) => {
            const centerPoint = obj.getCenterPoint ? obj.getCenterPoint() : { x: obj.left, y: obj.top };
            
            // 生成图层类型的中文名称
            const getLayerTypeName = (type) => {
                const typeMap = {
                    'rect': '矩形',
                    'circle': '圆形',
                    'ellipse': '椭圆',
                    'triangle': '三角形',
                    'polygon': '多边形',
                    'line': '直线',
                    'path': '路径',
                    'image': '图片',
                    'i-text': '文字',
                    'text': '文本',
                    'textbox': '文本框',
                    'group': '组合'
                };
                return typeMap[type] || '图层';
            };
            
            // 生成缩略图
            const generateThumbnail = (obj) => {
                try {
                    // 创建临时画布用于生成缩略图
                    const tempCanvas = document.createElement('canvas');
                    tempCanvas.width = 64;
                    tempCanvas.height = 64;
                    const tempCtx = tempCanvas.getContext('2d');
                    
                    // 设置背景
                    tempCtx.fillStyle = '#f3f4f6';
                    tempCtx.fillRect(0, 0, 64, 64);
                    
                    // 保存当前状态
                    tempCtx.save();
                    
                    // 计算缩放比例
                    const objWidth = (obj.width * (obj.scaleX || 1)) || 100;
                    const objHeight = (obj.height * (obj.scaleY || 1)) || 100;
                    const scale = Math.min(48 / objWidth, 48 / objHeight, 1);
                    
                    // 移动到中心并缩放
                    tempCtx.translate(32, 32);
                    tempCtx.scale(scale, scale);
                    tempCtx.translate(-objWidth/2, -objHeight/2);
                    
                    if (obj.type === 'image' && obj._element) {
                        // 绘制图片缩略图
                        tempCtx.drawImage(obj._element, 0, 0, objWidth, objHeight);
                    } else if (obj.type === 'rect') {
                        // 绘制矩形缩略图
                        tempCtx.fillStyle = obj.fill || '#3b82f6';
                        tempCtx.strokeStyle = obj.stroke || '#1e40af';
                        tempCtx.lineWidth = (obj.strokeWidth || 1) * scale;
                        tempCtx.fillRect(0, 0, objWidth, objHeight);
                        if (obj.stroke) tempCtx.strokeRect(0, 0, objWidth, objHeight);
                    } else if (obj.type === 'circle') {
                        // 绘制圆形缩略图
                        const radius = objWidth / 2;
                        tempCtx.beginPath();
                        tempCtx.arc(radius, radius, radius, 0, 2 * Math.PI);
                        tempCtx.fillStyle = obj.fill || '#10b981';
                        tempCtx.fill();
                        if (obj.stroke) {
                            tempCtx.strokeStyle = obj.stroke || '#047857';
                            tempCtx.lineWidth = (obj.strokeWidth || 1) * scale;
                            tempCtx.stroke();
                        }
                    } else if (obj.type === 'i-text' || obj.type === 'text') {
                        // 绘制文字缩略图
                        tempCtx.fillStyle = obj.fill || '#374151';
                        tempCtx.font = `${Math.min(objHeight * 0.8, 20)}px Arial`;
                        tempCtx.textAlign = 'center';
                        tempCtx.textBaseline = 'middle';
                        const text = obj.text || 'Text';
                        tempCtx.fillText(text.length > 8 ? text.substring(0, 8) + '...' : text, objWidth/2, objHeight/2);
                    } else {
                        // 默认图层样式
                        tempCtx.fillStyle = '#e5e7eb';
                        tempCtx.strokeStyle = '#9ca3af';
                        tempCtx.lineWidth = 2;
                        tempCtx.fillRect(0, 0, objWidth, objHeight);
                        tempCtx.strokeRect(0, 0, objWidth, objHeight);
                        
                        // 添加图层图标
                        tempCtx.fillStyle = '#6b7280';
                        tempCtx.font = '16px Arial';
                        tempCtx.textAlign = 'center';
                        tempCtx.textBaseline = 'middle';
                        tempCtx.fillText('📄', objWidth/2, objHeight/2);
                    }
                    
                    tempCtx.restore();
                    return tempCanvas.toDataURL('image/png');
                } catch (error) {
                    console.warn('[Kontext Super Prompt] 生成缩略图失败:', error);
                    // 返回默认缩略图
                    const canvas = document.createElement('canvas');
                    canvas.width = 64;
                    canvas.height = 64;
                    const ctx = canvas.getContext('2d');
                    ctx.fillStyle = '#f3f4f6';
                    ctx.fillRect(0, 0, 64, 64);
                    ctx.fillStyle = '#9ca3af';
                    ctx.font = '32px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('?', 32, 32);
                    return canvas.toDataURL('image/png');
                }
            };
            
            const layerTypeName = getLayerTypeName(obj.type);
            const layerName = obj.name || `${layerTypeName} ${index + 1}`;
            const thumbnail = generateThumbnail(obj);
            
            layers.push({
                id: `fabric_obj_${index}`,
                name: layerName,
                type: layerTypeName,
                visible: obj.visible !== false,
                locked: obj.selectable === false,
                z_index: index,
                thumbnail: thumbnail,
                transform: {
                    type: obj.type || 'object',
                    centerX: centerPoint.x,
                    centerY: centerPoint.y,
                    scaleX: obj.scaleX || 1,
                    scaleY: obj.scaleY || 1,
                    angle: obj.angle || 0,
                    width: obj.width || 100,
                    height: obj.height || 100,
                    flipX: obj.flipX || false,
                    flipY: obj.flipY || false,
                    visible: obj.visible !== false,
                    locked: obj.selectable === false,
                    name: layerName,
                    // 额外的样式信息
                    fill: obj.fill,
                    stroke: obj.stroke,
                    strokeWidth: obj.strokeWidth,
                    opacity: obj.opacity || 1
                }
            });
        });
        
        return {
            layers: layers,
            canvas_size: {
                width: fabricCanvas.width || 500,
                height: fabricCanvas.height || 500
            },
            transform_data: {
                background: {
                    width: fabricCanvas.width || 500,
                    height: fabricCanvas.height || 500
                }
            }
        };
    }

    setupLRPGCanvasListener(sourceNode) {
        // 清理旧的定时器防止泄漏
        if (this.layerCheckInterval) {
            clearInterval(this.layerCheckInterval);
        }
        
        // 监听画布变化事件
        const checkForUpdates = () => {
            this.checkForLayerUpdates(sourceNode);
        };
        
        // 使用管理方法添加定时器，防止内存泄漏
        this.layerCheckInterval = this.addIntervalManaged(checkForUpdates, 1000);
        
        // 使用管理方法添加API监听器，防止堆积
        const executedHandler = (event) => {
            if (event.detail && event.detail.node === sourceNode.id.toString()) {
                this.addTimeoutManaged(() => {
                    this.tryGetLayerInfoFromConnectedNode();
                }, 500);
            }
        };
        this.addAPIEventListenerManaged('executed', executedHandler);
    }

    buildLayerInfoFromTransformData(transformData, sourceNode) {
        if (!transformData) return null;

        const layers = [];
        let canvasSize = { width: 512, height: 512 };

        // 提取背景信息
        if (transformData.background) {
            canvasSize = {
                width: transformData.background.width || 512,
                height: transformData.background.height || 512
            };
        }

        // 提取图层信息
        Object.entries(transformData).forEach(([key, data], index) => {
            if (key !== 'background' && data && typeof data === 'object') {
                layers.push({
                    id: key,
                    transform: data,
                    visible: data.visible !== false,
                    locked: data.locked === true,
                    z_index: data.z_index || index,
                    name: data.name || `图层 ${index + 1}`
                });
            }
        });

        const layerInfo = {
            layers: layers,
            canvas_size: canvasSize,
            transform_data: transformData
        };

        return layerInfo;
    }

    checkForLayerUpdates(sourceNode) {
        if (!sourceNode || sourceNode.type !== "LRPGCanvas") return;

        try {
            let currentTransformData = null;
            let layerInfo = null;

            // 方式1: 直接从LRPG Canvas节点的canvasInstance获取最新数据
            if (sourceNode.canvasInstance && sourceNode.canvasInstance.canvas) {
                const fabricCanvas = sourceNode.canvasInstance.canvas;
                layerInfo = this.extractLayerInfoFromFabricCanvas(fabricCanvas);
                
                if (layerInfo && layerInfo.layers && layerInfo.layers.length > 0) {
                    const currentHash = JSON.stringify(layerInfo.layers);
                    
                    if (this.lastTransformHash !== currentHash) {
                        this.lastTransformHash = currentHash;
                        this.updateLayerInfo(layerInfo);
                        return;
                    }
                }
            }
            
            // 方式1备用: 从DOM元素获取Fabric.js画布
            if (!layerInfo && sourceNode.canvasElement) {
                const canvasElement = sourceNode.canvasElement.querySelector('canvas');
                if (canvasElement && canvasElement.__fabric) {
                    const fabricCanvas = canvasElement.__fabric;
                    layerInfo = this.extractLayerInfoFromFabricCanvas(fabricCanvas);
                    
                    if (layerInfo && layerInfo.layers && layerInfo.layers.length > 0) {
                        const currentHash = JSON.stringify(layerInfo.layers);
                        
                        if (this.lastTransformHash !== currentHash) {
                            this.lastTransformHash = currentHash;
                            this.updateLayerInfo(layerInfo);
                            return;
                        }
                    }
                }
            }

            // 方式2: 从节点属性获取
            if (sourceNode.lrpgCanvas && sourceNode.lrpgCanvas.extractTransformData) {
                currentTransformData = sourceNode.lrpgCanvas.extractTransformData();
                const currentHash = JSON.stringify(currentTransformData);
                
                if (this.lastTransformHash !== currentHash) {
                    this.lastTransformHash = currentHash;
                    
                    layerInfo = this.buildLayerInfoFromTransformData(currentTransformData, sourceNode);
                    if (layerInfo) {
                        this.updateLayerInfo(layerInfo);
                    }
                }
            }
        } catch (e) {
            console.warn("[Kontext Super Prompt] 检查图层更新时出错:", e);
        }
    }

    renderLayerList() {
        if (!this.layerInfo || !this.layerInfo.layers) {
            this.layerList.innerHTML = `
                <div style="color: #666; text-align: center; padding: 20px; font-size: 12px;">
                    暂无图层信息<br>请连接 🎨 LRPG Canvas 节点
                </div>
            `;
            return;
        }

        // 批量DOM操作优化
        const fragment = document.createDocumentFragment();
        const layers = this.layerInfo.layers;
        
        // 对于大量图层使用分批渲染
        if (layers.length > 50) {
            this.renderLayersInBatches(layers, fragment);
        } else {
            // 小量图层直接渲染
            layers.forEach((layer, index) => {
                const layerItem = this.createLayerItem(layer, index);
                fragment.appendChild(layerItem);
            });
        }
        
        // 一次性更新DOM
        this.layerList.innerHTML = '';
        this.layerList.appendChild(fragment);
    }

    renderLayersInBatches(layers, fragment) {
        const batchSize = 10; // 每批处理10个图层
        let currentIndex = 0;
        
        const renderBatch = () => {
            const endIndex = Math.min(currentIndex + batchSize, layers.length);
            
            for (let i = currentIndex; i < endIndex; i++) {
                const layerItem = this.createLayerItem(layers[i], i);
                fragment.appendChild(layerItem);
            }
            
            currentIndex = endIndex;
            
            // 如果还有更多图层需要渲染，使用requestAnimationFrame继续
            if (currentIndex < layers.length) {
                requestAnimationFrame(renderBatch);
            }
        };
        
        renderBatch();
    }

    createLayerItem(layer, index) {
        const item = document.createElement('div');
        item.className = 'layer-item';
        item.style.cssText = `
            display: flex;
            align-items: center;
            padding: 8px;
            background: #2a2a2a;
            border: 1px solid #444;
            border-radius: 4px;
            margin-bottom: 4px;
            cursor: pointer;
            transition: all 0.2s;
        `;

        // 选择框
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.style.cssText = `
            margin-right: 8px;
            accent-color: #9C27B0;
        `;

        // 缩略图
        const thumbnail = document.createElement('div');
        thumbnail.style.cssText = `
            width: 32px;
            height: 32px;
            background: #333;
            border: 1px solid #555;
            border-radius: 3px;
            margin-right: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #888;
            font-size: 10px;
        `;

        if (layer.thumbnail) {
            const img = document.createElement('img');
            img.src = layer.thumbnail;
            img.style.cssText = `
                width: 100%;
                height: 100%;
                object-fit: cover;
                border-radius: 2px;
            `;
            thumbnail.appendChild(img);
        } else {
            // 根据图层类型显示不同的图标
            const typeIcons = {
                '矩形': '⬜',
                '圆形': '⭕',
                '椭圆': '🟢', 
                '三角形': '🔺',
                '直线': '📏',
                '图片': '🖼️',
                '文字': '📝',
                '文本': '📝',
                '文本框': '📄',
                '组合': '📂'
            };
            thumbnail.textContent = typeIcons[layer.type] || '📄';
        }

        // 图层信息
        const info = document.createElement('div');
        info.style.cssText = `
            flex: 1;
            min-width: 0;
        `;

        const name = document.createElement('div');
        name.style.cssText = `
            color: #fff;
            font-size: 11px;
            font-weight: bold;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        `;
        name.textContent = layer.name || `图层 ${index + 1}`;

        const details = document.createElement('div');
        details.style.cssText = `
            color: #888;
            font-size: 9px;
        `;
        const typeText = layer.type ? `${layer.type} | ` : '';
        details.textContent = `${typeText}Z:${layer.z_index || index} | ${layer.visible ? '👁️' : '👁️‍🗨️'} | ${layer.locked ? '🔒' : '🔓'}`;

        info.appendChild(name);
        info.appendChild(details);

        item.appendChild(checkbox);
        item.appendChild(thumbnail);
        item.appendChild(info);

        // 点击事件
        item.addEventListener('click', (e) => {
            if (e.target !== checkbox) {
                checkbox.checked = !checkbox.checked;
            }
            this.updateSelectedLayers();
            this.updateItemAppearance(item, checkbox.checked);
        });

        checkbox.addEventListener('change', () => {
            this.updateSelectedLayers();
            this.updateItemAppearance(item, checkbox.checked);
        });

        return item;
    }

    updateItemAppearance(item, selected) {
        if (selected) {
            item.style.background = '#3a2a4a';
            item.style.borderColor = '#9C27B0';
        } else {
            item.style.background = '#2a2a2a';
            item.style.borderColor = '#444';
        }
    }

    updateSelectedLayers() {
        const checkboxes = this.layerList.querySelectorAll('input[type="checkbox"]');
        this.selectedLayers = [];
        
        checkboxes.forEach((checkbox, index) => {
            if (checkbox.checked && this.layerInfo?.layers[index]) {
                this.selectedLayers.push({
                    index: index,
                    layer: this.layerInfo.layers[index]
                });
            }
        });

        this.updateLayerCountDisplay();
        this.notifyNodeUpdate();
    }

    updateLayerCountDisplay() {
        // 图层计数显示已移除，此函数保留为空以防止错误
        if (this.layerCountDisplay) {
            const total = this.layerInfo?.layers?.length || 0;
            const selected = this.selectedLayers.length;
            this.layerCountDisplay.textContent = `已选择 ${selected}/${total} 图层`;
        }
    }

    toggleSelectAll() {
        const checkboxes = this.layerList.querySelectorAll('input[type="checkbox"]');
        const allSelected = Array.from(checkboxes).every(cb => cb.checked);
        
        checkboxes.forEach((checkbox, index) => {
            checkbox.checked = !allSelected;
            const item = checkbox.closest('.layer-item');
            this.updateItemAppearance(item, checkbox.checked);
        });
        
        this.updateSelectedLayers();
    }

    refreshLayerInfo() {
        
        // 显示加载状态
        this.layerList.innerHTML = `
            <div style="color: #888; text-align: center; padding: 20px; font-size: 11px; line-height: 1.4;">
                <div style="margin-bottom: 8px;">🔄 正在刷新图层信息...</div>
            </div>
        `;
        
        if (this.layerCheckInterval) {
            clearInterval(this.layerCheckInterval);
            this.layerCheckInterval = null;
        }
        
        // 重新获取数据
        this.tryGetLayerInfoFromConnectedNode();
        
        // 如果还是没有数据，显示详细提示信息
        setTimeout(() => {
            if (!this.layerInfo || !this.layerInfo.layers || this.layerInfo.layers.length === 0) {
                this.layerList.innerHTML = `
                    <div style="color: #888; text-align: center; padding: 20px; font-size: 11px; line-height: 1.4;">
                        <div style="margin-bottom: 8px;">⚠️ 未检测到图层信息</div>
                        <div style="font-size: 10px; color: #666; margin-bottom: 12px;">
                            请检查以下几点：<br>
                            • 是否已连接 🎨 LRPG Canvas 节点<br>
                            • 画布中是否有图层对象<br>
                            • 尝试点击刷新按钮重新获取
                        </div>
                        <button onclick="this.closest('.kontext-super-prompt-container').querySelector('.kontext-super-prompt').refreshLayerInfo()" 
                                style="padding: 6px 12px; background: #4CAF50; color: white; border: none; border-radius: 4px; font-size: 11px; cursor: pointer;">
                            🔄 重新获取
                        </button>
                        <div style="margin-top: 8px; font-size: 9px; color: #555;">
                            调试信息请查看浏览器控制台
                        </div>
                    </div>
                `;
            }
        }, 2000);
    }

    generateSuperPrompt() {
        
        // 检查当前选项卡模式 - API和Ollama模式完全独立，不受模板影响
        if (this.currentCategory === 'api') {
            // API模式：完全独立，不使用任何模板
            this.generateWithAPI();
            return;
        } else if (this.currentCategory === 'ollama') {
            // Ollama模式：完全独立，不使用任何模板
            this.generateWithOllama();
            return;
        }
        
        // 首先强制更新选择状态，确保与UI一致
        this.forceUpdateSelections();
        
        
        // 设置标志位，防止在生成期间重新加载提示词
        this.isGeneratingPrompt = true;
        
        // 收集所有数据，将中文提示词转换为英文
        const constraintPromptsEnglish = translatePromptsToEnglish(this.selectedConstraints || []);
        const decorativePromptsEnglish = translatePromptsToEnglish(this.selectedDecoratives || []);
        
        // 生成综合提示词
        let generatedPromptParts = [];
        
        
        // 添加操作类型模板（如果有模板，则使用模板并集成描述；否则只使用描述）
        if (this.currentOperationType && KSP_NS.constants.OPERATION_TEMPLATES[this.currentOperationType]) {
            const template = KSP_NS.constants.OPERATION_TEMPLATES[this.currentOperationType];
            
            if (template.template) {
                // 如果有描述，将其整合到模板中
                if (this.description && this.description.trim()) {
                    let processedTemplate = template.template
                        .replace('{object}', 'selected area')
                        .replace('{target}', this.description.trim());
                    generatedPromptParts.push(processedTemplate);
                } else {
                    // 如果没有描述，使用默认值
                    let defaultTemplate = template.template
                        .replace('{object}', 'selected area')
                        .replace('{target}', 'desired effect');
                    generatedPromptParts.push(defaultTemplate);
                }
            }
        } else if (this.description && this.description.trim()) {
            // 如果没有模板但有描述，直接添加描述
            generatedPromptParts.push(this.description.trim());
        } else {
        }
        
        // 添加修饰性提示词
        if (decorativePromptsEnglish.length > 0) {
            generatedPromptParts.push(...decorativePromptsEnglish);
        } else {
        }
        
        // 添加约束性提示词
        if (constraintPromptsEnglish.length > 0) {
            generatedPromptParts.push(...constraintPromptsEnglish);
        } else {
        }
        
        // 生成最终提示词
        this.generatedPrompt = generatedPromptParts.join(', ');
        
        
        // 如果没有生成任何内容，提供一个默认提示
        if (!this.generatedPrompt || this.generatedPrompt.trim() === '') {
            this.generatedPrompt = 'Please describe the changes you want to make or select some options above';
        }
        
        this.updateAllPreviewTextareas();
        
        const promptData = {
            edit_mode: this.currentEditMode,
            operation_type: this.currentOperationType,
            description: this.description,
            constraint_prompts: constraintPromptsEnglish.join('\n'),
            decorative_prompts: decorativePromptsEnglish.join('\n'),
            selected_layers: JSON.stringify(this.selectedLayers),
            auto_generate: this.autoGenerate,
            generated_prompt: this.generatedPrompt
        };

        this.updateNodeWidgets(promptData);
        
        // 强制触发节点序列化，确保数据传递到后端
        if (this.node.serialize) {
            const serializedData = this.node.serialize();
        }
        
        // 通知节点图更新
        if (this.node.graph) {
            this.node.graph.change();
        }
        
        this.isGeneratingPrompt = false;
        
        // 通知生成完成
        this.showNotification("超级提示词已生成！", "success");
    }

    updateNodeWidgets(data) {
        // 创建或更新隐藏的widget来传递数据给后端
        this.createHiddenWidgets(data);
        
        // 将数据存储到节点属性中，供serialize方法使用
        this.node._kontextData = data;
        
        this.notifyNodeUpdate();
    }
    
    createHiddenWidgets(data) {
        // 确保节点有widgets数组
        if (!this.node.widgets) {
            this.node.widgets = [];
        }
        
        // 定义要传递的数据字段
        const widgetFields = [
            { name: 'tab_mode', value: data.tab_mode || 'manual' },
            { name: 'edit_mode', value: data.edit_mode || '局部编辑' },
            { name: 'operation_type', value: data.operation_type || '' },
            { name: 'description', value: data.description || '' },
            { name: 'constraint_prompts', value: data.constraint_prompts || '' },
            { name: 'decorative_prompts', value: data.decorative_prompts || '' },
            { name: 'selected_layers', value: data.selected_layers || '' },
            { name: 'auto_generate', value: data.auto_generate !== false },
            { name: 'generated_prompt', value: data.generated_prompt || '' },
            // API参数
            { name: 'api_provider', value: data.api_provider || 'siliconflow' },
            { name: 'api_key', value: data.api_key || '' },
            { name: 'api_model', value: data.api_model || 'deepseek-ai/DeepSeek-V3' },
            { name: 'api_editing_intent', value: data.api_editing_intent || 'general_editing' },
            { name: 'api_processing_style', value: data.api_processing_style || 'auto_smart' },
            { name: 'api_seed', value: data.api_seed || 0 },
            { name: 'api_custom_guidance', value: data.api_custom_guidance || '' },
            // Ollama参数
            { name: 'ollama_url', value: data.ollama_url || 'http://127.0.0.1:11434' },
            { name: 'ollama_model', value: data.ollama_model || '' },
            { name: 'ollama_temperature', value: data.ollama_temperature || 0.7 },
            { name: 'ollama_editing_intent', value: data.ollama_editing_intent || 'general_editing' },
            { name: 'ollama_processing_style', value: data.ollama_processing_style || 'auto_smart' },
            { name: 'ollama_seed', value: data.ollama_seed || 42 },
            { name: 'ollama_custom_guidance', value: data.ollama_custom_guidance || '' },
            { name: 'ollama_enable_visual', value: data.ollama_enable_visual || false },
            { name: 'ollama_auto_unload', value: data.ollama_auto_unload || false }
        ];
        
        // 创建或更新widget
        widgetFields.forEach((field, index) => {
            if (!this.node.widgets[index]) {
                // 创建新的widget
                this.node.widgets[index] = {
                    name: field.name,
                    value: field.value,
                    type: typeof field.value === 'boolean' ? 'toggle' : 'text',
                    options: {},
                    callback: () => {}
                };
            } else {
                this.node.widgets[index].value = field.value;
            }
        });
        
    }

    generateWithAPI() {
        // 防止重复触发
        if (this.isGeneratingAPI) {
            return;
        }
        this.isGeneratingAPI = true;
        
        
        // 清除任何可能的旧状态
        this.description = '';  // 先清空缓存的description
        
        // 保存当前选项卡状态
        const currentTab = this.currentCategory;
        
        // 获取API配置
        const provider = this.apiConfig?.providerSelect?.value || 'siliconflow';
        const apiKey = this.apiConfig?.keyInput?.value || '';
        const model = this.apiConfig?.modelSelect?.value || 'deepseek-ai/DeepSeek-V3';
        const intent = this.apiConfig?.intentSelect?.value || 'general_editing';
        const style = this.apiConfig?.styleSelect?.value || 'auto_smart';
        
        // 每次生成前清空缓存，强制重新读取
        this.description = '';
        
        // 获取描述 - 优先从API面板的输入框读取
        let description = '';
        const apiDescTextarea = this.editorContainer.querySelector('.api-edit-panel .description-section textarea');
        
        if (apiDescTextarea && apiDescTextarea.value) {
            description = apiDescTextarea.value.trim();
        } else {
            // 如果API面板没有输入框，尝试其他选择器
            const descriptionInputs = [
                this.editorContainer.querySelector('.description-section textarea'),
                this.descriptionTextarea,
                this.descriptionInput
            ];
            
            for (const input of descriptionInputs) {
                if (input && input.value && typeof input.value === 'string') {
                    const trimmedValue = input.value.trim();
                    if (trimmedValue) {
                        description = trimmedValue;
                        break;
                    }
                }
            }
        }
        
        // 更新缓存
        this.description = description;
        
        
        // 检测并修复模板污染问题
        const templatePatterns = [
            /transform selected area color to\s+(.+)/,
            /transform \{object\} color to\s+(.+)/,
            /reimagine selected area in\s+(.+)\s+aesthetic/,
            /thoughtfully replace selected area with\s+(.+)/,
            /thoughtfully introduce\s+(.+)\s+to complement/,
            /seamlessly eliminate selected area/,
            /transform selected area surface to\s+(.+)\s+texture/
        ];
        
        for (const pattern of templatePatterns) {
            if (description && pattern.test(description)) {
                console.warn('[API] ⚠️ 检测到模板污染:', description);
                const matches = description.match(pattern);
                if (matches && matches[1]) {
                    description = matches[1].trim();
                } else if (description.includes('seamlessly eliminate')) {
                    // 特殊处理remove_object模板
                    description = '';
                }
                // 更新组件的description属性为清理后的值
                this.description = description;
                // 不要将清理后的值写回输入框，保持用户原始输入
                break;
            }
        }
        
        if (!apiKey) {
            alert('请输入API密钥');
            return;
        }
        
        // 设置生成中状态 - 添加时间戳确保用户看到新的生成过程
        const timestamp = new Date().toLocaleTimeString();
        this.generatedPrompt = `🔄 正在使用API生成提示词... (${timestamp})`;
        this.updateAllPreviewTextareas();
        
        // 设置标志位防止切换选项卡
        this.isUpdatingFromAPI = true;
        
        // 更新节点数据
        this.updateNodeWidgets({
            tab_mode: 'api',
            edit_mode: '远程API',  // 设置为API模式
            api_provider: provider,
            api_key: apiKey,
            api_model: model,
            api_editing_intent: intent,
            api_processing_style: style,
            api_seed: Math.floor(Math.random() * 1000000),
            api_custom_guidance: style === 'custom_guidance' ? (this.apiConfig?.guidanceTextarea?.value || '') : '',
            description: description,
            // 保持空的约束和修饰提示词，避免与手动模式混淆
            constraint_prompts: '',
            decorative_prompts: '',
            operation_type: 'api_enhance'
        });
        
        // 触发后端处理
        this.notifyNodeUpdate();
        
        // 确保保持在API选项卡
        setTimeout(() => {
            this.isUpdatingFromAPI = false;
            if (this.currentCategory !== currentTab) {
                this.switchTab(currentTab);
            }
        }, 100);
        
        // 等待后端处理结果
        this.waitForAPIResult(provider, model, description);
    }
    
    generateWithOllama() {
        // 防止重复触发
        if (this.isGeneratingOllama) {
            return;
        }
        this.isGeneratingOllama = true;
        
        
        // 保存当前选项卡状态
        const currentTab = this.currentCategory;
        
        // 获取Ollama配置
        const url = this.ollamaUrlInput?.value || 'http://127.0.0.1:11434';
        const model = this.ollamaModelSelect?.value || '';
        const temperature = parseFloat(this.ollamaTempInput?.value || '0.7');
        const intent = this.ollamaIntentSelect?.value || 'general_editing';
        const style = this.ollamaStyleSelect?.value || 'auto_smart';
        const enableVisual = this.ollamaVisualCheckbox?.checked || false;
        const autoUnload = this.ollamaUnloadCheckbox?.checked || false;
        
        // 获取描述 - 尝试多种选择器，优先使用当前DOM中的值
        let description = '';
        const descriptionInputs = [
            this.editorContainer.querySelector('.ollama-edit-panel .description-section textarea'),
            this.editorContainer.querySelector('.description-section textarea'),
            this.descriptionTextarea,
            this.descriptionInput
        ];
        
        // 优先从DOM查询获取最新值，避免使用缓存的旧值
        for (const input of descriptionInputs) {
            if (input && input.value && typeof input.value === 'string') {
                const trimmedValue = input.value.trim();
                if (trimmedValue) {
                    description = trimmedValue;
                    // 更新组件的description属性为最新值
                    this.description = description;
                    break;
                }
            }
        }
        
        // 如果DOM中没有找到，才使用缓存的值
        if (!description && this.description && this.description.trim()) {
            description = this.description.trim();
        }
        
        
        // 检测并修复模板污染问题（与API模式相同）
        const templatePatterns = [
            /transform selected area color to\s+(.+)/,
            /transform \{object\} color to\s+(.+)/,
            /reimagine selected area in\s+(.+)\s+aesthetic/,
            /thoughtfully replace selected area with\s+(.+)/,
            /thoughtfully introduce\s+(.+)\s+to complement/,
            /seamlessly eliminate selected area/,
            /transform selected area surface to\s+(.+)\s+texture/
        ];
        
        for (const pattern of templatePatterns) {
            if (description && pattern.test(description)) {
                console.warn('[Ollama] ⚠️ 检测到模板污染:', description);
                const matches = description.match(pattern);
                if (matches && matches[1]) {
                    description = matches[1].trim();
                } else if (description.includes('seamlessly eliminate')) {
                    // 特殊处理remove_object模板
                    description = '';
                }
                // 更新组件的description属性
                this.description = description;
                // 更新所有描述输入框
                this.updateAllDescriptionTextareas();
                break;
            }
        }
        
        if (!model) {
            alert('请选择Ollama模型');
            return;
        }
        
        // 设置生成中状态 - 添加时间戳确保用户看到新的生成过程  
        const timestamp = new Date().toLocaleTimeString();
        this.generatedPrompt = `🔄 正在使用Ollama生成提示词... (${timestamp})`;
        this.updateAllPreviewTextareas();
        
        // 设置标志位防止切换选项卡
        this.isUpdatingFromOllama = true;
        
        // 更新节点数据
        this.updateNodeWidgets({
            tab_mode: 'ollama',
            edit_mode: '本地Ollama',  // 设置为Ollama模式
            ollama_url: url,
            ollama_model: model,
            ollama_temperature: temperature,
            ollama_editing_intent: intent,
            ollama_processing_style: style,
            ollama_seed: Math.floor(Math.random() * 1000000),
            ollama_custom_guidance: style === 'custom_guidance' ? (this.ollamaGuidanceTextarea?.value || '') : '',
            ollama_enable_visual: enableVisual,
            ollama_auto_unload: autoUnload,
            description: description,
            // 保持空的约束和修饰提示词，避免与手动模式混淆
            constraint_prompts: '',
            decorative_prompts: '',
            operation_type: 'ollama_enhance'
        });
        
        // 触发后端处理
        this.notifyNodeUpdate();
        
        // 确保保持在Ollama选项卡
        setTimeout(() => {
            this.isUpdatingFromOllama = false;
            if (this.currentCategory !== currentTab) {
                this.switchTab(currentTab);
            }
        }, 100);
        
        // 等待后端处理结果
        this.waitForOllamaResult(model, description);
    }

    async waitForAPIResult(provider, model, description) {
        try {
            
            // 显示连接状态
            this.generatedPrompt = `🔄 正在连接 ${provider} (${model})...`;
            this.updateAllPreviewTextareas();
            
            // 获取API配置
            const apiKey = this.apiConfig?.keyInput?.value || '';
            const editingIntent = this.apiConfig?.intentSelect?.value || 'general_editing';
            const processingStyle = this.apiConfig?.styleSelect?.value || 'auto_smart';
            const customGuidance = this.apiConfig?.guidanceTextarea?.value || '';
            
            // 根据提供商构建API请求
            let apiUrl, headers, requestBody;
            
            if (provider === 'zhipu') {
                // 添加随机性确保每次生成不同结果
                const randomSeed = Math.floor(Math.random() * 1000000);
                const temperature = 0.7 + (Math.random() * 0.3); // 0.7-1.0之间的随机温度
                
                apiUrl = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
                headers = {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                };
                requestBody = {
                    model: model,
                    messages: [
                        {
                            role: 'user',
                            content: `Generate ONE single image editing prompt for: ${description}${customGuidance ? `\n\nAdditional guidance: ${customGuidance}` : ''}\n\nIMPORTANT: Output ONLY ONE prompt (not multiple variations). Make it unique and creative. Do not include any titles, numbers, or formatting - just the prompt text itself.`
                        }
                    ],
                    temperature: temperature,
                    max_tokens: 500,  // 确保有足够空间生成完整提示词
                    top_p: 0.95
                };
            } else if (provider === 'moonshot') {
                // 添加随机性确保每次生成不同结果
                const randomSeed = Math.floor(Math.random() * 1000000);
                const temperature = 0.7 + (Math.random() * 0.3); // 0.7-1.0之间的随机温度
                
                apiUrl = 'https://api.moonshot.cn/v1/chat/completions';
                headers = {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                };
                requestBody = {
                    model: model,
                    messages: [
                        {
                            role: 'user',
                            content: `Generate ONE single image editing prompt for: ${description}${customGuidance ? `\n\nAdditional guidance: ${customGuidance}` : ''}\n\nIMPORTANT: Output ONLY ONE prompt (not multiple variations). Make it unique and creative. Do not include any titles, numbers, or formatting - just the prompt text itself.`
                        }
                    ],
                    temperature: temperature,
                    max_tokens: 500,  // 确保有足够空间生成完整提示词
                    top_p: 0.95
                };
            } else if (provider === 'siliconflow') {
                // 添加随机性确保每次生成不同结果
                const randomSeed = Math.floor(Math.random() * 1000000);
                const temperature = 0.7 + (Math.random() * 0.3); // 0.7-1.0之间的随机温度
                
                apiUrl = 'https://api.siliconflow.cn/v1/chat/completions';
                headers = {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                };
                requestBody = {
                    model: model,
                    messages: [
                        {
                            role: 'user',
                            content: `Generate ONE single image editing prompt for: ${description}${customGuidance ? `\n\nAdditional guidance: ${customGuidance}` : ''}\n\nIMPORTANT: Output ONLY ONE prompt (not multiple variations). Make it unique and creative. Do not include any titles, numbers, or formatting - just the prompt text itself.`
                        }
                    ],
                    temperature: temperature,
                    max_tokens: 500,  // 确保有足够空间生成完整提示词
                    top_p: 0.95
                };
            } else if (provider === 'deepseek') {
                // 添加随机性确保每次生成不同结果
                const randomSeed = Math.floor(Math.random() * 1000000);
                const temperature = 0.7 + (Math.random() * 0.3); // 0.7-1.0之间的随机温度
                
                apiUrl = 'https://api.deepseek.com/v1/chat/completions';
                headers = {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                };
                requestBody = {
                    model: model,
                    messages: [
                        {
                            role: 'user',
                            content: `Generate ONE single image editing prompt for: ${description}${customGuidance ? `\n\nAdditional guidance: ${customGuidance}` : ''}\n\nIMPORTANT: Output ONLY ONE prompt (not multiple variations). Make it unique and creative. Do not include any titles, numbers, or formatting - just the prompt text itself.`
                        }
                    ],
                    temperature: temperature,
                    max_tokens: 500,  // 确保有足够空间生成完整提示词
                    top_p: 0.95
                };
            } else if (provider === 'gemini') {
                // 添加随机性确保每次生成不同结果
                const randomSeed = Math.floor(Math.random() * 1000000);
                const temperature = 0.7 + (Math.random() * 0.3); // 0.7-1.0之间的随机温度
                
                // Note: Gemini API需要特殊处理，使用不同的URL格式
                apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
                headers = {
                    'Content-Type': 'application/json'
                };
                requestBody = {
                    contents: [
                        {
                            parts: [
                                {
                                    text: `请根据以下内容生成优化的图像编辑提示词：\n\n用户输入: ${description}\n编辑意图: ${editingIntent}\n处理风格: ${processingStyle}\n${customGuidance ? `自定义指引: ${customGuidance}` : ''}\n随机种子: ${randomSeed}\n\n请生成专业的英文提示词，每次都要有所不同，提供创新的表达方式。`
                                }
                            ]
                        }
                    ],
                    generationConfig: {
                        temperature: temperature,
                        maxOutputTokens: 1000
                    }
                };
            } else {
                // 对于不支持直接调用的提供商，显示说明
                this.generatedPrompt = `ℹ️ ${provider} 提供商暂不支持前端直接调用\n\n由于浏览器CORS限制，某些API提供商无法直接从前端调用。\n\n请使用支持的提供商：\n- 智谱AI (zhipu)\n- Moonshot (moonshot) 
- SiliconFlow (siliconflow)\n- DeepSeek (deepseek)\n- Google Gemini (gemini)\n\n或者联系开发者添加对 ${provider} 的支持。`;
                this.updateAllPreviewTextareas();
                this.isGeneratingAPI = false;
                return;
            }
            
            const callTimestamp = new Date().toLocaleTimeString();
            this.generatedPrompt = `⚡ 正在调用 ${provider} API... (${callTimestamp})`;
            this.updateAllPreviewTextareas();
            
            // 调用远程API
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
            }
            
            const result = await response.json();
            
            // 提取生成的内容
            let generatedContent = '';
            if (provider === 'gemini') {
                // Gemini API使用不同的响应格式
                if (result.candidates && result.candidates[0] && result.candidates[0].content && result.candidates[0].content.parts) {
                    generatedContent = result.candidates[0].content.parts[0].text;
                } else {
                    generatedContent = '未能获取到有效的Gemini响应';
                }
            } else if (result.choices && result.choices[0] && result.choices[0].message) {
                const rawContent = result.choices[0].message.content;
                
                // 如果原始内容为空，尝试其他字段
                if (!rawContent || rawContent.trim().length === 0) {
                    console.error('[API] API返回了空内容！');
                    
                    // 检查是否因为token限制导致的空响应
                    if (result.choices[0].finish_reason === 'length') {
                        generatedContent = '❌ API响应被截断（token限制），请重试或简化输入';
                        console.warn('[API] 响应因token限制被截断');
                    } else if (result.choices[0].text) {
                        generatedContent = result.choices[0].text;
                    } else {
                        generatedContent = '❌ API返回了空响应，请重试';
                    }
                } else {
                    // 清理API响应，提取纯净提示词
                    generatedContent = this.cleanApiResponse(rawContent);
                    
                    // 如果清理后为空，使用原始内容
                    if (!generatedContent || generatedContent.length < 10) {
                        console.warn('[API] 清理后内容过短，使用原始内容');
                        generatedContent = rawContent;
                    }
                }
            } else {
                generatedContent = '未能获取到有效响应';
            }
            
            // 显示最终结果并传递纯净提示词给后端
            this.generatedPrompt = `✅ ${provider} API生成完成！\n\n模型: ${model}\n输入: "${description}"\n\n生成的提示词:\n${generatedContent}`;
            this.updateAllPreviewTextareas();
            
            // 将纯净的提示词传递给后端，同时保持API模式设置
            this.updateNodeWidgets({
                tab_mode: 'api',
                edit_mode: '远程API',
                generated_prompt: generatedContent || '',
                api_provider: provider,
                api_key: apiKey,
                api_model: model,
                api_editing_intent: editingIntent,
                api_processing_style: processingStyle,
                description: description
            });
            
            this.isGeneratingAPI = false;
            // 确保选项卡不会被切换
            this.currentCategory = 'api';
            
        } catch (error) {
            console.error('[API] 请求失败:', error);
            
            if (error.message.includes('Failed to fetch') || error.message.includes('CORS') || error.message.includes('Network')) {
                this.generatedPrompt = `❌ 网络请求失败 (${provider})\n\n可能的原因：\n1. 浏览器CORS限制 - 某些API不允许前端直接调用\n2. 网络连接问题\n3. API服务不可用\n\n建议：\n- 检查API密钥是否正确\n- 尝试其他支持的API提供商\n- 或使用本地Ollama选项卡`;
            } else if (error.message.includes('401') || error.message.includes('403')) {
                this.generatedPrompt = `❌ 认证失败 (${provider})\n\nAPI密钥错误或已过期\n\n请检查：\n1. API密钥是否正确\n2. API密钥是否有效\n3. 账户是否有足够余额`;
            } else if (error.message.includes('429')) {
                this.generatedPrompt = `❌ 请求频率过高 (${provider})\n\n请稍后再试或升级API套餐`;
            } else {
                this.generatedPrompt = `❌ API请求失败 (${provider}/${model}): ${error.message}`;
            }
            
            this.updateAllPreviewTextareas();
            this.isGeneratingAPI = false;
            // 确保选项卡不会被切换
            this.currentCategory = 'api';
        }
    }
    
    async waitForOllamaResult(model, description) {
        try {
            
            // 显示连接状态
            this.generatedPrompt = `🔄 正在连接本地 Ollama (${model})...`;
            this.updateAllPreviewTextareas();
            
            // 获取Ollama配置
            const ollamaUrl = this.ollamaUrlInput?.value || 'http://127.0.0.1:11434';
            const temperature = parseFloat(this.ollamaTempInput?.value || '0.7');
            const editingIntent = this.ollamaIntentSelect?.value || 'general_editing';
            const processingStyle = this.ollamaStyleSelect?.value || 'auto_smart';
            const customGuidance = this.ollamaGuidanceTextarea?.value || '';
            
            // 添加随机性确保每次生成不同结果
            const randomSeed = Math.floor(Math.random() * 1000000);
            const finalTemperature = temperature + (Math.random() * 0.2); // 在原温度基础上增加一些随机性
            
            // 构建Ollama API请求
            const requestBody = {
                model: model,
                messages: [
                    {
                        role: 'user',
                        content: `Generate an optimized image editing prompt for: ${description}${customGuidance ? `\n\nAdditional guidance: ${customGuidance}` : ''}\n\nProvide a complete, detailed prompt in English. Be creative and vary your response each time.`
                    }
                ],
                options: {
                    temperature: finalTemperature,
                    seed: randomSeed  // Ollama支持seed参数
                },
                stream: false
            };
            
            const callTimestamp = new Date().toLocaleTimeString();
            this.generatedPrompt = `⚡ 正在调用本地 Ollama API... (${callTimestamp})`;
            this.updateAllPreviewTextareas();
            
            // 调用本地Ollama API
            const response = await fetch(`${ollamaUrl}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                throw new Error(`Ollama API请求失败: ${response.status} ${response.statusText}`);
            }
            
            const result = await response.json();
            
            // 提取生成的内容
            let generatedContent = '';
            if (result.message && result.message.content) {
                generatedContent = result.message.content;
            } else {
                generatedContent = '未能获取到有效响应';
            }
            
            // 显示最终结果并传递纯净提示词给后端
            this.generatedPrompt = `✅ 本地 Ollama 生成完成！\n\n模型: ${model}\n输入: "${description}"\n\n生成的提示词:\n${generatedContent}`;
            this.updateAllPreviewTextareas();
            
            // 将纯净的提示词传递给后端，同时保持Ollama模式设置
            this.updateNodeWidgets({
                tab_mode: 'ollama',
                edit_mode: '本地Ollama',
                generated_prompt: generatedContent || '',
                ollama_url: ollamaUrl,
                ollama_model: model,
                ollama_temperature: temperature,
                ollama_editing_intent: editingIntent,
                ollama_processing_style: processingStyle,
                description: description,
                ollama_enable_visual: this.ollamaVisualCheckbox?.checked || false,
                ollama_auto_unload: this.ollamaUnloadCheckbox?.checked || false
            });
            
            this.isGeneratingOllama = false;
            // 确保选项卡不会被切换
            this.currentCategory = 'ollama';
            
        } catch (error) {
            console.error('[Ollama] 请求失败:', error);
            if (error.message.includes('Failed to fetch')) {
                this.generatedPrompt = `❌ 无法连接到本地 Ollama 服务\n\n请确保:\n1. Ollama 已启动 (ollama serve)\n2. 模型已下载 (ollama pull ${model})\n3. 服务地址正确: ${this.ollamaUrlInput?.value || 'http://127.0.0.1:11434'}`;
            } else {
                this.generatedPrompt = `❌ Ollama请求失败 (${model}): ${error.message}`;
            }
            this.updateAllPreviewTextareas();
            this.isGeneratingOllama = false;
            // 确保选项卡不会被切换
            this.currentCategory = 'ollama';
        }
    }

    copyToClipboard() {
        // 复制预览文本框中的内容，如果为空则复制详细信息
        const copyText = this.generatedPrompt && this.generatedPrompt.trim() 
            ? this.generatedPrompt 
            : [
                `编辑模式: ${this.currentEditMode}`,
                `操作类型: ${this.currentOperationType}`,
                `描述: ${this.description}`,
                `约束性提示词: ${this.selectedConstraints.join(', ')}`,
                `修饰性提示词: ${this.selectedDecoratives.join(', ')}`,
                `选中图层: ${this.selectedLayers.length}个`
            ].join('\n');

        navigator.clipboard.writeText(copyText).then(() => {
            this.showNotification("已复制到剪贴板", "success");
        }).catch(() => {
            this.showNotification("复制失败", "error");
        });
    }

    notifyNodeUpdate() {
        // 通知ComfyUI节点需要更新
        if (this.node.onResize) {
            this.node.onResize();
        }
        
        app.graph.change();
    }

    updateNodeSize() {
        const nodeWidth = 816; // 1020 * 0.8 - 减小20%
        const nodeHeight = 750; // KSP_NS.constants.EDITOR_SIZE.HEIGHT + 50
        
        // 强制更新节点大小
        this.node.size = [nodeWidth, nodeHeight];
        
        if (this.node.setSize) {
            this.node.setSize([nodeWidth, nodeHeight]);
        }
        
        // 触发重绘
        if (this.node.setDirtyCanvas) {
            this.node.setDirtyCanvas(true, true);
        }
        
        // 通知ComfyUI节点大小已更改
        if (this.node.onResize) {
            this.node.onResize([nodeWidth, nodeHeight]);
        }
        
        // 如果有画布，通知画布更新
        if (this.node.graph && this.node.graph.canvas) {
            this.node.graph.canvas.setDirty(true, true);
        }
    }

    getEditorData() {
        return {
            currentEditMode: this.currentEditMode,
            currentCategory: this.currentCategory,
            currentOperationType: this.currentOperationType,
            description: this.description,
            selectedConstraints: this.selectedConstraints,
            selectedDecoratives: this.selectedDecoratives,
            selectedLayers: this.selectedLayers,
            autoGenerate: this.autoGenerate,
            generatedPrompt: this.generatedPrompt  // 添加生成的提示词
        };
    }

    setEditorData(data) {
        if (!data) return;
        
        // 保存当前选项卡状态，防止被意外切换
        const previousCategory = this.currentCategory;
        const isGenerating = this.isGeneratingAPI || this.isGeneratingOllama;
        
        this.currentEditMode = data.currentEditMode || "局部编辑";
        this.currentCategory = data.currentCategory || previousCategory || 'local';  // 优先保持当前选项卡
        this.currentOperationType = data.currentOperationType || '';
        this.description = data.description || '';
        this.selectedConstraints = data.selectedConstraints || [];
        this.selectedDecoratives = data.selectedDecoratives || [];
        this.selectedLayers = data.selectedLayers || [];
        this.autoGenerate = data.autoGenerate !== false;
        this.generatedPrompt = data.generatedPrompt || '';  // 添加生成的提示词
        
        // 如果正在生成中，不要更新UI（防止切换选项卡）
        if (!isGenerating) {
            this.updateUI();
        }
    }

    cleanApiResponse(response) {
        /**
         * 清理API响应，提取纯净提示词
         * 处理各种格式，提取单一提示词
         */
        if (!response) {
            console.warn('[API] 响应为空');
            return response;
        }


        // 如果响应包含多个Prompt编号，只提取第一个
        if (response.includes('### Prompt') || response.includes('Prompt 1:')) {
            
            // 尝试提取第一个引号内的提示词
            const firstQuotedMatch = response.match(/"([^"]{30,})"/);
            if (firstQuotedMatch) {
                return firstQuotedMatch[1].trim();
            }
            
            // 尝试提取第一个提示词段落（在第一个---之前）
            const firstPromptMatch = response.match(/(?:Prompt \d+:.*?)"([^"]+)"/s);
            if (firstPromptMatch) {
                return firstPromptMatch[1].trim();
            }
        }

        let cleaned = response.trim();
        
        // 尝试提取引号中的提示词（仅当引号内容足够长时）
        const quotedMatch = response.match(/"([^"]{30,})"/);
        if (quotedMatch) {
            return quotedMatch[1].trim();
        }
        
        // 尝试提取代码块中的提示词
        const codeBlockMatch = response.match(/```[^`]*?\n(.*?)\n```/s);
        if (codeBlockMatch && codeBlockMatch[1].trim().length > 20) {
            return codeBlockMatch[1].trim();
        }

        // 移除常见的标题和前缀
        const patternsToRemove = [
            /^###.*$/gm,           // 移除Markdown标题
            /^Prompt \d+:.*$/gm,   // 移除"Prompt 1:"等
            /^---.*$/gm,           // 移除分隔线
            /^.*?prompt:\s*/i,     // 移除prompt前缀
        ];

        for (const pattern of patternsToRemove) {
            cleaned = cleaned.replace(pattern, '');
        }
        
        // 清理多余空行
        cleaned = cleaned.replace(/\n{2,}/g, '\n').trim();

        // 确保返回有意义的内容
        if (!cleaned || cleaned.length < 10) {
            console.warn('[API] 清理后内容过短，返回原始响应');
            return response.trim();
        }
        
        return cleaned;
    }

    updateUI() {
        // 如果正在生成提示词，跳过UI更新以避免清空选择状态
        if (this.isGeneratingPrompt) {
            return;
        }
        
        if (this.descriptionTextarea) {
            this.descriptionTextarea.value = this.description;
        }
        
        if (this.autoGenCheckbox) {
            this.autoGenCheckbox.checked = this.autoGenerate;
        }
        
        if (this.currentCategory) {
            this.switchTab(this.currentCategory);
        }
        
        this.updateOperationButtons();
        
        this.updateLayerCountDisplay();
    }

    updateAllPreviewTextareas() {
        if (this.previewTextareas && this.previewTextareas.length > 0) {
            this.previewTextareas.forEach(textarea => {
                if (textarea && textarea.value !== this.generatedPrompt) {
                    textarea.value = this.generatedPrompt || '';
                }
            });
        }
    }
    
    updateAllDescriptionTextareas() {
        // 如果正在API生成中，不更新输入框（防止模板污染）
        if (this.isGeneratingAPI || this.isGeneratingOllama) {
            return;
        }
        
        const allDescriptionTextareas = this.editorContainer.querySelectorAll('.description-section textarea');
        allDescriptionTextareas.forEach(textarea => {
            if (textarea && textarea.value !== this.description) {
                textarea.value = this.description || '';
            }
        });
    }

    showNotification(message, type = "info") {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4CAF50' : type === 'warning' ? '#FF9800' : type === 'error' ? '#f44336' : '#2196F3'};
            color: white;
            padding: 12px 16px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 10000;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            animation: slideInRight 0.3s ease;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    // 检查API提供商是否支持动态模型获取
    supportsDynamicModels(provider) {
        const dynamicProviders = ['openai', 'gemini', 'siliconflow', 'deepseek', 'qianwen', 'zhipu', 'moonshot'];
        return dynamicProviders.includes(provider);
    }

    // 动态获取模型列表
    async fetchDynamicModels(provider, apiKey) {
        try {
            if (provider === 'gemini') {
                // Gemini API特殊处理
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                
                const data = await response.json();
                const models = [];
                
                for (const model of data.models || []) {
                    const modelName = model.name?.replace('models/', '');
                    if (model.supportedGenerationMethods?.includes('generateContent')) {
                        models.push(modelName);
                    }
                }
                
                return models.length > 0 ? models : null;
                
            } else {
                // OpenAI兼容API提供商
                const baseUrls = {
                    'openai': 'https://api.openai.com/v1',
                    'siliconflow': 'https://api.siliconflow.cn/v1',
                    'deepseek': 'https://api.deepseek.com/v1',
                    'qianwen': 'https://dashscope.aliyuncs.com/compatible-mode/v1',
                    'zhipu': 'https://open.bigmodel.cn/api/paas/v4',
                    'moonshot': 'https://api.moonshot.cn/v1'
                };
                
                const baseUrl = baseUrls[provider];
                if (!baseUrl) return null;
                
                const response = await fetch(`${baseUrl}/models`, {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                
                const data = await response.json();
                const models = data.data?.map(model => model.id) || [];
                
                return models.length > 0 ? models : null;
            }
        } catch (error) {
            console.warn(`获取${provider}模型列表失败:`, error);
            return null;
        }
    }

    // Ollama服务管理相关方法
    async checkOllamaServiceStatus() {
        try {
            // 检查Ollama服务状态
            const response = await fetch('/ollama_service_control', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action: 'status' })
            });

            if (response.ok) {
                const result = await response.json();
                this.updateOllamaServiceStatus(result.status || '未知');
            } else {
                // 尝试直接检查Ollama API
                try {
                    const ollamaResponse = await fetch('http://127.0.0.1:11434/api/tags', { 
                        method: 'GET',
                        signal: AbortSignal.timeout(3000) 
                    });
                    if (ollamaResponse.ok) {
                        this.updateOllamaServiceStatus('运行中');
                    } else {
                        this.updateOllamaServiceStatus('已停止');
                    }
                } catch {
                    this.updateOllamaServiceStatus('已停止');
                }
            }
        } catch (error) {
            console.warn('[Ollama Service] 状态检查失败:', error);
            this.updateOllamaServiceStatus('未知');
        }
    }

    updateOllamaServiceStatus(status) {
        if (!this.ollamaStatusDisplay) return;
        
        // 根据状态设置样式和按钮
        switch (status) {
            case '运行中':
                this.ollamaStatusDisplay.textContent = '运行中';
                this.ollamaStatusDisplay.style.background = '#4CAF50';
                this.ollamaStatusDisplay.style.color = 'white';
                if (this.ollamaServiceButton) {
                    this.ollamaServiceButton.textContent = '停止';
                    this.ollamaServiceButton.style.background = '#f44336';
                    this.ollamaServiceButton.disabled = false;
                }
                break;
            case '已停止':
                this.ollamaStatusDisplay.textContent = '已停止';
                this.ollamaStatusDisplay.style.background = '#f44336';
                this.ollamaStatusDisplay.style.color = 'white';
                if (this.ollamaServiceButton) {
                    this.ollamaServiceButton.textContent = '启动';
                    this.ollamaServiceButton.style.background = '#4CAF50';
                    this.ollamaServiceButton.disabled = false;
                }
                break;
            case '启动中':
                this.ollamaStatusDisplay.textContent = '启动中';
                this.ollamaStatusDisplay.style.background = '#FF9800';
                this.ollamaStatusDisplay.style.color = 'white';
                if (this.ollamaServiceButton) {
                    this.ollamaServiceButton.textContent = '启动中';
                    this.ollamaServiceButton.disabled = true;
                }
                break;
            case '停止中':
                this.ollamaStatusDisplay.textContent = '停止中';
                this.ollamaStatusDisplay.style.background = '#FF9800';
                this.ollamaStatusDisplay.style.color = 'white';
                if (this.ollamaServiceButton) {
                    this.ollamaServiceButton.textContent = '停止中';
                    this.ollamaServiceButton.disabled = true;
                }
                break;
            default:
                this.ollamaStatusDisplay.textContent = '检测中';
                this.ollamaStatusDisplay.style.background = '#666';
                this.ollamaStatusDisplay.style.color = '#ccc';
                if (this.ollamaServiceButton) {
                    this.ollamaServiceButton.textContent = '启动';
                    this.ollamaServiceButton.style.background = '#4CAF50';
                    this.ollamaServiceButton.disabled = false;
                }
        }
    }

    async toggleOllamaService() {
        try {
            const currentStatus = this.ollamaStatusDisplay?.textContent || '';
            const action = currentStatus === '运行中' ? 'stop' : 'start';
            
            // 设置操作中状态
            this.updateOllamaServiceStatus(action === 'start' ? '启动中' : '停止中');
            
            const response = await fetch('/ollama_service_control', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action: action })
            });

            const result = await response.json();
            
            if (result.success) {
                this.showNotification(result.message || `${action === 'start' ? '启动' : '停止'}服务成功`, 'success');
                // 延迟检查状态，给服务时间启动/停止
                setTimeout(() => this.checkOllamaServiceStatus(), 2000);
            } else {
                this.showNotification(`操作失败: ${result.message}`, 'error');
                this.checkOllamaServiceStatus();
            }
        } catch (error) {
            console.error('[Ollama Service] 服务控制失败:', error);
            this.showNotification(`服务操作失败: ${error.message}`, 'error');
            this.checkOllamaServiceStatus();
        }
    }

    async unloadOllamaModels() {
        try {
            this.showNotification('正在释放Ollama模型...', 'info');
            
            // 方法1: 调用Ollama API释放所有模型
            try {
                const response = await fetch('http://127.0.0.1:11434/api/generate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: '',
                        keep_alive: 0  // 立即释放所有模型
                    })
                });
                
                if (response.ok) {
                    this.showNotification('模型内存释放成功！', 'success');
                    return;
                }
            } catch (directError) {
                console.warn('[Ollama] 直接API调用失败:', directError);
            }

            // 方法2: 通过后端服务控制
            const response = await fetch('/ollama_service_control', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action: 'unload' })
            });

            const result = await response.json();
            
            if (result.success) {
                this.showNotification(result.message || '模型内存释放成功！', 'success');
            } else {
                this.showNotification(`释放失败: ${result.message}`, 'warning');
            }
        } catch (error) {
            console.error('[Ollama Service] 释放模型失败:', error);
            this.showNotification(`释放模型失败: ${error.message}`, 'error');
        }
    }
}

// 添加动画样式
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// 注册节点到ComfyUI
app.registerExtension({
    name: "KontextSuperPrompt",
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name === "KontextSuperPrompt") {
            const onNodeCreated = nodeType.prototype.onNodeCreated;
            
            nodeType.prototype.onNodeCreated = function () {
                if (onNodeCreated) {
                    onNodeCreated.apply(this, arguments);
                }
                
                this.widgets = [];
                
                // 设置节点初始大小
                const nodeWidth = 816; // 1020 * 0.8 - 减小20%
                const nodeHeight = 750; // KSP_NS.constants.EDITOR_SIZE.HEIGHT + 50
                this.size = [nodeWidth, nodeHeight];
                
                // 创建超级提示词编辑器实例
                this.kontextSuperPrompt = new KontextSuperPrompt(this);
                
                // 重写computeSize方法确保正确的节点大小
                this.computeSize = function() {
                    return [nodeWidth, nodeHeight];
                };
                
                // 重写onResize方法
                const originalOnResize = this.onResize;
                this.onResize = function(size) {
                    if (originalOnResize) {
                        originalOnResize.apply(this, arguments);
                    }
                    
                    // 确保最小尺寸
                    if (size) {
                        size[0] = Math.max(size[0], nodeWidth);
                        size[1] = Math.max(size[1], nodeHeight);
                    }
                    
                    return size;
                };
                
                // 强制设置节点为不可调整大小（可选）
                this.resizable = false;
                
                // 确保节点立即应用大小
                if (this.setSize) {
                    this.setSize([nodeWidth, nodeHeight]);
                }
                
                // 初始化默认界面，确保即使没有Canvas连接也能正常显示
                setTimeout(() => {
                    if (!this.kontextSuperPrompt.layerInfo || this.kontextSuperPrompt.layerInfo.layers.length === 0) {
                        this.kontextSuperPrompt.updateLayerInfo({ 
                            layers: [], 
                            canvas_size: { width: 512, height: 512 },
                            transform_data: { background: { width: 512, height: 512 } }
                        });
                    }
                }, 100);

                // 监听输入变化
                const onConnectionsChange = this.onConnectionsChange;
                this.onConnectionsChange = function(type, index, connected, link_info) {
                    if (onConnectionsChange) {
                        onConnectionsChange.apply(this, arguments);
                    }
                    
                    
                    // 当layer_info输入连接时，更新图层信息
                    if (type === 1 && index === 0 && connected) { // input, layer_info, connected
                        setTimeout(() => {
                            this.updateLayerInfo();
                        }, 100);
                        
                        // 同时尝试获取实时数据
                        setTimeout(() => {
                            this.kontextSuperPrompt.tryGetLayerInfoFromConnectedNode();
                        }, 500);
                    } else if (type === 1 && index === 0 && !connected) {
                        // 当断开连接时，显示默认界面
                        this.kontextSuperPrompt.updateLayerInfo({ 
                            layers: [], 
                            canvas_size: { width: 512, height: 512 },
                            transform_data: { background: { width: 512, height: 512 } }
                        });
                    }
                };
                
                // 监听节点执行完成事件
                const originalOnExecuted = this.onExecuted;
                this.onExecuted = function(message) {
                    if (originalOnExecuted) {
                        originalOnExecuted.apply(this, arguments);
                    }
                    
                    
                    // 从执行结果中提取图层信息
                    if (message && message.text) {
                        try {
                            let layerData = null;
                            
                            // message.text可能是字符串数组
                            if (Array.isArray(message.text)) {
                                for (let textItem of message.text) {
                                    if (typeof textItem === 'string' && textItem.includes('layers')) {
                                        layerData = JSON.parse(textItem);
                                        break;
                                    }
                                }
                            } else if (typeof message.text === 'string' && message.text.includes('layers')) {
                                layerData = JSON.parse(message.text);
                            }
                            
                            if (layerData) {
                                this.kontextSuperPrompt.updateLayerInfo(layerData);
                            }
                        } catch (e) {
                            console.warn("[Kontext Super Prompt] 解析图层数据失败:", e);
                        }
                    }
                };
                
                this.updateLayerInfo = function() {
                    
                    if (this.inputs[0] && this.inputs[0].link) {
                        const link = app.graph.links[this.inputs[0].link];
                        
                        if (link) {
                            const sourceNode = app.graph.getNodeById(link.origin_id);
                            
                            if (sourceNode) {
                                
                                // 尝试多种方式获取图层信息
                                let layerInfo = null;
                                
                                // 方式1: 从最近的执行输出获取
                                if (sourceNode.last_output) {
                                    if (sourceNode.last_output.length > 1) {
                                        try {
                                            const layerInfoOutput = sourceNode.last_output[1]; // 第二个输出是layer_info
                                            if (typeof layerInfoOutput === 'string') {
                                                layerInfo = JSON.parse(layerInfoOutput);
                                            } else {
                                                layerInfo = layerInfoOutput;
                                            }
                                        } catch (e) {
                                            console.warn("[Kontext Super Prompt] 解析last_output失败:", e);
                                        }
                                    }
                                }
                                
                                // 方式2: 从properties获取
                                if (!layerInfo && sourceNode.properties && sourceNode.properties.layer_info) {
                                    layerInfo = sourceNode.properties.layer_info;
                                }
                                
                                // 方式3: 从widget值获取（新增）
                                if (!layerInfo && sourceNode.widgets) {
                                    for (let widget of sourceNode.widgets) {
                                        if (widget.name === 'layer_info' && widget.value) {
                                            try {
                                                layerInfo = typeof widget.value === 'string' ? JSON.parse(widget.value) : widget.value;
                                                break;
                                            } catch (e) {
                                                console.warn("[Kontext Super Prompt] 解析widget值失败:", e);
                                            }
                                        }
                                    }
                                }
                                
                                // 方式4: 监听WebSocket消息（新增）
                                this.listenToWebSocketMessages(sourceNode);
                                
                                // 方式5: 从节点的内部数据获取
                                if (!layerInfo && sourceNode.lrpgCanvas) {
                                    this.kontextSuperPrompt.tryGetLayerInfoFromConnectedNode();
                                    return; // 让tryGetLayerInfoFromConnectedNode处理
                                }
                                
                                if (layerInfo) {
                                    this.kontextSuperPrompt.updateLayerInfo(layerInfo);
                                } else {
                                    console.warn("[Kontext Super Prompt] 未找到图层信息，显示默认界面");
                                    // 即使没有图层信息也要确保界面正常显示
                                    this.kontextSuperPrompt.updateLayerInfo({ layers: [], canvas_size: { width: 512, height: 512 } });
                                }
                            }
                        }
                    } else {
                    }
                };
                
                // 监听WebSocket消息以获取实时数据 - 使用管理方法防止泄漏
                this.listenToWebSocketMessages = function(sourceNode) {
                    // 检查是否已经有盘中的kontextSuperPrompt实例
                    if (!this.kontextSuperPrompt) return;
                    
                    // 使用kontextSuperPrompt的管理方法添加监听器
                    const executedHandler = (event) => {
                        if (event.detail && event.detail.node === sourceNode.id.toString()) {
                            if (event.detail.output && event.detail.output.layer_info) {
                                let layerInfo = event.detail.output.layer_info;
                                if (typeof layerInfo === 'string') {
                                    try {
                                        layerInfo = JSON.parse(layerInfo);
                                    } catch (e) {
                                        console.warn("[Kontext Super Prompt] 解析WebSocket数据失败:", e);
                                        return;
                                    }
                                }
                                
                                // 检查递归防护：只有在非递归状态下才调用updateLayerInfo
                                if (!this.kontextSuperPrompt._updateLayerInfoInProgress) {
                                    this.kontextSuperPrompt.updateLayerInfo(layerInfo);
                                }
                            }
                        }
                    };
                    
                    this.kontextSuperPrompt.addAPIEventListenerManaged('executed', executedHandler);
                };
                
                // 重写getExtraMenuOptions以防止显示widget选项
                this.getExtraMenuOptions = function(_, options) {
                    return options;
                };
                
                // 添加节点销毁时的清理机制，防止内存泄漏
                const originalOnRemoved = this.onRemoved;
                this.onRemoved = function() {
                    // 清理KontextSuperPrompt实例的所有资源
                    if (this.kontextSuperPrompt && this.kontextSuperPrompt.cleanup) {
                        this.kontextSuperPrompt.cleanup();
                    }
                    
                    // 调用原始的onRemoved方法
                    if (originalOnRemoved) {
                        originalOnRemoved.call(this);
                    }
                };
                
                // 隐藏widget数据传递方式，不再需要复杂的serialize重写
            };
        }
    }
});

