"""
Kontext Visual Prompt Window - ComfyUI Custom Nodes
Intelligent Visual Prompt Builder - ComfyUI Custom Node Package

Version: 1.2.0
Author: Kontext Team
Repository: https://github.com/aiaiaikkk/kontext-super-prompt
License: MIT

This is an intelligent visual prompt builder designed for Flux Kontext models,
providing advanced image editing, visual annotation recognition, and structured prompt generation features.
"""

import os
import sys
import importlib
import importlib.util
from pathlib import Path

# Add current directory to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

# Version information
__version__ = "1.2.0"
__author__ = "Kontext Team"
__description__ = "Intelligent Visual Prompt Builder for Flux Kontext"

# Initialize node mappings
NODE_CLASS_MAPPINGS = {}
NODE_DISPLAY_NAME_MAPPINGS = {}

print(f"🚀 Loading {__description__} v{__version__}...")

# Try importing nodes from multiple locations
def try_import_from_paths():
    """Try importing nodes from different paths"""
    
    # Core node file paths (simplified structure)
    possible_paths = [
        # Method 1: Import from nodes folder (primary path)
        Path(current_dir) / "nodes",
        
        # Method 2: Import from current directory (fallback)
        Path(current_dir),
    ]
    
    loaded_count = 0
    
    # Try importing core nodes
    for path in possible_paths:
        if not path.exists():
            continue
            
        print(f"📁 Checking path: {path}")
        
        # Find core node files (5 functional nodes - with Ollama, API, and TextGen WebUI integration)
        node_files = [
            "visual_prompt_editor.py",           # Unified visual prompt editor (CORE)
            "annotation_data_node.py",           # Annotation data provider
            "ollama_flux_kontext_enhancer.py",   # Ollama智能增强节点 (LOCAL)
            "API_flux_kontext_enhancer.py",      # API智能增强节点 (DeepSeek/Qianwen/OpenAI)
            "textgen_webui_flux_kontext_enhancer.py", # TextGen WebUI智能增强节点 (LOCAL ADVANCED)
            # Removed nodes - moved to disabled_nodes/
            # - global_image_processor.py      # Global image processing (REMOVED)
            # - intelligent_annotation_node.py  # Complex intelligent annotation
            # - layer_to_mask_node.py          # Layer to mask conversion
        ]
        
        for node_file in node_files:
            node_path = path / node_file
            if node_path.exists():
                try:
                    # Dynamic module import
                    spec = importlib.util.spec_from_file_location(
                        node_file[:-3],  # Remove .py suffix
                        node_path
                    )
                    module = importlib.util.module_from_spec(spec)
                    sys.modules[node_file[:-3]] = module
                    spec.loader.exec_module(module)
                    
                    # Get node mappings
                    if hasattr(module, 'NODE_CLASS_MAPPINGS'):
                        NODE_CLASS_MAPPINGS.update(module.NODE_CLASS_MAPPINGS)
                        
                    if hasattr(module, 'NODE_DISPLAY_NAME_MAPPINGS'):
                        NODE_DISPLAY_NAME_MAPPINGS.update(module.NODE_DISPLAY_NAME_MAPPINGS)
                        
                    loaded_count += len(getattr(module, 'NODE_CLASS_MAPPINGS', {}))
                    print(f"✅ Loaded {node_file}: {len(getattr(module, 'NODE_CLASS_MAPPINGS', {}))} nodes")
                    
                except Exception as e:
                    print(f"⚠️  Failed to load {node_file}: {e}")
                    continue
    
    return loaded_count

# Create basic nodes if none found
def create_basic_nodes():
    """Create basic nodes as fallback"""
    global NODE_CLASS_MAPPINGS, NODE_DISPLAY_NAME_MAPPINGS
    
    print("📦 Creating basic fallback nodes...")
    
    try:
        import torch
        
        class CLIPTextEncodeFlux:
            @classmethod
            def INPUT_TYPES(cls):
                return {
                    "required": {
                        "text": ("STRING", {"multiline": True, "default": "a beautiful image, high quality, detailed"}),
                        "clip": ("CLIP",),
                    },
                    "optional": {
                        "guidance": ("FLOAT", {"default": 7.5, "min": 0.0, "max": 20.0, "step": 0.1}),
                    }
                }
            
            RETURN_TYPES = ("CONDITIONING",)
            FUNCTION = "encode"
            CATEGORY = "kontext/basic"
            
            def encode(self, text, clip, guidance=7.5):
                tokens = clip.tokenize(text)
                cond, pooled = clip.encode_from_tokens(tokens, return_pooled=True)
                return ([[cond, {"pooled_output": pooled, "guidance": guidance}]],)
        
        class KontextPromptAnalyzer:
            @classmethod
            def INPUT_TYPES(cls):
                return {
                    "required": {
                        "text": ("STRING", {"multiline": True, "default": ""}),
                    }
                }
            
            RETURN_TYPES = ("STRING", "FLOAT")
            RETURN_NAMES = ("analysis", "quality_score")
            FUNCTION = "analyze"
            CATEGORY = "kontext/basic"
            
            def analyze(self, text):
                word_count = len(text.split())
                quality = min(word_count / 10.0, 1.0)
                analysis = f"Word count: {word_count}, Quality score: {quality:.2f}"
                return (analysis, quality)
        
        # Add core basic nodes (keep only essential functions)
        basic_nodes = {
            "CLIPTextEncodeFlux": CLIPTextEncodeFlux,
        }
        
        basic_names = {
            "CLIPTextEncodeFlux": "🎯 CLIP Text Encode (Flux Kontext)",
        }
        
        NODE_CLASS_MAPPINGS.update(basic_nodes)
        NODE_DISPLAY_NAME_MAPPINGS.update(basic_names)
        
        return len(basic_nodes)
        
    except ImportError:
        print("⚠️  PyTorch not available, skipping basic nodes")
        return 0

# Execute import
try:
    loaded_count = try_import_from_paths()
    
    # If no nodes loaded, create basic nodes
    if loaded_count == 0:
        loaded_count = create_basic_nodes()
    
    # Final report
    total_nodes = len(NODE_CLASS_MAPPINGS)
    
    if total_nodes > 0:
        print(f"🎉 {__description__} loaded successfully!")
        print(f"📦 Unified nodes available: {total_nodes} (ultimate simplification)")
        print("📋 Unified functionality nodes:")
        for node_name, display_name in NODE_DISPLAY_NAME_MAPPINGS.items():
            print(f"   - {node_name}: {display_name}")
        print("\n🎯 Unified workflow: Annotation → Visual Prompt Editor → Mask Conversion")
    else:
        print("❌ No nodes could be loaded. Please check dependencies and file structure.")
        
except Exception as e:
    print(f"💥 Error during initialization: {e}")
    import traceback
    traceback.print_exc()
    
    # Ensure at least empty mappings to prevent ComfyUI crash
    NODE_CLASS_MAPPINGS = {}
    NODE_DISPLAY_NAME_MAPPINGS = {}

# Web directory setup (for frontend extensions)
WEB_DIRECTORY = "./web"

# Export all required symbols
__all__ = [
    "NODE_CLASS_MAPPINGS",
    "NODE_DISPLAY_NAME_MAPPINGS", 
    "WEB_DIRECTORY",
    "__version__",
    "__author__",
    "__description__"
]

# Print loading completion info
print(f"✨ Kontext Visual Prompt Window v{__version__} initialization complete!")
print(f"🌐 Web extensions directory: {WEB_DIRECTORY}")
print(f"📚 For documentation and examples, visit: https://github.com/aiaiaikkk/kontext-super-prompt")

# Check dependencies and provide suggestions
try:
    import torch
    import numpy as np
    print("✅ Core dependencies (torch, numpy) are available")
except ImportError as e:
    print(f"⚠️  Missing dependencies: {e}")
    print("💡 Install with: pip install torch torchvision numpy pillow")

# Check optional dependencies
optional_deps = {
    "cv2": "opencv-python",
    "PIL": "pillow", 
    "transformers": "transformers",
    "diffusers": "diffusers"
}

available_features = []
missing_features = []

for module_name, package_name in optional_deps.items():
    try:
        __import__(module_name)
        available_features.append(module_name)
    except ImportError:
        missing_features.append(package_name)

if available_features:
    print(f"🎨 Available features: {', '.join(available_features)}")

if missing_features:
    print(f"📦 Optional dependencies for advanced features: {', '.join(missing_features)}")
    print(f"💡 Install with: pip install {' '.join(missing_features)}")

print("=" * 60)

# Web directory setup (ComfyUI standard way)
WEB_DIRECTORY = "./web"

print(f"🌐 Web extensions directory: {WEB_DIRECTORY}")
print("💡 Double-click Visual Prompt Editor node to open unified interface")