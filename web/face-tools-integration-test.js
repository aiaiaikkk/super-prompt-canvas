/**
 * 面部工具集成测试文件
 * 用于验证面部工具的基本功能和集成状态
 */

class FaceToolsIntegrationTest {
    constructor() {
        this.testResults = [];
        this.runTests();
    }

    /**
     * 运行所有测试
     */
    async runTests() {
        console.log('🧪 开始面部工具集成测试...');
        
        try {
            await this.testModuleImports();
            await this.testMediaPipeAvailability();
            await this.testFaceProcessorInitialization();
            await this.testUIComponentCreation();
            
            this.displayResults();
        } catch (error) {
            console.error('❌ 测试过程中发生错误:', error);
        }
    }

    /**
     * 测试模块导入
     */
    async testModuleImports() {
        this.addTest('模块导入测试');
        
        try {
            // 测试 MediaPipe 封装模块
            const mediaPipeModule = await import('./libs/mediapipe-face-detection.js');
            this.assert(mediaPipeModule.MediaPipeFaceDetector, 'MediaPipeFaceDetector 类导入成功');
            this.assert(mediaPipeModule.globalFaceDetector, 'globalFaceDetector 实例导入成功');
            
            // 测试面部处理模块
            const faceProcessorModule = await import('./face-processor.js');
            this.assert(faceProcessorModule.default, 'FaceProcessor 类导入成功');
            this.assert(faceProcessorModule.FaceProcessorPresets, 'FaceProcessorPresets 导入成功');
            
            // 测试UI组件模块
            const faceToolsModule = await import('./face-tools.js');
            this.assert(faceToolsModule.default, 'FaceToolsUI 类导入成功');
            
            this.passTest('所有模块导入成功');
        } catch (error) {
            this.failTest(`模块导入失败: ${error.message}`);
        }
    }

    /**
     * 测试MediaPipe可用性
     */
    async testMediaPipeAvailability() {
        this.addTest('MediaPipe可用性测试');
        
        try {
            // 检查CDN可访问性
            const response = await fetch('https://cdn.jsdelivr.net/npm/@mediapipe/face_detection@0.4/face_detection.js', {
                method: 'HEAD',
                mode: 'no-cors'
            });
            
            this.passTest('MediaPipe CDN可访问');
        } catch (error) {
            this.failTest(`MediaPipe CDN不可访问: ${error.message}`);
            console.warn('⚠️ 建议使用本地MediaPipe文件或检查网络连接');
        }
    }

    /**
     * 测试面部处理器初始化
     */
    async testFaceProcessorInitialization() {
        this.addTest('面部处理器初始化测试');
        
        try {
            const FaceProcessor = (await import('./face-processor.js')).default;
            const processor = new FaceProcessor();
            
            this.assert(processor, '面部处理器实例创建成功');
            this.assert(typeof processor.autoFaceCrop === 'function', 'autoFaceCrop 方法存在');
            this.assert(typeof processor.autoFaceAlign === 'function', 'autoFaceAlign 方法存在');
            this.assert(typeof processor.analyzeFace === 'function', 'analyzeFace 方法存在');
            this.assert(typeof processor.batchProcess === 'function', 'batchProcess 方法存在');
            
            this.passTest('面部处理器初始化成功');
        } catch (error) {
            this.failTest(`面部处理器初始化失败: ${error.message}`);
        }
    }

    /**
     * 测试UI组件创建
     */
    async testUIComponentCreation() {
        this.addTest('UI组件创建测试');
        
        try {
            // 创建模拟canvas和容器
            const mockCanvas = this.createMockCanvas();
            const mockContainer = document.createElement('div');
            
            const FaceToolsUI = (await import('./face-tools.js')).default;
            const ui = new FaceToolsUI(mockCanvas, mockContainer);
            
            this.assert(ui, 'FaceToolsUI 实例创建成功');
            this.assert(ui.faceProcessor, '面部处理器集成成功');
            this.assert(typeof ui.performFaceCrop === 'function', 'performFaceCrop 方法存在');
            this.assert(typeof ui.performFaceAlign === 'function', 'performFaceAlign 方法存在');
            this.assert(typeof ui.performFaceAnalysis === 'function', 'performFaceAnalysis 方法存在');
            
            // 检查面部工具面板是否创建
            const panel = mockContainer.querySelector('.face-tools-panel');
            this.assert(panel, '面部工具面板DOM元素创建成功');
            
            // 检查面板头部是否存在
            const panelHeader = panel ? panel.querySelector('.face-panel-header') : null;
            this.assert(panelHeader, '面板头部元素创建成功');
            
            // 检查面板内容容器是否存在
            const panelContent = panel ? panel.querySelector('.face-panel-content') : null;
            this.assert(panelContent, '面板内容容器创建成功');
            
            // 清理
            ui.destroy();
            
            this.passTest('UI组件创建成功');
        } catch (error) {
            this.failTest(`UI组件创建失败: ${error.message}`);
        }
    }

    /**
     * 创建模拟canvas对象
     */
    createMockCanvas() {
        return {
            getActiveObject: () => null,
            getObjects: () => [],
            add: () => {},
            remove: () => {},
            setActiveObject: () => {},
            renderAll: () => {},
            on: () => {},
            off: () => {}
        };
    }

    /**
     * 添加测试项
     */
    addTest(name) {
        this.currentTest = { name, status: 'running', details: [] };
    }

    /**
     * 断言
     */
    assert(condition, message) {
        if (condition) {
            this.currentTest.details.push(`✅ ${message}`);
        } else {
            throw new Error(message);
        }
    }

    /**
     * 标记测试通过
     */
    passTest(message) {
        this.currentTest.status = 'passed';
        this.currentTest.message = message;
        this.testResults.push(this.currentTest);
        console.log(`✅ ${this.currentTest.name}: ${message}`);
    }

    /**
     * 标记测试失败
     */
    failTest(message) {
        this.currentTest.status = 'failed';
        this.currentTest.message = message;
        this.testResults.push(this.currentTest);
        console.error(`❌ ${this.currentTest.name}: ${message}`);
    }

    /**
     * 显示测试结果
     */
    displayResults() {
        const passed = this.testResults.filter(t => t.status === 'passed').length;
        const failed = this.testResults.filter(t => t.status === 'failed').length;
        const total = this.testResults.length;
        
        console.log('\n📊 测试结果汇总:');
        console.log(`总计: ${total} | 通过: ${passed} | 失败: ${failed}`);
        
        if (failed === 0) {
            console.log('🎉 所有测试通过！面部工具集成成功。');
            this.showSuccessMessage();
        } else {
            console.log('⚠️ 部分测试失败，请检查相关问题。');
            this.showIssueMessage();
        }
        
        // 显示详细结果
        this.testResults.forEach(test => {
            console.group(`${test.status === 'passed' ? '✅' : '❌'} ${test.name}`);
            console.log(test.message);
            test.details.forEach(detail => console.log(detail));
            console.groupEnd();
        });
    }

    /**
     * 显示成功消息
     */
    showSuccessMessage() {
        if (typeof window !== 'undefined') {
            const message = document.createElement('div');
            message.innerHTML = `
                <div style="position: fixed; top: 20px; right: 20px; background: #d4edda; 
                           color: #155724; padding: 15px; border-radius: 5px; 
                           box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 10000;">
                    <strong>🎉 面部工具集成成功！</strong><br>
                    所有测试通过，功能可以正常使用。
                </div>
            `;
            document.body.appendChild(message);
            
            setTimeout(() => message.remove(), 5000);
        }
    }

    /**
     * 显示问题消息
     */
    showIssueMessage() {
        if (typeof window !== 'undefined') {
            const message = document.createElement('div');
            message.innerHTML = `
                <div style="position: fixed; top: 20px; right: 20px; background: #fff3cd; 
                           color: #856404; padding: 15px; border-radius: 5px; 
                           box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 10000;">
                    <strong>⚠️ 集成测试发现问题</strong><br>
                    请查看控制台了解详细信息。
                </div>
            `;
            document.body.appendChild(message);
            
            setTimeout(() => message.remove(), 8000);
        }
    }

    /**
     * 运行快速功能测试
     */
    static async runQuickTest() {
        console.log('🚀 运行快速功能测试...');
        
        try {
            // 快速导入测试
            await import('./libs/mediapipe-face-detection.js');
            await import('./face-processor.js');
            await import('./face-tools.js');
            
            console.log('✅ 快速测试通过：所有模块可正常导入');
            return true;
        } catch (error) {
            console.error('❌ 快速测试失败:', error.message);
            return false;
        }
    }
}

// 自动运行测试（仅在浏览器环境中）
if (typeof window !== 'undefined') {
    // 延迟执行，确保所有模块都已加载
    setTimeout(() => {
        new FaceToolsIntegrationTest();
    }, 1000);
}

// 导出测试类
export default FaceToolsIntegrationTest;