(function($) {
	
	function convertTokenToString(value) {
		if(typeof value == "object") {
			return Cu.mAssembleLayout(value);
		}
		return value;
	};
	
	function loadLayoutComponent(component) {
		while( $(".layout-component", component).size() > 0 ) {
			loadLayoutComponent($(".layout-component:eq(0)", component));
		}
		var componentToLoad = {};
		componentToLoad[component.attr("id").split("-")[1]] = innerXHTML(component.get(0));
		Cu.mAddComponents(componentToLoad);
		component.remove();
	};
	
	function getComponent(key) {
		if(typeof data.components[key] == "undefined") {
			var layoutEl = $("#layout-"+key);
			if( layoutEl.size() > 0 ) {
				loadLayoutComponent($("#layout-"+key));
			} else {
				data.components[key] = null;
			}
		}
		return data.components[key];
	};
	
	var data = {
		components : {}	,
		globalTokens : {}
	};
	
	$.extend(simplr, {
		layout : {
			
			mAddComponents : function(obj) {
				for(var key in obj) {
					data.components[key] = $.trim(obj[key].replace(/\n/g,"").replace(/\s{1,}/g," "));
				}
			},
			
			mAssembleLayout : function(config) {
				var finalResults = "";
				if( config ) {
					if( config.component && config.tokens) {
						var tokenCollections = $.isArray(config.tokens) ? config.tokens : [ config.tokens ];
						for(var i = 0, iL = tokenCollections.length; i < iL; i++) {
							var tmpTokens = {};
							for(var tKey in tokenCollections[i]) {
								tmpTokens[tKey] = convertTokenToString(tokenCollections[i][tKey]);
							}
							finalResults += Cu.mReplaceTokens(tmpTokens, Cu.mGetComponent(config.component));
						}
					}
				}
				return finalResults;
			},
			
			mGetComponent : function(key) {
				return getComponent(key);
			},
			
			mGetComponents : function() {
				return data.components;
			},
			
			mAddGlobalTokens : function(globalTokens) {
				$.extend(data.globalTokens, globalTokens);
			},
			
			mReplaceTokens : function(keys, string) {
				if(string != null) {
					$.extend(keys, data.globalTokens);
					for(var token in keys) {
						string = string.replace(new RegExp("\\$\\[" + token + "\\]", "g"), escape(keys[token]));
					}
				}
				return unescape(string);
			}
		}
	});
	
	var Cu = simplr.layout;
	
})(jQuery);