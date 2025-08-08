/**
 * Visual Prompt Editor - 图像缩放管理器
 * 处理大图片的自动缩放显示，同时保持原始分辨率数据
 */

// 最大显示尺寸限制
export const MAX_DISPLAY_SIZE = 1280;

/**
 * 图像缩放管理器类
 */
export class ImageScalingManager {
    constructor() {
        this.originalImageSizes = new Map(); // 存储原始图像尺寸
        this.displayScales = new Map(); // 存储显示缩放比例
    }

    /**
     * 计算适合的显示尺寸
     * @param {number} originalWidth 原始宽度
     * @param {number} originalHeight 原始高度
     * @returns {Object} 包含显示尺寸和缩放比例的对象
     */
    calculateDisplaySize(originalWidth, originalHeight) {
        // 如果图像尺寸小于等于最大显示尺寸，直接返回原始尺寸
        if (originalWidth <= MAX_DISPLAY_SIZE && originalHeight <= MAX_DISPLAY_SIZE) {
            return {
                displayWidth: originalWidth,
                displayHeight: originalHeight,
                scale: 1.0,
                needsScaling: false
            };
        }

        // 计算缩放比例
        const scaleX = MAX_DISPLAY_SIZE / originalWidth;
        const scaleY = MAX_DISPLAY_SIZE / originalHeight;
        const scale = Math.min(scaleX, scaleY); // 使用较小的缩放比例保持比例

        // 计算显示尺寸
        const displayWidth = Math.round(originalWidth * scale);
        const displayHeight = Math.round(originalHeight * scale);

        return {
            displayWidth,
            displayHeight,
            scale,
            needsScaling: true
        };
    }

    /**
     * 存储图像的原始尺寸信息
     * @param {string} imageId 图像ID
     * @param {number} originalWidth 原始宽度
     * @param {number} originalHeight 原始高度
     */
    storeOriginalSize(imageId, originalWidth, originalHeight) {
        this.originalImageSizes.set(imageId, {
            width: originalWidth,
            height: originalHeight
        });
    }

    /**
     * 获取图像的原始尺寸
     * @param {string} imageId 图像ID
     * @returns {Object|null} 原始尺寸信息
     */
    getOriginalSize(imageId) {
        return this.originalImageSizes.get(imageId) || null;
    }

    /**
     * 存储图像的显示缩放比例
     * @param {string} imageId 图像ID
     * @param {number} scale 缩放比例
     */
    storeDisplayScale(imageId, scale) {
        this.displayScales.set(imageId, scale);
    }

    /**
     * 获取图像的显示缩放比例
     * @param {string} imageId 图像ID
     * @returns {number} 缩放比例
     */
    getDisplayScale(imageId) {
        return this.displayScales.get(imageId) || 1.0;
    }

    /**
     * 将显示坐标转换为原始图像坐标
     * @param {string} imageId 图像ID
     * @param {number} displayX 显示坐标X
     * @param {number} displayY 显示坐标Y
     * @returns {Object} 原始坐标
     */
    displayToOriginalCoordinates(imageId, displayX, displayY) {
        const scale = this.getDisplayScale(imageId);
        return {
            x: Math.round(displayX / scale),
            y: Math.round(displayY / scale)
        };
    }

    /**
     * 将原始图像坐标转换为显示坐标
     * @param {string} imageId 图像ID
     * @param {number} originalX 原始坐标X
     * @param {number} originalY 原始坐标Y
     * @returns {Object} 显示坐标
     */
    originalToDisplayCoordinates(imageId, originalX, originalY) {
        const scale = this.getDisplayScale(imageId);
        return {
            x: Math.round(originalX * scale),
            y: Math.round(originalY * scale)
        };
    }

    /**
     * 清理指定图像的数据
     * @param {string} imageId 图像ID
     */
    clearImageData(imageId) {
        this.originalImageSizes.delete(imageId);
        this.displayScales.delete(imageId);
    }

    /**
     * 清理所有数据
     */
    clearAll() {
        this.originalImageSizes.clear();
        this.displayScales.clear();
    }

    /**
     * 格式化尺寸信息用于显示
     * @param {number} width 宽度
     * @param {number} height 高度
     * @param {number} scale 缩放比例
     * @returns {string} 格式化的尺寸字符串
     */
    formatSizeInfo(width, height, scale = 1.0) {
        if (scale === 1.0) {
            return `${width} × ${height}`;
        } else {
            const origWidth = Math.round(width / scale);
            const origHeight = Math.round(height / scale);
            return `${width} × ${height} (原始: ${origWidth} × ${origHeight})`;
        }
    }
}

/**
 * 创建图像缩放管理器的工厂函数
 * @returns {ImageScalingManager} 新的图像缩放管理器实例
 */
export function createImageScalingManager() {
    return new ImageScalingManager();
}

/**
 * 全局图像缩放管理器实例
 */
export const globalImageScalingManager = createImageScalingManager();