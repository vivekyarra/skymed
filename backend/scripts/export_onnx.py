import os
import torch
import torchvision.models as models
from torchvision.models.mobilenetv3 import MobileNet_V3_Small_Weights
import torch.nn as nn
from onnxruntime.quantization import quantize_dynamic, QuantType

def export_model():
    print("Loading pre-trained MobileNetV3-Small...")
    weights = MobileNet_V3_Small_Weights.DEFAULT
    model = models.mobilenet_v3_small(weights=weights)
    
    # We adapt it for a single output node (severity score 0-25)
    # The original has 1000 classes. We'll replace the classifier.
    num_features = model.classifier[3].in_features
    model.classifier[3] = nn.Linear(num_features, 1)
    
    model.eval()

    # Create dummy input: batch_size=1, channels=3, 224x224
    dummy_input = torch.randn(1, 3, 224, 224)
    
    os.makedirs(os.path.join("..", "models"), exist_ok=True)
    temp_onnx = os.path.join("..", "models", "triage_mobilenet_v3_temp.onnx")
    out_onnx = os.path.join("..", "models", "triage_mobilenet_v3_int8.onnx")

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
        
    print(f"Successfully generated {out_onnx}!")

if __name__ == "__main__":
    export_model()
