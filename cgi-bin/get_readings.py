#! /usr/bin/env python2

import common
import time

if __name__ == '__main__':

	output = common.output()
	db = common.db()
	output.data['data'] = list(db.db_name.readings.find({"$query": {}, "$orderby": { "epoch" : 1 } }, {"_id": False}))
	output.finish(None, True)
