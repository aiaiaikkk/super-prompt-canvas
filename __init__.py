"""
Kontext Visual Prompt Window - ComfyUI Custom Nodes
Intelligent Visual Prompt Builder - ComfyUI Custom Node Package

Version: 1.2.1
Author: Kontext Team
Repository: https://github.com/aiaiaikkk/kontext-super-prompt
License: MIT
"""

import importlib.util
import os
import sys

# Version information
__version__ = "1.2.1"
__author__ = "Kontext Team"
__description__ = "Intelligent Visual Prompt Builder for Flux Kontext"

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
        
        name = os.path.splitext(file)[0]
        try:
            imported_module = importlib.import_module(f".nodes.{name}", __name__)
            if hasattr(imported_module, 'NODE_CLASS_MAPPINGS'):
                NODE_CLASS_MAPPINGS.update(imported_module.NODE_CLASS_MAPPINGS)
            if hasattr(imported_module, 'NODE_DISPLAY_NAME_MAPPINGS'):
                NODE_DISPLAY_NAME_MAPPINGS.update(imported_module.NODE_DISPLAY_NAME_MAPPINGS)
        except Exception:
            pass

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"]