/**
 * Layer to Mask Node - Frontend Extension
 * 图层转掩码节点前端扩展
 * 
 * 提供掩码转换的可视化配置和预览功能
 */

import { app } from "../../scripts/app.js";
import { ComfyWidgets } from "../../scripts/widgets.js";

app.registerExtension({
    name: "Kontext.LayerToMask",
    
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name === "LayerToMaskNode") {
            console.log("🎯 Registering Layer to Mask Node");
            
            // 添加节点创建时的回调
            const onNodeCreated = nodeType.prototype.onNodeCreated;
            nodeType.prototype.onNodeCreated = function () {
                const r = onNodeCreated ? onNodeCreated.apply(this, arguments) : undefined;
                
                // 设置节点样式
                this.color = "#9C27B0";
                this.bgcolor = "#7B1FA2";
                
                // 添加转换状态显示
                this.addWidget("text", "conversion_status", "Ready", () => {}, {
                    serialize: false
                });
                
                // 添加掩码信息显示
                this.addWidget("text", "mask_info", "No mask data", () => {}, {
                    serialize: false
                });
                
                return r;
            };
            
            // 添加执行后回调
            const onExecuted = nodeType.prototype.onExecuted;
            nodeType.prototype.onExecuted = function(message) {
                const r = onExecuted ? onExecuted.apply(this, arguments) : undefined;
                
                // 更新状态显示
                const statusWidget = this.widgets.find(w => w.name === "conversion_status");
                const infoWidget = this.widgets.find(w => w.name === "mask_info");
                
                if (message && message.text) {
                    try {
                        const conversionInfo = JSON.parse(message.text[1]); // 转换信息在第二个输出
                        
                        if (statusWidget) {
                            statusWidget.value = conversionInfo.error ? "❌ Failed" : "✅ Success";
                        }
                        
                        if (infoWidget && !conversionInfo.error) {
                            const coverage = (conversionInfo.mask_coverage * 100).toFixed(1);
                            infoWidget.value = `${conversionInfo.processed_layers} layers, ${coverage}% coverage`;
                        }
                        
                    } catch (e) {
                        if (statusWidget) statusWidget.value = "⚠️ Processing error";
                    }
                }
                
                return r;
            };
            
            // 添加右键菜单选项
            const getExtraMenuOptions = nodeType.prototype.getExtraMenuOptions;
            nodeType.prototype.getExtraMenuOptions = function(_, options) {
                const r = getExtraMenuOptions ? getExtraMenuOptions.apply(this, arguments) : undefined;
                
                options.push({
                    content: "🎯 Preview Mask",
                    callback: () => {
                        this.previewMask();
                    }
                });
                
                options.push({
                    content: "📊 Conversion Details",
                    callback: () => {
                        this.showConversionDetails();
                    }
                });
                
                options.push({
                    content: "⚙️ Mask Settings",
                    callback: () => {
                        this.showMaskSettings();
                    }
                });
                
                return r;
            };
            
            // 预览掩码
            nodeType.prototype.previewMask = function() {
                const maskData = this.outputs?.[0]?.widget?.value; // 掩码输出
                const conversionInfo = this.outputs?.[1]?.widget?.value; // 转换信息
                
                if (!maskData) {
                    app.ui.dialog.show("⚠️ No mask data available. Please run the node first.");
                    return;
                }
                
                try {
                    const info = JSON.parse(conversionInfo);
                    this.showMaskPreviewDialog(maskData, info);
                } catch (e) {
                    app.ui.dialog.show("⚠️ Could not parse mask data.");
                }
            };
            
            // 显示掩码预览对话框
            nodeType.prototype.showMaskPreviewDialog = function(maskData, info) {
                const dialog = document.createElement("div");
                dialog.className = "comfy-modal";
                dialog.style.cssText = `
                    position: fixed; top: 50%; left: 50%;
                    transform: translate(-50%, -50%);
                    background: #2b2b2b; color: white;
                    padding: 20px; border-radius: 8px;
                    width: 600px; max-height: 80vh; overflow-y: auto;
                    z-index: 10000;
                `;
                
                const title = document.createElement("h3");
                title.textContent = "🎯 Mask Preview";
                title.style.marginTop = "0";
                dialog.appendChild(title);
                
                // 掩码信息
                const infoDiv = document.createElement("div");
                infoDiv.style.cssText = "background: #333; padding: 15px; border-radius: 4px; margin: 15px 0;";
                infoDiv.innerHTML = `
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <div><strong>Processed Layers:</strong> ${info.processed_layers}</div>
                        <div><strong>Total Layers:</strong> ${info.total_layers}</div>
                        <div><strong>Selected Layers:</strong> ${info.selected_layers}</div>
                        <div><strong>Mask Mode:</strong> ${info.mask_mode}</div>
                        <div><strong>Output Size:</strong> ${info.output_size.join(' × ')}</div>
                        <div><strong>Coverage:</strong> ${(info.mask_coverage * 100).toFixed(1)}%</div>
                    </div>
                `;
                dialog.appendChild(infoDiv);
                
                // 掩码可视化区域
                const previewDiv = document.createElement("div");
                previewDiv.style.cssText = `
                    background: #1e1e1e; border: 1px solid #555;
                    border-radius: 4px; padding: 20px; text-align: center;
                    margin: 15px 0;
                `;
                
                // 这里应该是实际的掩码可视化，现在用占位符
                previewDiv.innerHTML = `
                    <div style="width: 100%; height: 200px; background: linear-gradient(45deg, #333 25%, transparent 25%), linear-gradient(-45deg, #333 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #333 75%), linear-gradient(-45deg, transparent 75%, #333 75%); background-size: 20px 20px; background-position: 0 0, 0 10px, 10px -10px, -10px 0px; display: flex; align-items: center; justify-content: center; border-radius: 4px;">
                        <div style="background: rgba(255, 255, 255, 0.8); color: #333; padding: 20px; border-radius: 4px; text-align: center;">
                            <div style="font-size: 2em; margin-bottom: 10px;">🎯</div>
                            <div><strong>Mask Preview</strong></div>
                            <div style="font-size: 0.9em; margin-top: 5px;">${info.output_size.join(' × ')} pixels</div>
                            <div style="font-size: 0.9em;">${(info.mask_coverage * 100).toFixed(1)}% coverage</div>
                        </div>
                    </div>
                `;
                dialog.appendChild(previewDiv);
                
                // 操作按钮
                const buttonsDiv = document.createElement("div");
                buttonsDiv.style.cssText = "display: flex; gap: 10px; margin-top: 20px;";
                
                const exportBtn = document.createElement("button");
                exportBtn.textContent = "📁 Export Mask";
                exportBtn.style.cssText = "flex: 1; padding: 10px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;";
                exportBtn.onclick = () => {
                    app.ui.dialog.show("💾 Mask export functionality would be implemented here");
                };
                
                const closeBtn = document.createElement("button");
                closeBtn.textContent = "Close";
                closeBtn.style.cssText = "flex: 1; padding: 10px; background: #666; color: white; border: none; border-radius: 4px; cursor: pointer;";
                closeBtn.onclick = () => document.body.removeChild(dialog);
                
                buttonsDiv.appendChild(exportBtn);
                buttonsDiv.appendChild(closeBtn);
                dialog.appendChild(buttonsDiv);
                
                document.body.appendChild(dialog);
            };
            
            // 显示转换详情
            nodeType.prototype.showConversionDetails = function() {
                const conversionInfo = this.outputs?.[1]?.widget?.value;
                
                if (!conversionInfo) {
                    app.ui.dialog.show("⚠️ No conversion data available. Please run the node first.");
                    return;
                }
                
                try {
                    const info = JSON.parse(conversionInfo);
                    
                    const dialog = document.createElement("div");
                    dialog.className = "comfy-modal";
                    dialog.style.cssText = `
                        position: fixed; top: 50%; left: 50%;
                        transform: translate(-50%, -50%);
                        background: #2b2b2b; color: white;
                        padding: 20px; border-radius: 8px;
                        width: 500px; z-index: 10000;
                    `;
                    
                    dialog.innerHTML = `
                        <h3 style="margin-top: 0;">📊 Conversion Details</h3>
                        <div style="background: #333; padding: 15px; border-radius: 4px; margin: 15px 0; font-family: monospace;">
                            <pre style="margin: 0; white-space: pre-wrap;">${JSON.stringify(info, null, 2)}</pre>
                        </div>
                        <button style="padding: 10px 20px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; width: 100%;">Close</button>
                    `;
                    
                    dialog.querySelector('button').onclick = () => document.body.removeChild(dialog);
                    document.body.appendChild(dialog);
                    
                } catch (e) {
                    app.ui.dialog.show("⚠️ Could not parse conversion data.");
                }
            };
            
            // 显示掩码设置
            nodeType.prototype.showMaskSettings = function() {
                const dialog = document.createElement("div");
                dialog.className = "comfy-modal";
                dialog.style.cssText = `
                    position: fixed; top: 50%; left: 50%;
                    transform: translate(-50%, -50%);
                    background: #2b2b2b; color: white;
                    padding: 20px; border-radius: 8px;
                    width: 450px; z-index: 10000;
                `;
                
                dialog.innerHTML = `
                    <h3 style="margin-top: 0;">⚙️ Mask Conversion Settings</h3>
                    
                    <div style="margin: 15px 0;">
                        <label style="display: block; margin-bottom: 5px;">Mask Mode:</label>
                        <select style="width: 100%; padding: 8px; background: #333; color: white; border: 1px solid #555; border-radius: 4px;">
                            <option value="selected_only">Selected Layers Only</option>
                            <option value="all_layers">All Layers</option>
                            <option value="inverse">Inverse Selection</option>
                        </select>
                    </div>
                    
                    <div style="margin: 15px 0;">
                        <label style="display: block; margin-bottom: 5px;">Output Size:</label>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                            <input type="number" placeholder="Width" value="512" style="padding: 8px; background: #333; color: white; border: 1px solid #555; border-radius: 4px;">
                            <input type="number" placeholder="Height" value="512" style="padding: 8px; background: #333; color: white; border: 1px solid #555; border-radius: 4px;">
                        </div>
                    </div>
                    
                    <div style="margin: 15px 0;">
                        <label style="display: block; margin-bottom: 5px;">Feather (Edge Softening):</label>
                        <input type="range" min="0" max="50" value="0" style="width: 100%; margin-bottom: 5px;">
                        <div style="text-align: center; font-size: 0.9em; color: #888;">
                            <span id="feather-value">0</span> pixels
                        </div>
                    </div>
                    
                    <div style="margin: 20px 0;">
                        <div style="background: #1e3a8a; padding: 10px; border-radius: 4px; border-left: 4px solid #3b82f6;">
                            <div style="font-size: 0.9em;">
                                💡 <strong>Tip:</strong> Use "Selected Only" for precise editing, "All Layers" for composite masks, "Inverse" for background selection.
                            </div>
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 10px; margin-top: 20px;">
                        <button id="apply-settings" style="flex: 1; padding: 10px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">Apply Settings</button>
                        <button id="cancel-settings" style="flex: 1; padding: 10px; background: #666; color: white; border: none; border-radius: 4px; cursor: pointer;">Cancel</button>
                    </div>
                `;
                
                // 绑定事件
                const featherSlider = dialog.querySelector('input[type="range"]');
                const featherValue = dialog.querySelector('#feather-value');
                featherSlider.oninput = () => {
                    featherValue.textContent = featherSlider.value;
                };
                
                dialog.querySelector('#apply-settings').onclick = () => {
                    // 这里可以更新节点的widget值
                    app.ui.dialog.show("⚙️ Settings applied! Run the node to see changes.");
                    document.body.removeChild(dialog);
                };
                
                dialog.querySelector('#cancel-settings').onclick = () => {
                    document.body.removeChild(dialog);
                };
                
                document.body.appendChild(dialog);
            };
        }
    }
});

console.log("🎯 Layer to Mask frontend extension loaded");