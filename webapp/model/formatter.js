sap.ui.define([], function () {
	"use strict";

	return {
		/**
		 * Rounds the number unit value to 2 digits
		 *
		 * @public
		 * @param {string} sValue the number string to be rounded
		 * @returns {string} sValue with 2 digits rounded
		 */

		/**
		 * Defines a value state based on the price
		 *
		 * @public
		 * @param {number} iPrice the price of a post
		 * @returns {string} sValue the state for the price
		 */
         icon:function(MsgType){
            if (MsgType === "S") {
				return "sap-icon://sys-enter-2";
			} else if (MsgType === "E" || MsgType === "A") {
				return "sap-icon://error";
			} else if (MsgType === "W" || MsgType === "I") {
				return "sap-icon://alert";
			}
         },
		MsgState: function (MsgType) {
			if (MsgType === "S") {
				return "Success";
			} else if (MsgType === "E" || MsgType === "A") {
				return "Error";
			} else if (MsgType === "W" || MsgType === "I") {
				return "Warning";
			}			
		},
		DeliveryDategState:function(date){
			if (typeof date === "object" && date !== null) {
				return date.toLocaleDateString();
			} else if(date !== null){
				var dd = new Date(date);
				return dd.toLocaleDateString();
			}
		}

	};

});
