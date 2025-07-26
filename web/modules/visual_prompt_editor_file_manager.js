/**
 * Visual Prompt Editor - 文件管理和图像处理模块
 * 负责文件上传、图像获取、文件处理相关功能
 */

/**
 * 从LoadImage节点获取图像
 * 从主文件迁移的图像获取逻辑
 */
export function getImageFromLoadImageNode(loadImageNode) {
    try {
        console.log('🖼️ 从LoadImage节点获取图像...');
        
        // 方法1: 从imgs属性获取
        if (loadImageNode.imgs && loadImageNode.imgs.length > 0) {
            const imgSrc = loadImageNode.imgs[0].src;
            console.log('✅ 方法1成功: 从imgs属性获取图像');
            return imgSrc;
        }
        
        // 方法2: 从widgets获取文件名
        if (loadImageNode.widgets) {
            for (let widget of loadImageNode.widgets) {
                console.log('🔍 检查widget:', widget.name, widget.type);
                if (widget.name === 'image' && widget.value) {
                    // 构建正确的图像URL - 使用ComfyUI标准格式
                    const filename = widget.value;
                    const imageUrl = `/view?filename=${encodeURIComponent(filename)}&subfolder=&type=input`;
                    console.log('✅ 方法2成功: 从widgets获取图像URL:', imageUrl);
                    return imageUrl;
                }
            }
        }
        
        console.log('❌ 无法从LoadImage节点获取图像');
        return null;
    } catch (e) {
        console.error('❌ 获取LoadImage图像时出错:', e);
        return null;
    }
}

/**
 * 从其他类型节点获取图像
 * 从主文件迁移的通用图像获取逻辑
 */
export function tryGetImageFromNode(sourceNode) {
    try {
        console.log('🔍 尝试从节点获取图像:', sourceNode.type);
        
        // 检查是否有图像输出
        if (sourceNode.imgs && sourceNode.imgs.length > 0) {
            console.log('✅ 从imgs属性获取图像');
            return sourceNode.imgs[0].src;
        }
        
        // 检查widgets
        if (sourceNode.widgets) {
            for (let widget of sourceNode.widgets) {
                if ((widget.name === 'image' || widget.name === 'filename') && widget.value) {
                    const imageUrl = `/view?filename=${encodeURIComponent(widget.value)}`;
                    console.log('✅ 从widgets获取图像URL:', imageUrl);
                    return imageUrl;
                }
            }
        }
        
        console.log('❌ 无法从节点获取图像:', sourceNode.type);
        return null;
    } catch (e) {
        console.error('❌ 从节点获取图像时出错:', e);
        return null;
    }
}

/**
 * 处理图层图像文件
 * 从主文件迁移的文件处理逻辑
 */
export function processLayerImageFile(modal, layerId, file, nodeInstance) {
    const reader = new FileReader();
    
    reader.onload = (e) => {
        try {
            const imageData = e.target.result;
            console.log(`📁 图像文件读取成功，大小: ${(imageData.length / 1024).toFixed(2)}KB`);
            
            // 更新图层显示
            const layerItem = modal.querySelector(`[data-layer="${layerId}"]`);
            if (layerItem) {
                const layerText = layerItem.querySelector('span:nth-child(2)');
                if (layerText) {
                    layerText.innerHTML = `📷 ${file.name.substring(0, 15)}${file.name.length > 15 ? '...' : ''}`;
                }
                
                // 更新状态显示
                const statusSpan = layerItem.querySelector('span:last-child');
                if (statusSpan) {
                    statusSpan.textContent = 'Loaded';
                    statusSpan.style.color = '#4CAF50';
                }
            }
            
            // 保存图像数据到连接图层
            if (!nodeInstance.connectedImageLayers) {
                nodeInstance.connectedImageLayers = [];
            }
            
            // 查找现有图层或创建新的
            let existingLayerIndex = nodeInstance.connectedImageLayers.findIndex(layer => layer.id === layerId);
            
            if (existingLayerIndex !== -1) {
                // 更新现有图层
                nodeInstance.connectedImageLayers[existingLayerIndex].imageData = imageData;
                nodeInstance.connectedImageLayers[existingLayerIndex].filename = file.name;
                nodeInstance.connectedImageLayers[existingLayerIndex].lastModified = Date.now();
            } else {
                // 创建新图层
                nodeInstance.connectedImageLayers.push({
                    id: layerId,
                    type: 'IMAGE_LAYER',
                    name: file.name,
                    imageData: imageData,
                    filename: file.name,
                    visible: true,
                    opacity: 1.0,
                    transform: {
                        x: 0, y: 0, scale: 1.0, rotation: 0
                    },
                    zIndex: nodeInstance.connectedImageLayers.length + 1,
                    lastModified: Date.now()
                })
            }
            
            console.log(`✅ 图层 ${layerId} 图像数据已保存，连接图层总数: ${nodeInstance.connectedImageLayers.length}`);
            
            // 在画布中显示图像
            displayImageInCanvas(modal, layerId, imageData, nodeInstance);
            
            // 更新图层面板
            if (nodeInstance.layerListManager) {
                nodeInstance.layerListManager.updateLayerList(modal);
            }
            
        } catch (error) {
            console.error(`❌ 处理图层 ${layerId} 图像文件时出错:`, error);
        }
    };
    
    reader.onerror = () => {
        console.error(`❌ 读取图层 ${layerId} 图像文件失败`);
    };
    
    reader.readAsDataURL(file);
}

/**
 * 在画布中显示图像
 * 从主文件迁移的画布图像显示逻辑
 */
export function displayImageInCanvas(modal, layerId, imageData, nodeInstance) {
    try {
        const imageCanvas = modal.querySelector('#image-canvas');
        if (!imageCanvas) {
            console.warn('⚠️ 找不到image-canvas容器');
            return;
        }
        
        // 移除同ID的现有图像
        const existingImage = imageCanvas.querySelector(`[data-layer-id="${layerId}"]`);
        if (existingImage) {
            existingImage.remove();
        }
        
        // 创建图像容器
        const imageContainer = document.createElement('div');
        imageContainer.setAttribute('data-layer-id', layerId);
        imageContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: ${100 + (nodeInstance.connectedImageLayers?.length || 0)};
        `;
        
        // 创建图像元素
        const img = document.createElement('img');
        img.src = imageData;
        img.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: contain;
            opacity: 1.0;
        `;
        
        img.onload = () => {
            console.log(`✅ 图层 ${layerId} 图像已在画布中显示`);
        };
        
        img.onerror = () => {
            console.error(`❌ 图层 ${layerId} 图像显示失败`);
        };
        
        imageContainer.appendChild(img);
        imageCanvas.appendChild(imageContainer);
        
    } catch (error) {
        console.error('❌ 在画布中显示图像时出错:', error);
    }
}

/**
 * 创建默认图层
 * 从主文件迁移的默认图层创建逻辑
 */
export function createDefaultLayer(modal, layerId, nodeInstance) {
    console.log(`🎨 创建默认图层: ${layerId}`);
    
    try {
        const dynamicLayersContainer = modal.querySelector('#dynamic-ps-layers');
        if (!dynamicLayersContainer) {
            console.warn('⚠️ 找不到dynamic-ps-layers容器');
            return;
        }
        
        const layerElement = document.createElement('div');
        layerElement.className = 'ps-layer-item vpe-layer-item';
        layerElement.setAttribute('data-layer', layerId);
        layerElement.style.cssText = `
            border-bottom: 1px solid #444;
            background: #10b981;
        `;
        
        const layerName = layerId.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
        layerElement.innerHTML = `
            <span class="layer-visibility" style="margin-right: 8px; cursor: pointer;">👁️</span>
            <span style="flex: 1; color: white; font-size: 12px;">📄 ${layerName}</span>
            <span class="layer-opacity" style="color: #888; font-size: 10px;">100%</span>
            <span style="color: #888; font-size: 9px; margin-left: 8px;">New</span>
        `;
        
        dynamicLayersContainer.appendChild(layerElement);
        
        // 隐藏空状态消息
        const noLayersMessage = modal.querySelector('#no-ps-layers-message');
        if (noLayersMessage) noLayersMessage.style.display = 'none';
        
        // 重新绑定事件
        if (nodeInstance.bindPSLayerEvents) {
            nodeInstance.bindPSLayerEvents(modal);
        }
        
        console.log(`✅ 默认图层 ${layerId} 创建成功`);
        
    } catch (error) {
        console.error(`❌ 创建默认图层 ${layerId} 时出错:`, error);
    }
}

/**
 * 为指定图层加载图像
 * 从主文件迁移的图层图像加载逻辑
 */
export function loadImageForLayer(modal, layerId, nodeInstance) {
    console.log(`📁 为图层 ${layerId} 打开文件选择器`);
    
    try {
        // 创建文件输入元素
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                console.log(`📁 选择了文件: ${file.name} 用于图层 ${layerId}`);
                processLayerImageFile(modal, layerId, file, nodeInstance);
            }
        });
        
        // 触发文件选择
        document.body.appendChild(fileInput);
        fileInput.click();
        document.body.removeChild(fileInput);
        
    } catch (error) {
        console.error(`❌ 为图层 ${layerId} 加载图像时出错:`, error);
    }
}

/**
 * 打开图层图像选择对话框
 * 从主文件迁移的图层图像选择逻辑
 */
export function openLayerImageDialog(modal, nodeInstance) {
    console.log('📁 打开图层图像选择对话框...');
    
    try {
        // 更灵活的选中图层检测
        let selectedLayer = modal.querySelector('.ps-layer-item[style*="background: rgb(16, 185, 129)"]') ||
                           modal.querySelector('.ps-layer-item[style*="background:#10b981"]') ||
                           modal.querySelector('.ps-layer-item[style*="background: #10b981"]');
        
        if (!selectedLayer) {
            console.log('⚠️ 没有选中的图层，尝试默认选择layer_1');
            // 如果没有选中图层，默认选择可用的第一个图层或直接选择layer_1
            const availableLayers = modal.querySelectorAll('.ps-layer-item:not([data-layer="background"])');
            if (availableLayers.length > 0) {
                selectedLayer = availableLayers[0];
                selectedLayer.style.background = '#10b981';
            } else {
                // 创建一个默认的layer_1
                const layerId = 'layer_1';
                console.log(`📁 创建默认图层 ${layerId}`);
                createDefaultLayer(modal, layerId, nodeInstance);
                loadImageForLayer(modal, layerId, nodeInstance);
                return;
            }
        }
        
        const layerId = selectedLayer.dataset.layer;
        console.log(`📁 为图层 ${layerId} 选择图像`);
        loadImageForLayer(modal, layerId, nodeInstance);
        
    } catch (error) {
        console.error('❌ 打开图层图像选择对话框时出错:', error);
    }
}

console.log('📦 文件管理和图像处理模块已加载');