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
var savej = [];
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
    toggler.onclick = () => findonlineImage();
    readSegmentation();
    const runner = document.getElementById(`run-${base}`);
    runner.onclick = () => {
      toggleInvisible('output-card', true);
      toggleInvisible('legend-card', true);
      runModel(base);
      globalBase = base;
      toggleInvisible('input-card', false);
    }
  });
  const uploader = document.getElementById('upload-image');
  uploader.addEventListener('change', processImages);
  status('Initialised models, waiting for input...');
};

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

function getEventLocation(element,event){
  var pos = getElementPosition(element);
  
  return {
    x: (event.pageX - pos.x),
      y: (event.pageY - pos.y)
  };
}

// const pixelData = () => {
//   var canvas = document.getElementById('output-image');
//   canvas.addEventListener('click', printMousePos, true);
//   function printMousePos(e){
//     var eventLocation = getEventLocation(this,e);
//     var context = this.getContext('2d');
//     console.log(eventLocation);
//     var pixelData = context.getImageData(eventLocation.x, eventLocation.y, 1, 1).data; 
//     var rgb = [ pixelData[0], pixelData[1], pixelData[2] ];
//     console.log(rgb);
//     //window.alert(rgb);
//     findLabel(rgb);
//     //$( "#test" ).text( "pageX: " + cursorX +",pageY: " + cursorY );
//   }
// }

// const pixelData = () => {
//   $('#output-image').click(function(e){
//     var eventLocation = getEventLocation(this,e);
//     var canvas = this.getContext('2d');
//     console.log(eventLocation);
//     var pixelData = canvas.getImageData(eventLocation.x, eventLocation.y, 1, 1).data; 
//     var rgb = [ pixelData[0], pixelData[1], pixelData[2] ];
//     console.log(rgb);
//     //window.alert(rgb);
//     findLabel(rgb);
//     //$( "#test" ).text( "pageX: " + cursorX +",pageY: " + cursorY );
//   });
// }

function getPixel(imgData, index) {
  var i = index*4, d = imgData.data;
  return [d[i],d[i+1],d[i+2],d[i+3]] // returns array [R,G,B,A]
}

// AND/OR

function getPixelXY(imgData, x, y) {
  return getPixel(imgData, y*imgData.width+x);
}

const readSegmentation = () => {
  $('#output-image').click(function(e){
    var eventLocation = getEventLocation(this,e);
    var canvas = this.getContext('2d');
    console.log(eventLocation);
    var imageData = canvas.getImageData(0, 0, $('#output-image').width(), $('#output-image').height()); 
    var pixelData = getPixelXY(imageData,eventLocation.x, eventLocation.y); 
    console.log(pixelData);
    //console.log(pixelData.data[eventLocation.x,eventLocation.y]);
    var rgb = [ pixelData[0], pixelData[1], pixelData[2] ];
    console.log(rgb);
    //window.alert(rgb);
    findLabel(rgb);
    //$( "#test" ).text( "pageX: " + cursorX +",pageY: " + cursorY );
  });
}

const findLabel = (rgbVal) => {
  
  // window.alert('hi');
  // window.alert(rgbVal);
  const labelName = dictRgbLabel[rgbVal];
  console.log(labelName);
  findonlineImage(labelName);
  // window.alert(labelName);
};



const findonlineImage = (keyword) => {
  let display;
  var flickerAPI = "http://api.flickr.com/services/feeds/photos_public.gne?jsoncallback=?";
  $.getJSON(flickerAPI, {
      tags: keyword,
      tagmode: "any",
      format: "json"
  }).done(function (result, status, xhr) {
      display = result.items[Math.floor(Math.random() * result.items.length)].media.m;
      // $.each(result.items, function (i, item) {
      //     savej.push(item.media.m);
      //     if (i === 20) {
      //         return false;
      //     }
      // });
      toggleInvisible('output-card', true);
      toggleInvisible('legend-card', true);
      const image = document.getElementById('input-image');
      image.src = display;
      image.crossOrigin = 'anonymous';
      runModel(globalBase);
      toggleInvisible('input-card', false);
      //savej = [];
  }).fail(function (xhr, status, error) {
      alert("Result: " + status + " " + error + " " + xhr.status + " " + xhr.statusText)
  });
  // var flickerAPI = "https://api.flickr.com/services/feeds/photos_public.gne?format=json&tags=" + keyword;
  // $.ajax({
  //   url: flickerAPI,
  //   dataType: "jsonp", // jsonp
  //   jsonpCallback: 'jsonFlickrFeed', // add this property
  //   success: function (result, status, xhr) {
  //       $.each(result.items, function (i, item) {
  //           savej.push(item.media.m);
  //           if (i === 20) {
  //               return false;
  //           }
  //       });
  //   },
  //   error: function (xhr, status, error) {
  //       console.log(xhr)
  //       alert("Result: " + status + " " + error + " " + xhr.status + " " + xhr.statusText)
  //   }
  // });
  
};

const displaySegmentationMap = (modelName, deeplabOutput) => {
  
  const {legend, height, width, segmentationMap} = deeplabOutput;
  const canvas = document.getElementById('output-image');
  const ctx = canvas.getContext('2d');
  toggleInvisible('output-card', false);
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
  
  Object.keys(legend).forEach((label) => {
    const tag = document.createElement('span');
    tag.innerHTML = label;
    var labelColor = legend[label]; 
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
  console.log(dictRgbLabel);

  const inputContainer = document.getElementById('input-card');
  inputContainer.scrollIntoView({behavior: 'smooth', block: 'nearest'});
};


const status = (message) => {
  const statusMessage = document.getElementById('status-message');
  statusMessage.innerText = message;
  console.log(message);
};

const runPrediction = (modelName, input, initialisationStart) => {
  

  deeplab[modelName].then((model) => {
    console.log('bug2');
    console.log(input);
    model.segment(input).then((output) => {
      console.log('bug3');
      displaySegmentationMap(modelName, output);
      status(`Ran in ${
        ((performance.now() - initialisationStart) / 1000).toFixed(2)} s`);
    });
  });
};

const runDeeplab = async (modelName) => {
  status(`Running the inference...`);
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
  //console.log(input);
  console.log('beforeload');
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
    console.log('bug1');
    runPrediction(modelName, input, predictionStart);
  } else {
    input.onload = () => {
      runPrediction(modelName, input, predictionStart);
    };
  }
};

window.onload = initializeModels;
