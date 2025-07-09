"""
API Flux Kontext Enhancer Node
API集成的Flux Kontext提示词增强节点

将VisualPromptEditor的标注数据通过API模型转换为
Flux Kontext优化的结构化编辑指令

支持多个API提供商:
- DeepSeek (¥0.001/1K tokens)
- Qianwen/千问 (¥0.002/1K tokens)  
- OpenAI (¥0.015/1K tokens)
"""

import json
import time
import traceback
from typing import Dict, List, Any, Tuple, Optional
from datetime import datetime

try:
    import openai
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    OpenAI = None
    print("Warning: openai package not found. Please install with: pip install openai")

try:
    from aiohttp import web
    from server import PromptServer
    WEB_AVAILABLE = True
except ImportError:
    WEB_AVAILABLE = False


class APIFluxKontextEnhancer:
    """
    🤖 API Flux Kontext Enhancer
    
    通过API模型将VisualPromptEditor的标注数据
    转换为Flux Kontext优化的结构化编辑指令
    """
    
    # 类级别的缓存变量
    _cached_models = {}
    _cache_timestamp = {}
    _cache_duration = 300  # 缓存5分钟
    
    # API提供商配置
    API_PROVIDERS = {
        "deepseek": {
            "name": "DeepSeek",
            "base_url": "https://api.deepseek.com/v1",
            "default_model": "deepseek-chat",
            "cost_per_1k": 0.001,
            "description": "高性价比中文优化模型"
        },
        "qianwen": {
            "name": "千问/Qianwen",
            "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1",
            "default_model": "qwen-turbo",
            "cost_per_1k": 0.002,
            "description": "阿里云千问模型"
        },
        "openai": {
            "name": "OpenAI",
            "base_url": "https://api.openai.com/v1",
            "default_model": "gpt-3.5-turbo",
            "cost_per_1k": 0.015,
            "description": "OpenAI官方模型"
        }
    }
    
    @classmethod
    def get_available_models(cls, provider="deepseek", api_key=None, force_refresh=False):
        """动态获取可用的API模型列表"""
        
        if not OPENAI_AVAILABLE:
            print("❌ OpenAI库未安装，无法获取API模型")
            return [cls.API_PROVIDERS[provider]["default_model"]]
            
        if not api_key:
            print(f"❌ {provider} API密钥未提供")
            return [cls.API_PROVIDERS[provider]["default_model"]]
            
        import time
        current_time = time.time()
        
        # 检查缓存是否有效
        if (not force_refresh and 
            provider in cls._cached_models and 
            provider in cls._cache_timestamp and
            current_time - cls._cache_timestamp[provider] < cls._cache_duration):
            print(f"📋 使用缓存的{provider}模型列表: {cls._cached_models[provider]}")
            return cls._cached_models[provider]
        
        try:
            if not OPENAI_AVAILABLE or OpenAI is None:
                print(f"❌ OpenAI库未安装，无法获取{provider}模型")
                return [cls.API_PROVIDERS[provider]["default_model"]]
            
            provider_config = cls.API_PROVIDERS.get(provider, cls.API_PROVIDERS["deepseek"])
            
            client = OpenAI(
                api_key=api_key,
                base_url=provider_config["base_url"]
            )
            
            # 获取模型列表
            models_response = client.models.list()
            model_names = []
            
            for model in models_response.data:
                model_names.append(model.id)
                print(f"✅ {provider_config['name']} 检测到模型: {model.id}")
            
            # 如果没有获取到模型，使用默认模型
            if not model_names:
                model_names = [provider_config["default_model"]]
                print(f"⚠️ 未获取到{provider}模型列表，使用默认模型: {provider_config['default_model']}")
            
            # 更新缓存
            cls._cached_models[provider] = model_names
            cls._cache_timestamp[provider] = current_time
            
            print(f"🔄 {provider_config['name']} 模型列表已更新，共{len(model_names)}个模型")
            return model_names
            
        except Exception as e:
            print(f"❌ 获取{provider}模型列表失败: {str(e)}")
            # 返回默认模型
            default_model = cls.API_PROVIDERS[provider]["default_model"]
            return [default_model]
    
    @classmethod
    def INPUT_TYPES(cls):
        """定义节点输入类型"""
        return {
            "required": {
                "api_provider": (["deepseek", "qianwen", "openai"], {
                    "default": "deepseek"
                }),
                "api_key": ("STRING", {
                    "default": "",
                    "multiline": False,
                    "placeholder": "Enter your API key here..."
                }),
                "model_name": ("STRING", {
                    "default": "deepseek-chat",
                    "multiline": False,
                    "placeholder": "Model name (auto-detected if API key provided)"
                }),
                "image": ("IMAGE",),
                "annotations_json": ("STRING", {
                    "default": "[]",
                    "multiline": True,
                    "placeholder": "Annotation data from VisualPromptEditor"
                }),
                "base_prompt": ("STRING", {
                    "default": "",
                    "multiline": True,
                    "placeholder": "Base prompt to enhance..."
                }),
                "style_preset": ([
                    "photorealistic",
                    "artistic",
                    "cinematic", 
                    "portrait",
                    "landscape",
                    "anime",
                    "concept_art",
                    "commercial",
                    "fashion",
                    "architectural"
                ], {
                    "default": "photorealistic"
                }),
                "enhancement_level": ([
                    "minimal",
                    "moderate", 
                    "comprehensive",
                    "professional"
                ], {
                    "default": "moderate"
                }),
                "language": (["chinese", "english", "bilingual"], {
                    "default": "chinese"
                }),
                "temperature": ("FLOAT", {
                    "default": 0.7,
                    "min": 0.0,
                    "max": 2.0,
                    "step": 0.1
                }),
                "max_tokens": ("INT", {
                    "default": 1000,
                    "min": 100,
                    "max": 4000,
                    "step": 100
                }),
                "enable_caching": ("BOOLEAN", {
                    "default": True
                }),
                "debug_mode": ("BOOLEAN", {
                    "default": False
                })
            },
            "optional": {
                "custom_instructions": ("STRING", {
                    "default": "",
                    "multiline": True,
                    "placeholder": "Additional custom instructions..."
                }),
                "negative_prompt": ("STRING", {
                    "default": "",
                    "multiline": True,
                    "placeholder": "What to avoid in the image..."
                })
            }
        }
    
    RETURN_TYPES = ("STRING", "STRING", "STRING", "STRING")
    RETURN_NAMES = ("enhanced_prompt", "kontext_instructions", "api_response", "debug_info")
    
    FUNCTION = "enhance_flux_instructions"
    CATEGORY = "KontextVisualPromptWindow/API"
    
    def __init__(self):
        self.cache = {}
        self.cache_max_size = 100
        self.session_stats = {
            "total_requests": 0,
            "successful_requests": 0,
            "total_tokens": 0,
            "estimated_cost": 0.0
        }
    
    def _get_cache_key(self, annotations_json: str, base_prompt: str, 
                      style_preset: str, enhancement_level: str, 
                      language: str, model_name: str, temperature: float) -> str:
        """生成缓存键"""
        import hashlib
        content = f"{annotations_json}|{base_prompt}|{style_preset}|{enhancement_level}|{language}|{model_name}|{temperature}"
        return hashlib.md5(content.encode()).hexdigest()
    
    def _manage_cache(self):
        """管理缓存大小"""
        if len(self.cache) > self.cache_max_size:
            # 删除最旧的条目
            oldest_key = min(self.cache.keys(), key=lambda k: self.cache[k]['timestamp'])
            del self.cache[oldest_key]
    
    def _create_api_client(self, provider: str, api_key: str):
        """创建API客户端"""
        if not OPENAI_AVAILABLE or OpenAI is None:
            raise Exception("OpenAI库未安装，请运行: pip install openai")
        
        if not api_key:
            raise Exception(f"请提供{provider} API密钥")
        
        provider_config = self.API_PROVIDERS.get(provider, self.API_PROVIDERS["deepseek"])
        
        return OpenAI(
            api_key=api_key,
            base_url=provider_config["base_url"]
        )
    
    def _build_system_prompt(self, language: str, style_preset: str, 
                           enhancement_level: str) -> str:
        """构建系统提示词"""
        
        language_instructions = {
            "chinese": "请用中文回答，使用专业的图像编辑和AI绘画术语。",
            "english": "Please respond in English using professional image editing and AI art terminology.",
            "bilingual": "Please provide responses in both Chinese and English, with Chinese first."
        }
        
        enhancement_instructions = {
            "minimal": "进行基础的提示词优化，保持简洁",
            "moderate": "进行中等程度的提示词增强，平衡细节和可读性",
            "comprehensive": "进行全面的提示词优化，包含丰富的细节描述",
            "professional": "进行专业级的提示词优化，适合商业用途"
        }
        
        style_instructions = {
            "photorealistic": "专注于真实感摄影效果，包含光影、质感等细节",
            "artistic": "强调艺术性表达，包含色彩、构图等艺术元素",
            "cinematic": "电影级视觉效果，包含镜头语言和氛围营造",
            "portrait": "人像摄影专业技法，包含表情、光线、构图",
            "landscape": "风景摄影技法，包含自然光、景深、构图",
            "anime": "动漫风格特征，包含色彩、线条、风格化处理",
            "concept_art": "概念艺术风格，包含创意设计和视觉概念",
            "commercial": "商业摄影标准，包含产品展示和品牌调性",
            "fashion": "时尚摄影技法，包含造型、光影、趋势元素",
            "architectural": "建筑摄影技法，包含空间、线条、光影"
        }
        
        return f"""你是一个专业的AI图像编辑专家，特别擅长Flux模型的Kontext编辑功能。

{language_instructions[language]}

任务目标：
1. 分析VisualPromptEditor提供的标注数据
2. 将标注信息转换为Flux Kontext优化的编辑指令
3. 结合基础提示词生成增强版提示词
4. 确保指令符合{style_preset}风格的{enhancement_instructions[enhancement_level]}要求

风格指导：
{style_instructions[style_preset]}

输出格式要求：
1. enhanced_prompt: 增强后的完整提示词
2. kontext_instructions: Flux Kontext格式的编辑指令
3. 确保提示词自然流畅，符合AI绘画最佳实践
4. 包含适当的技术参数和质量关键词

请始终遵循专业的AI图像编辑标准和Flux模型的最佳实践。"""
    
    def _build_user_prompt(self, annotations_json: str, base_prompt: str, 
                          custom_instructions: str = "", negative_prompt: str = "") -> str:
        """构建用户提示词"""
        
        user_prompt = f"""请分析以下内容并生成优化的Flux Kontext编辑指令：

**标注数据：**
```json
{annotations_json}
```

**基础提示词：**
{base_prompt}

**自定义指令：**
{custom_instructions}

**负面提示词：**
{negative_prompt}

请生成：
1. **enhanced_prompt** - 增强后的完整提示词
2. **kontext_instructions** - Flux Kontext格式的编辑指令

确保输出的指令能够精确控制图像编辑，同时保持自然流畅的语言表达。"""
        
        return user_prompt
    
    def _generate_with_api(self, client, model_name: str, 
                         system_prompt: str, user_prompt: str, 
                         temperature: float, max_tokens: int, 
                         provider: str) -> Tuple[str, Dict[str, Any]]:
        """使用API生成内容"""
        try:
            response = client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=temperature,
                max_tokens=max_tokens,
                stream=False
            )
            
            # 提取响应内容
            generated_text = response.choices[0].message.content
            
            # 计算成本
            provider_config = self.API_PROVIDERS[provider]
            prompt_tokens = response.usage.prompt_tokens
            completion_tokens = response.usage.completion_tokens
            total_tokens = response.usage.total_tokens
            
            estimated_cost = (total_tokens / 1000) * provider_config["cost_per_1k"]
            
            # 更新统计信息
            self.session_stats["total_requests"] += 1
            self.session_stats["successful_requests"] += 1
            self.session_stats["total_tokens"] += total_tokens
            self.session_stats["estimated_cost"] += estimated_cost
            
            response_info = {
                "provider": provider_config["name"],
                "model": model_name,
                "prompt_tokens": prompt_tokens,
                "completion_tokens": completion_tokens,
                "total_tokens": total_tokens,
                "estimated_cost": estimated_cost,
                "cost_currency": "CNY",
                "timestamp": datetime.now().isoformat()
            }
            
            return generated_text, response_info
            
        except Exception as e:
            self.session_stats["total_requests"] += 1
            error_msg = f"API调用失败: {str(e)}"
            print(f"❌ {error_msg}")
            
            response_info = {
                "error": error_msg,
                "provider": provider,
                "model": model_name,
                "timestamp": datetime.now().isoformat()
            }
            
            raise Exception(error_msg)
    
    def _parse_api_response(self, response_text: str) -> Tuple[str, str]:
        """解析API响应并提取增强提示词和Kontext指令"""
        try:
            # 尝试通过标记分离内容
            enhanced_prompt = ""
            kontext_instructions = ""
            
            lines = response_text.split('\n')
            current_section = None
            
            for line in lines:
                line = line.strip()
                
                if 'enhanced_prompt' in line.lower() or '增强提示词' in line:
                    current_section = 'enhanced'
                    continue
                elif 'kontext_instructions' in line.lower() or 'kontext' in line.lower():
                    current_section = 'kontext'
                    continue
                elif line.startswith('**') and line.endswith('**'):
                    # 可能是新的section标题
                    if '增强' in line or 'enhanced' in line.lower():
                        current_section = 'enhanced'
                    elif 'kontext' in line.lower() or '编辑指令' in line:
                        current_section = 'kontext'
                    continue
                
                if current_section == 'enhanced' and line:
                    enhanced_prompt += line + '\n'
                elif current_section == 'kontext' and line:
                    kontext_instructions += line + '\n'
            
            # 如果解析失败，将整个响应作为增强提示词
            if not enhanced_prompt.strip():
                enhanced_prompt = response_text
            
            return enhanced_prompt.strip(), kontext_instructions.strip()
            
        except Exception as e:
            print(f"⚠️ 解析API响应失败: {str(e)}")
            return response_text, ""
    
    def enhance_flux_instructions(self, api_provider, api_key, model_name, image, 
                                annotations_json, base_prompt, style_preset, 
                                enhancement_level, language, temperature, max_tokens, 
                                enable_caching, debug_mode, custom_instructions="", 
                                negative_prompt=""):
        """主要处理函数"""
        
        try:
            start_time = time.time()
            
            # 输入验证
            if not api_key or not api_key.strip():
                return (
                    "错误：请提供有效的API密钥",
                    "",
                    json.dumps({"error": "API密钥为空"}, ensure_ascii=False, indent=2),
                    "API密钥验证失败"
                )
            
            # 检查缓存
            cache_key = None
            if enable_caching:
                cache_key = self._get_cache_key(
                    annotations_json, base_prompt, style_preset, 
                    enhancement_level, language, model_name, temperature
                )
                
                if cache_key in self.cache:
                    cached_result = self.cache[cache_key]
                    if debug_mode:
                        print(f"🎯 使用缓存结果: {cache_key}")
                    return (
                        cached_result['enhanced_prompt'],
                        cached_result['kontext_instructions'],
                        cached_result['api_response'],
                        f"缓存命中 | 生成时间: {cached_result['generation_time']:.2f}秒"
                    )
            
            # 创建API客户端
            client = self._create_api_client(api_provider, api_key)
            
            # 构建提示词
            system_prompt = self._build_system_prompt(language, style_preset, enhancement_level)
            user_prompt = self._build_user_prompt(annotations_json, base_prompt, custom_instructions, negative_prompt)
            
            if debug_mode:
                print(f"🔍 系统提示词: {system_prompt[:200]}...")
                print(f"🔍 用户提示词: {user_prompt[:200]}...")
            
            # 调用API
            response_text, response_info = self._generate_with_api(
                client, model_name, system_prompt, user_prompt, 
                temperature, max_tokens, api_provider
            )
            
            # 解析响应
            enhanced_prompt, kontext_instructions = self._parse_api_response(response_text)
            
            # 生成调试信息
            generation_time = time.time() - start_time
            debug_info = f"""生成完成 | 提供商: {response_info.get('provider', api_provider)} | 模型: {model_name} | 
时间: {generation_time:.2f}秒 | Token: {response_info.get('total_tokens', 0)} | 
成本: ¥{response_info.get('estimated_cost', 0):.4f}"""
            
            # 准备返回的API响应信息
            api_response = json.dumps({
                "response_info": response_info,
                "generation_time": generation_time,
                "session_stats": self.session_stats,
                "raw_response": response_text[:500] + "..." if len(response_text) > 500 else response_text
            }, ensure_ascii=False, indent=2)
            
            # 缓存结果
            if enable_caching and cache_key:
                self._manage_cache()
                self.cache[cache_key] = {
                    'enhanced_prompt': enhanced_prompt,
                    'kontext_instructions': kontext_instructions,
                    'api_response': api_response,
                    'generation_time': generation_time,
                    'timestamp': time.time()
                }
            
            return (enhanced_prompt, kontext_instructions, api_response, debug_info)
            
        except Exception as e:
            error_msg = f"处理失败: {str(e)}"
            print(f"❌ {error_msg}")
            
            error_response = json.dumps({
                "error": error_msg,
                "traceback": traceback.format_exc(),
                "timestamp": datetime.now().isoformat()
            }, ensure_ascii=False, indent=2)
            
            return (
                f"错误：{error_msg}",
                "",
                error_response,
                f"处理失败 | 错误: {error_msg}"
            )
    
    @classmethod
    def IS_CHANGED(cls, **kwargs):
        """检查输入是否改变"""
        # 对于API调用，总是重新生成以确保最新结果
        return float("nan")


# 注册节点
NODE_CLASS_MAPPINGS = {
    "APIFluxKontextEnhancer": APIFluxKontextEnhancer
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "APIFluxKontextEnhancer": "🤖 API Flux Kontext Enhancer"
}

# 添加Web UI支持
if WEB_AVAILABLE:
    @PromptServer.instance.routes.get("/kontextapi/providers")
    async def get_providers(request):
        """获取可用的API提供商"""
        providers = []
        for key, config in APIFluxKontextEnhancer.API_PROVIDERS.items():
            providers.append({
                "id": key,
                "name": config["name"],
                "cost_per_1k": config["cost_per_1k"],
                "description": config["description"],
                "default_model": config["default_model"]
            })
        return web.json_response(providers)
    
    @PromptServer.instance.routes.post("/kontextapi/models")
    async def get_models(request):
        """获取指定提供商的模型列表"""
        data = await request.json()
        provider = data.get("provider", "deepseek")
        api_key = data.get("api_key", "")
        
        try:
            models = APIFluxKontextEnhancer.get_available_models(provider, api_key)
            return web.json_response({"models": models})
        except Exception as e:
            return web.json_response({"error": str(e)}, status=400)