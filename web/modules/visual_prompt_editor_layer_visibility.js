/**
 * Visual Prompt Editor - 图层可见性控制模块
 * 负责图层可见性切换、状态管理和视觉反馈
 */

export class LayerVisibilityController {
    constructor(nodeInstance) {
        this.nodeInstance = nodeInstance;
        this._lastClickTime = {};
        this._layerVisibilityStates = new Map();
    }

    /**
     * 绑定图层可见性事件
     */
    bindLayerVisibilityEvents(modal) {
        console.log('👁️ 绑定图层可见性事件...');
        
        // 使用事件委托绑定可见性按钮点击事件
        const layersList = modal.querySelector('#layers-list');
        if (!layersList) {
            return;
        }
        
        // 移除现有的事件监听器（如果存在）
        if (layersList.visibilityEventsBound) {
            return; // 已经绑定过，避免重复绑定
        }
        
        // 使用命名函数以便后续可以移除
        const visibilityClickHandler = (e) => {
            // 检查是否是可见性按钮点击
            if (e.target.classList.contains('layer-visibility-btn')) {
                e.stopPropagation();
                e.preventDefault(); // 防止意外的默认行为
                
                const layerId = e.target.getAttribute('data-layer-id');
                const layerType = e.target.getAttribute('data-layer-type');
                
                console.log(`👁️ 切换图层可见性: ${layerId} (${layerType})`);
                
                // 防抖：检查是否在短时间内重复点击
                const now = Date.now();
                if (this._lastClickTime[layerId] && (now - this._lastClickTime[layerId]) < 300) {
                    console.log('⚡ 防抖：忽略重复点击');
                    return;
                }
                this._lastClickTime[layerId] = now;
                
                // 切换可见性状态
                this.toggleLayerVisibility(modal, layerId, layerType, e.target);
            }
        };
        
        layersList.addEventListener('click', visibilityClickHandler);
        layersList._visibilityClickHandler = visibilityClickHandler;
        
        // 标记已绑定事件
        layersList.visibilityEventsBound = true;
        console.log('✅ 图层可见性事件绑定完成');
    }

    /**
     * 切换图层可见性
     */
    toggleLayerVisibility(modal, layerId, layerType, buttonElement) {
        console.log(`🔄 切换图层可见性: ${layerId} (${layerType})`);
        
        // 获取当前可见性状态 - 从状态管理器获取更可靠的状态
        const currentState = this.getLayerVisibilityState(modal, layerId);
        const newVisibilityState = !currentState;
        
        console.log(`📊 图层 ${layerId} 状态切换: ${currentState} -> ${newVisibilityState}`);
        
        // 更新按钮状态
        buttonElement.textContent = newVisibilityState ? '👁️' : '🙈';
        
        // 保存可见性状态到状态管理器
        this.setLayerVisibilityState(modal, layerId, newVisibilityState);
        
        // 获取图层项并更新视觉效果
        const layerItem = buttonElement.closest('.layer-list-item');
        if (layerItem) {
            const opacity = newVisibilityState ? '1' : '0.5';
            const description = layerItem.querySelector('span[style*="flex: 1"]');
            const status = layerItem.querySelector('span[style*="margin-left: 8px"]');
            
            if (description) description.style.opacity = opacity;
            if (status) status.style.opacity = opacity;
        }
        
        if (layerType === 'connected' || layerType === 'IMAGE_LAYER') {
            // 处理连接图层的可见性
            this.toggleConnectedLayerVisibility(modal, layerId, newVisibilityState);
        } else if (layerType === 'annotation' || layerType === 'ANNOTATION') {
            // 处理标注图层的可见性
            this.toggleAnnotationLayerVisibility(modal, layerId, newVisibilityState);
        }
        
        console.log(`${newVisibilityState ? '👁️' : '🙈'} 图层 ${layerId} 可见性已切换为: ${newVisibilityState ? '可见' : '隐藏'}`);
    }

    /**
     * 切换连接图层可见性
     */
    toggleConnectedLayerVisibility(modal, layerId, isVisible) {
        console.log(`🖼️ 切换连接图层可见性: ${layerId} -> ${isVisible}`);
        
        // 更新连接图层数据
        if (this.nodeInstance.connectedImageLayers) {
            const layer = this.nodeInstance.connectedImageLayers.find(l => l.id === layerId);
            
            if (layer) {
                layer.visible = isVisible;
                console.log(`✅ 找到并更新连接图层: ${layer.id} (原名: ${layer.originalName})`);
            } else {
                console.log(`⚠️ 未找到连接图层: ${layerId}，创建新的可见性状态`);
            }
        }
        
        // 更新画布上的图层显示
        const canvasLayerElement = modal.querySelector(`#canvas-layer-${layerId}`);
        if (canvasLayerElement) {
            canvasLayerElement.style.display = isVisible ? 'block' : 'none';
            console.log(`🎨 画布图层 ${layerId} 显示状态: ${isVisible ? '显示' : '隐藏'}`);
        } else {
            console.log(`⚠️ 未找到画布图层元素: #canvas-layer-${layerId}`);
        }
    }

    /**
     * 切换标注图层可见性（增强版：支持多容器结构）
     */
    toggleAnnotationLayerVisibility(modal, layerId, isVisible) {
        console.log(`📝 切换标注图层可见性: ${layerId} -> ${isVisible}`);
        let elementsUpdated = 0;
        
        // 更新标注数据
        if (modal.annotations) {
            const annotation = modal.annotations.find(ann => ann.id === layerId);
            if (annotation) {
                annotation.visible = isVisible;
                console.log(`✅ 找到并更新标注数据: ${annotation.id}`);
            }
        }
        
        // 1. 更新主SVG中的标注元素（多种选择器）
        const mainSvg = modal.querySelector('#drawing-layer svg');
        if (mainSvg) {
            const selectors = [
                `[data-annotation-id="${layerId}"]`,
                `[data-annotation-group="${layerId}"]`,
                `g[data-annotation-id="${layerId}"]`,
                `.annotation-shape[data-annotation-id="${layerId}"]`
            ];
            
            selectors.forEach(selector => {
                const elements = mainSvg.querySelectorAll(selector);
                elements.forEach(element => {
                    element.style.display = isVisible ? 'block' : 'none';
                    elementsUpdated++;
                    console.log(`🎨 主SVG元素 ${element.tagName} 显示状态: ${isVisible ? '显示' : '隐藏'}`);
                });
            });
        }
        
        // 2. 更新独立SVG容器（图层系统）- 修正选择器
        const independentContainer = modal.querySelector(`#annotation-svg-${layerId}`);
        if (independentContainer) {
            independentContainer.style.display = isVisible ? 'block' : 'none';
            elementsUpdated++;
            console.log(`🎨 独立标注容器 annotation-svg-${layerId} 显示状态: ${isVisible ? '显示' : '隐藏'}`);
        }
        
        // 3. 检查旧的选择器命名（向后兼容）
        const legacyContainer = modal.querySelector(`#svg-annotation-${layerId}`);
        if (legacyContainer) {
            legacyContainer.style.display = isVisible ? 'block' : 'none';
            elementsUpdated++;
            console.log(`🎨 旧版标注容器 svg-annotation-${layerId} 显示状态: ${isVisible ? '显示' : '隐藏'}`);
        }
        
        // 4. 更新image-canvas中的标注元素
        const imageCanvas = modal.querySelector('#image-canvas');
        if (imageCanvas) {
            const canvasElements = imageCanvas.querySelectorAll(`[data-annotation-id="${layerId}"], [data-annotation-group="${layerId}"]`);
            canvasElements.forEach(element => {
                if (!element.closest('#drawing-layer')) { // 避免重复处理主SVG中的元素
                    element.style.display = isVisible ? 'block' : 'none';
                    elementsUpdated++;
                    console.log(`🎨 image-canvas元素 ${element.tagName} 显示状态: ${isVisible ? '显示' : '隐藏'}`);
                }
            });
        }
        
        // 5. 处理所有可能的独立SVG容器
        const canvasContainer = modal.querySelector('#canvas-container');
        if (canvasContainer) {
            const allIndependentContainers = canvasContainer.querySelectorAll('[id^="annotation-svg-"]');
            allIndependentContainers.forEach(container => {
                if (container.id === `annotation-svg-${layerId}`) {
                    return; // 已在步骤2中处理
                }
                
                const svg = container.querySelector('svg');
                if (svg) {
                    const elements = svg.querySelectorAll(`[data-annotation-id="${layerId}"], [data-annotation-group="${layerId}"]`);
                    elements.forEach(element => {
                        element.style.display = isVisible ? 'block' : 'none';
                        elementsUpdated++;
                        console.log(`🎨 独立容器内元素 ${element.tagName} 显示状态: ${isVisible ? '显示' : '隐藏'}`);
                    });
                }
            });
        }
        
        console.log(`${isVisible ? '👁️' : '🙈'} 标注图层 ${layerId} 可见性已切换为: ${isVisible ? '可见' : '隐藏'}，共更新 ${elementsUpdated} 个元素`);
    }

    /**
     * 获取图层可见性状态
     */
    getLayerVisibilityState(modal, layerId) {
        // 优先从内存状态获取
        if (this._layerVisibilityStates.has(layerId)) {
            return this._layerVisibilityStates.get(layerId);
        }
        
        // 从按钮状态获取
        const button = modal.querySelector(`button[data-layer-id="${layerId}"]`);
        if (button) {
            const isVisible = button.textContent.trim() === '👁️';
            this._layerVisibilityStates.set(layerId, isVisible);
            return isVisible;
        }
        
        // 从数据模型获取
        if (this.nodeInstance.connectedImageLayers) {
            const layer = this.nodeInstance.connectedImageLayers.find(l => l.id === layerId);
            if (layer) {
                this._layerVisibilityStates.set(layerId, layer.visible !== false);
                return layer.visible !== false;
            }
        }
        
        if (modal.annotations) {
            const annotation = modal.annotations.find(ann => ann.id === layerId);
            if (annotation) {
                this._layerVisibilityStates.set(layerId, annotation.visible !== false);
                return annotation.visible !== false;
            }
        }
        
        // 默认可见
        this._layerVisibilityStates.set(layerId, true);
        return true;
    }

    /**
     * 设置图层可见性状态
     */
    setLayerVisibilityState(modal, layerId, isVisible) {
        this._layerVisibilityStates.set(layerId, isVisible);
        
        // 同时更新数据模型
        if (this.nodeInstance.connectedImageLayers) {
            const layer = this.nodeInstance.connectedImageLayers.find(l => l.id === layerId);
            if (layer) {
                layer.visible = isVisible;
            }
        }
        
        if (modal.annotations) {
            const annotation = modal.annotations.find(ann => ann.id === layerId);
            if (annotation) {
                annotation.visible = isVisible;
            }
        }
    }

    /**
     * 初始化图层可见性状态
     */
    initializeLayerVisibilityStates(modal) {
        console.log('🔄 初始化图层可见性状态...');
        
        // 初始化连接图层状态
        if (this.nodeInstance.connectedImageLayers) {
            this.nodeInstance.connectedImageLayers.forEach(layer => {
                if (layer.visible === undefined) {
                    layer.visible = true; // 默认可见
                }
                this._layerVisibilityStates.set(layer.id, layer.visible);
            });
        }
        
        // 初始化标注图层状态
        if (modal.annotations) {
            modal.annotations.forEach(annotation => {
                if (annotation.visible === undefined) {
                    annotation.visible = true; // 默认可见
                }
                this._layerVisibilityStates.set(annotation.id, annotation.visible);
            });
        }
        
        // 更新UI状态
        this.updateAllVisibilityButtons(modal);
        
        console.log('✅ 图层可见性状态初始化完成');
    }

    /**
     * 更新所有可见性按钮状态
     */
    updateAllVisibilityButtons(modal) {
        const buttons = modal.querySelectorAll('.layer-visibility-btn');
        buttons.forEach(button => {
            const layerId = button.getAttribute('data-layer-id');
            const isVisible = this.getLayerVisibilityState(modal, layerId);
            button.textContent = isVisible ? '👁️' : '🙈';
        });
    }

    /**
     * 批量设置图层可见性
     */
    setAllLayersVisibility(modal, isVisible) {
        const buttons = modal.querySelectorAll('.layer-visibility-btn');
        buttons.forEach(button => {
            const layerId = button.getAttribute('data-layer-id');
            const layerType = button.getAttribute('data-layer-type');
            
            this.setLayerVisibilityState(modal, layerId, isVisible);
            button.textContent = isVisible ? '👁️' : '🙈';
            
            if (layerType === 'connected') {
                this.toggleConnectedLayerVisibility(modal, layerId, isVisible);
            } else if (layerType === 'annotation') {
                this.toggleAnnotationLayerVisibility(modal, layerId, isVisible);
            }
        });
    }

    /**
     * 获取所有图层可见性状态
     */
    getAllVisibilityStates() {
        return new Map(this._layerVisibilityStates);
    }

    /**
     * 清理资源
     */
    cleanup(modal) {
        const layersList = modal.querySelector('#layers-list');
        if (layersList && layersList._visibilityClickHandler) {
            layersList.removeEventListener('click', layersList._visibilityClickHandler);
            delete layersList._visibilityClickHandler;
            layersList.visibilityEventsBound = false;
        }
        
        this._layerVisibilityStates.clear();
        this._lastClickTime = {};
    }
}

// 导出创建函数
export function createLayerVisibilityController(nodeInstance) {
    return new LayerVisibilityController(nodeInstance);
}