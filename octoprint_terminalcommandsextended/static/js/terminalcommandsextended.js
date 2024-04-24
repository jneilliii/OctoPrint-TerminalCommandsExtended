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
		self.terminalViewModel = parameters[3];

		self.selected_command = ko.observable();

		self.onBeforeBinding = function(){
			$('#control-terminal-custom').appendTo('#term');
			self.multidimensional_array = ko.computed(function(){
				let matrix = [[]], column_counter = 0, row_counter = 0;
				ko.utils.arrayForEach(self.settingsViewModel.settings.plugins.terminalcommandsextended.commands(), function(item) {
					column_counter += (parseInt(item.width()) + parseInt(item.offset()));
					if (column_counter > 12) {
						row_counter++;
						column_counter = parseInt(item.width()) + parseInt(item.offset());
						matrix[row_counter] = [];
					}
					matrix[row_counter].push(item);
				});
				return matrix;
			});
		};

		self.onAfterBinding = function() {
			if(self.settingsViewModel.settings.plugins.terminalcommandsextended.move_filters()){
				if(VERSION.split(".")[0] == 1 && VERSION.split(".")[1] < 10){
					$('#terminal-filterpanel').parent().prependTo('#term > div:nth-child(3) > div:nth-child(2)');
				} else if(VERSION.split(".")[0] == 1 && VERSION.split(".")[1] >= 10){
					$('#terminal-filterpanel').parent().prependTo('#term > div:nth-child(3) > div.hide');
				} else {
					console.log("unknown version compatibility for moving filters into advanced panel");
				}
			}
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
									width: ko.observable(3),
									offset: ko.observable(0),
									command: ko.observable(''), 
									confirmation: ko.observable(false), 
									message: ko.observable(''), 
									input: ko.observableArray([]),
									enabled_while_printing: ko.observable(false)});
			self.settingsViewModel.settings.plugins.terminalcommandsextended.commands.push(self.selected_command());
			$('#terminalCommandEditor').modal('show');
		};

		self.addBreak = function() {
			self.selected_command({icon: ko.observable('fas fa-gear'),
									label: ko.observable('<BR>'),
									tooltip: ko.observable(''),
									width: ko.observable(12),
									offset: ko.observable(0),
									command: ko.observable(''),
									confirmation: ko.observable(false),
									message: ko.observable(''),
									input: ko.observableArray([]),
									enabled_while_printing: ko.observable(false)});
			self.settingsViewModel.settings.plugins.terminalcommandsextended.commands.push(self.selected_command());
		};
		self.copyCommand = function(data) {
			self.settingsViewModel.settings.plugins.terminalcommandsextended.commands.push({icon: ko.observable(data.icon()),
																							label: ko.observable(data.label()),
																							tooltip: ko.observable(data.tooltip()),
																							command: ko.observable(data.command()),
																							width: ko.observable(data.width()),
																							offset: ko.observable(data.offset()),
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
		dependencies: ["loginStateViewModel", "settingsViewModel","controlViewModel","terminalViewModel"],
		elements: ["#control-terminal-custom","#terminalcommandsextended","#settings_plugin_terminalcommandsextended"]
	});
});
