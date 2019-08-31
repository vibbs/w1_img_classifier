const webcamElement = document.getElementById('webcam');
const classifier = knnClassifier.create();

let net;


// Custom function to upload the image
 function upload_img(input) {
    console.log('Upload Image to classify');
    if (input.files && input.files[0]) {
        var reader = new FileReader();

        reader.onload = function (e) {
            $('#img_file')
                .attr('src', e.target.result)
                .width(224)
                .height(224);
        };

        reader.readAsDataURL(input.files[0]);
      
        // try to predict the image after the image was loaded successfully
        reader.onloadend = function(e){
            predict_image()
        }
        
    }

    
}

// Predict the uploaded image with probablity
async function predict_image(){
    const imgEl = document.getElementById('img_file');
    const result = await net.classify(imgEl);

    document.getElementById('console_2').innerText = `
            prediction: ${result[0].className}\n
            probability: ${result[0].probability}
        `;
}

// Async function to capture the webcam frames
async function setupWebcam() {
    return new Promise((resolve, reject) => {
      const navigatorAny = navigator;
      navigator.getUserMedia = navigator.getUserMedia ||
          navigatorAny.webkitGetUserMedia || navigatorAny.mozGetUserMedia ||
          navigatorAny.msGetUserMedia;
      if (navigator.getUserMedia) {
        navigator.getUserMedia({video: true},
          stream => {
            webcamElement.srcObject = stream;
            webcamElement.addEventListener('loadeddata',  () => resolve(), false);
          },
          error => reject());
      } else {
        reject();
      }
    });
  }

  
// Main app function which is invoked during the load of the webpage
  async function app() {
    console.log('Loading mobilenet..');
  
    // Load the model.
    net = await mobilenet.load();
    console.log('Sucessfully loaded model');
  
    await setupWebcam().then(response => {
        // console.log('then ->',response);
    }).catch(e => {
        // console.log('Error ->', e);
    });
    
    // Reads an image from the webcam and associates it with a specific class
    // index.
    const addExample = classId => {
        // Get the intermediate activation of MobileNet 'conv_preds' and pass that
        // to the KNN classifier.
        const activation = net.infer(webcamElement, 'conv_preds');

        // Pass the intermediate activation to the classifier.
        classifier.addExample(activation, classId);
    };

    // When clicking a button, add an example for that class.
    document.getElementById('class-a').addEventListener('click', () => addExample(0));
    document.getElementById('class-b').addEventListener('click', () => addExample(1));
    document.getElementById('class-c').addEventListener('click', () => addExample(2));

    while (true) {

        if (classifier.getNumClasses() > 0) {
        // Get the activation from mobilenet from the webcam.
        const activation = net.infer(webcamElement, 'conv_preds');
        // Get the most likely class and confidences from the classifier module.
        const result = await classifier.predictClass(activation);
        const classes = ['A', 'B', 'C'];
        document.getElementById('console').innerText = `
            prediction: ${classes[result.classIndex]}\n
            probability: ${result.confidences[result.classIndex]}
        `;
        }

        await tf.nextFrame();
    }
    
  }

  app();