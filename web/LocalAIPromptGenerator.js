/**
 * Custom Model Prompt Generator - 前端界面增强
 * 为Custom Model Prompt Generator提供用户友好的界面
 */

import { app } from "/scripts/app.js";
import { ComfyWidgets } from "/scripts/widgets.js";



app.registerExtension({
    name: "CustomModelPromptGenerator",
    
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name === "CustomModelPromptGenerator") {
            
            // 保存原始的 nodeCreated 方法
            const onNodeCreated = nodeType.prototype.onNodeCreated;
            
            nodeType.prototype.onNodeCreated = function() {
                const result = onNodeCreated?.apply(this, arguments);
                
                console.log("[Custom Model Prompt Generator] 🤖 节点已创建");
                
                // 添加自定义样式
                this.addCustomStyles();
                
                // 设置节点颜色
                this.color = "#2D5A87";
                this.bgcolor = "#1E3A5F";
                
                // 添加自定义界面元素
                this.setupCustomUI();
                
                return result;
            };
            
            // 添加自定义方法
            nodeType.prototype.addCustomStyles = function() {
                // 添加自定义样式到页面
                if (!document.getElementById('custom-model-prompt-generator-styles')) {
                    const style = document.createElement('style');
                    style.id = 'custom-model-prompt-generator-styles';
                    style.textContent = `
                        .custom-model-prompt-generator {
                            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        }
                        
                        
                        .model-status {
                            background: #2c3e50;
                            color: #ecf0f1;
                            padding: 4px 8px;
                            border-radius: 4px;
                            font-size: 10px;
                            margin: 2px 0;
                        }
                        
                        .model-status.loaded {
                            background: #27ae60;
                        }
                        
                        .model-status.error {
                            background: #e74c3c;
                        }
                    `;
                    document.head.appendChild(style);
                }
            };
            
            nodeType.prototype.setupCustomUI = function() {
                // 获取widget引用
                const modelFileWidget = this.widgets.find(w => w.name === "model_file");
                
                // 创建模型状态显示
                const statusContainer = document.createElement('div');
                statusContainer.style.cssText = `margin: 5px 0;`;
                
                this.modelStatusDiv = document.createElement('div');
                this.modelStatusDiv.textContent = '模型状态: 未加载';
                this.modelStatusDiv.className = 'model-status';
                statusContainer.appendChild(this.modelStatusDiv);
                
                // 创建目录信息显示
                const dirInfoDiv = document.createElement('div');
                dirInfoDiv.textContent = '模型目录: ComfyUI/models/custom_prompt_models/';
                dirInfoDiv.style.cssText = `
                    color: #95a5a6;
                    font-size: 10px;
                    margin: 2px 0;
                `;
                statusContainer.appendChild(dirInfoDiv);
                
                // 创建刷新按钮
                const refreshBtn = document.createElement('button');
                refreshBtn.textContent = '🔄 刷新模型列表';
                refreshBtn.style.cssText = `
                    background: #3498db;
                    color: white;
                    border: none;
                    padding: 4px 8px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 10px;
                    margin: 2px 0;
                `;
                refreshBtn.addEventListener('click', () => this.refreshModelList());
                statusContainer.appendChild(refreshBtn);
                
                // 将自定义UI添加到节点
                this.addDOMWidget("status", "div", statusContainer);
                
                // 监听模型文件变化
                if (modelFileWidget) {
                    const originalCallback = modelFileWidget.callback;
                    modelFileWidget.callback = (value) => {
                        originalCallback?.(value);
                        this.onModelFileChange(value);
                    };
                }
                
                console.log("[Custom Model Prompt Generator] ✅ 自定义UI设置完成");
            };
            
            // 模型文件变化处理
            nodeType.prototype.onModelFileChange = function(fileName) {
                if (fileName && fileName.trim() && fileName !== "请将.gguf模型文件放入models/custom_prompt_models目录") {
                    if (fileName.endsWith('.gguf')) {
                        this.updateModelStatus('模型文件已选择，等待加载...', 'ready');
                    } else {
                        this.updateModelStatus('错误：需要.gguf格式的模型文件', 'error');
                    }
                } else {
                    this.updateModelStatus('请选择模型文件');
                }
            };
            
            // 更新模型状态
            nodeType.prototype.updateModelStatus = function(message, status = 'default') {
                if (this.modelStatusDiv) {
                    this.modelStatusDiv.textContent = `模型状态: ${message}`;
                    this.modelStatusDiv.className = `model-status ${status}`;
                }
            };
            
            // 刷新模型列表功能
            nodeType.prototype.refreshModelList = async function() {
                this.updateModelStatus('正在刷新模型列表...', 'default');
                
                try {
                    const response = await fetch('/custom_model_generator/refresh_models', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({})
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        // 更新模型文件下拉列表
                        const modelFileWidget = this.widgets.find(w => w.name === "model_file");
                        const modelNameWidget = this.widgets.find(w => w.name === "model_name");
                        
                        if (modelFileWidget && result.model_files) {
                            modelFileWidget.options.values = result.model_files;
                            modelFileWidget.value = result.model_files[0] || "";
                        }
                        
                        if (modelNameWidget && result.model_names) {
                            modelNameWidget.options.values = result.model_names;
                            modelNameWidget.value = result.model_names[0] || "";
                        }
                        
                        this.updateModelStatus(`已找到 ${result.count} 个模型文件`, 'loaded');
                        console.log("[Custom Model] 模型列表已刷新:", result);
                    } else {
                        this.updateModelStatus('刷新失败: ' + (result.error || '未知错误'), 'error');
                    }
                } catch (error) {
                    console.error("[Custom Model] 刷新模型列表失败:", error);
                    this.updateModelStatus('刷新失败: 网络错误', 'error');
                }
            };
            
            // 文件浏览器功能
            nodeType.prototype.openFileBrowser = function() {
                // 创建文件输入元素
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = '.gguf';
                fileInput.style.display = 'none';
                
                fileInput.onchange = (event) => {
                    const file = event.target.files[0];
                    if (file) {
                        const modelPathWidget = this.widgets.find(w => w.name === "model_path");
                        if (modelPathWidget) {
                            modelPathWidget.value = file.name; // 注意：这里只是文件名，实际应用中需要完整路径
                            this.onModelPathChange(file.name);
                        }
                    }
                    document.body.removeChild(fileInput);
                };
                
                document.body.appendChild(fileInput);
                fileInput.click();
            };
        }
    }
});

console.log("[Custom Model Prompt Generator] 🤖 前端扩展已加载");