$(document).ready(function(){

	//Tab Switch Function
	$('ul.tabs li').click(function(){
		var tab_id = $(this).attr('data-tab');

		$('ul.tabs li').removeClass('current');
		$('.tab-content').removeClass('current');

		$(this).addClass('current');
		$("#"+tab_id).addClass('current');
	});



	$('.scrollbar-macosx').scrollbar();
	/*$('#only-one [data-accordion]').accordion({
		"transitionSpeed": 400
	});*/
})
