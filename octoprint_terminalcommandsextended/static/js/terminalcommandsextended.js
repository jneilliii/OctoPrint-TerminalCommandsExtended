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

		self.selected_command = ko.observable();

		self.onBeforeBinding = function(){
			$('#control-terminal-custom').appendTo('#term');
		};

		// Custom command list functions

		self.showEditor = function(data) {
			self.selected_command(data);
			$('#terminalCommandEditor').modal('show');
		};

		self.addCommand = function() {
			self.selected_command({icon: ko.observable('fas fa-gear'), 
									label: ko.observable(''), 
									tooltip: ko.observable(''), 
									command: ko.observable(''), 
									confirmation: ko.observable(false), 
									message: ko.observable(''), 
									input: ko.observableArray([]),
									enabled_while_printing: ko.observable(false)});
			self.settingsViewModel.settings.plugins.terminalcommandsextended.commands.push(self.selected_command());
			$('#terminalCommandEditor').modal('show');
		};

		self.copyCommand = function(data) {
			self.settingsViewModel.settings.plugins.terminalcommandsextended.commands.push({icon: ko.observable(data.icon()),
																							label: ko.observable(data.label()),
																							tooltip: ko.observable(data.tooltip()),
																							command: ko.observable(data.command()),
																							confirmation: ko.observable(data.confirmation()),
																							message: ko.observable(data.message()),
																							input: ko.observableArray(data.input()),
																							enabled_while_printing: ko.observable(data.enabled_while_printing())});
		};

		self.removeCommand = function(data) {
			self.settingsViewModel.settings.plugins.terminalcommandsextended.commands.remove(data);
		};

		self.addParameter = function(data) {
			data.input.push({label: ko.observable(''), parameter: ko.observable(''), value: ko.observable('')});
		}

		self.insertParameter = function(data) {
			var text = self.selected_command().command();
			text += '%(' + data.parameter() + ')s';
			self.selected_command().command(text);
			console.log(data);
		}

		self.removeParameter = function(data) {
			var text = self.selected_command().command();
			var search = '%\\(' + data.parameter() + '\\)s';
			var re = new RegExp(search,"gm");
			var new_text = text.replace(re, '');
			self.selected_command().command(new_text);
			self.selected_command().input.remove(data);
		}

		self.runCustomCommand = function(data) {
			var gcode_cmds = data.command().split("\n");
			var parameters = {};
			
			// clean extraneous code
			gcode_cmds = gcode_cmds.filter(function(array_val) {
					var x = Boolean(array_val);
					return x == true;
				});
			if (data.input().length > 0) {
				_.each(data.input(), function (input) {
					if (!input.hasOwnProperty("parameter") || !input.hasOwnProperty("value")) {
						return;
					}
					parameters[input.parameter()] = input.value();
				});
			}
			if (data.confirmation()) {
				showConfirmationDialog({
					message: data.message(),
					onproceed: function (e) {
						OctoPrint.control.sendGcodeWithParameters(gcode_cmds, parameters);
					}
				});
            } else {
				OctoPrint.control.sendGcodeWithParameters(gcode_cmds, parameters);
			}
		};
	}

	OCTOPRINT_VIEWMODELS.push({
		construct: terminalcommandsextendedViewModel,
		dependencies: ["loginStateViewModel", "settingsViewModel","controlViewModel"],
		elements: ["#control-terminal-custom","#terminalcommandsextended","#settings_plugin_terminalcommandsextended"]
	});
});
