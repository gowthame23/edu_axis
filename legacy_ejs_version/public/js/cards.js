const util = UIkit.util;
const search = util.$('.search-fld');
const searchVal = util.$('.search-filter');
const searchValAll = util.$('.search-filter-all');
const searchValNone = util.$('.search-filter-none');
const filterBtn = util.$$('li[data-uk-filter-control] a');
const formEl = util.$('#search-form');
let debounce,searchTerm, value;
util.on(search, 'keyup', () => {
	clearTimeout(debounce);
	
	debounce = setTimeout(() => {
		value = search.value.toLowerCase();

		if (value.length) {
			searchTerm = '[data-tags*="' + value + '"]';
			util.attr(searchVal, 'data-uk-filter-control', searchTerm);
			searchValNone.click();
			searchVal.click();
		} else {
			searchTerm = '[data-tags*=""]';
			util.attr(searchVal, 'data-uk-filter-control', searchTerm);
			searchValAll.click();
		}
	}, 300);
});

util.on(formEl, 'keypress', e => {
	const key = e.charCode || e.keyCode || 0;
	if (key == 13) {
		e.preventDefault();
		console.log('Prevent submit on press enter');
	}
});

util.on(filterBtn, 'click', () => {
	if (search.value.length) {
		search.value = '';
		searchTerm = '[data-tags*=""]';
		util.attr(searchVal, 'data-uk-filter-control', searchTerm);
		console.log('empty field and attribute');
	}
});

util.on(searchValNone, 'click', e => {
	e.preventDefault();
})