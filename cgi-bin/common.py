#! /usr/bin/env python

import os
import sys
import cgi
import json
import re
import pymongo

def get_config(config_file = os.path.join(os.path.dirname(__file__), "..", "config/config.json")):
	if os.path.isfile(config_file):
		return json.load(open(config_file))
	else:
		return { "hostname": "localhost", "port": 27017, "username": None, "password": None, "db_name": "meters" }

class db:

	def __init__(self):
		config = get_config()
		versionstr = pymongo.version.split(".")
		self.version = float(versionstr[0] + "." + versionstr[1])
		client = pymongo.MongoClient(config["hostname"], config["port"])
		self.db_name = client[config["db_name"]]
		if "username" in config and "password" in config and config["username"] and config["password"]:
			self.db_name.authenticate(config["username"], config["password"])

class output:

	def __init__(self):
		self.data = {"status": False}
		self.indent = 4

	def finish(self, message, status):
		if 'GATEWAY_INTERFACE' in os.environ:
			print("Content-Type: text/plain")
			print("")
		if message:
			self.data["message"] = message
		self.data["status"] = status
		print(json.dumps(self.data, separators=(',',':'), indent=self.indent))

class post_data:

	def __init__(self, needed_fields):
		self.valid = False
		self.message = None
		self.data = {}
		raw_data = sys.stdin.read()
		if len(raw_data) == 0:
			self.message = "Please pass data as a json string"
			return
		else:
			try:
				self.data = json.loads(raw_data)
				for check in needed_fields:
					if check not in self.data:
						self.message = "Missing %s value" %(check)
						return
				self.valid = True
				return
			except:
				self.message = "json decode failed"
				return

class params:

	def __init__(self):
		self.valid = True
		self.message = None
		self.values = {}
		self.num_alpha_period = re.compile('^[a-zA-Z0-9\.\-\ ]+$')

	def get(self, fields):

		for field in iter(fields.keys()):
			if fields[field]["def"] != None:
				self.values[field] = fields[field]["def"]

		if 'GATEWAY_INTERFACE' in os.environ:
			form = cgi.FieldStorage(keep_blank_values=True)
			for field in iter(fields.keys()):
				if field in form:
					value = form[field].value
					if value and fields[field]["check"](value):
						self.values[field] = fields[field]["type"](value)
		else:
			for arg in sys.argv:
				if "=" in arg:
					name, value = arg.split("=",1)
					if name in fields.keys():
						if value and fields[name]["check"](value):
							self.values[name] = fields[name]["type"](value)

		for field in iter(fields.keys()):
			if not field in self.values:
				self.valid = False
				self.message = "Missing or invalid (" + field + ") parameter"
				break

	def check_alpha_num_period(self, thestr):
		if thestr:
			return bool(self.num_alpha_period.match(thestr))
		else:
			return False

if __name__ == '__main__':
	print(json.dumps(get_config(), separators=(',',':'), indent=4))
