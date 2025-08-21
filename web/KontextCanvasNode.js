// Super Canvas Node - 专业画布标注工具  
import { app } from "../../scripts/app.js";
import { api } from "../../scripts/api.js";
import { fabric } from "./libs/fabric.js";
import FaceToolsUI from "./face-tools.js";

// 定义常量 - 重新设计的更优雅的布局
const CANVAS_SIZE = {
    WIDTH: 500,
    HEIGHT: 500,
    BOTTOM_MARGIN: 5,    // 减少底部边距避免超出
    RIGHT_MARGIN: 5,     // 减少右侧边距
    TOOLBAR_HEIGHT: 45,
    SIDEBAR_WIDTH: 50
};

class LRPGCanvas {
    constructor(node, initialSize = null) {
        this.node = node;
        this.lastCanvasState = null; 
        this.isSendingData = false; // 防重复发送标志
        this.customEventsActive = false; // 自定义事件监听器状态标志
        
        // 使用传入的初始尺寸或默认尺寸
        this.originalSize = initialSize || {
            width: CANVAS_SIZE.WIDTH,
            height: CANVAS_SIZE.HEIGHT
        };
        
        // 立即应用尺寸到实例属性
        this.currentSize = { ...this.originalSize };
        this.maxDisplaySize = 768;
        
        // 异步初始化
        this.initCanvas();
    }
    
    calculateScaledSize(originalWidth, originalHeight, maxSize) {
        if (!maxSize || (originalWidth <= maxSize && originalHeight <= maxSize)) {
            return { width: originalWidth, height: originalHeight };
        }
        
        const scaleX = maxSize / originalWidth;
        const scaleY = maxSize / originalHeight;
        const scale = Math.min(scaleX, scaleY);
        
        return {
            width: Math.round(originalWidth * scale),
            height: Math.round(originalHeight * scale)
        };
    }
    
    updateCanvasSize(displayWidth, displayHeight) {
        // 采用lg_tools的显示缩放策略
        // // console.log(`[LRPG Canvas] updateCanvasSize: display=${displayWidth}x${displayHeight}, original=${this.originalSize.width}x${this.originalSize.height}`);
        
        if (!this.canvas) return;
        
        // 1. 设置画布为原始尺寸（保持实际数据分辨率）
        this.canvas.setDimensions({
            width: this.originalSize.width,
            height: this.originalSize.height
        });
        
        // 2. 计算缩放比例
        const scaleX = displayWidth / this.originalSize.width;
        const scaleY = displayHeight / this.originalSize.height;
        const scale = Math.min(scaleX, scaleY);
        
        // 3. 应用CSS transform缩放到canvas包装器
        if (this.canvas.wrapperEl) {
            this.canvas.wrapperEl.style.transform = `scale(${scale})`;
            this.canvas.wrapperEl.style.transformOrigin = 'top left';
            this.canvas.wrapperEl.style.width = `${displayWidth}px`;
            this.canvas.wrapperEl.style.height = `${displayHeight}px`;
        }
        
        // 4. 更新容器尺寸
        this.updateContainerSize(displayWidth, displayHeight);
        
        // // console.log(`[LRPG Canvas] CSS transform scale applied: ${scale}, actual canvas: ${this.originalSize.width}x${this.originalSize.height}`);
    }
    
    updateContainerSize(canvasWidth, canvasHeight) {
        // 容器尺寸管理（基于显示尺寸）
        const TOOLBAR_HEIGHT = CANVAS_SIZE.TOOLBAR_HEIGHT;
        
        // 计算图层面板高度
        const LAYER_PANEL_EXPANDED_HEIGHT = 250; // 展开时高度
        const LAYER_PANEL_COLLAPSED_HEIGHT = 35; // 折叠时高度
        const layerPanelHeight = (this.layerPanel && this.layerPanel.isExpanded) 
            ? LAYER_PANEL_EXPANDED_HEIGHT 
            : LAYER_PANEL_COLLAPSED_HEIGHT;
        
        // 计算面部面板高度
        const FACE_PANEL_EXPANDED_HEIGHT = 380; // 面板展开时的高度（包含手动微调部分）
        const FACE_PANEL_COLLAPSED_HEIGHT = 35;  // 面板折叠时只有标题栏
        const facePanelHeight = (this.faceToolsUI && this.faceToolsUI.isPanelExpanded)
            ? FACE_PANEL_EXPANDED_HEIGHT
            : FACE_PANEL_COLLAPSED_HEIGHT;
        
        // console.log(`[LRPG Canvas] updateContainerSize called: ${canvasWidth}x${canvasHeight}, layerPanel: ${layerPanelHeight}px, facePanel: ${facePanelHeight}px`);
        
        const totalContainerHeight = canvasHeight + TOOLBAR_HEIGHT + layerPanelHeight + facePanelHeight;
        
        if (this.canvasContainer) {
            this.canvasContainer.style.width = `${canvasWidth}px`;
            // 不设置固定高度，让容器自动适应内容
            this.canvasContainer.style.minHeight = `${totalContainerHeight}px`;
            this.canvasContainer.style.height = 'auto';
        }
        
        if (this.canvasWrapper) {
            this.canvasWrapper.style.height = `${canvasHeight}px`;
        }
        
        if (this.node && this.node.canvasElement) {
            this.node.canvasElement.style.minWidth = `${canvasWidth}px`;
            this.node.canvasElement.style.minHeight = `${totalContainerHeight}px`;
            this.node.canvasElement.style.width = "100%";
            this.node.canvasElement.style.height = "100%";
        }
        
        if (this.node) {
            const ADJUSTED_RIGHT_MARGIN = 70;
            const LG_BOTTOM_MARGIN = 110;
            
            const computedSize = [
                canvasWidth + ADJUSTED_RIGHT_MARGIN,
                totalContainerHeight + LG_BOTTOM_MARGIN
            ];
            this.node.computeSize = () => computedSize;
            // // console.log(`[LRPG Canvas] computeSize包含图层面板: ${computedSize[0]}x${computedSize[1]}`);
        }
        
        
        // 通知节点尺寸变化并验证设置是否生效
        if (this.node) {
            this.node.setDirtyCanvas(true, true);
            
            setTimeout(() => {
                if (this.node.canvasElement) {
                    const computedStyle = window.getComputedStyle(this.node.canvasElement);
                    // // console.log(`[LRPG Canvas] 验证DOM元素实际样式:`);
                }
                if (this.canvasContainer) {
                    const containerStyle = window.getComputedStyle(this.canvasContainer);
                    // // console.log(`[LRPG Canvas] 验证canvasContainer实际样式:`);
                }
                if (this.node.size) {
                    // // console.log(`[LRPG Canvas] 验证节点实际尺寸: [${this.node.size[0]}, ${this.node.size[1]}]`);
                }
            }, 100);
        }
    }
    

    async initCanvas() {
        try {
            // // console.log('[LRPG Canvas] Starting canvas initialization with Fabric.js:', fabric.version);
            
            this.canvasContainer = document.createElement('div');
            this.canvasContainer.className = 'kontext-canvas-container';
            this.canvasContainer.style.cssText = `
                position: relative;
                background: transparent;
                margin: 5px;
            `;
            
            // 创建 canvas 元素
            const canvasElement = document.createElement('canvas');
            
            // 使用标准的Fabric.js方式创建画布
            this.canvas = new fabric.Canvas(canvasElement, {
                width: this.originalSize.width,
                height: this.originalSize.height,
                preserveObjectStacking: true,
                selection: true
            });
            // 设置选中框样式
            this.canvas.selectionColor = 'rgba(0, 123, 255, 0.3)';  // 选中区域填充色
            this.canvas.selectionBorderColor = '#007bff';  // 选中框边框颜色
            this.canvas.selectionLineWidth = 2;  // 选中框边框宽度
            
            // 设置控制点样式
            fabric.Object.prototype.set({
                transparentCorners: false,  // 控制点不透明
                cornerColor: '#007bff',  // 控制点颜色
                cornerSize: 20,  // 控制点大小
                cornerStyle: 'circle',  // 控制点形状为圆形
                cornerStrokeColor: '#ffffff',  // 控制点边框颜色
                cornerStrokeWidth: 2,  // 控制点边框宽度
                padding: 5,  // 选中框内边距
                borderColor: '#007bff',  // 边框颜色
                borderScaleFactor: 2,  // 边框宽度
                hasRotatingPoint: true,  // 显示旋转控制点
                rotatingPointOffset: 30  // 旋转控制点偏移距离
            });

            // 设置画布背景为白色
            this.canvas.backgroundColor = '#ffffff';
            // 强制重新渲染以确保背景色生效
            this.canvas.renderAll();
            
            // 使用flex布局，无需预先计算容器尺寸
            
            this.canvasContainer.style.cssText = `
                position: relative;
                width: 100%;
                height: 100%;
                background: transparent;
                box-sizing: border-box;
            `;
            
            // lg_tools简洁结构：去掉复杂嵌套，采用透明背景策略
            
            // 设置canvasContainer为透明背景（关键修复）
            this.canvasContainer.style.cssText = `
                position: relative;
                background: transparent;
                box-sizing: border-box;
            `;
            // // console.log('[LRPG Canvas] canvasContainer style set to transparent background');
            
            // 创建简单的画布包装容器，类似lg_tools
            const canvasWrapper = document.createElement('div');
            canvasWrapper.style.cssText = `
                width: 100%;
                height: ${this.originalSize.height}px;
                position: relative;
            `;
            
            // this.canvas.lowerCanvasEl.style.backgroundColor = '#f0f0f0';
            canvasWrapper.appendChild(this.canvas.wrapperEl);
            
            // 创建简化的工具栏
            this.toolbar = this.createModernToolbar();
            
            // 创建侧边栏
            this.sidebar = this.createModernSidebar();
            
            // 简化的布局：工具栏 + 内容区域（侧边栏 + 画布）
            const contentArea = document.createElement('div');
            contentArea.style.cssText = `
                display: flex;
                background: transparent;
            `;
            contentArea.appendChild(this.sidebar);
            contentArea.appendChild(canvasWrapper);
            
            
            // 保存canvasWrapper引用，用于updateContainerSize方法
            this.canvasWrapper = canvasWrapper;
            
            // 最终布局：工具栏在上，内容区域在下
            this.canvasContainer.appendChild(this.toolbar);
            this.canvasContainer.appendChild(contentArea);
            
            // 添加图层管理面板
            this.layerPanel = this.createLayerPanel();
            this.canvasContainer.appendChild(this.layerPanel);
            
            // 初始化状态
            this.layers = new Map();
            this.isDragging = false;
            this.isLocked = false;
            
            // 设置事件监听
            this.setupEventListeners();
            this.setupWebSocket();
            this.setupDragAndDrop();
            this.setupPaste();
            
            // LRPG方式：简化初始化，让flex布局和ComfyUI节点系统处理尺寸
            const initialScaledSize = this.calculateScaledSize(
                this.originalSize.width, 
                this.originalSize.height, 
                this.maxDisplaySize
            );
            
            this.updateCanvasSize(initialScaledSize.width, initialScaledSize.height);

            // 初始化面部工具
            this.initializeFaceTools();

            // // console.log('[LRPG Canvas] Canvas initialized successfully');
        } catch (error) {
            console.error('[LRPG Canvas] Failed to initialize canvas:', error);
            this.destroyFaceTools(); // 清理面部工具
            this.showError(error.message);
        }
    }

    createLayerPanel() {
        const panel = document.createElement('div');
        panel.className = 'layer-management-panel';
        panel.style.cssText = `
            background: #2a2a2a;
            border-top: 1px solid #444;
            transition: all 0.3s ease;
            overflow: hidden;
        `;
        
        // 创建切换按钮栏
        const toggleBar = document.createElement('div');
        toggleBar.style.cssText = `
            display: flex;
            align-items: center;
            padding: 8px 12px;
            cursor: pointer;
            user-select: none;
            background: #333;
            border-bottom: 1px solid #444;
        `;
        
        // 切换图标
        const toggleIcon = document.createElement('span');
        toggleIcon.innerHTML = '▼';
        toggleIcon.style.cssText = `
            color: #888;
            margin-right: 8px;
            transition: transform 0.3s ease;
            display: inline-block;
        `;
        
        // 标题
        const title = document.createElement('span');
        title.textContent = '图层管理';
        title.style.cssText = `
            color: #fff;
            font-size: 12px;
            font-weight: bold;
        `;
        
        // 图层数量指示
        const layerCount = document.createElement('span');
        layerCount.className = 'layer-count';
        layerCount.style.cssText = `
            color: #888;
            font-size: 11px;
            margin-left: auto;
        `;
        
        toggleBar.appendChild(toggleIcon);
        toggleBar.appendChild(title);
        toggleBar.appendChild(layerCount);
        
        // 图层列表容器
        const layerListContainer = document.createElement('div');
        layerListContainer.className = 'layer-list-container';
        layerListContainer.style.cssText = `
            max-height: 200px;
            overflow-y: auto;
            background: #1a1a1a;
            transition: max-height 0.3s ease;
        `;
        
        // 图层列表
        const layerList = document.createElement('div');
        layerList.className = 'layer-list';
        layerList.style.cssText = `
            padding: 8px;
        `;
        
        layerListContainer.appendChild(layerList);
        
        // 控制按钮栏
        const controlBar = document.createElement('div');
        controlBar.style.cssText = `
            display: flex;
            gap: 4px;
            padding: 8px;
            background: #2a2a2a;
            border-top: 1px solid #444;
        `;
        
        // 添加控制按钮
        const deleteLayerBtn = this.createLayerControlButton('🗑️', '删除图层');
        const lockLayerBtn = this.createLayerControlButton('🔒', '锁定/解锁');
        
        controlBar.appendChild(deleteLayerBtn);
        controlBar.appendChild(lockLayerBtn);
        
        // 组装面板
        panel.appendChild(toggleBar);
        panel.appendChild(layerListContainer);
        panel.appendChild(controlBar);
        
        // 初始状态：折叠
        panel.isExpanded = false;
        layerListContainer.style.maxHeight = '0';
        controlBar.style.display = 'none';
        toggleIcon.style.transform = 'rotate(-90deg)';
        
        // 切换展开/折叠
        toggleBar.addEventListener('click', () => {
            panel.isExpanded = !panel.isExpanded;
            if (panel.isExpanded) {
                layerListContainer.style.maxHeight = '200px';
                controlBar.style.display = 'flex';
                toggleIcon.style.transform = 'rotate(0deg)';
                this.updateLayerList();
                // 展开时增加节点高度
                this.updateNodeSizeForLayerPanel(true);
            } else {
                layerListContainer.style.maxHeight = '0';
                controlBar.style.display = 'none';
                toggleIcon.style.transform = 'rotate(-90deg)';
                // 折叠时减少节点高度
                this.updateNodeSizeForLayerPanel(false);
            }
        });
        
        // 保存引用
        this.layerList = layerList;
        this.layerCount = layerCount;
        
        // 绑定控制按钮事件
        deleteLayerBtn.addEventListener('click', () => this.deleteSelectedLayer());
        lockLayerBtn.addEventListener('click', () => this.toggleLayerLock());
        
        return panel;
    }
    
    createLayerControlButton(icon, tooltip) {
        const btn = document.createElement('button');
        btn.innerHTML = icon;
        btn.title = tooltip;
        btn.style.cssText = `
            background: #444;
            border: 1px solid #555;
            color: #fff;
            padding: 4px 8px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.2s;
            flex: 1;
            min-width: 0;
        `;
        
        btn.addEventListener('mouseenter', () => {
            btn.style.background = '#555';
            btn.style.borderColor = '#666';
        });
        
        btn.addEventListener('mouseleave', () => {
            btn.style.background = '#444';
            btn.style.borderColor = '#555';
        });
        
        return btn;
    }
    
    updateLayerList() {
        if (!this.layerList) return;
        
        // 清空现有列表
        this.layerList.innerHTML = '';
        
        // 获取所有Fabric对象作为图层
        const objects = this.canvas.getObjects();
        
        if (this.layerCount) {
            this.layerCount.textContent = `(${objects.length} 个图层)`;
        }
        
        // 反向遍历（顶层在上）
        for (let i = objects.length - 1; i >= 0; i--) {
            const obj = objects[i];
            const layerItem = this.createLayerItem(obj, i);
            this.layerList.appendChild(layerItem);
        }
        
        // 如果没有图层，显示提示
        if (objects.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.style.cssText = `
                color: #666;
                text-align: center;
                padding: 20px;
                font-size: 12px;
            `;
            emptyMsg.textContent = '暂无图层';
            this.layerList.appendChild(emptyMsg);
        }
    }
    
    createLayerItem(obj, index) {
        const item = document.createElement('div');
        item.className = 'layer-item';
        item.style.cssText = `
            display: flex;
            align-items: center;
            padding: 8px;
            background: ${obj === this.canvas.getActiveObject() ? '#444' : '#2a2a2a'};
            border-radius: 4px;
            margin-bottom: 4px;
            cursor: pointer;
            transition: background 0.2s;
            min-height: 48px;
        `;
        
        // 缩略图
        const thumbnail = document.createElement('div');
        thumbnail.style.cssText = `
            width: 40px;
            height: 40px;
            background: #333;
            border: 1px solid #555;
            border-radius: 4px;
            margin-right: 8px;
            overflow: hidden;
            position: relative;
            flex-shrink: 0;
        `;
        
        // 生成缩略图
        this.generateLayerThumbnail(obj, thumbnail);
        
        // 图层信息
        const info = document.createElement('div');
        info.style.cssText = `
            flex: 1;
            min-width: 0;
        `;
        
        const name = document.createElement('div');
        name.style.cssText = `
            color: #fff;
            font-size: 12px;
            font-weight: bold;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        `;
        name.textContent = obj.name || `图层 ${index + 1}`;
        
        const type = document.createElement('div');
        type.style.cssText = `
            color: #888;
            font-size: 10px;
        `;
        type.textContent = this.getObjectTypeName(obj);
        
        info.appendChild(name);
        info.appendChild(type);
        
        // 控制按钮组 - 单行布局，透明度控件与可见性按钮并排
        const controls = document.createElement('div');
        controls.style.cssText = `
            display: flex;
            align-items: center;
            gap: 4px;
            margin-left: 8px;
            min-width: 140px;
        `;
        
        // 透明度滑块（放在最前面）
        const opacitySlider = document.createElement('input');
        opacitySlider.type = 'range';
        opacitySlider.min = '0';
        opacitySlider.max = '100';
        opacitySlider.value = Math.round((obj.opacity || 1) * 100);
        opacitySlider.style.cssText = `
            width: 60px;
            height: 14px;
            background: #333;
            outline: none;
            border-radius: 7px;
            cursor: pointer;
            -webkit-appearance: none;
            appearance: none;
            margin-right: 4px;
        `;
        
        // 滑块样式
        const sliderStyle = document.createElement('style');
        if (!document.querySelector('#opacity-slider-style')) {
            sliderStyle.id = 'opacity-slider-style';
            sliderStyle.textContent = `
                input[type="range"]::-webkit-slider-track {
                    width: 100%;
                    height: 3px;
                    background: #333;
                    border-radius: 1.5px;
                }
                input[type="range"]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 10px;
                    height: 10px;
                    background: #007bff;
                    border-radius: 50%;
                    cursor: pointer;
                }
                input[type="range"]::-webkit-slider-thumb:hover {
                    background: #0056b3;
                }
                input[type="range"]::-moz-range-track {
                    width: 100%;
                    height: 3px;
                    background: #333;
                    border-radius: 1.5px;
                    border: none;
                }
                input[type="range"]::-moz-range-thumb {
                    width: 10px;
                    height: 10px;
                    background: #007bff;
                    border-radius: 50%;
                    cursor: pointer;
                    border: none;
                }
            `;
            document.head.appendChild(sliderStyle);
        }
        
        // 透明度值显示（紧凑显示）
        const opacityValue = document.createElement('span');
        opacityValue.textContent = `${Math.round((obj.opacity || 1) * 100)}%`;
        opacityValue.style.cssText = `
            font-size: 9px;
            color: #888;
            min-width: 24px;
            text-align: center;
            margin-right: 2px;
        `;
        
        // 透明度滑块事件监听
        opacitySlider.addEventListener('input', (e) => {
            e.stopPropagation();
            const newOpacity = parseInt(e.target.value) / 100;
            obj.set('opacity', newOpacity);
            opacityValue.textContent = `${e.target.value}%`;
            this.canvas.renderAll();
        });
        
        // 防止滑块点击时选中图层
        opacitySlider.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        
        // 可见性按钮
        const visibilityBtn = document.createElement('button');
        visibilityBtn.innerHTML = obj.visible ? '👁️' : '👁️‍🗨️';
        visibilityBtn.style.cssText = `
            background: none;
            border: none;
            color: ${obj.visible ? '#fff' : '#666'};
            cursor: pointer;
            padding: 2px;
            font-size: 14px;
        `;
        visibilityBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            obj.visible = !obj.visible;
            this.canvas.renderAll();
            this.updateLayerList();
        });
        
        // 锁定按钮
        const lockBtn = document.createElement('button');
        lockBtn.innerHTML = obj.selectable === false ? '🔒' : '🔓';
        lockBtn.style.cssText = `
            background: none;
            border: none;
            color: ${obj.selectable === false ? '#f44336' : '#888'};
            cursor: pointer;
            padding: 2px;
            font-size: 14px;
        `;
        lockBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            obj.selectable = !obj.selectable;
            obj.evented = obj.selectable;
            this.canvas.renderAll();
            this.updateLayerList();
        });
        
        // 上移按钮
        const moveUpBtn = document.createElement('button');
        moveUpBtn.innerHTML = '⬆';
        moveUpBtn.style.cssText = `
            background: none;
            border: none;
            color: #888;
            cursor: pointer;
            padding: 2px;
            font-size: 12px;
        `;
        moveUpBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.canvas.bringForward(obj);
            this.canvas.renderAll();
            this.updateLayerList();
        });
        
        // 下移按钮
        const moveDownBtn = document.createElement('button');
        moveDownBtn.innerHTML = '⬇';
        moveDownBtn.style.cssText = `
            background: none;
            border: none;
            color: #888;
            cursor: pointer;
            padding: 2px;
            font-size: 12px;
        `;
        moveDownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.canvas.sendBackwards(obj);
            this.canvas.renderAll();
            this.updateLayerList();
        });
        
        // 按顺序添加控件：透明度滑块 + 百分比 + 可见性 + 锁定 + 上移 + 下移
        controls.appendChild(opacitySlider);
        controls.appendChild(opacityValue);
        controls.appendChild(visibilityBtn);
        controls.appendChild(lockBtn);
        controls.appendChild(moveUpBtn);
        controls.appendChild(moveDownBtn);
        
        // 点击选中图层
        item.addEventListener('click', () => {
            this.canvas.setActiveObject(obj);
            this.canvas.renderAll();
            this.updateLayerList();
        });
        
        // 鼠标悬停效果
        item.addEventListener('mouseenter', () => {
            if (obj !== this.canvas.getActiveObject()) {
                item.style.background = '#383838';
            }
        });
        
        item.addEventListener('mouseleave', () => {
            if (obj !== this.canvas.getActiveObject()) {
                item.style.background = '#2a2a2a';
            }
        });
        
        item.appendChild(thumbnail);
        item.appendChild(info);
        item.appendChild(controls);
        
        return item;
    }
    
    generateLayerThumbnail(obj, container) {
        // 创建临时canvas生成缩略图
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 40;
        tempCanvas.height = 40;
        const ctx = tempCanvas.getContext('2d');
        
        // 白色背景
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, 40, 40);
        
        // 根据对象类型绘制缩略图
        if (obj.type === 'image') {
            // 图像缩略图
            const img = new Image();
            img.onload = () => {
                const scale = Math.min(40 / img.width, 40 / img.height);
                const width = img.width * scale;
                const height = img.height * scale;
                const x = (40 - width) / 2;
                const y = (40 - height) / 2;
                ctx.drawImage(img, x, y, width, height);
                container.style.backgroundImage = `url(${tempCanvas.toDataURL()})`;
                container.style.backgroundSize = 'cover';
                container.style.backgroundPosition = 'center';
            };
            img.src = obj.getSrc();
        } else if (obj.type === 'rect') {
            // 矩形缩略图
            ctx.fillStyle = obj.fill || '#888';
            ctx.fillRect(10, 10, 20, 20);
            container.style.backgroundImage = `url(${tempCanvas.toDataURL()})`;
            container.style.backgroundSize = 'cover';
        } else if (obj.type === 'text' || obj.type === 'i-text') {
            // 文字缩略图
            ctx.fillStyle = obj.fill || '#000';
            ctx.font = '12px Arial';
            ctx.fillText('T', 15, 25);
            container.style.backgroundImage = `url(${tempCanvas.toDataURL()})`;
            container.style.backgroundSize = 'cover';
        } else {
            // 默认缩略图
            ctx.fillStyle = '#888';
            ctx.fillRect(10, 10, 20, 20);
            container.style.backgroundImage = `url(${tempCanvas.toDataURL()})`;
            container.style.backgroundSize = 'cover';
        }
    }
    
    getObjectTypeName(obj) {
        const typeMap = {
            'image': '图像',
            'rect': '矩形',
            'circle': '圆形',
            'text': '文本',
            'i-text': '可编辑文本',
            'path': '路径',
            'group': '组合'
        };
        return typeMap[obj.type] || obj.type;
    }
    
    // 图层操作方法
    
    deleteSelectedLayer() {
        const activeObject = this.canvas.getActiveObject();
        if (activeObject) {
            this.canvas.remove(activeObject);
            this.canvas.renderAll();
            this.updateLayerList();
        }
    }
    
    /**
     * 设置键盘事件监听器
     */
    setupKeyboardListeners() {
        // 存储键盘事件处理器的引用，以便后续清理
        if (!this._keydownHandler) {
            this._keydownHandler = (e) => {
                // 检查是否在输入框中（避免在输入时删除）
                const activeElement = document.activeElement;
                const isInputting = activeElement && (
                    activeElement.tagName === 'INPUT' ||
                    activeElement.tagName === 'TEXTAREA' ||
                    activeElement.contentEditable === 'true'
                );
                
                if (isInputting) {
                    return;
                }
                
                // 检查画布是否有焦点
                const canvasHasFocus = this.canvasContainer && 
                    (this.canvasContainer.contains(document.activeElement) || 
                     document.activeElement === document.body);
                
                if (!canvasHasFocus) {
                    return;
                }
                
                // Delete键或Backspace键删除选中对象
                if (e.key === 'Delete' || e.key === 'Backspace') {
                    const activeObject = this.canvas.getActiveObject();
                    if (activeObject) {
                        // 阻止默认行为
                        e.preventDefault();
                        e.stopPropagation();
                        
                        // 如果是多选
                        if (activeObject.type === 'activeSelection') {
                            activeObject.forEachObject((obj) => {
                                this.canvas.remove(obj);
                            });
                            this.canvas.discardActiveObject();
                        } else {
                            // 单个对象
                            this.canvas.remove(activeObject);
                        }
                        
                        this.canvas.renderAll();
                        this.updateLayerList();
                        
                        console.log('[Canvas] 已删除选中的图层');
                    }
                }
                
                // Ctrl+A 全选
                if (e.ctrlKey && e.key === 'a') {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const objects = this.canvas.getObjects();
                    if (objects.length > 0) {
                        const selection = new fabric.ActiveSelection(objects, {
                            canvas: this.canvas
                        });
                        this.canvas.setActiveObject(selection);
                        this.canvas.renderAll();
                    }
                }
                
                // Ctrl+D 取消选择
                if (e.ctrlKey && e.key === 'd') {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    this.canvas.discardActiveObject();
                    this.canvas.renderAll();
                }
            };
            
            // 添加事件监听器
            document.addEventListener('keydown', this._keydownHandler);
            console.log('[Canvas] 键盘快捷键已启用: Delete删除, Ctrl+A全选, Ctrl+D取消选择');
        }
    }
    
    toggleLayerLock() {
        const activeObject = this.canvas.getActiveObject();
        if (activeObject) {
            activeObject.selectable = !activeObject.selectable;
            activeObject.evented = activeObject.selectable;
            this.canvas.renderAll();
            this.updateLayerList();
        }
    }
    
    updateNodeSizeForLayerPanel(isExpanded) {
        if (!this.node) return;
        
        // 获取当前显示尺寸
        const scaledSize = this.calculateScaledSize(
            this.originalSize.width,
            this.originalSize.height,
            this.maxDisplaySize
        );
        
        // 调用updateContainerSize来更新所有尺寸，它会自动考虑图层面板状态
        this.updateContainerSize(scaledSize.width, scaledSize.height);
        
        // 强制更新节点的size属性
        if (this.node.computeSize) {
            const newSize = this.node.computeSize();
            this.node.size = newSize;
            // // console.log(`[LRPG Canvas] 强制更新节点size: [${newSize[0]}, ${newSize[1]}]`);
        }
        
        // 确保节点立即刷新
        if (this.node.graph) {
            this.node.graph.setDirtyCanvas(true, true);
            // 触发图形重新布局
            if (this.node.graph.change) {
                this.node.graph.change();
            }
        }
        
        // // console.log(`[LRPG Canvas] 图层面板${isExpanded ? '展开' : '折叠'}，节点尺寸已更新`);
    }

    updateNodeSizeForFacePanel(isExpanded) {
        if (!this.node) return;
        
        // 获取当前显示尺寸
        const scaledSize = this.calculateScaledSize(
            this.originalSize.width,
            this.originalSize.height,
            this.maxDisplaySize
        );
        
        // 调用updateContainerSize来更新所有尺寸，它会自动考虑面部面板状态
        this.updateContainerSize(scaledSize.width, scaledSize.height);
        
        // 强制更新节点的size属性
        if (this.node.computeSize) {
            const newSize = this.node.computeSize();
            this.node.size = newSize;
            // console.log(`[Face Tools] 强制更新节点size: [${newSize[0]}, ${newSize[1]}]`);
        }
        
        // 确保节点立即刷新
        if (this.node.graph) {
            this.node.graph.setDirtyCanvas(true, true);
            // 触发图形重新布局
            if (this.node.graph.change) {
                this.node.graph.change();
            }
        }
        
        // console.log(`[Face Tools] 面部面板${isExpanded ? '展开' : '折叠'}，节点尺寸已更新`);
    }
    
    createModernToolbar() {
        const toolbar = document.createElement("div");
        // lg_tools风格：极简样式，透明背景
        toolbar.style.cssText = `
            background: #353535;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px;
            height: ${CANVAS_SIZE.TOOLBAR_HEIGHT}px;
            box-sizing: border-box;
        `;
        
        // 尺寸控制区域 - 优化为更紧凑的布局
        const sizeControls = document.createElement('div');
        sizeControls.style.cssText = `
            display: flex;
            gap: 6px;
            align-items: center;
            background: rgba(0, 0, 0, 0.3);
            padding: 4px 8px;
            border-radius: 6px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        `;
        
        const label = document.createElement('span');
        label.textContent = '画布尺寸:';
        label.style.cssText = `
            color: #e2e8f0; 
            font-size: 11px; 
            font-weight: 600;
            white-space: nowrap;
        `;
        
        const widthInput = document.createElement('input');
        widthInput.type = 'number';
        widthInput.value = this.originalSize.width;
        widthInput.style.cssText = `
            width: 50px;
            padding: 2px 4px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: #fff;
            border-radius: 3px;
            font-size: 10px;
            text-align: center;
        `;
        
        const xLabel = document.createElement('span');
        xLabel.textContent = '×';
        xLabel.style.cssText = 'color: #999; font-size: 12px; padding: 0 2px;';
        
        const heightInput = document.createElement('input');
        heightInput.type = 'number';
        heightInput.value = this.originalSize.height;
        heightInput.style.cssText = widthInput.style.cssText;
        
        const applyBtn = document.createElement('button');
        applyBtn.textContent = '应用';
        applyBtn.style.cssText = `
            padding: 3px 8px;
            background: linear-gradient(145deg, #22c55e, #16a34a);
            border: none;
            color: white;
            border-radius: 4px;
            cursor: pointer;
            font-size: 10px;
            font-weight: 600;
            transition: all 0.2s ease;
            white-space: nowrap;
        `;
        applyBtn.onmouseover = () => applyBtn.style.transform = 'scale(1.05)';
        applyBtn.onmouseout = () => applyBtn.style.transform = 'scale(1)';
        applyBtn.onclick = () => {
            const newWidth = parseInt(widthInput.value);
            const newHeight = parseInt(heightInput.value);
            if (newWidth > 0 && newHeight > 0) {
                this.resizeCanvas(newWidth, newHeight);
            }
        };
        
        // 从输入获取尺寸按钮
        const fromInputBtn = document.createElement('button');
        fromInputBtn.textContent = '从输入';
        fromInputBtn.title = '从image输入端口获取尺寸';
        fromInputBtn.style.cssText = `
            padding: 3px 8px;
            background: linear-gradient(145deg, #6366f1, #4f46e5);
            border: none;
            color: white;
            border-radius: 4px;
            cursor: pointer;
            font-size: 10px;
            font-weight: 600;
            transition: all 0.2s ease;
            margin-left: 2px;
            white-space: nowrap;
        `;
        fromInputBtn.onmouseover = () => fromInputBtn.style.transform = 'scale(1.05)';
        fromInputBtn.onmouseout = () => fromInputBtn.style.transform = 'scale(1)';
        fromInputBtn.onclick = () => this.getImageSizeFromInput(widthInput, heightInput);
        
        sizeControls.append(label, widthInput, xLabel, heightInput, applyBtn, fromInputBtn);
        
        // 文件操作区域
        const fileControls = document.createElement('div');
        fileControls.style.cssText = `
            display: flex;
            gap: 4px;
            align-items: center;
        `;
        
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        
        const uploadBtn = this.createStyledButton('📁 上传图片', '#3b82f6');
        uploadBtn.onclick = () => fileInput.click();
        fileInput.onchange = (e) => {
            if (e.target.files[0]) {
                this.handleImageUpload(e.target.files[0]);
            }
        };
        
        const clearBtn = this.createStyledButton('🗑 清空', '#ef4444');
        clearBtn.onclick = () => {
            if (confirm('确定要清空画布吗？')) {
                this.canvas.clear();
                this.canvas.backgroundColor = '#ffffff';
                this.canvas.renderAll();
            }
        };
        
        fileControls.append(uploadBtn, fileInput, clearBtn);
        
        toolbar.append(sizeControls, fileControls);
        return toolbar;
    }
    
    createModernSidebar() {
        const sidebar = document.createElement("div");
        sidebar.style.cssText = `
            width: ${CANVAS_SIZE.SIDEBAR_WIDTH}px;
            background: var(--comfy-input-bg, linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 100%));
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 8px 3px;
            gap: 4px;
            border-right: 2px solid var(--border-color, #555);
            box-shadow: 2px 0 8px rgba(0, 0, 0, 0.2);
            backdrop-filter: blur(4px);
            box-sizing: border-box;
        `;
        
        // 工具组
        const toolsContainer = document.createElement('div');
        toolsContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 4px;
            width: 100%;
            margin-bottom: 8px;
        `;
        
        const toolsTitle = document.createElement('div');
        toolsTitle.textContent = '工具';
        toolsTitle.style.cssText = `
            color: #888;
            font-size: 10px;
            text-align: center;
            margin-bottom: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        `;
        
        const tools = [
            { id: 'select', icon: '⚡', title: '选择工具' },
            { id: 'rectangle', icon: '▭', title: '矩形' },
            { id: 'circle', icon: '○', title: '圆形' },
            { id: 'text', icon: 'T', title: '文字' },
            { id: 'freehand', icon: '✎', title: '画笔' },
            { id: 'crop', icon: '✂', title: '裁切' }
        ];
        
        this.currentTool = 'select';
        this.toolButtons = {};
        this.currentColor = '#ff0000';
        this.fillMode = 'filled'; // 'filled' 或 'outline'
        this.drawingOptions = {};
        this.isDrawing = false;
        this.startPoint = null;
        this.drawingObject = null;
        
        toolsContainer.appendChild(toolsTitle);
        
        tools.forEach(tool => {
            const btn = document.createElement('button');
            btn.innerHTML = tool.icon;
            btn.title = tool.title;
            btn.style.cssText = `
                width: 28px;
                height: 28px;
                border: 1px solid ${tool.id === 'select' ? '#22c55e' : 'rgba(255, 255, 255, 0.2)'};
                background: ${tool.id === 'select' ? 'linear-gradient(145deg, #22c55e, #16a34a)' : 'rgba(255, 255, 255, 0.05)'};
                color: ${tool.id === 'select' ? 'white' : '#e2e8f0'};
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
                box-shadow: ${tool.id === 'select' ? '0 2px 6px rgba(34, 197, 94, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.2)'};
            `;
            
            btn.onmouseover = () => {
                if (tool.id !== this.currentTool) {
                    btn.style.background = 'rgba(255, 255, 255, 0.1)';
                    btn.style.transform = 'scale(1.05)';
                }
            };
            btn.onmouseout = () => {
                if (tool.id !== this.currentTool) {
                    btn.style.background = 'rgba(255, 255, 255, 0.05)';
                    btn.style.transform = 'scale(1)';
                }
            };
            
            btn.onclick = () => this.selectTool(tool.id, btn);
            this.toolButtons[tool.id] = btn;
            toolsContainer.appendChild(btn);
        });
        
        // 颜色选择器区域
        const colorSection = document.createElement('div');
        colorSection.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            width: 100%;
            padding-top: 8px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        `;
        
        const colorTitle = document.createElement('div');
        colorTitle.textContent = '颜色';
        colorTitle.style.cssText = toolsTitle.style.cssText;
        
        const colorPicker = document.createElement('input');
        colorPicker.type = 'color';
        colorPicker.value = '#ff0000';
        colorPicker.style.cssText = `
            width: 22px;
            height: 22px;
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 4px;
            cursor: pointer;
            background: none;
            padding: 0;
        `;
        colorPicker.onchange = (e) => {
            this.currentColor = e.target.value;
            if (this.canvas.isDrawingMode) {
                this.canvas.freeDrawingBrush.color = this.currentColor;
            }
            // // console.log(`[LRPG Canvas] 颜色切换为: ${this.currentColor}`);
        };
        
        // 添加画布背景颜色选择器
        const bgColorTitle = document.createElement('div');
        bgColorTitle.textContent = '背景';
        bgColorTitle.style.cssText = toolsTitle.style.cssText;
        bgColorTitle.style.marginTop = '8px';
        
        const bgColorPicker = document.createElement('input');
        bgColorPicker.type = 'color';
        bgColorPicker.value = '#ffffff';
        bgColorPicker.style.cssText = colorPicker.style.cssText;
        bgColorPicker.onchange = (e) => {
            // 设置画布背景色
            this.canvas.backgroundColor = e.target.value;
            this.canvas.renderAll();
        };
        
        // 添加填充模式控制
        const fillModeTitle = document.createElement('div');
        fillModeTitle.textContent = '填充';
        fillModeTitle.style.cssText = toolsTitle.style.cssText;
        fillModeTitle.style.marginTop = '8px';
        
        const fillModeContainer = document.createElement('div');
        fillModeContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 2px;
            width: 100%;
            align-items: center;
        `;
        
        // 实心按钮
        const filledBtn = document.createElement('button');
        filledBtn.innerHTML = '●';
        filledBtn.title = '实心';
        filledBtn.style.cssText = `
            width: 24px;
            height: 18px;
            border: 1px solid ${this.fillMode === 'filled' ? '#22c55e' : 'rgba(255, 255, 255, 0.2)'};
            background: ${this.fillMode === 'filled' ? 'linear-gradient(145deg, #22c55e, #16a34a)' : 'rgba(255, 255, 255, 0.05)'};
            color: ${this.fillMode === 'filled' ? 'white' : '#e2e8f0'};
            border-radius: 3px;
            cursor: pointer;
            font-size: 9px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
        `;
        
        // 空心按钮
        const outlineBtn = document.createElement('button');
        outlineBtn.innerHTML = '○';
        outlineBtn.title = '空心';
        outlineBtn.style.cssText = `
            width: 24px;
            height: 18px;
            border: 1px solid ${this.fillMode === 'outline' ? '#22c55e' : 'rgba(255, 255, 255, 0.2)'};
            background: ${this.fillMode === 'outline' ? 'linear-gradient(145deg, #22c55e, #16a34a)' : 'rgba(255, 255, 255, 0.05)'};
            color: ${this.fillMode === 'outline' ? 'white' : '#e2e8f0'};
            border-radius: 3px;
            cursor: pointer;
            font-size: 9px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
        `;
        
        // 按钮事件
        filledBtn.onclick = () => {
            this.fillMode = 'filled';
            this.updateFillModeButtons(filledBtn, outlineBtn);
        };
        
        outlineBtn.onclick = () => {
            this.fillMode = 'outline';
            this.updateFillModeButtons(filledBtn, outlineBtn);
        };
        
        fillModeContainer.append(filledBtn, outlineBtn);
        
        colorSection.append(colorTitle, colorPicker, bgColorTitle, bgColorPicker, fillModeTitle, fillModeContainer);
        
        // 画笔参数控制区域
        const brushSection = document.createElement('div');
        brushSection.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            width: 100%;
            padding-top: 8px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        `;
        
        const brushTitle = document.createElement('div');
        brushTitle.textContent = '画笔';
        brushTitle.style.cssText = toolsTitle.style.cssText;
        
        // 画笔粗细控制
        const brushSizeContainer = document.createElement('div');
        brushSizeContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 2px;
            width: 100%;
        `;
        
        const brushSizeLabel = document.createElement('div');
        brushSizeLabel.textContent = '粗细';
        brushSizeLabel.style.cssText = `
            color: #999;
            font-size: 9px;
            margin-bottom: 2px;
        `;
        
        this.brushSize = 2; // 初始画笔粗细
        
        const brushSizeSlider = document.createElement('input');
        brushSizeSlider.type = 'range';
        brushSizeSlider.min = '1';
        brushSizeSlider.max = '50';
        brushSizeSlider.value = this.brushSize;
        brushSizeSlider.style.cssText = `
            width: 32px;
            height: 3px;
            background: rgba(255, 255, 255, 0.2);
            outline: none;
            border-radius: 2px;
            appearance: none;
            cursor: pointer;
        `;
        
        // 自定义滑块样式
        const sliderStyle = document.createElement('style');
        sliderStyle.textContent = `
            input[type="range"]::-webkit-slider-thumb {
                appearance: none;
                width: 8px;
                height: 8px;
                background: #22c55e;
                border-radius: 50%;
                cursor: pointer;
            }
            input[type="range"]::-moz-range-thumb {
                width: 8px;
                height: 8px;
                background: #22c55e;
                border-radius: 50%;
                border: none;
                cursor: pointer;
            }
        `;
        document.head.appendChild(sliderStyle);
        
        const brushSizeValue = document.createElement('div');
        brushSizeValue.textContent = this.brushSize + 'px';
        brushSizeValue.style.cssText = `
            color: #e2e8f0;
            font-size: 8px;
            min-height: 10px;
        `;
        
        brushSizeSlider.oninput = (e) => {
            this.brushSize = parseInt(e.target.value);
            brushSizeValue.textContent = this.brushSize + 'px';
            if (this.canvas.isDrawingMode) {
                this.canvas.freeDrawingBrush.width = this.brushSize;
            }
        };
        
        // 边缘羽化控制
        const featherContainer = document.createElement('div');
        featherContainer.style.cssText = brushSizeContainer.style.cssText;
        
        const featherLabel = document.createElement('div');
        featherLabel.textContent = '羽化';
        featherLabel.style.cssText = brushSizeLabel.style.cssText;
        featherLabel.style.marginTop = '4px';
        
        this.brushFeather = 0; // 初始羽化值
        
        const featherSlider = document.createElement('input');
        featherSlider.type = 'range';
        featherSlider.min = '0';
        featherSlider.max = '20';
        featherSlider.value = this.brushFeather;
        featherSlider.style.cssText = brushSizeSlider.style.cssText;
        
        const featherValue = document.createElement('div');
        featherValue.textContent = this.brushFeather + 'px';
        featherValue.style.cssText = brushSizeValue.style.cssText;
        
        featherSlider.oninput = (e) => {
            this.brushFeather = parseInt(e.target.value);
            featherValue.textContent = this.brushFeather + 'px';
            if (this.canvas.isDrawingMode) {
                this.updateBrushFeather();
            }
        };
        
        brushSizeContainer.append(brushSizeLabel, brushSizeSlider, brushSizeValue);
        featherContainer.append(featherLabel, featherSlider, featherValue);
        brushSection.append(brushTitle, brushSizeContainer, featherContainer);
        
        sidebar.append(toolsContainer, colorSection, brushSection);
        
        // 设置工具事件处理
        this.setupOverlayToolEvents();
        
        return sidebar;
    }
    
    updateFillModeButtons(filledBtn, outlineBtn) {
        filledBtn.style.border = `1px solid ${this.fillMode === 'filled' ? '#22c55e' : 'rgba(255, 255, 255, 0.2)'}`;
        filledBtn.style.background = this.fillMode === 'filled' ? 'linear-gradient(145deg, #22c55e, #16a34a)' : 'rgba(255, 255, 255, 0.05)';
        filledBtn.style.color = this.fillMode === 'filled' ? 'white' : '#e2e8f0';
        
        outlineBtn.style.border = `1px solid ${this.fillMode === 'outline' ? '#22c55e' : 'rgba(255, 255, 255, 0.2)'}`;
        outlineBtn.style.background = this.fillMode === 'outline' ? 'linear-gradient(145deg, #22c55e, #16a34a)' : 'rgba(255, 255, 255, 0.05)';
        outlineBtn.style.color = this.fillMode === 'outline' ? 'white' : '#e2e8f0';
        
        // // console.log(`[LRPG Canvas] 填充模式切换为: ${this.fillMode}`);
    }
    
    createStyledButton(text, color) {
        const button = document.createElement('button');
        button.textContent = text;
        button.style.cssText = `
            padding: 3px 8px;
            background: linear-gradient(145deg, ${color}, ${color}dd);
            border: none;
            color: white;
            border-radius: 4px;
            cursor: pointer;
            font-size: 10px;
            font-weight: 600;
            transition: all 0.2s ease;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            white-space: nowrap;
        `;
        button.onmouseover = () => {
            button.style.transform = 'translateY(-1px)';
            button.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
        };
        button.onmouseout = () => {
            button.style.transform = 'translateY(0)';
            button.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
        };
        return button;
    }

    selectTool(toolId, button) {
        if (this.currentTool === 'crop' && toolId !== 'crop' && this.cropMode && this.cropMode.isActive) {
            this.clearCropPath();
            this.cropMode.isActive = false;
            // // console.log('[LRPG Canvas] 退出裁切模式');
        }
        
        Object.entries(this.toolButtons).forEach(([id, btn]) => {
            if (id === toolId) {
                btn.style.border = '1px solid #22c55e';
                btn.style.background = 'linear-gradient(145deg, #22c55e, #16a34a)';
                btn.style.color = 'white';
                btn.style.boxShadow = '0 2px 6px rgba(34, 197, 94, 0.3)';
            } else {
                btn.style.border = '1px solid rgba(255, 255, 255, 0.2)';
                btn.style.background = 'rgba(255, 255, 255, 0.05)';
                btn.style.color = '#e2e8f0';
                btn.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.2)';
            }
        });
        
        this.currentTool = toolId;
        
        // 根据工具设置画布模式
        switch(toolId) {
            case 'select':
                this.canvas.isDrawingMode = false;
                this.canvas.selection = true;
                this.canvas.defaultCursor = 'default';
                this.addCustomMouseEvents(); // 选择工具需要自定义事件处理
                break;
                
            case 'freehand':
                this.removeCustomMouseEvents(); // 移除自定义事件监听器，让Fabric.js完全控制
                this.canvas.isDrawingMode = true;
                this.canvas.freeDrawingBrush.width = this.brushSize || 2;
                this.canvas.freeDrawingBrush.color = this.currentColor || '#ff0000';
                this.updateBrushFeather();
                this.canvas.selection = false;
                break;
                
            case 'crop':
                this.canvas.isDrawingMode = false;
                this.canvas.selection = false;
                this.canvas.defaultCursor = 'crosshair';
                this.addCustomMouseEvents(); // 裁切工具需要自定义事件处理
                this.initCropMode();
                break;
                
            default:
                this.canvas.isDrawingMode = false;
                this.canvas.selection = false;
                this.canvas.defaultCursor = 'crosshair';
                this.addCustomMouseEvents(); // 其他绘制工具需要自定义事件处理
                break;
        }
        
        // // console.log(`[LRPG Canvas] 已切换到工具: ${toolId}`);
    }
    
    // 裁切工具相关方法
    initCropMode() {
        // 初始化裁切模式
        this.cropMode = {
            isActive: true,
            points: [],
            lines: [],
            dots: [],
            tempLine: null,
            targetObject: null
        };
        
        this.clearCropPath();
        
        // 获取当前选中的对象作为裁切目标
        const activeObject = this.canvas.getActiveObject();
        if (activeObject && activeObject.type === 'image') {
            this.cropMode.targetObject = activeObject;
            // // console.log('[LRPG Canvas] 裁切目标已设置');
        } else {
            // // console.log('[LRPG Canvas] 请先选择一个图像进行裁切');
        }
        
        // // console.log('[LRPG Canvas] 裁切模式已激活 - 左键添加点，右键闭合裁切');
    }
    
    clearCropPath() {
        if (this.cropMode) {
            this.cropMode.lines.forEach(line => this.canvas.remove(line));
            this.cropMode.dots.forEach(dot => this.canvas.remove(dot));
            if (this.cropMode.tempLine) {
                this.canvas.remove(this.cropMode.tempLine);
            }
            this.cropMode.points = [];
            this.cropMode.lines = [];
            this.cropMode.dots = [];
            this.cropMode.tempLine = null;
        }
        this.canvas.renderAll();
    }
    
    addCropPoint(point) {
        // 添加裁切点
        this.cropMode.points.push(point);
        
        // 创建控制点视觉表示
        const dot = new fabric.Circle({
            left: point.x - 4,
            top: point.y - 4,
            radius: 4,
            fill: '#00ff00',
            stroke: '#ffffff',
            strokeWidth: 2,
            selectable: false,
            evented: false,
            excludeFromExport: true
        });
        this.canvas.add(dot);
        this.cropMode.dots.push(dot);
        
        // 如果有多个点，绘制连线
        if (this.cropMode.points.length > 1) {
            const prevPoint = this.cropMode.points[this.cropMode.points.length - 2];
            const line = new fabric.Line(
                [prevPoint.x, prevPoint.y, point.x, point.y],
                {
                    stroke: '#00ff00',
                    strokeWidth: 2,
                    selectable: false,
                    evented: false,
                    excludeFromExport: true
                }
            );
            this.canvas.add(line);
            this.cropMode.lines.push(line);
        }
        
        this.canvas.renderAll();
    }
    
    closeCropPath() {
        // 闭合裁切路径
        if (this.cropMode.points.length < 3) {
            alert('至少需要3个点才能创建裁切区域');
            return;
        }
        
        if (this.cropMode.tempLine) {
            this.canvas.remove(this.cropMode.tempLine);
            this.cropMode.tempLine = null;
        }
        
        // 绘制闭合线
        const firstPoint = this.cropMode.points[0];
        const lastPoint = this.cropMode.points[this.cropMode.points.length - 1];
        const closingLine = new fabric.Line(
            [lastPoint.x, lastPoint.y, firstPoint.x, firstPoint.y],
            {
                stroke: '#00ff00',
                strokeWidth: 2,
                selectable: false,
                evented: false,
                excludeFromExport: true
            }
        );
        this.canvas.add(closingLine);
        this.cropMode.lines.push(closingLine);
        
        // 执行裁切
        this.executeCrop();
    }
    
    executeCrop() {
        if (!this.cropMode.targetObject) {
            // 如果没有预选目标，尝试找到裁切路径下的图像
            const objects = this.canvas.getObjects();
            for (let obj of objects) {
                if (obj.type === 'image' && !obj.excludeFromExport) {
                    this.cropMode.targetObject = obj;
                    break;
                }
            }
        }
        
        if (!this.cropMode.targetObject) {
            alert('没有找到可裁切的图像');
            this.clearCropPath();
            return;
        }
        
        // 创建裁切后的新图像
        const targetObj = this.cropMode.targetObject;
        
        // 计算裁切区域的边界框
        let minX = Math.min(...this.cropMode.points.map(p => p.x));
        let maxX = Math.max(...this.cropMode.points.map(p => p.x));
        let minY = Math.min(...this.cropMode.points.map(p => p.y));
        let maxY = Math.max(...this.cropMode.points.map(p => p.y));
        
        const cropWidth = maxX - minX;
        const cropHeight = maxY - minY;
        
        // 先保存裁切点数据
        const cropPoints = [...this.cropMode.points];
        
        // 只清理视觉元素，不清理点数据
        if (this.cropMode) {
            this.cropMode.lines.forEach(line => this.canvas.remove(line));
            this.cropMode.dots.forEach(dot => this.canvas.remove(dot));
            if (this.cropMode.tempLine) {
                this.canvas.remove(this.cropMode.tempLine);
            }
            this.cropMode.lines = [];
            this.cropMode.dots = [];
            this.cropMode.tempLine = null;
        }
        
        // 创建临时画布用于裁切
        const tempCanvas = document.createElement('canvas');
        const ctx = tempCanvas.getContext('2d', { alpha: true });
        
        // 设置临时画布大小为裁切区域大小
        tempCanvas.width = cropWidth;
        tempCanvas.height = cropHeight;
        
        // 清空画布，保持透明背景
        ctx.clearRect(0, 0, cropWidth, cropHeight);
        
        // 保存当前状态
        ctx.save();
        
        // 创建裁切路径（相对于裁切区域）
        ctx.beginPath();
        cropPoints.forEach((point, index) => {
            const x = point.x - minX;
            const y = point.y - minY;
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.closePath();
        ctx.clip();
        
        // 获取目标对象的实际渲染边界（包含所有变换）
        const objBounds = targetObj.getBoundingRect();
        
        // 计算图像在临时画布上的位置
        const imgX = objBounds.left - minX;
        const imgY = objBounds.top - minY;
        
        // 绘制目标对象 - 使用简单的方法，先设置位置再绘制
        ctx.save();
        
        // 移动到对象中心
        ctx.translate(imgX + objBounds.width/2, imgY + objBounds.height/2);
        
        // 应用旋转（如果有）
        if (targetObj.angle) {
            ctx.rotate(targetObj.angle * Math.PI / 180);
        }
        
        // 绘制图像，考虑缩放
        const img = targetObj.getElement();
        const scaleX = targetObj.scaleX || 1;
        const scaleY = targetObj.scaleY || 1;
        const drawWidth = targetObj.width * scaleX;
        const drawHeight = targetObj.height * scaleY;
        
        ctx.drawImage(img, -drawWidth/2, -drawHeight/2, drawWidth, drawHeight);
        
        ctx.restore();
        ctx.restore();
        
        // 获取裁切后的图像数据
        const croppedImageUrl = tempCanvas.toDataURL('image/png');
        
        // Debug crop information removed during cleanup
        
        // 创建新的fabric图像对象
        fabric.Image.fromURL(croppedImageUrl, (newImg) => {
            if (!newImg || !newImg.getElement()) {
                console.error('[LRPG Canvas] 裁切失败：无法创建新图像');
                alert('裁切失败，请重试');
                return;
            }
            
            newImg.set({
                left: minX,
                top: minY,
                selectable: true,
                evented: true,
                hasControls: true,
                hasBorders: true,
                name: `裁切图层 ${Date.now()}`
            });
            
            this.canvas.remove(targetObj);
            
            // 添加新图层
            this.canvas.add(newImg);
            this.canvas.setActiveObject(newImg);
            this.canvas.renderAll();
            
            // 退出裁切模式
            this.cropMode.isActive = false;
            this.selectTool('select', this.toolButtons['select']);
            
            if (this.layerPanel && this.layerPanel.isExpanded) {
                this.updateLayerList();
            }
            
            // 标记画布已改变
            this.markCanvasChanged();
            
            // console.log('[LRPG Canvas] 裁切完成，已生成新图层', {
            //     width: cropWidth,
            //     height: cropHeight,
            //     position: { x: minX, y: minY }
            // });
        }, {
            // 确保图像加载选项
            crossOrigin: 'anonymous'
        });
    }

    setupOverlayToolEvents() {
        // 保存事件处理器的引用，方便后续移除
        this.mouseDownHandler = (e) => this.handleMouseDown(e);
        this.mouseMoveHandler = (e) => this.handleMouseMove(e);
        this.mouseUpHandler = (e) => this.handleMouseUp(e);
        this.dblClickHandler = (e) => this.handleDoubleClick(e);
        
        // 添加自定义鼠标事件监听器
        this.addCustomMouseEvents();
        
        // 文字编辑完成事件
        this.canvas.on('text:editing:exited', (e) => {
            // // console.log('[LRPG Canvas] 文字编辑完成');
            this.markCanvasChanged();
        });
        
        // 添加右键事件处理（用于闭合裁切路径）
        this.canvas.wrapperEl.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (this.currentTool === 'crop' && this.cropMode && this.cropMode.isActive) {
                this.closeCropPath();
            }
        });
        
        // 监听对象变化事件，强制清除缓存
        this.canvas.on('object:added', () => {
            this.markCanvasChanged();
        });
        
        this.canvas.on('object:removed', () => {
            this.markCanvasChanged();
        });
        
        this.canvas.on('object:modified', () => {
            this.markCanvasChanged();
        });
    }

    // 添加自定义鼠标事件监听器
    addCustomMouseEvents() {
        if (!this.customEventsActive) {
            this.canvas.on('mouse:down', this.mouseDownHandler);
            this.canvas.on('mouse:move', this.mouseMoveHandler);
            this.canvas.on('mouse:up', this.mouseUpHandler);
            this.canvas.on('mouse:dblclick', this.dblClickHandler);
            this.customEventsActive = true;
            // console.log('[LRPG Canvas] 自定义鼠标事件已添加');
        }
    }

    // 移除自定义鼠标事件监听器
    removeCustomMouseEvents() {
        if (this.customEventsActive) {
            this.canvas.off('mouse:down', this.mouseDownHandler);
            this.canvas.off('mouse:move', this.mouseMoveHandler);
            this.canvas.off('mouse:up', this.mouseUpHandler);
            this.canvas.off('mouse:dblclick', this.dblClickHandler);
            this.customEventsActive = false;
            // console.log('[LRPG Canvas] 自定义鼠标事件已移除');
        }
    }

    handleMouseDown(e) {
        if (this.currentTool === 'select') {
            // 选择工具：完全交给Fabric.js处理
            return;
        }
        
        // 裁切模式处理
        if (this.currentTool === 'crop' && this.cropMode && this.cropMode.isActive) {
            const pointer = this.canvas.getPointer(e.e);
            this.addCropPoint(pointer);
            return;
        }
        
        if (e.target) {
            // 点击了现有对象：完全交给Fabric.js处理（选择/移动模式）
            return;
        }
        
        // 点击空白处：根据当前工具进行绘制
        const pointer = this.canvas.getPointer(e.e);
        
        this.updateDrawingOptions();
        
        switch(this.currentTool) {
            case 'rectangle':
                this.startDrawingShape(pointer, 'rect');
                break;
            case 'circle':
                this.startDrawingShape(pointer, 'circle');
                break;
            case 'text':
                this.createText(pointer);
                break;
        }
    }

    handleMouseMove(e) {
        const pointer = this.canvas.getPointer(e.e);
        
        // 裁切模式下显示预览线
        if (this.currentTool === 'crop' && this.cropMode && this.cropMode.isActive && this.cropMode.points.length > 0) {
            if (this.cropMode.tempLine) {
                this.canvas.remove(this.cropMode.tempLine);
            }
            
            // 创建新的预览线
            const lastPoint = this.cropMode.points[this.cropMode.points.length - 1];
            this.cropMode.tempLine = new fabric.Line(
                [lastPoint.x, lastPoint.y, pointer.x, pointer.y],
                {
                    stroke: '#ffff00',
                    strokeWidth: 1,
                    strokeDashArray: [5, 5],
                    selectable: false,
                    evented: false,
                    excludeFromExport: true
                }
            );
            this.canvas.add(this.cropMode.tempLine);
            this.canvas.renderAll();
        }
        
        if (this.isDrawing && this.drawingObject) {
            this.updateDrawingShape(pointer);
        }
    }

    handleMouseUp(e) {
        if (this.isDrawing && this.drawingObject) {
            this.finishDrawingShape();
        }
    }

    updateDrawingOptions() {
        if (this.fillMode === 'outline') {
            // 空心模式：无填充，只有轮廓
            this.drawingOptions = {
                fill: 'transparent',
                stroke: this.currentColor,
                strokeWidth: 2,
                opacity: 1.0
            };
        } else {
            // 填充模式：纯色填充，无边框
            this.drawingOptions = {
                fill: this.currentColor,
                stroke: null,
                strokeWidth: 0,
                opacity: 1.0
            };
        }
    }

    startDrawingShape(pointer, type) {
        this.isDrawing = true;
        this.startPoint = { x: pointer.x, y: pointer.y };
        
        if (type === 'rect') {
            this.drawingObject = new fabric.Rect({
                left: pointer.x,
                top: pointer.y,
                width: 1,
                height: 1,
                ...this.drawingOptions,
                selectable: false  // 绘制时不可选择
            });
        } else if (type === 'circle') {
            this.drawingObject = new fabric.Circle({
                left: pointer.x,
                top: pointer.y,
                radius: 1,
                ...this.drawingOptions,
                selectable: false  // 绘制时不可选择
            });
        }
        
        this.canvas.add(this.drawingObject);
        this.canvas.renderAll();
    }

    updateDrawingShape(pointer) {
        if (!this.drawingObject || !this.startPoint) return;
        
        const deltaX = pointer.x - this.startPoint.x;
        const deltaY = pointer.y - this.startPoint.y;
        
        if (this.drawingObject.type === 'rect') {
            this.drawingObject.set({
                left: deltaX > 0 ? this.startPoint.x : pointer.x,
                top: deltaY > 0 ? this.startPoint.y : pointer.y,
                width: Math.abs(deltaX),
                height: Math.abs(deltaY)
            });
        } else if (this.drawingObject.type === 'circle') {
            const radius = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / 2;
            this.drawingObject.set({
                left: this.startPoint.x - radius,
                top: this.startPoint.y - radius,
                radius: radius
            });
        }
        
        this.canvas.renderAll();
    }

    finishDrawingShape() {
        if (this.drawingObject) {
            this.drawingObject.set({ selectable: true });
            this.canvas.setActiveObject(this.drawingObject);
            this.canvas.renderAll();
        }
        
        this.isDrawing = false;
        this.startPoint = null;
        this.drawingObject = null;
    }

    createText(pointer) {
        // 更新绘制选项以获取当前颜色
        this.updateDrawingOptions();
        
        // 使用IText支持双击编辑，应用当前绘制选项
        const textOptions = {
            left: pointer.x,
            top: pointer.y,
            fontSize: 20,
            fontFamily: 'Arial, sans-serif',
            selectable: true,
            evented: true,
            opacity: 1.0
        };
        
        // 文字只使用填充色，不需要描边
        if (this.fillMode === 'outline') {
            // 空心模式对文字来说就是使用当前颜色填充
            textOptions.fill = this.currentColor || '#ff0000';
        } else {
            // 填充模式也是使用当前颜色填充
            textOptions.fill = this.currentColor || '#ff0000';
        }
        
        const text = new fabric.IText('双击编辑文字', textOptions);
        
        this.canvas.add(text);
        this.canvas.setActiveObject(text);
        this.canvas.renderAll();
        
        // 立即进入编辑模式
        setTimeout(() => {
            if (text && this.canvas.getActiveObject() === text) {
                text.enterEditing();
                text.selectAll();
            }
        }, 50);
        
        // // console.log('[LRPG Canvas] 创建文字对象，已进入编辑模式');
    }

    handleDoubleClick(e) {
        // 双击编辑文字对象
        if (e.target && (e.target.type === 'i-text' || e.target.type === 'text')) {
            // 确保是IText对象才能编辑
            if (e.target.type === 'i-text') {
                // // console.log('[LRPG Canvas] 双击进入文字编辑模式');
                this.canvas.setActiveObject(e.target);
                
                // 延迟进入编辑模式，确保选中状态稳定
                setTimeout(() => {
                    if (e.target.enterEditing) {
                        e.target.enterEditing();
                        e.target.selectAll();
                    }
                }, 100);
            } else {
                // // console.log('[LRPG Canvas] 此文字对象不支持编辑，请使用文字工具创建可编辑文字');
            }
        }
    }

    markCanvasChanged() {
        // // console.log('[LRPG Canvas] 画布内容已改变');
        
        // 发送画布变化通知到后端 - 完全复制lg_tools的做法
        if (this.node && this.node.id) {
            fetch('/lrpg_canvas_clear_cache', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    node_id: this.node.id.toString()
                })
            }).catch(err => {
                // // console.log('[LRPG Canvas] 清除缓存请求失败:', err.message);
            });
        }
    }

    showError(message) {
        const totalWidth = this.originalSize.width + CANVAS_SIZE.SIDEBAR_WIDTH;
        const totalHeight = this.originalSize.height + CANVAS_SIZE.TOOLBAR_HEIGHT;
        
        this.canvasContainer = document.createElement('div');
        this.canvasContainer.style.cssText = `
            position: relative;
            width: ${totalWidth}px;
            height: ${totalHeight}px;
            border: 2px solid var(--kontext-danger, #ef4444);
            border-radius: 12px;
            background: linear-gradient(135deg, #fee2e2, #fecaca);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #dc2626;
            font-size: 16px;
            text-align: center;
            padding: 24px;
            box-shadow: 0 8px 32px rgba(239, 68, 68, 0.2);
            backdrop-filter: blur(8px);
        `;
        this.canvasContainer.innerHTML = `
            <div style="text-align: center;">
                <div style="font-size: 32px; margin-bottom: 16px;">🚫</div>
                <div style="font-weight: 700; font-size: 18px; margin-bottom: 12px; color: #b91c1c;">LRPG Canvas 初始化失败</div>
                <div style="font-size: 14px; color: #dc2626; line-height: 1.5;">${message}</div>
                <div style="font-size: 12px; color: #7f1d1d; margin-top: 12px; opacity: 0.8;">请检查控制台获取更多信息</div>
            </div>
        `;
    }

    setupWebSocket() {
        // lrpg_canvas_update事件已移除，因为不再使用lrpg_data输入端口
        
        // 监听获取状态事件
        api.addEventListener("lrpg_canvas_get_state", async (event) => {
            const data = event.detail;
            if (data && data.node_id && data.node_id === this.node.id.toString()) {
                await this.sendCanvasState();
            }
        });
    }

    // updateCanvas和addLayers方法已移除，因为不再使用lrpg_data输入端口
    // 现在使用"从输入"功能和loadImageFromConnectedNode方法来加载图像

    setupDragAndDrop() {
        this.canvasContainer.addEventListener('dragenter', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.canvasContainer.classList.add('drag-over');
        });

        this.canvasContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
        });

        this.canvasContainer.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.target === this.canvasContainer) {
                this.canvasContainer.classList.remove('drag-over');
            }
        });

        this.canvasContainer.addEventListener('drop', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.canvasContainer.classList.remove('drag-over');

            const files = e.dataTransfer.files;
            if (files.length > 0) {
                const file = files[0];
                if (file.type.startsWith('image/')) {
                    await this.handleImageUpload(file, { center: true, autoScale: true });
                }
            }
        });

        // 添加现代化的拖放样式
        if (!document.getElementById('kontext-canvas-styles')) {
            const style = document.createElement('style');
            style.id = 'kontext-canvas-styles';
            style.textContent = `
                .kontext-canvas-container.drag-over::after {
                    content: '🎨 拖放图片到这里';
                    position: absolute;
                    top: ${CANVAS_SIZE.TOOLBAR_HEIGHT}px;
                    left: ${CANVAS_SIZE.SIDEBAR_WIDTH}px;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(135deg, rgba(34, 197, 94, 0.9), rgba(16, 163, 74, 0.9));
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 20px;
                    font-weight: 600;
                    pointer-events: none;
                    z-index: 1000;
                    border-radius: 0 0 8px 0;
                    backdrop-filter: blur(8px);
                    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
                    animation: pulse 2s infinite;
                }
                
                @keyframes pulse {
                    0%, 100% { opacity: 0.9; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.02); }
                }
                
                /* ComfyUI主题适配 */
                :root {
                    --kontext-primary: #22c55e;
                    --kontext-primary-hover: #16a34a;
                    --kontext-secondary: #3b82f6;
                    --kontext-danger: #ef4444;
                    --kontext-bg-primary: #2a2a2a;
                    --kontext-bg-secondary: #1e1e1e;
                    --kontext-text: #e2e8f0;
                    --kontext-border: #555;
                }
                
                .kontext-canvas-container {
                    transition: all 0.3s ease;
                }
                
                .kontext-canvas-container:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
                }
            `;
            document.head.appendChild(style);
        }
    }

    setupPaste() {
        // 剪贴板粘贴支持
        let canvasActive = false;
        
        this._pasteHandler = async (e) => {
            if (!canvasActive || !this.canvas) return;
            
            const items = e.clipboardData.items;
            for (let item of items) {
                if (item.type.startsWith('image/')) {
                    const file = item.getAsFile();
                    await this.handleImageUpload(file, { center: true, autoScale: true });
                    break;
                }
            }
        };
        
        document.addEventListener('paste', this._pasteHandler, true);
        
        this.canvasContainer.addEventListener('mousedown', () => {
            canvasActive = true;
        });
        
        document.addEventListener('mousedown', (e) => {
            if (!this.canvasContainer.contains(e.target)) {
                canvasActive = false;
            }
        });
    }

    /**
     * 初始化面部工具
     */
    initializeFaceTools() {
        try {
            // 创建面部工具UI实例，传入canvas实例引用
            this.faceToolsUI = new FaceToolsUI(this.canvas, this.canvasContainer, this);
            console.log('[LRPG Canvas] Face tools initialized successfully');
        } catch (error) {
            console.warn('[LRPG Canvas] Failed to initialize face tools:', error);
            // 面部工具初始化失败不应影响主要功能
        }
    }

    /**
     * 销毁面部工具
     */
    destroyFaceTools() {
        if (this.faceToolsUI) {
            this.faceToolsUI.destroy();
            this.faceToolsUI = null;
        }
    }

    setupEventListeners() {
        // 添加键盘事件监听器
        this.setupKeyboardListeners();
        
        // 添加滚轮缩放
        this.canvas.on('mouse:wheel', (opt) => {
            const delta = opt.e.deltaY;
            const activeObject = this.canvas.getActiveObject();
            
            if (activeObject) {
                let scale = activeObject.scaleX;

                if (delta < 0) {
                    scale *= 1.1; // 放大
                } else {
                    scale *= 0.9; // 缩小
                }

                // 限制缩放范围
                scale = Math.min(Math.max(scale, 0.01), 10);

                activeObject.scale(scale);
                this.canvas.renderAll();

                
                opt.e.preventDefault();
                opt.e.stopPropagation();
            }
        });
        
        // 监听对象添加事件，更新图层列表
        this.canvas.on('object:added', () => {
            if (this.layerPanel && this.layerPanel.isExpanded) {
                this.updateLayerList();
            }
        });
        
        // 监听对象移除事件，更新图层列表
        this.canvas.on('object:removed', () => {
            if (this.layerPanel && this.layerPanel.isExpanded) {
                this.updateLayerList();
            }
        });
        
        // 监听选择变化事件，更新图层列表高亮
        this.canvas.on('selection:created', () => {
            if (this.layerPanel && this.layerPanel.isExpanded) {
                this.updateLayerList();
            }
        });
        
        this.canvas.on('selection:updated', () => {
            if (this.layerPanel && this.layerPanel.isExpanded) {
                this.updateLayerList();
            }
        });
        
        this.canvas.on('selection:cleared', () => {
            if (this.layerPanel && this.layerPanel.isExpanded) {
                this.updateLayerList();
            }
        });
    }

    async handleImageUpload(file, options = { center: true, autoScale: true }) {
        try {
            const reader = new FileReader();
            
            const imageLoadPromise = new Promise((resolve, reject) => {
                reader.onload = (e) => {
                    const dataUrl = e.target.result;
                    resolve(dataUrl);
                };
                reader.onerror = reject;
            });
    
            reader.readAsDataURL(file);
            const imageData = await imageLoadPromise;
    
            // 使用标准的Fabric.js图片加载方式
            fabric.Image.fromURL(imageData, (img) => {
                if (options.center && options.autoScale) {
                    // // console.log('[LRPG Canvas] 添加前景图片（居中并缩放）');
                    // 计算适合画布的缩放比例
                    const scale = Math.min(
                        this.originalSize.width / img.width * 0.8, // 稍微小一点，不要占满整个画布
                        this.originalSize.height / img.height * 0.8
                    );
                    
                    // 计算居中位置
                    const canvasCenter = this.canvas.getCenter();
                    img.set({
                        scaleX: scale,
                        scaleY: scale,
                        left: canvasCenter.left,
                        top: canvasCenter.top,
                        originX: 'center',
                        originY: 'center',
                        isBackground: false,
                        selectable: true,
                        opacity: 1.0
                    });
                    
                    // 添加到画布
                    this.canvas.add(img);
                } else {
                    // // console.log('[LRPG Canvas] 添加前景图片（原始位置）');
                    // 不进行居中和缩放，使用原始尺寸和位置
                    img.set({
                        left: 50, // 稍微偏移一点，避免与左上角重叠
                        top: 50,
                        originX: 'left',
                        originY: 'top',
                        isBackground: false,
                        selectable: true,
                        opacity: 1.0
                    });
                    
                    // 添加到画布
                    this.canvas.add(img);
                }

                this.canvas.setActiveObject(img);
                this.canvas.renderAll();
                
                // 重要：通知画布内容已改变
                this.markCanvasChanged();
                
                // // console.log(`[LRPG Canvas] 图片上传成功，当前画布对象数量: ${this.canvas.getObjects().length}`);
            });
    
        } catch (error) {
            console.error('[LRPG Canvas] 图片上传失败:', error);
            alert('图片上传失败，请重试');
        }
    }

    async sendCanvasState() {
        if (!this.canvas) return;
        
        // 防重复执行机制 - 关键修复
        if (this.isSendingData) {
            // // console.log('[LRPG Canvas] 数据发送中，跳过重复请求');
            return;
        }
        
        this.isSendingData = true;
        
        try {
            // 确保画布完全渲染后再导出 - 关键修复
            await new Promise(resolve => {
                this.canvas.renderAll();
                requestAnimationFrame(() => {
                    setTimeout(resolve, 50); // 额外50ms确保渲染完成
                });
            });
            
            const layer_transforms = this.extractTransformData();
            
            // 获取画布图像数据（包含背景）
            const canvasDataURL = this.canvas.toDataURL({
                format: 'png',
                quality: 1.0,
                multiplier: 1,
                withoutBackground: false  // 包含背景
            });
            
            // 转换为字节数组
            const base64Data = canvasDataURL.split(',')[1];
            const binaryData = atob(base64Data);
            const uint8Array = new Uint8Array(binaryData.length);
            
            for (let i = 0; i < binaryData.length; i++) {
                uint8Array[i] = binaryData.charCodeAt(i);
            }

            const response = await fetch('/lrpg_canvas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    node_id: this.node.id.toString(),
                    layer_transforms: layer_transforms,
                    main_image: Array.from(uint8Array),
                    main_mask: null
                })
            });

            if (response.ok) {
                // // console.log('[LRPG Canvas] 数据发送成功');
            } else {
                console.error('[LRPG Canvas] 数据发送失败:', response.statusText);
            }
        } catch (error) {
            console.error('[LRPG Canvas] 发送数据时出错:', error);
        } finally {
            // 确保标志被重置
            this.isSendingData = false;
        }
    }

    extractTransformData() {
        const objects = this.canvas.getObjects();
        const layer_transforms = {
            background: {
                width: this.originalSize.width,
                height: this.originalSize.height
            }
        };

        objects.forEach((obj, index) => {
            const objId = `object_${Date.now()}_${index}`;
            
            // LRPG核心：使用getCenterPoint获取精确坐标
            const centerPoint = obj.getCenterPoint();
            
            layer_transforms[objId] = {
                type: 'image',
                centerX: centerPoint.x,
                centerY: centerPoint.y,
                scaleX: obj.scaleX || 1,
                scaleY: obj.scaleY || 1,
                angle: obj.angle || 0,
                width: obj.width || 100,
                height: obj.height || 100,
                flipX: obj.flipX || false,
                flipY: obj.flipY || false,
                visible: obj.visible !== false, // 默认为true
                locked: obj.selectable === false, // locked状态通过selectable判断
                z_index: index, // 图层层级
                name: obj.name || `图层 ${index + 1}`, // 图层名称
                // 添加缩略图数据用于后续重构
                thumbnail: this.generateObjectThumbnailData(obj)
            };
        });

        return layer_transforms;
    }

    generateObjectThumbnailData(obj) {
        try {
            // 创建临时画布用于生成缩略图
            const tempCanvas = document.createElement('canvas');
            const ctx = tempCanvas.getContext('2d');
            
            // 设置缩略图尺寸
            const thumbSize = 64;
            tempCanvas.width = thumbSize;
            tempCanvas.height = thumbSize;
            
            // 获取对象边界
            const bounds = obj.getBoundingRect();
            const scale = Math.min(thumbSize / bounds.width, thumbSize / bounds.height);
            
            // 设置变换
            ctx.save();
            ctx.translate(thumbSize / 2, thumbSize / 2);
            ctx.scale(scale, scale);
            ctx.translate(-bounds.width / 2, -bounds.height / 2);
            
            // 渲染对象到缩略图
            if (obj.type === 'image') {
                const element = obj.getElement();
                if (element) {
                    ctx.drawImage(element, 0, 0, bounds.width, bounds.height);
                }
            }
            
            ctx.restore();
            
            // 返回base64数据
            return tempCanvas.toDataURL('image/png');
        } catch (e) {
            console.warn('生成缩略图失败:', e);
            return null;
        }
    }

    resizeCanvas(width, height) {
        const oldWidth = this.originalSize.width;
        const oldHeight = this.originalSize.height;
        
        // 计算缩放比例
        const scaleX = width / oldWidth;
        const scaleY = height / oldHeight;
        
        this.resizeBackground(width, height, scaleX, scaleY);
        
        this.canvas.setDimensions({ width, height });
        this.canvas.renderAll();
        
        this.currentSize.width = width;
        this.currentSize.height = height;
        this.originalSize.width = width;
        this.originalSize.height = height;
        
        // 计算显示尺寸（应用最大显示限制）
        const scaledSize = this.calculateScaledSize(width, height, this.maxDisplaySize);
        
        // LRPG方式：更新canvas尺寸，让ComfyUI节点系统处理边界
        this.updateCanvasSize(scaledSize.width, scaledSize.height);
        
        if (this.node && this.node.canvasElement) {
            this.node.canvasElement.style.minWidth = `${scaledSize.width + CANVAS_SIZE.SIDEBAR_WIDTH}px`;
        }
        
        // 通知节点需要重新计算尺寸
        if (this.node && this.node.computeSize) {
            const newSize = this.node.computeSize();
            this.node.size = newSize;
            this.node.setDirtyCanvas(true, true);
            
            // 强制重新布局 - 延迟执行确保DOM更新完成
            requestAnimationFrame(() => {
                if (this.node.graph && this.node.graph.change) {
                    this.node.graph.change();
                }
                // 再次设置脏标记确保重绘
                this.node.setDirtyCanvas(true, true);
            });
        }
        
        // // console.log(`[LRPG Canvas] 画布尺寸已调整为: ${width}x${height}, 显示尺寸: ${scaledSize.width}x${scaledSize.height}, 节点尺寸: [${this.node.size[0]}, ${this.node.size[1]}]`);
    }

    // 动态更新显示尺寸限制
    updateDisplayScale(maxSize) {
        this.maxDisplaySize = maxSize;
        if (this.originalSize?.width && this.originalSize?.height) {
            const scaledSize = this.calculateScaledSize(
                this.originalSize.width, 
                this.originalSize.height, 
                maxSize
            );
            
            this.updateCanvasSize(scaledSize.width, scaledSize.height);
            
            // 确保画布完全重新渲染
            this.canvas.renderAll();
            
            // // console.log(`[LRPG Canvas] 最大显示尺寸已更新为: ${maxSize}px, 当前显示尺寸: ${scaledSize.width}x${scaledSize.height}`);
        }
    }

    resizeBackground(newWidth, newHeight, scaleX, scaleY) {
        const objects = this.canvas.getObjects();
        
        objects.forEach(obj => {
            // 如果是背景图像（通常是最底层的图像对象）
            if (obj.type === 'image' && obj.isBackground) {
                obj.set({
                    left: obj.left * scaleX,
                    top: obj.top * scaleY,
                    scaleX: obj.scaleX * scaleX,
                    scaleY: obj.scaleY * scaleY
                });
                
                // 如果背景图像需要拉伸以适应新尺寸
                if (obj.stretchToFit) {
                    obj.set({
                        scaleX: newWidth / (obj.width * obj.scaleX),
                        scaleY: newHeight / (obj.height * obj.scaleY)
                    });
                }
            }
        });
        
        // 如果画布有背景颜色，确保它正确填充
        if (this.canvas.backgroundColor) {
            this.canvas.renderAll();
        }
    }

    // 更新画笔羽化效果
    updateBrushFeather() {
        if (!this.canvas.isDrawingMode) return;
        
        const brushSize = this.brushSize || 2;
        const featherValue = this.brushFeather || 0;
        const color = this.currentColor || '#ff0000';
        
        // 创建标准画笔，不重写任何方法
        const brush = new fabric.PencilBrush(this.canvas);
        brush.width = brushSize;
        brush.color = color;
        
        this.canvas.freeDrawingBrush = brush;
        
        // 移除之前的监听器
        if (this._pathCreatedHandler) {
            this.canvas.off('path:created', this._pathCreatedHandler);
            this.canvas.off('object:added', this._pathCreatedHandler);
            this._pathCreatedHandler = null;
        }
        
        // 如果有羽化值，添加真正的羽化效果
        if (featherValue > 0) {
            this._pathCreatedHandler = (e) => {
                console.log(`[画笔羽化] 原始事件对象:`, e);
                
                // 尝试多种方式获取路径对象
                let pathObject = null;
                if (e.path) {
                    pathObject = e.path;
                } else if (e.target) {
                    pathObject = e.target;
                } else if (e && e.type === 'path') {
                    pathObject = e;
                }
                
                if (pathObject && pathObject.type === 'path') {
                    try {
                        console.log(`[画笔羽化] 开始应用真正的羽化效果，羽化值: ${featherValue}px`);
                        
                        // 移除原有的阴影效果
                        pathObject.set('shadow', null);
                        
                        // 获取原始路径数据
                        const originalPath = pathObject.path;
                        const originalStrokeWidth = pathObject.strokeWidth || brushSize;
                        
                        // 创建精细的多层羽化效果
                        const featherLayers = Math.min(15, Math.max(8, Math.floor(featherValue / 1.5))); // 8-15层，更细腻
                        
                        // 高斯分布函数，用于计算更自然的透明度
                        const gaussianOpacity = (distance, sigma) => {
                            return Math.exp(-(distance * distance) / (2 * sigma * sigma));
                        };
                        
                        const sigma = featherValue / 3; // 控制羽化的衰减速度
                        
                        for (let i = featherLayers - 1; i >= 0; i--) {
                            const distance = (i + 1) * featherValue / featherLayers; // 距离中心的距离
                            const layerWidth = originalStrokeWidth + distance * 2; // 宽度线性增加
                            
                            // 使用高斯分布计算透明度，使边缘更自然
                            let layerOpacity = gaussianOpacity(distance, sigma) * 0.9;
                            
                            // 为最外层添加额外的衰减
                            if (i < featherLayers * 0.3) {
                                layerOpacity *= (i / (featherLayers * 0.3)) * 0.7;
                            }
                            
                            // 确保透明度在合理范围内
                            layerOpacity = Math.max(0.02, Math.min(0.9, layerOpacity));
                            
                            // 创建羽化层路径
                            const featherPath = new fabric.Path(originalPath, {
                                stroke: color,
                                strokeWidth: layerWidth,
                                fill: 'transparent',
                                opacity: layerOpacity,
                                strokeLineCap: 'round',
                                strokeLineJoin: 'round',
                                selectable: false,
                                evented: false
                            });
                            
                            // 将羽化层添加到画布，但要在原路径下方
                            this.canvas.insertAt(featherPath, this.canvas.getObjects().indexOf(pathObject), false);
                        }
                        
                        // 调整原始路径到最上层，确保清晰的中心线条
                        pathObject.set({
                            strokeWidth: originalStrokeWidth,
                            opacity: 1
                        });
                        this.canvas.bringToFront(pathObject);
                        
                        this.canvas.renderAll();
                        console.log(`[画笔羽化] 真正的羽化效果已应用: ${featherLayers}层, 羽化值: ${featherValue}px`);
                    } catch (error) {
                        console.error('[画笔羽化] 应用羽化效果时出错:', error);
                    }
                } else {
                    console.log(`[画笔羽化] 未找到有效的路径对象`);
                }
            };
            
            this.canvas.on('path:created', this._pathCreatedHandler);
            console.log(`[画笔] 画笔设置完成，羽化值: ${featherValue}px`);
        } else {
            console.log('[画笔] 画笔设置完成，无羽化效果');
        }
    }

    getImageSizeFromInput(widthInput, heightInput) {
        // // console.log('[LRPG Canvas] 开始从输入端口获取图像尺寸');
        
        if (!this.node || !this.node.graph) {
            console.warn('[LRPG Canvas] 节点或图形对象不可用');
            return;
        }

        // 查找连接到image输入端口的节点
        const imageInputSlot = this.node.inputs?.find(input => input.name === 'image');
        if (!imageInputSlot || !imageInputSlot.link) {
            console.warn('[LRPG Canvas] 未找到连接的image输入端口');
            alert('请先连接一个图像输入节点');
            return;
        }

        // 获取连接的链接
        const link = this.node.graph.links[imageInputSlot.link];
        if (!link) {
            console.warn('[LRPG Canvas] 未找到有效的输入链接');
            return;
        }

        // 获取连接的源节点
        const sourceNodeId = link.origin_id;
        const sourceNode = this.node.graph.getNodeById(sourceNodeId);
        if (!sourceNode) {
            console.warn('[LRPG Canvas] 未找到源节点');
            return;
        }

        // // console.log(`[LRPG Canvas] 找到源节点: ${sourceNode.type} (ID: ${sourceNodeId})`);

        // 提取图像尺寸
        const dimensions = this.extractImageSizeFromNode(sourceNode);
        if (dimensions) {
            const { width, height } = dimensions;
            // // console.log(`[LRPG Canvas] 从节点获取到尺寸: ${width}x${height}`);
            
            widthInput.value = width;
            heightInput.value = height;
            
            // 自动应用新尺寸并加载连接的图像
            if (confirm(`检测到图像尺寸为 ${width}x${height}，是否应用新尺寸并加载连接的图像？`)) {
                // 清空画布内容
                this.canvas.clear();
                this.canvas.backgroundColor = '#ffffff';
                this.canvas.renderAll();
                
                // 应用新尺寸
                this.resizeCanvas(width, height);
                
                // 加载连接的图像到画布
                this.loadImageFromConnectedNode(sourceNode);
                
                // // console.log(`[LRPG Canvas] 已应用新尺寸: ${width}x${height}`);
            }
        } else {
            console.warn('[LRPG Canvas] 无法从连接的节点获取图像尺寸');
            alert('无法从连接的节点获取图像尺寸，请检查连接的节点类型');
        }
    }

    extractImageSizeFromNode(node) {
        // // console.log(`[LRPG Canvas] 正在分析节点类型: ${node.type}`);
        
        // 处理不同类型的节点
        switch (node.type) {
            case 'LoadImage':
            case 'LoadImageMask':
                return this.extractFromLoadImageNode(node);
            
            case 'EmptyLatentImage':
                return this.extractFromEmptyLatentNode(node);
                
            case 'VAEDecode':
            case 'VAEDecodeAudio':
                return this.extractFromVAEDecodeNode(node);
                
            // 常见的图像生成节点
            case 'KSampler':
            case 'KSamplerAdvanced':
            case 'SamplerCustom':
                return this.extractFromSamplerNode(node);
                
            // Flux相关节点
            case 'FluxSampler':
            case 'APIFluxKontextEnhancer':
                return this.extractFromFluxNode(node);
                
            // 图像处理节点
            case 'ImageResize':
            case 'ImageScale':
            case 'ImageScaleBy':
                return this.extractFromImageProcessNode(node);
                
            default:
                // 尝试通用方法
                return this.extractFromGenericNode(node);
        }
    }

    extractFromLoadImageNode(node) {
        // LoadImage节点通常将图像信息存储在properties中
        if (node.properties && node.properties.image_info) {
            const info = node.properties.image_info;
            if (info.width && info.height) {
                return { width: info.width, height: info.height };
            }
        }
        
        if (node.widgets) {
            const imageWidget = node.widgets.find(w => w.name === 'image');
            if (imageWidget && imageWidget.value) {
                // // console.log('[LRPG Canvas] LoadImage节点检测到选中图像:', imageWidget.value);
                
                // 尝试从选项中获取尺寸信息（如果options是数组）
                if (imageWidget.options && Array.isArray(imageWidget.options)) {
                    const imageInfo = imageWidget.options.find(opt => opt.includes && opt.includes('x'));
                    if (imageInfo) {
                        const match = imageInfo.match(/(\d+)x(\d+)/);
                        if (match) {
                            return { width: parseInt(match[1]), height: parseInt(match[2]) };
                        }
                    }
                }
                
                // 尝试从图像文件名中提取尺寸信息
                if (typeof imageWidget.value === 'string') {
                    const match = imageWidget.value.match(/(\d+)x(\d+)/);
                    if (match) {
                        return { width: parseInt(match[1]), height: parseInt(match[2]) };
                    }
                }
            }
        }
        
        // 尝试从图像加载历史中获取尺寸信息
        if (node.imgs && node.imgs.length > 0) {
            const img = node.imgs[0];
            if (img && img.naturalWidth && img.naturalHeight) {
                // // console.log(`[LRPG Canvas] LoadImage从DOM图像获取尺寸: ${img.naturalWidth}x${img.naturalHeight}`);
                return { width: img.naturalWidth, height: img.naturalHeight };
            }
        }
        
        // // console.log('[LRPG Canvas] LoadImage节点暂不支持自动尺寸检测，请手动设置');
        return null;
    }

    extractFromEmptyLatentNode(node) {
        // EmptyLatentImage节点的width和height widget
        if (node.widgets) {
            const widthWidget = node.widgets.find(w => w.name === 'width');
            const heightWidget = node.widgets.find(w => w.name === 'height');
            
            if (widthWidget && heightWidget) {
                return {
                    width: widthWidget.value || 512,
                    height: heightWidget.value || 512
                };
            }
        }
        
        // 默认尺寸
        return { width: 512, height: 512 };
    }

    extractFromVAEDecodeNode(node) {
        // VAEDecode节点需要追溯到其latent输入
        if (node.inputs) {
            const latentInput = node.inputs.find(input => input.name === 'samples');
            if (latentInput && latentInput.link) {
                const link = this.node.graph.links[latentInput.link];
                if (link) {
                    const sourceNode = this.node.graph.getNodeById(link.origin_id);
                    if (sourceNode) {
                        return this.extractImageSizeFromNode(sourceNode);
                    }
                }
            }
        }
        
        return null;
    }

    extractFromSamplerNode(node) {
        // Sampler节点需要追溯到其latent_image输入
        if (node.inputs) {
            const latentInput = node.inputs.find(input => 
                input.name === 'latent_image' || input.name === 'latent'
            );
            if (latentInput && latentInput.link) {
                const link = this.node.graph.links[latentInput.link];
                if (link) {
                    const sourceNode = this.node.graph.getNodeById(link.origin_id);
                    if (sourceNode) {
                        return this.extractImageSizeFromNode(sourceNode);
                    }
                }
            }
        }
        
        return null;
    }

    extractFromFluxNode(node) {
        // Flux节点通常有width和height参数
        if (node.widgets) {
            const widthWidget = node.widgets.find(w => 
                w.name === 'width' || w.name === 'resolution_width'
            );
            const heightWidget = node.widgets.find(w => 
                w.name === 'height' || w.name === 'resolution_height'
            );
            
            if (widthWidget && heightWidget) {
                return {
                    width: widthWidget.value || 1024,
                    height: heightWidget.value || 1024
                };
            }
        }
        
        return { width: 1024, height: 1024 }; // Flux默认尺寸
    }

    extractFromImageProcessNode(node) {
        // 图像处理节点，追溯到输入图像
        if (node.inputs) {
            const imageInput = node.inputs.find(input => input.name === 'image');
            if (imageInput && imageInput.link) {
                const link = this.node.graph.links[imageInput.link];
                if (link) {
                    const sourceNode = this.node.graph.getNodeById(link.origin_id);
                    if (sourceNode) {
                        return this.extractImageSizeFromNode(sourceNode);
                    }
                }
            }
        }
        
        if (node.widgets) {
            const widthWidget = node.widgets.find(w => w.name === 'width');
            const heightWidget = node.widgets.find(w => w.name === 'height');
            
            if (widthWidget && heightWidget) {
                return {
                    width: widthWidget.value || 512,
                    height: heightWidget.value || 512
                };
            }
        }
        
        return null;
    }

    extractFromGenericNode(node) {
        // 通用方法：寻找常见的尺寸参数
        if (node.widgets) {
            // 寻找width和height widgets
            const widthWidget = node.widgets.find(w => 
                w.name === 'width' || w.name === 'w' || 
                w.name === 'resolution_width' || w.name === 'image_width'
            );
            const heightWidget = node.widgets.find(w => 
                w.name === 'height' || w.name === 'h' || 
                w.name === 'resolution_height' || w.name === 'image_height'
            );
            
            if (widthWidget && heightWidget) {
                return {
                    width: widthWidget.value || 512,
                    height: heightWidget.value || 512
                };
            }
        }
        
        // 尝试追溯输入链接
        if (node.inputs) {
            const imageInput = node.inputs.find(input => 
                input.name === 'image' || input.name === 'images' || 
                input.name === 'latent' || input.name === 'samples'
            );
            if (imageInput && imageInput.link) {
                const link = this.node.graph.links[imageInput.link];
                if (link) {
                    const sourceNode = this.node.graph.getNodeById(link.origin_id);
                    if (sourceNode) {
                        // 递归查找，但限制深度避免无限循环
                        return this.extractImageSizeFromNode(sourceNode);
                    }
                }
            }
        }
        
        // // console.log(`[LRPG Canvas] 未知节点类型，无法提取尺寸: ${node.type}`);
        return null;
    }

    loadImageFromConnectedNode(sourceNode) {
        // // console.log(`[LRPG Canvas] 开始从连接节点加载图像: ${sourceNode.type} (ID: ${sourceNode.id})`);
        
        switch (sourceNode.type) {
            case 'LoadImage':
            case 'LoadImageMask':
                this.loadFromLoadImageNode(sourceNode);
                break;
                
            default:
                // // console.log(`[LRPG Canvas] 暂不支持从 ${sourceNode.type} 节点加载图像`);
                // 尝试通用方法
                this.loadFromGenericImageNode(sourceNode);
                break;
        }
    }

    loadFromLoadImageNode(node) {
        // 方法1：从DOM图像元素获取
        if (node.imgs && node.imgs.length > 0) {
            const domImg = node.imgs[0];
            if (domImg && domImg.src) {
                // // console.log(`[LRPG Canvas] 从LoadImage节点的DOM元素加载图像: ${domImg.src.substring(0, 50)}...`);
                
                fabric.Image.fromURL(domImg.src, (fabricImg) => {
                    // 设置为背景图像，使用原始canvas尺寸（实际分辨率）
                    fabricImg.set({
                        left: 0,
                        top: 0,
                        scaleX: this.originalSize.width / fabricImg.width,
                        scaleY: this.originalSize.height / fabricImg.height,
                        originX: 'left',
                        originY: 'top',
                        isBackground: true,
                        stretchToFit: true,
                        selectable: false,  // 背景图像不可选择
                        evented: false     // 背景图像不响应事件
                    });
                    
                    // 清空画布并添加背景图像
                    this.canvas.clear();
                    this.canvas.add(fabricImg);
                    this.canvas.sendToBack(fabricImg);
                    this.canvas.renderAll();
                    
                    // // console.log(`[LRPG Canvas] 背景图像已加载并填满画布（原始分辨率: ${this.originalSize.width}x${this.originalSize.height}）`);
                }, {
                    crossOrigin: 'anonymous'
                });
                return;
            }
        }

        // 方法2：从widget值获取图像路径
        if (node.widgets) {
            const imageWidget = node.widgets.find(w => w.name === 'image');
            if (imageWidget && imageWidget.value) {
                // // console.log(`[LRPG Canvas] 从LoadImage节点的widget获取图像: ${imageWidget.value}`);
                
                // 构建图像URL（假设使用ComfyUI的标准图像服务）
                const imageUrl = `/view?filename=${encodeURIComponent(imageWidget.value)}&subfolder=&type=input`;
                
                fabric.Image.fromURL(imageUrl, (fabricImg) => {
                    // 设置为背景图像，完全填满画布
                    fabricImg.set({
                        left: 0,
                        top: 0,
                        scaleX: this.originalSize.width / fabricImg.width,
                        scaleY: this.originalSize.height / fabricImg.height,
                        originX: 'left',
                        originY: 'top',
                        isBackground: true,
                        stretchToFit: true,
                        selectable: false,
                        evented: false
                    });
                    
                    // 清空画布并添加背景图像
                    this.canvas.clear();
                    this.canvas.add(fabricImg);
                    this.canvas.sendToBack(fabricImg);
                    this.canvas.renderAll();
                    
                    // // console.log(`[LRPG Canvas] 背景图像已从文件加载并填满画布: ${imageWidget.value}`);
                }, {
                    crossOrigin: 'anonymous'
                });
                return;
            }
        }

        // // console.log(`[LRPG Canvas] LoadImage节点没有可用的图像数据`);
    }

    loadFromGenericImageNode(node) {
        // // console.log(`[LRPG Canvas] 尝试从通用图像节点加载: ${node.type}`);
        
        if (node.imgs && node.imgs.length > 0) {
            const domImg = node.imgs[0];
            if (domImg && domImg.src) {
                // // console.log(`[LRPG Canvas] 从通用节点的DOM元素加载图像`);
                
                fabric.Image.fromURL(domImg.src, (fabricImg) => {
                    // 设置为背景图像，完全填满画布
                    fabricImg.set({
                        left: 0,
                        top: 0,
                        scaleX: this.originalSize.width / fabricImg.width,
                        scaleY: this.originalSize.height / fabricImg.height,
                        originX: 'left',
                        originY: 'top',
                        isBackground: true,
                        stretchToFit: true,
                        selectable: false,
                        evented: false
                    });
                    
                    this.canvas.clear();
                    this.canvas.add(fabricImg);
                    this.canvas.sendToBack(fabricImg);
                    this.canvas.renderAll();
                    
                    // // console.log(`[LRPG Canvas] 通用节点图像已加载并填满画布`);
                }, {
                    crossOrigin: 'anonymous'
                });
                return;
            }
        }
        
        // // console.log(`[LRPG Canvas] 通用节点没有可用的图像数据`);
    }

    cleanup() {
        if (this.canvas) {
            this.canvas.dispose();
        }
        if (this._pasteHandler) {
            document.removeEventListener('paste', this._pasteHandler, true);
        }
        if (this._keydownHandler) {
            document.removeEventListener('keydown', this._keydownHandler);
        }
    }
}

// LRPG风格的简化工具栏已在LRPGCanvas类中实现，移除了厚重的ControlPanel类

// 注册ComfyUI节点
app.registerExtension({
    name: "LRPG.Canvas",
    async beforeRegisterNodeDef(nodeType, nodeData) {
        if (nodeData.name === "LRPGCanvas") {           
            const onNodeCreated = nodeType.prototype.onNodeCreated;
            
            nodeType.prototype.onNodeCreated = function() {
                const result = onNodeCreated?.apply(this, arguments);
                
                return result;
            };
            
            nodeType.prototype.onAdded = function() {
                if (this.id !== undefined && this.id !== -1) {
                    // 从本地存储获取保存的尺寸
                    const STORAGE_KEY = 'kontext_canvas_size_';
                    const savedSize = localStorage.getItem(STORAGE_KEY + this.id);
                    const size = savedSize ? JSON.parse(savedSize) : {
                        width: CANVAS_SIZE.WIDTH,
                        height: CANVAS_SIZE.HEIGHT
                    };
            
                    // lg_tools方式创建DOM元素
                    const element = document.createElement("div");
                    element.style.position = "relative";
                    element.style.width = "100%";
                    element.style.height = "100%";  // lg_tools方式：让ComfyUI控制大小
                    // // console.log('[LRPG Canvas] onAdded: element style set to 100% width/height');
                    
                    // 存储 element 引用
                    this.canvasElement = element;
                    
                    // 先创建画布实例
                    this.canvasInstance = new LRPGCanvas(this, size);
                    
                    // 计算缩放后的尺寸
                    const scaledSize = this.canvasInstance.calculateScaledSize(
                        size.width,
                        size.height,
                        this.canvasInstance.maxDisplaySize
                    );
                    
                    // lg_tools方式：只设置minSize作为约束
                    element.style.minWidth = `${scaledSize.width}px`;
                    element.style.minHeight = `${scaledSize.height + CANVAS_SIZE.TOOLBAR_HEIGHT}px`;
                    // // console.log(`[LRPG Canvas] onAdded: element minSize set to ${scaledSize.width}x${scaledSize.height + CANVAS_SIZE.TOOLBAR_HEIGHT}`);
                    
                    // lg_tools方式：computeSize与updateContainerSize保持一致
                    this.computeSize = () => {
                        const currentScaledSize = this.canvasInstance ? this.canvasInstance.calculateScaledSize(
                            this.canvasInstance.currentSize.width,
                            this.canvasInstance.currentSize.height,
                            this.canvasInstance.maxDisplaySize
                        ) : scaledSize;
                        
                        // 计算图层面板高度
                        const LAYER_PANEL_EXPANDED_HEIGHT = 250;
                        const LAYER_PANEL_COLLAPSED_HEIGHT = 35;
                        const layerPanelHeight = (this.canvasInstance && this.canvasInstance.layerPanel && this.canvasInstance.layerPanel.isExpanded) 
                            ? LAYER_PANEL_EXPANDED_HEIGHT 
                            : LAYER_PANEL_COLLAPSED_HEIGHT;
                        
                        // 计算面部工具面板高度
                        const FACE_PANEL_EXPANDED_HEIGHT = 380; // 面板展开时的高度（包含手动微调部分）
                        const FACE_PANEL_COLLAPSED_HEIGHT = 35;  // 面板折叠时只有标题栏
                        const facePanelHeight = (this.canvasInstance && this.canvasInstance.faceToolsUI && this.canvasInstance.faceToolsUI.isPanelExpanded)
                            ? FACE_PANEL_EXPANDED_HEIGHT
                            : FACE_PANEL_COLLAPSED_HEIGHT;
                        
                        // 使用与updateContainerSize相同的补偿逻辑
                        const ADJUSTED_RIGHT_MARGIN = 70;
                        const LG_BOTTOM_MARGIN = 110;
                        const totalHeight = currentScaledSize.height + CANVAS_SIZE.TOOLBAR_HEIGHT + layerPanelHeight + facePanelHeight;
                        
                        const result = [
                            currentScaledSize.width + ADJUSTED_RIGHT_MARGIN,
                            totalHeight + LG_BOTTOM_MARGIN
                        ];
                        // // console.log(`[LRPG Canvas] computeSize (layerPanel: ${layerPanelHeight}px, facePanel: ${facePanelHeight}px): ${result[0]}x${result[1]}`);
                        return result;
                    };
                    
                    // 先添加DOM Widget，然后添加canvas容器
                    this.canvasWidget = this.addDOMWidget("canvas", "canvas", element);
                    
                    // 等待Canvas初始化完成后添加到DOM
                    const addCanvasToDOM = () => {
                        if (this.canvasInstance.canvasContainer) {
                            element.appendChild(this.canvasInstance.canvasContainer);
                            
                            // LRPG方式：强制更新节点尺寸
                            requestAnimationFrame(() => {
                                this.size = this.computeSize();
                                this.setDirtyCanvas(true, true);
                            });
                        } else {
                            setTimeout(addCanvasToDOM, 100);
                        }
                    };
                    addCanvasToDOM();
                }
            };
        }
    }
});