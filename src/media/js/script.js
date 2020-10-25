window['SeoCheckList'] = {
	_description: null,
	_generator: null,
	_keywords: null,
	_rights: null,
	_title: null,
	_h1s: null,
	_btn: null,
	_errors_count: 0,
	init: function () {
		SeoCheckList._btn = jQuery('<div>')
			.addClass('seo_checklist_btn')
			.on('touch click', SeoCheckList.showDetails);
		SeoCheckList.getMetaInformation();
		SeoCheckList.showBtn();
		if(SeoCheckListConfig.show_details_on_error === 1) {
			if(SeoCheckList._errors_count > 0) {
				SeoCheckList.showDetails();
			}
		}
	},
	getMetaInformation: function () {
		SeoCheckList._description = jQuery('meta[name="description"]').attr('content');
		SeoCheckList._generator = jQuery('meta[name="generator"]').attr('content');
		SeoCheckList._keywords = jQuery('meta[name="keywords"]').attr('content');
		SeoCheckList._rights = jQuery('meta[name="rights"]').attr('content');
		SeoCheckList._title = jQuery('title').html();
		SeoCheckList._h1s = [];
		jQuery('h1').each(function (index) {
			SeoCheckList._h1s.push(jQuery(this).html());
		});
	},
	showIcon: function (name, value_key, error_msg) {
		if (SeoCheckListConfig['check' + value_key] > 0) {
			let _er = 0;
			let _icon_key = value_key + '_icon';
			if (!SeoCheckList[_icon_key]) {
				let _k = name.substr(0, 1);
				SeoCheckList[_icon_key] = jQuery('<div>')
					.addClass('item')
					.append(
						jQuery('<div>').text(_k).addClass('icon')
					);
			}
			let _t = '';
			let _v = (SeoCheckList[value_key] ? SeoCheckList[value_key] : '');
			if (_v || SeoCheckListConfig['check' + value_key] === 2) {
				if (Array.isArray(_v)) {
					_v = _v.join('\n');
				}
			} else {
				_er++;
				if(!error_msg) {
					error_msg = Joomla.Text._('PLG_SYSTEM_SEO_CHECKLIST_ERROR_IS_EMPTY');
				}
			}
			if (error_msg) {
				_er++;
				_t = _t + error_msg + '\n' + _v;
				SeoCheckList[_icon_key].prop('title', _v);
			} else {
				SeoCheckList[_icon_key].addClass('no_error');
				_t = _t + _v;
			}
			if (SeoCheckListConfig['check' + value_key] === 2) {
				_er = 0;
				SeoCheckList[_icon_key].addClass('ok');
			}
			SeoCheckList._errors_count += _er;
			SeoCheckList[_icon_key].prop('title', name + ': ' + _t);
			SeoCheckList[_icon_key].append(
				jQuery('<div>').addClass('info').append(
					jQuery('<div>').addClass('title').text(name)
				).append(
					jQuery('<div>').addClass('value').html(
						_t
							.replace(/</gm, '&lt;')
							.replace(/>/gm, '&gt;')
							.replace(/\n/gm, '<br>')
					)
				)
			);
			SeoCheckList._btn.append(SeoCheckList[_icon_key]);
		}
	},
	showDescription: function () {
		SeoCheckList.showIcon('Description', '_description');
	},
	showGenerator: function () {
		SeoCheckList.showIcon('Generator', '_generator');
	},
	showKeywords: function () {
		SeoCheckList.showIcon('Keywords', '_keywords');
	},
	showRights: function () {
		SeoCheckList.showIcon('Rights', '_rights');
	},
	showTitle: function () {
		SeoCheckList.showIcon('Title', '_title');
	},
	showH1: function () {
		let _error = '';
		if (SeoCheckList._h1s.length > 1) {
			_error = Joomla.Text._('PLG_SYSTEM_SEO_CHECKLIST_ERROR_H1_MULTIPLE');
			_error = _error.replace('%s', SeoCheckList._h1s.length);
		}
		if (SeoCheckList._h1s.length < 1)
		{
			_error = Joomla.Text._('PLG_SYSTEM_SEO_CHECKLIST_ERROR_NOT_FOUND');
		}
		SeoCheckList.showIcon('H1', '_h1s', _error);
	},
	showDetails: function () {
		let _b = jQuery('.seo_checklist_btn');
		if(_b.hasClass('details')) {
			_b.removeClass('details');
		} else {
			_b.addClass('details');
		}
	},
	showBtn: function () {
		jQuery('body').append(
			SeoCheckList._btn
		);
		SeoCheckList.showTitle();
		SeoCheckList.showDescription();
		SeoCheckList.showKeywords();
		SeoCheckList.showH1();
		SeoCheckList.showGenerator();
		SeoCheckList.showRights();
	}
};
jQuery(document).ready(function () {
	SeoCheckList.init();
});
