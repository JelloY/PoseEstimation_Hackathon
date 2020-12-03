/********************************************************************************************
* Powered by Tensorflow.js
* Using Open Source         -> ml5.js
* Deep learning             -> Tensorflow.js 
* base model                -> Custom trained Model
********************************************************************************************/

// Top of Body
document.write("<h1>Military_Basic_Pose_Estimation</h1>")
document.write("------------------------------------------------------------------------------------<br>");


// Variables
let video;
let poseNet;
let pose;
let skeleton;
let brain;
let poseLabel = "";
let state = 'waiting';
let targetLabel;
let indicateConfidence = "";

/********************************************************************************************
* Mode Select
* Training Model            -> press t
* save collected data       -> press s
* select capture mode       -> 1 = Attention
*                           -> 2 = At ease
********************************************************************************************/
function keyPressed() 
{
    if (key == 't') 
    {
        brain.normalizeData();
        brain.train({epochs: 50}, finished); 
    } 
    else if (key == 's') 
    {
        brain.saveData();
    } 
    else if((key == '1') || (key == '2'))
    {
        
        if(key == '1')                                  // Attention Data Collecting
        {
            targetLabel = 'Attention';
            console.log(targetLabel);
            setTimeout(function() 
            {
                console.log('collecting');
                state = 'collecting';
                setTimeout(function() 
            {
                console.log('not collecting');
                state = 'waiting';
            }, 2000);
            }, 1000);
        }
        else if(key == '2')                             // At ease Data Collecting
        {
            targetLabel = 'At ease';
            console.log(targetLabel);
            setTimeout(function() 
            {
            console.log('collecting');
            state = 'collecting';
            setTimeout(function() 
            {
                console.log('not collecting');
                state = 'waiting';
            }, 2000);
            }, 1000);
        }
    }
}



function setup() 
{
    createCanvas(640, 480);
    video = createCapture(VIDEO);
    video.hide();
    poseNet = ml5.poseNet(video, modelLoaded);
    poseNet.on('pose', gotPoses);

    let options = 
    {
        inputs: 34,
        outputs: 4,
        task: 'classification',
        debug: true
    }

    brain = ml5.neuralNetwork(options);
    //brain.loadData('military.json', dataReady);
  
   //LOAD PRETRAINED MODEL
    const modelInfo = 
    {
     model: 'trained_model/model.json',
     metadata: 'trained_model/model_meta.json',
     weights: 'trained_model/model.weights.bin',
    };
    brain.load(modelInfo, brainLoaded);


}

/********************************************************************************************
* Data Training Section
********************************************************************************************/
function dataReady() 
{
    brain.normalizeData();
    brain.train({epochs: 50}, finished);
}

function finished() 
{
    console.log('model trained');
    brain.save();
    classifyPose();
}

/********************************************************************************************
* Pose Estimation Section
********************************************************************************************/
function brainLoaded() 
{
    console.log('pose classification ready!');
    classifyPose();
}

function classifyPose() 
{
    if (pose) 
    {
        let inputs = [];
        for (let i = 0; i < pose.keypoints.length; i++) 
        {
            let x = pose.keypoints[i].position.x;
            let y = pose.keypoints[i].position.y;
            inputs.push(x);
            inputs.push(y);
        }
        brain.classify(inputs, gotResult);
    } 
    else 
    {
        setTimeout(classifyPose, 100);
    }
}

// Pose Estimation Section - indicate result on monitor
function gotResult(error, results) 
{  
    if (results[0].confidence > 0.75) 
    {
        poseLabel = results[0].label.toUpperCase();
        indicateConfidence = results[0].confidence;
    }
    classifyPose();
}


/********************************************************************************************
* Real-Time Scaning Section
********************************************************************************************/
function modelLoaded() 
{
    console.log('poseNet ready');
}


function gotPoses(poses) 
{
    // console.log(poses); 
    if (poses.length > 0) 
    {
        pose = poses[0].pose;
        skeleton = poses[0].skeleton;

        if (state == 'collecting') 
        {
            let inputs = [];
            for (let i = 0; i < pose.keypoints.length; i++)
            {
                let x = pose.keypoints[i].position.x;
                let y = pose.keypoints[i].position.y;
                inputs.push(x);
                inputs.push(y);
            }
            let target = [targetLabel];
            brain.addData(inputs, target);
        }
    }
}



/********************************************************************************************
* Screen indicating 
********************************************************************************************/
function draw() {

    push();
    translate(video.width, 0);
    scale(-1, 1);
    image(video, 0, 0, video.width, video.height);

    if (pose) {
        for (let i = 0; i < skeleton.length; i++) 
        {
            let a = skeleton[i][0];
            let b = skeleton[i][1];
            strokeWeight(2);
            stroke(0);

            line(a.position.x, a.position.y, b.position.x, b.position.y);
        }

        for (let i = 0; i < pose.keypoints.length; i++) 
        {
            let x = pose.keypoints[i].position.x;
            let y = pose.keypoints[i].position.y;
            fill(0);
            stroke(255);
            ellipse(x, y, 16, 16);
        }
  }


  // pop message with result
    pop();
    let makePercentage = indicateConfidence * 100;
    let tempt = makePercentage.toFixed(1);
    let value_Indicate = tempt.toString() + "%";

    fill(0, 0, 0);
    noStroke();
    textSize(25);
    textStyle(BOLD);
    textAlign(LEFT);
    text(poseLabel,width / 20, height / 10 );
    textAlign(LEFT, CENTER);
    text(value_Indicate, width / 20, height / 6);
    
    
}

