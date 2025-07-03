/**
 * Visual Prompt Editor - 画布绘制模块
 * 负责画布的绘制、缩放、拖拽等交互功能
 */

import { createSVGElement, getCanvasCoordinates, generateId, clamp } from './visual_prompt_editor_utils.js';

// Import deleteAnnotation function
import { deleteAnnotation } from './visual_prompt_editor_annotations.js';

/**
 * 初始化画布绘制功能
 */
export function initCanvasDrawing(modal) {
    let drawingLayer = modal.querySelector('#drawing-layer');
    
    // 声明拖拽状态变量（全局给当前modal使用）
    modal.isPanning = false;
    
    // 确保绘制层存在，如果不存在则创建
    if (!drawingLayer) {
        console.log('⚠️ 绘制层未找到，尝试创建...');
        const imageCanvas = modal.querySelector('#image-canvas');
        if (imageCanvas) {
            drawingLayer = document.createElement('div');
            drawingLayer.id = 'drawing-layer';
            drawingLayer.style.cssText = `
                position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                pointer-events: none; z-index: 10;
            `;
            imageCanvas.appendChild(drawingLayer);
            console.log('✅ VPE绘制层已创建');
        } else {
            console.error('❌ 无法找到图像画布容器');
            return;
        }
    }
    
    // 创建SVG容器
    let svg = drawingLayer.querySelector('svg');
    if (!svg) {
        svg = createSVGElement('svg', {
            width: '100%',
            height: '100%',
            viewBox: '0 0 1000 1000',
            preserveAspectRatio: 'xMidYMid meet'
        });
        svg.style.cssText = 'width: 100%; height: 100%; position: absolute; top: 0; left: 0; pointer-events: auto; z-index: 1000;';
        
        // 添加箭头标记定义容器
        const defs = createSVGElement('defs');
        svg.appendChild(defs);
        
        // 为每种颜色创建箭头标记
        const colors = ['#f44336', '#4caf50', '#ffeb3b', '#2196f3'];
        colors.forEach(color => {
            const marker = createSVGElement('marker', {
                id: `arrowhead-${color.replace('#', '')}`,
                markerWidth: '10',
                markerHeight: '7',
                refX: '9',
                refY: '3.5',
                orient: 'auto'
            });
            
            const polygon = createSVGElement('polygon', {
                points: '0 0, 10 3.5, 0 7',
                fill: color
            });
            
            marker.appendChild(polygon);
            defs.appendChild(marker);
        });
        
        drawingLayer.appendChild(svg);
    }
    
    console.log('✅ VPE画布绘制初始化完成');
}

/**
 * 初始化缩放和拖拽控制
 */
export function initZoomAndPanControls(modal) {
    const zoomContainer = modal.querySelector('#zoom-container');
    const zoomLevel = modal.querySelector('#vpe-zoom-level');
    let currentZoom = 1.0;
    
    // 缩放函数 - 支持保持平移状态
    const setZoom = (zoom, smooth = true, resetPosition = false) => {
        if (!zoomContainer) return;
        
        currentZoom = clamp(zoom, 0.1, 5.0);
        if (!smooth) {
            zoomContainer.style.transition = 'none';
            setTimeout(() => {
                zoomContainer.style.transition = 'transform 0.3s ease';
            }, 50);
        }
        
        if (resetPosition) {
            // 重置位置到中间
            zoomContainer.style.transform = `translate(-50%, -50%) scale(${currentZoom})`;
            console.log('🎯 VPE重置位置到中心');
        } else {
            // 获取当前的平移值
            const transform = zoomContainer.style.transform;
            const translateMatch = transform.match(/translate\\((-?[\\d.]+)px,\\s*(-?[\\d.]+)px\\)/);
            let translateX = -50; // 默认值（百分比）
            let translateY = -50;
            
            if (translateMatch) {
                // 如果已经有平移，保持现有的平移值
                translateX = parseFloat(translateMatch[1]);
                translateY = parseFloat(translateMatch[2]);
                zoomContainer.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentZoom})`;
            } else {
                // 没有平移，使用默认居中
                zoomContainer.style.transform = `translate(-50%, -50%) scale(${currentZoom})`;
            }
        }
        
        if (zoomLevel) {
            zoomLevel.textContent = `${Math.round(currentZoom * 100)}%`;
        }
        
        // 更新modal对象中的zoom值
        if (modal) {
            modal.currentZoom = currentZoom;
        }
    };
    
    // 适应屏幕按钮
    const fitBtn = modal.querySelector('#vpe-zoom-fit');
    if (fitBtn) {
        fitBtn.onclick = () => {
            const container = modal.querySelector('#canvas-container');
            const image = modal.querySelector('#vpe-main-image');
            console.log('🔍 执行适应屏幕操作');
            
            if (image && container && image.complete && image.naturalWidth > 0) {
                const containerRect = container.getBoundingClientRect();
                
                console.log('容器尺寸:', containerRect.width, 'x', containerRect.height);
                console.log('图像自然尺寸:', image.naturalWidth, 'x', image.naturalHeight);
                
                // 计算适应缩放比例，留出边距
                const scaleX = (containerRect.width - 80) / image.naturalWidth;
                const scaleY = (containerRect.height - 80) / image.naturalHeight;
                const fitScale = Math.min(scaleX, scaleY, 1.0);
                
                console.log('计算缩放比例:', fitScale);
                // 设置缩放和重置位置到中间
                setZoom(fitScale, true, true); // 重置位置
            } else {
                console.log('⚠️ 设置默认缩放');
                setZoom(0.8, true, true); // 默认缩放并重置位置
            }
        };
    }
    
    // 原始大小按钮
    const zoom100Btn = modal.querySelector('#vpe-zoom-100');
    if (zoom100Btn) {
        zoom100Btn.onclick = () => setZoom(1.0);
    }
    
    // 放大缩小按钮
    const zoomInBtn = modal.querySelector('#vpe-zoom-in');
    const zoomOutBtn = modal.querySelector('#vpe-zoom-out');
    if (zoomInBtn) {
        zoomInBtn.onclick = () => setZoom(currentZoom * 1.2);
    }
    if (zoomOutBtn) {
        zoomOutBtn.onclick = () => setZoom(currentZoom / 1.2);
    }
    
    // 鼠标滚轮缩放和中键拖动事件
    const mainCanvasContainer = modal.querySelector('#canvas-container');
    // 使用modal上的isPanning变量
    let panStartX = 0;
    let panStartY = 0;
    let panStartTransformX = 0;
    let panStartTransformY = 0;
    
    // Ctrl+鼠标滚轮缩放
    mainCanvasContainer.addEventListener('wheel', (e) => {
        if (e.ctrlKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            setZoom(currentZoom * delta, false);
        }
    });
    
    // 鼠标中键拖动画布
    mainCanvasContainer.addEventListener('mousedown', (e) => {
        if (e.button === 1) { // 中键
            e.preventDefault();
            e.stopPropagation();
            modal.isPanning = true;
            panStartX = e.clientX;
            panStartY = e.clientY;
            
            // 获取当前的transform位置
            const transform = zoomContainer.style.transform;
            const translateMatch = transform.match(/translate\\((-?[\\d.]+)px,\\s*(-?[\\d.]+)px\\)/);
            if (translateMatch) {
                panStartTransformX = parseFloat(translateMatch[1]);
                panStartTransformY = parseFloat(translateMatch[2]);
            } else {
                panStartTransformX = -50; // 默认值
                panStartTransformY = -50;
            }
            
            mainCanvasContainer.style.cursor = 'grabbing';
            console.log('🖱️ VPE开始中键拖动');
        }
    });
    
    mainCanvasContainer.addEventListener('mousemove', (e) => {
        if (modal.isPanning && e.buttons === 4) { // 中键拖动中
            e.preventDefault();
            e.stopPropagation();
            
            const deltaX = e.clientX - panStartX;
            const deltaY = e.clientY - panStartY;
            
            const newTransformX = panStartTransformX + deltaX;
            const newTransformY = panStartTransformY + deltaY;
            
            zoomContainer.style.transform = `translate(${newTransformX}px, ${newTransformY}px) scale(${currentZoom})`;
            
            return false; // 阻止事件冒泡
        }
    });
    
    mainCanvasContainer.addEventListener('mouseup', (e) => {
        if (e.button === 1 && modal.isPanning) { // 中键释放
            modal.isPanning = false;
            mainCanvasContainer.style.cursor = '';
            console.log('🖱️ VPE结束中键拖动');
        }
    });
    
    // 离开画布时结束拖动
    mainCanvasContainer.addEventListener('mouseleave', () => {
        if (modal.isPanning) {
            modal.isPanning = false;
            mainCanvasContainer.style.cursor = '';
            console.log('🖱️ VPE离开画布，结束拖动');
        }
    });
    
    return { setZoom, currentZoom: () => currentZoom };
}

/**
 * 渲染图像到画布
 */
export function renderImageCanvas(imageCanvas, imageData) {
    // 尝试多种方式获取图像
    let imageSrc = null;
    
    if (imageData) {
        console.log('🔍 分析图像数据类型和内容:', {
            type: typeof imageData,
            constructor: imageData.constructor?.name,
            keys: typeof imageData === 'object' ? Object.keys(imageData) : null,
            isArray: Array.isArray(imageData)
        });
        
        // 方法1: 字符串数据 (URL或base64)
        if (typeof imageData === 'string') {
            if (imageData.startsWith('data:image/')) {
                // 已经是完整的data URL
                imageSrc = imageData;
            } else if (imageData.startsWith('http://') || imageData.startsWith('https://') || imageData.startsWith('/')) {
                // 是HTTP URL或相对路径，直接使用
                imageSrc = imageData;
                console.log('🌐 使用URL图像源:', imageSrc);
            } else {
                // 假设是base64数据，添加前缀
                imageSrc = `data:image/png;base64,${imageData}`;
                console.log('📋 使用base64图像源');
            }
        }
        // 方法2: 张量数据
        else if (Array.isArray(imageData)) {
            // 处理张量数据的显示
            imageSrc = tensorToImageSrc(imageData);
        }
        // 方法3: ComfyUI对象格式 (新增)
        else if (typeof imageData === 'object' && imageData !== null) {
            // 尝试从对象中提取图像数据
            if (imageData.image) {
                imageSrc = imageData.image;
            } else if (imageData.data) {
                imageSrc = imageData.data;
            } else if (imageData.src) {
                imageSrc = imageData.src;
            } else if (imageData.url) {
                imageSrc = imageData.url;
            } else {
                console.log('🔍 未知的图像对象格式:', imageData);
                // 尝试将对象转换为字符串看是否是base64数据
                const objStr = JSON.stringify(imageData);
                if (objStr.includes('data:image/') || objStr.includes('base64')) {
                    console.log('🔍 对象中可能包含图像数据');
                }
            }
        }
    }
    
    // 如果还没有图像，尝试从输入获取
    if (!imageSrc) {
        imageSrc = getImageFromInputs();
    }
    
    // 如果仍然没有图像，使用占位符图像用于测试
    if (!imageSrc) {
        console.log('🖼️ 使用占位符图像用于界面测试');
        // 生成一个简单的占位符图像
        imageSrc = 'data:image/svg+xml;base64,' + btoa(`
            <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
                <rect width="100%" height="100%" fill="#2a2a2a"/>
                <text x="50%" y="45%" text-anchor="middle" fill="#888" font-size="24" font-family="Arial">
                    No Image Connected
                </text>
                <text x="50%" y="55%" text-anchor="middle" fill="#666" font-size="16" font-family="Arial">
                    Connect an image input to start annotation
                </text>
            </svg>
        `);
    }
    
    if (imageSrc) {
        imageCanvas.innerHTML = `
            <div style="position: relative; display: inline-block;">
                <img id="vpe-main-image" src="${imageSrc}" 
                     style="display: block; border-radius: 8px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3); max-width: none; max-height: none;"
                     onload="console.log('✅ VPE图像加载成功', this.naturalWidth + 'x' + this.naturalHeight)"
                     onerror="console.error('❌ VPE图像加载失败', this.src)">
                <div style="position: absolute; bottom: 8px; left: 8px; background: rgba(0,0,0,0.7); color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; z-index: 999;">
                    🖼️ Ready for annotation
                </div>
            </div>
        `;
        
        // 图像加载完成后自动适应屏幕
        const img = imageCanvas.querySelector('#vpe-main-image');
        if (img) {
            img.onload = () => {
                console.log('🎨 VPE图像加载完成，自动适应屏幕');
                
                // 查找最近的modal容器
                let modalContainer = imageCanvas.closest('#unified-editor-modal');
                if (modalContainer) {
                    const fitBtn = modalContainer.querySelector('#vpe-zoom-fit');
                    if (fitBtn) {
                        setTimeout(() => fitBtn.click(), 100);
                    }
                }
            };
        }
        
        // 创建绘制层
        const drawingLayer = document.createElement('div');
        drawingLayer.id = 'drawing-layer';
        drawingLayer.style.cssText = `
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            pointer-events: auto; z-index: 1000;
        `;
        
        imageCanvas.appendChild(drawingLayer);
        
        console.log('✅ VPE图像画布渲染完成');
    } else {
        imageCanvas.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 400px; color: #888; text-align: center; flex-direction: column; gap: 12px;">
                <div style="font-size: 48px;">🖼️</div>
                <div style="font-size: 16px;">No image available</div>
                <div style="font-size: 12px; color: #666;">Connect an image input to start annotation</div>
            </div>
        `;
        
        // 即使没有图像，也创建绘制层以支持标注功能
        const drawingLayer = document.createElement('div');
        drawingLayer.id = 'drawing-layer';
        drawingLayer.style.cssText = `
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            pointer-events: auto; z-index: 1000;
        `;
        imageCanvas.appendChild(drawingLayer);
        
        console.log('⚠️ VPE无可用图像，但已创建绘制层');
    }
}

/**
 * 设置活动工具
 */
/**
 * 启用橡皮擦模式
 */
function enableEraserMode(modal) {
    const svg = modal.querySelector('#drawing-layer svg');
    if (!svg) return;
    
    // 为所有标注形状添加点击删除事件
    const shapes = svg.querySelectorAll('.annotation-shape');
    shapes.forEach(shape => {
        shape.style.cursor = 'pointer';
        shape.addEventListener('click', handleEraserClick);
    });
    
    // 为标注标签添加点击删除事件
    const labels = svg.querySelectorAll('.annotation-label');
    labels.forEach(label => {
        label.style.cursor = 'pointer';
        label.addEventListener('click', handleEraserClick);
    });
    
    console.log('🗑️ 橡皮擦模式已启用');
}

/**
 * 禁用橡皮擦模式
 */
function disableEraserMode(modal) {
    const svg = modal.querySelector('#drawing-layer svg');
    if (!svg) return;
    
    // 移除所有标注形状的点击删除事件
    const shapes = svg.querySelectorAll('.annotation-shape');
    shapes.forEach(shape => {
        shape.style.cursor = 'default';
        shape.removeEventListener('click', handleEraserClick);
    });
    
    // 移除标注标签的点击删除事件
    const labels = svg.querySelectorAll('.annotation-label');
    labels.forEach(label => {
        label.style.cursor = 'default';
        label.removeEventListener('click', handleEraserClick);
    });
    
    console.log('🗑️ 橡皮擦模式已禁用');
}

/**
 * 处理橡皮擦点击事件
 */
function handleEraserClick(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const modal = e.target.closest('#unified-editor-modal');
    if (!modal) return;
    
    // 获取点击的元素
    const clickedElement = e.target;
    
    // 查找对应的标注ID
    let annotationId = clickedElement.dataset.annotationId;
    let annotationNumber = clickedElement.dataset.annotationNumber;
    
    // 如果点击的是标签，尝试从父元素获取
    if (!annotationId && !annotationNumber) {
        const parent = clickedElement.closest('[data-annotation-id], [data-annotation-number]');
        if (parent) {
            annotationId = parent.dataset.annotationId;
            annotationNumber = parent.dataset.annotationNumber;
        }
    }
    
    // 查找并删除标注
    if (annotationId && modal.annotations) {
        const annotation = modal.annotations.find(ann => ann.id === annotationId);
        if (annotation && deleteAnnotation) {
            deleteAnnotation(modal, annotation);
            console.log('✅ 标注已删除:', annotationId);
            
            // 重新启用橡皮擦模式以更新事件绑定
            disableEraserMode(modal);
            enableEraserMode(modal);
        }
    } else if (annotationNumber !== undefined && modal.annotations) {
        // 按编号查找标注
        const annotation = modal.annotations.find(ann => ann.number == annotationNumber);
        if (annotation && deleteAnnotation) {
            deleteAnnotation(modal, annotation);
            console.log('✅ 标注已删除 (按编号):', annotationNumber);
            
            // 重新启用橡皮擦模式以更新事件绑定
            disableEraserMode(modal);
            enableEraserMode(modal);
        }
    }
}

export function setActiveTool(modal, toolName) {
    const toolCanvasContainer = modal.querySelector('#canvas-container');
    const drawingLayer = modal.querySelector('#drawing-layer');
    
    // 设置光标样式
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
    
    toolCanvasContainer.style.cursor = cursors[toolName] || 'crosshair';
    
    // 保存当前工具
    modal.currentTool = toolName;
    
    // 处理橡皮擦工具特殊逻辑
    if (toolName === 'eraser') {
        enableEraserMode(modal);
    } else {
        disableEraserMode(modal);
    }
    
    console.log(`🎨 激活工具: ${toolName}`);
}

/**
 * 辅助函数：从张量数据转换为图像源
 */
function tensorToImageSrc(tensorData) {
    // 这里需要实现张量到图像的转换逻辑
    // 暂时返回null，实际项目中需要根据张量格式实现
    console.log('张量数据转换暂未实现');
    return null;
}

/**
 * 通用图像获取函数 - 支持所有图像输入类型
 */
function getImageFromInputs() {
    console.log('🖼️ Starting universal image acquisition...');
    
    // 尝试从全局上下文获取当前节点实例
    let nodeInstance = null;
    
    // 方法1: 从window.currentVPENode获取（如果设置了的话）
    if (window.currentVPENode) {
        nodeInstance = window.currentVPENode;
        console.log('📍 Found node from window.currentVPENode');
    }
    
    // 方法2: 查找graph中的VisualPromptEditor节点
    if (!nodeInstance && window.app && window.app.graph) {
        nodeInstance = window.app.graph._nodes.find(node => 
            node.type === "VisualPromptEditor"
        );
        if (nodeInstance) {
            console.log('📍 Found VisualPromptEditor node in graph');
        }
    }
    
    if (!nodeInstance) {
        console.log('⚠️ No node instance found, using placeholder');
        return null;
    }
    
    // 使用通用图像获取逻辑
    const imageUrl = getUniversalImageUrl(nodeInstance);
    console.log('🖼️ Final image URL:', imageUrl);
    
    return imageUrl;
}

/**
 * 通用图像URL获取 - 核心逻辑
 */
function getUniversalImageUrl(nodeInstance) {
    // 方法1: 从连接的输入获取图像
    const imageFromInput = getImageFromConnectedInput(nodeInstance);
    if (imageFromInput) {
        console.log('✅ Found image from connected input');
        return imageFromInput;
    }
    
    // 方法2: 从节点widget获取图像
    const imageFromWidget = getImageFromWidget(nodeInstance);
    if (imageFromWidget) {
        console.log('✅ Found image from node widget');
        return imageFromWidget;
    }
    
    // 方法3: 从ComfyUI图像缓存获取
    const imageFromCache = getImageFromCache(nodeInstance);
    if (imageFromCache) {
        console.log('✅ Found image from ComfyUI cache');
        return imageFromCache;
    }
    
    console.log('⚠️ No image source found');
    return null;
}

/**
 * 从连接的输入节点获取图像
 */
function getImageFromConnectedInput(nodeInstance) {
    try {
        console.log('🔗 Analyzing node inputs for:', nodeInstance.type, 'ID:', nodeInstance.id);
        console.log('🔗 Node inputs:', nodeInstance.inputs);
        
        // 查找image输入连接
        const imageInput = nodeInstance.inputs?.find(input => 
            input.type === 'IMAGE' || input.name.toLowerCase().includes('image')
        );
        
        console.log('🔗 Found image input:', imageInput);
        
        if (imageInput && imageInput.link) {
            console.log('🔗 Input has link:', imageInput.link);
            
            // Try two different approaches to get the source node
            let sourceNode = null;
            
            // Method 1: Direct access to link.origin_id (works in working version)
            if (imageInput.link.origin_id !== undefined) {
                sourceNode = window.app.graph.getNodeById(imageInput.link.origin_id);
                console.log('🔗 Method 1 - Direct link access, found node:', sourceNode?.type);
            }
            
            // Method 2: Access via links array (fallback)
            if (!sourceNode && typeof imageInput.link === 'number') {
                const linkInfo = window.app.graph.links[imageInput.link];
                console.log('🔗 Method 2 - Links array access, link info:', linkInfo);
                if (linkInfo) {
                    sourceNode = window.app.graph.getNodeById(linkInfo.origin_id);
                    console.log('🔗 Method 2 - Found node:', sourceNode?.type);
                }
            }
            
            if (sourceNode) {
                console.log('🔗 Found connected source node:', sourceNode.type, 'ID:', sourceNode.id);
                return getImageFromSourceNode(sourceNode);
            } else {
                console.log('❌ Could not find source node for link:', imageInput.link);
            }
        }
    } catch (error) {
        console.warn('Error getting image from connected input:', error);
    }
    return null;
}

/**
 * 从源节点获取图像
 */
function getImageFromSourceNode(sourceNode) {
    console.log('🔍 Analyzing source node:', sourceNode.type);
    
    // 支持LoadImage节点
    if (sourceNode.type === 'LoadImage') {
        const imageWidget = sourceNode.widgets?.find(w => w.name === 'image');
        if (imageWidget && imageWidget.value) {
            console.log('✅ Found LoadImage with file:', imageWidget.value);
            return `/view?filename=${encodeURIComponent(imageWidget.value)}`;
        }
    }
    
    // 支持Load Image (from Outputs)节点
    if (sourceNode.type === 'LoadImageFromOutputs' || sourceNode.type.includes('LoadImage')) {
        const imageWidget = sourceNode.widgets?.find(w => 
            w.name === 'image' || w.name === 'filename' || w.name === 'file'
        );
        if (imageWidget && imageWidget.value) {
            console.log('✅ Found LoadImageFromOutputs with file:', imageWidget.value);
            return `/view?filename=${encodeURIComponent(imageWidget.value)}`;
        }
    }
    
    // 支持Preview Bridge (Image)节点和其他预览节点
    if (sourceNode.type.includes('Preview') || sourceNode.type.includes('Bridge')) {
        // 尝试从节点的图像数据获取
        if (sourceNode.images && sourceNode.images.length > 0) {
            const imageData = sourceNode.images[0];
            console.log('✅ Found Preview/Bridge with image data:', imageData.filename);
            return `/view?filename=${encodeURIComponent(imageData.filename)}&type=${imageData.type}`;
        }
    }
    
    // 支持Reroute节点（路由节点）- 需要继续向上查找
    if (sourceNode.type === 'Reroute' || sourceNode.type.includes('Route')) {
        console.log('🔄 Found Reroute node, continuing upstream search...');
        const upstreamImage = findUpstreamImageSource(sourceNode);
        if (upstreamImage) {
            console.log('✅ Found image through Reroute chain');
            return upstreamImage;
        }
    }
    
    // 支持其他图像处理节点
    if (sourceNode.outputs && sourceNode.outputs.length > 0) {
        // 检查是否有IMAGE类型的输出
        const hasImageOutput = sourceNode.outputs.some(output => 
            output.type === 'IMAGE' || output.name.toLowerCase().includes('image')
        );
        
        if (hasImageOutput) {
            console.log('🔄 Found node with IMAGE output, searching upstream...');
            // 递归查找上游图像源
            const upstreamImage = findUpstreamImageSource(sourceNode);
            if (upstreamImage) {
                console.log('✅ Found image through processing chain');
                return upstreamImage;
            }
        }
    }
    
    console.log('❌ No image found from node:', sourceNode.type);
    return null;
}

/**
 * 递归查找上游图像源
 */
function findUpstreamImageSource(node, visited = new Set()) {
    console.log('🔄 Recursively searching upstream from node:', node.type, 'ID:', node.id);
    
    if (visited.has(node.id)) {
        console.log('⚠️ Already visited node', node.id, '- avoiding cycle');
        return null; // 避免循环引用
    }
    visited.add(node.id);
    
    // 查找所有图像类型的输入 - 对Reroute节点特殊处理
    let imageInputs = [];
    
    if (node.type === 'Reroute') {
        // Reroute节点的输入结构可能不同，检查所有输入
        imageInputs = node.inputs || [];
        console.log('🔄 Reroute node - checking all inputs:', imageInputs.length);
    } else {
        // 普通节点按类型过滤
        imageInputs = node.inputs?.filter(input => 
            input.type === 'IMAGE' || input.name.toLowerCase().includes('image')
        ) || [];
    }
    
    console.log('🔍 Found', imageInputs.length, 'inputs for node', node.type);
    
    // 调试输出所有输入的详细信息
    if (imageInputs.length > 0) {
        imageInputs.forEach((input, index) => {
            console.log(`  Input ${index}:`, {
                name: input.name,
                type: input.type,
                link: input.link,
                hasLink: !!input.link
            });
        });
    }
    
    for (const input of imageInputs) {
        console.log('🔗 Checking input:', input.name, 'Type:', input.type, 'Link:', input.link);
        
        if (input.link) {
            let sourceNode = null;
            
            // Try two different approaches to get the source node
            // Method 1: Direct access to link.origin_id
            if (input.link.origin_id !== undefined) {
                sourceNode = window.app.graph.getNodeById(input.link.origin_id);
                console.log('🔗 Method 1 - Direct link access, found node:', sourceNode?.type);
            }
            
            // Method 2: Access via links array (fallback)
            if (!sourceNode && typeof input.link === 'number') {
                const linkInfo = window.app.graph.links[input.link];
                if (linkInfo) {
                    sourceNode = window.app.graph.getNodeById(linkInfo.origin_id);
                    console.log('🔗 Method 2 - Links array access, found node:', sourceNode?.type);
                } else {
                    console.log('❌ Could not find link info for:', input.link);
                }
            }
            
            if (sourceNode) {
                console.log('⬆️ Found upstream node:', sourceNode.type, 'ID:', sourceNode.id);
                
                // 先尝试直接获取
                const directImage = getImageFromSourceNode(sourceNode);
                if (directImage) {
                    console.log('✅ Direct image found from:', sourceNode.type);
                    return directImage;
                }
                
                // 递归查找
                console.log('🔄 Continuing recursive search from:', sourceNode.type);
                const upstreamImage = findUpstreamImageSource(sourceNode, visited);
                if (upstreamImage) {
                    console.log('✅ Recursive image found through:', sourceNode.type);
                    return upstreamImage;
                }
            } else {
                console.log('❌ Could not find source node for link:', input.link);
            }
        } else {
            console.log('⚠️ Input has no link');
        }
    }
    
    console.log('❌ No upstream image source found for node:', node.type);
    return null;
}

/**
 * 从节点widget获取图像
 */
function getImageFromWidget(nodeInstance) {
    const imageWidget = nodeInstance.widgets?.find(w => 
        w.name === 'image' || w.name === 'filename' || w.name === 'file'
    );
    
    if (imageWidget && imageWidget.value) {
        return `/view?filename=${encodeURIComponent(imageWidget.value)}`;
    }
    
    return null;
}

/**
 * 从ComfyUI缓存获取图像
 */
function getImageFromCache(nodeInstance) {
    try {
        // 检查是否有执行结果缓存
        if (nodeInstance.imgs && nodeInstance.imgs.length > 0) {
            return nodeInstance.imgs[0].src;
        }
        
        // 检查ComfyUI的图像缓存
        if (window.app && window.app.nodeOutputs && window.app.nodeOutputs[nodeInstance.id]) {
            const output = window.app.nodeOutputs[nodeInstance.id];
            if (output.images && output.images.length > 0) {
                const imageData = output.images[0];
                return `/view?filename=${encodeURIComponent(imageData.filename)}&type=${imageData.type}`;
            }
        }
    } catch (error) {
        console.warn('Error getting image from cache:', error);
    }
    
    return null;
}