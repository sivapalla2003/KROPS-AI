# 🌾 KROPS AI - The Vernacular Crop Doctor

KROPS AI is an AI-powered prototype designed to bridge the gap between rural farmers and expert agricultural advice. By combining vision AI with vernacular language support, it provides instant, actionable solutions to crop diseases.

## ✨ Features
* **📸 Visual Diagnosis:** Upload images of diseased crops for instant identification using Gemini 2.0 Flash.
* **🗣️ Audio Support:** Farmers can describe problems verbally (Voice-to-Text) and hear results read aloud (Text-to-Speech).
* **🌍 Multi-language (Bhashini):** Full support for Hindi, Telugu, Tamil, Marathi, and Kannada.
* **📄 PDF Prescriptions:** Generates a downloadable treatment plan including pesticide names, exact dosages, and safety tips in the local language.
* **🍃 Nature-Tech UI:** A mobile-responsive design with 3D effects for an immersive user experience.

## 🛠️ Tech Stack
* **Core AI:** Google Gemini 2.0 Flash (Vision & Reasoning)
* **Language Engine:** Bhashini API Integration (Vernacular Support)
* **Backend:** Python Flask
* **Frontend:** Tailwind CSS, Three.js (3D effects), Web Speech API
* **Deployment:** Docker & Google Cloud Run

## 🚀 How it Works
1. **Upload:** Farmer uploads a photo of the affected crop.
2. **Describe:** Farmer speaks or types the issue in their native language.
3. **Analyze:** Gemini identifies the pest and calculates the exact dosage of pesticide needed based on crop type and area.
4. **Solve:** Results are displayed, read aloud, and available for download as a PDF.