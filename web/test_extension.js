// 最简测试扩展
console.log("🧪 Test extension loading...");

// 确保app可用
if (typeof app !== 'undefined' && app.registerExtension) {
    console.log("✅ App is available");
    
    app.registerExtension({
        name: "TestKontextExtension",
        
        async beforeRegisterNodeDef(nodeType, nodeData, app) {
            console.log("🔍 Test: Checking node:", nodeData.name);
            
            if (nodeData.name === "VisualPromptEditor") {
                console.log("🎯 Test: Found VisualPromptEditor node");
                
                const onNodeCreated = nodeType.prototype.onNodeCreated;
                nodeType.prototype.onNodeCreated = function () {
                    console.log("🎨 Test: VisualPromptEditor node created");
                    
                    const r = onNodeCreated ? onNodeCreated.apply(this, arguments) : undefined;
                    
                    // 设置明显的颜色
                    this.color = "#FF0000";
                    this.bgcolor = "#CC0000";
                    
                    // 重写双击事件
                    this.onDblClick = function(event) {
                        console.log("🎯 Test: Node double-clicked!");
                        alert("🎉 Double-click working! Node: " + this.type);
                        
                        if (event) {
                            event.preventDefault();
                            event.stopPropagation();
                        }
                        
                        return false;
                    };
                    
                    return r;
                };
                
                console.log("✅ Test: VisualPromptEditor extended");
            }
        }
    });
    
    console.log("✅ Test extension registered");
} else {
    console.error("❌ App not available!");
    
    // 延迟重试
    setTimeout(() => {
        if (typeof app !== 'undefined' && app.registerExtension) {
            console.log("🔄 Retrying test extension registration...");
            // 重新执行上面的代码
        }
    }, 1000);
}

console.log("🧪 Test extension script completed");