<?php
// No direct access to this file
defined('_JEXEC') or die('Restricted access');

use Joomla\CMS\Factory;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Plugin\CMSPlugin;
use Joomla\CMS\Uri\Uri;


class plgSystemSeo_checklist extends CMSPlugin
{
	protected $autoloadLanguage = true;

	public function onBeforeCompileHead()
	{
		$app = Factory::getApplication();
		if(!$app->isClient('site'))
		{
			return;
		}

		$document = $app->getDocument();
		if ($document->getType() !== 'html') {
			return;
		}

		/*
		 * 0 - Hide
		 * 1 - Check
		 * 2 - Just show
		 */
		$SeoCheckListConfig = array(
			'show_details_on_error' => (int) $this->params->get('show_details_on_error', 1),
			'current_url'           => Uri::getInstance()->toString(array('scheme', 'host', 'port', 'path')),
			'root_url'              => Uri::root(),
			'site_host'             => Uri::getInstance()->getHost(),
			'check_description'     => (int) $this->params->get('check_description', 1),
			'check_title'           => (int) $this->params->get('check_title', 1),
			'check_h1s'             => (int) $this->params->get('check_h1s', 1),
			'check_headings'        => (int) $this->params->get('check_headings', 1),
			'check_canonical'       => (int) $this->params->get('check_canonical', 1),
			'check_hreflang'        => (int) $this->params->get('check_hreflang', 1),
			'check_html_lang'       => (int) $this->params->get('check_html_lang', 1),
			'check_viewport'        => (int) $this->params->get('check_viewport', 1),
			'check_open_graph'      => (int) $this->params->get('check_open_graph', 1),
			'check_twitter'         => (int) $this->params->get('check_twitter', 2),
			'check_structured_data' => (int) $this->params->get('check_structured_data', 2),
			'check_images'          => (int) $this->params->get('check_images', 1),
			'check_links'           => (int) $this->params->get('check_links', 1),
			'check_generator'       => (int) $this->params->get('check_generator', 2),
			'check_keywords'        => (int) $this->params->get('check_keywords', 2),
			'check_rights'          => (int) $this->params->get('check_rights', 2),
			'check_robots'          => (int) $this->params->get('check_robots', 2)
		);

		$document->addScriptOptions('seoChecklist', $SeoCheckListConfig);

		$wa = $document->getWebAssetManager();
		$wa->registerAndUseScript(
			'plg_system_seo_checklist.script',
			'media/seo_checklist/js/script.js',
			array('version' => 'auto'),
			array('defer' => true),
			array('core')
		);
		$wa->registerAndUseStyle(
			'plg_system_seo_checklist.style',
			'media/seo_checklist/css/style.css',
			array('version' => 'auto')
		);

		foreach (array(
			'PLG_SYSTEM_SEO_CHECKLIST_ERROR_H1_MULTIPLE',
			'PLG_SYSTEM_SEO_CHECKLIST_ERROR_NOT_FOUND',
			'PLG_SYSTEM_SEO_CHECKLIST_ERROR_IS_EMPTY',
			'PLG_SYSTEM_SEO_CHECKLIST_STATUS_OK',
			'PLG_SYSTEM_SEO_CHECKLIST_STATUS_WARNING',
			'PLG_SYSTEM_SEO_CHECKLIST_STATUS_ERROR',
			'PLG_SYSTEM_SEO_CHECKLIST_STATUS_INFO',
			'PLG_SYSTEM_SEO_CHECKLIST_LABEL_SUMMARY',
			'PLG_SYSTEM_SEO_CHECKLIST_HINT_TOGGLE',
			'PLG_SYSTEM_SEO_CHECKLIST_CHECK_ROBOTS',
			'PLG_SYSTEM_SEO_CHECKLIST_CHECK_TITLE',
			'PLG_SYSTEM_SEO_CHECKLIST_CHECK_DESCRIPTION',
			'PLG_SYSTEM_SEO_CHECKLIST_CHECK_H1',
			'PLG_SYSTEM_SEO_CHECKLIST_CHECK_HEADINGS',
			'PLG_SYSTEM_SEO_CHECKLIST_CHECK_CANONICAL',
			'PLG_SYSTEM_SEO_CHECKLIST_CHECK_HREFLANG',
			'PLG_SYSTEM_SEO_CHECKLIST_CHECK_HTML_LANG',
			'PLG_SYSTEM_SEO_CHECKLIST_CHECK_VIEWPORT',
			'PLG_SYSTEM_SEO_CHECKLIST_CHECK_OPEN_GRAPH',
			'PLG_SYSTEM_SEO_CHECKLIST_CHECK_TWITTER',
			'PLG_SYSTEM_SEO_CHECKLIST_CHECK_STRUCTURED_DATA',
			'PLG_SYSTEM_SEO_CHECKLIST_CHECK_IMAGES',
			'PLG_SYSTEM_SEO_CHECKLIST_CHECK_LINKS',
			'PLG_SYSTEM_SEO_CHECKLIST_CHECK_GENERATOR',
			'PLG_SYSTEM_SEO_CHECKLIST_CHECK_KEYWORDS',
			'PLG_SYSTEM_SEO_CHECKLIST_CHECK_RIGHTS',
			'PLG_SYSTEM_SEO_CHECKLIST_MSG_NOINDEX_INFO',
			'PLG_SYSTEM_SEO_CHECKLIST_MSG_ROBOTS_MULTIPLE',
			'PLG_SYSTEM_SEO_CHECKLIST_MSG_ROBOTS_MISSING',
			'PLG_SYSTEM_SEO_CHECKLIST_MSG_ROBOTS_BLOCKING',
			'PLG_SYSTEM_SEO_CHECKLIST_MSG_ROBOTS_UNKNOWN',
			'PLG_SYSTEM_SEO_CHECKLIST_MSG_ROBOTS_IMPLICIT',
			'PLG_SYSTEM_SEO_CHECKLIST_MSG_TITLE_MULTIPLE',
			'PLG_SYSTEM_SEO_CHECKLIST_MSG_TITLE_MISSING',
			'PLG_SYSTEM_SEO_CHECKLIST_MSG_TITLE_EMPTY',
			'PLG_SYSTEM_SEO_CHECKLIST_MSG_TITLE_SHORT',
			'PLG_SYSTEM_SEO_CHECKLIST_MSG_TITLE_LONG',
			'PLG_SYSTEM_SEO_CHECKLIST_MSG_TITLE_SEPARATORS',
			'PLG_SYSTEM_SEO_CHECKLIST_MSG_DESCRIPTION_MULTIPLE',
			'PLG_SYSTEM_SEO_CHECKLIST_MSG_DESCRIPTION_MISSING',
			'PLG_SYSTEM_SEO_CHECKLIST_MSG_DESCRIPTION_EMPTY',
			'PLG_SYSTEM_SEO_CHECKLIST_MSG_DESCRIPTION_SHORT',
			'PLG_SYSTEM_SEO_CHECKLIST_MSG_DESCRIPTION_LONG',
			'PLG_SYSTEM_SEO_CHECKLIST_MSG_DESCRIPTION_DUPLICATES_TITLE',
			'PLG_SYSTEM_SEO_CHECKLIST_MSG_H1_LONG',
			'PLG_SYSTEM_SEO_CHECKLIST_MSG_HEADINGS_MISSING',
			'PLG_SYSTEM_SEO_CHECKLIST_MSG_HEADING_JUMP',
			'PLG_SYSTEM_SEO_CHECKLIST_MSG_CANONICAL_MULTIPLE',
			'PLG_SYSTEM_SEO_CHECKLIST_MSG_CANONICAL_MISSING',
			'PLG_SYSTEM_SEO_CHECKLIST_MSG_CANONICAL_INVALID',
			'PLG_SYSTEM_SEO_CHECKLIST_MSG_CANONICAL_ABSOLUTE',
			'PLG_SYSTEM_SEO_CHECKLIST_MSG_CANONICAL_CLEAN',
			'PLG_SYSTEM_SEO_CHECKLIST_MSG_CANONICAL_HTTP',
			'PLG_SYSTEM_SEO_CHECKLIST_MSG_CANONICAL_DIFFERS',
			'PLG_SYSTEM_SEO_CHECKLIST_MSG_HREFLANG_MISSING',
			'PLG_SYSTEM_SEO_CHECKLIST_MSG_HREFLANG_EMPTY',
			'PLG_SYSTEM_SEO_CHECKLIST_MSG_HREFLANG_DUPLICATE',
			'PLG_SYSTEM_SEO_CHECKLIST_MSG_HREFLANG_UA',
			'PLG_SYSTEM_SEO_CHECKLIST_MSG_HREFLANG_ABSOLUTE',
			'PLG_SYSTEM_SEO_CHECKLIST_MSG_HREFLANG_INVALID_URL',
			'PLG_SYSTEM_SEO_CHECKLIST_MSG_HREFLANG_CLEAN',
			'PLG_SYSTEM_SEO_CHECKLIST_MSG_HREFLANG_XDEFAULT_MISSING',
			'PLG_SYSTEM_SEO_CHECKLIST_MSG_HTML_LANG_MISSING',
			'PLG_SYSTEM_SEO_CHECKLIST_MSG_HTML_LANG_UA',
			'PLG_SYSTEM_SEO_CHECKLIST_MSG_VIEWPORT_MULTIPLE',
			'PLG_SYSTEM_SEO_CHECKLIST_MSG_VIEWPORT_MISSING',
			'PLG_SYSTEM_SEO_CHECKLIST_MSG_VIEWPORT_WIDTH',
			'PLG_SYSTEM_SEO_CHECKLIST_MSG_MISSING_FIELDS',
			'PLG_SYSTEM_SEO_CHECKLIST_MSG_STRUCTURED_DATA_MISSING',
			'PLG_SYSTEM_SEO_CHECKLIST_MSG_STRUCTURED_DATA_INVALID',
			'PLG_SYSTEM_SEO_CHECKLIST_MSG_IMAGES_MISSING_ALT',
			'PLG_SYSTEM_SEO_CHECKLIST_MSG_IMAGES_MISSING_SIZE',
			'PLG_SYSTEM_SEO_CHECKLIST_MSG_IMAGES_VALUE',
			'PLG_SYSTEM_SEO_CHECKLIST_MSG_LINKS_BAD_HREF',
			'PLG_SYSTEM_SEO_CHECKLIST_MSG_LINKS_WEAK_TEXT',
			'PLG_SYSTEM_SEO_CHECKLIST_MSG_LINKS_VALUE',
			'PLG_SYSTEM_SEO_CHECKLIST_MSG_EMPTY_LABEL',
			'PLG_SYSTEM_SEO_CHECKLIST_MSG_INLINE_IMAGE',
		) as $key) {
			Text::script($key);
		}
	}
}
