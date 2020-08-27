/**
 * @license
 * Copyright 2019 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

import 'bulma/css/bulma.css';

import {load} from '@tensorflow-models/deeplab';
import * as tf from '@tensorflow/tfjs-core';

import ade20kExampleImage from './examples/ade20k.jpg';
import cityscapesExampleImage from './examples/cityscapes.jpg';
import pascalExampleImage from './examples/pascal.jpg';

const modelNames = ['pascal', 'cityscapes', 'ade20k'];
const deeplab = {};
const state = {};
var dictRgbLabel = {};
//default pre-trained database
var globalBase = 'pascal';

const deeplabExampleImages = {
  pascal: pascalExampleImage,
  cityscapes: cityscapesExampleImage,
  ade20k: ade20kExampleImage,
};

const toggleInvisible = (elementId, force = undefined) => {
  const outputContainer = document.getElementById(elementId);
  outputContainer.classList.toggle('is-invisible', force);
};
//asynchronous function for running deeplab faster
const runModel = async (base) => {
  await tf.nextFrame();
  await runDeeplab(base);
};

const initializeModels = async () => {
  modelNames.forEach((base) => {
    const selector = document.getElementById('quantizationBytes');
    const quantizationBytes =
        Number(selector.options[selector.selectedIndex].text);
    state.quantizationBytes = quantizationBytes;
    deeplab[base] = load({base, quantizationBytes});
    const toggler = document.getElementById(`toggle-${base}-image`);
    //waiting for click scrape first image
    toggler.onclick = () => fetchImage();
    autoSegment(); //running segmentation automatically
    const runner = document.getElementById(`run-${base}`);
    //waits for user to choose type of pre-trained weights and run model
    runner.onclick = () => {
      toggleInvisible('output-card', true);
      toggleInvisible('legend-card', true);
      runModel(base);
      globalBase = base;
    };
  });
  //user upload their desired picture for segmentation
  const uploader = document.getElementById('upload-image');
  uploader.addEventListener('change', processImages);
  status('Initialised models, waiting for input...');
};

//display image on the HTML
const setImage = (src) => {
  toggleInvisible('output-card', true);
  toggleInvisible('legend-card', true);
  const image = document.getElementById('input-image');
  image.src = src;
  toggleInvisible('input-card', false);
  status('Waiting until the model is picked...');
};

const processImage = (file) => {
  if (!file.type.match('image.*')) {
    return;
  }
  const reader = new FileReader();
  reader.onload = (event) => {
    setImage(event.target.result);
  };
  reader.readAsDataURL(file);
};

const processImages = (event) => {
  const files = event.target.files;
  Array.from(files).forEach(processImage);
};

//Read click location on object relative to offsetParent element
function getElementPosition(obj) {
  var curleft = 0, curtop = 0;
  if (obj.offsetParent) {
      do {
          curleft += obj.offsetLeft;
          curtop += obj.offsetTop;
      } while (obj = obj.offsetParent);
      return { x: curleft, y: curtop };
  }
  return undefined;
}

// calculate click location on image
function getEventLocation(element,event){
  var pos = getElementPosition(element);
  
  return {
    x: (event.pageX - pos.x),
      y: (event.pageY - pos.y)
  };
}

// extract RGB of clicked location and searches for clicked label
const autoSegment = () => {
  $('#output-image').click(function(e){
    var eventLocation = getEventLocation(this,e);
    var canvas = this.getContext('2d');
    var pixelData = canvas.getImageData(eventLocation.x, eventLocation.y, 1, 1).data; 
    var rgb = [ pixelData[0], pixelData[1], pixelData[2] ];
    findLabel(rgb);
  });
}

//find label based on RGB from map of RGB values to labels 
// and fetch image based on label
const findLabel = (rgbVal) => {
  const labelName = dictRgbLabel[rgbVal];
  fetchImage(labelName);
};

//script to scrape JSON from Flicker API and display one image randomly
//limit is 20 calls per request
const fetchImage = (keyword) => {
  let display;
  var flickerAPI = "http://api.flickr.com/services/feeds/photos_public.gne?jsoncallback=?";
  $.getJSON(flickerAPI, {
      tags: keyword,
      tagmode: "any",
      format: "json"
  }).done(function (result, status, xhr) {
      display = result.items[Math.floor(Math.random() * result.items.length)].media.m;
      toggleInvisible('output-card', true);
      toggleInvisible('legend-card', true);
      const image = document.getElementById('input-image');
      image.src = display;
      image.crossOrigin = 'anonymous';
      runModel(globalBase);
      toggleInvisible('input-card', false);
  }).fail(function (xhr, status, error) {
      alert("Result: " + status + " " + error + " " + xhr.status + " " + xhr.statusText)
  });
};

//function to display segmentation of input image
const displaySegmentationMap = (modelName, deeplabOutput) => {
  const {legend, height, width, segmentationMap} = deeplabOutput;
  const canvas = document.getElementById('output-image');
  const ctx = canvas.getContext('2d');
  toggleInvisible('output-card', false);
  //display segmentation results on canvas
  const segmentationMapData = new ImageData(segmentationMap, width, height);
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.width = width;
  canvas.height = height;
  ctx.putImageData(segmentationMapData, 0, 0);

  const legendList = document.getElementById('legend');
  while (legendList.firstChild) {
    legendList.removeChild(legendList.firstChild);
  }
  //create legend for detected labels
  Object.keys(legend).forEach((label) => {
    const tag = document.createElement('span');
    tag.innerHTML = label;
    var labelColor = legend[label]; //store map of RGB values to labels
    const [red, green, blue] = labelColor;
    dictRgbLabel[labelColor] = label;
    tag.classList.add('column');
    tag.style.backgroundColor = `rgb(${red}, ${green}, ${blue})`;
    tag.style.padding = '1em';
    tag.style.margin = '1em';
    tag.style.color = '#ffffff';

    legendList.appendChild(tag);
  });
  toggleInvisible('legend-card', false);


  const inputContainer = document.getElementById('input-card');
  inputContainer.scrollIntoView({behavior: 'smooth', block: 'nearest'});
};

const status = (message) => {
  const statusMessage = document.getElementById('status-message');
  statusMessage.innerText = message;
  console.log(message);
};

//Run segmentation on the input based on selected weights
const runPrediction = (modelName, input, initialisationStart) => {
  deeplab[modelName].then((model) => {
    model.segment(input).then((output) => {
      displaySegmentationMap(modelName, output);
      status(`Ran in ${
        ((performance.now() - initialisationStart) / 1000).toFixed(2)} s`);
    });
  });
};

//asynchronous function to load DeepLab  
const runDeeplab = async (modelName) => {
  status(`Running the inference...`);
  //determines the quality of segmentation
  const selector = document.getElementById('quantizationBytes');
  const quantizationBytes =
      Number(selector.options[selector.selectedIndex].text);
  if (state.quantizationBytes !== quantizationBytes) {
    for (const base of modelNames) {
      if (deeplab[base]) {
        (await deeplab[base]).dispose();
        deeplab[base] = undefined;
      }
    };
    state.quantizationBytes = quantizationBytes;
  }
  const input = document.getElementById('input-image');
  if (!input.src || !input.src.length || input.src.length === 0) {
    status('Failed! Please load an image first.');
    return;
  }
  toggleInvisible('input-card', false);

  if (!deeplab[modelName]) {
    status('Loading the model...');
    const loadingStart = performance.now();
    deeplab[modelName] = load({base: modelName, quantizationBytes});
    await deeplab[modelName];
    status(`Loaded the model in ${
      ((performance.now() - loadingStart) / 1000).toFixed(2)} s`);
  }
  const predictionStart = performance.now();
  if (input.complete && input.naturalHeight !== 0) {
    runPrediction(modelName, input, predictionStart);
  } else {
    input.onload = () => {
      runPrediction(modelName, input, predictionStart);
    };
  }
};

window.onload = initializeModels;
