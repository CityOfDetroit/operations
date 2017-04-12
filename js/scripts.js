$(document).ready(function(){

	$('ul.tabs li').click(function(){
		var tab_id = $(this).attr('data-tab');

		$('ul.tabs li').removeClass('current');
		$('.tab-content').removeClass('current');

		$(this).addClass('current');
		$("#"+tab_id).addClass('current');
	})

	$('input').click(function(){
		if(this.checked){
			map.setLayoutProperty(this.id, "visibility", "visible")
		}
		else{
			map.setLayoutProperty(this.id, "visibility", "none")
		}
	})

	$('.scrollbar-macosx').scrollbar();
	$('#only-one [data-accordion]').accordion({
		"transitionSpeed": 400
	});
})
