// load & visualize test scene
var image = ee.Image('LANDSAT/LE07/C01/T1_SR/LE07_023039_20000604');
Map.addLayer(image, {min: 0, max: 2000, bands: ['B3', 'B2', 'B1']},
             'L7 Surface Reflectance');

// define array of Tasseled Cap coefficients
var coefficients = ee.Array([
  [0.3037, 0.2793, 0.4743, 0.5585, 0.5082, 0.1863],
  [-0.2848, -0.2435, -0.5436, 0.7243, 0.0840, -0.1800],
  [0.1509, 0.1973, 0.3279, 0.3406, -0.7112, -0.4572],
  [-0.8242, 0.0849, 0.4392, -0.0580, 0.2012, -0.2768],
  [-0.3280, 0.0549, 0.1075, 0.1855, -0.4357, 0.8085],
  [0.1084, -0.9022, 0.4120, 0.0573, -0.0251, 0.0238]
]);

var tc = function(image){
  var scene = image.select(['B1', 'B2', 'B3', 'B4', 'B5', 'B7'])//.copyProperties(['id', 'system:time_start:'])
  var arrayImage1D = scene.toArray(); // Make an Array Image, with a 1-D Array per pixel.
  var arrayImage2D = arrayImage1D.toArray(1); // Make an Array Image with a 2-D Array per pixel, 6x1.
  var componentsImage = ee.Image(coefficients) // Do a matrix multiplication: 6x6 times 6x1.
    .matrixMultiply(arrayImage2D)
    .arrayProject([0])// Get rid of the extra dimensions.
    .arrayFlatten([['brightness', 'greenness', 'wetness', 'fourth', 'fifth', 'sixth']])
    .copyProperties(image/*['id','system:time_start' ,'CLOUD_COVER']*/); // Pulls all 'ordinary' metadata from original image to output
  return componentsImage
}

// visualization variables
var vizParams = {
  bands: ['brightness', 'greenness', 'wetness'],
  min: -0.1, max: [0.5, 0.1, 0.1]};
  
var mask = image.select('pixel_qa').bitwiseAnd(2).neq(0);
var clearImage = image.mask(mask);
var scene = clearImage.select(['B1', 'B2', 'B3', 'B4', 'B5', 'B7'])//.copyProperties(['id', 'system:time_start:'])
var arrayImage1D = scene.toArray(); // Make an Array Image, with a 1-D Array per pixel.
var arrayImage2D = arrayImage1D.toArray(1); // Make an Array Image with a 2-D Array per pixel, 6x1.
var componentsImage = ee.Image(coefficients) // Do a matrix multiplication: 6x6 times 6x1.
  .matrixMultiply(arrayImage2D)
  .arrayProject([0])// Get rid of the extra dimensions.
  .arrayFlatten([['brightness', 'greenness', 'wetness', 'fourth', 'fifth', 'sixth']])
  // uncomment next line for optional transfer of metadata properties
  //.copyProperties(image/*['id','system:time_start' ,'CLOUD_COVER']*/); // Pulls all 'ordinary' metadata from original image to output
