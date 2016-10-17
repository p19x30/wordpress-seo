(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

/* global wp, _, wpseoPrimaryCategoryL10n */
(function ($) {
	"use strict";

	var primaryTermInputTemplate, primaryTermUITemplate, primaryTermScreenReaderTemplate;
	var taxonomies = wpseoPrimaryCategoryL10n.taxonomies;

	/**
  * Checks if the elements to make a term the primary term and the display for a primary term exist
  *
  * @param {Object} checkbox
  *
  * @returns {boolean}
  */
	function hasPrimaryTermElements(checkbox) {
		return 1 === $(checkbox).closest("li").children(".wpseo-make-primary-term").length;
	}

	/**
  * Retrieves the primary term for a taxonomy
  *
  * @param {string} taxonomyName
  * @returns {string}
  */
	function getPrimaryTerm(taxonomyName) {
		var primaryTermInput;

		primaryTermInput = $("#yoast-wpseo-primary-" + taxonomyName);
		return primaryTermInput.val();
	}

	/**
  * Sets the primary term for a taxonomy
  *
  * @param {string} taxonomyName
  * @param {string} termId
  *
  * @returns {void}
  */
	function setPrimaryTerm(taxonomyName, termId) {
		var primaryTermInput;

		primaryTermInput = $("#yoast-wpseo-primary-" + taxonomyName);
		primaryTermInput.val(termId).trigger("change");
	}

	/**
  * Creates the elements necessary to show something is a primary term or to make it the primary term
  *
  * @param {string} taxonomyName
  * @param {Object} checkbox
  *
  * @returns {void}
  */
	function createPrimaryTermElements(taxonomyName, checkbox) {
		var label, html;

		label = $(checkbox).closest("label");

		html = primaryTermUITemplate({
			taxonomy: taxonomies[taxonomyName],
			term: label.text()
		});

		label.after(html);
	}

	/**
  * Updates the primary term selectors/indicators for a certain taxonomy
  *
  * @param {string} taxonomyName
  *
  * @returns {void}
  */
	function updatePrimaryTermSelectors(taxonomyName) {
		var checkedTerms, uncheckedTerms;
		var listItem, label;

		checkedTerms = $("#" + taxonomyName + 'checklist input[type="checkbox"]:checked');
		uncheckedTerms = $("#" + taxonomyName + 'checklist input[type="checkbox"]:not(:checked)');

		// Remove all classes for a consistent experience
		checkedTerms.add(uncheckedTerms).closest("li").removeClass("wpseo-term-unchecked").removeClass("wpseo-primary-term").removeClass("wpseo-non-primary-term");

		$(".wpseo-primary-category-label").remove();

		// If there is only one term selected we don't want to show our interface.
		if (checkedTerms.length <= 1) {
			checkedTerms.add(uncheckedTerms).closest("li").addClass("wpseo-term-unchecked");
			return;
		}

		checkedTerms.each(function (i, term) {
			term = $(term);
			listItem = term.closest("li");

			// Create our interface elements if they don't exist.
			if (!hasPrimaryTermElements(term)) {
				createPrimaryTermElements(taxonomyName, term);
			}

			if (term.val() === getPrimaryTerm(taxonomyName)) {
				listItem.addClass("wpseo-primary-term");

				label = term.closest("label");
				label.find(".wpseo-primary-category-label").remove();
				label.append(primaryTermScreenReaderTemplate({
					taxonomy: taxonomies[taxonomyName]
				}));
			} else {
				listItem.addClass("wpseo-non-primary-term");
			}
		});

		// Hide our interface elements on all unchecked checkboxes.
		uncheckedTerms.closest("li").addClass("wpseo-term-unchecked");
	}

	/**
  * Makes the first term primary for a certain taxonomy
  *
  * @param {string} taxonomyName
  *
  * @returns {void}
  */
	function makeFirstTermPrimary(taxonomyName) {
		var firstTerm = $("#" + taxonomyName + 'checklist input[type="checkbox"]:checked:first');

		setPrimaryTerm(taxonomyName, firstTerm.val());
		updatePrimaryTermSelectors(taxonomyName);
	}

	/**
  * If we check a term while there is no primary term we make that one the primary term.
  *
  * @param {string} taxonomyName
  *
  * @returns {void}
  */
	function ensurePrimaryTerm(taxonomyName) {
		if ("" === getPrimaryTerm(taxonomyName)) {
			makeFirstTermPrimary(taxonomyName);
		}
	}

	/**
  * Returns the term checkbox handler for a certain taxonomy name
  *
  * @param {string} taxonomyName
  * @returns {Function}
  */
	function termCheckboxHandler(taxonomyName) {
		return function () {
			// If the user unchecks the primary category we have to select any new primary term
			if (false === $(this).prop("checked") && $(this).val() === getPrimaryTerm(taxonomyName)) {
				makeFirstTermPrimary(taxonomyName);
			}

			ensurePrimaryTerm(taxonomyName);

			updatePrimaryTermSelectors(taxonomyName);
		};
	}

	/**
  * Returns the term list add handler for a certain taxonomy name
  *
  * @param {string} taxonomyName
  * @returns {Function}
  */
	function termListAddHandler(taxonomyName) {
		return function () {
			ensurePrimaryTerm(taxonomyName);
			updatePrimaryTermSelectors(taxonomyName);
		};
	}

	/**
  * Returns the make primary event handler for a certain taxonomy name
  *
  * @param {string} taxonomyName
  * @returns {Function}
  */
	function makePrimaryHandler(taxonomyName) {
		return function (e) {
			var term, checkbox;

			term = $(e.currentTarget);
			checkbox = term.siblings("label").find("input");

			setPrimaryTerm(taxonomyName, checkbox.val());

			updatePrimaryTermSelectors(taxonomyName);

			// The clicked link will be hidden so we need to focus something different.
			checkbox.focus();
		};
	}

	$.fn.initYstSEOPrimaryCategory = function () {
		return this.each(function (i, taxonomy) {
			var metaboxTaxonomy, html;

			metaboxTaxonomy = $("#" + taxonomy.name + "div");

			html = primaryTermInputTemplate({
				taxonomy: taxonomy
			});

			metaboxTaxonomy.append(html);

			updatePrimaryTermSelectors(taxonomy.name);

			metaboxTaxonomy.on("click", 'input[type="checkbox"]', termCheckboxHandler(taxonomy.name));

			// When the AJAX Request is done, this event will be fired.
			metaboxTaxonomy.on("wpListAddEnd", "#" + taxonomy.name + "checklist", termListAddHandler(taxonomy.name));

			metaboxTaxonomy.on("click", ".wpseo-make-primary-term", makePrimaryHandler(taxonomy.name));
		});
	};

	$(function () {
		// Initialize our templates
		primaryTermInputTemplate = wp.template("primary-term-input");
		primaryTermUITemplate = wp.template("primary-term-ui");
		primaryTermScreenReaderTemplate = wp.template("primary-term-screen-reader");

		$(_.values(taxonomies)).initYstSEOPrimaryCategory();
	});
})(jQuery);

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJqc1xcc3JjXFx3cC1zZW8tbWV0YWJveC1jYXRlZ29yeS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDQUE7QUFDRSxXQUFVLENBQVYsRUFBYztBQUNmOztBQUVBLEtBQUksd0JBQUosRUFBOEIscUJBQTlCLEVBQXFELCtCQUFyRDtBQUNBLEtBQUksYUFBYSx5QkFBeUIsVUFBMUM7O0FBRUE7Ozs7Ozs7QUFPQSxVQUFTLHNCQUFULENBQWlDLFFBQWpDLEVBQTRDO0FBQzNDLFNBQU8sTUFBTSxFQUFHLFFBQUgsRUFBYyxPQUFkLENBQXVCLElBQXZCLEVBQThCLFFBQTlCLENBQXdDLDBCQUF4QyxFQUFxRSxNQUFsRjtBQUNBOztBQUVEOzs7Ozs7QUFNQSxVQUFTLGNBQVQsQ0FBeUIsWUFBekIsRUFBd0M7QUFDdkMsTUFBSSxnQkFBSjs7QUFFQSxxQkFBbUIsRUFBRywwQkFBMEIsWUFBN0IsQ0FBbkI7QUFDQSxTQUFPLGlCQUFpQixHQUFqQixFQUFQO0FBQ0E7O0FBRUQ7Ozs7Ozs7O0FBUUEsVUFBUyxjQUFULENBQXlCLFlBQXpCLEVBQXVDLE1BQXZDLEVBQWdEO0FBQy9DLE1BQUksZ0JBQUo7O0FBRUEscUJBQW1CLEVBQUcsMEJBQTBCLFlBQTdCLENBQW5CO0FBQ0EsbUJBQWlCLEdBQWpCLENBQXNCLE1BQXRCLEVBQStCLE9BQS9CLENBQXdDLFFBQXhDO0FBQ0E7O0FBRUQ7Ozs7Ozs7O0FBUUEsVUFBUyx5QkFBVCxDQUFvQyxZQUFwQyxFQUFrRCxRQUFsRCxFQUE2RDtBQUM1RCxNQUFJLEtBQUosRUFBVyxJQUFYOztBQUVBLFVBQVEsRUFBRyxRQUFILEVBQWMsT0FBZCxDQUF1QixPQUF2QixDQUFSOztBQUVBLFNBQU8sc0JBQXVCO0FBQzdCLGFBQVUsV0FBWSxZQUFaLENB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QUYsQ0FBVSxVQUFWLENBQUgsRUFBNEIseUJBQTVCO0FBQ0EsRUFQRDtBQVFBLENBek9DLEVBeU9DLE1Bek9ELENBQUYiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyogZ2xvYmFsIHdwLCBfLCB3cHNlb1ByaW1hcnlDYXRlZ29yeUwxMG4gKi9cclxuKCBmdW5jdGlvbiggJCApIHtcclxuXHRcInVzZSBzdHJpY3RcIjtcclxuXHJcblx0dmFyIHByaW1hcnlUZXJtSW5wdXRUZW1wbGF0ZSwgcHJpbWFyeVRlcm1VSVRlbXBsYXRlLCBwcmltYXJ5VGVybVNjcmVlblJlYWRlclRlbXBsYXRlO1xyXG5cdHZhciB0YXhvbm9taWVzID0gd3BzZW9QcmltYXJ5Q2F0ZWdvcnlMMTBuLnRheG9ub21pZXM7XHJcblxyXG5cdC8qKlxyXG5cdCAqIENoZWNrcyBpZiB0aGUgZWxlbWVudHMgdG8gbWFrZSBhIHRlcm0gdGhlIHByaW1hcnkgdGVybSBhbmQgdGhlIGRpc3BsYXkgZm9yIGEgcHJpbWFyeSB0ZXJtIGV4aXN0XHJcblx0ICpcclxuXHQgKiBAcGFyYW0ge09iamVjdH0gY2hlY2tib3hcclxuXHQgKlxyXG5cdCAqIEByZXR1cm5zIHtib29sZWFufVxyXG5cdCAqL1xyXG5cdGZ1bmN0aW9uIGhhc1ByaW1hcnlUZXJtRWxlbWVudHMoIGNoZWNrYm94ICkge1xyXG5cdFx0cmV0dXJuIDEgPT09ICQoIGNoZWNrYm94ICkuY2xvc2VzdCggXCJsaVwiICkuY2hpbGRyZW4oIFwiLndwc2VvLW1ha2UtcHJpbWFyeS10ZXJtXCIgKS5sZW5ndGg7XHJcblx0fVxyXG5cclxuXHQvKipcclxuXHQgKiBSZXRyaWV2ZXMgdGhlIHByaW1hcnkgdGVybSBmb3IgYSB0YXhvbm9teVxyXG5cdCAqXHJcblx0ICogQHBhcmFtIHtzdHJpbmd9IHRheG9ub215TmFtZVxyXG5cdCAqIEByZXR1cm5zIHtzdHJpbmd9XHJcblx0ICovXHJcblx0ZnVuY3Rpb24gZ2V0UHJpbWFyeVRlcm0oIHRheG9ub215TmFtZSApIHtcclxuXHRcdHZhciBwcmltYXJ5VGVybUlucHV0O1xyXG5cclxuXHRcdHByaW1hcnlUZXJtSW5wdXQgPSAkKCBcIiN5b2FzdC13cHNlby1wcmltYXJ5LVwiICsgdGF4b25vbXlOYW1lICk7XHJcblx0XHRyZXR1cm4gcHJpbWFyeVRlcm1JbnB1dC52YWwoKTtcclxuXHR9XHJcblxyXG5cdC8qKlxyXG5cdCAqIFNldHMgdGhlIHByaW1hcnkgdGVybSBmb3IgYSB0YXhvbm9teVxyXG5cdCAqXHJcblx0ICogQHBhcmFtIHtzdHJpbmd9IHRheG9ub215TmFtZVxyXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSB0ZXJtSWRcclxuXHQgKlxyXG5cdCAqIEByZXR1cm5zIHt2b2lkfVxyXG5cdCAqL1xyXG5cdGZ1bmN0aW9uIHNldFByaW1hcnlUZXJtKCB0YXhvbm9teU5hbWUsIHRlcm1JZCApIHtcclxuXHRcdHZhciBwcmltYXJ5VGVybUlucHV0O1xyXG5cclxuXHRcdHByaW1hcnlUZXJtSW5wdXQgPSAkKCBcIiN5b2FzdC13cHNlby1wcmltYXJ5LVwiICsgdGF4b25vbXlOYW1lICk7XHJcblx0XHRwcmltYXJ5VGVybUlucHV0LnZhbCggdGVybUlkICkudHJpZ2dlciggXCJjaGFuZ2VcIiApO1xyXG5cdH1cclxuXHJcblx0LyoqXHJcblx0ICogQ3JlYXRlcyB0aGUgZWxlbWVudHMgbmVjZXNzYXJ5IHRvIHNob3cgc29tZXRoaW5nIGlzIGEgcHJpbWFyeSB0ZXJtIG9yIHRvIG1ha2UgaXQgdGhlIHByaW1hcnkgdGVybVxyXG5cdCAqXHJcblx0ICogQHBhcmFtIHtzdHJpbmd9IHRheG9ub215TmFtZVxyXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBjaGVja2JveFxyXG5cdCAqXHJcblx0ICogQHJldHVybnMge3ZvaWR9XHJcblx0ICovXHJcblx0ZnVuY3Rpb24gY3JlYXRlUHJpbWFyeVRlcm1FbGVtZW50cyggdGF4b25vbXlOYW1lLCBjaGVja2JveCApIHtcclxuXHRcdHZhciBsYWJlbCwgaHRtbDtcclxuXHJcblx0XHRsYWJlbCA9ICQoIGNoZWNrYm94ICkuY2xvc2VzdCggXCJsYWJlbFwiICk7XHJcblxyXG5cdFx0aHRtbCA9IHByaW1hcnlUZXJtVUlUZW1wbGF0ZSgge1xyXG5cdFx0XHR0YXhvbm9teTogdGF4b25vbWllc1sgdGF4b25vbXlOYW1lIF0sXHJcblx0XHRcdHRlcm06IGxhYmVsLnRleHQoKSxcclxuXHRcdH0gKTtcclxuXHJcblx0XHRsYWJlbC5hZnRlciggaHRtbCApO1xyXG5cdH1cclxuXHJcblx0LyoqXHJcblx0ICogVXBkYXRlcyB0aGUgcHJpbWFyeSB0ZXJtIHNlbGVjdG9ycy9pbmRpY2F0b3JzIGZvciBhIGNlcnRhaW4gdGF4b25vbXlcclxuXHQgKlxyXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSB0YXhvbm9teU5hbWVcclxuXHQgKlxyXG5cdCAqIEByZXR1cm5zIHt2b2lkfVxyXG5cdCAqL1xyXG5cdGZ1bmN0aW9uIHVwZGF0ZVByaW1hcnlUZXJtU2VsZWN0b3JzKCB0YXhvbm9teU5hbWUgKSB7XHJcblx0XHR2YXIgY2hlY2tlZFRlcm1zLCB1bmNoZWNrZWRUZXJtcztcclxuXHRcdHZhciBsaXN0SXRlbSwgbGFiZWw7XHJcblxyXG5cdFx0Y2hlY2tlZFRlcm1zID0gJCggXCIjXCIgKyB0YXhvbm9teU5hbWUgKyAnY2hlY2tsaXN0IGlucHV0W3R5cGU9XCJjaGVja2JveFwiXTpjaGVja2VkJyApO1xyXG5cdFx0dW5jaGVja2VkVGVybXMgPSAkKCBcIiNcIiArIHRheG9ub215TmFtZSArICdjaGVja2xpc3QgaW5wdXRbdHlwZT1cImNoZWNrYm94XCJdOm5vdCg6Y2hlY2tlZCknICk7XHJcblxyXG5cdFx0Ly8gUmVtb3ZlIGFsbCBjbGFzc2VzIGZvciBhIGNvbnNpc3RlbnQgZXhwZXJpZW5jZVxyXG5cdFx0Y2hlY2tlZFRlcm1zLmFkZCggdW5jaGVja2VkVGVybXMgKS5jbG9zZXN0KCBcImxpXCIgKVxyXG5cdFx0XHQucmVtb3ZlQ2xhc3MoIFwid3BzZW8tdGVybS11bmNoZWNrZWRcIiApXHJcblx0XHRcdC5yZW1vdmVDbGFzcyggXCJ3cHNlby1wcmltYXJ5LXRlcm1cIiApXHJcblx0XHRcdC5yZW1vdmVDbGFzcyggXCJ3cHNlby1ub24tcHJpbWFyeS10ZXJtXCIgKTtcclxuXHJcblx0XHQkKCBcIi53cHNlby1wcmltYXJ5LWNhdGVnb3J5LWxhYmVsXCIgKS5yZW1vdmUoKTtcclxuXHJcblx0XHQvLyBJZiB0aGVyZSBpcyBvbmx5IG9uZSB0ZXJtIHNlbGVjdGVkIHdlIGRvbid0IHdhbnQgdG8gc2hvdyBvdXIgaW50ZXJmYWNlLlxyXG5cdFx0aWYgKCBjaGVja2VkVGVybXMubGVuZ3RoIDw9IDEgKSB7XHJcblx0XHRcdGNoZWNrZWRUZXJtcy5hZGQoIHVuY2hlY2tlZFRlcm1zICkuY2xvc2VzdCggXCJsaVwiICkuYWRkQ2xhc3MoIFwid3BzZW8tdGVybS11bmNoZWNrZWRcIiApO1xyXG5cdFx0XHRyZXR1cm47XHJcblx0XHR9XHJcblxyXG5cdFx0Y2hlY2tlZFRlcm1zLmVhY2goIGZ1bmN0aW9uKCBpLCB0ZXJtICkge1xyXG5cdFx0XHR0ZXJtID0gJCggdGVybSApO1xyXG5cdFx0XHRsaXN0SXRlbSA9IHRlcm0uY2xvc2VzdCggXCJsaVwiICk7XHJcblxyXG5cdFx0XHQvLyBDcmVhdGUgb3VyIGludGVyZmFjZSBlbGVtZW50cyBpZiB0aGV5IGRvbid0IGV4aXN0LlxyXG5cdFx0XHRpZiAoICEgaGFzUHJpbWFyeVRlcm1FbGVtZW50cyggdGVybSApICkge1xyXG5cdFx0XHRcdGNyZWF0ZVByaW1hcnlUZXJtRWxlbWVudHMoIHRheG9ub215TmFtZSwgdGVybSApO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRpZiAoIHRlcm0udmFsKCkgPT09IGdldFByaW1hcnlUZXJtKCB0YXhvbm9teU5hbWUgKSApIHtcclxuXHRcdFx0XHRsaXN0SXRlbS5hZGRDbGFzcyggXCJ3cHNlby1wcmltYXJ5LXRlcm1cIiApO1xyXG5cclxuXHRcdFx0XHRsYWJlbCA9IHRlcm0uY2xvc2VzdCggXCJsYWJlbFwiICk7XHJcblx0XHRcdFx0bGFiZWwuZmluZCggXCIud3BzZW8tcHJpbWFyeS1jYXRlZ29yeS1sYWJlbFwiICkucmVtb3ZlKCk7XHJcblx0XHRcdFx0bGFiZWwuYXBwZW5kKCBwcmltYXJ5VGVybVNjcmVlblJlYWRlclRlbXBsYXRlKCB7XHJcblx0XHRcdFx0XHR0YXhvbm9teTogdGF4b25vbWllc1sgdGF4b25vbXlOYW1lIF0sXHJcblx0XHRcdFx0fSApICk7XHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0bGlzdEl0ZW0uYWRkQ2xhc3MoIFwid3BzZW8tbm9uLXByaW1hcnktdGVybVwiICk7XHJcblx0XHRcdH1cclxuXHRcdH0gKTtcclxuXHJcblx0XHQvLyBIaWRlIG91ciBpbnRlcmZhY2UgZWxlbWVudHMgb24gYWxsIHVuY2hlY2tlZCBjaGVja2JveGVzLlxyXG5cdFx0dW5jaGVja2VkVGVybXMuY2xvc2VzdCggXCJsaVwiICkuYWRkQ2xhc3MoIFwid3BzZW8tdGVybS11bmNoZWNrZWRcIiApO1xyXG5cdH1cclxuXHJcblx0LyoqXHJcblx0ICogTWFrZXMgdGhlIGZpcnN0IHRlcm0gcHJpbWFyeSBmb3IgYSBjZXJ0YWluIHRheG9ub215XHJcblx0ICpcclxuXHQgKiBAcGFyYW0ge3N0cmluZ30gdGF4b25vbXlOYW1lXHJcblx0ICpcclxuXHQgKiBAcmV0dXJucyB7dm9pZH1cclxuXHQgKi9cclxuXHRmdW5jdGlvbiBtYWtlRmlyc3RUZXJtUHJpbWFyeSggdGF4b25vbXlOYW1lICkge1xyXG5cdFx0dmFyIGZpcnN0VGVybSA9ICQoIFwiI1wiICsgdGF4b25vbXlOYW1lICsgJ2NoZWNrbGlzdCBpbnB1dFt0eXBlPVwiY2hlY2tib3hcIl06Y2hlY2tlZDpmaXJzdCcgKTtcclxuXHJcblx0XHRzZXRQcmltYXJ5VGVybSggdGF4b25vbXlOYW1lLCBmaXJzdFRlcm0udmFsKCkgKTtcclxuXHRcdHVwZGF0ZVByaW1hcnlUZXJtU2VsZWN0b3JzKCB0YXhvbm9teU5hbWUgKTtcclxuXHR9XHJcblxyXG5cdC8qKlxyXG5cdCAqIElmIHdlIGNoZWNrIGEgdGVybSB3aGlsZSB0aGVyZSBpcyBubyBwcmltYXJ5IHRlcm0gd2UgbWFrZSB0aGF0IG9uZSB0aGUgcHJpbWFyeSB0ZXJtLlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIHtzdHJpbmd9IHRheG9ub215TmFtZVxyXG5cdCAqXHJcblx0ICogQHJldHVybnMge3ZvaWR9XHJcblx0ICovXHJcblx0ZnVuY3Rpb24gZW5zdXJlUHJpbWFyeVRlcm0oIHRheG9ub215TmFtZSApIHtcclxuXHRcdGlmICggXCJcIiA9PT0gZ2V0UHJpbWFyeVRlcm0oIHRheG9ub215TmFtZSApICkge1xyXG5cdFx0XHRtYWtlRmlyc3RUZXJtUHJpbWFyeSggdGF4b25vbXlOYW1lICk7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHQvKipcclxuXHQgKiBSZXR1cm5zIHRoZSB0ZXJtIGNoZWNrYm94IGhhbmRsZXIgZm9yIGEgY2VydGFpbiB0YXhvbm9teSBuYW1lXHJcblx0ICpcclxuXHQgKiBAcGFyYW0ge3N0cmluZ30gdGF4b25vbXlOYW1lXHJcblx0ICogQHJldHVybnMge0Z1bmN0aW9ufVxyXG5cdCAqL1xyXG5cdGZ1bmN0aW9uIHRlcm1DaGVja2JveEhhbmRsZXIoIHRheG9ub215TmFtZSApIHtcclxuXHRcdHJldHVybiBmdW5jdGlvbigpIHtcclxuXHRcdFx0Ly8gSWYgdGhlIHVzZXIgdW5jaGVja3MgdGhlIHByaW1hcnkgY2F0ZWdvcnkgd2UgaGF2ZSB0byBzZWxlY3QgYW55IG5ldyBwcmltYXJ5IHRlcm1cclxuXHRcdFx0aWYgKCBmYWxzZSA9PT0gJCggdGhpcyApLnByb3AoIFwiY2hlY2tlZFwiICkgJiYgJCggdGhpcyApLnZhbCgpID09PSBnZXRQcmltYXJ5VGVybSggdGF4b25vbXlOYW1lICkgKSB7XHJcblx0XHRcdFx0bWFrZUZpcnN0VGVybVByaW1hcnkoIHRheG9ub215TmFtZSApO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRlbnN1cmVQcmltYXJ5VGVybSggdGF4b25vbXlOYW1lICk7XHJcblxyXG5cdFx0XHR1cGRhdGVQcmltYXJ5VGVybVNlbGVjdG9ycyggdGF4b25vbXlOYW1lICk7XHJcblx0XHR9O1xyXG5cdH1cclxuXHJcblx0LyoqXHJcblx0ICogUmV0dXJucyB0aGUgdGVybSBsaXN0IGFkZCBoYW5kbGVyIGZvciBhIGNlcnRhaW4gdGF4b25vbXkgbmFtZVxyXG5cdCAqXHJcblx0ICogQHBhcmFtIHtzdHJpbmd9IHRheG9ub215TmFtZVxyXG5cdCAqIEByZXR1cm5zIHtGdW5jdGlvbn1cclxuXHQgKi9cclxuXHRmdW5jdGlvbiB0ZXJtTGlzdEFkZEhhbmRsZXIoIHRheG9ub215TmFtZSApIHtcclxuXHRcdHJldHVybiBmdW5jdGlvbigpIHtcclxuXHRcdFx0ZW5zdXJlUHJpbWFyeVRlcm0oIHRheG9ub215TmFtZSApO1xyXG5cdFx0XHR1cGRhdGVQcmltYXJ5VGVybVNlbGVjdG9ycyggdGF4b25vbXlOYW1lICk7XHJcblx0XHR9O1xyXG5cdH1cclxuXHJcblx0LyoqXHJcblx0ICogUmV0dXJucyB0aGUgbWFrZSBwcmltYXJ5IGV2ZW50IGhhbmRsZXIgZm9yIGEgY2VydGFpbiB0YXhvbm9teSBuYW1lXHJcblx0ICpcclxuXHQgKiBAcGFyYW0ge3N0cmluZ30gdGF4b25vbXlOYW1lXHJcblx0ICogQHJldHVybnMge0Z1bmN0aW9ufVxyXG5cdCAqL1xyXG5cdGZ1bmN0aW9uIG1ha2VQcmltYXJ5SGFuZGxlciggdGF4b25vbXlOYW1lICkge1xyXG5cdFx0cmV0dXJuIGZ1bmN0aW9uKCBlICkge1xyXG5cdFx0XHR2YXIgdGVybSwgY2hlY2tib3g7XHJcblxyXG5cdFx0XHR0ZXJtID0gJCggZS5jdXJyZW50VGFyZ2V0ICk7XHJcblx0XHRcdGNoZWNrYm94ID0gdGVybS5zaWJsaW5ncyggXCJsYWJlbFwiICkuZmluZCggXCJpbnB1dFwiICk7XHJcblxyXG5cdFx0XHRzZXRQcmltYXJ5VGVybSggdGF4b25vbXlOYW1lLCBjaGVja2JveC52YWwoKSApO1xyXG5cclxuXHRcdFx0dXBkYXRlUHJpbWFyeVRlcm1TZWxlY3RvcnMoIHRheG9ub215TmFtZSApO1xyXG5cclxuXHRcdFx0Ly8gVGhlIGNsaWNrZWQgbGluayB3aWxsIGJlIGhpZGRlbiBzbyB3ZSBuZWVkIHRvIGZvY3VzIHNvbWV0aGluZyBkaWZmZXJlbnQuXHJcblx0XHRcdGNoZWNrYm94LmZvY3VzKCk7XHJcblx0XHR9O1xyXG5cdH1cclxuXHJcblx0JC5mbi5pbml0WXN0U0VPUHJpbWFyeUNhdGVnb3J5ID0gZnVuY3Rpb24oKSB7XHJcblx0XHRyZXR1cm4gdGhpcy5lYWNoKCBmdW5jdGlvbiggaSwgdGF4b25vbXkgKSB7XHJcblx0XHRcdHZhciBtZXRhYm94VGF4b25vbXksIGh0bWw7XHJcblxyXG5cdFx0XHRtZXRhYm94VGF4b25vbXkgPSAkKCBcIiNcIiArIHRheG9ub215Lm5hbWUgKyBcImRpdlwiICk7XHJcblxyXG5cdFx0XHRodG1sID0gcHJpbWFyeVRlcm1JbnB1dFRlbXBsYXRlKCB7XHJcblx0XHRcdFx0dGF4b25vbXk6IHRheG9ub215LFxyXG5cdFx0XHR9ICk7XHJcblxyXG5cdFx0XHRtZXRhYm94VGF4b25vbXkuYXBwZW5kKCBodG1sICk7XHJcblxyXG5cdFx0XHR1cGRhdGVQcmltYXJ5VGVybVNlbGVjdG9ycyggdGF4b25vbXkubmFtZSApO1xyXG5cclxuXHRcdFx0bWV0YWJveFRheG9ub215Lm9uKCBcImNsaWNrXCIsICdpbnB1dFt0eXBlPVwiY2hlY2tib3hcIl0nLCB0ZXJtQ2hlY2tib3hIYW5kbGVyKCB0YXhvbm9teS5uYW1lICkgKTtcclxuXHJcblx0XHRcdC8vIFdoZW4gdGhlIEFKQVggUmVxdWVzdCBpcyBkb25lLCB0aGlzIGV2ZW50IHdpbGwgYmUgZmlyZWQuXHJcblx0XHRcdG1ldGFib3hUYXhvbm9teS5vbiggXCJ3cExpc3RBZGRFbmRcIiwgXCIjXCIgKyB0YXhvbm9teS5uYW1lICsgXCJjaGVja2xpc3RcIiwgdGVybUxpc3RBZGRIYW5kbGVyKCB0YXhvbm9teS5uYW1lICkgKTtcclxuXHJcblx0XHRcdG1ldGFib3hUYXhvbm9teS5vbiggXCJjbGlja1wiLCBcIi53cHNlby1tYWtlLXByaW1hcnktdGVybVwiLCBtYWtlUHJpbWFyeUhhbmRsZXIoIHRheG9ub215Lm5hbWUgKSApO1xyXG5cdFx0fSApO1xyXG5cdH07XHJcblxyXG5cdCQoIGZ1bmN0aW9uKCkge1xyXG5cdFx0Ly8gSW5pdGlhbGl6ZSBvdXIgdGVtcGxhdGVzXHJcblx0XHRwcmltYXJ5VGVybUlucHV0VGVtcGxhdGUgPSB3cC50ZW1wbGF0ZSggXCJwcmltYXJ5LXRlcm0taW5wdXRcIiApO1xyXG5cdFx0cHJpbWFyeVRlcm1VSVRlbXBsYXRlID0gd3AudGVtcGxhdGUoIFwicHJpbWFyeS10ZXJtLXVpXCIgKTtcclxuXHRcdHByaW1hcnlUZXJtU2NyZWVuUmVhZGVyVGVtcGxhdGUgPSB3cC50ZW1wbGF0ZSggXCJwcmltYXJ5LXRlcm0tc2NyZWVuLXJlYWRlclwiICk7XHJcblxyXG5cdFx0JCggXy52YWx1ZXMoIHRheG9ub21pZXMgKSApLmluaXRZc3RTRU9QcmltYXJ5Q2F0ZWdvcnkoKTtcclxuXHR9ICk7XHJcbn0oIGpRdWVyeSApICk7XHJcbiJdfQ==
