"""
TextGenWebUIFluxKontextEnhancer Node
Text Generation WebUI-integrated Flux Kontext prompt enhancement node

Converts Super Canvas layer data through Text Generation WebUI models to
Flux Kontext-optimized structured editing instructions
"""

import json
import time
import traceback
from typing import Dict, List, Any, Tuple, Optional
from datetime import datetime

try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False

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

class TextGenWebUIFluxKontextEnhancer:
    """
    🌐 Text Generation WebUI Flux Kontext Enhancer
    
    Converts annotation data from Super Canvas into structured editing instructions
    optimized for Flux Kontext, using Text Generation WebUI models.
    """
    
    # Class-level cache variables
    _cached_models = None
    _cache_timestamp = 0
    _cache_duration = 10  # Cache for 10 seconds (longer than Ollama due to more stable service)
    _last_successful_url = None
    _silent_mode = True  # Enable silent mode during INPUT_TYPES calls
    
    @classmethod
    def get_available_models(cls, url=None, force_refresh=False, silent=None):
        """Dynamically gets the list of available TextGen WebUI models"""
        
        import time
        import os
        current_time = time.time()
        
        # Use instance silent mode if not specified
        if silent is None:
            silent = cls._silent_mode
        
        # Get TextGen WebUI URL configuration
        if url is None:
            # Priority: environment variable > config file > default value
            url = (os.getenv('TEXTGEN_WEBUI_URL') or 
                   os.getenv('TEXTGEN_URL') or 
                   os.getenv('TEXTGEN_HOST') or 
                   "http://127.0.0.1:5000")
        
        # Check if cache is valid
        if (not force_refresh and 
            cls._cached_models is not None and 
            current_time - cls._cache_timestamp < cls._cache_duration):
            return cls._cached_models
        
        def try_openai_api(api_url):
            """Try to get model list via OpenAI-compatible API"""
            try:
                if not REQUESTS_AVAILABLE:
                    return []
                
                response = requests.get(f"{api_url}/v1/models", timeout=10)
                if response.status_code == 200:
                    models_data = response.json()
                    models = models_data.get('data', [])
                    
                    model_names = []
                    for model in models:
                        if isinstance(model, dict):
                            name = model.get('id') or model.get('model') or model.get('name')
                            if name:
                                model_names.append(name)
                    
                    return model_names
            except Exception as e:
                if not silent:
                    print(f"[ERROR] Failed to get models via Ollama API: {str(e)}")
                return []
        
        def try_native_api(api_url):
            """Try to get model list via native TextGen WebUI API"""
            try:
                if not REQUESTS_AVAILABLE:
                    return []
                
                response = requests.get(f"{api_url}/api/v1/model", timeout=10)
                if response.status_code == 200:
                    model_data = response.json()
                    
                    # TextGen WebUI returns current loaded model info
                    model_name = None
                    if isinstance(model_data, dict):
                        model_name = (model_data.get('result') or 
                                    model_data.get('model_name') or 
                                    model_data.get('model'))
                    elif isinstance(model_data, str):
                        model_name = model_data
                    
                    return [model_name] if model_name else []
            except Exception as e:
                if not silent:
                    print(f"[ERROR] Failed to parse model list: {str(e)}")
                return []
        
        # Start model detection process
        if not silent:
            print(f"[INFO] Starting model detection for URL: {url}")
        
        # Try multiple URL formats
        urls_to_try = [url]
        
        # Add common local address variants
        if url not in ["http://127.0.0.1:7860", "http://localhost:7860", "http://0.0.0.0:7860"]:
            urls_to_try.extend([
                "http://127.0.0.1:7860",
                "http://localhost:7860", 
                "http://0.0.0.0:7860"
            ])
        
        urls_to_try = list(dict.fromkeys(urls_to_try))
        
        all_models = set()
        successful_url = None
        
        for test_url in urls_to_try:
            try:
                # Method 1: OpenAI-compatible API (preferred)
                openai_models = try_openai_api(test_url)
                if openai_models:
                    all_models.update(openai_models)
                    successful_url = test_url
                    if not silent:
                        print(f"[OK] Found {len(openai_models)} models via OpenAI API at {test_url}")
                
                # Method 2: Native API (fallback)
                native_models = try_native_api(test_url)
                if native_models:
                    all_models.update(native_models)
                    successful_url = test_url
                    if not silent:
                        print(f"[OK] Found {len(native_models)} models via Native API at {test_url}")
                
                # Exit early if models found
                if all_models:
                    break
                    
            except Exception as e:
                if not silent:
                    print(f"[ERROR] Failed to get models from {test_url}: {str(e)}")
                continue
        
        # Convert to sorted list
        model_list = sorted(list(all_models))
        
        if model_list:
            if not silent:
                print(f"[OK] Found {len(model_list)} models: {model_list}")
            
            # Update cache
            cls._cached_models = model_list
            cls._cache_timestamp = current_time
            if successful_url:
                cls._last_successful_url = successful_url
            if not silent:
                print(f"[OK] Successfully cached {len(model_list)} models")
            
            return model_list
        
        # If no models detected, return fallback
        if not silent:
            print(f"[WARN] No models found, using fallback")
        fallback_models = ["textgen-webui-model-not-found"]
        if not silent:
            print(f"[WARN] Returning fallback model: {fallback_models[0]}")
        
        # Cache fallback to avoid repeated error detection
        cls._cached_models = fallback_models
        cls._cache_timestamp = current_time
        
        return fallback_models

    @classmethod
    def refresh_model_cache(cls):
        """Manually refreshes the model cache"""
        cls._cached_models = None
        cls._cache_timestamp = 0
        # Enable verbose logging during manual refresh
        return cls.get_available_models(force_refresh=True, silent=False)

    @classmethod
    def get_template_content_for_placeholder(cls, guidance_style, guidance_template):
        """Gets template content for placeholder display"""
        try:
            # Import guidance_templates module from the current 'nodes' directory
            from guidance_templates import PRESET_GUIDANCE, TEMPLATE_LIBRARY
            
            # Select content based on guidance_style
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
                    # Truncate to first 200 characters for placeholder display
                    preview = template_content[:200].replace('\n', ' ').strip()
                    return f"Current template: {TEMPLATE_LIBRARY[guidance_template]['name']}\n\n{preview}..."
                else:
                    return "Preview will be displayed here after selecting a template..."
            else:
                # Display preset style content
                if guidance_style in PRESET_GUIDANCE:
                    preset_content = PRESET_GUIDANCE[guidance_style]["prompt"]
                    # Truncate to first 200 characters for placeholder display
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
            return """Enter your custom AI guidance instructions...

For example:
You are a professional image editing expert. Please convert annotation data into clear and concise editing instructions. Focus on:
1. Keep instructions concise
2. Ensure precise operations
3. Maintain style consistency

For more examples, please check guidance_template options."""

    @classmethod
    def INPUT_TYPES(cls):
        # Use silent mode for INPUT_TYPES calls to avoid spam logs
        try:
            if cls._cached_models is None:
                available_models = cls.get_available_models(force_refresh=False, silent=True)
            else:
                available_models = cls._cached_models
            
            # If no models are detected, use a fallback option
            if not available_models or len(available_models) == 0:
                available_models = ["No models found - Start TextGen WebUI service"]
            else:
                # Add a refresh option to the beginning of the list
                available_models = ["🔄 Refresh model list"] + available_models
            
            # Set the default model to the first actual model (skipping the refresh option)
            if len(available_models) > 1 and available_models[0] == "🔄 Refresh model list":
                default_model = available_models[1]
            else:
                default_model = available_models[0]
                
        except Exception as e:
            available_models = ["Error getting models - Check TextGen WebUI"]
            default_model = available_models[0]
        
        # Dynamically generate placeholder content
        try:
            default_placeholder = cls.get_template_content_for_placeholder("auto_smart", "none")
        except Exception as e:
            default_placeholder = "Enter your custom AI guidance instructions..."
        
        return {
            "required": {
                "layer_info": ("STRING", {
                    "forceInput": True,
                    "default": "",
                    "tooltip": "Annotation JSON data from Super Canvas. Can be left empty if only using Edit Description."
                }),
                "edit_description": ("STRING", {
                    "multiline": True,
                    "default": "",
                    "placeholder": "Describe the editing operations you want to perform...\n\nFor example:\n- Add a tree in the red rectangular area\n- Change the vehicle in the blue marked area to red\n- Remove the person in the circular area\n- Change the sky in the yellow area to sunset effect",
                    "tooltip": "Describe the editing operations to perform. This will be combined with annotation data to generate precise instructions."
                }),
                "model": (available_models, {
                    "default": default_model,
                    "tooltip": "Select a TextGen WebUI model. The list is fetched in real-time from the TextGen WebUI service."
                }),
                "auto_unload_model": ("BOOLEAN", {
                    "default": False,
                    "tooltip": "Automatically unload the model after generation to free up memory. Keep unchecked to maintain the model loaded throughout the session."
                }),
                "editing_intent": ([
                    "product_showcase",      # Product showcase optimization
                    "portrait_enhancement",  # Portrait enhancement
                    "creative_design",       # Creative design
                    "architectural_photo",   # Architectural photography
                    "food_styling",          # Food photography
                    "fashion_retail",        # Fashion retail
                    "landscape_nature",      # Landscape nature
                    "professional_editing",  # Professional image editing
                    "general_editing",       # General editing
                    "custom"                 # Custom
                ], {
                    "default": "general_editing",
                    "tooltip": "Select your editing intent: What type of result do you want to achieve? The AI will automatically choose the best technical approach based on your intent."
                }),
                "processing_style": ([
                    "auto_smart",           # Smart automatic
                    "efficient_fast",       # Efficient and fast
                    "creative_artistic",    # Creative artistic
                    "precise_technical",    # Precise technical
                    "custom_guidance"       # Custom guidance
                ], {
                    "default": "auto_smart",
                    "tooltip": "Select the AI processing style: auto_smart will intelligently choose the best approach, others provide specific processing styles."
                }),
            },
            "optional": {
                "image": ("IMAGE", {
                    "tooltip": "Optional: Image for visual analysis (only for multimodal models)."
                }),
                "url": ("STRING", {
                    "default": "http://127.0.0.1:5000",
                    "tooltip": "TextGen WebUI service address."
                }),
                "temperature": ("FLOAT", {
                    "default": 0.7,
                    "min": 0.1,
                    "max": 1.0,
                    "step": 0.1,
                    "tooltip": "Controls creativity. Higher values mean more creative responses."
                }),
                "seed": ("INT", {
                    "default": 42,
                    "min": 0,
                    "max": 2**32 - 1,
                    "tooltip": "Seed for controlling randomness. Use the same seed for reproducible results."
                }),
                "enable_visual_analysis": ("BOOLEAN", {
                    "default": False,
                    "tooltip": "Enable visual analysis (only effective for multimodal models that support vision)."
                }),
                "load_saved_guidance": (["none"] + guidance_manager.list_guidance(), {
                    "default": "none",
                    "tooltip": "Load previously saved custom guidance (used when processing_style is 'custom_guidance')."
                }),
                "save_guidance": ("BOOLEAN", {
                    "default": False, 
                    "tooltip": "Enable to save the current custom guidance text to a file."
                }),
                "guidance_name": ("STRING", {
                    "default": "My Guidance",
                    "tooltip": "The name of the file to save the guidance to."
                }),
                "custom_guidance": ("STRING", {
                    "multiline": True,
                    "default": "",
                    "placeholder": default_placeholder,
                    "tooltip": "Enter custom AI guidance instructions (used when processing_style is 'custom_guidance')."
                }),
            }
        }
    
    @classmethod
    def VALIDATE_INPUTS(cls, **kwargs):
        """Validates input parameters"""
        model = kwargs.get('model', '')
        url = kwargs.get('url', 'http://127.0.0.1:7860')
        
        # If model is empty, try to get available models and use the first one
        if not model or model == '':
            available_models = cls.get_available_models(url=url)
            if available_models:
                # Return True to indicate validation passed, ComfyUI will use the default value
                return True
        
        # Check if the model is in the available list, try the cached list first
        available_models = cls.get_available_models(url=url, force_refresh=False)
        if model not in available_models and model not in ["No models found - Start TextGen WebUI service", "Error getting models - Check TextGen WebUI"]:
            # If the model is not in the cache, force a refresh once
            available_models = cls.get_available_models(url=url, force_refresh=True)
            if model not in available_models:
                # Don't return an error, let the user know but still proceed
                return True
        
        return True
    
    RETURN_TYPES = ("STRING", "STRING")
    RETURN_NAMES = (
        "flux_edit_instructions",  # Editing instructions in Flux Kontext format
        "system_prompt",           # The complete system prompt sent to the model
    )
    
    FUNCTION = "enhance_flux_instructions"
    CATEGORY = "kontext_super_prompt/ai_enhanced"
    DESCRIPTION = "🤖 Kontext Super Prompt TextGen WebUI Enhancer - Generates optimized structured editing instructions via Text Generation WebUI models"
    
    def __init__(self):
        # Initialize cache and logs
        self.cache = {}
        self.max_cache_size = 50
        self.debug_logs = []
        self.start_time = None

    def enhance_flux_instructions(self, layer_info: str, edit_description: str, model: str, 
                                auto_unload_model: bool, editing_intent: str, processing_style: str,
                                image=None, url: str = "http://127.0.0.1:5000", 
                                temperature: float = 0.7, seed: int = 42,
                                enable_visual_analysis: bool = False,
                                load_saved_guidance: str = "none", save_guidance: bool = False,
                                guidance_name: str = "My Guidance", custom_guidance: str = ""):
        
        debug_mode = True 
        self.start_time = time.time()
        self._log_debug("🚀 [TextGen WebUI Enhancer] Starting enhancement process...", debug_mode)
        
        # Enable verbose logging during actual workflow execution
        self.__class__._silent_mode = False
        
        if not (edit_description and edit_description.strip()) and not (layer_info and layer_info.strip()):
            error_msg = "Error: You must provide either an edit description or connect valid annotation data."
            self._log_debug(f"❌ {error_msg}", debug_mode)
            return self._create_fallback_output(error_msg, debug_mode)

        if not self._check_textgen_service(url):
            error_msg = f"Error: Cannot connect to TextGen WebUI service at {url}. Please ensure TextGen WebUI is running with --api flag."
            self._log_debug(f"❌ {error_msg}", debug_mode)
            return self._create_fallback_output(error_msg, debug_mode)

        # Use intelligent mapping logic (reuse from Ollama enhancer)
        edit_instruction_type, guidance_style, guidance_template = self._map_intent_to_guidance(
            editing_intent, processing_style
        )
        
        self._log_debug(f"🎯 Intent mapping: {editing_intent} + {processing_style} -> {edit_instruction_type}, {guidance_style}, {guidance_template}", debug_mode)

        # Parse annotation data
        annotations = []
        parsed_data = {}
        has_annotations = False

        if layer_info and layer_info.strip():
            try:
                parsed_json = json.loads(layer_info)
                if isinstance(parsed_json, dict) and 'annotations' in parsed_json and len(parsed_json['annotations']) > 0:
                    self._log_debug("  -> Path: Annotation-based Generation", debug_mode)
                    annotations, parsed_data = self._parse_layer_info(layer_info, debug_mode)
                    has_annotations = True
                else:
                    self._log_debug("  -> Path: Text-only Generation (annotations list is empty or not a valid dict structure)", debug_mode)
            except json.JSONDecodeError:
                self._log_debug("⚠️ Annotation data is not valid JSON, proceeding as text-only.", debug_mode)
        else:
            self._log_debug("  -> Path: Text-only Generation (no annotation data provided)", debug_mode)

        # Build system and user prompts
        system_prompt = self._build_intelligent_system_prompt(
            editing_intent, processing_style, edit_description, layer_info,
            guidance_style, guidance_template, custom_guidance
        )
        
        user_prompt = self._build_user_prompt(annotations, parsed_data, edit_description, debug_mode=debug_mode)
        
        self._log_debug(f"   - System Prompt: {system_prompt[:150]}...", debug_mode)
        self._log_debug(f"   - User Prompt: {user_prompt[:150]}...", debug_mode)

        try:
            # Generate cache key
            cache_key = self._get_cache_key(
                layer_info, edit_description, edit_instruction_type, model, temperature,
                guidance_style, guidance_template, seed, custom_guidance, load_saved_guidance
            )
            
            # Check cache
            if cache_key in self.cache:
                self._log_debug(f"✅ Cache hit for key: {cache_key[:50]}...", debug_mode)
                cached_result = self.cache[cache_key]
                return (cached_result, system_prompt)

            # Generate enhanced instructions
            enhanced_instructions = self._generate_with_textgen_webui(
                url, model, system_prompt, user_prompt, temperature, seed,
                enable_visual_analysis, image, debug_mode
            )
            
            if enhanced_instructions:
                # Clean and format output
                cleaned_instructions = self._clean_natural_language_output(enhanced_instructions)
                
                # Cache result
                self.cache[cache_key] = cleaned_instructions
                self._manage_cache()
                self._log_debug("✅ Enhancement successful. Result cached.", debug_mode)
                
                return (cleaned_instructions, system_prompt)
            else:
                error_msg = "The TextGen WebUI model did not return a valid result."
                return self._create_fallback_output(error_msg, debug_mode)
            
        except Exception as e:
            error_msg = f"An unknown error occurred during the enhancement process: {e}"
            self._log_debug(f"💥 {error_msg}\n{traceback.format_exc()}", debug_mode)
            return self._create_fallback_output(error_msg, debug_mode)
    
    def _check_textgen_service(self, url: str) -> bool:
        """Check if TextGen WebUI service is available"""
        try:
            if not REQUESTS_AVAILABLE:
                return False
            
            # Try OpenAI API first
            response = requests.get(f"{url}/v1/models", timeout=5)
            if response.status_code == 200:
                return True
            
            # Try native API as fallback
            response = requests.get(f"{url}/api/v1/model", timeout=5)
            if response.status_code == 200:
                return True
            
            return False
        except Exception as e:
            return False
    
    def _map_intent_to_guidance(self, editing_intent: str, processing_style: str) -> tuple:
        """Map editing intent and processing style to technical parameters"""
        
        # Reuse the mapping logic from Ollama enhancer
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
        
        style_guidance_map = {
            "auto_smart": "efficient_concise",
            "efficient_fast": "efficient_concise",
            "creative_artistic": "natural_creative", 
            "precise_technical": "technical_precise",
            "custom_guidance": "custom"
        }
        
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
        
        # Smart auto-selection logic
        if processing_style == "auto_smart":
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

    def _build_intelligent_system_prompt(self, editing_intent: str, processing_style: str, 
                                       edit_description: str, layer_info: str = "",
                                       guidance_style: str = "efficient_concise", guidance_template: str = "none",
                                       custom_guidance: str = "") -> str:
        """Build intelligent system prompt using English templates for TextGen WebUI"""
        # For TextGen WebUI, use English guidance templates directly
        # Skip the Chinese intelligent_prompt_analyzer to ensure all prompts are in English
        try:
            system_prompt = guidance_manager.build_system_prompt(
                guidance_style=guidance_style,
                guidance_template=guidance_template,
                custom_guidance=custom_guidance,
                load_saved_guidance="none",
                language="english"  # Force English output
            )
            # Add extra English enforcement
            system_prompt = "ENGLISH OUTPUT ONLY. " + system_prompt + "\n\nREMEMBER: Output in English only. No Chinese or other languages."
            return system_prompt
        except Exception as e:
            return self._english_fallback_prompt(editing_intent, processing_style)
    
    def _english_fallback_prompt(self, editing_intent: str, processing_style: str) -> str:
        """English fallback prompt for TextGen WebUI"""
        base_prompt = """You are an ENGLISH-ONLY image editing AI assistant.

CRITICAL: Output in ENGLISH ONLY. Never use Chinese, Japanese, or any other language.

## Core Mission
- Generate clear, actionable ENGLISH editing commands
- Use simple, unambiguous ENGLISH language
- ALL output must be in proper English
- Create instructions optimized for Flux Kontext

## Communication Style
1. **Direct Commands**: "make", "remove", "replace", "add"
2. **Clear References**: "the red rectangular area (annotation 1)"
3. **Essential Quality**: "with good quality", "seamlessly", "naturally"
4. **Consistent Format**: Predictable instruction structure

## Output Guidelines
- Single operation: "[Action] [area] [target] [basic_quality]"
- Multiple operations: "[Action1]; [Action2]; [Action3]"
- Always include annotation references
- Keep instructions concise but complete

## Quality Standards
- Natural and realistic results
- Seamless integration
- High quality execution
- Professional appearance"""

        # Add specific guidance based on editing intent
        intent_additions = {
            "product_showcase": "\n\n## Product Focus\n- Maintain product authenticity\n- Professional lighting and color\n- Commercial-grade quality\n- Brand consistency",
            "portrait_enhancement": "\n\n## Portrait Focus\n- Natural skin tones\n- Preserve facial features\n- Soft, flattering lighting\n- Authentic expression",
            "creative_design": "\n\n## Creative Focus\n- Artistic expression\n- Bold color usage\n- Visual impact\n- Creative composition",
            "professional_editing": "\n\n## Professional Focus\n- Technical precision\n- Color accuracy\n- High standards\n- Professional workflow"
        }
        
        return base_prompt + intent_additions.get(editing_intent, "")
    
    def _fallback_system_prompt(self, guidance_style: str, guidance_template: str, custom_guidance: str) -> str:
        """Fallback system prompt (using guidance manager)"""
        try:
            system_prompt = guidance_manager.build_system_prompt(
                guidance_style=guidance_style,
                guidance_template=guidance_template,
                custom_guidance=custom_guidance,
                load_saved_guidance="none"
            )
            return system_prompt
        except Exception as e:
            return "You are a professional image editing AI assistant. Please generate precise editing instructions based on user requirements."

    def _parse_layer_info(self, layer_info: str, debug_mode: bool) -> Tuple[List[Dict], Dict]:
        """Parse annotation data from frontend"""
        try:
            if not layer_info or not layer_info.strip():
                self._log_debug("⚠️ Annotation data is empty", debug_mode)
                return [], {}
            
            parsed_data = json.loads(layer_info)
            self._log_debug(f"📊 Annotation data parsed successfully, data type: {type(parsed_data)}", debug_mode)
            
            # Extract annotations
            annotations = []
            if isinstance(parsed_data, dict):
                if "annotations" in parsed_data:
                    annotations = parsed_data["annotations"]
                elif "layers_data" in parsed_data:
                    annotations = parsed_data["layers_data"]
            elif isinstance(parsed_data, list):
                annotations = parsed_data
            
            self._log_debug(f"📍 Extracted {len(annotations)} annotations", debug_mode)
            return annotations, parsed_data
            
        except json.JSONDecodeError as e:
            self._log_debug(f"❌ JSON parsing failed: {e}", debug_mode)
            return [], {}
        except Exception as e:
            self._log_debug(f"❌ Annotation data parsing exception: {e}", debug_mode)
            return [], {}

    def _build_user_prompt(self, annotations: List[Dict], parsed_data: Dict,
                          edit_description: str = "", debug_mode: bool = False) -> str:
        """Build user prompt for TextGen WebUI"""
        self._log_debug("  -> Building user prompt...", debug_mode)

        # If has annotation data, use natural language description
        if annotations:
            natural_language_description = self._build_natural_language_prompt(annotations, parsed_data, edit_description, debug_mode=debug_mode)
            self._log_debug(f"     - Built natural language description from annotations.", debug_mode)
            return natural_language_description
        
        # If only edit description, use it directly
        elif edit_description and edit_description.strip():
            self._log_debug(f"     - Using direct edit description as prompt.", debug_mode)
            return f"The user wants to edit an image. Their instruction is: '{edit_description}'. Please generate a FLUX-compatible prompt based on this instruction."
        
        # Fallback case
        self._log_debug("     - Warning: No valid input for user prompt.", debug_mode)
        return "Please describe the desired edit."

    def _build_natural_language_prompt(self, annotations: List[Dict], parsed_data: Dict, edit_description: str = "", debug_mode: bool = False) -> str:
        """Build natural language user prompt based on annotations and text description"""
        self._log_debug("  -> Building natural language part of the prompt...", debug_mode)
        
        prompt_parts = []
        
        # 1. User editing intent (most important)
        if edit_description and edit_description.strip():
            prompt_parts.append(f"User request: {edit_description.strip()}")
        
        # 2. Simplified annotation information (without numbers)
        if annotations:
            prompt_parts.append("\nImage annotations:")
            for annotation in annotations:
                # Describe by color and type without annotation numbers
                color = annotation.get('color', '#000000')
                annotation_type = annotation.get('type', 'rectangle')
                
                # Convert color hex to color name if possible
                color_name = self._get_color_name(color)
                
                # Create spatial description
                if 'start' in annotation and 'end' in annotation:
                    start = annotation['start']
                    end = annotation['end']
                    width = abs(end.get('x', 0) - start.get('x', 0))
                    height = abs(end.get('y', 0) - start.get('y', 0))
                    
                    if width > height:
                        area_desc = f"{color_name} horizontal {annotation_type} area"
                    elif height > width:
                        area_desc = f"{color_name} vertical {annotation_type} area"
                    else:
                        area_desc = f"{color_name} {annotation_type} area"
                else:
                    area_desc = f"{color_name} {annotation_type} area"
                
                prompt_parts.append(f"- {area_desc}")
        
        # 3. Generation instructions
        prompt_parts.append("\nGenerate a clean, natural language editing instruction.")
        prompt_parts.append("Focus on the core editing action using color and spatial descriptions.")
        prompt_parts.append("Do not include annotation numbers, technical details, or structured formatting.")
        
        return "\n".join(prompt_parts)
    
    def _get_color_name(self, hex_color: str) -> str:
        """Convert hex color to color name"""
        color_map = {
            '#ff0000': 'red', '#ff4444': 'red', '#cc0000': 'red',
            '#00ff00': 'green', '#44ff44': 'green', '#00cc00': 'green',
            '#0000ff': 'blue', '#4444ff': 'blue', '#0000cc': 'blue',
            '#ffff00': 'yellow', '#ffff44': 'yellow', '#cccc00': 'yellow',
            '#ff00ff': 'magenta', '#ff44ff': 'magenta', '#cc00cc': 'magenta',
            '#00ffff': 'cyan', '#44ffff': 'cyan', '#00cccc': 'cyan',
            '#ffa500': 'orange', '#ff8800': 'orange', '#cc6600': 'orange',
            '#800080': 'purple', '#9966cc': 'purple', '#663399': 'purple',
            '#000000': 'black', '#333333': 'dark gray', '#666666': 'gray',
            '#999999': 'light gray', '#cccccc': 'light gray', '#ffffff': 'white'
        }
        
        # Try exact match first
        if hex_color.lower() in color_map:
            return color_map[hex_color.lower()]
        
        # For other colors, try to guess based on RGB values
        try:
            if hex_color.startswith('#'):
                hex_color = hex_color[1:]
            if len(hex_color) == 6:
                r = int(hex_color[0:2], 16)
                g = int(hex_color[2:4], 16) 
                b = int(hex_color[4:6], 16)
                
                # Simple color detection
                if r > 200 and g < 100 and b < 100:
                    return 'red'
                elif r < 100 and g > 200 and b < 100:
                    return 'green'
                elif r < 100 and g < 100 and b > 200:
                    return 'blue'
                elif r > 200 and g > 200 and b < 100:
                    return 'yellow'
                elif r > 200 and g < 100 and b > 200:
                    return 'magenta'
                elif r < 100 and g > 200 and b > 200:
                    return 'cyan'
                elif r > 200 and g > 150 and b < 100:
                    return 'orange'
                elif r > 150 and g < 100 and b > 150:
                    return 'purple'
                elif r < 100 and g < 100 and b < 100:
                    return 'dark'
                elif r > 200 and g > 200 and b > 200:
                    return 'light'
                else:
                    return 'colored'
        except:
            pass
        
        return 'colored'

    def _generate_with_textgen_webui(self, url: str, model: str, system_prompt: str,
                                   user_prompt: str, temperature: float, seed: int,
                                   enable_visual_analysis: bool, image=None,
                                   debug_mode: bool = False) -> Optional[str]:
        """Generate with TextGen WebUI using OpenAI-compatible API"""
        try:
            if not REQUESTS_AVAILABLE:
                self._log_debug("❌ Requests library not available", debug_mode)
                return None
            
            self._log_debug(f"🤖 Calling TextGen WebUI model: {model} (OpenAI API)", debug_mode)
            
            # Prepare generation parameters with fixed defaults
            generation_params = {
                "temperature": temperature,
                "max_tokens": 500,  # Fixed default
                "top_p": 0.9,       # Fixed default
                "frequency_penalty": 0.1,  # Fixed default (converted from repetition_penalty=1.1)
            }
            
            # Add seed if specified (default changed from -1 to 0 for positive seed)
            if seed != 0:
                generation_params["seed"] = seed
            
            # Build messages for chat completion
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ]
            
            # Add image if visual analysis is enabled and image is provided
            if enable_visual_analysis and image is not None:
                self._log_debug("🖼️ Visual analysis requested but not yet implemented", debug_mode)
            
            # Prepare request payload
            payload = {
                "model": model,
                "messages": messages,
                **generation_params
            }
            
            # Send request to TextGen WebUI OpenAI API
            
            try:
                response = requests.post(
                    f"{url}/v1/chat/completions",
                    json=payload,
                    timeout=300  # 5 minutes timeout
                )
            except requests.exceptions.Timeout:
                return self._generate_with_simplified_prompt(url, model, system_prompt, user_prompt, generation_params, debug_mode)
            
            if response.status_code == 200:
                try:
                    result = response.json()
                    self._log_debug(f"🔍 TextGen WebUI API response: {str(result)[:200]}...", debug_mode)
                except json.JSONDecodeError as e:
                    return None
                
                # Extract generated text from OpenAI format response
                if result and 'choices' in result and len(result['choices']) > 0:
                    choice = result['choices'][0]
                    if 'message' in choice and 'content' in choice['message']:
                        generated_text = choice['message']['content'].strip()
                        self._log_debug("✅ OpenAI API response parsed successfully", debug_mode)
                        return generated_text
                    else:
                        self._log_debug(f"❌ OpenAI API response format error: {result}", debug_mode)
                        return None
                else:
                    self._log_debug(f"❌ OpenAI API response missing 'choices' field: {result}", debug_mode)
                    return None
            else:
                error_msg = f"TextGen WebUI API request failed - Status: {response.status_code}, Response: {response.text[:200]}"
                self._log_debug(f"❌ {error_msg}", debug_mode)
                return None
                
        except Exception as e:
            error_msg = f"TextGen WebUI generation exception: {str(e)}"
            # print(f"Error: {error_msg}")
            self._log_debug(f"❌ {error_msg}", debug_mode)
            return None

    def _generate_with_simplified_prompt(self, url: str, model: str, system_prompt: str, 
                                       user_prompt: str, generation_params: dict, 
                                       debug_mode: bool) -> Optional[str]:
        """Generate with simplified prompt when timeout occurs"""
        try:
            # Simplify system prompt
            simplified_system = "You are an AI assistant that creates image editing instructions. Be concise and direct."
            
            # Simplify user prompt - only keep core content
            user_lines = user_prompt.split('\n')
            simplified_user = '\n'.join(user_lines[:10])  # Keep only first 10 lines
            if len(user_lines) > 10:
                simplified_user += "\n[Content truncated for faster processing]"
            
            
            # Build simplified payload
            payload = {
                "model": model,
                "messages": [
                    {"role": "system", "content": simplified_system},
                    {"role": "user", "content": simplified_user}
                ],
                **generation_params,
                "max_tokens": min(generation_params.get("max_tokens", 500), 200)  # Reduce max tokens
            }
            
            # Use shorter timeout
            response = requests.post(f"{url}/v1/chat/completions", json=payload, timeout=60)
            
            if response.status_code == 200:
                result = response.json()
                
                if result and 'choices' in result and len(result['choices']) > 0:
                    choice = result['choices'][0]
                    if 'message' in choice and 'content' in choice['message']:
                        generated_text = choice['message']['content'].strip()
                        return generated_text
                
            return None
            
        except Exception as e:
            return None

    def _clean_natural_language_output(self, instructions: str) -> str:
        """Clean natural language output to remove technical details and annotation numbers"""
        try:
            import re
            
            instructions = re.sub(r'\(annotation\s+\d+\)', '', instructions, flags=re.IGNORECASE)
            instructions = re.sub(r'annotation\s+\d+:?', '', instructions, flags=re.IGNORECASE)
            
            lines = instructions.split('\n')
            cleaned_lines = []
            skip_section = False
            
            for line in lines:
                line = line.strip()
                
                # Skip technical instruction sections
                if line.startswith('**Instruction:**') or line.startswith('**Instructions:**'):
                    skip_section = True
                    continue
                elif line.startswith('**') and skip_section:
                    # End of instruction section
                    skip_section = False
                    continue
                elif skip_section and (line.startswith('-') or line.startswith('*') or 'Apply' in line or 'Ensure' in line or 'Maintain' in line):
                    # Skip technical instruction items
                    continue
                elif skip_section and not line:
                    # Skip empty lines in instruction sections
                    continue
                else:
                    skip_section = False
                
                # Keep non-technical content
                if line and not skip_section:
                    # Additional cleanup
                    if not (line.startswith('- Apply') or line.startswith('- Ensure') or line.startswith('- Maintain')):
                        cleaned_lines.append(line)
            
            # Join and clean up spacing
            result = ' '.join(cleaned_lines)
            
            result = re.sub(r'\s+', ' ', result).strip()
            
            return result if result else instructions
            
        except Exception as e:
            # If cleaning fails, return original
            return instructions

    def _get_cache_key(self, layer_info: str, edit_description: str, 
                      edit_instruction_type: str, model: str, temperature: float,
                      guidance_style: str, guidance_template: str, seed: int,
                      custom_guidance: str = "", load_saved_guidance: str = "none") -> str:
        """Generate cache key including all parameters"""
        import hashlib
        content = f"{layer_info}|{edit_description}|{edit_instruction_type}|{model}|{temperature}|{guidance_style}|{guidance_template}|{seed}|{custom_guidance}|{load_saved_guidance}"
        return hashlib.md5(content.encode()).hexdigest()
    
    def _manage_cache(self):
        """Manage cache size"""
        if len(self.cache) > self.max_cache_size:
            oldest_key = min(self.cache.keys(), key=lambda k: self.cache[k] if isinstance(self.cache[k], str) else 0)
            del self.cache[oldest_key]

    def _log_debug(self, message: str, debug_mode: bool):
        """Records debug information"""
        if debug_mode:
            timestamp = datetime.now().strftime("%H:%M:%S.%f")[:-3]
            log_message = f"[{timestamp}] {message}"
            self.debug_logs.append(log_message)
            print(log_message)
    
    def _create_fallback_output(self, error_msg: str, debug_mode: bool) -> Tuple[str, str]:
        """Creates fallback output when errors occur"""
        self._log_debug(f"❌ Creating fallback output: {error_msg}", debug_mode)
        
        fallback_instructions = f"""[EDIT_OPERATIONS]
operation_1: Apply standard edit to marked regions

[SPATIAL_CONSTRAINTS]
preserve_regions: ["all_unmarked_areas"]
blend_boundaries: "seamless"

[QUALITY_CONTROLS]
detail_level: "standard"
consistency: "maintain_original"
"""
        
        fallback_system_prompt = f"Error occurred during processing: {error_msg}"
        
        return (fallback_instructions, fallback_system_prompt)


# Add API endpoint for dynamic model fetching
if WEB_AVAILABLE:
    @PromptServer.instance.routes.post("/textgen_webui_enhancer/get_models")
    async def get_textgen_models_endpoint(request):
        """Get available TextGen WebUI models - cloud environment compatible"""
        try:
            data = await request.json()
            url = data.get("url", "http://127.0.0.1:7860")
            
            
            # Special handling for cloud environments
            if "127.0.0.1" in url or "localhost" in url:
                print(f"[INFO] Cloud environment detected, using local URL: {url}")
            
            # Use the same model detection logic as main node
            model_names = TextGenWebUIFluxKontextEnhancer.get_available_models(url=url, force_refresh=True, silent=False)
            
            if model_names:
                print(f"[OK] Found {len(model_names)} models")
            else:
                print(f"[WARN] No models found")
            
            return web.json_response(model_names)
            
        except Exception as e:
            import traceback
            error_details = traceback.format_exc()
            
            # Return error info to frontend
            return web.json_response({
                "error": str(e),
                "details": error_details,
                "models": []
            }, status=500)


# Node registration
NODE_CLASS_MAPPINGS = {
    "TextGenWebUIFluxKontextEnhancer": TextGenWebUIFluxKontextEnhancer
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "TextGenWebUIFluxKontextEnhancer": "TextGen WebUI FLUX Kontext Enhancer"
}