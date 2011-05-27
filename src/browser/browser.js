(function() {
	
	var browserData = {
		userAgent : ""
	};
	
	Simplr.Browser = {
	
		mAddressBarHeight : function() {
			var deviceID = Simplr.Browser.mDevice();
			return (deviceID == "iPhone" || deviceID == "iPod" || deviceID == "iPad") ? 60 : 0;
		},
		
		mDevice : function() {
			if(browserData.userAgent.match(/iPhone/i)) {
				return "iPhone";
			} else if(browserData.userAgent.match(/iPod/i) ) {
				return "iPod";
			} else if(browserData.userAgent.match(/iPad/i)) {
				return "iPad";
			} else if(browserData.userAgent.match(/Android/i)) {
				return "Android";
			}
			return "other";
		},

		mLocalStorageCapable : function() {
			return Simplr.Core.Util.mHasLocalStorage();
		},
		
		mSetUserAgent : function(uaString) {
			browserData.userAgent = uaString;
		},
		
		mTouchCapable : function() {
			var deviceID = Simplr.Browser.mDevice();
			return (deviceID == "iPhone") || (deviceID == "iPod") || (deviceID == "iPad") || (deviceID == "Android");
		}
			
	};
	
	Simplr.Browser.mSetUserAgent(navigator.userAgent);
	
})();
