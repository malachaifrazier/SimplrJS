(function() {
	
	var ViewData = {};
	
	Simplr.View = {
		mAddViews : function(obj) {
			for(var key in obj) {
				var newView = $.extend(true, {}, { 
					html : function(data) { return ""; }, 
					callback : function(selector, data) {} 
				}, obj[key]);
				ViewData[key] = newView;
			}
		},
		mGetViews : function() {
			return ViewData;
		},
		mRender : function(options) {
			var tmp = $.extend({ name : "", data: "", selector : ""}, options);
			$(tmp.selector).html(ViewData[tmp.name].html(tmp.data));
			ViewData[tmp.name].callback(tmp.selector, tmp.data);
		}
	};
	
})();