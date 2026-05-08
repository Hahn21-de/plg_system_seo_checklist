(function () {
	'use strict';

	const JoomlaApi = window.Joomla || null;
	const config = JoomlaApi && typeof JoomlaApi.getOptions === 'function'
		? JoomlaApi.getOptions('seoChecklist', {})
		: (window.SeoCheckListConfig || {});

	const MODES = {
		hide: 0,
		check: 1,
		show: 2,
	};

	const STATUS = {
		ok: 'ok',
		warning: 'warning',
		error: 'error',
		info: 'info',
	};

	const state = {
		items: [],
		robotsNoIndex: false,
		panel: null,
	};

	function translate(key, fallback) {
		if (JoomlaApi && JoomlaApi.Text && typeof JoomlaApi.Text._ === 'function') {
			const translated = JoomlaApi.Text._(key);

			if (translated && translated !== key) {
				return translated;
			}
		}

		return fallback;
	}

	function replacePlaceholders(value, replacements) {
		let result = value;

		(replacements || []).forEach((replacement) => {
			result = result.replace('%s', replacement);
		});

		return result;
	}

	function message(key, fallback, replacements) {
		return replacePlaceholders(
			translate('PLG_SYSTEM_SEO_CHECKLIST_MSG_' + key, fallback),
			replacements
		);
	}

	function label(key, fallback) {
		return translate('PLG_SYSTEM_SEO_CHECKLIST_CHECK_' + key, fallback);
	}

	function mode(name) {
		const value = Number(config['check_' + name]);

		if (value === MODES.hide || value === MODES.check || value === MODES.show) {
			return value;
		}

		return MODES.check;
	}

	function text(value) {
		return String(value || '').replace(/\s+/g, ' ').trim();
	}

	function queryAll(selector, root) {
		return Array.prototype.slice.call((root || document).querySelectorAll(selector));
	}

	function metaByName(name) {
		return queryAll('meta[name="' + name + '"]');
	}

	function metaByProperty(property) {
		return queryAll('meta[property="' + property + '"]');
	}

	function metaContent(nodes) {
		return nodes.length ? text(nodes[0].getAttribute('content')) : '';
	}

	function visible(element) {
		if (!element) {
			return false;
		}

		const style = window.getComputedStyle(element);

		return style.display !== 'none'
			&& style.visibility !== 'hidden'
			&& style.opacity !== '0'
			&& element.getClientRects().length > 0;
	}

	function parseUrl(value) {
		try {
			return new URL(value, document.baseURI);
		} catch (error) {
			return null;
		}
	}

	function isLocalHost(hostname) {
		return ['localhost', '127.0.0.1', '::1'].includes(String(hostname || '').toLowerCase());
	}

	function currentUrl() {
		return parseUrl(config.current_url || window.location.href);
	}

	function sameCanonicalTarget(targetUrl) {
		const current = currentUrl();

		if (!current || !targetUrl) {
			return false;
		}

		if (isLocalHost(current.hostname)) {
			return targetUrl.pathname.replace(/\/$/, '') === current.pathname.replace(/\/$/, '');
		}

		return targetUrl.protocol === current.protocol
			&& targetUrl.hostname === current.hostname
			&& targetUrl.pathname.replace(/\/$/, '') === current.pathname.replace(/\/$/, '');
	}

	function listValue(values) {
		return values.filter(Boolean).join('\n');
	}

	function addCheck(name, title, status, value, details) {
		const currentMode = mode(name);

		if (currentMode === MODES.hide) {
			return;
		}

		let finalStatus = status || STATUS.ok;
		let finalDetails = details || '';

		if (currentMode === MODES.show && finalStatus !== STATUS.ok) {
			finalStatus = STATUS.info;
		}

		if (state.robotsNoIndex && !['robots', 'canonical'].includes(name) && finalStatus !== STATUS.ok) {
			finalDetails = (finalDetails ? finalDetails + '\n' : '') + message('NOINDEX_INFO', 'Page is noindex, so this check is shown as information.');
			finalStatus = STATUS.info;
		}

		state.items.push({
			name,
			title,
			status: finalStatus,
			value: value || '',
			details: finalDetails,
		});
	}

	function checkRobots() {
		const nodes = metaByName('robots');
		const value = metaContent(nodes);
		const tokens = value
			.split(',')
			.map((token) => token.trim().toLowerCase())
			.filter(Boolean);
		const validTokens = [
			'index',
			'noindex',
			'follow',
			'nofollow',
			'none',
			'noarchive',
			'nosnippet',
			'max-snippet',
			'max-image-preview',
			'max-video-preview',
			'notranslate',
			'noimageindex',
			'unavailable_after',
		];
		const invalidTokens = tokens.filter((token) => !validTokens.some((valid) => token === valid || token.startsWith(valid + ':')));
		let status = STATUS.ok;
		const messages = [];

		state.robotsNoIndex = tokens.includes('noindex') || tokens.includes('none');

		if (nodes.length > 1) {
			status = STATUS.error;
			messages.push(message('ROBOTS_MULTIPLE', 'Multiple robots meta tags found.'));
		}

		if (!value) {
			status = status === STATUS.error ? status : STATUS.info;
			messages.push(message('ROBOTS_MISSING', 'No robots meta tag. Search engines will usually treat the page as index, follow.'));
		}

		if (state.robotsNoIndex || tokens.includes('nofollow') || tokens.includes('none')) {
			status = status === STATUS.error ? status : STATUS.warning;
			messages.push(message('ROBOTS_BLOCKING', 'Robots can block indexing or link following.'));
		}

		if (invalidTokens.length) {
			status = status === STATUS.error ? status : STATUS.warning;
			messages.push(message('ROBOTS_UNKNOWN', 'Unknown robots directives: %s', [invalidTokens.join(', ')]));
		}

		addCheck('robots', label('ROBOTS', 'Robots'), status, value || message('ROBOTS_IMPLICIT', 'index, follow (implicit)'), messages.join('\n'));
	}

	function checkTitle() {
		const nodes = queryAll('head > title');
		const value = nodes.length ? text(nodes[0].textContent) : '';
		const messages = [];
		let status = STATUS.ok;

		if (nodes.length !== 1) {
			status = STATUS.error;
			messages.push(nodes.length ? message('TITLE_MULTIPLE', 'Multiple title tags found.') : message('TITLE_MISSING', 'Title tag is missing.'));
		}

		if (!value) {
			status = STATUS.error;
			messages.push(message('TITLE_EMPTY', 'Title is empty.'));
		} else {
			if (value.length < 25) {
				status = status === STATUS.error ? status : STATUS.warning;
				messages.push(message('TITLE_SHORT', 'Title is short. Aim for about 25-70 characters.'));
			}

			if (value.length > 70) {
				status = status === STATUS.error ? status : STATUS.warning;
				messages.push(message('TITLE_LONG', 'Title is long. Google may rewrite or truncate it.'));
			}

			if (/\s[|:,-]\s.*\s[|:,-]\s/.test(value)) {
				status = status === STATUS.error ? status : STATUS.warning;
				messages.push(message('TITLE_SEPARATORS', 'Title contains several separators. Check that it is not over-branded.'));
			}
		}

		addCheck('title', label('TITLE', 'Title'), status, value + (value ? ' (' + value.length + ')' : ''), messages.join('\n'));
	}

	function checkDescription() {
		const nodes = metaByName('description');
		const value = metaContent(nodes);
		const title = text(document.title);
		const messages = [];
		let status = STATUS.ok;

		if (nodes.length !== 1) {
			status = STATUS.error;
			messages.push(nodes.length ? message('DESCRIPTION_MULTIPLE', 'Multiple meta descriptions found.') : message('DESCRIPTION_MISSING', 'Meta description is missing.'));
		}

		if (!value) {
			status = STATUS.error;
			messages.push(message('DESCRIPTION_EMPTY', 'Meta description is empty.'));
		} else {
			if (value.length < 70) {
				status = status === STATUS.error ? status : STATUS.warning;
				messages.push(message('DESCRIPTION_SHORT', 'Description is short. Aim for about 70-170 characters.'));
			}

			if (value.length > 170) {
				status = status === STATUS.error ? status : STATUS.warning;
				messages.push(message('DESCRIPTION_LONG', 'Description is long. Search snippets may be truncated.'));
			}

			if (title && value.toLowerCase() === title.toLowerCase()) {
				status = status === STATUS.error ? status : STATUS.warning;
				messages.push(message('DESCRIPTION_DUPLICATES_TITLE', 'Description duplicates the title.'));
			}
		}

		addCheck('description', label('DESCRIPTION', 'Meta description'), status, value + (value ? ' (' + value.length + ')' : ''), messages.join('\n'));
	}

	function checkH1() {
		const h1s = queryAll('h1').filter(visible);
		const values = h1s.map((node) => text(node.textContent));
		let status = STATUS.ok;
		let message = '';

		if (h1s.length > 1) {
			status = STATUS.error;
			message = translate('PLG_SYSTEM_SEO_CHECKLIST_ERROR_H1_MULTIPLE', 'Multiple (%s) H1 tags!').replace('%s', h1s.length);
		}

		if (h1s.length < 1) {
			status = STATUS.error;
			message = translate('PLG_SYSTEM_SEO_CHECKLIST_ERROR_NOT_FOUND', 'Not found!');
		}

		values.forEach((value) => {
			if (value.length > 90) {
				status = status === STATUS.error ? status : STATUS.warning;
				message += (message ? '\n' : '') + message('H1_LONG', 'H1 is very long.');
			}
		});

		addCheck('h1s', label('H1', 'H1'), status, listValue(values), message);
	}

	function checkHeadings() {
		const headings = queryAll('h1,h2,h3,h4,h5,h6').filter(visible);
		let previousLevel = 0;
		let status = headings.length ? STATUS.ok : STATUS.warning;
		const messages = [];

		if (!headings.length) {
			messages.push(message('HEADINGS_MISSING', 'No visible headings found.'));
		}

		headings.forEach((heading) => {
			const level = Number(heading.tagName.replace('H', ''));

			if (previousLevel > 0 && level > previousLevel + 1) {
				status = status === STATUS.error ? status : STATUS.warning;
				messages.push(message('HEADING_JUMP', 'Heading jumps from H%s to H%s: %s', [previousLevel, level, text(heading.textContent)]));
			}

			previousLevel = level;
		});

		addCheck(
			'headings',
			label('HEADINGS', 'Heading outline'),
			status,
			headings.map((heading) => heading.tagName + ': ' + text(heading.textContent)).slice(0, 12).join('\n'),
			messages.slice(0, 8).join('\n')
		);
	}

	function checkCanonical() {
		const nodes = queryAll('link[rel~="canonical"]');
		const href = nodes.length ? text(nodes[0].getAttribute('href')) : '';
		const target = href ? parseUrl(href) : null;
		const messages = [];
		let status = STATUS.ok;

		if (nodes.length !== 1) {
			status = STATUS.error;
			messages.push(nodes.length ? message('CANONICAL_MULTIPLE', 'Multiple canonical links found.') : message('CANONICAL_MISSING', 'Canonical link is missing.'));
		}

		if (href) {
			if (!target) {
				status = STATUS.error;
				messages.push(message('CANONICAL_INVALID', 'Canonical URL is invalid.'));
			} else {
				if (!/^https?:\/\//i.test(href)) {
					status = status === STATUS.error ? status : STATUS.warning;
					messages.push(message('CANONICAL_ABSOLUTE', 'Canonical should be absolute.'));
				}

				if (target.search || target.hash) {
					status = status === STATUS.error ? status : STATUS.warning;
					messages.push(message('CANONICAL_CLEAN', 'Canonical should not contain query strings or hashes.'));
				}

				if (target.protocol !== 'https:' && window.location.protocol === 'https:') {
					status = status === STATUS.error ? status : STATUS.warning;
					messages.push(message('CANONICAL_HTTP', 'Canonical uses HTTP on an HTTPS page.'));
				}

				if (!sameCanonicalTarget(target)) {
					status = status === STATUS.error ? status : STATUS.warning;
					messages.push(message('CANONICAL_DIFFERS', 'Canonical target differs from the current page path.'));
				}
			}
		}

		addCheck('canonical', label('CANONICAL', 'Canonical'), status, href, messages.join('\n'));
	}

	function checkHreflang() {
		const nodes = queryAll('link[rel~="alternate"][hreflang]');
		const langs = {};
		const values = [];
		const messages = [];
		let status = nodes.length ? STATUS.ok : STATUS.warning;

		if (!nodes.length) {
			messages.push(message('HREFLANG_MISSING', 'No hreflang alternates found.'));
		}

		nodes.forEach((node) => {
			const lang = text(node.getAttribute('hreflang'));
			const href = text(node.getAttribute('href'));
			const parsed = parseUrl(href);

			values.push(lang + ': ' + href);

			if (!lang) {
				status = STATUS.error;
				messages.push(message('HREFLANG_EMPTY', 'Alternate link without hreflang.'));
			} else if (langs[lang.toLowerCase()]) {
				status = STATUS.error;
				messages.push(message('HREFLANG_DUPLICATE', 'Duplicate hreflang: %s', [lang]));
			}

			langs[lang.toLowerCase()] = true;

			if (lang.toLowerCase() === 'ua') {
				status = STATUS.error;
				messages.push(message('HREFLANG_UA', 'Use uk-UA for Ukrainian hreflang, not ua.'));
			}

			if (href && !/^https?:\/\//i.test(href)) {
				status = status === STATUS.error ? status : STATUS.warning;
				messages.push(message('HREFLANG_ABSOLUTE', 'Hreflang URL should be absolute: %s', [lang]));
			}

			if (!parsed) {
				status = STATUS.error;
				messages.push(message('HREFLANG_INVALID_URL', 'Invalid hreflang URL: %s', [href]));
			} else if (parsed.search || parsed.hash) {
				status = status === STATUS.error ? status : STATUS.warning;
				messages.push(message('HREFLANG_CLEAN', 'Hreflang URL should not contain query or hash: %s', [lang]));
			}
		});

		if (nodes.length > 1 && !langs['x-default']) {
			status = status === STATUS.error ? status : STATUS.warning;
			messages.push(message('HREFLANG_XDEFAULT_MISSING', 'x-default hreflang is missing.'));
		}

		addCheck('hreflang', label('HREFLANG', 'Hreflang'), status, values.join('\n'), messages.join('\n'));
	}

	function checkHtmlLang() {
		const value = text(document.documentElement.getAttribute('lang'));
		let status = value ? STATUS.ok : STATUS.warning;
		const messages = [];

		if (!value) {
			messages.push(message('HTML_LANG_MISSING', 'HTML lang attribute is missing.'));
		}

		if (value.toLowerCase() === 'ua') {
			status = STATUS.error;
			messages.push(message('HTML_LANG_UA', 'HTML lang for Ukrainian should be uk or uk-UA, not ua.'));
		}

		addCheck('html_lang', label('HTML_LANG', 'HTML lang'), status, value, messages.join('\n'));
	}

	function checkViewport() {
		const nodes = metaByName('viewport');
		const value = metaContent(nodes);
		let status = STATUS.ok;
		const messages = [];

		if (nodes.length !== 1) {
			status = STATUS.warning;
			messages.push(nodes.length ? message('VIEWPORT_MULTIPLE', 'Multiple viewport meta tags found.') : message('VIEWPORT_MISSING', 'Viewport meta tag is missing.'));
		}

		if (value && !/width\s*=\s*device-width/i.test(value)) {
			status = status === STATUS.error ? status : STATUS.warning;
			messages.push(message('VIEWPORT_WIDTH', 'Viewport should include width=device-width.'));
		}

		addCheck('viewport', label('VIEWPORT', 'Viewport'), status, value, messages.join('\n'));
	}

	function checkOpenGraph() {
		const required = ['og:title', 'og:description', 'og:url', 'og:type'];
		const values = [];
		const missing = [];
		let status = STATUS.ok;

		required.forEach((property) => {
			const value = metaContent(metaByProperty(property));

			if (value) {
				values.push(property + ': ' + value);
			} else {
				missing.push(property);
			}
		});

		if (missing.length) {
			status = STATUS.warning;
		}

		addCheck('open_graph', label('OPEN_GRAPH', 'Open Graph'), status, values.join('\n'), missing.length ? message('MISSING_FIELDS', 'Missing: %s', [missing.join(', ')]) : '');
	}

	function checkTwitter() {
		const required = ['twitter:card', 'twitter:title', 'twitter:description'];
		const values = [];
		const missing = [];
		let status = STATUS.ok;

		required.forEach((name) => {
			const value = metaContent(metaByName(name));

			if (value) {
				values.push(name + ': ' + value);
			} else {
				missing.push(name);
			}
		});

		if (missing.length) {
			status = STATUS.warning;
		}

		addCheck('twitter', label('TWITTER', 'Twitter Card'), status, values.join('\n'), missing.length ? message('MISSING_FIELDS', 'Missing: %s', [missing.join(', ')]) : '');
	}

	function checkStructuredData() {
		const nodes = queryAll('script[type="application/ld+json"]');
		const types = [];
		const messages = [];
		let status = nodes.length ? STATUS.ok : STATUS.info;

		if (!nodes.length) {
			messages.push(message('STRUCTURED_DATA_MISSING', 'No JSON-LD structured data found.'));
		}

		nodes.forEach((node, index) => {
			try {
				const parsed = JSON.parse(node.textContent);
				const items = Array.isArray(parsed) ? parsed : [parsed];

				items.forEach((item) => {
					if (item && item['@type']) {
						types.push(String(item['@type']));
					}
				});
			} catch (error) {
				status = STATUS.error;
				messages.push(message('STRUCTURED_DATA_INVALID', 'Invalid JSON-LD block #%s: %s', [index + 1, error.message]));
			}
		});

		addCheck('structured_data', label('STRUCTURED_DATA', 'Structured data'), status, types.join(', '), messages.join('\n'));
	}

	function checkImages() {
		const images = queryAll('img').filter(visible);
		const missingAlt = images.filter((image) => !image.hasAttribute('alt'));
		const emptyAlt = images.filter((image) => image.hasAttribute('alt') && text(image.getAttribute('alt')) === '');
		const missingSize = images.filter((image) => !image.getAttribute('width') || !image.getAttribute('height'));
		const messages = [];
		let status = STATUS.ok;

		if (missingAlt.length) {
			status = STATUS.warning;
			messages.push(message('IMAGES_MISSING_ALT', '%s visible images have no alt attribute.', [missingAlt.length]));
		}

		if (missingSize.length) {
			status = status === STATUS.error ? status : STATUS.warning;
			messages.push(message('IMAGES_MISSING_SIZE', '%s visible images have no width/height attributes.', [missingSize.length]));
		}

		addCheck(
			'images',
			label('IMAGES', 'Images'),
			status,
			message('IMAGES_VALUE', '%s images, %s missing alt, %s empty alt', [images.length, missingAlt.length, emptyAlt.length]),
			messages.concat(missingAlt.slice(0, 10).map((image) => image.currentSrc || image.src || message('INLINE_IMAGE', '[inline image]'))).join('\n')
		);
	}

	function checkLinks() {
		const links = queryAll('a[href]');
		const badLinks = [];
		const vagueText = [];

		links.forEach((link) => {
			const href = text(link.getAttribute('href'));
			const label = text(link.textContent || link.getAttribute('aria-label') || link.getAttribute('title'));

			if (!href || href === '#' || href.toLowerCase().startsWith('javascript:')) {
				badLinks.push((label || message('EMPTY_LABEL', '[empty label]')) + ' -> ' + href);
			}

			if (/^(click here|more|read more|hier|mehr|подробнее|тут|здесь)$/i.test(label)) {
				vagueText.push(label + ' -> ' + href);
			}
		});

		let status = STATUS.ok;
		const messages = [];

		if (badLinks.length) {
			status = STATUS.warning;
			messages.push(message('LINKS_BAD_HREF', 'Links with empty, hash or JavaScript href: %s', [badLinks.length]));
		}

		if (vagueText.length) {
			status = status === STATUS.error ? status : STATUS.warning;
			messages.push(message('LINKS_WEAK_TEXT', 'Links with weak anchor text: %s', [vagueText.length]));
		}

		addCheck('links', label('LINKS', 'Links'), status, message('LINKS_VALUE', '%s links', [links.length]), messages.concat(badLinks.slice(0, 8), vagueText.slice(0, 8)).join('\n'));
	}

	function checkSimpleMeta(name, title) {
		const value = metaContent(metaByName(name));
		const status = value ? STATUS.ok : STATUS.error;

		addCheck(name, label(name.toUpperCase(), title), status, value, value ? '' : translate('PLG_SYSTEM_SEO_CHECKLIST_ERROR_IS_EMPTY', 'is empty!'));
	}

	function runChecks() {
		checkRobots();
		checkTitle();
		checkDescription();
		checkH1();
		checkHeadings();
		checkCanonical();
		checkHreflang();
		checkHtmlLang();
		checkViewport();
		checkOpenGraph();
		checkTwitter();
		checkStructuredData();
		checkImages();
		checkLinks();
		checkSimpleMeta('generator', 'Generator');
		checkSimpleMeta('keywords', 'Keywords');
		checkSimpleMeta('rights', 'Rights');
	}

	function statusLabel(status) {
		const labels = {
			ok: translate('PLG_SYSTEM_SEO_CHECKLIST_STATUS_OK', 'OK'),
			warning: translate('PLG_SYSTEM_SEO_CHECKLIST_STATUS_WARNING', 'Warning'),
			error: translate('PLG_SYSTEM_SEO_CHECKLIST_STATUS_ERROR', 'Error'),
			info: translate('PLG_SYSTEM_SEO_CHECKLIST_STATUS_INFO', 'Info'),
		};

		return labels[status] || status;
	}

	function createElement(tag, className, textContent) {
		const element = document.createElement(tag);

		if (className) {
			element.className = className;
		}

		if (textContent !== undefined) {
			element.textContent = textContent;
		}

		return element;
	}

	function render() {
		const counts = state.items.reduce((result, item) => {
			result[item.status] = (result[item.status] || 0) + 1;

			return result;
		}, {});
		const score = Math.max(0, 100 - ((counts.error || 0) * 12) - ((counts.warning || 0) * 4));
		const panel = createElement('section', 'seo-checklist');
		const toggle = createElement('button', 'seo-checklist__toggle', '');
		const badge = createElement('span', 'seo-checklist__score', String(score));
		const title = createElement('span', 'seo-checklist__title', translate('PLG_SYSTEM_SEO_CHECKLIST_LABEL_SUMMARY', 'SEO'));
		const counter = createElement(
			'span',
			'seo-checklist__counter',
			(counts.error || 0) + 'E ' + (counts.warning || 0) + 'W'
		);
		const body = createElement('div', 'seo-checklist__body');
		const hint = createElement('div', 'seo-checklist__hint', translate('PLG_SYSTEM_SEO_CHECKLIST_HINT_TOGGLE', 'Click to open or close checks.'));

		panel.setAttribute('aria-label', 'SEO checklist');
		panel.dataset.status = counts.error ? STATUS.error : (counts.warning ? STATUS.warning : STATUS.ok);
		toggle.type = 'button';
		toggle.title = translate('PLG_SYSTEM_SEO_CHECKLIST_HINT_TOGGLE', 'Click to open or close checks.');
		toggle.append(badge, title, counter);

		state.items.forEach((item) => {
			const row = createElement('article', 'seo-checklist__item seo-checklist__item--' + item.status);
			const rowHead = createElement('div', 'seo-checklist__item-head');
			const rowStatus = createElement('span', 'seo-checklist__item-status', statusLabel(item.status));
			const rowTitle = createElement('strong', 'seo-checklist__item-title', item.title);
			const rowValue = createElement('pre', 'seo-checklist__item-value', item.value || '-');

			rowHead.append(rowStatus, rowTitle);
			row.append(rowHead, rowValue);

			if (item.details) {
				row.append(createElement('pre', 'seo-checklist__item-details', item.details));
			}

			body.append(row);
		});

		body.prepend(hint);
		panel.append(toggle, body);
		document.body.append(panel);
		state.panel = panel;

		toggle.addEventListener('click', () => {
			panel.classList.toggle('seo-checklist--open');
		});

		if (Number(config.show_details_on_error) === 1 && ((counts.error || 0) > 0 || (counts.warning || 0) > 0)) {
			panel.classList.add('seo-checklist--open');
		}
	}

	function init() {
		if (!document.body) {
			window.setTimeout(init, 50);

			return;
		}

		runChecks();
		render();
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init, { once: true });
	} else {
		init();
	}
}());
