/**
 * Visual Prompt Editor - SVG工具函数
 * 从annotations模块拆分出的SVG相关工具
 * 
 * 版本: v1.0.0 - 从annotations.js拆分
 * 日期: 2025-07-23
 * 拆分来源: visual_prompt_editor_annotations.js 行74-182, 1289-1319
 */

import { createSVGElement } from './visual_prompt_editor_utils.js';

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
    
    const fillOpacity = Math.min((opacity + 30) / 100, 1.0); // 与箭身不透明度保持一致
    const polygon = createSVGElement('polygon', {
        points: '0 0, 10 3.5, 0 7',
        fill: color,
        'fill-opacity': fillOpacity.toString()
    });
    
    marker.appendChild(polygon);
    defs.appendChild(marker);
    
    console.log(`🏹 创建箭头marker: ${markerId}, 不透明度: ${fillOpacity}`);
    return markerId;
}

/**
 * 应用填充样式到SVG形状
 * @param {SVGElement} shape - SVG形状元素
 * @param {string} color - 颜色
 * @param {string} fillMode - 填充模式 ('fill'|'outline')
 * @param {number} opacity - 不透明度 (0-100)
 */
export function applyFillStyle(shape, color, fillMode, opacity = 50) {
    // 计算不透明度值 (0-1)
    const fillOpacity = opacity / 100;
    const strokeOpacity = Math.min(fillOpacity + 0.3, 1.0); // 边框稍微更不透明一些
    
    if (fillMode === 'outline') {
        // 空心样式
        shape.setAttribute('fill', 'none');
        shape.setAttribute('stroke', color);
        shape.setAttribute('stroke-width', '3');
        shape.setAttribute('stroke-opacity', strokeOpacity);
    } else {
        // 实心样式 (默认)
        shape.setAttribute('fill', color);
        shape.setAttribute('fill-opacity', fillOpacity);
        shape.setAttribute('stroke', 'none');
    }
}

/**
 * 应用预览样式到SVG形状
 * @param {SVGElement} shape - SVG形状元素
 * @param {string} color - 颜色
 * @param {string} fillMode - 填充模式 ('fill'|'outline')
 * @param {number} opacity - 不透明度 (0-100)
 */
export function applyPreviewStyle(shape, color, fillMode, opacity = 50) {
    // 预览时使用完全不透明
    const previewOpacity = 1.0; // 预览时完全不透明
    const strokeOpacity = 1.0;   // 边框也完全不透明
    
    if (fillMode === 'outline') {
        // 空心预览样式
        shape.setAttribute('fill', 'none');
        shape.setAttribute('stroke', color);
        shape.setAttribute('stroke-width', '2');
        shape.setAttribute('stroke-opacity', strokeOpacity);
        shape.setAttribute('stroke-dasharray', '5,5');
    } else {
        // 实心预览样式 (默认)
        shape.setAttribute('fill', color);
        shape.setAttribute('fill-opacity', previewOpacity);
        shape.setAttribute('stroke', color);
        shape.setAttribute('stroke-width', '2');
        shape.setAttribute('stroke-dasharray', '5,5');
    }
}

/**
 * 获取下一个annotation编号
 * @param {Element} modal - 模态窗口元素
 * @returns {number} 下一个可用的编号
 */
export function getNextAnnotationNumber(modal) {
    if (!modal.annotations) {
        modal.annotations = [];
    }
    
    // 找到当前最大的编号
    let maxNumber = -1;
    modal.annotations.forEach(annotation => {
        if (annotation.number !== undefined && annotation.number > maxNumber) {
            maxNumber = annotation.number;
        }
    });
    
    const nextNumber = maxNumber + 1;
    console.log('🔢 获取下一个annotation编号:', nextNumber, '(当前最大编号:', maxNumber, ')');
    return nextNumber;
}

/**
 * 添加编号标签
 * @param {SVGElement} svg - SVG元素
 * @param {Object} point - 位置坐标 {x, y}
 * @param {number} number - 编号
 * @param {string} color - 颜色
 */
export function addNumberLabel(svg, point, number, color) {
    const group = createSVGElement('g', {
        'class': 'annotation-label',
        'data-annotation-number': number
    });
    
    // 优化位置 - 在标注左上角
    const labelX = point.x + 8;
    const labelY = point.y - 8;
    
    // 数字文本 - 直接显示数字，无背景圆圈
    const text = createSVGElement('text', {
        'x': labelX,
        'y': labelY,
        'text-anchor': 'middle',
        'dominant-baseline': 'central',
        'fill': '#fff',
        'font-family': 'Arial, sans-serif',
        'font-size': '24',
        'font-weight': 'bold',
        'stroke': '#000',
        'stroke-width': '2',
        'paint-order': 'stroke fill'  // 确保描边在填充之下
    });
    text.textContent = (number + 1).toString();
    
    group.appendChild(text);
    svg.appendChild(group);
    
    console.log('🔢 VPE添加编号标签:', number, '位置:', { labelX, labelY });
}