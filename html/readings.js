"use strict";

var meter_readings = meter_readings ||
{
	meter_types: [
			{ "name":"Show Graph", "id":"graph_id", "tab":"readings_graph", "func":function(){meter_readings.graph();} },
			{ "name":"New Reading", "id":"new_id", "tab":"new_tab", "func":function(){meter_readings.new_reading();} },
			{ "name":"Raw Data", "id":"raw_id", "tab":"raw_tab", "func":function(){meter_readings.raw_data();} },
	],
	meter_type_index: 0,
	meter_info: null,	

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

	new_reading: function()
	{
		console.log("new");
	},

	raw_data: function()
	{
		console.log("raw");
	},

	update: function()
	{
		this.graph();
		console.log("Update from resize");
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
					the_times.push(("0" + the_date.getFullYear()).slice(-4) + "/"	 + ("0" + the_date.getMonth()).slice(-2));
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
				data: { x:'x', xFormat:'%Y/%m', columns:the_columns },
				axis: { x:{ type:'timeseries', label: {show:false}, tick:{ format:'%Y/%m' } },
					y:{ tick: { format: d3.format(".1f") }}},
				legend: { hide:false } 
			});
		}
		var url = this.get_url();
		meters.get_data(url, display_graph.bind(this));
	},

	get_url: function()
	{
		return "/meters-api/get_readings.py";
	},
}
