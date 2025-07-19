/**
 * Visual Prompt Editor - 标注管理模块
 * 负责标注的创建、管理、选择和编辑功能
 */

import { createSVGElement, generateId, getCanvasCoordinates, TOOL_NAMES, COLOR_NAMES, mouseToSVGCoordinates } from './visual_prompt_editor_utils.js';
import { updatePromptSelectors } from './visual_prompt_editor_prompts.js';
import { t } from './visual_prompt_editor_i18n.js';
// Note: setActiveTool will be passed as parameter to avoid circular dependency

// 安全的翻译函数包装器
const safeT = (key, fallback) => {
    try {
        if (typeof t === 'function') {
            const result = t(key);
            return result !== key ? result : (fallback || key);
        }
        return fallback || key;
    } catch (e) {
        console.warn('Translation error for key:', key, e);
        return fallback || key;
    }
};

// 翻译操作类型
const translateOperationType = (operationType) => {
    const operationKey = `op_${operationType}`;
    return safeT(operationKey, operationType);
};

// 翻译形状类型
const translateShapeType = (shapeType) => {
    const shapeKey = `shape_${shapeType}`;
    return safeT(shapeKey, shapeType);
};

// 恢复提示词选择状态
const restorePromptSelections = (modal, annotation) => {
    console.log('🔄 开始恢复提示词选择状态', {
        annotationId: annotation.id,
        layerNumber: annotation.number + 1,
        constraintPrompts: annotation.constraintPrompts,
        decorativePrompts: annotation.decorativePrompts
    });
    
    // 先清空所有复选框状态
    const allConstraintCheckboxes = modal.querySelectorAll('#layer-constraint-prompts-container input[type="checkbox"]');
    const allDecorativeCheckboxes = modal.querySelectorAll('#layer-decorative-prompts-container input[type="checkbox"]');
    
    console.log(`🧹 清空状态: ${allConstraintCheckboxes.length} 个约束性 + ${allDecorativeCheckboxes.length} 个修饰性复选框`);
    
    // 清空所有约束性提示词
    allConstraintCheckboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // 清空所有修饰性提示词
    allDecorativeCheckboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // 恢复约束性提示词
    if (annotation.constraintPrompts && annotation.constraintPrompts.length > 0) {
        console.log(`📋 开始恢复 ${annotation.constraintPrompts.length} 个约束性提示词`);
        
        allConstraintCheckboxes.forEach(checkbox => {
            const isChecked = annotation.constraintPrompts.includes(checkbox.value);
            if (isChecked) {
                checkbox.checked = true;
                console.log(`📋 ✅ 约束性提示词已勾选: ${checkbox.value}`);
            }
        });
    } else {
        console.log(`📋 没有约束性提示词需要恢复`);
    }
    
    // 恢复修饰性提示词
    if (annotation.decorativePrompts && annotation.decorativePrompts.length > 0) {
        console.log(`🎨 开始恢复 ${annotation.decorativePrompts.length} 个修饰性提示词`);
        
        allDecorativeCheckboxes.forEach(checkbox => {
            const isChecked = annotation.decorativePrompts.includes(checkbox.value);
            if (isChecked) {
                checkbox.checked = true;
                console.log(`🎨 ✅ 修饰性提示词已勾选: ${checkbox.value}`);
            }
        });
    } else {
        console.log(`🎨 没有修饰性提示词需要恢复`);
    }
    
    console.log('✅ 提示词状态恢复完成');
};

/**
 * 同步创建箭头marker
 */
function createArrowheadMarkerSync(modal, color, opacity) {
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
 */
function applyFillStyle(shape, color, fillMode, opacity = 50) {
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
 */
function applyPreviewStyle(shape, color, fillMode, opacity = 50) {
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
 */
function getNextAnnotationNumber(modal) {
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
 * 绑定画布交互事件
 */

export function bindCanvasInteractionEvents(modal) {
    console.log('🎨 绑定画布交互事件开始');
    
    // 无论是否已绑定事件，都要更新图层选择器 - 重要：确保标签页切换后选择器正常工作
    updateObjectSelector(modal);
    
    // 检查是否已经绑定过事件，避免重复绑定
    if (modal._canvasEventsBindFlag) {
        console.log('⚠️ 画布交互事件已绑定，跳过重复绑定');
        return;
    }
    
    // 检查绘制层是否存在
    const drawingLayer = modal.querySelector('#drawing-layer');
    if (!drawingLayer) {
        console.warn('⚠️ 画布交互事件绑定时未找到绘制层');
        return;
    }
    
    // 获取必要的DOM元素
    const canvasContainer = modal.querySelector('#canvas-container');
    const zoomContainer = modal.querySelector('#zoom-container');
    const zoomLevel = modal.querySelector('#vpe-zoom-level');
    let currentZoom = modal.currentZoom || 1.0;
    let currentColor = '#ff0000';
    let annotationHistory = [];
    
    if (!canvasContainer) {
        console.error('❌ 无法找到画布容器');
        return;
    }
    
    // 初始化工具和颜色状态
    modal.currentTool = 'rectangle';
    modal.currentColor = currentColor;
    modal.fillMode = 'filled'; // 'filled' 或 'outline'
    
    // 设置初始状态 - 选中第一个工具和颜色
    const firstTool = modal.querySelector('.vpe-tool');
    const firstColor = modal.querySelector('.vpe-color');
    if (firstTool) firstTool.classList.add('active');
    if (firstColor) firstColor.classList.add('active');
    
    // 工具选择事件
    modal.querySelectorAll('.vpe-tool').forEach(tool => {
        tool.addEventListener('click', (e) => {
            // 清除其他工具的激活状态
            modal.querySelectorAll('.vpe-tool').forEach(t => t.classList.remove('active'));
            tool.classList.add('active');
            
            const toolName = tool.dataset.tool;
            modal.currentTool = toolName;
            setActiveTool(modal, toolName);
            
            // 显示/隐藏画笔控制面板
            const brushControls = modal.querySelector('#vpe-brush-controls');
            if (brushControls) {
                if (toolName === 'brush') {
                    brushControls.style.display = 'flex';
                } else {
                    brushControls.style.display = 'none';
                }
            }
            
            console.log('🛠️ 工具切换:', toolName);
        });
    });
    
    // 颜色选择事件
    modal.querySelectorAll('.vpe-color').forEach(colorBtn => {
        colorBtn.addEventListener('click', (e) => {
            // 清除其他颜色的激活状态
            modal.querySelectorAll('.vpe-color').forEach(c => c.classList.remove('active'));
            colorBtn.classList.add('active');
            
            const color = colorBtn.dataset.color;
            modal.currentColor = color;
            currentColor = color;
            
            console.log('🎨 颜色切换:', color);
        });
    });
    
    // 填充模式切换事件 - 注释掉，由main文件处理
    // const fillToggleBtn = modal.querySelector('#vpe-fill-toggle');
    // if (fillToggleBtn) {
    //     fillToggleBtn.addEventListener('click', (e) => {
    //         // 切换填充模式
    //         if (modal.fillMode === 'filled') {
    //             modal.fillMode = 'outline';
    //             fillToggleBtn.textContent = '⭕ Outline';
    //             fillToggleBtn.classList.add('outline');
    //             console.log('🔄 切换到空心模式');
    //         } else {
    //             modal.fillMode = 'filled';
    //             fillToggleBtn.textContent = '🔴 Filled';
    //             fillToggleBtn.classList.remove('outline');
    //             console.log('🔄 切换到实心模式');
    //         }
    //         
    //         console.log('🎯 当前填充模式:', modal.fillMode);
    //     });
    // }
    
    // 初始化绘制状态
    let isDrawing = false;
    let startPoint = null;
    let currentPreview = null;
    let freehandPoints = [];
    let isDrawingFreehand = false;
    
    // 绘制鼠标按下事件
    canvasContainer.addEventListener('mousedown', function(e) {
        if (modal.isPanning) return; // 如果正在拖动，不处理绘制
        
        const tool = modal.currentTool || 'rectangle';
        const color = modal.currentColor || currentColor;
        
        // 阻止橡皮擦工具触发绘制事件
        if (tool === 'eraser') {
            console.log('🗑️ 橡皮擦工具不触发绘制事件');
            return;
        }
        
        // 自由绘制工具：左键添加锚点
        if (tool === 'freehand' && e.button === 0) {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('🖱️ VPE自由绘制左键点击');
            
            const drawingLayer = modal.querySelector('#drawing-layer');
            const svg = drawingLayer ? drawingLayer.querySelector('svg') : null;
            
            if (!svg) return;
            
            // 使用工具函数进行坐标转换
            const newPoint = mouseToSVGCoordinates(e, modal);
            
            // 检查是否在画布区域内 - 与坐标转换逻辑保持一致
            const canvasContainer = modal.querySelector('#canvas-container');
            if (canvasContainer) {
                const freehandContainerRect = canvasContainer.getBoundingClientRect();
                const containerRelativeX = e.clientX - freehandContainerRect.left;
                const containerRelativeY = e.clientY - freehandContainerRect.top;
                
                if (containerRelativeX >= 0 && containerRelativeX <= freehandContainerRect.width && 
                    containerRelativeY >= 0 && containerRelativeY <= freehandContainerRect.height) {
                    
                    // 如果是第一个点，开始绘制
                    if (!modal.isDrawingFreehand) {
                        startFreehandDrawing(modal, newPoint, color);
                    } else {
                        // 添加新的锚点
                        addFreehandPoint(modal, newPoint);
                    }
                }
            }
            return false;
        }
        
        // 其他工具：只处理左键
        if (e.button !== 0) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        console.log('🖱️ VPE画布左键按下，当前工具:', tool);
        
        // 如果是橡皮擦工具，不进行绘制，交给橡皮擦事件处理
        if (tool === 'eraser') {
            console.log('🗑️ 橡皮擦工具激活，不进行绘制');
            return;
        }
        
        const clickPoint = getCanvasCoordinates(e, canvasContainer);
        console.log('🖱️ VPE点击位置:', clickPoint);
        console.log('🖱️ Shift键状态:', e.shiftKey);
        
        const zoomContainer = modal.querySelector('#zoom-container');
        const drawingLayer = modal.querySelector('#drawing-layer');
        const svg = drawingLayer ? drawingLayer.querySelector('svg') : null;
        
        if (!svg || !zoomContainer) {
            console.error('❌ VPE缺少必要元素');
            return;
        }
        
        // 获取SVG的实际尺寸和变换
        const svgRect = svg.getBoundingClientRect();
        const mousedownContainerRect = canvasContainer.getBoundingClientRect();
        
        // 获取当前的zoom值
        const actualZoom = modal.currentZoom || 1.0;
        console.log('🔍 VPE当前缩放比例:', actualZoom);
        
        // 添加详细的调试信息
        console.log('🔍 调试坐标转换:', {
            clickPoint,
            containerRect: { width: mousedownContainerRect.width, height: mousedownContainerRect.height },
            svgViewBox: { width: svg.viewBox.baseVal.width, height: svg.viewBox.baseVal.height },
            svgRect: { width: svgRect.width, height: svgRect.height }
        });
        
        // 获取图像元素和其位置
        const image = modal.querySelector('#vpe-main-image');
        if (image) {
            const imageRect = image.getBoundingClientRect();
            console.log('🖼️ 图像位置信息:', {
                imageRect: { 
                    left: imageRect.left, 
                    top: imageRect.top, 
                    width: imageRect.width, 
                    height: imageRect.height 
                },
                naturalSize: {
                    width: image.naturalWidth,
                    height: image.naturalHeight
                }
            });
            
            // 尝试新的坐标计算方法
            const drawingLayer = modal.querySelector('#drawing-layer');
            const layerRect = drawingLayer.getBoundingClientRect();
            console.log('🎨 绘图层位置:', {
                layerRect: {
                    left: layerRect.left,
                    top: layerRect.top, 
                    width: layerRect.width,
                    height: layerRect.height
                }
            });
        }
        
        // 使用工具函数进行精确坐标转换
        const svgCoords = mouseToSVGCoordinates(e, modal);
        
        console.log('📐 坐标映射:', {
            mouse: { x: e.clientX, y: e.clientY },
            finalSVG: svgCoords
        });
        
        startPoint = { x: svgCoords.x, y: svgCoords.y, shiftKey: e.shiftKey };
        
        // 画笔工具特殊处理：开始绘制路径
        if (tool === 'brush') {
            console.log('🖌️ 开始画笔绘制');
            startBrushStroke(modal, svgCoords, color);
        }
        
        console.log('📍 VPE开始绘制位置:', startPoint);
        
        // 检查是否在有效绘制区域内 - 与坐标转换逻辑保持一致
        const validationContainerRect = canvasContainer.getBoundingClientRect();
        const containerRelativeX = e.clientX - validationContainerRect.left;
        const containerRelativeY = e.clientY - validationContainerRect.top;
        
        // 简化区域检查：只要在画布容器内就允许绘制
        if (containerRelativeX >= 0 && containerRelativeX <= validationContainerRect.width && 
            containerRelativeY >= 0 && containerRelativeY <= validationContainerRect.height) {
            console.log('✅ VPE点击在画布区域内');
            isDrawing = true;
            console.log('🎨 VPE开始绘制');
            
            startShapeDrawing(modal, startPoint, tool, color);
        } else {
            console.log('❌ VPE点击在画布区域外');
        }
        
        return false;
    });
    
    // 绘制鼠标移动事件
    canvasContainer.addEventListener('mousemove', function(e) {
        // 如果正在拖动，交给拖动处理
        if (modal.isPanning) {
            return;
        }
        
        // 更新光标
        const cursors = {
            'select': 'default',
            'rectangle': 'crosshair',
            'circle': 'crosshair',
            'arrow': 'crosshair',
            'freehand': 'crosshair',
            'lasso': 'crosshair',
            'magic-wand': 'pointer',
            'eraser': 'pointer'
        };
        
        if (!modal.isPanning) {
            canvasContainer.style.cursor = cursors[modal.currentTool] || 'default';
        }
        
        const currentTool = modal.currentTool || 'rectangle';
        
        if (isDrawing && startPoint) {
            const drawingLayer = modal.querySelector('#drawing-layer');
            const svg = drawingLayer ? drawingLayer.querySelector('svg') : null;
            
            if (!svg) return;
            
            // 使用工具函数进行坐标转换
            const svgCoords = mouseToSVGCoordinates(e, modal);
            const endPoint = { x: svgCoords.x, y: svgCoords.y, shiftKey: e.shiftKey || startPoint.shiftKey };
            
            if (currentTool === 'brush') {
                continueBrushStroke(modal, svgCoords);
            } else if (currentTool !== 'freehand') {
                updatePreview(modal, startPoint, endPoint, currentTool, modal.currentColor);
            }
        }
    });
    
    // 绘制鼠标释放事件
    canvasContainer.addEventListener('mouseup', function(e) {
        if (e.button !== 0 || !isDrawing) return;
        
        const drawingLayer = modal.querySelector('#drawing-layer');
        const svg = drawingLayer ? drawingLayer.querySelector('svg') : null;
        
        if (!svg) return;
        
        // 使用工具函数进行坐标转换
        const svgCoords = mouseToSVGCoordinates(e, modal);
        
        console.log('VPE画布坐标:', svgCoords);
        
        const endPoint = { x: svgCoords.x, y: svgCoords.y, shiftKey: e.shiftKey || startPoint.shiftKey };
        
        console.log('📍 VPE结束绘制位置:', endPoint);
        console.log('✨ VPE尝试完成绘制');
        
        if (modal.currentTool === 'brush') {
            console.log('🖌️ 完成画笔绘制');
            finishBrushStroke(modal);
        } else if (modal.currentTool !== 'freehand') {
            finishDrawing(modal, startPoint, endPoint, modal.currentTool, modal.currentColor);
        }
        
        isDrawing = false;
        startPoint = null;
        currentPreview = null;
    });
    
    // 右键事件 - 用于结束freehand绘制
    canvasContainer.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        
        const tool = modal.currentTool || 'rectangle';
        
        // 自由绘制工具：右键闭合曲线
        if (tool === 'freehand' && modal.isDrawingFreehand) {
            console.log('🖱️ VPE自由绘制右键闭合');
            finishFreehandDrawing(modal);
        }
        
        return false;
    });
    
    // 标记事件已绑定
    modal._canvasEventsBindFlag = true;
}

/**
 * 开始形状绘制
 */
function startShapeDrawing(modal, startPoint, tool, color) {
    console.log('🎨 开始形状绘制:', { tool, color });
}

/**
 * 开始自由绘制
 */
function startFreehandDrawing(modal, startPoint, color) {
    console.log('🎨 开始自由绘制，起始点:', startPoint);
    const drawingLayer = modal.querySelector('#drawing-layer');
    const svg = drawingLayer ? drawingLayer.querySelector('svg') : null;
    
    if (!svg) return;
    
    // 初始化freehand状态
    modal.freehandPoints = [startPoint];
    modal.isDrawingFreehand = true;
    modal.currentColor = color;
    
    // 创建临时路径预览
    const path = createSVGElement('path', {
        'd': `M ${startPoint.x} ${startPoint.y}`,
        'stroke': color,
        'stroke-width': '3',
        'fill': 'none',
        'stroke-dasharray': '5,5',
        'class': 'freehand-preview'
    });
    
    svg.appendChild(path);
    modal.currentFreehandPath = path;
    
    // 添加第一个锚点标记
    addAnchorPoint(svg, startPoint, 0, color);
    
    console.log('✅ 自由绘制已开始，等待下一个锚点（左击）或闭合（右击）');
}

/**
 * 添加自由绘制锚点
 */
function addFreehandPoint(modal, newPoint) {
    if (!modal.isDrawingFreehand || !modal.freehandPoints) return;
    
    console.log('📍 添加自由绘制锚点:', newPoint);
    
    // 添加点到数组
    modal.freehandPoints.push(newPoint);
    
    const drawingLayer = modal.querySelector('#drawing-layer');
    const svg = drawingLayer ? drawingLayer.querySelector('svg') : null;
    
    if (!svg || !modal.currentFreehandPath) return;
    
    // 更新路径预览
    const pathData = modal.freehandPoints.map((point, index) => {
        return index === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`;
    }).join(' ');
    
    modal.currentFreehandPath.setAttribute('d', pathData);
    
    // 添加锚点标记
    const pointIndex = modal.freehandPoints.length - 1;
    addAnchorPoint(svg, newPoint, pointIndex, modal.currentColor);
    
    console.log(`✅ 锚点${pointIndex}已添加，当前共${modal.freehandPoints.length}个点`);
}

/**
 * 添加锚点标记
 */
function addAnchorPoint(svg, point, index, color) {
    const anchorPoint = createSVGElement('circle', {
        'cx': point.x,
        'cy': point.y,
        'r': '4',
        'fill': color,
        'stroke': '#fff',
        'stroke-width': '2',
        'class': 'anchor-point freehand-preview',
        'data-point-index': index
    });
    
    svg.appendChild(anchorPoint);
}

/**
 * 完成自由绘制
 */
function finishFreehandDrawing(modal) {
    if (!modal.isDrawingFreehand || !modal.freehandPoints || modal.freehandPoints.length < 3) {
        console.log('⚠️ 自由绘制至少需要3个点，当前:', modal.freehandPoints?.length || 0);
        return;
    }
    
    // 防止重复调用
    if (modal._freehandProcessing) {
        console.log('⚠️ 自由绘制正在处理中，跳过重复调用');
        return;
    }
    modal._freehandProcessing = true;
    
    console.log('✨ 完成自由绘制，点数:', modal.freehandPoints.length);
    
    const drawingLayer = modal.querySelector('#drawing-layer');
    const svg = drawingLayer ? drawingLayer.querySelector('svg') : null;
    
    if (!svg) return;
    
    // 移除所有预览元素（路径和锚点）
    svg.querySelectorAll('.freehand-preview').forEach(el => el.remove());
    
    // 初始化annotations数组
    if (!modal.annotations) {
        modal.annotations = [];
    }
    
    // 获取标注编号（考虑已恢复的annotations）
    const annotationNumber = getNextAnnotationNumber(modal);
    const annotationId = generateId('annotation');
    
    // 创建最终的多边形
    const points = modal.freehandPoints.map(p => `${p.x},${p.y}`).join(' ');
    const polygon = createSVGElement('polygon', {
        'points': points,
        'class': 'annotation-shape',
        'data-annotation-id': annotationId
    });
    
    // 应用填充样式
    const fillMode = modal.fillMode || 'filled';
    const opacity = modal.currentOpacity || 50;
    console.log('🎨 多边形应用填充样式:', { color: modal.currentColor, fillMode, opacity });
    applyFillStyle(polygon, modal.currentColor, fillMode, opacity);
    
    svg.appendChild(polygon);
    
    // 计算多边形的中心点用于放置编号
    const centerX = modal.freehandPoints.reduce((sum, p) => sum + p.x, 0) / modal.freehandPoints.length;
    const centerY = modal.freehandPoints.reduce((sum, p) => sum + p.y, 0) / modal.freehandPoints.length;
    const centerPoint = { x: centerX, y: centerY };
    
    // 添加编号标签
    addNumberLabel(svg, centerPoint, annotationNumber, modal.currentColor);
    
    // 添加到标注数组
    modal.annotations.push({
        id: annotationId,
        type: 'freehand',
        points: modal.freehandPoints,
        color: modal.currentColor,
        fillMode: fillMode,
        opacity: opacity,
        number: annotationNumber,
        centerPoint: centerPoint,
        // 新增：独立的操作类型和描述
        operationType: 'add_object',  // 默认操作类型
        description: '',  // 独立的描述文本
        category: 'local'  // 模板分类
    });
    
    console.log('✅ VPE自由绘制标注已添加:', annotationId, '编号:', annotationNumber);
    console.log('📋 VPE当前标注数量:', modal.annotations.length);
    
    // 更新对象选择器
    updateObjectSelector(modal);
    
    // 重置状态
    modal.isDrawingFreehand = false;
    modal.freehandPoints = [];
    modal.currentFreehandPath = null;
    modal._freehandProcessing = false;
}

/**
 * 更新绘制预览
 */
function updatePreview(modal, startPoint, endPoint, tool, color) {
    const drawingLayer = modal.querySelector('#drawing-layer');
    const svg = drawingLayer ? drawingLayer.querySelector('svg') : null;
    
    if (!svg) return;
    
    // 移除现有预览
    const existingPreview = svg.querySelector('.shape-preview');
    if (existingPreview) {
        existingPreview.remove();
    }
    
    let shape = null;
    
    if (tool === 'rectangle') {
        const x = Math.min(startPoint.x, endPoint.x);
        const y = Math.min(startPoint.y, endPoint.y);
        const width = Math.abs(endPoint.x - startPoint.x);
        const height = Math.abs(endPoint.y - startPoint.y);
        
        shape = createSVGElement('rect', {
            'x': x,
            'y': y,
            'width': width,
            'height': height,
            'class': 'shape-preview'
        });
        
        // 应用预览样式
        const fillMode = modal.fillMode || 'filled';
        const opacity = modal.currentOpacity || 50;
        console.log('🎨 矩形预览应用填充样式:', { color, fillMode, opacity });
        applyPreviewStyle(shape, color, fillMode, opacity);
    } else if (tool === 'circle') {
        const cx = (startPoint.x + endPoint.x) / 2;
        const cy = (startPoint.y + endPoint.y) / 2;
        let rx = Math.abs(endPoint.x - startPoint.x) / 2;
        let ry = Math.abs(endPoint.y - startPoint.y) / 2;
        
        // Shift键控制正圆
        if (startPoint.shiftKey || endPoint.shiftKey) {
            const r = Math.min(rx, ry);
            rx = r;
            ry = r;
        }
        
        shape = createSVGElement('ellipse', {
            'cx': cx,
            'cy': cy,
            'rx': rx,
            'ry': ry,
            'class': 'shape-preview'
        });
        
        // 应用预览样式
        const fillMode = modal.fillMode || 'filled';
        const opacity = modal.currentOpacity || 50;
        console.log('🎨 椭圆预览应用填充样式:', { color, fillMode, opacity });
        applyPreviewStyle(shape, color, fillMode, opacity);
    } else if (tool === 'arrow') {
        shape = createSVGElement('line', {
            'x1': startPoint.x,
            'y1': startPoint.y,
            'x2': endPoint.x,
            'y2': endPoint.y,
            'stroke': color,
            'stroke-width': '4',
            'stroke-dasharray': '5,5',
            'marker-end': `url(#${createArrowheadMarkerSync(modal, color, modal.currentOpacity || 50)})`,
            'class': 'shape-preview'
        });
    }
    
    if (shape) {
        svg.appendChild(shape);
    }
}

/**
 * 开始画笔绘制
 */
function startBrushStroke(modal, startPoint, color) {
    console.log('🖌️ 开始画笔绘制:', startPoint);
    
    const drawingLayer = modal.querySelector('#drawing-layer');
    const svg = drawingLayer ? drawingLayer.querySelector('svg') : null;
    if (!svg) return;
    
    // 初始化画笔路径数据
    modal.currentBrushStroke = {
        points: [startPoint],
        color: color,
        size: modal.currentBrushSize || 20,
        feather: modal.currentBrushFeather || 5,
        opacity: modal.currentOpacity || 50,
        path: null // SVG path element
    };
    
    // 创建SVG路径元素
    const path = createSVGElement('path', {
        'stroke': color,
        'stroke-width': modal.currentBrushSize || 20,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'fill': 'none',
        'class': 'brush-preview-path'
    });
    
    // 应用不透明度
    const opacity = (modal.currentOpacity || 50) / 100;
    path.setAttribute('stroke-opacity', opacity);
    
    // 如果有羽化，应用滤镜
    if (modal.currentBrushFeather > 0) {
        const filterId = `brush-blur-${Date.now()}`;
        const defs = svg.querySelector('defs') || (() => {
            const defsElement = createSVGElement('defs');
            svg.appendChild(defsElement);
            return defsElement;
        })();
        
        const filter = createSVGElement('filter', {
            'id': filterId,
            'x': '-50%',
            'y': '-50%',
            'width': '200%',
            'height': '200%'
        });
        
        const blur = createSVGElement('feGaussianBlur', {
            'in': 'SourceGraphic',
            'stdDeviation': modal.currentBrushFeather / 2
        });
        
        filter.appendChild(blur);
        defs.appendChild(filter);
        path.setAttribute('filter', `url(#${filterId})`);
    }
    
    // 设置初始路径
    const pathData = `M ${startPoint.x} ${startPoint.y}`;
    path.setAttribute('d', pathData);
    
    svg.appendChild(path);
    modal.currentBrushStroke.path = path;
    
    console.log('🖌️ 画笔路径已创建:', pathData);
}

/**
 * 继续画笔绘制
 */
function continueBrushStroke(modal, point) {
    if (!modal.currentBrushStroke || !modal.currentBrushStroke.path) return;
    
    // 添加点到路径
    modal.currentBrushStroke.points.push(point);
    
    // 更新SVG路径
    const path = modal.currentBrushStroke.path;
    const points = modal.currentBrushStroke.points;
    
    // 生成平滑的路径数据
    let pathData = `M ${points[0].x} ${points[0].y}`;
    
    if (points.length > 2) {
        for (let i = 1; i < points.length - 1; i++) {
            const current = points[i];
            const next = points[i + 1];
            const controlX = (current.x + next.x) / 2;
            const controlY = (current.y + next.y) / 2;
            pathData += ` Q ${current.x} ${current.y} ${controlX} ${controlY}`;
        }
        // 最后一个点
        const lastPoint = points[points.length - 1];
        pathData += ` T ${lastPoint.x} ${lastPoint.y}`;
    } else if (points.length === 2) {
        pathData += ` L ${points[1].x} ${points[1].y}`;
    }
    
    path.setAttribute('d', pathData);
}

/**
 * 完成画笔绘制
 */
function finishBrushStroke(modal) {
    if (!modal.currentBrushStroke) return;
    
    // 防止重复调用
    if (modal._brushProcessing) {
        console.log('⚠️ 画笔绘制正在处理中，跳过重复调用');
        return;
    }
    modal._brushProcessing = true;
    
    console.log('🖌️ 完成画笔绘制，点数:', modal.currentBrushStroke.points.length);
    
    const brushStroke = modal.currentBrushStroke;
    const drawingLayer = modal.querySelector('#drawing-layer');
    const svg = drawingLayer ? drawingLayer.querySelector('svg') : null;
    
    if (!svg || brushStroke.points.length === 0) {
        // 清理临时路径
        if (brushStroke.path) {
            brushStroke.path.remove();
        }
        modal.currentBrushStroke = null;
        modal._brushProcessing = false;
        return;
    }
    
    // 移除预览路径的类名，使其成为正式标注
    if (brushStroke.path) {
        brushStroke.path.classList.remove('brush-preview-path');
        brushStroke.path.classList.add('annotation-shape', 'brush-path');
        
        // 添加标注ID
        const annotationId = generateId('annotation');
        brushStroke.path.setAttribute('data-annotation-id', annotationId);
        
        // 获取标注编号
        if (!modal.annotations) {
            modal.annotations = [];
        }
        const annotationNumber = getNextAnnotationNumber(modal);
        brushStroke.path.setAttribute('data-annotation-number', annotationNumber);
        
        // 添加到标注数组
        modal.annotations.push({
            id: annotationId,
            type: 'brush',
            points: brushStroke.points,
            color: brushStroke.color,
            brushSize: brushStroke.size,
            brushFeather: brushStroke.feather,
            opacity: brushStroke.opacity,
            fillMode: modal.fillMode,
            number: annotationNumber,
            // 新增：独立的操作类型和描述
            operationType: 'add_object',  // 默认操作类型
            description: '',  // 独立的描述文本
            category: 'local',  // 模板分类
            pathData: brushStroke.path.getAttribute('d')
        });
        
        // 添加编号标签
        const firstPoint = brushStroke.points[0];
        addNumberLabel(svg, firstPoint, annotationNumber, brushStroke.color);
        
        console.log('✅ 画笔标注已添加:', annotationId, '编号:', annotationNumber);
        updateObjectSelector(modal);
    }
    
    // 清理
    modal.currentBrushStroke = null;
    modal._brushProcessing = false;
}

/**
 * 完成绘制
 */
function finishDrawing(modal, startPoint, endPoint, tool, color) {
    // 防止重复调用
    if (modal._drawingProcessing) {
        console.log('⚠️ 绘制正在处理中，跳过重复调用');
        return;
    }
    modal._drawingProcessing = true;
    
    const drawingLayer = modal.querySelector('#drawing-layer');
    const svg = drawingLayer ? drawingLayer.querySelector('svg') : null;
    
    if (!svg) {
        modal._drawingProcessing = false;
        return;
    }
    
    // 移除预览
    const existingPreview = svg.querySelector('.shape-preview');
    if (existingPreview) {
        existingPreview.remove();
    }
    
    let shape = null;
    const annotationId = generateId('annotation');
    
    if (tool === 'rectangle') {
        const x = Math.min(startPoint.x, endPoint.x);
        const y = Math.min(startPoint.y, endPoint.y);
        const width = Math.abs(endPoint.x - startPoint.x);
        const height = Math.abs(endPoint.y - startPoint.y);
        
        if (width < 5 || height < 5) {
            console.log('VPE矩形太小，忽略');
            return;
        }
        
        shape = createSVGElement('rect', {
            'x': x,
            'y': y,
            'width': width,
            'height': height,
            'class': 'annotation-shape',
            'data-annotation-id': annotationId
        });
        
        // 应用填充样式
        const fillMode = modal.fillMode || 'filled';
        const opacity = modal.currentOpacity || 50;
        console.log('🎨 矩形应用填充样式:', { color, fillMode, opacity });
        applyFillStyle(shape, color, fillMode, opacity);
        
    } else if (tool === 'circle') {
        const cx = (startPoint.x + endPoint.x) / 2;
        const cy = (startPoint.y + endPoint.y) / 2;
        let rx = Math.abs(endPoint.x - startPoint.x) / 2;
        let ry = Math.abs(endPoint.y - startPoint.y) / 2;
        
        // Shift键控制正圆
        if (startPoint.shiftKey || endPoint.shiftKey) {
            const r = Math.min(rx, ry);
            rx = r;
            ry = r;
            console.log('VPE按下Shift键，绘制正圆:', r);
        } else {
            console.log('VPE绘制椭圆:', { rx, ry });
        }
        
        if (rx < 5 || ry < 5) {
            console.log('VPE椭圆太小，忽略');
            return;
        }
        
        shape = createSVGElement('ellipse', {
            'cx': cx,
            'cy': cy,
            'rx': rx,
            'ry': ry,
            'class': 'annotation-shape',
            'data-annotation-id': annotationId
        });
        
        // 应用填充样式
        const fillMode = modal.fillMode || 'filled';
        const opacity = modal.currentOpacity || 50;
        console.log('🎨 椭圆应用填充样式:', { color, fillMode, opacity });
        applyFillStyle(shape, color, fillMode, opacity);
        
    } else if (tool === 'arrow') {
        shape = createSVGElement('line', {
            'x1': startPoint.x,
            'y1': startPoint.y,
            'x2': endPoint.x,
            'y2': endPoint.y,
            'stroke': color,
            'stroke-width': '6',
            'marker-end': `url(#${createArrowheadMarkerSync(modal, color, modal.currentOpacity || 50)})`,
            'class': 'annotation-shape',
            'data-annotation-id': annotationId
        });
    }
    
    if (shape) {
        // 初始化annotations数组
        if (!modal.annotations) {
            modal.annotations = [];
        }
        
        // 获取正确的编号（考虑已恢复的annotations）
        const annotationNumber = getNextAnnotationNumber(modal);
        
        svg.appendChild(shape);
        
        // 添加编号标签
        addNumberLabel(svg, startPoint, annotationNumber, color);
        
        // 添加到annotations数组
        const annotationData = {
            id: annotationId,
            type: tool,
            start: startPoint,
            end: endPoint,
            color: color,
            fillMode: modal.fillMode,
            opacity: modal.currentOpacity || 50,
            number: annotationNumber,
            // 新增：独立的操作类型和描述
            operationType: 'add_object',  // 默认操作类型
            description: '',  // 独立的描述文本
            category: 'local'  // 模板分类
        };
        
        // 注意：画笔工具使用独立的数据保存逻辑，不使用这个通用函数
        
        modal.annotations.push(annotationData);
        
        console.log('✅ VPE标注已添加:', annotationId, '编号:', annotationNumber);
        console.log('📋 VPE当前标注数量:', modal.annotations.length);
        updateObjectSelector(modal);
    }
    
    // 重置处理标志
    modal._drawingProcessing = false;
}

/**
 * 添加编号标签
 */
function addNumberLabel(svg, point, number, color) {
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


/**
 * 更新下拉复选框式图层选择器
 */
export function updateObjectSelector(modal) {
    const layersList = modal.querySelector('#layers-list');
    const layerOperations = modal.querySelector('#layer-operations');
    const noLayersMessage = modal.querySelector('#no-layers-message');
    const selectionCount = modal.querySelector('#selection-count');
    const selectionCountInfo = modal.querySelector('#selection-count-info');
    
    if (!layersList) {
        console.warn('⚠️ Layers list container not found, skipping update');
        return;
    }
    
    if (!modal.annotations || modal.annotations.length === 0) {
        layersList.innerHTML = `<div style="color: #888; text-align: center; padding: 20px; font-size: 12px;">${safeT('no_layers_message', 'No layers available') || 'No layers available'}</div>`;
        if (layerOperations) layerOperations.style.display = 'none';
        if (noLayersMessage) noLayersMessage.style.display = 'block';
        if (selectionCount) selectionCount.textContent = '0 selected';
        if (selectionCountInfo) selectionCountInfo.textContent = '0 selected';
        return;
    }
    
    // 隐藏空消息，显示操作区域
    if (noLayersMessage) noLayersMessage.style.display = 'none';
    
    // 清空现有列表
    layersList.innerHTML = '';
    
    // 创建图层列表项
    modal.annotations.forEach((annotation, index) => {
        console.log(`🔍 Creating layer item ${index}: number=${annotation.number}, ID=${annotation.id}`);
        
        const objectInfo = getObjectInfo(annotation, index);
        
        const layerItem = document.createElement('div');
        layerItem.style.cssText = `
            display: flex; align-items: center; gap: 8px; padding: 8px; 
            cursor: pointer; margin-bottom: 4px; 
            background: #333; border-radius: 4px;
            transition: all 0.2s ease; 
            border: 1px solid #555;
        `;
        
        const isSelected = modal.selectedLayers?.has(annotation.id) || false;
        if (isSelected) {
            layerItem.style.background = '#4a3a6a';
            layerItem.style.borderColor = '#673AB7';
        }
        
        // 显示图层信息
        const layerName = `${safeT('layer_name', 'Layer')} ${annotation.number + 1}`;
        const operationType = annotation.operationType || 'add_object';
        const translatedOperationType = translateOperationType(operationType);
        const description = annotation.description || safeT('no_description', 'No description');
        
        layerItem.innerHTML = `
            <input type="checkbox" ${isSelected ? 'checked' : ''} 
                   style="width: 14px; height: 14px; cursor: pointer; margin: 0; flex-shrink: 0; accent-color: #673AB7;" 
                   data-annotation-id="${annotation.id}">
            <span style="font-size: 14px; flex-shrink: 0;">${objectInfo.icon}</span>
            <div style="flex: 1; min-width: 0;">
                <div style="color: white; font-size: 12px; font-weight: 600;">
                    ${layerName}
                </div>
                <div style="color: #aaa; font-size: 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    ${translatedOperationType} • ${description.substring(0, 30)}${description.length > 30 ? '...' : ''}
                </div>
            </div>
        `;
        
        // 悬停效果
        layerItem.addEventListener('mouseenter', function() {
            if (!this.querySelector('input[type="checkbox"]').checked) {
                this.style.background = '#3a3a3a';
            }
        });
        layerItem.addEventListener('mouseleave', function() {
            if (!this.querySelector('input[type="checkbox"]').checked) {
                this.style.background = '#333';
            }
        });
        
        layersList.appendChild(layerItem);
        
        // 绑定复选框事件
        const checkbox = layerItem.querySelector('input[type="checkbox"]');
        if (checkbox) {
            console.log(`📋 Binding checkbox event: number=${annotation.number}, ID=${annotation.id}`);
            checkbox.addEventListener('change', function(e) {
                console.log(`✅ Checkbox changed: number=${annotation.number}, checked=${this.checked}`);
                e.stopPropagation();
                toggleLayerSelection(modal, annotation.id, this.checked);
                updateLayerItemStyle(layerItem, this.checked);
            });
        }
        
        // 绑定图层项点击事件（切换复选框）
        layerItem.addEventListener('click', function(e) {
            if (e.target.type !== 'checkbox') {
                checkbox.checked = !checkbox.checked;
                console.log(`🔄 Toggle checkbox: number=${annotation.number}, new state=${checkbox.checked}`);
                toggleLayerSelection(modal, annotation.id, checkbox.checked);
                updateLayerItemStyle(layerItem, checkbox.checked);
            }
        });
    });
    
    // 初始化选中状态管理
    if (!modal.selectedLayers) {
        modal.selectedLayers = new Set();
    }
    
    // 更新选中计数
    updateSelectionCount(modal);
    
    // 绑定按钮事件
    bindLayerListEvents(modal);
    
    // 恢复高亮状态 - 根据当前选中的图层
    const selectedIds = Array.from(modal.selectedLayers || []);
    if (selectedIds.length > 0) {
        highlightSelectedAnnotations(modal, selectedIds);
    }
    
    console.log('✅ Layer list updated with', modal.annotations.length, 'layers');
}

/**
 * 更新图层项的视觉样式
 */
function updateLayerItemStyle(layerItem, isSelected) {
    if (isSelected) {
        layerItem.style.background = '#4a3a6a';
        layerItem.style.borderColor = '#673AB7';
    } else {
        layerItem.style.background = '#333';
        layerItem.style.borderColor = '#555';
    }
}

/**
 * 绑定图层列表相关事件
 */
function bindLayerListEvents(modal) {
    // 绑定"Select All"按钮
    const selectAllBtn = modal.querySelector('#select-all-layers');
    if (selectAllBtn) {
        // 移除旧的事件监听器（如果有）
        selectAllBtn.replaceWith(selectAllBtn.cloneNode(true));
        const newSelectAllBtn = modal.querySelector('#select-all-layers');
        
        newSelectAllBtn.addEventListener('click', function() {
            console.log('📋 Select all layers clicked');
            const layerCheckboxes = modal.querySelectorAll('#layers-list input[type="checkbox"]');
            
            layerCheckboxes.forEach(checkbox => {
                if (!checkbox.checked) {
                    checkbox.checked = true;
                    const annotationId = checkbox.getAttribute('data-annotation-id');
                    toggleLayerSelection(modal, annotationId, true);
                    const layerItem = checkbox.closest('div');
                    if (layerItem) updateLayerItemStyle(layerItem, true);
                }
            });
        });
    }
    
    // 绑定"Clear Selection"按钮
    const clearBtn = modal.querySelector('#clear-selection');
    if (clearBtn) {
        // 移除旧的事件监听器（如果有）
        clearBtn.replaceWith(clearBtn.cloneNode(true));
        const newClearBtn = modal.querySelector('#clear-selection');
        
        newClearBtn.addEventListener('click', function() {
            console.log('🗑️ Clear selection clicked');
            const layerCheckboxes = modal.querySelectorAll('#layers-list input[type="checkbox"]');
            
            layerCheckboxes.forEach(checkbox => {
                if (checkbox.checked) {
                    checkbox.checked = false;
                    const annotationId = checkbox.getAttribute('data-annotation-id');
                    toggleLayerSelection(modal, annotationId, false);
                    const layerItem = checkbox.closest('div');
                    if (layerItem) updateLayerItemStyle(layerItem, false);
                }
            });
        });
    }
    
    // 绑定"应用到选中图层"按钮
    const applyBtn = modal.querySelector('#apply-to-selected');
    if (applyBtn) {
        console.log('🔍 找到应用按钮，绑定事件');
        // 移除旧的事件监听器（如果有）
        applyBtn.replaceWith(applyBtn.cloneNode(true));
        const newApplyBtn = modal.querySelector('#apply-to-selected');
        
        newApplyBtn.addEventListener('click', function() {
            console.log('🎯 Apply button clicked!');
            applyToSelectedLayers(modal);
        });
    } else {
        console.log('❌ 没有找到应用按钮 #apply-to-selected');
    }
}

/**
 * 更新下拉框显示文本
 */
function updateDropdownText(modal) {
    const dropdownText = modal.querySelector('#dropdown-text');
    if (!dropdownText || !modal.selectedLayers) return;
    
    const selectedCount = modal.selectedLayers.size;
    if (selectedCount === 0) {
        dropdownText.textContent = 'Click to select layers...';
        dropdownText.style.color = '#aaa';
        dropdownText.style.fontSize = '12px';
    } else if (selectedCount === 1) {
        const selectedId = Array.from(modal.selectedLayers)[0];
        const annotation = modal.annotations.find(ann => ann.id === selectedId);
        if (annotation) {
            const layerName = `${safeT('layer_name', 'Layer')} ${annotation.number + 1}`;
            const operationType = annotation.operationType || 'add_object';
            const translatedOperationType = translateOperationType(operationType);
            dropdownText.textContent = `${layerName} • ${translatedOperationType}`;
            dropdownText.style.color = 'white';
            dropdownText.style.fontSize = '12px';
        }
    } else {
        dropdownText.textContent = `${selectedCount} ${safeT('layers_selected', 'layers selected')}`;
        dropdownText.style.color = 'white';
        dropdownText.style.fontSize = '12px';
    }
}

/**
 * 切换图层选中状态
 */
function toggleLayerSelection(modal, annotationId, isSelected) {
    if (!modal.selectedLayers) {
        modal.selectedLayers = new Set();
    }
    
    if (isSelected) {
        modal.selectedLayers.add(annotationId);
    } else {
        modal.selectedLayers.delete(annotationId);
    }
    
    // 更新下拉框显示文本
    updateDropdownText(modal);
    
    // 更新选中计数
    updateSelectionCount(modal);
    
    // 恢复图层设置（包括约束性和修饰性提示词）
    restoreLayerSettings(modal);
    
    // 更新图层操作显示
    updateLayerOperationsDisplay(modal);
    
    // 高亮选中的标注
    const selectedIds = Array.from(modal.selectedLayers);
    highlightSelectedAnnotations(modal, selectedIds);
    
    console.log(`${isSelected ? '✅' : '❌'} 图层 ${annotationId} 选中状态: ${isSelected}`);
}

/**
 * 更新图层编辑器内容
 */
function updateLayerEditor(modal, annotation) {
    const layerTitle = modal.querySelector('#layer-title');
    const layerSubtitle = modal.querySelector('#layer-subtitle');
    const operationSelect = modal.querySelector('#current-layer-operation');
    const descriptionTextarea = modal.querySelector('#current-layer-description');
    
    if (!annotation) return;
    
    // 获取图层信息
    const objectInfo = getObjectInfo(annotation, 0);
    
    // 更新标题和副标题
    if (layerTitle) {
        layerTitle.textContent = `${objectInfo.icon} ${objectInfo.description}`;
    }
    if (layerSubtitle) {
        layerSubtitle.textContent = `Annotation ${annotation.number || 1} • ${annotation.type} • ${annotation.color}`;
    }
    
    // 更新操作类型选择器
    if (operationSelect) {
        operationSelect.value = annotation.operationType || 'add_object';
    }
    
    // 更新描述文本框
    if (descriptionTextarea) {
        descriptionTextarea.value = annotation.description || '';
    }
}

/**
 * 更新选中计数
 */
function updateSelectionCount(modal) {
    const selectionCount = modal.querySelector('#selection-count');
    const selectionCountInfo = modal.querySelector('#selection-count-info');
    
    if (modal.selectedLayers) {
        const count = modal.selectedLayers.size;
        const countText = `${count} ${safeT('selected_count', 'selected')}`;
        
        if (selectionCount) selectionCount.textContent = countText;
        if (selectionCountInfo) selectionCountInfo.textContent = countText;
    }
}

/**
 * 绑定下拉框相关事件
 */
function bindDropdownEvents(modal) {
    const dropdown = modal.querySelector('#layer-dropdown');
    const dropdownMenu = modal.querySelector('#layer-dropdown-menu');
    const dropdownArrow = modal.querySelector('#dropdown-arrow');
    
    if (!dropdown || !dropdownMenu || !dropdownArrow) {
        console.log('⚠️ 下拉框元素缺失:', { dropdown: !!dropdown, menu: !!dropdownMenu, arrow: !!dropdownArrow });
        return;
    }
    
    // 使用更可靠的绑定状态管理
    const modalId = modal.id || 'default-modal';
    const bindingKey = `dropdown-bound-${modalId}`;
    
    // 检查全局绑定状态
    if (modal[bindingKey] === true) {
        console.log('📋 下拉框事件已绑定，跳过重复绑定');
        return;
    }
    
    // 强制设置为绑定状态
    modal[bindingKey] = true;
    dropdown.dataset.bound = 'true';
    console.log('📋 开始绑定下拉框事件...', { 
        annotationsCount: modal.annotations?.length || 0,
        modalId: modalId,
        bindingKey: bindingKey,
        annotationNumbers: modal.annotations?.map(a => a.number) || []
    });
    
    // 点击下拉框切换显示状态
    dropdown.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = dropdownMenu.style.display === 'block';
        
        console.log('📋 下拉框点击事件触发，当前状态:', isOpen ? '打开' : '关闭');
        
        if (isOpen) {
            closeDropdown(modal);
        } else {
            openDropdown(modal);
        }
    });
    
    // 点击页面其他地方关闭下拉框
    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target) && !dropdownMenu.contains(e.target)) {
            closeDropdown(modal);
        }
    });
    
    // 绑定全选按钮
    const selectAllBtn = modal.querySelector('#select-all-layers');
    if (selectAllBtn) {
        selectAllBtn.addEventListener('click', () => {
            selectAllLayers(modal);
        });
    }
    
    // 应用按钮事件在 bindLayerListEvents 中绑定
    
    console.log('✅ 下拉框事件已绑定');
}

/**
 * 打开下拉框
 */
function openDropdown(modal) {
    const dropdownMenu = modal.querySelector('#layer-dropdown-menu');
    const dropdownArrow = modal.querySelector('#dropdown-arrow');
    
    console.log('📂 打开下拉框...', {
        menuExists: !!dropdownMenu,
        arrowExists: !!dropdownArrow,
        annotationsCount: modal.annotations?.length || 0,
        lastAnnotationNumber: modal.annotations?.length > 0 ? modal.annotations[modal.annotations.length - 1].number : null
    });
    
    if (dropdownMenu && dropdownArrow) {
        dropdownMenu.style.display = 'block';
        dropdownArrow.style.transform = 'rotate(180deg)';
        console.log('✅ 下拉框已打开');
    } else {
        console.log('❌ 下拉框元素缺失');
    }
}

/**
 * 关闭下拉框
 */
function closeDropdown(modal) {
    const dropdownMenu = modal.querySelector('#layer-dropdown-menu');
    const dropdownArrow = modal.querySelector('#dropdown-arrow');
    
    if (dropdownMenu && dropdownArrow) {
        dropdownMenu.style.display = 'none';
        dropdownArrow.style.transform = 'rotate(0deg)';
    }
}

/**
 * 全选所有图层
 */
function selectAllLayers(modal) {
    if (!modal.annotations || modal.annotations.length === 0) {
        return;
    }
    
    // 初始化选择集合
    if (!modal.selectedLayers) {
        modal.selectedLayers = new Set();
    }
    
    // 选中所有图层
    modal.annotations.forEach(annotation => {
        modal.selectedLayers.add(annotation.id);
    });
    
    // 更新复选框状态
    const checkboxes = modal.querySelectorAll('#dropdown-options input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = true;
    });
    
    // 更新UI
    updateDropdownText(modal);
    updateSelectionCount(modal);
    updateLayerOperationsDisplay(modal);
    
    // 高亮选中的标注
    const selectedIds = Array.from(modal.selectedLayers);
    highlightSelectedAnnotations(modal, selectedIds);
    
    console.log('✅ 已选中所有图层');
}

/**
 * 显示成功提示
 */
function showSuccessNotification(message) {
    console.log('📢 开始显示成功通知:', message);
    
    // 移除之前的提示（如果存在）
    const existingNotification = document.querySelector('.success-notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // 从Modal内部查找按钮
    const modal = document.querySelector('#unified-editor-modal');
    const applyButton = modal ? modal.querySelector('#apply-to-selected') : null;
    const buttonsContainer = applyButton?.parentElement;
    
    console.log('🔍 查找按钮容器:', {
        modal: !!modal,
        applyButton: !!applyButton,
        buttonsContainer: !!buttonsContainer,
        containerTagName: buttonsContainer?.tagName,
        containerClasses: buttonsContainer?.className
    });
    
    if (!buttonsContainer) {
        console.warn('未找到按钮容器，使用模态窗口显示通知');
        // 降级到模态窗口通知
        showModalNotification(message);
        return;
    }
    
    // 使用按钮上方的通知位置
    console.log('🔄 使用按钮上方通知位置');
    
    // 创建新的提示
    const notification = document.createElement('div');
    notification.className = 'success-notification';
    notification.style.cssText = `
        position: absolute; top: -60px; left: 0; right: 0;
        background: linear-gradient(135deg, #4CAF50, #45A049); 
        color: white; padding: 12px 16px; 
        border-radius: 8px; z-index: 10000;
        font-weight: 600; font-size: 14px; text-align: center;
        box-shadow: 0 6px 16px rgba(76, 175, 80, 0.5);
        animation: notificationSlideDown 0.4s ease-out;
        border: 2px solid #45A049;
        transform: translateY(0);
    `;
    notification.textContent = message;
    
    // 添加CSS动画
    const style = document.createElement('style');
    style.textContent = `
        @keyframes notificationSlideDown {
            from { 
                transform: translateY(-20px); 
                opacity: 0; 
                scale: 0.9;
            }
            to { 
                transform: translateY(0); 
                opacity: 1; 
                scale: 1;
            }
        }
        @keyframes notificationSlideUp {
            from { 
                transform: translateY(0); 
                opacity: 1; 
                scale: 1;
            }
            to { 
                transform: translateY(-20px); 
                opacity: 0; 
                scale: 0.9;
            }
        }
    `;
    if (!document.querySelector('style[data-notification-above-button]')) {
        style.setAttribute('data-notification-above-button', 'true');
        document.head.appendChild(style);
    }
    
    // 确保按钮容器是相对定位
    const originalPosition = buttonsContainer.style.position;
    if (!originalPosition || originalPosition === 'static') {
        buttonsContainer.style.position = 'relative';
    }
    
    buttonsContainer.appendChild(notification);
    
    console.log('✅ 成功通知已添加到DOM:', {
        notificationElement: notification,
        parentContainer: buttonsContainer,
        notificationText: message,
        containerPosition: buttonsContainer.style.position
    });
    
    // 3秒后自动移除
    setTimeout(() => {
        if (notification && notification.parentNode) {
            notification.style.animation = 'notificationSlideUp 0.4s ease-out';
            setTimeout(() => {
                if (notification && notification.parentNode) {
                    notification.remove();
                }
            }, 400);
        }
    }, 3000);
}

/**
 * Fallback notification function for modal display
 */
function showModalNotification(message) {
    console.log('📢 显示模态通知:', message);
    
    // Create notification at top-right of modal
    const modal = document.querySelector('#unified-editor-modal');
    if (!modal) return;
    
    // Remove existing modal notifications
    const existingNotifications = modal.querySelectorAll('.modal-notification');
    existingNotifications.forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = 'modal-notification';
    notification.style.cssText = `
        position: fixed; top: 80px; right: 20px;
        background: #4CAF50; color: white; padding: 12px 20px; 
        border-radius: 8px; z-index: 30000;
        font-weight: 600; font-size: 14px;
        box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
        animation: slideInFromRight 0.3s ease-out;
        max-width: 300px;
    `;
    notification.textContent = message;
    
    // Add animation styles if not exists
    if (!document.querySelector('style[data-modal-notification]')) {
        const style = document.createElement('style');
        style.setAttribute('data-modal-notification', 'true');
        style.textContent = `
            @keyframes slideInFromRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOutToRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        if (notification && notification.parentNode) {
            notification.style.animation = 'slideOutToRight 0.3s ease-out';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }, 3000);
}

/**
 * 应用到选中的图层
 */
function applyToSelectedLayers(modal) {
    console.log('🎯 applyToSelectedLayers 函数被调用', {
        modal: !!modal,
        selectedLayers: modal?.selectedLayers,
        selectedLayersSize: modal?.selectedLayers?.size || 0
    });
    
    if (!modal.selectedLayers || modal.selectedLayers.size === 0) {
        alert('请先选择图层');
        console.log('❌ 没有选中的图层，终止应用操作');
        return;
    }
    
    const operationSelect = modal.querySelector('#current-layer-operation');
    const descriptionTextarea = modal.querySelector('#current-layer-description');
    
    if (!operationSelect || !descriptionTextarea) {
        return;
    }
    
    const operation = operationSelect.value;
    const description = descriptionTextarea.value;
    
    // 收集选中的约束性提示词
    const constraintPrompts = [];
    const constraintCheckboxes = modal.querySelectorAll('#layer-constraint-prompts-container input[type="checkbox"]:checked');
    console.log(`📋 找到 ${constraintCheckboxes.length} 个被勾选的约束性提示词复选框`);
    constraintCheckboxes.forEach(checkbox => {
        constraintPrompts.push(checkbox.value);
        console.log(`📋 保存约束性提示词: ${checkbox.value}`);
    });
    
    // 收集选中的修饰性提示词
    const decorativePrompts = [];
    const decorativeCheckboxes = modal.querySelectorAll('#layer-decorative-prompts-container input[type="checkbox"]:checked');
    console.log(`🎨 找到 ${decorativeCheckboxes.length} 个被勾选的修饰性提示词复选框`);
    decorativeCheckboxes.forEach(checkbox => {
        decorativePrompts.push(checkbox.value);
        console.log(`🎨 保存修饰性提示词: ${checkbox.value}`);
    });
    
    // 应用到所有选中的图层
    modal.selectedLayers.forEach(annotationId => {
        const annotation = modal.annotations.find(a => a.id === annotationId);
        if (annotation) {
            annotation.operationType = operation;
            annotation.description = description;
            annotation.constraintPrompts = [...constraintPrompts]; // 保存约束性提示词
            annotation.decorativePrompts = [...decorativePrompts]; // 保存修饰性提示词
            
            console.log(`💾 已保存到图层 ${annotation.number + 1}:`, {
                operationType: operation,
                constraintPrompts: annotation.constraintPrompts,
                decorativePrompts: annotation.decorativePrompts,
                description: description
            });
        }
    });
    
    // 更新UI
    updateObjectSelector(modal);
    
    console.log(`✅ 已应用设置到 ${modal.selectedLayers.size} 个图层`, {
        operation,
        description,
        constraintPrompts: constraintPrompts.length,
        decorativePrompts: decorativePrompts.length
    });
    
    // 显示成功提示
    console.log('🎯 准备显示成功提示...');
    showSuccessNotification(`✅ 已应用设置到 ${modal.selectedLayers.size} 个图层`);
}

/**
 * 恢复图层的之前设置
 */
function restoreLayerSettings(modal) {
    const operationSelect = modal.querySelector('#current-layer-operation');
    const descriptionTextarea = modal.querySelector('#current-layer-description');
    
    if (!operationSelect || !descriptionTextarea) {
        return;
    }
    
    const selectedCount = modal.selectedLayers ? modal.selectedLayers.size : 0;
    
    if (selectedCount === 1) {
        // 单个图层选择：恢复该图层的设置
        const selectedId = Array.from(modal.selectedLayers)[0];
        const annotation = modal.annotations.find(a => a.id === selectedId);
        
        if (annotation) {
            // 恢复操作类型
            if (annotation.operationType) {
                operationSelect.value = annotation.operationType;
                console.log(`🔄 恢复操作类型: ${annotation.operationType}`);
                
                // 更新提示词选择器
                updatePromptSelectors(modal, annotation.operationType);
                
                // 使用新的恢复函数，带重试机制
                const tryRestorePrompts = (retries = 3) => {
                    setTimeout(() => {
                        const constraintCheckboxes = modal.querySelectorAll('#layer-constraint-prompts-container input[type="checkbox"]');
                        const decorativeCheckboxes = modal.querySelectorAll('#layer-decorative-prompts-container input[type="checkbox"]');
                        
                        console.log(`🔍 第${4-retries}次尝试恢复提示词状态`, {
                            constraintCount: constraintCheckboxes.length,
                            decorativeCount: decorativeCheckboxes.length,
                            hasConstraints: !!(annotation.constraintPrompts && annotation.constraintPrompts.length),
                            hasDecorative: !!(annotation.decorativePrompts && annotation.decorativePrompts.length)
                        });
                        
                        // 如果复选框还没有生成，并且还有重试次数，则重试
                        if ((constraintCheckboxes.length === 0 || decorativeCheckboxes.length === 0) && retries > 0) {
                            console.log(`⏳ 复选框还未生成完成，${retries}次重试剩余`);
                            tryRestorePrompts(retries - 1);
                            return;
                        }
                        
                        // 执行恢复
                        restorePromptSelections(modal, annotation);
                    }, 150);
                };
                
                tryRestorePrompts();
                
            } else {
                // 首次选择，使用默认操作类型
                const defaultOperation = operationSelect.options[0].value;
                operationSelect.value = defaultOperation;
                updatePromptSelectors(modal, defaultOperation);
                console.log(`🚀 首次选择图层，使用默认操作类型: ${defaultOperation}`);
            }
            
            // 恢复描述
            if (annotation.description) {
                descriptionTextarea.value = annotation.description;
                console.log(`🔄 恢复描述: ${annotation.description}`);
            } else {
                descriptionTextarea.value = '';
            }
        }
    } else if (selectedCount > 1) {
        // 多个图层选择：清空设置，准备批量编辑
        operationSelect.value = operationSelect.options[0].value;
        descriptionTextarea.value = '';
        updatePromptSelectors(modal, operationSelect.value);
        console.log(`🚀 批量编辑模式，重置为默认设置`);
    }
}

/**
 * 更新图层操作显示
 */
function updateLayerOperationsDisplay(modal) {
    const layerOperations = modal.querySelector('#layer-operations');
    const currentLayerInfo = modal.querySelector('#current-layer-info');
    
    if (!layerOperations || !currentLayerInfo) {
        return;
    }
    
    const selectedCount = modal.selectedLayers ? modal.selectedLayers.size : 0;
    
    if (selectedCount === 0) {
        layerOperations.style.display = 'none';
        currentLayerInfo.style.display = 'none';
        modal.currentLayerId = null;  // 清空当前图层ID
    } else {
        layerOperations.style.display = 'block';
        currentLayerInfo.style.display = 'block';
        
        // 设置当前图层ID
        if (selectedCount === 1) {
            const selectedId = Array.from(modal.selectedLayers)[0];
            modal.currentLayerId = selectedId;
            console.log(`🎯 设置当前图层ID: ${selectedId}`);
        } else {
            modal.currentLayerId = Array.from(modal.selectedLayers)[0]; // 批量编辑时使用第一个选中的图层
            console.log(`🎯 批量编辑模式，当前图层ID: ${modal.currentLayerId}`);
        }
        
        // 恢复或初始化图层编辑区域的设置
        restoreLayerSettings(modal);
        
        // 更新信息标题
        const layerTitle = modal.querySelector('#layer-title');
        const layerSubtitle = modal.querySelector('#layer-subtitle');
        
        if (layerTitle && layerSubtitle) {
            if (selectedCount === 1) {
                const selectedId = Array.from(modal.selectedLayers)[0];
                const annotation = modal.annotations.find(a => a.id === selectedId);
                if (annotation) {
                    const objectInfo = getObjectInfo(annotation, 0);
                    layerTitle.textContent = `${objectInfo.icon} ${objectInfo.description}`;
                    layerSubtitle.textContent = `Individual editing • ${annotation.type}`;
                }
            } else {
                layerTitle.textContent = `${selectedCount} Layers Selected`;
                layerSubtitle.textContent = `Batch editing mode • Multiple layers`;
            }
        }
    }
}

/**
 * 绑定标签页相关事件
 */
function bindTabEvents(modal) {
    // 绑定操作类型选择器事件
    const operationSelect = modal.querySelector('#current-layer-operation');
    console.log(`🔍 绑定操作类型选择器事件:`, {
        operationSelect: !!operationSelect,
        hasEventListener: operationSelect?.hasEventListener,
        optionsCount: operationSelect?.options.length
    });
    
    if (operationSelect && !operationSelect.hasEventListener) {
        operationSelect.hasEventListener = true;
        
        operationSelect.addEventListener('change', function() {
            console.log(`🎯 Layer Operation Type changed: ${this.value}`);
            
            // 获取当前选中的图层
            if (modal.selectedLayers && modal.selectedLayers.size > 0) {
                // 更新所有选中图层的操作类型
                modal.selectedLayers.forEach(annotationId => {
                    const annotation = modal.annotations.find(ann => ann.id === annotationId);
                    if (annotation) {
                        annotation.operationType = this.value;
                        console.log(`🎯 Updated operation type for layer ${annotation.number + 1}: ${this.value}`);
                    }
                });
                
                // 更新图层显示
                updateObjectSelector(modal);
                
                // 更新约束和修饰性提示词
                updatePromptSelectors(modal, this.value);
                
                // 延迟恢复提示词状态（如果是单个图层选择）
                if (modal.selectedLayers.size === 1) {
                    const selectedId = Array.from(modal.selectedLayers)[0];
                    const annotation = modal.annotations.find(a => a.id === selectedId);
                    if (annotation) {
                        // 使用重试机制恢复提示词状态
                        const tryRestoreAfterOperation = (retries = 3) => {
                            setTimeout(() => {
                                const constraintCheckboxes = modal.querySelectorAll('#layer-constraint-prompts-container input[type="checkbox"]');
                                const decorativeCheckboxes = modal.querySelectorAll('#layer-decorative-prompts-container input[type="checkbox"]');
                                
                                console.log(`🔍 操作类型变更后第${4-retries}次尝试恢复`, {
                                    operationType: this.value,
                                    constraintCount: constraintCheckboxes.length,
                                    decorativeCount: decorativeCheckboxes.length
                                });
                                
                                // 如果复选框还没有生成，并且还有重试次数，则重试
                                if ((constraintCheckboxes.length === 0 || decorativeCheckboxes.length === 0) && retries > 0) {
                                    console.log(`⏳ 操作类型变更后复选框未生成，${retries}次重试剩余`);
                                    tryRestoreAfterOperation(retries - 1);
                                    return;
                                }
                                
                                // 执行恢复
                                restorePromptSelections(modal, annotation);
                            }, 200); // 操作类型变更后需要更长的延迟
                        };
                        
                        tryRestoreAfterOperation();
                    }
                }
            } else {
                console.warn(`⚠️ No layers selected, cannot update operation type`);
            }
        });
        
        console.log(`✅ Layer Operation Type事件监听器已绑定`);
    } else {
        console.log(`⚠️ Layer Operation Type事件监听器未绑定:`, {
            operationSelect: !!operationSelect,
            hasEventListener: operationSelect?.hasEventListener
        });
    }
    
    // 绑定描述文本框事件
    const descriptionTextarea = modal.querySelector('#current-layer-description');
    if (descriptionTextarea && !descriptionTextarea.hasEventListener) {
        descriptionTextarea.hasEventListener = true;
        descriptionTextarea.addEventListener('input', function() {
            const currentAnnotation = modal.annotations.find(ann => ann.id === modal.currentLayerId);
            if (currentAnnotation) {
                currentAnnotation.description = this.value;
                console.log(`📝 更新当前图层描述: ${this.value.substring(0, 30)}...`);
            }
        });
    }
    
    // 绑定"应用到所有选中"按钮
    const applyToAllBtn = modal.querySelector('#apply-to-all-selected');
    if (applyToAllBtn && !applyToAllBtn.hasEventListener) {
        applyToAllBtn.hasEventListener = true;
        applyToAllBtn.addEventListener('click', function() {
            applyToAllSelected(modal);
        });
    }
    
    // 绑定"选择所有图层"按钮
    const selectAllBtn = modal.querySelector('#select-all-layers');
    if (selectAllBtn && !selectAllBtn.hasEventListener) {
        selectAllBtn.hasEventListener = true;
        selectAllBtn.addEventListener('click', function() {
            selectAllLayers(modal);
        });
    }
}

/**
 * 应用当前设置到所有选中的图层
 */
function applyToAllSelected(modal) {
    const currentAnnotation = modal.annotations.find(ann => ann.id === modal.currentLayerId);
    if (!currentAnnotation || !modal.selectedLayers || modal.selectedLayers.size === 0) {
        alert('Please select layers first');
        return;
    }
    
    const operationType = currentAnnotation.operationType;
    const description = currentAnnotation.description;
    
    let updatedCount = 0;
    modal.selectedLayers.forEach(layerId => {
        const annotation = modal.annotations.find(ann => ann.id === layerId);
        if (annotation) {
            annotation.operationType = operationType;
            annotation.description = description;
            updatedCount++;
        }
    });
    
    console.log(`📋 应用设置到 ${updatedCount} 个选中图层`);
    alert(`Applied settings to ${updatedCount} selected layers`);
}


/**
 * 获取对象信息
 */
function getObjectInfo(annotation, index) {
    const { type: tool, color } = annotation;
    
    const colorInfo = COLOR_NAMES[color] || { name: 'Default', icon: '⚪' };
    const toolInfo = TOOL_NAMES[tool] || { name: tool, icon: '❓' };
    
    // 计算位置信息和尺寸信息
    let centerX, centerY, sizeInfo = '';
    
    if (tool === 'freehand') {
        // 自由绘制：使用中心点和点数
        if (annotation.centerPoint) {
            centerX = Math.round(annotation.centerPoint.x);
            centerY = Math.round(annotation.centerPoint.y);
        } else if (annotation.points && annotation.points.length > 0) {
            centerX = Math.round(annotation.points.reduce((sum, p) => sum + p.x, 0) / annotation.points.length);
            centerY = Math.round(annotation.points.reduce((sum, p) => sum + p.y, 0) / annotation.points.length);
        }
        sizeInfo = ` ${annotation.points?.length || 0}点`;
    } else {
        // 其他形状：使用start和end点，或从geometry获取
        const { start: startPoint, end: endPoint } = annotation;
        
        // 安全检查：确保startPoint和endPoint存在
        if (startPoint && endPoint && startPoint.x !== undefined && endPoint.x !== undefined) {
            centerX = Math.round((startPoint.x + endPoint.x) / 2);
            centerY = Math.round((startPoint.y + endPoint.y) / 2);
            
            if (tool === 'rectangle') {
                const width = Math.abs(endPoint.x - startPoint.x);
                const height = Math.abs(endPoint.y - startPoint.y);
                sizeInfo = ` ${Math.round(width)}×${Math.round(height)}`;
            }
        } else if (annotation.geometry && annotation.geometry.coordinates) {
            // 从geometry.coordinates计算中心点
            const coords = annotation.geometry.coordinates;
            if (coords.length >= 4) {
                centerX = Math.round((coords[0] + coords[2]) / 2);
                centerY = Math.round((coords[1] + coords[3]) / 2);
                
                if (tool === 'rectangle') {
                    const width = Math.abs(coords[2] - coords[0]);
                    const height = Math.abs(coords[3] - coords[1]);
                    sizeInfo = ` ${Math.round(width)}×${Math.round(height)}`;
                }
            }
        } else {
            // 默认值
            centerX = 0;
            centerY = 0;
            sizeInfo = ' (unknown size)';
            console.warn('⚠️ annotation缺少位置数据:', annotation);
        }
        
        if (tool === 'circle') {
            if (startPoint && endPoint && startPoint.x !== undefined && endPoint.x !== undefined) {
                const radiusX = Math.abs(endPoint.x - startPoint.x) / 2;
                const radiusY = Math.abs(endPoint.y - startPoint.y) / 2;
                if (Math.abs(radiusX - radiusY) < 5) {
                    sizeInfo = ` r=${Math.round(radiusX)}`;
                } else {
                    sizeInfo = ` ${Math.round(radiusX)}×${Math.round(radiusY)}`;
                }
            } else if (annotation.geometry && annotation.geometry.coordinates) {
                const coords = annotation.geometry.coordinates;
                if (coords.length >= 4) {
                    const radiusX = Math.abs(coords[2] - coords[0]) / 2;
                    const radiusY = Math.abs(coords[3] - coords[1]) / 2;
                    if (Math.abs(radiusX - radiusY) < 5) {
                        sizeInfo = ` r=${Math.round(radiusX)}`;
                    } else {
                        sizeInfo = ` ${Math.round(radiusX)}×${Math.round(radiusY)}`;
                    }
                }
            }
        } else if (tool === 'arrow') {
            if (startPoint && endPoint && startPoint.x !== undefined && endPoint.x !== undefined) {
                const length = Math.sqrt(Math.pow(endPoint.x - startPoint.x, 2) + Math.pow(endPoint.y - startPoint.y, 2));
                sizeInfo = ` L=${Math.round(length)}`;
            } else if (annotation.geometry && annotation.geometry.coordinates) {
                const coords = annotation.geometry.coordinates;
                if (coords.length >= 4) {
                    const length = Math.sqrt(Math.pow(coords[2] - coords[0], 2) + Math.pow(coords[3] - coords[1], 2));
                    sizeInfo = ` L=${Math.round(length)}`;
                }
            }
        }
    }
    
    return {
        icon: `${colorInfo.icon}${toolInfo.icon}`,
        description: `[${index}] ${colorInfo.name}${toolInfo.name}${sizeInfo} (${centerX},${centerY})`,
        colorName: colorInfo.name,
        toolName: toolInfo.name
    };
}

/**
 * 绑定多选事件
 */
function bindMultiSelectEvents(modal) {
    // 全选按钮事件
    const selectAllBtn = modal.querySelector('#select-all-objects');
    if (selectAllBtn) {
        selectAllBtn.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            const annotationCheckboxes = modal.querySelectorAll('#annotation-objects input[type="checkbox"]');
            
            annotationCheckboxes.forEach(checkbox => {
                checkbox.checked = isChecked;
            });
            
            // 更新视觉高亮
            updateMultiSelection(modal);
            console.log(isChecked ? '✅ 全选所有标注' : '❌ 取消全选');
        });
    }
    
    // 标注复选框事件
    const annotationContainer = modal.querySelector('#annotation-objects');
    if (annotationContainer) {
        annotationContainer.addEventListener('change', (e) => {
            if (e.target.type === 'checkbox' && e.target.dataset.annotationId) {
                updateMultiSelection(modal);
                
                // 更新全选状态
                const allCheckboxes = modal.querySelectorAll('#annotation-objects input[type="checkbox"]');
                const checkedCount = modal.querySelectorAll('#annotation-objects input[type="checkbox"]:checked').length;
                const selectAllBtn = modal.querySelector('#select-all-objects');
                
                if (selectAllBtn) {
                    selectAllBtn.checked = checkedCount === allCheckboxes.length;
                    selectAllBtn.indeterminate = checkedCount > 0 && checkedCount < allCheckboxes.length;
                }
            }
        });
    }
    
    // 工具栏图层选择器事件
    const layerSelect = modal.querySelector('#vpe-layer-select');
    if (layerSelect) {
        layerSelect.addEventListener('change', (e) => {
            const selectedLayerId = e.target.value;
            if (selectedLayerId) {
                // 清除所有选择
                const allCheckboxes = modal.querySelectorAll('#annotation-objects input[type="checkbox"]');
                allCheckboxes.forEach(checkbox => checkbox.checked = false);
                
                // 选择指定图层
                const targetCheckbox = modal.querySelector(`#annotation-objects input[data-annotation-id="${selectedLayerId}"]`);
                if (targetCheckbox) {
                    targetCheckbox.checked = true;
                }
                
                updateMultiSelection(modal);
                console.log('🎯 工具栏选择图层:', selectedLayerId);
            }
        });
    }
    
    // 工具栏全选按钮事件
    const toolbarSelectAll = modal.querySelector('#vpe-select-all');
    if (toolbarSelectAll) {
        toolbarSelectAll.addEventListener('click', (e) => {
            const allCheckboxes = modal.querySelectorAll('#annotation-objects input[type="checkbox"]');
            const checkedCount = modal.querySelectorAll('#annotation-objects input[type="checkbox"]:checked').length;
            const shouldSelectAll = checkedCount === 0 || checkedCount < allCheckboxes.length;
            
            allCheckboxes.forEach(checkbox => {
                checkbox.checked = shouldSelectAll;
            });
            
            // 更新主全选按钮状态
            const selectAllBtn = modal.querySelector('#select-all-objects');
            if (selectAllBtn) {
                selectAllBtn.checked = shouldSelectAll;
                selectAllBtn.indeterminate = false;
            }
            
            updateMultiSelection(modal);
            console.log(shouldSelectAll ? '✅ 工具栏全选' : '❌ 工具栏取消全选');
        });
    }
}

/**
 * 更新多选状态
 */
function updateMultiSelection(modal) {
    const selectedAnnotationIds = getSelectedAnnotationIds(modal);
    console.log('🎯 VPE当前选中的标注:', selectedAnnotationIds);
    
    // 更新视觉高亮
    highlightSelectedAnnotations(modal, selectedAnnotationIds);
    
    // 更新选中计数显示
    updateSelectionCount(modal, selectedAnnotationIds.length);
    
}

/**
 * 获取选中的标注ID列表
 */
function getSelectedAnnotationIds(modal) {
    // 优先使用新的下拉复选框界面
    const dropdownCheckboxes = modal.querySelectorAll('#dropdown-options input[type="checkbox"]:checked');
    if (dropdownCheckboxes.length > 0) {
        return Array.from(dropdownCheckboxes).map(checkbox => checkbox.dataset.annotationId).filter(id => id);
    }
    
    // 兼容旧的UI界面
    const checkedBoxes = modal.querySelectorAll('#annotation-objects input[type="checkbox"]:checked');
    return Array.from(checkedBoxes).map(checkbox => checkbox.dataset.annotationId).filter(id => id);
}

/**
 * 高亮选中的标注
 */
function highlightSelectedAnnotations(modal, selectedIds) {
    const svg = modal.querySelector('#drawing-layer svg');
    if (!svg) {
        console.log('⚠️ 未找到SVG画布');
        return;
    }
    
    console.log('🔍 开始高亮标注:', selectedIds);
    
    // 清除所有选中状态
    svg.querySelectorAll('.annotation-shape').forEach(shape => {
        // 🔧 完全清除高亮效果
        shape.classList.remove('selected');
        shape.style.filter = 'none';
        shape.removeAttribute('stroke-opacity');
        
        // 🔧 恢复原始边框状态
        const originalStroke = shape.getAttribute('data-original-stroke');
        const originalStrokeWidth = shape.getAttribute('data-original-stroke-width');
        
        if (originalStrokeWidth) {
            shape.setAttribute('stroke-width', originalStrokeWidth);
        } else {
            shape.setAttribute('stroke-width', '3');
        }
        
        if (originalStroke) {
            shape.setAttribute('stroke', originalStroke);
        } else {
            // 🔧 标注在非高亮状态下应该没有边框
            shape.setAttribute('stroke', 'none');
        }
    });
    
    svg.querySelectorAll('.annotation-label circle').forEach(circle => {
        circle.setAttribute('stroke', '#fff');
        circle.setAttribute('stroke-width', '3');
    });
    
    // 高亮选中的标注
    selectedIds.forEach(annotationId => {
        const targetShape = svg.querySelector(`[data-annotation-id="${annotationId}"]`);
        console.log(`🔍 查找标注 ${annotationId}:`, targetShape ? '找到' : '未找到');
        
        if (targetShape) {
            // 🔧 保存原始状态
            const currentStroke = targetShape.getAttribute('stroke');
            const currentStrokeWidth = targetShape.getAttribute('stroke-width');
            
            if (!targetShape.hasAttribute('data-original-stroke')) {
                targetShape.setAttribute('data-original-stroke', currentStroke || 'none');
            }
            if (!targetShape.hasAttribute('data-original-stroke-width')) {
                targetShape.setAttribute('data-original-stroke-width', currentStrokeWidth || '3');
            }
            
            // 🔧 应用高亮效果
            targetShape.setAttribute('stroke-width', '6');
            targetShape.setAttribute('stroke', '#ffff00'); // 添加黄色边框
            targetShape.setAttribute('stroke-opacity', '1.0');
            targetShape.classList.add('selected');
            targetShape.style.filter = 'drop-shadow(0 0 8px rgba(255, 255, 0, 0.8))';
            
            console.log('✅ 已高亮标注:', annotationId);
            
            // 高亮对应的编号标签
            const annotation = modal.annotations?.find(ann => ann.id === annotationId);
            if (annotation) {
                const label = svg.querySelector(`[data-annotation-number="${annotation.number}"]`);
                if (label) {
                    const circle = label.querySelector('circle');
                    if (circle) {
                        circle.setAttribute('stroke', '#ffff00');
                        circle.setAttribute('stroke-width', '4');
                    }
                }
            }
        } else {
            console.log('⚠️ 未找到标注元素:', annotationId);
            // 调试：列出所有有data-annotation-id的元素
            const allAnnotations = svg.querySelectorAll('[data-annotation-id]');
            console.log('🔍 所有现有标注:', Array.from(allAnnotations).map(el => el.getAttribute('data-annotation-id')));
        }
    });
    
    console.log('✅ VPE已高亮', selectedIds.length, '个标注');
}

/**
 * 更新选中计数显示
 */

/**
 * 选中指定标注（保留单选功能）
 */
function selectAnnotationById(modal, annotationId) {
    if (!annotationId) return;
    
    // 清除所有复选框选中状态
    const checkboxes = modal.querySelectorAll('#annotation-objects input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = false);
    
    // 选中指定的复选框
    const targetCheckbox = modal.querySelector(`#annotation-objects input[data-annotation-id="${annotationId}"]`);
    if (targetCheckbox) {
        targetCheckbox.checked = true;
    }
    
    // 更新多选状态
    updateMultiSelection(modal);
    
    console.log('🎯 VPE单独选中标注:', annotationId);
}

/**
 * 滚动到指定标注
 */
function scrollToAnnotation(modal, shape) {
    try {
        const scrollCanvasContainer = modal.querySelector('#canvas-container');
        const zoomContainer = modal.querySelector('#zoom-container');
        
        if (!scrollCanvasContainer || !zoomContainer || !shape) return;
        
        // 获取标注的位置
        const shapeBBox = shape.getBBox();
        const centerX = shapeBBox.x + shapeBBox.width / 2;
        const centerY = shapeBBox.y + shapeBBox.height / 2;
        
        console.log('🎯 VPE滚动到标注位置:', { centerX, centerY });
        
        // 这里可以添加滚动逻辑
        // 暂时只是高亮显示
        
    } catch (e) {
        console.error('滚动到标注时出错:', e);
    }
}

/**
 * 添加标注到数组
 */
function addAnnotation(modal, annotation) {
    if (!modal.annotations) {
        modal.annotations = [];
    }
    
    annotation.number = modal.annotations.length;
    // 新增：为导入的标注添加默认操作类型
    if (!annotation.operationType) {
        annotation.operationType = 'add_object';
    }
    if (!annotation.description) {
        annotation.description = '';
    }
    if (!annotation.category) {
        annotation.category = 'local';
    }
    modal.annotations.push(annotation);
    
    updateObjectSelector(modal);
    console.log('✅ 标注已添加 ID:', annotation.id, 'type:', annotation.type);
}

/**
 * 删除指定标注 (v2.2.1 双重删除策略)
 */
export function deleteAnnotation(modal, annotation) {
    try {
        // 从数组中移除
        const index = modal.annotations.findIndex(ann => ann.id === annotation.id);
        if (index !== -1) {
            modal.annotations.splice(index, 1);
            console.log('📝 从数组中移除标注，剩余:', modal.annotations.length);
        }
        
        // 从SVG中移除
        const drawingLayer = modal.querySelector('#drawing-layer');
        if (drawingLayer) {
            const svg = drawingLayer.querySelector('svg');
            if (svg) {
                // 移除标注形状
                const shapeElement = svg.querySelector(`[data-annotation-id="${annotation.id}"]`);
                if (shapeElement) {
                    shapeElement.remove();
                    console.log('🗑️ 移除SVG形状元素');
                }
                
                // 移除相关标签 - 增强版本（优先按编号删除）
                console.log('🔍 查找并删除相关标签...', {
                    annotationId: annotation.id,
                    annotationNumber: annotation.number
                });
                
                let removedLabelCount = 0;
                
                // 方法1: 优先按编号删除（最可靠）
                if (annotation.number !== undefined) {
                    console.log('🔍 尝试按编号删除标签:', annotation.number);
                    const numberLabels = svg.querySelectorAll(`[data-annotation-number="${annotation.number}"]`);
                    console.log('📊 找到', numberLabels.length, '个编号标签');
                    
                    numberLabels.forEach((label, index) => {
                        console.log(`🗑️ 删除编号标签 ${index}:`, label.tagName);
                        label.remove();
                        removedLabelCount++;
                    });
                    
                    console.log('📊 按编号删除了', removedLabelCount, '个标签');
                }
                
                // 方法2: 如果按编号没找到，再按位置查找
                if (removedLabelCount === 0) {
                    console.log('🔍 按编号未找到标签，尝试按位置查找...');
                    const labels = svg.querySelectorAll('circle, text');
                    console.log('📊 总共找到', labels.length, '个标签元素');
                    
                    labels.forEach((label, index) => {
                        const isNear = isLabelNearAnnotation(label, annotation);
                        if (isNear) {
                            console.log(`🗑️ 按位置删除标签 ${index}:`, label.tagName);
                            label.remove();
                            removedLabelCount++;
                        }
                    });
                    
                    console.log('📊 按位置删除了', removedLabelCount, '个标签');
                }
                
                console.log('✅ 标签删除总计:', removedLabelCount, '个');
            }
        }
        
        // 更新对象选择器
        updateObjectSelector(modal);
        
        console.log('✅ 标注删除完成');
        
    } catch (e) {
        console.error('❌ 删除标注失败:', e);
    }
}

/**
 * 判断标签是否靠近指定标注
 */
function isLabelNearAnnotation(labelElement, annotation) {
    try {
        const tolerance = 20; // 容差像素
        
        if (labelElement.tagName.toLowerCase() === 'circle') {
            const cx = parseFloat(labelElement.getAttribute('cx'));
            const cy = parseFloat(labelElement.getAttribute('cy'));
            
            // 计算标注的参考位置
            let refX, refY;
            if (annotation.start && annotation.end) {
                refX = Math.min(annotation.start.x, annotation.end.x) + 5;
                refY = Math.min(annotation.start.y, annotation.end.y) + 15;
            } else if (annotation.points && annotation.points.length > 0) {
                refX = annotation.points[0].x + 5;
                refY = annotation.points[0].y + 15;
            } else {
                return false;
            }
            
            const distance = Math.sqrt(Math.pow(cx - refX, 2) + Math.pow(cy - refY, 2));
            return distance <= tolerance;
        }
        
        return false;
    } catch (e) {
        console.error('判断标签位置时出错:', e);
        return false;
    }
}

// 导出关键函数到全局范围，以便其他模块可以调用
window.updateObjectSelector = updateObjectSelector;
window.toggleLayerSelection = toggleLayerSelection;
window.selectAllLayers = selectAllLayers;
window.highlightSelectedAnnotations = highlightSelectedAnnotations;

// 调试函数：检查下拉框绑定状态
window.debugDropdownState = function(modal) {
    const dropdown = modal.querySelector('#layer-dropdown');
    const dropdownMenu = modal.querySelector('#layer-dropdown-menu');
    const dropdownOptions = modal.querySelector('#dropdown-options');
    
    const modalId = modal.id || 'default-modal';
    const bindingKey = `dropdown-bound-${modalId}`;
    
    console.log('🔍 下拉框状态调试:', {
        dropdownBound: dropdown?.dataset?.bound,
        modalBindingState: modal[bindingKey],
        menuDisplay: dropdownMenu?.style?.display,
        optionsChildren: dropdownOptions?.children?.length,
        selectedLayers: modal.selectedLayers ? Array.from(modal.selectedLayers) : [],
        annotationsCount: modal.annotations?.length || 0,
        modalId: modalId,
        bindingKey: bindingKey
    });
    
    // 检查每个选项的事件绑定
    console.log('📋 检查选项点击事件...');
    const options = dropdownOptions?.children;
    if (options) {
        for (let i = 0; i < options.length; i++) {
            const option = options[i];
            console.log(`选项 ${i}:`, {
                annotation: modal.annotations?.[i]?.number,
                hasClickHandler: !!option.onclick
            });
        }
    }
};

// 导出需要在其他模块中使用的函数
export { bindTabEvents };

