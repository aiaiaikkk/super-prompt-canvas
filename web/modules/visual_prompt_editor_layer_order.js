/**
 * Visual Prompt Editor - 图层排序和拖拽模块
 * 负责图层拖拽、重新排序、Z轴控制和相关事件处理
 */

export class LayerOrderController {
    constructor(nodeInstance) {
        this.nodeInstance = nodeInstance;
        this._swapDebounce = new Map();
        this._dragState = {
            draggedElement: null,
            dragOverElement: null
        };
    }

    /**
     * 绑定图层顺序调整事件
     */
    bindLayerOrderEvents(modal) {
        console.log('🔄 绑定图层顺序调整事件...');
        
        const layersList = modal.querySelector('#layers-list');
        if (!layersList) {
            return;
        }
        
        // 移除现有的拖拽和排序事件监听器（如果存在）
        if (layersList.orderEventsBound) {
            return; // 已经绑定过，避免重复绑定
        }
        
        // 绑定拖拽排序事件
        this.bindDragAndDropEvents(modal, layersList);
        
        
        layersList.orderEventsBound = true;
        console.log('✅ 图层顺序调整事件绑定完成');
    }

    /**
     * 绑定拖拽事件
     */
    bindDragAndDropEvents(modal, layersList) {
        const self = this; // 保存this上下文
        
        // 使用事件委托处理拖拽事件
        layersList.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('layer-list-item')) {
                self._dragState.draggedElement = e.target;
                e.target.style.opacity = '0.5';
                e.target.style.transform = 'scale(0.95)';
                console.log(`🟡 开始拖拽图层: ${e.target.getAttribute('data-layer-id')}`);
            }
        });
        
        layersList.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('layer-list-item')) {
                e.target.style.opacity = '1';
                e.target.style.transform = 'scale(1)';
                self._dragState.draggedElement = null;
                self._dragState.dragOverElement = null;
                
                // 移除所有拖拽高亮
                layersList.querySelectorAll('.layer-list-item').forEach(item => {
                    item.style.borderColor = '#444';
                    item.style.backgroundColor = '#2b2b2b';
                });
                
                console.log(`✅ 拖拽结束`);
            }
        });
        
        layersList.addEventListener('dragover', (e) => {
            e.preventDefault();
            const target = e.target.closest('.layer-list-item');
            if (target && target !== self._dragState.draggedElement) {
                self._dragState.dragOverElement = target;
                
                // 高亮拖拽目标
                layersList.querySelectorAll('.layer-list-item').forEach(item => {
                    if (item === target) {
                        item.style.borderColor = '#2196F3';
                        item.style.backgroundColor = '#1a2332';
                    } else if (item !== self._dragState.draggedElement) {
                        item.style.borderColor = '#444';
                        item.style.backgroundColor = '#2b2b2b';
                    }
                });
            }
        });
        
        layersList.addEventListener('drop', (e) => {
            e.preventDefault();
            const { draggedElement, dragOverElement } = self._dragState;
            
            if (draggedElement && dragOverElement && draggedElement !== dragOverElement) {
                const draggedId = draggedElement.getAttribute('data-layer-id');
                const targetId = dragOverElement.getAttribute('data-layer-id');
                
                console.log(`🔄 拖拽排序: ${draggedId} -> ${targetId}`);
                self.reorderLayers(modal, draggedId, targetId);
            }
        });
    }


    /**
     * 重新排序图层（增强版：支持容错处理和数据同步）
     */
    reorderLayers(modal, draggedLayerId, targetLayerId) {
        console.log(`🔄 重新排序图层: ${draggedLayerId} -> ${targetLayerId}`);
        
        // 先验证DOM状态
        this.validateDOMOrder(modal);
        
        // 获取所有图层数据
        const allLayers = this.getAllLayersInOrder(modal);
        console.log(`📊 当前图层数据:`, allLayers.map(l => `${l.id}(${l.type}${l.placeholder ? '[占位符]' : ''})`));
        
        const draggedIndex = allLayers.findIndex(layer => layer.id === draggedLayerId);
        const targetIndex = allLayers.findIndex(layer => layer.id === targetLayerId);
        
        console.log(`🔍 图层索引查找结果 - 拖拽: ${draggedIndex}, 目标: ${targetIndex}`);
        
        // 检查是否存在占位符
        const draggedLayer = allLayers[draggedIndex];
        const targetLayer = allLayers[targetIndex];
        const hasPlaceholders = (draggedLayer && draggedLayer.placeholder) || (targetLayer && targetLayer.placeholder);
        
        if (draggedIndex === -1 || targetIndex === -1 || hasPlaceholders) {
            console.warn(`⚠️ 数据不完整或包含占位符，使用容错模式`);
            console.log(`   - 拖拽图层索引: ${draggedIndex} ${draggedLayer?.placeholder ? '(占位符)' : ''}`);
            console.log(`   - 目标图层索引: ${targetIndex} ${targetLayer?.placeholder ? '(占位符)' : ''}`);
            
            // 优先尝试DOM级别的重排序
            const domSuccess = this.attemptDOMReorder(modal, draggedLayerId, targetLayerId);
            if (domSuccess) {
                console.log('✅ DOM级别重排序成功');
                
                // 尝试更新Z-index
                this.attemptZIndexUpdate(modal, draggedLayerId, targetLayerId);
                
                // 尝试数据同步（延迟执行，避免干扰当前操作）
                setTimeout(() => {
                    this.syncDataWithDOM(modal);
                    // 容错模式下也需要强制修复Z-index
                    this.forceFixLayerZIndex(modal);
                }, 200);
                
                console.log('✅ 容错模式重排序完成');
                return;
            } else {
                console.error('❌ 容错模式重排序失败');
                
                // 最后尝试：强制刷新图层列表
                this.forceRefreshLayerList(modal);
                return;
            }
        }
        
        // 正常的重排序流程
        console.log(`🔄 执行正常重排序: 从位置 ${draggedIndex} 移动到位置 ${targetIndex}`);
        
        // 重新排列数组
        const draggedLayerData = allLayers.splice(draggedIndex, 1)[0];
        allLayers.splice(targetIndex, 0, draggedLayerData);
        
        console.log(`🔄 重排序后的图层:`, allLayers.map(l => `${l.id}(${l.type})`));
        
        try {
            // 更新图层数据顺序
            this.updateLayersOrder(modal, allLayers);
            
            // 更新Z-index
            this.updateLayersZIndex(modal, allLayers);
            
            // 保存图层顺序状态
            if (this.nodeInstance.saveLayerOrder) {
                this.nodeInstance.saveLayerOrder(modal, allLayers);
            }
            
            // 更新DOM中的图层顺序
            this.updateLayerListDOMOrder(modal, draggedLayerId, targetLayerId);
            
            // 延迟强制修复Z-index显示问题
            setTimeout(() => {
                this.forceFixLayerZIndex(modal);
            }, 100);
            
            console.log('✅ 图层顺序调整完成');
        } catch (error) {
            console.error('❌ 正常重排序过程中发生错误:', error);
            
            // 发生错误时尝试容错处理
            const fallbackSuccess = this.attemptDOMReorder(modal, draggedLayerId, targetLayerId);
            if (fallbackSuccess) {
                console.log('✅ 容错处理成功');
                this.attemptZIndexUpdate(modal, draggedLayerId, targetLayerId);
            } else {
                console.error('❌ 容错处理也失败，强制刷新图层列表');
                this.forceRefreshLayerList(modal);
            }
        }
    }

    /**
     * 同步数据与DOM状态
     */
    syncDataWithDOM(modal) {
        console.log('🔄 同步数据与DOM状态...');
        
        try {
            const layersList = modal.querySelector('#layers-list');
            if (!layersList) return;
            
            const layerItems = layersList.querySelectorAll('.layer-list-item');
            const orderedIds = Array.from(layerItems).map(item => ({
                id: item.dataset.layerId,
                type: item.dataset.layerType
            }));
            
            console.log('📋 DOM中的图层顺序:', orderedIds.map(l => `${l.id}(${l.type})`));
            
            // 重新组织数据数组以匹配DOM顺序
            this.reorganizeDataToMatchDOM(modal, orderedIds);
            
            console.log('✅ 数据与DOM同步完成');
        } catch (error) {
            console.error('❌ 数据同步失败:', error);
        }
    }

    /**
     * 重新组织数据以匹配DOM顺序
     */
    reorganizeDataToMatchDOM(modal, orderedIds) {
        try {
            // 重新组织连接图层数组
            if (this.nodeInstance.connectedImageLayers) {
                const connectedIds = orderedIds.filter(item => 
                    item.type === 'connected' || item.type === 'IMAGE_LAYER'
                );
                
                const reorderedConnected = [];
                connectedIds.forEach(item => {
                    const layer = this.nodeInstance.connectedImageLayers.find(l => l && l.id === item.id);
                    if (layer) {
                        reorderedConnected.push(layer);
                    }
                });
                
                this.nodeInstance.connectedImageLayers = reorderedConnected;
                console.log('📊 连接图层数据已重新排序');
            }
            
            // 重新组织标注数组
            if (modal.annotations) {
                const annotationIds = orderedIds.filter(item => 
                    item.type === 'annotation' || item.type === 'ANNOTATION'
                );
                
                const reorderedAnnotations = [];
                annotationIds.forEach(item => {
                    const annotation = modal.annotations.find(a => a && a.id === item.id);
                    if (annotation) {
                        reorderedAnnotations.push(annotation);
                    }
                });
                
                modal.annotations = reorderedAnnotations;
                console.log('📊 标注数据已重新排序');
            }
        } catch (error) {
            console.error('❌ 数据重组失败:', error);
        }
    }

    /**
     * 强制刷新图层列表
     */
    forceRefreshLayerList(modal) {
        console.log('🔄 强制刷新图层列表...');
        
        try {
            if (this.nodeInstance.layerListManager) {
                // 默认显示所有图层（连接图层+标注图层）
                this.nodeInstance.layerListManager.updateIntegratedLayersList(modal);
                console.log('✅ 图层列表已强制刷新');
            } else {
                console.warn('⚠️ layerListManager 不可用，无法刷新');
            }
        } catch (error) {
            console.error('❌ 强制刷新失败:', error);
        }
    }

    /**
     * 尝试DOM级别的重排序（当数据不匹配时的备用方案）
     */
    attemptDOMReorder(modal, draggedLayerId, targetLayerId) {
        try {
            const layersList = modal.querySelector('#layers-list');
            if (!layersList) return false;
            
            const draggedElement = layersList.querySelector(`[data-layer-id="${draggedLayerId}"]`);
            const targetElement = layersList.querySelector(`[data-layer-id="${targetLayerId}"]`);
            
            if (!draggedElement || !targetElement) {
                console.warn(`⚠️ DOM元素未找到 - 拖拽: ${!!draggedElement}, 目标: ${!!targetElement}`);
                return false;
            }
            
            console.log('🔄 执行DOM级别重排序');
            
            // 获取目标位置
            const targetParent = targetElement.parentNode;
            const targetNextSibling = targetElement.nextSibling;
            
            // 移动元素
            if (targetNextSibling) {
                targetParent.insertBefore(draggedElement, targetNextSibling);
            } else {
                targetParent.appendChild(draggedElement);
            }
            
            console.log('✅ DOM重排序完成');
            return true;
        } catch (error) {
            console.error('❌ DOM重排序失败:', error);
            return false;
        }
    }

    /**
     * 尝试更新Z-index（容错版本 - 基于当前DOM顺序直接设置）
     */
    attemptZIndexUpdate(modal, draggedLayerId, targetLayerId) {
        try {
            console.log('🔢 容错Z-index更新开始（基于DOM顺序）');
            
            // 从DOM获取当前图层顺序
            const layersList = modal.querySelector('#layers-list');
            if (!layersList) {
                console.warn('❌ 图层列表未找到');
                return;
            }
            
            const layerItems = layersList.querySelectorAll('.layer-list-item');
            const baseZIndex = 100;
            
            console.log(`📋 当前DOM中有 ${layerItems.length} 个图层项`);
            
            layerItems.forEach((item, index) => {
                const layerId = item.dataset.layerId;
                const layerType = item.dataset.layerType;
                // DOM顺序中第一个（index=0）的图层应该有最高的Z-index
                const zIndex = baseZIndex + (layerItems.length - index - 1);
                
                console.log(`🔢 容错设置图层 ${layerId} (${layerType}) - DOM索引: ${index}, Z-index: ${zIndex}`);
                
                if (layerType === 'connected' || layerType === 'IMAGE_LAYER') {
                    // 更新连接图层的Z-index
                    const canvasElement = modal.querySelector(`#canvas-layer-${layerId}`);
                    if (canvasElement) {
                        canvasElement.style.zIndex = zIndex;
                        console.log(`📐 ✅ 连接图层 ${layerId} Z-index设为: ${zIndex}`);
                    } else {
                        console.log(`⚠️ 连接图层元素未找到: #canvas-layer-${layerId}`);
                    }
                } else if (layerType === 'annotation' || layerType === 'ANNOTATION') {
                    // 直接更新标注独立SVG容器的Z-index
                    const container = modal.querySelector(`#annotation-svg-${layerId}`);
                    if (container) {
                        container.style.zIndex = zIndex;
                        console.log(`📐 ✅ 标注容器 ${layerId} Z-index设为: ${zIndex}`);
                    } else {
                        console.log(`⚠️ 标注容器未找到: #annotation-svg-${layerId}`);
                        // 如果独立容器不存在，尝试创建
                        this.updateAnnotationZIndex(modal, layerId, zIndex);
                    }
                }
            });
            
            // 更新主绘制层Z-index
            this.updateDrawingLayerZIndex(modal, baseZIndex);
            
            console.log('✅ 容错Z-index更新完成');
        } catch (error) {
            console.error('❌ 容错Z-index更新失败:', error);
        }
    }



    /**
     * 执行图层交换
     */
    performLayerSwap(modal, allLayers, layerId1, layerId2, swapKey) {
        console.log(`🔄 执行图层交换: ${layerId1} <-> ${layerId2}`);
        
        // 在数组中交换两个图层的位置
        const index1 = allLayers.findIndex(layer => layer.id === layerId1);
        const index2 = allLayers.findIndex(layer => layer.id === layerId2);
        
        if (index1 !== -1 && index2 !== -1) {
            [allLayers[index1], allLayers[index2]] = [allLayers[index2], allLayers[index1]];
        }
        
        // 更新图层数据顺序
        this.updateLayersOrder(modal, allLayers);
        
        // 更新Z-index
        this.updateLayersZIndex(modal, allLayers);
        
        // 更新图层面板显示 - 传递交换后的图层顺序
        this.updateLayersListDisplay(modal, allLayers);
        
        console.log(`✅ 相邻图层交换完成`);
    }

    /**
     * 更新图层Z-index（修复版：直接基于DOM顺序设置Z-index）
     */
    updateLayersZIndex(modal, orderedLayers) {
        console.log('🔢 基于DOM顺序的Z-index更新开始...');
        
        const baseZIndex = 100;
        
        // 直接基于DOM顺序设置Z-index，DOM顺序中第一个（索引0）的图层应该有最高的Z-index
        orderedLayers.forEach((layer, index) => {
            // 计算Z-index：第一个图层（index=0）获得最高Z-index
            const zIndex = baseZIndex + (orderedLayers.length - index - 1);
            
            console.log(`🔢 处理图层 ${layer.id} (${layer.type}) - DOM索引: ${index}, Z-index: ${zIndex}`);
            
            if (layer.type === 'IMAGE_LAYER' || layer.type === 'connected') {
                // 更新连接图层的Z-index
                const canvasElement = modal.querySelector(`#canvas-layer-${layer.id}`);
                if (canvasElement) {
                    canvasElement.style.zIndex = zIndex;
                    console.log(`📐 ✅ 连接图层 ${layer.id} Z-index设为: ${zIndex}`);
                } else {
                    console.log(`⚠️ 连接图层元素未找到: #canvas-layer-${layer.id}`);
                }
            } else if (layer.type === 'ANNOTATION' || layer.type === 'annotation') {
                // 为标注创建/更新独立的SVG容器以支持独立z-index控制
                this.updateAnnotationZIndex(modal, layer.id, zIndex);
                console.log(`📐 ✅ 标注图层 ${layer.id} 独立容器Z-index设为: ${zIndex}`);
            }
        });
        
        // 更新主绘制层z-index以配合图层系统
        this.updateDrawingLayerZIndex(modal, baseZIndex);
        
        console.log('✅ Z-index更新完成');
    }

    /**
     * 更新标注Z-index
     */
    updateAnnotationZIndex(modal, annotationId, zIndex) {
        console.log(`🎯 为标注 ${annotationId} 设置独立Z-index: ${zIndex}`);
        
        const drawingLayer = modal.querySelector('#drawing-layer');
        const mainSVG = drawingLayer ? drawingLayer.querySelector('svg') : null;
        const canvasContainer = modal.querySelector('#canvas-container');
        
        if (!mainSVG || !canvasContainer) {
            console.log(`❌ 主SVG或画布容器未找到`);
            return;
        }
        
        // 获取或创建该标注的独立SVG容器
        let annotationSVGContainer = modal.querySelector(`#annotation-svg-${annotationId}`);
        
        if (!annotationSVGContainer) {
            // 🔧 修复坐标偏移：获取主绘制层的精确定位信息
            const drawingLayer = modal.querySelector('#drawing-layer');
            const drawingLayerRect = drawingLayer ? drawingLayer.getBoundingClientRect() : null;
            const canvasRect = canvasContainer.getBoundingClientRect();
            
            // 创建独立的SVG容器
            annotationSVGContainer = document.createElement('div');
            annotationSVGContainer.id = `annotation-svg-${annotationId}`;
            
            // 🔧 关键修复：确保容器与主绘制层完全对齐
            if (drawingLayerRect && canvasRect) {
                const relativeLeft = drawingLayerRect.left - canvasRect.left;
                const relativeTop = drawingLayerRect.top - canvasRect.top;
                
                annotationSVGContainer.style.cssText = `
                    position: absolute;
                    top: ${relativeTop}px;
                    left: ${relativeLeft}px;
                    width: ${drawingLayerRect.width}px;
                    height: ${drawingLayerRect.height}px;
                    pointer-events: none;
                    z-index: ${zIndex};
                `;
                
                // 标注容器定位调试日志已移除
            } else {
                // 备用方案：使用默认定位
                annotationSVGContainer.style.cssText = `
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                    z-index: ${zIndex};
                `;
                console.warn('🔧 [COORDINATE_FIX] 无法获取绘制层位置，使用默认定位');
            }
            
            // 创建独立的SVG
            const newSVG = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            newSVG.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: auto;
            `;
            
            // 🔧 修复坐标偏移：完全复制主SVG的所有关键属性和变换
            const mainViewBox = mainSVG.getAttribute('viewBox') || '0 0 1920 1080';
            const mainPreserveAspectRatio = mainSVG.getAttribute('preserveAspectRatio') || 'xMidYMid meet';
            const mainTransform = mainSVG.getAttribute('transform') || '';
            
            newSVG.setAttribute('viewBox', mainViewBox);
            newSVG.setAttribute('preserveAspectRatio', mainPreserveAspectRatio);
            if (mainTransform) {
                newSVG.setAttribute('transform', mainTransform);
            }
            
            // 🔧 关键修复：确保独立SVG与主SVG具有相同的样式和定位
            const mainSVGStyle = window.getComputedStyle(mainSVG);
            const mainSVGRect = mainSVG.getBoundingClientRect();
            
            // 复制关键样式属性
            newSVG.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: auto;
            `;
            
            // 独立SVG坐标系统配置调试日志已移除
            
            annotationSVGContainer.appendChild(newSVG);
            
            // 修复：将标注容器添加到layers-display-container中（与连接图层同级）
            const layersDisplayContainer = modal.querySelector('#layers-display-container');
            const imageCanvas = modal.querySelector('#image-canvas');
            
            if (layersDisplayContainer) {
                layersDisplayContainer.appendChild(annotationSVGContainer);
                console.log(`✅ 为标注 ${annotationId} 创建独立SVG容器到layers-display-container，Z-index: ${zIndex}`);
            } else if (imageCanvas) {
                imageCanvas.appendChild(annotationSVGContainer);
                console.log(`⚠️ layers-display-container未找到，标注容器添加到image-canvas，Z-index: ${zIndex}`);
            } else {
                canvasContainer.appendChild(annotationSVGContainer);
                console.log(`⚠️ image-canvas未找到，标注容器添加到canvas-container，Z-index: ${zIndex}`);
            }
        } else {
            // 更新现有容器的z-index，并确保它在正确的父容器中
            annotationSVGContainer.style.zIndex = zIndex;
            console.log(`🔄 更新标注 ${annotationId} SVG容器Z-index: ${zIndex}`);
            
            // 检查容器是否在正确的父容器中
            const layersDisplayContainer = modal.querySelector('#layers-display-container');
            const currentParent = annotationSVGContainer.parentElement;
            
            if (layersDisplayContainer && currentParent && currentParent.id !== 'layers-display-container') {
                console.log(`🔄 移动标注容器 ${annotationId} 从 ${currentParent.id} 到 layers-display-container`);
                layersDisplayContainer.appendChild(annotationSVGContainer);
            }
        }
        
        // 查找和移动标注组
        this.moveAnnotationToIndependentSVG(modal, annotationId, annotationSVGContainer, mainSVG);
    }

    /**
     * 移动标注到独立SVG（增强版：支持多种标注查找策略）
     */
    moveAnnotationToIndependentSVG(modal, annotationId, annotationSVGContainer, mainSVG) {
        const independentSVG = annotationSVGContainer.querySelector('svg');
        let annotationGroup = null;
        
        console.log(`🔍 查找标注组 ${annotationId}...`);
        
        // 1. 优先在独立SVG中查找
        if (independentSVG) {
            annotationGroup = independentSVG.querySelector(`[data-annotation-group="${annotationId}"]`);
            if (annotationGroup) {
                console.log(`✅ 标注组 ${annotationId} 已在独立SVG中`);
                return;
            }
        }
        
        // 2. 在主SVG中查找并移动
        if (mainSVG) {
            // 尝试多种选择器策略
            const selectors = [
                `[data-annotation-group="${annotationId}"]`,
                `[data-annotation-id="${annotationId}"]`,
                `g[data-annotation-group="${annotationId}"]`,
                `g[data-annotation-id="${annotationId}"]`
            ];
            
            for (const selector of selectors) {
                annotationGroup = mainSVG.querySelector(selector);
                if (annotationGroup) {
                    console.log(`🔍 使用选择器 ${selector} 找到标注组`);
                    break;
                }
            }
            
            if (annotationGroup && independentSVG) {
                // 🔧 关键修复：在移动前记录坐标信息用于验证
                const beforeMove = {
                    mainSVGRect: mainSVG.getBoundingClientRect(),
                    independentSVGRect: independentSVG.getBoundingClientRect(),
                    mainSVGViewBox: mainSVG.getAttribute('viewBox'),
                    independentSVGViewBox: independentSVG.getAttribute('viewBox'),
                    annotationBBox: annotationGroup.getBBox ? annotationGroup.getBBox() : null
                };
                
                // 移动前坐标系统对比调试日志已移除
                
                // 将标注组从主SVG移动到独立SVG
                independentSVG.appendChild(annotationGroup);
                
                // 🔧 移动后验证坐标系统一致性
                const afterMove = {
                    annotationBBox: annotationGroup.getBBox ? annotationGroup.getBBox() : null,
                    annotationParent: annotationGroup.parentElement,
                    parentViewBox: annotationGroup.parentElement ? annotationGroup.parentElement.getAttribute('viewBox') : null
                };
                
                // 移动后验证调试日志已移除
                
                console.log(`🔄 ✅ 标注 ${annotationId} 已从主SVG移动到独立SVG容器`);
                return;
            }
        }
        
        // 3. 在其他可能的位置查找
        const alternativeContainers = [
            modal.querySelector('#drawing-layer'),
            modal.querySelector('#image-canvas'),
            modal.querySelector('#canvas-container')
        ];
        
        for (const container of alternativeContainers) {
            if (!container) continue;
            
            const foundElements = container.querySelectorAll(`[data-annotation-group="${annotationId}"], [data-annotation-id="${annotationId}"]`);
            if (foundElements.length > 0 && independentSVG) {
                console.log(`🔍 在 ${container.id || container.tagName} 中找到 ${foundElements.length} 个标注元素`);
                
                foundElements.forEach(element => {
                    if (element.closest('svg') !== independentSVG) {
                        independentSVG.appendChild(element);
                        console.log(`🔄 标注元素已移动到独立SVG`);
                    }
                });
                
                annotationGroup = foundElements[0]; // 至少标记找到了元素
                break;
            }
        }
        
        if (annotationGroup) {
            console.log(`✅ 标注组 ${annotationId} 已确保在独立SVG中，Z-index已设置`);
        } else {
            console.log(`⚠️ 标注组 ${annotationId} 未找到（可能还未创建或已被移除）`);
        }
    }

    /**
     * 更新绘制层Z-index（修复版：不再强制覆盖所有图层）
     */
    updateDrawingLayerZIndex(modal, baseZIndex) {
        const drawingLayer = modal.querySelector('#drawing-layer');
        if (drawingLayer) {
            // 修复：设置主绘制层z-index为基础值以下，让图层系统正确控制显示顺序
            const drawingLayerZIndex = baseZIndex - 10; // 比基础图层低，让独立标注容器控制显示顺序
            drawingLayer.style.zIndex = drawingLayerZIndex;
            console.log(`📐 主绘制层Z-index修复为: ${drawingLayerZIndex} (不再强制覆盖图层)`);
        }
    }

    /**
     * 强制检查并修复所有图层的Z-index显示问题
     */
    forceFixLayerZIndex(modal) {
        console.log('🔧 强制修复所有图层Z-index显示问题...');
        
        const layersList = modal.querySelector('#layers-list');
        if (!layersList) {
            console.warn('❌ 图层列表未找到');
            return;
        }
        
        const layerItems = layersList.querySelectorAll('.layer-list-item');
        const baseZIndex = 100;
        
        console.log(`📋 需要修复 ${layerItems.length} 个图层的Z-index`);
        
        // 基于当前DOM顺序强制设置正确的Z-index
        layerItems.forEach((item, index) => {
            const layerId = item.dataset.layerId;
            const layerType = item.dataset.layerType;
            const correctZIndex = baseZIndex + (layerItems.length - index - 1);
            
            console.log(`🔧 强制修复图层 ${layerId} (${layerType}) - DOM位置: ${index + 1}, 正确Z-index: ${correctZIndex}`);
            
            if (layerType === 'connected' || layerType === 'IMAGE_LAYER') {
                const canvasElement = modal.querySelector(`#canvas-layer-${layerId}`);
                if (canvasElement) {
                    canvasElement.style.zIndex = correctZIndex;
                    console.log(`✅ 连接图层 ${layerId} Z-index强制设为: ${correctZIndex}`);
                }
            } else if (layerType === 'annotation' || layerType === 'ANNOTATION') {
                // 确保标注有独立容器并设置正确的Z-index
                this.updateAnnotationZIndex(modal, layerId, correctZIndex);
                
                // 额外验证：直接设置容器Z-index
                const container = modal.querySelector(`#annotation-svg-${layerId}`);
                if (container) {
                    container.style.zIndex = correctZIndex;
                    console.log(`✅ 标注容器 ${layerId} Z-index强制设为: ${correctZIndex}`);
                } else {
                    console.warn(`⚠️ 标注容器不存在，已尝试创建: #annotation-svg-${layerId}`);
                }
            }
        });
        
        // 确保主绘制层不干扰
        this.updateDrawingLayerZIndex(modal, baseZIndex);
        
        // 延迟验证结果
        setTimeout(() => {
            this.validateZIndexResults(modal);
        }, 100);
        
        console.log('✅ 强制Z-index修复完成');
    }

    /**
     * 验证Z-index设置结果（增强版：检查所有可能的容器位置和父子关系）
     */
    validateZIndexResults(modal) {
        console.log('🔍 验证Z-index设置结果和容器结构...');
        
        // 首先检查关键容器的存在和层级关系
        const layersDisplayContainer = modal.querySelector('#layers-display-container');
        const imageCanvas = modal.querySelector('#image-canvas');
        const canvasContainer = modal.querySelector('#canvas-container');
        const drawingLayer = modal.querySelector('#drawing-layer');
        
        console.log('\n🏗️ 容器结构验证:');
        console.log(`  - layers-display-container: ${!!layersDisplayContainer}`);
        console.log(`  - canvas-container: ${!!canvasContainer}`);
        console.log(`  - image-canvas: ${!!imageCanvas}`);
        console.log(`  - drawing-layer: ${!!drawingLayer}`);
        
        if (layersDisplayContainer) {
            console.log(`  - layers-display-container父容器: ${layersDisplayContainer.parentElement?.id || layersDisplayContainer.parentElement?.tagName}`);
        }
        if (imageCanvas) {
            console.log(`  - image-canvas父容器: ${imageCanvas.parentElement?.id || imageCanvas.parentElement?.tagName}`);
        }
        
        // 检查多个可能的容器位置
        const containerSelectors = [
            { name: 'layers-display-container', selector: '#layers-display-container' },
            { name: 'image-canvas', selector: '#image-canvas' },
            { name: 'canvas-container', selector: '#canvas-container' },
            { name: 'drawing-layer', selector: '#drawing-layer' },
            { name: 'modal-root', selector: modal }
        ];
        
        containerSelectors.forEach(({ name, selector }) => {
            const container = typeof selector === 'string' ? modal.querySelector(selector) : selector;
            if (container) {
                console.log(`\n📊 检查 ${name} 中的图层容器:`);
                
                // 查找连接图层容器
                const canvasLayers = container.querySelectorAll('[id^="canvas-layer-"]');
                console.log(`  连接图层容器: ${canvasLayers.length} 个`);
                canvasLayers.forEach(element => {
                    const computedStyle = window.getComputedStyle(element);
                    const actualZIndex = computedStyle.zIndex;
                    const position = computedStyle.position;
                    const parentContainer = element.parentElement?.id || element.parentElement?.tagName;
                    console.log(`    - ${element.id}: Z-index=${actualZIndex}, position=${position}, 父容器=${parentContainer}`);
                });
                
                // 查找标注容器
                const annotationContainers = container.querySelectorAll('[id^="annotation-svg-"]');
                console.log(`  标注容器: ${annotationContainers.length} 个`);
                annotationContainers.forEach(element => {
                    const computedStyle = window.getComputedStyle(element);
                    const actualZIndex = computedStyle.zIndex;
                    const position = computedStyle.position;
                    const parentContainer = element.parentElement?.id || element.parentElement?.tagName;
                    console.log(`    - ${element.id}: Z-index=${actualZIndex}, position=${position}, 父容器=${parentContainer}`);
                });
            } else if (typeof selector === 'string') {
                console.log(`❌ 容器 ${name} 未找到`);
            }
        });
        
        // 特别检查layers-display-container内部的直接子元素层级关系（关键！）
        if (layersDisplayContainer) {
            console.log('\n🔍 layers-display-container内部层级详情（关键容器）:');
            const children = Array.from(layersDisplayContainer.children);
            children.forEach((child, index) => {
                const computedStyle = window.getComputedStyle(child);
                const zIndex = computedStyle.zIndex;
                const position = computedStyle.position;
                const display = computedStyle.display;
                console.log(`  ${index + 1}. ID: ${child.id}, Z-index: ${zIndex}, position: ${position}, display: ${display}, 标签: ${child.tagName}`);
            });
        }
        
        // 也检查image-canvas内部的直接子元素层级关系
        if (imageCanvas) {
            console.log('\n🔍 image-canvas内部层级详情:');
            const children = Array.from(imageCanvas.children);
            children.forEach((child, index) => {
                const computedStyle = window.getComputedStyle(child);
                const zIndex = computedStyle.zIndex;
                const position = computedStyle.position;
                console.log(`  ${index + 1}. ID: ${child.id}, Z-index: ${zIndex}, position: ${position}, 标签: ${child.tagName}`);
            });
        }
        
        console.log('✅ Z-index验证完成');
    }


    /**
     * 更新图层数据顺序
     */
    updateLayersOrder(modal, orderedLayers) {
        // 分别更新连接图层和标注的顺序
        const connectedLayers = orderedLayers.filter(l => l.type === 'IMAGE_LAYER');
        const annotations = orderedLayers.filter(l => l.type === 'ANNOTATION');
        
        // 更新连接图层顺序
        if (this.nodeInstance.connectedImageLayers) {
            this.nodeInstance.connectedImageLayers = connectedLayers.map(l => l.data);
        }
        
        // 更新标注顺序
        if (modal.annotations) {
            modal.annotations = annotations.map(l => l.data);
        }
    }

    /**
     * 更新图层列表DOM顺序
     */
    updateLayerListDOMOrder(modal, draggedLayerId, targetLayerId) {
        // 实现DOM重排序逻辑
        const layersList = modal.querySelector('#layers-list');
        const draggedElement = layersList.querySelector(`[data-layer-id="${draggedLayerId}"]`);
        const targetElement = layersList.querySelector(`[data-layer-id="${targetLayerId}"]`);
        
        if (draggedElement && targetElement) {
            // 简单的DOM重排序
            targetElement.parentNode.insertBefore(draggedElement, targetElement.nextSibling);
        }
    }

    /**
     * 更新图层列表显示
     */
    updateLayersListDisplay(modal, orderedLayers) {
        // 触发图层列表重新渲染
        if (this.nodeInstance.layerListManager && this.nodeInstance.layerListManager.updateIntegratedLayersList) {
            this.nodeInstance.layerListManager.updateIntegratedLayersList(modal);
        }
    }

    /**
     * 更新DOM中的图层顺序（增强版）
     */
    updateLayerListDOMOrder(modal, draggedLayerId, targetLayerId) {
        try {
            const layersList = modal.querySelector('#layers-list');
            if (!layersList) {
                console.warn('❌ 图层列表未找到');
                return false;
            }
            
            const draggedElement = layersList.querySelector(`[data-layer-id="${draggedLayerId}"]`);
            const targetElement = layersList.querySelector(`[data-layer-id="${targetLayerId}"]`);
            
            if (!draggedElement || !targetElement) {
                console.warn(`❌ DOM元素未找到 - 拖拽: ${!!draggedElement}, 目标: ${!!targetElement}`);
                return false;
            }
            
            console.log(`🔄 DOM重排序: ${draggedLayerId} -> ${targetLayerId}`);
            
            // 获取目标元素的位置
            const targetIndex = Array.from(layersList.children).indexOf(targetElement);
            const draggedIndex = Array.from(layersList.children).indexOf(draggedElement);
            
            console.log(`📍 DOM索引 - 拖拽: ${draggedIndex}, 目标: ${targetIndex}`);
            
            if (draggedIndex < targetIndex) {
                // 向下移动：插入到目标元素之后
                targetElement.parentNode.insertBefore(draggedElement, targetElement.nextSibling);
                console.log('↓ 向下移动完成');
            } else {
                // 向上移动：插入到目标元素之前
                targetElement.parentNode.insertBefore(draggedElement, targetElement);
                console.log('↑ 向上移动完成');
            }
            
            // 重新验证DOM顺序
            this.validateDOMOrder(modal);
            
            console.log('✅ DOM图层顺序已更新');
            return true;
        } catch (error) {
            console.error('❌ DOM更新失败:', error);
            return false;
        }
    }

    /**
     * 验证DOM顺序是否正确
     */
    validateDOMOrder(modal) {
        const layersList = modal.querySelector('#layers-list');
        if (!layersList) return;
        
        const layerItems = layersList.querySelectorAll('.layer-list-item');
        console.log('📋 当前DOM图层顺序:');
        layerItems.forEach((item, index) => {
            const layerId = item.dataset.layerId;
            const layerType = item.dataset.layerType;
            console.log(`  ${index + 1}. ${layerId} (${layerType})`);
        });
    }

    /**
     * 获取所有图层按当前顺序（增强版：支持容错和数据同步）
     */
    getAllLayersInOrder(modal) {
        const allLayers = [];
        
        // 从DOM中获取当前的图层顺序
        const layersList = modal.querySelector('#layers-list');
        if (!layersList) {
            console.warn('❌ 无法找到图层列表');
            return allLayers;
        }
        
        // 遍历DOM中的图层项，按显示顺序获取
        const layerItems = layersList.querySelectorAll('.layer-list-item');
        console.log(`🔍 获取图层顺序，DOM中共有 ${layerItems.length} 个图层项`);
        
        // 预先获取所有可用的数据源
        const connectedLayers = this.nodeInstance.connectedImageLayers || [];
        const annotations = modal.annotations || [];
        
        console.log(`📊 可用数据源 - 连接图层: ${connectedLayers.length}, 标注: ${annotations.length}`);
        
        layerItems.forEach((item, index) => {
            const layerId = item.dataset.layerId;
            const layerType = item.dataset.layerType;
            console.log(`📋 处理图层 ${index + 1}: ID=${layerId}, Type=${layerType}`);
            
            let foundLayer = null;
            
            if (layerType === 'IMAGE_LAYER' || layerType === 'connected') {
                // 查找对应的连接图层
                console.log(`🔍 在 ${connectedLayers.length} 个连接图层中查找 ${layerId}`);
                
                if (connectedLayers.length > 0) {
                    foundLayer = connectedLayers.find(l => l && l.id === layerId);
                    if (foundLayer) {
                        allLayers.push({
                            ...foundLayer, 
                            type: 'IMAGE_LAYER',
                            data: foundLayer  // 保留原始数据引用
                        });
                        console.log(`✅ 找到连接图层: ${foundLayer.id} (${foundLayer.originalName || '未命名'})`);
                    } else {
                        console.warn(`⚠️ 连接图层未找到: ${layerId}`);
                        console.log(`📊 可用连接图层ID:`, connectedLayers.map(l => l?.id).filter(Boolean));
                    }
                }
            } else if (layerType === 'ANNOTATION' || layerType === 'annotation') {
                // 查找对应的标注
                console.log(`🔍 在 ${annotations.length} 个标注中查找 ${layerId}`);
                
                if (annotations.length > 0) {
                    foundLayer = annotations.find(a => a && a.id === layerId);
                    if (foundLayer) {
                        allLayers.push({
                            ...foundLayer, 
                            type: 'ANNOTATION',
                            data: foundLayer  // 保留原始数据引用
                        });
                        console.log(`✅ 找到标注: ${foundLayer.id} (${foundLayer.type || '未知类型'})`);
                    } else {
                        console.warn(`⚠️ 标注未找到: ${layerId}`);
                        console.log(`📊 可用标注ID:`, annotations.map(a => a?.id).filter(Boolean));
                    }
                }
            } else {
                console.warn(`⚠️ 未知图层类型: ${layerType} (ID: ${layerId})`);
            }
            
            // 如果没找到对应数据，创建一个智能占位符
            if (!foundLayer) {
                console.log(`🔄 为未找到的图层创建智能占位符: ${layerId} (${layerType})`);
                
                // 尝试从DOM元素获取更多信息
                const layerName = this.extractLayerNameFromDOM(item);
                const isVisible = this.extractVisibilityFromDOM(item);
                
                const placeholder = {
                    id: layerId,
                    type: layerType === 'connected' ? 'IMAGE_LAYER' : layerType || 'UNKNOWN',
                    placeholder: true,
                    originalName: layerName || `未知图层 ${layerId}`,
                    visible: isVisible,
                    // 添加基本属性以支持后续操作
                    ...(layerType === 'ANNOTATION' && {
                        shape: 'unknown',
                        constraintPrompts: [],
                        decorativePrompts: []
                    })
                };
                
                allLayers.push(placeholder);
                console.log(`🔧 创建占位符:`, placeholder);
            }
        });
        
        console.log(`📋 最终获取到 ${allLayers.length} 个图层，其中 ${allLayers.filter(l => !l.placeholder).length} 个有效，${allLayers.filter(l => l.placeholder).length} 个占位符`);
        
        // 如果有占位符，尝试修复数据不一致问题
        const placeholderCount = allLayers.filter(l => l.placeholder).length;
        if (placeholderCount > 0) {
            console.warn(`⚠️ 发现 ${placeholderCount} 个占位符，可能存在数据不一致问题`);
            this.attemptDataSync(modal, allLayers);
        }
        
        return allLayers;
    }

    /**
     * 从DOM元素提取图层名称
     */
    extractLayerNameFromDOM(layerItem) {
        try {
            const nameElement = layerItem.querySelector('span[style*="flex: 1"]') || 
                              layerItem.querySelector('.layer-name') ||
                              layerItem.querySelector('span:first-child');
            return nameElement ? nameElement.textContent.trim() : null;
        } catch (error) {
            return null;
        }
    }

    /**
     * 从DOM元素提取可见性状态
     */
    extractVisibilityFromDOM(layerItem) {
        try {
            const visibilityBtn = layerItem.querySelector('.layer-visibility-btn');
            return visibilityBtn ? visibilityBtn.textContent.trim() === '👁️' : true;
        } catch (error) {
            return true;
        }
    }

    /**
     * 尝试修复数据同步问题
     */
    attemptDataSync(modal, allLayers) {
        console.log('🔧 尝试修复数据同步问题...');
        
        const placeholders = allLayers.filter(l => l.placeholder);
        console.log(`🔍 需要修复 ${placeholders.length} 个占位符`);
        
        // 这里可以添加更多的数据修复逻辑
        // 例如：重新扫描数据源、触发数据更新等
        
        // 标记需要数据刷新
        if (this.nodeInstance.layerListManager) {
            console.log('🔄 触发图层列表数据刷新');
            setTimeout(() => {
                try {
                    // 默认显示所有图层（连接图层+标注图层）
                    this.nodeInstance.layerListManager.updateIntegratedLayersList(modal);
                } catch (error) {
                    console.error('❌ 数据刷新失败:', error);
                }
            }, 100);
        }
    }

    /**
     * 恢复保存的图层顺序
     */
    restoreSavedLayerOrder(modal) {
        // 检查是否有保存的图层顺序状态
        if (modal.layerOrderStates && modal.layerOrderStates.has('currentOrder')) {
            const savedOrder = modal.layerOrderStates.get('currentOrder');
            console.log('✅ 恢复图层顺序:', savedOrder.length, '个图层');
            
            // 先刷新图层列表（获取最新数据）
            if (this.nodeInstance.layerListManager) {
                // 默认显示所有图层（连接图层+标注图层）
                this.nodeInstance.layerListManager.updateIntegratedLayersList(modal);
            }
            
            // 延迟应用保存的顺序，确保DOM已更新
            setTimeout(() => {
                this.applyLayerOrder(modal, savedOrder);
            }, 100);
            
            return true;
        } else {
            return false;
        }
    }

    /**
     * 应用指定的图层顺序
     */
    applyLayerOrder(modal, orderData) {
        const layersList = modal.querySelector('#layers-list');
        if (!layersList) return;
        
        // 根据保存的顺序重新排列DOM元素
        const layerItems = Array.from(layersList.querySelectorAll('.layer-list-item'));
        const orderedItems = [];
        
        // 按保存的顺序查找对应的DOM元素
        orderData.forEach(orderItem => {
            const item = layerItems.find(element => 
                element.getAttribute('data-layer-id') === orderItem.id
            );
            if (item) {
                orderedItems.push(item);
            }
        });
        
        // 重新排列DOM
        layersList.innerHTML = '';
        orderedItems.forEach(item => {
            layersList.appendChild(item);
        });
        
        console.log('✅ 图层顺序已恢复');
    }

    /**
     * 刷新图层列表（备用方案）
     */
    refreshLayerList(modal) {
        console.log('🔄 刷新图层列表（备用方案）');
        if (this.nodeInstance.layerListManager) {
            // 默认显示所有图层（连接图层+标注图层）
            this.nodeInstance.layerListManager.updateIntegratedLayersList(modal);
            console.log('✅ 图层列表已刷新');
        } else {
            console.error('❌ layerListManager未初始化');
        }
    }

    /**
     * 清理资源
     */
    cleanup(modal) {
        const layersList = modal.querySelector('#layers-list');
        if (layersList) {
            layersList.orderEventsBound = false;
        }
        
        this._swapDebounce.clear();
        this._dragState.draggedElement = null;
        this._dragState.dragOverElement = null;
    }
}

// 导出创建函数
export function createLayerOrderController(nodeInstance) {
    return new LayerOrderController(nodeInstance);
}