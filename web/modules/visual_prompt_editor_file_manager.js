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
        
        // 方法1: 从imgs属性获取
        if (loadImageNode.imgs && loadImageNode.imgs.length > 0) {
            const imgSrc = loadImageNode.imgs[0].src;
            return imgSrc;
        }
        
        // 方法2: 从widgets获取文件名
        if (loadImageNode.widgets) {
            for (let widget of loadImageNode.widgets) {
                if (widget.name === 'image' && widget.value) {
                    // 构建正确的图像URL - 使用ComfyUI标准格式
                    const filename = widget.value;
                    const imageUrl = `/view?filename=${encodeURIComponent(filename)}&subfolder=&type=input`;
                    return imageUrl;
                }
            }
        }
        
        return null;
    } catch (e) {
        console.error('Error getting LoadImage image:', e);
        return null;
    }
}

/**
 * 从其他类型节点获取图像
 * 从主文件迁移的通用图像获取逻辑
 */
export function tryGetImageFromNode(sourceNode) {
    try {
        
        // 检查是否有图像输出
        if (sourceNode.imgs && sourceNode.imgs.length > 0) {
            return sourceNode.imgs[0].src;
        }
        
        // 检查widgets
        if (sourceNode.widgets) {
            for (let widget of sourceNode.widgets) {
                if ((widget.name === 'image' || widget.name === 'filename') && widget.value) {
                    const imageUrl = `/view?filename=${encodeURIComponent(widget.value)}`;
                    return imageUrl;
                }
            }
        }
        
        return null;
    } catch (e) {
        console.error('Error getting image from node:', e);
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
            
            // Image will be converted to Fabric.js object instead of layer connections
            
            
            // Convert image to Fabric.js object and add to canvas
            convertImageToFabricObject(modal, imageData, file.name, nodeInstance);
            
        } catch (error) {
            console.error(`Error processing image file for layer ${layerId}:`, error);
        }
    };
    
    reader.onerror = () => {
        console.error(`Failed to read image file for layer ${layerId}`);
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
            console.warn('Image canvas container not found');
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
            z-index: 100; // Will be managed by Fabric.js
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
        };
        
        img.onerror = () => {
            console.error(`Failed to display image for layer ${layerId}`);
        };
        
        imageContainer.appendChild(img);
        imageCanvas.appendChild(imageContainer);
        
    } catch (error) {
        console.error('Error displaying image in canvas:', error);
    }
}

/**
 * 创建默认图层
 * 从主文件迁移的默认图层创建逻辑
 */
export function createDefaultLayer(modal, layerId, nodeInstance) {
    
    try {
        const dynamicLayersContainer = modal.querySelector('#dynamic-ps-layers');
        if (!dynamicLayersContainer) {
            console.warn('Dynamic PS layers container not found');
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
        
        
    } catch (error) {
        console.error(`Error creating default layer ${layerId}:`, error);
    }
}

/**
 * 为指定图层加载图像
 * 从主文件迁移的图层图像加载逻辑
 */
export function loadImageForLayer(modal, layerId, nodeInstance) {
    
    try {
        // 创建文件输入元素
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                processLayerImageFile(modal, layerId, file, nodeInstance);
            }
        });
        
        // 触发文件选择
        document.body.appendChild(fileInput);
        fileInput.click();
        document.body.removeChild(fileInput);
        
    } catch (error) {
        console.error(`Error loading image for layer ${layerId}:`, error);
    }
}

/**
 * 打开图层图像选择对话框
 * 从主文件迁移的图层图像选择逻辑
 */
export function openLayerImageDialog(modal, nodeInstance) {
    
    try {
        // 更灵活的选中图层检测
        let selectedLayer = modal.querySelector('.ps-layer-item[style*="background: rgb(16, 185, 129)"]') ||
                           modal.querySelector('.ps-layer-item[style*="background:#10b981"]') ||
                           modal.querySelector('.ps-layer-item[style*="background: #10b981"]');
        
        if (!selectedLayer) {
            // 如果没有选中图层，默认选择可用的第一个图层或直接选择layer_1
            const availableLayers = modal.querySelectorAll('.ps-layer-item:not([data-layer="background"])');
            if (availableLayers.length > 0) {
                selectedLayer = availableLayers[0];
                selectedLayer.style.background = '#10b981';
            } else {
                // 创建一个默认的layer_1
                const layerId = 'layer_1';
                createDefaultLayer(modal, layerId, nodeInstance);
                loadImageForLayer(modal, layerId, nodeInstance);
                return;
            }
        }
        
        const layerId = selectedLayer.dataset.layer;
        loadImageForLayer(modal, layerId, nodeInstance);
        
    } catch (error) {
        console.error('Error opening layer image dialog:', error);
    }
}

/**
 * Convert uploaded image to Fabric.js object
 * This function should integrate with the Fabric.js manager
 */
function convertImageToFabricObject(modal, imageData, filename, nodeInstance) {
    try {
        // This should call the Fabric.js manager to add the image as a Fabric object
        
        // TODO: Integrate with visual_prompt_editor_fabric_manager.js
        // const fabricManager = getFabricPureNativeManager();
        // fabricManager.addImageFromData(imageData, filename);
        
    } catch (error) {
        console.error('Failed to convert image to Fabric object:', error);
    }
}

