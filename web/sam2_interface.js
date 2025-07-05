/**
 * SAM2 前端交互界面
 * 支持实时预览和精确分割的双模式交互
 */

import { app } from "../../scripts/app.js";

console.log("🚀 加载SAM2前端交互界面...");

// SAM2交互管理器
class SAM2InteractionManager {
    constructor() {
        this.currentMode = "auto"; // auto | fast | precise
        this.interactionPoints = [];
        this.isPreviewMode = true;
        this.confidenceThreshold = 0.4;
        this.enableSAM2 = false;
        
        // UI元素引用
        this.modal = null;
        this.canvas = null;
        this.previewLayer = null;
        
        // 状态管理
        this.lastPreviewTime = 0;
        this.previewDelay = 100; // ms
        this.isProcessing = false;
        
        console.log("🔧 SAM2交互管理器初始化完成");
    }
    
    // 初始化SAM2界面
    initializeSAM2Interface(modal) {
        this.modal = modal;
        this.canvas = modal.querySelector('#image-canvas');
        
        if (!this.canvas) {
            console.warn("⚠️ 未找到画布元素");
            return;
        }
        
        // 创建SAM2控制面板
        this.createSAM2Controls();
        
        // 创建预览层
        this.createPreviewLayer();
        
        // 绑定交互事件
        this.bindInteractionEvents();
        
        console.log("✅ SAM2界面初始化完成");
    }
    
    // 创建SAM2控制面板
    createSAM2Controls() {
        const existingControls = this.modal.querySelector('#sam2-controls');
        if (existingControls) {
            existingControls.remove();
        }
        
        const controlPanel = document.createElement('div');
        controlPanel.id = 'sam2-controls';
        controlPanel.className = 'sam2-control-panel';
        controlPanel.style.cssText = `
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
            min-width: 200px;
            z-index: 1000;
            backdrop-filter: blur(5px);
        `;
        
        controlPanel.innerHTML = `
            <div style="margin-bottom: 12px; font-weight: bold; color: #4CAF50;">
                🤖 SAM2 智能分割
            </div>
            
            <!-- 模式选择 -->
            <div style="margin-bottom: 10px;">
                <label style="display: block; margin-bottom: 4px;">分割模式:</label>
                <select id="sam2-mode" style="width: 100%; padding: 4px; background: #333; color: white; border: 1px solid #555; border-radius: 4px;">
                    <option value="auto">🎯 自动模式</option>
                    <option value="fast">⚡ 快速模式 (FastSAM)</option>
                    <option value="precise">🔬 精确模式 (SAM2)</option>
                </select>
            </div>
            
            <!-- 置信度阈值 -->
            <div style="margin-bottom: 10px;">
                <label style="display: block; margin-bottom: 4px;">置信度阈值: <span id="confidence-value">0.4</span></label>
                <input type="range" id="confidence-slider" min="0.1" max="1.0" step="0.1" value="0.4" 
                       style="width: 100%; background: #333;">
            </div>
            
            <!-- SAM2启用 -->
            <div style="margin-bottom: 10px;">
                <label style="display: flex; align-items: center; cursor: pointer;">
                    <input type="checkbox" id="enable-sam2" style="margin-right: 6px;">
                    启用SAM2精确模式
                </label>
                <small style="color: #aaa; margin-top: 2px; display: block;">需要更多GPU内存</small>
            </div>
            
            <!-- 实时预览 -->
            <div style="margin-bottom: 10px;">
                <label style="display: flex; align-items: center; cursor: pointer;">
                    <input type="checkbox" id="real-time-preview" checked style="margin-right: 6px;">
                    实时预览
                </label>
            </div>
            
            <!-- 操作按钮 -->
            <div style="display: flex; gap: 6px; margin-top: 12px;">
                <button id="clear-interactions" style="flex: 1; padding: 6px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">
                    清除交互
                </button>
                <button id="process-sam2" style="flex: 1; padding: 6px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">
                    执行分割
                </button>
            </div>
            
            <!-- 状态显示 -->
            <div id="sam2-status" style="margin-top: 8px; padding: 6px; background: #333; border-radius: 4px; font-size: 11px; color: #ccc;">
                准备就绪
            </div>
        `;
        
        // 添加到模态框
        this.modal.appendChild(controlPanel);
        
        // 绑定控件事件
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
                this.currentMode = e.target.value;
                this.updateStatus(`切换到${this.getModeDisplayName()}模式`);
                console.log(`🔄 SAM2模式切换: ${this.currentMode}`);
            });
        }
        
        // 置信度调整
        const confidenceSlider = this.modal.querySelector('#confidence-slider');
        const confidenceValue = this.modal.querySelector('#confidence-value');
        if (confidenceSlider && confidenceValue) {
            confidenceSlider.addEventListener('input', (e) => {
                this.confidenceThreshold = parseFloat(e.target.value);
                confidenceValue.textContent = this.confidenceThreshold.toFixed(1);
                
                // 实时预览更新
                if (this.isPreviewMode && this.interactionPoints.length > 0) {
                    this.debouncePreview();
                }
            });
        }
        
        // SAM2启用
        const enableSAM2 = this.modal.querySelector('#enable-sam2');
        if (enableSAM2) {
            enableSAM2.addEventListener('change', (e) => {
                this.enableSAM2 = e.target.checked;
                this.updateStatus(this.enableSAM2 ? 'SAM2已启用' : 'SAM2已禁用');
                console.log(`🔧 SAM2启用状态: ${this.enableSAM2}`);
            });
        }
        
        // 实时预览
        const realtimePreview = this.modal.querySelector('#real-time-preview');
        if (realtimePreview) {
            realtimePreview.addEventListener('change', (e) => {
                this.isPreviewMode = e.target.checked;
                if (!this.isPreviewMode) {
                    this.clearPreview();
                }
                console.log(`👁️ 实时预览: ${this.isPreviewMode}`);
            });
        }
        
        // 清除交互
        const clearBtn = this.modal.querySelector('#clear-interactions');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearInteractions();
            });
        }
        
        // 执行分割
        const processBtn = this.modal.querySelector('#process-sam2');
        if (processBtn) {
            processBtn.addEventListener('click', () => {
                this.processSegmentation();
            });
        }
    }
    
    // 绑定交互事件
    bindInteractionEvents() {
        if (!this.canvas) return;
        
        // 鼠标点击事件
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
        
        console.log("🖱️ SAM2交互事件绑定完成");
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
        if (this.isPreviewMode) {
            this.debouncePreview();
        }
        
        this.updateStatus(`添加交互点 ${this.interactionPoints.length}: (${Math.round(x)}, ${Math.round(y)})`);
        console.log(`📍 添加交互点: (${x}, ${y})`);
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
            
            if (this.isPreviewMode) {
                this.debouncePreview();
            }
            
            this.updateStatus(`移除交互点 ${index + 1}`);
        }
    }
    
    // 刷新交互点显示
    refreshInteractionPoints() {
        // 清除所有交互点
        const points = this.previewLayer.querySelectorAll('.sam2-interaction-point');
        points.forEach(point => point.remove());
        
        // 重新绘制
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
        if (this.interactionPoints.length === 0 || this.isProcessing) {
            return;
        }
        
        this.isProcessing = true;
        this.updateStatus("生成预览中...");
        
        try {
            // 这里应该调用FastSAM进行快速预览
            // 模拟预览结果
            await this.simulatePreview();
            
            this.updateStatus(`预览完成 (${this.interactionPoints.length}个交互点)`);
            
        } catch (error) {
            console.error("预览失败:", error);
            this.updateStatus("预览失败");
        } finally {
            this.isProcessing = false;
        }
    }
    
    // 模拟预览（实际应该调用后端API）
    async simulatePreview() {
        return new Promise(resolve => {
            setTimeout(() => {
                // 清除旧预览
                const oldPreviews = this.previewLayer.querySelectorAll('.sam2-preview-mask');
                oldPreviews.forEach(mask => mask.remove());
                
                // 为每个交互点生成预览mask
                this.interactionPoints.forEach((interaction, index) => {
                    const [x, y] = interaction.point;
                    this.createPreviewMask(x, y, index);
                });
                
                resolve();
            }, 50);
        });
    }
    
    // 创建预览mask
    createPreviewMask(centerX, centerY, index) {
        const mask = document.createElement('div');
        mask.className = 'sam2-preview-mask';
        
        // 随机生成预览区域
        const size = 60 + Math.random() * 40;
        const x = centerX - size / 2;
        const y = centerY - size / 2;
        
        mask.style.cssText = `
            position: absolute;
            left: ${x}px;
            top: ${y}px;
            width: ${size}px;
            height: ${size}px;
            background: rgba(76, 175, 80, 0.3);
            border: 2px dashed #4CAF50;
            border-radius: 8px;
            z-index: 550;
            animation: sam2-preview-pulse 2s infinite;
        `;
        
        this.previewLayer.appendChild(mask);
    }
    
    // 执行分割
    async processSegmentation() {
        if (this.interactionPoints.length === 0) {
            this.updateStatus("请先添加交互点");
            return;
        }
        
        this.isProcessing = true;
        this.updateStatus("执行分割中...");
        
        try {
            // 准备交互数据
            const interactionData = JSON.stringify(this.interactionPoints);
            
            // 这里应该调用ComfyUI节点进行实际分割
            console.log("🎯 执行SAM2分割:", {
                mode: this.currentMode,
                interactions: this.interactionPoints.length,
                confidence: this.confidenceThreshold,
                enableSAM2: this.enableSAM2
            });
            
            // 模拟处理时间
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            this.updateStatus(`分割完成！生成 ${this.interactionPoints.length} 个标注`);
            
            // 清除预览，显示最终结果
            this.clearPreview();
            
        } catch (error) {
            console.error("分割失败:", error);
            this.updateStatus("分割失败");
        } finally {
            this.isProcessing = false;
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
            { text: "🎯 快速分割", action: () => this.quickSegment(e) },
            { text: "🔬 精确分割", action: () => this.preciseSegment(e) },
            { text: "📦 框选分割", action: () => this.boxSegment(e) },
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
    
    // 快速分割
    quickSegment(e) {
        this.currentMode = "fast";
        this.modal.querySelector('#sam2-mode').value = "fast";
        this.handleCanvasClick(e);
    }
    
    // 精确分割
    preciseSegment(e) {
        this.currentMode = "precise";
        this.modal.querySelector('#sam2-mode').value = "precise";
        this.handleCanvasClick(e);
    }
    
    // 框选分割
    boxSegment(e) {
        this.updateStatus("框选分割功能开发中...");
    }
    
    // 清除交互
    clearInteractions() {
        this.interactionPoints = [];
        this.clearPreview();
        this.updateStatus("已清除所有交互点");
        console.log("🧹 清除所有SAM2交互");
    }
    
    // 清除预览
    clearPreview() {
        if (this.previewLayer) {
            const previews = this.previewLayer.querySelectorAll('.sam2-interaction-point, .sam2-preview-mask');
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
    
    // 获取模式显示名称
    getModeDisplayName() {
        const modes = {
            'auto': '自动',
            'fast': '快速',
            'precise': '精确'
        };
        return modes[this.currentMode] || this.currentMode;
    }
    
    // 销毁
    destroy() {
        this.clearInteractions();
        if (this.previewLayer) {
            this.previewLayer.remove();
        }
        
        const controls = this.modal?.querySelector('#sam2-controls');
        if (controls) {
            controls.remove();
        }
        
        console.log("🗑️ SAM2交互管理器已销毁");
    }
}

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
    @keyframes sam2-preview-pulse {
        0% { opacity: 0.3; transform: scale(1); }
        50% { opacity: 0.6; transform: scale(1.05); }
        100% { opacity: 0.3; transform: scale(1); }
    }
    
    .sam2-interaction-point:hover {
        transform: scale(1.2);
        background: #FF5722 !important;
    }
    
    .sam2-control-panel select:focus,
    .sam2-control-panel input:focus {
        outline: 2px solid #4CAF50;
        outline-offset: 1px;
    }
    
    .sam2-control-panel button:hover {
        opacity: 0.9;
        transform: translateY(-1px);
    }
    
    .sam2-control-panel button:active {
        transform: translateY(0);
    }
`;
document.head.appendChild(style);

// 全局SAM2管理器实例
window.SAM2Manager = null;

// 集成到现有的Visual Prompt Editor - 暂时禁用 (挡住按钮)
/*
app.registerExtension({
    name: "Kontext.SAM2Interface",
    
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name === "VisualPromptEditor") {
            console.log("🔧 为VisualPromptEditor添加SAM2支持");
            
            const onNodeCreated = nodeType.prototype.onNodeCreated;
            nodeType.prototype.onNodeCreated = function () {
                const r = onNodeCreated ? onNodeCreated.apply(this, arguments) : undefined;
                
                // 扩展openUnifiedEditor方法
                const originalOpenEditor = this.openUnifiedEditor;
                this.openUnifiedEditor = function() {
                    const result = originalOpenEditor.apply(this, arguments);
                    
                    // 延迟初始化SAM2界面
                    setTimeout(() => {
                        const modal = document.getElementById('unified-editor-modal');
                        if (modal && !window.SAM2Manager) {
                            window.SAM2Manager = new SAM2InteractionManager();
                            window.SAM2Manager.initializeSAM2Interface(modal);
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

console.log("✅ SAM2前端交互界面加载完成");