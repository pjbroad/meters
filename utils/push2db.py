#! /usr/bin/env python

import sys
import time
import pymongo
import json
import subprocess

for line in open(sys.argv[1]).readlines():
	if not line.startswith("#"):
		fields = line.strip().split()
		year = int(fields[0])
		month = int(fields[1])
		day = int(fields[2])
		hour = int(fields[3])
		minutes = int(fields[4])
		gas = float(fields[5])
		electricity = float(fields[6])
		thedate = day + 100*month + 10000*year
		epoch = time.mktime((year, month, day, hour, minutes, 0, -1, -1, -1))
		record = { "epoch": epoch, "date":thedate, "reading": {"gas":gas, "electricity":electricity} }
		#print(line.strip())
		#print(time.asctime(time.localtime(epoch)), "::::", year, month, day, hour, minutes, gas, electricity)
		#print("")
		print("../cgi-bin/add_reading.py << EOT")
		print(json.dumps(record, separators=(',',':')))
		print("EOT")


