import bz2
import os

def decompress_bz2(filepath, output_path):
    print(f"Decompressing {filepath} to {output_path}...")
    with bz2.BZ2File(filepath, 'rb') as f:
        data = f.read()
    with open(output_path, 'wb') as f:
        f.write(data)
    print(f"Done. New size: {os.path.getsize(output_path)} bytes")

if __name__ == "__main__":
    base_dir = r"c:\Users\.MSI\Downloads\FACE_PROJECT-main\FACE_PROJECT-main"
    
    # Decompress resnet model
    resnet_bz2 = os.path.join(base_dir, "dlib_face_recognition_resnet_model_v1.dat.bz2")
    resnet_dat = os.path.join(base_dir, "dlib_face_recognition_resnet_model_v1.dat")
    if os.path.exists(resnet_bz2):
        decompress_bz2(resnet_bz2, resnet_dat)
    
    # Decompress shape predictor
    shape_bz2 = os.path.join(base_dir, "shape_predictor_68_face_landmarks.dat.bz2")
    shape_dat = os.path.join(base_dir, "shape_predictor_68_face_landmarks.dat")
    if os.path.exists(shape_bz2):
        decompress_bz2(shape_bz2, shape_dat)
