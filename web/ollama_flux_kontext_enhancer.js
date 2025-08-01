/**
 * OllamaFluxKontextEnhancer 前端JavaScript扩展
 * 
 * 实现动态Ollama模型选择和参数交互
 * 基于comfyui-ollama参考项目的实现模式
 */

import { app } from "../../scripts/app.js";

/**
 * 获取可用的Ollama模型列表 - 通过ComfyUI后端API
 * @param {string} url - Ollama服务地址
 * @returns {Promise<Array<string>>} 模型列表
 */
async function fetchOllamaModels(url) {
    try {
        
        // 额外的URL验证和警告
        if (!url) {
            console.error("❌ URL parameter is empty!");
            url = "http://127.0.0.1:11434";
        }
        
        
        // 通过ComfyUI后端API获取模型，避免CORS问题
        const response = await fetch('/ollama_flux_enhancer/get_models', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                url: url || "http://127.0.0.1:11434"
            })
        });
        
        if (!response.ok) {
            throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
        }
        
        const responseData = await response.json();
        
        // 检查是否是错误响应
        if (responseData.error) {
            console.error(`❌ Backend API returned error: ${responseData.error}`);
            console.error(`🔍 Error details: ${responseData.details}`);
            throw new Error(`Backend API error: ${responseData.error}`);
        }
        
        
        let modelNames = [];
        
        if (Array.isArray(responseData)) {
            modelNames = responseData;
        } else if (responseData && typeof responseData === 'object') {
            if (responseData.models && Array.isArray(responseData.models)) {
                modelNames = responseData.models;
            } else {
                modelNames = [];
            }
        } else {
            modelNames = [];
        }
        
        return modelNames;
        
    } catch (error) {
        console.error(`❌ Failed to fetch Ollama models via backend API: ${error.message}`);
        return [];
    }
}

/**
 * Update model selection widget options
 * @param {Object} widget - Model selection widget
 * @param {Array<string>} models - Model list
 */
function updateModelWidget(widget, models) {
    if (!widget || !Array.isArray(models)) {
        return;
    }

    // Save currently selected model
    const currentModel = widget.value;
    
    // Update options
    widget.options.values = models;
    
    // Restore selected model (if still exists) or select first one
    if (models.length > 0) {
        if (models.includes(currentModel)) {
            widget.value = currentModel;
        } else {
            widget.value = models[0];
        }
    } else {
        widget.value = "";
    }
}

/**
 * Create model refresh button
 * @param {Object} node - ComfyUI node instance
 * @param {Object} modelWidget - Model selection widget
 * @param {Object} urlWidget - URL input widget
 * @returns {Object} Refresh button widget
 */
function createRefreshButton(node, modelWidget, urlWidget) {
    try {
        
        // 创建刷新按钮widget
        const refreshButton = node.addWidget("button", "🔄 Refresh Models", "refresh", () => {
            refreshModels(node, modelWidget, urlWidget);
        });
        
        // 设置按钮样式
        refreshButton.size = [150, 25];
        refreshButton.tooltip = "Click to refresh Ollama model list and get newly installed models";
        
        return refreshButton;
        
    } catch (error) {
        console.error("❌ Failed to create refresh button:", error);
        return null;
    }
}

/**
 * 刷新模型列表
 * @param {Object} node - ComfyUI节点实例
 * @param {Object} modelWidget - 模型选择widget
 * @param {Object} urlWidget - URL输入widget
 */
async function refreshModels(node, modelWidget, urlWidget) {
    try {
        
        // 获取当前URL - 云端环境优化版本
        let currentUrl = "http://127.0.0.1:11434"; // 默认值
        
        // 方法1: 从URL widget获取
        if (urlWidget && urlWidget.value && urlWidget.value.trim() !== "") {
            currentUrl = urlWidget.value.trim();
        } else {
            // 方法2: 从所有widgets中查找URL
            if (node.widgets) {
                for (let i = 0; i < node.widgets.length; i++) {
                    const widget = node.widgets[i];
                    if ((widget.name === "url" || widget.name === "ollama_url") && widget.value && widget.value.trim() !== "") {
                        currentUrl = widget.value.trim();
                        break;
                    }
                }
            }
            
            // 方法3: 检查节点属性
            if (currentUrl === "http://127.0.0.1:11434" && node.properties) {
                if (node.properties.ollama_url) {
                    currentUrl = node.properties.ollama_url;
                }
            }
            
            // 方法4: 尝试从ComfyUI配置中获取
            if (currentUrl === "http://127.0.0.1:11434") {
                // 检查是否有全局配置
                const possibleUrls = [
                    "http://localhost:11434",
                    "http://ollama:11434", 
                    "http://127.0.0.1:11434"
                ];
                
                // 如果在云端环境，尝试非localhost地址
                if (window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
                    currentUrl = "http://localhost:11434"; // 云端localhost
                }
            }
        }
        
        
        // Show loading state
        if (modelWidget) {
            const originalOptions = modelWidget.options.values;
            modelWidget.options.values = ["🔄 Refreshing models..."];
            modelWidget.value = "🔄 Refreshing models...";
            
            // Force redraw
            if (node.graph && node.graph.canvas) {
                node.graph.canvas.setDirty(true);
            }
        }
        
        // Get new model list via backend API
        const models = await fetchOllamaModels(currentUrl);
        
        if (models && models.length > 0) {
            // Add refresh option to beginning of list
            const updatedModels = ["🔄 Refresh model list", ...models];
            updateModelWidget(modelWidget, updatedModels);
            
            // Select first actual model (skip refresh option)
            if (modelWidget && models.length > 0) {
                modelWidget.value = models[0];
            }
            
            
            // Show success notification
            showRefreshNotification(node, `✅ Successfully refreshed! Found ${models.length} models`, "success");
            
        } else {
            // Handle no models case - provide more detailed error info
            const errorMessage = "❌ No models found - Check Ollama service";
            updateModelWidget(modelWidget, [errorMessage]);
            
            // Show detailed troubleshooting info
            showRefreshNotification(node, 
                "❌ No models found\nPlease check:\n1. Is Ollama service running\n2. Are models installed\n3. Is URL configuration correct", 
                "warning"
            );
        }
        
    } catch (error) {
        console.error("❌ Failed to refresh model list via backend API:", error);
        
        // Restore error state
        if (modelWidget) {
            updateModelWidget(modelWidget, ["❌ Refresh failed - Backend API error"]);
        }
        
        // Show error notification
        showRefreshNotification(node, 
            `❌ Refresh failed: ${error.message}\nThis is usually due to CORS policy or network connection issues`, 
            "error"
        );
    }
}

/**
 * Show refresh notification
 * @param {Object} node - ComfyUI node instance
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success/warning/error)
 */
function showRefreshNotification(node, message, type) {
    try {
        // Display message in console
        if (type === "success") {
        } else if (type === "warning") {
        } else {
            console.error(`❌ ${message}`);
        }
        
        // 如果有ComfyUI的通知系统，使用它
        if (typeof app !== 'undefined' && app.ui && app.ui.dialog) {
            // 短暂显示通知，不阻塞用户操作
            const shortMessage = message.split('\n')[0]; // 只显示第一行
            setTimeout(() => {
                if (app.ui.dialog.show) {
                    // 使用ComfyUI的通知系统
                    const notification = document.createElement('div');
                    notification.style.cssText = `
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        padding: 10px 15px;
                        border-radius: 5px;
                        color: white;
                        font-size: 14px;
                        z-index: 10000;
                        max-width: 300px;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                        background-color: ${type === 'success' ? '#28a745' : type === 'warning' ? '#ffc107' : '#dc3545'};
                    `;
                    notification.textContent = shortMessage;
                    document.body.appendChild(notification);
                    
                    // 3秒后自动移除
                    setTimeout(() => {
                        if (notification.parentNode) {
                            notification.parentNode.removeChild(notification);
                        }
                    }, 3000);
                }
            }, 100);
        }
        
    } catch (e) {
    }
}

/**
 * Create status indicator
 * @param {Object} node - ComfyUI node instance
 * @returns {Object} Status indicator widget
 */
function createStatusIndicator(node) {
    try {
        const statusWidget = node.addWidget("text", "📊 Connection Status", "disconnected", () => {});
        statusWidget.disabled = true;
        statusWidget.size = [200, 20];
        return statusWidget;
    } catch (error) {
        console.error("❌ Failed to create status indicator:", error);
        return null;
    }
}

/**
 * Get guidance template content for placeholder
 * @param {string} guidanceStyle - Guidance style
 * @param {string} guidanceTemplate - Guidance template
 * @returns {string} placeholder text
 */
function getTemplateContentForPlaceholder(guidanceStyle, guidanceTemplate) {
    // Preset guidance style content
    const presetGuidance = {
        "efficient_concise": {
            "name": "Efficient Concise Mode",
            "prompt": "You are an efficient AI editor focused on clear, concise Flux Kontext instructions. Generate direct, actionable editing commands..."
        },
        "natural_creative": {
            "name": "Natural Creative Mode",
            "prompt": "You are a creative AI assistant specializing in artistic image editing with Flux Kontext. Focus on natural expression and artistic enhancement..."
        },
        "technical_precise": {
            "name": "Technical Precise Mode",
            "prompt": "You are a technical specialist for Flux Kontext image editing, focused on precision and accuracy. Generate technically precise, unambiguous editing instructions..."
        }
    };
    
    // Template library content
    const templateLibrary = {
        "ecommerce_product": {
            "name": "E-commerce Product Editing",
            "prompt": "You are a professional e-commerce product image editing AI, focused on product display optimization. Maintain product authenticity, avoid over-retouching..."
        },
        "portrait_beauty": {
            "name": "Portrait Beauty Editing",
            "prompt": "You are a professional portrait photography post-processing expert, focused on natural beautification. Maintain natural expressions, avoid excessive beauty filtering..."
        },
        "creative_design": {
            "name": "Creative Design Editing",
            "prompt": "You are a creative designer AI, specializing in artistic image processing. Bold color usage and visual impact..."
        },
        "architecture_photo": {
            "name": "Architecture Photography Editing",
            "prompt": "You are a professional architectural photography post-processing expert, focused on building and spatial aesthetics. Emphasize architectural lines and geometric beauty..."
        },
        "food_photography": {
            "name": "Food Photography Editing",
            "prompt": "You are a professional food photographer, focused on appetizing food presentation. Highlight freshness and appealing textures..."
        },
        "fashion_retail": {
            "name": "Fashion Retail Editing",
            "prompt": "You are a fashion retail visual expert, focused on perfect presentation of clothing and accessories. Highlight garment fit and design details..."
        },
        "landscape_nature": {
            "name": "Landscape Nature Editing",
            "prompt": "You are a natural landscape photography expert, focused on beautiful presentation of nature. Maintain realistic feel and beauty of natural scenery..."
        }
    };
    
    try {
        // Select content based on guidance_style
        if (guidanceStyle === "custom") {
            // Custom mode retains complete prompt text
            return `Enter your custom AI guidance instructions...

For example:
You are a professional image editing expert. Please convert annotation data into clear and concise editing instructions. Focus on:
1. Keep instructions concise
2. Ensure precise operations
3. Maintain style consistency

For more examples, please check guidance_template options.`;
        } else if (guidanceStyle === "template") {
            if (guidanceTemplate && guidanceTemplate !== "none" && templateLibrary[guidanceTemplate]) {
                const template = templateLibrary[guidanceTemplate];
                const preview = template.prompt.substring(0, 200).replace(/\n/g, ' ').trim();
                return `Current template: ${template.name}\n\n${preview}...`;
            } else {
                return "Preview will be displayed here after selecting a template...";
            }
        } else {
            // Display preset style content
            if (presetGuidance[guidanceStyle]) {
                const preset = presetGuidance[guidanceStyle];
                const preview = preset.prompt.substring(0, 200).replace(/\n/g, ' ').trim();
                return `Current style: ${preset.name}\n\n${preview}...`;
            } else {
                return `Enter your custom AI guidance instructions...

For example:
You are a professional image editing expert. Please convert annotation data into clear and concise editing instructions. Focus on:
1. Keep instructions concise
2. Ensure precise operations
3. Maintain style consistency

For more examples, please check guidance_template options.`;
            }
        }
    } catch (error) {
        console.error("Failed to get template content:", error);
        return `Enter your custom AI guidance instructions...

For example:
You are a professional image editing expert. Please convert annotation data into clear and concise editing instructions. Focus on:
1. Keep instructions concise
2. Ensure precise operations
3. Maintain style consistency

For more examples, please check guidance_template options.`;
    }
}

/**
 * 设置引导widget之间的交互
 * @param {Object} node - ComfyUI节点实例
 * @param {Object} guidanceStyleWidget - 引导风格widget
 * @param {Object} guidanceTemplateWidget - 引导模板widget
 * @param {Object} customGuidanceWidget - 自定义引导widget
 */
function setupGuidanceWidgetsInteraction(node, guidanceStyleWidget, guidanceTemplateWidget, customGuidanceWidget) {
    if (!guidanceStyleWidget || !customGuidanceWidget) {
        return;
    }


    // 保存原始回调
    const originalStyleCallback = guidanceStyleWidget.callback;
    const originalTemplateCallback = guidanceTemplateWidget?.callback;

    // 更新placeholder的函数
    function updateCustomGuidancePlaceholder() {
        try {
            const currentStyle = guidanceStyleWidget.value;
            const currentTemplate = guidanceTemplateWidget ? guidanceTemplateWidget.value : "none";
            
            
            const newPlaceholder = getTemplateContentForPlaceholder(currentStyle, currentTemplate);
            
            if (customGuidanceWidget.inputEl) {
                customGuidanceWidget.inputEl.placeholder = newPlaceholder;
            } else {
            }
            
            // 强制重绘
            if (node.graph && node.graph.canvas) {
                node.graph.canvas.setDirty(true);
            }
        } catch (error) {
            console.error("❌ Error updating custom guidance placeholder:", error);
        }
    }

    // 设置引导风格变化回调
    guidanceStyleWidget.callback = function(value, ...args) {
        
        // 更新placeholder
        setTimeout(updateCustomGuidancePlaceholder, 100);
        
        // 调用原始回调
        if (originalStyleCallback) {
            originalStyleCallback.apply(this, [value, ...args]);
        }
    };

    // 设置引导模板变化回调
    if (guidanceTemplateWidget) {
        guidanceTemplateWidget.callback = function(value, ...args) {
            
            // 更新placeholder
            setTimeout(updateCustomGuidancePlaceholder, 100);
            
            // 调用原始回调
            if (originalTemplateCallback) {
                originalTemplateCallback.apply(this, [value, ...args]);
            }
        };
    }

    // 初始化placeholder
    setTimeout(updateCustomGuidancePlaceholder, 200);
    
}

/**
 * 设置保存指导模板的UI增强 - 从js/ollama_flux_kontext_enhancer.js合并
 * @param {Object} node - 节点对象
 */
function setupSaveGuidanceUI(node) {
    try {
        // 查找相关widgets
        const customGuidanceWidget = node.widgets.find(w => w.name === "custom_guidance");
        const saveGuidanceWidget = node.widgets.find(w => w.name === "save_guidance");
        const guidanceNameWidget = node.widgets.find(w => w.name === "guidance_name");
        const loadGuidanceWidget = node.widgets.find(w => w.name === "load_saved_guidance");
        
        if (!saveGuidanceWidget || !guidanceNameWidget || !loadGuidanceWidget) {
            return;
        }

        // 隐藏原始widgets
        saveGuidanceWidget.hidden = true;
        guidanceNameWidget.hidden = true;
        loadGuidanceWidget.hidden = true;

        // 创建自定义保存UI容器
        const saveContainer = document.createElement("div");
        saveContainer.className = "kontext-save-guidance-container";
        saveContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 1px;
            padding: 2px;
            background: #333;
            border-radius: 2px;
            margin: 0px;
            max-width: 100%;
        `;
        
        // 创建标题
        const titleLabel = document.createElement("div");
        titleLabel.textContent = "Guidance Management";
        titleLabel.style.cssText = `
            color: #ccc;
            font-size: 7px;
            font-weight: bold;
            margin-bottom: 0px;
            line-height: 1;
        `;
        
        // 创建加载下拉框
        const loadSelect = document.createElement("select");
        loadSelect.className = "kontext-load-guidance-select";
        loadSelect.style.cssText = `
            padding: 0px 2px;
            border: 1px solid #555;
            border-radius: 1px;
            background: #444;
            color: white;
            font-size: 7px;
            margin-bottom: 0px;
            height: 14px;
            line-height: 1;
        `;
        
        // 填充加载选项
        const updateLoadOptions = () => {
            loadSelect.innerHTML = '<option value="none">Load saved...</option>';
            if (loadGuidanceWidget.options && loadGuidanceWidget.options.values) {
                loadGuidanceWidget.options.values.forEach(option => {
                    if (option !== "none") {
                        const optionElement = document.createElement("option");
                        optionElement.value = option;
                        optionElement.textContent = option;
                        loadSelect.appendChild(optionElement);
                    }
                });
            }
        };
        updateLoadOptions();
        
        loadSelect.addEventListener("change", () => {
            if (loadSelect.value !== "none") {
                loadGuidanceWidget.value = loadSelect.value;
                // 触发回调来加载内容
                if (loadGuidanceWidget.callback) {
                    loadGuidanceWidget.callback(loadSelect.value);
                }
            }
        });
        
        // 创建输入和按钮的容器
        const inputContainer = document.createElement("div");
        inputContainer.style.cssText = `
            display: flex;
            gap: 1px;
            align-items: center;
        `;
        
        // 创建名称输入框
        const nameInput = document.createElement("input");
        nameInput.type = "text";
        nameInput.placeholder = "Enter name...";
        nameInput.className = "kontext-guidance-name-input";
        nameInput.value = guidanceNameWidget.value;
        nameInput.style.cssText = `
            flex: 1;
            padding: 2px 4px;
            border: 1px solid #555;
            border-radius: 2px;
            background: #444;
            color: white;
            font-size: 8px;
            height: 16px;
        `;
        nameInput.addEventListener("change", () => {
            guidanceNameWidget.value = nameInput.value;
        });

        // 创建保存按钮
        const saveButton = document.createElement("button");
        saveButton.textContent = "💾 Save";
        saveButton.className = "kontext-save-guidance-button";
        saveButton.style.cssText = `
            padding: 2px 6px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 2px;
            cursor: pointer;
            font-size: 8px;
            transition: background 0.3s;
            white-space: nowrap;
            height: 20px;
        `;
        saveButton.addEventListener("mouseenter", () => {
            saveButton.style.background = "#45a049";
        });
        saveButton.addEventListener("mouseleave", () => {
            saveButton.style.background = "#4CAF50";
        });
        saveButton.addEventListener("click", () => {
            if (!guidanceNameWidget.value.trim()) {
                alert("Please enter a name for the guidance.");
                return;
            }
            
            // 设置保存标志
            saveGuidanceWidget.value = true;
            
            // 用户反馈
            const originalText = saveButton.textContent;
            saveButton.textContent = "✅ Saved!";
            saveButton.style.background = "#FF9800";
            
            // 显示通知
            if (window.KontextUtils) {
                window.KontextUtils.showNotification(
                    `Guidance "${guidanceNameWidget.value}" will be saved on next queue.`,
                    'success'
                );
            } else {
                // 使用更简洁的提示
            }
            
            // 重置按钮状态
            setTimeout(() => {
                saveButton.textContent = originalText;
                saveButton.style.background = "#4CAF50";
                saveGuidanceWidget.value = false;
                // 更新加载选项
                updateLoadOptions();
            }, 2000);
        });
        
        // 组装UI
        inputContainer.appendChild(nameInput);
        inputContainer.appendChild(saveButton);
        
        saveContainer.appendChild(titleLabel);
        saveContainer.appendChild(loadSelect);
        saveContainer.appendChild(inputContainer);

        // 添加到节点的DOM widgets
        const customWidget = node.addDOMWidget("save_guidance_ui", "save_guidance_ui", saveContainer, {
            getValue() { return this.value; },
            setValue(v) { this.value = v; }
        });
        
        customWidget.computeSize = function(size) {
            return [size && size[0] ? size[0] : 200, 28]; // 调整高度为更紧凑的28px
        };

        // 强制设置widget的定位属性
        customWidget.widget = saveContainer;
        customWidget.options = customWidget.options || {};
        customWidget.options.serialize = false; // 不序列化DOM元素
        
        // 确保widget正确定位在节点内部
        if (saveContainer.style) {
            saveContainer.style.position = 'relative';
            saveContainer.style.zIndex = '1';
        }

        // 序列化支持
        const onSerialize = node.onSerialize;
        node.onSerialize = function(o) {
            onSerialize?.apply(this, arguments);
            // 确保guidance_name值是最新的
            const guidanceNameIndex = this.widgets.findIndex(w => w.name === "guidance_name");
            if (guidanceNameIndex !== -1) {
                o.widgets_values[guidanceNameIndex] = guidanceNameWidget.value;
            }
        };

        
    } catch (error) {
        console.error("❌ Error setting up save guidance UI:", error);
    }
}

// 添加全局样式以强制节点颜色 - 紫色主题保持原始倒角
function addGlobalNodeStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .litegraph .node.OllamaFluxKontextEnhancerV2 {
            background-color: #512DA8 !important;
            border-color: #673AB7 !important;
            border-radius: 4px !important;
        }
        .litegraph .node.OllamaFluxKontextEnhancerV2 .title {
            background-color: #673AB7 !important;
            color: #FFFFFF !important;
            border-radius: 4px 4px 0 0 !important;
        }
    `;
    document.head.appendChild(style);
}

// 立即添加样式
addGlobalNodeStyles();

// 注册ComfyUI扩展
app.registerExtension({
    name: "KontextOllamaFluxEnhancer",
    
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        // 处理所有Ollama增强器节点类型
        if (nodeData.name !== "OllamaFluxKontextEnhancerV2") {
            return;
        }
        
        // 重写节点创建方法
        const onNodeCreated = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = function() {
            const r = onNodeCreated?.apply(this, arguments);
            
            // 创建Ollama增强器节点
            
            // 设置节点颜色为紫色主题，保持原始倒角
            this.color = "#673AB7";     // 主色调 - 深度紫色
            this.bgcolor = "#512DA8";   // 背景色 - 更深的紫色
            
            // 强制设置节点的图形属性，不改变shape以保持倒角
            this.boxcolor = "#673AB7";
            this.titlecolor = "#FFFFFF";
            
            // 设置所有可能的颜色属性
            this.node_color = "#673AB7";
            this.node_bgcolor = "#512DA8";
            this.header_color = "#673AB7";
            this.border_color = "#673AB7";
            
            // 节点颜色已设置为紫色主题
            
            // 尝试直接设置DOM元素样式
            if (this.canvas && this.canvas.canvas) {
                const canvas = this.canvas.canvas;
                canvas.style.backgroundColor = "#512DA8";
                canvas.style.borderColor = "#673AB7";
            }
            
            // 设置节点的CSS类名以应用样式
            if (this.dom) {
                this.dom.className += " OllamaFluxKontextEnhancerV2";
            }
            
            // 强制刷新节点外观 - 多种方式确保生效
            if (this.setDirtyCanvas) {
                this.setDirtyCanvas(true);
            }
            if (this.graph && this.graph.canvas) {
                this.graph.canvas.setDirty(true);
            }
            // 延迟再次设置确保生效
            setTimeout(() => {
                this.color = "#673AB7";
                this.bgcolor = "#512DA8";
                this.boxcolor = "#673AB7";
                this.titlecolor = "#FFFFFF";
                this.node_color = "#673AB7";
                this.node_bgcolor = "#512DA8";
                this.header_color = "#673AB7";
                this.border_color = "#673AB7";
                
                if (this.graph && this.graph.canvas) {
                    this.graph.canvas.setDirty(true);
                }
            }, 100);
            
            // 定期强制设置颜色 - 确保颜色不被覆盖
            const colorInterval = setInterval(() => {
                if (this.color !== "#673AB7" || this.bgcolor !== "#512DA8") {
                    this.color = "#673AB7";
                    this.bgcolor = "#512DA8";
                    this.boxcolor = "#673AB7";
                    this.titlecolor = "#FFFFFF";
                    
                    if (this.graph && this.graph.canvas) {
                        this.graph.canvas.setDirty(true);
                    }
                }
            }, 1000);
            
            // 节点销毁时清理定时器
            const originalOnRemoved = this.onRemoved;
            this.onRemoved = function() {
                if (colorInterval) {
                    clearInterval(colorInterval);
                }
                if (originalOnRemoved) {
                    originalOnRemoved.call(this);
                }
            };
            
            // 强制重写onDrawBackground方法来确保颜色显示
            const originalOnDrawBackground = this.onDrawBackground;
            this.onDrawBackground = function(ctx) {
                // 先设置颜色
                this.color = "#673AB7";
                this.bgcolor = "#512DA8";
                
                // 调用原始方法
                if (originalOnDrawBackground) {
                    originalOnDrawBackground.call(this, ctx);
                }
            };
            
            // 也重写onDrawForeground方法
            const originalOnDrawForeground = this.onDrawForeground;
            this.onDrawForeground = function(ctx) {
                // 确保颜色设置
                this.color = "#673AB7";
                this.bgcolor = "#512DA8";
                
                // 调用原始方法
                if (originalOnDrawForeground) {
                    originalOnDrawForeground.call(this, ctx);
                }
            };
            
            // 重写computeSize方法确保颜色在重新计算大小时保持
            const originalComputeSize = this.computeSize;
            this.computeSize = function(out) {
                const result = originalComputeSize ? originalComputeSize.call(this, out) : [200, 100];
                
                // 在大小重新计算后确保颜色设置
                this.color = "#673AB7";
                this.bgcolor = "#512DA8";
                
                return result;
            };
            
            // 查找相关widgets
            let modelWidget = null;
            let urlWidget = null;
            let guidanceStyleWidget = null;
            let guidanceTemplateWidget = null;
            let customGuidanceWidget = null;
            
            for (const widget of this.widgets) {
                if (widget.name === "model") {
                    modelWidget = widget;
                } else if (widget.name === "url") {
                    urlWidget = widget;
                } else if (widget.name === "guidance_style") {
                    guidanceStyleWidget = widget;
                } else if (widget.name === "guidance_template") {
                    guidanceTemplateWidget = widget;
                } else if (widget.name === "custom_guidance") {
                    customGuidanceWidget = widget;
                }
            }
            
            // 恢复刷新按钮，并放到温度参数附近
            if (modelWidget) {
                const refreshButton = createRefreshButton(this, modelWidget, urlWidget);
                if (refreshButton) {
                    // 将刷新按钮移动到紧接在 model 之后
                    const modelIndex = this.widgets.findIndex(w => w.name === "model");
                    if (modelIndex !== -1) {
                        // 移除刷新按钮从当前位置
                        const buttonIndex = this.widgets.indexOf(refreshButton);
                        if (buttonIndex !== -1) {
                            this.widgets.splice(buttonIndex, 1);
                        }
                        // 插入到 model 之后
                        this.widgets.splice(modelIndex + 1, 0, refreshButton);
                    }
                }
                
                // 处理模型选择变化，支持刷新功能
                const originalCallback = modelWidget.callback;
                modelWidget.callback = function(value, ...args) {
                    // 如果选择了刷新选项，触发刷新
                    if (value === "🔄 Refresh model list" || value === "🔄 刷新模型列表") {
                        refreshModels(this.node || this, modelWidget, urlWidget);
                        return;
                    }
                    
                    // 否则调用原始回调
                    if (originalCallback) {
                        originalCallback.apply(this, [value, ...args]);
                    }
                };
                
            } else {
            }
            
            // 设置引导widgets交互
            if (guidanceStyleWidget && customGuidanceWidget) {
                setupGuidanceWidgetsInteraction(this, guidanceStyleWidget, guidanceTemplateWidget, customGuidanceWidget);
            } else {
            }

            // 不使用DOM widget的Guidance管理 - 直接优化现有控件
            const saveGuidanceWidget = this.widgets.find(w => w.name === "save_guidance");
            const guidanceNameWidget = this.widgets.find(w => w.name === "guidance_name");
            const loadGuidanceWidget = this.widgets.find(w => w.name === "load_saved_guidance");
            
            // 确保控件可见
            if (saveGuidanceWidget) saveGuidanceWidget.hidden = false;
            if (guidanceNameWidget) guidanceNameWidget.hidden = false;
            if (loadGuidanceWidget) loadGuidanceWidget.hidden = false;
            
            // 优化控件标签显示
            if (guidanceNameWidget) {
                guidanceNameWidget.name = "💾 Guidance Name";
            }
            if (loadGuidanceWidget) {
                loadGuidanceWidget.name = "📁 Load Saved Guidance";
            }
            if (saveGuidanceWidget) {
                saveGuidanceWidget.name = "💾 Save Current Guidance";
            }
            
            // 将custom_guidance文本框移动到最底部
            if (customGuidanceWidget) {
                // 找到当前custom_guidance的位置
                const currentIndex = this.widgets.indexOf(customGuidanceWidget);
                if (currentIndex !== -1) {
                    // 移除当前位置的custom_guidance
                    this.widgets.splice(currentIndex, 1);
                    // 添加到最底部
                    this.widgets.push(customGuidanceWidget);
                }
                
                // 设置文本框大小 - 固定5行，完全不可拉伸
                if (customGuidanceWidget.inputEl) {
                    customGuidanceWidget.inputEl.rows = 5;  // 固定为5行
                    customGuidanceWidget.inputEl.style.resize = 'none';     // 禁用拉伸
                    customGuidanceWidget.inputEl.style.minHeight = '90px';   // 固定最小高度
                    customGuidanceWidget.inputEl.style.maxHeight = '90px';   // 固定最大高度
                    customGuidanceWidget.inputEl.style.height = '90px';      // 固定默认高度
                }
            }
            
            const editDescriptionWidget = this.widgets.find(w => w.name === "edit_description");
            if (editDescriptionWidget && editDescriptionWidget.inputEl) {
                editDescriptionWidget.inputEl.rows = 5;  // 固定为5行
                editDescriptionWidget.inputEl.style.resize = 'none';     // 禁用拉伸
                editDescriptionWidget.inputEl.style.minHeight = '90px';   // 固定最小高度
                editDescriptionWidget.inputEl.style.maxHeight = '90px';   // 固定最大高度
                editDescriptionWidget.inputEl.style.height = '90px';      // 固定默认高度
            }

            // 简化的节点大小调整 - 避免文本框折叠
            setTimeout(() => {
                // 获取当前节点的自动计算大小
                const originalSize = this.size ? [...this.size] : [300, 200];
                
                // 让ComfyUI先自动计算一次
                if (this.computeSize) {
                    this.computeSize();
                }
                
                // 确保节点高度足够容纳固定的文本框
                const minimumHeight = 600; // 设置一个合理的最小高度
                if (this.size && this.size[1] < minimumHeight) {
                    this.size[1] = minimumHeight;
                }
                
                // 标记为需要重绘
                if (this.setDirtyCanvas) {
                    this.setDirtyCanvas(true);
                }
                
            }, 100);

            return r;
        };
        
        // 添加节点序列化支持
        const onSerialize = nodeType.prototype.onSerialize;
        nodeType.prototype.onSerialize = function(o) {
            if (onSerialize) {
                onSerialize.apply(this, arguments);
            }
            
            // Save currently selected model
            const modelWidget = this.widgets?.find(w => w.name === "model");
            if (modelWidget && modelWidget.value) {
                o.model_selection = modelWidget.value;
            }
        };
        
        // 添加节点反序列化支持
        const onConfigure = nodeType.prototype.onConfigure;
        nodeType.prototype.onConfigure = function(o) {
            if (onConfigure) {
                onConfigure.apply(this, arguments);
            }
            
            // 恢复模型选择
            if (o.model_selection) {
                const modelWidget = this.widgets?.find(w => w.name === "model");
                if (modelWidget) {
                    // 延迟恢复，确保模型列表已加载
                    setTimeout(() => {
                        if (modelWidget.options.values.includes(o.model_selection)) {
                            modelWidget.value = o.model_selection;
                        }
                    }, 2000);
                }
            }
        };
    },
    
    async setup() {
    }
});

// 导出工具函数供其他模块使用
export {
    fetchOllamaModels,
    updateModelWidget,
    createRefreshButton,
    createStatusIndicator,
    getTemplateContentForPlaceholder,
    setupGuidanceWidgetsInteraction,
    setupSaveGuidanceUI
};