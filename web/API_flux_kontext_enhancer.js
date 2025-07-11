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
    // 预设引导风格内容
    const presetGuidance = {
        "efficient_concise": {
            "name": "高效简洁模式",
            "prompt": "You are an efficient AI editor focused on clear, concise Flux Kontext instructions. Generate direct, actionable editing commands..."
        },
        "natural_creative": {
            "name": "自然创意模式",
            "prompt": "You are a creative AI assistant specializing in artistic image editing with Flux Kontext. Focus on natural expression and artistic enhancement..."
        },
        "technical_precise": {
            "name": "技术精确模式",
            "prompt": "You are a technical specialist for Flux Kontext image editing, focused on precision and accuracy. Generate technically precise, unambiguous editing instructions..."
        }
    };
    
    // 模板库内容
    const templateLibrary = {
        "ecommerce_product": {
            "name": "电商产品编辑",
            "prompt": "你是专业的电商产品图像编辑AI，专注于产品展示优化。保持产品真实性，避免过度修饰..."
        },
        "portrait_beauty": {
            "name": "人像美化编辑",
            "prompt": "你是专业人像摄影后期处理专家，专注于自然美化。保持人物自然神态，避免过度美颜..."
        },
        "creative_design": {
            "name": "创意设计编辑",
            "prompt": "你是富有创意的设计师AI，专长艺术化图像处理。大胆的色彩运用和视觉冲击..."
        },
        "architecture_photo": {
            "name": "建筑摄影编辑",
            "prompt": "你是专业建筑摄影后期专家，专注于建筑和空间美学。强调建筑线条和几何美感..."
        },
        "food_photography": {
            "name": "美食摄影编辑",
            "prompt": "你是专业美食摄影师，专注于食物的诱人呈现。突出食物的新鲜和诱人质感..."
        },
        "fashion_retail": {
            "name": "时尚零售编辑",
            "prompt": "你是时尚零售视觉专家，专注于服装和配饰的完美呈现。突出服装的版型和设计细节..."
        },
        "landscape_nature": {
            "name": "风景自然编辑",
            "prompt": "你是自然风光摄影专家，专注于大自然的美丽呈现。保持自然景色的真实感和美感..."
        }
    };
    
    try {
        // 根据guidance_style选择内容
        if (guidanceStyle === "custom") {
            // 自定义模式保留完整提示文字
            return `输入您的自定义AI引导指令...

例如：
你是专业的图像编辑专家，请将标注数据转换为简洁明了的编辑指令。重点关注：
1. 保持指令简洁
2. 确保操作精确
3. 维持风格一致性

更多示例请查看guidance_template选项。`;
        } else if (guidanceStyle === "template") {
            if (guidanceTemplate && guidanceTemplate !== "none" && templateLibrary[guidanceTemplate]) {
                const template = templateLibrary[guidanceTemplate];
                const preview = template.prompt.substring(0, 200).replace(/\n/g, ' ').trim();
                return `当前模板: ${template.name}\n\n${preview}...`;
            } else {
                return "选择一个模板后将在此显示预览...";
            }
        } else {
            // 显示预设风格的内容
            if (presetGuidance[guidanceStyle]) {
                const preset = presetGuidance[guidanceStyle];
                const preview = preset.prompt.substring(0, 200).replace(/\n/g, ' ').trim();
                return `当前风格: ${preset.name}\n\n${preview}...`;
            } else {
                return `输入您的自定义AI引导指令...

例如：
你是专业的图像编辑专家，请将标注数据转换为简洁明了的编辑指令。重点关注：
1. 保持指令简洁
2. 确保操作精确
3. 维持风格一致性

更多示例请查看guidance_template选项。`;
            }
        }
    } catch (error) {
        console.error("获取模板内容失败:", error);
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
 * 设置引导相关widgets的联动
 * @param {Object} node - ComfyUI节点实例
 * @param {Object} guidanceStyleWidget - 引导风格widget
 * @param {Object} guidanceTemplateWidget - 引导模板widget
 * @param {Object} customGuidanceWidget - 自定义引导widget
 */
function setupGuidanceWidgetsInteraction(node, guidanceStyleWidget, guidanceTemplateWidget, customGuidanceWidget) {
    if (!guidanceStyleWidget || !customGuidanceWidget) {
        console.warn("⚠️ API版本: 缺少必要的widgets，跳过placeholder联动设置");
        return;
    }
    
    console.log("🔧 API版本: 开始设置引导widgets联动");
    
    // 更新placeholder的函数
    function updatePlaceholder() {
        try {
            const guidanceStyle = guidanceStyleWidget.value || "efficient_concise";
            const guidanceTemplate = guidanceTemplateWidget ? guidanceTemplateWidget.value || "none" : "none";
            
            console.log(`📝 API版本准备更新placeholder: style=${guidanceStyle}, template=${guidanceTemplate}`);
            
            const newPlaceholder = getTemplateContentForPlaceholder(guidanceStyle, guidanceTemplate);
            
            // 多种方式尝试更新placeholder
            let updated = false;
            
            // 方法1: 直接更新inputEl
            if (customGuidanceWidget.inputEl) {
                customGuidanceWidget.inputEl.placeholder = newPlaceholder;
                updated = true;
                console.log("✅ API版本通过inputEl更新placeholder");
            }
            
            // 方法2: 更新widget的options
            if (customGuidanceWidget.options && customGuidanceWidget.options.placeholder !== undefined) {
                customGuidanceWidget.options.placeholder = newPlaceholder;
                updated = true;
                console.log("✅ API版本通过options更新placeholder");
            }
            
            // 方法3: 查找textarea元素
            if (!updated) {
                const textareas = node.widgets.filter(w => w.name === "custom_guidance");
                if (textareas.length > 0 && textareas[0].inputEl) {
                    textareas[0].inputEl.placeholder = newPlaceholder;
                    updated = true;
                    console.log("✅ API版本通过直接查找更新placeholder");
                }
            }
            
            // 方法4: 强制重绘widget
            if (customGuidanceWidget.onRemoved && customGuidanceWidget.onAdded) {
                try {
                    customGuidanceWidget.options = customGuidanceWidget.options || {};
                    customGuidanceWidget.options.placeholder = newPlaceholder;
                    // 触发重绘
                    node.onResize && node.onResize();
                    updated = true;
                    console.log("✅ API版本通过重绘更新placeholder");
                } catch (e) {
                    console.log("⚠️ API版本重绘方法失败:", e);
                }
            }
            
            if (updated) {
                console.log(`🎨 API版本成功更新placeholder: ${guidanceStyle} -> ${guidanceTemplate}`);
                console.log(`📄 API版本新placeholder内容: ${newPlaceholder.substring(0, 50)}...`);
            } else {
                console.warn("❌ API版本所有placeholder更新方法都失败了");
            }
            
        } catch (error) {
            console.error("❌ API版本updatePlaceholder错误:", error);
        }
    }
    
    // 更强健的事件绑定
    function bindWidgetCallback(widget, widgetName) {
        if (!widget) {
            console.warn(`⚠️ API版本${widgetName} widget为空，跳过绑定`);
            return;
        }
        
        console.log(`🔗 API版本绑定${widgetName}事件回调`);
        console.log(`   Widget类型: ${widget.type}, 当前值: ${widget.value}`);
        
        // 保存原始callback
        const originalCallback = widget.callback;
        console.log(`   原始callback存在: ${!!originalCallback}`);
        
        // 设置新的callback
        widget.callback = function(value, ...args) {
            console.log(`🎯 API版本${widgetName}值变化: ${value} (参数数量: ${args.length})`);
            
            // 先调用原始callback
            if (originalCallback) {
                try {
                    originalCallback.apply(this, [value, ...args]);
                    console.log(`   ✅ 原始${widgetName}回调执行成功`);
                } catch (e) {
                    console.warn(`⚠️ API版本原始${widgetName}回调错误:`, e);
                }
            }
            
            // 延迟更新placeholder，确保值已经设置
            console.log(`   🔄 准备延迟更新placeholder (${widgetName})`);
            setTimeout(updatePlaceholder, 100);
        };
        
        // 尝试多种事件监听方式
        if (widget.element) {
            console.log(`   📱 ${widgetName} DOM元素存在，添加事件监听`);
            
            // change事件
            widget.element.addEventListener('change', (e) => {
                console.log(`🎯 API版本${widgetName}元素change事件, 新值: ${e.target.value}`);
                setTimeout(updatePlaceholder, 100);
            });
            
            // input事件
            widget.element.addEventListener('input', (e) => {
                console.log(`🎯 API版本${widgetName}元素input事件, 新值: ${e.target.value}`);
                setTimeout(updatePlaceholder, 100);
            });
            
            // click事件（用于下拉框）
            widget.element.addEventListener('click', (e) => {
                console.log(`🎯 API版本${widgetName}元素click事件`);
                setTimeout(updatePlaceholder, 200); // 稍长延迟确保值已更改
            });
        } else {
            console.warn(`⚠️ API版本${widgetName} DOM元素不存在`);
        }
        
        // 尝试直接监听widget的属性变化
        if (widget.value !== undefined) {
            let lastValue = widget.value;
            const checkValueChange = () => {
                if (widget.value !== lastValue) {
                    console.log(`🎯 API版本${widgetName}属性值变化: ${lastValue} → ${widget.value}`);
                    lastValue = widget.value;
                    updatePlaceholder();
                }
            };
            
            // 定期检查值变化
            setInterval(checkValueChange, 500);
            console.log(`   ⏰ ${widgetName}定期值检查已设置`);
        }
    }
    
    // 绑定事件
    bindWidgetCallback(guidanceStyleWidget, "guidance_style");
    bindWidgetCallback(guidanceTemplateWidget, "guidance_template");
    
    // 延迟初始化，确保所有widgets都已完全加载
    setTimeout(() => {
        console.log("🚀 API版本初始化placeholder");
        updatePlaceholder();
    }, 1000);
    
    // 添加定期检查机制，确保placeholder保持同步
    let checkCount = 0;
    const checkInterval = setInterval(() => {
        checkCount++;
        if (checkCount > 10) {
            clearInterval(checkInterval);
            return;
        }
        
        // 检查当前placeholder是否正确
        const currentStyle = guidanceStyleWidget.value || "efficient_concise";
        const currentTemplate = guidanceTemplateWidget ? guidanceTemplateWidget.value || "none" : "none";
        const expectedPlaceholder = getTemplateContentForPlaceholder(currentStyle, currentTemplate);
        
        if (customGuidanceWidget.inputEl) {
            const currentPlaceholder = customGuidanceWidget.inputEl.placeholder;
            if (currentPlaceholder !== expectedPlaceholder) {
                console.log(`🔄 API版本定期检查发现placeholder不同步，正在更新 (检查${checkCount}/10)`);
                updatePlaceholder();
            }
        }
    }, 2000);
}

// 注册ComfyUI扩展
app.registerExtension({
    name: "KontextAPIFluxEnhancer",
    
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        // 只处理APIFluxKontextEnhancer节点
        if (nodeData.name !== "APIFluxKontextEnhancer") {
            return;
        }
        
        console.log("🔧 初始化APIFluxKontextEnhancer前端扩展");
        
        // 重写节点创建方法
        const onNodeCreated = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = function() {
            // 调用原始创建方法
            if (onNodeCreated) {
                onNodeCreated.apply(this, arguments);
            }
            
            console.log("🏗️ 创建APIFluxKontextEnhancer节点");
            
            // 查找相关widgets
            let guidanceStyleWidget = null;
            let guidanceTemplateWidget = null;
            let customGuidanceWidget = null;
            
            for (const widget of this.widgets) {
                if (widget.name === "guidance_style") {
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
            
            // 设置引导widgets联动
            if (guidanceStyleWidget && customGuidanceWidget) {
                setupGuidanceWidgetsInteraction(this, guidanceStyleWidget, guidanceTemplateWidget, customGuidanceWidget);
                console.log("✅ API版本引导widgets联动设置完成");
            } else {
                console.warn("⚠️ 未找到引导相关widgets");
            }
        };
    },
    
    async setup() {
        console.log("🚀 APIFluxKontextEnhancer扩展加载完成");
    }
});

// 导出工具函数供其他模块使用
export {
    getTemplateContentForPlaceholder,
    setupGuidanceWidgetsInteraction
};