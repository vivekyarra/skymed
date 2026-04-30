import os
import torch
import torchvision.models as models
from torchvision.models.mobilenetv3 import MobileNet_V3_Small_Weights
import torch.nn as nn
from onnxruntime.quantization import quantize_dynamic, QuantType

def export_model():
    print("Exporting MobileNetV3-Small architecture smoke-test artifact.")
    print("WARNING: this is not a trained wound severity classifier and is not used by the app by default.")
    weights = MobileNet_V3_Small_Weights.DEFAULT
    model = models.mobilenet_v3_small(weights=weights)
    
    # Replace the ImageNet classifier only to verify ONNX plumbing. The new head
    # is untrained, so this artifact must not be presented as a medical model.
    num_features = model.classifier[3].in_features
    model.classifier[3] = nn.Linear(num_features, 1)
    
    model.eval()

    # Create dummy input: batch_size=1, channels=3, 224x224
    dummy_input = torch.randn(1, 3, 224, 224)
    
    os.makedirs(os.path.join("..", "models"), exist_ok=True)
    temp_onnx = os.path.join("..", "models", "triage_mobilenet_v3_temp.onnx")
    out_onnx = os.path.join("..", "models", "triage_mobilenet_v3_smoketest_int8.onnx")

    print(f"Exporting ONNX opset 12 to {temp_onnx}...")
    torch.onnx.export(
        model, 
        dummy_input, 
        temp_onnx, 
        export_params=True, 
        opset_version=12, 
        do_constant_folding=True, 
        input_names=['input'], 
        output_names=['output'], 
        dynamic_axes={'input': {0: 'batch_size'}, 'output': {0: 'batch_size'}}
    )
    
    print(f"Quantizing dynamically to INT8 -> {out_onnx}...")
    quantize_dynamic(
        model_input=temp_onnx,
        model_output=out_onnx,
        weight_type=QuantType.QInt8
    )
    
    # Cleanup temp
    if os.path.exists(temp_onnx):
        os.remove(temp_onnx)
        
    print(f"Successfully generated {out_onnx}.")
    print("Do not rename this to triage_mobilenet_v3_int8.onnx unless it is replaced with a trained, validated artifact.")

if __name__ == "__main__":
    export_model()
