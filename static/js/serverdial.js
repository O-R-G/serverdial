// adapted from http://www.asterixcreative.com/blog-mobile-gyroscope-with-javascript-and-quaternions-programming-tutorial-pt1.html
// uses suncalc, a js library https://github.com/mourner/suncalc for sunrise, sunset calculations

// ** better to use this directly here or in the html and feed it to this script????? **

// serverdial is simply a computer model of a future sundial
// specific to the exact geolocation and gyroscope of the device used to view it
// but using an NTP instead of the sun to produce the shadow (time)

// gnomon angle adjusts with user's latitude
// number displacement on the dial adjusts with user's latitude
// fonts -- either roman numerals or else data points for mtdbt2f numbers


// 0. init, process gyro data, setup canvas

var simulateGyro = true;    // for debug to turn off/on in console 
var showInfo = false;	// ** fix ** there is a better logic to this than using global i think in the addEventListener callback
var rendercount = 0;
var fakegyro = true;
var animate = true;
var animategyro = false;
var debug = true;

function showInformation () {
	if (document.getElementById('gyroInfo').style.visibility=='hidden') {
		document.getElementById('gyroInfo').style.visibility='visible';
		document.getElementById('quatInfo').style.visibility='visible';
		document.getElementById('mouseInfo').style.visibility='visible';
		showInfo = true;
		return true;
	} else {
		document.getElementById('gyroInfo').style.visibility='hidden';
		document.getElementById('quatInfo').style.visibility='hidden';
		document.getElementById('mouseInfo').style.visibility='hidden';
		showInfo = false;
		return false;
	}
}

// document.addEventListener("click",showInformation);
// document.addEventListener("touchStart",showInformation);

// gyroscope
// get orientation info, rolling back if gyro info not available

var gyro = quatFromAxisAngle(0,0,0,0);
 
if (window.DeviceOrientationEvent) {//
    window.addEventListener("deviceorientation", function () {//gyro
        processGyro(event.alpha, event.beta, event.gamma); 
    }, true);
} 

function processGyro(alpha,beta,gamma) { 	
	gyro = computeQuaternionFromEulers(alpha,beta,gamma);
	document.getElementById("alpha").innerHTML = alpha.toFixed(5);
	document.getElementById("beta").innerHTML = beta.toFixed(5);
	document.getElementById("gamma").innerHTML = gamma.toFixed(5);
	document.getElementById("x").innerHTML = gyro.x.toFixed(5);
	document.getElementById("y").innerHTML = gyro.y.toFixed(5);
	document.getElementById("z").innerHTML = gyro.z.toFixed(5);
	document.getElementById("w").innerHTML = gyro.w.toFixed(5);
}

// geolocation
// https://www.w3schools.com/html/html5_geolocation.asp

var display = document.getElementById("latitude");        
var latitude = 56.1629;     // default to aarhus
// var latitude = 37.4300;     // debug value to match example
                            // scoping problem with latitude as included only in callback
                            // this may be solved using an anon function or other callback wrapper
                            // for now leaving as is ** fix **
var headingnorth;           // heading as degrees clockwise from north (returned if available)

if (window.self) {
    getLocation();
}

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(setPosition, showError);
    } else {
        display.innerHTML = "Geolocation not supported in this browser.";
    }
}

function setPosition(position) {
    // in this callback function, need to trigger other actions from this once position info is ready
    // double callback?
    latitude = position.coords.latitude.toFixed(4);
    if (position.coords.heading)
        headingnorth = position.coords.heading.toFixed(4);      // only returns if available
    else
        headingnorth = 13.001;      // stub value debug                            
        // headingnorth = 0;        // real value
    // if (debug)
    //    latitude = (Math.random() * 90).toFixed(4);
    display.innerHTML = latitude + "&deg;";
}

function showError(error) {
    switch(error.code) {
        case error.PERMISSION_DENIED:
            display.innerHTML = "User denied request for Geolocation."
            break;
        case error.POSITION_UNAVAILABLE:
            display.innerHTML = "Location information unavailable."
            break;
        case error.TIMEOUT:
            display.innerHTML = "Request for user location timed out."
            break;
        case error.UNKNOWN_ERROR:
            display.innerHTML = "Unknown error occurred."
            break;
    }
}

// canvas context

var canvas = document.getElementById('gyroCanvas');
var context = canvas.getContext('2d');
context.canvas.width  = window.innerWidth; //resize canvas to whatever window dimensions are
context.canvas.height = window.innerHeight;
context.translate(canvas.width / 2, canvas.height / 2); //put 0,0,0 origin at center of screen instead of upper left corner
context.font = "20px mtdbt2f-HHH";      // need to have this available and prepped as webfont .eot .woff etc
// context.font = "20px Helvetica";      // this is used for canvas drwg if necc (numbers?)
context.fillStyle = "#EEE";












// 1. geometry

function computeQuaternionFromEulers(alpha,beta,gamma) {

    //Alpha around Z axis, beta around X axis and gamma around Y axis intrinsic local space in that order(each axis moves depending on how the other moves so processing order is important)

	var x = degToRad(beta) ; // beta value
	var y = degToRad(gamma) ; // gamma value
	var z = degToRad(alpha) ; // alpha value

	// precompute to save on processing time
	var cX = Math.cos( x/2 );
	var cY = Math.cos( y/2 );
	var cZ = Math.cos( z/2 );
	var sX = Math.sin( x/2 );
	var sY = Math.sin( y/2 );
	var sZ = Math.sin( z/2 );

	var w = cX * cY * cZ - sX * sY * sZ;
	var x = sX * cY * cZ - cX * sY * sZ;
	var y = cX * sY * cZ + sX * cY * sZ;
	var z = cX * cY * sZ + sX * sY * cZ;

	return makeQuat(x,y,z,w);	  
}

function quaternionMultiply(quaternionArray) {

	// multiplies 2 or more quaternions together 
	// order is important -- last to first transformation
	
	var temp = quaternionArray[0];
	var qSoFar ={x:temp.x,y:temp.y,z:temp.z,w:temp.w}; //must copy to not alter original object
	for(var i=1 ;i < quaternionArray.length ;i ++)
	{
		var temp2=quaternionArray[i];
		var next={x:temp2.x,y:temp2.y,z:temp2.z,w:temp2.w};
		//ww,x,y,z
		var w = qSoFar.w * next.w - qSoFar.x * next.x - qSoFar.y * next.y - qSoFar.z * next.z;
		var x = qSoFar.x * next.w + qSoFar.w * next.x + qSoFar.y * next.z - qSoFar.z * next.y;
		var y = qSoFar.y * next.w + qSoFar.w * next.y + qSoFar.z * next.x - qSoFar.x * next.z;
		var z = qSoFar.z * next.w + qSoFar.w * next.z + qSoFar.x * next.y - qSoFar.y * next.x;
		
		qSoFar.x=x;
		qSoFar.y=y;
		qSoFar.z=z;
		qSoFar.w=w;
	}
	
	return qSoFar;
}

function inverseQuaternion(q) {

	return makeQuat(q.x,q.y,q.z,-q.w);
}

function degToRad(deg) {

	 return deg * Math.PI / 180; 
}

function radToDeg(rad) {

	 return rad * 180 / Math.PI;
}

function makeQuat(x,y,z,w) {

	return  {"x":x,"y":y,"z":z,"w":w};
}

function quatFromAxisAngle(x,y,z,angle) {

	var q = {};
	var half_angle = angle/2;
	q.x = x * Math.sin(half_angle);
	q.y = y * Math.sin(half_angle);
	q.z = z * Math.sin(half_angle);
	q.w = Math.cos(half_angle);
	return q;
}


function rotateObject(obj,q) {

	var newObj={};
	newObj.vertices=[];
	
	for(var i=0 ; i<obj.vertices.length ; i++) {
	  newObj.vertices.push(rotatePointViaQuaternion(obj.vertices[i],q));
	}
	return newObj;
}

function rotatePointViaQuaternion(pointRa,q) {

	var tempQuot = {'x':pointRa[0], 'y':pointRa[1], 'z':pointRa[2], 'w':0 };
	var rotatedPoint=quaternionMultiply([ q , tempQuot, conjugateQuat(q)]); // inverseQuaternion(q) also works 

	return [rotatedPoint.x,rotatedPoint.y,rotatedPoint.z];
	
	function conjugateQuat(qq) {
		return makeQuat(-qq.x,-qq.y,-qq.z,qq.w);
	}
}	  

// transforms

function transformObject(obj,x,y,z) {

    // move all points in object specified amts

    var point={};
  	var newObj={};
	newObj.vertices=[];

	for(var i=0 ; i<obj.vertices.length ; i++) {
        // faster to operate directly on object? or better to make a copy?
        // for now, making a copy as that is how it's done elsewhere
	    // obj.vertices[i][0]+=x;
	    // obj.vertices[i][1]+=y;
	    // obj.vertices[i][2]+=z;
        point.x = obj.vertices[i][0] + x;
        point.y = obj.vertices[i][1] + y;
        point.z = obj.vertices[i][2] + z;
        newObj.vertices.push([point.x,point.y, point.z]);
    }

	// return obj;
	return newObj;
}

function calculateHourAngles(thislatitude, start) {

    // find the angles of offset from gnomon for hour ticks
    // return object with two arrays of angle values in radians
    // morning and afternoon ordered by offset from 12pm
    // based on http://www.crbond.com/papers/sundial.pdf
    // atan takes a value (ratio) and returns an angle in radians
    // sin, tan take an angle in radians return a value (ratio)
    
    var angleincrement = 15;
    var hourangles={};
    hourangles.morning=[];
    hourangles.afternoon=[];
    hourangles.count = (12 - start);

	for(var i = 0; i < hourangles.count; i++) {        
        var morning = Math.atan(Math.sin(degToRad(thislatitude)) * Math.tan(degToRad(-angleincrement)));
        var afternoon = Math.atan(Math.sin(degToRad(thislatitude)) * Math.tan(degToRad(angleincrement)));
        hourangles.morning.push(morning);
        hourangles.afternoon.push(afternoon);
        angleincrement += 15;
    }

    // if (debug) console.log(hourangles.morning);

	return hourangles;
}

function calculateShadowAngle(thislatitude, now) {

    // find the angle of offset for the shadow based on current time
    // where now is currenttime in seconds and is mapped into range 0-360°
    // morning and afternoon can animate separately from 12pm
    // return object with current value in radians and am/pm flag
    // based on http://www.crbond.com/papers/sundial.pdf
    // atan takes a value (ratio) and returns an angle in radians
    // sin, tan take an angle in radians return a value (ratio)

    var thisshadowangle={};
    var omega = map(now,0,86400,0,360);
    if (omega < 180)
        thisshadowangle.am = true;
    thisshadowangle.radians = Math.atan(Math.sin(degToRad(thislatitude)) * Math.tan(degToRad(omega)));

    // if (debug) console.log(hourangles.morning);

	return thisshadowangle;
}





























// 2. 3d data

function makeRect(width,height,depth) {

	// returns a 3D box like object centered around the origin. 
	// There are more than 8 points for this cube as it is being made 
	// by chaining together a strip of triangles so points are redundant at least 3x. 
	// Confusing for now (sorry) but this odd structure comes in handy later for transitioning into webgl

	var newObj={};
	var hw=width/2;
	var hh=height/2;
	var hd=depth/2;
	newObj.vertices=[  						  
				[-hw,hh,hd],[hw,hh,hd],[hw,-hh,hd], // first triangle
				[-hw,hh,hd],[-hw,-hh,hd],[hw,-hh,hd],//2 triangles make front side
				[-hw,hh,-hd],[-hw,hh,hd],[-hw,-hh,-hd], //left side
				[-hw,hh,hd],[-hw,-hh,hd],[-hw,-hh,-hd],
				[hw,hh,-hd],[hw,hh,hd],[hw,-hh,-hd], //right side
				[hw,hh,hd],[hw,-hh,hd],[hw,-hh,-hd],
				[-hw,hh,-hd],[hw,hh,-hd],[hw,-hh,-hd],//back
				[-hw,hh,-hd],[-hw,-hh,-hd],[hw,-hh,-hd],
				[-hw,hh,-hd],[hw,hh,-hd],[hw,hh,hd],//top
				[-hw,hh,-hd],[-hw,hh,hd],[hw,hh,hd],
				[-hw,-hh,-hd],[hw,-hh,-hd],[hw,-hh,hd],//bottom
				[-hw,-hh,-hd],[-hw,-hh,hd],[hw,-hh,hd]
	];
	
	return newObj;
}

function makeTriangle(width,height,depth) {

	// returns a 3D triangle-like object centered around the origin. 

	var newObj={};
	var hw=width/2;
	var hh=height/2;
	var hd=depth/2;
	newObj.vertices=[  	
        [-hw,hh,hd],[hw,hh,hd],[hw,-hh,hd] // first triangle
	];
	
	return newObj;
}

function makePlaneWithTriangle(width,height,depth) {

	// returns a 3D plane object constructed by 2 triangles

	var newObj={};
	var hw=width/2;
	var hh=height/2;
	var hd=depth/2;
	newObj.vertices=[  	
				[-hw,hh,hd],[hw,hh,hd],[hw,-hh,hd], // first triangle
                [-hw,hh,hd],[-hw,-hh,hd],[hw,-hh,hd] // 2 triangles make front side
	];
	
	return newObj;
}

function makeArcWithTriangle(width,height,depth) {

	// returns a 3D arc object triangle

	// may not need these
  	var newObj = {};
	var hw = width/2;
	var hh = height/2;
	var hd = depth/2;
	var thisPoint0 = [];
	var thisPoint1 = [];
	var thisPoint2 = [];

	newObj.vertices = [];
	
	// push new points [x,y,z] onto vertices[]

	for (i=0; i<2*Math.PI; i+=2*Math.PI/100) {

	        var c = Math.cos(i);
	        var s = Math.sin(i);

		// very ugly ** fix **
		thisPoint0 = [0,0,hd];
		if (i==0) { 
			thisPoint1 = [hw,0,hd];	
		} else {
			thisPoint1 = thisPoint2;	
		}
		thisPoint2 = [hw*c,hh*s,hd];

		newObj.vertices.push(thisPoint0,thisPoint1,thisPoint2);
	}  
	
	return newObj;
}










// 3. rendering

function renderObj(obj,q) {

	var rotatedObj=rotateObject(obj,q);
	context.lineWidth = 0.5;    // [1.0]
	context.strokeStyle = obj.color;
	
	function scaleByZ(val,z) {
		var focalLength=900; // [900] should probably be a global but oh well
		var scale= focalLength/((-z)+focalLength);
		return val*scale;
	}
	
    // to add filled shapes, wrap the dwg commands (context.moveTo(), .lineTo())
    // with context.beginPath() to start and context.fill() to finish

	for (var i=0 ; i<obj.vertices.length ; i+=3) {

		for (var k=0;k<3;k++) {
		  
			var vertexFrom=rotatedObj.vertices[i+k];
		  	var temp=i+k+1;
		  	if(k==2) 
			  	temp=i;
			  
			var vertexTo=rotatedObj.vertices[temp];		
			context.beginPath();

    		// original w/ focal length
	    	context.moveTo(scaleByZ(vertexFrom[0],vertexFrom[2]), ( -scaleByZ(vertexFrom[1],vertexFrom[2])));

            // points only
            if (k % 2 != 0)         
                context.lineTo(scaleByZ(vertexTo[0],vertexTo[2]), ( -scaleByZ(vertexTo[1],vertexTo[2])));

            /*
            // points and spokes
            else if (showInfo)      
                context.lineTo(scaleByZ(vertexTo[0],vertexTo[2]), ( -scaleByZ(vertexTo[1],vertexTo[2])));
            */

            // not working, not sure why
            // perhaps to do with the points in the wrong sequence?
            // context.fillStyle = "blue";
            // context.fill();

            context.stroke();		    
		}
	}
}

// perhaps this is better as an additional parameter to renderObj?
// or better, a property of the object

function renderType(obj,q) {
    
    var thishour = 0;
	var rotatedObj=rotateObject(obj,q);
	// context.fillStyle = obj.color;
	context.fillStyle = "purple";
	
	function scaleByZ(val,z) {
		var focalLength=900; // [900] should probably be a global but oh well
		var scale=focalLength/((-z)+focalLength);
		return val*scale;
	}
	
	for(var i=0 ; i<obj.vertices.length ; i+=3) {
		// for (var k=0;k<3;k++) {
		for (var k=0;k<1;k++) {
		             
			var vertexFrom=rotatedObj.vertices[i+k];
		  	var temp=i+k+1;
		  	if(k==2) 
			  	temp=i;
			  
			var vertexTo = rotatedObj.vertices[temp];		
            if (k % 2 == 0)
                context.fillText(thishour,scaleByZ(vertexFrom[0],vertexFrom[2]), ( -scaleByZ(vertexFrom[1],vertexFrom[2])));
		}
    }
    // thishour++;
    // thishour%=12;
}











// 4. user input

var userQuat=quatFromAxisAngle(0,0,0,0);//a quaternion to represent the users finger swipe movement - default is no rotation
var prevTouchX = -1; // -1 is flag for no previous touch info
var prevTouchY = -1;

// touch

// document.addEventListener("touchStart", touchStartFunc, true);//?misspelled
document.addEventListener("touchstart", touchStartFunc, true);
document.addEventListener("touchmove", touchmoveFunc, true);
document.addEventListener("touchend", touchEndFunc, true);


function touchStartFunc(e)
{
	prevTouchY=e.touches[0].clientY;
	prevTouchX=e.touches[0].clientX;
    showInformation();
}

function touchmoveFunc(e)
{
	if( navigator.userAgent.match(/Android/i) ) //stupid android bug cancels touch move if it thinks there's a swipe happening
	{   
	  e.preventDefault();
	}
	userXYmove(e.touches[0].clientX,e.touches[0].clientY);
}

function touchEndFunc(e)
{
  prevTouchX = -1;
  prevTouchY = -1;
}

// mouse

document.addEventListener("mousedown", mouseDownFunc, true);
document.addEventListener("mousemove", mouseMoveFunc, true);
document.addEventListener("mouseup", mouseUpFunc, true);

function mouseDownFunc(e)
{
  prevTouchX = e.clientX;
  prevTouchY = e.clientY;
  showInformation();
}

function mouseMoveFunc(e)
{
	if (prevTouchX!= -1)
		userXYmove(e.clientX,e.clientY);
}

function mouseUpFunc(e)
{
  prevTouchX = -1;
  prevTouchY = -1;
}
	
function userXYmove(x,y)
{
	document.getElementById("userX").innerHTML=x;
	document.getElementById("userY").innerHTML=y;
	
	if(prevTouchX != -1 ) //need valid prevTouch info to calculate swipe
	{
        var xMovement=x-prevTouchX;
	    var yMovement=y-prevTouchY;
        // var xMovementQuat=quatFromAxisAngle(1,0,0,y/200);//movement on y rotates x and vice versa
 	    // var yMovementQuat=quatFromAxisAngle(0,1,0,x/200);//200 is there to scale the movement way down to an intuitive amount
	    // userQuot=quaternionMultiply([yMovementQuat,xMovementQuat]);//use reverse order
	 
	    var xMovementQuat=quatFromAxisAngle(1,0,0,yMovement/200);//movement on y rotates x and vice versa
	    var yMovementQuat=quatFromAxisAngle(0,1,0,xMovement/200);//200 is there to scale the movement way down to an intuitive amount	 
	    userQuat=quaternionMultiply([gyro,yMovementQuat,xMovementQuat,inverseQuaternion(gyro),userQuat]);//use reverse order
	}
	prevTouchY=y;
	prevTouchX=x;
}













// 5. animate

// setup stage

var hourAxis=makeArcWithTriangle(canvas.width/1.5,canvas.width/1.5,0);
var minAxis=makeArcWithTriangle(canvas.width/1.5,canvas.width/1.5,0);
var secAxis=makeArcWithTriangle(canvas.width/1.5,canvas.width/1.5,0);
var cube=makeRect(canvas.width/5,canvas.width/5,canvas.width/5);

// gnomon

var gnomon = updateGnomon(latitude);
// gnomon = updateHeadingNorth(gnomon, headingnorth, canvas.width/4.0);

function updateGnomon(thislatitude) {

    // construct gnomon with angle = latitude
    // -90° < latitude < 90° (absolute value within range 0-90°)

    var angle = Math.abs(thislatitude);
    var thisgnomonquat = quatFromAxisAngle(0,1,0,degToRad(angle));    
    var thisgnomon = makeRect(canvas.width/2.0, 4.0, 4.0);
    thisgnomon = transformObject(thisgnomon,-canvas.width/4.0,0,0);
    thisgnomon = rotateObject(thisgnomon,thisgnomonquat);
    thisgnomon = transformObject(thisgnomon,canvas.width/4.0,0,0);

    return thisgnomon;
}

// shadow

var degreelimit = 90;               // offset to be based on latitude
var speedlimit = 86400;             // for debug, larger is slower 
// var speedlimit = 86;             // for debug, larger is slower                                     // [86400] is realtime

var shadow = updateShadow(new Date());

function updateShadow(now) {

    // update shadow based on current time
    // rotate around z-axis using quaternion derived from axis angle 

    // ** old **  delete
    // angle = map(seconds,0,speedlimit,0,degreelimit);
    // var shadowquat = quatFromAxisAngle(0,0,1,degToRad(angle));    

    shadowangle = calculateShadowAngle(latitude, now);
    // var shadowquat = quatFromAxisAngle(0,0,1,shadowangle.radians/2);    // /2 because angle is origin is in middle of circle
    var shadowquat = quatFromAxisAngle(0,0,1,-shadowangle.radians/2);    // /2 because angle is origin is in middle of circle
                                                                        // as per sundial.pdf paper
                                                                        // negative value? why? unsure ... ** fix **
    var thisshadow = makeRect(canvas.width/2.0, 1.0, 0.0);
    thisshadow = transformObject(thisshadow,-canvas.width/4.0,0,0);
    thisshadow = rotateObject(thisshadow,shadowquat);
    thisshadow = transformObject(thisshadow,canvas.width/4.0,0,0);

    // if (debug) console.log(seconds + " : " + angle);

    return thisshadow;
}

// hours

var hours = updateHours(latitude);

function updateHours(thislatitude) {

    // build hourangles object with two arrays for morning and afternoon
    // use hourangles to draw and rotate ticks
    // rotate around z axis based on hourangles starting from 12pm 
    // and working out by morning and afternoon        

    var hourstart = 7;
    var hourangles = calculateHourAngles(thislatitude, hourstart); 
    var hours = [];

    // noon
    var thishourquat = quatFromAxisAngle(0,0,1,0);
    var thishour = makeRect(canvas.width/20.0, 0.5, 0.5);
    thishour = transformObject(thishour,-canvas.width/3,0,0);
    thishour = rotateObject(thishour,thishourquat);    
    thishour.color="green";
    hours.push(thishour);

    for (i = 0; i < hourangles.count; i++) {

        // morning
        var thishourquat = quatFromAxisAngle(0,0,1,hourangles.morning[i]);
        var thishour = makeRect(canvas.width/20.0, 0.5, 0.5);
        thishour = transformObject(thishour,-canvas.width/3,0,0);
        thishour = rotateObject(thishour,thishourquat);
        thishour.color="red";
        hours.push(thishour);

        // afternoon
        var thishourquat = quatFromAxisAngle(0,0,1,hourangles.afternoon[i]);
        var thishour = makeRect(canvas.width/20.0, 0.5, 0.5);
        thishour = transformObject(thishour,-canvas.width/3,0,0);
        thishour = rotateObject(thishour,thishourquat);
        thishour.color="blue";
        hours.push(thishour);
    }

    return hours;
}

function updateHeadingNorth(thisobject, thisheading, thisoffsetx) {

    // takes a 3d object and performs orientation in relation to north
    // uses geolocation if available and otherwise defaults to 0° offset

    var thisquat = quatFromAxisAngle(0,0,1,degToRad(thisheading));    
    thisobject = transformObject(thisobject,-thisoffsetx,0,0);
    thisobject = rotateObject(thisobject,thisquat);
    thisobject = transformObject(thisobject,thisoffsetx,0,0);
    console.log(thisheading);
    return thisobject;
}

hourAxis.color="#FF0000";
minAxis.color="#00CC00";
secAxis.color="#0000FF";
cube.color="yellow";
gnomon.color="purple";
shadow.color="black";

var debugTriangle=makeTriangle(100,100,100);
debugTriangle.color="black";



function renderLoop() {

    var now = new Date();
    var seconds = ((now.getHours() * 60 + now.getMinutes()) * 60) + now.getSeconds();

    // requestAnimationFrame( renderLoop ); //better than set interval as it pauses when browser isn't active
    context.clearRect( -canvas.width/2, -canvas.height/2, canvas.width, canvas.height);

    // animate hours
    if (rendercount < latitude && animate) 
        hours = updateHours(rendercount);

    // animate gnomon
    if (rendercount < latitude && animate) 
        gnomon = updateGnomon(rendercount);

    // animate shadow
    if (rendercount*1500 < seconds && animate) 
        shadow = updateShadow(rendercount*1500);
    else 
        shadow = updateShadow(seconds);

    if (animategyro) {
        // animate gryo
        if ((rendercount < latitude) || fakegyro) {
            if(!( window.DeviceOrientationEvent && 'ontouchstart' in window) && (simulateGyro)) {
    	        this.fakeAlpha = (this.fakeAlpha || 0)+ .0;//z axis - use 0 to turn off rotation
	            this.fakeBeta = (this.fakeBeta || 0)+ .7;//x axis
	            this.fakeGamma = (this.fakeGamma || 0)+ .5;//y axis
    	        processGyro(this.fakeAlpha,this.fakeBeta,this.fakeGamma);
            }
        }
    }

    // renderObj(cube,quaternionMultiply([inverseQuaternion(gyro),userQuat]));

    // renderObj(hourAxis,inverseQuaternion(gyro));
    // renderObj(minAxis,inverseQuaternion(gyro));
    // renderObj(secAxis,inverseQuaternion(gyro));
    // renderObj(secAxis,quaternionMultiply([inverseQuaternion(gyro),userQuat]));
    // renderObj(secAxis,userQuat);
    // renderObj(hourAxis,quaternionMultiply([inverseQuaternion(gyro),inverseQuaternion(gyro), inverseQuaternion(gyro)]));
    renderObj(hourAxis,quaternionMultiply([inverseQuaternion(gyro),userQuat]));
    // renderObj(minAxis,quaternionMultiply([inverseQuaternion(gyro),inverseQuaternion(gyro), userQuat]));
    renderObj(minAxis,quaternionMultiply([inverseQuaternion(gyro),inverseQuaternion(gyro), inverseQuaternion(gyro), inverseQuaternion(gyro), userQuat]));
    renderObj(secAxis,quaternionMultiply([inverseQuaternion(gyro),inverseQuaternion(gyro), inverseQuaternion(gyro), userQuat]));

    // quaternion rotations should be applied in opposite order
    // order of individual rotation matters -- generally z > y > x
    // and that is taken care of within the quaternion rotation functions
    // here the last rotation (the internal gyroscope) is applied first
    // and the first, which simply locates the gnomon, is applied last
    // the userQuat is what has been adjusted with touch or mouse events by user

    renderObj(gnomon,quaternionMultiply([inverseQuaternion(gyro),userQuat]));
    // renderObj(shadow,quaternionMultiply([inverseQuaternion(gyro),userQuat]));
    // renderObj(updateShadow(now),quaternionMultiply([inverseQuaternion(gyro),userQuat]));
    // renderObj(updateShadow(seconds),quaternionMultiply([inverseQuaternion(gyro),userQuat]));
    renderObj(shadow,quaternionMultiply([inverseQuaternion(gyro),userQuat]));

    for (i = 0; i < hours.length; i++) {
        renderObj(hours[i],quaternionMultiply([inverseQuaternion(gyro),inverseQuaternion(gyro),userQuat]));
        // renderType(hours[i],quaternionMultiply([inverseQuaternion(gyro),inverseQuaternion(gyro),userQuat]));
    }

    // renderObj(debugTriangle, userQuat);

    rendercount ++;
}

// using setInterval instead of manual approach suggested

// renderLoop();

renderTimer = window.setInterval(renderLoop, 1000/20);












// 6. utility

function normalize (val, min, max) {
    // remap value to range [0-1] 
    return (val - min) / (max - min); 
}

function map (value, currentmin, currentmax, targetmin, targetmax) {
    // remap value to new range
    return (value - currentmin) * ((targetmax-targetmin) / (currentmax-currentmin)) + targetmin;
}


// 7. dev sunrise sunset

// var times = SunCalc.getTimes(new Date(), latitude, -0.1);
var times = SunCalc.getTimes(new Date(), 51.3, -0.1);
var sunrise = times.sunrise.getHours() + ':' + times.sunrise.getMinutes();
var sunset = times.sunset.getHours() + ':' + times.sunset.getMinutes();

console.log("+++++++++++");
console.log(times);
console.log(sunrise);
console.log(sunset);


