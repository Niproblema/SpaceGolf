function readJSONFile(path, callback) {
	var xrequest = new XMLHttpRequest();
	
    xrequest.overrideMimeType("application/json");
    xrequest.open('GET', path, true);
    xrequest.onreadystatechange = function () {
		if (xrequest.readyState == 4 && xrequest.status == "200") {
			callback(xrequest.responseText);
		}
    };
    xrequest.send(null);  
}

/**
 * Objekt za izvor svetlobe
 */
function Light(vecPosition, vecDiffuse) {
	this.position = vecPosition;
	this.diffuse = vecDiffuse;
}

/**
 * Objekt3D je nadrazred vseh objektov
 */
function Object3D(vecPosition, vecRotation, vecSize) {
	this.vertexPositionBuffer = null;
	this.vertexNormalBuffer = null;
	this.vertexColorBuffer = null;
	this.vertexIndexBuffer = null;
	this.vertexTextureBuffer = null;
	
	this.position = vecPosition;
	this.rotation = vecRotation;
	this.size = vecSize;
	
    this.vertices = [];
    this.normals = [];
    this.faces = [];
    this.colors = [];
	this.textureCoordinates = [];
	
	this.vertexFormat = null;
	this.normalFormat = null;
	this.colorFormat = null;
	this.faceFormat = null;
	this.textureFormat = null;
	
	this.texture = null;
	this.texturePath = null;
	this.texturesLoaded = false;
	
	this.hasP = false;
	this.bufferParent = null;
}

function initObject(object) {
	object.initBuffers();
	if(object.texturePath != null)
		object.initTextures();
}

Object3D.prototype.initObject = function() {
	initObject(this)
}

Object3D.prototype.initPositionBuffer = function() {
	this.vertexPositionBuffer = gl.createBuffer();

	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer);

	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);
	this.vertexPositionBuffer.itemSize = this.vertexFormat.itemSize;
	this.vertexPositionBuffer.numItems = this.vertexFormat.numItems;
}

Object3D.prototype.initColorBuffer = function() {
	this.vertexColorBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexColorBuffer);

	var unpackedColors = [];
	for (var i in this.colors) {
		var color = this.colors[i];

		for (var j=0; j < 4; j++) {
			unpackedColors = unpackedColors.concat(color);
		}
	}

	// Pass the colors into WebGL
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(unpackedColors), gl.STATIC_DRAW);
	this.vertexColorBuffer.itemSize = this.colorFormat.itemSize;
	this.vertexColorBuffer.numItems = this.colorFormat.numItems;
}

Object3D.prototype.initIndexBuffer = function() {
	this.vertexIndexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer);

	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.faces), gl.STATIC_DRAW);
	this.vertexIndexBuffer.itemSize = this.faceFormat.itemSize;
	this.vertexIndexBuffer.numItems = this.faceFormat.numItems;
}

Object3D.prototype.initTextureBuffer = function() {
	this.vertexTextureBuffer = gl.createBuffer();
  	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexTextureBuffer);
  	
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.textureCoordinates), gl.STATIC_DRAW);
	this.vertexTextureBuffer.itemSize = this.textureFormat.itemSize;
	this.vertexTextureBuffer.numItems = this.textureFormat.numItems;
}

Object3D.prototype.initNormalBuffer = function() {
	this.vertexNormalBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexNormalBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.normals), gl.STATIC_DRAW);
	this.vertexNormalBuffer.itemSize = this.normalFormat.itemSize;
	this.vertexNormalBuffer.numItems = this.normalFormat.numItems;
}

Object3D.prototype.initBuffers = function() {

	this.initPositionBuffer();
	this.initNormalBuffer();
	this.initIndexBuffer();

	if(this.colors.length > 0 && false) {
		this.initColorBuffer();

	}
	if(this.texturePath != null) {
		this.initTextureBuffer();
	
	}

}

/**
	Tuki se začnejo teksture!!... FAK
*/
Object3D.prototype.initTextures = function() {
	this.texture = gl.createTexture();
	this.texture.image = new Image();
	this.texture.image.onload = function() {
		this.handleTextureLoaded();
	}.bind(this);
	this.texture.image.src = this.texturePath;
}
var textureTime;
Object3D.prototype.handleTextureLoaded = function() {
	gl.bindTexture(gl.TEXTURE_2D, this.texture);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.texture.image);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
	gl.generateMipmap(gl.TEXTURE_2D);
	gl.bindTexture(gl.TEXTURE_2D, null);
	//console.log("textureLoadTime " + (textureTime));
	this.texturesLoaded = true;
}

Object3D.prototype.drawObject = function() {
	mat4.identity(mvMatrix);
	mvPushMatrix();

	mat4.translate(mvMatrix, this.position);
	mat4.rotateX(mvMatrix, degToRad(this.rotation[0]));
	mat4.rotateY(mvMatrix, degToRad(this.rotation[1]));
	mat4.rotateZ(mvMatrix, degToRad(this.rotation[2]));
	mat4.scale(mvMatrix, this.size);
	 
	
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexNormalBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, this.vertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);

	if(this.colors.length > 0 && false) {
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexColorBuffer);
		gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, this.vertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
	}

	if(this.texturesLoaded) {
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexTextureBuffer);
		gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, this.vertexTextureBuffer.itemSize, gl.FLOAT, false, 0, 0);

		// Specify the texture to map onto the faces.
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.texture);
		gl.uniform1i(shaderProgram.samplerUniform, 0);
	}
		
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer);
	setMatrixUniforms();
	gl.drawElements(gl.TRIANGLES, this.vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
	mvPopMatrix();	
  	
}

Object3D.prototype.doAnim = function(elapsed){
	
}

/**
 * Objekt poljubne oblike (jsonPath = pot do 3D modela, texturePath = pot do slike s teksturo)
 */
function CustomObject(vecPosition, vecRotation, vecSize, jsonPath, texturePath) {
	Object3D.call(this, vecPosition, vecRotation, vecSize);
	
	this.jsonPath = jsonPath;
	this.texturePath = texturePath;
}

CustomObject.prototype = Object.create(Object3D.prototype);

CustomObject.prototype.constructor = CustomObject;

CustomObject.prototype.initObject = function() {
	readJSONFile(this.jsonPath, function(response) {
	 
		var jsonObject = JSON.parse(response);
		this.vertices = jsonObject.vertices;
		this.normals = jsonObject.normals;
		this.colors = jsonObject.colors;
		this.faces = jsonObject.faces;
		this.textureCoordinates = jsonObject.uvs;
		
		this.vertexFormat = {itemSize: 3, numItems: this.vertices.length/3};
		this.normalFormat = {itemSize: 3, numItems: this.normals.length/3}
		this.colorFormat = {itemSize: 4, numItems: this.colors.length/4};
		this.faceFormat = {itemSize: 1, numItems: this.faces.length};
		this.textureFormat = {itemSize: 2, numItems: this.textureCoordinates.length/2};
		initObject(this);
		 
	}.bind(this));
}


function Planet(nickname, vecPosition, vecRotation, vecSize, jsonPath, texturePath, providedMass, bufferParent1, hasParent) {
	CustomObject.call(this, vecPosition, vecRotation, vecSize, jsonPath, texturePath);
	this.vecPosition = vecPosition;
	this.jsonPath = jsonPath;
	this.texturePath = texturePath;
	this.bufferParent = bufferParent1;
	this.radius = 1*vecSize[0];
	this.mass = providedMass;
	this.nickname=nickname;
	this.hasP = hasParent;
}

Planet.prototype = Object.create(CustomObject.prototype);

Planet.prototype.constructor = Planet;

Planet.prototype.initObject = function(){
	CustomObject.prototype.initObject.call(this);
}

 

Planet.prototype.doAnim= function(elapsed,koefVrtenja, smerVrtenja){
	//smerVrtenja: 1 - levo, -1 - desno
	if(!koefVrtenja) koefVrtenja = 1;
	if(!smerVrtenja) smerVrtenja = 1;
	this.rotation[1] += (koefVrtenja * elapsed*smerVrtenja) / 1000.0;
}

function KoncnaLukna(vecPosition, vecRotation, vecSize, jsonPath, texturePath, targetPos) {
	CustomObject.call(this, vecPosition, vecRotation, vecSize);
	this.vecPosition = vecPosition;
	this.vecSize = vecSize;
	this.jsonPath = jsonPath;
	this.texturePath = texturePath;
	this.matrLookAt;
	this.target = targetPos;
}
KoncnaLukna.prototype = Object.create(CustomObject.prototype);

KoncnaLukna.prototype.constructor = KoncnaLukna;

 
/**
	Tukej je objekt za KVADER
*/
function Cuboid(vecPosition, vecRotation, vecSize, texturePath) {
	Object3D.call(this, vecPosition, vecRotation, vecSize);
	
	this.vertices = [
		// Front face
		-1.0, -1.0,  1.0,
		 1.0, -1.0,  1.0,
		 1.0,  1.0,  1.0,
		-1.0,  1.0,  1.0,

		// Back face
		-1.0, -1.0, -1.0,
		-1.0,  1.0, -1.0,
		 1.0,  1.0, -1.0,
		 1.0, -1.0, -1.0,

		// Top face
		-1.0,  1.0, -1.0,
		-1.0,  1.0,  1.0,
		 1.0,  1.0,  1.0,
		 1.0,  1.0, -1.0,

		// Bottom face
		-1.0, -1.0, -1.0,
		 1.0, -1.0, -1.0,
		 1.0, -1.0,  1.0,
		-1.0, -1.0,  1.0,

		// Right face
		 1.0, -1.0, -1.0,
		 1.0,  1.0, -1.0,
		 1.0,  1.0,  1.0,
		 1.0, -1.0,  1.0,

		// Left face
		-1.0, -1.0, -1.0,
		-1.0, -1.0,  1.0,
		-1.0,  1.0,  1.0,
		-1.0,  1.0, -1.0
	];
	this.vertexFormat = {itemSize: 3, numItems: 24};
	
	this.colors = [
		[1.0, 0.0, 0.0, 1.0], // Front face
		[1.0, 1.0, 0.0, 1.0], // Back face
		[0.0, 1.0, 0.0, 1.0], // Top face
		[1.0, 0.5, 0.5, 1.0], // Bottom face
		[1.0, 0.0, 1.0, 1.0], // Right face
		[0.0, 0.0, 1.0, 1.0]  // Left face
  	];
	this.colorFormat = {itemSize: 4, numItems: 24};
	
	// This array defines each face as two triangles, using the
  	// indices into the vertex array to specify each triangle's
  	// position.
	this.faces = [
		0, 1, 2,      0, 2, 3,    // Front face
		4, 5, 6,      4, 6, 7,    // Back face
		8, 9, 10,     8, 10, 11,  // Top face
		12, 13, 14,   12, 14, 15, // Bottom face
		16, 17, 18,   16, 18, 19, // Right face
		20, 21, 22,   20, 22, 23  // Left face
	];
	this.faceFormat = {itemSize: 1, numItems: 36};
	
	this.textureCoordinates = [
		// Front
		0.0,  0.0,
		1.0,  0.0,
		1.0,  1.0,
		0.0,  1.0,
		// Back
		0.0,  0.0,
		1.0,  0.0,
		1.0,  1.0,
		0.0,  1.0,
		// Top
		0.0,  0.0,
		1.0,  0.0,
		1.0,  1.0,
		0.0,  1.0,
		// Bottom
		0.0,  0.0,
		1.0,  0.0,
		1.0,  1.0,
		0.0,  1.0,
		// Right
		0.0,  0.0,
		1.0,  0.0,
		1.0,  1.0,
		0.0,  1.0,
		// Left
		0.0,  0.0,
		1.0,  0.0,
		1.0,  1.0,
		0.0,  1.0
	];
	this.textureFormat = {itemSize:2, numItems:24};
	this.texturePath = texturePath;
	
	this.normals = [
      // Front face
       0.0,  0.0,  1.0,
       0.0,  0.0,  1.0,
       0.0,  0.0,  1.0,
       0.0,  0.0,  1.0,

      // Back face
       0.0,  0.0, -1.0,
       0.0,  0.0, -1.0,
       0.0,  0.0, -1.0,
       0.0,  0.0, -1.0,

      // Top face
       0.0,  1.0,  0.0,
       0.0,  1.0,  0.0,
       0.0,  1.0,  0.0,
       0.0,  1.0,  0.0,

      // Bottom face
       0.0, -1.0,  0.0,
       0.0, -1.0,  0.0,
       0.0, -1.0,  0.0,
       0.0, -1.0,  0.0,

      // Right face
       1.0,  0.0,  0.0,
       1.0,  0.0,  0.0,
       1.0,  0.0,  0.0,
       1.0,  0.0,  0.0,

      // Left face
      -1.0,  0.0,  0.0,
      -1.0,  0.0,  0.0,
      -1.0,  0.0,  0.0,
      -1.0,  0.0,  0.0
	];
	this.normalFormat = {itemSize: 3, numItems: 24};
}

Cuboid.prototype = Object.create(Object3D.prototype);

Cuboid.prototype.constructor = Cuboid;


 
function mat42Readable( m) {
  var a;
  a= "\n"
       + m[0] + ", " +  m[4] + ", " + m[8] + ", " + m[12] + "\n"
       + m[1] + ", " +  m[5] + ", " + m[9] + ", " + m[13] + "\n"
       + m[2] + ", " +  m[6] + ", " + m[10] + ", "+ m[14] + "\n"
       + m[3] + ", " +  m[7] + ", " + m[11] + ", "+ m[15] + "\n"
  +"";
  return a;
}
