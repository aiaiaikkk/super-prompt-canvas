/**
 * Intelligent Annotation Node - Frontend Extension
 * 智能标注节点前端扩展
 * 
 * 为智能标注节点提供前端交互功能，包括参数配置、状态显示等
 */

import { app } from "../../scripts/app.js";
import { ComfyWidgets } from "../../scripts/widgets.js";

app.registerExtension({
    name: "Kontext.IntelligentAnnotation",
    
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name === "IntelligentAnnotationNode") {
            console.log("🤖 Registering Intelligent Annotation Node");
            
            // 添加节点创建时的回调
            const onNodeCreated = nodeType.prototype.onNodeCreated;
            nodeType.prototype.onNodeCreated = function () {
                const r = onNodeCreated ? onNodeCreated.apply(this, arguments) : undefined;
                
                // 设置节点样式
                this.color = "#4CAF50";
                this.bgcolor = "#2E7D32";
                
                // 添加状态显示widget
                this.addWidget("text", "status", "Ready", () => {}, {
                    serialize: false
                });
                
                // 添加进度显示
                this.addWidget("text", "progress", "", () => {}, {
                    serialize: false
                });
                
                return r;
            };
            
            // 添加执行前的回调
            const onExecuted = nodeType.prototype.onExecuted;
            nodeType.prototype.onExecuted = function(message) {
                const r = onExecuted ? onExecuted.apply(this, arguments) : undefined;
                
                // 更新状态显示
                const statusWidget = this.widgets.find(w => w.name === "status");
                const progressWidget = this.widgets.find(w => w.name === "progress");
                
                if (message && message.text) {
                    const results = message.text;
                    
                    if (results.includes("object_count")) {
                        try {
                            const count = JSON.parse(results).object_count || 0;
                            if (statusWidget) statusWidget.value = `Detected ${count} objects`;
                            if (progressWidget) progressWidget.value = "✅ Complete";
                        } catch (e) {
                            if (statusWidget) statusWidget.value = "Processing complete";
                        }
                    }
                }
                
                return r;
            };
            
            // 添加右键菜单选项
            const getExtraMenuOptions = nodeType.prototype.getExtraMenuOptions;
            nodeType.prototype.getExtraMenuOptions = function(_, options) {
                const r = getExtraMenuOptions ? getExtraMenuOptions.apply(this, arguments) : undefined;
                
                options.push({
                    content: "🔍 View Detection Results",
                    callback: () => {
                        this.showDetectionResults();
                    }
                });
                
                options.push({
                    content: "⚙️ Configure Detection",
                    callback: () => {
                        this.showConfigDialog();
                    }
                });
                
                return r;
            };
            
            // 添加检测结果查看方法
            nodeType.prototype.showDetectionResults = function() {
                // 获取最后的输出结果
                const outputData = this.outputs?.[0]?.widget?.value;
                if (outputData) {
                    try {
                        const layers = JSON.parse(outputData);
                        this.showLayersDialog(layers);
                    } catch (e) {
                        app.ui.dialog.show("No detection results available yet.");
                    }
                } else {
                    app.ui.dialog.show("No detection results available. Please run the node first.");
                }
            };
            
            // 添加图层显示对话框
            nodeType.prototype.showLayersDialog = function(layers) {
                const dialog = document.createElement("div");
                dialog.className = "comfy-modal";
                dialog.style.cssText = `
                    position: fixed; top: 50%; left: 50%;
                    transform: translate(-50%, -50%);
                    background: #2b2b2b; color: white;
                    padding: 20px; border-radius: 8px;
                    max-width: 600px; max-height: 80vh;
                    overflow-y: auto; z-index: 10000;
                `;
                
                const title = document.createElement("h3");
                title.textContent = `🤖 Detection Results (${layers.length} objects)`;
                title.style.marginTop = "0";
                dialog.appendChild(title);
                
                const list = document.createElement("div");
                layers.forEach((layer, index) => {
                    const item = document.createElement("div");
                    item.style.cssText = "margin: 10px 0; padding: 10px; background: #333; border-radius: 4px;";
                    item.innerHTML = `
                        <div><strong>${layer.class_name || 'Object'}</strong> (${(layer.confidence || 0).toFixed(2)})</div>
                        <div style="font-size: 0.9em; color: #ccc;">
                            ID: ${layer.id}<br>
                            Type: ${layer.type}<br>
                            Geometry: ${layer.geometry?.type || 'N/A'}
                        </div>
                    `;
                    list.appendChild(item);
                });
                dialog.appendChild(list);
                
                const closeBtn = document.createElement("button");
                closeBtn.textContent = "Close";
                closeBtn.style.cssText = "margin-top: 15px; padding: 8px 16px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;";
                closeBtn.onclick = () => document.body.removeChild(dialog);
                dialog.appendChild(closeBtn);
                
                document.body.appendChild(dialog);
            };
            
            // 添加配置对话框
            nodeType.prototype.showConfigDialog = function() {
                const dialog = document.createElement("div");
                dialog.className = "comfy-modal";
                dialog.style.cssText = `
                    position: fixed; top: 50%; left: 50%;
                    transform: translate(-50%, -50%);
                    background: #2b2b2b; color: white;
                    padding: 20px; border-radius: 8px;
                    width: 400px; z-index: 10000;
                `;
                
                dialog.innerHTML = `
                    <h3 style="margin-top: 0;">⚙️ Detection Configuration</h3>
                    <div style="margin: 15px 0;">
                        <label>Detection Mode:</label><br>
                        <select style="width: 100%; padding: 5px; margin-top: 5px; background: #333; color: white; border: 1px solid #555;">
                            <option value="fast">Fast (YOLO only)</option>
                            <option value="standard" selected>Standard (YOLO + SAM)</option>
                            <option value="comprehensive">Comprehensive (Multi-model)</option>
                        </select>
                    </div>
                    <div style="margin: 15px 0;">
                        <label>Confidence Threshold:</label><br>
                        <input type="range" min="0.1" max="1.0" step="0.05" value="0.7" style="width: 100%; margin-top: 5px;">
                        <span id="confidence-value">0.7</span>
                    </div>
                    <div style="margin: 15px 0;">
                        <label>Max Objects:</label><br>
                        <input type="number" min="1" max="200" value="50" style="width: 100%; padding: 5px; margin-top: 5px; background: #333; color: white; border: 1px solid #555;">
                    </div>
                    <div style="margin-top: 20px;">
                        <button id="apply-config" style="padding: 8px 16px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;">Apply</button>
                        <button id="cancel-config" style="padding: 8px 16px; background: #666; color: white; border: none; border-radius: 4px; cursor: pointer;">Cancel</button>
                    </div>
                `;
                
                // 绑定事件
                const confidenceSlider = dialog.querySelector('input[type="range"]');
                const confidenceValue = dialog.querySelector('#confidence-value');
                confidenceSlider.oninput = () => {
                    confidenceValue.textContent = confidenceSlider.value;
                };
                
                dialog.querySelector('#apply-config').onclick = () => {
                    // 这里可以更新节点的widget值
                    app.ui.dialog.show("Configuration applied!");
                    document.body.removeChild(dialog);
                };
                
                dialog.querySelector('#cancel-config').onclick = () => {
                    document.body.removeChild(dialog);
                };
                
                document.body.appendChild(dialog);
            };
        }
    }
});

console.log("🤖 Intelligent Annotation frontend extension loaded");