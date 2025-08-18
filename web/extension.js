/**
 * Kontext Visual Prompt Window - Main Frontend Extension
 * 主前端扩展入口文件
 * 
 * 统一加载和管理所有节点的前端扩展
 */

import { app } from "../../scripts/app.js";

// 导入核心前端扩展
import "./api_key_manager.js";  // API密钥localStorage持久化管理

// 注意：以下文件已删除，如需要请重新创建
// import "./ollama_flux_kontext_enhancer.js";   // Ollama增强节点扩展 (已删除)
// import "./API_flux_kontext_enhancer.js";      // API增强节点扩展 (已删除)

// 已移除的扩展 - moved to disabled_nodes/
// - global_image_processor.js   # 全图处理扩展 (已移除)

// 已移除的扩展 - moved to disabled_nodes/
// - intelligent_annotation.js     # 智能标注前端
// - layer_to_mask.js             # 图层转掩码前端

// 测试扩展 - 暂时禁用
// import "./test_double_click.js";

// 主扩展注册
app.registerExtension({
    name: "Kontext.VisualPromptWindow",
    
    init() {
        console.log("🚀 Kontext Visual Prompt Window extension initialized");
        
        // 添加全局样式
        this.addGlobalStyles();
        
        // 设置全局事件监听
        this.setupGlobalEvents();
    },
    
    addGlobalStyles() {
        const style = document.createElement("style");
        style.textContent = `
            /* Kontext 节点样式 */
            .kontext-node {
                border: 2px solid #4CAF50 !important;
                border-radius: 8px !important;
            }
            
            .kontext-node.processing {
                box-shadow: 0 0 15px rgba(76, 175, 80, 0.5) !important;
                animation: kontext-pulse 2s infinite;
            }
            
            @keyframes kontext-pulse {
                0% { box-shadow: 0 0 15px rgba(76, 175, 80, 0.5); }
                50% { box-shadow: 0 0 25px rgba(76, 175, 80, 0.8); }
                100% { box-shadow: 0 0 15px rgba(76, 175, 80, 0.5); }
            }
            
            /* 模态对话框样式 */
            .kontext-modal {
                backdrop-filter: blur(5px) !important;
            }
            
            .kontext-modal .content {
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3) !important;
                border: 1px solid rgba(255, 255, 255, 0.1) !important;
            }
            
            /* 工具提示样式 */
            .kontext-tooltip {
                position: absolute;
                background: #333;
                color: white;
                padding: 8px 12px;
                border-radius: 4px;
                font-size: 0.9em;
                z-index: 10000;
                pointer-events: none;
                opacity: 0;
                transition: opacity 0.3s;
            }
            
            .kontext-tooltip.show {
                opacity: 1;
            }
        `;
        document.head.appendChild(style);
    },
    
    setupGlobalEvents() {
        // 监听工作流执行事件
        app.graphToPrompt = ((original) => {
            return function(...args) {
                console.log("🔄 Kontext workflow execution started");
                return original.apply(this, args);
            };
        })(app.graphToPrompt);
        
        // 添加快捷键支持
        document.addEventListener('keydown', (e) => {
            // Ctrl+K: 快速打开Kontext编辑器
            if (e.ctrlKey && e.key === 'k') {
                e.preventDefault();
                this.openQuickEditor();
            }
            
            // Ctrl+Shift+K: 显示Kontext帮助
            if (e.ctrlKey && e.shiftKey && e.key === 'K') {
                e.preventDefault();
                this.showKontextHelp();
            }
        });
    },
    
    openQuickEditor() {
        // 查找LRPG Canvas节点
        const canvasNode = app.graph._nodes.find(node => 
            node.type === "KontextCanvas"
        );
        
        if (canvasNode) {
            // 触发canvas节点的编辑器打开
            const widget = canvasNode.widgets.find(w => w.name === "canvas_editor");
            if (widget && widget.callback) {
                widget.callback();
            }
        } else {
            app.ui.dialog.show("⚠️ No LRPG Canvas node found in the current workflow.");
        }
    },
    
    showKontextHelp() {
        const helpDialog = document.createElement("div");
        helpDialog.className = "comfy-modal kontext-modal";
        helpDialog.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.8); z-index: 15000;
            display: flex; justify-content: center; align-items: center;
        `;
        
        const content = document.createElement("div");
        content.className = "content";
        content.style.cssText = `
            background: #2b2b2b; color: white; padding: 30px;
            border-radius: 12px; max-width: 600px; max-height: 80vh;
            overflow-y: auto; position: relative;
        `;
        
        content.innerHTML = `
            <div style="text-align: center; margin-bottom: 25px;">
                <h2 style="margin: 0; color: #4CAF50;">🎨 Kontext Visual Prompt Window</h2>
                <p style="margin: 10px 0 0 0; color: #888;">Intelligent Visual Prompt Builder</p>
            </div>
            
            <div style="margin: 20px 0;">
                <h3 style="color: #4CAF50; margin-bottom: 15px;">🚀 Core Features</h3>
                <div style="display: grid; grid-template-columns: 1fr; gap: 15px;">
                    <div style="background: #333; padding: 15px; border-radius: 8px; border-left: 4px solid #4CAF50;">
                        <strong>🤖 Intelligent Annotation</strong><br>
                        <small style="color: #aaa;">Automatically identify and segment image objects using YOLO, SAM and other models</small>
                    </div>
                    <div style="background: #333; padding: 15px; border-radius: 8px; border-left: 4px solid #FF9800;">
                        <strong>🎨 Multimodal Instruction Editing</strong><br>
                        <small style="color: #aaa;">Double-click node to open visual editor, supports layer management and interactive editing</small>
                    </div>
                    <div style="background: #333; padding: 15px; border-radius: 8px; border-left: 4px solid #2196F3;">
                        <strong>📝 Structured Prompts</strong><br>
                        <small style="color: #aaa;">Automatically generate corresponding editing prompts based on selected objects</small>
                    </div>
                    <div style="background: #333; padding: 15px; border-radius: 8px; border-left: 4px solid #9C27B0;">
                        <strong>🎯 Mask Conversion</strong><br>
                        <small style="color: #aaa;">Convert annotation results to ComfyUI-compatible mask format</small>
                    </div>
                </div>
            </div>
            
            <div style="margin: 20px 0;">
                <h3 style="color: #4CAF50; margin-bottom: 15px;">⌨️ 快捷键</h3>
                <div style="background: #333; padding: 15px; border-radius: 8px; font-family: monospace;">
                    <div style="margin: 8px 0;"><kbd style="background: #555; padding: 4px 8px; border-radius: 4px;">Ctrl + K</kbd> 快速打开可视化编辑器</div>
                    <div style="margin: 8px 0;"><kbd style="background: #555; padding: 4px 8px; border-radius: 4px;">Ctrl + Shift + K</kbd> 显示此帮助</div>
                </div>
            </div>
            
            <div style="margin: 20px 0;">
                <h3 style="color: #4CAF50; margin-bottom: 15px;">📋 使用流程</h3>
                <ol style="color: #ccc; line-height: 1.6;">
                    <li>使用LoadImage节点加载图像</li>
                    <li>连接IntelligentAnnotationNode进行智能检测</li>
                    <li>双击KontextAnnotationViewer打开编辑器</li>
                    <li>在编辑器中选择对象、编辑标注、生成提示词</li>
                    <li>使用LayerToMaskNode转换为掩码</li>
                    <li>CLIPTextEncodeFlux编码结构化提示词</li>
                </ol>
            </div>
            
            <button style="position: absolute; top: 15px; right: 15px; background: #f44336; color: white; border: none; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; font-size: 16px;">✕</button>
            <button style="width: 100%; padding: 12px; background: #4CAF50; color: white; border: none; border-radius: 6px; cursor: pointer; margin-top: 20px; font-size: 16px;">🚀 开始使用</button>
        `;
        
        // 绑定关闭事件
        content.querySelector('button').onclick = () => document.body.removeChild(helpDialog);
        content.querySelectorAll('button')[1].onclick = () => {
            document.body.removeChild(helpDialog);
            this.openQuickEditor();
        };
        
        helpDialog.onclick = (e) => {
            if (e.target === helpDialog) {
                document.body.removeChild(helpDialog);
            }
        };
        
        helpDialog.appendChild(content);
        document.body.appendChild(helpDialog);
    }
});

// 新的Kontext节点系统已启用

console.log("🎨 Kontext Visual Prompt Window main extension loaded");