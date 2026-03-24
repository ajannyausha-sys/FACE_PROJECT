import urllib.request
import os

def download_file(url, filename):
    print(f"Downloading {url} to {filename}...")
    try:
        urllib.request.urlretrieve(url, filename)
        print(f"Downloaded {filename}. Size: {os.path.getsize(filename)} bytes")
    except Exception as e:
        print(f"Failed to download {url}: {e}")

if __name__ == "__main__":
    base_dir = r"c:\Users\.MSI\Downloads\FACE_PROJECT-main\FACE_PROJECT-main"
    
    models = {
        "http://dlib.net/files/shape_predictor_68_face_landmarks.dat.bz2": "shape_predictor_68_face_landmarks.dat.bz2",
        "http://dlib.net/files/dlib_face_recognition_resnet_model_v1.dat.bz2": "dlib_face_recognition_resnet_model_v1.dat.bz2"
    }
    
    for url, filename in models.items():
        path = os.path.join(base_dir, filename)
        download_file(url, path)
