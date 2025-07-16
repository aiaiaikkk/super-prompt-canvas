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
import re # Added for language detection

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

import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from guidance_manager import guidance_manager


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
        "siliconflow": {
            "name": "SiliconFlow",
            "base_url": "https://api.siliconflow.cn/v1",
            "default_model": "deepseek-ai/DeepSeek-V3",
            "cost_per_1k": 0.001,
            "description": "SiliconFlow - 支持DeepSeek R1/V3等最新模型",
            "models": [
                "deepseek-ai/DeepSeek-R1",
                "deepseek-ai/DeepSeek-V3"
            ]
        },
        "deepseek": {
            "name": "DeepSeek",
            "base_url": "https://api.deepseek.com/v1",
            "default_model": "deepseek-chat",
            "cost_per_1k": 0.001,
            "description": "DeepSeek official - High-performance Chinese optimization model"
        },
        "qianwen": {
            "name": "Qianwen/Qianwen",
            "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1",
            "default_model": "qwen-turbo",
            "cost_per_1k": 0.002,
            "description": "Aliyun Qianwen model"
        },
        "openai": {
            "name": "OpenAI",
            "base_url": "https://api.openai.com/v1",
            "default_model": "gpt-3.5-turbo",
            "cost_per_1k": 0.015,
            "description": "OpenAI official model"
        }
    }
    
    @classmethod
    def get_available_models(cls, provider="siliconflow", api_key=None, force_refresh=False):
        """动态获取可用的API模型列表"""
        
        provider_config = cls.API_PROVIDERS.get(provider, cls.API_PROVIDERS["siliconflow"])
        
        # 如果提供商有预定义的模型列表，优先使用
        if "models" in provider_config:
            print(f"✅ Using {provider_config['name']} predefined model list: {provider_config['models']}")
            return provider_config["models"]
        
        if not OPENAI_AVAILABLE:
            print("❌ OpenAI library not installed, cannot get API models")
            return [provider_config["default_model"]]
            
        if not api_key:
            print(f"❌ {provider} API key not provided, using default model")
            return [provider_config["default_model"]]
            
        import time
        current_time = time.time()
        
        # 检查缓存是否有效
        if (not force_refresh and 
            provider in cls._cached_models and 
            provider in cls._cache_timestamp and
            current_time - cls._cache_timestamp[provider] < cls._cache_duration):
            print(f"📋 Using cached {provider} model list: {cls._cached_models[provider]}")
            return cls._cached_models[provider]
        
        try:
            if not OPENAI_AVAILABLE or OpenAI is None:
                print(f"❌ OpenAI library not installed, cannot get {provider} models")
                return [cls.API_PROVIDERS[provider]["default_model"]]
            
            provider_config = cls.API_PROVIDERS.get(provider, cls.API_PROVIDERS["siliconflow"])
            
            client = OpenAI(
                api_key=api_key,
                base_url=provider_config["base_url"]
            )
            
            # 获取模型列表
            models_response = client.models.list()
            model_names = []
            
            for model in models_response.data:
                model_names.append(model.id)
                print(f"✅ {provider_config['name']} detected model: {model.id}")
            
            # 如果没有获取到模型，使用默认模型
            if not model_names:
                model_names = [provider_config["default_model"]]
                print(f"⚠️ Failed to get {provider} model list, using default model: {provider_config['default_model']}")
            
            # 更新缓存
            cls._cached_models[provider] = model_names
            cls._cache_timestamp[provider] = current_time
            
            print(f"🔄 {provider_config['name']} model list updated, {len(model_names)} models total")
            return model_names
            
        except Exception as e:
            print(f"❌ Failed to get {provider} model list: {str(e)}")
            # 返回默认模型
            default_model = cls.API_PROVIDERS[provider]["default_model"]
            return [default_model]
    
    @classmethod
    def get_template_content_for_placeholder(cls, guidance_style, guidance_template):
        """获取模板内容用于placeholder显示"""
        try:
            # 导入guidance_templates模块
            import sys
            import os
            sys.path.append(os.path.dirname(os.path.abspath(__file__)))
            from guidance_templates import PRESET_GUIDANCE, TEMPLATE_LIBRARY
            
            # 根据guidance_style选择内容
            if guidance_style == "custom":
                # Custom mode retains complete prompt text
                return """Enter your custom AI guidance instructions...

For example:
You are a professional image editing expert. Please convert annotation data into clear and concise editing instructions. Focus on:
1. Keep instructions concise
2. Ensure precise operations
3. Maintain style consistency

For more examples, please check guidance_template options."""
            elif guidance_style == "template":
                if guidance_template and guidance_template != "none" and guidance_template in TEMPLATE_LIBRARY:
                    template_content = TEMPLATE_LIBRARY[guidance_template]["prompt"]
                    # 截取前200个字符用于placeholder显示
                    preview = template_content[:200].replace('\n', ' ').strip()
                    return f"Current template: {TEMPLATE_LIBRARY[guidance_template]['name']}\n\n{preview}..."
                else:
                    return "Preview will be displayed here after selecting a template..."
            else:
                # Display preset style content
                if guidance_style in PRESET_GUIDANCE:
                    preset_content = PRESET_GUIDANCE[guidance_style]["prompt"]
                    # 截取前200个字符用于placeholder显示
                    preview = preset_content[:200].replace('\n', ' ').strip()
                    return f"Current style: {PRESET_GUIDANCE[guidance_style]['name']}\n\n{preview}..."
                else:
                    return """Enter your custom AI guidance instructions...

For example:
You are a professional image editing expert. Please convert annotation data into clear and concise editing instructions. Focus on:
1. Keep instructions concise
2. Ensure precise operations
3. Maintain style consistency

For more examples, please check guidance_template options."""
        except Exception as e:
            print(f"Failed to get template content: {e}")
            return """Enter your custom AI guidance instructions...

For example:
You are a professional image editing expert. Please convert annotation data into clear and concise editing instructions. Focus on:
1. Keep instructions concise
2. Ensure precise operations
3. Maintain style consistency

For more examples, please check guidance_template options."""

    @classmethod
    def INPUT_TYPES(cls):
        """定义节点输入类型"""
        # 动态生成placeholder内容
        default_placeholder = cls.get_template_content_for_placeholder("efficient_concise", "none")
        
        # 获取已保存的指引列表
        saved_guidance_list = ["none"] + guidance_manager.list_guidance()

        return {
            "required": {
                "annotation_data": ("STRING", {
                    "forceInput": True,
                    "default": "",
                    "tooltip": "Annotation JSON data from VisualPromptEditor (optional - can work with edit_description alone)"
                }),
                "edit_description": ("STRING", {
                    "multiline": True,
                    "default": "",
                    "placeholder": "Describe the editing operations you want to perform...\n\nFor example:\n- Add a tree in the red rectangular area\n- Change the vehicle in the blue marked area to red\n- Remove the person in the circular area\n- Change the sky in the yellow area to sunset effect",
                    "tooltip": "Describe the editing operations you want to perform, combined with annotation information to generate precise editing instructions"
                }),
                "api_provider": (["siliconflow", "deepseek", "qianwen", "openai"], {
                    "default": "siliconflow"
                }),
                "api_key": ("STRING", {
                    "default": "",
                    "multiline": False,
                    "placeholder": "Enter your API key here..."
                }),
                "model_preset": ([
                    "deepseek-ai/DeepSeek-R1",
                    "deepseek-ai/DeepSeek-V3", 
                    "deepseek-chat",
                    "qwen-turbo",
                    "gpt-3.5-turbo",
                    "custom"
                ], {
                    "default": "deepseek-ai/DeepSeek-V3"
                }),
                "custom_model": ("STRING", {
                    "default": "",
                    "multiline": False,
                    "placeholder": "Custom model name (when preset=custom)"
                }),
                "editing_intent": ([
                    "product_showcase",      # 产品展示优化
                    "portrait_enhancement",  # 人像美化
                    "creative_design",       # 创意设计
                    "architectural_photo",   # 建筑摄影
                    "food_styling",          # 美食摄影
                    "fashion_retail",        # 时尚零售
                    "landscape_nature",      # 风景自然
                    "professional_editing",  # 专业图像编辑
                    "general_editing",       # 通用编辑
                    "custom"                 # 自定义
                ], {
                    "default": "general_editing",
                    "tooltip": "Select your editing intent: What type of result do you want to achieve? The AI will automatically choose the best technical approach based on your intent."
                }),
                "processing_style": ([
                    "auto_smart",           # 智能自动
                    "efficient_fast",       # 高效快速
                    "creative_artistic",    # 创意艺术
                    "precise_technical",    # 精确技术
                    "custom_guidance"       # 自定义指引
                ], {
                    "default": "auto_smart",
                    "tooltip": "Select the AI processing style: auto_smart will intelligently choose the best approach, others provide specific processing styles."
                }),
                "seed": ("INT", {
                    "default": 0,
                    "min": 0,
                    "max": 0xffffffffffffffff,
                    "tooltip": "Random seed for generation consistency. Change to get different variations."
                }),
                "custom_guidance": ("STRING", {
                    "multiline": True,
                    "default": "",
                    "placeholder": default_placeholder,
                    "tooltip": "Custom AI guidance instructions (used when guidance_style is custom)"
                }),
                "load_saved_guidance": (saved_guidance_list, {
                    "default": "none",
                    "tooltip": "Load previously saved custom guidance (used when guidance_style is custom)"
                }),
                "save_guidance_name": ("STRING", {
                    "default": "",
                    "multiline": False,
                    "placeholder": "Enter name to save guidance..."
                }),
                "save_guidance_button": ("BOOLEAN", {
                    "default": False,
                    "label": "Save Guidance"
                }),
            },
            "optional": {
                "image": ("IMAGE", {
                    "tooltip": "Optional: Image for visual analysis (required only when visual models are supported)"
                }),
            }
        }
    
    RETURN_TYPES = ("STRING", "STRING")
    RETURN_NAMES = ("flux_edit_instructions", "system_prompt")
    
    FUNCTION = "enhance_flux_instructions"
    CATEGORY = "kontext_super_prompt/api"
    DESCRIPTION = "🌐 Kontext Super Prompt API Enhancer - Generate optimized structured editing instructions through cloud AI models"
    
    def __init__(self):
        """初始化缓存和日志"""
        self.cache = {}
        self.log = []
        self.cache_max_size = 100  # 缓存最大条目数
        self.session_stats = {
            "total_requests": 0,
            "successful_requests": 0,
            "total_tokens": 0,
            "estimated_cost": 0.0
        }
        self._manage_cache()
    
    def _get_cache_key(self, annotation_data: str, 
                      edit_description: str, 
                      model_name: str, seed: int = 0) -> str:
        """生成缓存键"""
        import hashlib
        content = f"{annotation_data}|{edit_description}|{model_name}|{seed}"
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
            raise Exception("OpenAI library not installed, please run: pip install openai")
        
        if not api_key:
            raise Exception(f"Please provide {provider} API key")
        
        provider_config = self.API_PROVIDERS.get(provider, self.API_PROVIDERS["siliconflow"])
        
        return OpenAI(
            api_key=api_key,
            base_url=provider_config["base_url"]
        )
    
    
    def _build_intelligent_system_prompt(self, editing_intent, processing_style, 
                                       edit_description, annotation_data,
                                       guidance_style, guidance_template, custom_guidance,
                                       load_saved_guidance, language, guidance_manager):
        """构建智能系统提示词"""
        try:
            # 导入智能提示分析器
            from intelligent_prompt_analyzer import IntelligentPromptAnalyzer
            
            # 创建分析器实例
            analyzer = IntelligentPromptAnalyzer()
            
            # 使用智能分析器构建增强提示
            enhanced_prompt = analyzer.build_intelligent_prompt(
                editing_intent=editing_intent,
                processing_style=processing_style,
                edit_description=edit_description,
                annotation_data=annotation_data
            )
            
            return enhanced_prompt
            
        except Exception as e:
            print(f"⚠️ Intelligent prompt analysis failed: {e}")
            # 回退到基础系统提示词
            return guidance_manager.build_system_prompt(
                guidance_style=guidance_style,
                guidance_template=guidance_template,
                custom_guidance=custom_guidance,
                load_saved_guidance=load_saved_guidance,
                language=language
            )

    def _build_user_prompt(self, annotation_data: str, edit_description: str = "") -> str:
        """构建用户提示词"""
        
        prompt_parts = []
        prompt_parts.append("Based on the following information, generate a simple and direct editing instruction:")
        
        # 1. 编辑意图描述（最重要的信息）
        if edit_description and edit_description.strip():
            prompt_parts.append(f"\n**Edit Intent:**")
            prompt_parts.append(edit_description.strip())
        
        # 2. 标注数据
        prompt_parts.append(f"\n**Annotation Data:**")
        
        # 处理编号显示设置
        processed_annotation_data = self._process_annotation_data(annotation_data)
        prompt_parts.append(f"```json\n{processed_annotation_data}\n```")
        
        # 3. 简化的生成要求
        prompt_parts.append(f"\nGenerate ONLY a single, simple editing instruction.")
        prompt_parts.append("Output format: A direct command like 'change_color the red area to blue naturally'")
        prompt_parts.append("Do NOT include:")
        prompt_parts.append("- Technical analysis or explanations")
        prompt_parts.append("- Annotation numbers in parentheses")
        prompt_parts.append("- Multiple sections or bullet points")
        prompt_parts.append("- Quality metrics or rationale")
        prompt_parts.append("\nJust provide the clean, natural editing instruction.")
        
        return "\n".join(prompt_parts)
    
    def _process_annotation_data(self, annotation_data: str) -> str:
        """处理标注数据，根据include_annotation_numbers设置过滤编号信息"""
        try:
            import json
            data = json.loads(annotation_data)
            
            # 检查是否包含编号设置
            include_numbers = data.get("include_annotation_numbers", True)
            
            # 如果不包含编号，移除annotations中的number字段
            if not include_numbers and "annotations" in data:
                for annotation in data["annotations"]:
                    if "number" in annotation:
                        del annotation["number"]
            
            return json.dumps(data, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"⚠️ Error processing annotation data: {str(e)}")
            return annotation_data
    
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
            error_msg = f"API call failed: {str(e)}"
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
                
                if 'enhanced_prompt' in line.lower() or 'enhanced prompt' in line.lower():
                    current_section = 'enhanced'
                    continue
                elif 'kontext_instructions' in line.lower() or 'kontext' in line.lower():
                    current_section = 'kontext'
                    continue
                elif line.startswith('**') and line.endswith('**'):
                    # 可能是新的section标题
                    if 'enhanced' in line.lower():
                        current_section = 'enhanced'
                    elif 'kontext' in line.lower() or 'edit' in line.lower():
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
            print(f"⚠️ Failed to parse API response: {str(e)}")
            return response_text, ""
    
    def _map_intent_to_guidance(self, editing_intent: str, processing_style: str) -> tuple:
        """将编辑意图和处理风格映射到具体的技术参数"""
        
        # 编辑意图到模板的映射
        intent_template_map = {
            "product_showcase": "ecommerce_product",
            "portrait_enhancement": "portrait_beauty", 
            "creative_design": "creative_design",
            "architectural_photo": "architecture_photo",
            "food_styling": "food_photography",
            "fashion_retail": "fashion_retail",
            "landscape_nature": "landscape_nature",
            "professional_editing": "professional_editing",
            "general_editing": "none",
            "custom": "none"
        }
        
        # 处理风格到guidance_style的映射
        style_guidance_map = {
            "auto_smart": "efficient_concise",  # 智能自动默认高效
            "efficient_fast": "efficient_concise",
            "creative_artistic": "natural_creative", 
            "precise_technical": "technical_precise",
            "custom_guidance": "custom"
        }
        
        # 编辑意图到instruction_type的映射
        intent_instruction_map = {
            "product_showcase": "semantic_enhanced",
            "portrait_enhancement": "content_aware",
            "creative_design": "style_coherent",
            "architectural_photo": "spatial_precise",
            "food_styling": "semantic_enhanced",
            "fashion_retail": "semantic_enhanced",
            "landscape_nature": "style_coherent",
            "professional_editing": "content_aware",
            "general_editing": "auto_detect",
            "custom": "auto_detect"
        }
        
        # 智能自动选择逻辑
        if processing_style == "auto_smart":
            # 根据编辑意图智能选择最佳组合
            if editing_intent in ["professional_editing", "architectural_photo"]:
                guidance_style = "technical_precise"
            elif editing_intent in ["creative_design", "landscape_nature"]:
                guidance_style = "natural_creative"
            else:
                guidance_style = "efficient_concise"
        else:
            guidance_style = style_guidance_map.get(processing_style, "efficient_concise")
        
        guidance_template = intent_template_map.get(editing_intent, "none")
        edit_instruction_type = intent_instruction_map.get(editing_intent, "auto_detect")
        
        return edit_instruction_type, guidance_style, guidance_template

    def enhance_flux_instructions(self, api_provider, api_key, model_preset, custom_model, 
                                annotation_data, edit_description, 
                                editing_intent, processing_style, seed,
                                custom_guidance, load_saved_guidance,
                                save_guidance_name, save_guidance_button, 
                                image=None):
        """
        Main function to enhance Flux instructions via API
        """
        try:
            start_time = time.time()
            
            # 处理保存按钮点击
            if save_guidance_button and save_guidance_name and custom_guidance:
                guidance_manager.save_guidance(save_guidance_name, custom_guidance)
                print(f"✅ Guidance '{save_guidance_name}' saved.")
                # 重置按钮状态避免重复保存
                save_guidance_button = False

            # 如果选择了加载项，则覆盖custom_guidance
            if load_saved_guidance != "none":
                loaded_data = guidance_manager.load_guidance(load_saved_guidance)
                if loaded_data and 'content' in loaded_data:
                    custom_guidance = loaded_data['content']
                    print(f"📋 Guidance '{load_saved_guidance}' loaded.")
            
            # 获取 guidance manager 的实例
            guidance_manager_instance = guidance_manager
            
            # 使用AI智能映射逻辑
            edit_instruction_type, guidance_style, guidance_template = self._map_intent_to_guidance(
                editing_intent, processing_style
            )
            
            # 获取模型名称
            model_name = custom_model if model_preset == "custom" else model_preset
            language = "zh" if re.search(r'[\u4e00-\u9fa5]', edit_description) else "en"
            output_format = "natural_language"

            # 构建系统提示词
            try:
                system_prompt = self._build_intelligent_system_prompt(
                    editing_intent, processing_style, edit_description, annotation_data,
                    guidance_style, guidance_template, custom_guidance, 
                    load_saved_guidance, language, guidance_manager_instance
                )
                print("✅ Using intelligent system prompt analysis")
            except Exception as e:
                print(f"⚠️ Intelligent system prompt failed: {e}")
                system_prompt = guidance_manager_instance.build_system_prompt(
                    guidance_style=guidance_style,
                    guidance_template=guidance_template,
                    custom_guidance=custom_guidance,
                    language=language,
                    edit_instruction_type=edit_instruction_type,
                    output_format=output_format,
                    fallback_mode=True
                )

            # 2. 构建用户Prompt
            user_prompt = self._build_user_prompt(annotation_data, edit_description)
            
            # 3. API调用 & 缓存管理
            client = self._create_api_client(api_provider, api_key)
            if client is None:
                return ("", "API client creation failed. Please check API key and provider.")

            cache_key = self._get_cache_key(annotation_data, edit_description, model_name, seed)
            if cache_key in self.cache:
                print("✅ Using cached response")
                cached_data = self.cache[cache_key]
                return (cached_data["response"], cached_data["system_prompt"])

            # 4. 执行API调用
            response_text, usage_info = self._generate_with_api(
                client, model_name, system_prompt, user_prompt, 0.7, 2048, api_provider
            )

            # 5. 解析和处理响应
            if not response_text:
                return ("", system_prompt)
            
            flux_instructions = self._clean_natural_language_output(response_text)
            
            # 缓存结果
            self.cache[cache_key] = {"response": flux_instructions, "system_prompt": system_prompt}
            
            end_time = time.time()
            print(f"✅ API call successful, cost {end_time - start_time:.2f}s")
            
            return (flux_instructions, system_prompt)
            
        except Exception as e:
            print(f"❌ API call failed: {traceback.format_exc()}")
            return ("", f"Error: {e}")
    
    def _clean_natural_language_output(self, instructions: str) -> str:
        """清理和格式化自然语言输出"""
        
        # 移除常见的API响应包裹，例如```json ... ```
        if instructions.strip().startswith("```json"):
            instructions = instructions.split("```json", 1)[1]
            if "```" in instructions:
                instructions = instructions.rsplit("```", 1)[0]
        
        # 移除 ``` ... ```
        if instructions.strip().startswith("```"):
            instructions = instructions.split("```", 1)[1]
            if "```" in instructions:
                instructions = instructions.rsplit("```", 1)[0]
        
        # 移除XML/JSON标签
        instructions = instructions.replace("<thinking>", "").replace("</thinking>", "")
        instructions = instructions.replace("<instructions>", "").replace("</instructions>", "")
        
        # 移除"Here are the generated instructions:"等前缀
        prefixes_to_remove = [
            "Here are the generated instructions:",
            "Here are the editing instructions:",
            "Here is the result:",
            "The generated instructions are as follows:",
            "The editing instructions are as follows:"
        ]
        for prefix in prefixes_to_remove:
            if instructions.strip().lower().startswith(prefix.lower()):
                instructions = instructions.strip()[len(prefix):].strip()

        # 移除markdown格式
        instructions = instructions.replace("*", "").replace("#", "")
        
        # 确保输出是干净的字符串
        return instructions.strip()


# 服务器API端点 (可选)
# ---------------------
# 如果WEB_AVAILABLE为True，则设置API端点
if WEB_AVAILABLE:
    
    @classmethod
    def IS_CHANGED(cls, **kwargs):
        """用于前端UI的动态更新检查"""
        # 每次都返回一个新时间戳，强制前端更新
        return time.time()

    @PromptServer.instance.routes.get("/kontextapi/providers")
    async def get_providers(request):
        """获取所有API提供商的列表"""
        return web.json_response(list(APIFluxKontextEnhancer.API_PROVIDERS.keys()))

    @PromptServer.instance.routes.post("/kontextapi/models")
    async def get_models(request):
        """获取指定提供商的模型列表"""
        try:
            data = await request.json()
            provider = data.get("provider")
            api_key = data.get("api_key")
            
            if not provider or not api_key:
                return web.json_response({"error": "Provider and API key are required"}, status=400)
            
            models = APIFluxKontextEnhancer.get_available_models(provider, api_key, force_refresh=True)
            return web.json_response(models)
            
        except Exception as e:
            return web.json_response({"error": str(e)}, status=500)
            
# 调试信息
print("🔧 DEBUG: API_flux_kontext_enhancer.py is being loaded")
print(f"🔧 DEBUG: APIFluxKontextEnhancer class exists: {APIFluxKontextEnhancer}")

# 节点映射
NODE_CLASS_MAPPINGS = {
    "APIFluxKontextEnhancer": APIFluxKontextEnhancer
}

# 节点显示名称映射
NODE_DISPLAY_NAME_MAPPINGS = {
    "APIFluxKontextEnhancer": "APIFluxKontextEnhancer"
}

print(f"🔧 DEBUG: NODE_CLASS_MAPPINGS = {NODE_CLASS_MAPPINGS}")
print(f"🔧 DEBUG: NODE_DISPLAY_NAME_MAPPINGS = {NODE_DISPLAY_NAME_MAPPINGS}")