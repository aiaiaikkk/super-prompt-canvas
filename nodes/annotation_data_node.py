"""
Annotation Data Node
A simple node that outputs annotation JSON data for connection to Visual Prompt Editor
"""

import json
from typing import Dict, List, Any, Tuple


class AnnotationDataNode:
    """Annotation Data Node - Outputs JSON annotation data for Visual Prompt Editor"""
    
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {},
            "optional": {
                "json_text": ("STRING", {
                    "multiline": True, 
                    "default": "[]", 
                    "tooltip": "JSON annotation data (paste from frontend editor)"
                }),
            }
        }
    
    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("annotation_data",)
    FUNCTION = "output_annotation_data"
    CATEGORY = "kontext/core"
    DESCRIPTION = "Provides annotation JSON data as input connection for Visual Prompt Editor"
    
    def output_annotation_data(self, json_text: str = "[]"):
        """Output annotation data for connection to Visual Prompt Editor"""
        
        try:
            print(f"🔗 AnnotationDataNode: Received JSON text (length: {len(json_text)})")
            
            # Validate JSON format
            if json_text.strip():
                try:
                    parsed_data = json.loads(json_text)
                    if isinstance(parsed_data, list):
                        print(f"✅ Valid JSON array with {len(parsed_data)} items")
                    else:
                        print(f"⚠️ JSON is not an array, wrapping in array")
                        json_text = json.dumps([parsed_data])
                except json.JSONDecodeError as e:
                    print(f"❌ Invalid JSON format: {e}")
                    print(f"🔧 Using empty array as fallback")
                    json_text = "[]"
            else:
                print(f"ℹ️ Empty JSON text, using empty array")
                json_text = "[]"
            
            return (json_text,)
            
        except Exception as e:
            print(f"❌ AnnotationDataNode error: {e}")
            return ("[]",)


# Node registration
NODE_CLASS_MAPPINGS = {
    "AnnotationDataNode": AnnotationDataNode,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "AnnotationDataNode": "📝 Annotation Data",
}

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS"]