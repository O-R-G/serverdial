<?
// namespace stuff
use \Michelf\Markdown;

// 1. split into sections based by '++'
// 2. trim whitespace
// 3. convert from markdown to html
function process_body($b) {
	$columns = explode("++", $b);
	foreach($columns as &$b) {
		$b = trim($b);
		$b = Markdown::defaultTransform($b);
	}
	return $columns;
}
$objects = $oo->get($uu->id);
$body = $objects["body"];
$columns = process_body($body);
$media = $oo->media($uu->id);

if($show_menu) {
?><section id="body" class="hidden"><?
} else {
?><section id="body" class="visible"><?
}
	?><div id="breadcrumbs">
		<ul class="nav-level">
			<li><?
				if(!$uu->id)
				{
				?> O-R-G is a small software company.<a href="*">*&nbsp;</a><?
				}
				else
				{
				?><a href="<? echo $host.$a_url; ?>">O-R-G</a><?
				}
			?></li>
			<ul class="nav-level">
				<span><? echo $name; ?></span>
			</ul>
		</ul>
	</div><?
for($i = 0; $i < count($columns); $i++)
{
	if($i % 2 == 0)
	{
	?><div class="column-container-container"><?
	}
	?><div class="column-container"><? 
		echo $columns[$i];
		if ($showsubscribe)
		       require_once("views/subscribe.php");
		if($i == 0 && $media[0]) {
			$j = 0;
			// foreach($media as $m) {
				if ($media[$j]["type"] == "mp4") {
					// should fix this width in a css class, but in html element for now
					// add looping to the video tag
					// autoplay?
					?><div class="img-container">
						<video id="img-<? echo $j; ?>" width="100%" controls loop>
							<source src="<? echo m_url($media[$j]);?>" type="video/mp4">
						</video>
					</div><?
				} else {
					?><div class="img-container"><img id="img-<? echo $j; ?>" class="fullscreen" src="<? echo m_url($media[$j]);?>"></div><?
				}
				$j++;
			// }
		}
	?></div><?
	if($i % 2 == 1)
	{
	?></div><?
	}
} 
?></section>
<script type="text/javascript" src="<? 
echo $host; ?>static/js/screenfull.js"></script>	
<script>
	var fullscreens = document.getElementsByClassName('fullscreen');
	for (var i = 0; i < fullscreens.length; i++) {
    		( function () {
        		// ( closure ) -- retains state of local variables
        		// by making capturing context, here using j
        		// + listener wrapped in function to pass variable		
			var fullscreen = fullscreens[i];
        		fullscreen.addEventListener('click', function() {
					if (screenfull.enabled) {
						screenfull.toggle(fullscreen);
					}
        		});
    		})();
	}
</script>
