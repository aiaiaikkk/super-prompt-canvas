/**
 * TextGen WebUI Flux Kontext Enhancer - Frontend Support
 * 
 * Provides frontend support for the TextGen WebUI enhancer node
 */

import { app } from "../../scripts/app.js";
import { api } from "../../scripts/api.js";

// Register the TextGen WebUI Flux Kontext Enhancer node
app.registerExtension({
    name: "KontextSuperPrompt.TextGenWebUIFluxKontextEnhancer",
    
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name === "TextGenWebUIFluxKontextEnhancer") {
            console.log("🌐 Registering TextGen WebUI Flux Kontext Enhancer frontend support");
            
            // Store the original nodeCreated function
            const onNodeCreated = nodeType.prototype.onNodeCreated;
            
            nodeType.prototype.onNodeCreated = function() {
                // Call the original function
                if (onNodeCreated) {
                    onNodeCreated.apply(this, arguments);
                }
                
                console.log("🌐 TextGen WebUI Flux Kontext Enhancer node created");
                
                // Set node colors to match Ollama enhancer (purple theme with original rounded corners)
                this.color = "#673AB7";     // Main color - deep purple
                this.bgcolor = "#512DA8";   // Background color - deeper purple
                this.boxcolor = "#673AB7";
                this.titlecolor = "#FFFFFF";
                this.node_color = "#673AB7";
                this.node_bgcolor = "#512DA8";
                this.header_color = "#673AB7";
                this.border_color = "#673AB7";
                
                // Find widgets for refresh button positioning
                let modelWidget = null;
                let urlWidget = null;
                
                for (const widget of this.widgets) {
                    if (widget.name === "model") {
                        modelWidget = widget;
                    } else if (widget.name === "url") {
                        urlWidget = widget;
                    }
                }
                
                // Create refresh button and position it after model widget
                if (modelWidget) {
                    const refreshButton = this.addWidget("button", "🔄 Refresh Models", "refresh", () => {
                        this.refreshModels();
                    });
                    
                    // Move refresh button to position right after model widget
                    const modelIndex = this.widgets.findIndex(w => w.name === "model");
                    if (modelIndex !== -1) {
                        // Remove refresh button from current position
                        const buttonIndex = this.widgets.indexOf(refreshButton);
                        if (buttonIndex !== -1) {
                            this.widgets.splice(buttonIndex, 1);
                        }
                        // Insert after model widget
                        this.widgets.splice(modelIndex + 1, 0, refreshButton);
                        console.log("✅ Refresh button positioned after model widget");
                    }
                }
                
                // Force color update periodically to ensure consistency
                const colorInterval = setInterval(() => {
                    if (this.color !== "#673AB7" || this.bgcolor !== "#512DA8") {
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
                    }
                }, 1000);
                
                // Clean up interval when node is removed
                const originalOnRemoved = this.onRemoved;
                this.onRemoved = function() {
                    if (colorInterval) {
                        clearInterval(colorInterval);
                    }
                    if (originalOnRemoved) {
                        originalOnRemoved.call(this);
                    }
                };
                
                // Store reference to this node
                this.textgenWebUINode = true;
            };
            
            // Add refresh models functionality
            nodeType.prototype.refreshModels = async function() {
                console.log("🔄 Refreshing TextGen WebUI models...");
                
                try {
                    const urlWidget = this.widgets.find(w => w.name === "url");
                    const modelWidget = this.widgets.find(w => w.name === "model");
                    
                    if (!urlWidget || !modelWidget) {
                        console.error("❌ Could not find URL or model widgets");
                        return;
                    }
                    
                    const url = urlWidget.value || "http://127.0.0.1:5000";
                    
                    // Call the backend API to refresh models
                    const response = await api.fetchApi("/textgen_webui_enhancer/get_models", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ url: url })
                    });
                    
                    if (response.ok) {
                        const models = await response.json();
                        console.log("✅ Received models from TextGen WebUI:", models);
                        
                        if (Array.isArray(models) && models.length > 0) {
                            // Add refresh option
                            const refreshedModels = ["🔄 Refresh model list", ...models];
                            
                            // Update model widget options
                            modelWidget.options.values = refreshedModels;
                            modelWidget.value = models[0]; // Set to first actual model
                            
                            console.log("✅ Model list updated successfully");
                            app.canvas.setDirty(true, true);
                        } else {
                            console.warn("⚠️ No models found or empty response");
                        }
                    } else {
                        console.error("❌ Failed to fetch models:", response.statusText);
                    }
                } catch (error) {
                    console.error("❌ Error refreshing models:", error);
                }
            };
            
            // Add model change handling
            const onExecuted = nodeType.prototype.onExecuted;
            nodeType.prototype.onExecuted = function(message) {
                if (onExecuted) {
                    onExecuted.apply(this, arguments);
                }
                
                // Check if refresh was requested
                const modelWidget = this.widgets.find(w => w.name === "model");
                if (modelWidget && modelWidget.value === "🔄 Refresh model list") {
                    console.log("🔄 Model refresh requested via selection");
                    this.refreshModels();
                }
            };
            
            console.log("✅ TextGen WebUI Flux Kontext Enhancer frontend support registered");
        }
    }
});

// Add global styles to force node colors - purple theme to match Ollama enhancer
function addGlobalNodeStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .litegraph .node.TextGenWebUIFluxKontextEnhancer {
            background-color: #512DA8 !important;
            border-color: #673AB7 !important;
            border-radius: 4px !important;
        }
        .litegraph .node.TextGenWebUIFluxKontextEnhancer .title {
            background-color: #673AB7 !important;
            color: #FFFFFF !important;
            border-radius: 4px 4px 0 0 !important;
        }
    `;
    document.head.appendChild(style);
    console.log("🎨 TextGen WebUI purple theme global styles added");
}

// Apply styles immediately
addGlobalNodeStyles();

console.log("🌐 TextGen WebUI Flux Kontext Enhancer frontend extension loaded");