# Object Object Web Game
### This project is under development

## Intro


This project was inspired by the [PointerPointer](https://pointerpointer.com/) as a fun indifinite clicking game on your browser. Our project uses computer vision segmentation model to show the performence of segmentation on random online images, and also adding a bit fun by letting the user to click on the results and retirive a new random pictures from the internet that is in the same category of the label that was clicked on.

The demo allows you to try out DeepLab V3 semantic segmentation on images from the Flickr database using different pre-trained model based on MobileNet-v2. Three types of pre-trained weights are available, trained on Pascal, Cityscapes and ADE20K datasets.

To get started, load a random example image, and pick the model name from `pascal`, `cityscapes` and `ade20k`, and decide whether you want your model quantized to 1 or 2 bytes (set the quantizationBytes option to 4 if you want to disable quantization). By default, calling load initalizes the PASCAL variant of the model quantized to 2 bytes. You can change the model and the quanitization at any given point by clicking `Run` from any of the provided models, and you can re-load a random image by clicking on `Load an example image`.


## Setup

Install dependencies:

```sh
yarn
```

Launch the development server watching the files for changes.

```sh
yarn watch
```

**Warning**: *Running the Cityscapes model in the demo is resource-intensive and might crash your browser.*  
**Tip**: *For better segmentation use `ade20k` model.*  
**Reference**: [Semantic Segmentation in the Browser: DeepLab v3 Model](https://github.com/tensorflow/tfjs-models/tree/master/deeplab)  
