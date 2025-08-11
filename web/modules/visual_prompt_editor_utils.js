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
        '保持原始材质纹理（织物编织、皮肤毛孔、表面粗糙度）',
        '保持重新着色表面上一致的光照反射和阴影',
        '避免颜色渗入相邻物体或区域',
        '保持相对于场景光照的相同饱和度和亮度水平'
    ],
    
    'replace_object': [
        '匹配原始物体的精确视角和观看方向',
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

    // === 👤 Character Editing Constraints ===
    'change_expression': [
        '保持面部双侧对称和自然的肌肉运动模式',
        '保持个人面部特征和骨骼结构特征',
        '确保表情变化遵循真实的人体解剖学约束',
        '保持眼神接触方向和注视焦点与原始一致'
    ],
    
    'change_clothing': [
        '确保织物悬垂遵循真实的物理规律和身体轮廓',
        '使服装风格与年龄、体型和场合背景相匹配',
        '保持与肤色和周围环境的适当色彩和谐',
        '保持通过服装合身度可见的原始身体比例'
    ],
    
    'change_pose': [
        '遵循人体解剖学关节限制和自然的运动范围',
        '保持现实的重量分布和平衡点',
        '在整个姿势变化中保持肌肉张力一致性',
        '确保新姿势在环境背景中逻辑合理'
    ],

    // === 🏗️ Scene Editing Constraints ===
    'change_background': [
        '匹配大气透视深度线索（色温、对比度衰减）',
        '使光照方向和色温与新环境对齐',
        '保持主体和背景之间的边缘质量和自然交互',
        '保持前景和背景元素之间的一致比例关系'
    ],
    
    'change_texture': [
        '在改变表面属性时保持原始物体的形状和形态',
        '使新纹理与现有光照条件和环境背景相匹配',
        '确保材质对光和阴影的现实响应',
        '保持一致的纹理分辨率和细节质量'
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
        '保持眼神接触方向和注视焦点与原始一致'
    ],
    
    'character_hair': [
        '保持自然的发丝分离和飞散细节',
        '保持真实的头发物理特性和运动特征',
        '确保与头发纹理和体积的一致光照交互',
        '避免不自然的头盔式或过于完美的头发外观'
    ],
    
    'character_accessories': [
        '确保相对于角色的适当比例和尺度',
        '保持与服装和身体位置的现实集成',
        '保持与配饰的一致光照和阴影交互',
        '避免悬浮或分离的配饰外观'
    ],
    
    'character_age': [
        '保持一致的面部结构和骨骼比例',
        '保持自然的皮肤纹理和衰老特征',
        '确保对头发颜色和纹理模式的现实变化',
        '避免不成比例或不一致的衰老效果'
    ],
    
    'detail_enhance': [
        '避免产生不自然边缘光晕的过度锐化',
        '保持自然的纹理变化和表面不规则性',
        '保持原始艺术意图和风格特征',
        '确保在所有焦点区域的一致细节增强'
    ],
    
    'realism_enhance': [
        '保持原始艺术意图和风格特征',
        '保持一致的光照和阴影关系',
        '避免与原始风格的超现实主义不一致',
        '确保现实的材质属性和表面交互'
    ],
    
    'camera_operation': [
        '保持一致的光学特性和镜头行为',
        '保持现实的景深和焦点过渡',
        '避免不自然的相机角度或不可能的视角',
        '确保适当的曝光和动态范围关系'
    ],
    
    'add_object': [
        '基于场景中的距离和透视计算正确尺寸',
        '复制现有光照条件，包括阴影和反射',
        '确保添加的物体不违反物理空间占用',
        '匹配现有场景元素的视觉风格和质量水平'
    ],
    
    'remove_object': [
        '分析周围模式和纹理以进行连贯的重建',
        '保持连续的透视线和消失点',
        '保持填充区域中的光照渐变和阴影模式',
        '避免创建不可能的空间配置'
    ],

    // === 📐 Geometric Transformation Constraints ===
    'resize_object': [
        '在缩放过程中保持像素质量并避免插值伪影',
        '按比例调整阴影大小和投射角度以适应新尺度',
        '保持在场景空间层次中的相对定位',
        '确保调整大小的物体不会产生不现实的比例关系'
    ],
    
    'adjust_lighting': [
        '尊重物体表面材质属性（反射率、半透明性）',
        '保持与场景中其他光源的一致色温',
        '基于新的光照方向计算现实的阴影投射',
        '在调整整体照明时保持精细的表面细节'
    ],

    // === 🌍 Global Editing Constraints ===
    'global_color_grade': [
        '在所有人体主体上保持自然的肤色准确性',
        '保持阴影和高光中重要细节的可见性',
        '保持色彩关系和谐并避免不自然的色偏',
        '保持足够的对比度以确保视觉清晰度和深度感知'
    ],
    
    'global_style_transfer': [
        '保持基本构图元素和焦点层次',
        '保持重要视觉信息的足够细节',
        '确保风格应用不影响图像可读性',
        '保持艺术转换适合原始主题'
    ],
    
    'enhance_quality': [
        '避免产生不自然边缘光晕的过度锐化',
        '平衡降噪与精细纹理细节的保持',
        '保持自然的色彩饱和度水平而不过度增强',
        '保持原始摄影特征和真实性'
    ],

    // === 📝 Text Editing Constraints ===
    'text_add': [
        '选择与图像美学和历史时期相匹配的字体',
        '通过适当的对比度确保文本在背景上的可读性',
        '定位文本以增强而不是阻碍重要的视觉元素',
        '为图像分辨率和观看环境适当缩放文本'
    ],
    
    'text_remove': [
        '分析底层纹理和模式以进行无缝重建',
        '保持文本移除处的一致光照和阴影模式',
        '保持可能位于文本后面的任何重要视觉信息',
        '避免创建明显的矩形补丁或不自然的纹理过渡'
    ],
    
    'text_edit': [
        '匹配原始文本的字体特征（样式、粗细、间距）',
        '保持相同的文本放置和对齐原则',
        '保持原始色彩关系和文本处理效果',
        '确保新文本长度适当适应可用空间'
    ],

    // === 🔧 Professional Operations Constraints ===
    'content_aware_fill': [
        '分析多个周围区域以进行一致的模式采样',
        '保持自然的随机性以避免明显的重复模式',
        '保持光照渐变和方向性纹理流动',
        '确保填充内容不会产生不可能的视觉矛盾'
    ],
    
    'perspective_transform': [
        '保持在校正视图中应保持直线的直线',
        '保持建筑元素之间的比例关系',
        '确保转换不会产生不可能的几何配置',
        '保持遵循光学物理学原理的现实观看角度'
    ],
    
    'global_brightness_contrast': [
        '避免高光和阴影的过曝或细节损失',
        '保持自然的色调范围和对比度关系',
        '保持图像中现实的亮度过渡',
        '确保一致的对比度处理而无需人工增强'
    ],
    
    'global_hue_saturation': [
        '保持自然的肤色准确性和色彩关系',
        '避免不自然的色偏或过饱和效果',
        '保持和谐的色彩平衡和大气一致性',
        '确保不同色彩区域的一致饱和度水平'
    ],
    
    'global_sharpen_blur': [
        '避免不自然的边缘光晕或过度锐化伪影',
        '保持一致的焦点过渡和深度关系',
        '保持原始图像质量而无需人工增强',
        '确保所有焦点区域的统一处理'
    ],
    
    'global_noise_reduction': [
        '保持重要的精细细节和纹理信息',
        '避免塑料或过度光滑的人工外观',
        '保持自然的表面特性和材质属性',
        '确保一致的降噪而不会损失细节'
    ],
    
    'global_enhance': [
        '避免产生人工外观的过度处理',
        '保持自然图像特征和艺术意图',
        '在进行细微改进时保持原始质量',
        '确保所有图像区域的一致增强'
    ],
    
    'global_filter': [
        '避免不自然的滤镜效果或人工外观',
        '保持一致的图像质量和艺术完整性',
        '保持原始光照和色彩关系',
        '确保无伪影的统一滤镜应用'
    ],
    
    'global_perspective': [
        '保持现实的空间关系和透视准确性',
        '避免扭曲的比例或不可能的视角',
        '保持一致的消失点和空间层次',
        '确保自然的深度感知和尺寸准确性'
    ],
    
    'colorize_image': [
        '保持原始亮度值和色调关系',
        '保持自然的色彩过渡和和谐平衡',
        '避免不自然的色偏或不一致的着色',
        '确保所有图像区域的一致色彩应用'
    ],
    
    'relight_scene': [
        '保持现实的光照方向和阴影一致性',
        '保持自然的大气透视和深度线索',
        '避免过曝或不自然的光照效果',
        '确保与所有表面的一致光交互'
    ],
    
    'teleport_context': [
        '保持主体完整性和比例关系',
        '确保一致的环境集成和空间和谐',
        '保持现实的材质属性和表面交互',
        '避免不自然的上下文过渡或空间不一致'
    ],
    
    'text_resize': [
        '保持文本可读性和比例关系',
        '避免缩放期间的像素化或质量损失',
        '保持一致的排版和字体特征',
        '确保适合构图适当的文本尺寸'
    ],
    
    'object_combine': [
        '保持自然的文本-对象空间关系',
        '确保一致的视觉层次和构图平衡',
        '避免冲突的文本和对象视觉元素',
        '保持可读性同时保持美学集成'
    ],
    
    'zoom_focus': [
        '保持图像质量并避免插值伪影',
        '保持自然的焦点过渡和深度关系',
        '避免不现实的放大或扭曲效果',
        '确保整个图像的一致焦点强调'
    ],
    
    'stylize_local': [
        '保持主体识别和关键特征',
        '避免失去基本特征的过度风格化',
        '保持一致的艺术方向和美学统一',
        '确保与环境的自然风格集成'
    ],
    
    'custom': [
        '保持自然图像质量并避免伪影',
        '保持原始艺术意图和特征',
        '确保所有图像区域的一致处理',
        '避免不自然或不一致的处理效果'
    ],
    
    'geometric_warp': [
        '保持比例关系和空间准确性',
        '避免不自然的扭曲或不可能的几何配置',
        '保持一致的透视和观看角度',
        '确保遵循物理学原理的现实转换'
    ],
    
    'lens_distortion': [
        '保持现实的光学特性和镜头行为',
        '避免不自然的扭曲效果或光学不一致',
        '保持一致的图像质量和细节完整性',
        '确保真实镜头特性的准确模拟'
    ],
    
    'seamless_removal': [
        '保持自然的背景连续性和纹理模式',
        '避免可见边界或明显的重建伪影',
        '保持一致的光照和阴影关系',
        '确保智能的内容感知填充'
    ],
    
    'smart_patch': [
        '保持一致的纹理模式和表面属性',
        '避免明显的补丁边界或重复模式',
        '保持自然的随机性和材质特征',
        '确保与周围区域的无缝集成'
    ],
    
    'style_blending': [
        '保持和谐的风格过渡和艺术统一',
        '避免冲突的风格元素或刺眼的视觉断裂',
        '保持一致的美学方向和艺术意图',
        '确保自然的风格演变和集成'
    ],
    
    'collage_integration': [
        '保持自然的元素关系和空间和谐',
        '避免不一致的视觉风格或冲突元素',
        '保持一致的光照和环境背景',
        '确保不同组件的无缝混合'
    ],
    
    'texture_mixing': [
        '保持现实的材质属性和表面特征',
        '避免不自然的纹理冲突或不一致的表面',
        '保持对光照条件的一致材质响应',
        '确保自然的材质过渡和交互'
    ],
    
    'precision_cutout': [
        '保持准确的边缘检测和自然边界',
        '避免粗糙边缘或不完整的物体提取',
        '保持一致的细节质量和物体完整性',
        '确保与背景元素的清晰分离'
    ],
    
    'alpha_composite': [
        '保持自然的透明度和图层混合效果',
        '避免不自然的透明度过渡或可见接缝',
        '保持一致的空间关系和深度感知',
        '确保现实的图层集成和交互'
    ],
    
    'mask_feathering': [
        '保持自然的边缘过渡和柔和混合效果',
        '避免生硬边缘或不一致的羽化模式',
        '保持边界区域的一致细节质量',
        '确保遮罩和非遮罩区域之间的平滑集成'
    ],
    
    'depth_composite': [
        '保持现实的空间关系和深度感知',
        '避免不一致的3D集成或空间冲突',
        '保持一致的透视和尺寸准确性',
        '确保自然的图层排序和深度交互'
    ],
    
    'professional_product': [
        '保持产品完整性和准确表示',
        '避免不现实的展示或不一致的质量',
        '保持专业的光照和构图标准',
        '确保目录质量的结果和商业吸引力'
    ],
    
    'default': []
};

// Enhanced Decorative System - High-quality aesthetic prompts
export const DECORATIVE_PROMPTS = {
    
    // === 🎨 Appearance Transformation Aesthetic Enhancement ===
    'change_color': [
        '应用色彩和谐原则（互补、类似或三色方案）',
        '在保持自然外观的同时增强色彩活力',
        '通过微妙的渐变效果创建平滑的色彩过渡',
        '优化色彩平衡以创造视觉趣味和焦点强调'
    ],
    
    'replace_object': [
        '确保替换物增强整体构图平衡',
        '创建自然的视觉流和眼球运动穿过场景',
        '优化尺寸和位置以实现黄金比例关系',
        '增强场景的叙事连贯性和情感影响'
    ],
    
    'change_style': [
        '运用精湛技巧进行复杂的艺术诠释',
        '创造增强艺术吸引力的视觉冲击风格适应',
        '在风格化和可识别性之间保持优雅平衡',
        '通过风格应用发展丰富的视觉纹理和深度'
    ],

    // === 👤 Character Editing Aesthetic Enhancement ===
    'change_expression': [
        '创造真实的情感共鸣和人际连接',
        '通过微妙修饰增强自然面部吸引力',
        '发展传达引人入胜个性的表现深度',
        '优化面部和谐与对称性以获得最大视觉吸引力'
    ],
    
    'change_clothing': [
        '应用时尚设计原则以实现风格复杂性',
        '增强身体轮廓和比例吸引力',
        '创造与肤色和环境相辅相成的色彩协调',
        '发展纹理丰富度和织物真实性以实现视觉奢华'
    ],
    
    'change_pose': [
        '创造动态能量和优雅的运动流动',
        '增强肢体语言沟通和情感表达',
        '优化比例关系以获得最大视觉吸引力',
        '发展增强叙事影响的引人注目的手势语言'
    ],

    // === 🏗️ Scene Editing Aesthetic Enhancement ===
    'change_background': [
        '创造大气深度和环境情绪增强',
        '通过环境设计发展丰富的情境叙事',
        '优化构图框架和负空间利用',
        '通过环境心理学原则增强情感共鸣'
    ],
    
    'add_object': [
        '增强构图趣味和视觉叙事丰富性',
        '创造自然的焦点层次和眼球运动引导',
        '通过深思熟虑的物体选择发展情境叙事',
        '优化空间关系以获得最大视觉和谐'
    ],
    
    'remove_object': [
        '创造更清洁、更集中的构图强调',
        '增强视觉简约性和优雅极简主义',
        '优化空间流动和负空间关系',
        '发展改进的视觉层次和焦点清晰度'
    ],

    // === 📐 Geometric Transformation Aesthetic Enhancement ===
    'resize_object': [
        '优化比例关系以实现黄金比例和谐',
        '增强视觉重量分布和构图平衡',
        '通过战略性尺寸创建改进的焦点强调',
        '发展更好的空间节奏和视觉流动模式'
    ],
    
    'adjust_lighting': [
        '创造戏剧性的明暗对比效果以产生情感深度',
        '增强三维形式建模和雕塑品质',
        '通过复杂的光照设计发展大气情绪',
        '优化高光和阴影关系以获得最大视觉影响'
    ],

    // === 🌍 Global Editing Aesthetic Enhancement ===
    'global_color_grade': [
        '创造具有专业电影质量的电影级调色板',
        '发展丰富的色调深度和复杂的色彩关系',
        '通过色彩心理学原则增强情感影响',
        '通过战略性色彩强调优化视觉层次'
    ],
    
    'global_style_transfer': [
        '创造具有复杂美学愿景的艺术杰作质量',
        '通过创造性风格诠释发展独特的视觉身份',
        '通过风格应用增强文化和艺术意义',
        '在保持构图卓越的同时优化创意表达'
    ],
    
    'enhance_quality': [
        '达到清晰的专业摄影标准',
        '增强精细细节定义以获得最大视觉清晰度',
        '发展丰富的纹理深度和触觉视觉质量',
        '优化动态范围以产生令人惊叹的视觉影响'
    ],

    // === 📝 Text Editing Aesthetic Enhancement ===
    'text_add': [
        '应用专业排版设计原则以获得最大可读性',
        '创造优雅的文本集成以增强整体构图',
        '通过字体大小和粗细关系发展适当的视觉层次',
        '优化色彩对比和空间关系以实现视觉和谐'
    ],
    
    'text_remove': [
        '创造没有文本中断的无缝视觉流动',
        '增强构图纯粹性和视觉优雅',
        '优化空间关系和负空间利用',
        '在核心视觉元素上发展更清洁的美学焦点'
    ],
    
    'text_edit': [
        '增强文本沟通清晰度和视觉影响',
        '创造改进的排版复杂性和专业外观',
        '在保持美学集成的同时优化文本可读性',
        '发展一致的视觉品牌和风格连贯性'
    ],

    // === 🔧 Professional Operations Aesthetic Enhancement ===
    'content_aware_fill': [
        '创造具有自然有机流动的不可见无缝重建',
        '增强整体构图完整性和视觉连贯性',
        '发展丰富的纹理真实性和表面质量',
        '优化空间关系以改善视觉和谐'
    ],
    
    'perspective_transform': [
        '创造建筑优雅性和几何精确性',
        '增强空间清晰度和尺寸准确性',
        '发展专业的建筑摄影质量',
        '优化观看角度以获得最大视觉影响和清晰度'
    ],
    
    'change_texture': [
        '增强材质真实性和表面触觉质量',
        '创造增加视觉趣味的丰富纹理变化',
        '发展对光照条件的适当材质响应',
        '优化纹理集成以实现整体构图和谐'
    ],
    
    'enhance_skin_texture': [
        '实现具有真实微纹理的自然皮肤外观',
        '在保持个体特征的同时增强皮肤质量',
        '发展现实的次表面散射和半透明效果',
        '优化肤色和谐和自然美'
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
        '在保持自然外观的同时优化表现力影响'
    ],
    
    'character_hair': [
        '创造具有真实物理行为的自然头发运动',
        '在保持真实材质质量的同时增强头发纹理',
        '发展补充角色的复杂头发造型',
        '优化头发-光照交互以获得最大视觉吸引力'
    ],
    
    'character_accessories': [
        '通过深思熟虑的配饰选择增强角色身份',
        '创造保持设计连贯性的自然集成',
        '发展增强叙事背景的复杂造型',
        '优化配饰位置以获得最大构图和谐'
    ],
    
    'character_age': [
        '实现具有自然特征的真实年龄表现',
        '在保持个体身份的同时增强面部特征',
        '发展保持可信度的真实衰老模式',
        '优化适合年龄的造型和展示'
    ],
    
    'detail_enhance': [
        '实现具有专业质量的清晰细节定义',
        '在保持自然外观的同时增强视觉清晰度',
        '发展丰富的纹理深度和触觉质量',
        '在保持艺术完整性的同时优化细节影响'
    ],
    
    'realism_enhance': [
        '实现具有真实材质属性的照片级真实感',
        '在保持艺术意图的同时增强尺寸准确性',
        '发展真实的表面交互和光照响应',
        '在保持风格一致性的同时优化视觉真实性'
    ],
    
    'camera_operation': [
        '实现具有技术精度的专业摄影质量',
        '通过复杂的相机技术增强视觉影响',
        '发展提升视觉叙事的电影品质',
        '在保持自然外观的同时优化光学效果'
    ],
    
    'global_brightness_contrast': [
        '实现具有全动态范围的专业色调平衡',
        '通过复杂的对比度控制增强尺寸深度',
        '创造引导眼球的自然亮度过渡',
        '在保持细节完整性的同时优化视觉影响'
    ],
    
    'global_hue_saturation': [
        '发展具有情感共鸣的和谐色彩关系',
        '在保持自然真实性的同时增强色彩活力',
        '创造增强叙事的复杂调色板',
        '在保持肤色准确性的同时优化色彩影响'
    ],
    
    'global_sharpen_blur': [
        '通过增强边缘定义实现最佳清晰度',
        '创造引导视觉注意力的自然锐度渐变',
        '在没有人造外观的情况下增强感知细节',
        '为最大构图影响优化焦点关系'
    ],
    
    'global_noise_reduction': [
        '实现具有自然纹理保持的原始图像质量',
        '在保持真实材质外观的同时增强清晰度',
        '创造没有塑料外观的平滑色调过渡',
        '在保持摄影特征的同时优化清洁度'
    ],
    
    'global_enhance': [
        '通过艺术愿景创造复杂的视觉增强',
        '在保持真实特征的同时增强自然美',
        '发展具有增强尺寸质量的丰富视觉深度',
        '在保持摄影完整性的同时优化美学影响'
    ],
    
    'global_filter': [
        '通过艺术意图应用复杂过滤',
        '在保持图像完整性的同时增强视觉风格',
        '创造统一视觉元素的一致处理',
        '为最大美学贡献优化滤镜效果'
    ],
    
    'global_perspective': [
        '实现具有建筑精确性的复杂空间关系',
        '通过精细视点控制增强尺寸质量',
        '创造引导观众体验的自然透视',
        '在保持现实比例的同时优化空间和谐'
    ],
    
    'colorize_image': [
        '实现具有真实色彩复制的自然着色',
        '通过复杂的色彩应用增强视觉吸引力',
        '发展保持现实主义的和谐色彩关系',
        '在保持原始亮度的同时优化色彩影响'
    ],
    
    'relight_scene': [
        '实现具有电影氛围的专业照明质量',
        '通过精细光照建模增强三维形式',
        '发展创造深度的自然阴影交互',
        '在保持现实外观的同时优化光照影响'
    ],
    
    'teleport_context': [
        '实现具有自然环境集成的无缝上下文转换',
        '通过深思熟虑的上下文选择增强叙事连贯性',
        '发展保持现实主义的一致空间关系',
        '在保持主体完整性的同时优化上下文影响'
    ],
    
    'text_resize': [
        '实现具有排版精度的复杂文本缩放',
        '通过精细比例控制增强可读性',
        '创造保持视觉层次的自然文本关系',
        '为最大构图和谐优化文本尺寸'
    ],
    
    'object_combine': [
        '实现具有视觉和谐的复杂对象集成',
        '通过深思熟虑的对象关系增强叙事深度',
        '创造统一不同元素的自然视觉连接',
        '在保持个体身份的同时优化构图平衡'
    ],
    
    'zoom_focus': [
        '创造具有电影质量的复杂焦点强调',
        '通过战略性放大控制增强视觉影响',
        '发展引导观众注意力的自然焦点过渡',
        '为最大叙事贡献优化缩放效果'
    ],
    
    'stylize_local': [
        '通过创造性愿景实现复杂的艺术增强',
        '通过精细风格化控制增强视觉趣味',
        '创造保持主体识别的自然艺术演变',
        '在保持基本特征的同时优化风格影响'
    ],
    
    'custom': [
        '通过艺术意图创造复杂的自定义增强',
        '通过精细技术执行增强视觉质量',
        '发展保持真实特征的自然结果',
        '为最大构图贡献优化自定义效果'
    ],
    
    'geometric_warp': [
        '通过数学精度实现复杂的几何转换',
        '通过精细扭曲控制增强视觉流动',
        '创造保持结构完整性的自然形状演变',
        '在保持基本关系的同时优化转换影响'
    ],
    
    'lens_distortion': [
        '通过专业镜头特性创造真实光学效果',
        '通过复杂扭曲控制增强尺寸质量',
        '发展模拟真实世界光学的自然透视',
        '为最大艺术贡献优化镜头效果'
    ],
    
    'seamless_removal': [
        '通过完美重建实现不可见的物体消除',
        '通过战略性元素移除增强构图清晰度',
        '创造保持场景完整性的自然背景连续性',
        '在保持环境真实性的同时优化视觉流动'
    ],
    
    'smart_patch': [
        '创造具有上下文感知的智能纹理合成',
        '通过复杂模式匹配增强表面连续性',
        '发展保持真实外观的自然材质过渡',
        '为无缝视觉连贯性优化补丁集成'
    ],
    
    'style_blending': [
        '通过艺术愿景实现复杂的风格融合',
        '通过和谐风格组合增强创意表达',
        '创造保持构图完整性的自然风格过渡',
        '在保持基本特征的同时优化风格影响'
    ],
    
    'collage_integration': [
        '通过艺术意图创造复杂的元素组装',
        '通过深思熟虑的构图增强叙事深度',
        '发展统一不同元素的自然视觉关系',
        '在保持个体身份的同时优化拼贴和谐'
    ],
    
    'texture_mixing': [
        '实现具有触觉真实性的复杂材质集成',
        '通过精细纹理组合增强表面质量',
        '创造保持物理现实主义的自然材质过渡',
        '在保持材质身份的同时优化纹理和谐'
    ],
    
    'precision_cutout': [
        '通过手术精度实现像素完美的提取',
        '通过精细边缘控制增强主体定义',
        '创造保持物体完整性的自然边界',
        '为无缝集成能力优化剪切质量'
    ],
    
    'alpha_composite': [
        '通过自然混合创造复杂的透明度效果',
        '通过精细图层交互增强尺寸深度',
        '发展保持空间关系的自然透明度过渡',
        '为最大视觉现实主义优化合成质量'
    ],
    
    'mask_feathering': [
        '通过有机柔软性实现复杂的边缘过渡',
        '通过精细羽化控制增强集成质量',
        '创造保持构图流动的自然边界混合',
        '为无缝视觉连贯性优化边缘处理'
    ],
    
    'depth_composite': [
        '创造具有尺寸准确性的复杂空间关系',
        '通过精细深度集成增强三维质量',
        '发展引导观众感知的自然空间渐进',
        '为最大构图影响优化深度关系'
    ],
    
    'professional_product': [
        '实现具有商业标准的目录质量展示',
        '通过专业照明控制增强产品吸引力',
        '创造最大化产品吸引力的复杂舞台布置',
        '为零售就绪质量优化视觉展示'
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
 */
export class ImageCache {
    constructor(maxSize = 20, maxMemoryMB = 100) {
        this.cache = new Map(); // URL -> {fabricImage, timestamp, size}
        this.loadingPromises = new Map(); // URL -> Promise
        this.maxSize = maxSize;
        this.maxMemoryBytes = maxMemoryMB * 1024 * 1024;
        this.currentMemoryUsage = 0;
        
        console.log(`🖼️ ImageCache initialized - Max: ${maxSize} images, ${maxMemoryMB}MB`);
    }

    /**
     * 获取图像，优先从缓存获取
     */
    async getImage(url) {
        if (this.cache.has(url)) {
            const cached = this.cache.get(url);
            cached.timestamp = Date.now();
            console.log(`✨ Image cache hit: ${url.substring(url.lastIndexOf('/') + 1)}`);
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
     * 清理最久未使用的图像（LRU）
     */
    _evictLRU() {
        let oldestUrl = null;
        let oldestTime = Date.now();

        for (const [url, data] of this.cache) {
            if (data.timestamp < oldestTime) {
                oldestTime = data.timestamp;
                oldestUrl = url;
            }
        }

        if (oldestUrl) {
            const evicted = this.cache.get(oldestUrl);
            this.cache.delete(oldestUrl);
            this.currentMemoryUsage -= evicted.size;
            console.log(`🗑️ Evicted LRU image: ${oldestUrl.substring(oldestUrl.lastIndexOf('/') + 1)} (${this._formatSize(evicted.size)})`);
        }
    }

    /**
     * 清除指定URL的缓存
     */
    invalidate(url) {
        if (this.cache.has(url)) {
            const cached = this.cache.get(url);
            this.cache.delete(url);
            this.currentMemoryUsage -= cached.size;
            console.log(`❌ Cache invalidated: ${url.substring(url.lastIndexOf('/') + 1)}`);
        }
    }

    /**
     * 清空所有缓存
     */
    clear() {
        const count = this.cache.size;
        const memory = this.currentMemoryUsage;
        this.cache.clear();
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
 * 全局图像尺寸优化器
 * 管理图像尺寸调整和优化
 */
export const globalImageSizeOptimizer = {
    /**
     * 优化图像尺寸以适应显示区域
     */
    optimizeForDisplay(image, maxWidth, maxHeight) {
        if (!image) return null;
        
        const ratio = Math.min(maxWidth / image.width, maxHeight / image.height);
        if (ratio >= 1) return image; // 不需要缩小
        
        const newWidth = Math.floor(image.width * ratio);
        const newHeight = Math.floor(image.height * ratio);
        
        console.log(`🔧 Optimizing image size: ${image.width}x${image.height} → ${newWidth}x${newHeight}`);
        
        return {
            width: newWidth,
            height: newHeight,
            scale: ratio
        };
    },

    /**
     * 计算合适的缩放比例
     */
    calculateScale(originalWidth, originalHeight, targetWidth, targetHeight) {
        return Math.min(targetWidth / originalWidth, targetHeight / originalHeight);
    },

    /**
     * 保持宽高比的尺寸计算
     */
    maintainAspectRatio(originalWidth, originalHeight, targetWidth, targetHeight) {
        const scale = this.calculateScale(originalWidth, originalHeight, targetWidth, targetHeight);
        return {
            width: Math.floor(originalWidth * scale),
            height: Math.floor(originalHeight * scale),
            scale
        };
    }
};

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
        const annotations = modal.annotations || [];
        
        // 分析标注分布和类型模式
        const annotationAnalysis = this.analyzeAnnotationPatterns(annotations);
        
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

/**
 * 全局内存管理器
 * 管理模态弹窗和编辑器的内存使用
 */
export const globalMemoryManager = {
    /**
     * 检查内存使用情况
     */
    checkMemoryUsage() {
        if (performance.memory) {
            return {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit,
                usagePercent: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100
            };
        }
        return null;
    },

    /**
     * 格式化字节数
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    /**
     * 获取内存报告
     */
    getMemoryReport() {
        const memory = this.checkMemoryUsage();
        if (!memory) {
            return 'Memory API not available';
        }
        
        return `
Memory Usage Report:
- Used: ${this.formatBytes(memory.used)}
- Total: ${this.formatBytes(memory.total)}
- Limit: ${this.formatBytes(memory.limit)}
- Usage: ${memory.usagePercent.toFixed(1)}%
        `.trim();
    },

    /**
     * 执行内存清理
     */
    performCleanup() {
        // 清理图片缓存
        if (typeof globalImageCache !== 'undefined') {
            globalImageCache.clear();
        }
        
        // 建议垃圾回收（如果可用）
        if (window.gc) {
            window.gc();
        }
        
        console.log('🧹 Memory cleanup performed');
    },

    /**
     * 模态弹窗关闭时的清理
     */
    cleanupOnModalClose(modal) {
        // 清理事件监听器
        const listeners = modal.querySelectorAll('[data-managed-listener]');
        listeners.forEach(el => {
            el.removeAttribute('data-managed-listener');
        });
        
        // 清理定时器
        if (modal._managedTimers) {
            modal._managedTimers.forEach(timer => clearTimeout(timer));
            modal._managedTimers = [];
        }
        
        // 执行通用清理
        this.performCleanup();
        
        console.log('🧹 Modal cleanup completed');
    }
};