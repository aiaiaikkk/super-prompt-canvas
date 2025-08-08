// import { t } from './visual_prompt_editor_i18n.js';
import { getCoordinateSystem } from './shared/coordinate_system.js';

/**
 * Visual Prompt Editor - Utility Functions Module
 * Common utility functions and constant definitions
 */

// Tool mapping
export const TOOL_NAMES = {
    'rectangle': { name: 'Rectangle', icon: '▭' },
    'circle': { name: 'Circle', icon: '⭕' },
    'arrow': { name: 'Arrow', icon: '➡️' },
    'freehand': { name: 'Polygon', icon: '🔗' },
    'brush': { name: 'Brush', icon: '🖌️' }
};

// 颜色映射 - 使用标准纯色
export const COLOR_NAMES = {
    '#ff0000': { name: 'Red', icon: '🔴' },
    '#00ff00': { name: 'Green', icon: '🟢' }, 
    '#ffff00': { name: 'Yellow', icon: '🟡' },
    '#0000ff': { name: 'Blue', icon: '🔵' }
};

// 颜色常量 - 合并从constants.js
export const COLORS = {
    // 节点颜色
    NODE_COLOR: "#673AB7",
    NODE_BG_COLOR: "#512DA8",
    
    // UI颜色
    PRIMARY: "#2196F3",
    SUCCESS: "#4CAF50",
    SUCCESS_ALT: "#10b981",
    BACKGROUND_DARK: "#2b2b2b",
    SELECTED_BG: "#1a2332",
    
    // SVG默认颜色
    DEFAULT_STROKE: "#000000",
    DEFAULT_FILL: "none"
};

// Z-Index层级管理 - 统一界面层级
export const Z_INDEX = {
    BASE: 10000,           // 基础层级
    NOTIFICATION: 15000,   // 通知层级  
    MODAL: 25000,         // 模态框层级
    EDITOR: 30000,        // 编辑器层级
    TOOLTIP: 40000,       // 工具提示层级
    OVERLAY: 50000        // 覆盖层级 (最高级别)
};

// 尺寸常量 - 从constants.js合并  
export const DIMENSIONS = {
    // 边框宽度
    STROKE_WIDTH: {
        THIN: 1,
        NORMAL: 2, 
        MEDIUM: 3,
        THICK: 5,
        EXTRA_THICK: 6
    },
    
    // 边距和间距
    PADDING: {
        SMALL: 4,
        MEDIUM: 8,
        LARGE: 16
    },
    
    // 圆角
    BORDER_RADIUS: {
        SMALL: 4,
        MEDIUM: 8
    }
};

// 时间常量 - 从constants.js合并
export const TIMING = {
    // 延迟时间 (毫秒)
    SHORT_DELAY: 100,
    MEDIUM_DELAY: 300,
    LONG_DELAY: 500,
    
    // 动画时间
    ANIMATION_DURATION: 300,
    
    // 通知显示时间
    NOTIFICATION_DURATION: 3000
};

// DOM选择器常量 - 从constants.js合并
export const SELECTORS = {
    // 主要容器
    MODAL: '#unified-editor-modal',
    CANVAS_CONTAINER: '#canvas-container',
    DRAWING_LAYER: '#drawing-layer svg',
    
    // 图层相关
    LAYERS_LIST: '#layers-list',
    LAYERS_DISPLAY_CONTAINER: '#layers-display-container',
    
    // UI控件
    ANNOTATION_OBJECTS: '#annotation-objects',
    SELECTION_COUNT: '#selection-count',
    
    // 画布相关
    IMAGE_CANVAS: '#image-canvas',
    ZOOM_CONTAINER: '#zoom-container'
};

// CSS类名常量 - 从constants.js合并
export const CSS_CLASSES = {
    HIGHLIGHTED: 'highlighted',
    BRUSH_PATH: 'brush-path', 
    ANNOTATION_SHAPE: 'annotation-shape',
    LAYER_ITEM: 'layer-item',
    LAYER_VISIBLE: 'layer-visible',
    LAYER_HIDDEN: 'layer-hidden'
};

// 文本常量 - 从constants.js合并
export const MESSAGES = {
    ERRORS: {
        GENERIC: '操作失败',
        IMAGE_LOAD: '图像加载失败',
        ANNOTATION_CREATE: '标注创建失败',
        LAYER_TOGGLE: '图层切换失败'
    },
    SUCCESS: {
        ANNOTATION_CREATED: '标注创建成功',
        LAYER_TOGGLED: '图层状态已更新',
        DATA_EXPORTED: '数据导出成功'
    }
};

// 默认配置 - 从constants.js合并
export const DEFAULTS = {
    LANGUAGE: 'zh',
    ZOOM_LEVEL: 1.0,
    STROKE_WIDTH: 3, // DIMENSIONS.STROKE_WIDTH.MEDIUM
    STROKE_COLOR: "#000000", // COLORS.DEFAULT_STROKE
    FILL_COLOR: "none" // COLORS.DEFAULT_FILL
};

// 数值限制 - 从constants.js合并
export const LIMITS = {
    MAX_ANNOTATIONS: 100,
    MAX_LAYERS: 50,
    MIN_ZOOM: 0.1,
    MAX_ZOOM: 5.0,
    MAX_TEXT_LENGTH: 500
};

// 统一Modal样式常量 - 消除样式重复
export const MODAL_STYLES = {
    // 模态框背景遮罩
    overlay: {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        background: 'rgba(0, 0, 0, 0.95)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    
    // 通知框样式
    notification: {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        padding: '20px 30px',
        borderRadius: '12px',
        color: 'white',
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        fontWeight: 'bold',
        boxShadow: '0 12px 24px rgba(0,0,0,0.4)',
        border: '3px solid #fff',
        textAlign: 'center',
        minWidth: '300px',
        opacity: '0',
        transition: 'opacity 0.3s, transform 0.3s'
    }
};

// SVG元素创建函数 - 从dom_utils.js迁移
export const createSVG = (tagName, attributes = {}) => {
    const element = document.createElementNS('http://www.w3.org/2000/svg', tagName);
    
    Object.entries(attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
    });
    
    return element;
};

// 模板分类定义 - Flux Kontext优化版 (4大分类)
export const TEMPLATE_CATEGORIES = {
    local: {
        name: '🎯 局部编辑',
        description: 'Local object-specific editing operations',
        templates: [
            'add_object', 'change_color', 'change_style', 'replace_object', 'remove_object',
            'change_texture', 'change_pose', 'change_expression', 'change_clothing', 'change_background',
            'enhance_quality', 'blur_background', 'adjust_lighting', 'resize_object', 'enhance_skin_texture',
            'character_expression', 'character_hair', 'character_accessories', 'zoom_focus', 'stylize_local',
            'custom'
        ]
    },
    global: {
        name: '🌍 全局编辑',
        description: 'Whole image processing operations',
        templates: [
            'global_color_grade', 'global_style_transfer', 'global_brightness_contrast',
            'global_hue_saturation', 'global_sharpen_blur', 'global_noise_reduction',
            'global_enhance', 'global_filter', 'character_age', 'detail_enhance',
            'realism_enhance', 'camera_operation',
            // 新增：来自kontext-presets的全局操作
            'relight_scene', 'colorize_image', 'teleport_context'
        ]
    },
    text: {
        name: '📝 文字编辑',
        description: 'Text editing and manipulation operations',
        templates: [
            'text_add', 'text_remove', 'text_edit', 'text_resize', 'object_combine'
        ]
    },
    professional: {
        name: '🔧 专业操作',
        description: 'Advanced professional editing tools',
        templates: [
            'geometric_warp', 'perspective_transform', 'lens_distortion', 'global_perspective',
            'content_aware_fill', 'seamless_removal', 'smart_patch',
            'style_blending', 'collage_integration', 'texture_mixing',
            'precision_cutout', 'alpha_composite', 'mask_feathering', 'depth_composite',
            // 新增：来自kontext-presets的专业操作
            'professional_product'
        ]
    }
};

// 🧠 智能推理操作模板 - 基于用户真实场景和编辑意图设计
export const OPERATION_TEMPLATES = {
    // 局部编辑模板 - 基于用户心理和场景深度理解
    'change_color': {
        // 情境感知：不同场景下颜色变化的真实意图
        template: 'transform {object} color to {target}',
        description: (target, context) => {
            const colorIntents = {
                portrait: `enhance {object} with ${target || 'natural warm'} tones for a more flattering appearance`,
                product: `showcase {object} in ${target || 'appealing'} color to attract customer attention`,
                creative: `reimagine {object} with ${target || 'artistic'} color palette for creative expression`,
                social: `beautify {object} with ${target || 'vibrant'} color that captures the moment perfectly`,
                professional: `adjust {object} to ${target || 'accurate'} color standards for consistent results`
            };
            return colorIntents[context] || `thoughtfully transform {object} to ${target || 'desired'} color while preserving its essence`;
        },
        category: 'local',
        label: 'Color Transformation'
    },
    'change_style': {
        // 风格转换的深层美学理解
        template: 'reimagine {object} in {target} aesthetic',
        description: (target, context) => {
            const styleIntents = {
                portrait: `transform {object} with ${target || 'flattering'} style that enhances natural beauty`,
                product: `present {object} in ${target || 'premium'} style that elevates perceived value`,
                creative: `reinterpret {object} through ${target || 'innovative'} artistic vision`,
                social: `stylize {object} with ${target || 'trendy'} aesthetic perfect for sharing`,
                professional: `apply ${target || 'consistent'} style treatment to {object} for brand alignment`
            };
            return styleIntents[context] || `creatively transform {object} with ${target || 'distinctive'} style while honoring its character`;
        },
        category: 'local',
        label: 'Style Reimagining'
    },
    'replace_object': {
        // 替换操作的情境智能
        template: 'thoughtfully replace {object} with {target}',
        description: (target, context) => {
            const replaceIntents = {
                portrait: `seamlessly replace {object} with ${target || 'more flattering element'} that complements the person`,
                product: `strategically replace {object} with ${target || 'appealing alternative'} that enhances product appeal`,
                creative: `artistically substitute {object} with ${target || 'meaningful element'} that serves the creative vision`,
                social: `naturally replace {object} with ${target || 'better choice'} that improves the story`,
                professional: `precisely replace {object} with ${target || 'specified element'} meeting exact requirements`
            };
            return replaceIntents[context] || `intelligently replace {object} with ${target || 'suitable alternative'} that serves the intended purpose`;
        },
        category: 'local',
        label: 'Intelligent Replacement'
    },
    'add_object': {
        // 添加元素的场景理解
        template: 'thoughtfully introduce {target} to complement {object}',
        description: (target, context) => {
            const addIntents = {
                portrait: `gracefully add ${target || 'flattering element'} that enhances {object} and the overall portrait`,
                product: `strategically place ${target || 'appealing element'} to make {object} more desirable`,
                creative: `artistically introduce ${target || 'meaningful element'} that enriches the narrative around {object}`,
                social: `naturally add ${target || 'interesting element'} that makes {object} more engaging and shareable`,
                professional: `precisely add ${target || 'required element'} to {object} according to specifications`
            };
            return addIntents[context] || `meaningfully introduce ${target || 'complementary element'} that enhances {object} and serves the overall vision`;
        },
        category: 'local',
        label: 'Thoughtful Addition'
    },
    'remove_object': {
        // 移除操作的智能推理
        template: 'seamlessly eliminate {object} while preserving scene integrity',
        description: (target, context) => {
            const removeIntents = {
                portrait: `gracefully remove {object} to create a more flattering and focused portrait`,
                product: `cleanly eliminate {object} to showcase the product without distractions`,
                creative: `artistically remove {object} to strengthen the visual narrative and composition`,
                social: `naturally eliminate {object} to create a more appealing and shareable image`,
                professional: `precisely remove {object} to meet exact specifications while maintaining quality`
            };
            return removeIntents[context] || `thoughtfully eliminate {object} while maintaining natural scene flow and visual harmony`;
        },
        category: 'local',
        label: 'Seamless Removal'
    },
    'change_texture': {
        // 材质变化的感官理解
        template: 'transform {object} surface to {target} texture',
        description: (target, context = 'default') => {
            const textureIntents = {
                portrait: `enhance {object} with ${target || 'natural'} texture that feels authentic and appealing`,
                product: `upgrade {object} texture to ${target || 'premium'} finish that suggests quality and value`,
                creative: `reimagine {object} with ${target || 'artistic'} texture that serves the creative concept`,
                social: `beautify {object} with ${target || 'attractive'} texture that photographs beautifully`,
                professional: `apply ${target || 'specified'} texture to {object} according to technical requirements`
            };
            return textureIntents[context] || `thoughtfully transform {object} surface to ${target || 'desired'} texture while maintaining natural appearance`;
        },
        category: 'local',
        label: 'Texture Enhancement'
    },
    'change_pose': {
        // 姿态调整的情感理解
        template: 'guide {object} into {target} pose',
        description: (target, context = 'default') => {
            const poseIntents = {
                portrait: `gracefully adjust {object} to ${target || 'flattering'} pose that conveys confidence and natural charm`,
                product: `position {object} in ${target || 'appealing'} pose that showcases features and attracts interest`,
                creative: `choreograph {object} into ${target || 'expressive'} pose that serves the artistic narrative`,
                social: `arrange {object} in ${target || 'engaging'} pose that creates connection and tells a story`,
                professional: `position {object} in ${target || 'required'} pose meeting specific compositional standards`
            };
            return poseIntents[context] || `naturally guide {object} into ${target || 'appropriate'} pose that enhances the overall composition`;
        },
        category: 'local',
        label: 'Pose Refinement'
    },
    'change_expression': {
        // 表情变化的心理洞察
        template: 'inspire {object} with {target} expression',
        description: (target, context = 'default') => {
            const expressionIntents = {
                portrait: `enhance {object} with ${target || 'warm'} expression that radiates genuine emotion and connection`,
                product: `infuse {object} with ${target || 'appealing'} expression that creates positive associations`,
                creative: `imbue {object} with ${target || 'meaningful'} expression that deepens the artistic message`,
                social: `bring out ${target || 'joyful'} expression in {object} that spreads positive energy`,
                professional: `adjust {object} expression to ${target || 'appropriate'} tone for the intended audience`
            };
            return expressionIntents[context] || `naturally inspire {object} with ${target || 'authentic'} expression that conveys genuine emotion`;
        },
        category: 'local',
        label: 'Expression Enhancement'
    },
    'change_clothing': {
        // 服装变化的风格理解
        template: 'dress {object} in {target} attire',
        description: (target, context = 'default') => {
            const clothingIntents = {
                portrait: `elegantly dress {object} in ${target || 'flattering'} attire that enhances personal style and confidence`,
                product: `showcase {object} in ${target || 'appealing'} clothing that demonstrates product features`,
                creative: `costume {object} in ${target || 'thematic'} attire that supports the artistic vision`,
                social: `style {object} in ${target || 'trendy'} outfit perfect for the occasion and sharing`,
                professional: `outfit {object} in ${target || 'appropriate'} attire meeting dress code requirements`
            };
            return clothingIntents[context] || `thoughtfully dress {object} in ${target || 'suitable'} attire that complements the overall aesthetic`;
        },
        category: 'local',
        label: 'Wardrobe Styling'
    },
    'change_background': {
        template: 'change the background to {target}',  // 🔴 使用官方背景编辑标准格式
        description: (target) => `change the background to ${target || 'natural landscape'}`,
        category: 'local',
        label: 'Change Background'
    },
    'enhance_quality': {
        template: 'enhance {object} quality',  // 🔴 采用官方质量提升简洁表达
        description: (target) => `enhance {object} quality`,
        category: 'local',
        label: 'Enhance Quality'
    },
    'blur_background': {
        template: 'blur the background behind {object}',  // 🔴 使用官方背景模糊标准句式
        description: (target) => `blur the background behind {object}`,
        category: 'local',
        label: 'Blur Background'
    },
    'adjust_lighting': {
        template: 'adjust lighting on {object}',  // 🔴 采用官方光照调整标准格式
        description: (target) => `adjust lighting on {object}`,
        category: 'local',
        label: 'Adjust Lighting'
    },
    'resize_object': {
        template: 'make {object} {target} size',  // 🔴 使用官方尺寸调整句式
        description: (target) => `make {object} ${target || 'larger'} size`,
        category: 'local',
        label: 'Resize Object'
    },
    'enhance_skin_texture': {
        template: 'enhance {object} skin texture',  // 🔴 采用官方皮肤纹理专业表达
        description: (target) => `enhance {object} skin texture`,
        category: 'local',
        label: 'Enhance Skin Texture'
    },
    // 🔴 新增局部编辑模板 (L16-L18)
    'character_expression': {
        template: 'make the person {target}',  // 🔴 新增：基于官方193次角色表情指令
        description: (target) => `make the person ${target || 'smile'}`,
        category: 'local',
        label: 'Character Expression'
    },
    'character_hair': {
        template: 'give the person {target} hair',  // 🔴 新增：基于官方87次发型编辑指令
        description: (target) => `give the person ${target || 'blonde'} hair`,
        category: 'local',
        label: 'Character Hair'
    },
    'character_accessories': {
        template: 'give the person {target}',  // 🔴 新增：基于官方65次配饰指令
        description: (target) => `give the person ${target || 'glasses'}`,
        category: 'local',
        label: 'Character Accessories'
    },

    // 全局编辑模板 (G01-G12) - 🔴 Flux Kontext优化
    'global_color_grade': {
        template: 'apply {target} color grading to entire image',  // 🔴 采用官方"apply to"专业术语
        description: (target) => `apply ${target || 'cinematic'} color grading to entire image`,
        category: 'global',
        label: 'Color Grading'
    },
    'global_style_transfer': {
        template: 'turn entire image into {target} style',  // 🔴 使用官方"turn into"全图转换
        description: (target) => `turn entire image into ${target || 'vintage'} style`,
        category: 'global',
        label: 'Style Transfer'
    },
    'global_brightness_contrast': {
        template: 'adjust image brightness and contrast to {target}',  // 🔴 采用官方"adjust to"格式
        description: (target) => `adjust image brightness and contrast to ${target || 'high'}`,
        category: 'global',
        label: 'Brightness & Contrast'
    },
    'global_hue_saturation': {
        template: 'change image hue and saturation to {target}',  // 🔴 使用官方"change to"色彩术语
        description: (target) => `change image hue and saturation to ${target || 'vibrant'}`,
        category: 'global',
        label: 'Hue & Saturation'
    },
    'global_sharpen_blur': {
        template: 'apply {target} sharpening to entire image',  // 🔴 采用官方"apply"锐化表达
        description: (target) => `apply ${target || 'strong'} sharpening to entire image`,
        category: 'global',
        label: 'Sharpen/Blur'
    },
    'global_noise_reduction': {
        template: 'reduce noise in entire image',  // 🔴 使用官方降噪简洁表达
        description: (target) => `reduce noise in entire image`,
        category: 'global',
        label: 'Noise Reduction'
    },
    'global_enhance': {
        template: 'enhance entire image quality',  // 🔴 采用官方质量增强术语
        description: (target) => `enhance entire image quality`,
        category: 'global',
        label: 'Global Enhance'
    },
    'global_filter': {
        template: 'apply {target} filter to entire image',  // 🔴 使用官方滤镜标准句式
        description: (target) => `apply ${target || 'sepia'} filter to entire image`,
        category: 'global',
        label: 'Filter Effect'
    },
    // 🔴 新增全局编辑模板 (G09-G12)
    'character_age': {
        template: 'make the person look {target}',  // 🔴 新增：基于官方43次年龄编辑指令
        description: (target) => `make the person look ${target || 'older'}`,
        category: 'global',
        label: 'Character Age'
    },
    'detail_enhance': {
        template: 'add more details to {object}',  // 🔴 新增：基于官方56次细节增强指令
        description: (target) => `add more details to ${target || 'the background'}`,
        category: 'global',
        label: 'Detail Enhance'
    },
    'realism_enhance': {
        template: 'make {object} more realistic',  // 🔴 新增：基于官方34次真实感指令
        description: (target) => `make ${target || 'the portrait'} more realistic`,
        category: 'global',
        label: 'Realism Enhance'
    },
    'camera_operation': {
        template: 'zoom out and show {target}',  // 🔴 新增：基于官方28次镜头操作指令
        description: (target) => `zoom out and show ${target || 'full body'}`,
        category: 'global',
        label: 'Camera Operation'
    },

    // 文字编辑模板 (T01-T05) - 🔴 全新类型
    'text_add': {
        template: 'add text saying "{target}"',  // 🔴 新增：基于官方92次text相关指令
        description: (target) => `add text saying "${target || 'Hello World'}"`,
        category: 'text',
        label: 'Add Text'
    },
    'text_remove': {
        template: 'remove the text',  // 🔴 新增：基于官方48次text删除指令
        description: (target) => `remove the text`,
        category: 'text',
        label: 'Remove Text'
    },
    'text_edit': {
        template: 'change the text to "{target}"',  // 🔴 新增：基于官方31次text编辑指令
        description: (target) => `change the text to "${target || 'Welcome'}"`,
        category: 'text',
        label: 'Edit Text'
    },
    'text_resize': {
        template: 'make the text {target} size',  // 🔴 新增：基于官方18次text大小指令
        description: (target) => `make the text ${target || 'bigger'} size`,
        category: 'text',
        label: 'Resize Text'
    },
    'object_combine': {
        template: 'combine {object} with {target}',  // 🔴 新增：基于官方21次组合指令
        description: (target) => `combine {object} with ${target || 'the background'}`,
        category: 'text',
        label: 'Object Combine'
    },

    // 专业操作模板 (P01-P14) - 🔴 Flux Kontext优化
    'geometric_warp': {
        template: 'apply {target} geometric transformation to {object}',  // 🔴 采用官方"apply transformation"术语
        description: (target) => `apply ${target || 'perspective'} geometric transformation to {object}`,
        category: 'professional',
        label: 'Geometric Warp'
    },
    'perspective_transform': {
        template: 'transform {object} perspective to {target}',  // 🔴 使用官方"transform to"格式
        description: (target) => `transform {object} perspective to ${target || 'frontal'}`,
        category: 'professional',
        label: 'Perspective Transform'
    },
    'lens_distortion': {
        template: 'apply {target} lens distortion to {object}',  // 🔴 采用官方镜头畸变专业术语
        description: (target) => `apply ${target || 'barrel'} lens distortion to {object}`,
        category: 'professional',
        label: 'Lens Distortion'
    },
    'global_perspective': {
        template: 'correct perspective of entire image',  // 🔴 使用官方透视校正表达
        description: (target) => `correct perspective of entire image`,
        category: 'professional',
        label: 'Global Perspective'
    },
    'content_aware_fill': {
        template: 'remove {object} and fill with surrounding content',  // 🔴 采用官方"remove and fill"句式
        description: (target) => `remove {object} and fill with surrounding content`,
        category: 'professional',
        label: 'Content-Aware Fill'
    },
    'seamless_removal': {
        template: 'seamlessly remove {object}',  // 🔴 使用官方"seamlessly remove"表达
        description: (target) => `seamlessly remove {object}`,
        category: 'professional',
        label: 'Seamless Removal'
    },
    'smart_patch': {
        template: 'patch {object} area with smart content',  // 🔴 采用官方"patch with"术语
        description: (target) => `patch {object} area with smart content`,
        category: 'professional',
        label: 'Smart Patch'
    },
    'style_blending': {
        template: 'blend {object} with {target} style',  // 🔴 使用官方"blend with"句式
        description: (target) => `blend {object} with ${target || 'oil painting'} style`,
        category: 'professional',
        label: 'Style Blending'
    },
    'collage_integration': {
        template: 'integrate {object} into {target} composition',  // 🔴 采用官方"integrate into"表达
        description: (target) => `integrate {object} into ${target || 'artistic'} composition`,
        category: 'professional',
        label: 'Collage Integration'
    },
    'texture_mixing': {
        template: 'mix {object} texture with {target}',  // 🔴 使用官方"mix with"简洁格式
        description: (target) => `mix {object} texture with ${target || 'metal'}`,
        category: 'professional',
        label: 'Texture Mixing'
    },
    'precision_cutout': {
        template: 'precisely cut out {object}',  // 🔴 采用官方"cut out"标准术语
        description: (target) => `precisely cut out {object}`,
        category: 'professional',
        label: 'Precision Cutout'
    },
    'alpha_composite': {
        template: 'composite {object} onto {target}',  // 🔴 使用官方"composite onto"表达
        description: (target) => `composite {object} onto ${target || 'new background'}`,
        category: 'professional',
        label: 'Alpha Composite'
    },
    'mask_feathering': {
        template: 'apply soft feathering to {object} edges',  // 🔴 采用官方羽化专业术语
        description: (target) => `apply soft feathering to {object} edges`,
        category: 'professional',
        label: 'Mask Feathering'
    },
    'depth_composite': {
        template: 'composite {object} with depth blending',  // 🔴 使用官方深度合成术语
        description: (target) => `composite {object} with depth blending`,
        category: 'professional',
        label: 'Depth Composite'
    },

    // 新增：来自kontext-presets的操作模板
    'zoom_focus': {
        template: 'zoom {target} of {object}',
        description: (target) => `zoom ${target || 'close-up'} of {object}`,
        category: 'local',
        label: 'Zoom Focus'
    },
    'stylize_local': {
        template: 'stylize {object} into {target} style',
        description: (target) => `stylize {object} into ${target || 'artistic'} style`,
        category: 'local',
        label: 'Stylize Local'
    },
    'relight_scene': {
        template: 'relight the scene with {target}',
        description: (target) => `relight the scene with ${target || 'professional lighting'}`,
        category: 'global',
        label: 'Relight Scene'
    },
    'colorize_image': {
        template: 'colorize the image with {target}',
        description: (target) => `colorize the image with ${target || 'natural colors'}`,
        category: 'global',
        label: 'Colorize Image'
    },
    'teleport_context': {
        template: 'teleport to {target} context',
        description: (target) => `teleport to ${target || 'different location'} context`,
        category: 'global',
        label: 'Teleport Context'
    },
    'professional_product': {
        template: 'create professional product photo with {target}',
        description: (target) => `create professional product photo with ${target || 'catalog quality'}`,
        category: 'professional',
        label: 'Professional Product'
    },
    'custom': {
        template: '{target}',
        description: (target) => target || 'Apply custom modification to the selected region',
        category: 'local',
        label: 'Custom Operation'
    }
};

// Enhanced Constraint System - High-quality prompt data
export const CONSTRAINT_PROMPTS = {
    
    // === 🎨 Appearance Transformation Constraints ===
    'change_color': [
        'preserve original material textures (fabric weave, skin pores, surface roughness)',
        'maintain consistent lighting reflections and shadows on the recolored surface',
        'avoid color bleeding into adjacent objects or areas',
        'keep the same level of saturation and brightness relative to scene lighting'
    ],
    
    'replace_object': [
        'match the exact perspective angle and viewing direction of the original object',
        'replicate the lighting direction, intensity, and color temperature from the scene',
        'scale the replacement to maintain realistic proportional relationships',
        'integrate cast shadows that match the scene\'s lighting conditions'
    ],
    
    'change_style': [
        'preserve the object\'s fundamental geometric structure and proportions',
        'maintain recognizable key features while applying stylistic elements',
        'ensure the style change doesn\'t conflict with the surrounding realistic environment',
        'keep edge transitions smooth to avoid jarring visual breaks'
    ],

    // === 👤 Character Editing Constraints ===
    'change_expression': [
        'maintain bilateral facial symmetry and natural muscle movement patterns',
        'preserve individual facial features and bone structure characteristics',
        'ensure expression changes follow realistic facial anatomy constraints',
        'keep eye contact direction and gaze focus consistent with the original'
    ],
    
    'change_clothing': [
        'ensure fabric draping follows realistic physics and body contours',
        'match clothing style to the person\'s age, body type, and occasion context',
        'maintain proper color harmony with skin tone and surrounding environment',
        'preserve original body proportions visible through clothing fit'
    ],
    
    'change_pose': [
        'follow human anatomical joint limitations and natural range of motion',
        'maintain realistic weight distribution and balance points',
        'preserve muscle tension consistency throughout the pose change',
        'ensure the new pose fits logically within the environmental context'
    ],

    // === 🏗️ Scene Editing Constraints ===
    'change_background': [
        'match atmospheric perspective depth cues (color temperature, contrast fading)',
        'align lighting direction and color temperature with the new environment',
        'preserve edge quality and natural interaction between subject and background',
        'maintain consistent scale relationships between foreground and background elements'
    ],
    
    'add_object': [
        'calculate correct size based on distance and perspective in the scene',
        'replicate existing lighting conditions including shadows and reflections',
        'ensure the added object doesn\'t violate physical space occupancy',
        'match the visual style and quality level of existing scene elements'
    ],
    
    'remove_object': [
        'analyze surrounding patterns and textures for coherent reconstruction',
        'maintain continuous perspective lines and vanishing points',
        'preserve lighting gradients and shadow patterns in the filled area',
        'avoid creating impossible spatial configurations'
    ],

    // === 📐 Geometric Transformation Constraints ===
    'resize_object': [
        'maintain pixel quality and avoid interpolation artifacts during scaling',
        'adjust shadow size and casting angle proportionally to the new scale',
        'preserve relative positioning within the scene\'s spatial hierarchy',
        'ensure the resized object doesn\'t create unrealistic proportional relationships'
    ],
    
    'adjust_lighting': [
        'respect the object\'s surface material properties (reflectivity, translucency)',
        'maintain consistent color temperature with other light sources in the scene',
        'calculate realistic shadow casting based on the new lighting direction',
        'preserve fine surface details while adjusting overall illumination'
    ],

    // === 🌍 Global Editing Constraints ===
    'global_color_grade': [
        'maintain natural skin tone accuracy across all human subjects',
        'preserve important detail visibility in shadows and highlights',
        'keep color relationships harmonious and avoid unrealistic color casts',
        'maintain adequate contrast for visual clarity and depth perception'
    ],
    
    'global_style_transfer': [
        'preserve essential compositional elements and focal point hierarchy',
        'maintain sufficient detail for important visual information',
        'ensure style application doesn\'t compromise image readability',
        'keep the artistic transformation appropriate to the original subject matter'
    ],
    
    'enhance_quality': [
        'avoid over-sharpening that creates unrealistic edge halos',
        'balance noise reduction with preservation of fine texture details',
        'maintain natural color saturation levels without over-enhancement',
        'preserve the original photographic character and authenticity'
    ],

    // === 📝 Text Editing Constraints ===
    'text_add': [
        'choose typography that matches the image\'s aesthetic and historical period',
        'ensure text readability against the background through appropriate contrast',
        'position text to enhance rather than obstruct important visual elements',
        'scale text appropriately for the image resolution and viewing context'
    ],
    
    'text_remove': [
        'analyze underlying textures and patterns for seamless reconstruction',
        'maintain consistent lighting and shadow patterns where text was removed',
        'preserve any important visual information that might be behind the text',
        'avoid creating obvious rectangular patches or unnatural texture transitions'
    ],
    
    'text_edit': [
        'match the original text\'s font characteristics (style, weight, spacing)',
        'maintain the same text placement and alignment principles',
        'preserve original color relationships and text treatment effects',
        'ensure new text length fits appropriately within the available space'
    ],

    // === 🔧 Professional Operations Constraints ===
    'content_aware_fill': [
        'analyze multiple surrounding areas for consistent pattern sampling',
        'maintain natural randomness to avoid obvious repetitive patterns',
        'preserve lighting gradients and directional texture flows',
        'ensure filled content doesn\'t create impossible visual contradictions'
    ],
    
    'perspective_transform': [
        'maintain straight lines that should remain straight in the corrected view',
        'preserve proportional relationships between architectural elements',
        'ensure the transformation doesn\'t create impossible geometric configurations',
        'maintain realistic viewing angles that follow optical physics principles'
    ],
    
    'default': []
};

// Enhanced Decorative System - High-quality aesthetic prompts
export const DECORATIVE_PROMPTS = {
    
    // === 🎨 Appearance Transformation Aesthetic Enhancement ===
    'change_color': [
        'apply color harmony principles (complementary, analogous, or triadic schemes)',
        'enhance color vibrancy while maintaining natural appearance',
        'create smooth color transitions with subtle gradient effects',
        'optimize color balance to create visual interest and focal emphasis'
    ],
    
    'replace_object': [
        'ensure the replacement enhances the overall compositional balance',
        'create natural visual flow and eye movement through the scene',
        'optimize size and placement for golden ratio proportional relationships',
        'enhance narrative coherence and emotional impact of the scene'
    ],
    
    'change_style': [
        'apply sophisticated artistic interpretation with masterful technique',
        'create visually striking style adaptation that enhances artistic appeal',
        'maintain elegant balance between stylization and recognizability',
        'develop rich visual texture and depth through style application'
    ],

    // === 👤 Character Editing Aesthetic Enhancement ===
    'change_expression': [
        'create authentic emotional resonance and human connection',
        'enhance natural facial attractiveness through subtle refinements',
        'develop expressive depth that conveys compelling personality',
        'optimize facial harmony and symmetry for maximum visual appeal'
    ],
    
    'change_clothing': [
        'apply fashion design principles for stylistic sophistication',
        'enhance body silhouette and proportional attractiveness',
        'create color coordination that complements skin tone and environment',
        'develop texture richness and fabric authenticity for visual luxury'
    ],
    
    'change_pose': [
        'create dynamic energy and graceful movement flow',
        'enhance body language communication and emotional expression',
        'optimize proportional relationships for maximum visual appeal',
        'develop compelling gesture language that enhances narrative impact'
    ],

    // === 🏗️ Scene Editing Aesthetic Enhancement ===
    'change_background': [
        'create atmospheric depth and environmental mood enhancement',
        'develop rich contextual storytelling through environmental design',
        'optimize compositional framing and negative space utilization',
        'enhance emotional resonance through environmental psychology principles'
    ],
    
    'add_object': [
        'enhance compositional interest and visual narrative richness',
        'create natural focal point hierarchy and eye movement guidance',
        'develop contextual storytelling through thoughtful object selection',
        'optimize spatial relationships for maximum visual harmony'
    ],
    
    'remove_object': [
        'create cleaner, more focused compositional emphasis',
        'enhance visual simplicity and elegant minimalism',
        'optimize spatial flow and negative space relationships',
        'develop improved visual hierarchy and focal point clarity'
    ],

    // === 📐 Geometric Transformation Aesthetic Enhancement ===
    'resize_object': [
        'optimize proportional relationships for golden ratio harmony',
        'enhance visual weight distribution and compositional balance',
        'create improved focal point emphasis through strategic sizing',
        'develop better spatial rhythm and visual flow patterns'
    ],
    
    'adjust_lighting': [
        'create dramatic chiaroscuro effects for emotional depth',
        'enhance three-dimensional form modeling and sculptural quality',
        'develop atmospheric mood through sophisticated lighting design',
        'optimize highlight and shadow relationships for maximum visual impact'
    ],

    // === 🌍 Global Editing Aesthetic Enhancement ===
    'global_color_grade': [
        'create cinematic color palette with professional film-grade quality',
        'develop rich tonal depth and sophisticated color relationships',
        'enhance emotional impact through color psychology principles',
        'optimize visual hierarchy through strategic color emphasis'
    ],
    
    'global_style_transfer': [
        'create artistic masterpiece quality with sophisticated aesthetic vision',
        'develop unique visual identity through creative style interpretation',
        'enhance cultural and artistic significance through style application',
        'optimize creative expression while maintaining compositional excellence'
    ],
    
    'enhance_quality': [
        'achieve crystal-clear professional photography standards',
        'enhance fine detail definition for maximum visual clarity',
        'develop rich texture depth and tactile visual quality',
        'optimize dynamic range for stunning visual impact'
    ],

    // === 📝 Text Editing Aesthetic Enhancement ===
    'text_add': [
        'apply professional typography design principles for maximum readability',
        'create elegant text integration that enhances overall composition',
        'develop appropriate visual hierarchy through font size and weight relationships',
        'optimize color contrast and spatial relationships for visual harmony'
    ],
    
    'text_remove': [
        'create seamless visual flow without textual interruption',
        'enhance compositional purity and visual elegance',
        'optimize spatial relationships and negative space utilization',
        'develop cleaner aesthetic focus on core visual elements'
    ],
    
    'text_edit': [
        'enhance textual communication clarity and visual impact',
        'create improved typographic sophistication and professional appearance',
        'optimize text readability while maintaining aesthetic integration',
        'develop consistent visual branding and stylistic coherence'
    ],

    // === 🔧 Professional Operations Aesthetic Enhancement ===
    'content_aware_fill': [
        'create invisible, seamless reconstruction with natural organic flow',
        'enhance overall compositional integrity and visual coherence',
        'develop rich textural authenticity and surface quality',
        'optimize spatial relationships for improved visual harmony'
    ],
    
    'perspective_transform': [
        'create architectural elegance and geometric precision',
        'enhance spatial clarity and dimensional accuracy',
        'develop professional architectural photography quality',
        'optimize viewing angle for maximum visual impact and clarity'
    ],
    
    'default': []
};

/**
 * 根据分类获取模板选项
 */
export function getTemplatesByCategory(category) {
    
    if (!TEMPLATE_CATEGORIES[category]) {
        console.warn(`Category ${category} not found in TEMPLATE_CATEGORIES`);
        return [];
    }
    
    const categoryData = TEMPLATE_CATEGORIES[category];
    
    const result = categoryData.templates.map(templateId => {
        const template = OPERATION_TEMPLATES[templateId];
        // 处理模板
        return {
            id: templateId,
            label: template?.label || templateId,
            template: template
        };
    });
    
    return result;
}

/**
 * 更新操作类型选择器
 */
export function updateOperationTypeSelect(selectElement, category) {
    if (!selectElement) {
        console.warn('selectElement is null, cannot update');
        return;
    }
    
    // 清空现有选项
    selectElement.innerHTML = '';
    
    const templates = getTemplatesByCategory(category);
    
    templates.forEach(({ id, label }) => {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = label;
        selectElement.appendChild(option);
    });
    
    // 显式设置默认选中第一个选项
    if (templates.length > 0) {
        selectElement.value = templates[0].id;
    }
    
    // 操作类型选择器更新完成
}

/**
 * 获取画布坐标
 */
export function getCanvasCoordinates(e, element) {
    const rect = element.getBoundingClientRect();
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}

/**
 * 创建SVG元素
 */
export function createSVGElement(type, attributes = {}) {
    const element = document.createElementNS('http://www.w3.org/2000/svg', type);
    Object.entries(attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
    });
    return element;
}

/**
 * 生成唯一ID
 */
export function generateId(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 样式应用辅助函数
 */
export const applyStyles = (element, styleObject) => {
    Object.entries(styleObject).forEach(([property, value]) => {
        element.style[property] = value;
    });
};

/**
 * 图像缓存管理器 - 避免重复加载相同图像
 * 🚀 优化版本：降低内存限制，增强清理机制
 */
export class ImageCache {
    constructor(maxSize = 10, maxMemoryMB = 50) {
        this.cache = new Map(); // URL -> {fabricImage, timestamp, size}
        this.loadingPromises = new Map(); // URL -> Promise
        this.maxSize = maxSize;
        this.maxMemoryBytes = maxMemoryMB * 1024 * 1024;
        this.currentMemoryUsage = 0;
        this.accessCount = new Map(); // URL -> 访问次数
        
        console.log(`🖼️ ImageCache initialized - Max: ${maxSize} images, ${maxMemoryMB}MB`);
    }

    /**
     * 获取图像，优先从缓存获取
     */
    async getImage(url) {
        if (this.cache.has(url)) {
            const cached = this.cache.get(url);
            cached.timestamp = Date.now();
            
            // 🚀 更新访问计数
            const count = this.accessCount.get(url) || 0;
            this.accessCount.set(url, count + 1);
            
            console.log(`✨ Image cache hit: ${url.substring(url.lastIndexOf('/') + 1)} (accessed ${count + 1} times)`);
            return this._cloneFabricImage(cached.fabricImage);
        }

        if (this.loadingPromises.has(url)) {
            console.log(`⏳ Image loading in progress: ${url.substring(url.lastIndexOf('/') + 1)}`);
            return this.loadingPromises.get(url);
        }

        // 加载新图像
        console.log(`📥 Loading new image: ${url.substring(url.lastIndexOf('/') + 1)}`);
        const promise = this._loadImageFromURL(url);
        this.loadingPromises.set(url, promise);

        try {
            const fabricImage = await promise;
            this._cacheImage(url, fabricImage);
            this.loadingPromises.delete(url);
            return this._cloneFabricImage(fabricImage);
        } catch (error) {
            this.loadingPromises.delete(url);
            throw error;
        }
    }

    /**
     * 从URL加载Fabric.js图像
     */
    _loadImageFromURL(url) {
        return new Promise((resolve, reject) => {
            if (typeof fabric === 'undefined' || !fabric.Image) {
                reject(new Error('Fabric.js not available'));
                return;
            }

            fabric.Image.fromURL(url, (fabricImage) => {
                if (fabricImage) {
                    resolve(fabricImage);
                } else {
                    reject(new Error(`Failed to load image: ${url}`));
                }
            }, {
                crossOrigin: 'anonymous'
            });
        });
    }

    /**
     * 缓存图像（带内存管理）
     */
    _cacheImage(url, fabricImage) {
        const imageSize = this._estimateImageSize(fabricImage);
        
        this._ensureMemoryLimit(imageSize);
        
        if (this.cache.size >= this.maxSize) {
            this._evictLRU();
        }

        this.cache.set(url, {
            fabricImage: fabricImage,
            timestamp: Date.now(),
            size: imageSize
        });
        
        // 🚀 初始化访问计数
        this.accessCount.set(url, 1);
        
        this.currentMemoryUsage += imageSize;
        console.log(`💾 Image cached: ${url.substring(url.lastIndexOf('/') + 1)} (${this._formatSize(imageSize)}) - Total: ${this.cache.size} images, ${this._formatSize(this.currentMemoryUsage)}`);
    }

    /**
     * 克隆Fabric图像对象（避免引用问题）
     */
    _cloneFabricImage(originalImage) {
        return new Promise((resolve) => {
            originalImage.clone((clonedImage) => {
                resolve(clonedImage);
            });
        });
    }

    /**
     * 估算图像内存占用
     */
    _estimateImageSize(fabricImage) {
        const width = fabricImage.width || 800;
        const height = fabricImage.height || 600;
        return width * height * 4; // RGBA 4 bytes per pixel
    }

    /**
     * 确保内存使用不超过限制
     */
    _ensureMemoryLimit(newImageSize) {
        while (this.currentMemoryUsage + newImageSize > this.maxMemoryBytes && this.cache.size > 0) {
            this._evictLRU();
        }
    }

    /**
     * 清理最久未使用的图像（LRU + 访问频率优化）
     * 🚀 智能清理：优先清理访问次数少且最久未使用的图像
     */
    _evictLRU() {
        let worstUrl = null;
        let worstScore = Infinity;

        for (const [url, data] of this.cache) {
            const accessCount = this.accessCount.get(url) || 1;
            const age = Date.now() - data.timestamp;
            // 计算清理分数：年龄 / 访问次数（访问次数越少、年龄越大越容易被清理）
            const score = age / accessCount;
            
            if (score < worstScore) {
                worstScore = score;
                worstUrl = url;
            }
        }

        if (worstUrl) {
            const evicted = this.cache.get(worstUrl);
            this.cache.delete(worstUrl);
            this.accessCount.delete(worstUrl);
            this.currentMemoryUsage -= evicted.size;
            const accessCount = this.accessCount.get(worstUrl) || 1;
            console.log(`🗑️ Evicted image: ${worstUrl.substring(worstUrl.lastIndexOf('/') + 1)} (${this._formatSize(evicted.size)}, accessed ${accessCount} times)`);
        }
    }

    /**
     * 清除指定URL的缓存
     */
    invalidate(url) {
        if (this.cache.has(url)) {
            const cached = this.cache.get(url);
            this.cache.delete(url);
            this.accessCount.delete(url);
            this.currentMemoryUsage -= cached.size;
            console.log(`❌ Cache invalidated: ${url.substring(url.lastIndexOf('/') + 1)}`);
        }
    }

    /**
     * 清空所有缓存
     * 🚀 增强版本：彻底清理所有引用
     */
    clear() {
        const count = this.cache.size;
        const memory = this.currentMemoryUsage;
        
        // 🚀 清理所有图像对象的引用
        for (const [url, data] of this.cache) {
            if (data.fabricImage && data.fabricImage._element) {
                data.fabricImage._element.src = '';
                data.fabricImage._element = null;
            }
        }
        
        this.cache.clear();
        this.accessCount.clear();
        this.loadingPromises.clear();
        this.currentMemoryUsage = 0;
        console.log(`🧹 Cache cleared: ${count} images, ${this._formatSize(memory)} freed`);
    }

    /**
     * 格式化文件大小显示
     */
    _formatSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
}

// 全局图像缓存实例
export const globalImageCache = new ImageCache();

/**
 * 通知显示函数 - 增强版
 */
export class KontextUtils {
    static showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        
        // 应用统一的通知样式
        applyStyles(notification, MODAL_STYLES.notification);
        notification.style.zIndex = Z_INDEX.OVERLAY;
        notification.style.background = type === 'success' ? '#4CAF50' : 
                                      type === 'warning' ? '#FF9800' : 
                                      type === 'error' ? '#f44336' : '#2196F3';
        
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, duration);
    }

    static createTooltip(element, text) {
        const tooltip = document.createElement('div');
        tooltip.className = 'kontext-tooltip';
        tooltip.textContent = text;
        document.body.appendChild(tooltip);
        
        element.addEventListener('mouseenter', () => {
            const rect = element.getBoundingClientRect();
            tooltip.style.left = rect.left + 'px';
            tooltip.style.top = (rect.bottom + 5) + 'px';
            tooltip.classList.add('show');
        });
        
        element.addEventListener('mouseleave', () => {
            tooltip.classList.remove('show');
        });
        
        return tooltip;
    }
}

/**
 * 计算两点距离
 */
export function calculateDistance(point1, point2) {
    return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
}

/**
 * 限制数值范围
 */
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/**
 * 检查点是否在矩形内
 */
export function isPointInRect(point, rect) {
    return point.x >= rect.x && point.x <= rect.x + rect.width &&
           point.y >= rect.y && point.y <= rect.y + rect.height;
}

/**
 * 将鼠标坐标转换为SVG viewBox坐标 - 避免transform累积问题
 */
export function mouseToSVGCoordinates(e, modal) {
    
    const coordinateSystem = getCoordinateSystem(modal);
    return coordinateSystem.mouseToSVGCoords(e.clientX, e.clientY);
}

/**
 * 从节点widget获取图像
 */
export function getImageFromWidget(nodeInstance) {
    try {
        if (!nodeInstance) {
            return null;
        }
        
        const imageWidget = nodeInstance.widgets?.find(w => 
            w.name === 'image' || w.name === 'filename' || w.name === 'file'
        );
        
        if (imageWidget && imageWidget.value) {
            const imageUrl = `/view?filename=${encodeURIComponent(imageWidget.value)}`;
            return imageUrl;
        }
        
        return null;
    } catch (e) {
        console.error('Failed to get image from widget:', e);
        return null;
    }
}

// 🧠 智能提示词推理系统 - 基于模型推理的用户意图理解
export class IntelligentPromptReasoning {
    constructor() {
        this.contextCache = new Map();
        this.userBehaviorHistory = [];
        this.scenarioKeywords = {
            portrait: ['face', 'person', 'human', 'head', 'eyes', 'hair', 'skin', 'smile', 'expression', 'selfie', 'headshot'],
            product: ['product', 'item', 'object', 'brand', 'commercial', 'catalog', 'showcase', 'market', 'sell', 'buy'],
            creative: ['art', 'artistic', 'creative', 'design', 'style', 'abstract', 'conceptual', 'imagination', 'fantasy', 'surreal'],
            social: ['social', 'share', 'instagram', 'facebook', 'story', 'post', 'friend', 'party', 'event', 'celebration'],
            professional: ['business', 'corporate', 'work', 'office', 'meeting', 'presentation', 'document', 'report', 'formal']
        };
    }

    /**
     * 分析用户真实编辑意图和场景
     */
    analyzeUserIntent(modal, selectedAnnotations = [], operationType = '', targetDescription = '') {
        console.log('🧠 智能推理：开始分析用户编辑意图...');
        
        // 1. 分析图像内容和元数据
        const imageContext = this.analyzeImageContext(modal);
        
        // 2. 分析用户选择行为模式
        const behaviorPattern = this.analyzeBehaviorPattern(selectedAnnotations, operationType);
        
        // 3. 分析目标描述的语义特征
        const semanticIntent = this.analyzeSemanticIntent(targetDescription);
        
        // 4. 综合推理用户场景
        const detectedScenario = this.detectUserScenario(imageContext, behaviorPattern, semanticIntent);
        
        // 5. 生成个性化编辑策略
        const editingStrategy = this.generateEditingStrategy(detectedScenario, operationType, targetDescription);
        
        console.log('🧠 智能推理结果:', {
            scenario: detectedScenario,
            strategy: editingStrategy,
            confidence: editingStrategy.confidence
        });
        
        return {
            scenario: detectedScenario,
            strategy: editingStrategy,
            recommendations: this.generateRecommendations(detectedScenario, editingStrategy)
        };
    }

    /**
     * 分析图像上下文 - 理解图像内容和视觉特征
     */
    analyzeImageContext(modal) {
        const imageElement = modal.querySelector('#uploaded-image');
        // Transform-First架构：移除废弃的annotations分析
        const annotationAnalysis = { patterns: [], types: {} };
        
        // 分析图像尺寸比例（推断用途）
        let aspectRatioIntent = 'unknown';
        if (imageElement) {
            const aspectRatio = imageElement.naturalWidth / imageElement.naturalHeight;
            if (aspectRatio > 1.5) aspectRatioIntent = 'landscape_social'; // 横向，适合社交媒体
            else if (aspectRatio < 0.8) aspectRatioIntent = 'portrait_mobile'; // 竖向，适合移动端
            else aspectRatioIntent = 'square_product'; // 方形，适合产品展示
        }
        
        return {
            annotationPatterns: annotationAnalysis,
            aspectRatioIntent: aspectRatioIntent,
            complexityLevel: annotations.length > 5 ? 'complex' : annotations.length > 2 ? 'medium' : 'simple'
        };
    }

    /**
     * 分析标注模式 - 理解用户标注行为
     */
    analyzeAnnotationPatterns(annotations) {
        const patterns = {
            focusAreas: [], // 重点关注区域
            editingComplexity: 'simple', // 编辑复杂度
            intentSignals: [] // 意图信号
        };
        
        // 分析标注集中度（判断是局部精修还是全局调整）
        if (annotations.length === 1) {
            patterns.editingComplexity = 'focused'; // 专注单一对象
            patterns.intentSignals.push('precision_editing');
        } else if (annotations.length <= 3) {
            patterns.editingComplexity = 'moderate'; // 适度调整
            patterns.intentSignals.push('selective_editing');
        } else {
            patterns.editingComplexity = 'comprehensive'; // 全面编辑
            patterns.intentSignals.push('major_transformation');
        }
        
        // 分析标注颜色使用模式（推断用户心理状态）
        const colors = annotations.map(ann => ann.color);
        const uniqueColors = [...new Set(colors)];
        if (uniqueColors.length === 1) {
            patterns.intentSignals.push('systematic_approach'); // 系统化方法
        } else {
            patterns.intentSignals.push('exploratory_approach'); // 探索性方法
        }
        
        return patterns;
    }

    /**
     * 分析用户行为模式 - 理解编辑习惯和偏好
     */
    analyzeBehaviorPattern(selectedAnnotations, operationType) {
        // 记录用户行为到历史
        this.userBehaviorHistory.push({
            timestamp: Date.now(),
            operationType: operationType,
            selectionCount: selectedAnnotations.length,
            hasCustomDescription: selectedAnnotations.some(ann => ann.description && ann.description.trim())
        });
        
        // 保持历史记录在合理范围内
        if (this.userBehaviorHistory.length > 20) {
            this.userBehaviorHistory = this.userBehaviorHistory.slice(-10);
        }
        
        // 分析用户偏好模式
        const recentBehaviors = this.userBehaviorHistory.slice(-5);
        const preferredOperations = this.getMostFrequentOperations(recentBehaviors);
        const editingStyle = this.determineEditingStyle(recentBehaviors);
        
        return {
            preferredOperations: preferredOperations,
            editingStyle: editingStyle, // 'precise', 'creative', 'efficient', 'experimental'
            experienceLevel: this.estimateExperienceLevel(recentBehaviors)
        };
    }

    /**
     * 分析语义意图 - 理解用户描述的深层含义
     */
    analyzeSemanticIntent(targetDescription) {
        if (!targetDescription || !targetDescription.trim()) {
            return { intent: 'undefined', emotionalTone: 'neutral', specificity: 'low' };
        }
        
        const text = targetDescription.toLowerCase();
        
        // 情感色调分析
        let emotionalTone = 'neutral';
        if (text.match(/beautiful|elegant|stunning|gorgeous|amazing|perfect/)) {
            emotionalTone = 'positive_aesthetic';
        } else if (text.match(/remove|delete|eliminate|fix|correct|repair/)) {
            emotionalTone = 'corrective';
        } else if (text.match(/creative|artistic|unique|innovative|experimental/)) {
            emotionalTone = 'creative_exploratory';
        } else if (text.match(/professional|business|clean|formal|corporate/)) {
            emotionalTone = 'professional_focused';
        }
        
        // 特异性分析（描述的具体程度）
        const specificity = text.length > 50 ? 'high' : text.length > 20 ? 'medium' : 'low';
        
        // 意图类别分析
        let intent = 'enhancement';
        if (text.match(/add|create|insert|place/)) intent = 'addition';
        else if (text.match(/change|transform|convert|modify/)) intent = 'transformation';
        else if (text.match(/remove|delete|eliminate/)) intent = 'removal';
        else if (text.match(/enhance|improve|upgrade|optimize/)) intent = 'enhancement';
        
        return {
            intent: intent,
            emotionalTone: emotionalTone,
            specificity: specificity,
            keywords: this.extractKeywords(text)
        };
    }

    /**
     * 检测用户场景 - 综合判断用户的使用场景
     */
    detectUserScenario(imageContext, behaviorPattern, semanticIntent) {
        const scenarios = ['portrait', 'product', 'creative', 'social', 'professional'];
        const scores = {};
        
        // 为每个场景计算匹配度分数
        scenarios.forEach(scenario => {
            scores[scenario] = this.calculateScenarioScore(scenario, imageContext, behaviorPattern, semanticIntent);
        });
        
        // 找到最高分场景
        const bestScenario = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
        const confidence = scores[bestScenario];
        
        // 如果置信度过低，使用默认场景
        if (confidence < 0.3) {
            return { type: 'default', confidence: 0.5 };
        }
        
        return { type: bestScenario, confidence: confidence };
    }

    /**
     * 计算场景匹配分数
     */
    calculateScenarioScore(scenario, imageContext, behaviorPattern, semanticIntent) {
        let score = 0;
        
        // 基于语义关键词的匹配
        const keywords = semanticIntent.keywords || [];
        const scenarioKeywords = this.scenarioKeywords[scenario] || [];
        const keywordMatches = keywords.filter(kw => scenarioKeywords.some(sk => kw.includes(sk) || sk.includes(kw)));
        score += keywordMatches.length * 0.3;
        
        // 基于情感色调的匹配
        if (scenario === 'portrait' && semanticIntent.emotionalTone === 'positive_aesthetic') score += 0.4;
        if (scenario === 'product' && semanticIntent.emotionalTone === 'professional_focused') score += 0.4;
        if (scenario === 'creative' && semanticIntent.emotionalTone === 'creative_exploratory') score += 0.4;
        if (scenario === 'professional' && semanticIntent.emotionalTone === 'professional_focused') score += 0.4;
        
        // 基于编辑复杂度的匹配
        if (scenario === 'creative' && imageContext.complexityLevel === 'complex') score += 0.2;
        if (scenario === 'professional' && behaviorPattern.editingStyle === 'precise') score += 0.3;
        
        // 基于图像比例的匹配
        if (scenario === 'portrait' && imageContext.aspectRatioIntent === 'portrait_mobile') score += 0.3;
        if (scenario === 'product' && imageContext.aspectRatioIntent === 'square_product') score += 0.3;
        if (scenario === 'social' && imageContext.aspectRatioIntent === 'landscape_social') score += 0.3;
        
        return Math.min(score, 1.0); // 确保分数不超过1
    }

    /**
     * 生成编辑策略 - 基于场景推理最佳编辑方案
     */
    generateEditingStrategy(detectedScenario, operationType, targetDescription) {
        const scenario = detectedScenario.type;
        const confidence = detectedScenario.confidence;
        
        // 获取场景特定的模板
        const template = OPERATION_TEMPLATES[operationType];
        if (!template) {
            return { confidence: 0.1, recommendations: ['Use default template'] };
        }
        
        // 生成上下文感知的描述
        let enhancedDescription = targetDescription;
        if (template.description && typeof template.description === 'function') {
            enhancedDescription = template.description(targetDescription, scenario);
        }
        
        // 选择最佳约束条件
        const constraints = this.selectOptimalConstraints(operationType, scenario);
        
        // 选择最佳修饰提示词
        const decoratives = this.selectOptimalDecoratives(operationType, scenario);
        
        return {
            confidence: confidence,
            enhancedDescription: enhancedDescription,
            recommendedConstraints: constraints,
            recommendedDecoratives: decoratives,
            reasoning: this.generateReasoningExplanation(scenario, operationType)
        };
    }

    /**
     * 选择最优约束条件
     */
    selectOptimalConstraints(operationType, scenario) {
        const constraints = CONSTRAINT_PROMPTS[operationType];
        if (!constraints) return [];
        
        if (typeof constraints === 'object' && constraints[scenario]) {
            return constraints[scenario].slice(0, 2); // 选择前2个最重要的约束
        } else if (Array.isArray(constraints)) {
            return constraints.slice(0, 2);
        }
        
        return constraints.default || [];
    }

    /**
     * 选择最优修饰词
     */
    selectOptimalDecoratives(operationType, scenario) {
        const decoratives = DECORATIVE_PROMPTS[operationType];
        if (!decoratives) return [];
        
        if (typeof decoratives === 'object' && decoratives[scenario]) {
            return decoratives[scenario].slice(0, 3); // 选择前3个最重要的修饰词
        } else if (Array.isArray(decoratives)) {
            return decoratives.slice(0, 3);
        }
        
        return decoratives.default || [];
    }

    /**
     * 生成推理说明
     */
    generateReasoningExplanation(scenario, operationType) {
        const explanations = {
            portrait: `Optimized for portrait photography, focusing on human subjects, facial features, and personal appeal`,
            product: `Configured for product photography, emphasizing commercial appeal, quality, and purchase intent`,
            creative: `Designed for artistic expression, supporting creative vision and conceptual depth`,
            social: `Tailored for social media sharing, optimizing engagement and visual appeal`,
            professional: `Calibrated for professional use, ensuring quality standards and specification compliance`,
            default: `Using balanced settings suitable for general editing purposes`
        };
        
        return explanations[scenario] || explanations.default;
    }

    /**
     * 生成智能推荐
     */
    generateRecommendations(detectedScenario, editingStrategy) {
        const recommendations = [];
        
        if (detectedScenario.confidence < 0.6) {
            recommendations.push('Consider adding more specific description to improve AI understanding');
        }
        
        if (editingStrategy.recommendedConstraints.length > 0) {
            recommendations.push(`Applying ${detectedScenario.type}-optimized constraints for better results`);
        }
        
        if (editingStrategy.recommendedDecoratives.length > 0) {
            recommendations.push(`Enhanced with ${detectedScenario.type}-specific aesthetic improvements`);
        }
        
        return recommendations;
    }

    // 辅助方法
    getMostFrequentOperations(behaviors) {
        const operations = behaviors.map(b => b.operationType);
        const frequency = {};
        operations.forEach(op => frequency[op] = (frequency[op] || 0) + 1);
        return Object.keys(frequency).sort((a, b) => frequency[b] - frequency[a]).slice(0, 3);
    }

    determineEditingStyle(behaviors) {
        if (behaviors.length < 3) return 'exploratory';
        
        const avgSelectionCount = behaviors.reduce((sum, b) => sum + b.selectionCount, 0) / behaviors.length;
        const hasCustomDescriptions = behaviors.some(b => b.hasCustomDescription);
        
        if (avgSelectionCount === 1 && hasCustomDescriptions) return 'precise';
        if (avgSelectionCount > 3) return 'comprehensive';
        if (hasCustomDescriptions) return 'creative';
        return 'efficient';
    }

    estimateExperienceLevel(behaviors) {
        if (behaviors.length < 2) return 'beginner';
        
        const hasVariedOperations = new Set(behaviors.map(b => b.operationType)).size > 2;
        const hasCustomDescriptions = behaviors.some(b => b.hasCustomDescription);
        
        if (hasVariedOperations && hasCustomDescriptions) return 'advanced';
        if (hasVariedOperations || hasCustomDescriptions) return 'intermediate';
        return 'beginner';
    }

    extractKeywords(text) {
        // 简单的关键词提取
        return text.split(/\s+/).filter(word => word.length > 3).slice(0, 5);
    }
}

// 创建全局智能推理实例
export const intelligentReasoning = new IntelligentPromptReasoning();

// === SVG Tools (merged from svg_utils.js and svg_creator.js) ===

/**
 * 同步创建箭头marker
 * @param {Element} modal - 模态窗口元素
 * @param {string} color - 颜色
 * @param {number} opacity - 不透明度
 * @returns {string} marker ID
 */
export function createArrowheadMarkerSync(modal, color, opacity) {
    const svg = modal.querySelector('#drawing-layer svg');
    const defs = svg ? svg.querySelector('defs') : null;
    
    if (!defs) {
        console.warn('⚠️ 未找到defs容器，使用默认箭头marker');
        return `arrowhead-${color.replace('#', '')}`;
    }
    
    // 生成唯一的marker ID
    const markerId = `arrowhead-${color.replace('#', '')}-opacity-${Math.round(opacity)}`;
    
    // 检查是否已存在
    const existingMarker = defs.querySelector(`#${markerId}`);
    if (existingMarker) {
        return markerId;
    }
    
    // 创建新的marker
    const marker = createSVGElement('marker', {
        id: markerId,
        markerWidth: '10',
        markerHeight: '7',
        refX: '9',
        refY: '3.5',
        orient: 'auto'
    });
    
    const fillOpacity = Math.min((opacity + 30) / 100, 1.0);
    const polygon = createSVGElement('polygon', {
        points: '0 0, 10 3.5, 0 7',
        fill: color,
        'fill-opacity': fillOpacity.toString()
    });
    
    marker.appendChild(polygon);
    defs.appendChild(marker);
    
    return markerId;
}

/**
 * 应用填充样式到SVG形状
 * @param {SVGElement} shape - SVG形状元素
 * @param {string} color - 颜色
 * @param {string} fillMode - 填充模式 ('fill'|'outline')
 * @param {number} opacity - 不透明度 (0-100)
 */
export function applyFillStyle(shape, color, fillMode, opacity) {
    const normalizedOpacity = Math.max(0, Math.min(100, opacity)) / 100;
    
    if (fillMode === 'fill') {
        shape.setAttribute('fill', color);
        shape.setAttribute('fill-opacity', normalizedOpacity.toString());
        shape.setAttribute('stroke', color);
        shape.setAttribute('stroke-opacity', normalizedOpacity.toString());
        shape.setAttribute('stroke-width', '2');
    } else {
        shape.setAttribute('fill', 'none');
        shape.setAttribute('stroke', color);
        shape.setAttribute('stroke-opacity', normalizedOpacity.toString());
        shape.setAttribute('stroke-width', '3');
    }
}

/**
 * 应用预览样式
 * @param {SVGElement} shape - SVG形状元素
 */
export function applyPreviewStyle(shape) {
    shape.setAttribute('stroke-dasharray', '5,5');
    shape.setAttribute('stroke-opacity', '0.8');
}

/**
 * 获取下一个标注编号
 * @param {Array} annotations - 现有标注数组
 * @returns {number} 下一个编号
 */
export function getNextAnnotationNumber(annotations) {
    if (!annotations || annotations.length === 0) {
        return 1;
    }
    
    const maxNumber = Math.max(...annotations.map(ann => ann.number || 0));
    return maxNumber + 1;
}

/**
 * 添加编号标签
 * @param {SVGElement} svg - SVG容器
 * @param {Object} annotation - 标注对象
 * @param {number} number - 编号
 */
export function addNumberLabel(svg, annotation, number) {
    // 计算标签位置
    let labelX, labelY;
    
    if (annotation.start && annotation.end) {
        labelX = Math.min(annotation.start.x, annotation.end.x) - 5;
        labelY = Math.min(annotation.start.y, annotation.end.y) - 5;
    } else if (annotation.centerPoint) {
        labelX = annotation.centerPoint.x - 10;
        labelY = annotation.centerPoint.y - 10;
    } else {
        return;
    }
    
    // 创建标签背景
    const labelBg = createSVGElement('circle', {
        cx: labelX,
        cy: labelY,
        r: '12',
        fill: annotation.color || '#ff0000',
        'fill-opacity': '0.9',
        stroke: '#ffffff',
        'stroke-width': '2',
        'data-annotation-id': annotation.id,
        'data-label-type': 'background'
    });
    
    // 创建标签文字
    const labelText = createSVGElement('text', {
        x: labelX,
        y: labelY + 4,
        'text-anchor': 'middle',
        'font-family': 'Arial, sans-serif',
        'font-size': '12',
        'font-weight': 'bold',
        fill: '#ffffff',
        'data-annotation-id': annotation.id,
        'data-label-type': 'text'
    });
    
    labelText.textContent = number.toString();
    
    svg.appendChild(labelBg);
    svg.appendChild(labelText);
}

/**
 * SVG注解创建器 (merged from svg_creator.js)
 */
export class SVGAnnotationCreator {
    constructor() {
        this.svgNamespace = 'http://www.w3.org/2000/svg';
    }

    /**
     * 创建矩形SVG元素
     */
    createRectangleElement(annotation, modal) {
        const rect = document.createElementNS(this.svgNamespace, 'rect');
        
        rect.setAttribute('x', Math.min(annotation.start.x, annotation.end.x));
        rect.setAttribute('y', Math.min(annotation.start.y, annotation.end.y));
        rect.setAttribute('width', Math.abs(annotation.end.x - annotation.start.x));
        rect.setAttribute('height', Math.abs(annotation.end.y - annotation.start.y));
        
        this.applyAnnotationStyle(rect, annotation);
        rect.setAttribute('data-annotation-id', annotation.id);
        rect.setAttribute('data-shape-type', 'rectangle');
        
        return rect;
    }

    /**
     * 创建圆形SVG元素
     */
    createCircleElement(annotation, modal) {
        const circle = document.createElementNS(this.svgNamespace, 'circle');
        
        const centerX = (annotation.start.x + annotation.end.x) / 2;
        const centerY = (annotation.start.y + annotation.end.y) / 2;
        const radius = Math.sqrt(
            Math.pow(annotation.end.x - annotation.start.x, 2) + 
            Math.pow(annotation.end.y - annotation.start.y, 2)
        ) / 2;
        
        circle.setAttribute('cx', centerX);
        circle.setAttribute('cy', centerY);
        circle.setAttribute('r', radius);
        
        this.applyAnnotationStyle(circle, annotation);
        circle.setAttribute('data-annotation-id', annotation.id);
        circle.setAttribute('data-shape-type', 'circle');
        
        return circle;
    }

    /**
     * 应用标注样式
     */
    applyAnnotationStyle(element, annotation) {
        const color = annotation.color || '#ff0000';
        const strokeWidth = annotation.strokeWidth || 3;
        
        element.setAttribute('stroke', color);
        element.setAttribute('stroke-width', strokeWidth);
        element.setAttribute('fill', 'none');
        element.setAttribute('stroke-opacity', '0.8');
    }
}

/**
 * 创建SVG注解创建器实例
 */
export function createSVGAnnotationCreator() {
    return new SVGAnnotationCreator();
}

// === 🚀 大图像优化功能 - Kontext专属设计 ===

/**
 * 图像尺寸优化器 - 处理大图像的性能问题
 * Kontext团队原创的display size limiting策略
 */
export class ImageSizeOptimizer {
    constructor(maxDisplaySize = 768) {
        this.maxDisplaySize = maxDisplaySize;
        this.originalImageCache = new Map(); // 缓存原始图像信息
        console.log(`🖼️ ImageSizeOptimizer initialized with max display size: ${maxDisplaySize}px`);
    }

    /**
     * 优化图像尺寸 - LRPG专属的image_size_adjustment策略
     * @param {HTMLImageElement} imageElement - 图像元素
     * @param {Object} options - 选项
     * @returns {Object} 优化结果
     */
    optimizeImageSize(imageElement, options = {}) {
        const {
            preserveAspectRatio = true,
            useCSS = true, // 使用CSS变换而非修改图像数据
            downscaleLarge = true
        } = options;

        const originalWidth = imageElement.naturalWidth;
        const originalHeight = imageElement.naturalHeight;

        // 缓存原始图像信息
        const imageId = imageElement.src || imageElement.id;
        if (imageId && !this.originalImageCache.has(imageId)) {
            this.originalImageCache.set(imageId, {
                width: originalWidth,
                height: originalHeight,
                aspectRatio: originalWidth / originalHeight
            });
        }

        // 判断是否需要优化
        const needsOptimization = downscaleLarge && (
            originalWidth > this.maxDisplaySize || 
            originalHeight > this.maxDisplaySize
        );

        if (!needsOptimization) {
            return {
                optimized: false,
                displayWidth: originalWidth,
                displayHeight: originalHeight,
                scale: 1.0
            };
        }

        // 计算缩放比例
        let scale = 1.0;
        if (preserveAspectRatio) {
            scale = Math.min(
                this.maxDisplaySize / originalWidth,
                this.maxDisplaySize / originalHeight
            );
        } else {
            scale = Math.min(
                this.maxDisplaySize / originalWidth,
                this.maxDisplaySize / originalHeight
            );
        }

        const displayWidth = Math.round(originalWidth * scale);
        const displayHeight = Math.round(originalHeight * scale);

        console.log(`🔍 Image optimization: ${originalWidth}x${originalHeight} -> ${displayWidth}x${displayHeight} (scale: ${scale.toFixed(3)})`);

        if (useCSS) {
            // 使用CSS变换 - LRPG专属策略
            this.applyCSSTransform(imageElement, displayWidth, displayHeight);
        } else {
            // 直接修改图像尺寸（不推荐）
            imageElement.width = displayWidth;
            imageElement.height = displayHeight;
        }

        return {
            optimized: true,
            displayWidth,
            displayHeight,
            scale,
            originalWidth,
            originalHeight
        };
    }

    /**
     * 应用CSS变换 - 保持原始数据但改变显示尺寸
     */
    applyCSSTransform(imageElement, displayWidth, displayHeight) {
        imageElement.style.width = `${displayWidth}px`;
        imageElement.style.height = `${displayHeight}px`;
        imageElement.style.maxWidth = '100%';
        imageElement.style.maxHeight = '100%';
        imageElement.style.objectFit = 'contain';
        imageElement.style.transformOrigin = 'top left';
    }

    /**
     * 恢复原始尺寸
     */
    restoreOriginalSize(imageElement) {
        const imageId = imageElement.src || imageElement.id;
        const originalInfo = this.originalImageCache.get(imageId);
        
        if (originalInfo) {
            imageElement.style.width = '';
            imageElement.style.height = '';
            imageElement.style.maxWidth = '';
            imageElement.style.maxHeight = '';
            imageElement.style.objectFit = '';
            imageElement.style.transform = '';
            
            return {
                width: originalInfo.width,
                height: originalInfo.height
            };
        }
        
        return null;
    }

    /**
     * 创建优化后的图像副本 - 用于导出
     */
    createOptimizedCopy(imageElement, quality = 0.85) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // 使用显示尺寸而非原始尺寸
            const displayWidth = imageElement.clientWidth || imageElement.width;
            const displayHeight = imageElement.clientHeight || imageElement.height;
            
            canvas.width = displayWidth;
            canvas.height = displayHeight;
            
            // 绘制优化后的图像
            ctx.drawImage(imageElement, 0, 0, displayWidth, displayHeight);
            
            // 转换为blob
            canvas.toBlob((blob) => {
                resolve({
                    blob,
                    width: displayWidth,
                    height: displayHeight,
                    url: URL.createObjectURL(blob)
                });
            }, 'image/jpeg', quality);
        });
    }

    /**
     * 清理缓存
     */
    clearCache() {
        this.originalImageCache.clear();
        console.log('🧹 ImageSizeOptimizer cache cleared');
    }
}

/**
 * 图像加载优化器 - 集成尺寸优化和缓存
 */
export class OptimizedImageLoader {
    constructor(options = {}) {
        this.sizeOptimizer = new ImageSizeOptimizer(options.maxDisplaySize);
        this.loadingPromises = new Map();
        this.loadedImages = new Map();
    }

    /**
     * 加载并优化图像
     */
    async loadOptimizedImage(url, options = {}) {
        const {
            useCache = true,
            optimizeSize = true,
            ...optimizerOptions
        } = options;

        // 检查缓存
        if (useCache && this.loadedImages.has(url)) {
            return this.loadedImages.get(url);
        }

        // 避免重复加载
        if (this.loadingPromises.has(url)) {
            return this.loadingPromises.get(url);
        }

        const promise = new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => {
                // 优化尺寸
                if (optimizeSize) {
                    const optimization = this.sizeOptimizer.optimizeImageSize(img, optimizerOptions);
                    img._optimization = optimization;
                }
                
                // 缓存结果
                if (useCache) {
                    this.loadedImages.set(url, img);
                }
                
                this.loadingPromises.delete(url);
                resolve(img);
            };
            
            img.onerror = () => {
                this.loadingPromises.delete(url);
                reject(new Error(`Failed to load image: ${url}`));
            };
            
            // 设置跨域
            img.crossOrigin = 'anonymous';
            img.src = url;
        });

        this.loadingPromises.set(url, promise);
        return promise;
    }

    /**
     * 预加载图像
     */
    preloadImages(urls) {
        return Promise.all(urls.map(url => 
            this.loadOptimizedImage(url).catch(err => {
                console.warn(`Failed to preload image: ${url}`, err);
                return null;
            })
        ));
    }

    /**
     * 清理资源
     */
    dispose() {
        this.sizeOptimizer.clearCache();
        this.loadedImages.clear();
        this.loadingPromises.clear();
    }
}

/**
 * 大图像处理工具集
 */
export const LargeImageUtils = {
    /**
     * 检测大图像
     */
    isLargeImage(imageElement, threshold = 1024 * 1024) {
        const width = imageElement.naturalWidth;
        const height = imageElement.naturalHeight;
        const pixels = width * height;
        return pixels > threshold;
    },

    /**
     * 计算内存使用量
     */
    calculateMemoryUsage(imageElement) {
        const width = imageElement.naturalWidth;
        const height = imageElement.naturalHeight;
        // 假设RGBA格式，4字节每像素
        return width * height * 4;
    },

    /**
     * 生成优化的画布尺寸
     */
    getOptimalCanvasSize(imageWidth, imageHeight, maxSize = 768) {
        if (imageWidth <= maxSize && imageHeight <= maxSize) {
            return { width: imageWidth, height: imageHeight };
        }

        const scale = Math.min(maxSize / imageWidth, maxSize / imageHeight);
        return {
            width: Math.round(imageWidth * scale),
            height: Math.round(imageHeight * scale),
            scale
        };
    },

    /**
     * 分块处理大图像 - 用于需要全分辨率处理的场景
     */
    async processInChunks(imageElement, processFunction, chunkSize = 512) {
        const width = imageElement.naturalWidth;
        const height = imageElement.naturalHeight;
        const results = [];

        // 创建临时画布
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = chunkSize;
        canvas.height = chunkSize;

        // 分块处理
        for (let y = 0; y < height; y += chunkSize) {
            for (let x = 0; x < width; x += chunkSize) {
                const chunkWidth = Math.min(chunkSize, width - x);
                const chunkHeight = Math.min(chunkSize, height - y);

                // 清空画布
                ctx.clearRect(0, 0, chunkSize, chunkSize);

                // 绘制当前块
                ctx.drawImage(
                    imageElement,
                    x, y, chunkWidth, chunkHeight,
                    0, 0, chunkWidth, chunkHeight
                );

                // 处理当前块
                const result = await processFunction({
                    canvas,
                    ctx,
                    x, y,
                    width: chunkWidth,
                    height: chunkHeight,
                    totalWidth: width,
                    totalHeight: height
                });

                results.push(result);
            }
        }

        return results;
    }
};

// 创建全局实例
export const globalImageSizeOptimizer = new ImageSizeOptimizer();
export const globalOptimizedImageLoader = new OptimizedImageLoader();

/**
 * 内存管理器 - 优化大图像编辑后的内存清理
 * LRPG专属的内存管理策略
 */
export class MemoryManager {
    constructor() {
        this.memoryThreshold = 100 * 1024 * 1024; // 100MB阈值
        this.cleanupInterval = 30000; // 30秒清理间隔
        this.lastCleanupTime = Date.now();
        this.memoryHistory = [];
        this.maxHistorySize = 10;
        
        // 初始化定时清理
        this.startPeriodicCleanup();
    }

    /**
     * 开始周期性清理
     */
    startPeriodicCleanup() {
        setInterval(() => {
            this.performCleanup();
        }, this.cleanupInterval);
    }

    /**
     * 检查内存使用情况
     */
    checkMemoryUsage() {
        if (performance.memory) {
            const used = performance.memory.usedJSHeapSize;
            const total = performance.memory.totalJSHeapSize;
            const limit = performance.memory.jsHeapSizeLimit;
            
            // 记录内存使用历史
            this.memoryHistory.push({
                timestamp: Date.now(),
                used,
                total,
                limit
            });
            
            // 保持历史记录大小
            if (this.memoryHistory.length > this.maxHistorySize) {
                this.memoryHistory.shift();
            }
            
            return {
                used,
                total,
                limit,
                usagePercent: (used / limit) * 100
            };
        }
        
        return null;
    }

    /**
     * 执行内存清理
     */
    performCleanup() {
        const memoryInfo = this.checkMemoryUsage();
        
        if (!memoryInfo) {
            return;
        }
        
        // 检查是否需要清理
        if (memoryInfo.used > this.memoryThreshold || 
            memoryInfo.usagePercent > 70 ||
            Date.now() - this.lastCleanupTime > this.cleanupInterval) {
            
            console.log(`🧹 Memory cleanup triggered - Used: ${this.formatBytes(memoryInfo.used)}, ${memoryInfo.usagePercent.toFixed(1)}%`);
            
            // 执行清理操作
            this.cleanupImageCache();
            this.cleanupFabricCanvases();
            this.cleanupEventListeners();
            this.forceGarbageCollection();
            
            this.lastCleanupTime = Date.now();
        }
    }

    /**
     * 清理图像缓存
     */
    cleanupImageCache() {
        if (globalImageCache) {
            const beforeSize = globalImageCache.cache.size;
            
            // 清理超过30分钟未使用的缓存
            const now = Date.now();
            const staleTime = 30 * 60 * 1000;
            
            for (const [url, entry] of globalImageCache.cache.entries()) {
                if (now - entry.timestamp > staleTime) {
                    globalImageCache.cache.delete(url);
                    console.log(`🗑️ Cleaned stale image cache: ${url.substring(url.lastIndexOf('/') + 1)}`);
                }
            }
            
            const afterSize = globalImageCache.cache.size;
            console.log(`📊 Image cache cleanup: ${beforeSize} → ${afterSize} entries`);
        }
    }

    /**
     * 清理Fabric画布
     */
    cleanupFabricCanvases() {
        // 清理未使用的Fabric画布
        if (window.fabric && fabric.Canvas) {
            try {
                // 检查是否存在getInstances方法
                if (typeof fabric.Canvas.getInstances === 'function') {
                    const canvases = fabric.Canvas.getInstances();
                    
                    canvases.forEach(canvas => {
                        // 检查画布是否仍在使用
                        if (!canvas.element || !document.body.contains(canvas.element)) {
                            // 清理画布
                            canvas.dispose();
                            console.log('🗑️ Cleaned unused Fabric canvas');
                        }
                    });
                } else {
                    console.log('ℹ️ fabric.Canvas.getInstances方法不可用，跳过Fabric画布清理');
                }
            } catch (error) {
                console.warn('⚠️ Fabric画布清理失败:', error);
            }
        }
    }

    /**
     * 清理事件监听器
     */
    cleanupEventListeners() {
        // 清理模态弹窗相关的事件监听器
        const modals = document.querySelectorAll('.comfy-modal');
        
        modals.forEach(modal => {
            if (!modal.style.display || modal.style.display === 'none') {
                // 移除隐藏的模态弹窗的事件监听器
                const clone = modal.cloneNode(true);
                modal.parentNode.replaceChild(clone, modal);
                console.log('🗑️ Cleaned event listeners for hidden modal');
            }
        });
    }

    /**
     * 强制垃圾回收
     */
    forceGarbageCollection() {
        try {
            // 尝试触发垃圾回收
            if (window.gc) {
                window.gc();
                console.log('🗑️ Forced garbage collection completed');
            }
            
            // 清理大对象
            this.clearLargeObjects();
            
        } catch (error) {
            console.warn('Garbage collection not available');
        }
    }

    /**
     * 清理大对象
     */
    clearLargeObjects() {
        // 清理大的base64数据
        const清理Base64 = () => {
            const largeBase64Regex = /data:image\/[^;]+;base64,[A-Za-z0-9+\/=]{100000,}/g;
            const elements = document.querySelectorAll('*');
            
            elements.forEach(element => {
                for (const attr of element.attributes) {
                    if (largeBase64Regex.test(attr.value)) {
                        element.setAttribute(attr.name, '');
                        console.log('🗑️ Cleaned large base64 attribute');
                    }
                }
            });
        };
        
        setTimeout(清理Base64, 0);
    }

    /**
     * 格式化字节数
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * 获取内存使用报告
     */
    getMemoryReport() {
        const memoryInfo = this.checkMemoryUsage();
        
        if (!memoryInfo) {
            return 'Memory API not available';
        }
        
        const cacheSize = globalImageCache ? globalImageCache.cache.size : 0;
        const fabricCanvases = window.fabric && fabric.Canvas ? fabric.Canvas.getInstances().length : 0;
        
        return `
Memory Usage Report:
- Used: ${this.formatBytes(memoryInfo.used)} (${memoryInfo.usagePercent.toFixed(1)}%)
- Total: ${this.formatBytes(memoryInfo.total)}
- Limit: ${this.formatBytes(memoryInfo.limit)}
- Image Cache: ${cacheSize} entries
- Fabric Canvases: ${fabricCanvases}
- Last Cleanup: ${new Date(this.lastCleanupTime).toLocaleTimeString()}
        `.trim();
    }

    /**
     * 在关闭模态弹窗时执行深度清理
     */
    cleanupOnModalClose(modal) {
        console.log('🧹 Starting deep cleanup on modal close...');
        
        try {
            // 1. 清理Fabric画布
            if (modal.fabricCanvas) {
                try {
                    modal.fabricCanvas.dispose();
                    modal.fabricCanvas = null;
                    console.log('🗑️ Fabric canvas disposed');
                } catch (e) {
                    console.warn('Error disposing fabric canvas:', e);
                }
            }
            
            // 2. 清理大图像数据
            if (modal.inputImageData) {
                modal.inputImageData = null;
                console.log('🗑️ Input image data cleared');
            }
            
            // 3. 清理图层状态
            if (modal.layerStates) {
                modal.layerStates.clear();
                console.log('🗑️ Layer states cleared');
            }
            
            // 4. 🔴 注意：不再克隆节点，因为这会导致modal引用失效
            // 事件监听器会在弹窗被移除时自动清理
            console.log('🗑️ Event listeners will be auto-cleared on modal removal');
            
            // 5. 延迟执行垃圾回收
            setTimeout(() => {
                this.forceGarbageCollection();
                console.log('✅ Deep cleanup completed');
            }, 100);
            
        } catch (error) {
            console.error('❌ Error during modal cleanup:', error);
        }
    }
}

// 创建全局内存管理器实例
export const globalMemoryManager = new MemoryManager();