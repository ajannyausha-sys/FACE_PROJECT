# pyre-ignore-all-errors
import cv2 # type: ignore
import numpy as np # type: ignore

def validate_frame(frame):
    """
    Performs basic quality checks on the incoming camera frame.
    Returns (is_valid, message)
    """
    if frame is None:
        return False, "Empty frame"

    # 1. Brightness Check
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    avg_brightness = np.mean(gray)
    
    if avg_brightness < 15:
        return False, "Too dark"
    
    # 2. Blur Check (Laplacian variance)
    # High variance = sharp, Low variance = blurry
    laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
    if laplacian_var < 4:
        return False, "Too blurry"

    return True, "OK"
