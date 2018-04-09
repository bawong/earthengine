/* This script was written by Brian Wong on 12/31/2017 to adopt the Tasseled Cap (TC)
Transformation for Landsat-7 Surface Reflecance in GEE. TC coefficents are found in:

Crist, E. P., and R. C. Cicone. “A Physically-Based Transformation of Thematic Mapper 
Data—The TM Tasseled Cap.” IEEE Transactions on Geoscience and Remote Sensing, vol. 
GE-22, no. 3, May 1984, pp. 256–63. IEEE Xplore, doi:10.1109/TGRS.1984.350619.

Additionally, a simple TC example from GEE can be found in following link, however, no
existing & readily available function existed, hence this script.

Tasseled-Cap example for single image: https://developers.google.com/earth-engine/arrays_array_images

GEE link for this script: https://code.earthengine.google.com/4f4597313c868a15f17e072dbf2fb7eb
GitHub: https://github.com/brianadrianwong/earthengine/blob/master/gee_tasseled_cap_function.js
*/
 
// load & visualize test scene
var image = ee.Image('LANDSAT/LE07/C01/T1_SR/LE07_017035_20000610');
Map.addLayer(image, {min: 0, max: 2000, bands: ['B3', 'B2', 'B1']},
             'L7 Surface Reflectance');
Map.centerObject(image, 9)

// define pre-processing function: landsat pixel_qa band cloud masking function
var cloudMask = function(image){
  var mask = image.select('pixel_qa').bitwiseAnd(2).neq(0)
  var clearImage = image.mask(mask).copyProperties(image)
  return clearImage
}

// now to the actual purpose of this script:
// Tasseled Cap for Landsat-7 Surface Reflectance
// first, define array of Tasseled Cap coefficients
var coefficients = ee.Array([
  [0.3037, 0.2793, 0.4743, 0.5585, 0.5082, 0.1863],
  [-0.2848, -0.2435, -0.5436, 0.7243, 0.0840, -0.1800],
  [0.1509, 0.1973, 0.3279, 0.3406, -0.7112, -0.4572],
  [-0.8242, 0.0849, 0.4392, -0.0580, 0.2012, -0.2768],
  [-0.3280, 0.0549, 0.1075, 0.1855, -0.4357, 0.8085],
  [0.1084, -0.9022, 0.4120, 0.0573, -0.0251, 0.0238]
]);

// next, make the Tasseled Cap function
var tc = function(image){
  var scene = image.select(['B1', 'B2', 'B3', 'B4', 'B5', 'B7'])
  var arrayImage1D = scene.toArray(); // make array image, with a 1-D Array per pixel
  var arrayImage2D = arrayImage1D.toArray(1); // same but w/ 2-D array per pixel, 6x1
  var componentsImage = ee.Image(coefficients) // matrix multiplication: 6x6 times 6x1
    .matrixMultiply(arrayImage2D)
    .arrayProject([0]) // getting rid of the extra dimensions
    .arrayFlatten([['brightness', 'greenness', 'wetness', 'fourth', 'fifth', 'sixth']])
    .copyProperties(image); // pulls all 'ordinary' metadata from original image to output
  return componentsImage
}

// before mapping our functions, here's a quick workaround to turn our
// image into an image collection so that we can apply to function. fyi
// it works even w/ only 1 image.
var imageCollection = ee.ImageCollection.fromImages([image])

// now let's apply our functions
var tcImage = imageCollection
  .map(cloudMask)
  .map(tc)

// confirm all metadata transferred along w/ new 6 tc bands
print(tcImage)

// lastly, let's visualize our results
// define tasselled cap visualization parameters
var vizParams = {
  bands: ['brightness', 'greenness', 'wetness'],
  min: -1700, max: [5000, 4000, 4000]};
Map.addLayer(tcImage, vizParams, 'tasseled cap image')