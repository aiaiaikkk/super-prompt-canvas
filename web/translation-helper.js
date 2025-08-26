/**
 * 翻译助手模块 - 提供中英文自动翻译功能
 * 使用多种免费翻译服务，优先使用本地缓存
 */

class TranslationHelper {
    constructor() {
        // 翻译缓存
        this.cache = new Map();
        
        // 常用词汇映射表（离线翻译）
        this.commonTerms = {
            // 颜色词汇
            '红色': 'red', '蓝色': 'blue', '绿色': 'green', '黄色': 'yellow',
            '黑色': 'black', '白色': 'white', '灰色': 'gray', '棕色': 'brown',
            '紫色': 'purple', '橙色': 'orange', '粉色': 'pink', '金色': 'gold',
            '银色': 'silver', '深蓝': 'navy blue', '浅蓝': 'light blue',
            '深绿': 'dark green', '浅绿': 'light green', '天蓝': 'sky blue',
            
            // 动作词汇
            '更换': 'change', '替换': 'replace', '删除': 'remove', '添加': 'add',
            '修改': 'modify', '调整': 'adjust', '增强': 'enhance', '优化': 'optimize',
            '改变': 'change', '变换': 'transform', '转换': 'convert', '移除': 'remove',
            '插入': 'insert', '融合': 'blend', '混合': 'mix', '保持': 'maintain',
            '保留': 'preserve', '匹配': 'match', '对齐': 'align',
            
            // 物体词汇
            '背景': 'background', '前景': 'foreground', '人物': 'person', '面部': 'face',
            '头发': 'hair', '眼睛': 'eyes', '嘴巴': 'mouth', '鼻子': 'nose',
            '衣服': 'clothing', '服装': 'clothes', '天空': 'sky', '地面': 'ground',
            '建筑': 'building', '树木': 'trees', '汽车': 'car', '物体': 'object',
            
            // 形容词
            '自然': 'natural', '真实': 'realistic', '清晰': 'clear', '模糊': 'blur',
            '明亮': 'bright', '暗淡': 'dim', '鲜艳': 'vivid', '柔和': 'soft',
            '锐利': 'sharp', '平滑': 'smooth', '粗糙': 'rough', '细腻': 'delicate',
            '完美': 'perfect', '无缝': 'seamless', '精确': 'precise',
            
            // 换脸相关
            '换脸': 'face swap', '面部交换': 'face exchange', '保持身份': 'preserve identity',
            '保持特征': 'maintain features', '面部结构': 'facial structure',
            '表情': 'expression', '姿态': 'pose', '角度': 'angle',
            '皮肤': 'skin', '纹理': 'texture', '光照': 'lighting',
            '阴影': 'shadow', '边缘': 'edge', '融合': 'blend',
            
            // 常用短语
            '保持原始': 'maintain original', '保持不变': 'keep unchanged',
            '自然过渡': 'natural transition', '无缝融合': 'seamless blend',
            '完美匹配': 'perfect match', '精确对齐': 'precise alignment',
            '高质量': 'high quality', '专业级': 'professional grade',
            '商业品质': 'commercial quality', '电影级': 'cinematic quality'
        };
        
        // 初始化翻译服务配置
        this.services = [
            {
                name: 'LibreTranslate',
                url: 'https://libretranslate.com/translate',
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                buildRequest: (text) => ({
                    q: text,
                    source: 'zh',
                    target: 'en',
                    format: 'text'
                }),
                parseResponse: (data) => data.translatedText
            },
            {
                name: 'MyMemory',
                url: 'https://api.mymemory.translated.net/get',
                method: 'GET',
                buildRequest: (text) => ({
                    q: text,
                    langpair: 'zh|en'
                }),
                parseResponse: (data) => data.responseData.translatedText
            }
        ];
    }
    
    /**
     * 检测文本是否包含中文
     */
    containsChinese(text) {
        return /[\u4e00-\u9fa5]/.test(text);
    }
    
    /**
     * 本地词汇翻译
     */
    translateLocal(text) {
        let translated = text;
        
        // 首先尝试完全匹配
        if (this.commonTerms[text]) {
            return this.commonTerms[text];
        }
        
        // 逐词替换
        for (const [chinese, english] of Object.entries(this.commonTerms)) {
            const regex = new RegExp(chinese, 'g');
            translated = translated.replace(regex, english);
        }
        
        // 如果翻译后仍包含中文，返回null表示需要在线翻译
        if (this.containsChinese(translated)) {
            return null;
        }
        
        return translated;
    }
    
    /**
     * 在线翻译服务
     */
    async translateOnline(text, serviceIndex = 0) {
        if (serviceIndex >= this.services.length) {
            throw new Error('All translation services failed');
        }
        
        const service = this.services[serviceIndex];
        
        try {
            let url = service.url;
            let options = {
                method: service.method,
                headers: service.headers || {}
            };
            
            if (service.method === 'POST') {
                options.body = JSON.stringify(service.buildRequest(text));
            } else {
                const params = new URLSearchParams(service.buildRequest(text));
                url += '?' + params.toString();
            }
            
            const response = await fetch(url, options);
            
            if (!response.ok) {
                throw new Error(`Service ${service.name} returned ${response.status}`);
            }
            
            const data = await response.json();
            return service.parseResponse(data);
            
        } catch (error) {
            console.warn(`Translation service ${service.name} failed:`, error);
            // 尝试下一个服务
            return this.translateOnline(text, serviceIndex + 1);
        }
    }
    
    /**
     * 主翻译函数
     */
    async translate(text) {
        // 如果文本不包含中文，直接返回
        if (!this.containsChinese(text)) {
            return text;
        }
        
        // 检查缓存
        if (this.cache.has(text)) {
            return this.cache.get(text);
        }
        
        // 尝试本地翻译
        const localTranslation = this.translateLocal(text);
        if (localTranslation) {
            this.cache.set(text, localTranslation);
            return localTranslation;
        }
        
        // 尝试在线翻译
        try {
            const onlineTranslation = await this.translateOnline(text);
            if (onlineTranslation) {
                this.cache.set(text, onlineTranslation);
                return onlineTranslation;
            }
        } catch (error) {
            console.error('Online translation failed:', error);
        }
        
        // 如果所有方法都失败，返回原文
        return text;
    }
    
    /**
     * 批量翻译
     */
    async translateBatch(texts) {
        const promises = texts.map(text => this.translate(text));
        return Promise.all(promises);
    }
    
    /**
     * 清除缓存
     */
    clearCache() {
        this.cache.clear();
    }
    
    /**
     * 添加自定义词汇
     */
    addCustomTerms(terms) {
        Object.assign(this.commonTerms, terms);
    }
}

// 导出全局实例
window.TranslationHelper = TranslationHelper;

// 创建默认实例
if (!window.translationHelper) {
    window.translationHelper = new TranslationHelper();
}

export default TranslationHelper;