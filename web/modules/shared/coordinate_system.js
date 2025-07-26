/**
 * 统一坐标系统管理器
 * 解决图层缩放、SVG绘制、变换控制器之间的坐标系统不一致问题
 */

export class CoordinateSystem {
    constructor(modal) {
        this.modal = modal;
        this.canvasContainer = modal.querySelector('#image-canvas');
        this.mainImage = modal.querySelector('#vpe-main-image');
        this.drawingLayer = modal.querySelector('#drawing-layer');
        
        // 缓存计算结果，避免重复计算
        this.cache = {
            imageScale: null,
            layerScale: null,
            canvasRect: null,
            imageRect: null
        };
        
        console.log('🎯 [COORDS] CoordinateSystem 初始化');
    }
    
    /**
     * 清除缓存，当图像尺寸或缩放改变时调用
     */
    clearCache() {
        this.cache = {
            imageScale: null,
            layerScale: null,
            canvasRect: null,
            imageRect: null
        };
        console.log('🧹 [COORDS] 坐标缓存已清除');
    }
    
    /**
     * 获取图像的原始缩放因子（来自图层transform）
     */
    getImageScale() {
        if (this.cache.imageScale !== null) {
            return this.cache.imageScale;
        }
        
        // 查找第一个图层容器来获取缩放信息
        const firstLayer = this.modal.querySelector('[id^="canvas-layer-"]');
        if (firstLayer) {
            const transform = window.getComputedStyle(firstLayer).transform;
            if (transform && transform !== 'none') {
                // 解析 transform: scale(x) translate(...)
                const scaleMatch = transform.match(/scale\(([0-9.]+)\)/);
                if (scaleMatch) {
                    this.cache.imageScale = parseFloat(scaleMatch[1]);
                    console.log('📏 [COORDS] 图像缩放因子:', this.cache.imageScale);
                    return this.cache.imageScale;
                }
            }
        }
        
        this.cache.imageScale = 1;
        console.log('⚠️ [COORDS] 未找到缩放因子，使用默认值 1');
        return 1;
    }
    
    /**
     * 获取画布容器的边界框
     */
    getCanvasRect() {
        if (this.cache.canvasRect !== null) {
            return this.cache.canvasRect;
        }
        
        if (!this.canvasContainer) {
            console.error('❌ [COORDS] 画布容器未找到');
            return { left: 0, top: 0, width: 0, height: 0 };
        }
        
        this.cache.canvasRect = this.canvasContainer.getBoundingClientRect();
        return this.cache.canvasRect;
    }
    
    /**
     * 获取主图的边界框和逻辑尺寸
     */
    getImageInfo() {
        if (this.cache.imageRect !== null) {
            return this.cache.imageRect;
        }
        
        if (!this.mainImage) {
            console.error('❌ [COORDS] 主图未找到');
            return null;
        }
        
        const imageRect = this.mainImage.getBoundingClientRect();
        const scale = this.getImageScale();
        
        // 计算逻辑尺寸（未缩放前的尺寸）
        const logicalWidth = imageRect.width / scale;
        const logicalHeight = imageRect.height / scale;
        
        this.cache.imageRect = {
            // 实际显示位置和尺寸
            displayRect: {
                left: imageRect.left,
                top: imageRect.top,
                width: imageRect.width,
                height: imageRect.height
            },
            // 逻辑尺寸（原始尺寸）
            logicalSize: {
                width: logicalWidth,
                height: logicalHeight
            },
            // 缩放因子
            scale: scale
        };
        
        console.log('🖼️ [COORDS] 图像信息:', this.cache.imageRect);
        return this.cache.imageRect;
    }
    
    /**
     * 将鼠标坐标转换为图像逻辑坐标
     * @param {number} clientX - 鼠标X坐标
     * @param {number} clientY - 鼠标Y坐标
     * @returns {Object} {x, y} 图像逻辑坐标
     */
    mouseToImageCoords(clientX, clientY) {
        const canvasRect = this.getCanvasRect();
        const imageInfo = this.getImageInfo();
        
        if (!imageInfo) {
            return { x: 0, y: 0 };
        }
        
        // 转换为相对于画布容器的坐标
        const canvasRelativeX = clientX - canvasRect.left;
        const canvasRelativeY = clientY - canvasRect.top;
        
        // 转换为相对于图像显示区域的坐标
        const imageDisplayLeft = imageInfo.displayRect.left - canvasRect.left;
        const imageDisplayTop = imageInfo.displayRect.top - canvasRect.top;
        
        const imageRelativeX = canvasRelativeX - imageDisplayLeft;
        const imageRelativeY = canvasRelativeY - imageDisplayTop;
        
        // 转换为图像逻辑坐标（考虑缩放）
        const logicalX = imageRelativeX / imageInfo.scale;
        const logicalY = imageRelativeY / imageInfo.scale;
        
        console.log('🖱️ [COORDS] 鼠标到图像坐标转换:', {
            mouse: { x: clientX, y: clientY },
            canvasRelative: { x: canvasRelativeX, y: canvasRelativeY },
            imageRelative: { x: imageRelativeX, y: imageRelativeY },
            logical: { x: logicalX, y: logicalY },
            scale: imageInfo.scale
        });
        
        return { x: logicalX, y: logicalY };
    }
    
    /**
     * 将图像逻辑坐标转换为画布坐标
     * @param {number} logicalX - 图像逻辑X坐标
     * @param {number} logicalY - 图像逻辑Y坐标
     * @returns {Object} {x, y} 画布坐标
     */
    imageToCanvasCoords(logicalX, logicalY) {
        const canvasRect = this.getCanvasRect();
        const imageInfo = this.getImageInfo();
        
        if (!imageInfo) {
            return { x: 0, y: 0 };
        }
        
        // 转换为图像显示坐标（应用缩放）
        const imageDisplayX = logicalX * imageInfo.scale;
        const imageDisplayY = logicalY * imageInfo.scale;
        
        // 转换为相对于画布容器的坐标
        const imageDisplayLeft = imageInfo.displayRect.left - canvasRect.left;
        const imageDisplayTop = imageInfo.displayRect.top - canvasRect.top;
        
        const canvasX = imageDisplayLeft + imageDisplayX;
        const canvasY = imageDisplayTop + imageDisplayY;
        
        return { x: canvasX, y: canvasY };
    }
    
    /**
     * 获取图像在画布中的显示区域（用于变换控制器定位）
     * @returns {Object} {left, top, width, height} 相对于画布容器的位置和尺寸
     */
    getImageDisplayBounds() {
        const canvasRect = this.getCanvasRect();
        const imageInfo = this.getImageInfo();
        
        if (!imageInfo) {
            return { left: 0, top: 0, width: 0, height: 0 };
        }
        
        const bounds = {
            left: imageInfo.displayRect.left - canvasRect.left,
            top: imageInfo.displayRect.top - canvasRect.top,
            width: imageInfo.displayRect.width,
            height: imageInfo.displayRect.height
        };
        
        console.log('📦 [COORDS] 图像显示边界:', bounds);
        return bounds;
    }
    
    /**
     * 获取SVG绘制层的坐标转换信息
     * @returns {Object} SVG坐标转换信息
     */
    getSVGCoordInfo() {
        const drawingLayer = this.modal.querySelector('#drawing-layer');
        const svg = drawingLayer ? drawingLayer.querySelector('svg') : null;
        
        if (!svg) {
            console.error('❌ [COORDS] SVG绘制层未找到');
            return null;
        }
        
        const svgRect = svg.getBoundingClientRect();
        const canvasRect = this.getCanvasRect();
        const viewBox = svg.viewBox.baseVal;
        
        return {
            svgRect,
            canvasRect,
            viewBox,
            // SVG相对于画布的位置
            svgRelativeLeft: svgRect.left - canvasRect.left,
            svgRelativeTop: svgRect.top - canvasRect.top
        };
    }
    
    /**
     * 将鼠标坐标转换为SVG坐标（考虑图层缩放）
     * @param {number} clientX - 鼠标X坐标  
     * @param {number} clientY - 鼠标Y坐标
     * @returns {Object} {x, y} SVG坐标
     */
    mouseToSVGCoords(clientX, clientY) {
        const svgInfo = this.getSVGCoordInfo();
        if (!svgInfo) {
            return { x: 0, y: 0 };
        }
        
        // 先转换为图像逻辑坐标，再转换为SVG坐标
        const imageCoords = this.mouseToImageCoords(clientX, clientY);
        const imageInfo = this.getImageInfo();
        
        if (!imageInfo) {
            // 回退到旧方法
            const svgRelativeX = clientX - svgInfo.svgRect.left;
            const svgRelativeY = clientY - svgInfo.svgRect.top;
            const scaleX = svgRelativeX / svgInfo.svgRect.width;
            const scaleY = svgRelativeY / svgInfo.svgRect.height;
            const svgX = scaleX * svgInfo.viewBox.width;
            const svgY = scaleY * svgInfo.viewBox.height;
            return { x: svgX, y: svgY };
        }
        
        // 将图像逻辑坐标转换为SVG viewBox坐标
        // 假设SVG viewBox与图像逻辑尺寸匹配
        const svgX = (imageCoords.x / imageInfo.logicalSize.width) * svgInfo.viewBox.width;
        const svgY = (imageCoords.y / imageInfo.logicalSize.height) * svgInfo.viewBox.height;
        
        console.log('📐 [COORDS] 鼠标到SVG坐标转换（新方法）:', {
            mouse: { x: clientX, y: clientY },
            imageCoords: imageCoords,
            imageLogicalSize: imageInfo.logicalSize,
            viewBox: { width: svgInfo.viewBox.width, height: svgInfo.viewBox.height },
            final: { x: svgX, y: svgY }
        });
        
        return { x: svgX, y: svgY };
    }
}

/**
 * 获取模态框的坐标系统管理器实例
 * @param {Element} modal - 模态框元素
 * @returns {CoordinateSystem} 坐标系统管理器实例
 */
export function getCoordinateSystem(modal) {
    if (!modal._coordinateSystem) {
        modal._coordinateSystem = new CoordinateSystem(modal);
    }
    return modal._coordinateSystem;
}

/**
 * 清除模态框的坐标系统缓存
 * @param {Element} modal - 模态框元素
 */
export function clearCoordinateCache(modal) {
    if (modal._coordinateSystem) {
        modal._coordinateSystem.clearCache();
    }
}