/**
 * Visual Prompt Editor - 工具函数模块
 * 通用工具函数和常量定义
 */

// 工具映射
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

// 操作类型模板 - 简化版本，只保留核心结构化描述
export const OPERATION_TEMPLATES = {
    'change_color': {
        template: 'Change the color of {object} to {target}',
        description: (target) => `Change the color of {object} to ${target || 'red'}`
    },
    'change_style': {
        template: 'Transform {object} to {target} style',
        description: (target) => `Transform {object} to ${target || 'cartoon style'}`
    },
    'replace_object': {
        template: 'Replace {object} with {target}',
        description: (target) => `Replace {object} with ${target || 'a different object'}`
    },
    'add_object': {
        template: 'Add {target} near {object}',
        description: (target) => `Add ${target || 'a new object'} near {object}`
    },
    'remove_object': {
        template: 'Remove {object} from the image',
        description: () => `Remove {object} from the image`
    },
    'change_texture': {
        template: 'Change {object} texture to {target}',
        description: (target) => `Change the texture of {object} to ${target || 'smooth texture'}`
    },
    'change_pose': {
        template: 'Change {object} pose to {target}',
        description: (target) => `Change the pose of {object} to ${target || 'a different pose'}`
    },
    'change_expression': {
        template: 'Change {object} expression to {target}',
        description: (target) => `Change the facial expression of {object} to ${target || 'happy expression'}`
    },
    'change_clothing': {
        template: 'Change {object} clothing to {target}',
        description: (target) => `Change the clothing of {object} to ${target || 'different outfit'}`
    },
    'change_background': {
        template: 'Change background around {object} to {target}',
        description: (target) => `Change the background to ${target || 'a new environment'}`
    },
    'enhance_quality': {
        template: 'Enhance quality of {object}',
        description: () => `Enhance the quality of {object}`
    },
    'custom': {
        template: '{target}',
        description: (target) => target || 'Apply custom modification to the selected region'
    }
};

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
 * 通知显示函数
 */
export class KontextUtils {
    static showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed; top: 50%; left: 50%; z-index: 50000;
            transform: translate(-50%, -50%);
            padding: 20px 30px; border-radius: 12px; color: white;
            font-family: Arial, sans-serif; font-size: 16px; font-weight: bold;
            box-shadow: 0 12px 24px rgba(0,0,0,0.4);
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
            border: 3px solid #fff; text-align: center; min-width: 300px;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, duration);
        
        console.log(`[${type.toUpperCase()}] ${message}`);
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
    const drawingLayer = modal.querySelector('#drawing-layer');
    const svg = drawingLayer ? drawingLayer.querySelector('svg') : null;
    
    if (!svg) return { x: 0, y: 0 };
    
    // 获取多个容器的位置信息进行对比
    const canvasContainer = modal.querySelector('#canvas-container');
    const zoomContainer = modal.querySelector('#zoom-container');
    const imageCanvas = modal.querySelector('#image-canvas');
    const image = modal.querySelector('#vpe-main-image');
    
    if (!canvasContainer) return { x: 0, y: 0 };
    
    // 获取各个容器的边界框
    const canvasContainerRect = canvasContainer.getBoundingClientRect();
    const svgRect = svg.getBoundingClientRect();
    const drawingLayerRect = drawingLayer.getBoundingClientRect();
    
    console.log('🔍 容器位置对比:', {
        mouse: { x: e.clientX, y: e.clientY },
        canvasContainer: { left: canvasContainerRect.left, top: canvasContainerRect.top, width: canvasContainerRect.width, height: canvasContainerRect.height },
        svgRect: { left: svgRect.left, top: svgRect.top, width: svgRect.width, height: svgRect.height },
        drawingLayer: { left: drawingLayerRect.left, top: drawingLayerRect.top, width: drawingLayerRect.width, height: drawingLayerRect.height }
    });
    
    if (image) {
        const imageRect = image.getBoundingClientRect();
        console.log('🖼️ 图片位置:', { left: imageRect.left, top: imageRect.top, width: imageRect.width, height: imageRect.height });
    }
    
    // 使用SVG自身的边界框进行坐标转换
    const svgRelativeX = e.clientX - svgRect.left;
    const svgRelativeY = e.clientY - svgRect.top;
    
    // 计算相对位置的比例 (0-1)
    const scaleX = svgRelativeX / svgRect.width;
    const scaleY = svgRelativeY / svgRect.height;
    
    // 映射到SVG viewBox坐标系
    const svgX = scaleX * svg.viewBox.baseVal.width;
    const svgY = scaleY * svg.viewBox.baseVal.height;
    
    console.log('🖱️ SVG坐标转换:', {
        svgRelative: { x: svgRelativeX, y: svgRelativeY },
        scale: { x: scaleX, y: scaleY },
        viewBox: { width: svg.viewBox.baseVal.width, height: svg.viewBox.baseVal.height },
        final: { x: svgX, y: svgY }
    });
    
    return { x: svgX, y: svgY };
}