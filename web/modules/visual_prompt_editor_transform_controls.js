/**
 * Visual Prompt Editor - 变换控制模块
 * 负责图层和标注的变换操作，包括拖拽、缩放、旋转等功能
 */

import { DOMFactory, StyleManager, EventManager, setElementStyles, bindEvent, createElement } from './shared/dom_helpers.js';
import { getCoordinateSystem, clearCoordinateCache } from './shared/coordinate_system.js';

export class TransformControls {
    constructor(nodeInstance) {
        this.nodeInstance = nodeInstance;
        this.transformState = {
            active: false,
            layerId: null,
            layerType: null,
            originalTransform: null
        };
    }

    /**
     * 初始化变换控制
     */
    initializeTransformControls(modal) {
        console.log('🔧 初始化变换控制系统...');
        
        // 创建变换控制面板
        this.createTransformControlPanel(modal);
        
        // 绑定变换模式按钮
        this.bindTransformModeButton(modal);
        
        // 初始化变换状态
        modal.transformState = this.transformState;
        
        console.log('✅ 变换控制系统初始化完成');
    }

    /**
     * 清除变换控制器 - 辅助函数
     */
    clearTransformController(modal) {
        const existingController = modal.querySelector('#transform-controller');
        if (existingController) {
            existingController.remove();
        }
    }

    /**
     * 绑定变换模式按钮
     */
    bindTransformModeButton(modal) {
        const transformBtn = modal.querySelector('#vpe-transform-mode');
        if (!transformBtn) {
            console.warn('⚠️ 变换模式按钮未找到');
            return;
        }

        // 初始化变换模式状态
        modal.transformModeActive = false;
        
        transformBtn.onclick = () => {
            modal.transformModeActive = !modal.transformModeActive;
            
            if (modal.transformModeActive) {
                this.activateTransformMode(modal, transformBtn);
            } else {
                this.deactivateTransformMode(modal, transformBtn);
            }
        };
        
        console.log('✅ 变换模式按钮绑定完成');
    }

    /**
     * 激活变换模式
     */
    activateTransformMode(modal, transformBtn) {
        console.log('🔄 激活变换模式');
        
        // 更新按钮样式
        transformBtn.style.background = '#10b981';
        transformBtn.style.color = 'white';
        transformBtn.textContent = '🔄 Transform ON';
        
        // 清除当前变换状态
        this.clearTransformState(modal);
        
        // 显示提示信息
        this.showTransformModeHint(modal);
        
        console.log('✅ 变换模式已激活 - 点击图层元素来变换');
    }

    /**
     * 关闭变换模式
     */
    deactivateTransformMode(modal, transformBtn) {
        console.log('🔄 关闭变换模式');
        
        // 更新按钮样式
        transformBtn.style.background = '#444';
        transformBtn.style.color = '#ccc';
        transformBtn.textContent = '🔄 Transform';
        
        // 清除变换状态和提示
        this.clearTransformState(modal);
        this.hideTransformModeHint(modal);
        
        console.log('❌ 变换模式已关闭');
    }

    /**
     * 创建变换控制面板
     */
    createTransformControlPanel(modal) {
        const existingPanel = modal.querySelector('#transform-controls');
        if (existingPanel) {
            return existingPanel;
        }

        const transformControls = document.createElement('div');
        transformControls.id = 'transform-controls';
        transformControls.style.cssText = `
            position: absolute;
            top: 50%;
            right: 20px;
            transform: translateY(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 20px;
            border-radius: 8px;
            border: 2px solid #10b981;
            min-width: 200px;
            display: none;
            z-index: 1000;
        `;

        transformControls.innerHTML = `
            <h3 style="margin: 0 0 15px 0; color: #10b981;">Transform Controls</h3>
            <div id="transform-layer-info" style="margin-bottom: 15px; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 4px;">
                <div style="font-size: 12px; color: #ccc;">Selected Layer:</div>
                <div id="transform-layer-name" style="font-weight: bold;">None</div>
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-size: 12px;">Position X:</label>
                <input type="range" id="transform-x" min="-500" max="500" value="0" style="width: 100%;">
                <span id="transform-x-value" style="font-size: 11px; color: #ccc;">0px</span>
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-size: 12px;">Position Y:</label>
                <input type="range" id="transform-y" min="-500" max="500" value="0" style="width: 100%;">
                <span id="transform-y-value" style="font-size: 11px; color: #ccc;">0px</span>
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-size: 12px;">Scale:</label>
                <input type="range" id="transform-scale" min="0.1" max="3" step="0.1" value="1" style="width: 100%;">
                <span id="transform-scale-value" style="font-size: 11px; color: #ccc;">100%</span>
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-size: 12px;">Rotation:</label>
                <input type="range" id="transform-rotation" min="0" max="360" value="0" style="width: 100%;">
                <span id="transform-rotation-value" style="font-size: 11px; color: #ccc;">0°</span>
            </div>
            
            <div style="display: flex; gap: 10px; justify-content: space-between;">
                <button id="transform-apply" style="flex: 1; padding: 8px; background: #10b981; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">Apply</button>
                <button id="transform-reset" style="flex: 1; padding: 8px; background: #666; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">Reset</button>
                <button id="transform-close" style="flex: 1; padding: 8px; background: #dc2626; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">Close</button>
            </div>
        `;

        // 添加到模态窗口
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.appendChild(transformControls);
        }

        // 绑定控制面板事件
        this.bindTransformControlEvents(modal, transformControls);

        return transformControls;
    }

    /**
     * 绑定变换控制面板事件
     */
    bindTransformControlEvents(modal, transformControls) {
        // X位置滑块
        const xSlider = transformControls.querySelector('#transform-x');
        const xValue = transformControls.querySelector('#transform-x-value');
        if (xSlider && xValue) {
            xSlider.addEventListener('input', (e) => {
                xValue.textContent = e.target.value + 'px';
                this.updateTransformPreview(modal);
            });
        }

        // Y位置滑块
        const ySlider = transformControls.querySelector('#transform-y');
        const yValue = transformControls.querySelector('#transform-y-value');
        if (ySlider && yValue) {
            ySlider.addEventListener('input', (e) => {
                yValue.textContent = e.target.value + 'px';
                this.updateTransformPreview(modal);
            });
        }

        // 缩放滑块
        const scaleSlider = transformControls.querySelector('#transform-scale');
        const scaleValue = transformControls.querySelector('#transform-scale-value');
        if (scaleSlider && scaleValue) {
            scaleSlider.addEventListener('input', (e) => {
                scaleValue.textContent = Math.round(e.target.value * 100) + '%';
                this.updateTransformPreview(modal);
            });
        }

        // 旋转滑块
        const rotationSlider = transformControls.querySelector('#transform-rotation');
        const rotationValue = transformControls.querySelector('#transform-rotation-value');
        if (rotationSlider && rotationValue) {
            rotationSlider.addEventListener('input', (e) => {
                rotationValue.textContent = e.target.value + '°';
                this.updateTransformPreview(modal);
            });
        }

        // 应用按钮
        const applyBtn = transformControls.querySelector('#transform-apply');
        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                this.applyTransform(modal);
            });
        }

        // 重置按钮
        const resetBtn = transformControls.querySelector('#transform-reset');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetTransform(modal);
            });
        }

        // 关闭按钮
        const closeBtn = transformControls.querySelector('#transform-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeTransformControls(modal);
            });
        }
    }

    /**
     * 显示变换模式提示
     */
    showTransformModeHint(modal) {
        const existingHint = modal.querySelector('#transform-mode-hint');
        if (existingHint) {
            existingHint.remove();
        }

        const hint = document.createElement('div');
        hint.id = 'transform-mode-hint';
        hint.style.cssText = `
            position: absolute;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(16, 185, 129, 0.9);
            color: white;
            padding: 10px 20px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 500;
            z-index: 1001;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        hint.textContent = '🔄 Transform Mode Active - Click on any layer to transform it';

        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.appendChild(hint);
        }
    }

    /**
     * 隐藏变换模式提示
     */
    hideTransformModeHint(modal) {
        const hint = modal.querySelector('#transform-mode-hint');
        if (hint) {
            hint.remove();
        }
    }

    /**
     * 清除变换状态 - 增强版，彻底清理所有相关元素和事件
     */
    clearTransformState(modal) {
        console.log('🧹 清理变换状态...');
        
        // 清理坐标系统缓存
        clearCoordinateCache(modal);
        
        // 清理状态数据
        this.transformState.active = false;
        this.transformState.layerId = null;
        this.transformState.layerType = null;
        this.transformState.originalTransform = null;

        // 隐藏变换控制面板
        const transformControls = modal.querySelector('#transform-controls');
        if (transformControls) {
            transformControls.style.display = 'none';
        }
        
        // 移除变换控制器
        const existingController = modal.querySelector('#transform-controller');
        if (existingController) {
            existingController.remove();
            console.log('🗑️ 已移除变换控制器');
        }
        
        // 清理所有图层的拖拽事件
        const allLayers = modal.querySelectorAll('[id^="canvas-layer-"], [id^="annotation-svg-"]');
        allLayers.forEach(layer => {
            if (layer._dragCleanup) {
                layer._dragCleanup();
                delete layer._dragCleanup;
            }
            // 重置样式
            layer.style.cursor = '';
        });
        
        // 清理全局样式
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        
        console.log('✅ 变换状态清理完成');
    }

    /**
     * 开始变换指定图层
     */
    /**
     * 激活图层变换模式（完整版，包含操作框）
     */
    activateLayerTransform(modal, layerId, layerType, nodeInstance) {
        console.log('🔄 [TRANSFORM] 激活图层变换模式:', layerId, layerType);

        // 获取图层元素
        console.log('🔍 [TRANSFORM] 调用 nodeInstance.getLayerElement...');
        const layerElement = nodeInstance.getLayerElement(modal, layerId, layerType);
        console.log('📦 [TRANSFORM] getLayerElement 结果:', layerElement);
        
        if (!layerElement) {
            console.warn(`⚠️ [TRANSFORM] 无法找到图层元素: ${layerId}`);
            return;
        }

        // 清除之前的变换状态
        this.clearTransformState(modal);

        // 设置变换状态
        this.transformState.active = true;
        this.transformState.layerId = layerId;
        this.transformState.layerType = layerType;
        modal.transformState = this.transformState;

        // 创建图层操作框
        this.createLayerTransformController(modal, layerElement, layerId, layerType);

        // 显示变换控制面板
        this.startTransformLayer(modal, layerId, layerType);

        console.log('✅ 图层变换模式已激活');
    }

    /**
     * 创建图层变换控制器（操作框）- 简化版，使用可靠的定位系统
     */
    createLayerTransformController(modal, layerElement, layerId, layerType) {
        console.log(`🎯 [NEW] 创建图层变换控制器: ${layerId}`);
        
        // 清除已存在的控制器
        this.clearTransformController(modal);
        
        // 尝试找到更适合的父容器用于定位
        const canvasContainer = modal.querySelector('#image-canvas');
        const layersContainer = modal.querySelector('#layers-display-container');
        
        if (!canvasContainer) {
            console.error('❌ 无法找到画布容器');
            return;
        }
        
        // 优先使用图层容器作为父容器，因为控制器要覆盖图层
        const parentContainer = layersContainer || canvasContainer;
        
        console.log('🏗️ [TRANSFORM] 选择的父容器:', {
            canvasContainer: canvasContainer.id,
            layersContainer: layersContainer?.id || 'not found',
            selectedContainer: parentContainer.id,
            containerPosition: window.getComputedStyle(parentContainer).position
        });
        
        // 方法改进：考虑缩放因子的位置计算
        const imgElement = layerElement.querySelector('img');
        if (!imgElement) {
            console.warn('⚠️ [TRANSFORM] 图层中没有找到img元素:', layerId);
            return;
        }
        
        // 获取图像和父容器的屏幕位置
        const imgRect = imgElement.getBoundingClientRect();
        const parentRect = parentContainer.getBoundingClientRect();
        
        // 获取图像的实际显示尺寸（考虑object-fit: contain）
        const actualImageSize = this.calculateObjectFitContainSize(imgElement, imgRect);
        
        // 计算图像在容器内的居中偏移
        const imageOffsetX = (imgRect.width - actualImageSize.width) / 2;
        const imageOffsetY = (imgRect.height - actualImageSize.height) / 2;
        
        // 计算实际图像的屏幕位置（加上居中偏移）
        const actualImageLeft = imgRect.left + imageOffsetX;
        const actualImageTop = imgRect.top + imageOffsetY;
        
        // 计算控制器相对于父容器的位置
        const actualLeft = actualImageLeft - parentRect.left;
        const actualTop = actualImageTop - parentRect.top;
        const actualWidth = actualImageSize.width;
        const actualHeight = actualImageSize.height;
        
        // 添加详细的调试信息
        const layerStyle = window.getComputedStyle(layerElement);
        const imgStyle = window.getComputedStyle(imgElement);
        
        console.log('🔍 [DEBUG] 宽度修复的位置计算分析:', {
            layerId,
            imgRect: {
                screenLeft: imgRect.left,
                screenTop: imgRect.top,
                containerWidth: imgRect.width,
                containerHeight: imgRect.height
            },
            actualImageSize: {
                width: actualImageSize.width,
                height: actualImageSize.height
            },
            imageOffset: {
                x: imageOffsetX,
                y: imageOffsetY
            },
            actualImagePosition: {
                screenLeft: actualImageLeft,
                screenTop: actualImageTop
            },
            controllerBounds: {
                left: actualLeft,
                top: actualTop,
                width: actualWidth,
                height: actualHeight
            }
        });
        
        // 创建主控制器容器
        const controller = createElement('div', {
            id: 'transform-controller',
            className: 'transform-controller-main',
            style: {
                position: 'absolute',
                left: `${actualLeft}px`,
                top: `${actualTop}px`,
                width: `${actualWidth}px`,
                height: `${actualHeight}px`,
                border: '2px solid #10b981',
                pointerEvents: 'none',
                zIndex: 10000,
                boxSizing: 'border-box',
                background: 'rgba(16, 185, 129, 0.1)'
            }
        });
        
        // 创建8个缩放控制点
        const controlPoints = [
            { name: 'nw', x: 0, y: 0, cursor: 'nw-resize' },
            { name: 'n', x: 0.5, y: 0, cursor: 'n-resize' },
            { name: 'ne', x: 1, y: 0, cursor: 'ne-resize' },
            { name: 'e', x: 1, y: 0.5, cursor: 'e-resize' },
            { name: 'se', x: 1, y: 1, cursor: 'se-resize' },
            { name: 's', x: 0.5, y: 1, cursor: 's-resize' },
            { name: 'sw', x: 0, y: 1, cursor: 'sw-resize' },
            { name: 'w', x: 0, y: 0.5, cursor: 'w-resize' }
        ];
        
        controlPoints.forEach(point => {
            const handle = createElement('div', {
                id: `transform-handle-${point.name}`,
                className: `transform-handle transform-handle-${point.name}`,
                'data-handle-type': point.name,
                style: {
                    position: 'absolute',
                    width: '10px',
                    height: '10px',
                    background: '#10b981',
                    border: '2px solid white',
                    borderRadius: '50%',
                    cursor: point.cursor,
                    pointerEvents: 'auto',
                    zIndex: 10001,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    top: `${point.y === 0 ? -5 : (point.y === 1 ? actualHeight - 5 : actualHeight / 2 - 5)}px`,
                    left: `${point.x === 0 ? -5 : (point.x === 1 ? actualWidth - 5 : actualWidth / 2 - 5)}px`
                }
            });
            
            // 绑定缩放事件
            this.bindResizeHandle(handle, point.name, modal, layerElement, layerId, layerType);
            
            controller.appendChild(handle);
        });
        
        // 创建旋转手柄
        const rotateHandle = createElement('div', {
            id: 'transform-rotate-handle',
            className: 'transform-rotate-handle',
            style: {
                position: 'absolute',
                width: '10px',
                height: '10px',
                background: '#FF9800',
                border: '2px solid white',
                borderRadius: '50%',
                cursor: 'crosshair',
                pointerEvents: 'auto',
                zIndex: 10001,
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                top: '-30px',
                left: `${actualWidth / 2 - 5}px`
            }
        });
        
        // 绑定旋转事件
        this.bindRotateHandle(rotateHandle, modal, layerElement, layerId, layerType);
        controller.appendChild(rotateHandle);
        
        // 添加到选定的父容器，确保相对定位正确
        console.log('📍 [TRANSFORM] 控制器将添加到:', {
            containerType: parentContainer.tagName,
            containerId: parentContainer.id,
            containerPosition: window.getComputedStyle(parentContainer).position
        });
        
        parentContainer.appendChild(controller);
        
        // 确保控制点位置正确（立即更新一次）
        this.updateControlHandles(controller, actualWidth, actualHeight);
        
        // 验证控制器位置（使用相同的object-fit计算）
        setTimeout(() => {
            const controllerRect = controller.getBoundingClientRect();  
            const parentRectCheck = parentContainer.getBoundingClientRect();
            const imgRectCheck = imgElement.getBoundingClientRect();
            
            // 使用相同的计算方法验证对齐
            const actualImageSizeCheck = this.calculateObjectFitContainSize(imgElement, imgRectCheck);
            const imageOffsetXCheck = (imgRectCheck.width - actualImageSizeCheck.width) / 2;
            const imageOffsetYCheck = (imgRectCheck.height - actualImageSizeCheck.height) / 2;
            const actualImageLeftCheck = imgRectCheck.left + imageOffsetXCheck;
            const actualImageTopCheck = imgRectCheck.top + imageOffsetYCheck;
            
            console.log('✅ [TRANSFORM] 宽度修复验证:', {
                controllerScreen: {
                    left: controllerRect.left,
                    top: controllerRect.top,
                    width: controllerRect.width,
                    height: controllerRect.height
                },
                actualImageScreen: {
                    left: actualImageLeftCheck,
                    top: actualImageTopCheck,
                    width: actualImageSizeCheck.width,
                    height: actualImageSizeCheck.height
                },
                alignment: {
                    leftOffset: controllerRect.left - actualImageLeftCheck,
                    topOffset: controllerRect.top - actualImageTopCheck,
                    widthMatch: controllerRect.width - actualImageSizeCheck.width,
                    heightMatch: controllerRect.height - actualImageSizeCheck.height
                }
            });
        }, 50);
        
        // 使图层可拖拽
        this.makeLayerDraggable(modal, layerElement, layerId, layerType, controller);
        
        console.log(`✅ [NEW] 变换控制器创建完成: ${layerId}`);
        return controller;
    }

    /**
     * 使图层可拖拽 - 简化版，使用DOM助手
     */
    makeLayerDraggable(modal, layerElement, layerId, layerType, controller) {
        console.log(`🖱️ [NEW] 设置图层拖拽: ${layerId}`);
        
        // 设置基本拖拽状态
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;
        
        // 设置样式，确保元素可交互
        setElementStyles(layerElement, {
            cursor: 'move',
            pointerEvents: 'auto',
            userSelect: 'none'
        });
        
        // 鼠标按下事件处理器
        const handleMouseDown = (e) => {
            // 只处理左键并且变换模式激活
            if (e.button !== 0 || !modal.transformState?.active) return;
            
            // 忽略控制点点击
            if (e.target.closest('.transform-handle, .transform-rotate-handle')) return;
            
            // 允许在图层元素或变换控制器上点击进行拖拽
            const isLayerClick = e.target === layerElement || layerElement.contains(e.target);
            const isControllerClick = e.target.closest('#transform-controller');
            
            if (!isLayerClick && !isControllerClick) return;
            
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            
            // 获取图层当前CSS位置（不是屏幕位置）
            const layerStyle = window.getComputedStyle(layerElement);
            initialLeft = parseFloat(layerStyle.left) || 0;
            initialTop = parseFloat(layerStyle.top) || 0;
            
            // 保存原始transform以防止丢失缩放
            const originalTransform = layerElement.style.transform || '';
            layerElement._originalTransform = originalTransform;
            
            console.log(`🎯 [NEW] 开始拖拽: ${layerId}`, { initialLeft, initialTop });
            
            // 设置拖拽样式
            document.body.style.cursor = 'grabbing';
            document.body.style.userSelect = 'none';
            
            e.preventDefault();
            e.stopPropagation();
        };
        
        // 鼠标移动事件处理器
        const handleMouseMove = (e) => {
            if (!isDragging) return;
            
            e.preventDefault();
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            // 计算新位置
            const newLeft = initialLeft + deltaX;
            const newTop = initialTop + deltaY;
            
            // 更新图层位置（使用left/top保持transform）
            setElementStyles(layerElement, {
                left: `${newLeft}px`,
                top: `${newTop}px`
            });
            
            // 同步更新控制器位置
            if (controller) {
                setElementStyles(controller, {
                    transform: `translate(${deltaX}px, ${deltaY}px)`
                });
            }
        };
        
        // 鼠标释放事件处理器  
        const handleMouseUp = (e) => {
            if (!isDragging) return;
            
            isDragging = false;
            
            // 计算最终位置并应用到style属性
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            const finalLeft = initialLeft + deltaX;
            const finalTop = initialTop + deltaY;
            
            // 应用最终位置到CSS left/top属性，保持原始transform
            setElementStyles(layerElement, {
                left: `${finalLeft}px`,
                top: `${finalTop}px`
                // 不清除transform，保持缩放
            });
            
            // 重新计算控制器位置以匹配新的图层位置
            if (controller) {
                // 清除拖拽时的临时transform
                setElementStyles(controller, {
                    transform: ''
                });
                
                // 更新控制器位置而不是重新创建
                this.updateControllerAfterResize(modal, layerElement);
            }
            
            // 恢复样式
            setElementStyles(document.body, {
                cursor: '',
                userSelect: ''
            });
            
            console.log(`✅ [NEW] 拖拽结束: ${layerId}`, { finalLeft, finalTop });
        };
        
        // 使用DOM助手绑定事件 - 同时绑定到图层元素和控制器
        const cleanupDragLayer = bindEvent(layerElement, 'mousedown', handleMouseDown);
        const cleanupDragController = bindEvent(controller, 'mousedown', handleMouseDown);
        const cleanupMove = bindEvent(document, 'mousemove', handleMouseMove);
        const cleanupUp = bindEvent(document, 'mouseup', handleMouseUp);
        
        // 保存清理函数
        layerElement._dragCleanup = () => {
            cleanupDragLayer();
            cleanupDragController();
            cleanupMove();
            cleanupUp();
            setElementStyles(layerElement, { cursor: '', pointerEvents: '', userSelect: '' });
        };
        
        console.log(`✅ [NEW] 图层拖拽功能已设置: ${layerId}`);
    }

    /**
     * 绑定缩放手柄事件 - 简化版
     */
    bindResizeHandle(handle, handleType, modal, layerElement, layerId, layerType) {
        console.log(`🔧 [NEW] 绑定缩放手柄: ${handleType}`);
        
        let isResizing = false;
        let startMouseX, startMouseY;
        let startRect;
        
        const handleMouseDown = (e) => {
            if (e.button !== 0) return;
            
            isResizing = true;
            startMouseX = e.clientX;
            startMouseY = e.clientY;
            startRect = layerElement.getBoundingClientRect();
            
            console.log(`🎯 [NEW] 开始缩放: ${handleType}`, { startRect });
            
            document.body.style.cursor = handle.style.cursor;
            document.body.style.userSelect = 'none';
            
            e.preventDefault();
            e.stopPropagation();
        };
        
        const handleMouseMove = (e) => {
            if (!isResizing) return;
            
            e.preventDefault();
            
            const deltaX = e.clientX - startMouseX;
            const deltaY = e.clientY - startMouseY;
            
            // 简单的缩放逻辑 - 根据手柄类型调整
            let newWidth = startRect.width;
            let newHeight = startRect.height;
            let newLeft = startRect.left;
            let newTop = startRect.top;
            
            switch (handleType) {
                case 'se': // 东南角
                    newWidth = Math.max(50, startRect.width + deltaX);
                    newHeight = Math.max(50, startRect.height + deltaY);
                    break;
                case 'nw': // 西北角
                    newWidth = Math.max(50, startRect.width - deltaX);
                    newHeight = Math.max(50, startRect.height - deltaY);
                    newLeft = startRect.left + deltaX;
                    newTop = startRect.top + deltaY;
                    break;
                case 'ne': // 东北角
                    newWidth = Math.max(50, startRect.width + deltaX);
                    newHeight = Math.max(50, startRect.height - deltaY);
                    newTop = startRect.top + deltaY;
                    break;
                case 'sw': // 西南角
                    newWidth = Math.max(50, startRect.width - deltaX);
                    newHeight = Math.max(50, startRect.height + deltaY);
                    newLeft = startRect.left + deltaX;
                    break;
                case 'e': // 东
                    newWidth = Math.max(50, startRect.width + deltaX);
                    break;
                case 'w': // 西
                    newWidth = Math.max(50, startRect.width - deltaX);
                    newLeft = startRect.left + deltaX;
                    break;
                case 'n': // 北
                    newHeight = Math.max(50, startRect.height - deltaY);
                    newTop = startRect.top + deltaY;
                    break;
                case 's': // 南
                    newHeight = Math.max(50, startRect.height + deltaY);
                    break;
            }
            
            // 计算缩放比例并应用到图层元素
            const scaleX = newWidth / startRect.width;
            const scaleY = newHeight / startRect.height;
            
            // 应用transform到图层
            layerElement.style.transform = `scale(${scaleX}, ${scaleY})`;
            
            // 同步更新控制器
            const controller = modal.querySelector('#transform-controller');
            if (controller) {
                const canvasContainer = modal.querySelector('#image-canvas');
                const canvasRect = canvasContainer.getBoundingClientRect();
                
                setElementStyles(controller, {
                    left: `${newLeft - canvasRect.left}px`,
                    top: `${newTop - canvasRect.top}px`,
                    width: `${newWidth}px`,
                    height: `${newHeight}px`
                });
            }
        };
        
        const handleMouseUp = (e) => {
            if (!isResizing) return;
            
            isResizing = false;
            
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            
            console.log(`✅ [NEW] 缩放结束: ${handleType}`);
        };
        
        // 绑定事件
        bindEvent(handle, 'mousedown', handleMouseDown);
        bindEvent(document, 'mousemove', handleMouseMove);
        bindEvent(document, 'mouseup', handleMouseUp);
    }

    /**
     * 绑定旋转手柄事件 - 简化版
     */
    bindRotateHandle(handle, modal, layerElement, layerId, layerType) {
        console.log(`🔧 [NEW] 绑定旋转手柄`);
        
        let isRotating = false;
        let startAngle = 0;
        let currentRotation = 0;
        
        const handleMouseDown = (e) => {
            if (e.button !== 0) return;
            
            isRotating = true;
            
            // 计算起始角度
            const rect = layerElement.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
            
            console.log(`🎯 [NEW] 开始旋转: ${layerId}`);
            
            document.body.style.cursor = 'crosshair';
            document.body.style.userSelect = 'none';
            
            e.preventDefault();
            e.stopPropagation();
        };
        
        const handleMouseMove = (e) => {
            if (!isRotating) return;
            
            e.preventDefault();
            
            // 计算当前角度
            const rect = layerElement.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
            
            // 计算旋转角度（转换为度数）
            const rotation = (currentAngle - startAngle) * (180 / Math.PI);
            currentRotation = rotation;
            
            // 应用旋转到图层
            layerElement.style.transform = `rotate(${rotation}deg)`;
            
            // 同步更新控制器旋转
            const controller = modal.querySelector('#transform-controller');
            if (controller) {
                controller.style.transform = `rotate(${rotation}deg)`;
            }
        };
        
        const handleMouseUp = (e) => {
            if (!isRotating) return;
            
            isRotating = false;
            
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            
            console.log(`✅ [NEW] 旋转结束: ${currentRotation}度`);
        };
        
        // 绑定事件
        bindEvent(handle, 'mousedown', handleMouseDown);
        bindEvent(document, 'mousemove', handleMouseMove);
        bindEvent(document, 'mouseup', handleMouseUp);
    }

    startTransformLayer(modal, layerId, layerType) {
        console.log('🔄 开始变换面板:', layerId, layerType);

        // 显示变换控制面板
        const transformControls = modal.querySelector('#transform-controls');
        if (transformControls) {
            transformControls.style.display = 'block';
            
            // 更新图层信息
            const layerName = transformControls.querySelector('#transform-layer-name');
            if (layerName) {
                layerName.textContent = layerId;
            }
        }

        // 获取当前变换状态
        this.loadCurrentTransform(modal, layerId, layerType);
    }

    /**
     * 加载当前变换状态
     */
    loadCurrentTransform(modal, layerId, layerType) {
        // 根据图层类型获取当前变换值
        const currentTransform = this.getCurrentTransform(modal, layerId, layerType);
        
        if (currentTransform) {
            this.transformState.originalTransform = { ...currentTransform };
            this.updateTransformControls(modal, currentTransform);
        }
    }

    /**
     * 获取当前变换状态
     */
    getCurrentTransform(modal, layerId, layerType) {
        if (layerType === 'connected') {
            // 连接图层的变换状态
            const connectedLayers = this.nodeInstance.connectedImageLayers || [];
            const layer = connectedLayers.find(l => l.id === layerId);
            return layer?.transform || { x: 0, y: 0, scale: 1.0, rotation: 0 };
        } else if (layerType === 'annotation') {
            // 标注的变换状态
            const annotation = modal.annotations?.find(ann => ann.id === layerId);
            return annotation?.transform || { x: 0, y: 0, scale: 1.0, rotation: 0 };
        }
        
        return { x: 0, y: 0, scale: 1.0, rotation: 0 };
    }

    /**
     * 更新变换控制面板的值
     */
    updateTransformControls(modal, transform) {
        const transformControls = modal.querySelector('#transform-controls');
        if (!transformControls) return;

        // 更新滑块值
        const xSlider = transformControls.querySelector('#transform-x');
        const ySlider = transformControls.querySelector('#transform-y');
        const scaleSlider = transformControls.querySelector('#transform-scale');
        const rotationSlider = transformControls.querySelector('#transform-rotation');

        if (xSlider) xSlider.value = transform.x;
        if (ySlider) ySlider.value = transform.y;
        if (scaleSlider) scaleSlider.value = transform.scale;
        if (rotationSlider) rotationSlider.value = transform.rotation;

        // 更新显示值
        const xValue = transformControls.querySelector('#transform-x-value');
        const yValue = transformControls.querySelector('#transform-y-value');
        const scaleValue = transformControls.querySelector('#transform-scale-value');
        const rotationValue = transformControls.querySelector('#transform-rotation-value');

        if (xValue) xValue.textContent = transform.x + 'px';
        if (yValue) yValue.textContent = transform.y + 'px';
        if (scaleValue) scaleValue.textContent = Math.round(transform.scale * 100) + '%';
        if (rotationValue) rotationValue.textContent = transform.rotation + '°';
    }

    /**
     * 更新变换预览
     */
    updateTransformPreview(modal) {
        if (!this.transformState.active) return;

        const transformControls = modal.querySelector('#transform-controls');
        if (!transformControls) return;

        // 获取当前滑块值
        const x = parseFloat(transformControls.querySelector('#transform-x')?.value || 0);
        const y = parseFloat(transformControls.querySelector('#transform-y')?.value || 0);
        const scale = parseFloat(transformControls.querySelector('#transform-scale')?.value || 1);
        const rotation = parseFloat(transformControls.querySelector('#transform-rotation')?.value || 0);

        // 应用预览变换
        this.applyTransformToElement(modal, this.transformState.layerId, this.transformState.layerType, {
            x, y, scale, rotation
        }, true);
    }

    /**
     * 应用变换
     */
    applyTransform(modal) {
        if (!this.transformState.active) return;

        console.log('✅ 应用变换到图层:', this.transformState.layerId);

        const transformControls = modal.querySelector('#transform-controls');
        if (!transformControls) return;

        // 获取变换值
        const x = parseFloat(transformControls.querySelector('#transform-x')?.value || 0);
        const y = parseFloat(transformControls.querySelector('#transform-y')?.value || 0);
        const scale = parseFloat(transformControls.querySelector('#transform-scale')?.value || 1);
        const rotation = parseFloat(transformControls.querySelector('#transform-rotation')?.value || 0);

        // 永久应用变换
        this.applyTransformToElement(modal, this.transformState.layerId, this.transformState.layerType, {
            x, y, scale, rotation
        }, false);

        // 保存变换状态到数据
        this.saveTransformToData(modal, this.transformState.layerId, this.transformState.layerType, {
            x, y, scale, rotation
        });
    }

    /**
     * 重置变换
     */
    resetTransform(modal) {
        if (!this.transformState.active || !this.transformState.originalTransform) return;

        console.log('🔄 重置变换');

        // 恢复到原始状态
        this.updateTransformControls(modal, this.transformState.originalTransform);
        this.updateTransformPreview(modal);
    }

    /**
     * 关闭变换控制
     */
    closeTransformControls(modal) {
        console.log('❌ 关闭变换控制');

        // 关闭变换模式
        const transformBtn = modal.querySelector('#vpe-transform-mode');
        if (transformBtn) {
            modal.transformModeActive = false;
            this.deactivateTransformMode(modal, transformBtn);
        }
    }

    /**
     * 应用变换到元素
     */
    applyTransformToElement(modal, layerId, layerType, transform, isPreview = false) {
        console.log('🔄 应用变换:', layerId, layerType, transform, isPreview ? '(预览)' : '(永久)');
        
        // 获取图层元素
        const layerElement = this.nodeInstance.getLayerElement(modal, layerId, layerType);
        if (!layerElement) {
            console.warn('⚠️ 无法找到图层元素进行变换');
            return;
        }
        
        // 构建CSS变换字符串
        const transformString = this.buildTransformString(transform);
        
        // 应用变换
        if (layerType === 'connected' || layerType === 'IMAGE_LAYER') {
            // 对于图像图层，应用变换到容器
            layerElement.style.transform = transformString;
            
            // 同时更新位置（如果有x,y变换）
            if (transform.x !== undefined) {
                layerElement.style.left = transform.x + 'px';
            }
            if (transform.y !== undefined) {
                layerElement.style.top = transform.y + 'px';
            }
            
            console.log(`🎨 图像图层变换应用: ${transformString}`);
        } else if (layerType === 'annotation' || layerType === 'ANNOTATION') {
            this.applyTransformToAnnotation(modal, layerId, transform, isPreview);
        }
        
        // 更新控制器位置和尺寸
        if (!isPreview) {
            this.updateControllerAfterTransform(modal, layerElement);
        }
    }
    
    /**
     * 构建CSS变换字符串
     */
    buildTransformString(transform) {
        const parts = [];
        
        // 注意：这里不包含translate，因为位置通过left/top处理
        if (transform.scale && transform.scale !== 1) {
            parts.push(`scale(${transform.scale})`);
        }
        
        if (transform.rotation && transform.rotation !== 0) {
            parts.push(`rotate(${transform.rotation}deg)`);
        }
        
        return parts.length > 0 ? parts.join(' ') : 'none';
    }
    
    /**
     * 变换后更新控制器
     */
    updateControllerAfterTransform(modal, layerElement) {
        // 重新创建控制器以反映新的变换
        const existingController = modal.querySelector('#transform-controller');
        if (existingController) {
            existingController.remove();
        }
        
        // 获取图层信息并重新创建控制器
        const layerId = this.transformState.layerId;
        const layerType = this.transformState.layerType;
        
        if (layerElement && layerId && layerType) {
            this.createLayerTransformController(modal, layerElement, layerId, layerType);
        }
    }

    /**
     * 应用变换到连接图层
     */
    applyTransformToConnectedLayer(modal, layerId, transform, isPreview) {
        // 实现连接图层的变换逻辑
        console.log('🔄 变换连接图层:', layerId, transform);
    }

    /**
     * 应用变换到标注
     */
    applyTransformToAnnotation(modal, layerId, transform, isPreview) {
        // 实现标注的变换逻辑
        const annotationElement = modal.querySelector(`[data-annotation-group="${layerId}"]`);
        if (annotationElement) {
            const transformString = `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale}) rotate(${transform.rotation}deg)`;
            annotationElement.style.transform = transformString;
        }
    }

    /**
     * 保存变换数据
     */
    saveTransformToData(modal, layerId, layerType, transform) {
        if (layerType === 'connected') {
            // 保存到连接图层数据
            const connectedLayers = this.nodeInstance.connectedImageLayers || [];
            const layer = connectedLayers.find(l => l.id === layerId);
            if (layer) {
                layer.transform = { ...transform };
            }
        } else if (layerType === 'annotation') {
            // 保存到标注数据
            const annotation = modal.annotations?.find(ann => ann.id === layerId);
            if (annotation) {
                annotation.transform = { ...transform };
            }
        }
        
        console.log('💾 变换数据已保存:', layerId, transform);
    }

    /**
     * 绑定缩放手柄事件
     */
    bindResizeHandle(handle, handleType, modal, layerElement, layerId, layerType) {
        let isResizing = false;
        let startX, startY, startWidth, startHeight, startLeft, startTop, startScale;
        
        const onMouseDown = (e) => {
            if (e.button !== 0) return; // 只处理左键
            
            console.log(`🔄 开始缩放: ${layerId} - ${handleType}`);
            
            isResizing = true;
            startX = e.clientX;
            startY = e.clientY;
            
            // 获取当前位置和缩放状态
            const style = window.getComputedStyle(layerElement);
            startLeft = parseFloat(style.left) || 0;
            startTop = parseFloat(style.top) || 0;
            
            // 获取当前的缩放因子并保存
            const currentTransform = layerElement.style.transform || '';
            const scaleMatch = currentTransform.match(/scale\(([\d.]+)(?:,\s*([\d.]+))?\)/);
            startScale = scaleMatch ? parseFloat(scaleMatch[1]) : 1;
            
            console.log('🔍 [RESIZE] 当前缩放状态:', {
                transform: currentTransform,
                extractedScale: startScale
            });
            
            // 获取实际图像的显示尺寸而不是容器尺寸
            const imgElement = layerElement.querySelector('img');
            if (imgElement) {
                const imgRect = imgElement.getBoundingClientRect();
                const actualImageSize = this.calculateObjectFitContainSize(imgElement, imgRect);
                startWidth = actualImageSize.width;
                startHeight = actualImageSize.height;
                
                console.log('🎯 [RESIZE] 缩放初始尺寸:', {
                    容器尺寸: `${layerElement.offsetWidth} x ${layerElement.offsetHeight}`,
                    图像显示尺寸: `${startWidth} x ${startHeight}`,
                    自然尺寸: `${imgElement.naturalWidth} x ${imgElement.naturalHeight}`
                });
            } else {
                startWidth = layerElement.offsetWidth;
                startHeight = layerElement.offsetHeight;
            }
            
            e.preventDefault();
            e.stopPropagation();
            
            document.addEventListener('mousemove', onMouseMove, { passive: false });
            document.addEventListener('mouseup', onMouseUp, { passive: false });
        };
        
        const onMouseMove = (e) => {
            if (!isResizing) return;
            
            e.preventDefault();
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            const isShiftPressed = e.shiftKey;
            
            // 降低缩放敏感度的因子 (0.5 = 一半敏感度)
            const sensitivity = 0.3;
            const adjustedDeltaX = deltaX * sensitivity;
            const adjustedDeltaY = deltaY * sensitivity;
            
            // 基于当前缩放因子计算新的缩放比例
            let scaleX = startScale;
            let scaleY = startScale;
            let offsetX = 0;
            let offsetY = 0;
            
            // 根据手柄类型计算缩放变化（基于当前缩放）
            const scaleChangeX = adjustedDeltaX / startWidth;
            const scaleChangeY = adjustedDeltaY / startHeight;
            
            switch (handleType) {
                case 'se': // 右下角 - 向右下扩展
                    scaleX = Math.max(0.1, Math.min(3.0, startScale + scaleChangeX));
                    scaleY = Math.max(0.1, Math.min(3.0, startScale + scaleChangeY));
                    break;
                case 'sw': // 左下角 - 向左下扩展
                    scaleX = Math.max(0.1, Math.min(3.0, startScale - scaleChangeX));
                    scaleY = Math.max(0.1, Math.min(3.0, startScale + scaleChangeY));
                    offsetX = (startScale - scaleX) * startWidth * 0.5;
                    break;
                case 'ne': // 右上角 - 向右上扩展  
                    scaleX = Math.max(0.1, Math.min(3.0, startScale + scaleChangeX));
                    scaleY = Math.max(0.1, Math.min(3.0, startScale - scaleChangeY));
                    offsetY = (startScale - scaleY) * startHeight * 0.5;
                    break;
                case 'nw': // 左上角 - 向左上扩展
                    scaleX = Math.max(0.1, Math.min(3.0, startScale - scaleChangeX));
                    scaleY = Math.max(0.1, Math.min(3.0, startScale - scaleChangeY));
                    offsetX = (startScale - scaleX) * startWidth * 0.5;
                    offsetY = (startScale - scaleY) * startHeight * 0.5;
                    break;
                case 'e': // 右边 - 只水平扩展
                    scaleX = Math.max(0.1, Math.min(3.0, startScale + scaleChangeX));
                    scaleY = isShiftPressed ? scaleX : startScale;
                    break;
                case 'w': // 左边 - 只水平扩展
                    scaleX = Math.max(0.1, Math.min(3.0, startScale - scaleChangeX));
                    scaleY = isShiftPressed ? scaleX : startScale;
                    offsetX = (startScale - scaleX) * startWidth * 0.5;
                    if (isShiftPressed) {
                        offsetY = (startScale - scaleY) * startHeight * 0.5;
                    }
                    break;
                case 'n': // 上边 - 只垂直扩展
                    scaleY = Math.max(0.1, Math.min(3.0, startScale - scaleChangeY));
                    scaleX = isShiftPressed ? scaleY : startScale; 
                    offsetY = (startScale - scaleY) * startHeight * 0.5;
                    if (isShiftPressed) {
                        offsetX = (startScale - scaleX) * startWidth * 0.5;
                    }
                    break;
                case 's': // 下边 - 只垂直扩展
                    scaleY = Math.max(0.1, Math.min(3.0, startScale + scaleChangeY));
                    scaleX = isShiftPressed ? scaleY : startScale;
                    if (isShiftPressed) {
                        offsetX = (startScale - scaleX) * startWidth * 0.5;
                    }
                    break;
            }
            
            // Shift键：角点保持比例缩放
            if (isShiftPressed && ['se', 'sw', 'ne', 'nw'].includes(handleType)) {
                // 选择主导方向的缩放值（基于变化量）
                const dominantScale = Math.abs(scaleX - startScale) > Math.abs(scaleY - startScale) ? scaleX : scaleY;
                scaleX = scaleY = dominantScale;
                
                // 重新计算偏移以保持对称
                switch (handleType) {
                    case 'sw':
                        offsetX = (startScale - scaleX) * startWidth * 0.5;
                        offsetY = 0;
                        break;
                    case 'ne':
                        offsetX = 0;
                        offsetY = (startScale - scaleY) * startHeight * 0.5;
                        break;
                    case 'nw':
                        offsetX = (startScale - scaleX) * startWidth * 0.5;
                        offsetY = (startScale - scaleY) * startHeight * 0.5;
                        break;
                    case 'se':
                    default:
                        offsetX = 0;
                        offsetY = 0;
                        break;
                }
            }
            
            // 应用transform缩放
            const currentTransform = layerElement.style.transform || '';
            const cleanTransform = currentTransform.replace(/scale\([^)]*\)/g, '').trim();
            const newTransform = `${cleanTransform} scale(${scaleX}, ${scaleY})`.trim();
            
            layerElement.style.transform = newTransform;
            layerElement.style.left = (startLeft + offsetX) + 'px';
            layerElement.style.top = (startTop + offsetY) + 'px';
            
            // 更新光标样式提示
            document.body.style.cursor = isShiftPressed ? 'nw-resize' : 'default';
            
            console.log(`🔧 缩放操作 ${handleType}:`, {
                delta: { x: deltaX, y: deltaY },
                shift: isShiftPressed,
                scale: { x: scaleX.toFixed(3), y: scaleY.toFixed(3) },
                offset: { x: offsetX.toFixed(1), y: offsetY.toFixed(1) }
            });
            
            // 更新控制器（延迟更新以避免频繁重计算）
            if (this._resizeUpdateTimeout) {
                clearTimeout(this._resizeUpdateTimeout);
            }
            this._resizeUpdateTimeout = setTimeout(() => {
                this.updateControllerAfterResize(modal, layerElement);
            }, 16); // 约60fps的更新频率
        };
        
        const onMouseUp = () => {
            if (!isResizing) return;
            
            isResizing = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            
            // 清理延迟更新
            if (this._resizeUpdateTimeout) {
                clearTimeout(this._resizeUpdateTimeout);
                this._resizeUpdateTimeout = null;
            }
            
            // 最终更新控制器位置
            this.updateControllerAfterResize(modal, layerElement);
            
            // 重置光标
            document.body.style.cursor = '';
            
            console.log(`✅ 缩放结束: ${layerId}`);
        };
        
        handle.addEventListener('mousedown', onMouseDown, { passive: false });
    }
    
    /**
     * 绑定旋转手柄事件
     */
    bindRotateHandle(handle, modal, layerElement, layerId, layerType) {
        let isRotating = false;
        let startAngle = 0;
        let currentRotation = 0;
        
        const onMouseDown = (e) => {
            if (e.button !== 0) return; // 只处理左键
            
            console.log(`🔄 开始旋转: ${layerId}`);
            
            isRotating = true;
            
            // 计算起始角度
            const rect = layerElement.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
            
            // 获取当前旋转角度
            const transform = layerElement.style.transform;
            const rotateMatch = transform.match(/rotate\(([^)]+)deg\)/);
            currentRotation = rotateMatch ? parseFloat(rotateMatch[1]) : 0;
            
            e.preventDefault();
            e.stopPropagation();
            
            document.addEventListener('mousemove', onMouseMove, { passive: false });
            document.addEventListener('mouseup', onMouseUp, { passive: false });
        };
        
        const onMouseMove = (e) => {
            if (!isRotating) return;
            
            e.preventDefault();
            
            // 计算当前角度
            const rect = layerElement.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
            
            // 计算角度差
            const deltaAngle = (currentAngle - startAngle) * (180 / Math.PI);
            const newRotation = currentRotation + deltaAngle;
            
            // 应用旋转
            const existingTransform = layerElement.style.transform.replace(/rotate\([^)]*\)/g, '');
            layerElement.style.transform = `${existingTransform} rotate(${newRotation}deg)`.trim();
            
            console.log(`🔄 旋转角度: ${newRotation.toFixed(1)}°`);
        };
        
        const onMouseUp = () => {
            if (!isRotating) return;
            
            isRotating = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            
            console.log(`✅ 旋转结束: ${layerId}`);
        };
        
        handle.addEventListener('mousedown', onMouseDown, { passive: false });
    }
    
    /**
     * 缩放后更新控制器 - 使用object-fit: contain计算
     */
    updateControllerAfterResize(modal, layerElement) {
        const controller = modal.querySelector('#transform-controller');
        if (!controller) return;
        
        // 重新计算控制器位置和尺寸
        const imgElement = layerElement.querySelector('img');
        if (imgElement) {
            const imgRect = imgElement.getBoundingClientRect();
            const parentContainer = layerElement.parentElement;
            const parentRect = parentContainer ? parentContainer.getBoundingClientRect() : { left: 0, top: 0 };
            
            // 使用与初始定位完全相同的 object-fit: contain 计算逻辑
            const actualImageSize = this.calculateObjectFitContainSize(imgElement, imgRect);
            
            // 计算图像在容器内的居中位置
            const imageOffsetX = (imgRect.width - actualImageSize.width) / 2;
            const imageOffsetY = (imgRect.height - actualImageSize.height) / 2;
            
            // 计算实际图像的屏幕位置
            const actualImageLeft = imgRect.left + imageOffsetX;
            const actualImageTop = imgRect.top + imageOffsetY;
            
            // 计算控制器相对于父容器的位置
            const controllerLeft = actualImageLeft - parentRect.left;
            const controllerTop = actualImageTop - parentRect.top;
            const padding = 3;
            
            // 更新控制器主框架
            controller.style.left = (controllerLeft - padding) + 'px';
            controller.style.top = (controllerTop - padding) + 'px';
            controller.style.width = (actualImageSize.width + padding * 2) + 'px';
            controller.style.height = (actualImageSize.height + padding * 2) + 'px';
            
            // 重新计算并更新所有控制点位置
            this.updateControlHandles(controller, actualImageSize.width, actualImageSize.height);
        }
    }
    
    /**
     * 更新控制点位置
     */
    updateControlHandles(controller, width, height) {
        const controlPoints = [
            { name: 'nw', x: 0, y: 0 },
            { name: 'n', x: 0.5, y: 0 },
            { name: 'ne', x: 1, y: 0 },
            { name: 'e', x: 1, y: 0.5 },
            { name: 'se', x: 1, y: 1 },
            { name: 's', x: 0.5, y: 1 },
            { name: 'sw', x: 0, y: 1 },
            { name: 'w', x: 0, y: 0.5 }
        ];
        
        controlPoints.forEach(point => {
            const handle = controller.querySelector(`#transform-handle-${point.name}`);
            if (handle) {
                const newTop = point.y === 0 ? -5 : (point.y === 1 ? height - 5 : height / 2 - 5);
                const newLeft = point.x === 0 ? -5 : (point.x === 1 ? width - 5 : width / 2 - 5);
                
                handle.style.top = newTop + 'px';
                handle.style.left = newLeft + 'px';
            }
        });
        
        // 更新旋转手柄位置
        const rotateHandle = controller.querySelector('#transform-rotate-handle');
        if (rotateHandle) {
            rotateHandle.style.left = (width / 2 - 5) + 'px';
        }
        
        console.log('🔄 [TRANSFORM] 控制点位置已更新:', { width, height });
    }

    /**
     * 计算object-fit: contain的实际显示尺寸
     */
    calculateObjectFitContainSize(imgElement, imgRect) {
        // 如果图像还没有加载完成，使用元素尺寸作为后备
        if (!imgElement.naturalWidth || !imgElement.naturalHeight) {
            console.warn('⚠️ 图像尺寸信息不可用，使用元素尺寸');
            return {
                width: imgRect.width,
                height: imgRect.height
            };
        }
        
        const naturalWidth = imgElement.naturalWidth;
        const naturalHeight = imgElement.naturalHeight;
        const containerWidth = imgRect.width;
        const containerHeight = imgRect.height;
        
        // 计算原始图像宽高比
        const imageAspectRatio = naturalWidth / naturalHeight;
        const containerAspectRatio = containerWidth / containerHeight;
        
        let displayWidth, displayHeight;
        
        if (imageAspectRatio > containerAspectRatio) {
            // 图像更宽，受宽度限制
            displayWidth = containerWidth;
            displayHeight = containerWidth / imageAspectRatio;
        } else {
            // 图像更高，受高度限制
            displayHeight = containerHeight;
            displayWidth = containerHeight * imageAspectRatio;
        }
        
        console.log(`📐 object-fit: contain 尺寸计算:`, {
            原始尺寸: `${naturalWidth} x ${naturalHeight}`,
            容器尺寸: `${containerWidth} x ${containerHeight}`,
            图像宽高比: imageAspectRatio.toFixed(3),
            容器宽高比: containerAspectRatio.toFixed(3),
            计算显示尺寸: `${displayWidth.toFixed(1)} x ${displayHeight.toFixed(1)}`
        });
        
        return {
            width: displayWidth,
            height: displayHeight
        };
    }

    /**
     * 清理资源
     */
    cleanup() {
        this.transformState = {
            active: false,
            layerId: null,
            layerType: null,
            originalTransform: null
        };
    }
}

// 导出创建函数
export function createTransformControls(nodeInstance) {
    return new TransformControls(nodeInstance);
}