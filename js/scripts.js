$(document).ready(function(){

	//Tab Switch Function
	$('ul.tabs li').click(function(){
		var tab_id = $(this).attr('data-tab');

		$('ul.tabs li').removeClass('current');
		$('.tab-content').removeClass('current');

		$(this).addClass('current');
		$("#"+tab_id).addClass('current');
	});

	//Checklist Select Class Toggle
	$('.me-select-list li > input').click(function(){
		var $target_li = $(this).closest('li');
		if($target_li.hasClass('selected')){
			$target_li.removeClass('selected');
		}else{
			$target_li.addClass('selected');
		}
	});

	$('.scrollbar-macosx').scrollbar();
	/*$('#only-one [data-accordion]').accordion({
		"transitionSpeed": 400
	});*/
})
