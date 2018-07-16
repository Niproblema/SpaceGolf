/*global Planet*/

// Global variable definitionvar canvas;
var gl;
var shaderProgram;
var runningReference
var canvas;
// Model-view and projection matrix and model-view matrix stack
var mvMatrixStack = [];
var mvMatrix = mat4.create();
var pMatrix = mat4.create();


//window 
var windowHeight; // to niso nastavitve, ne tikat!
var windowWidth;
var CanvasPageSize = 1; //nastavitev za resolucijo,  0.0-1

// Keyboard handling helper variable for reading the status of keys
var currentlyPressedKeys = {};

// Camera
var freecamera = false;
var fov = 60;
var CamXPosition = 0;
var CamYPosition = 0;
var CamZPosition = -400;
var CamPitch = 0;
var CamYaw = 0;
var CamSpeed = 0;
var CamCrossspeed = 0; //Premik po X 
var LockedCamZogicaDistance = 5500;
var AimAboveZogica = 200;
var cameraSpeedBoostMultiplier = 10;
var spacebarKeyCooldown = false;



// Helper variable for animation
var lastTime = 0;

var objects3D = [];

var ozadje;
var zvezda;
var planets = [];

//Zogica
var zogica;
var accelerationMultipler = 6e-6;
var zogicaSpeedX = 0;
var zogicaSpeedY = 0;
var zogicaSpeedZ = 0;
var zogicaForceVec;
var zogicaPremika = false;
var bacStartT, bacEndT; //timer za F gumb
var bacTimer = 0; //Cas F 0-1000ms
var bacAmount = 0; //st nabijanj
var bacActive = false; //F
var bacMultiplier = 1.2;
var speedPoOdboju = -0.8;


 
var koncnalukna;

var UI_casText;
var UI_casTextNode;
var UI_casValue;
var UI_casZacetekValue;

var UI_prviUdarec = true;

var UI_stUdarcevText;
var UI_stUdarcevTextNode;
var UI_stUdarcevValue;

var UI_mocUdarcaText;
var UI_mocUdarcaTextDefBack;
var UI_mocUdarcaTextDefPadd;
var UI_mocUdarcaTextMaxPadd;
var UI_mocUdarcaTextNode;
var UI_mocUdarcaValue;

var UI_helpImage;
var UI_helpShow;
var UI_helpShowLastPressed;
var UI_helpImageNode;
//
var lights = [];
var lightDirections = [];
var lightDiffuses = [];

//
// Matrix utility functions
//
// mvPush   ... push current matrix on matrix stack
// mvPop    ... pop top matrix from stack
// degToRad ... convert degrees to radians
//
function addObject3D(object) {
  objects3D.push(object);
   
  return object;
}

function addPlanet(planet) {
  planets.push(planet);
  return planet;
}

function addPlanet2(nickname, pos, rot, radius, texture, mass) {
  var parent = null;
  var hasP = false;
  if (planets.length > 0) {
    parent = planets[0];
    hasP = true;
  }
 
  var planet = new Planet(nickname, pos, rot, [radius, radius, radius], './assets/3dModeli/planet/planet.json', texture, mass, parent, false);
  planets.push(planet);
  return planet;
}

function addLight(light) {
  lights.push(light);
  var nLightPos = vec3.create(light.position);

  lightDirections.push(nLightPos[0], nLightPos[1], nLightPos[2])
  lightDiffuses.push(light.diffuse[0], light.diffuse[1], light.diffuse[2])
}

function setupUI(){
  UI_casText = document.getElementById("casIgranja");
  UI_casTextNode = document.createTextNode("");
  UI_casText.appendChild(UI_casTextNode);
  
  
  UI_stUdarcevText =document.getElementById("stUdarc");
  UI_stUdarcevTextNode = document.createTextNode("");
  UI_stUdarcevText.appendChild(UI_stUdarcevTextNode);
  UI_stUdarcevValue = 0;
  UI_stUdarcevTextNode.nodeValue = UI_stUdarcevValue;
  
  UI_mocUdarcaText =document.getElementById("mUdarc");
  UI_mocUdarcaTextDefBack =  UI_mocUdarcaText.style.background ;
  UI_mocUdarcaTextDefPadd =  UI_mocUdarcaText.style.paddingLeft ;
  UI_mocUdarcaTextMaxPadd = "200";
  UI_mocUdarcaText.style.paddingLeft = "10px";
  UI_mocUdarcaTextNode = document.createTextNode("");
  UI_mocUdarcaText.appendChild(UI_mocUdarcaTextNode);
  UI_mocUdarcaTextNode.nodeValue = "0%";
  
  
  //pomoč slike
  UI_helpImage = document.getElementById("hImage");
  UI_helpImageNode = document.createElement("img");
  UI_helpImageNode.src = "./assets/Help.png";
  UI_helpImageNode.style.maxHeight = window.innerHeight*0.8;
  UI_helpImageNode.style.maxWidth = window.innerWidth*0.8;
  UI_helpImageNode.style.paddingLeft = UI_helpImageNode.style.maxWidth*0.1;
  
  UI_helpImageNode.style.alignmentBaseline = "central";
  UI_helpImage.appendChild(UI_helpImageNode);
  UI_helpShow = true;
  
  UI_helpShowLastPressed = new Date().getTime();
  
   UI_helpImageNode.style.visibility='hidden';
  document.getElementById("uiOverlay-top").style.visibility='hidden';
  document.getElementById("uiOverlay-right").style.visibility='hidden';
  
}

function updateUI(){
  if(tload == true){
     
    if(UI_prviUdarec == false) UI_casValue = new Date().getTime()  - UI_casZacetekValue;
    else UI_casValue= 0;
    
    UI_casTextNode.nodeValue = (UI_casValue/1000).toFixed(1) +" s";
    UI_stUdarcevTextNode.nodeValue = bacAmount;
    
    UI_mocUdarcaText.style.paddingLeft = (UI_mocUdarcaValue/100 * UI_mocUdarcaTextMaxPadd)+"px";
    if(UI_mocUdarcaValue > 90)UI_mocUdarcaText.style.background = "red";
    else if (UI_mocUdarcaValue > 80)  UI_mocUdarcaText.style.background = "orange";
    else if (UI_mocUdarcaValue > 40)  UI_mocUdarcaText.style.background = "green";
    else if (UI_mocUdarcaValue > 10)  UI_mocUdarcaText.style.background = "#3664d8";
    else {
      UI_mocUdarcaText.style.background = UI_mocUdarcaTextDefBack;
       UI_mocUdarcaText.style.paddingLeft =  UI_mocUdarcaTextDefPadd;
    }
    UI_mocUdarcaTextNode.nodeValue = UI_mocUdarcaValue+"%";
    
    if(UI_helpShow){
      
      UI_helpImageNode.style.maxHeight = window.innerHeight*0.8;
      UI_helpImageNode.style.maxWidth = window.innerWidth*0.8;
      UI_helpImageNode.style.paddingTop = UI_helpImageNode.style.innerHeight*0.3;
    }else{
       
    }
  }
}

function setUpbackground() {
  ozadje = addObject3D(new CustomObject([0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [1000000, 1000000, 1000000], './assets/3dModeli/ozadje/skysphere4.json', './assets/teksture/ozadje/8192x4096.png'))
  ozadje.initObject();

}




function setupPlanets() {
  var R = [];
  var i = 0;
  R[i++] = [40806, -37686, 28633]
  R[i++] = [23000, -5000, -14000]
  R[i++] = [38689, 18957, 13925]
  R[i++] = [-37344, 13333, 11877]
  R[i++] = [23408, 24126, 28559]
  R[i++] = [47469, -25262, 6250]
  R[i++] = [152, 38528, 46057]
  R[i++] = [370, -10401, 14588]
  R[i++] = [-7186, 9470, -33101]
  R[i++] = [42764, 37154, -7497]



  i = 0;
  var init = addPlanet2("prva", R[i++], [0.0, 0.0, 0.0], 100, './assets/teksture/ozadje/8192x4096.png', 6e24 * 1);
  init.initObject();
  addPlanet2("a", R[i++], [13.0, 0.0, 0.0], 900, './assets/teksture/planet/atlasic/ShatabhishaTexture.png', 6e24 * 1);
  addPlanet2("b", R[i++], [0.0, 0.0, 0.0], 3000, './assets/teksture/planet/lava/MagmaTexture.png', 6e24 * 2);
  addPlanet2("c", R[i++], [0.0, 0.0, 0.0], 2000, './assets/teksture/planet/marsovski/MartianTexture.png', 6e24 * 2);
  addPlanet2("d", R[i++], [22.0, 0.0, 19.0], 5000, './assets/teksture/planet/rocky/RockyTexture.png', 6e24 * 4);
  addPlanet2("e", R[i++], [0.0, 0.0, 11.0], 2000, './assets/teksture/planet/aqua/AquaTexture.png', 6e24 * 2);
  addPlanet2("f", R[i++], [0.0, 0.0, 44.0], 2600, './assets/teksture/planet/gravely/GravelyTexture.png', 6e24 * 2);
  addPlanet2("g", R[i++], [0.0, 0.0, 0.0], 1000, './assets/teksture/planet/metalic/MetalicTexture.png', 6e24 * 1);
  addPlanet2("h", R[i++], [63.0, 0.0, -11.0], 2000, './assets/teksture/planet/desert/DesertTexture.png', 6e24 * 2);
  addPlanet2("i", R[i++], [0.0, 0.0, 80.0], 300, './assets/teksture/planet/ice/IceTexture.png', 6e24 * 1);
  for (var i = 1; i < planets.length; i++) {
    planets[i].initObject();
  }

  //sonce
  zvezda = new Planet("zvezda", [90000.0, -200000.00, 0.0], [0, 0, 0], [30000, 30000, 30000], './assets/3dModeli/planet/planet.json', './assets/teksture/planet/sonce/SunTexture.png', 6e24 * 2, null);
  zvezda.initObject();

  //Golf zogica

  zogica = new Planet("zogica", [0, 0, 0], [0.0, 0.0, 0.0], [300, 300, 300], './assets/3dModeli/planet/planet.json', './assets/teksture/zogica/ZogicaTexture.png', 6e24 * 2, null);
  zogica.initObject();

  koncnalukna = new KoncnaLukna([R[5][0] + 25000, R[5][1], R[5][2]+8000], [0.0, -33.0, 0.0], [1500, 2000, 2000], './assets/3dModeli/koncna-lukna/lukna2.json', './assets/teksture/koncna-lukna/KoncanLukna_texture.png');
  koncnalukna.initObject();
};

function setupLights() {

  addLight(new Light(zvezda.position, [1.0, 1.0, 1.0]));
  addLight(new Light([zvezda.position[0], zvezda.position[1] + zvezda.radius * 3, zvezda.position[2]], [1.0, 1.0, 1.0]));
  addLight(new Light([zvezda.position[0], zvezda.position[1], zvezda.position[2] + zvezda.radius * 3], [1.0, 1.0, 1.0]));
  addLight(new Light([zvezda.position[0] - zvezda.radius * 3, zvezda.position[1], zvezda.position[2]], [1.0, 1.0, 1.0]));
  addLight(new Light([zvezda.position[0], zvezda.position[1] - zvezda.radius * 3, zvezda.position[2]], [1.0, 1.0, 1.0]));
  addLight(new Light([zvezda.position[0], zvezda.position[1], zvezda.position[2] - zvezda.radius * 3], [1.0, 1.0, 1.0]));
  addLight(new Light([zvezda.position[0] + zvezda.radius * 3, zvezda.position[1], zvezda.position[2]], [1.0, 1.0, 1.0]));

  //addLight(new Light([2000.0, 0.0, -15.0], [5.0, 5.0, 5.0]));
};




function moveLight(i, dx, dy, dz) {
  lights[i].position[0] += dx;
  lights[i].position[1] += dy;
  lights[i].position[2] += dz;
  lightDirections[i * 3 + 0] += dx;
  lightDirections[i * 3 + 1] += dy;
  lightDirections[i * 3 + 2] += dz;
}

function mvPushMatrix() {
  var copy = mat4.create();
  mat4.set(mvMatrix, copy);
  mvMatrixStack.push(copy);
}

function mvPopMatrix() {
  if (mvMatrixStack.length == 0) {
    throw "Invalid popMatrix!";
  }
  mvMatrix = mvMatrixStack.pop();
}

function degToRad(degrees) {
  return degrees * Math.PI / 180;
}


//
// initGL
//
// Initialize WebGL, returning the GL context or null if
// WebGL isn't available or could not be initialized.
//
function initGL(canvas) {
  var gl = null;
  try {
    // Try to grab the standard context. If it fails, fallback to experimental.
    gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
  }
  catch (e) {}

  // If we don't have a GL context, give up now
  if (!gl) {
    alert("Unable to initialize WebGL. Your browser may not support it.");
  }
  return gl;
}

//
// getShader
//
// Loads a shader program by scouring the current document,
// looking for a script with the specified ID.
//
function getShader(gl, id) {
  var shaderScript = document.getElementById(id);

  // Didn't find an element with the specified ID; abort.
  if (!shaderScript) {
    return null;
  }

  // Walk through the source element's children, building the
  // shader source string.
  var shaderSource = "";
  var currentChild = shaderScript.firstChild;
  while (currentChild) {
    if (currentChild.nodeType == 3) {
      shaderSource += currentChild.textContent;
    }
    currentChild = currentChild.nextSibling;
  }

  // Now figure out what type of shader script we have,
  // based on its MIME type.
  var shader;
  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  }
  else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  }
  else {
    return null; // Unknown shader type
  }

  // Send the source to the shader object
  gl.shaderSource(shader, shaderSource);

  // Compile the shader program
  gl.compileShader(shader);

  // See if it compiled successfully
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  }

  return shader;
}

//
// initShaders
//
// Initialize the shaders, so WebGL knows how to light our scene.
//
function initShaders() {
  var fragmentShader = getShader(gl, "shader-fs");
  var vertexShader = getShader(gl, "shader-vs");

  // Create the shader program
  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Unable to initialize the shader program.");
  }

  // start using shading program for rendering
  gl.useProgram(shaderProgram);

  // POSITION
  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  // NORMAL
  shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
  gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

  // TEXTURE
  shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
  gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);

  // KALA
  //shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
  //gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

  // store location of uPMatrix variable defined in shader - projection matrix 
  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
  // store location of uMVMatrix variable defined in shader - model-view matrix 
  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  // store location of uNMatrix variable defined in shader - normal matrix 
  shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
  // store location of uSampler variable defined in shader
  shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");

  // LICHTEN
  shaderProgram.lightCountUniform = gl.getUniformLocation(shaderProgram, "uLightCount");
  shaderProgram.lightPositionUniform = gl.getUniformLocation(shaderProgram, "uLightPosition")
  shaderProgram.lightDiffuseUniform = gl.getUniformLocation(shaderProgram, "uLightDiffuse")
  shaderProgram.ambientColorUniform = gl.getUniformLocation(shaderProgram, "uAmbientColor")
}

//
// setMatrixUniforms
//
// Set the uniform values in shaders for model-view and projection matrix.
//
function setMatrixUniforms() {
  gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);

  var normalMatrix = mat3.create();
  mat4.toInverseMat3(mvMatrix, normalMatrix);
  mat3.transpose(normalMatrix);
  gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, normalMatrix);

  gl.uniform1i(shaderProgram.lightCountUniform, lights.length);
  gl.uniform3fv(shaderProgram.lightPositionUniform, lightDirections);
  gl.uniform3fv(shaderProgram.lightDiffuseUniform, lightDiffuses);
  gl.uniform3f(shaderProgram.ambientColorUniform, 0.2, 0.2, 0.2);
}

//
// drawScene
//
// Draw the scene.
//
function drawScene() {
  if (windowHeight != window.innerHeight || windowWidth != window.innerWidth) {
    gl.canvas.width = window.innerWidth * CanvasPageSize;
    gl.canvas.height = window.innerHeight * CanvasPageSize;
    gl.viewportWidth = gl.canvas.width;
    gl.viewportHeight = gl.canvas.height;
  }
  // set the rendering environment to full canvas size

  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  // Clear the canvas before we start drawing on it.
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Establish the perspective with which we want to view the
  // scene. Our field of view is 45 degrees, with a width/height
  // ratio and we only want to see objects between 0.1 units
  // and 100 units away from the camera.
  mat4.perspective(fov, gl.viewportWidth / gl.viewportHeight, 1, 2000000.0, pMatrix);

  if (freecamera) {
    mat4.rotate(pMatrix, degToRad(-CamPitch), [1, 0, 0]);
    mat4.rotate(pMatrix, degToRad(-CamYaw), [0, 1, 0]);
    mat4.translate(pMatrix, [-CamXPosition, -CamYPosition, -CamZPosition]);
  }
  else {
    mat4.rotate(pMatrix, degToRad(-CamPitch), [1, 0, 0]);
    mat4.rotate(pMatrix, degToRad(-CamYaw), [0, 1, 0]);
    mat4.translate(pMatrix, [-CamXPosition, -CamYPosition, -CamZPosition]);
  }
  updateUI();

  
  
  // Set the drawing position to the "identity" point, which is
  // the center of the scene.
  //zvezda
  if (zvezda.vertices.length > 0 && zvezda.texturesLoaded) {
    zvezda.drawObject();
  }

  if (ozadje.vertices.length > 0 && ozadje.texturesLoaded)
    ozadje.drawObject();
  for (i in planets) {
    if (planets[i].vertices.length > 0 && planets[i].texturesLoaded)
      planets[i].drawObject();
  }

  //Golf zogica
  if (koncnalukna.vertices.length > 0 && koncnalukna.texturesLoaded) {
    koncnalukna.drawObject();
  }

  //Golf zogica
  if (zogica.vertices.length > 0 && zogica.texturesLoaded) {
    zogica.drawObject();
  }
}

//
// animate
//
// Called every time before redeawing the screen.
//
 
function animate() {
  var timeNow = new Date().getTime();
  var elapsed = timeNow - lastTime;
  if (elapsed > 50) //Če se okno minimizira se pavzira animacija -> elapsed je zelo velik in se vse sfiži.
    lastTime = 0;
  if (lastTime != 0) {

    for (var i in planets) {
      planets[i].doAnim(elapsed, 1, 1);
    }
    //Gstuff
    if (zogicaPremika) {
      var end = distance(zogica, koncnalukna) < (zogica.radius*1.8);
      //console.log(distance(zogica, koncnalukna) + "  "+ zogica.radius+koncnalukna.vecSize);
      var force = getBallForceVec(zogica, planets,ozadje);
      if (end) { //luknja
         
        cancelAnimationFrame(runningReference);
        alert('Končano v ' + bacAmount + " udarcih.\nČas potreben: " + UI_casValue/1000 + "sekund.\n\n Pritisni OK za ponovni poskus.");
        reset();
      }
      else if (force.length == 5) { //odboj
        zogicaSpeedX = zogicaSpeedX * speedPoOdboju;// * force[0];
        zogicaSpeedY = zogicaSpeedY * speedPoOdboju;// * force[1];
        zogicaSpeedZ = zogicaSpeedZ * speedPoOdboju;// * force[2];
        //I dunno
      }
      else {
        var acceleration = force[3] / zogica.mass;
        //console.log(force);
        if (bacTimer > 0) {
          zogicaSpeedX += acceleration * force[0] * elapsed * accelerationMultipler / 100 - Math.sin(degToRad(CamYaw)) * Math.cos(degToRad(CamPitch)) * bacTimer * bacMultiplier;
          zogicaSpeedY += acceleration * force[1] * elapsed * accelerationMultipler / 100 + Math.sin(degToRad(CamPitch)) * bacTimer * bacMultiplier;
          zogicaSpeedZ += acceleration * force[2] * elapsed * accelerationMultipler / 100 - Math.cos(degToRad(CamYaw)) * Math.cos(degToRad(CamPitch)) * bacTimer * bacMultiplier;
          bacTimer = 0;
        }
        else {
          zogicaSpeedX += acceleration * force[0] * elapsed * accelerationMultipler / 100;
          zogicaSpeedY += acceleration * force[1] * elapsed * accelerationMultipler / 100;
          zogicaSpeedZ += acceleration * force[2] * elapsed * accelerationMultipler / 100;
        }
      }
      zogica.vecPosition[0] += zogicaSpeedX * elapsed / 100;
      zogica.vecPosition[1] += zogicaSpeedY * elapsed / 100;
      zogica.vecPosition[2] += zogicaSpeedZ * elapsed / 100;
    }

    if (freecamera) {
      if (CamSpeed != 0) {
        CamXPosition -= Math.sin(degToRad(CamYaw)) * Math.cos(degToRad(CamPitch)) * CamSpeed * elapsed;
        CamZPosition -= Math.cos(degToRad(CamYaw)) * Math.cos(degToRad(CamPitch)) * CamSpeed * elapsed;
        CamYPosition += Math.sin(degToRad(CamPitch)) * CamSpeed * elapsed;
      }
      if (CamCrossspeed != 0) {
        CamXPosition -= Math.sin(degToRad(CamYaw + 90)) * CamCrossspeed * elapsed;
        CamZPosition -= Math.cos(degToRad(CamYaw + 90)) * CamCrossspeed * elapsed;
      }

      //ozadje.position = [CamXPosition,CamYPosition,CamZPosition];
    }
    else {
      CamXPosition = zogica.vecPosition[0] + (LockedCamZogicaDistance * Math.cos(degToRad(-1 * CamPitch)) * Math.sin(degToRad(CamYaw)));
      CamYPosition = zogica.vecPosition[1] + AimAboveZogica + (LockedCamZogicaDistance * Math.sin(degToRad(-1 * CamPitch)));
      CamZPosition = zogica.vecPosition[2] + (LockedCamZogicaDistance * Math.cos(degToRad(CamYaw)) * Math.cos(degToRad(-1 * CamPitch)));
    }
  }
  lastTime = timeNow;
}


//
// Keyboard handling helper functions
//
// handleKeyDown    ... called on keyDown event
// handleKeyUp      ... called on keyUp event
//
function handleKeyDown(event) {
  // storing the pressed state for individual key
  currentlyPressedKeys[event.keyCode] = true;

}

function handleKeyUp(event) {
  // reseting the pressed state for individual key
  currentlyPressedKeys[event.keyCode] = false;
}

//
// handleKeys
//
// Called every time before redeawing the screen for keyboard
// input handling. Function continuisly updates helper variables.
//
function handleKeys() {
  var speed = 6;
  
    if (currentlyPressedKeys[37] || currentlyPressedKeys[65]) {
      // Left cursor key or A
  
      CamCrossspeed = speed;
    }
    else if (currentlyPressedKeys[39] || currentlyPressedKeys[68]) {
      // Right cursor key or D
      CamCrossspeed = -speed;
    }
    else {
      CamCrossspeed = 0;
    }
  
    if (currentlyPressedKeys[38] || currentlyPressedKeys[87]) {
      // Up cursor key or W
      CamSpeed = speed;
    }
    else if (currentlyPressedKeys[40] || currentlyPressedKeys[83]) {
      // Down cursor key
      CamSpeed = -speed;
    }
    else {
      CamSpeed = 0;
    }
  
    //Bacanje zogice
    if (currentlyPressedKeys[70] && !bacActive && !freecamera) {
      if(UI_prviUdarec == true){
        UI_casZacetekValue = new Date().getTime();
        UI_prviUdarec = false;
      }
       
      zogicaPremika = false;
      bacStartT = new Date().getTime();
      zogicaSpeedX = 0;
      zogicaSpeedY = 0;
      zogicaSpeedZ = 0;
      bacActive = true;
      bacAmount++;
      
      
    }
    else if (!currentlyPressedKeys[70] && bacActive && !freecamera) {
      bacEndT = new Date().getTime();
      bacTimer = Math.min(bacEndT - bacStartT, 1000);
      bacActive = false;
  
      //console.log(bacTimer + " " + bacEndT + " " + bacStartT);
  
      zogicaPremika = true;
     
    }else{
      
    }
    if(bacActive){
      UI_mocUdarcaValue = (Math.min((new Date().getTime()) - bacStartT, 1000))/10;
    }else{
       UI_mocUdarcaValue = 0;
    }
  
    if (currentlyPressedKeys[16] && freecamera) {
      //če držiš shift
      CamSpeed *= cameraSpeedBoostMultiplier;
      CamCrossspeed *= cameraSpeedBoostMultiplier;
    }
    if (currentlyPressedKeys[32] && !spacebarKeyCooldown) {
      //spacebar locks camera onto žogica
      if (freecamera)
        freecamera = false;
      else
        freecamera = true;
      spacebarKeyCooldown = true;
    }
    else if (!currentlyPressedKeys[32]) {
      spacebarKeyCooldown = false;
    }
   
    var tN = new Date().getTime();
    if ( currentlyPressedKeys[72] && UI_helpShow){
      if((tN - UI_helpShowLastPressed > 250 )){
        UI_helpImageNode.style.visibility = 'hidden';
        UI_helpShow = false;
       
        UI_helpShowLastPressed = tN
      }
    }
    else if ( currentlyPressedKeys[72]) {
      if((tN - UI_helpShowLastPressed > 250 )){
        UI_helpImageNode.style.visibility = 'visible';
        UI_helpShow = true
        UI_helpShowLastPressed = tN
      }
    }
    
   
    if (currentlyPressedKeys[82]) {
      reset();
    }
  
}

//Mouse scroll za cam distance(locked) in cam speed(unlocked)
function onScroll(e) {
  var e = window.event || e;
  var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
  if (freecamera) {
    cameraSpeedBoostMultiplier += delta;
  }
  else {
    LockedCamZogicaDistance -= delta * 100;
  }
}

//Pointer Lock
function lockChangeAlert() {
  if (document.pointerLockElement === canvas ||
    document.mozPointerLockElement === canvas) {
    //console.log('The pointer lock status is now locked');
    document.addEventListener("mousemove", updateMousePosition, false);
  }
  else {
    //console.log('The pointer lock status is now unlocked');
    document.removeEventListener("mousemove", updateMousePosition, false);
  }
}
//Mouse position
function updateMousePosition(event) {
  //if(freecamera){
  CamYaw -= event.movementX / 10;
  CamPitch -= event.movementY / 10;
  if (CamPitch > 90) {
    CamPitch = 90;
  }
  else if (CamPitch < -90) {
    CamPitch = -90;
  }

  //}
}


function allTexturesLoaded() {
  if (ozadje.texturesLoaded == false) return false;
  if (zogica.texturesLoaded == false) return false;
  if (zvezda.texturesLoaded == false) return false;
  if (koncnalukna.texturesLoaded == false) return false;
  for (var i in planets) {
    if (!planets[i].texturesLoaded) return false;
    //console.log("objekt -" + planets[i].nickname +" textLoaded: " + planets[i].texturesLoaded);
    if (planets[i].texturesLoaded == false) return false;
  }
  
  document.getElementById("uiOverlay-top").style.visibility='visible';
  document.getElementById("uiOverlay-right").style.visibility='visible';
  UI_helpImageNode.style.visibility='visible';
  return true;
}

//
// start
//
// Called when the canvas is created to get the ball rolling.
//
var tload = false;

function start() {
  canvas = document.getElementById("glcanvas");

  gl = initGL(canvas); // Initialize the GL context

  // Only continue if WebGL is available and working
  if (gl) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0); // Set clear color to black, fully opaque
    gl.clearDepth(1.0); // Clear everything
    gl.enable(gl.DEPTH_TEST); // Enable depth testing
    gl.depthFunc(gl.LEQUAL); // Near things obscure far things

    initShaders();
    setupUI();
    setUpbackground();
    setupPlanets();
    setupLights();

    // Initialize the shaders; this is where all the lighting for the
    // vertices and so forth is established.

    gl.canvas.width = window.innerWidth * CanvasPageSize;
    gl.canvas.height = window.innerHeight * CanvasPageSize;
    windowHeight = window.innerHeight;
    windowWidth = window.innerWidth;
    gl.viewportWidth = gl.canvas.width;
    gl.viewportHeight = gl.canvas.height;

    // Bind keyboard handling functions to document handlers
    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;

    canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock;
    document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock;
    canvas.onclick = function() {
      canvas.requestPointerLock();
    };
    document.addEventListener('pointerlockchange', lockChangeAlert, false);
    document.addEventListener('mozpointerlockchange', lockChangeAlert, false);
    //scroll
    if (canvas.addEventListener) {
      canvas.addEventListener("mousewheel", onScroll, false);
      canvas.addEventListener("DOMMouseScroll", onScroll, false);
    }
    else
      canvas.addEventListener("onmousewheel", onScroll);



    var nalaganje = setInterval(function() {
      if (tload == true || allTexturesLoaded() == true) {
        tload = true;
        clearInterval(nalaganje);
        requestAnimationFrame(run);
      }
    }, 15);



  }
}

function run() {
  handleKeys();
  animate();
  drawScene();

  runningReference = requestAnimationFrame(run);
}

function reset() {
  cancelAnimationFrame(runningReference);
  UI_casValue = 0;
  UI_stUdarcevValue=0;
  UI_prviUdarec = true;
  bacAmount = 0;
  zogicaSpeedX = 0;
  zogicaSpeedY = 0;
  zogicaSpeedZ = 0;
  zogicaPremika = false;
  zogica.vecPosition[0] = 0;
  zogica.vecPosition[1] = 0;
  zogica.vecPosition[2] = 0;
  requestAnimationFrame(run);
}
