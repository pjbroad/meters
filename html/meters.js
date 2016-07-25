"use strict";

var meters = meters ||
{
	meter_types: [
			{ "name":"New", "tab_id":"new_id", "panel_id":"new_tab", "resize":false, "func":function(){meters.new_reading();} },
			{ "name":"Graph", "tab_id":"graph_id", "panel_id":"graph_tab", "resize":true, "func":function(){meters.graph();}, "start":true },
			{ "name":"Raw", "tab_id":"raw_id", "panel_id":"raw_tab", "resize":false, "func":function(){meters.raw_data();} },
	],
	meter_info: null,
	end_date: new Date(),
	start_date: new Date(),

	init_page: function()
	{
		var self = this;
		var ul_h = document.getElementById("meters_tabs");

		this.start_date.setFullYear(this.start_date.getFullYear() - 1);

		for (var i=0; i<this.meter_types.length; i++)
		{
			var li = document.createElement("li");
			li.appendChild(document.createTextNode(this.meter_types[i].name));
			li.setAttribute("id", this.meter_types[i].tab_id);
			if (this.meter_types[i].start)
			{
				li.className = "selected";
				document.getElementById(this.meter_types[i].panel_id).style.display = "inline";
				this.meter_info = this.meter_types[i];
			}
			else
				document.getElementById(this.meter_types[i].panel_id).style.display= "none";
			li.onclick = function(e) { self.set_tab(e.target.id); };
 			ul_h.appendChild(li);
		}
		$( "#start_datepicker" ).datepicker({dateFormat: "D M d yy", changeMonth: true, changeYear: true});
		$( "#start_datepicker" ).datepicker( "setDate", this.start_date);
		$( "#end_datepicker" ).datepicker({dateFormat: "D M d yy", changeMonth: true, changeYear: true});
		$( "#end_datepicker" ).datepicker( "setDate", this.end_date);

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
		common.display_error_message(null);
		this.meter_info.func();
	},

	update_end_date: function()
	{
		this.end_date = $( "#end_datepicker" ).datepicker( "getDate" );
		common.display_error_message(null);
		this.meter_info.func();
	},

	set_tab: function(tab_id)
	{
		common.display_error_message(null);
		document.getElementById(this.meter_info.tab_id).className = "null";
		document.getElementById(this.meter_info.panel_id).style.display = "none";
		for (var i=0; i<this.meter_types.length; i++)
			if (tab_id === this.meter_types[i].tab_id)
			{
				this.meter_info = this.meter_types[i];
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
		document.forms.new_reading_form.date.value = now.getFullYear() + "/" + ("0" + (now.getMonth()+1)).slice(-2) + "/" + ("0" + now.getDate()).slice(-2);
		document.forms.new_reading_form.time.value = ("0" + now.getHours()).slice(-2) + ":" + ("0" + now.getMinutes()).slice(-2);
		document.forms.new_reading_form.gas.value = "";
		document.forms.new_reading_form.electricity.value = "";
	},

	add_new_reading: function()
	{
		function handler()
		{
			this.set_tab(this.meter_info.tab_id);
		}
		var the_date = 0;
		var the_epoch = 0;
		var gas = 0.0;
		var electricity = 0.0;

		try
		{
			var bits = document.forms.new_reading_form.date.value.split("/");
			the_date = parseInt(bits[0],10) * 10000 + parseInt(bits[1],10) * 100 + parseInt(bits[2],10);
			bits = document.forms.new_reading_form.time.value.split(":");
			the_epoch = common.yyyymmdd2date(the_date, parseInt(bits[0],10), parseInt(bits[1],10), 0).getTime() / 1000;
		}
		catch (err)
		{
			common.display_error_message("Date/Time format error: " + err.message);
			return;
		}

		try
		{
			gas = parseFloat(document.forms.new_reading_form.gas.value);
			electricity = parseFloat(document.forms.new_reading_form.electricity.value);
		}
		catch (err)
		{
			common.display_error_message("Gas/Electricity format error: " + err.message);
			return
		}

		if (isNaN(the_date) || isNaN(the_epoch) || isNaN(gas) || isNaN(electricity))
		{
			common.display_error_message("Value error");
			return
		}

		var data = {"date":the_date, "epoch":the_epoch, "reading":{ "gas":gas, "electricity":electricity} };
		common.post_data("/meters-api/add_reading.py", handler.bind(this), data);
	},

	get_url: function()
	{
		var start = common.date2yyyymmdd(this.start_date);
		var end = common.date2yyyymmdd(this.end_date);
		return "/meters-api/get_readings.py" + "?start_date=" + start + "&end_date=" + end;
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
				the_text += "<td>" + the_date.toDateString() + "</td>";
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
			document.getElementById(this.meter_info.panel_id).innerHTML = the_text;
		}
		var url = this.get_url();
		this.controls_on(true);
		common.get_data(url, display_graph.bind(this));
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
		common.get_data(url, display_graph.bind(this));
	},
}
