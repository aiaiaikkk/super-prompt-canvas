/**
 * Visual Prompt Editor - 图层系统核心模块
 * 负责图层检测、初始化、显示和基础管理功能
 */

// 图层系统核心类
export class LayerSystemCore {
    constructor(nodeInstance) {
        this.nodeInstance = nodeInstance;
        this.connectedImageLayers = [];
    }

    /**
     * 初始化集成图层系统
     */
    initializeIntegratedLayerSystem(modal) {
        
        // 检测连接的图像图层
        this.connectedImageLayers = this.detectConnectedImageLayers();
        
        // 缓存检测到的图层，防止状态丢失
        if (this.connectedImageLayers && this.connectedImageLayers.length > 0) {
            modal._cachedConnectedLayers = JSON.parse(JSON.stringify(this.connectedImageLayers));
        }
        
        // 创建图层显示系统
        this.setupLayerCanvasDisplay(modal);
        
        // 尝试恢复图层顺序状态
        this.restoreLayerOrder(modal);
        
        // 将连接图层数据设置到节点实例，以便其他代码可以访问
        this.nodeInstance.connectedImageLayers = this.connectedImageLayers;
        
        return this.connectedImageLayers;
    }

    /**
     * 检测连接的图像图层
     */
    detectConnectedImageLayers() {
        const connectedLayers = [];
        
        console.log('🔍 detectConnectedImageLayers - 节点输入检查:');
        console.log('  - nodeInstance.inputs:', this.nodeInstance.inputs);
        
        if (this.nodeInstance.inputs) {
            this.nodeInstance.inputs.forEach((input, index) => {
                console.log(`  - Input ${index}: name="${input.name}", type="${input.type}", link=${input.link}`);
                
                if (input.type === 'IMAGE' && input.link !== null) {
                    let layerId = input.name;
                    
                    // 如果是主图像输入，跳过
                    if (input.name === 'image') {
                        console.log('  - 跳过主图像输入');
                        return;
                    }
                    
                    // 修正layer ID格式 - 将layer_1转换为layer1
                    if (layerId.startsWith('layer_')) {
                        layerId = layerId.replace('layer_', 'layer');
                    } else if (!layerId.startsWith('layer')) {
                        layerId = `layer${connectedLayers.length + 1}`;
                    }
                    
                    const layerData = {
                        id: layerId,
                        name: layerId.replace(/layer_?(\d+)/i, 'Layer $1'),
                        connected: true,
                        originalName: input.name,
                        linkId: input.link,
                        visible: true,
                        opacity: 1.0,
                        transform: {
                            x: 0, y: 0, scale: 1.0, rotation: 0
                        }
                    };
                    
                    console.log('  - 检测到连接图层:', layerData);
                    connectedLayers.push(layerData);
                }
            });
        }
        
        console.log('🔍 detectConnectedImageLayers - 最终结果:', connectedLayers.length, '个图层');
        return connectedLayers;
    }

    /**
     * 设置图层画布显示系统
     */
    setupLayerCanvasDisplay(modal) {
        const canvasContainer = modal.querySelector('#canvas-container');
        if (!canvasContainer) {
            return;
        }
        
        // 检查是否已存在图层显示容器
        const existingContainer = modal.querySelector('#layers-display-container');
        if (existingContainer) {
            return;
        }
        
        // 创建图层显示容器
        const layersDisplayContainer = document.createElement('div');
        layersDisplayContainer.id = 'layers-display-container';
        layersDisplayContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1;
        `;
        
        // 插入到绘制层之前（确保标注在图层之上）
        const drawingLayer = canvasContainer.querySelector('#drawing-layer');
        if (drawingLayer && drawingLayer.parentNode === canvasContainer) {
            canvasContainer.insertBefore(layersDisplayContainer, drawingLayer);
        } else {
            canvasContainer.appendChild(layersDisplayContainer);
        }
        
        // 显示连接的图层
        this.displayConnectedLayers(layersDisplayContainer);
    }

    /**
     * 显示连接的图层 (从原始主文件恢复)
     */
    displayConnectedLayers(layersContainer) {
        // 优先从nodeInstance获取图层数据，然后从this获取
        const layersToDisplay = this.nodeInstance.connectedImageLayers || this.connectedImageLayers;
        
        if (layersToDisplay && layersToDisplay.length > 0) {
            layersToDisplay.forEach((layer, index) => {
                this.createCanvasLayerDisplay(layersContainer, layer, index);
            });
        }
    }

    /**
     * 创建画布图层显示 (从原始主文件恢复)
     */
    createCanvasLayerDisplay(container, layer, index) {
        const modal = container.closest('#unified-editor-modal');
        if (!modal) {
            return;
        }
        
        // 获取连接的图像数据 (使用回调机制)
        this.loadConnectedLayerImage(layer, (imageUrl) => {
            const layerElement = document.createElement('div');
            layerElement.className = 'canvas-layer-display';
            layerElement.id = `canvas-layer-${layer.id}`;
            
            // 计算缩放和位置
            const currentZoom = modal.currentZoom || 1.0;
            const finalScale = (layer.transform?.scale || 1.0) * currentZoom;
            
            const totalLayers = this.connectedImageLayers ? this.connectedImageLayers.length : 3;
            const zIndex = totalLayers - index;
            
            layerElement.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                opacity: ${layer.opacity || 1.0};
                transform: scale(${finalScale}) translate(${layer.transform?.x || 0}px, ${layer.transform?.y || 0}px);
                z-index: ${zIndex};
                pointer-events: none;
            `;
            
            if (imageUrl) {
                layerElement.innerHTML = `
                    <img src="${imageUrl}" style="
                        width: 100%;
                        height: 100%;
                        object-fit: contain;
                        opacity: ${layer.visible ? 1 : 0.3};
                    ">
                `;
            } else {
                layerElement.innerHTML = `
                    <div style="
                        width: 100%;
                        height: 100%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background: rgba(16, 185, 129, 0.1);
                        border: 2px dashed #10b981;
                        color: #10b981;
                        font-size: 14px;
                    ">📷 ${layer.name}</div>
                `;
            }
            
            container.appendChild(layerElement);
        });
    }

    /**
     * 加载连接图层图像 (从原始主文件恢复回调机制)
     */
    loadConnectedLayerImage(layer, callback) {
        try {
            if (this.nodeInstance.graph && layer.linkId) {
                const link = this.nodeInstance.graph.links[layer.linkId];
                if (link) {
                    const sourceNode = this.nodeInstance.graph.getNodeById(link.origin_id);
                    if (sourceNode && sourceNode.imgs && sourceNode.imgs.length > 0) {
                        const imageUrl = sourceNode.imgs[0].src;
                        callback(imageUrl);
                        return;
                    }
                }
            }
        } catch (error) {
            // 静默处理错误
        }
        
        // 如果无法获取图像，返回null
        callback(null);
    }

    /**
     * 恢复图层顺序状态
     */
    restoreLayerOrder(modal) {
        try {
            const savedOrder = localStorage.getItem('vpe_layer_order');
            if (savedOrder) {
                const orderData = JSON.parse(savedOrder);
                
                // 应用保存的顺序
                if (orderData.layers && Array.isArray(orderData.layers)) {
                    // 实现图层重排序逻辑
                    return true;
                }
            }
        } catch (error) {
            // 静默处理错误
        }
        
        return false;
    }

    /**
     * 切换连接图层显示
     */
    toggleConnectedLayersDisplay(modal, enabled) {
        const layersDisplayContainer = modal.querySelector('#layers-display-container');
        if (!layersDisplayContainer) {
            return;
        }
        
        layersDisplayContainer.style.display = enabled ? 'block' : 'none';
    }

    /**
     * 获取连接图层数据
     */
    getConnectedImageLayers() {
        return this.connectedImageLayers;
    }

    /**
     * 获取缓存的连接图层（防止状态丢失）
     */
    getCachedConnectedLayers(modal) {
        return modal._cachedConnectedLayers || [];
    }
}

// 图层列表管理功能
export class LayerListManager {
    constructor(nodeInstance, layerSystemCore) {
        this.nodeInstance = nodeInstance;
        this.layerSystemCore = layerSystemCore;
    }

    /**
     * 更新图层列表（主要接口）
     */
    updateLayerList(modal) {
        return this.updateIntegratedLayersList(modal);
    }

    /**
     * 更新集成图层列表
     */
    updateIntegratedLayersList(modal) {
        
        const layersList = modal.querySelector('#layers-list');
        if (!layersList) {
            return;
        }
        
        // 清空现有列表
        layersList.innerHTML = '';
        
        let totalLayers = 0;
        
        // 🔒 修复关键逻辑：不仅检查存在性，还要检查数组长度
        let connectedImageLayers = null;
        
        // 按优先级检查数据源，确保非空数组
        if (this.nodeInstance.connectedImageLayers && this.nodeInstance.connectedImageLayers.length > 0) {
            connectedImageLayers = this.nodeInstance.connectedImageLayers;
        } else if (this.layerSystemCore.connectedImageLayers && this.layerSystemCore.connectedImageLayers.length > 0) {
            connectedImageLayers = this.layerSystemCore.connectedImageLayers;
        } else if (this.nodeInstance._persistentConnectedLayers && this.nodeInstance._persistentConnectedLayers.length > 0) {
            connectedImageLayers = this.nodeInstance._persistentConnectedLayers;
        } else if (modal._persistentConnectedLayers && modal._persistentConnectedLayers.length > 0) {
            connectedImageLayers = modal._persistentConnectedLayers;
        }
        
        console.log('🔍 updateIntegratedLayersList - 数据检查:');
        console.log('  - nodeInstance.connectedImageLayers:', this.nodeInstance.connectedImageLayers?.length || 0);
        console.log('  - layerSystemCore.connectedImageLayers:', this.layerSystemCore.connectedImageLayers?.length || 0);
        console.log('  - nodeInstance._persistentConnectedLayers:', this.nodeInstance._persistentConnectedLayers?.length || 0);
        console.log('  - modal._persistentConnectedLayers:', modal._persistentConnectedLayers?.length || 0);
        console.log('  - 最终使用connectedImageLayers:', connectedImageLayers?.length || 0);
        console.log('  - modal.annotations:', modal.annotations?.length || 0);
        console.log('  - nodeInstance.inputs:', this.nodeInstance.inputs?.length || 0);
        if (this.nodeInstance.inputs) {
            this.nodeInstance.inputs.forEach((input, index) => {
                console.log(`    - Input ${index}: name="${input.name}", type="${input.type}", link=${input.link}`);
            });
        }
        
        // 如果还是没有数据，尝试从缓存恢复
        if (!connectedImageLayers || connectedImageLayers.length === 0) {
            connectedImageLayers = this.layerSystemCore.getCachedConnectedLayers(modal);
            console.log('🔄 从缓存恢复连接图层:', connectedImageLayers?.length || 0);
            if (connectedImageLayers && connectedImageLayers.length > 0) {
                this.layerSystemCore.connectedImageLayers = connectedImageLayers;
                this.nodeInstance.connectedImageLayers = connectedImageLayers;
            }
        }
        
        // 如果缓存也没有，尝试主动检测
        if (!connectedImageLayers || connectedImageLayers.length === 0) {
            connectedImageLayers = this.layerSystemCore.detectConnectedImageLayers();
            console.log('🔍 主动检测连接图层:', connectedImageLayers?.length || 0);
            if (connectedImageLayers && connectedImageLayers.length > 0) {
                this.layerSystemCore.connectedImageLayers = connectedImageLayers;
                this.nodeInstance.connectedImageLayers = connectedImageLayers;
                // 重新缓存检测到的数据
                modal._cachedConnectedLayers = JSON.parse(JSON.stringify(connectedImageLayers));
            }
        }
        
        // 添加连接的图像图层 (默认始终显示)
        if (connectedImageLayers && connectedImageLayers.length > 0) {
            // 🔒 确保恢复的图层数据同步到节点实例，防止后续丢失
            if (!this.nodeInstance.connectedImageLayers || this.nodeInstance.connectedImageLayers.length === 0) {
                this.nodeInstance.connectedImageLayers = connectedImageLayers;
                this.layerSystemCore.connectedImageLayers = connectedImageLayers;
                console.log('🔄 从持久化缓存恢复图层数据到节点实例:', connectedImageLayers.length, '个图层');
            }
            
            connectedImageLayers.forEach(layer => {
                const layerElement = this.createLayerListItem(layer, layer.id, 'connected');
                layersList.appendChild(layerElement);
                totalLayers++;
            });
        }
        
        // 添加标注图层
        if (modal.annotations && modal.annotations.length > 0) {
            modal.annotations.forEach(annotation => {
                const layerElement = this.createLayerListItem(annotation, annotation.id, 'annotation');
                layersList.appendChild(layerElement);
                totalLayers++;
            });
        }
        
    }

    /**
     * 创建图层列表项
     */
    createLayerListItem(layer, layerId, type) {
        const layerItem = document.createElement('div');
        layerItem.className = 'layer-list-item';
        layerItem.setAttribute('data-layer-id', layerId);
        layerItem.setAttribute('data-layer-type', type);
        layerItem.setAttribute('draggable', 'true');
        
        // 设置原有的样式（确保深色背景和浅色文字）
        layerItem.style.cssText = `
            display: flex; align-items: center; padding: 8px; margin-bottom: 4px;
            background: #2b2b2b !important; border-radius: 4px; cursor: pointer;
            border: 1px solid #444; position: relative;
            transition: all 0.2s ease; color: #e5e7eb !important;
        `;
        
        // 确定图标、描述和状态
        let icon, description, statusColor, thumbnail = '';
        const isVisible = layer.visible !== false; // 默认为可见
        
        if (type === 'connected') {
            icon = '🖼️';
            description = layer.name || layerId;
            statusColor = '#10b981';
        } else if (type === 'annotation') {
            // 为标注创建带形状和颜色的缩略图
            const shapeIcon = this.getShapeIcon(layer.type || layer.shape);
            const color = layer.color || '#ff0000';
            thumbnail = `<div style="width: 16px; height: 16px; background: ${color}; border-radius: ${layer.type === 'circle' ? '50%' : '2px'}; margin-right: 6px; display: inline-block; border: 1px solid #666;"></div>`;
            icon = shapeIcon;
            description = `Annotation ${layer.number + 1}`;
            statusColor = color;
        } else {
            icon = '📄';
            description = layerId;
            statusColor = '#6b7280';
        }
        
        // 使用原有的HTML结构（强制设置文字颜色）
        layerItem.innerHTML = `
            <input type="checkbox" 
                   style="margin-right: 8px;" 
                   data-annotation-id="${layerId}"
                   ${type === 'annotation' ? 'data-is-annotation="true"' : ''}>
            ${thumbnail}
            <span style="margin-right: 8px; font-size: 14px; color: #e5e7eb !important;">${icon}</span>
            <span style="flex: 1; color: #e5e7eb !important; font-size: 13px;">${description}</span>
            <span style="margin-left: 8px; color: ${statusColor} !important; font-size: 11px; opacity: 0.8;">
                ${type === 'connected' ? 'Connected' : type === 'annotation' ? 'Annotation' : 'Layer'}
            </span>
            <button class="layer-visibility-btn" 
                    data-layer-id="${layerId}" 
                    data-layer-type="${type}"
                    style="margin-left: 8px; background: none; border: none; font-size: 16px; cursor: pointer; color: #e5e7eb !important;"
                    title="切换可见性">
                ${isVisible ? '👁️' : '🙈'}
            </button>
        `;
        
        return layerItem;
    }

    /**
     * 根据形状类型获取对应图标
     */
    getShapeIcon(shape) {
        const shapeIcons = {
            'rectangle': '▭',
            'circle': '●',
            'arrow': '➤',
            'line': '—',
            'polygon': '◇',
            'ellipse': '○',
            'text': '📝'
        };
        return shapeIcons[shape] || '📝';
    }
}

// 导出核心实例创建函数
export function createLayerSystemCore(nodeInstance) {
    return new LayerSystemCore(nodeInstance);
}

export function createLayerListManager(nodeInstance, layerSystemCore) {
    return new LayerListManager(nodeInstance, layerSystemCore);
}