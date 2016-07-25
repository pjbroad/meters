"use strict";

var common = common ||
{
	display_error_message: function(message)
	{
		var panel_h = document.getElementById("message_panel");
		if (message && message.length > 0)
			panel_h.innerHTML = message;
		else
			panel_h.innerHTML = "";
	},

	get_post_callback: function(handler)
	{
		if (this.readyState === this.DONE)
		{
			if (this.status === 200)
			{
				if (!this.responseText || this.responseText.length === 0)
				{
					common.display_error_message("Empty response for get_data()");
					return;
				}
				var response = JSON.parse(this.responseText);
				if (typeof response.status === "undefined")
					common.display_error_message("Invalid response for getdata: " + this.responseText);
				else if (!response.status)
				{
					if ((typeof response.message === "undefined") || (response.message.length<=0))
						common.display_error_message("Unknown error");
					else
						common.display_error_message(response.message);
				}
				else
					handler(response);
			}
			else
				common.display_error_message("Unexpected http status code: " + this.status);
		}
	},

	get_data: function(url, handler)
	{
		var request = new XMLHttpRequest();
		request.onreadystatechange = function() { common.get_post_callback.bind(this)(handler); };
		request.open("GET", url);
		try
		{
			request.send();
		}
		catch (err)
		{
			common.display_error_message("Failed to get data: " + err.message);
		}
	},

	post_data: function(url, handler, data)
	{
		var request = new XMLHttpRequest();
		request.onreadystatechange = function() { common.get_post_callback.bind(this)(handler); };
		request.open("POST", url);
		try
		{
			request.send(JSON.stringify(data));
		}
		catch (err)
		{
			common.display_error_message("Failed to get data: " + err.message);
		}
	},

	date2yyyymmdd: function(thedate)
	{
		return thedate.getFullYear() * 10000 + (thedate.getMonth() + 1) * 100 + thedate.getDate();
	},

	yyyymmdd2date: function(thedate, hours, minutes, seconds)
	{
		hours = (typeof hours === 'undefined') ? 12 : hours;
		minutes = (typeof minutes === 'undefined') ? 0 : minutes;
		seconds = (typeof seconds === 'undefined') ? 0 : seconds;
		var datenum = parseInt(thedate,10);
		if (isNaN(datenum) || !isFinite(datenum))
			return "";
		var year = parseInt(datenum / 10000, 10);
		var month = parseInt((datenum / 100) % 100, 10) - 1;
		var day = parseInt(datenum % 100, 10);
		var nd = new Date(year, month, day, hours, minutes, seconds, 0);
		return nd;
	},

	endofdef: null
}
