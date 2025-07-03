/**
 * Visual Prompt Editor - 工具函数模块
 * 通用工具函数和常量定义
 */

// 工具映射
export const TOOL_NAMES = {
    'rectangle': { name: 'Rectangle', icon: '▭' },
    'circle': { name: 'Circle', icon: '⭕' },
    'arrow': { name: 'Arrow', icon: '➡️' },
    'freehand': { name: 'Polygon', icon: '🔗' }
};

// 颜色映射
export const COLOR_NAMES = {
    '#f44336': { name: 'Red', icon: '🔴' },
    '#4caf50': { name: 'Green', icon: '🟢' }, 
    '#ffeb3b': { name: 'Yellow', icon: '🟡' },
    '#2196f3': { name: 'Blue', icon: '🔵' }
};

// 操作类型模板
export const OPERATION_TEMPLATES = {
    'change_color': {
        template: 'Change the color of {object} to {target}',
        description: (target) => `Change the color of {object} to ${target || 'red'}, maintaining the same shape, texture, and lighting. Keep all other aspects of the image unchanged.`
    },
    'change_style': {
        template: 'Transform {object} to {target} style',
        description: (target) => `Transform {object} to ${target || 'cartoon style'}, maintaining the original composition and proportions. Apply artistic style transformation while preserving the essential characteristics.`
    },
    'replace_object': {
        template: 'Replace {object} with {target}',
        description: (target) => `Replace {object} with ${target || 'a different object'}, maintaining realistic lighting, shadows, and perspective that fits naturally with the surrounding environment.`
    },
    'add_object': {
        template: 'Add {target} near {object}',
        description: (target) => `Add ${target || 'a new object'} near {object}, ensuring it integrates naturally with proper lighting, shadows, and perspective. Maintain the existing composition balance.`
    },
    'remove_object': {
        template: 'Remove {object} from the image',
        description: () => `Seamlessly remove {object} from the image, intelligently filling the area with appropriate background content that matches the surrounding environment naturally.`
    },
    'change_texture': {
        template: 'Change {object} texture to {target}',
        description: (target) => `Change the texture of {object} to ${target || 'smooth texture'}, maintaining the original shape, color balance, and lighting conditions.`
    },
    'change_pose': {
        template: 'Change {object} pose to {target}',
        description: (target) => `Modify the pose of {object} to ${target || 'a different pose'}, maintaining realistic proportions, anatomy, and natural movement while preserving the overall scene composition.`
    },
    'change_expression': {
        template: 'Change {object} expression to {target}',
        description: (target) => `Change the facial expression of {object} to ${target || 'happy expression'}, maintaining natural facial features and realistic emotional representation.`
    },
    'change_clothing': {
        template: 'Change {object} clothing to {target}',
        description: (target) => `Replace the clothing in {object} with ${target || 'different outfit'}, ensuring proper fit, realistic fabric behavior, and appropriate lighting and shadows.`
    },
    'change_background': {
        template: 'Change background around {object} to {target}',
        description: (target) => `Replace the background with ${target || 'a new environment'}, maintaining {object} in its exact position with proper lighting integration and realistic perspective.`
    },
    'enhance_quality': {
        template: 'Enhance quality of {object}',
        description: () => `Enhance the quality and detail of {object}, improving sharpness, clarity, and visual fidelity while maintaining the original appearance and characteristics.`
    },
    'custom': {
        template: '{target}',
        description: (target) => target || 'Apply custom modification to the selected region as specified.'
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