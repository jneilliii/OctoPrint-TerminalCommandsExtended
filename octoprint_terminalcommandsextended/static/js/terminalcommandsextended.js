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

		self.controls = ko.observableArray([]);
		self.feedbackControlLookup = {};

		self.displayMode = function (customTerminalControl) {
			if (customTerminalControl.hasOwnProperty("children")) {
				if (customTerminalControl.name) {
					return "customTerminalControls_containerTemplate_collapsable";
				} else {
					return "customTerminalControls_containerTemplate_nameless";
				}
			} else {
				return "customTerminalControls_controlTemplate";
			}
		};

		self.rowCss = function (customTerminalControl) {
			var span = "span2";
			var offset = "";
			if (customTerminalControl.hasOwnProperty("width")) {
				span = "span" + customTerminalControl.width;
			}
			if (customTerminalControl.hasOwnProperty("offset")) {
				offset = "offset" + customTerminalControl.offset;
			}
			return span + " " + offset;
		};

		self.isCustomEnabled = function (data) {
			if (data.hasOwnProperty("enabled")) {
				return data.enabled(data);
			} else {
				return self.isOperational() && self.loginState.isUser();
			}
		};

		self.clickCustom = function (data) {
			var callback;
			if (data.hasOwnProperty("javascript")) {
				callback = data.javascript;
			} else {
				callback = self.sendCustomCommand;
			}

			if (data.confirm) {
				showConfirmationDialog({
					message: data.confirm,
					onproceed: function (e) {
						callback(data);
					}
				});
			} else {
				callback(data);
			}
		};

		self.sendCustomCommand = function (command) {
			if (!command) return;

			var parameters = {};
			if (command.hasOwnProperty("input")) {
				_.each(command.input, function (input) {
					if (!input.hasOwnProperty("parameter") || !input.hasOwnProperty("value")) {
						return;
					}

					parameters[input.parameter] = input.value();
				});
			}

			if (command.hasOwnProperty("command") || command.hasOwnProperty("commands")) {
				var commands = command.commands || [command.command];
				OctoPrint.control.sendGcodeWithParameters(commands, parameters);
			} else if (command.hasOwnProperty("script")) {
				var script = command.script;
				var context = command.context || {};
				OctoPrint.control.sendGcodeScriptWithParameters(script, context, parameters);
			}
		};

		self.onBeforeBinding = function(){
			$('#term').append('<div id="terminalcommandsextended" class="row-fluid" data-bind="visible: loginStateViewModel.isUser() && settingsViewModel.settings.plugins.terminalcommandsextended.commands().length > 0,sortable: { data: settingsViewModel.settings.plugins.terminalcommandsextended.commands, options: { cancel: \'.unsortable\', handle: \'.sortable_handle\'} }" style="margin-top: 10px;"><button class="btn unsortable" data-bind="click: $parent.runCustomCommand, attr: {title: (tooltip() ? tooltip : command)}, enable: $parent.controlViewModel.isOperational() && (!$parent.controlViewModel.isPrinting() || enabled_while_printing())" style="margin: 5px;"><i data-bind="css: icon"></i> <span data-bind="text: label"/></button></div>');
			self.controls(self._processControls(self.settingsViewModel.settings.plugins.terminalcommandsextended.commands()))
		};

		self._processControls = function (controls) {
			for (var i = 0; i < controls.length; i++) {
				controls[i] = self._processControl(controls[i]);
			}
			return controls;
		};

		self._processControl = function (control) {
			if (control.hasOwnProperty("processed") && control.processed) {
				return control;
			}

			if (control.hasOwnProperty("template") && control.hasOwnProperty("key") && control.hasOwnProperty("template_key") && !control.hasOwnProperty("output")) {
				control.output = ko.observable(control.default || "");
				if (!self.feedbackControlLookup.hasOwnProperty(control.key)) {
					self.feedbackControlLookup[control.key] = {};
				}
				self.feedbackControlLookup[control.key][control.template_key] = control.output;
			}

			if (control.hasOwnProperty("children")) {
				control.children = ko.observableArray(self._processControls(control.children));
				if (!control.hasOwnProperty("layout") || !(control.layout == "vertical" || control.layout == "horizontal" || control.layout == "horizontal_grid")) {
					control.layout = "vertical";
				}

				if (!control.hasOwnProperty("collapsed")) {
					control.collapsed = false;
				}
			}

			if (control.hasOwnProperty("input")) {
				var attributeToInt = function(obj, key, def) {
					if (obj.hasOwnProperty(key)) {
						var val = obj[key];
						if (_.isNumber(val)) {
							return val;
						}

						var parsedVal = parseInt(val);
						if (!isNaN(parsedVal)) {
							return parsedVal;
						}
					}
					return def;
				};

				_.each(control.input, function (element) {
					if (element.hasOwnProperty("slider") && _.isObject(element.slider)) {
						element.slider["min"] = attributeToInt(element.slider, "min", 0);
						element.slider["max"] = attributeToInt(element.slider, "max", 255);

						// try defaultValue, default to min
						var defaultValue = attributeToInt(element, "default", element.slider.min);

						// if default value is not within range of min and max, correct that
						if (!_.inRange(defaultValue, element.slider.min, element.slider.max)) {
							// use bound closer to configured default value
							defaultValue = defaultValue < element.slider.min ? element.slider.min : element.slider.max;
						}

						element.value = ko.observable(defaultValue);
					} else {
						element.slider = false;
						element.value = ko.observable((element.hasOwnProperty("default")) ? element["default"] : undefined);
					}
				});
			}

			if (control.hasOwnProperty("javascript")) {
				var js = control.javascript;

				// if js is a function everything's fine already, but if it's a string we need to eval that first
				if (!_.isFunction(js)) {
					control.javascript = function (data) {
						eval(js);
					};
				}
			}

			if (control.hasOwnProperty("enabled")) {
				var enabled = control.enabled;

				// if js is a function everything's fine already, but if it's a string we need to eval that first
				if (!_.isFunction(enabled)) {
					control.enabled = function (data) {
						return eval(enabled);
					}
				}
			}

			if (!control.hasOwnProperty("additionalClasses")) {
				control.additionalClasses = "";
			}

			control.processed = true;
			return control;
		};

		self.onEventRegisteredMessageReceived = function(payload) {
			if (payload.key in self.feedbackControlLookup) {
				var outputs = self.feedbackControlLookup[payload.key];
				_.each(payload.outputs, function(value, key) {
					if (outputs.hasOwnProperty(key)) {
						outputs[key](value);
					}
				});
			}
		};

		// Custom command list 
		self.moveCommandUp = function(data) {
			let currentIndex = self.settingsViewModel.settings.plugins.terminalcommandsextended.commands.indexOf(data);
			if (currentIndex > 0) {
				let queueArray = self.settingsViewModel.settings.plugins.terminalcommandsextended.commands();
				self.settingsViewModel.settings.plugins.terminalcommandsextended.commands.splice(currentIndex-1, 2, queueArray[currentIndex], queueArray[currentIndex - 1]);
			}
		};

		self.moveCommandDown = function(data) {
			let currentIndex = self.settingsViewModel.settings.plugins.terminalcommandsextended.commands.indexOf(data);
			if (currentIndex < self.settingsViewModel.settings.plugins.terminalcommandsextended.commands().length - 1) {
				let queueArray = self.settingsViewModel.settings.plugins.terminalcommandsextended.commands();
				self.settingsViewModel.settings.plugins.terminalcommandsextended.commands.splice(currentIndex, 2, queueArray[currentIndex + 1], queueArray[currentIndex]);
			}
		};

		self.addCommand = function() {
			self.settingsViewModel.settings.plugins.terminalcommandsextended.commands.push({icon: ko.observable(), label: ko.observable(), tooltip: ko.observable(), command: ko.observable(), enabled_while_printing: ko.observable(false)});
		};

		self.removeCommand = function(data) {
			self.settingsViewModel.settings.plugins.terminalcommandsextended.commands.remove(data);
		};

		self.runCustomCommand = function(data) {
			var gcode_cmds = data.command().split("\n");
			// clean extraneous code
			gcode_cmds = gcode_cmds.filter(function(array_val) {
					var x = Boolean(array_val);
					return x == true;
				});
			OctoPrint.control.sendGcode(gcode_cmds);
		};
	}

	OCTOPRINT_VIEWMODELS.push({
		construct: terminalcommandsextendedViewModel,
		dependencies: ["loginStateViewModel", "settingsViewModel","controlViewModel"],
		elements: ["#terminalcommandsextended","#settings_plugin_terminalcommandsextended"]
	});
});
