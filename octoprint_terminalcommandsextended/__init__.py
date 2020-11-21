# coding=utf-8
from __future__ import absolute_import

import octoprint.plugin
import flask

class terminalcommandsextendedPlugin(octoprint.plugin.SettingsPlugin,
                                     octoprint.plugin.AssetPlugin,
                                     octoprint.plugin.TemplatePlugin):

	##~~ SettingsPlugin mixin

	def get_settings_defaults(self):
		return dict(
			commands=[],
			terminal_controls=[]
		)

	def get_settings_version(self):
		return 4

	def on_settings_migrate(self, target, current=None):
		if current is None or current < 1:
			# Loop through commands adding new fields
			commands_new = []
			self._logger.info(self._settings.get(['commands']))
			for command in self._settings.get(['commands']):
				command["confirmation"] = False
				command["input"] = []
				command["message"] = ""
				commands_new.append(command)
			self._settings.set(["commands"], commands_new)

		if current == 1:
			commands_new = []
			for command in self._settings.get(['commands']):
				if not command.get("command", False):
					command["command"] = ""
				commands_new.append(command)
			self._settings.set(["commands"], commands_new)

		if current == 2:
			commands_new = []
			for command in self._settings.get(['commands']):
				if not command.get("enabled_while_printing", False):
					command["enabled_while_printing"] = False
				commands_new.append(command)
			self._settings.set(["commands"], commands_new)

		if current <= 3:
			commands_new = []
			for command in self._settings.get(['commands']):
				if not command.get("width", False):
					command["width"] = 2
				if not command.get("offset", False):
					command["offset"] = 0
				commands_new.append(command)
			self._settings.set(["commands"], commands_new)

	##~~ AssetPlugin mixin

	def get_assets(self):
		return dict(
			js=["js/jquery-ui.min.js","js/knockout-sortable.1.2.0.js","js/fontawesome-iconpicker.js","js/ko.iconpicker.js","js/terminalcommandsextended.js"],
			css=["css/font-awesome.min.css","css/font-awesome-v4-shims.min.css","css/fontawesome-iconpicker.css","css/terminalcommandsextended.css"]
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
				stable_branch=dict(
					name="Stable", branch="master", comittish=["master"]
				),
				prerelease_branches=[
					dict(
						name="Release Candidate",
						branch="rc",
						comittish=["rc", "master"],
					)
				],

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

