/**
 * OllamaFluxKontextEnhancer 前端JavaScript扩展
 * 
 * 实现动态Ollama模型选择和参数交互
 * 基于comfyui-ollama参考项目的实现模式
 */

import { app } from "../../scripts/app.js";

/**
 * 获取可用的Ollama模型列表
 * @param {string} url - Ollama服务地址
 * @returns {Promise<Array<string>>} 模型名称列表
 */
async function fetchOllamaModels(url) {
    try {
        console.log(`🔍 获取Ollama模型列表: ${url}`);
        
        const response = await fetch("/ollama_flux_enhancer/get_models", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ url }),
        });

        if (response.ok) {
            const models = await response.json();
            console.log(`✅ 获取到 ${models.length} 个模型:`, models);
            return Array.isArray(models) ? models : [];
        } else {
            console.error(`❌ 获取模型失败: HTTP ${response.status}`);
            return [];
        }
    } catch (error) {
        console.error("❌ 获取模型异常:", error);
        return [];
    }
}

/**
 * 更新模型选择框的选项
 * @param {Object} widget - 模型选择widget
 * @param {Array<string>} models - 模型列表
 */
function updateModelWidget(widget, models) {
    if (!widget || !Array.isArray(models)) {
        console.warn("⚠️ 无效的widget或模型列表");
        return;
    }

    // 保存当前选中的模型
    const currentModel = widget.value;
    
    // 更新选项
    widget.options.values = models;
    
    // 恢复选中的模型（如果还存在）或选择第一个
    if (models.length > 0) {
        if (models.includes(currentModel)) {
            widget.value = currentModel;
        } else {
            widget.value = models[0];
        }
        console.log(`🎯 模型选择更新为: ${widget.value}`);
    } else {
        widget.value = "";
        console.warn("⚠️ 没有可用的模型");
    }
}

/**
 * 创建模型刷新按钮
 * @param {Object} node - ComfyUI节点实例
 * @param {Object} modelWidget - 模型选择widget
 * @param {Object} urlWidget - URL输入widget
 * @returns {Object} 刷新按钮widget
 */
function createRefreshButton(node, modelWidget, urlWidget) {
    const refreshButton = node.addWidget("button", "🔄 刷新模型", "refresh", () => {
        const url = urlWidget ? urlWidget.value : "http://127.0.0.1:11434";
        console.log(`🔄 手动刷新模型列表: ${url}`);
        
        fetchOllamaModels(url).then(models => {
            updateModelWidget(modelWidget, models);
        });
    });
    
    // 设置按钮样式
    refreshButton.computeSize = () => [120, 25];
    
    return refreshButton;
}

/**
 * 节点初始化时自动获取模型
 * @param {Object} node - ComfyUI节点实例
 * @param {Object} modelWidget - 模型选择widget
 * @param {Object} urlWidget - URL输入widget
 */
function initializeModels(node, modelWidget, urlWidget) {
    // 延迟执行，确保节点完全加载
    setTimeout(async () => {
        const url = urlWidget ? urlWidget.value : "http://127.0.0.1:11434";
        console.log(`🚀 初始化加载模型列表: ${url}`);
        
        const models = await fetchOllamaModels(url);
        updateModelWidget(modelWidget, models);
        
        // 如果没有获取到模型，显示提示
        if (models.length === 0) {
            console.warn("⚠️ 初始化时未获取到模型，请检查Ollama服务是否运行");
        }
    }, 1000); // 延迟1秒
}

/**
 * 监听URL变化并自动刷新模型
 * @param {Object} urlWidget - URL输入widget
 * @param {Object} modelWidget - 模型选择widget
 */
function setupUrlChangeListener(urlWidget, modelWidget) {
    if (!urlWidget || !modelWidget) return;
    
    // 保存原始callback
    const originalCallback = urlWidget.callback;
    
    // 设置新的callback
    urlWidget.callback = function(value) {
        // 调用原始callback
        if (originalCallback) {
            originalCallback.call(this, value);
        }
        
        // 自动刷新模型
        console.log(`🔗 URL变化，自动刷新模型: ${value}`);
        fetchOllamaModels(value).then(models => {
            updateModelWidget(modelWidget, models);
        });
    };
}

/**
 * 添加模型状态指示器
 * @param {Object} node - ComfyUI节点实例
 * @param {Object} modelWidget - 模型选择widget
 * @returns {Object} 状态指示器widget
 */
function createStatusIndicator(node, modelWidget) {
    const statusWidget = node.addWidget("text", "📊 模型状态", "", () => {});
    statusWidget.disabled = true;
    statusWidget.computeSize = () => [200, 20];
    
    // 监听模型变化更新状态
    const originalCallback = modelWidget.callback;
    modelWidget.callback = function(value) {
        if (originalCallback) {
            originalCallback.call(this, value);
        }
        
        // 更新状态显示
        if (value && value.trim()) {
            statusWidget.value = `✅ 已选择: ${value}`;
        } else {
            statusWidget.value = "❌ 未选择模型";
        }
    };
    
    return statusWidget;
}

// 注册ComfyUI扩展
app.registerExtension({
    name: "KontextOllamaFluxEnhancer",
    
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        // 只处理OllamaFluxKontextEnhancer节点
        if (nodeData.name !== "OllamaFluxKontextEnhancer") {
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
            
            console.log("🏗️ 创建OllamaFluxKontextEnhancer节点");
            
            // 查找相关widgets
            let modelWidget = null;
            let urlWidget = null;
            
            for (const widget of this.widgets) {
                if (widget.name === "model") {
                    modelWidget = widget;
                    console.log("🎯 找到模型选择widget");
                } else if (widget.name === "url") {
                    urlWidget = widget;
                    console.log("🔗 找到URL输入widget");
                }
            }
            
            if (modelWidget) {
                // 创建刷新按钮
                const refreshButton = createRefreshButton(this, modelWidget, urlWidget);
                
                // 创建状态指示器
                const statusIndicator = createStatusIndicator(this, modelWidget);
                
                // 设置URL变化监听
                setupUrlChangeListener(urlWidget, modelWidget);
                
                // 初始化模型列表
                initializeModels(this, modelWidget, urlWidget);
                
                console.log("✅ OllamaFluxKontextEnhancer前端扩展初始化完成");
            } else {
                console.warn("⚠️ 未找到模型选择widget");
            }
        };
        
        // 添加节点序列化支持
        const onSerialize = nodeType.prototype.onSerialize;
        nodeType.prototype.onSerialize = function(o) {
            if (onSerialize) {
                onSerialize.apply(this, arguments);
            }
            
            // 保存当前选中的模型
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
        console.log("🚀 OllamaFluxKontextEnhancer扩展加载完成");
    }
});

// 导出工具函数供其他模块使用
export {
    fetchOllamaModels,
    updateModelWidget,
    createRefreshButton,
    createStatusIndicator
};