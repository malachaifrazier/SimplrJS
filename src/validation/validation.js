Simplr.Validation = {
	mAddCodes : function(obj) {
		Simplr.Core.Validation.mAddCodes(obj);
	},
	mGetCodes : function() {
		return Simplr.Core.Validation.mGetCodes();
	},
	mAddValidators : function(obj) {
		Simplr.Core.Validation.mAddValidators(obj);
	},
	mGetValidators : function() {
		return Simplr.Core.Validation.mGetValidators();
	},
	mGetRuleResultsTemplate : function() {
		return Simplr.Core.Validation.mGetRuleResultsTemplate();
	},
	mGetCodeMessage : function(code, label) {
		return Simplr.Core.Validation.mGetCodeMessage(code, label);
	},
	mValidate : function(obj) {
		return Simplr.Core.Validation.mValidate(obj);
	}
};