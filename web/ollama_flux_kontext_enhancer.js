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
        console.log(`🔄 Fetching Ollama model list via backend API: ${url}`);
        
        // 额外的URL验证和警告
        if (!url) {
            console.error("❌ URL parameter is empty!");
            url = "http://127.0.0.1:11434";
        }
        
        if (url === "http://127.0.0.1:11434") {
            console.warn("⚠️ Using default localhost address, may fail to connect in cloud environments");
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
        
        // Handle normal model list response - debug version
        console.log(`🔍 Raw response data:`, responseData);
        console.log(`🔍 Response data type:`, typeof responseData);
        console.log(`🔍 Is array:`, Array.isArray(responseData));
        
        let modelNames = [];
        
        if (Array.isArray(responseData)) {
            modelNames = responseData;
            console.log(`✅ Response is array format, using directly`);
        } else if (responseData && typeof responseData === 'object') {
            if (responseData.models && Array.isArray(responseData.models)) {
                modelNames = responseData.models;
                console.log(`✅ Getting from response object's models field`);
            } else {
                console.warn(`⚠️ Response object format abnormal:`, responseData);
                modelNames = [];
            }
        } else {
            console.warn(`⚠️ Response format incorrect:`, responseData);
            modelNames = [];
        }
        
        console.log(`✅ Successfully fetched ${modelNames.length} models via backend API:`, modelNames);
        return modelNames;
        
    } catch (error) {
        console.error(`❌ Failed to fetch Ollama models via backend API: ${error.message}`);
        console.log(`ℹ️ Attempting fallback to backend model detection...`);
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
        console.warn("⚠️ Invalid widget or model list");
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
        console.log(`🎯 Model selection updated to: ${widget.value}`);
    } else {
        widget.value = "";
        console.warn("⚠️ No available models");
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
        console.log("🔄 Creating model refresh button");
        
        // 创建刷新按钮widget
        const refreshButton = node.addWidget("button", "🔄 Refresh Models", "refresh", () => {
            refreshModels(node, modelWidget, urlWidget);
        });
        
        // 设置按钮样式
        refreshButton.size = [150, 25];
        refreshButton.tooltip = "Click to refresh Ollama model list and get newly installed models";
        
        console.log("✅ Model refresh button created successfully");
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
        console.log("🔄 Starting model list refresh via backend API");
        
        // 获取当前URL - 云端环境优化版本
        let currentUrl = "http://127.0.0.1:11434"; // 默认值
        
        // 方法1: 从URL widget获取
        if (urlWidget && urlWidget.value && urlWidget.value.trim() !== "") {
            currentUrl = urlWidget.value.trim();
            console.log(`📍 使用URL widget配置: ${currentUrl}`);
        } else {
            // 方法2: 从所有widgets中查找URL
            console.log("🔍 URL widget为空，搜索所有widgets...");
            if (node.widgets) {
                for (let i = 0; i < node.widgets.length; i++) {
                    const widget = node.widgets[i];
                    if ((widget.name === "url" || widget.name === "ollama_url") && widget.value && widget.value.trim() !== "") {
                        currentUrl = widget.value.trim();
                        console.log(`📍 在widgets[${i}]中找到URL: ${currentUrl}`);
                        break;
                    }
                }
            }
            
            // 方法3: 检查节点属性
            if (currentUrl === "http://127.0.0.1:11434" && node.properties) {
                if (node.properties.ollama_url) {
                    currentUrl = node.properties.ollama_url;
                    console.log(`📍 使用节点属性URL: ${currentUrl}`);
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
                    console.log("🌐 检测到云端环境，优先尝试非localhost地址");
                    currentUrl = "http://localhost:11434"; // 云端localhost
                }
            }
        }
        
        console.log(`🎯 Final URL being used: ${currentUrl}`);
        
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
            
            console.log(`✅ Successfully refreshed model list via backend API, found ${models.length} models`);
            
            // Show success notification
            showRefreshNotification(node, `✅ Successfully refreshed! Found ${models.length} models`, "success");
            
        } else {
            // Handle no models case - provide more detailed error info
            const errorMessage = "❌ No models found - Check Ollama service";
            updateModelWidget(modelWidget, [errorMessage]);
            console.warn("⚠️ No models retrieved via backend API");
            
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
            console.log(`✅ ${message}`);
        } else if (type === "warning") {
            console.warn(`⚠️ ${message}`);
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
        console.log("Cannot display notification:", e);
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
        console.warn("⚠️ Required widgets not found for guidance interaction setup");
        return;
    }

    console.log("🔗 Setting up guidance widgets interaction");

    // 保存原始回调
    const originalStyleCallback = guidanceStyleWidget.callback;
    const originalTemplateCallback = guidanceTemplateWidget?.callback;

    // 更新placeholder的函数
    function updateCustomGuidancePlaceholder() {
        try {
            const currentStyle = guidanceStyleWidget.value;
            const currentTemplate = guidanceTemplateWidget ? guidanceTemplateWidget.value : "none";
            
            console.log(`🔄 Updating placeholder for style: ${currentStyle}, template: ${currentTemplate}`);
            
            const newPlaceholder = getTemplateContentForPlaceholder(currentStyle, currentTemplate);
            
            if (customGuidanceWidget.inputEl) {
                customGuidanceWidget.inputEl.placeholder = newPlaceholder;
                console.log("✅ Placeholder updated successfully");
            } else {
                console.warn("⚠️ Custom guidance input element not found");
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
        console.log(`🎨 Guidance style changed to: ${value}`);
        
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
            console.log(`📋 Guidance template changed to: ${value}`);
            
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
    
    console.log("✅ Guidance widgets interaction setup completed");
}

// 注册ComfyUI扩展
app.registerExtension({
    name: "KontextOllamaFluxEnhancer",
    
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        // 只处理OllamaFluxKontextEnhancer节点 (注意V2版本)
        if (nodeData.name !== "OllamaFluxKontextEnhancerV2") {
            return;
        }
        
        console.log("🔧 初始化OllamaFluxKontextEnhancer前端扩展");
        
        // 重写节点创建方法
        const onNodeCreated = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = function() {
            // 调用原始创建方法
            if (onNodeCreated) {
                onNodeCreated.apply(this, arguments);
            }
            
            console.log("🏗️ 创建OllamaFluxKontextEnhancerV2节点");
            
            // 查找相关widgets
            let modelWidget = null;
            let urlWidget = null;
            let guidanceStyleWidget = null;
            let guidanceTemplateWidget = null;
            let customGuidanceWidget = null;
            
            for (const widget of this.widgets) {
                if (widget.name === "model") {
                    modelWidget = widget;
                    console.log("🎯 找到模型选择widget");
                } else if (widget.name === "url") {
                    urlWidget = widget;
                    console.log("🔗 找到URL输入widget");
                } else if (widget.name === "guidance_style") {
                    guidanceStyleWidget = widget;
                    console.log("🎨 找到引导风格widget");
                } else if (widget.name === "guidance_template") {
                    guidanceTemplateWidget = widget;
                    console.log("📋 找到引导模板widget");
                } else if (widget.name === "custom_guidance") {
                    customGuidanceWidget = widget;
                    console.log("✏️ 找到自定义引导widget");
                }
            }
            
            // 添加刷新按钮
            if (modelWidget) {
                const refreshButton = createRefreshButton(this, modelWidget, urlWidget);
                if (refreshButton) {
                    console.log("✅ 模型刷新按钮已添加");
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
                
                console.log("✅ OllamaFluxKontextEnhancerV2前端扩展初始化完成");
            } else {
                console.warn("⚠️ 未找到模型选择widget");
            }
            
            // 设置引导widgets交互
            if (guidanceStyleWidget && customGuidanceWidget) {
                setupGuidanceWidgetsInteraction(this, guidanceStyleWidget, guidanceTemplateWidget, customGuidanceWidget);
                console.log("✅ Ollama版本引导系统初始化完成 (包含自定义模板功能)");
            } else {
                console.warn("⚠️ 未找到必要的引导widgets，跳过交互设置");
                console.log("✅ 引导系统初始化完成 (基础功能)");
            }
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
        console.log("🚀 OllamaFluxKontextEnhancerV2扩展加载完成");
    }
});

// 导出工具函数供其他模块使用
export {
    fetchOllamaModels,
    updateModelWidget,
    createRefreshButton,
    createStatusIndicator,
    getTemplateContentForPlaceholder,
    setupGuidanceWidgetsInteraction
};