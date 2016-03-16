#! /usr/bin/env python

import sys
import common
import time

if __name__ == '__main__':

	output = common.output()
	params = common.params()
	params.get( {	"start_date": { "check":str.isdigit, "type": int, "def": 0},
					"end_date": { "check":str.isdigit, "type": int, "def": sys.maxsize} } )

	if params.valid:
		db = common.db()
		start_date = params.values["start_date"]
		end_date = params.values["end_date"]
		query = { "date" : {"$gte": start_date, "$lte": end_date} }
		output.data['data'] = list(db.db_name.readings.find({"$query": query, "$orderby": { "epoch" : 1 } }, {"_id": False}))
		output.finish(None, True)
	else:
		output.finish(params.message, False)
