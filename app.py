from flask import Flask, request, jsonify, render_template  # Added render_template
from flask_cors import CORS
from tensorflow.keras.models import load_model
#from tensorflow.keras.models import Sequential
#from tensorflow.keras.layers import Conv2D, Dense, BatchNormalization, Activation, Dropout, MaxPooling2D, Flatten
#from tensorflow.keras import regularizers
#import tensorflow as tf
import numpy as np
import cv2
import base64

app = Flask(__name__)  # It should be __name__, not name
CORS(app)
# Load the pre-trained model
model = load_model('./ferNet.h5')

# Load weight
#model.load_weights('./fernet_bestweight.h5')


# Load Haar Cascade for face detection
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

def preprocess_image(image, target_size):
    # Ensure image has at least 3 dimensions (handling grayscale or images with alpha channel)
    if len(image.shape) == 2:  # Grayscale image
        image = np.stack((image,)*3, axis=-1)  # Convert to 3 channel grayscale
    elif image.shape[2] == 4:  # Image with alpha channel
        image = cv2.cvtColor(image, cv2.COLOR_BGRA2BGR)

    image = cv2.resize(image, target_size)  # Resize image
    image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)  # Convert to grayscale here to ensure consistency
    image = np.expand_dims(image, axis=-1)
    image = np.expand_dims(image, axis=0)
    return image

def detect_face(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)  # Convert to grayscale
    faces = face_cascade.detectMultiScale(gray, 1.3, 5)  # Detect faces
    if len(faces) == 0:
        return None
    # Use the first detected face (x, y, width, height)
    x, y, w, h = faces[0]
    face = gray[y:y+h, x:x+w]
    return face

@app.route("/")
def home():
    return "Welcome to the Facial Emotion Recognition App!"

@app.route("/app")
def app_page():
    return render_template("./index.html")

@app.route("/predict", methods=["POST"])
def predict():
    message = request.get_json(force=True)
    encoded = message['image']
    decoded = base64.b64decode(encoded)
    image = np.frombuffer(decoded, dtype=np.uint8)
    image = cv2.imdecode(image, flags=1)
    
    face = detect_face(image)  # Detect face in the image
    if face is not None:
        processed_image = preprocess_image(face, target_size=(48, 48))
    else:
        return jsonify({'error': 'No face detected'}), 400  # Handle case where no face is detected

    prediction = model.predict(processed_image).tolist()

    response = {
        'prediction': {
            'angry': prediction[0][0],
            'disgust': prediction[0][1],
            'fear': prediction[0][2],
            'happy': prediction[0][3],
            'neutral': prediction[0][4],
            'sad': prediction[0][5],
            'surprise': prediction[0][6]
        }
    }
    return jsonify(response)

if __name__ == "__main__":  # It should be __name__, not name
    app.run(debug=True)