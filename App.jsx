import React, { useEffect, useState } from 'react';
import './index.css';

function FacialEmotionRecognition() {
    const [errorMessage, setErrorMessage] = useState('');
    const [predictionResult, setPredictionResult] = useState('Emotion: None');
    const [predictedEmotion, setPredictedEmotion] = useState('None'); // State to hold the highest value emotion

    useEffect(() => {
        const video = document.getElementById('video');

        const setupCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                video.srcObject = stream;
            } catch (error) {
                setErrorMessage('Error accessing the camera: ' + error.message);
            }
        };

        setupCamera();

        const predictEmotion = async () => {
            if (!video.srcObject) {
                setErrorMessage('Camera is not accessible');
                return;
            }

            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);

            const image = canvas.toDataURL('image/jpeg').replace(/^data:image\/[a-z]+;base64,/, "");

            try {
                const response = await fetch('http://127.0.0.1:5000/predict', {
                method: "POST", // Correct method
                body: JSON.stringify({ image: image }),
                headers: {
                    "Content-Type": "application/json; charset=UTF-8"  // Correct header
                    }
                });
                const data = await response.json();
                // Case if face error is detected
                // Checking for an error message from the backend
                if (data.error) {
                  setErrorMessage(data.error); // Set the error message to state
                  setPredictedEmotion('Emotion: None');
                }
                setErrorMessage(data.error);
                setPredictionResult('Emotion: ' + JSON.stringify(data.prediction));

                // Assuming 'data.prediction' contains your emotions and their values
                let highestEmotion = '';
                let highestValue = "0.000000"; // starting comparison value

                for (let emotion in data.prediction) {
                  // Extracting the number's leading significant figures up to 6 decimal places, ignoring the exponent
                  let significantFigures = data.prediction[emotion].toString().split('e')[0];
                  let valueAsString = Number.parseFloat(significantFigures).toPrecision(6);

                  // Padding the number with zeroes if necessary to ensure it has exactly 6 decimal places for direct string comparison
                  let paddedValue = valueAsString.indexOf('.') === -1 ? valueAsString + ".000000" : valueAsString;
                  paddedValue = paddedValue + "000000"; // add excess zeroes
                  paddedValue = paddedValue.substring(0, paddedValue.indexOf('.') + 7); // ensure it's exactly 6 decimal places

                  // Direct string comparison based on the significant figures as strings
                  if (paddedValue > highestValue) {
                    highestValue = paddedValue;
                    highestEmotion = emotion;
                  }
                }

                // After determining the highest value's emotion, we apply the necessary text transformation
                highestEmotion = highestEmotion.charAt(0).toUpperCase() + highestEmotion.slice(1);

                setPredictedEmotion(highestEmotion);
            } catch (error) {
                setErrorMessage('Error predicting emotion: ' + error.message);
            }
        };

        const intervalId = setInterval(predictEmotion, 2000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <>{/*
    <div class="navbar">
    <div class="left-side">
        <a href="#" class="material-icon"><i class="fab fa-github"></i></a>
    </div>
    <div class="right-side">
        <i class="fa-solid fa-camera-retro"></i>
        <p class="material-text">Major Project</p>
    </div>
    </div>
  */}

    <div class="container">
        <div class="content">
          <div class="header">
            <h1>Realtime Emotion Recognition</h1>
          </div>

          <div class="video-container">
            <video id="video" width="240" height="200" controls muted autoPlay loop></video>
          </div>

          <div class="result">
            <p id="predictionResult">Prediction Result: {predictedEmotion}</p>
          </div>

          <div class="logs">
            <details>
              <summary>View Backend Logs</summary>
              {/*<p>Log 1: Lorem ipsum dolor sit amet</p>
              <p>Log 2: Consectetur adipiscing elit</p>*/}
              {errorMessage && <p>{errorMessage}</p>}
              <p>{predictionResult}</p>
            </details>
          </div>

          <div class="error">
            <p id="errorMessage"></p>
          </div>
          <div class="footer">
            <p>Copyright © 2024 | Made with ❤️ by primalkz</p>
          </div>
        </div>
      </div>
</>
  );
}

export default FacialEmotionRecognition;

