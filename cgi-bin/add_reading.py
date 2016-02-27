#! /usr/bin/env python2

import common

if __name__ == '__main__':

	output = common.output()
	data = common.post_data([ "reading", "date", "epoch" ])

	if data.valid:
		db = common.db()
		db.db_name.readings.insert(data.data)
		output.finish(None, True)
	else:
		output.finish(data.message, False)

