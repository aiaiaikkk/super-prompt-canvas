"""
super-prompt-canvas - ComfyUI Custom Nodes

Version: 1.4.0
Author: aiaiaikkk
Repository: https://github.com/aiaiaikkk/super-prompt-canvas
License: MIT
"""

import importlib.util
import os
import sys

# 核心依赖检查（仅检查必需的依赖）
try:
    import requests
    import numpy
except ImportError as e:
    print(f"[Kontext-Super-Prompt] ❌ 核心依赖缺失: {e}")
    print("[Kontext-Super-Prompt] 💡 请通过ComfyUI Manager重新安装")

# Version information
__version__ = "1.4.0"
__author__ = "aiaiaikkk"
__description__ = "ComfyUI Custom Nodes for Visual Canvas Image Editing with Multi-Model AI Prompt Generation"

NODE_CLASS_MAPPINGS = {}
NODE_DISPLAY_NAME_MAPPINGS = {}
WEB_DIRECTORY = "./web"

def get_ext_dir(subpath=None):
    dir = os.path.dirname(__file__)
    if subpath is not None:
        dir = os.path.join(dir, subpath)
    return os.path.abspath(dir)

# Load nodes from py directory
nodes_dir = get_ext_dir("nodes")
if os.path.exists(nodes_dir):
    files = os.listdir(nodes_dir)
    for file in files:
        if not file.endswith(".py") or file.startswith("__"):
            continue
        # 跳过备份文件和测试文件
        if "backup" in file or "test" in file or file.endswith("_backup.py"):
            continue
        
        name = os.path.splitext(file)[0]
        try:
            # 使用绝对路径导入模块
            spec = importlib.util.spec_from_file_location(name, os.path.join(nodes_dir, file))
            imported_module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(imported_module)
            
            if hasattr(imported_module, 'NODE_CLASS_MAPPINGS'):
                NODE_CLASS_MAPPINGS.update(imported_module.NODE_CLASS_MAPPINGS)
            if hasattr(imported_module, 'NODE_DISPLAY_NAME_MAPPINGS'):
                NODE_DISPLAY_NAME_MAPPINGS.update(imported_module.NODE_DISPLAY_NAME_MAPPINGS)
        except Exception as e:
            print(f"[Kontext-Super-Prompt] Error loading node {name}: {e}")
            import traceback
            traceback.print_exc()

# 输出加载信息
print(f"[Super-Prompt-Canvas] v{__version__} 加载完成")
print(f"[Super-Prompt-Canvas] 已注册节点: {list(NODE_CLASS_MAPPINGS.keys())}")

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"]
