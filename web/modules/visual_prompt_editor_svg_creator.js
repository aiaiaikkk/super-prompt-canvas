/**
 * Visual Prompt Editor - SVG标注创建模块
 * 负责创建各种类型的SVG标注元素（矩形、圆形、箭头、多边形）
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
        
        // 设置矩形属性
        rect.setAttribute('x', Math.min(annotation.start.x, annotation.end.x));
        rect.setAttribute('y', Math.min(annotation.start.y, annotation.end.y));
        rect.setAttribute('width', Math.abs(annotation.end.x - annotation.start.x));
        rect.setAttribute('height', Math.abs(annotation.end.y - annotation.start.y));
        
        // 应用样式
        this.applyAnnotationStyle(rect, annotation);
        
        // 设置标识属性
        rect.setAttribute('data-annotation-id', annotation.id);
        rect.setAttribute('data-shape-type', 'rectangle');
        
        return rect;
    }

    /**
     * 创建矩形的备用方法
     */
    createRectangleOnSVG(svg, annotation) {
        return this.createRectangleElement(annotation);
    }

    /**
     * 创建圆形/椭圆SVG元素
     */
    createCircleElement(annotation, modal) {
        const ellipse = document.createElementNS(this.svgNamespace, 'ellipse');
        
        // 计算椭圆参数
        const centerX = (annotation.start.x + annotation.end.x) / 2;
        const centerY = (annotation.start.y + annotation.end.y) / 2;
        const rx = Math.abs(annotation.end.x - annotation.start.x) / 2;
        const ry = Math.abs(annotation.end.y - annotation.start.y) / 2;
        
        // 设置椭圆属性
        ellipse.setAttribute('cx', centerX);
        ellipse.setAttribute('cy', centerY);
        ellipse.setAttribute('rx', rx);
        ellipse.setAttribute('ry', ry);
        
        // 应用样式
        this.applyAnnotationStyle(ellipse, annotation);
        
        // 设置标识属性
        ellipse.setAttribute('data-annotation-id', annotation.id);
        ellipse.setAttribute('data-shape-type', 'circle');
        
        return ellipse;
    }

    /**
     * 创建圆形的备用方法
     */
    createCircleOnSVG(svg, annotation) {
        return this.createCircleElement(annotation, null);
    }

    /**
     * 创建箭头SVG元素
     */
    createArrowElement(annotation, modal) {
        const g = document.createElementNS(this.svgNamespace, 'g');
        
        // 创建箭头线条
        const line = document.createElementNS(this.svgNamespace, 'line');
        line.setAttribute('x1', annotation.start.x);
        line.setAttribute('y1', annotation.start.y);
        line.setAttribute('x2', annotation.end.x);
        line.setAttribute('y2', annotation.end.y);
        line.setAttribute('stroke', annotation.color || '#ff0000');
        line.setAttribute('stroke-width', '2');
        line.setAttribute('marker-end', 'url(#arrowhead)');
        
        // 创建箭头头部
        const arrowhead = this.createArrowhead(annotation);
        
        // 组装箭头
        g.appendChild(line);
        if (arrowhead) {
            g.appendChild(arrowhead);
        }
        
        // 设置标识属性
        g.setAttribute('data-annotation-id', annotation.id);
        g.setAttribute('data-shape-type', 'arrow');
        
        return g;
    }

    /**
     * 创建箭头头部
     */
    createArrowhead(annotation) {
        // 计算箭头头部的位置和角度
        const dx = annotation.end.x - annotation.start.x;
        const dy = annotation.end.y - annotation.start.y;
        const angle = Math.atan2(dy, dx);
        
        // 箭头头部的大小
        const headLength = 15;
        const headWidth = 8;
        
        // 计算箭头头部的三个点
        const x1 = annotation.end.x - headLength * Math.cos(angle - Math.PI / 6);
        const y1 = annotation.end.y - headLength * Math.sin(angle - Math.PI / 6);
        const x2 = annotation.end.x - headLength * Math.cos(angle + Math.PI / 6);
        const y2 = annotation.end.y - headLength * Math.sin(angle + Math.PI / 6);
        
        // 创建箭头头部多边形
        const polygon = document.createElementNS(this.svgNamespace, 'polygon');
        const points = `${annotation.end.x},${annotation.end.y} ${x1},${y1} ${x2},${y2}`;
        polygon.setAttribute('points', points);
        polygon.setAttribute('fill', annotation.color || '#ff0000');
        
        return polygon;
    }

    /**
     * 创建箭头的备用方法
     */
    createArrowOnSVG(svg, annotation) {
        return this.createArrowElement(annotation, null);
    }

    /**
     * 创建多边形SVG元素
     */
    createPolygonElement(annotation, modal) {
        const polygon = document.createElementNS(this.svgNamespace, 'polygon');
        
        // 处理多边形点数据
        let points = '';
        if (annotation.points && Array.isArray(annotation.points)) {
            points = annotation.points.map(point => `${point.x},${point.y}`).join(' ');
        } else if (annotation.start && annotation.end) {
            // 备用方案：使用start和end创建矩形多边形
            const x1 = annotation.start.x;
            const y1 = annotation.start.y;
            const x2 = annotation.end.x;
            const y2 = annotation.end.y;
            points = `${x1},${y1} ${x2},${y1} ${x2},${y2} ${x1},${y2}`;
        }
        
        polygon.setAttribute('points', points);
        
        // 应用样式
        this.applyAnnotationStyle(polygon, annotation);
        
        // 设置标识属性
        polygon.setAttribute('data-annotation-id', annotation.id);
        polygon.setAttribute('data-shape-type', 'polygon');
        
        return polygon;
    }

    /**
     * 创建多边形的备用方法
     */
    createPolygonOnSVG(svg, annotation) {
        return this.createPolygonElement(annotation, null);
    }

    /**
     * 创建画笔路径SVG元素
     */
    createBrushElement(annotation, modal) {
        const path = document.createElementNS(this.svgNamespace, 'path');
        
        // 处理画笔路径数据
        if (annotation.pathData) {
            path.setAttribute('d', annotation.pathData);
        } else if (annotation.points && Array.isArray(annotation.points)) {
            // 从点数组生成路径
            let pathData = '';
            annotation.points.forEach((point, index) => {
                if (index === 0) {
                    pathData += `M ${point.x} ${point.y}`;
                } else {
                    pathData += ` L ${point.x} ${point.y}`;
                }
            });
            path.setAttribute('d', pathData);
        }
        
        // 设置画笔样式
        path.setAttribute('stroke', annotation.color || '#ff0000');
        path.setAttribute('stroke-width', annotation.strokeWidth || '2');
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke-linecap', 'round');
        path.setAttribute('stroke-linejoin', 'round');
        
        // 设置标识属性
        path.setAttribute('data-annotation-id', annotation.id);
        path.setAttribute('data-shape-type', 'brush');
        
        return path;
    }

    /**
     * 应用标注样式
     */
    applyAnnotationStyle(element, annotation) {
        const color = annotation.color || '#ff0000';
        const opacity = annotation.opacity || 50;
        const fillMode = annotation.fillMode || 'filled';
        
        // 设置基础样式
        element.setAttribute('stroke', color);
        element.setAttribute('stroke-width', '2');
        
        // 根据填充模式设置样式
        if (fillMode === 'filled') {
            element.setAttribute('fill', color);
            element.setAttribute('fill-opacity', opacity / 100);
        } else if (fillMode === 'outline') {
            element.setAttribute('fill', 'none');
        } else {
            // 默认半透明填充
            element.setAttribute('fill', color);
            element.setAttribute('fill-opacity', '0.3');
        }
        
        // 设置其他样式属性
        element.setAttribute('stroke-opacity', '1');
        
        // 如果有自定义透明度，应用到整个元素
        if (annotation.opacity !== undefined) {
            element.setAttribute('opacity', annotation.opacity / 100);
        }
    }

    /**
     * 创建标注组容器
     */
    createAnnotationGroup(annotation) {
        const group = document.createElementNS(this.svgNamespace, 'g');
        group.setAttribute('data-annotation-group', annotation.id);
        group.setAttribute('data-annotation-id', annotation.id);
        group.setAttribute('class', 'annotation-group');
        
        return group;
    }

    /**
     * 根据类型创建标注元素
     */
    createElement(annotation, modal) {
        switch (annotation.type) {
            case 'rectangle':
                return this.createRectangleElement(annotation, modal);
            case 'circle':
            case 'ellipse':
                return this.createCircleElement(annotation, modal);
            case 'arrow':
                return this.createArrowElement(annotation, modal);
            case 'polygon':
                return this.createPolygonElement(annotation, modal);
            case 'brush':
            case 'freehand':
                return this.createBrushElement(annotation, modal);
            default:
                console.warn('未知的标注类型:', annotation.type);
                return this.createRectangleElement(annotation, modal); // 默认创建矩形
        }
    }

    /**
     * 添加编号标签
     */
    addNumberLabel(element, annotation, position) {
        const text = document.createElementNS(this.svgNamespace, 'text');
        
        // 设置标签位置
        if (position) {
            text.setAttribute('x', position.x);
            text.setAttribute('y', position.y);
        } else {
            // 默认位置（标注的左上角）
            const x = annotation.start ? annotation.start.x : 0;
            const y = annotation.start ? annotation.start.y - 5 : 0;
            text.setAttribute('x', x);
            text.setAttribute('y', y);
        }
        
        // 设置标签样式和内容
        text.setAttribute('fill', annotation.color || '#ff0000');
        text.setAttribute('font-size', '12');
        text.setAttribute('font-weight', 'bold');
        text.setAttribute('text-anchor', 'start');
        text.textContent = (annotation.number + 1).toString();
        
        // 设置标识属性
        text.setAttribute('data-annotation-label', annotation.id);
        
        return text;
    }

    /**
     * 创建完整的标注（包含形状和标签）
     */
    createCompleteAnnotation(annotation, modal) {
        const group = this.createAnnotationGroup(annotation);
        const element = this.createElement(annotation, modal);
        
        // 添加主要形状
        group.appendChild(element);
        
        // 添加编号标签
        if (annotation.number !== undefined) {
            const label = this.addNumberLabel(element, annotation);
            group.appendChild(label);
        }
        
        return group;
    }
}

/**
 * 将标注添加到SVG并创建独立容器
 * 从主文件迁移的SVG分组逻辑
 */
export function addAnnotationToSVGWithGrouping(svg, annotationElement, annotationId, nodeInstance) {
    console.log(`📝 🆕 NEW - 为标注 ${annotationId} 创建独立SVG容器`);
    
    // 获取模态窗口引用 - 修复：使用多种方式查找
    let modal = null;
    
    // 方法1: 从svg向上查找
    modal = svg.closest('.vpe-modal');
    
    // 方法2: 从drawing-layer向上查找
    if (!modal) {
        const drawingLayer = svg.closest('#drawing-layer');
        if (drawingLayer) {
            modal = drawingLayer.closest('.vpe-modal');
        }
    }
    
    // 方法3: 使用保存的实例引用
    if (!modal && nodeInstance && nodeInstance.modal) {
        modal = nodeInstance.modal;
    }
    
    // 方法3.5: 检查VPE全局实例
    if (!modal && window.currentVPEInstance && window.currentVPEInstance.modal) {
        modal = window.currentVPEInstance.modal;
    }
    
    // 方法4: 直接查找文档中的模态窗口
    if (!modal) {
        modal = document.querySelector('.vpe-modal');
    }
    
    if (!modal) {
        console.log(`❌ 无法找到模态窗口，使用传统方法`);
        // 回退到基本方法
        svg.appendChild(annotationElement);
        return annotationElement;
    }
    
    // 立即为新标注创建独立容器
    const canvasContainer = modal.querySelector('#canvas-container');
    if (!canvasContainer) {
        console.log(`❌ 无法找到画布容器，使用传统方法`);
        svg.appendChild(annotationElement);
        return annotationElement;
    }
    
    // 创建独立的SVG容器
    const annotationSVGContainer = document.createElement('div');
    annotationSVGContainer.id = `annotation-svg-${annotationId}`;
    
    // 修复：动态计算z-index而不是硬编码110
    const currentLayers = nodeInstance?.getCurrentOrderedLayers ? nodeInstance.getCurrentOrderedLayers(modal) : [];
    const baseZIndex = 100;
    let newAnnotationZIndex = baseZIndex + currentLayers.length + 1; // 默认放在最顶层
    
    annotationSVGContainer.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: ${newAnnotationZIndex};
    `;
    
    console.log(`📐 新标注 ${annotationId} 动态Z-index: ${newAnnotationZIndex}`);
    
    // 创建独立的SVG
    const independentSVG = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    independentSVG.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: auto;
    `;
    
    // 复制主SVG的viewBox和属性
    independentSVG.setAttribute('viewBox', svg.getAttribute('viewBox') || '0 0 1920 1080');
    independentSVG.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    
    // 创建标注组
    const annotationGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    annotationGroup.setAttribute('data-annotation-group', annotationId);
    
    // 将元素添加到分组
    annotationGroup.appendChild(annotationElement);
    
    // 组装结构：容器 -> SVG -> 组 -> 标注元素
    independentSVG.appendChild(annotationGroup);
    annotationSVGContainer.appendChild(independentSVG);
    
    // 将标注容器添加到image-canvas中（与其他图层同级）
    const imageCanvas = modal.querySelector('#image-canvas');
    if (imageCanvas) {
        imageCanvas.appendChild(annotationSVGContainer);
        console.log(`✅ 🆕 NEW - 标注 ${annotationId} 已创建在image-canvas的独立SVG容器中`);
    } else {
        canvasContainer.appendChild(annotationSVGContainer);
        console.log(`⚠️ 🆕 NEW - image-canvas未找到，标注 ${annotationId} 添加到canvas-container`);
    }
    
    return annotationGroup;
}

// 导出创建函数
export function createSVGAnnotationCreator() {
    return new SVGAnnotationCreator();
}