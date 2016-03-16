"use strict";

var meter_readings = meter_readings ||
{
	meter_types: [
			{ "name":"Input", "id":"new_id", "tab":"new_tab", "resize":false, "func":function(){meter_readings.new_reading();} },
			{ "name":"Graph", "id":"graph_id", "tab":"graph_tab", "resize":true, "func":function(){meter_readings.graph();} },
			{ "name":"Raw", "id":"raw_id", "tab":"raw_tab", "resize":false, "func":function(){meter_readings.raw_data();} },
	],
	meter_type_index: 0,
	meter_info: null,
	start_date: new Date("2009"),
	end_date: new Date(),

	init: function()
	{
		var self = this;
		var ul_h = document.getElementById("meters_tabs");
		for (var i=0; i<this.meter_types.length; i++)
		{
			var li = document.createElement("li");
			li.appendChild(document.createTextNode(this.meter_types[i].name));
			li.setAttribute("id", this.meter_types[i].id);
			if (i == 0)
			{
				li.className = "selected";
				document.getElementById(this.meter_types[i].tab).style.display = "inline";
				this.meter_info = this.meter_types[i];
			}
			else
				document.getElementById(this.meter_types[i].tab).style.display= "none";
			li.onclick = function(e) { self.set_tab(e.target.id); };
 			ul_h.appendChild(li);
		}
		$( "#start_datepicker" ).datepicker({dateFormat: "D M d yy", changeMonth: true, changeYear: true});
		$( "#start_datepicker" ).datepicker( "setDate", this.start_date);
		$( "#end_datepicker" ).datepicker({dateFormat: "D M d yy", changeMonth: true, changeYear: true});
		$( "#end_datepicker" ).datepicker( "setDate", this.end_date);
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
		meters.display_error_message(null);
		this.meter_info.func();
	},

	update_end_date: function()
	{
		this.end_date = $( "#end_datepicker" ).datepicker( "getDate" );
		meters.display_error_message(null);
		this.meter_info.func();
	},

	set_tab: function(tab_id)
	{
		document.getElementById(this.meter_info.id).className = "null";
		document.getElementById(this.meter_info.tab).style.display = "none";
		for (var i=0; i<this.meter_types.length; i++)
			if (tab_id === this.meter_types[i].id)
			{
				this.meter_info = this.meter_types[i];
				document.getElementById(tab_id).className = "selected";
				document.getElementById(this.meter_info.tab).style.display = "inline";
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
		document.forms.new_reading_form.date.value = now.getFullYear() + "/" + ("0" + (now.getMonth()+1)).slice(-2) + "/" + ("0" + now.getDate()).slice(-2);
		document.forms.new_reading_form.time.value = ("0" + now.getHours()).slice(-2) + ":" + ("0" + now.getMinutes()).slice(-2);
		document.forms.new_reading_form.gas.value = "";
		document.forms.new_reading_form.electricity.value = "";
	},

	add_new_reading: function()
	{
		console.log(document.forms.new_reading_form.date.value);
		console.log(document.forms.new_reading_form.time.value);
		console.log(document.forms.new_reading_form.gas.value);
		console.log(document.forms.new_reading_form.electricity.value);
		this.new_reading();
	},

	raw_data: function()
	{
		function display_graph(response)
		{
			var data = response.data;
			var last_epoch = -1;
			var last_gas = -1;
			var last_electricity = -1;
			var the_text = "<table class='raw'>";
			the_text += "<tr class='tabheader'><th>&nbsp;</th><th colspan='2'>Reading</th><th>&nbsp;</th><th colspan='2'>Average Units Per Day</th></tr>";
			the_text += "<tr class='tabheader'><th>Date</th><th>Gas</th><th>Elec</th><th>Elapse Days</th><th>Gas Used</th><th>Elec Used</th></tr>";
			for (var i=0; i<data.length; i++)
			{
				var gas = data[i].reading.gas;
				var electricity = data[i].reading.electricity;
				var epoch = data[i].epoch;
				var the_date = new Date(data[i].epoch * 1000);
				if (i % 2)
					the_text += "<tr class='tabeven'>";
				else
					the_text += "<tr class='tabodd'>";
				the_text += "<td>" + meters.formated_date(the_date) + "</td>";
				the_text += "<td>" + gas.toFixed(2) + "</td>";
				the_text += "<td>" + electricity.toFixed(2) + "</td>";
				if (last_epoch > 0)
				{
					var dayfraction = (epoch-last_epoch)/(60*60*24.0)
					the_text += "<td>" + dayfraction.toFixed(0) + "</td>";
					while (last_gas > gas)
						gas += 10000;
					while (last_electricity > electricity)
						electricity += 100000;
					the_text += "<td>" + ((gas - last_gas)/dayfraction).toFixed(2) + "</td>";
					the_text += "<td>" + ((electricity - last_electricity)/dayfraction).toFixed(2) + "</td>";
				}
				else
					the_text += "<td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>";
				last_gas = gas;
				last_electricity = electricity;
				last_epoch = epoch;
				the_text += "</tr>\n";
			}
			the_text += "</table>\n";
			document.getElementById(this.meter_info.tab).innerHTML = the_text;
		}
		var url = this.get_url();
		this.controls_on(true);
		meters.get_data(url, display_graph.bind(this));
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
			var last_gas = -1;
			var last_electricity = -1;
			var the_times = ['x'];
			var the_gas = ['gas'];
			var the_electricity = ['electricity'];
			for (var i=0; i<data.length; i++)
			{
				var gas = data[i].reading.gas;
				var electricity = data[i].reading.electricity;
				var epoch = data[i].epoch;
				if (last_epoch > 0)
				{
					var dayfraction = (epoch-last_epoch)/(60*60*24.0)
					var the_date = new Date(data[i].epoch * 1000);
					the_times.push(("0" + the_date.getFullYear()).slice(-4) + "/" + ("0" + (1+the_date.getMonth())).slice(-2) + "/" + ("0" + the_date.getDate()).slice(-2));
					while (last_gas > gas)
						gas += 10000;
					while (last_electricity > electricity)
						electricity += 100000;
					the_gas.push((gas - last_gas)/dayfraction);
					the_electricity.push((electricity - last_electricity)/dayfraction);
				}
				last_gas = gas;
				last_electricity = electricity;
				last_epoch = epoch;
			}
			the_columns.push(the_times);
			the_columns.push(the_gas);
			the_columns.push(the_electricity);

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
		var url = this.get_url();
		this.controls_on(true);
		meters.get_data(url, display_graph.bind(this));
	},

	get_url: function()
	{
		var start = meters.date2yyyymmdd(this.start_date);
		var end = meters.date2yyyymmdd(this.end_date);
		return "/meters-api/get_readings.py" + "?start_date=" + start + "&end_date=" + end;
	},
}
