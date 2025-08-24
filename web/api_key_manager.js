/**
 * API密钥管理器 - 简化版本
 * 只作为额外保障，主要依赖ComfyUI原生的widget状态保存
 */

import { app } from "../../scripts/app.js";

class APIKeyManager {
    constructor() {
        this.STORAGE_KEY = "kontext_api_keys";
        this.PROVIDER_KEY = "kontext_api_provider";
        this.init();
    }

    init() {
        const self = this;
        
        // 只在节点创建时提供额外的localStorage恢复
        app.registerExtension({
            name: "Kontext.APIKeyManager",
            
            async nodeCreated(node) {
                if (node.type === "KontextSuperPrompt" || node.comfyClass === "KontextSuperPrompt") {
                    setTimeout(() => {
                        self.enhanceNode(node);
                    }, 100);
                }
            }
        });
    }
    
    enhanceNode(node) {
        const apiKeyWidget = node.widgets?.find(w => w.name === "api_key");
        const apiProviderWidget = node.widgets?.find(w => w.name === "api_provider");
        
        if (!apiKeyWidget || !apiProviderWidget) {
            return;
        }
        
        // 监听provider变化时自动填充对应的密钥
        const originalProviderCallback = apiProviderWidget.callback;
        apiProviderWidget.callback = (value) => {
            if (originalProviderCallback) {
                originalProviderCallback.call(apiProviderWidget, value);
            }
            
            // 保存当前provider选择
            this.saveProvider(value);
            
            // 如果当前密钥为空，尝试填充保存的密钥
            if (!apiKeyWidget.value || apiKeyWidget.value.trim() === "") {
                const savedKey = this.getKey(value);
                if (savedKey) {
                    apiKeyWidget.value = savedKey;
                    if (apiKeyWidget.callback) {
                        apiKeyWidget.callback(savedKey);
                    }
                }
            }
        };
        
        // 监听密钥变化时自动保存
        const originalKeyCallback = apiKeyWidget.callback;
        apiKeyWidget.callback = (value) => {
            if (originalKeyCallback) {
                originalKeyCallback.call(apiKeyWidget, value);
            }
            
            if (value && value.trim()) {
                const provider = apiProviderWidget.value || "siliconflow";
                this.saveKey(provider, value.trim());
            }
        };
        
        // 初始恢复：如果密钥为空，尝试从localStorage恢复
        this.restoreIfEmpty(node);
    }
    
    restoreIfEmpty(node) {
        const apiProviderWidget = node.widgets?.find(w => w.name === "api_provider");
        const apiKeyWidget = node.widgets?.find(w => w.name === "api_key");
        
        if (!apiProviderWidget || !apiKeyWidget) return;
        
        // 恢复provider选择
        const savedProvider = this.getSavedProvider();
        if (savedProvider && (!apiProviderWidget.value || apiProviderWidget.value === "siliconflow")) {
            apiProviderWidget.value = savedProvider;
        }
        
        // 恢复密钥（只在为空时）
        const currentProvider = apiProviderWidget.value || "siliconflow";
        if (!apiKeyWidget.value || apiKeyWidget.value.trim() === "") {
            const savedKey = this.getKey(currentProvider);
            if (savedKey) {
                apiKeyWidget.value = savedKey;
            }
        }
    }
    
    // localStorage操作方法
    saveKey(provider, key) {
        try {
            const keys = this.getAllKeys();
            keys[provider] = key;
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(keys));
        } catch (e) {
            console.error("[APIKeyManager] 保存密钥失败:", e);
        }
    }
    
    getKey(provider) {
        try {
            const keys = this.getAllKeys();
            return keys[provider] || "";
        } catch (e) {
            return "";
        }
    }
    
    saveProvider(provider) {
        try {
            localStorage.setItem(this.PROVIDER_KEY, provider);
        } catch (e) {
            console.error("[APIKeyManager] 保存provider失败:", e);
        }
    }
    
    getSavedProvider() {
        try {
            return localStorage.getItem(this.PROVIDER_KEY) || "";
        } catch (e) {
            return "";
        }
    }
    
    getAllKeys() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            return stored ? JSON.parse(stored) : {};
        } catch (e) {
            return {};
        }
    }
}

// 创建全局实例
window.kontextAPIManager = new APIKeyManager();

