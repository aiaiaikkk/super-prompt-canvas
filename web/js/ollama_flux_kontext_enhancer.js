import { app } from "/scripts/app.js";
import { api } from "/scripts/api.js";

app.registerExtension({
    name: "KontextSuperPrompt.OllamaEnhancer.Widgets",
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name === "OllamaFluxKontextEnhancerV2") {
            const onConstructed = nodeType.prototype.onConstructed;
            nodeType.prototype.onConstructed = function () {
                const result = onConstructed?.apply(this, arguments);

                // Find the relevant widgets
                const customGuidanceWidget = this.widgets.find(w => w.name === "custom_guidance");
                const saveGuidanceWidget = this.widgets.find(w => w.name === "save_guidance");
                const guidanceNameWidget = this.widgets.find(w => w.name === "guidance_name");
                const loadGuidanceWidget = this.widgets.find(w => w.name === "load_saved_guidance");
                
                if (!saveGuidanceWidget || !guidanceNameWidget || !loadGuidanceWidget) {
                    console.error("Required widgets for save functionality not found!");
                    return result;
                }

                // Initially hide the original widgets
                saveGuidanceWidget.hidden = true;
                guidanceNameWidget.hidden = true;

                // Create a container for the custom save UI
                const saveContainer = document.createElement("div");
                saveContainer.className = "kontext-save-guidance-container";
                
                // Create the text input for the guidance name
                const nameInput = document.createElement("input");
                nameInput.type = "text";
                nameInput.placeholder = "Enter guidance name...";
                nameInput.className = "kontext-guidance-name-input";
                nameInput.value = guidanceNameWidget.value;
                nameInput.addEventListener("change", () => {
                    guidanceNameWidget.value = nameInput.value;
                });

                // Create the save button
                const saveButton = document.createElement("button");
                saveButton.textContent = "Save Guidance";
                saveButton.className = "kontext-save-guidance-button";
                saveButton.addEventListener("click", () => {
                    // 1. Set the boolean widget to true
                    saveGuidanceWidget.value = true;
                    
                    // 2. Inform the user
                    alert(`Guidance "${guidanceNameWidget.value}" will be saved on next queue.`);
                    
                    // 3. Optional: Add visual feedback
                    saveButton.textContent = "Will Save!";
                    setTimeout(() => {
                        saveButton.textContent = "Save Guidance";
                        // Reset the trigger after a short delay
                        saveGuidanceWidget.value = false; 
                    }, 2000);
                });
                
                // Add new elements to the container
                saveContainer.appendChild(nameInput);
                saveContainer.appendChild(saveButton);

                // Add the custom container to the node's widgets
                // This is a bit of a hack, we're adding a DOM element to the litegraph properties
                const customWidget = this.addDOMWidget("save_guidance_ui", "save_guidance_ui", saveContainer, {
                    getValue() { return this.value; },
                    setValue(v) { this.value = v; }
                });
                customWidget.computeSize = function(size) {
                    // A simple fixed size, adjust as needed
                    return [size[0], 40];
                }

                // When the node is serialized, ensure our widget values are up to date
                const onSerialize = this.onSerialize;
                this.onSerialize = function(o) {
                    onSerialize?.apply(this, arguments);
                    o.widgets_values[this.widgets.findIndex(w => w.name === "guidance_name")] = guidanceNameWidget.value;
                };

                return result;
            };
        }
    },
}); 