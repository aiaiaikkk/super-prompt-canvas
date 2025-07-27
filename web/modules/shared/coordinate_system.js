/**
 * 统一坐标系统管理器
 * 解决图层缩放、SVG绘制、变换控制器之间的坐标系统不一致问题
 */

export class CoordinateSystem {
    constructor(modal) {
        this.modal = modal;
        this.canvasContainer = modal.querySelector('#image-canvas');
        // 🔧 修复：移除一次性主图引用，改为动态获取以确保一致性
        // this.mainImage = modal.querySelector('#vpe-main-image'); // 不再需要
        this.drawingLayer = modal.querySelector('#drawing-layer');
        
        // 缓存计算结果，避免重复计算
        this.cache = {
            imageScale: null,
            layerScale: null,
            canvasRect: null,
            imageRect: null
        };
        
        console.log('🎯 [COORDS] CoordinateSystem 初始化（复合缩放系统模式）');
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
        
        // 🔧 修复：动态获取主图元素，确保引用有效
        const mainImage = this.modal.querySelector('#vpe-main-image');
        if (!mainImage) {
            console.error('❌ [COORDS] 主图未找到');
            return null;
        }
        
        const imageRect = mainImage.getBoundingClientRect();
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
        
        console.log('🖼️ [COORDS] 图像信息（动态获取，备用）:', this.cache.imageRect);
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
     * 获取所有缩放因子（复合缩放系统）
     * @returns {Object} 全面缩放信息
     */
    getAllScaleFactors() {
        let zoomScale = 1;
        let layerScale = 1;
        let totalScale = 1;
        
        // 1. 获取zoom-container的缩放因子
        const zoomContainer = this.modal.querySelector('#zoom-container');
        if (zoomContainer) {
            const transform = window.getComputedStyle(zoomContainer).transform;
            if (transform && transform !== 'none') {
                const scaleMatch = transform.match(/scale\(([0-9.]+)\)/);
                if (scaleMatch) {
                    zoomScale = parseFloat(scaleMatch[1]);
                }
            }
        }
        
        // 2. 获取canvas-layer的缩放因子
        const firstLayer = this.modal.querySelector('[id^="canvas-layer-"]');
        if (firstLayer) {
            const transform = window.getComputedStyle(firstLayer).transform;
            if (transform && transform !== 'none') {
                const scaleMatch = transform.match(/scale\(([0-9.]+)\)/);
                if (scaleMatch) {
                    layerScale = parseFloat(scaleMatch[1]);
                }
            }
        }
        
        // 3. 计算总体缩放因子
        totalScale = zoomScale * layerScale;
        
        console.log('🔍 [COORDS] 复合缩放分析:', {
            zoomScale,
            layerScale,
            totalScale,
            calculation: `${zoomScale} * ${layerScale} = ${totalScale}`
        });
        
        return {
            zoomScale,
            layerScale,
            totalScale
        };
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
        
        // 🔧 关键修复：获取所有缩放因子
        const scaleFactors = this.getAllScaleFactors();
        
        return {
            svgRect,
            canvasRect,
            viewBox,
            ...scaleFactors, // 包含zoomScale, layerScale, totalScale
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
        
        // 🔧 终极修复：考虑所有缩放层级的复合缩放系统
        const svgRelativeX = clientX - svgInfo.svgRect.left;
        const svgRelativeY = clientY - svgInfo.svgRect.top;
        
        // 计算鼠标在SVG中的相对位置比例
        const scaleX = svgRelativeX / svgInfo.svgRect.width;
        const scaleY = svgRelativeY / svgInfo.svgRect.height;
        
        // 🔜 关键修复：使用总体缩放因子（zoom * layer * object-fit）
        // 这解决了复合缩放系统导致的坐标偏移问题
        const adjustedScaleX = scaleX / svgInfo.totalScale;
        const adjustedScaleY = scaleY / svgInfo.totalScale;
        
        // 转换为SVG viewBox坐标（使用复合缩政调整后的比例）
        const svgX = adjustedScaleX * svgInfo.viewBox.width;
        const svgY = adjustedScaleY * svgInfo.viewBox.height;
        
        // 坐标转换调试日志已移除
        
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