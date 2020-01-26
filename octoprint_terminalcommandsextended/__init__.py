# coding=utf-8
from __future__ import absolute_import

import octoprint.plugin

class terminalcommandsextendedPlugin(octoprint.plugin.SettingsPlugin,
                                               octoprint.plugin.AssetPlugin,
                                               octoprint.plugin.TemplatePlugin):

	##~~ SettingsPlugin mixin

	def get_settings_defaults(self):
		return dict(
			commands=[]
		)

	##~~ AssetPlugin mixin

	def get_assets(self):
		return dict(
			js=["js/jquery-ui.min.js","js/knockout-sortable.js","js/fontawesome-iconpicker.js","js/ko.iconpicker.js","js/terminalcommandsextended.js"],
			css=["css/font-awesome.min.css","css/font-awesome-v4-shims.min.css","css/fontawesome-iconpicker.css"]
		)

	##~~ Softwareupdate hook

	def get_update_information(self):
		return dict(
			terminalcommandsextended=dict(
				displayName="Terminal Commands Extended",
				displayVersion=self._plugin_version,

				# version check: github repository
				type="github_release",
				user="jneilliii",
				repo="OctoPrint-TerminalCommandsExtended",
				current=self._plugin_version,

				# update method: pip
				pip="https://github.com/jneilliii/OctoPrint-TerminalCommandsExtended/archive/{target_version}.zip"
			)
		)

__plugin_name__ = "Terminal Commands Extended"
__plugin_pythoncompat__ = ">=2.7,<4"

def __plugin_load__():
	global __plugin_implementation__
	__plugin_implementation__ = terminalcommandsextendedPlugin()

	global __plugin_hooks__
	__plugin_hooks__ = {
		"octoprint.plugin.softwareupdate.check_config": __plugin_implementation__.get_update_information
	}

