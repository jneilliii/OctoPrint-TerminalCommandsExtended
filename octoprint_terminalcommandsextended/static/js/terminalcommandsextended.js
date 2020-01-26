/*
 * View model for OctoPrint-TerminalCommandsExtended
 *
 * Author: jneilliii
 * License: AGPLv3
 */
$(function() {
	function terminalcommandsextendedViewModel(parameters) {
		var self = this;

		self.loginStateViewModel = parameters[0];
		self.settingsViewModel = parameters[1];
		self.controlViewModel = parameters[2];

		self.onBeforeBinding = function(){
			$('#term').append('<div id="terminalcommandsextended" class="row-fluid" data-bind="visible: loginStateViewModel.isUser() && settingsViewModel.settings.plugins.terminalcommandsextended.commands().length > 0,sortable: { data: settingsViewModel.settings.plugins.terminalcommandsextended.commands, options: { cancel: \'.unsortable\', handle: \'.sortable_handle\'} }" style="margin-top: 10px;"><button class="btn unsortable" data-bind="click: $parent.runCustomCommand, attr: {title: (tooltip() ? tooltip : command)}, enable: $parent.controlViewModel.isOperational() && (!$parent.controlViewModel.isPrinting() || enabled_while_printing())" style="margin: 5px;"><i data-bind="css: icon"></i> <span data-bind="text: label"/></button></div>');
		}

		// Custom command list 
		self.moveCommandUp = function(data) {
			let currentIndex = self.settingsViewModel.settings.plugins.terminalcommandsextended.commands.indexOf(data);
			if (currentIndex > 0) {
				let queueArray = self.settingsViewModel.settings.plugins.terminalcommandsextended.commands();
				self.settingsViewModel.settings.plugins.terminalcommandsextended.commands.splice(currentIndex-1, 2, queueArray[currentIndex], queueArray[currentIndex - 1]);
			}
		}

		self.moveCommandDown = function(data) {
			let currentIndex = self.settingsViewModel.settings.plugins.terminalcommandsextended.commands.indexOf(data);
			if (currentIndex < self.settingsViewModel.settings.plugins.terminalcommandsextended.commands().length - 1) {
				let queueArray = self.settingsViewModel.settings.plugins.terminalcommandsextended.commands();
				self.settingsViewModel.settings.plugins.terminalcommandsextended.commands.splice(currentIndex, 2, queueArray[currentIndex + 1], queueArray[currentIndex]);
			}
		}

		self.addCommand = function() {
			self.settingsViewModel.settings.plugins.terminalcommandsextended.commands.push({icon: ko.observable(), label: ko.observable(), tooltip: ko.observable(), command: ko.observable(), enabled_while_printing: ko.observable(false)});
		}

		self.removeCommand = function(data) {
			self.settingsViewModel.settings.plugins.terminalcommandsextended.commands.remove(data);
		}

		self.runCustomCommand = function(data) {
			var gcode_cmds = data.command().split("\n");
			// clean extraneous code
			gcode_cmds = gcode_cmds.filter(function(array_val) {
					var x = Boolean(array_val);
					return x == true;
				});
			OctoPrint.control.sendGcode(gcode_cmds);
		}
	}

	OCTOPRINT_VIEWMODELS.push({
		construct: terminalcommandsextendedViewModel,
		dependencies: ["loginStateViewModel", "settingsViewModel","controlViewModel"],
		elements: ["#terminalcommandsextended","#settings_plugin_terminalcommandsextended"]
	});
});
