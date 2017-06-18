<style>
	/* page specific + overrides */

	canvas { 
		margin: 0px;
		/* width: 100%;*/
		/* height: 100%; */
		position: fixed;
		top:0px;
	}

	#status {		  
		position:fixed;
		top:10px;
		left:10px;
        margin-right:10px;        
		color:#CCC;
	}

    #status-source {
        visibility: hidden;
        display: none;
    }

	#gyroscope {
		position:fixed;
		bottom:10px;
		right:10px;
		width:120px;
		visibility: hidden;
		color:#333;
	}

	#geolocate {
		position:fixed;
		bottom:10px;
		left:10px;
		visibility: hidden;
		color:#333;
	}

</style>


<div id="status">
    <div id="status-display"></div>
    <div id="status-source">
        . . . . . . . . . . . . . . . . .        
        . . . . . . . . . . . . . . . . .        
        . . . . . . . . . . . . . . . . .        
        . . . . . . . . . . . . . . . . .        
        . . . . . . . . . . . . . . . . .        
        . . . . . . . . . . . . . . . . .        
        . . . . . . . . . . . . . . . . .        
        . . . . . . . . . . . . . . . . .        
        . . . . . . . . . . . . . . . . .        
        . . . . . . . . . . . . . . . . .        
        . . . . . . . . . . . . . . . . .        
        . . . . . . . . . . . . . . . . .        
        . . . . . . . . . . . . . . . . .        
        . . . . . . . . . . . . . . . . .        
        . . . . . . . . . . . . . . . . .        
        . . . . . . . . . . . . . . . . .        
        . . . . . . . . . . . . . . . . .        
        . . . . . . . . . . . . . . . . .        
        . . . . . . . . . . . . . . . . .        
        . . . . . . . . . . . . . . . . .        
        . . . . . . . . . . . . . . . . .        
        . . . . . . . . . . . . . . . . .        
        . . . . . . . . . . . . . . . . .        
        . . . . . . . . . . . . . . . . .        
        . . . . . . . . . . . . . . . . .        
        . . . . . . . . . . . . . . . . .        
    </div>
</div>
    
<div id="geolocate">
	<!--
    X: <span id="userX"></span><br />
    Y: <span id="userY"></span><br />
    -->
	<span id="geolocatelatitude"></span><br />
</div>

<div id="gyroscope">
	&alpha;: <span id="gyroscopealpha"></span><br />
	&beta;: <span id="gyroscopebeta"></span><br />
	&gamma;: <span id="gyroscopegamma"></span><br />
    <!--
	x: <span id="x">x</span><br />
	y: <span id="y">y</span><br />
	z: <span id="z">z</span><br />
	w: <span id="w">w</span><br /> 
    -->
</div>

<canvas id="serverdialcanvas"></canvas>

<script src='static/js/suncalc/suncalc.js'></script>
<script src='static/js/animate-message.js'></script>
<script src='static/js/serverdial.js'></script>
<script>
    // (...) is a self-invoking function
    ( function () {
        init();
        initMessage("status-source","status-display",true,40);
    } )();
</script>
