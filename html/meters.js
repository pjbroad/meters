"use strict";

var meters = meters ||
{
	init_page: function()
	{
		var doit;
		meter_readings.init();
		window.onresize = function()
		{
			clearTimeout(doit);
			doit = setTimeout(meter_readings.resize.bind(meter_readings), 100);
		};
	},

	display_error_message: function(message)
	{
		var panel_h = document.getElementById("message_panel");
		if (message && message.length > 0)
			panel_h.innerHTML = message;
		else
			panel_h.innerHTML = "";
	},

	get_data: function(url, handler)
	{
		function callback()
		{
			if (this.readyState === this.DONE)
			{
				if (this.status === 200)
				{
					if (!this.responseText || this.responseText.length === 0)
					{
						meters.display_error_message("Empty response for get_data()");
						return;
					}
					var response = JSON.parse(this.responseText);
					if (typeof response.status === "undefined")
						meters.display_error_message("Invalid response for getdata: " + this.responseText);
					else if (!response.status)
					{
						if ((typeof response.message === "undefined") || (response.message.length<=0))
							meters.display_error_message("Unknown error");
						else
							meters.display_error_message(response.message);
					}
					else
						handler(response);
				}
				else
					meters.display_error_message("Unexpected http status code: " + this.status);
			}
		}

		var request = new XMLHttpRequest();
		request.onreadystatechange = callback;
		request.open("GET", url);
		try
		{
			request.send();
		}
		catch (err)
		{
			meters.display_error_message("Failed to get data: " + err.message);
		}
	},

	date2yyyymmdd: function(thedate)
	{
		return thedate.getFullYear() * 10000 + (thedate.getMonth() + 1) * 100 + thedate.getDate();
	},

	yyyymmdd2date: function(thedate)
	{
		var datenum = parseInt(thedate,10);
		if (isNaN(datenum) || !isFinite(datenum))
			return "";
		var year = parseInt(datenum / 10000, 10);
		var month = parseInt((datenum / 100) % 100, 10) - 1;
		var day = parseInt(datenum % 100, 10);
		var nd = new Date(year, month, day, 12, 0, 0, 0);
		return nd;
	},

	formated_date: function(thedate)
	{
		var days = [ "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat" ];
		var months = [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ];
		return days[thedate.getDay()] + " " + thedate.getDate() + " " + months[thedate.getMonth()] + ", " + thedate.getFullYear();
	},

	endofdef: null
}
