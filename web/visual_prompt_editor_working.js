/**
 * Visual Prompt Editor - 完整工作版本
 * 可视化提示词编辑器统一前端 - 完整功能版本
 * 
 * 核心功能：双击打开模态弹窗，左侧图形标注区，右侧结构化提示词编辑区
 */

(function() {
    // 如果app还未加载，等待它
    if (!window.app || !window.app.registerExtension) {
        setTimeout(arguments.callee, 100);
        return;
    }

    const app = window.app;
    
    console.log("🌐 Loading Visual Prompt Editor extension (Working Version)...");

    // 内联所需的函数
    function createMainModal() {
        // 移除已存在的编辑器
        const existingModal = document.getElementById('unified-editor-modal');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.id = 'unified-editor-modal';
        modal.className = 'comfy-modal';
        modal.style.cssText = `
            display: flex;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
            z-index: 10000;
            align-items: center;
            justify-content: center;
        `;

        const content = document.createElement('div');
        content.style.cssText = `
            background-color: #1a1a1a;
            border-radius: 12px;
            width: 95%;
            height: 95%;
            max-width: 1600px;
            max-height: 900px;
            display: flex;
            flex-direction: column;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
            overflow: hidden;
        `;

        modal.appendChild(content);
        document.body.appendChild(modal);

        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        return { modal, content };
    }

    // 创建完整的编辑器界面
    function createEditorInterface(content, nodeInstance) {
        // 添加标题栏
        const title = document.createElement('div');
        title.style.cssText = `
            padding: 15px 20px;
            border-bottom: 1px solid #333;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #2a2a2a;
        `;
        title.innerHTML = `
            <h2 style="margin: 0; color: #fff;">🎨 Visual Prompt Editor</h2>
            <div style="display: flex; gap: 10px;">
                <button id="save-annotations" style="
                    background: #4CAF50;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                ">Save & Apply</button>
                <button onclick="this.closest('#unified-editor-modal').remove()" style="
                    background: #f44336;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                ">Close</button>
            </div>
        `;
        content.appendChild(title);

        // 创建主体区域
        const body = document.createElement('div');
        body.style.cssText = `
            flex: 1;
            display: flex;
            overflow: hidden;
        `;
        content.appendChild(body);

        // 左侧画布区域
        const leftPanel = document.createElement('div');
        leftPanel.style.cssText = `
            flex: 1;
            padding: 20px;
            border-right: 1px solid #333;
            background: #1e1e1e;
            display: flex;
            flex-direction: column;
        `;
        body.appendChild(leftPanel);

        // 工具栏
        const toolbar = document.createElement('div');
        toolbar.style.cssText = `
            padding: 10px;
            background: #333;
            border-radius: 8px;
            margin-bottom: 15px;
            display: flex;
            gap: 10px;
            align-items: center;
        `;
        toolbar.innerHTML = `
            <label style="color: #fff; font-weight: bold;">Tools:</label>
            <button class="tool-btn" data-tool="rectangle" style="background: #4CAF50; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Rectangle</button>
            <button class="tool-btn" data-tool="circle" style="background: #2196F3; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Circle</button>
            <button class="tool-btn" data-tool="arrow" style="background: #FF9800; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Arrow</button>
            <button class="tool-btn" data-tool="polygon" style="background: #9C27B0; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Polygon</button>
            <div style="width: 20px;"></div>
            <label style="color: #fff; font-weight: bold;">Colors:</label>
            <button class="color-btn" data-color="#f44336" style="background: #f44336; width: 30px; height: 30px; border: none; border-radius: 50%; cursor: pointer; margin: 0 2px;"></button>
            <button class="color-btn" data-color="#4caf50" style="background: #4caf50; width: 30px; height: 30px; border: none; border-radius: 50%; cursor: pointer; margin: 0 2px;"></button>
            <button class="color-btn" data-color="#ffeb3b" style="background: #ffeb3b; width: 30px; height: 30px; border: none; border-radius: 50%; cursor: pointer; margin: 0 2px;"></button>
            <button class="color-btn" data-color="#2196f3" style="background: #2196f3; width: 30px; height: 30px; border: none; border-radius: 50%; cursor: pointer; margin: 0 2px;"></button>
        `;
        leftPanel.appendChild(toolbar);

        // 画布容器
        const canvasContainer = document.createElement('div');
        canvasContainer.id = 'canvas-container';
        canvasContainer.style.cssText = `
            flex: 1;
            background: #000;
            border: 2px solid #333;
            border-radius: 8px;
            position: relative;
            overflow: hidden;
        `;
        leftPanel.appendChild(canvasContainer);

        // 右侧提示词区域
        const rightPanel = document.createElement('div');
        rightPanel.style.cssText = `
            width: 400px;
            padding: 20px;
            background: #1a1a1a;
            display: flex;
            flex-direction: column;
            gap: 15px;
        `;
        body.appendChild(rightPanel);

        // 提示词编辑区
        rightPanel.innerHTML = `
            <h3 style="color: #fff; margin: 0;">Generated Prompts</h3>
            <div>
                <label style="color: #fff; font-weight: bold;">Positive Prompt:</label>
                <textarea id="positive-prompt" style="
                    width: 100%;
                    height: 120px;
                    background: #333;
                    color: #fff;
                    border: 1px solid #555;
                    border-radius: 4px;
                    padding: 10px;
                    resize: vertical;
                    font-family: monospace;
                    margin-top: 5px;
                ">high quality, detailed, professional editing</textarea>
            </div>
            <div>
                <label style="color: #fff; font-weight: bold;">Negative Prompt:</label>
                <textarea id="negative-prompt" style="
                    width: 100%;
                    height: 80px;
                    background: #333;
                    color: #fff;
                    border: 1px solid #555;
                    border-radius: 4px;
                    padding: 10px;
                    resize: vertical;
                    font-family: monospace;
                    margin-top: 5px;
                ">low quality, blurry, artifacts</textarea>
            </div>
            <div>
                <label style="color: #fff; font-weight: bold;">Annotations:</label>
                <div id="annotations-list" style="
                    max-height: 200px;
                    overflow-y: auto;
                    background: #333;
                    border: 1px solid #555;
                    border-radius: 4px;
                    padding: 10px;
                    color: #fff;
                    font-family: monospace;
                    font-size: 12px;
                ">No annotations yet</div>
            </div>
        `;

        // 初始化编辑器功能
        initializeEditor(content, nodeInstance);
    }

    // 初始化编辑器功能
    function initializeEditor(content, nodeInstance) {
        let currentTool = 'rectangle';
        let currentColor = '#f44336';
        let annotations = [];
        let isDrawing = false;
        let startPoint = null;

        // 获取画布容器
        const canvasContainer = content.querySelector('#canvas-container');
        
        // 创建SVG画布
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.setAttribute('viewBox', '0 0 1000 1000');
        svg.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 10;
        `;
        canvasContainer.appendChild(svg);

        // 加载图像
        loadImageToCanvas(canvasContainer, nodeInstance);

        // 工具选择事件
        content.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                content.querySelectorAll('.tool-btn').forEach(b => b.style.opacity = '0.7');
                btn.style.opacity = '1';
                currentTool = btn.dataset.tool;
                console.log('🛠️ Tool changed to:', currentTool);
            });
        });

        // 颜色选择事件
        content.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                content.querySelectorAll('.color-btn').forEach(b => b.style.transform = 'scale(1)');
                btn.style.transform = 'scale(1.2)';
                currentColor = btn.dataset.color;
                console.log('🎨 Color changed to:', currentColor);
            });
        });

        // 绘制事件
        svg.addEventListener('mousedown', (e) => {
            if (currentTool === 'polygon') return; // 多边形特殊处理

            const rect = svg.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 1000;
            const y = ((e.clientY - rect.top) / rect.height) * 1000;
            
            startPoint = {x, y};
            isDrawing = true;
            
            console.log('🖱️ Mouse down at:', startPoint);
        });

        svg.addEventListener('mousemove', (e) => {
            if (!isDrawing || !startPoint) return;

            const rect = svg.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 1000;
            const y = ((e.clientY - rect.top) / rect.height) * 1000;
            
            // 更新预览
            updatePreview(svg, currentTool, startPoint, {x, y}, currentColor);
        });

        svg.addEventListener('mouseup', (e) => {
            if (!isDrawing || !startPoint) return;

            const rect = svg.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 1000;
            const y = ((e.clientY - rect.top) / rect.height) * 1000;
            
            // 创建标注
            const annotation = createAnnotation(currentTool, startPoint, {x, y}, currentColor);
            annotations.push(annotation);
            
            // 添加到SVG
            addAnnotationToSvg(svg, annotation);
            
            // 更新列表
            updateAnnotationsList(content, annotations);
            
            isDrawing = false;
            startPoint = null;
            
            // 清除预览
            const preview = svg.querySelector('.preview');
            if (preview) preview.remove();
            
            console.log('✅ Annotation created:', annotation);
        });

        // 设置初始状态
        content.querySelector('.tool-btn').style.opacity = '1';
        content.querySelector('.color-btn').style.transform = 'scale(1.2)';

        // 保存按钮事件
        content.querySelector('#save-annotations').addEventListener('click', () => {
            saveAnnotations(nodeInstance, annotations);
        });
    }

    // 通用图像加载到画布 - 支持所有图像输入类型
    function loadImageToCanvas(container, nodeInstance) {
        console.log('🖼️ Starting universal image loading for node:', nodeInstance.type);
        
        // 方法1: 尝试从连接的输入获取图像
        const imageFromInput = getImageFromConnectedInput(nodeInstance);
        if (imageFromInput) {
            console.log('✅ Found image from connected input');
            displayImage(container, imageFromInput);
            return;
        }
        
        // 方法2: 尝试从节点widget获取图像
        const imageFromWidget = getImageFromWidget(nodeInstance);
        if (imageFromWidget) {
            console.log('✅ Found image from node widget');
            displayImage(container, imageFromWidget);
            return;
        }
        
        // 方法3: 尝试从ComfyUI图像缓存获取
        const imageFromCache = getImageFromCache(nodeInstance);
        if (imageFromCache) {
            console.log('✅ Found image from ComfyUI cache');
            displayImage(container, imageFromCache);
            return;
        }
        
        console.log('⚠️ No image found, showing placeholder');
        showImagePlaceholder(container);
    }
    
    // 从连接的输入节点获取图像
    function getImageFromConnectedInput(nodeInstance) {
        try {
            // 查找image输入连接
            const imageInput = nodeInstance.inputs?.find(input => 
                input.type === 'IMAGE' || input.name.toLowerCase().includes('image')
            );
            
            if (imageInput && imageInput.link) {
                const sourceNode = app.graph.getNodeById(imageInput.link.origin_id);
                if (sourceNode) {
                    console.log('🔗 Found connected source node:', sourceNode.type);
                    
                    // 支持多种类型的图像输出节点
                    return getImageFromSourceNode(sourceNode);
                }
            }
        } catch (error) {
            console.warn('Error getting image from connected input:', error);
        }
        return null;
    }
    
    // 从源节点获取图像
    function getImageFromSourceNode(sourceNode) {
        // 支持LoadImage节点
        if (sourceNode.type === 'LoadImage') {
            const imageWidget = sourceNode.widgets?.find(w => w.name === 'image');
            if (imageWidget && imageWidget.value) {
                return `/view?filename=${encodeURIComponent(imageWidget.value)}`;
            }
        }
        
        // 支持Load Image (from Outputs)节点
        if (sourceNode.type === 'LoadImageFromOutputs' || sourceNode.type.includes('LoadImage')) {
            const imageWidget = sourceNode.widgets?.find(w => 
                w.name === 'image' || w.name === 'filename' || w.name === 'file'
            );
            if (imageWidget && imageWidget.value) {
                return `/view?filename=${encodeURIComponent(imageWidget.value)}`;
            }
        }
        
        // 支持Preview Bridge (Image)节点和其他预览节点
        if (sourceNode.type.includes('Preview') || sourceNode.type.includes('Bridge')) {
            // 尝试从节点的图像数据获取
            if (sourceNode.images && sourceNode.images.length > 0) {
                const imageData = sourceNode.images[0];
                return `/view?filename=${encodeURIComponent(imageData.filename)}&type=${imageData.type}`;
            }
        }
        
        // 支持任何处理过的图像节点（如Router, Switch等）
        if (sourceNode.outputs && sourceNode.outputs.length > 0) {
            // 递归查找上游图像源
            const upstreamImage = findUpstreamImageSource(sourceNode);
            if (upstreamImage) {
                return upstreamImage;
            }
        }
        
        return null;
    }
    
    // 递归查找上游图像源
    function findUpstreamImageSource(node, visited = new Set()) {
        if (visited.has(node.id)) return null; // 避免循环引用
        visited.add(node.id);
        
        // 查找所有图像类型的输入
        const imageInputs = node.inputs?.filter(input => 
            input.type === 'IMAGE' || input.name.toLowerCase().includes('image')
        ) || [];
        
        for (const input of imageInputs) {
            if (input.link) {
                const sourceNode = app.graph.getNodeById(input.link.origin_id);
                if (sourceNode) {
                    // 先尝试直接获取
                    const directImage = getImageFromSourceNode(sourceNode);
                    if (directImage) return directImage;
                    
                    // 递归查找
                    const upstreamImage = findUpstreamImageSource(sourceNode, visited);
                    if (upstreamImage) return upstreamImage;
                }
            }
        }
        
        return null;
    }
    
    // 从节点widget获取图像
    function getImageFromWidget(nodeInstance) {
        const imageWidget = nodeInstance.widgets?.find(w => 
            w.name === 'image' || w.name === 'filename' || w.name === 'file'
        );
        
        if (imageWidget && imageWidget.value) {
            return `/view?filename=${encodeURIComponent(imageWidget.value)}`;
        }
        
        return null;
    }
    
    // 从ComfyUI缓存获取图像
    function getImageFromCache(nodeInstance) {
        try {
            // 检查是否有执行结果缓存
            if (nodeInstance.imgs && nodeInstance.imgs.length > 0) {
                return nodeInstance.imgs[0].src;
            }
            
            // 检查ComfyUI的图像缓存
            if (window.app && app.nodeOutputs && app.nodeOutputs[nodeInstance.id]) {
                const output = app.nodeOutputs[nodeInstance.id];
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
    
    // 显示图像
    function displayImage(container, imageSrc) {
        const img = document.createElement('img');
        img.src = imageSrc;
        img.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: contain;
            position: absolute;
            top: 0;
            left: 0;
        `;
        
        img.onload = () => {
            console.log('🖼️ Image loaded successfully:', imageSrc);
        };
        
        img.onerror = () => {
            console.error('❌ Failed to load image:', imageSrc);
            showImagePlaceholder(container);
        };
        
        container.appendChild(img);
    }
    
    // 显示占位符
    function showImagePlaceholder(container) {
        const placeholder = document.createElement('div');
        placeholder.style.cssText = `
            width: 100%;
            height: 100%;
            background: #2a2a2a;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #666;
            font-size: 18px;
            flex-direction: column;
            gap: 10px;
        `;
        placeholder.innerHTML = `
            <div>📷 No Image Found</div>
            <small style="color: #888; text-align: center; max-width: 300px;">
                Connect an image node (LoadImage, Preview Bridge, Router, etc.) to display image here
            </small>
        `;
        container.appendChild(placeholder);
    }

    // 创建标注数据
    function createAnnotation(tool, start, end, color) {
        const id = 'annotation_' + Date.now();
        const annotation = {
            id,
            type: tool,
            color,
            start,
            end,
            visible: true,
            number: annotations.length
        };
        
        if (tool === 'polygon') {
            annotation.points = [start, end]; // 简化版本
        }
        
        return annotation;
    }

    // 添加标注到SVG
    function addAnnotationToSvg(svg, annotation) {
        const element = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        element.setAttribute('data-annotation-id', annotation.id);
        
        const colorRgba = hexToRgba(annotation.color, 0.5);
        
        if (annotation.type === 'rectangle') {
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', Math.min(annotation.start.x, annotation.end.x));
            rect.setAttribute('y', Math.min(annotation.start.y, annotation.end.y));
            rect.setAttribute('width', Math.abs(annotation.end.x - annotation.start.x));
            rect.setAttribute('height', Math.abs(annotation.end.y - annotation.start.y));
            rect.setAttribute('fill', colorRgba);
            element.appendChild(rect);
        } else if (annotation.type === 'circle') {
            const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
            const cx = (annotation.start.x + annotation.end.x) / 2;
            const cy = (annotation.start.y + annotation.end.y) / 2;
            const rx = Math.abs(annotation.end.x - annotation.start.x) / 2;
            const ry = Math.abs(annotation.end.y - annotation.start.y) / 2;
            
            ellipse.setAttribute('cx', cx);
            ellipse.setAttribute('cy', cy);
            ellipse.setAttribute('rx', rx);
            ellipse.setAttribute('ry', ry);
            ellipse.setAttribute('fill', colorRgba);
            element.appendChild(ellipse);
        } else if (annotation.type === 'arrow') {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', annotation.start.x);
            line.setAttribute('y1', annotation.start.y);
            line.setAttribute('x2', annotation.end.x);
            line.setAttribute('y2', annotation.end.y);
            line.setAttribute('stroke', annotation.color);
            line.setAttribute('stroke-width', '4');
            element.appendChild(line);
            
            // 添加箭头头部
            const marker = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            const angle = Math.atan2(annotation.end.y - annotation.start.y, annotation.end.x - annotation.start.x);
            const arrowSize = 15;
            const x1 = annotation.end.x - arrowSize * Math.cos(angle - Math.PI / 6);
            const y1 = annotation.end.y - arrowSize * Math.sin(angle - Math.PI / 6);
            const x2 = annotation.end.x - arrowSize * Math.cos(angle + Math.PI / 6);
            const y2 = annotation.end.y - arrowSize * Math.sin(angle + Math.PI / 6);
            
            marker.setAttribute('points', `${annotation.end.x},${annotation.end.y} ${x1},${y1} ${x2},${y2}`);
            marker.setAttribute('fill', annotation.color);
            element.appendChild(marker);
        }
        
        svg.appendChild(element);
    }

    // 更新预览
    function updatePreview(svg, tool, start, end, color) {
        // 移除之前的预览
        const preview = svg.querySelector('.preview');
        if (preview) preview.remove();
        
        // 创建预览元素
        const element = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        element.classList.add('preview');
        element.style.opacity = '0.7';
        
        const colorRgba = hexToRgba(color, 0.3);
        
        if (tool === 'rectangle') {
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', Math.min(start.x, end.x));
            rect.setAttribute('y', Math.min(start.y, end.y));
            rect.setAttribute('width', Math.abs(end.x - start.x));
            rect.setAttribute('height', Math.abs(end.y - start.y));
            rect.setAttribute('fill', colorRgba);
            rect.setAttribute('stroke', color);
            rect.setAttribute('stroke-width', '2');
            element.appendChild(rect);
        } else if (tool === 'circle') {
            const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
            const cx = (start.x + end.x) / 2;
            const cy = (start.y + end.y) / 2;
            const rx = Math.abs(end.x - start.x) / 2;
            const ry = Math.abs(end.y - start.y) / 2;
            
            ellipse.setAttribute('cx', cx);
            ellipse.setAttribute('cy', cy);
            ellipse.setAttribute('rx', rx);
            ellipse.setAttribute('ry', ry);
            ellipse.setAttribute('fill', colorRgba);
            ellipse.setAttribute('stroke', color);
            ellipse.setAttribute('stroke-width', '2');
            element.appendChild(ellipse);
        } else if (tool === 'arrow') {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', start.x);
            line.setAttribute('y1', start.y);
            line.setAttribute('x2', end.x);
            line.setAttribute('y2', end.y);
            line.setAttribute('stroke', color);
            line.setAttribute('stroke-width', '4');
            element.appendChild(line);
        }
        
        svg.appendChild(element);
    }

    // 更新标注列表
    function updateAnnotationsList(content, annotations) {
        const list = content.querySelector('#annotations-list');
        if (annotations.length === 0) {
            list.textContent = 'No annotations yet';
            return;
        }
        
        list.innerHTML = annotations.map((ann, i) => 
            `<div style="margin: 5px 0; padding: 5px; background: #2a2a2a; border-radius: 4px;">
                ${i + 1}. ${ann.type.toUpperCase()} - ${ann.color}
                <small style="color: #888;"> (${ann.start.x.toFixed(0)}, ${ann.start.y.toFixed(0)})</small>
            </div>`
        ).join('');
    }

    // 保存标注数据
    function saveAnnotations(nodeInstance, annotations) {
        // 将标注数据保存到节点的annotation_data input
        const annotationData = JSON.stringify(annotations);
        
        // 查找annotation_data widget或创建一个
        let annotationWidget = nodeInstance.widgets?.find(w => w.name === 'annotation_data');
        if (!annotationWidget) {
            // 如果没有找到widget，创建一个text widget
            annotationWidget = nodeInstance.addWidget("text", "annotation_data", "", () => {}, {
                serialize: true
            });
        }
        
        // 设置数据
        annotationWidget.value = annotationData;
        
        // 更新status widget
        const statusWidget = nodeInstance.widgets?.find(w => w.name === 'editor_status');
        if (statusWidget) {
            statusWidget.value = `Saved ${annotations.length} annotations - Ready for workflow`;
        }
        
        // 触发节点更新和重绘
        nodeInstance.setDirtyCanvas(true, true);
        if (nodeInstance.graph) {
            nodeInstance.graph.setDirtyCanvas(true, true);
        }
        
        // 显示成功消息 - 尝试多种定位策略
        const modal = document.getElementById('unified-editor-modal');
        const modalContent = modal.querySelector('.content') || modal.firstElementChild;
        
        const successMsg = document.createElement('div');
        successMsg.className = 'success-message-v2-fix';
        successMsg.style.cssText = `
            position: fixed !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            background: #4CAF50 !important;
            color: white !important;
            padding: 20px 30px !important;
            border-radius: 12px !important;
            z-index: 999999 !important;
            box-shadow: 0 12px 24px rgba(0,0,0,0.6) !important;
            animation: popIn 0.3s ease-out !important;
            font-size: 16px !important;
            font-weight: bold !important;
            text-align: center !important;
            min-width: 400px !important;
            border: 3px solid #fff !important;
            backdrop-filter: blur(5px) !important;
        `;
        successMsg.innerHTML = `
            ✅ Saved ${annotations.length} annotations!<br>
            <small style="font-weight: normal;">Run workflow to see rendered annotations</small>
        `;
        
        // 添加动画样式
        if (!document.getElementById('success-msg-animation-v2')) {
            const style = document.createElement('style');
            style.id = 'success-msg-animation-v2';
            style.textContent = `
                @keyframes popIn {
                    from {
                        transform: translate(-50%, -50%) scale(0.8);
                        opacity: 0;
                    }
                    to {
                        transform: translate(-50%, -50%) scale(1);
                        opacity: 1;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        // 添加到body而不是modal，确保最高层级
        document.body.appendChild(successMsg);
        
        
        setTimeout(() => successMsg.remove(), 4000);
    }

    // 辅助函数：转换颜色格式
    function hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    // 注册扩展
    app.registerExtension({
        name: "Kontext.VisualPromptEditor.Working",
        
        async beforeRegisterNodeDef(nodeType, nodeData, app) {
            console.log("🔍 Checking node:", nodeData.name);
            if (nodeData.name === "VisualPromptEditor") {
                console.log("🎨 Registering Visual Prompt Editor Node (Working Version)");
                
                // 添加节点创建时的回调
                const onNodeCreated = nodeType.prototype.onNodeCreated;
                nodeType.prototype.onNodeCreated = function () {
                    const r = onNodeCreated ? onNodeCreated.apply(this, arguments) : undefined;
                    
                    // 设置节点样式
                    this.color = "#4CAF50";
                    this.bgcolor = "#2E7D32";
                    
                    // 添加编辑状态显示
                    this.addWidget("text", "editor_status", "Ready to annotate", () => {}, {
                        serialize: false
                    });
                    
                    // 监听双击事件
                    const originalOnDblClick = this.onDblClick;
                    this.onDblClick = function(event) {
                        console.log("🎨 Visual Prompt Editor Working version double-clicked!");
                        
                        // 阻止默认行为
                        if (event) {
                            event.preventDefault();
                            event.stopPropagation();
                        }
                        
                        // 打开我们的编辑器
                        this.openUnifiedEditor();
                        
                        // 返回false阻止默认双击行为
                        return false;
                    };
                    
                    return r;
                };
                
                // 核心功能：打开统一编辑器
                nodeType.prototype.openUnifiedEditor = function() {
                    console.log("🎨 Opening Unified Visual Prompt Editor (Working Version)...");
                    
                    try {
                        // 创建模态弹窗
                        const { modal, content } = createMainModal();
                        
                        // 创建完整的编辑器界面
                        createEditorInterface(content, this);
                        
                        console.log("✅ Editor opened successfully");
                        
                    } catch (error) {
                        console.error("❌ Error opening editor:", error);
                        alert("Error opening Visual Prompt Editor. Please check the console.");
                    }
                };
            }
        }
    });

    console.log("✅ Visual Prompt Editor Working Version loaded successfully");
})();