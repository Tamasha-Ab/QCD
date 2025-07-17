import * as tf from '@tensorflow/tfjs';
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

// For __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let model;

async function loadModel() {
  if (!model) {
    model = await tf.loadGraphModel(
      `file://${path.resolve(__dirname, "../model/model.json")}`
    );
    console.log("Model loaded");
  }
  return model;
}

async function preprocessImage(imageBuffer) {
  const image = await sharp(imageBuffer)
    .resize(224, 224)  // adjust size per your model's expected input
    .toFormat('png')
    .toBuffer();

  const tensor = tf.node.decodeImage(image, 3)
    .expandDims(0)
    .toFloat()
    .div(tf.scalar(255));

  return tensor;
}

async function detectDefect(imageBuffer) {
  await loadModel();
  const inputTensor = await preprocessImage(imageBuffer);
  const predictions = await model.executeAsync(inputTensor);

  // Adjust this part depending on your model's output structure
  const scores = predictions[1].arraySync();
  const classes = predictions[0].arraySync();

  const maxIndex = scores[0].indexOf(Math.max(...scores[0]));
  const confidence = scores[0][maxIndex];
  const defectClass = classes[0][maxIndex];

  const defectLabels = ["No Defect", "Scratch", "Dent", "Crack"];
  const defectType = defectLabels[defectClass] || "Unknown";

  tf.dispose(predictions);
  tf.dispose(inputTensor);

  return { confidence, defectType };
}

export { detectDefect };
