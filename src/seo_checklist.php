<?php
// No direct access to this file
defined('_JEXEC') or die('Restricted access');

use Joomla\CMS\Factory;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Plugin\CMSPlugin;


class plgSystemSeo_checklist extends CMSPlugin
{
	protected $autoloadLanguage = true;

	public function onAfterRoute()
	{
		$app = Factory::getApplication();
		if(!$app->isClient('site'))
		{
			return true;
		}

		$document = Factory::getDocument();

		/*
		 * 0 - Hide
		 * 1 - Check
		 * 2 - Just show
		 */
		$SeoCheckListConfig = array(
			'show_details_on_error' => (int) $this->params->get('show_details_on_error', 1),
			'check_description'     => (int) $this->params->get('check_description', 1),
			'check_title'           => (int) $this->params->get('check_title', 1),
			'check_h1s'             => (int) $this->params->get('check_h1s', 1),
			'check_generator'       => (int) $this->params->get('check_generator', 2),
			'check_keywords'        => (int) $this->params->get('check_keywords', 2),
			'check_rights'          => (int) $this->params->get('check_rights', 2),
			'check_robots'          => (int) $this->params->get('check_robots', 2)
		);

		$document->addScriptDeclaration(
			'window["SeoCheckListConfig"] = ' . json_encode($SeoCheckListConfig) . ';'
		);

		$document->addScript(
			'media/seo_checklist/js/script.js',
			array('version' => 'auto'),
			array('async' => 'async')
		);
		$document->addStyleSheet('media/seo_checklist/css/style.css', array('version' => 'auto'), array());

		Text::script('PLG_SYSTEM_SEO_CHECKLIST_ERROR_H1_MULTIPLE');
		Text::script('PLG_SYSTEM_SEO_CHECKLIST_ERROR_NOT_FOUND');
		Text::script('PLG_SYSTEM_SEO_CHECKLIST_ERROR_IS_EMPTY');

		return true;
	}
}
