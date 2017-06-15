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
		/* visibility: hidden; */
		color:#333;
	}

	#gyroInfo {		  
		position:fixed;
		top:100px;
		left:10px;
		visibility: hidden;
		color:#333;
	}

	#quatInfo {
		position:fixed;
		bottom:10px;
		right:10px;
		width:120px;
		visibility: hidden;
		color:#333;
	}

	#geoInfo {
		position:fixed;
		bottom:10px;
		left:10px;
		visibility: hidden;
		color:#333;
	}

    #ticker-display,
    #ticker-source {
        color: #F00;
    }

    #ticker-wrapper {
    }

</style>


<div id="status">
    <span id="cursor">|</span>
</div>

<div id="gyroInfo">		
</div>
    
<div id="quatInfo">
	&alpha;: <span id="alpha"></span><br />
	&beta;: <span id="beta"></span><br />
	&gamma;: <span id="gamma"></span><br />
    <!--
	x: <span id="x">x</span><br />
	y: <span id="y">y</span><br />
	z: <span id="z">z</span><br />
	w: <span id="w">w</span><br /> 
    -->
</div>
    
<div id="geoInfo">
	<!--
    X: <span id="userX"></span><br />
    Y: <span id="userY"></span><br />
    -->
	<span id="latitude"></span><br />
</div>

<div id="geoInfo">
	<!--
    X: <span id="userX"></span><br />
    Y: <span id="userY"></span><br />
    -->
	<span id="latitude"></span><br />
</div>

<div id="ticker-wrapper">
    <div id="ticker-display"></div>
    <div id="ticker-source" class="hidden">
        This is a test. This is only a test. <span id="cursor">|</span>    
    </div>
</div>

<div id="ticker-wrapper">
    <div id="ticker-display"></div>
    <div id="ticker-source" class="hidden">
        This is a test. This is only a test. <span id="cursor">|</span>    
    </div>
</div>

<canvas id="gyroCanvas"></canvas>

<script src='static/js/suncalc/suncalc.js'></script>
<script src='static/js/animate-message.js'></script>
<script src='static/js/serverdial.js'></script>
<script>
    // (...) is a self-invoking function
    ( function () {
        init ();
        // document.onload = 
        initMessage("ticker-source","ticker-display",true,40);
        // initMessage("ticker-source","status",true,40);

    // update the ticker
    // document.getElementById("ticker-source").innerHTML = "and also";
    // document.getElementById("ticker-source").innerHTML = "and also";
    // initMessage("ticker-source","ticker-display",true,40);
    // need to add a clear message display method in animatemessage.js

    } )();
</script>


<!--
// animate-message related
// how to do blinking cursor?
        
animate = true;            
tickerDelay = 40;
-->
