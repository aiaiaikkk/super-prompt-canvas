/**
 * APIFluxKontextEnhancer 前端JavaScript扩展
 * 
 * 实现动态guidance联动和placeholder更新
 */

import { app } from "../../scripts/app.js";

/**
 * 获取引导模板内容用于placeholder
 * @param {string} guidanceStyle - 引导风格
 * @param {string} guidanceTemplate - 引导模板
 * @returns {string} placeholder文本
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
        // 根据guidance_style选择内容
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
        return `输入您的自定义AI引导指令...

例如：
你是专业的图像编辑专家，请将标注数据转换为简洁明了的编辑指令。重点关注：
1. 保持指令简洁
2. 确保操作精确
3. 维持风格一致性

更多示例请查看guidance_template选项。`;
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
    name: "LRPG.APIEnhancer.Extension",
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        // Check for API Flux Kontext Enhancer node (handle multiple possible names)
        const isAPIFluxNode = nodeData.name === "APIFluxKontextEnhancer" || 
                              nodeData.name === "API_flux_kontext_enhancer" ||
                              (nodeData.name && nodeData.name.includes("APIFlux")) ||
                              (nodeData.name && nodeData.name.includes("API_flux")) ||
                              (nodeData.display_name && nodeData.display_name.includes("APIFlux")) ||
                              (nodeData.display_name && nodeData.display_name.includes("API_flux"));
        
        if (!isAPIFluxNode) {
            return;
        }
        
        // 重写nodeCreated方法，立即设置颜色（像Ollama节点一样）
        const originalNodeCreated = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = function () {
            const result = originalNodeCreated?.apply(this, arguments);

            // 立即设置紫色主题，保持原始倒角
            this.color = "#673AB7";     // 主色调 - 深度紫色
            this.bgcolor = "#512DA8";   // 背景色 - 更深的紫色
            this.boxcolor = "#673AB7";
            this.titlecolor = "#FFFFFF";
            this.node_color = "#673AB7";
            this.node_bgcolor = "#512DA8";
            this.header_color = "#673AB7";
            this.border_color = "#673AB7";

            // 强制重绘
            if (this.graph && this.graph.canvas) {
                this.graph.canvas.setDirty(true);
            }

            // 延迟再次设置确保生效（和Ollama一样）
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

            // 定期强制设置颜色（和Ollama一样）
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
                clearInterval(colorInterval);
                if (originalOnRemoved) {
                    originalOnRemoved.call(this);
                }
            };

            // 重写onDrawBackground方法来确保颜色显示（和Ollama一样）
            const originalOnDrawBackground = this.onDrawBackground;
            this.onDrawBackground = function(ctx) {
                this.color = "#673AB7";
                this.bgcolor = "#512DA8";
                
                if (originalOnDrawBackground) {
                    originalOnDrawBackground.call(this, ctx);
                }
            };

            // 重写onDrawForeground方法（和Ollama一样）
            const originalOnDrawForeground = this.onDrawForeground;
            this.onDrawForeground = function(ctx) {
                this.color = "#673AB7";
                this.bgcolor = "#512DA8";
                
                if (originalOnDrawForeground) {
                    originalOnDrawForeground.call(this, ctx);
                }
            };

            return result;
        };
        
        // 保留原有的onConstructed逻辑作为备用
        const originalConstructor = nodeType.prototype.onConstructed;
        nodeType.prototype.onConstructed = function () {
            const result = originalConstructor?.apply(this, arguments);

            // 再次确保颜色设置
            this.color = "#673AB7";
            this.bgcolor = "#512DA8";
            this.boxcolor = "#673AB7";
            this.titlecolor = "#FFFFFF";
            this.node_color = "#673AB7";
            this.node_bgcolor = "#512DA8";
            this.header_color = "#673AB7";
            this.border_color = "#673AB7";
            
            // 强制刷新节点外观
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
                
                if (this.graph && this.graph.canvas) {
                    this.graph.canvas.setDirty(true);
                }
                console.log("🎨 APIFlux延迟颜色设置完成");
            }, 100);
            
            // 删除错误的CSS样式代码
            
            // 定期强制设置颜色 - 确保颜色不被覆盖
            const colorInterval = setInterval(() => {
                if (this.color !== "#673AB7" || this.bgcolor !== "#512DA8") {
                    this.color = "#673AB7";
                    this.bgcolor = "#512DA8";
                    this.boxcolor = "#673AB7";
                    this.titlecolor = "#FFFFFF";
                    
                    // 直接设置DOM元素的样式
                    if (this.canvas && this.canvas.canvas) {
                        this.canvas.canvas.style.backgroundColor = "#512DA8";
                        this.canvas.canvas.style.borderColor = "#673AB7";
                    }
                    
                    if (this.graph && this.graph.canvas) {
                        this.graph.canvas.setDirty(true);
                    }
                    console.log("🎨 APIFlux颜色被重置，重新设置为紫色主题");
                }
            }, 1000);
            
            // 强制重写onDrawBackground方法来确保颜色显示
            const originalOnDrawBackground = this.onDrawBackground;
            this.onDrawBackground = function(ctx) {
                // 先设置颜色
                this.color = "#673AB7";
                this.bgcolor = "#512DA8";
                this.boxcolor = "#673AB7";
                
                // 直接在canvas上绘制紫色背景
                if (ctx) {
                    ctx.fillStyle = "#512DA8";
                    ctx.fillRect(0, 0, this.size[0], this.size[1]);
                    
                    // 绘制边框
                    ctx.strokeStyle = "#673AB7";
                    ctx.lineWidth = 2;
                    ctx.strokeRect(0, 0, this.size[0], this.size[1]);
                }
                
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

            // 使用setTimeout延迟执行，确保DOM元素已准备好
            setTimeout(() => {
                try {
                    // 保存按钮功能增强
                    const saveGuidanceNameWidget = this.widgets.find(w => w.name === "save_guidance_name");
                    const saveGuidanceButtonWidget = this.widgets.find(w => w.name === "save_guidance_button");

                    if (saveGuidanceNameWidget && saveGuidanceButtonWidget && saveGuidanceNameWidget.inputEl) {
                        if (saveGuidanceNameWidget.inputEl.parentElement.classList.contains('kontext-save-container')) {
                            return;
                        }

                        saveGuidanceButtonWidget.type = "button";
                        saveGuidanceButtonWidget.callback = () => {
                            saveGuidanceButtonWidget.value = true;
                            app.graph.runStep(1, false);
                            setTimeout(() => {
                                saveGuidanceButtonWidget.value = false;
                            }, 100);
                        };

                        const saveContainer = document.createElement("div");
                        saveContainer.className = "kontext-save-container";
                        saveContainer.style.display = "flex";
                        saveContainer.style.alignItems = "center";
                        saveContainer.style.gap = "5px";

                        const nameInput = saveGuidanceNameWidget.inputEl;
                        const parent = nameInput.parentElement;
                        saveContainer.appendChild(nameInput);

                        const buttonElement = document.createElement("button");
                        buttonElement.innerText = "Save Guidance";
                        buttonElement.style.cssText = `padding: 5px; border: 1px solid #555; background-color: #444; color: white; border-radius: 3px; cursor: pointer;`;
                        
                        buttonElement.onclick = () => {
                            if (saveGuidanceNameWidget.value) {
                                saveGuidanceButtonWidget.callback();
                            } else {
                                alert("Please enter a name for the guidance.");
                            }
                        };
                        saveContainer.appendChild(buttonElement);

                        if (saveGuidanceButtonWidget.inputEl && saveGuidanceButtonWidget.inputEl.parentElement) {
                            saveGuidanceButtonWidget.inputEl.parentElement.style.display = 'none';
                        }
                        
                        parent.appendChild(saveContainer);
            } else {
                        console.warn("⚠️ API Enhancer: Save guidance widgets not found, skipping interaction setup.");
                    }
                } catch (e) {
                    console.error("Error enhancing guidance widgets for API node:", e);
            }
            }, 0);

            return r;
        };
    },
    
    // 备用方案：使用nodeCreated事件
    nodeCreated(node) {
        console.log("🎯 DEBUG: nodeCreated called for node type:", node.type);
        if (node.type === "APIFluxKontextEnhancer") {
            console.log("🔥 DEBUG: APIFlux node created via nodeCreated event");
            
            // 强制设置颜色
            node.color = "#673AB7";
            node.bgcolor = "#512DA8";
            node.boxcolor = "#673AB7";
            node.titlecolor = "#FFFFFF";
            
            console.log("🎨 DEBUG: Colors set via nodeCreated", {
                color: node.color,
                bgcolor: node.bgcolor
            });
            
            // 延迟设置确保生效
            setTimeout(() => {
                node.color = "#673AB7";
                node.bgcolor = "#512DA8";
                if (node.graph && node.graph.canvas) {
                    node.graph.canvas.setDirty(true);
                }
                console.log("🔄 DEBUG: Delayed color set complete");
            }, 100);
        }
    }
});

// 添加APIFlux节点的全局样式 - 修复颜色问题
function addAPIFluxGlobalStyles() {
    const style = document.createElement('style');
    style.id = 'apiflux-colors';
    style.textContent = `
        /* 只针对真正的图形节点，排除搜索预览和UI元素 */
        .litegraph-node[data-node-type="APIFluxKontextEnhancer"]:not(.p-autocomplete-option):not(._sb_node_preview),
        .graphnode[data-title*="APIFlux"]:not(.p-autocomplete-option):not(._sb_node_preview),
        .litegraph .node.APIFluxKontextEnhancer:not(.p-autocomplete-option):not(._sb_node_preview),
        canvas ~ .node[title*="APIFlux"]:not(.p-autocomplete-option):not(._sb_node_preview) {
            background-color: #512DA8 !important;
            border: 2px solid #673AB7 !important;
            box-shadow: 0 0 0 2px #673AB7 !important;
        }
        
        /* 标题样式 - 只针对图形节点 */
        .litegraph-node[data-node-type="APIFluxKontextEnhancer"]:not(.p-autocomplete-option):not(._sb_node_preview) .title,
        .graphnode[data-title*="APIFlux"]:not(.p-autocomplete-option):not(._sb_node_preview) .title,
        .litegraph .node.APIFluxKontextEnhancer:not(.p-autocomplete-option):not(._sb_node_preview) .title,
        canvas ~ .node[title*="APIFlux"]:not(.p-autocomplete-option):not(._sb_node_preview) .title {
            background-color: #673AB7 !important;
            color: #FFFFFF !important;
        }
        
        /* 确保搜索预览和下拉菜单保持原样 */
        .p-autocomplete-option[aria-label*="APIFlux"],
        ._sb_node_preview[data-title*="APIFlux"],
        .dropdown *[title*="APIFlux"],
        .menu *[title*="APIFlux"],
        .search-box *[title*="APIFlux"],
        .contextmenu *[title*="APIFlux"] {
            background-color: revert !important;
            border: revert !important;
            box-shadow: revert !important;
        }
    `;
    document.head.appendChild(style);
}

// 立即执行全局样式添加
addAPIFluxGlobalStyles();

// 添加动态节点观察器以确保颜色正确应用
function addNodeObserver() {
    // 检查现有节点
    function checkExistingNodes() {
        const allNodes = document.querySelectorAll('.litegraph .node, .graphnode');
        
        allNodes.forEach(node => {
            const title = node.getAttribute('title') || node.textContent || '';
            if (title.includes('APIFlux') || title.includes('API_flux')) {
                applyPurpleColors(node);
            }
        });
    }
    
    // 应用紫色样式的函数
    function applyPurpleColors(node) {
        if (!node) return;
        
        // 检查是否是搜索预览或UI元素，如果是则跳过
        if (node.classList.contains('p-autocomplete-option') ||
            node.classList.contains('_sb_node_preview') ||
            node.closest('.p-autocomplete, .dropdown, .menu, .search-box, .contextmenu')) {
            return;
        }
        
        // 应用节点背景色 (多种方式)
        node.style.setProperty('background-color', '#512DA8', 'important');
        node.style.setProperty('border-color', '#673AB7', 'important');
        node.style.setProperty('border', '2px solid #673AB7', 'important');
        node.style.setProperty('box-shadow', '0 0 0 2px #673AB7', 'important');
        
        // 查找并应用标题色 (多种选择器)
        const titleSelectors = [
            '.title', 
            '.litegraph-node-title', 
            '.node-title',
            '.comfy-node-title',
            '[data-title]'
        ];
        
        let titleElement = null;
        for (const selector of titleSelectors) {
            titleElement = node.querySelector(selector);
            if (titleElement) {
                break;
            }
        }
        
        if (titleElement) {
            titleElement.style.setProperty('background-color', '#673AB7', 'important');
            titleElement.style.setProperty('color', '#FFFFFF', 'important');
        } else {
            // 如果没有找到标题元素，尝试应用到第一个子元素
            const firstChild = node.firstElementChild;
            if (firstChild) {
                firstChild.style.setProperty('background-color', '#673AB7', 'important');
                firstChild.style.setProperty('color', '#FFFFFF', 'important');
            }
        }
    }
    
    // 创建观察器
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    // 排除搜索预览、下拉菜单等UI元素
                    if (node.closest && node.closest('.p-autocomplete, .dropdown, .menu, ._sb_node_preview, .search-box, .node-search, .contextmenu')) {
                        return;
                    }
                    
                    // 检查是否是真正的图形节点
                    const title = node.getAttribute('title') || node.textContent || '';
                    const isRealGraphNode = node.classList.contains('litegraph-node') || 
                                          node.classList.contains('graphnode') ||
                                          (node.parentElement && node.parentElement.tagName === 'CANVAS');
                    
                    if ((title.includes('APIFlux') || title.includes('API_flux')) && isRealGraphNode) {
                        setTimeout(() => applyPurpleColors(node), 100);
                    }
                    
                    // 检查子节点，但只针对真正的图形节点
                    const apiFluxNodes = node.querySelectorAll && node.querySelectorAll('.litegraph-node[title*="APIFlux"], .graphnode[title*="APIFlux"]');
                    if (apiFluxNodes) {
                        apiFluxNodes.forEach(apiNode => {
                            setTimeout(() => applyPurpleColors(apiNode), 100);
                        });
                    }
                }
            });
        });
    });
    
    // 开始观察
    observer.observe(document.body, { childList: true, subtree: true });
    
    // 检查现有节点
    setTimeout(checkExistingNodes, 500);
}

// 在页面加载后设置观察器
setTimeout(addNodeObserver, 1000);

// 添加定期检查和强制应用颜色的函数
function forceAPIFluxColors() {
    // 首先查找真正的ComfyUI图形节点 (LiteGraph nodes)
    const graphCanvas = document.querySelector('#graph-canvas, .litegraph, .graphcanvas');
    if (graphCanvas && window.app && window.app.graph) {
        // 遍历图形中的所有节点
        const nodes = window.app.graph._nodes || [];
        let styledNodes = 0;
        
        nodes.forEach((node, index) => {
            if (node.type === "APIFluxKontextEnhancer" || 
                (node.title && node.title.includes("APIFlux"))) {
                
                // 设置节点颜色属性
                node.color = "#673AB7";
                node.bgcolor = "#512DA8";
                node.boxcolor = "#673AB7";
                
                // 强制重绘节点
                if (node.setDirtyCanvas) {
                    node.setDirtyCanvas(true, true);
                }
                
                styledNodes++;
            }
        });
        
        if (styledNodes > 0) {
            // 强制重绘整个画布
            if (window.app.graph.setDirtyCanvas) {
                window.app.graph.setDirtyCanvas(true, true);
            }
        }
    }
    
    // 备用方案：查找DOM中的节点元素，但排除UI元素
    const selectors = [
        'div.litegraph-node[data-title*="APIFlux"]',
        'div.node[data-title*="APIFlux"]',
        'canvas ~ div[title*="APIFlux"]'
    ];
    
    let foundDOMNodes = 0;
    selectors.forEach(selector => {
        const nodes = document.querySelectorAll(selector);
        nodes.forEach(node => {
            // 排除下拉菜单和UI元素
            if (node.closest('.p-autocomplete, .dropdown, .menu, ._sb_node_preview')) {
                return;
            }
            
            foundDOMNodes++;
            
            // 强制应用紫色样式
            node.style.setProperty('background-color', '#512DA8', 'important');
            node.style.setProperty('border', '2px solid #673AB7', 'important');
            node.style.setProperty('box-shadow', '0 0 0 2px #673AB7', 'important');
            
            // 查找并设置标题颜色
            const titleElement = node.querySelector('.title, .node-title, .comfy-node-title, [class*="title"]');
            if (titleElement) {
                titleElement.style.setProperty('background-color', '#673AB7', 'important');
                titleElement.style.setProperty('color', '#FFFFFF', 'important');
            }
        });
    });
}

// 定期检查并应用颜色 (每2秒检查一次)
setInterval(forceAPIFluxColors, 2000);

// 页面加载完成后立即检查
setTimeout(forceAPIFluxColors, 500);

// 导出工具函数供其他模块使用
export {
    getTemplateContentForPlaceholder,
    setupGuidanceWidgetsInteraction
};