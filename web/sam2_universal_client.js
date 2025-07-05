/**
 * SAM2通用客户端
 * 支持云端/本地ComfyUI的通用前端交互
 */

import { app } from "../../scripts/app.js";

console.log("🌐 加载SAM2通用客户端...");

// SAM2通用客户端类
class SAM2UniversalClient {
    constructor() {
        this.serviceUrl = null;
        this.sessionId = this._generateSessionId();
        this.isConnected = false;
        this.serverMode = "auto"; // auto | local | cloud
        
        // 自动检测服务端点
        this.endpoints = {
            comfyui: "/sam2",           // ComfyUI内置端点
            standalone: ":8002",        // 独立服务端点
            local: "localhost:8002",    // 本地服务
            cloud: null                 // 云端服务 (从环境检测)
        };
        
        // 交互状态
        this.currentImage = null;
        this.imageData = null;
        this.interactionPoints = [];
        
        // UI元素
        this.modal = null;
        this.canvas = null;
        this.previewLayer = null;
        
        // 性能配置
        this.previewDelay = 200; // ms
        this.lastPreviewTime = 0;
        this.isProcessing = false;
        
        console.log(`🔧 SAM2通用客户端初始化 (会话ID: ${this.sessionId})`);
        
        // 自动检测并连接服务
        this.autoDetectService();
    }
    
    // 生成会话ID
    _generateSessionId() {
        return `sam2_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // 自动检测服务
    async autoDetectService() {
        console.log("🔍 自动检测SAM2服务...");
        
        // 获取当前页面URL信息
        const currentHost = window.location.hostname;
        const currentPort = window.location.port;
        const protocol = window.location.protocol;
        
        // 检测云端ComfyUI环境
        const isCloudEnvironment = this._detectCloudEnvironment();
        
        // 构建候选服务URL列表
        const candidateUrls = [];
        
        if (isCloudEnvironment) {
            // 云端环境：优先使用相同域名的不同端口
            candidateUrls.push(`${protocol}//${currentHost}:8002`);
            candidateUrls.push(`${protocol}//${currentHost}/sam2`);
            candidateUrls.push(`${protocol}//${currentHost}:${currentPort}/sam2`);
        } else {
            // 本地环境：优先使用localhost
            candidateUrls.push("http://localhost:8002");
            candidateUrls.push(`${protocol}//${currentHost}:8002`);
            candidateUrls.push(`${protocol}//${currentHost}/sam2`);
        }
        
        // 逐个测试服务可用性
        for (const url of candidateUrls) {
            if (await this._testServiceConnection(url)) {
                this.serviceUrl = url;
                this.isConnected = true;
                this.serverMode = isCloudEnvironment ? "cloud" : "local";
                console.log(`✅ 连接到SAM2服务: ${url} (${this.serverMode}模式)`);
                return true;
            }
        }
        
        console.warn("⚠️ 未找到可用的SAM2服务，使用回退模式");
        this.serverMode = "fallback";
        return false;
    }
    
    // 检测云端环境
    _detectCloudEnvironment() {
        const hostname = window.location.hostname;
        
        // 常见云端特征
        const cloudIndicators = [
            hostname !== "localhost",
            hostname !== "127.0.0.1",
            hostname.includes("."),
            window.location.port && window.location.port !== "8188", // 非默认ComfyUI端口
            document.title.includes("Cloud") || document.title.includes("Remote")
        ];
        
        return cloudIndicators.filter(Boolean).length >= 2;
    }
    
    // 测试服务连接
    async _testServiceConnection(url) {
        try {
            const response = await fetch(`${url}/health`, {
                method: "GET",
                timeout: 3000,
                headers: {
                    "Accept": "application/json"
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log(`🔗 服务健康检查成功: ${url}`, data);
                return true;
            }
        } catch (error) {
            console.log(`❌ 服务连接失败: ${url} - ${error.message}`);
        }
        return false;
    }
    
    // 初始化界面
    initializeInterface(modal) {
        this.modal = modal;
        this.canvas = modal.querySelector('#image-canvas');
        
        if (!this.canvas) {
            console.warn("⚠️ 未找到画布元素");
            return;
        }
        
        // 创建控制面板
        this.createControlPanel();
        
        // 创建预览层
        this.createPreviewLayer();
        
        // 绑定事件
        this.bindEvents();
        
        console.log("✅ SAM2通用界面初始化完成");
    }
    
    // 创建控制面板
    createControlPanel() {
        const existingPanel = this.modal.querySelector('#sam2-universal-panel');
        if (existingPanel) {
            existingPanel.remove();
        }
        
        const panel = document.createElement('div');
        panel.id = 'sam2-universal-panel';
        panel.className = 'sam2-universal-panel';
        panel.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(40, 40, 40, 0.95);
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #555;
            color: white;
            font-family: 'Segoe UI', Arial, sans-serif;
            font-size: 12px;
            min-width: 220px;
            z-index: 1000;
            backdrop-filter: blur(5px);
        `;
        
        panel.innerHTML = `
            <div style="margin-bottom: 12px; font-weight: bold; color: #4CAF50;">
                🌐 SAM2通用分割
            </div>
            
            <!-- 连接状态 -->
            <div style="margin-bottom: 10px;">
                <div style="display: flex; align-items: center; margin-bottom: 4px;">
                    <span id="connection-status" style="width: 8px; height: 8px; border-radius: 50%; margin-right: 6px; background: ${this.isConnected ? '#4CAF50' : '#f44336'};"></span>
                    <span style="font-size: 11px; color: #ccc;">
                        ${this.isConnected ? `已连接 (${this.serverMode})` : '未连接'}
                    </span>
                </div>
                <div style="font-size: 10px; color: #888;">
                    ${this.serviceUrl || '服务检测中...'}
                </div>
            </div>
            
            <!-- 模式选择 -->
            <div style="margin-bottom: 10px;">
                <label style="display: block; margin-bottom: 4px;">分割模式:</label>
                <select id="sam2-mode" style="width: 100%; padding: 4px; background: #333; color: white; border: 1px solid #555; border-radius: 4px;">
                    <option value="auto">🎯 自动模式</option>
                    <option value="fast">⚡ 快速预览 (FastSAM)</option>
                    <option value="precise">🔬 精确分割 (SAM2)</option>
                </select>
            </div>
            
            <!-- 置信度阈值 -->
            <div style="margin-bottom: 10px;">
                <label style="display: block; margin-bottom: 4px;">置信度: <span id="confidence-value">0.4</span></label>
                <input type="range" id="confidence-slider" min="0.1" max="1.0" step="0.1" value="0.4" 
                       style="width: 100%; background: #333;">
            </div>
            
            <!-- 实时预览 -->
            <div style="margin-bottom: 10px;">
                <label style="display: flex; align-items: center; cursor: pointer;">
                    <input type="checkbox" id="real-time-preview" checked style="margin-right: 6px;">
                    实时预览 (${this.serverMode === 'cloud' ? '云端' : '本地'})
                </label>
            </div>
            
            <!-- 操作按钮 -->
            <div style="display: flex; gap: 6px; margin-top: 12px;">
                <button id="test-connection" style="flex: 1; padding: 6px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">
                    重连
                </button>
                <button id="clear-points" style="flex: 1; padding: 6px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">
                    清除
                </button>
                <button id="execute-segment" style="flex: 1; padding: 6px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">
                    分割
                </button>
            </div>
            
            <!-- 状态显示 -->
            <div id="sam2-status" style="margin-top: 8px; padding: 6px; background: #333; border-radius: 4px; font-size: 11px; color: #ccc;">
                ${this.isConnected ? '就绪' : '等待连接...'}
            </div>
            
            <!-- 性能统计 -->
            <div id="performance-stats" style="margin-top: 6px; font-size: 10px; color: #888;">
                响应时间: -- ms
            </div>
        `;
        
        this.modal.appendChild(panel);
        this.bindControlEvents();
    }
    
    // 创建预览层
    createPreviewLayer() {
        if (this.previewLayer) {
            this.previewLayer.remove();
        }
        
        this.previewLayer = document.createElement('div');
        this.previewLayer.id = 'sam2-preview-layer';
        this.previewLayer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 500;
        `;
        
        this.canvas.appendChild(this.previewLayer);
    }
    
    // 绑定控件事件
    bindControlEvents() {
        // 模式切换
        const modeSelect = this.modal.querySelector('#sam2-mode');
        if (modeSelect) {
            modeSelect.addEventListener('change', (e) => {
                this.updateStatus(`切换到${e.target.value}模式`);
            });
        }
        
        // 置信度调整
        const confidenceSlider = this.modal.querySelector('#confidence-slider');
        const confidenceValue = this.modal.querySelector('#confidence-value');
        if (confidenceSlider && confidenceValue) {
            confidenceSlider.addEventListener('input', (e) => {
                confidenceValue.textContent = parseFloat(e.target.value).toFixed(1);
                this.debouncePreview();
            });
        }
        
        // 重连按钮
        const testBtn = this.modal.querySelector('#test-connection');
        if (testBtn) {
            testBtn.addEventListener('click', () => {
                this.autoDetectService();
            });
        }
        
        // 清除按钮
        const clearBtn = this.modal.querySelector('#clear-points');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearInteractions();
            });
        }
        
        // 执行分割按钮
        const executeBtn = this.modal.querySelector('#execute-segment');
        if (executeBtn) {
            executeBtn.addEventListener('click', () => {
                this.executeSegmentation();
            });
        }
    }
    
    // 绑定画布事件
    bindEvents() {
        if (!this.canvas) return;
        
        // 点击事件
        this.canvas.addEventListener('click', (e) => {
            if (e.target === this.canvas || e.target.closest('#image-canvas')) {
                this.handleCanvasClick(e);
            }
        });
        
        // 右键菜单
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showContextMenu(e);
        });
    }
    
    // 处理画布点击
    handleCanvasClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // 添加交互点
        const interaction = {
            type: "point",
            point: [Math.round(x), Math.round(y)],
            timestamp: Date.now()
        };
        
        this.interactionPoints.push(interaction);
        
        // 显示交互点
        this.showInteractionPoint(x, y, this.interactionPoints.length);
        
        // 实时预览
        const realtimeCheckbox = this.modal.querySelector('#real-time-preview');
        if (realtimeCheckbox && realtimeCheckbox.checked) {
            this.debouncePreview();
        }
        
        this.updateStatus(`添加交互点 ${this.interactionPoints.length}: (${Math.round(x)}, ${Math.round(y)})`);
    }
    
    // 显示交互点
    showInteractionPoint(x, y, number) {
        const point = document.createElement('div');
        point.className = 'sam2-interaction-point';
        point.style.cssText = `
            position: absolute;
            left: ${x - 8}px;
            top: ${y - 8}px;
            width: 16px;
            height: 16px;
            background: #4CAF50;
            border: 2px solid white;
            border-radius: 50%;
            color: white;
            font-size: 10px;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 600;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        `;
        point.textContent = number;
        
        // 删除点击事件
        point.addEventListener('click', (e) => {
            e.stopPropagation();
            this.removeInteractionPoint(number - 1);
        });
        
        this.previewLayer.appendChild(point);
    }
    
    // 移除交互点
    removeInteractionPoint(index) {
        if (index >= 0 && index < this.interactionPoints.length) {
            this.interactionPoints.splice(index, 1);
            this.refreshInteractionPoints();
            this.debouncePreview();
            this.updateStatus(`移除交互点 ${index + 1}`);
        }
    }
    
    // 刷新交互点显示
    refreshInteractionPoints() {
        const points = this.previewLayer.querySelectorAll('.sam2-interaction-point');
        points.forEach(point => point.remove());
        
        this.interactionPoints.forEach((interaction, index) => {
            const [x, y] = interaction.point;
            this.showInteractionPoint(x, y, index + 1);
        });
    }
    
    // 防抖预览
    debouncePreview() {
        const now = Date.now();
        this.lastPreviewTime = now;
        
        setTimeout(() => {
            if (this.lastPreviewTime === now && !this.isProcessing) {
                this.generatePreview();
            }
        }, this.previewDelay);
    }
    
    // 生成预览
    async generatePreview() {
        if (this.interactionPoints.length === 0 || !this.isConnected || this.isProcessing) {
            return;
        }
        
        this.isProcessing = true;
        this.updateStatus("生成预览中...");
        
        try {
            const startTime = Date.now();
            
            // 获取图像数据
            const imageData = await this.getImageData();
            if (!imageData) {
                this.updateStatus("获取图像数据失败");
                return;
            }
            
            // 调用预览API
            const response = await fetch(`${this.serviceUrl}/preview`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    image_data: imageData,
                    interactions: this.interactionPoints,
                    mode: "fast",
                    confidence_threshold: parseFloat(this.modal.querySelector('#confidence-slider').value),
                    session_id: this.sessionId
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                const responseTime = Date.now() - startTime;
                
                if (result.success) {
                    this.displayPreviewResults(result.results);
                    this.updatePerformanceStats(responseTime, "FastSAM");
                    this.updateStatus(`预览完成 (${responseTime}ms)`);
                } else {
                    this.updateStatus(`预览失败: ${result.error}`);
                }
            } else {
                this.updateStatus(`网络错误: ${response.status}`);
            }
            
        } catch (error) {
            console.error("预览失败:", error);
            this.updateStatus(`预览失败: ${error.message}`);
        } finally {
            this.isProcessing = false;
        }
    }
    
    // 执行分割
    async executeSegmentation() {
        if (this.interactionPoints.length === 0) {
            this.updateStatus("请先添加交互点");
            return;
        }
        
        if (!this.isConnected) {
            this.updateStatus("服务未连接");
            return;
        }
        
        this.isProcessing = true;
        this.updateStatus("执行分割中...");
        
        try {
            const startTime = Date.now();
            
            // 获取图像数据
            const imageData = await this.getImageData();
            if (!imageData) {
                this.updateStatus("获取图像数据失败");
                return;
            }
            
            // 获取配置
            const mode = this.modal.querySelector('#sam2-mode').value;
            const confidenceThreshold = parseFloat(this.modal.querySelector('#confidence-slider').value);
            
            // 调用分割API
            const endpoint = mode === "precise" ? "/segment" : "/smart_segment";
            const response = await fetch(`${this.serviceUrl}${endpoint}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    image_data: imageData,
                    interactions: this.interactionPoints,
                    mode: mode,
                    confidence_threshold: confidenceThreshold,
                    enable_sam2: true,
                    session_id: this.sessionId
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                const responseTime = Date.now() - startTime;
                
                if (result.success) {
                    this.displayFinalResults(result.results);
                    this.updatePerformanceStats(responseTime, result.performance_stats.method);
                    this.updateStatus(`分割完成 (${responseTime}ms)`);
                    
                    // 触发ComfyUI更新
                    this.notifyComfyUIUpdate(result.results);
                } else {
                    this.updateStatus(`分割失败: ${result.error}`);
                }
            } else {
                this.updateStatus(`网络错误: ${response.status}`);
            }
            
        } catch (error) {
            console.error("分割失败:", error);
            this.updateStatus(`分割失败: ${error.message}`);
        } finally {
            this.isProcessing = false;
        }
    }
    
    // 获取图像数据
    async getImageData() {
        try {
            // 从画布获取图像
            const imageElement = this.canvas.querySelector('img') || this.canvas.querySelector('canvas');
            if (!imageElement) {
                console.warn("未找到图像元素");
                return null;
            }
            
            // 创建canvas进行图像转换
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = imageElement.naturalWidth || imageElement.width;
            canvas.height = imageElement.naturalHeight || imageElement.height;
            
            ctx.drawImage(imageElement, 0, 0);
            
            // 转换为base64
            return canvas.toDataURL('image/png');
            
        } catch (error) {
            console.error("获取图像数据失败:", error);
            return null;
        }
    }
    
    // 显示预览结果
    displayPreviewResults(results) {
        // 清除旧预览
        const oldPreviews = this.previewLayer.querySelectorAll('.sam2-preview-mask');
        oldPreviews.forEach(mask => mask.remove());
        
        // 显示新预览
        results.forEach((result, index) => {
            if (result.annotation && result.annotation.geometry) {
                this.createPreviewMask(result.annotation.geometry, index);
            }
        });
    }
    
    // 创建预览mask
    createPreviewMask(geometry, index) {
        if (geometry.type === "rectangle") {
            const [x1, y1, x2, y2] = geometry.coordinates;
            const mask = document.createElement('div');
            mask.className = 'sam2-preview-mask';
            mask.style.cssText = `
                position: absolute;
                left: ${x1}px;
                top: ${y1}px;
                width: ${x2 - x1}px;
                height: ${y2 - y1}px;
                background: rgba(76, 175, 80, 0.3);
                border: 2px dashed #4CAF50;
                border-radius: 4px;
                z-index: 550;
                animation: sam2-preview-pulse 2s infinite;
            `;
            
            this.previewLayer.appendChild(mask);
        }
    }
    
    // 显示最终结果
    displayFinalResults(results) {
        // 清除预览
        this.clearPreviews();
        
        // 显示最终结果
        results.forEach((result, index) => {
            if (result.annotation && result.annotation.geometry) {
                this.createFinalMask(result.annotation.geometry, result.annotation.confidence, index);
            }
        });
    }
    
    // 创建最终mask
    createFinalMask(geometry, confidence, index) {
        if (geometry.type === "rectangle") {
            const [x1, y1, x2, y2] = geometry.coordinates;
            const mask = document.createElement('div');
            mask.className = 'sam2-final-mask';
            
            // 根据置信度选择颜色
            const color = confidence >= 0.8 ? '#4CAF50' : confidence >= 0.6 ? '#FFC107' : '#FF9800';
            
            mask.style.cssText = `
                position: absolute;
                left: ${x1}px;
                top: ${y1}px;
                width: ${x2 - x1}px;
                height: ${y2 - y1}px;
                background: ${color}33;
                border: 2px solid ${color};
                border-radius: 4px;
                z-index: 550;
            `;
            
            // 添加置信度标签
            const label = document.createElement('div');
            label.style.cssText = `
                position: absolute;
                top: -20px;
                left: 0;
                background: ${color};
                color: white;
                padding: 2px 6px;
                font-size: 10px;
                border-radius: 2px;
            `;
            label.textContent = `${(confidence * 100).toFixed(0)}%`;
            mask.appendChild(label);
            
            this.previewLayer.appendChild(mask);
        }
    }
    
    // 通知ComfyUI更新
    notifyComfyUIUpdate(results) {
        try {
            // 将结果转换为标准层格式
            const layersData = results.map(result => result.annotation).filter(Boolean);
            
            // 触发Visual Prompt Editor更新
            const event = new CustomEvent('sam2SegmentationComplete', {
                detail: {
                    layers: layersData,
                    sessionId: this.sessionId
                }
            });
            
            document.dispatchEvent(event);
            console.log("📡 已通知ComfyUI更新:", layersData.length, "个标注");
            
        } catch (error) {
            console.error("通知ComfyUI更新失败:", error);
        }
    }
    
    // 显示右键菜单
    showContextMenu(e) {
        const menu = document.createElement('div');
        menu.className = 'sam2-context-menu';
        menu.style.cssText = `
            position: fixed;
            left: ${e.clientX}px;
            top: ${e.clientY}px;
            background: #333;
            border: 1px solid #555;
            border-radius: 4px;
            padding: 4px 0;
            z-index: 2000;
            min-width: 150px;
            color: white;
            font-size: 12px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        `;
        
        const menuItems = [
            { text: "⚡ 快速预览", action: () => this.quickPreview(e) },
            { text: "🎯 精确分割", action: () => this.preciseSegment(e) },
            { text: "🔄 重新连接", action: () => this.autoDetectService() },
            { text: "❌ 清除所有", action: () => this.clearInteractions() }
        ];
        
        menuItems.forEach(item => {
            const menuItem = document.createElement('div');
            menuItem.style.cssText = `
                padding: 8px 12px;
                cursor: pointer;
                border-bottom: 1px solid #444;
            `;
            menuItem.textContent = item.text;
            
            menuItem.addEventListener('click', () => {
                item.action();
                menu.remove();
            });
            
            menuItem.addEventListener('mouseenter', () => {
                menuItem.style.background = '#4CAF50';
            });
            
            menuItem.addEventListener('mouseleave', () => {
                menuItem.style.background = 'transparent';
            });
            
            menu.appendChild(menuItem);
        });
        
        document.body.appendChild(menu);
        
        // 点击其他地方关闭菜单
        setTimeout(() => {
            document.addEventListener('click', function closeMenu() {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            });
        }, 10);
    }
    
    // 快速预览
    quickPreview(e) {
        this.modal.querySelector('#sam2-mode').value = "fast";
        this.handleCanvasClick(e);
    }
    
    // 精确分割
    preciseSegment(e) {
        this.modal.querySelector('#sam2-mode').value = "precise";
        this.handleCanvasClick(e);
    }
    
    // 清除交互
    clearInteractions() {
        this.interactionPoints = [];
        this.clearPreviews();
        this.updateStatus("已清除所有交互点");
    }
    
    // 清除预览
    clearPreviews() {
        if (this.previewLayer) {
            const previews = this.previewLayer.querySelectorAll('.sam2-interaction-point, .sam2-preview-mask, .sam2-final-mask');
            previews.forEach(preview => preview.remove());
        }
    }
    
    // 更新状态
    updateStatus(message) {
        const statusElement = this.modal?.querySelector('#sam2-status');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.style.color = '#4CAF50';
            
            setTimeout(() => {
                if (statusElement.textContent === message) {
                    statusElement.style.color = '#ccc';
                }
            }, 3000);
        }
        console.log(`📊 SAM2状态: ${message}`);
    }
    
    // 更新性能统计
    updatePerformanceStats(responseTime, method) {
        const statsElement = this.modal?.querySelector('#performance-stats');
        if (statsElement) {
            statsElement.textContent = `${method}: ${responseTime}ms`;
        }
    }
    
    // 销毁
    destroy() {
        this.clearInteractions();
        if (this.previewLayer) {
            this.previewLayer.remove();
        }
        
        const panel = this.modal?.querySelector('#sam2-universal-panel');
        if (panel) {
            panel.remove();
        }
        
        console.log("🗑️ SAM2通用客户端已销毁");
    }
}

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
    @keyframes sam2-preview-pulse {
        0% { opacity: 0.3; transform: scale(1); }
        50% { opacity: 0.6; transform: scale(1.02); }
        100% { opacity: 0.3; transform: scale(1); }
    }
    
    .sam2-interaction-point:hover {
        transform: scale(1.2);
        background: #FF5722 !important;
    }
    
    .sam2-universal-panel select:focus,
    .sam2-universal-panel input:focus {
        outline: 2px solid #4CAF50;
        outline-offset: 1px;
    }
    
    .sam2-universal-panel button:hover {
        opacity: 0.9;
        transform: translateY(-1px);
    }
    
    .sam2-universal-panel button:active {
        transform: translateY(0);
    }
`;
document.head.appendChild(style);

// 全局客户端实例
window.SAM2UniversalClient = null;

// 集成到现有的Visual Prompt Editor - 暂时禁用 (挡住按钮)
/*
app.registerExtension({
    name: "Kontext.SAM2UniversalClient",
    
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name === "VisualPromptEditor") {
            console.log("🔧 为VisualPromptEditor添加SAM2通用支持");
            
            const onNodeCreated = nodeType.prototype.onNodeCreated;
            nodeType.prototype.onNodeCreated = function () {
                const r = onNodeCreated ? onNodeCreated.apply(this, arguments) : undefined;
                
                // 扩展openUnifiedEditor方法
                const originalOpenEditor = this.openUnifiedEditor;
                this.openUnifiedEditor = function() {
                    const result = originalOpenEditor.apply(this, arguments);
                    
                    // 延迟初始化SAM2通用客户端
                    setTimeout(() => {
                        const modal = document.getElementById('unified-editor-modal');
                        if (modal && !window.SAM2UniversalClient) {
                            window.SAM2UniversalClient = new SAM2UniversalClient();
                            window.SAM2UniversalClient.initializeInterface(modal);
                        }
                    }, 500);
                    
                    return result;
                };
                
                return r;
            };
        }
    }
});
*/

console.log("✅ SAM2通用客户端加载完成");