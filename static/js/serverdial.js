// adapted from http://www.asterixcreative.com/blog-mobile-gyroscope-with-javascript-and-quaternions-programming-tutorial-pt1.html
// requires suncalc, a js library https://github.com/mourner/suncalc for sunrise, sunset calculations

// serverdial is simply a computer model of a future sundial
// specific to the exact geolocation and gyroscope of the device used to view it
// but using an NTP instead of the sun to produce the shadow (time)

// gnomon angle adjusts with user's latitude
// number displacement on the dial adjusts with user's latitude
// fonts -- either roman numerals or else data points for mtdbt2f numbers

// globals

var showinfo;	
var animate = true;
var simulategyro = true;
var rendercount = 0;
var debug = false;

var latitude;     
var headingnorth;           
var geolocateable;
var gyroscopeable;
    
var canvas;
var context;
var status;
var statussource;
var statusdisplay;
var geolocate;
var geolocatelatitude;
var gyroscope;
var gyroscopealpha;
var gyroscopebeta;
var gyroscopegamma;
var maxheightorwidth;

var gyro;
var userQuat;
var prevTouchX;
var prevTouchY;

var xaxis;
var yaxis;
var zaxis;
var gnomon;
var shadow;
var hours;

var rendertimer;
var updatestatustimer;

var sun;


// 0. init, setup, start

function init () {

    // get latitude, heading north
    // callback to setPosition which starts setup()
    // otherwise, use default latitude and do setup()

    // get div objects
    status = document.getElementById("status");
    statussource = document.getElementById("status-source");
    statusdisplay = document.getElementById("status-display");
    geolocate = document.getElementById("geolocate");
    geolocatelatitude = document.getElementById("geolocatelatitude");
    gyroscope = document.getElementById("gyroscope");
	gyroscopealpha = document.getElementById("gyroscopealpha");
	gyroscopebeta = document.getElementById("gyroscopebeta");
	gyroscopegamma = document.getElementById("gyroscopegamma");
    canvas = document.getElementById('serverdialcanvas');

    if (navigator.geolocation) {
        // setPosition calls setup() when finished
        // could do a proper callback ** fix **
        navigator.geolocation.getCurrentPosition(setPosition, showError);
    } else {
        geolocatelatitude.innerHTML = "Geolocation is not supported in this browser.";
        setup();
    }


    // gyroscope

    gyro = quatFromAxisAngle(0,0,0,0);

    if (window.DeviceOrientationEvent) {            
    // if(!( window.DeviceOrientationEvent && 'ontouchstart' in window)) {
        gyroscopeable = true;
        window.addEventListener("deviceorientation", function () {
            processGyro(event.alpha, event.beta, event.gamma); 
        }, true);
    } 

    // event listeners

    userQuat = quatFromAxisAngle(0,0,0,0);//a quaternion to represent the users finger swipe movement - default is no rotation
    prevTouchX = -1; // -1 is flag for no previous touch info
    prevTouchY = -1;

    // prevent rubberband scrolling
    document.ontouchstart = function(e){ 
        e.preventDefault(); 
    }

    document.addEventListener("touchstart", touchStartFunc, true);
    document.addEventListener("touchmove", touchmoveFunc, true);
    document.addEventListener("touchend", touchEndFunc, true);
    document.addEventListener("mousedown", mouseDownFunc, true);
    document.addEventListener("mousemove", mouseMoveFunc, true);
    document.addEventListener("mouseup", mouseUpFunc, true);

    // canvas    

    context = canvas.getContext('2d');
    context.canvas.width  = window.innerWidth; // resize canvas to whatever window dimensions are
    context.canvas.height = window.innerHeight;
    context.translate(canvas.width / 2, canvas.height / 2); // move origin to center of screen
    context.fillStyle = "#EEE";

    if ( context.canvas.width > context.canvas.height ) 
        maxheightorwidth = context.canvas.height;
    else 
        maxheightorwidth = context.canvas.width;

    // setup() is called from setPosition or else from above if geolocation fails
}

function setup () {

    if (!latitude) latitude = 56.1629;          // default to aarhus
    if (!headingnorth) headingnorth = 30.0000;

    updateStatus("Currently . . . " + latitude + "&deg;");

    // populate stage
    
    xaxis = makeArcWithTriangle(maxheightorwidth/1.5,maxheightorwidth/1.5,0);
    yaxis = makeArcWithTriangle(maxheightorwidth/1.5,maxheightorwidth/1.5,0);
    zaxis = makeArcWithTriangle(maxheightorwidth/1.5,maxheightorwidth/1.5,0);

    gnomon = updateGnomon(latitude);
    hours = updateHours(latitude);
    shadow = updateShadow(latitude, 0);   
                
    xaxis.color = "#FF0000";
    yaxis.color = "#00CC00";
    zaxis.color ="#0066FF";
    gnomon.color = "#009999";
    hours.color = "#00FF00";

    // sun?
    sun = checkSun(new Date(), latitude);   // should be in update()?   

    if (window.self)
        start();
}

function start() {

    renderTimer = window.setInterval(renderLoop, 1000/20);
}


// 1. 3d data

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


// 2. geometry

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

	return newObj;
}

function calculateHourAngles(thislatitude, thisstarthour) {

    // find the angles of offset from gnomon for hour ticks
    // return object with two arrays of angle values in radians
    // morning and afternoon ordered by offset from 12pm
    // based on http://www.crbond.com/papers/sundial.pdf
    // atan takes a value (ratio) and returns an angle in radians
    // sin, tan take an angle in radians return a value (ratio)
    
    var angleincrement = 15;
    var thishourangles = {};
    thishourangles.morning = [];
    thishourangles.afternoon = [];
    thishourangles.count = (12 - thisstarthour);

	for(var i = 0; i < thishourangles.count; i++) {        
        
        // three angles as per sundial.pdf
        // lamda is angle of gnomon ( = latitude )
        // omega is angle of rotation around gnomon ( 15° = 1 hour )
        // theta is angle of offset of omega projected to ground plane
        // if omega > 90° then triangle turns the other way
        // so inverse omega's value by subtracting 180°
        // 90° = Math.PI/2
 
        var morning = Math.atan(Math.sin(degToRad(thislatitude)) * Math.tan(degToRad(-angleincrement)));
        var afternoon = Math.atan(Math.sin(degToRad(thislatitude)) * Math.tan(degToRad(angleincrement)));

        if (morning > 0) morning -= Math.PI;
        thishourangles.morning.push(morning);

        if (afternoon < 0) afternoon += Math.PI;
        thishourangles.afternoon.push(afternoon);

        angleincrement += 15;
    }
    
    /*
    if (debug && rendercount < 1) {
        console.log(rendercount);
        console.log(thisstarthour);
        console.log(thishourangles.morning);
        console.log(thishourangles.afternoon);
    }
    */

	return thishourangles;
}

function calculateShadowAngle(thislatitude, thisseconds) {

    // find the angle of offset for the shadow based on current time
    // where now is currenttime in seconds and is mapped into range 0-360°
    // morning and afternoon can animate separately from 12pm
    // return object with current value in radians and am/pm flag
    // based on http://www.crbond.com/papers/sundial.pdf
    // atan takes a value (ratio) and returns an angle in radians
    // sin, tan take an angle in radians return a value (ratio)

    var thisshadowangle = {};
    var omega = map(thisseconds,0,86400,0,360);
    if (omega < 180)
        thisshadowangle.am = true;

    // three angles as per sundial.pdf
    // lamda is angle of gnomon ( = latitude )
    // omega is angle of rotation around gnomon ( 15° = 1 hour )
    // theta is angle of offset of omega projected to ground plane
    // if omega > 90° then triangle turns the other way
    // so inverse omega's value by subtracting 180°
    // 90° = Math.PI/2

    thisshadowangle.radians = Math.atan(Math.sin(degToRad(thislatitude)) * Math.tan(degToRad(omega)));

    // ** fix ** logic problem here to do with getting accurate time displayed as shadow
    // if (thisshadowangle.radians < 0) thisshadowangle.radians += Math.PI;

    // if (thisshadowangle.radians < 0) thisshadowangle.radians += Math.PI/2;
    if (thisshadowangle.radians < 0) thisshadowangle.radians += Math.PI;

    if (debug && rendercount < 40) {
       console.log(rendercount + " : " + thisshadowangle.radians);
       // console.log(radToDeg(thisshadowangle.radians));
    }
/*
    if (debug && rendercount < 1) {
        console.log(rendercount);
        console.log(thisstarthour);
        console.log(thishourangles.morning);
        console.log(thishourangles.afternoon);
    }
*/
	return thisshadowangle;
}


// 3. user input

function touchStartFunc(e) {
	prevTouchY=e.touches[0].clientY;
	prevTouchX=e.touches[0].clientX;
    showInformation();
}

function touchmoveFunc(e) {
	if( navigator.userAgent.match(/Android/i) ) //stupid android bug cancels touch move if it thinks there's a swipe happening
	{   
	  e.preventDefault();
	}
	userXYmove(e.touches[0].clientX,e.touches[0].clientY);
}

function touchEndFunc(e) {
  prevTouchX = -1;
  prevTouchY = -1;
}

function mouseDownFunc(e) {
  prevTouchX = e.clientX;
  prevTouchY = e.clientY;
  showInformation();
}

function mouseMoveFunc(e) {
	if (prevTouchX!= -1)
		userXYmove(e.clientX,e.clientY);
}

function mouseUpFunc(e) {
  prevTouchX = -1;
  prevTouchY = -1;
}
	
function userXYmove(x,y) {	
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

function showInformation () {
	if (gyroscope.style.visibility=='hidden') {
		geolocate.style.visibility='visible';
		gyroscope.style.visibility='visible';
		showinfo = true;
		return true;
	} else {
		geolocate.style.visibility='hidden';
        gyroscope.style.visibility='hidden';
		showinfo = false;
		return false;
	}
}


// 4. rendering 

function updateGnomon(thislatitude) {

    // construct gnomon with angle = latitude
    // -90° < latitude < 90° (absolute value within range 0-90°)
    // combine two quaternions by multiplication, last transformation first

    var thisgnomon = makeRect(4.0, maxheightorwidth/3.0, 4.0);
    var angle = Math.abs(thislatitude);
    var thisgnomonquatx = quatFromAxisAngle(1,0,0,degToRad(angle));    
    var thisgnomonquatz = quatFromAxisAngle(0,0,1,-degToRad(headingnorth));    
    thisgnomonquat = quaternionMultiply([thisgnomonquatz, thisgnomonquatx]);
    thisgnomon = transformObject(thisgnomon,0, maxheightorwidth/6.0,0);    // move to origin
    thisgnomon = rotateObject(thisgnomon,thisgnomonquat);
    thisgnomon.color = "#990099";

    return thisgnomon;
}

function updateShadow(thislatitude, thisseconds) {

    // update shadow based on current time
    // rotate around z-axis using quaternion derived from axis angle 
    // combine two quaternions by multiplication, last transformation first
    // one for current time, one for heading north

    var thisshadow = makeRect(1.0, maxheightorwidth/3.0, 0.0);
    var shadowangle = calculateShadowAngle(thislatitude, thisseconds);
    // ** fix ** this is a hack way to set the numbers straight but works
    if (shadowangle.am)
        shadowangle.radians -= Math.PI;
    var thisshadowquattime = quatFromAxisAngle(0,0,1,-shadowangle.radians);
    var thisshadowquatnorth = quatFromAxisAngle(0,0,1,-degToRad(headingnorth));    
    var thisshadowquat = quaternionMultiply([thisshadowquatnorth, thisshadowquattime]);
    thisshadow = transformObject(thisshadow,0,maxheightorwidth/6.0,0);
    thisshadow = rotateObject(thisshadow,thisshadowquat);
    thisshadow.color = "#FFFFFF";

    return thisshadow;
}

function updateHours(thislatitude) {

    // build hourangles object with two arrays for morning and afternoon
    // use hourangles to draw and rotate ticks
    // rotate around z axis based on hourangles starting from 12pm 
    // and working out by morning and afternoon        

    var starthour = 4;
    var hourangles = calculateHourAngles(thislatitude, starthour); 
    var hours = [];

    // noon

    var thishour = makeRect(0.5, maxheightorwidth/20.0, 0.5);
    var thisquatnoon = quatFromAxisAngle(0,0,1,0);
    var thisquatnorth = quatFromAxisAngle(0,0,1,-degToRad(headingnorth));    
    var thisquat = quaternionMultiply([thisquatnorth, thisquatnoon]);
    thishour = transformObject(thishour,0,maxheightorwidth/3,0);
    thishour = rotateObject(thishour,thisquat);    
    // thishour.color = "#990099";
    thishour.color = "green";
    hours.push(thishour);

    for (i = 0; i < hourangles.count; i++) {

        // morning
        var thishour = makeRect(0.5, maxheightorwidth/20.0, 0.5);
        var thisquathour = quatFromAxisAngle(0,0,1,hourangles.morning[i]);
        var thisquatnorth = quatFromAxisAngle(0,0,1,-degToRad(headingnorth));    
        var thisquat = quaternionMultiply([thisquatnorth, thisquathour]);
        thishour = transformObject(thishour,0,maxheightorwidth/3,0);
        thishour = rotateObject(thishour,thisquat);
        thishour.color = "red";
        hours.push(thishour);

        // afternoon
        var thishour = makeRect(0.5, maxheightorwidth/20.0, 0.5);
        var thisquathour = quatFromAxisAngle(0,0,1,hourangles.afternoon[i]);
        var thisquatnorth = quatFromAxisAngle(0,0,1,-degToRad(headingnorth));    
        var thisquat = quaternionMultiply([thisquatnorth, thisquathour]);
        thishour = transformObject(thishour,0,maxheightorwidth/3,0);
        thishour = rotateObject(thishour,thisquat);
        // thishour.color = "blue";
        thishour.color = "#06F";
        hours.push(thishour);
    }

    return hours;
}

function updateStatus(thismessage, callback) {

    // check to see if ready for next message
    // if not, then setinterval to check again
    // until it is ready
    // animatemessageready is a boolean in animate-message.js

    updatestatustimer = null;

    if (animatemessageready) {

        updateMessage("status-source", "status-display", thismessage, true, 40);
        if (callback)
            callback();
        return true;
    } else {
 
        updatestatustimer = window.setInterval(function() { updateStatus(thismessage); }, 1000/20);
        return false;
    }
}

function renderObj(obj,q) {

	var rotatedObj = rotateObject(obj,q);
	// context.lineWidth = 3.0;    // [1.0] 4.0
	context.lineWidth = maxheightorwidth / 300;
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
            else if (showinfo)      
                context.lineTo(scaleByZ(vertexTo[0],vertexTo[2]), ( -scaleByZ(vertexTo[1],vertexTo[2])));
            */

            context.stroke();		    
		}
	}
}

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

function renderLoop() {

    var now = new Date();
    var seconds = ((now.getHours() * 60 + now.getMinutes()) * 60) + now.getSeconds();

    // requestAnimationFrame( renderLoop ); // better than set interval as it pauses when browser isn't active
    context.clearRect( -canvas.width/2, -canvas.height/2, canvas.width, canvas.height);

    // animate hours
    if (rendercount < latitude && animate) 
        hours = updateHours(rendercount);

    // animate gnomon
    if (rendercount < latitude && animate) 
        gnomon = updateGnomon(rendercount);

    // animate shadow
    // ** fix ** this animate number is rando
    if (rendercount * 1500 < seconds * 3 && animate) 
        shadow = updateShadow(latitude, rendercount*1500);
    else 
        shadow = updateShadow(latitude, seconds);       

    // animate gryo
    if (simulategyro) {
        // if ((rendercount < latitude)) {
            if(!( window.DeviceOrientationEvent && 'ontouchstart' in window)) {
    	        this.fakeAlpha = (this.fakeAlpha || 0)+ .0;//z axis - use 0 to turn off rotation
       	        this.fakeBeta = (this.fakeBeta || 0)+ .7;//x axis
                this.fakeGamma = (this.fakeGamma || 0)+ .5;//y axis
    	        processGyro(this.fakeAlpha,this.fakeBeta,this.fakeGamma);
                if (gyroscopeable) 
                    gyroscopeable = false;
            }
        // }
    }

    renderObj(xaxis,quaternionMultiply([inverseQuaternion(gyro),userQuat]));
    renderObj(yaxis,quaternionMultiply([inverseQuaternion(gyro),inverseQuaternion(gyro), inverseQuaternion(gyro), inverseQuaternion(gyro), userQuat]));
    renderObj(zaxis,quaternionMultiply([inverseQuaternion(gyro),inverseQuaternion(gyro), inverseQuaternion(gyro), userQuat]));

    // quaternion rotations should be applied in opposite order
    // order of individual rotation matters -- generally z > y > x
    // and that is taken care of within the quaternion rotation functions
    // here the last rotation (the internal gyroscope) is applied first
    // and the first, which simply locates the gnomon, is applied last
    // the userQuat is what has been adjusted with touch or mouse events by user

    renderObj(gnomon,quaternionMultiply([inverseQuaternion(gyro),userQuat]));
    if (sun)
        renderObj(shadow,quaternionMultiply([inverseQuaternion(gyro),userQuat]));

    for (i = 0; i < hours.length; i++) {
        renderObj(hours[i],quaternionMultiply([inverseQuaternion(gyro),inverseQuaternion(gyro),userQuat]));
        // renderType(hours[i],quaternionMultiply([inverseQuaternion(gyro),inverseQuaternion(gyro),userQuat]));
    }

    if (rendercount && rendercount == 150)
        updateStatus("** ready **");

    if (!gyroscopeable && rendercount && rendercount % 300 == 0 )
        updateStatus("Please visit http://www.serverdial.org on a phone or tablet.");

    rendercount ++;
}


// 5. utility

function normalize (val, min, max) {
    // remap value to range [0-1] 
    return (val - min) / (max - min); 
}

function map (value, currentmin, currentmax, targetmin, targetmax) {
    // remap value to new range
    return (value - currentmin) * ((targetmax-targetmin) / (currentmax-currentmin)) + targetmin;
}

function processGyro(alpha,beta,gamma) { 	
	gyro = computeQuaternionFromEulers(alpha,beta,gamma);
    gyroscopealpha.innerHTML = alpha.toFixed(5);
    gyroscopebeta.innerHTML = beta.toFixed(5);
    gyroscopegamma.innerHTML = gamma.toFixed(5);
}

function setPosition(position) {
    latitude = position.coords.latitude.toFixed(4);
    if (position.coords.heading)
        headingnorth = position.coords.heading.toFixed(4);
    geolocatelatitude.innerHTML = latitude + "&deg;";
    setup();
}

function showError(error) {
    switch(error.code) {
        case error.PERMISSION_DENIED:
            geolocatelatitude.innerHTML = "User denied request for Geolocation."
            break;
        case error.POSITION_UNAVAILABLE:
            geolocatelatitude.innerHTML = "Location information unavailable."
            break;
        case error.TIMEOUT:
            geolocatelatitude.innerHTML = "Request for user location timed out."
            break;
        case error.UNKNOWN_ERROR:
            geolocatelatitude.innerHTML = "Unknown error occurred."
            break;
    }
    setup();
}

function checkSun(now, thislatitude) {

    // sunrise sunset
    // using suncalc library to get sunrise and sunset based on latitude
    var times = SunCalc.getTimes(now, thislatitude, -0.1);
    var sunrise = times.sunrise;
    var sunset = times.sunset;
    if (sunrise < now && now < sunset)
        sun = true;
    else 
        sun = false;

    updateStatus("Sunrise: " + sunrise + " Sunset: " + sunset);

    if (debug) {
        console.log(sunrise);
        console.log(now);
        console.log(sunset);
        console.log(sun);
    }

    return sun;
}
