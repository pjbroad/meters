#! /usr/bin/env python

#	Copyright 2016 Paul Broadhead
#	Contact: pjbroad@twinmoons.org.uk
#
#	This file is part of meters.
#
#	pi_sensors is free software: you can redistribute it and/or modify
#	it under the terms of the GNU General Public License as published by
#	the Free Software Foundation, either version 3 of the License, or
#	(at your option) any later version.
#
#	pi_sensors is distributed in the hope that it will be useful,
#	but WITHOUT ANY WARRANTY; without even the implied warranty of
#	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#	GNU General Public License for more details.
#
#	You should have received a copy of the GNU General Public License
#	along with meters.  If not, see <http://www.gnu.org/licenses/>.

import time
import flask
import common
import sys


db = common.db()
readings_collection = db.database.readings
app = flask.Flask(__name__)


@app.route("/get")
def get():
	start_date, end_date, message = common.get_dates(flask.request.args)
	if message:
		return common.format_error(message)
	day_query = { "date": {"$gte":start_date, "$lte":end_date } }
	return common.format_success(list(readings_collection.find({"$query": day_query, "$orderby": { "epoch" : 1 } }, {"_id": False})))


@app.route('/add', methods=['POST'])
def add():
	data = flask.request.get_json(force=True, silent=True, cache=False)
	needed = [ "reading", "date", "epoch" ]
	for key in needed:
		if not key in data:
			return common.format_error("Missing [%s] when adding record" %(key))
	readings_collection.insert(data)
	return common.format_success(None)


if __name__ == "__main__":
	the_debug = False
	the_host = '127.0.0.0'
	if len(sys.argv) > 2:
		if sys.argv[1] == "debug":
			the_debug = True
		if sys.argv[2] == "external":
			the_host = '0.0.0.0'
		app.run(debug=the_debug, host=the_host)
	else:
		app.run(debug=True, host='localhost')
