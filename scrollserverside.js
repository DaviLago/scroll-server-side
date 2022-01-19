(function($) {
	$.fn.mdb_autocompleteServerSide = function (options) {

		var defaults = {
			url: "",
			columnName: "name",
			searchMethod: "like",
			containerHeight: 210,
			limit: 20,
			displayBuffer: 1
		};		

		options = $.extend(defaults, options);
		var ENTER_CHAR_CODE = 13;
		
		return this.each(function () {

			//elements
			var $input = $(this);
			var $clearButton = $input.siblings("button");
			var $container = $("<div class='mdb-autocomplete-server-side-container'></div>").insertAfter($input);
			var $autocomplete = $('<ul class="mdb-autocomplete-server-side-wrap"></ul>').appendTo($container);
			var $relativeHeight = $("<div style='position: relative; top: 0px; left: 0px; width: 1px;'></div>").appendTo($container);

			//variables
			var offset = 0;
			var limit = options.limit;				    	
			var loadPointDown;
			var loadPointUp;
			var loadPointIncrement;
			var rowHeight;
			var containerHeight = options.containerHeight;
			var columnName = options.columnName;
			var searchMethod = options.searchMethod;
			var displayBuffer = options.displayBuffer;
			var scrollTopLines;

			//sets maximum container height option
			$container.css("max-height", options.containerHeight);

			if($input.val().length)
				$clearButton.css('visibility', 'visible');

			//functions
			function getSearchQuery(){ //returns a search query fragment
				if($input.val().length)
					return columnName + "=" + searchMethod + ":" + $input.val();
				return "";
			}
			function calcRelativeHeight(resp){ //calculates the height of the sroller area
				var totalElements = resp.paging.totalElements;
				var rowHeight = $autocomplete.children(":first").outerHeight();
				return totalElements * rowHeight;
			}
			function replaceItens(data){ //replaces list data
				var $childrens = $autocomplete.children();
				for (var item in data) {
					if($($childrens.get(item)).length){
						$($childrens.get(item)).text(data[item]);
					}
					else{
						var option = $('<li>' + data[item] + '</li>');
						$autocomplete.append(option);
					}
				}
				item = $(data).length;
				while($($childrens.get(item)).length){
					$($childrens.get(item)).remove();
					item++;
				}
			}
			function initialServerRequest(){ //initializes the data list
				$.ajax({
					type: 'GET',
					url: options.url + "?" + getSearchQuery() + "&limit=" + limit
				}).done(function(resp){
					if(resp.data.length){
						$container.css('visibility', 'visible');
						replaceItens(resp.data.map(c => c.name));
						$relativeHeight.css("height", calcRelativeHeight(resp));
						$autocomplete.css("top", 0);
						$container.scrollTop(0);
					}
					else
						$container.css('visibility', 'hidden');
				});
			}
			function scrollServerRequest(){ //scroller request
				offset = (scrollTopLines - Math.floor((limit - (containerHeight / rowHeight)) / 2));
				offset = offset < 0 ? 0 : offset;
				$.ajax({
					type: 'GET',
					url: '../credentials/listmodel/offset?' + getSearchQuery() + '&offset='+ offset +'&limit='+ limit +'&order=asc&columnOrder=name'
				}).done(function(resp){
					if(resp.data.length){
						$container.css('visibility', 'visible');
						replaceItens(resp.data.map(c => c.name));
						$autocomplete.css("top", offset*rowHeight);
					}
					else
						$container.css('visibility', 'hidden');
				});
			}

			//events
			$input.focusin(function(e){
				initialServerRequest();
			})
			$input.focusout(function(e){
				setTimeout(function(){ 
					if($input.val().length){
						$input.siblings("label").addClass("active");
						$clearButton.css('visibility', 'visible');
					}
					$container.css('visibility', 'hidden');
				}, 150);
			});
			$input.keyup(function (e) {
				if(e.which != ENTER_CHAR_CODE)
					initialServerRequest();
				else {
					if($input.val().length && $container.css('visibility') == 'visible')
						$autocomplete.children(':first').trigger('click');
					$container.css('visibility', 'hidden');
					$input.blur();
				}
				if ($input.val().length === 0) {
					$clearButton.css('visibility', 'hidden');
				} else {
					$clearButton.css('visibility', 'visible');
				}
			});
			$input.keydown(function(event){
				if(event.keyCode == ENTER_CHAR_CODE) {
					event.preventDefault();
					return false;
				}
			});
			$autocomplete.on('click', 'li', function () {
				$container.css('visibility', 'hidden');
				$input.siblings('label').addClass('active');
				$input.val($(this).text());
			});
			$clearButton.on('click', function (e) {
				e.preventDefault();
				$(this).css('visibility', 'hidden');
				$input.val('');
				setTimeout(function(){ 
					$input.focus();
				}, 50);
			});
			$container.scroll(function (event) { //scroller event
				if(offset === 0){ //initializes the scroller variables
					rowHeight = $autocomplete.children(":first").outerHeight();
					var listHeight = rowHeight * limit;
					loadPointDown = Math.floor(((listHeight - containerHeight) / rowHeight) - displayBuffer);
					loadPointIncrement = loadPointDown;
				}
				//calculates the scrolled lines
				scrollTopLines = Math.floor(($(this).scrollTop() / rowHeight) - (Math.ceil(containerHeight/rowHeight) - (containerHeight/rowHeight)));
				
				if(scrollTopLines >= loadPointDown){ //load point when rolled down
					loadPointUp = (loadPointDown - 1) - Math.floor(loadPointIncrement/2) + displayBuffer;
					loadPointDown += (Math.ceil(loadPointIncrement/2));
					scrollServerRequest();
				}
				else if(scrollTopLines <= loadPointUp && loadPointUp != 0){ //load point when rolled up
					loadPointDown = (loadPointUp + 1) + Math.floor(loadPointIncrement/2) - displayBuffer;
					loadPointUp -= (Math.ceil(loadPointIncrement/2));
					scrollServerRequest();
				}
			});
		});
	};
})(jQuery);