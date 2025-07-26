/**
 * Visual Prompt Editor - 常量定义
 * 集中管理所有魔法数字、颜色、选择器等常量
 * 
 * 版本: v1.0.0 - 初始版本
 * 日期: 2025-07-22
 */

// 🎨 颜色常量
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
    
    // SVG默认颜色 (从现有代码中提取)
    DEFAULT_STROKE: "#000000",
    DEFAULT_FILL: "none"
};

// 📏 尺寸常量  
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

// ⏱️ 时间常量
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

// 🎯 DOM选择器常量
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
    // ENABLE_LAYER_MANAGEMENT 已移除，默认启用图层管理
    
    // 画布相关
    IMAGE_CANVAS: '#image-canvas',
    ZOOM_CONTAINER: '#zoom-container'
};

// 📊 质量评分常量
export const QUALITY = {
    MAX_SCORE: 100,
    SCORE_RANGES: {
        EXCELLENT: { min: 90, max: 100 },
        GOOD: { min: 75, max: 89 },
        FAIR: { min: 60, max: 74 },
        POOR: { min: 0, max: 59 }
    }
};

// 🔧 工具常量
export const TOOLS = {
    SELECT: 'select',
    BRUSH: 'brush',
    RECT: 'rect',
    CIRCLE: 'circle',
    ARROW: 'arrow'
};

// 📝 CSS类名常量
export const CSS_CLASSES = {
    HIGHLIGHTED: 'highlighted',
    BRUSH_PATH: 'brush-path', 
    ANNOTATION_SHAPE: 'annotation-shape',
    LAYER_ITEM: 'layer-item',
    LAYER_VISIBLE: 'layer-visible',
    LAYER_HIDDEN: 'layer-hidden'
};

// 🌐 默认配置
export const DEFAULTS = {
    LANGUAGE: 'zh',
    ZOOM_LEVEL: 1.0,
    STROKE_WIDTH: DIMENSIONS.STROKE_WIDTH.MEDIUM,
    STROKE_COLOR: COLORS.DEFAULT_STROKE,
    FILL_COLOR: COLORS.DEFAULT_FILL
};

// 📏 数值限制
export const LIMITS = {
    MAX_ANNOTATIONS: 100,
    MAX_LAYERS: 50,
    MIN_ZOOM: 0.1,
    MAX_ZOOM: 5.0,
    MAX_TEXT_LENGTH: 500
};

// 🔤 文本常量
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

// 🔢 版本信息
export const VERSION = {
    CONSTANTS_VERSION: '1.0.0',
    LAST_UPDATED: '2025-07-22'
};