//	Copyright 2016 Paul Broadhead
//	Contact: pjbroad@twinmoons.org.uk
//
//	This file is part of meters.
//
//	Meters is free software: you can redistribute it and/or modify
//	it under the terms of the GNU General Public License as published by
//	the Free Software Foundation, either version 3 of the License, or
//	(at your option) any later version.
//
//	Meters is distributed in the hope that it will be useful,
//	but WITHOUT ANY WARRANTY; without even the implied warranty of
//	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//	GNU General Public License for more details.
//
//	You should have received a copy of the GNU General Public License
//	along with meters.  If not, see <http://www.gnu.org/licenses/>.

"use strict";

var meters = meters ||
{
	meter_tabs: [
			{ "name":"New", "tab_id":"new_id", "panel_id":"new_tab", "resize":false, "func":function(){meters.new_reading();} },
			{ "name":"Last", "tab_id":"last_id", "panel_id":"last_tab", "resize":false, "func":function(){meters.show_last();} },
			{ "name":"Graph", "tab_id":"graph_id", "panel_id":"graph_tab", "resize":true, "func":function(){meters.graph();}, "start":true },
			{ "name":"Raw", "tab_id":"raw_id", "panel_id":"raw_tab", "resize":false, "func":function(){meters.raw_data();} },
	],
	meter_info: null,
	end_date: new Date(),
	start_date: new Date(),
	expected_meters: [],
	last_epoch: null,

	init_page: function()
	{
		var self = this;
		var ul_h = document.getElementById("meters_tabs");

		this.start_date.setFullYear(this.start_date.getFullYear() - 1);

		for (var i=0; i<this.meter_tabs.length; i++)
		{
			var li = document.createElement("li");
			li.appendChild(document.createTextNode(this.meter_tabs[i].name));
			li.setAttribute("id", this.meter_tabs[i].tab_id);
			if (this.meter_tabs[i].start)
			{
				li.className = "selected";
				document.getElementById(this.meter_tabs[i].panel_id).style.display = "inline";
				this.meter_info = this.meter_tabs[i];
			}
			else
				document.getElementById(this.meter_tabs[i].panel_id).style.display= "none";
			li.onclick = function(e) { self.set_tab(e.target.id); };
 			ul_h.appendChild(li);
		}
		$( "#start_datepicker" ).datepicker({dateFormat: "D M d yy", changeMonth: true, changeYear: true});
		$( "#start_datepicker" ).datepicker( "setDate", this.start_date);
		$( "#end_datepicker" ).datepicker({dateFormat: "D M d yy", changeMonth: true, changeYear: true});
		$( "#end_datepicker" ).datepicker( "setDate", this.end_date);

		var input_h = document.getElementById("reading_values");
		for (var i=0; i<meters_config.types.length; i++)
		{
			var newdiv = document.createElement('div');
			newdiv.innerHTML = "<br>" + meters_config.types[i].prompt + "<br><input type=\"text\" name=\"" + meters_config.types[i].name + "\" value=\"\" required>";
			input_h.appendChild(newdiv);
			this.expected_meters.push(meters_config.types[i].name);
		}

		var doit;
		window.onresize = function()
		{
			clearTimeout(doit);
			doit = setTimeout(meters.resize.bind(meters), 100);
		};

		this.meter_info.func();
	},

	resize: function()
	{
		if (this.meter_info.resize)
			this.meter_info.func();
	},

	update_start_date: function()
	{
		this.start_date = $( "#start_datepicker" ).datepicker( "getDate" );
		error_message.clear();
		this.meter_info.func();
	},

	update_end_date: function()
	{
		this.end_date = $( "#end_datepicker" ).datepicker( "getDate" );
		error_message.clear();
		this.meter_info.func();
	},

	set_tab: function(tab_id)
	{
		error_message.clear();
		document.getElementById(this.meter_info.tab_id).className = "null";
		document.getElementById(this.meter_info.panel_id).style.display = "none";
		for (var i=0; i<this.meter_tabs.length; i++)
			if (tab_id === this.meter_tabs[i].tab_id)
			{
				this.meter_info = this.meter_tabs[i];
				document.getElementById(tab_id).className = "selected";
				document.getElementById(this.meter_info.panel_id).style.display = "inline";
				this.meter_info.func();
				break;
			}
	},

	controls_on: function(is_on)
	{
		if (is_on)
			document.getElementById("controls").style.display = "inline";
		else
			document.getElementById("controls").style.display = "none";
	},

	new_reading: function()
	{
		var now = new Date();
		this.controls_on(false);
		var inputs = document.forms["new_reading_form"].getElementsByTagName("input");
		for (var i=0; i<inputs.length; i++)
			if (inputs[i].type == "text")
				inputs[i].value = "";
		document.forms.new_reading_form.date.value = now.getFullYear() + "/" + ("0" + (now.getMonth()+1)).slice(-2) + "/" + ("0" + now.getDate()).slice(-2);
		document.forms.new_reading_form.time.value = ("0" + now.getHours()).slice(-2) + ":" + ("0" + now.getMinutes()).slice(-2);
	},

	add_new_reading: function()
	{
		function handler()
		{
			this.set_tab("last_id");
		}
		var the_date = 0;
		var the_epoch = 0;
		var values = {};

		var inputs = document.forms["new_reading_form"].getElementsByTagName("input");
		for (var i=0; i<inputs.length; i++)
			if (inputs[i].type == "text")
			{
				try
				{
					if (inputs[i].name == "date")
					{
						var bits = inputs[i].value.split("/");
						the_date = parseInt(bits[0],10) * 10000 + parseInt(bits[1],10) * 100 + parseInt(bits[2],10);
					}
					else if (inputs[i].name == "time")
					{
						bits = inputs[i].value.split(":");
						the_epoch = integer_date.yyyymmdd2date(the_date, parseInt(bits[0],10), parseInt(bits[1],10), 0).getTime() / 1000;
					}
					else if (this.expected_meters.indexOf(inputs[i].name) > -1)
					{
						values[inputs[i].name] = parseFloat(inputs[i].value);
						if (isNaN(values[inputs[i].name]))
						{
							error_message.display("Value error: " + inputs[i].name);
							return;
						}
					}
					else
					{
						error_message.display("Unexpected input: " + inputs[i].name);
						return;
					}
				}
				catch (err)
				{
					error_message.display(inputs[i].name + " format error: " + err.message);
					return;
				}
			}

		if (isNaN(the_date) || isNaN(the_epoch))
		{
			error_message.display("Date/Time value error");
			return;
		}

		var data = {"date":the_date, "epoch":the_epoch, "reading":values };
		request_common.post_data(meters_config.paths["api"] + "/add", handler.bind(this), data);
	},

	get_url_with_date: function()
	{
		var start = integer_date.date2yyyymmdd(this.start_date);
		var end = integer_date.date2yyyymmdd(this.end_date);
		return meters_config.paths["api"] + "/get" + "?start_date=" + start + "&end_date=" + end;
	},

	formated_date_time: function(the_date)
	{
		var days = [ "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat" ];
		var months = [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ];
		var the_time = ("0" + the_date.getHours()).slice(-2) + ":" + ("0" + the_date.getMinutes()).slice(-2);
		return days[the_date.getDay()] + " " + the_date.getDate() + " " + months[the_date.getMonth()] + " " + the_time + ", " + the_date.getFullYear();
	},

	delete_last: function()
	{
		function handler(reponse)
		{
			this.set_tab("last_id");
		}
		var enable_delete_h = document.getElementById("enable_delete_button");
		if (this.last_epoch && enable_delete_h.checked)
		{
			enable_delete_h.checked = false;
			request_common.get_data(meters_config.paths["api"] + "/delete?epoch=" + this.last_epoch, handler.bind(this));
			this.last_epoch = null;
		}
	},

	show_last: function()
	{
		function handler(response)
		{
			if (response.status)
			{
				var the_text = "</br>";
				the_text += meters.formated_date_time(new Date(response.data.epoch * 1000)) + "</br>";
				the_text += "Epoch: " + response.data.epoch + "</br>";
				the_text += "Date: " + response.data.date + "</br>";
				for (var key in response.data.reading)
					the_text += key + ": " + response.data.reading[key] + "</br>";
				document.getElementById("last_reading").innerHTML = the_text;
				this.last_epoch = response.data.epoch;
			}
		}
		this.controls_on(false);
		request_common.get_data(meters_config.paths["api"] + "/last", handler.bind(this));
	},

	raw_data: function()
	{
		function display_graph(response)
		{
			var data = response.data;
			var last_epoch = -1;
			var last_values = [];
			var the_text = "<table class='raw'>";
			the_text += "<tr class='tabheader'><th>&nbsp;</th><th colspan='" + meters_config.types.length + "'>Reading</th><th>&nbsp;</th>";
			the_text += "<th colspan='" + meters_config.types.length + "'>Average Units Per Day</th></tr>";
			the_text += "<tr class='tabheader'><th>Date</th>";
			for (var i=0; i<meters_config.types.length; i++)
				the_text += "<th>" + meters_config.types[i].shortprompt + "</th>";
			the_text += "<th>Elapse Days</th>";
			for (var i=0; i<meters_config.types.length; i++)
			{
				the_text += "<th>" + meters_config.types[i].shortprompt + " Used</th>";
				last_values.push(0);
			}
			the_text += "</tr>";
			for (var i=0; i<data.length; i++)
			{
				var epoch = data[i].epoch;
				var the_date = new Date(data[i].epoch * 1000);
				if (i % 2)
					the_text += "<tr class='tabeven'>";
				else
					the_text += "<tr class='tabodd'>";
				the_text += "<td>" + the_date.toDateString() + "</td>";
				var values = [];
				for (var j=0; j<meters_config.types.length; j++)
				{
					values.push(0);
					if (meters_config.types[j].name in data[i].reading)
						values[j] = data[i].reading[meters_config.types[j].name];
					the_text += "<td>" + values[j].toFixed(2) + "</td>";
				}
				var dayfraction = 0;
				if (last_epoch > 0)
				{
					dayfraction = (epoch-last_epoch)/(60*60*24.0)
					the_text += "<td>" + dayfraction.toFixed(0) + "</td>";
				}
				else
					the_text += "<td>&nbsp;</td>";
				for (var j=0; j<values.length; j++)
				{
					if (last_epoch > 0)
					{
						while (last_values[j] > values[j])
							values[j] += meters_config.types[j].overflow;
						the_text += "<td>" + ((values[j] - last_values[j])/dayfraction).toFixed(2) + "</td>";
					}
					else
						the_text += "<td>&nbsp;</td>";
				}
				last_epoch = epoch;
				for (var j=0; j<values.length; j++)
					last_values[j] = values[j];
				the_text += "</tr>\n";
			}
			the_text += "</table>\n";
			if (this.meter_info.name == "Raw")
				document.getElementById(this.meter_info.panel_id).innerHTML = the_text;
		}
		var url = this.get_url_with_date();
		this.controls_on(true);
		request_common.get_data(url, display_graph.bind(this));
	},

	graph: function()
	{
		function display_graph(response)
		{
			var page_width = Math.min(window.innerWidth, window.outerWidth);
			var page_height = Math.min(window.innerHeight, window.outerHeight);
			var graph_height = page_height - document.getElementById("non_graph").offsetHeight;
			var the_columns = [];
			var data = response.data;
			var last_epoch = -1;
			var last_values = [];
			var the_times = ['x'];
			var y_values = []

			for (var j=0; j<meters_config.types.length; j++)
			{
				last_values.push(0);
				y_values.push([meters_config.types[j].prompt]);
			}

			for (var i=0; i<data.length; i++)
			{
				var epoch = data[i].epoch;
				var values = [];
				for (var j=0; j<meters_config.types.length; j++)
				{
					values.push(0);
					if (meters_config.types[j].name in data[i].reading)
						values[j] = data[i].reading[meters_config.types[j].name];
				}
				if (last_epoch > 0)
				{
					var dayfraction = (epoch-last_epoch)/(60*60*24.0)
					var the_date = new Date(data[i].epoch * 1000);
					the_times.push(("0" + the_date.getFullYear()).slice(-4) + "/" + ("0" + (1+the_date.getMonth())).slice(-2) + "/" + ("0" + the_date.getDate()).slice(-2));

					for (var j=0; j<values.length; j++)
					{
						while (last_values[j] > values[j])
							values[j] += meters_config.types[j].overflow;
						y_values[j].push((values[j] - last_values[j])/dayfraction);
					}
				}
				last_epoch = epoch;
				for (var j=0; j<values.length; j++)
					last_values[j] = values[j];
			}

			the_columns.push(the_times);
			for (j=0; j<y_values.length; j++)
				the_columns.push(y_values[j]);

			var the_graph = c3.generate
			({
				bindto: '#readings_graph',
				size: { height:graph_height-20, width:page_width-40 },
				data: { x:'x', xFormat:'%Y/%m/%d', columns:the_columns },
				axis: { x:{ type:'timeseries', label: {show:false}, tick:{ format:'%Y/%m/%d' } },
					y:{ tick: { format: d3.format(".1f") }}},
				legend: { hide:false } 
			});
		}
		var url = this.get_url_with_date();
		this.controls_on(true);
		request_common.get_data(url, display_graph.bind(this));
	},
}
